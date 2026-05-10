# 🔔 Smart Reminder Agent v2

A fully upgraded, production-ready reminder management system built entirely with **HTML, CSS, and JavaScript** — featuring Email (SMTP), Slack webhook delivery, Google Calendar integration, iCal export, CSV import/export, recurring tasks, and a `--dry-run` preview mode.

Built by **Crevatec**.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Web UI Dashboard** | Dark-themed, fully responsive dashboard |
| **Email (SMTP)** | Send reminders via any SMTP server (Gmail, etc.) |
| **Slack Webhook** | Post reminders to Slack channels via Incoming Webhooks |
| **Google Calendar** | One-click export / batch HTML export for all reminders |
| **iCal Export** | Full `.ics` file with RRULE recurrence + 15min alarms |
| **CSV Import/Export** | Bulk import from CSV, export all reminders to CSV |
| **Recurring Tasks** | Daily, Weekdays, Weekly, Bi-weekly, Monthly, Custom days |
| **Dry Run Mode** | Preview all payloads (email body, Slack JSON) without sending |
| **Templates** | Reusable message templates with `{{title}}`, `{{date}}`, `{{time}}` |
| **Activity Logs** | Full history of sends, exports, and previews |
| **Priority & Tags** | High/Normal/Low priority + freeform tagging |
| **Keyboard Shortcut** | `Cmd+K` / `Ctrl+K` to focus global search |

---

## 🚀 Quick Start

### Option A — Open directly in browser (no server)

```bash
# Clone or download the project
cd smart-reminder-agent-v2

# Open index.html directly in your browser
open index.html
# or double-click index.html in your file manager
```

> All reminders are stored in **localStorage**. Email/Slack sending requires the backend proxy (Option B).

---

### Option B — With Node.js backend (full Email + Slack support)

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your SMTP and Slack settings

# 3. Start the server
npm start
# Development (auto-reload):
npm run dev

# 4. Open http://localhost:3000
```

---

## ⚙️ Configuration

### Email (Gmail SMTP)

1. Enable 2-Step Verification on your Google Account
2. Go to: **Google Account → Security → App Passwords**
3. Generate a 16-character App Password for "Mail"
4. In the app: **Channels → Email** — enter your credentials

```
SMTP Host:  smtp.gmail.com
SMTP Port:  587
Username:   your@gmail.com
Password:   (your 16-char app password)
```

### Slack Webhook

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Create App → From Scratch → Enable **Incoming Webhooks**
3. Add Webhook to your workspace, select a channel
4. Copy the webhook URL into **Channels → Slack → Webhook URL**

### Other SMTP Providers

| Provider | Host | Port |
|---|---|---|
| Gmail | smtp.gmail.com | 587 |
| Outlook/Hotmail | smtp.office365.com | 587 |
| Yahoo | smtp.mail.yahoo.com | 465 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |

---

## 📁 Project Structure

```
smart-reminder-agent-v2/
├── index.html              # Main web UI entry point
├── package.json            # Node.js dependencies
├── .env.example            # Environment variables template
│
├── css/
│   └── main.css            # Complete stylesheet (dark theme)
│
├── js/
│   ├── data.js             # Data layer (localStorage persistence)
│   ├── utils.js            # Utility functions (CSV, date, format)
│   ├── channels.js         # Email (SMTP) + Slack webhook module
│   ├── exports.js          # Google Calendar, iCal, CSV export
│   ├── views.js            # All UI view renderers
│   └── app.js              # Application controller (main logic)
│
├── server/
│   └── smtp-proxy.js       # Node.js/Express backend for Email + Slack
│
└── data/
    └── sample-reminders.csv  # Sample CSV for import testing
```

---

## 📋 CSV Format

Import/export uses the following column structure:

```csv
title,description,date,time,category,channel,recurring,customDays,tags,email,priority
"Team Standup","Daily sync","2026-05-11","09:00","Work","slack","weekdays","","standup,work","","normal"
"Gym Workout","Exercise","2026-05-11","19:00","Health","email","custom","Mon,Wed,Fri","health","user@email.com","normal"
```

**Supported values:**
- `channel`: `email` | `slack` | `both` | `none`
- `recurring`: `none` | `daily` | `weekdays` | `weekly` | `biweekly` | `monthly` | `custom`
- `customDays`: comma-separated: `Mon,Tue,Wed,Thu,Fri,Sat,Sun`
- `category`: `Work` | `Personal` | `Health` | `Finance` | `Other`
- `priority`: `normal` | `high` | `low`

---

## 🔍 Dry Run Mode (`--dry-run`)

Dry Run mode lets you preview all email bodies and Slack payloads **without sending any messages or creating any files**.

**Enable via:**
- Sidebar toggle **"Dry Run Mode"**
- Settings page
- Per-reminder: click the **Preview (Dry Run)** button when editing

When active:
- A yellow `👁 DRY RUN` badge appears in the top bar
- All "Send" actions show the full payload preview instead
- Log entries are marked as `dry`

---

## 📅 iCal Export

Generates a standards-compliant `.ics` file with:
- `BEGIN:VCALENDAR` / `VEVENT` blocks
- `RRULE` recurrence rules for recurring tasks
- `VALARM` components (15-minute reminder)
- `PRIORITY` field
- `CATEGORIES` field

Compatible with: Google Calendar, Apple Calendar, Outlook, Thunderbird, Fastmail.

---

## 🗓 Google Calendar Export

Two modes:
1. **Single reminder**: click the 📅 icon on any reminder → opens Google Calendar pre-filled
2. **Bulk export**: Export → Google Calendar → downloads an HTML file with one-click "Add to Google Calendar" buttons for every reminder

---

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (custom properties, grid, flexbox), ES2020 JavaScript
- **Backend** (optional): Node.js 16+, Express 4, Nodemailer, dotenv
- **Storage**: Browser `localStorage` (client-side) — no database required
- **Fonts**: DM Sans + DM Mono (Google Fonts)
- **No frameworks, no build tools** — works directly in any modern browser

---

## 📝 License

MIT — Built by **Crevatec**
