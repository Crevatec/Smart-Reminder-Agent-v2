/**
 * server/smtp-proxy.js — Smart Reminder Agent v2
 * ─────────────────────────────────────────────────────────────────────────
 * Lightweight Express server that:
 *   • Sends emails via Nodemailer (SMTP)
 *   • Proxies Slack webhook calls (avoids browser CORS restrictions)
 *   • Serves the static web UI
 *
 * Usage:
 *   npm install express nodemailer cors dotenv
 *   node server/smtp-proxy.js
 *
 * Environment variables (.env):
 *   PORT=3000
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your@gmail.com
 *   SMTP_PASS=your_app_password
 *   SMTP_FROM=Smart Reminders <your@gmail.com>
 *   ALLOWED_ORIGIN=http://localhost:3000
 */

'use strict';

require('dotenv').config();

const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');
const https      = require('https');
const http       = require('http');
const url        = require('url');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));   // serve /index.html etc.

// ── NODEMAILER TRANSPORT ──────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  tls: { rejectUnauthorized: false }
});

// ── ROUTES ────────────────────────────────────────────────────────────────────

/**
 * POST /api/send-email
 * Body: { to, subject, body, html? }
 */
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body, html } = req.body;

  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing required fields: to, subject' });
  }

  // Basic email validation
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const recipients = Array.isArray(to) ? to : [to];
  if (!recipients.every(r => emailRe.test(r))) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const info = await transporter.sendMail({
      from:    process.env.SMTP_FROM || process.env.SMTP_USER,
      to:      recipients.join(', '),
      subject: subject,
      text:    body || '',
      html:    html || undefined
    });

    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[Email] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/send-slack
 * Body: { webhookUrl, payload }
 */
app.post('/api/send-slack', async (req, res) => {
  const { webhookUrl, payload } = req.body;

  if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
    return res.status(400).json({ error: 'Invalid Slack webhook URL' });
  }

  try {
    const result = await slackPost(webhookUrl, payload);
    console.log(`[Slack] Posted: ${result}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[Slack] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/test-email
 * Verifies SMTP connection
 */
app.post('/api/test-email', async (req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// ── HELPER: POST to Slack webhook ─────────────────────────────────────────────

function slackPost(webhookUrl, payload) {
  return new Promise((resolve, reject) => {
    const data   = JSON.stringify(payload);
    const parsed = url.parse(webhookUrl);

    const options = {
      hostname: parsed.hostname,
      path:     parsed.path,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) resolve(body);
        else reject(new Error(`Slack returned ${res.statusCode}: ${body}`));
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── START ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🔔 Smart Reminder Agent v2 — Server running`);
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → SMTP: ${process.env.SMTP_HOST || 'not configured'}`);
  console.log(`   → Press Ctrl+C to stop\n`);
});

module.exports = app;
