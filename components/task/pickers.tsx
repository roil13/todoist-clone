"use client";

import { Flag, Calendar as CalIcon } from "lucide-react";
import { useProjects } from "@/lib/hooks/projects";
import { useLabels } from "@/lib/hooks/labels";
import { ColorDot } from "@/components/ui/color-picker";
import { useT } from "@/lib/i18n";

export function PriorityPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (p: number) => void;
}) {
  const t = useT();
  return (
    <label className="inline-flex items-center gap-1 rounded-md border border-border bg-bg px-2 py-1 text-sm">
      <Flag size={14} className={`prio-${value}`} />
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-transparent outline-none"
      >
        {[1, 2, 3, 4].map((p) => (
          <option key={p} value={p}>
            {t("task.priority", { n: p })}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProjectPicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const t = useT();
  const { data: projects } = useProjects();
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-bg px-2 py-1 text-sm outline-none"
    >
      {(projects ?? []).map((p) => (
        <option key={p.id} value={p.id}>
          {p.isInbox ? t("nav.inbox") : p.name}
        </option>
      ))}
    </select>
  );
}

export function DuePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (iso: string | null) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1 rounded-md border border-border bg-bg px-2 py-1 text-sm">
      <CalIcon size={14} className="text-text-muted" />
      <input
        type="date"
        value={value ? value.slice(0, 10) : ""}
        onChange={(e) =>
          onChange(e.target.value ? new Date(e.target.value + "T00:00:00Z").toISOString() : null)
        }
        className="bg-transparent outline-none"
      />
    </label>
  );
}

export function LabelMultiPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: labels } = useLabels();
  if (!labels?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((l) => {
        const active = value.includes(l.id);
        return (
          <button
            key={l.id}
            type="button"
            onClick={() =>
              onChange(active ? value.filter((x) => x !== l.id) : [...value, l.id])
            }
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${
              active ? "border-accent bg-accent-soft" : "border-border"
            }`}
          >
            <ColorDot color={l.color} size={8} />
            {l.name}
          </button>
        );
      })}
    </div>
  );
}
