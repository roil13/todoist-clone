"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ColorPicker } from "@/components/ui/color-picker";
import { useCreateFilter, useUpdateFilter } from "@/lib/hooks/filters";
import { useT } from "@/lib/i18n";
import type { FilterDTO } from "@/lib/types";

const EXAMPLES = [
  "today & p1",
  "overdue",
  "7 days & #Work",
  "@urgent | p1",
  "no date & !#Inbox",
];

export function FilterDialog({
  open,
  onClose,
  filter,
}: {
  open: boolean;
  onClose: () => void;
  filter?: FilterDTO;
}) {
  const t = useT();
  const editing = !!filter;
  const [name, setName] = useState(filter?.name ?? "");
  const [query, setQuery] = useState(filter?.query ?? "");
  const [color, setColor] = useState(filter?.color ?? "charcoal");
  const create = useCreateFilter();
  const update = useUpdateFilter();

  async function submit() {
    if (!name.trim() || !query.trim()) return;
    if (editing) await update.mutateAsync({ id: filter.id, name, query, color });
    else await create.mutateAsync({ name, query, color });
    onClose();
    setName("");
    setQuery("");
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? t("dialog.editFilter") : t("dialog.addFilter")}>
      <div className="space-y-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("dialog.filterName")}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("dialog.query")}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent"
          dir="ltr"
        />
        <ColorPicker value={color} onChange={setColor} />
        <div className="text-xs text-text-muted">
          <p className="mb-1">{t("dialog.examples")}</p>
          <div className="flex flex-wrap gap-1">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="rounded border border-border px-1.5 py-0.5 font-mono hover:bg-bg-hover"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-bg-hover">
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || !query.trim()}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {editing ? t("common.save") : t("common.add")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
