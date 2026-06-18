import { prisma } from "@/lib/db";
import type { FilterDTO } from "@/lib/types";

function serialize(f: {
  id: string;
  name: string;
  query: string;
  color: string;
  order: number;
  isFavorite: boolean;
}): FilterDTO {
  return {
    id: f.id,
    name: f.name,
    query: f.query,
    color: f.color,
    order: f.order,
    isFavorite: f.isFavorite,
  };
}

export async function listFilters(userId: string): Promise<FilterDTO[]> {
  const filters = await prisma.filter.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });
  return filters.map(serialize);
}

export async function createFilter(
  userId: string,
  input: { name: string; query: string; color?: string; isFavorite?: boolean },
): Promise<FilterDTO> {
  const last = await prisma.filter.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const filter = await prisma.filter.create({
    data: {
      userId,
      name: input.name,
      query: input.query,
      color: input.color ?? "charcoal",
      isFavorite: input.isFavorite ?? false,
      order: (last?.order ?? -1) + 1,
    },
  });
  return serialize(filter);
}

export async function updateFilter(
  userId: string,
  id: string,
  input: { name?: string; query?: string; color?: string; isFavorite?: boolean },
): Promise<FilterDTO> {
  const existing = await prisma.filter.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Filter not found");
  const filter = await prisma.filter.update({ where: { id }, data: input });
  return serialize(filter);
}

export async function deleteFilter(userId: string, id: string): Promise<void> {
  const existing = await prisma.filter.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Filter not found");
  await prisma.filter.delete({ where: { id } });
}
