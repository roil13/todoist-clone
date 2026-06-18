import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { updateFilter, deleteFilter } from "@/lib/services/filter";

const schema = z.object({
  name: z.string().min(1).optional(),
  query: z.string().min(1).optional(),
  color: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

export function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const input = schema.parse(await req.json());
    return updateFilter(userId, id, input);
  });
}

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteFilter(userId, id);
    return { ok: true };
  });
}
