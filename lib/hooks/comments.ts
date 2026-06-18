"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { CommentDTO } from "@/lib/types";

export function useComments(target: { taskId?: string; projectId?: string }) {
  const params = new URLSearchParams();
  if (target.taskId) params.set("taskId", target.taskId);
  if (target.projectId) params.set("projectId", target.projectId);
  const key = params.toString();
  return useQuery({
    queryKey: ["comments", key],
    queryFn: () => api.get<CommentDTO[]>(`/api/comments?${key}`),
    enabled: !!(target.taskId || target.projectId),
  });
}

export function useAddComment(target: { taskId?: string; projectId?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, files }: { content: string; files: File[] }) => {
      const form = new FormData();
      form.set("content", content);
      if (target.taskId) form.set("taskId", target.taskId);
      if (target.projectId) form.set("projectId", target.projectId);
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/comments", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to add comment");
      }
      return (await res.json()) as CommentDTO;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/comments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
