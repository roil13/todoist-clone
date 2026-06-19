"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as auth from "@/lib/sync/google-auth";
import { forgetFile } from "@/lib/sync/drive";
import { syncNow } from "@/lib/sync/engine";

export type SyncStatus = "idle" | "syncing" | "error";
export type AuthStatus = "checking" | "unconfigured" | "signedout" | "denied" | "authorized";

type SyncContextValue = {
  authStatus: AuthStatus;
  email: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  sync: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);
const INTERVAL_MS = 60_000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const sync = useCallback(async () => {
    if (running.current || !auth.isConnected()) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    running.current = true;
    setStatus("syncing");
    setError(null);
    try {
      const changed = await syncNow();
      setLastSyncedAt(Date.now());
      setStatus("idle");
      if (changed > 0) qc.invalidateQueries();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      running.current = false;
    }
  }, [qc]);

  const signIn = useCallback(async () => {
    await auth.connect(); // interactive consent (email + drive.appdata)
    const addr = await auth.getUserEmail();
    if (!auth.isAllowed(addr)) {
      auth.disconnect();
      setAuthStatus("denied");
      setEmail(addr);
      return;
    }
    auth.cacheIdentity({ email: addr });
    setEmail(addr);
    setAuthStatus("authorized");
    void sync();
  }, [sync]);

  const signOut = useCallback(() => {
    auth.disconnect();
    forgetFile();
    setEmail(null);
    setLastSyncedAt(null);
    setAuthStatus("signedout");
  }, []);

  // Resolve initial auth state from config + cached identity.
  useEffect(() => {
    if (!auth.isConfigured()) { setAuthStatus("unconfigured"); return; }
    const cached = auth.getCachedIdentity();
    if (cached) {
      setEmail(cached.email);
      setAuthStatus("authorized");
    } else {
      setAuthStatus("signedout");
    }
  }, []);

  // Sync triggers run only while authorized.
  useEffect(() => {
    if (authStatus !== "authorized") return;
    void sync();
    const trigger = () => void sync();
    window.addEventListener("focus", trigger);
    window.addEventListener("online", trigger);
    const interval = setInterval(trigger, INTERVAL_MS);
    return () => {
      window.removeEventListener("focus", trigger);
      window.removeEventListener("online", trigger);
      clearInterval(interval);
    };
  }, [authStatus, sync]);

  return (
    <SyncContext.Provider value={{ authStatus, email, signIn, signOut, status, lastSyncedAt, error, sync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
