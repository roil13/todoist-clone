import { prisma } from "@/lib/db";
import { importData, type Backup } from "./backup";

/**
 * Export a single project (with its sections, tasks, sub-tasks and used labels)
 * as a backup-shaped payload that can be re-instantiated as a new project.
 */
export async function exportProjectTemplate(
  userId: string,
  projectId: string,
): Promise<Backup> {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new Error("Project not found");

  const [sections, tasks] = await Promise.all([
    prisma.section.findMany({ where: { userId, projectId } }),
    prisma.task.findMany({ where: { userId, projectId }, include: { labels: true } }),
  ]);

  const usedLabelIds = new Set(tasks.flatMap((t) => t.labels.map((l) => l.labelId)));
  const labels = await prisma.label.findMany({
    where: { userId, id: { in: [...usedLabelIds] } },
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: [
      {
        id: project.id,
        name: project.name,
        color: project.color,
        parentId: null, // detach when instantiating
        order: project.order,
        isFavorite: false,
        isArchived: false,
        isInbox: false,
        defaultView: project.defaultView,
      },
    ],
    sections: sections.map((s) => ({ id: s.id, projectId: s.projectId, name: s.name, order: s.order })),
    labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color, order: l.order, isFavorite: l.isFavorite })),
    tasks: tasks.map((t) => ({
      id: t.id, content: t.content, description: t.description, projectId: t.projectId,
      sectionId: t.sectionId, parentId: t.parentId, priority: t.priority, order: t.order,
      dueDate: t.dueDate?.toISOString() ?? null, dueDatetime: t.dueDatetime?.toISOString() ?? null,
      dueString: t.dueString, recurrenceRule: t.recurrenceRule, isRecurring: t.isRecurring,
      duration: t.duration, durationUnit: t.durationUnit,
      isCompleted: false, completedAt: null, labelIds: t.labels.map((tl) => tl.labelId),
    })),
    filters: [],
  };
}

export async function instantiateTemplate(
  userId: string,
  template: Backup,
  name?: string,
): Promise<{ projects: number; tasks: number }> {
  if (name && template.projects[0]) template.projects[0].name = name;
  return importData(userId, template);
}
