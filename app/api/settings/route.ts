import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { getSettings, updateSettings } from "@/lib/services/user";

export function GET() {
  return route(async () => {
    const userId = await requireUserId();
    return getSettings(userId);
  });
}

const schema = z.object({
  theme: z.string().optional(),
  weekStart: z.number().int().min(0).max(6).optional(),
  timeZone: z.string().optional(),
  dateLanguage: z.string().optional(),
  dailyGoal: z.number().int().min(1).optional(),
  weeklyGoal: z.number().int().min(1).optional(),
  vacationMode: z.boolean().optional(),
});

export function PATCH(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const input = schema.parse(await req.json());
    return updateSettings(userId, input);
  });
}
