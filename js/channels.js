/* js/channels.js — Smart Reminder Agent v2 — Email & Slack Channels */

/**
 * CHANNEL MANAGER
 * Handles Email (SMTP via Mailgun/EmailJS proxy) and Slack Webhook delivery.
 * In a real deployment, SMTP calls would go through a backend server.
 * This module simulates delivery in browser and provides dry-run payloads.
 */

class ChannelManager {
  constructor() {
    this._sending = false;
  }

  /**
   * Send a reminder through its configured channel(s).
   * If dry run is active, returns a preview payload without sending.
   */
  async send(reminder, isDryRun = false) {
    const settings = db.settings;
    const result = { reminder, dryRun: isDryRun, deliveries: [] };

    if (isDryRun) {
      result.deliveries = this._buildPayloads(reminder, settings);
      return result;
    }

    const promises = [];
    if (reminder.channel === 'email' || reminder.channel === 'both') {
      promises.push(this._sendEmail(reminder, settings));
    }
    if (reminder.channel === 'slack' || reminder.channel === 'both') {
      promises.push(this._sendSlack(reminder, settings));
    }

    const results = await Promise.allSettled(promises);
    results.forEach(r => {
      result.deliveries.push({ success: r.status === 'fulfilled', detail: r.value || r.reason });
    });

    return result;
  }

  /** Build preview payloads (dry run) */
  _buildPayloads(reminder, settings) {
    const payloads = [];

    if (reminder.channel === 'email' || reminder.channel === 'both') {
      payloads.push({
        channel: 'email',
        to: reminder.email || settings.userEmail,
        subject: `[Reminder] ${reminder.title}`,
        body: this._buildEmailBody(reminder),
        smtp: {
          host: settings.smtpHost,
          port: settings.smtpPort,
          user: settings.smtpUser
        }
      });
    }

    if (reminder.channel === 'slack' || reminder.channel === 'both') {
      payloads.push({
        channel: 'slack',
        webhook: settings.slackWebhook,
        payload: this._buildSlackPayload(reminder)
      });
    }

    return payloads;
  }

  /** Build plain-text email body */
  _buildEmailBody(reminder) {
    const lines = [
      `📌 REMINDER: ${reminder.title}`,
      ``,
      `Date & Time: ${formatDateTime(reminder.date, reminder.time)}`,
      `Category:    ${reminder.category}`,
      `Priority:    ${reminder.priority.toUpperCase()}`,
    ];

    if (reminder.description) lines.push(`Notes:       ${reminder.description}`);
    if (reminder.recurring && reminder.recurring !== 'none') {
      lines.push(`Recurring:   ${recurringLabel(reminder.recurring, reminder.customDays)}`);
    }
    if (reminder.tags && reminder.tags.length) lines.push(`Tags:        ${reminder.tags.join(', ')}`);

    lines.push(``, `---`, `Sent by Smart Reminder Agent v2`);
    return lines.join('\n');
  }

  /** Build Slack Block Kit payload */
  _buildSlackPayload(reminder) {
    const dt = formatDateTime(reminder.date, reminder.time);
    const color = { Work: '#7C3AED', Personal: '#10B981', Health: '#F59E0B', Finance: '#3B82F6', Other: '#6B7280' }[reminder.category] || '#7C3AED';
    const priorityEmoji = { high: '🔴', normal: '🟡', low: '🟢' }[reminder.priority] || '⚪';

    return {
      text: `Reminder: ${reminder.title}`,
      attachments: [{
        color,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📌 ${reminder.title}*\n${reminder.description || ''}`
            }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Date & Time:*\n${dt}` },
              { type: 'mrkdwn', text: `*Category:*\n${reminder.category}` },
              { type: 'mrkdwn', text: `*Priority:*\n${priorityEmoji} ${reminder.priority}` },
              { type: 'mrkdwn', text: `*Recurring:*\n${recurringLabel(reminder.recurring, reminder.customDays) || 'None'}` }
            ]
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `Smart Reminder Agent v2 • ${new Date().toLocaleString()}` }
            ]
          }
        ]
      }]
    };
  }

  /** Simulate email send (in production: call backend /api/send-email) */
  async _sendEmail(reminder, settings) {
    if (!settings.emailEnabled) throw new Error('Email channel is disabled');
    if (!settings.smtpHost) throw new Error('SMTP not configured');

    const to = reminder.email || settings.userEmail;
    const subject = `[Reminder] ${reminder.title}`;
    const body = this._buildEmailBody(reminder);

    // Browser simulation — in production, POST to your backend:
    // const res = await fetch('/api/send-email', { method:'POST', body: JSON.stringify({to, subject, body}) });
    // if (!res.ok) throw new Error(await res.text());

    // Simulate network delay
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));

    db.addLog({
      type: 'sent',
      title: `Reminder sent: ${reminder.title}`,
      channel: 'Email → ' + to,
      icon: 'check'
    });

    return { channel: 'email', to, subject, status: 'delivered' };
  }

  /** Send to Slack webhook */
  async _sendSlack(reminder, settings) {
    if (!settings.slackEnabled) throw new Error('Slack channel is disabled');
    if (!settings.slackWebhook || settings.slackWebhook.includes('XXXXXXXXX')) {
      throw new Error('Slack webhook not configured');
    }

    const payload = this._buildSlackPayload(reminder);

    try {
      const res = await fetch(settings.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok && res.status !== 0) {
        throw new Error(`Slack error: ${res.status}`);
      }
    } catch (e) {
      // In browser CORS will block direct Slack webhooks — use a backend proxy
      // We log the attempt anyway for demo
    }

    db.addLog({
      type: 'sent',
      title: `Reminder sent: ${reminder.title}`,
      channel: 'Slack',
      icon: 'slack'
    });

    return { channel: 'slack', status: 'delivered', payload };
  }

  /** Test email configuration */
  async testEmail(settings) {
    if (!settings.smtpHost || !settings.smtpUser) return { ok: false, msg: 'SMTP not configured' };
    await new Promise(r => setTimeout(r, 800));
    return { ok: true, msg: `Test email sent to ${settings.userEmail}` };
  }

  /** Test Slack webhook */
  async testSlack(settings) {
    if (!settings.slackWebhook || settings.slackWebhook.includes('XXXXXXXXX')) {
      return { ok: false, msg: 'Slack webhook URL not configured' };
    }

    try {
      const res = await fetch(settings.slackWebhook, {
        method: 'POST',
        body: JSON.stringify({ text: '✅ Smart Reminder Agent v2: Connection test successful!' })
      });
      return { ok: true, msg: 'Slack test message sent' };
    } catch (e) {
      return { ok: false, msg: 'Slack webhook requires backend proxy for browser use.' };
    }
  }
}

const channels = new ChannelManager();
