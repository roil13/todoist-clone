import type { Prisma } from "@prisma/client";
import type { TaskDTO, ProjectDTO, SectionDTO, LabelDTO } from "@/lib/types";

export const taskInclude = {
  labels: { include: { label: true } },
  _count: { select: { subtasks: true, comments: true } },
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export function serializeTask(t: TaskWithRelations): TaskDTO {
  return {
    id: t.id,
    content: t.content,
    description: t.description,
    projectId: t.projectId,
    sectionId: t.sectionId,
    parentId: t.parentId,
    priority: t.priority,
    order: t.order,
    dueDate: t.dueDate?.toISOString() ?? null,
    dueDatetime: t.dueDatetime?.toISOString() ?? null,
    dueString: t.dueString,
    recurrenceRule: t.recurrenceRule,
    isRecurring: t.isRecurring,
    duration: t.duration,
    durationUnit: t.durationUnit,
    isCompleted: t.isCompleted,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    labels: t.labels.map((tl) => serializeLabel(tl.label)),
    subtaskCount: t._count.subtasks,
    commentCount: t._count.comments,
  };
}

export function serializeLabel(l: {
  id: string;
  name: string;
  color: string;
  order: number;
  isFavorite: boolean;
}): LabelDTO {
  return {
    id: l.id,
    name: l.name,
    color: l.color,
    order: l.order,
    isFavorite: l.isFavorite,
  };
}

export function serializeProject(p: {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  order: number;
  isFavorite: boolean;
  isArchived: boolean;
  isInbox: boolean;
  defaultView: string;
}): ProjectDTO {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    parentId: p.parentId,
    order: p.order,
    isFavorite: p.isFavorite,
    isArchived: p.isArchived,
    isInbox: p.isInbox,
    defaultView: p.defaultView as ProjectDTO["defaultView"],
  };
}

export function serializeSection(s: {
  id: string;
  name: string;
  projectId: string;
  order: number;
  isCollapsed: boolean;
}): SectionDTO {
  return {
    id: s.id,
    name: s.name,
    projectId: s.projectId,
    order: s.order,
    isCollapsed: s.isCollapsed,
  };
}
