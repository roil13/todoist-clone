"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { en, type MessageKey, type Messages } from "./messages/en";
import { he } from "./messages/he";
import {
  type Locale,
  dirFor,
  dateFnsLocale,
  LOCALE_COOKIE,
} from "./config";
import { formatDueDate as fmtDue, formatDayHeading as fmtHeading } from "@/lib/date";

const MESSAGES: Record<Locale, Messages> = { en, he };

type Vars = Record<string, string | number>;

function translate(messages: Messages, key: MessageKey, vars?: Vars): string {
  let s: string = messages[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Vars) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
    } catch {}
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Vars) => translate(MESSAGES[locale], key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

export function useLocale() {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}

/** Localized date formatters bound to the current locale. */
export function useDateFormat() {
  const { locale, t } = useI18n();
  return useMemo(() => {
    const opts = {
      dateLocale: dateFnsLocale(locale),
      labels: {
        today: t("date.today"),
        tomorrow: t("date.tomorrow"),
        yesterday: t("date.yesterday"),
      },
    };
    return {
      formatDueDate: (dueDate: string | null, dueDatetime: string | null) =>
        fmtDue(dueDate, dueDatetime, opts),
      formatDayHeading: (d: Date) => fmtHeading(d, opts),
    };
  }, [locale, t]);
}
