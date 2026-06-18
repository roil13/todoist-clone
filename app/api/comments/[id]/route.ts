import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { deleteComment } from "@/lib/services/comment";

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteComment(userId, id);
    return { ok: true };
  });
}
