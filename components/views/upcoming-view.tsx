"use client";

import { useMemo } from "react";
import { useTasks } from "@/lib/hooks/tasks";
import { TaskList } from "@/components/task/task-list";
import { useT, useDateFormat } from "@/lib/i18n";
import type { TaskDTO } from "@/lib/types";

export function UpcomingView() {
  const t = useT();
  const { formatDayHeading } = useDateFormat();
  const { data: tasks, isLoading } = useTasks({ view: "upcoming" });

  const groups = useMemo(() => {
    const map = new Map<string, { date: Date; tasks: TaskDTO[] }>();
    (tasks ?? []).forEach((t) => {
      const iso = t.dueDate ?? t.dueDatetime;
      if (!iso) return;
      const d = new Date(iso);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { date: d, tasks: [] });
      map.get(key)!.tasks.push(t);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-4 text-xl font-bold">{t("upcoming.title")}</h1>
      {isLoading ? (
        <p className="text-sm text-text-muted">{t("common.loading")}</p>
      ) : groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          {t("upcoming.empty")}
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, group]) => (
            <section key={key}>
              <h2 className="mb-1 border-b border-border pb-1 text-sm font-semibold">
                {formatDayHeading(group.date)}
              </h2>
              <TaskList tasks={group.tasks} showProject sortable={false} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
