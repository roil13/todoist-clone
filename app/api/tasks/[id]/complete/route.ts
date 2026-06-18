import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { completeTask, uncompleteTask } from "@/lib/services/completion";

export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    if (searchParams.get("undo") === "true") {
      return uncompleteTask(userId, id);
    }
    return completeTask(userId, id);
  });
}
