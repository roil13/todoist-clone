"use client";

import { useState } from "react";
import { Bell, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useReminders, useCreateReminder, useDeleteReminder } from "@/lib/hooks/reminders";
import { useT } from "@/lib/i18n";

export function Reminders({ taskId, hasDateTime }: { taskId: string; hasDateTime: boolean }) {
  const t = useT();
  const { data: reminders } = useReminders(taskId);
  const create = useCreateReminder(taskId);
  const del = useDeleteReminder(taskId);
  const [adding, setAdding] = useState(false);
  const [absolute, setAbsolute] = useState("");

  const RELATIVE_OPTIONS = [
    { label: t("reminders.opt.atTime"), minutes: 0 },
    { label: t("reminders.opt.10"), minutes: 10 },
    { label: t("reminders.opt.30"), minutes: 30 },
    { label: t("reminders.opt.60"), minutes: 60 },
    { label: t("reminders.opt.1440"), minutes: 1440 },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-muted">
        <Bell size={14} /> {t("reminders.title")}
      </div>

      {(reminders ?? []).map((r) => (
        <div key={r.id} className="group flex items-center gap-2 rounded border border-border px-2 py-1 text-sm">
          <span className="flex-1">
            {r.type === "ABSOLUTE" && r.triggerAt
              ? format(new Date(r.triggerAt), "MMM d, HH:mm")
              : r.offsetMinutes === 0
                ? t("reminders.atTime")
                : t("reminders.beforeDue", { n: r.offsetMinutes ?? 0 })}
          </span>
          <button onClick={() => del.mutate(r.id)} className="text-text-muted opacity-0 hover:text-[#d1453b] group-hover:opacity-100" aria-label={t("aria.deleteReminder")}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 rounded border border-border p-2">
          {hasDateTime && (
            <div>
              <p className="mb-1 text-xs text-text-muted">{t("reminders.relativeTo")}</p>
              <div className="flex flex-wrap gap-1">
                {RELATIVE_OPTIONS.map((o) => (
                  <button
                    key={o.minutes}
                    onClick={async () => {
                      await create.mutateAsync({ type: "RELATIVE", offsetMinutes: o.minutes });
                      setAdding(false);
                    }}
                    className="rounded border border-border px-1.5 py-0.5 text-xs hover:bg-bg-hover"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-1 text-xs text-text-muted">{t("reminders.atSpecific")}</p>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={absolute}
                onChange={(e) => setAbsolute(e.target.value)}
                className="flex-1 rounded border border-border bg-bg px-2 py-1 text-sm outline-none"
              />
              <button
                onClick={async () => {
                  if (!absolute) return;
                  await create.mutateAsync({ type: "ABSOLUTE", triggerAt: new Date(absolute).toISOString() });
                  setAbsolute("");
                  setAdding(false);
                }}
                className="rounded-md bg-accent px-2 py-1 text-sm font-semibold text-white"
              >
                {t("common.add")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-sm text-text-muted hover:text-accent">
          <Plus size={13} /> {t("reminders.add")}
        </button>
      )}
    </div>
  );
}
