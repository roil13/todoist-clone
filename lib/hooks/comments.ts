"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as repo from "@/lib/local/repo";

export function useComments(target: { taskId?: string; projectId?: string }) {
  const key = target.taskId ?? target.projectId ?? "";
  return useQuery({
    queryKey: ["comments", key],
    queryFn: () => repo.listComments(target),
    enabled: !!(target.taskId || target.projectId),
  });
}

export function useAddComment(target: { taskId?: string; projectId?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, files }: { content: string; files: File[] }) => {
      const bufs = await Promise.all(
        files.map(async (f) => ({ buffer: await f.arrayBuffer(), name: f.name, type: f.type || "application/octet-stream" })),
      );
      return repo.addComment({ taskId: target.taskId, projectId: target.projectId, content, files: bufs });
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
    mutationFn: (id: string) => repo.deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
