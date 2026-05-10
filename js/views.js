/* js/views.js — Smart Reminder Agent v2 — View Renderers */

const Views = {

  // ─── DASHBOARD ───────────────────────────────────────────────

  dashboard() {
    const stats = db.getStats();
    const upcoming = db.getUpcoming(5);
    const todayReminders = db.getToday();
    const logs = db.logs.slice(0, 5);
    const settings = db.settings;

    const pct = (n, total) => total ? Math.round((n / total) * 100) : 0;
    const total = stats.total || 1;

    // Donut SVG
    const donutData = [
      { label: 'Email', val: stats.byChannel.email || 0, color: '#3B82F6' },
      { label: 'Slack', val: stats.byChannel.slack || 0, color: '#10B981' },
      { label: 'Both', val: stats.byChannel.both || 0, color: '#F59E0B' },
      { label: 'Upcoming', val: stats.upcoming, color: '#7C3AED' },
      { label: 'Overdue', val: stats.overdue, color: '#EF4444' }
    ];
    const donutSVG = this._donut(donutData, stats.total);

    return `
    <div class="view-header">
      <div>
        <div class="view-title">Dashboard</div>
        <div class="view-sub">Welcome back, ${escapeHtml(settings.userName)} — ${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</div>
      </div>
      <div class="view-actions">
        <button class="btn btn-secondary btn-sm" onclick="app.openImportModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Import CSV
        </button>
        <button class="btn btn-primary btn-sm" onclick="app.openModal('add')">+ New Reminder</button>
      </div>
    </div>

    <!-- STATS -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-icon purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>
          <span class="stat-delta up">+12%</span>
        </div>
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Reminders</div>
        <div class="stat-detail">All time</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
          <span class="stat-delta up">+25%</span>
        </div>
        <div class="stat-value">${stats.sentToday}</div>
        <div class="stat-label">Sent Today</div>
        <div class="stat-detail">via email & Slack</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <span class="stat-delta up">↑</span>
        </div>
        <div class="stat-value">${stats.upcoming}</div>
        <div class="stat-label">Upcoming</div>
        <div class="stat-detail">${upcoming.length ? 'Next: ' + upcoming[0].title.slice(0,18) : 'None scheduled'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-icon amber"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></div>
          <span class="stat-delta up">Active</span>
        </div>
        <div class="stat-value">${stats.recurring}</div>
        <div class="stat-label">Recurring</div>
        <div class="stat-detail">Active recurring tasks</div>
      </div>
    </div>

    <!-- MAIN PANELS -->
    <div class="panels-grid">
      <!-- LEFT: Upcoming Reminders -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Upcoming Reminders</span>
          <button class="panel-action" onclick="app.navigate('reminders')">View Calendar →</button>
        </div>
        <ul class="reminder-list">
          ${todayReminders.length ? todayReminders.map(r => this._reminderItem(r)).join('') :
            '<div class="empty-state"><p>No reminders today</p><button class="btn btn-primary btn-sm" onclick="app.openModal(\'add\')">Add One</button></div>'}
        </ul>
      </div>

      <!-- RIGHT: Channels + Donut -->
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Reminder Channels</span>
            <button class="panel-action" onclick="app.navigate('channels')">Manage</button>
          </div>
          <div class="channel-card">
            <div class="channel-top">
              <div class="channel-icon email-icon">📧</div>
              <div>
                <div class="channel-name">Email (SMTP)</div>
                <div class="channel-address">${escapeHtml(settings.userEmail || 'Not configured')}</div>
              </div>
              <span class="channel-status ${settings.emailEnabled ? 'status-active' : 'status-inactive'}">${settings.emailEnabled ? 'Active' : 'Off'}</span>
            </div>
            <div class="channel-stats">
              <span>Sent today</span>
              <span class="channel-count">${stats.sentToday}</span>
            </div>
          </div>
          <div class="channel-card">
            <div class="channel-top">
              <div class="channel-icon slack-icon">💬</div>
              <div>
                <div class="channel-name">Slack Webhook</div>
                <div class="channel-address">${escapeHtml(settings.slackChannel || '#reminders')}</div>
              </div>
              <span class="channel-status ${settings.slackEnabled ? 'status-active' : 'status-inactive'}">${settings.slackEnabled ? 'Active' : 'Off'}</span>
            </div>
            <div class="channel-stats">
              <span>Sent today</span>
              <span class="channel-count">${Math.max(0, stats.sentToday - 1)}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><span class="panel-title">Reminder Overview</span></div>
          <div class="donut-section">
            <div class="donut-wrap">
              ${donutSVG}
              <div class="donut-legend">
                ${donutData.map(d => `
                <div class="legend-item">
                  <div class="legend-left">
                    <span class="legend-dot" style="background:${d.color}"></span>
                    <span class="legend-label">${d.label}</span>
                  </div>
                  <div>
                    <span class="legend-val">${d.val}</span>
                    <span class="legend-pct">(${pct(d.val, stats.total)}%)</span>
                  </div>
                </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BOTTOM PANELS: Calendar + Dry Run + Activity -->
    <div class="bottom-grid">
      ${this._miniCalendar()}
      ${this._dryRunPanel()}
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Recent Activity</span>
          <button class="panel-action" onclick="app.navigate('logs')">View Logs</button>
        </div>
        ${logs.map(l => this._activityItem(l)).join('') || '<div class="empty-state"><p>No activity yet</p></div>'}
      </div>
    </div>`;
  },

  // ─── REMINDERS VIEW ──────────────────────────────────────────

  reminders(filter = 'all', search = '') {
    let list = db.reminders;

    if (filter === 'today') list = list.filter(r => r.date === getTodayStr());
    else if (filter === 'upcoming') list = list.filter(r => new Date(r.date + 'T' + r.time) >= new Date());
    else if (filter === 'recurring') list = list.filter(r => r.recurring !== 'none');
    else if (filter === 'overdue') list = list.filter(r => new Date(r.date + 'T' + r.time) < new Date());
    else if (['Work','Personal','Health','Finance','Other'].includes(filter)) list = list.filter(r => r.category === filter);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || (r.tags||[]).some(t => t.toLowerCase().includes(q)) || r.category.toLowerCase().includes(q));
    }

    list = list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    return `
    <div class="view-header">
      <div>
        <div class="view-title">Reminders</div>
        <div class="view-sub">${list.length} reminder${list.length !== 1 ? 's' : ''} shown</div>
      </div>
      <div class="view-actions">
        <button class="btn btn-secondary btn-sm" onclick="app.openImportModal()">Import CSV</button>
        <button class="btn btn-secondary btn-sm" onclick="app.exportCSV()">Export CSV</button>
        <button class="btn btn-primary btn-sm" onclick="app.openModal('add')">+ New Reminder</button>
      </div>
    </div>

    <div class="filters-bar">
      ${['all','today','upcoming','overdue','recurring','Work','Personal','Health','Finance'].map(f =>
        `<button class="filter-btn ${filter === f ? 'active' : ''}" onclick="app.setFilter('${f}')">${f.charAt(0).toUpperCase()+f.slice(1)}</button>`
      ).join('')}
    </div>

    <div class="panel">
      <table class="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date & Time</th>
            <th>Category</th>
            <th>Channel</th>
            <th>Recurring</th>
            <th>Priority</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${list.length ? list.map(r => {
            const cd = countdown(r.date, r.time);
            return `
            <tr>
              <td>
                <div style="font-weight:500">${escapeHtml(r.title)}</div>
                ${r.description ? `<div class="text-xs text-muted" style="margin-top:2px">${escapeHtml(r.description.slice(0,50))}${r.description.length > 50 ? '…' : ''}</div>` : ''}
                <div style="margin-top:4px">${(r.tags||[]).map(t => `<span class="tag tag-other">${escapeHtml(t)}</span>`).join(' ')}</div>
              </td>
              <td class="mono">
                <div>${formatDate(r.date)}</div>
                <div class="text-muted text-xs">${r.time}</div>
              </td>
              <td><span class="tag ${categoryTagClass(r.category)}">${r.category}</span></td>
              <td><span class="channel-tag ${channelClass(r.channel)}">${channelLabel(r.channel)}</span></td>
              <td>
                ${r.recurring !== 'none'
                  ? `<span class="recurring-badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.32-4.48"/></svg> ${recurringLabel(r.recurring, r.customDays)}</span>`
                  : `<span class="text-muted text-xs">—</span>`}
              </td>
              <td>
                <span class="priority-dot priority-${r.priority}"></span>
                <span class="text-xs" style="margin-left:5px;text-transform:capitalize">${r.priority}</span>
              </td>
              <td><span class="reminder-countdown ${cd.cls}">${cd.text}</span></td>
              <td>
                <div class="reminder-actions" style="opacity:1;display:flex;gap:4px">
                  <button class="action-btn" title="Preview (Dry Run)" onclick="app.previewSingle('${r.id}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="action-btn" title="Send Now" onclick="app.sendReminder('${r.id}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                  <button class="action-btn" title="Add to Google Calendar" onclick="app.addToGCal('${r.id}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </button>
                  <button class="action-btn" title="Edit" onclick="app.openModal('edit','${r.id}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn danger" title="Delete" onclick="app.deleteReminder('${r.id}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>`;
          }).join('') : `
            <tr><td colspan="8">
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
                <p>No reminders found</p>
                <button class="btn btn-primary btn-sm" onclick="app.openModal('add')">Add Your First Reminder</button>
              </div>
            </td></tr>`}
        </tbody>
      </table>
    </div>`;
  },

  // ─── CALENDAR VIEW ───────────────────────────────────────────

  calendar(weekOffset = 0) {
    const days = getWeekDates(weekOffset);
    const dayNames = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
    const today = getTodayStr();
    const hours = ['9 AM','12 PM','3 PM','6 PM','9 PM'];
    const timeSlots = ['09:00','12:00','15:00','18:00','21:00'];

    const startDate = days[0].toISOString().split('T')[0];
    const endDate = days[6].toISOString().split('T')[0];
    const rangeLabel = `${days[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${days[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;

    const reminders = db.reminders;

    return `
    <div class="view-header">
      <div>
        <div class="view-title">Calendar</div>
        <div class="view-sub">Week view</div>
      </div>
      <div class="view-actions">
        <button class="btn btn-secondary btn-sm" onclick="app.exportICal()">Export iCal</button>
        <button class="btn btn-secondary btn-sm" onclick="app.exportGoogleCalendar()">Google Calendar</button>
        <button class="btn btn-primary btn-sm" onclick="app.openModal('add')">+ New</button>
      </div>
    </div>

    <div class="calendar-panel">
      <div class="panel-header">
        <div class="calendar-nav">
          <button class="cal-nav-btn" onclick="app.calWeek(${weekOffset - 1})">&#8249;</button>
          <button class="cal-nav-btn" onclick="app.calWeek(${weekOffset + 1})">&#8250;</button>
          <span class="cal-period">${rangeLabel}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="app.calWeek(0)">Today</button>
          <select class="filter-btn" style="border-radius:20px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);padding:4px 10px;font-size:12px;cursor:pointer">
            <option>This Week</option>
          </select>
        </div>
      </div>

      <div class="cal-grid">
        <!-- Header row -->
        <div class="cal-header-time"></div>
        ${days.map((d, i) => {
          const ds = d.toISOString().split('T')[0];
          const isToday = ds === today;
          return `<div class="cal-day-header ${isToday ? 'today' : ''}">
            <span>${dayNames[i]}</span>
            <span class="cal-day-date">${d.getDate()}</span>
          </div>`;
        }).join('')}

        <!-- Time rows -->
        ${timeSlots.map((slot, si) => {
          const [slotH] = slot.split(':').map(Number);
          return `
          <div class="cal-time-slot">${hours[si]}</div>
          ${days.map(d => {
            const ds = d.toISOString().split('T')[0];
            const events = reminders.filter(r => {
              if (r.date !== ds) return false;
              const [rh] = r.time.split(':').map(Number);
              return rh >= slotH && rh < slotH + 3;
            });
            return `<div class="cal-cell">
              ${events.map(e => `<div class="cal-event ${e.category.toLowerCase()}" title="${escapeHtml(e.title)}" onclick="app.openModal('edit','${e.id}')">${escapeHtml(e.title.slice(0,18))}${e.title.length > 18 ? '…' : ''}</div>`).join('')}
            </div>`;
          }).join('')}`;
        }).join('')}
      </div>
    </div>`;
  },

  // ─── RECURRING VIEW ──────────────────────────────────────────

  recurring() {
    const list = db.reminders.filter(r => r.recurring && r.recurring !== 'none');
    return `
    <div class="view-header">
      <div><div class="view-title">Recurring Tasks</div>
      <div class="view-sub">${list.length} active recurring reminder${list.length !== 1 ? 's' : ''}</div></div>
      <button class="btn btn-primary btn-sm" onclick="app.openModal('add')">+ New Recurring</button>
    </div>
    <div class="panel">
      <table class="data-table">
        <thead><tr><th>Title</th><th>Schedule</th><th>Channel</th><th>Category</th><th>Next Due</th><th></th></tr></thead>
        <tbody>
          ${list.length ? list.map(r => {
            const cd = countdown(r.date, r.time);
            return `<tr>
              <td>
                <div style="font-weight:500">${escapeHtml(r.title)}</div>
                <div class="text-xs text-muted">${escapeHtml(r.description || '')}</div>
              </td>
              <td>
                <div class="recurring-badge" style="color:var(--text-accent)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.32-4.48"/></svg>
                  ${recurringLabel(r.recurring, r.customDays)}
                </div>
                <div class="text-xs text-muted mono" style="margin-top:3px">${r.time}</div>
              </td>
              <td><span class="channel-tag ${channelClass(r.channel)}">${channelLabel(r.channel)}</span></td>
              <td><span class="tag ${categoryTagClass(r.category)}">${r.category}</span></td>
              <td><span class="reminder-countdown ${cd.cls}">${cd.text}</span></td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="action-btn" onclick="app.openModal('edit','${r.id}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn danger" onclick="app.deleteReminder('${r.id}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H5L4 6"/></svg>
                  </button>
                </div>
              </td>
            </tr>`;
          }).join('') : `<tr><td colspan="6"><div class="empty-state"><p>No recurring reminders yet</p><button class="btn btn-primary btn-sm" onclick="app.openModal('add')">Create One</button></div></td></tr>`}
        </tbody>
      </table>
    </div>`;
  },

  // ─── CHANNELS VIEW ───────────────────────────────────────────

  channels() {
    const s = db.settings;
    return `
    <div class="view-header">
      <div><div class="view-title">Channels</div>
      <div class="view-sub">Configure your notification delivery channels</div></div>
    </div>
    <div class="channels-grid">
      <!-- EMAIL CARD -->
      <div class="channel-config-card">
        <div class="channel-config-header">
          <div class="channel-config-icon" style="background:var(--info-bg);font-size:22px">📧</div>
          <div>
            <div class="channel-config-title">Email (SMTP)</div>
            <div class="channel-config-sub">Send reminders via email</div>
          </div>
          <label class="toggle" style="margin-left:auto">
            <input type="checkbox" ${s.emailEnabled ? 'checked' : ''} onchange="app.updateSetting('emailEnabled', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="form-group"><label>SMTP Host</label><input type="text" value="${escapeHtml(s.smtpHost||'')}" placeholder="smtp.gmail.com" oninput="app.updateSetting('smtpHost',this.value)" /></div>
        <div class="form-row">
          <div class="form-group"><label>SMTP Port</label><input type="text" value="${escapeHtml(s.smtpPort||'587')}" placeholder="587" oninput="app.updateSetting('smtpPort',this.value)" /></div>
          <div class="form-group"><label>Security</label><select><option>TLS/STARTTLS</option><option>SSL</option><option>None</option></select></div>
        </div>
        <div class="form-group"><label>Username / Email</label><input type="email" value="${escapeHtml(s.smtpUser||'')}" placeholder="you@gmail.com" oninput="app.updateSetting('smtpUser',this.value)" /></div>
        <div class="form-group"><label>Password / App Password</label><input type="password" value="${escapeHtml(s.smtpPass||'')}" placeholder="••••••••" oninput="app.updateSetting('smtpPass',this.value)" /></div>
        <div class="form-group"><label>Default Recipient</label><input type="email" value="${escapeHtml(s.userEmail||'')}" placeholder="recipient@email.com" oninput="app.updateSetting('userEmail',this.value)" /></div>
        <button class="btn btn-secondary btn-sm" onclick="app.testEmail()" style="width:100%">Test Email Connection</button>
      </div>

      <!-- SLACK CARD -->
      <div class="channel-config-card">
        <div class="channel-config-header">
          <div class="channel-config-icon" style="background:var(--success-bg);font-size:22px">💬</div>
          <div>
            <div class="channel-config-title">Slack Webhook</div>
            <div class="channel-config-sub">Post reminders to Slack</div>
          </div>
          <label class="toggle" style="margin-left:auto">
            <input type="checkbox" ${s.slackEnabled ? 'checked' : ''} onchange="app.updateSetting('slackEnabled', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="form-group"><label>Webhook URL</label><input type="url" value="${escapeHtml(s.slackWebhook||'')}" placeholder="https://hooks.slack.com/services/..." oninput="app.updateSetting('slackWebhook',this.value)" /></div>
        <div class="form-group"><label>Default Channel</label><input type="text" value="${escapeHtml(s.slackChannel||'#reminders')}" placeholder="#reminders" oninput="app.updateSetting('slackChannel',this.value)" /></div>
        <div class="form-group">
          <label>Notification Style</label>
          <select>
            <option>Rich Block Kit (default)</option>
            <option>Plain Text</option>
            <option>Compact</option>
          </select>
        </div>
        <div class="form-group">
          <label>Include Fields</label>
          <div class="custom-days" style="margin-top:4px">
            <label class="checkbox-item"><input type="checkbox" checked> Date/Time</label>
            <label class="checkbox-item"><input type="checkbox" checked> Category</label>
            <label class="checkbox-item"><input type="checkbox" checked> Priority</label>
            <label class="checkbox-item"><input type="checkbox"> Tags</label>
          </div>
        </div>
        <div style="height:20px"></div>
        <button class="btn btn-secondary btn-sm" onclick="app.testSlack()" style="width:100%">Test Slack Connection</button>
      </div>
    </div>

    <!-- SETUP GUIDE -->
    <div class="settings-section" style="margin-top:16px">
      <div class="settings-section-title">Setup Guide</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Gmail App Password (for SMTP)</div>
          <div class="settings-sub">Go to Google Account → Security → 2-Step Verification → App Passwords. Use "smtp.gmail.com", port 587.</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Slack Incoming Webhook</div>
          <div class="settings-sub">In Slack: Apps → Incoming Webhooks → Add New Webhook to Workspace. Copy the webhook URL above.</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Backend Proxy (Production)</div>
          <div class="settings-sub">For production use, deploy the included <code style="font-family:var(--font-mono);background:var(--bg-input);padding:1px 6px;border-radius:4px">server/smtp-proxy.js</code> Node.js proxy to handle SMTP and Slack calls server-side.</div>
        </div>
      </div>
    </div>`;
  },

  // ─── TEMPLATES VIEW ──────────────────────────────────────────

  templates() {
    const list = db.templates;
    return `
    <div class="view-header">
      <div><div class="view-title">Templates</div>
      <div class="view-sub">Reusable message templates for quick reminder creation</div></div>
      <button class="btn btn-primary btn-sm" onclick="app.addTemplate()">+ New Template</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
      ${list.map(t => `
      <div class="panel" style="padding:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span style="font-weight:600;font-size:14px">${escapeHtml(t.name)}</span>
          <span class="channel-tag ${channelClass(t.channel)}">${channelLabel(t.channel)}</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);font-family:var(--font-mono);background:var(--bg-input);padding:10px;border-radius:8px;margin-bottom:12px;line-height:1.5">${escapeHtml(t.description)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${(t.tags||[]).map(tag => `<span class="tag tag-other">${escapeHtml(tag)}</span>`).join('')}</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="app.useTemplate('${t.id}')" style="flex:1">Use Template</button>
          <button class="action-btn danger" onclick="app.deleteTemplate('${t.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H5L4 6"/></svg>
          </button>
        </div>
      </div>`).join('')}
    </div>`;
  },

  // ─── LOGS VIEW ───────────────────────────────────────────────

  logs() {
    const logs = db.logs;
    return `
    <div class="view-header">
      <div><div class="view-title">Activity Logs</div>
      <div class="view-sub">${logs.length} log entries</div></div>
      <button class="btn btn-danger btn-sm" onclick="app.clearLogs()">Clear Logs</button>
    </div>
    <div class="panel">
      <div style="padding:14px 18px">
        ${logs.length ? logs.map(l => this._logItem(l)).join('') :
          '<div class="empty-state"><p>No logs yet</p></div>'}
      </div>
    </div>`;
  },

  // ─── SETTINGS VIEW ───────────────────────────────────────────

  settings() {
    const s = db.settings;
    return `
    <div class="view-header">
      <div><div class="view-title">Settings</div>
      <div class="view-sub">Application preferences and configuration</div></div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Profile</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Display Name</div>
          <div class="settings-sub">Shown in the dashboard greeting</div>
        </div>
        <input type="text" value="${escapeHtml(s.userName||'')}" oninput="app.updateSetting('userName',this.value);document.getElementById('userName').textContent=this.value" style="width:200px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);padding:7px 12px;font-family:var(--font-ui);font-size:13px;outline:none" />
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Default Email</div>
          <div class="settings-sub">Used as fallback recipient</div>
        </div>
        <input type="email" value="${escapeHtml(s.userEmail||'')}" oninput="app.updateSetting('userEmail',this.value)" style="width:220px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);padding:7px 12px;font-family:var(--font-ui);font-size:13px;outline:none" />
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Behaviour</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Dry Run Mode</div>
          <div class="settings-sub">Preview all reminders without sending or writing files</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${s.dryRun ? 'checked' : ''} onchange="app.toggleDryRun(this.checked);document.getElementById('dryRunToggle').checked=this.checked">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Default Reminder Channel</div>
          <div class="settings-sub">Pre-select when creating new reminders</div>
        </div>
        <select style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);padding:7px 12px;font-family:var(--font-ui);font-size:13px;outline:none">
          <option value="email" ${s.defaultChannel==='email'?'selected':''}>Email</option>
          <option value="slack" ${s.defaultChannel==='slack'?'selected':''}>Slack</option>
          <option value="both" ${s.defaultChannel==='both'?'selected':''}>Both</option>
        </select>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Data Management</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Export All Reminders</div>
          <div class="settings-sub">Download all reminders as CSV</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.exportCSV()">Export CSV</button>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Export to iCal</div>
          <div class="settings-sub">Download .ics file for all reminders</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.exportICal()">Export .ics</button>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Google Calendar Export</div>
          <div class="settings-sub">Generate one-click Google Calendar links</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.exportGoogleCalendar()">Export</button>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Import from CSV</div>
          <div class="settings-sub">Bulk import reminders from a CSV file</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.openImportModal()">Import CSV</button>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Clear All Reminders</div>
          <div class="settings-sub" style="color:var(--danger)">Permanently deletes all reminders</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="app.clearAll()">Clear All</button>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">About</div>
      <div class="settings-row"><div class="settings-label">Smart Reminder Agent</div><span class="text-muted text-sm">v2.0.0</span></div>
      <div class="settings-row"><div class="settings-label">Built by</div><span class="text-muted text-sm">Crevatec</span></div>
      <div class="settings-row"><div class="settings-label">Stack</div><span class="text-muted text-sm font-mono">HTML · CSS · JavaScript</span></div>
    </div>`;
  },

  // ─── PRIVATE HELPERS ─────────────────────────────────────────

  _reminderItem(r) {
    const t = formatTime(r.time);
    const cd = countdown(r.date, r.time);
    return `
    <li class="reminder-item">
      <div class="reminder-time-badge">
        <div class="time-hour">${t.hour}</div>
        <div class="time-ampm">${t.ampm}</div>
      </div>
      <span class="reminder-dot ${categoryDotClass(r.category)}"></span>
      <div class="reminder-content">
        <div class="reminder-title">${escapeHtml(r.title)}</div>
        <div class="reminder-meta">
          <span class="tag ${categoryTagClass(r.category)}">${r.category}</span>
          <span class="channel-tag ${channelClass(r.channel)}">${channelLabel(r.channel)}</span>
          ${r.recurring !== 'none' ? `<span class="recurring-badge">↻ ${recurringLabel(r.recurring, r.customDays)}</span>` : ''}
        </div>
      </div>
      <span class="reminder-countdown ${cd.cls}">${cd.text}</span>
      <div class="reminder-actions">
        <button class="action-btn" title="Preview" onclick="app.previewSingle('${r.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="action-btn" title="Edit" onclick="app.openModal('edit','${r.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn danger" title="Delete" onclick="app.deleteReminder('${r.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H5L4 6"/></svg>
        </button>
      </div>
    </li>`;
  },

  _activityItem(l) {
    const iconMap = {
      check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
      eye: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
      cal: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      slack: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.08 9C19.56 1.34 11.67-1.6 4.5 1.5S-1.6 12.33 1.5 19.5 12.33 25.6 19.5 22.5 25.6 14.67 22.5 7.5"/></svg>`
    };
    const clsMap = { sent: 'check', dry: 'eye', export: 'cal', slack: 'slack', error: 'error' };
    const cls = clsMap[l.type] || 'eye';
    return `
    <div class="activity-item">
      <div class="activity-icon ${cls}">${iconMap[l.icon] || iconMap.check}</div>
      <div class="activity-content">
        <div class="activity-title">${escapeHtml(l.title)}</div>
        <div class="activity-meta">
          <span>${escapeHtml(l.channel || '')}</span>
          <span>•</span>
          <span>${escapeHtml(l.time || '')}</span>
        </div>
      </div>
    </div>`;
  },

  _logItem(l) {
    const iconMap = {
      check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
      eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
      cal: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      slack: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 13l3-3 3 3"/></svg>`
    };
    const clsMap = { sent: 'sent', dry: 'dry', export: 'export', error: 'error' };
    return `
    <div class="log-entry">
      <div class="log-icon ${clsMap[l.type] || 'dry'}">${iconMap[l.icon] || iconMap.check}</div>
      <div class="log-content">
        <div class="log-title">${escapeHtml(l.title)}</div>
        <div class="log-meta">
          <span>${escapeHtml(l.channel || '')}</span>
          <span>•</span>
          <span class="mono">${escapeHtml(l.time || '')}</span>
        </div>
      </div>
    </div>`;
  },

  _donut(data, total) {
    const size = 100;
    const cx = 50, cy = 50, r = 36, stroke = 12;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const segments = data.map(d => {
      const pct = total > 0 ? d.val / total : 0;
      const len = pct * circumference;
      const seg = { ...d, offset, len };
      offset += len;
      return seg;
    });

    return `<svg class="donut-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-input)" stroke-width="${stroke}"/>
      ${segments.map(s => s.len > 0 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="${s.color}" stroke-width="${stroke}"
        stroke-dasharray="${s.len} ${circumference - s.len}"
        stroke-dashoffset="${-s.offset}"
        transform="rotate(-90 ${cx} ${cy})"
        stroke-linecap="round"/>` : '').join('')}
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="16" font-weight="600" fill="var(--text-primary)">${total}</text>
      <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="8" fill="var(--text-muted)">Total</text>
    </svg>`;
  },

  _miniCalendar() {
    const days = getWeekDates(0);
    const reminders = db.reminders;
    const dayNames = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
    const today = getTodayStr();

    return `
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Calendar Preview</span>
        <button class="panel-action" onclick="app.navigate('calendar')">Full Calendar →</button>
      </div>
      <div style="padding:12px 14px">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">
          ${dayNames.map((d,i) => {
            const ds = days[i].toISOString().split('T')[0];
            const isToday = ds === today;
            const dayEvents = reminders.filter(r => r.date === ds);
            return `
            <div style="text-align:center">
              <div style="font-size:9px;font-weight:600;color:var(--text-muted);letter-spacing:.05em;margin-bottom:3px">${d}</div>
              <div style="font-size:12px;font-weight:${isToday?'700':'400'};color:${isToday?'var(--brand)':'var(--text-secondary)'};background:${isToday?'var(--brand-glow)':'transparent'};border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 3px">${days[i].getDate()}</div>
              ${dayEvents.slice(0,2).map(e => `<div style="font-size:9px;background:${e.category==='Work'?'var(--brand-glow)':e.category==='Health'?'var(--warning-bg)':'var(--success-bg)'};color:${e.category==='Work'?'var(--text-accent)':e.category==='Health'?'var(--warning)':'var(--success)'};border-radius:3px;padding:1px 3px;margin-bottom:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis" title="${escapeHtml(e.title)}">${escapeHtml(e.title.slice(0,8))}</div>`).join('')}
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  },

  _dryRunPanel() {
    const upcoming = db.getUpcoming(3);
    return `
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Dry Run <span style="font-size:11px;color:var(--text-muted)">(Preview Mode)</span></span>
        <label class="toggle">
          <input type="checkbox" ${db.settings.dryRun ? 'checked' : ''} onchange="app.toggleDryRun(this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div style="padding:14px 18px">
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:14px">Preview reminders that will be sent. No emails or files will be created.</p>
        ${upcoming.map(r => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="width:26px;height:26px;border-radius:8px;background:var(--bg-input);display:flex;align-items:center;justify-content:center">
            ${r.channel === 'slack' ? '💬' : r.channel === 'both' ? '📨' : '📧'}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.title)}</div>
            <div style="font-size:11px;color:var(--text-muted)">${formatDate(r.date)} via ${channelLabel(r.channel)}</div>
          </div>
        </div>`).join('') || '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px 0">No upcoming reminders</div>'}
        <button class="btn btn-primary btn-sm" style="width:100%;margin-top:14px" onclick="app.runDryRunAll()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Run Preview
        </button>
      </div>
    </div>`;
  }
};
