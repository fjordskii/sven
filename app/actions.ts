"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isOwner } from "@/lib/auth";
import { addNote, updateItem } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  safeEqual,
} from "@/lib/session";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const password = String(form.get("password") ?? "");
  const expected = process.env.OWNER_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!expected || !secret) return { error: "Login is not configured." };
  if (!safeEqual(password, expected)) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Wrong password." };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

async function guard() {
  if (!(await isOwner())) redirect("/login");
}

function idFrom(form: FormData): number {
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("bad id");
  return id;
}

export async function markDone(form: FormData): Promise<void> {
  await guard();
  const note = String(form.get("note") ?? "").trim().slice(0, 2000);
  await updateItem(idFrom(form), { status: "done", ...(note ? { note } : {}) }, "ford");
  revalidatePath("/");
}

export async function reopen(form: FormData): Promise<void> {
  await guard();
  await updateItem(idFrom(form), { status: "needs_you" }, "ford");
  revalidatePath("/");
}

export async function reply(form: FormData): Promise<void> {
  await guard();
  const note = String(form.get("note") ?? "").trim().slice(0, 2000);
  if (note) await addNote(idFrom(form), "ford", note);
  revalidatePath("/");
}

/** Id-based helpers for swipe / optimistic UI. Form-based markDone/reopen stay for the buttons. */
export async function markDoneById(id: number): Promise<void> {
  await guard();
  if (!Number.isInteger(id) || id <= 0) throw new Error("bad id");
  await updateItem(id, { status: "done" }, "ford");
  revalidatePath("/");
}

export async function reopenById(id: number): Promise<void> {
  await guard();
  if (!Number.isInteger(id) || id <= 0) throw new Error("bad id");
  await updateItem(id, { status: "needs_you" }, "ford");
  revalidatePath("/");
}
