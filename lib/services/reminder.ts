import { prisma } from "@/lib/db";

export type ReminderDTO = {
  id: string;
  taskId: string;
  type: "ABSOLUTE" | "RELATIVE";
  triggerAt: string | null;
  offsetMinutes: number | null;
};

function serialize(r: {
  id: string;
  taskId: string;
  type: string;
  triggerAt: Date | null;
  offsetMinutes: number | null;
}): ReminderDTO {
  return {
    id: r.id,
    taskId: r.taskId,
    type: r.type as "ABSOLUTE" | "RELATIVE",
    triggerAt: r.triggerAt?.toISOString() ?? null,
    offsetMinutes: r.offsetMinutes,
  };
}

export async function listReminders(userId: string, taskId: string): Promise<ReminderDTO[]> {
  const reminders = await prisma.reminder.findMany({ where: { userId, taskId } });
  return reminders.map(serialize);
}

export async function createReminder(
  userId: string,
  input: { taskId: string; type: "ABSOLUTE" | "RELATIVE"; triggerAt?: string | null; offsetMinutes?: number | null },
): Promise<ReminderDTO> {
  const task = await prisma.task.findFirst({ where: { id: input.taskId, userId } });
  if (!task) throw new Error("Task not found");
  const reminder = await prisma.reminder.create({
    data: {
      userId,
      taskId: input.taskId,
      type: input.type,
      triggerAt: input.triggerAt ? new Date(input.triggerAt) : null,
      offsetMinutes: input.offsetMinutes ?? null,
    },
  });
  return serialize(reminder);
}

export async function deleteReminder(userId: string, id: string): Promise<void> {
  const existing = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Reminder not found");
  await prisma.reminder.delete({ where: { id } });
}

/** Effective trigger moment for a reminder, or null if it can't fire yet. */
function triggerMoment(
  r: { type: string; triggerAt: Date | null; offsetMinutes: number | null },
  taskDueDatetime: Date | null,
): Date | null {
  if (r.type === "ABSOLUTE") return r.triggerAt;
  if (r.type === "RELATIVE" && taskDueDatetime && r.offsetMinutes != null) {
    return new Date(taskDueDatetime.getTime() - r.offsetMinutes * 60_000);
  }
  return null;
}

/** Reminders that are due now and not yet fired for the current trigger; marks them fired. */
export async function consumeDueReminders(
  userId: string,
  now = new Date(),
): Promise<{ id: string; taskId: string; content: string; at: string }[]> {
  const reminders = await prisma.reminder.findMany({
    where: { userId, task: { isCompleted: false } },
    include: { task: { select: { content: true, dueDatetime: true } } },
  });

  const due: { id: string; taskId: string; content: string; at: string }[] = [];
  for (const r of reminders) {
    const moment = triggerMoment(r, r.task.dueDatetime);
    if (!moment) continue;
    if (moment <= now && (!r.lastFiredAt || r.lastFiredAt < moment)) {
      await prisma.reminder.update({ where: { id: r.id }, data: { lastFiredAt: now } });
      due.push({ id: r.id, taskId: r.taskId, content: r.task.content, at: moment.toISOString() });
    }
  }
  return due;
}
