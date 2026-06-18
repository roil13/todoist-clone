import { prisma } from "@/lib/db";
import { parseQuickAdd } from "@/lib/quick-add/parser";
import { ensureLabel } from "./label";
import { createTask } from "./task";
import type { TaskDTO } from "@/lib/types";

export async function quickAddTask(
  userId: string,
  input: {
    text: string;
    projectId?: string;
    sectionId?: string | null;
    parentId?: string | null;
    defaultDueDate?: string | null;
  },
): Promise<TaskDTO> {
  const parsed = parseQuickAdd(input.text);

  // Resolve #project by name (case-insensitive exact, then prefix match).
  let projectId = input.projectId;
  if (parsed.projectName) {
    const projects = await prisma.project.findMany({
      where: { userId, isArchived: false },
      select: { id: true, name: true },
    });
    const target = parsed.projectName.toLowerCase();
    const match =
      projects.find((p) => p.name.toLowerCase() === target) ??
      projects.find((p) => p.name.toLowerCase().startsWith(target));
    if (match) projectId = match.id;
  }

  // Ensure @labels exist.
  const labelIds: string[] = [];
  for (const name of parsed.labelNames) {
    const label = await ensureLabel(userId, name);
    labelIds.push(label.id);
  }

  return createTask(userId, {
    content: parsed.content || input.text.trim(),
    projectId,
    sectionId: input.sectionId ?? null,
    parentId: input.parentId ?? null,
    priority: parsed.priority,
    dueDate: parsed.dueDate ?? input.defaultDueDate ?? null,
    dueDatetime: parsed.dueDatetime,
    dueString: parsed.dueString,
    recurrenceRule: parsed.recurrenceRule,
    labelIds,
  });
}
