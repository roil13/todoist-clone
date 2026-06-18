"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { consumeDueReminders } from "@/lib/local/misc";
import { useT } from "@/lib/i18n";

type DueReminder = { id: string; taskId: string; content: string; at: string };

/**
 * Polls for due reminders while the app is open and surfaces them as browser
 * notifications plus an in-app toast. (Background push would require a service
 * worker + VAPID; this covers reminders while a tab is open.)
 */
export function ReminderPoller() {
  const t = useT();
  const [toasts, setToasts] = useState<DueReminder[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    let active = true;
    async function poll() {
      try {
        const due = await consumeDueReminders();
        if (!active) return;
        const fresh = due.filter((d) => !seen.current.has(d.id + d.at));
        fresh.forEach((d) => {
          seen.current.add(d.id + d.at);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(t("reminder.toastTitle"), { body: d.content });
          }
        });
        if (fresh.length) setToasts((t) => [...t, ...fresh]);
      } catch {
        // ignore (e.g. logged out)
      }
    }

    poll();
    const interval = setInterval(poll, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [t]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 end-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id + toast.at}
          className="flex w-72 items-start gap-2 rounded-lg border border-border bg-bg-elevated p-3 shadow-lg"
        >
          <Bell size={16} className="mt-0.5 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t("reminder.toastTitle")}</p>
            <p className="text-sm text-text-muted">{toast.content}</p>
          </div>
          <button
            onClick={() => setToasts((cur) => cur.filter((x) => x.id + x.at !== toast.id + toast.at))}
            className="text-text-muted hover:text-text"
            aria-label={t("aria.dismiss")}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
