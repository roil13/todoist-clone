// Browser OAuth via Google Identity Services (GIS) token client.
// Scope is limited to the app's own hidden Drive folder (drive.appdata).
// Access tokens are short-lived and kept in memory only; we persist a
// "connected" flag and silently re-acquire a token on load/expiry.

const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const CONNECTED_KEY = "drive-connected";

type TokenResponse = { access_token?: string; expires_in?: number; error?: string };
type TokenClient = { requestAccessToken: (o?: { prompt?: string }) => void; callback: (r: TokenResponse) => void; error_callback?: (e: unknown) => void };

interface GoogleGlobal {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: unknown) => void }) => TokenClient;
      revoke: (token: string, done?: () => void) => void;
    };
  };
}
declare global {
  interface Window { google?: { accounts?: GoogleGlobal["accounts"] } }
}

let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;
let expiresAt = 0;
let pending: { resolve: (t: string) => void; reject: (e: unknown) => void } | null = null;

export function isConfigured(): boolean {
  return !!CLIENT_ID;
}
export function isConnected(): boolean {
  try { return localStorage.getItem(CONNECTED_KEY) === "1"; } catch { return false; }
}

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gis]');
    if (existing) { existing.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.dataset.gis = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(s);
  });
}

async function ensureClient(): Promise<TokenClient> {
  if (!CLIENT_ID) throw new Error("Google client ID not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID).");
  await loadGis();
  if (!tokenClient) {
    tokenClient = window.google!.accounts!.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) {
          pending?.reject(new Error(r.error || "Authorization failed"));
        } else {
          accessToken = r.access_token;
          expiresAt = Date.now() + (r.expires_in ?? 3600) * 1000;
          try { localStorage.setItem(CONNECTED_KEY, "1"); } catch {}
          pending?.resolve(accessToken);
        }
        pending = null;
      },
      error_callback: (e) => { pending?.reject(e); pending = null; },
    });
  }
  return tokenClient;
}

/** Get a valid access token, optionally prompting the user for consent. */
export async function getAccessToken(interactive = false): Promise<string> {
  if (accessToken && Date.now() < expiresAt - 60_000) return accessToken;
  const client = await ensureClient();
  return new Promise<string>((resolve, reject) => {
    pending = { resolve, reject };
    try {
      client.requestAccessToken({ prompt: interactive ? "consent" : "" });
    } catch (e) {
      pending = null;
      reject(e);
    }
  });
}

export async function connect(): Promise<void> {
  await getAccessToken(true);
}

export function disconnect(): void {
  if (accessToken) { try { window.google?.accounts?.oauth2.revoke(accessToken); } catch {} }
  accessToken = null;
  expiresAt = 0;
  try { localStorage.removeItem(CONNECTED_KEY); } catch {}
}
