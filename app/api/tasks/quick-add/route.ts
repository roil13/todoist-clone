import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { quickAddTask } from "@/lib/services/quick-add";

const schema = z.object({
  text: z.string().min(1),
  projectId: z.string().optional(),
  sectionId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  defaultDueDate: z.string().nullable().optional(),
});

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const input = schema.parse(await req.json());
    return quickAddTask(userId, input);
  });
}
