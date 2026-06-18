import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { reorderProjects } from "@/lib/services/project";

const schema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
      parentId: z.string().nullable().optional(),
    }),
  ),
});

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const { items } = schema.parse(await req.json());
    await reorderProjects(userId, items);
    return { ok: true };
  });
}
