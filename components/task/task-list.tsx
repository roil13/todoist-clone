"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TaskItem } from "./task-item";
import { useReorderTasks } from "@/lib/hooks/tasks";
import { useT } from "@/lib/i18n";
import type { TaskDTO } from "@/lib/types";

function SortableTaskItem({
  task,
  showProject,
}: {
  task: TaskDTO;
  showProject?: boolean;
}) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <TaskItem
        task={task}
        showProject={showProject}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab text-text-faint opacity-0 group-hover:opacity-100"
            aria-label={t("aria.dragReorder")}
          >
            <GripVertical size={14} />
          </button>
        }
      />
    </div>
  );
}

export function TaskList({
  tasks,
  showProject = false,
  sortable = true,
}: {
  tasks: TaskDTO[];
  showProject?: boolean;
  sortable?: boolean;
}) {
  const reorder = useReorderTasks();
  const [items, setItems] = useState(tasks);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => setItems(tasks), [tasks]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorder.mutate(
      next.map((t, i) => ({ id: t.id, order: i, sectionId: t.sectionId, projectId: t.projectId })),
    );
  }

  if (!sortable) {
    return (
      <div>
        {tasks.map((t) => (
          <TaskItem key={t.id} task={t} showProject={showProject} />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div>
          {items.map((t) => (
            <SortableTaskItem key={t.id} task={t} showProject={showProject} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
