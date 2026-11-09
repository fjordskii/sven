import "server-only";
import { NextResponse } from "next/server";
import { isAgent } from "@/lib/auth";
import { ValidationError } from "@/lib/model";

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="ford-blockers"' } },
  );
}

export async function withAgent(
  req: Request,
  fn: () => Promise<Response>,
): Promise<Response> {
  if (!isAgent(req)) return unauthorized();
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
