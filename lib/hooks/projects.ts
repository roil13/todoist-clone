"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as repo from "@/lib/local/repo";
import type { ProjectDTO } from "@/lib/types";

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: () => repo.listProjects() });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProjectDTO> & { name: string }) => repo.createProject(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<ProjectDTO> & { id: string }) => repo.updateProject(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReorderProjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; order: number; parentId?: string | null }[]) => repo.reorderProjects(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
