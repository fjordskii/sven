import { NextResponse } from "next/server";
import { withAgent } from "@/lib/api";
import { createItem, listItems } from "@/lib/db";
import { parseCreate } from "@/lib/model";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withAgent(req, async () => {
    const s = new URL(req.url).searchParams.get("status") ?? "needs_you";
    const status = s === "done" || s === "all" ? s : "needs_you";
    const items = await listItems(status);
    return NextResponse.json({ status, count: items.length, items });
  });
}

export async function POST(req: Request) {
  return withAgent(req, async () => {
    const input = parseCreate(await req.json());
    const { item, created } = await createItem(input);
    return NextResponse.json({ created, item }, { status: created ? 201 : 200 });
  });
}
