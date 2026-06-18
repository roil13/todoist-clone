import { z } from "zod";
import { route } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { instantiateTemplate } from "@/lib/services/template";
import type { Backup } from "@/lib/services/backup";

const schema = z.object({
  template: z.any(),
  name: z.string().optional(),
});

export function POST(req: Request) {
  return route(async () => {
    const userId = await requireUserId();
    const { template, name } = schema.parse(await req.json());
    return instantiateTemplate(userId, template as Backup, name);
  });
}
