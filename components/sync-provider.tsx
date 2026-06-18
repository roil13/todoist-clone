"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as auth from "@/lib/sync/google-auth";
import { syncNow } from "@/lib/sync/engine";

export type SyncStatus = "idle" | "syncing" | "error";

type SyncContextValue = {
  configured: boolean;
  connected: boolean;
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sync: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);
const INTERVAL_MS = 60_000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const configured = auth.isConfigured();
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const sync = useCallback(async () => {
    if (running.current || !auth.isConnected() || typeof navigator !== "undefined" && !navigator.onLine) return;
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

  const connect = useCallback(async () => {
    await auth.connect();
    setConnected(true);
    await sync();
  }, [sync]);

  const disconnect = useCallback(() => {
    auth.disconnect();
    setConnected(false);
    setLastSyncedAt(null);
  }, []);

  // On load: if previously connected, re-acquire a token silently and sync.
  useEffect(() => {
    if (!configured || !auth.isConnected()) return;
    setConnected(true);
    sync();
    const onFocus = () => sync();
    const onOnline = () => sync();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    const interval = setInterval(sync, INTERVAL_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      clearInterval(interval);
    };
  }, [configured, sync]);

  return (
    <SyncContext.Provider value={{ configured, connected, status, lastSyncedAt, error, connect, disconnect, sync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
