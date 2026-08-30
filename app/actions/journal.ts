"use server";

import { revalidatePath } from "next/cache";
import { FORD_ACTOR, runWithActor } from "@/lib/actor";
import {
  addNote,
  isItemStatus,
  markDone,
  publishItem,
  updateItem,
  type ItemStatus,
} from "@/lib/journal";
import { requireOwner } from "@/lib/require-owner";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function withOwner<T>(fn: () => Promise<T>): Promise<T> {
  await requireOwner();
  return runWithActor(FORD_ACTOR, fn);
}

export async function createItemAction(formData: FormData): Promise<void> {
  const statusRaw = readString(formData, "status") || "next";
  const status: ItemStatus = isItemStatus(statusRaw) ? statusRaw : "next";
  await withOwner(() =>
    publishItem({
      title: readString(formData, "title"),
      notes: readString(formData, "notes"),
      status,
      forDate: readString(formData, "forDate") || null,
    }),
  );
  revalidatePath("/");
}

export async function updateItemAction(formData: FormData): Promise<void> {
  const statusRaw = readString(formData, "status");
  await withOwner(() =>
    updateItem({
      id: readString(formData, "id"),
      title: readString(formData, "title") || undefined,
      notes: formData.has("notes") ? readString(formData, "notes") : undefined,
      status: isItemStatus(statusRaw) ? statusRaw : undefined,
      forDate: formData.has("forDate")
        ? readString(formData, "forDate") || null
        : undefined,
    }),
  );
  revalidatePath("/");
}

export async function markDoneAction(formData: FormData): Promise<void> {
  await withOwner(() => markDone(readString(formData, "id")));
  revalidatePath("/");
}

export async function addNoteAction(formData: FormData): Promise<void> {
  await withOwner(() =>
    addNote(readString(formData, "id"), readString(formData, "note")),
  );
  revalidatePath("/");
}
