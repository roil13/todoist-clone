import { z } from "zod";
import { route } from "@/lib/api";
import { createUser } from "@/lib/services/user";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export function POST(req: Request) {
  return route(async () => {
    const body = await req.json();
    const input = schema.parse(body);
    const user = await createUser(input);
    return { id: user.id, email: user.email };
  });
}
