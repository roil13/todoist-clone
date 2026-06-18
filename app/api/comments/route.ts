import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { listComments, addComment } from "@/lib/services/comment";

export function GET(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    return listComments(userId, {
      taskId: searchParams.get("taskId") ?? undefined,
      projectId: searchParams.get("projectId") ?? undefined,
    });
  });
}

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const form = await req.formData();
    const content = String(form.get("content") ?? "");
    const taskId = form.get("taskId") ? String(form.get("taskId")) : undefined;
    const projectId = form.get("projectId") ? String(form.get("projectId")) : undefined;

    const files = await Promise.all(
      form.getAll("files").filter((f): f is File => f instanceof File).map(async (f) => ({
        buffer: Buffer.from(await f.arrayBuffer()),
        name: f.name,
        type: f.type || "application/octet-stream",
      })),
    );

    if (!content.trim() && files.length === 0) throw new Error("Comment is empty");
    return addComment(userId, { taskId, projectId, content, files });
  });
}
