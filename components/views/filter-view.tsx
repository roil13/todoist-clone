"use client";

import { useMemo } from "react";
import { useTasks } from "@/lib/hooks/tasks";
import { useProjects } from "@/lib/hooks/projects";
import { useFilters } from "@/lib/hooks/filters";
import { compileFilter, type FilterContext } from "@/lib/filters";
import { TaskList } from "@/components/task/task-list";
import { useT } from "@/lib/i18n";

export function FilterView({ filterId }: { filterId: string }) {
  const t = useT();
  const { data: filters } = useFilters();
  const { data: tasks, isLoading } = useTasks({});
  const { data: projects } = useProjects();

  const filter = filters?.find((f) => f.id === filterId);

  const results = useMemo(() => {
    if (!filter || !tasks) return [];
    const ctx: FilterContext = {
      now: new Date(),
      projectsById: new Map((projects ?? []).map((p) => [p.id, { name: p.name }])),
    };
    const pred = compileFilter(filter.query);
    return tasks.filter((t) => pred(t, ctx));
  }, [filter, tasks, projects]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-1 text-xl font-bold">{filter?.name ?? "Filter"}</h1>
      {filter && (
        <p className="mb-4 font-mono text-xs text-text-muted" dir="ltr">{filter.query}</p>
      )}
      {isLoading ? (
        <p className="text-sm text-text-muted">{t("common.loading")}</p>
      ) : results.length > 0 ? (
        <TaskList tasks={results} showProject sortable={false} />
      ) : (
        <p className="py-8 text-center text-sm text-text-muted">{t("filter.none")}</p>
      )}
    </div>
  );
}
