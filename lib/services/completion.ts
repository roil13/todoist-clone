import { prisma } from "@/lib/db";
import { taskInclude, serializeTask } from "./serialize";
import { logActivity, awardKarma } from "./activity";
import { nextOccurrence } from "@/lib/recurrence";
import type { TaskDTO } from "@/lib/types";

const KARMA_PER_TASK = 5;

export async function completeTask(
  userId: string,
  id: string,
): Promise<TaskDTO> {
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: taskInclude,
  });
  if (!task) throw new Error("Task not found");

  // Recurring tasks roll forward to the next occurrence instead of closing.
  if (task.isRecurring && task.recurrenceRule) {
    const next = nextOccurrence(task.recurrenceRule, task.dueDatetime ?? task.dueDate);
    if (next.nextDueDate || next.nextDueDatetime) {
      const updated = await prisma.task.update({
        where: { id },
        data: {
          dueDate: next.nextDueDate ?? task.dueDate,
          dueDatetime: next.nextDueDatetime,
        },
        include: taskInclude,
      });
      await logActivity(userId, "task_completed", "task", id, { recurring: true });
      await awardKarma(userId, KARMA_PER_TASK, "completed recurring task");
      return serializeTask(updated);
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { isCompleted: true, completedAt: new Date() },
    include: taskInclude,
  });
  // Complete any sub-tasks along with the parent.
  await prisma.task.updateMany({
    where: { parentId: id, userId, isCompleted: false },
    data: { isCompleted: true, completedAt: new Date() },
  });

  await logActivity(userId, "task_completed", "task", id, { content: task.content });
  await awardKarma(userId, KARMA_PER_TASK, "completed task");
  return serializeTask(updated);
}

export async function uncompleteTask(
  userId: string,
  id: string,
): Promise<TaskDTO> {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new Error("Task not found");

  const updated = await prisma.task.update({
    where: { id },
    data: { isCompleted: false, completedAt: null },
    include: taskInclude,
  });
  await logActivity(userId, "task_uncompleted", "task", id, {});
  await awardKarma(userId, -KARMA_PER_TASK, "uncompleted task");
  return serializeTask(updated);
}
