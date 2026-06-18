import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { updateProject, deleteProject } from "@/lib/services/project";

const schema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  defaultView: z.enum(["LIST", "BOARD", "CALENDAR"]).optional(),
});

export function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const input = schema.parse(await req.json());
    return updateProject(userId, id, input);
  });
}

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteProject(userId, id);
    return { ok: true };
  });
}
