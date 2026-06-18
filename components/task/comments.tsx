"use client";

import { useState, useRef } from "react";
import { Paperclip, Trash2, Send, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useComments, useAddComment, useDeleteComment } from "@/lib/hooks/comments";
import { useT } from "@/lib/i18n";

export function Comments({
  taskId,
  projectId,
}: {
  taskId?: string;
  projectId?: string;
}) {
  const t = useT();
  const target = { taskId, projectId };
  const { data: comments } = useComments(target);
  const add = useAddComment(target);
  const del = useDeleteComment();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!content.trim() && files.length === 0) return;
    await add.mutateAsync({ content, files });
    setContent("");
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {(comments ?? []).map((c) => (
          <div key={c.id} className="group rounded-md border border-border bg-bg p-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap">{c.content}</p>
              <button
                onClick={() => del.mutate(c.id)}
                className="rounded p-1 text-text-muted opacity-0 hover:text-[#d1453b] group-hover:opacity-100"
                aria-label={t("aria.deleteComment")}
              >
                <Trash2 size={13} />
              </button>
            </div>
            {c.attachments.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {c.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={`/api/attachments/${a.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-xs hover:bg-bg-hover"
                  >
                    <FileText size={11} /> {a.fileName}
                  </a>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-text-faint">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
            </p>
          </div>
        ))}
        {comments?.length === 0 && (
          <p className="text-xs text-text-muted">{t("comments.none")}</p>
        )}
      </div>

      <div className="rounded-md border border-border bg-bg-elevated p-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("comments.placeholder")}
          rows={2}
          className="w-full resize-none bg-transparent text-sm outline-none"
        />
        {files.length > 0 && (
          <p className="text-xs text-text-muted">{t("comments.filesAttached", { n: files.length })}</p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded p-1 text-text-muted hover:bg-bg-hover"
            aria-label={t("aria.attachFiles")}
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <button
            onClick={submit}
            disabled={add.isPending || (!content.trim() && files.length === 0)}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Send size={13} /> {t("comments.comment")}
          </button>
        </div>
      </div>
    </div>
  );
}
