import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { exportProjectTemplate } from "@/lib/services/template";

export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    return exportProjectTemplate(userId, id);
  });
}
