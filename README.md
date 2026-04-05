# Office Chores

An internal web app to manage office chores — calendar view, recurring schedules, team assignment, and Slack/Teams notifications.

## Quick Start

### Prerequisites
- Node.js 18+
- No Python or build tools needed (uses WASM-based SQLite)

### Install & Run

```bash
# Install all dependencies (root + server + client)
cd office-chores
npm install
npm run install:all

# Start both server and client in development mode
npm run dev
```

- **Client**: http://localhost:5173
- **API**: http://localhost:3001

The SQLite database is created automatically at `server/data/chores.db` on first run.

---

## Features

- **Month calendar view** — see all chores color-coded by status
  - Gray: unassigned
  - Blue: assigned/pending
  - Green: completed
  - Red: overdue
- **Add/edit/remove chores** with recurrence: daily, weekly, monthly, or custom interval
- **Assign chores** to team members per occurrence
- **Mark done** — only the assigned person can confirm completion
- **Team management** — add/remove members from the Team panel
- **In-app notifications** — bell icon shows unread alerts, polls every 60s
- **Slack & Teams webhooks** — alerts for reminders (day before), overdue, and completions
- **Daily scheduler** — runs at 7 AM to generate occurrences 60 days ahead and mark overdue

---

## Configuration

Open **Settings** in the top bar to set webhook URLs:

- **Slack**: create an Incoming Webhook at https://api.slack.com/messaging/webhooks
- **Microsoft Teams**: create an Incoming Webhook connector in your Teams channel

---

## Manual Scheduler Trigger (for testing)

In Settings, click **"Trigger scheduler now"** or call:

```bash
curl -X POST http://localhost:3001/api/scheduler/run
```

---

## Project Structure

```
office-chores/
├── client/          # React + Vite + TypeScript frontend
├── server/          # Node.js + Express + TypeScript API
│   └── data/        # SQLite database (auto-created)
└── package.json     # Root scripts (concurrently)
```
