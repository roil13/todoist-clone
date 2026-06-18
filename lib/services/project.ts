import { prisma } from "@/lib/db";
import { serializeProject } from "./serialize";
import { logActivity } from "./activity";
import type { ProjectDTO } from "@/lib/types";

export async function listProjects(
  userId: string,
  includeArchived = false,
): Promise<ProjectDTO[]> {
  const projects = await prisma.project.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    orderBy: [{ isInbox: "desc" }, { order: "asc" }],
  });
  return projects.map(serializeProject);
}

export async function getProject(
  userId: string,
  id: string,
): Promise<ProjectDTO | null> {
  const p = await prisma.project.findFirst({ where: { id, userId } });
  return p ? serializeProject(p) : null;
}

export type ProjectInput = {
  name: string;
  color?: string;
  parentId?: string | null;
  isFavorite?: boolean;
  defaultView?: "LIST" | "BOARD" | "CALENDAR";
};

export async function createProject(
  userId: string,
  input: ProjectInput,
): Promise<ProjectDTO> {
  const last = await prisma.project.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const project = await prisma.project.create({
    data: {
      userId,
      name: input.name,
      color: input.color ?? "charcoal",
      parentId: input.parentId ?? null,
      isFavorite: input.isFavorite ?? false,
      defaultView: input.defaultView ?? "LIST",
      order: (last?.order ?? -1) + 1,
    },
  });
  await logActivity(userId, "project_added", "project", project.id, { name: project.name });
  return serializeProject(project);
}

export async function updateProject(
  userId: string,
  id: string,
  input: Partial<ProjectInput> & { isArchived?: boolean },
): Promise<ProjectDTO> {
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Project not found");
  if (existing.isInbox && input.parentId)
    throw new Error("The Inbox cannot be nested.");

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: input.name,
      color: input.color,
      parentId: input.parentId,
      isFavorite: input.isFavorite,
      isArchived: input.isArchived,
      defaultView: input.defaultView,
    },
  });
  return serializeProject(project);
}

export async function deleteProject(userId: string, id: string): Promise<void> {
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Project not found");
  if (existing.isInbox) throw new Error("The Inbox cannot be deleted.");
  await prisma.project.delete({ where: { id } });
  await logActivity(userId, "project_deleted", "project", id, { name: existing.name });
}

export async function reorderProjects(
  userId: string,
  items: { id: string; order: number; parentId?: string | null }[],
): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.project.updateMany({
        where: { id: item.id, userId, isInbox: false },
        data: { order: item.order, parentId: item.parentId },
      }),
    ),
  );
}
