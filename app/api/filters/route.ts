import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { listFilters, createFilter } from "@/lib/services/filter";

export function GET() {
  return route(async () => {
    const userId = await requireUserId();
    return listFilters(userId);
  });
}

const schema = z.object({
  name: z.string().min(1),
  query: z.string().min(1),
  color: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const input = schema.parse(await req.json());
    return createFilter(userId, input);
  });
}
