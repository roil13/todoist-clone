import * as chrono from "chrono-node";
import { parseRecurrence, firstOccurrence } from "@/lib/recurrence";

export type ParsedQuickAdd = {
  content: string;
  dueDate: string | null; // ISO, midnight UTC
  dueDatetime: string | null; // ISO, when a time is given
  dueString: string | null;
  priority: number; // 1..4
  labelNames: string[];
  projectName: string | null;
  recurrenceRule: string | null;
};

function dateOnlyISO(d: Date): string {
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
  ).toISOString();
}

/**
 * Parse Quick Add text the way Todoist does: natural-language dates,
 * `#project`, `@label`, `p1`-`p4` priority, and recurrence ("every monday").
 * Pure and isomorphic — used for the live preview (client) and creation (server).
 */
export function parseQuickAdd(input: string, refDate = new Date()): ParsedQuickAdd {
  let text = ` ${input} `;

  // Priority: p1..p4 or !!1..!!4
  let priority = 4;
  const prio = text.match(/\s(?:p([1-4])|!!([1-4]))(?=\s)/i);
  if (prio) {
    priority = Number(prio[1] ?? prio[2]);
    text = text.replace(prio[0], " ");
  }

  // Labels: @name
  const labelNames: string[] = [];
  text = text.replace(/\s@([\p{L}\d_-]+)/gu, (_m, name) => {
    labelNames.push(name);
    return " ";
  });

  // Project: #name (first one wins)
  let projectName: string | null = null;
  const proj = text.match(/\s#([\p{L}\d_-]+)/u);
  if (proj) {
    projectName = proj[1];
    text = text.replace(proj[0], " ");
  }

  // Recurrence (English + Hebrew)
  let recurrenceRule: string | null = null;
  let recurrenceText: string | null = null;
  const rec = parseRecurrence(text);
  if (rec) {
    recurrenceRule = rec.rule;
    recurrenceText = rec.matchText;
    text = text.replace(new RegExp(rec.matchText, "i"), " ");
  }

  // Hebrew relative date words (chrono-node has no Hebrew). Strip and remember.
  const HE_DAY_OFFSET: Record<string, number> = {
    "היום": 0,
    "מחר": 1,
    "מחרתיים": 2,
    "אתמול": -1,
  };
  let heBase: Date | null = null;
  const heMatch = text.match(/(מחרתיים|מחר|היום|אתמול)/);
  if (heMatch) {
    heBase = new Date(refDate);
    heBase.setDate(heBase.getDate() + HE_DAY_OFFSET[heMatch[1]]);
    heBase.setHours(0, 0, 0, 0);
    text = text.replace(heMatch[0], " ");
  }

  // Date/time via chrono (handles English dates and language-agnostic times like 17:00).
  let dueDate: string | null = null;
  let dueDatetime: string | null = null;
  let dueString: string | null = null;
  const results = chrono.parse(text, refDate, { forwardDate: true });
  if (results.length) {
    const r = results[0];
    const d = r.start.date();
    const hasTime = r.start.isCertain("hour");
    if (heBase) {
      // Hebrew date wins for the day; chrono supplies the time if present.
      if (hasTime) {
        heBase.setHours(d.getHours(), d.getMinutes(), 0, 0);
        dueDatetime = heBase.toISOString();
      }
      dueDate = dateOnlyISO(heBase);
      dueString = (heMatch![0] + (hasTime ? ` ${r.text}` : "")).trim();
    } else {
      dueString = r.text;
      dueDate = dateOnlyISO(d);
      if (hasTime) dueDatetime = d.toISOString();
    }
    text = text.replace(r.text, " ");
  } else if (heBase) {
    dueDate = dateOnlyISO(heBase);
    dueString = heMatch![0];
  }

  // Recurring task with no explicit start date → first upcoming occurrence.
  if (recurrenceRule && !dueDate && !dueDatetime) {
    const first = firstOccurrence(recurrenceRule, refDate);
    if (first) dueDate = dateOnlyISO(first);
  }

  if (recurrenceText) {
    dueString = dueString ? `${dueString}, ${recurrenceText}` : recurrenceText;
  }

  const content = text.replace(/\s+/g, " ").trim();
  return {
    content,
    dueDate,
    dueDatetime,
    dueString,
    priority,
    labelNames,
    projectName,
    recurrenceRule,
  };
}
