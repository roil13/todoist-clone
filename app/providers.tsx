"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { I18nProvider } from "@/lib/i18n";
import { SyncProvider } from "@/components/sync-provider";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => {});
    }
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Local-first: data is on-device, so refetch is cheap and keeps the
            // UI consistent after sync writes.
            staleTime: 5_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <SyncProvider>{children}</SyncProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
