"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { LabelDTO } from "@/lib/types";

export function useLabels() {
  return useQuery({
    queryKey: ["labels"],
    queryFn: () => api.get<LabelDTO[]>("/api/labels"),
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: string; isFavorite?: boolean }) =>
      api.post<LabelDTO>("/api/labels", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
}

export function useUpdateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<LabelDTO> & { id: string }) =>
      api.patch<LabelDTO>(`/api/labels/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labels"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/labels/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labels"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
