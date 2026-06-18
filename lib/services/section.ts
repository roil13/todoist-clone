import { prisma } from "@/lib/db";
import { serializeSection } from "./serialize";
import type { SectionDTO } from "@/lib/types";

export async function listSections(
  userId: string,
  projectId: string,
): Promise<SectionDTO[]> {
  const sections = await prisma.section.findMany({
    where: { userId, projectId },
    orderBy: { order: "asc" },
  });
  return sections.map(serializeSection);
}

export async function createSection(
  userId: string,
  input: { name: string; projectId: string },
): Promise<SectionDTO> {
  const last = await prisma.section.findFirst({
    where: { userId, projectId: input.projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const section = await prisma.section.create({
    data: {
      userId,
      projectId: input.projectId,
      name: input.name,
      order: (last?.order ?? -1) + 1,
    },
  });
  return serializeSection(section);
}

export async function updateSection(
  userId: string,
  id: string,
  input: { name?: string; isCollapsed?: boolean },
): Promise<SectionDTO> {
  const existing = await prisma.section.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Section not found");
  const section = await prisma.section.update({
    where: { id },
    data: { name: input.name, isCollapsed: input.isCollapsed },
  });
  return serializeSection(section);
}

export async function deleteSection(userId: string, id: string): Promise<void> {
  const existing = await prisma.section.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Section not found");
  // Tasks in the section fall back to "no section" (onDelete: SetNull).
  await prisma.section.delete({ where: { id } });
}

export async function reorderSections(
  userId: string,
  items: { id: string; order: number }[],
): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.section.updateMany({
        where: { id: item.id, userId },
        data: { order: item.order },
      }),
    ),
  );
}
