import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { updateSection, deleteSection } from "@/lib/services/section";

const schema = z.object({
  name: z.string().min(1).optional(),
  isCollapsed: z.boolean().optional(),
});

export function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const input = schema.parse(await req.json());
    return updateSection(userId, id, input);
  });
}

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteSection(userId, id);
    return { ok: true };
  });
}
