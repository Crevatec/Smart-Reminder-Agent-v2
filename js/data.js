/* js/data.js — Smart Reminder Agent v2 — Data Layer */

const SRA_STORAGE_KEY = 'sra_v2_data';

const DEFAULT_DATA = {
  reminders: [
    {
      id: 'r1', title: 'Team Standup Meeting', description: 'Daily engineering sync',
      date: getTodayStr(), time: '09:00', category: 'Work', channel: 'slack',
      recurring: 'weekdays', customDays: [], tags: ['work','standup'],
      email: '', priority: 'normal', status: 'upcoming', created: Date.now() - 86400000
    },
    {
      id: 'r2', title: 'Project Deadline Review', description: 'Review Q2 milestones',
      date: getTodayStr(), time: '11:00', category: 'Work', channel: 'email',
      recurring: 'weekly', customDays: [], tags: ['work','deadline'],
      email: 'team@example.com', priority: 'high', status: 'upcoming', created: Date.now() - 72000000
    },
    {
      id: 'r3', title: 'Client Follow-up Call', description: 'Follow up on proposal',
      date: getTodayStr(), time: '14:00', category: 'Work', channel: 'email',
      recurring: 'none', customDays: [], tags: ['work','client'],
      email: 'client@example.com', priority: 'high', status: 'upcoming', created: Date.now() - 50000000
    },
    {
      id: 'r4', title: 'Gym Workout', description: 'Cardio + strength',
      date: getTodayStr(), time: '19:00', category: 'Health', channel: 'email',
      recurring: 'custom', customDays: ['Mon','Wed','Fri'], tags: ['health','fitness'],
      email: '', priority: 'normal', status: 'upcoming', created: Date.now() - 43200000
    },
    {
      id: 'r5', title: 'Read 20 Pages Book', description: 'Deep Work by Cal Newport',
      date: getTodayStr(), time: '21:30', category: 'Personal', channel: 'email',
      recurring: 'daily', customDays: [], tags: ['personal','reading'],
      email: '', priority: 'low', status: 'upcoming', created: Date.now() - 30000000
    },
    {
      id: 'r6', title: 'Pay Electricity Bill', description: 'Monthly utility payment',
      date: getDateStr(2), time: '10:00', category: 'Finance', channel: 'email',
      recurring: 'monthly', customDays: [], tags: ['finance','bills'],
      email: '', priority: 'high', status: 'upcoming', created: Date.now() - 20000000
    },
    {
      id: 'r7', title: 'Sprint Planning', description: 'Plan next 2-week sprint',
      date: getDateStr(3), time: '09:30', category: 'Work', channel: 'both',
      recurring: 'biweekly', customDays: [], tags: ['work','planning'],
      email: 'dev-team@example.com', priority: 'high', status: 'upcoming', created: Date.now() - 10000000
    }
  ],
  settings: {
    userName: 'Alex Parker',
    userEmail: 'alexparker@gmail.com',
    slackWebhook: '',
    slackChannel: '#reminders',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'alexparker@gmail.com',
    smtpPass: '',
    emailEnabled: true,
    slackEnabled: true,
    dryRun: false,
    theme: 'dark'
  },
  logs: [
    { id: 'l1', type: 'sent', title: 'Reminder sent: Team Standup Meeting', channel: 'Slack', time: getTodayStr() + ' 08:59', icon: 'check' },
    { id: 'l2', type: 'sent', title: 'Reminder sent: Project Deadline Review', channel: 'Email', time: getTodayStr() + ' 10:59', icon: 'check' },
    { id: 'l3', type: 'dry', title: 'Dry run preview: Gym Workout', channel: 'Email', time: getTodayStr() + ' 06:45', icon: 'eye' },
    { id: 'l4', type: 'export', title: 'iCal export completed', channel: 'System', time: getTodayStr() + ' 05:30', icon: 'cal' },
    { id: 'l5', type: 'export', title: 'Slack webhook connected', channel: 'Slack', time: getTodayStr() + ' 03:15', icon: 'slack' }
  ],
  templates: [
    { id: 't1', name: 'Daily Standup', description: '{{title}} at {{time}}. Please be prepared with yesterday\'s updates.', tags: ['work', 'standup'], channel: 'slack' },
    { id: 't2', name: 'Deadline Alert', description: 'Reminder: {{title}} is due {{date}}. Ensure all deliverables are ready.', tags: ['work', 'deadline'], channel: 'email' },
    { id: 't3', name: 'Personal Task', description: 'Personal reminder: {{title}} scheduled for {{time}} on {{date}}.', tags: ['personal'], channel: 'email' },
    { id: 't4', name: 'Health Reminder', description: 'Time for your health routine: {{title}}. Stay consistent for best results!', tags: ['health'], channel: 'both' }
  ]
};

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDateStr(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

class DataStore {
  constructor() {
    this._data = null;
  }

  load() {
    try {
      const raw = localStorage.getItem(SRA_STORAGE_KEY);
      if (raw) {
        this._data = JSON.parse(raw);
        // Merge any new defaults
        if (!this._data.templates) this._data.templates = DEFAULT_DATA.templates;
        if (!this._data.logs) this._data.logs = DEFAULT_DATA.logs;
      } else {
        this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        this.save();
      }
    } catch (e) {
      this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return this;
  }

  save() {
    try {
      localStorage.setItem(SRA_STORAGE_KEY, JSON.stringify(this._data));
    } catch(e) { console.warn('Storage error', e); }
    return this;
  }

  get reminders() { return this._data.reminders || []; }
  get settings() { return this._data.settings || {}; }
  get logs() { return this._data.logs || []; }
  get templates() { return this._data.templates || []; }

  // ─── REMINDERS ───────────────────────────────────────────────

  getReminder(id) { return this.reminders.find(r => r.id === id); }

  addReminder(reminder) {
    const r = { ...reminder, id: 'r' + Date.now(), created: Date.now(), status: 'upcoming' };
    this._data.reminders.push(r);
    this.save();
    return r;
  }

  updateReminder(id, updates) {
    const idx = this._data.reminders.findIndex(r => r.id === id);
    if (idx > -1) {
      this._data.reminders[idx] = { ...this._data.reminders[idx], ...updates };
      this.save();
      return this._data.reminders[idx];
    }
    return null;
  }

  deleteReminder(id) {
    this._data.reminders = this._data.reminders.filter(r => r.id !== id);
    this.save();
  }

  addManyReminders(list) {
    list.forEach(r => {
      const reminder = { ...r, id: 'r' + Date.now() + Math.random(), created: Date.now(), status: 'upcoming' };
      this._data.reminders.push(reminder);
    });
    this.save();
  }

  getUpcoming(limit = 5) {
    const now = new Date();
    return this.reminders
      .filter(r => {
        const dt = new Date(r.date + 'T' + (r.time || '00:00'));
        return dt >= now;
      })
      .sort((a, b) => {
        const da = new Date(a.date + 'T' + (a.time || '00:00'));
        const db = new Date(b.date + 'T' + (b.time || '00:00'));
        return da - db;
      })
      .slice(0, limit);
  }

  getToday() {
    const today = getTodayStr();
    return this.reminders.filter(r => r.date === today).sort((a, b) => a.time.localeCompare(b.time));
  }

  getStats() {
    const all = this.reminders;
    const today = getTodayStr();
    const now = new Date();
    const upcoming = all.filter(r => new Date(r.date + 'T' + (r.time || '00:00')) >= now);
    const recurring = all.filter(r => r.recurring && r.recurring !== 'none');
    const sentToday = this.logs.filter(l => l.type === 'sent' && l.time.startsWith(today));

    const byChannel = { email: 0, slack: 0, both: 0, none: 0 };
    all.forEach(r => { byChannel[r.channel] = (byChannel[r.channel] || 0) + 1; });

    return {
      total: all.length,
      sentToday: sentToday.length,
      upcoming: upcoming.length,
      recurring: recurring.length,
      byChannel,
      overdue: all.filter(r => {
        const dt = new Date(r.date + 'T' + (r.time || '00:00'));
        return dt < now;
      }).length
    };
  }

  // ─── SETTINGS ────────────────────────────────────────────────

  updateSettings(updates) {
    this._data.settings = { ...this._data.settings, ...updates };
    this.save();
  }

  // ─── LOGS ────────────────────────────────────────────────────

  addLog(entry) {
    const log = { id: 'l' + Date.now(), ...entry, time: new Date().toLocaleString() };
    this._data.logs.unshift(log);
    if (this._data.logs.length > 200) this._data.logs = this._data.logs.slice(0, 200);
    this.save();
    return log;
  }

  clearLogs() {
    this._data.logs = [];
    this.save();
  }

  // ─── TEMPLATES ───────────────────────────────────────────────

  addTemplate(tpl) {
    const t = { ...tpl, id: 't' + Date.now() };
    this._data.templates.push(t);
    this.save();
    return t;
  }

  deleteTemplate(id) {
    this._data.templates = this._data.templates.filter(t => t.id !== id);
    this.save();
  }
}

const db = new DataStore();
