"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ColorPicker } from "@/components/ui/color-picker";
import { useCreateLabel, useUpdateLabel } from "@/lib/hooks/labels";
import { useT } from "@/lib/i18n";
import type { LabelDTO } from "@/lib/types";

export function LabelDialog({
  open,
  onClose,
  label,
}: {
  open: boolean;
  onClose: () => void;
  label?: LabelDTO;
}) {
  const t = useT();
  const editing = !!label;
  const [name, setName] = useState(label?.name ?? "");
  const [color, setColor] = useState(label?.color ?? "charcoal");
  const create = useCreateLabel();
  const update = useUpdateLabel();

  async function submit() {
    if (!name.trim()) return;
    if (editing) await update.mutateAsync({ id: label.id, name: name.trim(), color });
    else await create.mutateAsync({ name: name.trim(), color });
    onClose();
    setName("");
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? t("dialog.editLabel") : t("dialog.addLabel")}>
      <div className="space-y-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value.replace(/\s+/g, "_"))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("dialog.labelName")}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-bg-hover">
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {editing ? t("common.save") : t("common.add")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
