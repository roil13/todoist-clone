"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Flag, Hash, Tag, Repeat } from "lucide-react";
import { useQuickAddTask } from "@/lib/hooks/tasks";
import { parseQuickAdd } from "@/lib/quick-add/parser";
import { useT, useDateFormat } from "@/lib/i18n";

export function SmartQuickAdd({
  projectId,
  sectionId,
  parentId,
  defaultDueDate,
  onDone,
  placeholder,
}: {
  projectId?: string;
  sectionId?: string | null;
  parentId?: string | null;
  defaultDueDate?: string | null;
  onDone?: () => void;
  placeholder?: string;
}) {
  const t = useT();
  const { formatDueDate } = useDateFormat();
  const quickAdd = useQuickAddTask();
  const [text, setText] = useState("");

  const parsed = useMemo(() => (text.trim() ? parseQuickAdd(text) : null), [text]);
  const due = parsed ? formatDueDate(parsed.dueDate, parsed.dueDatetime) : null;

  async function submit() {
    if (!text.trim()) return;
    await quickAdd.mutateAsync({
      text,
      projectId,
      sectionId: sectionId ?? null,
      parentId: parentId ?? null,
      defaultDueDate: defaultDueDate ?? null,
    });
    setText("");
  }

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3 shadow-sm">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onDone?.();
        }}
        placeholder={placeholder ?? t("task.smartPlaceholder")}
        className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-text-faint"
      />

      {parsed && (parsed.dueString || parsed.priority !== 4 || parsed.labelNames.length || parsed.projectName || parsed.recurrenceRule) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {due && (
            <span className="inline-flex items-center gap-1 rounded bg-bg-active px-1.5 py-0.5 text-[#058527]">
              <CalendarDays size={11} /> {due.label}
            </span>
          )}
          {parsed.recurrenceRule && (
            <span className="inline-flex items-center gap-1 rounded bg-bg-hover px-1.5 py-0.5">
              <Repeat size={11} /> {t("chip.recurring")}
            </span>
          )}
          {parsed.priority !== 4 && (
            <span className={`inline-flex items-center gap-1 rounded bg-bg-hover px-1.5 py-0.5 prio-${parsed.priority}`}>
              <Flag size={11} /> P{parsed.priority}
            </span>
          )}
          {parsed.projectName && (
            <span className="inline-flex items-center gap-1 rounded bg-bg-hover px-1.5 py-0.5">
              <Hash size={11} /> {parsed.projectName}
            </span>
          )}
          {parsed.labelNames.map((l) => (
            <span key={l} className="inline-flex items-center gap-1 rounded bg-bg-hover px-1.5 py-0.5">
              <Tag size={11} /> {l}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
        <button onClick={onDone} className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-bg-hover">
          {t("common.cancel")}
        </button>
        <button
          onClick={submit}
          disabled={!text.trim() || quickAdd.isPending}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {t("task.addTask")}
        </button>
      </div>
    </div>
  );
}
