import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, safeEqual, verifySessionToken } from "@/lib/session";

export async function isOwner(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);
}

export async function requireOwner(): Promise<void> {
  if (!(await isOwner())) redirect("/login");
}

/** Bearer-token check for the agent API. */
export function isAgent(req: Request): boolean {
  const expected = process.env.AGENT_API_TOKEN;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return !!m && safeEqual(m[1].trim(), expected);
}
