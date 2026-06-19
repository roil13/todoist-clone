# Deploy & setup — local-first PWA + Google Drive sync

The app is a **local-first PWA**: it runs entirely on each device (data in
IndexedDB) and **syncs through your own Google Drive**. No server, no database
service. Only accounts used: **GitHub** (code + free Pages hosting) and
**Google** (Drive). No credit card.

```
Install PWA on laptop / PC / phone  →  IndexedDB (local, offline)
                                              │  last-write-wins sync
                                              ▼
                         Google Drive  appDataFolder/tasks.json (yours)
```

## 1. Host the PWA on GitHub Pages

- The repo must be **public** for free Pages.
- In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- The included workflow (`.github/workflows/pages.yml`) builds the static export
  (with `BASE_PATH=/todoist-clone`) and deploys on every push to `main`.
- App URL: **`https://roil13.github.io/todoist-clone/`**.

## 2. Create the Google OAuth client (one-time, free)

In [Google Cloud Console](https://console.cloud.google.com/):
1. Create a project (any name).
2. **APIs & Services → Library →** enable **Google Drive API**.
3. **OAuth consent screen**: External; add yourself under **Test users**.
4. **Credentials → Create credentials → OAuth client ID → Web application**.
   - **Authorized JavaScript origins**: `https://roil13.github.io` and
     `http://localhost:3000` (for local dev).
   - (No redirect URI needed — the GIS token flow uses the origin.)
5. Copy the **Client ID** (looks like `…apps.googleusercontent.com`).

Scopes used: `openid email` (to identify the signed-in account for the login
gate) and `drive.appdata` (the app's own hidden folder only — nothing else in
your Drive). `openid`/`email` are non-sensitive and need no Google verification.

> **Sign-in is required to use the app**, not just to sync. Until the client ID
> below is set, the deployed app shows a "sign-in isn't set up" screen. Only your
> Google account (a consent-screen **test user**, and — if set — in the allowlist
> below) can get in. After the first sign-in the app remembers it and opens offline.

## 3. Wire the client ID (and optional allowlist)

- **Production:** repo **Settings → Secrets and variables → Actions → Variables** →
  add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your client ID. Optionally add
  `NEXT_PUBLIC_ALLOWED_EMAILS` = your email(s), comma-separated, to hard-restrict
  who may sign in (empty = any consent-screen test user). Re-run the Pages workflow.
  (A Google *Web* client ID is a public identifier — security comes from the
  authorized origins + consent-screen test users — so a Variable is fine.)
- **Local dev:** set the same in `.env` (see `.env.example`).

## 4. Install on each device

Open the Pages URL and install:
- **Desktop (laptop/PC):** Chrome/Edge → install icon in the address bar ("Install Tasks").
- **Android:** Chrome → menu → "Add to Home screen" / "Install app".

Then **Sign in with Google** on the gate — that single sign-in both unlocks the
app and connects Drive sync. (Settings → Sync shows the account + "Sign out".)

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000  (basePath only applies to the prod build)
```

`npm test` runs the unit suite (parsers, recurrence, filters, i18n parity, sync
merge). `npm run smoke` runs the offline-app Playwright check (dev server must be
up).

## Verify sync (acceptance test)

With the client ID set, open the app in **two browser profiles** (= two
"devices") signed into the **same** Google account:
1. Sign in with Google on the gate in both.
2. Add a task in profile A → it appears in B within ~60s (or hit "Sync now").
3. Delete it in B → the tombstone removes it in A.
4. Go offline in A, edit, come back online → the change flushes on next sync.

## Notes / scope

- **Attachments are local-only** in v1 (blobs stay on the device that added them;
  comment text + metadata sync). Syncing blobs as separate Drive files is a follow-up.
- Sync is **last-write-wins** per record (fine for single-user across devices);
  no real-time push.
- Access tokens are kept in memory only; a "connected" flag in localStorage lets
  the app silently re-acquire a token on launch.
- **Login is a wall, not at-rest encryption.** It keeps strangers out of the app
  and binds it to your Google account; it does **not** encrypt local data, so a
  person on your already-unlocked device could still read IndexedDB via devtools.
