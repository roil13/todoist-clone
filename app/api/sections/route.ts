import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { listSections, createSection } from "@/lib/services/section";

export function GET(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) throw new Error("projectId is required");
    return listSections(userId, projectId);
  });
}

const schema = z.object({
  name: z.string().min(1),
  projectId: z.string(),
});

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const input = schema.parse(await req.json());
    return createSection(userId, input);
  });
}
