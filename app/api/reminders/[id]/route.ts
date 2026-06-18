import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { deleteReminder } from "@/lib/services/reminder";

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteReminder(userId, id);
    return { ok: true };
  });
}
