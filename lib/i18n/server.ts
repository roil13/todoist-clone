import "server-only";
import { cookies } from "next/headers";
import { en, type MessageKey, type Messages } from "./messages/en";
import { he } from "./messages/he";
import { type Locale, isLocale, DEFAULT_LOCALE, LOCALE_COOKIE } from "./config";

const MESSAGES: Record<Locale, Messages> = { en, he };

type Vars = Record<string, string | number>;

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getServerT() {
  const locale = await getLocale();
  const messages = MESSAGES[locale];
  const t = (key: MessageKey, vars?: Vars): string => {
    let s: string = messages[key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, locale };
}
