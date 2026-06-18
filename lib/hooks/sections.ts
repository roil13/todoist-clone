"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { SectionDTO } from "@/lib/types";

export function useSections(projectId: string | undefined) {
  return useQuery({
    queryKey: ["sections", projectId],
    queryFn: () => api.get<SectionDTO[]>(`/api/sections?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; projectId: string }) =>
      api.post<SectionDTO>("/api/sections", input),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["sections", v.projectId] }),
  });
}

export function useUpdateSection(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; isCollapsed?: boolean }) =>
      api.patch<SectionDTO>(`/api/sections/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections", projectId] }),
  });
}

export function useDeleteSection(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/sections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sections", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
