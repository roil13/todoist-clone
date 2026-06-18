import { prisma } from "@/lib/db";

export async function logActivity(
  userId: string,
  eventType: string,
  objectType: string,
  objectId: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await prisma.activityEvent.create({
    data: {
      userId,
      eventType,
      objectType,
      objectId,
      payload: JSON.stringify(payload),
    },
  });
}

export async function awardKarma(
  userId: string,
  points: number,
  reason: string,
): Promise<void> {
  await prisma.karmaEvent.create({
    data: { userId, points, reason },
  });
}
