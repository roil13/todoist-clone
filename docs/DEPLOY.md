# Deploy & multi-platform setup

The app runs as **one deployment** on Cloudflare (Workers + D1 + R2). The Web,
Windows (Tauri), and Android (Capacitor) clients all load that one URL and share
one account/dataset — that's the sync.

> **Why deploy via CI?** `@opennextjs/cloudflare`'s build mis-generates the Prisma
> engine-wasm import path **on Windows**, so the build only works on Linux. The
> included GitHub Actions workflow builds + deploys on Ubuntu. Local Windows dev
> (`npm run dev`, local SQLite) is unaffected.

## Prerequisites (you install these)

- A **Cloudflare account** (free tier is fine).
- For the **Windows app**: [Rust](https://www.rust-lang.org/tools/install) (`rustup`) — Tauri needs it.
- For the **Android app**: a **JDK 17+** and Android SDK (Android Studio). `ANDROID_HOME` is already set on this machine.

## 1. Create the Cloudflare resources (once)

```bash
wrangler login                                  # opens browser; your account
wrangler d1 create todoist-clone-db             # copy the printed database_id
wrangler r2 bucket create todoist-clone-uploads
```

Put the printed **database_id** into `wrangler.toml` (replace `REPLACE_WITH_D1_DATABASE_ID`).

Apply the schema to the remote D1:

```bash
wrangler d1 migrations apply todoist-clone-db --remote
```

Set the auth secret (any long random string):

```bash
wrangler secret put AUTH_SECRET
```

## 2. Deploy

**Via GitHub Actions (recommended):** push to `main`. Add these repo secrets first
(Settings → Secrets → Actions): `CLOUDFLARE_API_TOKEN` (Workers + D1 + R2 edit
perms), `CLOUDFLARE_ACCOUNT_ID`, `AUTH_SECRET`. The workflow
(`.github/workflows/deploy.yml`) builds on Ubuntu and deploys.

**Or from WSL / any Linux shell:**

```bash
npm ci && npm run cf:deploy        # opennextjs-cloudflare build + deploy
```

Your app is now at `https://todoist-clone.<your-subdomain>.workers.dev`.

## 3. Point the native apps at the deployed URL

Replace `https://REPLACE_WITH_DEPLOYED_URL` in:
- `src-tauri/tauri.conf.json` → `app.windows[0].url`
- `capacitor.config.ts` → `server.url`

### Windows (Tauri)

```bash
npm run tauri build      # produces an .exe / MSI in src-tauri/target/release/bundle
# or: npm run tauri dev
```

### Android (Capacitor)

```bash
npx cap sync android
npx cap open android     # build/run the APK from Android Studio
# or: cd android && ./gradlew assembleDebug
```

## First-deploy verification checklist

These run on Cloudflare Workers (workerd), which can't be exercised from the
Windows dev box — verify them against the deployed URL after the first deploy:

- [ ] **Sign up + log in** work (confirms `bcryptjs` runs on Workers; if it fails,
      switch hashing in `lib/services/user.ts` + `auth.ts` to Web Crypto PBKDF2).
- [ ] **Create a project + task** (confirms Prisma + D1 query path on Workers).
- [ ] **Upload a file on a task comment**, then re-open it and download (confirms R2).
- [ ] **Cross-device sync:** add a task on phone → appears on web/Windows within ~30s
      (React Query `refetchInterval`/focus). Complete on one → drops off the others.
- [ ] **Offline banner** shows when the device drops connection.
- [ ] **Tauri window actually renders the site** (not just compiles) — Tauri 2 treats an
      external main-window `url` specially; confirm it loads + login works in the desktop window.
- [ ] **Android WebView loads the site** and login persists.

If the Workers runtime fights Prisma/D1, the documented fallback (same outcome) is
**Turso** (libSQL cloud SQLite) on a Node host (Fly.io/Railway) + Cloudflare R2 —
the Tauri/Capacitor shells just point at the new URL.
