import { prisma } from "@/lib/db";

export type Backup = {
  version: number;
  exportedAt: string;
  projects: ProjectExport[];
  sections: SectionExport[];
  labels: LabelExport[];
  tasks: TaskExport[];
  filters: FilterExport[];
};

type ProjectExport = {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  order: number;
  isFavorite: boolean;
  isArchived: boolean;
  isInbox: boolean;
  defaultView: string;
};
type SectionExport = { id: string; projectId: string; name: string; order: number };
type LabelExport = { id: string; name: string; color: string; order: number; isFavorite: boolean };
type TaskExport = {
  id: string;
  content: string;
  description: string;
  projectId: string;
  sectionId: string | null;
  parentId: string | null;
  priority: number;
  order: number;
  dueDate: string | null;
  dueDatetime: string | null;
  dueString: string | null;
  recurrenceRule: string | null;
  isRecurring: boolean;
  duration: number | null;
  durationUnit: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  labelIds: string[];
};
type FilterExport = { name: string; query: string; color: string; order: number; isFavorite: boolean };

export async function exportData(userId: string): Promise<Backup> {
  const [projects, sections, labels, tasks, filters] = await Promise.all([
    prisma.project.findMany({ where: { userId } }),
    prisma.section.findMany({ where: { userId } }),
    prisma.label.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId }, include: { labels: true } }),
    prisma.filter.findMany({ where: { userId } }),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: projects.map((p) => ({
      id: p.id, name: p.name, color: p.color, parentId: p.parentId, order: p.order,
      isFavorite: p.isFavorite, isArchived: p.isArchived, isInbox: p.isInbox, defaultView: p.defaultView,
    })),
    sections: sections.map((s) => ({ id: s.id, projectId: s.projectId, name: s.name, order: s.order })),
    labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color, order: l.order, isFavorite: l.isFavorite })),
    tasks: tasks.map((t) => ({
      id: t.id, content: t.content, description: t.description, projectId: t.projectId,
      sectionId: t.sectionId, parentId: t.parentId, priority: t.priority, order: t.order,
      dueDate: t.dueDate?.toISOString() ?? null, dueDatetime: t.dueDatetime?.toISOString() ?? null,
      dueString: t.dueString, recurrenceRule: t.recurrenceRule, isRecurring: t.isRecurring,
      duration: t.duration, durationUnit: t.durationUnit, isCompleted: t.isCompleted,
      completedAt: t.completedAt?.toISOString() ?? null, labelIds: t.labels.map((tl) => tl.labelId),
    })),
    filters: filters.map((f) => ({ name: f.name, query: f.query, color: f.color, order: f.order, isFavorite: f.isFavorite })),
  };
}

/**
 * Import a backup additively: existing data is kept and the backup's records are
 * re-created with fresh ids (old ids remapped). The backup Inbox merges into the
 * user's existing Inbox.
 */
export async function importData(userId: string, backup: Backup): Promise<{ projects: number; tasks: number }> {
  const labelMap = new Map<string, string>();
  const projectMap = new Map<string, string>();
  const sectionMap = new Map<string, string>();

  // Labels (reuse existing by name).
  for (const l of backup.labels) {
    const existing = await prisma.label.findUnique({ where: { userId_name: { userId, name: l.name } } });
    if (existing) labelMap.set(l.id, existing.id);
    else {
      const created = await prisma.label.create({
        data: { userId, name: l.name, color: l.color, order: l.order, isFavorite: l.isFavorite },
      });
      labelMap.set(l.id, created.id);
    }
  }

  // Projects: create without parent, then wire parents.
  const inbox = await prisma.project.findFirst({ where: { userId, isInbox: true } });
  for (const p of backup.projects) {
    if (p.isInbox) {
      if (inbox) projectMap.set(p.id, inbox.id);
      continue;
    }
    const created = await prisma.project.create({
      data: {
        userId, name: p.name, color: p.color, order: p.order, isFavorite: p.isFavorite,
        isArchived: p.isArchived, defaultView: p.defaultView,
      },
    });
    projectMap.set(p.id, created.id);
  }
  for (const p of backup.projects) {
    if (p.isInbox || !p.parentId) continue;
    const newId = projectMap.get(p.id);
    const newParent = projectMap.get(p.parentId);
    if (newId && newParent) await prisma.project.update({ where: { id: newId }, data: { parentId: newParent } });
  }

  // Sections.
  for (const s of backup.sections) {
    const projectId = projectMap.get(s.projectId);
    if (!projectId) continue;
    const created = await prisma.section.create({
      data: { userId, projectId, name: s.name, order: s.order },
    });
    sectionMap.set(s.id, created.id);
  }

  // Tasks: create without parent, then wire parents and labels.
  const taskMap = new Map<string, string>();
  for (const t of backup.tasks) {
    const projectId = projectMap.get(t.projectId);
    if (!projectId) continue;
    const created = await prisma.task.create({
      data: {
        userId, content: t.content, description: t.description, projectId,
        sectionId: t.sectionId ? sectionMap.get(t.sectionId) ?? null : null,
        priority: t.priority, order: t.order,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        dueDatetime: t.dueDatetime ? new Date(t.dueDatetime) : null,
        dueString: t.dueString, recurrenceRule: t.recurrenceRule, isRecurring: t.isRecurring,
        duration: t.duration, durationUnit: t.durationUnit,
        isCompleted: t.isCompleted, completedAt: t.completedAt ? new Date(t.completedAt) : null,
      },
    });
    taskMap.set(t.id, created.id);
  }
  for (const t of backup.tasks) {
    const newId = taskMap.get(t.id);
    if (!newId) continue;
    if (t.parentId) {
      const newParent = taskMap.get(t.parentId);
      if (newParent) await prisma.task.update({ where: { id: newId }, data: { parentId: newParent } });
    }
    const labelIds = t.labelIds.map((id) => labelMap.get(id)).filter((x): x is string => !!x);
    if (labelIds.length) {
      await prisma.taskLabel.createMany({ data: labelIds.map((labelId) => ({ taskId: newId, labelId })) });
    }
  }

  // Filters.
  for (const f of backup.filters) {
    await prisma.filter.create({
      data: { userId, name: f.name, query: f.query, color: f.color, order: f.order, isFavorite: f.isFavorite },
    });
  }

  return { projects: projectMap.size, tasks: taskMap.size };
}
