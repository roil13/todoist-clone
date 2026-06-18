"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ColorPicker } from "@/components/ui/color-picker";
import { useCreateProject, useUpdateProject } from "@/lib/hooks/projects";
import { useT } from "@/lib/i18n";
import type { ProjectDTO } from "@/lib/types";

export function ProjectDialog({
  open,
  onClose,
  project,
  parentId,
}: {
  open: boolean;
  onClose: () => void;
  project?: ProjectDTO;
  parentId?: string | null;
}) {
  const t = useT();
  const editing = !!project;
  const [name, setName] = useState(project?.name ?? "");
  const [color, setColor] = useState(project?.color ?? "charcoal");
  const [view, setView] = useState<ProjectDTO["defaultView"]>(
    project?.defaultView ?? "LIST",
  );
  const create = useCreateProject();
  const update = useUpdateProject();

  async function submit() {
    if (!name.trim()) return;
    if (editing) {
      await update.mutateAsync({ id: project.id, name, color, defaultView: view });
    } else {
      await create.mutateAsync({ name, color, defaultView: view, parentId: parentId ?? null });
    }
    onClose();
    setName("");
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? t("dialog.editProject") : t("dialog.addProject")}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t("dialog.name")}</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t("dialog.projectName")}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t("dialog.color")}</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t("dialog.defaultView")}</label>
          <select
            value={view}
            onChange={(e) => setView(e.target.value as ProjectDTO["defaultView"])}
            className="w-full rounded-md border border-border bg-bg px-2 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="LIST">{t("view.list")}</option>
            <option value="BOARD">{t("view.board")}</option>
            <option value="CALENDAR">{t("view.calendar")}</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-bg-hover"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || create.isPending || update.isPending}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {editing ? t("common.save") : t("common.add")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
