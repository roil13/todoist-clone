"use client";

import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@/lib/local/misc";
import { useT, useLocale } from "@/lib/i18n";
import { dateFnsLocale } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { formatDistanceToNow } from "date-fns";

export default function ActivityPage() {
  const t = useT();
  const { locale } = useLocale();
  const dl = dateFnsLocale(locale);
  const { data: events } = useQuery({ queryKey: ["activity"], queryFn: () => getActivity(150) });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 text-xl font-bold">{t("activity.title")}</h1>
      {!events || events.length === 0 ? (
        <p className="text-sm text-text-muted">{t("activity.none")}</p>
      ) : (
        <ul className="space-y-1">
          {events.map((e) => {
            const name = (e.payload.content as string) ?? (e.payload.name as string) ?? "";
            const verbKey = `activity.${e.eventType}` as MessageKey;
            return (
              <li key={e.id} className="flex items-baseline gap-2 border-b border-border py-2 text-sm">
                <span className="font-medium">{t(verbKey)}</span>
                {name && <span className="truncate text-text-muted">“{name}”</span>}
                <span className="ms-auto shrink-0 text-xs text-text-faint">
                  {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true, locale: dl })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
