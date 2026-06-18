import { RRule } from "rrule";

export type RecurrenceResult = {
  nextDueDate: Date | null;
  nextDueDatetime: Date | null;
};

const HE_WEEKDAYS: Record<string, string> = {
  "ראשון": "SU",
  "שני": "MO",
  "שלישי": "TU",
  "רביעי": "WE",
  "חמישי": "TH",
  "שישי": "FR",
  "שבת": "SA",
};

const WEEKDAYS: Record<string, string> = {
  monday: "MO",
  mon: "MO",
  tuesday: "TU",
  tue: "TU",
  tues: "TU",
  wednesday: "WE",
  wed: "WE",
  thursday: "TH",
  thu: "TH",
  thurs: "TH",
  friday: "FR",
  fri: "FR",
  saturday: "SA",
  sat: "SA",
  sunday: "SU",
  sun: "SU",
};

/**
 * Detect a natural-language recurrence phrase ("every day", "every 2 weeks",
 * "every monday", "every weekday", "every month"...) and translate it to an
 * RRULE option string. Returns the matched substring so the caller can strip it.
 */
export function parseRecurrence(
  text: string,
): { rule: string; matchText: string } | null {
  const lower = text.toLowerCase();

  // every weekday
  let m = lower.match(/\bevery\s+weekday(s)?\b/);
  if (m) return { rule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", matchText: m[0] };

  // daily / weekly / monthly / yearly keywords
  m = lower.match(/\b(daily|weekly|monthly|yearly|annually)\b/);
  if (m) {
    const map: Record<string, string> = {
      daily: "FREQ=DAILY",
      weekly: "FREQ=WEEKLY",
      monthly: "FREQ=MONTHLY",
      yearly: "FREQ=YEARLY",
      annually: "FREQ=YEARLY",
    };
    return { rule: map[m[1]], matchText: m[0] };
  }

  // every <weekday>
  const wdNames = Object.keys(WEEKDAYS).join("|");
  m = lower.match(new RegExp(`\\bevery\\s+(${wdNames})\\b`));
  if (m) return { rule: `FREQ=WEEKLY;BYDAY=${WEEKDAYS[m[1]]}`, matchText: m[0] };

  // every [N] day|week|month|year(s)
  m = lower.match(/\bevery\s+(\d+\s+)?(day|week|month|year)s?\b/);
  if (m) {
    const interval = m[1] ? parseInt(m[1].trim(), 10) : 1;
    const freq = { day: "DAILY", week: "WEEKLY", month: "MONTHLY", year: "YEARLY" }[m[2]];
    const rule = interval > 1 ? `FREQ=${freq};INTERVAL=${interval}` : `FREQ=${freq}`;
    return { rule, matchText: m[0] };
  }

  return parseRecurrenceHebrew(text);
}

/** Hebrew recurrence phrases ("כל יום", "כל שני", "ימי חול", "כל 3 שבועות"). */
function parseRecurrenceHebrew(
  text: string,
): { rule: string; matchText: string } | null {
  // weekdays: "ימי חול" / "כל יום עבודה" / "כל יום חול"
  let m = text.match(/(?:כל\s+יום\s+(?:עבודה|חול)|ימי\s+חול)/);
  if (m) return { rule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", matchText: m[0] };

  // every <weekday>: "כל יום שני" / "כל שני"
  const heNames = Object.keys(HE_WEEKDAYS).join("|");
  m = text.match(new RegExp(`כל\\s+(?:יום\\s+)?(${heNames})`));
  if (m) return { rule: `FREQ=WEEKLY;BYDAY=${HE_WEEKDAYS[m[1]]}`, matchText: m[0] };

  // "כל יומיים" (every two days)
  m = text.match(/כל\s+יומיים/);
  if (m) return { rule: "FREQ=DAILY;INTERVAL=2", matchText: m[0] };

  // "כל N ימים/שבועות/חודשים/שנים"
  m = text.match(/כל\s+(\d+)\s+(ימים|שבועות|חודשים|שנים)/);
  if (m) {
    const interval = parseInt(m[1], 10);
    const freq = { "ימים": "DAILY", "שבועות": "WEEKLY", "חודשים": "MONTHLY", "שנים": "YEARLY" }[m[2]]!;
    const rule = interval > 1 ? `FREQ=${freq};INTERVAL=${interval}` : `FREQ=${freq}`;
    return { rule, matchText: m[0] };
  }

  // "כל יום/שבוע/חודש/שנה"
  m = text.match(/כל\s+(יום|שבוע|חודש|שנה)/);
  if (m) {
    const freq = { "יום": "DAILY", "שבוע": "WEEKLY", "חודש": "MONTHLY", "שנה": "YEARLY" }[m[1]]!;
    return { rule: `FREQ=${freq}`, matchText: m[0] };
  }

  return null;
}

function buildRule(ruleString: string, dtstart: Date): RRule {
  const opts = RRule.parseString(ruleString);
  opts.dtstart = dtstart;
  return new RRule(opts);
}

/** The first occurrence on or after `from` (used when a recurring task has no explicit date). */
export function firstOccurrence(ruleString: string, from: Date): Date | null {
  const rule = buildRule(ruleString, from);
  return rule.after(from, true);
}

/** The next occurrence strictly after the current due date (used on completion). */
export function nextOccurrence(
  ruleString: string,
  currentDue: Date | null,
): RecurrenceResult {
  const base = currentDue ?? new Date();
  const hasTime =
    !!currentDue &&
    (currentDue.getUTCHours() !== 0 ||
      currentDue.getUTCMinutes() !== 0 ||
      currentDue.getUTCSeconds() !== 0);
  try {
    const rule = buildRule(ruleString, base);
    const next = rule.after(base, false);
    if (!next) return { nextDueDate: null, nextDueDatetime: null };
    const dateOnly = new Date(
      Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate()),
    );
    return {
      nextDueDate: dateOnly,
      nextDueDatetime: hasTime ? next : null,
    };
  } catch {
    return { nextDueDate: null, nextDueDatetime: null };
  }
}

/** Human-readable summary of a stored RRULE string, for UI display. */
export function describeRecurrence(ruleString: string | null): string | null {
  if (!ruleString) return null;
  try {
    const rule = new RRule(RRule.parseString(ruleString));
    return rule.toText();
  } catch {
    return null;
  }
}
