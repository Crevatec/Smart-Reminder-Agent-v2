/* js/exports.js — Smart Reminder Agent v2 — Export Module */

/**
 * EXPORT MANAGER
 * Handles Google Calendar link generation, iCal (.ics) file export,
 * and CSV import/export for reminders.
 */

class ExportManager {

  // ─── iCAL EXPORT ─────────────────────────────────────────────

  /**
   * Generate a full .ics calendar file from all (or filtered) reminders.
   */
  generateICal(reminders) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Smart Reminder Agent v2//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Smart Reminders',
      'X-WR-TIMEZONE:UTC'
    ];

    reminders.forEach(r => {
      const dtstart = this._toICalDate(r.date, r.time);
      const dtend = this._toICalDate(r.date, this._addMinutes(r.time, 30));
      const uid = `${r.id}@smart-reminder-agent`;
      const now = this._toICalDateNow();
      const summary = this._escapeICal(r.title);
      const description = this._escapeICal(
        [r.description, `Category: ${r.category}`, `Priority: ${r.priority}`, `Tags: ${(r.tags||[]).join(', ')}`]
          .filter(Boolean).join('\\n')
      );

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART:${dtstart}`);
      lines.push(`DTEND:${dtend}`);
      lines.push(`SUMMARY:${summary}`);
      if (description) lines.push(`DESCRIPTION:${description}`);
      lines.push(`CATEGORIES:${r.category}`);
      lines.push(`PRIORITY:${r.priority === 'high' ? 1 : r.priority === 'low' ? 9 : 5}`);

      // Recurrence rules
      const rrule = this._buildRRule(r);
      if (rrule) lines.push(`RRULE:${rrule}`);

      // Alarm (15 min before)
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Reminder: ${summary}`);
      lines.push('TRIGGER:-PT15M');
      lines.push('END:VALARM');

      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /** Download .ics file */
  downloadICal(reminders) {
    const content = this.generateICal(reminders);
    const filename = `smart-reminders-${getTodayStr()}.ics`;
    downloadFile(content, filename, 'text/calendar;charset=utf-8');
    db.addLog({ type: 'export', title: 'iCal export completed', channel: `${reminders.length} reminders`, icon: 'cal' });
    showToast(`✅ iCal exported (${reminders.length} reminders)`, 'success');
  }

  // ─── GOOGLE CALENDAR ─────────────────────────────────────────

  /**
   * Open Google Calendar "add event" link for a single reminder.
   */
  openGoogleCalendar(reminder) {
    const base = 'https://calendar.google.com/calendar/r/eventedit';
    const start = this._toGCalDate(reminder.date, reminder.time);
    const end = this._toGCalDate(reminder.date, this._addMinutes(reminder.time, 30));

    const params = new URLSearchParams({
      text: reminder.title,
      dates: `${start}/${end}`,
      details: [reminder.description, `Category: ${reminder.category}`, `Priority: ${reminder.priority}`, `Tags: ${(reminder.tags||[]).join(', ')}`].filter(Boolean).join('\n'),
      location: '',
      sf: 'true',
      output: 'xml'
    });

    const url = `${base}?${params.toString()}`;
    window.open(url, '_blank');
    db.addLog({ type: 'export', title: `Opened in Google Calendar: ${reminder.title}`, channel: 'Google Calendar', icon: 'cal' });
  }

  /**
   * Generate Google Calendar export for ALL reminders as a batch link list.
   * Downloads an HTML file with one-click links for each reminder.
   */
  exportAllToGoogleCalendar(reminders) {
    const links = reminders.map(r => {
      const base = 'https://calendar.google.com/calendar/r/eventedit';
      const start = this._toGCalDate(r.date, r.time);
      const end = this._toGCalDate(r.date, this._addMinutes(r.time, 30));
      const params = new URLSearchParams({
        text: r.title,
        dates: `${start}/${end}`,
        details: r.description || '',
        sf: 'true',
        output: 'xml'
      });
      return { title: r.title, date: r.date, url: `${base}?${params.toString()}` };
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Smart Reminders – Google Calendar Export</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; background: #f9f9f9; color: #111; }
    h1 { font-size: 22px; margin-bottom: 6px; }
    p { color: #555; font-size: 14px; margin-bottom: 24px; }
    .item { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    .item-title { font-weight: 500; font-size: 14px; }
    .item-date { color: #888; font-size: 12px; margin-top: 3px; }
    a.btn { background: #4285F4; color: white; text-decoration: none; padding: 7px 14px; border-radius: 7px; font-size: 13px; }
    a.btn:hover { background: #1a73e8; }
  </style>
</head>
<body>
  <h1>📅 Google Calendar Export</h1>
  <p>Generated by Smart Reminder Agent v2 on ${new Date().toLocaleString()}. Click each button to add to Google Calendar.</p>
  ${links.map(l => `
  <div class="item">
    <div>
      <div class="item-title">${l.title}</div>
      <div class="item-date">${l.date}</div>
    </div>
    <a href="${l.url}" target="_blank" class="btn">Add to Google Calendar</a>
  </div>`).join('')}
</body>
</html>`;

    downloadFile(html, `google-calendar-export-${getTodayStr()}.html`, 'text/html');
    db.addLog({ type: 'export', title: `Google Calendar export: ${reminders.length} reminders`, channel: 'HTML file', icon: 'cal' });
    showToast(`✅ Google Calendar export ready (${reminders.length} reminders)`, 'success');
  }

  // ─── CSV EXPORT ───────────────────────────────────────────────

  exportCSV(reminders) {
    const csv = remindersToCSV(reminders);
    const filename = `smart-reminders-${getTodayStr()}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8');
    db.addLog({ type: 'export', title: `CSV export: ${reminders.length} reminders`, channel: 'CSV file', icon: 'cal' });
    showToast(`✅ CSV exported (${reminders.length} reminders)`, 'success');
  }

  downloadTemplate() {
    downloadFile(csvTemplate(), 'reminders-template.csv', 'text/csv;charset=utf-8');
    showToast('📄 CSV template downloaded', 'info');
  }

  // ─── HELPERS ─────────────────────────────────────────────────

  _toICalDate(dateStr, timeStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const [h, min] = (timeStr || '00:00').split(':');
    return `${y}${m}${d}T${h.padStart(2,'0')}${min.padStart(2,'0')}00`;
  }

  _toICalDateNow() {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  _toGCalDate(dateStr, timeStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const [h, min] = (timeStr || '00:00').split(':');
    return `${y}${m}${d}T${h.padStart(2,'0')}${min.padStart(2,'0')}00`;
  }

  _addMinutes(timeStr, mins) {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    const total = h * 60 + m + mins;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
  }

  _escapeICal(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  _buildRRule(r) {
    switch (r.recurring) {
      case 'daily': return 'FREQ=DAILY';
      case 'weekdays': return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
      case 'weekly': return 'FREQ=WEEKLY';
      case 'biweekly': return 'FREQ=WEEKLY;INTERVAL=2';
      case 'monthly': return 'FREQ=MONTHLY';
      case 'custom': {
        const dayMap = { Mon:'MO', Tue:'TU', Wed:'WE', Thu:'TH', Fri:'FR', Sat:'SA', Sun:'SU' };
        const days = (r.customDays || []).map(d => dayMap[d]).filter(Boolean);
        return days.length ? `FREQ=WEEKLY;BYDAY=${days.join(',')}` : null;
      }
      default: return null;
    }
  }
}

const exporter = new ExportManager();
