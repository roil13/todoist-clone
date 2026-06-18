import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { listProjects, createProject } from "@/lib/services/project";

export function GET(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    return listProjects(userId, searchParams.get("includeArchived") === "true");
  });
}

const schema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
  defaultView: z.enum(["LIST", "BOARD", "CALENDAR"]).optional(),
});

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const input = schema.parse(await req.json());
    return createProject(userId, input);
  });
}
