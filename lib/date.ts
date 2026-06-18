import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isThisYear,
  isPast,
  startOfDay,
} from "date-fns";
import { enUS } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";

export type DateLabels = { today: string; tomorrow: string; yesterday: string };

const DEFAULT_LABELS: DateLabels = { today: "Today", tomorrow: "Tomorrow", yesterday: "Yesterday" };

type Opts = { dateLocale?: DateFnsLocale; labels?: DateLabels };

export function formatDueDate(
  dueDate: string | null,
  dueDatetime: string | null,
  opts: Opts = {},
): { label: string; isOverdue: boolean; isToday: boolean } | null {
  const locale = opts.dateLocale ?? enUS;
  const labels = opts.labels ?? DEFAULT_LABELS;
  const iso = dueDatetime ?? dueDate;
  if (!iso) return null;
  const d = new Date(iso);
  const hasTime = !!dueDatetime;

  let label: string;
  if (isToday(d)) label = labels.today;
  else if (isTomorrow(d)) label = labels.tomorrow;
  else if (isYesterday(d)) label = labels.yesterday;
  else if (isThisYear(d)) label = format(d, "MMM d", { locale });
  else label = format(d, "MMM d, yyyy", { locale });

  if (hasTime) label += ` ${format(d, "HH:mm", { locale })}`;

  const overdue = isPast(hasTime ? d : startOfDay(d)) && !isToday(d);
  return { label, isOverdue: overdue, isToday: isToday(d) };
}

export function formatDayHeading(d: Date, opts: Opts = {}): string {
  const locale = opts.dateLocale ?? enUS;
  const labels = opts.labels ?? DEFAULT_LABELS;
  if (isToday(d)) return `${labels.today} · ${format(d, "EEE MMM d", { locale })}`;
  if (isTomorrow(d)) return `${labels.tomorrow} · ${format(d, "EEE MMM d", { locale })}`;
  return format(d, "EEE MMM d", { locale });
}
