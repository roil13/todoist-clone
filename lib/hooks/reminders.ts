"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { ReminderDTO } from "@/lib/services/reminder";

export function useReminders(taskId: string) {
  return useQuery({
    queryKey: ["reminders", taskId],
    queryFn: () => api.get<ReminderDTO[]>(`/api/reminders?taskId=${taskId}`),
    enabled: !!taskId,
  });
}

export function useCreateReminder(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: "ABSOLUTE" | "RELATIVE"; triggerAt?: string | null; offsetMinutes?: number | null }) =>
      api.post<ReminderDTO>("/api/reminders", { taskId, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders", taskId] }),
  });
}

export function useDeleteReminder(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/reminders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders", taskId] }),
  });
}
