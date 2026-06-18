import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { updateLabel, deleteLabel } from "@/lib/services/label";

const schema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

export function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const input = schema.parse(await req.json());
    return updateLabel(userId, id, input);
  });
}

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteLabel(userId, id);
    return { ok: true };
  });
}
