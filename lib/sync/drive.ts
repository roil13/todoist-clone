import { getAccessToken } from "./google-auth";
import type { Snapshot } from "@/lib/local/snapshot";

const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FILE_NAME = "tasks.json";
const FILE_ID_KEY = "drive-file-id";

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive ${init.method ?? "GET"} ${res.status}: ${await res.text().catch(() => "")}`);
  return res;
}

/** The single tasks.json in the hidden appDataFolder; created on first use. */
export async function findOrCreateFile(): Promise<string> {
  const cached = (() => { try { return localStorage.getItem(FILE_ID_KEY); } catch { return null; } })();
  if (cached) return cached;

  const q = encodeURIComponent(`name='${FILE_NAME}'`);
  const list = await authFetch(`${API}/files?spaces=appDataFolder&q=${q}&fields=files(id)`);
  const { files } = (await list.json()) as { files: { id: string }[] };
  let id = files?.[0]?.id;

  if (!id) {
    const created = await authFetch(`${API}/files?fields=id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: FILE_NAME, parents: ["appDataFolder"] }),
    });
    id = ((await created.json()) as { id: string }).id;
  }
  try { localStorage.setItem(FILE_ID_KEY, id); } catch {}
  return id;
}

export async function downloadSnapshot(fileId: string): Promise<Snapshot | null> {
  const res = await authFetch(`${API}/files/${fileId}?alt=media`);
  const text = await res.text();
  if (!text.trim()) return null; // freshly-created empty file
  try { return JSON.parse(text) as Snapshot; } catch { return null; }
}

export async function uploadSnapshot(fileId: string, snapshot: Snapshot): Promise<void> {
  await authFetch(`${UPLOAD}/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });
}

export function forgetFile(): void {
  try { localStorage.removeItem(FILE_ID_KEY); } catch {}
}
