import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Local-disk storage adapter. Files live outside /public and are served through
// the authenticated attachment route.
//
// NOTE: on an ephemeral Node host (Render/Fly free tier) this disk is wiped on
// redeploy, so attachments are effectively temporary until object storage
// (e.g. Cloudflare R2 / S3 via an S3 client) is wired in. Swap this module for
// that adapter when ready — the public functions stay the same.

const UPLOAD_DIR = path.join(process.cwd(), "var", "uploads");

export type StoredFile = { storedName: string; size: number };

export async function saveFile(
  buffer: Buffer,
  originalName: string,
): Promise<StoredFile> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(originalName).slice(0, 12);
  const storedName = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  return { storedName, size: buffer.length };
}

export async function readFile(storedName: string): Promise<Uint8Array> {
  const safe = path.basename(storedName); // guard path traversal
  return new Uint8Array(await fs.readFile(path.join(UPLOAD_DIR, safe)));
}

export async function deleteFile(storedName: string): Promise<void> {
  try {
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(storedName)));
  } catch {
    // ignore missing files
  }
}
