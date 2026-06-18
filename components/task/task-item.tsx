"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Pencil,
  Trash2,
  Repeat,
  MessageSquare,
  GripVertical,
} from "lucide-react";
import { useToggleComplete, useDeleteTask, useTasks } from "@/lib/hooks/tasks";
import { useProjects } from "@/lib/hooks/projects";
import { useT, useDateFormat } from "@/lib/i18n";
import { ColorDot } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { TaskEditor } from "./task-editor";
import { SmartQuickAdd } from "./smart-quick-add";
import { Comments } from "./comments";
import { Reminders } from "./reminders";
import type { TaskDTO } from "@/lib/types";

export function TaskItem({
  task,
  showProject = false,
  dragHandle,
}: {
  task: TaskDTO;
  showProject?: boolean;
  dragHandle?: React.ReactNode;
}) {
  const t = useT();
  const { formatDueDate } = useDateFormat();
  const toggle = useToggleComplete();
  const del = useDeleteTask();
  const { data: projects } = useProjects();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const subtasks = useTasks({ parentId: task.id }, expanded);
  const due = formatDueDate(task.dueDate, task.dueDatetime);
  const project = projects?.find((p) => p.id === task.projectId);

  if (editing) {
    return <TaskEditor task={task} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="group">
      <div className="flex items-start gap-2 border-b border-border py-2">
        {dragHandle ?? (
          <span className="mt-1 w-0 opacity-0" aria-hidden>
            <GripVertical size={14} />
          </span>
        )}

        {task.subtaskCount > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 rounded p-0.5 text-text-muted hover:bg-bg-hover"
            aria-label={t("aria.toggleSubtasks")}
          >
            <ChevronRight
              size={14}
              className={cn("transition-transform", expanded ? "rotate-90" : "rtl:rotate-180")}
            />
          </button>
        )}

        <button
          onClick={() => toggle.mutate({ id: task.id, completed: !task.isCompleted })}
          aria-label={task.isCompleted ? t("aria.markIncomplete") : t("aria.markComplete")}
          className={cn(
            "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
            `prio-${task.priority}`,
            task.isCompleted ? "bg-text-faint border-text-faint" : "hover:bg-bg-hover",
          )}
          style={{ borderColor: "currentColor" }}
        >
          {task.isCompleted && <Check size={12} className="text-white" />}
          {!task.isCompleted && (
            <Check size={12} className="opacity-0 group-hover:opacity-40" />
          )}
        </button>

        <div className="min-w-0 flex-1" onClick={() => setEditing(true)}>
          <p className={cn("cursor-text text-sm", task.isCompleted && "text-text-faint line-through")}>
            {task.content}
          </p>
          {task.description && (
            <p className="truncate text-xs text-text-muted">{task.description}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {due && (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  due.isOverdue ? "text-[#d1453b]" : due.isToday ? "text-[#058527]" : "text-text-muted",
                )}
              >
                {task.isRecurring && <Repeat size={11} />}
                {due.label}
              </span>
            )}
            {task.labels.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-1 text-text-muted">
                <ColorDot color={l.color} size={7} />
                {l.name}
              </span>
            ))}
            {task.commentCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-text-muted">
                <MessageSquare size={11} />
                {task.commentCount}
              </span>
            )}
            {showProject && project && !project.isInbox && (
              <span className="inline-flex items-center gap-1 text-text-muted">
                <ColorDot color={project.color} size={7} />
                {project.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setShowComments(true)}
            className="rounded p-1 text-text-muted hover:bg-bg-hover"
            aria-label={t("aria.comments")}
          >
            <MessageSquare size={14} />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="rounded p-1 text-text-muted hover:bg-bg-hover"
            aria-label={t("aria.editTask")}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => del.mutate(task.id)}
            className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-[#d1453b]"
            aria-label={t("aria.deleteTask")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ms-7 border-s border-border ps-2">
          {(subtasks.data ?? []).map((st) => (
            <TaskItem key={st.id} task={st} />
          ))}
          {addingSub ? (
            <div className="py-2">
              <SmartQuickAdd
                projectId={task.projectId}
                parentId={task.id}
                onDone={() => setAddingSub(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingSub(true)}
              className="py-1 text-xs text-text-muted hover:text-accent"
            >
              {t("task.addSubtask")}
            </button>
          )}
        </div>
      )}

      <Modal
        open={showComments}
        onClose={() => setShowComments(false)}
        title={task.content}
        width="max-w-lg"
      >
        {task.description && (
          <p className="mb-3 whitespace-pre-wrap text-sm text-text-muted">{task.description}</p>
        )}
        <div className="mb-4">
          <Reminders taskId={task.id} hasDateTime={!!task.dueDatetime} />
        </div>
        <Comments taskId={task.id} />
      </Modal>
    </div>
  );
}
