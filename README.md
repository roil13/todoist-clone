# Tasks — a Todoist clone

A single-user personal task manager that recreates Todoist's **Pro** feature set
(minus AI and the inherently collaborative features). Built with Next.js, Prisma,
and SQLite.

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

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · TanStack Query ·
Prisma 6 (driver adapters) · NextAuth v5 (credentials) · dnd-kit · chrono-node · rrule · Vitest + Playwright.

- **Local dev:** SQLite file via Prisma's default engine (zero-config).
- **Production:** one shared deployment on **Cloudflare** — Workers (via OpenNext) + **D1** (SQLite, via Prisma's D1 driver adapter) + **R2** (attachments).

## Platforms (Windows + Android + Web, synced)

All three load the **same Cloudflare deployment**, so they share one account/dataset;
cross-device freshness comes from React Query refetch (focus + 30s interval + reconnect),
with an offline banner for cached viewing.

- **Web** — the deployed site.
- **Windows** — Tauri shell (`src-tauri/`) loading the deployed URL.
- **Android** — Capacitor shell (`capacitor.config.ts`) loading the deployed URL.

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the full setup (Cloudflare resources,
GitHub Actions deploy, native builds, and the first-deploy verification checklist).

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
