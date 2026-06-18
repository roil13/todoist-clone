import { db, uuid, now, type TaskRow, type ProjectRow, type SectionRow, type LabelRow } from "./db";
import { nextOccurrence } from "@/lib/recurrence";
import { parseQuickAdd } from "@/lib/quick-add/parser";
import type {
  TaskDTO,
  ProjectDTO,
  SectionDTO,
  LabelDTO,
  FilterDTO,
  CommentDTO,
} from "@/lib/types";

const live = <T extends { deletedAt: number | null }>(rows: T[]) => rows.filter((r) => !r.deletedAt);
const KARMA_PER_TASK = 5;

// ---------------------------------------------------------------- activity / karma
async function logActivity(eventType: string, objectType: string, objectId: string, payload: Record<string, unknown> = {}) {
  await db.activityEvents.add({ id: uuid(), eventType, objectType, objectId, payload, createdAt: new Date().toISOString(), updatedAt: now(), deletedAt: null });
}
async function awardKarma(points: number, reason: string) {
  await db.karmaEvents.add({ id: uuid(), points, reason, createdAt: new Date().toISOString(), updatedAt: now(), deletedAt: null });
}

// ---------------------------------------------------------------- serializers
function toProject(p: ProjectRow): ProjectDTO {
  return { id: p.id, name: p.name, color: p.color, parentId: p.parentId, order: p.order, isFavorite: p.isFavorite, isArchived: p.isArchived, isInbox: p.isInbox, defaultView: p.defaultView };
}
function toSection(s: SectionRow): SectionDTO {
  return { id: s.id, name: s.name, projectId: s.projectId, order: s.order, isCollapsed: s.isCollapsed };
}
function toLabel(l: LabelRow): LabelDTO {
  return { id: l.id, name: l.name, color: l.color, order: l.order, isFavorite: l.isFavorite };
}
async function toTask(t: TaskRow, labelsById: Map<string, LabelRow>): Promise<TaskDTO> {
  const [subs, comments] = await Promise.all([
    db.tasks.where("parentId").equals(t.id).count(),
    db.comments.where("taskId").equals(t.id).count(),
  ]);
  return {
    id: t.id, content: t.content, description: t.description, projectId: t.projectId,
    sectionId: t.sectionId, parentId: t.parentId, priority: t.priority, order: t.order,
    dueDate: t.dueDate, dueDatetime: t.dueDatetime, dueString: t.dueString,
    recurrenceRule: t.recurrenceRule, isRecurring: t.isRecurring, duration: t.duration,
    durationUnit: t.durationUnit, isCompleted: t.isCompleted, completedAt: t.completedAt,
    createdAt: t.createdAt,
    labels: t.labelIds.map((id) => labelsById.get(id)).filter((l): l is LabelRow => !!l).map(toLabel),
    subtaskCount: subs, commentCount: comments,
  };
}

async function inboxId(): Promise<string> {
  const inbox = await db.projects.filter((p) => p.isInbox && !p.deletedAt).first();
  return inbox!.id;
}

// ---------------------------------------------------------------- projects
export async function listProjects(includeArchived = false): Promise<ProjectDTO[]> {
  const rows = live(await db.projects.toArray());
  return rows
    .filter((p) => includeArchived || !p.isArchived)
    .sort((a, b) => Number(b.isInbox) - Number(a.isInbox) || a.order - b.order)
    .map(toProject);
}
export type ProjectInput = { name: string; color?: string; parentId?: string | null; isFavorite?: boolean; isArchived?: boolean; defaultView?: ProjectDTO["defaultView"] };
export async function createProject(input: ProjectInput): Promise<ProjectDTO> {
  const last = (await db.projects.toArray()).reduce((m, p) => Math.max(m, p.order), -1);
  const row: ProjectRow = {
    id: uuid(), name: input.name, color: input.color ?? "charcoal", parentId: input.parentId ?? null,
    order: last + 1, isFavorite: input.isFavorite ?? false, isArchived: false, isInbox: false,
    defaultView: input.defaultView ?? "LIST", createdAt: new Date().toISOString(), updatedAt: now(), deletedAt: null,
  };
  await db.projects.add(row);
  await logActivity("project_added", "project", row.id, { name: row.name });
  return toProject(row);
}
export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<ProjectDTO> {
  await db.projects.update(id, { ...stripUndefined(input), updatedAt: now() });
  return toProject((await db.projects.get(id))!);
}
export async function deleteProject(id: string): Promise<void> {
  const p = await db.projects.get(id);
  if (p?.isInbox) throw new Error("The Inbox cannot be deleted.");
  await softDeleteProjectCascade(id);
  await logActivity("project_deleted", "project", id, { name: p?.name });
}
async function softDeleteProjectCascade(id: string) {
  const ts = now();
  await db.projects.update(id, { deletedAt: ts, updatedAt: ts });
  const children = (await db.projects.where("parentId").equals(id).toArray()).filter((c) => !c.deletedAt);
  for (const c of children) await softDeleteProjectCascade(c.id);
  const tasks = (await db.tasks.where("projectId").equals(id).toArray()).filter((t) => !t.deletedAt);
  for (const t of tasks) await db.tasks.update(t.id, { deletedAt: ts, updatedAt: ts });
  const sections = (await db.sections.where("projectId").equals(id).toArray()).filter((s) => !s.deletedAt);
  for (const s of sections) await db.sections.update(s.id, { deletedAt: ts, updatedAt: ts });
}
export async function reorderProjects(items: { id: string; order: number; parentId?: string | null }[]) {
  const ts = now();
  await db.transaction("rw", db.projects, async () => {
    for (const it of items) {
      const p = await db.projects.get(it.id);
      if (p && !p.isInbox) await db.projects.update(it.id, { order: it.order, parentId: it.parentId ?? p.parentId, updatedAt: ts });
    }
  });
}

// ---------------------------------------------------------------- sections
export async function listSections(projectId: string): Promise<SectionDTO[]> {
  const rows = live(await db.sections.where("projectId").equals(projectId).toArray());
  return rows.sort((a, b) => a.order - b.order).map(toSection);
}
export async function createSection(input: { name: string; projectId: string }): Promise<SectionDTO> {
  const last = live(await db.sections.where("projectId").equals(input.projectId).toArray()).reduce((m, s) => Math.max(m, s.order), -1);
  const row: SectionRow = { id: uuid(), name: input.name, projectId: input.projectId, order: last + 1, isCollapsed: false, updatedAt: now(), deletedAt: null };
  await db.sections.add(row);
  return toSection(row);
}
export async function updateSection(id: string, input: { name?: string; isCollapsed?: boolean }): Promise<SectionDTO> {
  await db.sections.update(id, { ...stripUndefined(input), updatedAt: now() });
  return toSection((await db.sections.get(id))!);
}
export async function deleteSection(id: string): Promise<void> {
  const ts = now();
  await db.sections.update(id, { deletedAt: ts, updatedAt: ts });
  const tasks = (await db.tasks.where("sectionId").equals(id).toArray()).filter((t) => !t.deletedAt);
  for (const t of tasks) await db.tasks.update(t.id, { sectionId: null, updatedAt: ts });
}

// ---------------------------------------------------------------- labels
export async function listLabels(): Promise<LabelDTO[]> {
  return live(await db.labels.toArray()).sort((a, b) => a.order - b.order).map(toLabel);
}
export async function createLabel(input: { name: string; color?: string; isFavorite?: boolean }): Promise<LabelDTO> {
  const last = live(await db.labels.toArray()).reduce((m, l) => Math.max(m, l.order), -1);
  const row: LabelRow = { id: uuid(), name: input.name, color: input.color ?? "charcoal", order: last + 1, isFavorite: input.isFavorite ?? false, updatedAt: now(), deletedAt: null };
  await db.labels.add(row);
  return toLabel(row);
}
export async function ensureLabel(name: string): Promise<LabelDTO> {
  const existing = live(await db.labels.toArray()).find((l) => l.name.toLowerCase() === name.toLowerCase());
  return existing ? toLabel(existing) : createLabel({ name });
}
export async function updateLabel(id: string, input: { name?: string; color?: string; isFavorite?: boolean }): Promise<LabelDTO> {
  await db.labels.update(id, { ...stripUndefined(input), updatedAt: now() });
  return toLabel((await db.labels.get(id))!);
}
export async function deleteLabel(id: string): Promise<void> {
  const ts = now();
  await db.labels.update(id, { deletedAt: ts, updatedAt: ts });
  const tasks = (await db.tasks.where("labelIds").equals(id).toArray()).filter((t) => !t.deletedAt);
  for (const t of tasks) await db.tasks.update(t.id, { labelIds: t.labelIds.filter((x) => x !== id), updatedAt: ts });
}

// ---------------------------------------------------------------- tasks
export type TaskListParams = { projectId?: string; sectionId?: string | null; labelId?: string; parentId?: string | null; view?: "inbox" | "today" | "upcoming" | "completed"; search?: string; includeCompleted?: boolean };
function startOfTodayUTC(): number {
  const n = new Date();
  return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
}
export async function listTasks(params: TaskListParams): Promise<TaskDTO[]> {
  let rows = live(await db.tasks.toArray());
  const labelsById = new Map(live(await db.labels.toArray()).map((l) => [l.id, l]));

  if (params.view === "completed") rows = rows.filter((t) => t.isCompleted);
  else if (!params.includeCompleted) rows = rows.filter((t) => !t.isCompleted);

  if (params.view === "inbox") { const id = await inboxId(); rows = rows.filter((t) => t.projectId === id); }
  if (params.projectId) rows = rows.filter((t) => t.projectId === params.projectId);
  if (params.sectionId !== undefined) rows = rows.filter((t) => t.sectionId === params.sectionId);
  if (params.parentId !== undefined) rows = rows.filter((t) => t.parentId === params.parentId);
  if (params.labelId) rows = rows.filter((t) => t.labelIds.includes(params.labelId!));
  if (params.search) {
    const q = params.search.toLowerCase();
    rows = rows.filter((t) => (t.content + " " + t.description).toLowerCase().includes(q));
  }
  if (params.view === "today") {
    const end = startOfTodayUTC() + 86_400_000;
    rows = rows.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < end);
  } else if (params.view === "upcoming") {
    const start = startOfTodayUTC();
    rows = rows.filter((t) => t.dueDate && new Date(t.dueDate).getTime() >= start);
  }

  const byDue = (a: TaskRow, b: TaskRow) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "") || a.priority - b.priority || a.order - b.order;
  if (params.view === "today" || params.view === "upcoming") rows.sort(byDue);
  else if (params.view === "completed") rows.sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  else rows.sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));

  return Promise.all(rows.map((t) => toTask(t, labelsById)));
}
export type TaskInput = { content: string; description?: string; projectId?: string; sectionId?: string | null; parentId?: string | null; priority?: number; dueDate?: string | null; dueDatetime?: string | null; dueString?: string | null; recurrenceRule?: string | null; duration?: number | null; durationUnit?: string | null; labelIds?: string[] };
export async function createTask(input: TaskInput): Promise<TaskDTO> {
  const projectId = input.projectId ?? (await inboxId());
  const siblings = live(await db.tasks.toArray()).filter((t) => t.projectId === projectId && (t.sectionId ?? null) === (input.sectionId ?? null) && (t.parentId ?? null) === (input.parentId ?? null));
  const order = siblings.reduce((m, t) => Math.max(m, t.order), -1) + 1;
  const row: TaskRow = {
    id: uuid(), content: input.content, description: input.description ?? "", projectId,
    sectionId: input.sectionId ?? null, parentId: input.parentId ?? null, priority: input.priority ?? 4, order,
    dueDate: input.dueDate ?? null, dueDatetime: input.dueDatetime ?? null, dueString: input.dueString ?? null,
    recurrenceRule: input.recurrenceRule ?? null, isRecurring: !!input.recurrenceRule,
    duration: input.duration ?? null, durationUnit: input.durationUnit ?? null,
    isCompleted: false, completedAt: null, createdAt: new Date().toISOString(),
    labelIds: input.labelIds ?? [], updatedAt: now(), deletedAt: null,
  };
  await db.tasks.add(row);
  await logActivity("task_added", "task", row.id, { content: row.content });
  const labelsById = new Map(live(await db.labels.toArray()).map((l) => [l.id, l]));
  return toTask(row, labelsById);
}
export async function updateTask(id: string, input: Partial<TaskInput>): Promise<TaskDTO> {
  const patch: Partial<TaskRow> = { ...stripUndefined(input), updatedAt: now() };
  if (input.recurrenceRule !== undefined) patch.isRecurring = !!input.recurrenceRule;
  await db.tasks.update(id, patch);
  await logActivity("task_updated", "task", id, {});
  const labelsById = new Map(live(await db.labels.toArray()).map((l) => [l.id, l]));
  return toTask((await db.tasks.get(id))!, labelsById);
}
export async function deleteTask(id: string): Promise<void> {
  const ts = now();
  const t = await db.tasks.get(id);
  await db.tasks.update(id, { deletedAt: ts, updatedAt: ts });
  const subs = (await db.tasks.where("parentId").equals(id).toArray()).filter((s) => !s.deletedAt);
  for (const s of subs) await db.tasks.update(s.id, { deletedAt: ts, updatedAt: ts });
  await logActivity("task_deleted", "task", id, { content: t?.content });
}
export async function reorderTasks(items: { id: string; order: number; sectionId?: string | null; projectId?: string }[]) {
  const ts = now();
  await db.transaction("rw", db.tasks, async () => {
    for (const it of items) {
      const patch: Partial<TaskRow> = { order: it.order, updatedAt: ts };
      if (it.sectionId !== undefined) patch.sectionId = it.sectionId;
      if (it.projectId !== undefined) patch.projectId = it.projectId;
      await db.tasks.update(it.id, patch);
    }
  });
}
export async function completeTask(id: string): Promise<TaskDTO> {
  const t = await db.tasks.get(id);
  if (!t) throw new Error("Task not found");
  const labelsById = new Map(live(await db.labels.toArray()).map((l) => [l.id, l]));
  if (t.isRecurring && t.recurrenceRule) {
    const base = t.dueDatetime ?? t.dueDate;
    const nxt = nextOccurrence(t.recurrenceRule, base ? new Date(base) : null);
    if (nxt.nextDueDate || nxt.nextDueDatetime) {
      await db.tasks.update(id, { dueDate: (nxt.nextDueDate ?? (t.dueDate ? new Date(t.dueDate) : null))?.toISOString() ?? null, dueDatetime: nxt.nextDueDatetime?.toISOString() ?? null, updatedAt: now() });
      await logActivity("task_completed", "task", id, { recurring: true });
      await awardKarma(KARMA_PER_TASK, "completed recurring task");
      return toTask((await db.tasks.get(id))!, labelsById);
    }
  }
  const ts = now();
  await db.tasks.update(id, { isCompleted: true, completedAt: new Date().toISOString(), updatedAt: ts });
  const subs = (await db.tasks.where("parentId").equals(id).toArray()).filter((s) => !s.deletedAt && !s.isCompleted);
  for (const s of subs) await db.tasks.update(s.id, { isCompleted: true, completedAt: new Date().toISOString(), updatedAt: ts });
  await logActivity("task_completed", "task", id, { content: t.content });
  await awardKarma(KARMA_PER_TASK, "completed task");
  return toTask((await db.tasks.get(id))!, labelsById);
}
export async function uncompleteTask(id: string): Promise<TaskDTO> {
  await db.tasks.update(id, { isCompleted: false, completedAt: null, updatedAt: now() });
  await logActivity("task_uncompleted", "task", id, {});
  await awardKarma(-KARMA_PER_TASK, "uncompleted task");
  const labelsById = new Map(live(await db.labels.toArray()).map((l) => [l.id, l]));
  return toTask((await db.tasks.get(id))!, labelsById);
}

// ---------------------------------------------------------------- quick add
export async function quickAddTask(input: { text: string; projectId?: string; sectionId?: string | null; parentId?: string | null; defaultDueDate?: string | null }): Promise<TaskDTO> {
  const parsed = parseQuickAdd(input.text);
  let projectId = input.projectId;
  if (parsed.projectName) {
    const target = parsed.projectName.toLowerCase();
    const projects = live(await db.projects.toArray()).filter((p) => !p.isArchived);
    const match = projects.find((p) => p.name.toLowerCase() === target) ?? projects.find((p) => p.name.toLowerCase().startsWith(target));
    if (match) projectId = match.id;
  }
  const labelIds: string[] = [];
  for (const name of parsed.labelNames) labelIds.push((await ensureLabel(name)).id);
  return createTask({
    content: parsed.content || input.text.trim(), projectId, sectionId: input.sectionId ?? null, parentId: input.parentId ?? null,
    priority: parsed.priority, dueDate: parsed.dueDate ?? input.defaultDueDate ?? null, dueDatetime: parsed.dueDatetime,
    dueString: parsed.dueString, recurrenceRule: parsed.recurrenceRule, labelIds,
  });
}

// ---------------------------------------------------------------- filters
export async function listFilters(): Promise<FilterDTO[]> {
  return live(await db.filters.toArray()).sort((a, b) => a.order - b.order).map((f) => ({ id: f.id, name: f.name, query: f.query, color: f.color, order: f.order, isFavorite: f.isFavorite }));
}
export async function createFilter(input: { name: string; query: string; color?: string; isFavorite?: boolean }): Promise<FilterDTO> {
  const last = live(await db.filters.toArray()).reduce((m, f) => Math.max(m, f.order), -1);
  const row = { id: uuid(), name: input.name, query: input.query, color: input.color ?? "charcoal", order: last + 1, isFavorite: input.isFavorite ?? false, updatedAt: now(), deletedAt: null };
  await db.filters.add(row);
  return { id: row.id, name: row.name, query: row.query, color: row.color, order: row.order, isFavorite: row.isFavorite };
}
export async function updateFilter(id: string, input: { name?: string; query?: string; color?: string; isFavorite?: boolean }): Promise<FilterDTO> {
  await db.filters.update(id, { ...stripUndefined(input), updatedAt: now() });
  const f = (await db.filters.get(id))!;
  return { id: f.id, name: f.name, query: f.query, color: f.color, order: f.order, isFavorite: f.isFavorite };
}
export async function deleteFilter(id: string): Promise<void> {
  await db.filters.update(id, { deletedAt: now(), updatedAt: now() });
}

// ---------------------------------------------------------------- comments (+ local attachments)
export async function listComments(target: { taskId?: string; projectId?: string }): Promise<CommentDTO[]> {
  let rows = live(await db.comments.toArray());
  if (target.taskId) rows = rows.filter((c) => c.taskId === target.taskId);
  if (target.projectId) rows = rows.filter((c) => c.projectId === target.projectId);
  rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const atts = live(await db.attachments.toArray());
  return rows.map((c) => ({
    id: c.id, content: c.content, createdAt: c.createdAt,
    attachments: atts.filter((a) => a.commentId === c.id).map((a) => ({ id: a.id, fileName: a.fileName, mimeType: a.mimeType, size: a.size })),
  }));
}
export async function addComment(input: { taskId?: string; projectId?: string; content: string; files: { buffer: ArrayBuffer; name: string; type: string }[] }): Promise<CommentDTO> {
  const id = uuid();
  await db.comments.add({ id, taskId: input.taskId ?? null, projectId: input.projectId ?? null, content: input.content, createdAt: new Date().toISOString(), updatedAt: now(), deletedAt: null });
  for (const f of input.files) {
    await db.attachments.add({ id: uuid(), commentId: id, fileName: f.name, mimeType: f.type, size: f.buffer.byteLength, blob: new Blob([f.buffer], { type: f.type }), updatedAt: now(), deletedAt: null });
  }
  return (await listComments({ taskId: input.taskId, projectId: input.projectId })).find((c) => c.id === id)!;
}
export async function deleteComment(id: string): Promise<void> {
  const ts = now();
  await db.comments.update(id, { deletedAt: ts, updatedAt: ts });
  const atts = (await db.attachments.where("commentId").equals(id).toArray()).filter((a) => !a.deletedAt);
  for (const a of atts) await db.attachments.update(a.id, { deletedAt: ts, updatedAt: ts });
}
export async function getAttachmentBlob(id: string): Promise<{ blob: Blob; fileName: string } | null> {
  const a = await db.attachments.get(id);
  return a?.blob ? { blob: a.blob, fileName: a.fileName } : null;
}

export async function duplicateProject(projectId: string): Promise<ProjectDTO> {
  const src = await db.projects.get(projectId);
  if (!src) throw new Error("Project not found");
  const copy = await createProject({ name: `${src.name} copy`, color: src.color, defaultView: src.defaultView });

  const sections = live(await db.sections.where("projectId").equals(projectId).toArray());
  const sectionMap = new Map<string, string>();
  for (const s of sections) {
    const ns = await createSection({ name: s.name, projectId: copy.id });
    sectionMap.set(s.id, ns.id);
  }

  const tasks = live(await db.tasks.where("projectId").equals(projectId).toArray()).filter((t) => !t.isCompleted);
  const taskMap = new Map<string, string>();
  // First pass: top-level tasks; second pass: sub-tasks (need parent's new id).
  for (const t of tasks.filter((t) => !t.parentId)) {
    const nt = await createTask({ content: t.content, description: t.description, projectId: copy.id, sectionId: t.sectionId ? sectionMap.get(t.sectionId) ?? null : null, priority: t.priority, dueDate: t.dueDate, dueDatetime: t.dueDatetime, dueString: t.dueString, recurrenceRule: t.recurrenceRule, labelIds: t.labelIds });
    taskMap.set(t.id, nt.id);
  }
  for (const t of tasks.filter((t) => t.parentId && taskMap.has(t.parentId))) {
    const nt = await createTask({ content: t.content, description: t.description, projectId: copy.id, parentId: taskMap.get(t.parentId!), priority: t.priority, dueDate: t.dueDate, dueDatetime: t.dueDatetime, labelIds: t.labelIds });
    taskMap.set(t.id, nt.id);
  }
  return copy;
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
