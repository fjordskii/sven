import { NextResponse } from "next/server";
import { parseId, withAgent } from "@/lib/api";
import { getItem, updateItem } from "@/lib/db";
import { parseUpdate } from "@/lib/model";

export const dynamic = "force-dynamic";

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(req: Request, ctx: RouteContext<"/api/items/[id]">) {
  return withAgent(req, async () => {
    const id = parseId((await ctx.params).id);
    const item = id ? await getItem(id) : null;
    return item ? NextResponse.json({ item }) : notFound();
  });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/items/[id]">) {
  return withAgent(req, async () => {
    const id = parseId((await ctx.params).id);
    if (!id) return notFound();
    const input = parseUpdate(await req.json());
    const item = await updateItem(id, input, "agent");
    return item ? NextResponse.json({ item }) : notFound();
  });
}
