import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { consumeDueReminders } from "@/lib/services/reminder";

export function GET() {
  return route(async () => {
    const userId = await requireUserId();
    return consumeDueReminders(userId);
  });
}
