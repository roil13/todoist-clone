"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Tag, Filter as FilterIcon, Pencil, Trash2, Star } from "lucide-react";
import { useFilters, useDeleteFilter, useUpdateFilter } from "@/lib/hooks/filters";
import { useLabels, useDeleteLabel, useUpdateLabel } from "@/lib/hooks/labels";
import { FilterDialog } from "@/components/sidebar/filter-dialog";
import { LabelDialog } from "@/components/sidebar/label-dialog";
import { ColorDot } from "@/components/ui/color-picker";
import { useT } from "@/lib/i18n";
import type { FilterDTO, LabelDTO } from "@/lib/types";

export function FiltersLabelsView() {
  const t = useT();
  const { data: filters } = useFilters();
  const { data: labels } = useLabels();
  const delFilter = useDeleteFilter();
  const updFilter = useUpdateFilter();
  const delLabel = useDeleteLabel();
  const updLabel = useUpdateLabel();
  const [filterDialog, setFilterDialog] = useState<{ open: boolean; filter?: FilterDTO }>({ open: false });
  const [labelDialog, setLabelDialog] = useState<{ open: boolean; label?: LabelDTO }>({ open: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 text-xl font-bold">{t("fl.title")}</h1>

      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-muted">{t("fl.filters")}</h2>
          <button onClick={() => setFilterDialog({ open: true })} className="flex items-center gap-1 text-sm text-accent hover:underline">
            <Plus size={14} /> {t("fl.addFilter")}
          </button>
        </div>
        {filters && filters.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border">
            {filters.map((f) => (
              <li key={f.id} className="group flex items-center gap-2 px-3 py-2 text-sm">
                <FilterIcon size={15} style={{ color: undefined }} className="text-text-muted" />
                <Link href={`/filter?id=${f.id}`} className="flex-1">
                  <span className="font-medium">{f.name}</span>
                  <span className="ms-2 font-mono text-xs text-text-faint" dir="ltr">{f.query}</span>
                </Link>
                <button onClick={() => updFilter.mutate({ id: f.id, isFavorite: !f.isFavorite })} className="rounded p-1 text-text-muted hover:bg-bg-hover" aria-label={t("aria.favorite")}>
                  <Star size={14} fill={f.isFavorite ? "currentColor" : "none"} className={f.isFavorite ? "text-yellow-500" : ""} />
                </button>
                <button onClick={() => setFilterDialog({ open: true, filter: f })} className="rounded p-1 text-text-muted opacity-0 hover:bg-bg-hover group-hover:opacity-100" aria-label={t("aria.edit")}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => { if (confirm(t("filter.deleteConfirm", { name: f.name }))) delFilter.mutate(f.id); }} className="rounded p-1 text-text-muted opacity-0 hover:text-[#d1453b] group-hover:opacity-100" aria-label={t("aria.delete")}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
            {t("fl.noFilters")}
          </p>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-muted">{t("fl.labels")}</h2>
          <button onClick={() => setLabelDialog({ open: true })} className="flex items-center gap-1 text-sm text-accent hover:underline">
            <Plus size={14} /> {t("fl.addLabel")}
          </button>
        </div>
        {labels && labels.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border">
            {labels.map((l) => (
              <li key={l.id} className="group flex items-center gap-2 px-3 py-2 text-sm">
                <Tag size={15} className="text-text-muted" />
                <ColorDot color={l.color} />
                <Link href={`/label?id=${l.id}`} className="flex-1 font-medium">{l.name}</Link>
                <button onClick={() => updLabel.mutate({ id: l.id, isFavorite: !l.isFavorite })} className="rounded p-1 text-text-muted hover:bg-bg-hover" aria-label={t("aria.favorite")}>
                  <Star size={14} fill={l.isFavorite ? "currentColor" : "none"} className={l.isFavorite ? "text-yellow-500" : ""} />
                </button>
                <button onClick={() => setLabelDialog({ open: true, label: l })} className="rounded p-1 text-text-muted opacity-0 hover:bg-bg-hover group-hover:opacity-100" aria-label={t("aria.edit")}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => { if (confirm(t("label.deleteConfirm", { name: l.name }))) delLabel.mutate(l.id); }} className="rounded p-1 text-text-muted opacity-0 hover:text-[#d1453b] group-hover:opacity-100" aria-label={t("aria.delete")}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
            {t("fl.noLabels")}
          </p>
        )}
      </section>

      <FilterDialog open={filterDialog.open} filter={filterDialog.filter} onClose={() => setFilterDialog({ open: false })} />
      <LabelDialog open={labelDialog.open} label={labelDialog.label} onClose={() => setLabelDialog({ open: false })} />
    </div>
  );
}
