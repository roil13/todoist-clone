"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useTasks, useUpdateTask } from "@/lib/hooks/tasks";
import { useSections, useCreateSection } from "@/lib/hooks/sections";
import { SmartQuickAdd } from "@/components/task/smart-quick-add";
import { TaskItem } from "@/components/task/task-item";
import { useT } from "@/lib/i18n";
import type { TaskDTO } from "@/lib/types";

const NO_SECTION = "__none__";

function Card({ task }: { task: TaskDTO }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="mb-2 cursor-grab rounded-lg border border-border bg-bg-elevated p-2 shadow-sm"
    >
      <TaskItem task={task} />
    </div>
  );
}

function Column({
  id,
  title,
  tasks,
  projectId,
}: {
  id: string;
  title: string;
  tasks: TaskDTO[];
  projectId: string;
}) {
  const t = useT();
  const { setNodeRef, isOver } = useDroppable({ id });
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {title} <span className="text-text-faint">{tasks.length || ""}</span>
      </h3>
      <div
        ref={setNodeRef}
        className={`min-h-24 flex-1 rounded-lg p-1 transition-colors ${isOver ? "bg-bg-active" : ""}`}
      >
        {tasks.map((t) => (
          <Card key={t.id} task={t} />
        ))}
        {adding ? (
          <SmartQuickAdd
            projectId={projectId}
            sectionId={id === NO_SECTION ? null : id}
            onDone={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-1 rounded px-2 py-1 text-sm text-text-muted hover:bg-bg-hover"
          >
            <Plus size={14} /> {t("view.addTask")}
          </button>
        )}
      </div>
    </div>
  );
}

export function ProjectBoard({ projectId }: { projectId: string }) {
  const t = useT();
  const { data: tasks } = useTasks({ projectId, parentId: null });
  const { data: sections } = useSections(projectId);
  const update = useUpdateTask();
  const createSection = useCreateSection();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [newCol, setNewCol] = useState("");

  const columns = useMemo(() => {
    const cols: { id: string; title: string; tasks: TaskDTO[] }[] = [
      { id: NO_SECTION, title: t("section.noSection"), tasks: [] },
      ...(sections ?? []).map((s) => ({ id: s.id, title: s.name, tasks: [] as TaskDTO[] })),
    ];
    const byId = new Map(cols.map((c) => [c.id, c]));
    (tasks ?? []).forEach((t) => {
      const key = t.sectionId ?? NO_SECTION;
      (byId.get(key) ?? byId.get(NO_SECTION))!.tasks.push(t);
    });
    return cols;
  }, [tasks, sections, t]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id);
    const target = String(over.id);
    const task = tasks?.find((t) => t.id === taskId);
    const newSection = target === NO_SECTION ? null : target;
    if (task && (task.sectionId ?? null) !== newSection) {
      update.mutate({ id: taskId, sectionId: newSection });
    }
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((c) => (
            <Column key={c.id} id={c.id} title={c.title} tasks={c.tasks} projectId={projectId} />
          ))}
          <div className="w-64 shrink-0">
            <input
              value={newCol}
              onChange={(e) => setNewCol(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCol.trim()) {
                  createSection.mutate({ name: newCol.trim(), projectId });
                  setNewCol("");
                }
              }}
              placeholder={`+ ${t("section.add")}`}
              className="w-full rounded-md border border-dashed border-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>
      </DndContext>
    </div>
  );
}
