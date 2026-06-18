import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Storage adapter. On Cloudflare Workers, files live in the R2 bucket binding
// (env.BUCKET); everywhere else (next dev, tests) they go to local disk outside
// /public. Files are always served through the authenticated attachment route.

const UPLOAD_DIR = path.join(process.cwd(), "var", "uploads");

type R2Like = {
  put(key: string, value: ArrayBuffer | ArrayBufferView | Buffer): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  delete(key: string): Promise<void>;
};

function bucket(): R2Like | null {
  try {
    const { env } = getCloudflareContext();
    return ((env as Record<string, unknown>)?.BUCKET as R2Like) ?? null;
  } catch {
    return null;
  }
}

export type StoredFile = { storedName: string; size: number };

export async function saveFile(
  buffer: Buffer,
  originalName: string,
): Promise<StoredFile> {
  const ext = path.extname(originalName).slice(0, 12);
  const storedName = `${crypto.randomUUID()}${ext}`;

  const r2 = bucket();
  if (r2) {
    await r2.put(storedName, buffer);
  } else {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  }
  return { storedName, size: buffer.length };
}

export async function readFile(storedName: string): Promise<Uint8Array> {
  const safe = path.basename(storedName); // guard path traversal (local)
  const r2 = bucket();
  if (r2) {
    const obj = await r2.get(storedName);
    if (!obj) throw new Error("File not found");
    return new Uint8Array(await obj.arrayBuffer());
  }
  return new Uint8Array(await fs.readFile(path.join(UPLOAD_DIR, safe)));
}

export async function deleteFile(storedName: string): Promise<void> {
  const r2 = bucket();
  if (r2) {
    await r2.delete(storedName).catch(() => {});
    return;
  }
  try {
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(storedName)));
  } catch {
    // ignore missing files
  }
}
