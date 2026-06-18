import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { listReminders, createReminder } from "@/lib/services/reminder";

export function GET(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const taskId = new URL(req.url).searchParams.get("taskId");
    if (!taskId) throw new Error("taskId is required");
    return listReminders(userId, taskId);
  });
}

const schema = z.object({
  taskId: z.string(),
  type: z.enum(["ABSOLUTE", "RELATIVE"]),
  triggerAt: z.string().nullable().optional(),
  offsetMinutes: z.number().int().nullable().optional(),
});

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const input = schema.parse(await req.json());
    return createReminder(userId, input);
  });
}
