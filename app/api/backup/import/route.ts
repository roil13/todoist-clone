import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { importData, type Backup } from "@/lib/services/backup";

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const backup = (await req.json()) as Backup;
    if (!backup || !Array.isArray(backup.tasks) || !Array.isArray(backup.projects)) {
      throw new Error("Invalid backup file");
    }
    return importData(userId, backup);
  });
}
