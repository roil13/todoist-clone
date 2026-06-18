import { prisma } from "@/lib/db";
import { taskInclude, serializeTask } from "./serialize";
import { logActivity } from "./activity";
import type { TaskDTO } from "@/lib/types";

export type TaskListParams = {
  projectId?: string;
  sectionId?: string | null;
  labelId?: string;
  parentId?: string | null;
  view?: "inbox" | "today" | "upcoming" | "completed";
  search?: string;
  includeCompleted?: boolean;
};

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function listTasks(
  userId: string,
  params: TaskListParams,
): Promise<TaskDTO[]> {
  const where: import("@prisma/client").Prisma.TaskWhereInput = { userId };

  if (params.view === "completed") {
    where.isCompleted = true;
  } else if (!params.includeCompleted) {
    where.isCompleted = false;
  }

  if (params.projectId) where.projectId = params.projectId;
  if (params.sectionId !== undefined) where.sectionId = params.sectionId;
  if (params.parentId !== undefined) where.parentId = params.parentId;
  if (params.labelId) where.labels = { some: { labelId: params.labelId } };

  if (params.search) {
    where.OR = [
      { content: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  if (params.view === "today") {
    const startTomorrow = new Date(startOfTodayUTC());
    startTomorrow.setUTCDate(startTomorrow.getUTCDate() + 1);
    where.dueDate = { lt: startTomorrow };
  } else if (params.view === "upcoming") {
    where.dueDate = { gte: startOfTodayUTC() };
  } else if (params.view === "inbox") {
    const inbox = await prisma.project.findFirst({
      where: { userId, isInbox: true },
      select: { id: true },
    });
    where.projectId = inbox?.id;
  }

  const orderBy: import("@prisma/client").Prisma.TaskOrderByWithRelationInput[] =
    params.view === "today" || params.view === "upcoming"
      ? [{ dueDate: "asc" }, { priority: "asc" }, { order: "asc" }]
      : params.view === "completed"
        ? [{ completedAt: "desc" }]
        : [{ order: "asc" }, { createdAt: "asc" }];

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy,
  });
  return tasks.map(serializeTask);
}

export async function getTask(userId: string, id: string): Promise<TaskDTO | null> {
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: taskInclude,
  });
  return task ? serializeTask(task) : null;
}

export type TaskInput = {
  content: string;
  description?: string;
  projectId?: string;
  sectionId?: string | null;
  parentId?: string | null;
  priority?: number;
  dueDate?: string | null;
  dueDatetime?: string | null;
  dueString?: string | null;
  recurrenceRule?: string | null;
  duration?: number | null;
  durationUnit?: string | null;
  labelIds?: string[];
};

export async function createTask(
  userId: string,
  input: TaskInput,
): Promise<TaskDTO> {
  let projectId = input.projectId;
  if (!projectId) {
    const inbox = await prisma.project.findFirst({
      where: { userId, isInbox: true },
      select: { id: true },
    });
    projectId = inbox!.id;
  }

  // Place new task at the end of its list.
  const last = await prisma.task.findFirst({
    where: { userId, projectId, sectionId: input.sectionId ?? null, parentId: input.parentId ?? null },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      userId,
      content: input.content,
      description: input.description ?? "",
      projectId,
      sectionId: input.sectionId ?? null,
      parentId: input.parentId ?? null,
      priority: input.priority ?? 4,
      order: (last?.order ?? -1) + 1,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      dueDatetime: input.dueDatetime ? new Date(input.dueDatetime) : null,
      dueString: input.dueString ?? null,
      recurrenceRule: input.recurrenceRule ?? null,
      isRecurring: !!input.recurrenceRule,
      duration: input.duration ?? null,
      durationUnit: input.durationUnit ?? null,
      labels: input.labelIds?.length
        ? { create: input.labelIds.map((labelId) => ({ labelId })) }
        : undefined,
    },
    include: taskInclude,
  });

  await logActivity(userId, "task_added", "task", task.id, { content: task.content });
  return serializeTask(task);
}

export async function updateTask(
  userId: string,
  id: string,
  input: Partial<TaskInput>,
): Promise<TaskDTO> {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Task not found");

  await prisma.task.update({
    where: { id },
    data: {
      content: input.content,
      description: input.description,
      projectId: input.projectId,
      sectionId: input.sectionId,
      parentId: input.parentId,
      priority: input.priority,
      dueDate:
        input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null,
      dueDatetime:
        input.dueDatetime === undefined
          ? undefined
          : input.dueDatetime
            ? new Date(input.dueDatetime)
            : null,
      dueString: input.dueString,
      recurrenceRule: input.recurrenceRule,
      isRecurring:
        input.recurrenceRule === undefined ? undefined : !!input.recurrenceRule,
      duration: input.duration,
      durationUnit: input.durationUnit,
    },
  });

  if (input.labelIds) {
    await prisma.taskLabel.deleteMany({ where: { taskId: id } });
    if (input.labelIds.length) {
      await prisma.taskLabel.createMany({
        data: input.labelIds.map((labelId) => ({ taskId: id, labelId })),
      });
    }
  }

  const updated = await prisma.task.findUniqueOrThrow({
    where: { id },
    include: taskInclude,
  });
  await logActivity(userId, "task_updated", "task", id, {});
  return serializeTask(updated);
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Task not found");
  await prisma.task.delete({ where: { id } });
  await logActivity(userId, "task_deleted", "task", id, { content: existing.content });
}

export async function reorderTasks(
  userId: string,
  items: { id: string; order: number; sectionId?: string | null; projectId?: string }[],
): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.task.updateMany({
        where: { id: item.id, userId },
        data: {
          order: item.order,
          sectionId: item.sectionId,
          projectId: item.projectId,
        },
      }),
    ),
  );
}
