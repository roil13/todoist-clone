"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getSettings, updateSettings } from "@/lib/local/misc";
import { buildSnapshot, mergeSnapshot, type Snapshot } from "@/lib/local/snapshot";
import { applyTheme, getStoredTheme, THEMES, type Theme } from "@/lib/theme";
import { useSync } from "@/components/sync-provider";
import { useT, useLocale } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages/en";

type Settings = {
  theme: string;
  weekStart: number;
  dailyGoal: number;
  weeklyGoal: number;
  vacationMode: boolean;
};

const THEME_KEY: Record<string, MessageKey> = {
  light: "theme.light",
  dark: "theme.dark",
  kraft: "theme.kraft",
  moonstone: "theme.moonstone",
};

export function SettingsView() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const sync = useSync();
  const qc = useQueryClient();
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettings().then(setS).catch(() => {});
    setTheme(getStoredTheme());
  }, []);

  function changeTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
    updateSettings({ theme: next }).catch(() => {});
  }

  function changeLanguage(next: Locale) {
    setLocale(next);
    updateSettings({ dateLanguage: next }).catch(() => {});
  }

  async function save(patch: Partial<Settings>) {
    if (!s) return;
    setS({ ...s, ...patch });
    await updateSettings(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function onExport() {
    const snapshot = await buildSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(file: File) {
    setImportMsg(t("settings.importing"));
    try {
      const snapshot = JSON.parse(await file.text()) as Snapshot;
      const changed = await mergeSnapshot(snapshot);
      qc.invalidateQueries();
      setImportMsg(t("settings.importResult", { projects: changed, tasks: changed }));
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : t("settings.importFailed"));
    }
  }

  if (!s) return <div className="p-8 text-sm text-text-muted">{t("common.loading")}</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 text-xl font-bold">
        {t("settings.title")} {saved && <span className="text-xs font-normal text-[#058527]">{t("settings.saved")}</span>}
      </h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-text-muted">{t("settings.goals")}</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            {t("settings.dailyGoal")}
            <input
              type="number"
              min={1}
              value={s.dailyGoal}
              onChange={(e) => save({ dailyGoal: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm">
            {t("settings.weeklyGoal")}
            <input
              type="number"
              min={1}
              value={s.weeklyGoal}
              onChange={(e) => save({ weeklyGoal: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
            />
          </label>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-text-muted">{t("settings.preferences")}</h2>
        <label className="mb-3 block text-sm">
          {t("settings.language")}
          <select
            value={locale}
            onChange={(e) => changeLanguage(e.target.value as Locale)}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
          >
            {LOCALES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </label>
        <label className="mb-3 block text-sm">
          {t("settings.theme")}
          <select
            value={theme}
            onChange={(e) => changeTheme(e.target.value as Theme)}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
          >
            {THEMES.map((th) => (
              <option key={th.value} value={th.value}>{t(THEME_KEY[th.value])}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          {t("settings.startWeek")}
          <select
            value={s.weekStart}
            onChange={(e) => save({ weekStart: Number(e.target.value) })}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 outline-none focus:border-accent"
          >
            <option value={1}>{t("settings.monday")}</option>
            <option value={0}>{t("settings.sunday")}</option>
          </select>
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.vacationMode}
            onChange={(e) => save({ vacationMode: e.target.checked })}
          />
          {t("settings.vacation")}
        </label>
      </section>

      <section className="mb-8">
        <h2 className="mb-1 text-sm font-semibold text-text-muted">{t("sync.title")}</h2>
        <p className="mb-3 text-xs text-text-faint">{t("sync.desc")}</p>
        {!sync.configured ? (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-text-muted">{t("sync.notConfigured")}</p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {sync.connected ? (
                <>
                  <button onClick={() => sync.sync()} className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover">
                    {sync.status === "syncing" ? t("sync.syncing") : t("sync.now")}
                  </button>
                  <button onClick={sync.disconnect} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-bg-hover">
                    {t("sync.disconnect")}
                  </button>
                </>
              ) : (
                <button onClick={() => sync.connect().catch(() => {})} className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover">
                  {t("sync.connect")}
                </button>
              )}
            </div>
            <p className="text-xs text-text-muted">
              {sync.connected ? `${t("sync.connected")} · ${t("sync.lastSynced", { when: sync.lastSyncedAt ? formatDistanceToNow(new Date(sync.lastSyncedAt), { addSuffix: true }) : t("sync.never") })}` : t("sync.notConnected")}
            </p>
            {sync.error && <p className="text-xs text-[#d1453b]">{t("sync.error", { msg: sync.error })}</p>}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-muted">{t("settings.backup")}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-bg-hover"
          >
            <Download size={15} /> {t("settings.export")}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-bg-hover"
          >
            <Upload size={15} /> {t("settings.import")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          />
        </div>
        {importMsg && <p className="mt-2 text-sm text-text-muted">{importMsg}</p>}
        <p className="mt-2 text-xs text-text-faint">{t("settings.importAdditive")}</p>
      </section>
    </div>
  );
}
