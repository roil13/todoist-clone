import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/session";

/** Wraps a route handler with consistent error handling. */
export function route<T>(handler: () => Promise<T>) {
  return (async () => {
    try {
      const data = await handler();
      return NextResponse.json(data ?? { ok: true });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Invalid input", issues: err.issues },
          { status: 400 },
        );
      }
      const message = err instanceof Error ? err.message : "Server error";
      console.error("[api]", err);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  })();
}
