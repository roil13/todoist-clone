"use client";

import { useState } from "react";
import { useUpdateTask } from "@/lib/hooks/tasks";
import { PriorityPicker, DuePicker, LabelMultiPicker, ProjectPicker } from "./pickers";
import { useT } from "@/lib/i18n";
import type { TaskDTO } from "@/lib/types";

export function TaskEditor({
  task,
  onDone,
}: {
  task: TaskDTO;
  onDone: () => void;
}) {
  const t = useT();
  const update = useUpdateTask();
  const [content, setContent] = useState(task.content);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [due, setDue] = useState<string | null>(task.dueDate);
  const [projectId, setProjectId] = useState(task.projectId);
  const [labelIds, setLabelIds] = useState<string[]>(task.labels.map((l) => l.id));

  async function save() {
    if (!content.trim()) return;
    await update.mutateAsync({
      id: task.id,
      content: content.trim(),
      description,
      priority,
      dueDate: due,
      projectId,
      labelIds,
    });
    onDone();
  }

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3 shadow-sm">
      <input
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") onDone();
        }}
        className="w-full bg-transparent text-sm font-medium outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("task.description")}
        rows={2}
        className="mt-1 w-full resize-none bg-transparent text-xs outline-none placeholder:text-text-faint"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DuePicker value={due} onChange={setDue} />
        <PriorityPicker value={priority} onChange={setPriority} />
        <ProjectPicker value={projectId} onChange={setProjectId} />
      </div>
      <div className="mt-2">
        <LabelMultiPicker value={labelIds} onChange={setLabelIds} />
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
        <button
          onClick={onDone}
          className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-bg-hover"
        >
          {t("common.cancel")}
        </button>
        <button
          onClick={save}
          disabled={!content.trim() || update.isPending}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}
