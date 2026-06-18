"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as repo from "@/lib/local/repo";

export function useSections(projectId: string | undefined) {
  return useQuery({
    queryKey: ["sections", projectId],
    queryFn: () => repo.listSections(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; projectId: string }) => repo.createSection(input),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["sections", v.projectId] }),
  });
}

export function useUpdateSection(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; isCollapsed?: boolean }) => repo.updateSection(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections", projectId] }),
  });
}

export function useDeleteSection(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteSection(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sections", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
