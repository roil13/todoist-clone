import { prisma } from "@/lib/db";
import { startOfDay, startOfWeek, subDays, format, isSameDay } from "date-fns";

export type Productivity = {
  karma: number;
  completedToday: number;
  completedThisWeek: number;
  dailyGoal: number;
  weeklyGoal: number;
  streakDays: number;
  weekStart: number;
  dailyCounts: { date: string; label: string; count: number }[];
};

export async function getProductivity(userId: string): Promise<Productivity> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const weekStart = settings?.weekStart ?? 1;

  // Completions are recorded as positive KarmaEvents.
  const events = await prisma.karmaEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const karma = events.reduce((sum, e) => sum + e.points, 0);
  const completions = events.filter((e) => e.points > 0).map((e) => e.createdAt);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStartDate = startOfWeek(now, { weekStartsOn: weekStart as 0 | 1 });

  const completedToday = completions.filter((d) => d >= todayStart).length;
  const completedThisWeek = completions.filter((d) => d >= weekStartDate).length;

  // Last 14 days of completion counts (chart).
  const dailyCounts: Productivity["dailyCounts"] = [];
  for (let i = 13; i >= 0; i--) {
    const day = subDays(todayStart, i);
    const count = completions.filter((d) => isSameDay(d, day)).length;
    dailyCounts.push({ date: day.toISOString(), label: format(day, "MMM d"), count });
  }

  // Streak: consecutive days (ending today) with at least one completion.
  let streakDays = 0;
  for (let i = 0; ; i++) {
    const day = subDays(todayStart, i);
    const has = completions.some((d) => isSameDay(d, day));
    if (has) streakDays++;
    else {
      // Today with zero completions doesn't break a streak that's still "today".
      if (i === 0) continue;
      break;
    }
    if (i > 365) break;
  }

  return {
    karma,
    completedToday,
    completedThisWeek,
    dailyGoal: settings?.dailyGoal ?? 5,
    weeklyGoal: settings?.weeklyGoal ?? 30,
    streakDays,
    weekStart,
    dailyCounts,
  };
}
