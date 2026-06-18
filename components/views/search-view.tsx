"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useTasks } from "@/lib/hooks/tasks";
import { TaskList } from "@/components/task/task-list";
import { useT } from "@/lib/i18n";

export function SearchView() {
  const t = useT();
  const [term, setTerm] = useState("");
  const { data: tasks, isFetching } = useTasks({ search: term }, term.trim().length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-4 text-xl font-bold">{t("search.title")}</h1>
      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2">
        <Search size={16} className="text-text-muted" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("search.placeholder")}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {term.trim().length === 0 ? (
        <p className="text-sm text-text-muted">{t("search.prompt")}</p>
      ) : isFetching ? (
        <p className="text-sm text-text-muted">{t("search.searching")}</p>
      ) : tasks && tasks.length > 0 ? (
        <TaskList tasks={tasks} showProject sortable={false} />
      ) : (
        <p className="text-sm text-text-muted">{t("search.none")}</p>
      )}
    </div>
  );
}
