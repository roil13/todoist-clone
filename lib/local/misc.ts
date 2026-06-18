import { db, uuid, now } from "./db";
import { startOfDay, startOfWeek, subDays, format, isSameDay } from "date-fns";

const live = <T extends { deletedAt: number | null }>(rows: T[]) => rows.filter((r) => !r.deletedAt);

// ---------------------------------------------------------------- reminders
export type ReminderDTO = { id: string; taskId: string; type: "ABSOLUTE" | "RELATIVE"; triggerAt: string | null; offsetMinutes: number | null };

export async function listReminders(taskId: string): Promise<ReminderDTO[]> {
  return live(await db.reminders.where("taskId").equals(taskId).toArray()).map((r) => ({ id: r.id, taskId: r.taskId, type: r.type, triggerAt: r.triggerAt, offsetMinutes: r.offsetMinutes }));
}
export async function createReminder(input: { taskId: string; type: "ABSOLUTE" | "RELATIVE"; triggerAt?: string | null; offsetMinutes?: number | null }): Promise<ReminderDTO> {
  const row = { id: uuid(), taskId: input.taskId, type: input.type, triggerAt: input.triggerAt ?? null, offsetMinutes: input.offsetMinutes ?? null, lastFiredAt: null, updatedAt: now(), deletedAt: null };
  await db.reminders.add(row);
  return { id: row.id, taskId: row.taskId, type: row.type, triggerAt: row.triggerAt, offsetMinutes: row.offsetMinutes };
}
export async function deleteReminder(id: string): Promise<void> {
  await db.reminders.update(id, { deletedAt: now(), updatedAt: now() });
}
export async function consumeDueReminders(at = new Date()): Promise<{ id: string; taskId: string; content: string; at: string }[]> {
  const reminders = live(await db.reminders.toArray());
  const due: { id: string; taskId: string; content: string; at: string }[] = [];
  for (const r of reminders) {
    const task = await db.tasks.get(r.taskId);
    if (!task || task.isCompleted || task.deletedAt) continue;
    let moment: Date | null = null;
    if (r.type === "ABSOLUTE" && r.triggerAt) moment = new Date(r.triggerAt);
    else if (r.type === "RELATIVE" && task.dueDatetime && r.offsetMinutes != null) moment = new Date(new Date(task.dueDatetime).getTime() - r.offsetMinutes * 60_000);
    if (!moment) continue;
    const lastFired = r.lastFiredAt ? new Date(r.lastFiredAt) : null;
    if (moment <= at && (!lastFired || lastFired < moment)) {
      await db.reminders.update(r.id, { lastFiredAt: at.toISOString(), updatedAt: now() });
      due.push({ id: r.id, taskId: r.taskId, content: task.content, at: moment.toISOString() });
    }
  }
  return due;
}

// ---------------------------------------------------------------- settings
export type Settings = { theme: string; weekStart: number; timeZone: string; dateLanguage: string; dailyGoal: number; weeklyGoal: number; vacationMode: boolean };
export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get("settings");
  return { theme: s?.theme ?? "light", weekStart: s?.weekStart ?? 1, timeZone: s?.timeZone ?? "UTC", dateLanguage: s?.dateLanguage ?? "en", dailyGoal: s?.dailyGoal ?? 5, weeklyGoal: s?.weeklyGoal ?? 30, vacationMode: s?.vacationMode ?? false };
}
export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const cur = await db.settings.get("settings");
  await db.settings.put({ id: "settings", ...{ theme: "light", weekStart: 1, timeZone: "UTC", dateLanguage: "en", dailyGoal: 5, weeklyGoal: 30, vacationMode: false }, ...cur, ...patch, updatedAt: now(), deletedAt: null });
  return getSettings();
}

// ---------------------------------------------------------------- productivity
export type Productivity = { karma: number; completedToday: number; completedThisWeek: number; dailyGoal: number; weeklyGoal: number; streakDays: number; weekStart: number; dailyCounts: { date: string; label: string; count: number }[] };
export async function getProductivity(): Promise<Productivity> {
  const settings = await getSettings();
  const weekStart = settings.weekStart as 0 | 1;
  const events = live(await db.karmaEvents.toArray());
  const karma = events.reduce((s, e) => s + e.points, 0);
  const completions = events.filter((e) => e.points > 0).map((e) => new Date(e.createdAt));
  const todayStart = startOfDay(new Date());
  const weekStartDate = startOfWeek(new Date(), { weekStartsOn: weekStart });
  const completedToday = completions.filter((d) => d >= todayStart).length;
  const completedThisWeek = completions.filter((d) => d >= weekStartDate).length;
  const dailyCounts: Productivity["dailyCounts"] = [];
  for (let i = 13; i >= 0; i--) {
    const day = subDays(todayStart, i);
    dailyCounts.push({ date: day.toISOString(), label: format(day, "MMM d"), count: completions.filter((d) => isSameDay(d, day)).length });
  }
  let streakDays = 0;
  for (let i = 0; i <= 366; i++) {
    const day = subDays(todayStart, i);
    if (completions.some((d) => isSameDay(d, day))) streakDays++;
    else if (i !== 0) break;
  }
  return { karma, completedToday, completedThisWeek, dailyGoal: settings.dailyGoal, weeklyGoal: settings.weeklyGoal, streakDays, weekStart, dailyCounts };
}

// ---------------------------------------------------------------- activity
export type ActivityEntry = { id: string; eventType: string; objectType: string; objectId: string; payload: Record<string, unknown>; createdAt: string };
export async function getActivity(limit = 150): Promise<ActivityEntry[]> {
  return live(await db.activityEvents.toArray())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((e) => ({ id: e.id, eventType: e.eventType, objectType: e.objectType, objectId: e.objectId, payload: e.payload, createdAt: e.createdAt }));
}
