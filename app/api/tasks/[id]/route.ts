import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { updateTask, deleteTask } from "@/lib/services/task";

const updateSchema = z.object({
  content: z.string().min(1).optional(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  sectionId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(4).optional(),
  dueDate: z.string().nullable().optional(),
  dueDatetime: z.string().nullable().optional(),
  dueString: z.string().nullable().optional(),
  recurrenceRule: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  durationUnit: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

export function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const input = updateSchema.parse(await req.json());
    return updateTask(userId, id, input);
  });
}

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    await deleteTask(userId, id);
    return { ok: true };
  });
}
