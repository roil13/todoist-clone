// Shared DTO shapes returned by the API (dates serialized as ISO strings).

export type LabelDTO = {
  id: string;
  name: string;
  color: string;
  order: number;
  isFavorite: boolean;
};

export type TaskDTO = {
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
  labels: LabelDTO[];
  subtaskCount: number;
  commentCount: number;
};

export type SectionDTO = {
  id: string;
  name: string;
  projectId: string;
  order: number;
  isCollapsed: boolean;
};

export type ProjectDTO = {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  order: number;
  isFavorite: boolean;
  isArchived: boolean;
  isInbox: boolean;
  defaultView: "LIST" | "BOARD" | "CALENDAR";
};

export type AttachmentDTO = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type CommentDTO = {
  id: string;
  content: string;
  createdAt: string;
  attachments: AttachmentDTO[];
};

export type FilterDTO = {
  id: string;
  name: string;
  query: string;
  color: string;
  order: number;
  isFavorite: boolean;
};

export const PROJECT_COLORS: { name: string; hex: string }[] = [
  { name: "berry_red", hex: "#b8255f" },
  { name: "red", hex: "#db4035" },
  { name: "orange", hex: "#ff9933" },
  { name: "yellow", hex: "#fad000" },
  { name: "olive_green", hex: "#afb83b" },
  { name: "lime_green", hex: "#7ecc49" },
  { name: "green", hex: "#299438" },
  { name: "mint_green", hex: "#6accbc" },
  { name: "teal", hex: "#158fad" },
  { name: "sky_blue", hex: "#14aaf5" },
  { name: "light_blue", hex: "#96c3eb" },
  { name: "blue", hex: "#4073ff" },
  { name: "grape", hex: "#884dff" },
  { name: "violet", hex: "#af38eb" },
  { name: "lavender", hex: "#eb96eb" },
  { name: "magenta", hex: "#e05194" },
  { name: "salmon", hex: "#ff8d85" },
  { name: "charcoal", hex: "#808080" },
  { name: "grey", hex: "#b8b8b8" },
];

export function colorHex(name: string): string {
  return PROJECT_COLORS.find((c) => c.name === name)?.hex ?? "#808080";
}
