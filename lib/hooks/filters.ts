"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as repo from "@/lib/local/repo";
import type { FilterDTO } from "@/lib/types";

export function useFilters() {
  return useQuery({ queryKey: ["filters"], queryFn: () => repo.listFilters() });
}

export function useCreateFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; query: string; color?: string; isFavorite?: boolean }) => repo.createFilter(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["filters"] }),
  });
}

export function useUpdateFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<FilterDTO> & { id: string }) => repo.updateFilter(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["filters"] }),
  });
}

export function useDeleteFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteFilter(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["filters"] }),
  });
}
