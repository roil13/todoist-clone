import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { listLabels, createLabel } from "@/lib/services/label";

export function GET() {
  return route(async () => {
    const userId = await requireUserId();
    return listLabels(userId);
  });
}

const schema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const input = schema.parse(await req.json());
    return createLabel(userId, input);
  });
}
