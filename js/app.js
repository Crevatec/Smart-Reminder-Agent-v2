/* js/app.js — Smart Reminder Agent v2 — Application Controller */

const app = {
  _currentView: 'dashboard',
  _currentFilter: 'all',
  _calWeekOffset: 0,
  _searchQuery: '',
  _csvImportData: null,
  _pendingSendId: null,

  // ─── INIT ─────────────────────────────────────────────────────

  init() {
    db.load();
    this.navigate('dashboard');
    this._bindNavLinks();
    this._setDefaultDate();

    // Check URL hash
    const hash = location.hash.replace('#', '');
    if (hash && ['dashboard','reminders','calendar','recurring','channels','templates','logs','settings'].includes(hash)) {
      this.navigate(hash);
    }

    // Keyboard shortcut: Cmd/Ctrl+K → focus search
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('globalSearch').focus();
      }
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeDryRunModal();
        this.closeImportModal();
      }
    });

    // Sync status pulse
    this._updateSyncStatus();
  },

  // ─── NAVIGATION ───────────────────────────────────────────────

  navigate(view) {
    this._currentView = view;
    this._currentFilter = 'all';
    this._searchQuery = '';
    location.hash = view;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });

    this._renderView();
  },

  _bindNavLinks() {
    document.querySelectorAll('.nav-item[data-view]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        this.navigate(el.dataset.view);
      });
    });
  },

  _renderView() {
    const el = document.getElementById('mainContent');
    switch (this._currentView) {
      case 'dashboard':  el.innerHTML = Views.dashboard(); break;
      case 'reminders':  el.innerHTML = Views.reminders(this._currentFilter, this._searchQuery); break;
      case 'calendar':   el.innerHTML = Views.calendar(this._calWeekOffset); break;
      case 'recurring':  el.innerHTML = Views.recurring(); break;
      case 'channels':   el.innerHTML = Views.channels(); break;
      case 'templates':  el.innerHTML = Views.templates(); break;
      case 'logs':       el.innerHTML = Views.logs(); break;
      case 'settings':   el.innerHTML = Views.settings(); break;
      default:           el.innerHTML = Views.dashboard();
    }
    el.scrollTop = 0;
  },

  // ─── FILTERS & SEARCH ─────────────────────────────────────────

  setFilter(filter) {
    this._currentFilter = filter;
    if (this._currentView !== 'reminders') this._currentView = 'reminders';
    this._renderView();
  },

  search(query) {
    this._searchQuery = query;
    if (this._currentView !== 'reminders') {
      this._currentView = 'reminders';
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.view === 'reminders');
      });
    }
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this._renderView(), 200);
  },

  // ─── CALENDAR ─────────────────────────────────────────────────

  calWeek(offset) {
    this._calWeekOffset = offset;
    this._renderView();
  },

  // ─── MODAL ────────────────────────────────────────────────────

  openModal(mode = 'add', id = null) {
    const modal = document.getElementById('reminderModal');
    const title = document.getElementById('modalTitle');

    // Reset form
    document.getElementById('editId').value = '';
    document.getElementById('rTitle').value = '';
    document.getElementById('rDescription').value = '';
    document.getElementById('rDate').value = getTodayStr();
    document.getElementById('rTime').value = '09:00';
    document.getElementById('rCategory').value = 'Work';
    document.getElementById('rChannel').value = db.settings.defaultChannel || 'email';
    document.getElementById('rPriority').value = 'normal';
    document.getElementById('rTags').value = '';
    document.getElementById('rRecurring').value = 'none';
    document.getElementById('rEmail').value = '';
    document.getElementById('customDaysContainer').classList.add('hidden');
    document.querySelectorAll('.custom-day').forEach(c => c.checked = false);

    if (mode === 'edit' && id) {
      const r = db.getReminder(id);
      if (!r) return;
      title.textContent = 'Edit Reminder';
      document.getElementById('editId').value = r.id;
      document.getElementById('rTitle').value = r.title;
      document.getElementById('rDescription').value = r.description || '';
      document.getElementById('rDate').value = r.date;
      document.getElementById('rTime').value = r.time;
      document.getElementById('rCategory').value = r.category;
      document.getElementById('rChannel').value = r.channel;
      document.getElementById('rPriority').value = r.priority;
      document.getElementById('rTags').value = (r.tags || []).join(', ');
      document.getElementById('rRecurring').value = r.recurring || 'none';
      document.getElementById('rEmail').value = r.email || '';
      if (r.recurring === 'custom') {
        document.getElementById('customDaysContainer').classList.remove('hidden');
        document.querySelectorAll('.custom-day').forEach(c => {
          c.checked = (r.customDays || []).includes(c.value);
        });
      }
    } else {
      title.textContent = 'New Reminder';
    }

    // Recurring toggle
    document.getElementById('rRecurring').onchange = function() {
      document.getElementById('customDaysContainer').classList.toggle('hidden', this.value !== 'custom');
    };

    modal.classList.remove('hidden');
    document.getElementById('rTitle').focus();
  },

  closeModal() {
    document.getElementById('reminderModal').classList.add('hidden');
  },

  // ─── SAVE REMINDER ────────────────────────────────────────────

  _collectForm() {
    const title = document.getElementById('rTitle').value.trim();
    if (!title) { showToast('Please enter a title.', 'error'); return null; }

    const recurring = document.getElementById('rRecurring').value;
    const customDays = recurring === 'custom'
      ? [...document.querySelectorAll('.custom-day:checked')].map(c => c.value)
      : [];

    return {
      title,
      description: document.getElementById('rDescription').value.trim(),
      date: document.getElementById('rDate').value || getTodayStr(),
      time: document.getElementById('rTime').value || '09:00',
      category: document.getElementById('rCategory').value,
      channel: document.getElementById('rChannel').value,
      priority: document.getElementById('rPriority').value,
      tags: document.getElementById('rTags').value.split(',').map(s => s.trim()).filter(Boolean),
      recurring,
      customDays,
      email: document.getElementById('rEmail').value.trim()
    };
  },

  saveReminder() {
    const data = this._collectForm();
    if (!data) return;

    const editId = document.getElementById('editId').value;
    if (editId) {
      db.updateReminder(editId, data);
      showToast('✅ Reminder updated.', 'success');
    } else {
      db.addReminder(data);
      showToast('✅ Reminder saved.', 'success');
    }

    this.closeModal();
    this._renderView();
  },

  // ─── DELETE ───────────────────────────────────────────────────

  deleteReminder(id) {
    const r = db.getReminder(id);
    if (!r) return;
    if (!confirm(`Delete "${r.title}"?`)) return;
    db.deleteReminder(id);
    showToast('🗑 Reminder deleted.', 'warning');
    this._renderView();
  },

  // ─── DRY RUN ──────────────────────────────────────────────────

  toggleDryRun(val) {
    db.updateSettings({ dryRun: val });
    document.getElementById('dryRunBadge').classList.toggle('hidden', !val);
    document.getElementById('dryRunToggle').checked = val;
    showToast(val ? '👁 Dry run mode ON — no messages will be sent.' : '✅ Dry run OFF — live mode active.', val ? 'warning' : 'success');
  },

  async previewReminder() {
    const data = this._collectForm();
    if (!data) return;
    const result = await channels.send(data, true);
    this._showDryRun(result, data);
  },

  async previewSingle(id) {
    const r = db.getReminder(id);
    if (!r) return;
    const result = await channels.send(r, true);
    this._showDryRun(result, r);
    db.addLog({ type: 'dry', title: `Dry run preview: ${r.title}`, channel: channelLabel(r.channel), icon: 'eye' });
  },

  _showDryRun(result, reminder) {
    this._pendingSendId = reminder.id || null;
    const deliveries = result.deliveries || [];

    const content = document.getElementById('dryRunContent');
    content.innerHTML = `
    <div class="dry-run-preview">
      <div class="dry-run-preview-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Preview — No messages will be sent
      </div>
      <div class="dry-run-preview-body">
        <div class="preview-field"><span class="preview-field-label">Title</span><span class="preview-field-value">${escapeHtml(reminder.title)}</span></div>
        <div class="preview-field"><span class="preview-field-label">Date & Time</span><span class="preview-field-value">${formatDateTime(reminder.date, reminder.time)}</span></div>
        <div class="preview-field"><span class="preview-field-label">Category</span><span class="preview-field-value">${escapeHtml(reminder.category)}</span></div>
        <div class="preview-field"><span class="preview-field-label">Priority</span><span class="preview-field-value" style="text-transform:capitalize">${escapeHtml(reminder.priority)}</span></div>
        <div class="preview-field"><span class="preview-field-label">Channel</span><span class="preview-field-value">${channelLabel(reminder.channel)}</span></div>
        ${reminder.recurring !== 'none' ? `<div class="preview-field"><span class="preview-field-label">Recurring</span><span class="preview-field-value">${recurringLabel(reminder.recurring, reminder.customDays)}</span></div>` : ''}
      </div>
    </div>

    ${deliveries.map(d => `
    <div style="margin-top:14px">
      <div style="font-size:12px;font-weight:600;color:var(--text-accent);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">
        ${d.channel === 'email' ? '📧 Email Payload' : '💬 Slack Payload'}
      </div>
      <pre class="payload-block">${d.channel === 'email'
        ? `TO:      ${escapeHtml(d.to || '')}\nSUBJECT: ${escapeHtml(d.subject || '')}\nSMTP:    ${escapeHtml((d.smtp||{}).host || '')}:${escapeHtml(String((d.smtp||{}).port || ''))}\n\n${escapeHtml(d.body || '')}`
        : `WEBHOOK: ${escapeHtml(d.webhook ? d.webhook.slice(0, 60) + '...' : '')}\n\n${escapeHtml(JSON.stringify(d.payload, null, 2))}`
      }</pre>
    </div>`).join('')}`;

    document.getElementById('dryRunModal').classList.remove('hidden');
  },

  closeDryRunModal() {
    document.getElementById('dryRunModal').classList.add('hidden');
    this._pendingSendId = null;
  },

  async runDryRunAll() {
    const upcoming = db.getUpcoming(5);
    if (!upcoming.length) { showToast('No upcoming reminders to preview.', 'info'); return; }
    // Show preview for first one as representative
    const result = await channels.send(upcoming[0], true);
    this._showDryRun(result, upcoming[0]);
    showToast(`Previewing ${upcoming.length} upcoming reminders (showing first).`, 'info');
  },

  // ─── SEND NOW ─────────────────────────────────────────────────

  async sendNow() {
    if (!this._pendingSendId) { this.closeDryRunModal(); return; }
    const r = db.getReminder(this._pendingSendId);
    if (!r) { this.closeDryRunModal(); return; }

    if (db.settings.dryRun) {
      showToast('⚠️ Dry run mode is ON. Disable it to send real messages.', 'warning');
      return;
    }

    showToast('📤 Sending...', 'info');
    try {
      await channels.send(r, false);
      showToast(`✅ Sent: ${r.title}`, 'success');
      this.closeDryRunModal();
      this._renderView();
    } catch (e) {
      showToast(`❌ Send failed: ${e.message}`, 'error');
    }
  },

  async sendReminder(id) {
    const r = db.getReminder(id);
    if (!r) return;

    if (db.settings.dryRun) {
      showToast('⚠️ Dry run mode active. Use Preview to inspect payload.', 'warning');
      return;
    }

    showToast('📤 Sending...', 'info');
    try {
      await channels.send(r, false);
      showToast(`✅ Sent: ${r.title}`, 'success');
      this._renderView();
    } catch (e) {
      showToast(`❌ ${e.message}`, 'error');
    }
  },

  // ─── EXPORTS ──────────────────────────────────────────────────

  exportCSV() {
    exporter.exportCSV(db.reminders);
  },

  exportICal() {
    exporter.downloadICal(db.reminders);
  },

  exportGoogleCalendar() {
    exporter.exportAllToGoogleCalendar(db.reminders);
  },

  addToGCal(id) {
    const r = db.getReminder(id);
    if (r) exporter.openGoogleCalendar(r);
  },

  // ─── IMPORT CSV ───────────────────────────────────────────────

  openImportModal() {
    this._csvImportData = null;
    document.getElementById('csvFileInput').value = '';
    document.getElementById('csvPreview').classList.add('hidden');
    document.getElementById('csvPreview').innerHTML = '';
    document.getElementById('importConfirmBtn').disabled = true;
    document.getElementById('importModal').classList.remove('hidden');
  },

  closeImportModal() {
    document.getElementById('importModal').classList.add('hidden');
    this._csvImportData = null;
  },

  handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        this._csvImportData = csvToReminders(rows);
        const preview = document.getElementById('csvPreview');
        preview.classList.remove('hidden');
        preview.innerHTML = `
          <div style="margin-top:14px;padding:12px;background:var(--success-bg);border:1px solid rgba(16,185,129,0.2);border-radius:8px;font-size:13px;color:var(--success)">
            ✅ Found <strong>${this._csvImportData.length}</strong> valid reminder${this._csvImportData.length !== 1 ? 's' : ''} in CSV.
          </div>
          <div style="margin-top:10px;max-height:200px;overflow-y:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr>${['Title','Date','Time','Channel','Recurring'].map(h => `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.06em">${h}</th>`).join('')}</tr></thead>
              <tbody>${this._csvImportData.slice(0,8).map(r => `
                <tr><td style="padding:6px 8px;border-bottom:1px solid var(--border)">${escapeHtml(r.title)}</td>
                <td style="padding:6px 8px;border-bottom:1px solid var(--border);font-family:var(--font-mono)">${r.date}</td>
                <td style="padding:6px 8px;border-bottom:1px solid var(--border);font-family:var(--font-mono)">${r.time}</td>
                <td style="padding:6px 8px;border-bottom:1px solid var(--border)">${r.channel}</td>
                <td style="padding:6px 8px;border-bottom:1px solid var(--border)">${r.recurring}</td></tr>`).join('')}
              ${this._csvImportData.length > 8 ? `<tr><td colspan="5" style="padding:6px 8px;color:var(--text-muted);font-size:11px">... and ${this._csvImportData.length - 8} more</td></tr>` : ''}
              </tbody>
            </table>
          </div>`;
        document.getElementById('importConfirmBtn').disabled = false;
      } catch(err) {
        document.getElementById('csvPreview').classList.remove('hidden');
        document.getElementById('csvPreview').innerHTML = `<div style="margin-top:14px;padding:12px;background:var(--danger-bg);border-radius:8px;font-size:13px;color:var(--danger)">❌ Error parsing CSV: ${escapeHtml(err.message)}</div>`;
      }
    };
    reader.readAsText(file);
  },

  confirmImport() {
    if (!this._csvImportData) return;
    db.addManyReminders(this._csvImportData);
    showToast(`✅ Imported ${this._csvImportData.length} reminders.`, 'success');
    this.closeImportModal();
    this._renderView();
  },

  downloadCSVTemplate() {
    exporter.downloadTemplate();
  },

  // ─── SETTINGS ─────────────────────────────────────────────────

  updateSetting(key, value) {
    db.updateSettings({ [key]: value });
  },

  async testEmail() {
    showToast('🔄 Testing email connection...', 'info');
    const result = await channels.testEmail(db.settings);
    showToast(result.ok ? `✅ ${result.msg}` : `❌ ${result.msg}`, result.ok ? 'success' : 'error');
  },

  async testSlack() {
    showToast('🔄 Testing Slack webhook...', 'info');
    const result = await channels.testSlack(db.settings);
    showToast(result.ok ? `✅ ${result.msg}` : `❌ ${result.msg}`, result.ok ? 'success' : 'error');
  },

  clearLogs() {
    if (!confirm('Clear all activity logs?')) return;
    db.clearLogs();
    showToast('🗑 Logs cleared.', 'warning');
    this._renderView();
  },

  clearAll() {
    if (!confirm('Delete ALL reminders? This cannot be undone.')) return;
    db._data.reminders = [];
    db.save();
    showToast('🗑 All reminders deleted.', 'warning');
    this._renderView();
  },

  // ─── TEMPLATES ───────────────────────────────────────────────

  addTemplate() {
    const name = prompt('Template name:');
    if (!name) return;
    const desc = prompt('Template description (use {{title}}, {{date}}, {{time}}):');
    if (!desc) return;
    db.addTemplate({ name, description: desc, tags: [], channel: 'email' });
    showToast('✅ Template saved.', 'success');
    this._renderView();
  },

  deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;
    db.deleteTemplate(id);
    showToast('🗑 Template deleted.', 'warning');
    this._renderView();
  },

  useTemplate(id) {
    const t = db.templates.find(t => t.id === id);
    if (!t) return;
    this.openModal('add');
    // Pre-fill channel
    setTimeout(() => {
      document.getElementById('rChannel').value = t.channel;
      document.getElementById('rDescription').value = t.description;
      document.getElementById('rTitle').focus();
    }, 50);
  },

  // ─── SIDEBAR ──────────────────────────────────────────────────

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
  },

  // ─── SYNC ─────────────────────────────────────────────────────

  syncNow() {
    const el = document.getElementById('syncStatus');
    el.innerHTML = '<span class="status-dot" style="background:var(--warning)"></span> Syncing...';
    el.style.color = 'var(--warning)';
    setTimeout(() => {
      el.innerHTML = '<span class="status-dot"></span> All systems operational';
      el.style.color = 'var(--success)';
      showToast('✅ Sync complete', 'success');
    }, 1200);
  },

  _updateSyncStatus() {
    // Auto-refresh dashboard stats every 60s
    setInterval(() => {
      if (this._currentView === 'dashboard') this._renderView();
    }, 60000);
  },

  _setDefaultDate() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(i => { if (!i.value) i.value = getTodayStr(); });
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => app.init());
