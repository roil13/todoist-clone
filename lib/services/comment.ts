import { prisma } from "@/lib/db";
import { saveFile, deleteFile } from "@/lib/storage";
import { logActivity } from "./activity";
import type { CommentDTO } from "@/lib/types";

type CommentWithAttachments = {
  id: string;
  content: string;
  createdAt: Date;
  attachments: { id: string; fileName: string; mimeType: string; size: number }[];
};

function serialize(c: CommentWithAttachments): CommentDTO {
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    attachments: c.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
    })),
  };
}

export async function listComments(
  userId: string,
  target: { taskId?: string; projectId?: string },
): Promise<CommentDTO[]> {
  const comments = await prisma.comment.findMany({
    where: { userId, taskId: target.taskId, projectId: target.projectId },
    orderBy: { createdAt: "asc" },
    include: { attachments: true },
  });
  return comments.map(serialize);
}

export async function addComment(
  userId: string,
  input: {
    taskId?: string;
    projectId?: string;
    content: string;
    files: { buffer: Buffer; name: string; type: string }[];
  },
): Promise<CommentDTO> {
  // Verify ownership of the target.
  if (input.taskId) {
    const t = await prisma.task.findFirst({ where: { id: input.taskId, userId } });
    if (!t) throw new Error("Task not found");
  } else if (input.projectId) {
    const p = await prisma.project.findFirst({ where: { id: input.projectId, userId } });
    if (!p) throw new Error("Project not found");
  } else {
    throw new Error("A taskId or projectId is required");
  }

  const stored = await Promise.all(
    input.files.map(async (f) => {
      const s = await saveFile(f.buffer, f.name);
      return { fileName: f.name, fileUrl: s.storedName, mimeType: f.type, size: s.size };
    }),
  );

  const comment = await prisma.comment.create({
    data: {
      userId,
      taskId: input.taskId ?? null,
      projectId: input.projectId ?? null,
      content: input.content,
      attachments: stored.length ? { create: stored } : undefined,
    },
    include: { attachments: true },
  });

  await logActivity(userId, "comment_added", input.taskId ? "task" : "project", input.taskId ?? input.projectId!, {});
  return serialize(comment);
}

export async function deleteComment(userId: string, id: string): Promise<void> {
  const comment = await prisma.comment.findFirst({
    where: { id, userId },
    include: { attachments: true },
  });
  if (!comment) throw new Error("Comment not found");
  await Promise.all(comment.attachments.map((a) => deleteFile(a.fileUrl)));
  await prisma.comment.delete({ where: { id } });
}

export async function getAttachment(userId: string, id: string) {
  return prisma.attachment.findFirst({
    where: { id, comment: { userId } },
  });
}
