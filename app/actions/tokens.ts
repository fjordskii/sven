"use server";

import { revalidatePath } from "next/cache";
import { createToken, revokeToken } from "@/lib/agent-tokens";
import { requireOwner } from "@/lib/require-owner";

export async function createTokenAction(
  name: string,
  platform: string,
): Promise<{ token: string; prefix: string; name: string; platform: string | null }> {
  await requireOwner();
  const created = await createToken(name, platform || null);
  revalidatePath("/");
  return {
    token: created.token,
    prefix: created.prefix,
    name: created.name,
    platform: created.platform,
  };
}

export async function revokeTokenAction(id: string): Promise<void> {
  await requireOwner();
  await revokeToken(id);
  revalidatePath("/");
}
