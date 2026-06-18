"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { FilterDTO } from "@/lib/types";

export function useFilters() {
  return useQuery({
    queryKey: ["filters"],
    queryFn: () => api.get<FilterDTO[]>("/api/filters"),
  });
}

export function useCreateFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; query: string; color?: string; isFavorite?: boolean }) =>
      api.post<FilterDTO>("/api/filters", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["filters"] }),
  });
}

export function useUpdateFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<FilterDTO> & { id: string }) =>
      api.patch<FilterDTO>(`/api/filters/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["filters"] }),
  });
}

export function useDeleteFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/filters/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["filters"] }),
  });
}
