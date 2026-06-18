"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { TaskDTO } from "@/lib/types";

export type TaskQuery = {
  view?: "inbox" | "today" | "upcoming" | "completed";
  projectId?: string;
  labelId?: string;
  parentId?: string | null;
  search?: string;
};

function toQueryString(q: TaskQuery): string {
  const p = new URLSearchParams();
  if (q.view) p.set("view", q.view);
  if (q.projectId) p.set("projectId", q.projectId);
  if (q.labelId) p.set("labelId", q.labelId);
  if (q.search) p.set("search", q.search);
  if (q.parentId !== undefined) p.set("parentId", q.parentId === null ? "null" : q.parentId);
  return p.toString();
}

export function useTasks(q: TaskQuery, enabled = true) {
  return useQuery({
    queryKey: ["tasks", q],
    queryFn: () => api.get<TaskDTO[]>(`/api/tasks?${toQueryString(q)}`),
    enabled,
  });
}

/** Update every cached task list, applying `fn` to the matching task. */
function patchAllTaskLists(
  qc: ReturnType<typeof useQueryClient>,
  taskId: string,
  fn: (t: TaskDTO) => TaskDTO | null,
) {
  qc.getQueriesData<TaskDTO[]>({ queryKey: ["tasks"] }).forEach(([key, data]) => {
    if (!data) return;
    const next = data
      .map((t) => (t.id === taskId ? fn(t) : t))
      .filter((t): t is TaskDTO => t !== null);
    qc.setQueryData(key, next);
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<TaskDTO> & { content: string; labelIds?: string[] }) =>
      api.post<TaskDTO>("/api/tasks", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useQuickAddTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      text: string;
      projectId?: string;
      sectionId?: string | null;
      parentId?: string | null;
      defaultDueDate?: string | null;
    }) => api.post<TaskDTO>("/api/tasks/quick-add", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<TaskDTO> & { id: string; labelIds?: string[] }) =>
      api.patch<TaskDTO>(`/api/tasks/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useToggleComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      api.post<TaskDTO>(`/api/tasks/${id}/complete${completed ? "" : "?undo=true"}`),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshot = qc.getQueriesData<TaskDTO[]>({ queryKey: ["tasks"] });
      // Optimistically drop the task from active lists when completing it.
      patchAllTaskLists(qc, id, (t) => (completed ? null : { ...t, isCompleted: false }));
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshot = qc.getQueriesData<TaskDTO[]>({ queryKey: ["tasks"] });
      patchAllTaskLists(qc, id, () => null);
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      items: { id: string; order: number; sectionId?: string | null; projectId?: string }[],
    ) => api.post("/api/tasks/reorder", { items }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
