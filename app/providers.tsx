"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { I18nProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export function Providers({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep devices in sync against the shared backend: refetch on focus,
            // on reconnect, and on a background interval.
            staleTime: 10_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchInterval: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
