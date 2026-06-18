"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as repo from "@/lib/local/repo";
import type { LabelDTO } from "@/lib/types";

export function useLabels() {
  return useQuery({ queryKey: ["labels"], queryFn: () => repo.listLabels() });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: string; isFavorite?: boolean }) => repo.createLabel(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
}

export function useUpdateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<LabelDTO> & { id: string }) => repo.updateLabel(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labels"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteLabel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labels"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
