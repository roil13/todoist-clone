"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTasks, type TaskQuery } from "@/lib/hooks/tasks";
import { TaskList } from "@/components/task/task-list";
import { SmartQuickAdd } from "@/components/task/smart-quick-add";
import { useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";

export function ListView({
  title,
  titleKey,
  query,
  showProject = false,
  projectId,
  defaultDueDate,
  emptyKey = "view.empty",
}: {
  title?: React.ReactNode;
  titleKey?: MessageKey;
  query: TaskQuery;
  showProject?: boolean;
  projectId?: string;
  defaultDueDate?: string | null;
  emptyKey?: MessageKey;
}) {
  const t = useT();
  const { data: tasks, isLoading } = useTasks(query);
  const [adding, setAdding] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-4 text-xl font-bold">{title ?? (titleKey ? t(titleKey) : "")}</h1>

      {isLoading ? (
        <p className="text-sm text-text-muted">{t("common.loading")}</p>
      ) : tasks && tasks.length > 0 ? (
        <TaskList tasks={tasks} showProject={showProject} />
      ) : (
        <p className="py-8 text-center text-sm text-text-muted">{t(emptyKey)}</p>
      )}

      <div className="mt-3">
        {adding ? (
          <SmartQuickAdd
            projectId={projectId}
            defaultDueDate={defaultDueDate}
            onDone={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-muted hover:text-accent"
          >
            <Plus size={16} className="text-accent" />
            {t("view.addTask")}
          </button>
        )}
      </div>
    </div>
  );
}
