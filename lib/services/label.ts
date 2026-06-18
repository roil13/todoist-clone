import { prisma } from "@/lib/db";
import { serializeLabel } from "./serialize";
import type { LabelDTO } from "@/lib/types";

export async function listLabels(userId: string): Promise<LabelDTO[]> {
  const labels = await prisma.label.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });
  return labels.map(serializeLabel);
}

export async function createLabel(
  userId: string,
  input: { name: string; color?: string; isFavorite?: boolean },
): Promise<LabelDTO> {
  const last = await prisma.label.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const label = await prisma.label.create({
    data: {
      userId,
      name: input.name,
      color: input.color ?? "charcoal",
      isFavorite: input.isFavorite ?? false,
      order: (last?.order ?? -1) + 1,
    },
  });
  return serializeLabel(label);
}

/** Find an existing label by name or create one (used by Quick Add @tokens). */
export async function ensureLabel(userId: string, name: string): Promise<LabelDTO> {
  const existing = await prisma.label.findUnique({
    where: { userId_name: { userId, name } },
  });
  if (existing) return serializeLabel(existing);
  return createLabel(userId, { name });
}

export async function updateLabel(
  userId: string,
  id: string,
  input: { name?: string; color?: string; isFavorite?: boolean },
): Promise<LabelDTO> {
  const existing = await prisma.label.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Label not found");
  const label = await prisma.label.update({
    where: { id },
    data: input,
  });
  return serializeLabel(label);
}

export async function deleteLabel(userId: string, id: string): Promise<void> {
  const existing = await prisma.label.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Label not found");
  await prisma.label.delete({ where: { id } });
}
