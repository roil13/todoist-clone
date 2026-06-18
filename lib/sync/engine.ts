import { buildSnapshot, mergeSnapshot } from "@/lib/local/snapshot";
import * as drive from "./drive";

/**
 * One sync pass: pull the remote snapshot, last-write-wins merge it into the
 * local store, then push the merged result back. Returns the number of local
 * rows changed by the remote (so callers can refresh the UI only when needed).
 */
export async function syncNow(): Promise<number> {
  const fileId = await drive.findOrCreateFile();
  const remote = await drive.downloadSnapshot(fileId);
  const changed = remote ? await mergeSnapshot(remote) : 0;
  const merged = await buildSnapshot();
  await drive.uploadSnapshot(fileId, merged);
  return changed;
}
