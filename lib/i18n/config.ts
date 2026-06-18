import { enUS, he } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";

export type Locale = "en" | "he";

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "he", label: "עברית" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "he";
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

export function dateFnsLocale(locale: Locale): DateFnsLocale {
  return locale === "he" ? he : enUS;
}
