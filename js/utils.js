/* js/utils.js — Smart Reminder Agent v2 — Utilities */

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return { hour: h12 + ':' + m, ampm };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr, timeStr) {
  const date = formatDate(dateStr);
  const time = formatTime(timeStr);
  return `${date} at ${time.hour} ${time.ampm}`;
}

function countdown(dateStr, timeStr) {
  const dt = new Date(dateStr + 'T' + (timeStr || '00:00'));
  const now = new Date();
  const diff = dt - now;

  if (diff < 0) {
    const h = Math.floor(-diff / 3600000);
    if (h < 24) return { text: `${h}h overdue`, cls: 'overdue' };
    const d = Math.floor(h / 24);
    return { text: `${d}d overdue`, cls: 'overdue' };
  }

  const h = Math.floor(diff / 3600000);
  if (h < 1) {
    const m = Math.floor(diff / 60000);
    return { text: `In ${m}m`, cls: 'soon' };
  }
  if (h < 24) return { text: `In ${h}h ${Math.floor((diff % 3600000) / 60000)}m`, cls: h < 2 ? 'soon' : '' };
  const d = Math.floor(h / 24);
  return { text: `In ${d}d`, cls: '' };
}

function generateId(prefix = 'id') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function recurringLabel(recurring, customDays) {
  const labels = {
    none: '', daily: 'Daily', weekdays: 'Weekdays',
    weekly: 'Every Week', biweekly: 'Bi-weekly', monthly: 'Monthly',
    custom: (customDays || []).join(', ')
  };
  return labels[recurring] || '';
}

function channelLabel(ch) {
  const labels = { email: 'Email', slack: 'Slack', both: 'Both', none: 'None' };
  return labels[ch] || ch;
}

function categoryDotClass(cat) {
  const map = { Work: 'dot-work', Personal: 'dot-personal', Health: 'dot-health', Finance: 'dot-finance', Other: 'dot-other' };
  return map[cat] || 'dot-other';
}

function categoryTagClass(cat) {
  const map = { Work: 'tag-work', Personal: 'tag-personal', Health: 'tag-health', Finance: 'tag-finance', Other: 'tag-other' };
  return map[cat] || 'tag-other';
}

function channelClass(ch) {
  const map = { email: 'ch-email', slack: 'ch-slack', both: 'ch-both', none: 'ch-none' };
  return map[ch] || 'ch-none';
}

function renderTags(tags) {
  if (!tags || tags.length === 0) return '';
  return tags.map(t => `<span class="tag tag-other">${escapeHtml(t)}</span>`).join('');
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getWeekDates(offsetWeeks = 0) {
  const today = new Date();
  today.setDate(today.getDate() + offsetWeeks * 7);
  const day = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    days.push(d);
  }
  return days;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (values[i] || '').trim().replace(/^["']|["']$/g, ''); });
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current);
  return result;
}

function csvToReminders(rows) {
  return rows.map(r => ({
    title: r.title || r.name || 'Untitled',
    description: r.description || r.desc || '',
    date: r.date || getTodayStr(),
    time: r.time || '09:00',
    category: r.category || 'Other',
    channel: r.channel || 'email',
    recurring: r.recurring || 'none',
    customDays: (r.customdays || r['custom_days'] || '').split(',').map(s => s.trim()).filter(Boolean),
    tags: (r.tags || '').split(',').map(s => s.trim()).filter(Boolean),
    email: r.email || '',
    priority: r.priority || 'normal',
    status: 'upcoming'
  }));
}

function remindersToCSV(reminders) {
  const headers = ['id','title','description','date','time','category','channel','recurring','customDays','tags','email','priority','status'];
  const rows = reminders.map(r =>
    headers.map(h => {
      const val = Array.isArray(r[h]) ? r[h].join('|') : (r[h] || '');
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return headers.join(',') + '\n' + rows.join('\n');
}

function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showToast(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

function csvTemplate() {
  return 'title,description,date,time,category,channel,recurring,customDays,tags,email,priority\n' +
    '"Team Standup","Daily sync","' + getTodayStr() + '","09:00","Work","slack","weekdays","","standup,work","","normal"\n' +
    '"Gym Workout","Exercise routine","' + getTodayStr() + '","19:00","Health","email","custom","Mon,Wed,Fri","health,fitness","user@email.com","normal"';
}
