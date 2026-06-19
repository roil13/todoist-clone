"use client";

import { useState } from "react";
import { useSync } from "@/components/sync-provider";
import { useT } from "@/lib/i18n";

export function LoginGate() {
  const t = useT();
  const { authStatus, email, signIn } = useSync();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSignIn() {
    setBusy(true);
    setErr(null);
    try {
      await signIn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-sidebar px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-bg-elevated p-6 text-center shadow-sm">
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-lg font-bold text-white">✓</span>
          <span className="text-xl font-semibold">{t("common.appName")}</span>
        </div>

        {authStatus === "unconfigured" ? (
          <p className="text-sm text-text-muted">{t("auth.gateUnconfigured")}</p>
        ) : (
          <>
            <h1 className="mb-1 text-lg font-semibold">{t("auth.signInTitle")}</h1>
            <p className="mb-5 text-sm text-text-muted">{t("auth.signInSubtitle")}</p>
            <button
              onClick={onSignIn}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-bg px-4 py-2.5 text-sm font-medium hover:bg-bg-hover disabled:opacity-60"
            >
              <GoogleMark />
              {busy ? t("auth.signingIn") : authStatus === "denied" ? t("auth.tryAgain") : t("auth.signInWithGoogle")}
            </button>
            {authStatus === "denied" && (
              <p className="mt-3 text-sm text-accent">
                {t("auth.denied")}{email ? ` (${email})` : ""}
              </p>
            )}
            {err && <p className="mt-3 text-sm text-accent">{err}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.3 2.1-1.6 5.2-4.7 7.3l7.2 5.6c4.3-4 6.3-9.8 6.3-16.6z" />
      <path fill="#FBBC05" d="M10.3 28.4c-.5-1.5-.8-3.1-.8-4.4s.3-3 .8-4.4l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.5l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.2-5.6c-2 1.4-4.7 2.3-7.8 2.3-6.4 0-11.8-3.7-13.7-8.9l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
