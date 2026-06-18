import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { listTasks, createTask } from "@/lib/services/task";

export function GET(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") as
      | "inbox"
      | "today"
      | "upcoming"
      | "completed"
      | null;
    const sectionParam = searchParams.get("sectionId");
    const parentParam = searchParams.get("parentId");
    return listTasks(userId, {
      view: view ?? undefined,
      projectId: searchParams.get("projectId") ?? undefined,
      labelId: searchParams.get("labelId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sectionId: sectionParam === null ? undefined : sectionParam === "null" ? null : sectionParam,
      parentId: parentParam === null ? undefined : parentParam === "null" ? null : parentParam,
      includeCompleted: searchParams.get("includeCompleted") === "true",
    });
  });
}

const createSchema = z.object({
  content: z.string().min(1),
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

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const input = createSchema.parse(body);
    return createTask(userId, input);
  });
}
