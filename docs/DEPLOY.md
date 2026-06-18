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

The scope used is `drive.appdata` — the app can only see its own hidden folder,
nothing else in your Drive.

## 3. Wire the client ID

- **Production:** repo **Settings → Secrets and variables → Actions → Variables**
  → new variable `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your client ID. Re-run the Pages
  workflow. (A Google *Web* client ID is a public identifier, so a Variable is
  fine — security comes from the authorized origins.)
- **Local dev:** put it in `.env`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=…` (see `.env.example`).

## 4. Install on each device

Open the Pages URL and install:
- **Desktop (laptop/PC):** Chrome/Edge → install icon in the address bar ("Install Tasks").
- **Android:** Chrome → menu → "Add to Home screen" / "Install app".

Then in each install: **Settings → Sync → Connect Google Drive** (sign in once).

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
1. Connect Drive in both (Settings → Sync).
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
