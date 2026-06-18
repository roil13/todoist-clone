"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as misc from "@/lib/local/misc";

export function useReminders(taskId: string) {
  return useQuery({
    queryKey: ["reminders", taskId],
    queryFn: () => misc.listReminders(taskId),
    enabled: !!taskId,
  });
}

export function useCreateReminder(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: "ABSOLUTE" | "RELATIVE"; triggerAt?: string | null; offsetMinutes?: number | null }) =>
      misc.createReminder({ taskId, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders", taskId] }),
  });
}

export function useDeleteReminder(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => misc.deleteReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders", taskId] }),
  });
}
