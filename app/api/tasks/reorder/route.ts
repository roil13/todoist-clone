import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { reorderTasks } from "@/lib/services/task";

const schema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
      sectionId: z.string().nullable().optional(),
      projectId: z.string().optional(),
    }),
  ),
});

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const { items } = schema.parse(await req.json());
    await reorderTasks(userId, items);
    return { ok: true };
  });
}
