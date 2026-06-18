import { prisma } from "@/lib/db";

export type ActivityEntry = {
  id: string;
  eventType: string;
  objectType: string;
  objectId: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export async function getActivity(
  userId: string,
  opts: { limit?: number; objectId?: string } = {},
): Promise<ActivityEntry[]> {
  const events = await prisma.activityEvent.findMany({
    where: { userId, ...(opts.objectId ? { objectId: opts.objectId } : {}) },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
  });
  return events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    objectType: e.objectType,
    objectId: e.objectId,
    payload: safeParse(e.payload),
    createdAt: e.createdAt.toISOString(),
  }));
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
