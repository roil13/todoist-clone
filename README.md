# Tasks — a Todoist clone

A single-user personal task manager that recreates Todoist's **Pro** feature set
(minus AI and the inherently collaborative features). It's a **local-first PWA**:
runs fully offline on each device (data in IndexedDB) and syncs across devices
through your own **Google Drive**. No server, no database service.

## Features

- **Tasks** with priorities (P1–P4), descriptions, sub-tasks, due dates and durations
- **Quick Add** with natural-language parsing — `report tomorrow 5pm #Work @urgent p1 every weekday`
- **Recurring tasks** (`every day`, `every 3 weeks`, `every monday`, `every weekday`…) that roll forward on completion
- **Projects** with colors, nesting (sub-projects), sections, favorites and archive
- **Views**: Inbox, Today, Upcoming, plus per-project **List / Board (kanban) / Calendar** with drag-to-reschedule
- **Labels** and **custom Filters** with a Todoist-style query language (`today & p1`, `overdue`, `@urgent | #Work`, `7 days`, `no date`…)
- **Comments** with **file attachments** on tasks and projects
- **Reminders** (absolute + relative) with in-app notifications
- **Productivity**: Karma, streaks, daily/weekly goals, completion chart
- **Activity** history log
- **Backups** (JSON export/import) and project **templates** (duplicate / export / instantiate)
- **Themes** (Light, Dark, Kraft, Moonstone), command menu (⌘K), keyboard shortcuts, PWA install, drag-and-drop everywhere
- **Bilingual (English / עברית)** with full RTL layout — switch language in Settings; Quick Add understands Hebrew dates/recurrence (מחר, כל יום, כל שני…)

## Tech stack

Next.js 16 (App Router, static export) · React 19 · TypeScript · Tailwind v4 ·
TanStack Query · **Dexie/IndexedDB** (on-device store) · dnd-kit · chrono-node ·
rrule · Vitest + Playwright.

- **Data:** local-first in IndexedDB (`lib/local/*`); no server or DB service.
- **Sync:** last-write-wins merge of one `tasks.json` in the user's **Google Drive**
  (`drive.appdata`, browser OAuth) — `lib/sync/*`.

## Platforms (laptop + phone + PC, synced)

Install the **PWA** on each device (from the GitHub Pages URL); each runs offline
against its own IndexedDB and syncs opportunistically through your Google Drive
(on launch, focus, reconnect, and a 60s interval), with an offline banner.

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the full setup (GitHub Pages, the
Google OAuth client, install steps, and the cross-device sync acceptance test).

## Getting started

```bash
npm install
npx prisma migrate dev      # creates dev.db
npm run db:seed             # optional: demo@example.com / demo1234
npm run dev                 # http://localhost:3000
```

Create an account at `/register`, or use the seeded demo user.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Vitest unit tests (parsers, recurrence, filters) |
| `npm run db:seed` | Seed a demo user with sample data |
| `npm run smoke` | Playwright smoke test (dev server must be running) |

Phase-specific browser smoke tests live in `scripts/smoke-p2.mjs`, `smoke-p3.mjs`,
`smoke-p4.mjs` (require `npx playwright install chromium`).

## Keyboard shortcuts

- `q` — Quick Add
- `⌘K` / `Ctrl+K` — Command menu

## Internationalization (i18n)

Lightweight custom i18n (no route restructuring). Locale lives in a `locale`
cookie; `app/layout.tsx` sets `<html lang dir>` server-side (no RTL flash).
Client components use `useT()` from `lib/i18n`; server components use
`getServerT()` from `lib/i18n/server`. Messages: `lib/i18n/messages/{en,he}.ts`
(a Vitest test enforces key parity). RTL uses Tailwind logical utilities
(`ms/me/ps/pe/start/end`) plus `rtl:` variants. To add a language: add a `Locale`
in `lib/i18n/config.ts` and a messages file.

## Notes & scope

Single-user by design — no sharing, assignees, or team features. Reminders fire
while the app is open (background web-push would need a service worker + VAPID).
Time zones use the server/local calendar day; full per-user TZ handling is a known
follow-up.
