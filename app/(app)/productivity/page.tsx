import { requireUserId } from "@/lib/session";
import { getProductivity } from "@/lib/services/productivity";
import { getServerT } from "@/lib/i18n/server";
import { Flame, Trophy } from "lucide-react";

function ProgressBar({ value, goal }: { value: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-hover">
      <div
        className="h-full rounded-full bg-accent transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function ProductivityPage() {
  const userId = await requireUserId();
  const { t } = await getServerT();
  const p = await getProductivity(userId);
  const maxCount = Math.max(1, ...p.dailyCounts.map((d) => d.count));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 text-xl font-bold">{t("prod.title")}</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-bg-elevated p-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Trophy size={16} /> {t("prod.karma")}
          </div>
          <p className="mt-1 text-2xl font-bold">{p.karma}</p>
        </div>
        <div className="rounded-lg border border-border bg-bg-elevated p-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Flame size={16} /> {t("prod.streak")}
          </div>
          <p className="mt-1 text-2xl font-bold">{p.streakDays} {p.streakDays === 1 ? t("prod.day") : t("prod.days")}</p>
        </div>
        <div className="rounded-lg border border-border bg-bg-elevated p-4">
          <div className="text-text-muted">{t("prod.today")}</div>
          <p className="mt-1 text-2xl font-bold">
            {p.completedToday}<span className="text-sm font-normal text-text-faint"> / {p.dailyGoal}</span>
          </p>
          <ProgressBar value={p.completedToday} goal={p.dailyGoal} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-bg-elevated p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{t("prod.thisWeek")}</span>
          <span className="font-medium">{p.completedThisWeek} / {p.weeklyGoal}</span>
        </div>
        <ProgressBar value={p.completedThisWeek} goal={p.weeklyGoal} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-text-muted">{t("prod.last14")}</h2>
        <div className="flex h-40 items-end gap-1.5">
          {p.dailyCounts.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-accent/80"
                style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count ? 4 : 0 }}
                title={`${d.count} ${t("prod.completedTitle")}`}
              />
              <span className="text-[9px] text-text-faint">{d.label.split(" ")[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
