import Dexie, { type Table } from "dexie";

// Local-first IndexedDB store (Dexie). Every row carries sync metadata:
//   updatedAt — ms epoch of last change (last-write-wins on sync)
//   deletedAt — soft-delete tombstone (null = live), so deletes propagate
// Domain date fields (dueDate, completedAt, …) stay ISO strings, matching the DTOs.

export type Sync = { updatedAt: number; deletedAt: number | null };

export interface ProjectRow extends Sync {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  order: number;
  isFavorite: boolean;
  isArchived: boolean;
  isInbox: boolean;
  defaultView: "LIST" | "BOARD" | "CALENDAR";
  createdAt: string;
}

export interface SectionRow extends Sync {
  id: string;
  name: string;
  projectId: string;
  order: number;
  isCollapsed: boolean;
}

export interface TaskRow extends Sync {
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
  createdAt: string;
  labelIds: string[];
}

export interface LabelRow extends Sync {
  id: string;
  name: string;
  color: string;
  order: number;
  isFavorite: boolean;
}

export interface CommentRow extends Sync {
  id: string;
  taskId: string | null;
  projectId: string | null;
  content: string;
  createdAt: string;
}

export interface AttachmentRow extends Sync {
  id: string;
  commentId: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob?: Blob; // local-only; not synced in v1
}

export interface ReminderRow extends Sync {
  id: string;
  taskId: string;
  type: "ABSOLUTE" | "RELATIVE";
  triggerAt: string | null;
  offsetMinutes: number | null;
  lastFiredAt: string | null;
}

export interface FilterRow extends Sync {
  id: string;
  name: string;
  query: string;
  color: string;
  order: number;
  isFavorite: boolean;
}

export interface ActivityRow extends Sync {
  id: string;
  eventType: string;
  objectType: string;
  objectId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface KarmaRow extends Sync {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface SettingsRow extends Sync {
  id: string; // singleton "settings"
  theme: string;
  weekStart: number;
  timeZone: string;
  dateLanguage: string;
  dailyGoal: number;
  weeklyGoal: number;
  vacationMode: boolean;
}

class TasksDB extends Dexie {
  projects!: Table<ProjectRow, string>;
  sections!: Table<SectionRow, string>;
  tasks!: Table<TaskRow, string>;
  labels!: Table<LabelRow, string>;
  comments!: Table<CommentRow, string>;
  attachments!: Table<AttachmentRow, string>;
  reminders!: Table<ReminderRow, string>;
  filters!: Table<FilterRow, string>;
  activityEvents!: Table<ActivityRow, string>;
  karmaEvents!: Table<KarmaRow, string>;
  settings!: Table<SettingsRow, string>;

  constructor() {
    super("tasks-db");
    // IndexedDB can't index booleans, so isInbox/isCompleted/etc. are filtered
    // in memory (single-user data is small).
    this.version(1).stores({
      projects: "&id, parentId, order",
      sections: "&id, projectId, order",
      tasks: "&id, projectId, sectionId, parentId, dueDate, order, *labelIds",
      labels: "&id, name, order",
      comments: "&id, taskId, projectId",
      attachments: "&id, commentId",
      reminders: "&id, taskId",
      filters: "&id, order",
      activityEvents: "&id, createdAt",
      karmaEvents: "&id, createdAt",
      settings: "&id",
    });
  }
}

export const db = new TasksDB();

export const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const now = () => Date.now();

/** Tables that participate in Drive sync (attachments excluded — blobs are local). */
export const SYNCED_TABLES = [
  "projects",
  "sections",
  "tasks",
  "labels",
  "comments",
  "reminders",
  "filters",
  "activityEvents",
  "karmaEvents",
  "settings",
] as const;

/** Create the Inbox project + default settings on first run. */
export async function ensureSeed(): Promise<void> {
  const hasInbox = await db.projects.filter((p) => p.isInbox && !p.deletedAt).first();
  if (!hasInbox) {
    await db.projects.add({
      id: uuid(),
      name: "Inbox",
      color: "charcoal",
      parentId: null,
      order: 0,
      isFavorite: false,
      isArchived: false,
      isInbox: true,
      defaultView: "LIST",
      createdAt: new Date().toISOString(),
      updatedAt: now(),
      deletedAt: null,
    });
  }
  const settings = await db.settings.get("settings");
  if (!settings) {
    await db.settings.add({
      id: "settings",
      theme: "light",
      weekStart: 1,
      timeZone: "UTC",
      dateLanguage: "en",
      dailyGoal: 5,
      weeklyGoal: 30,
      vacationMode: false,
      updatedAt: now(),
      deletedAt: null,
    });
  }
}
