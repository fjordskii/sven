import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { FORD_ACTOR } from "./actor";
import { addDays, dateInZone } from "./dates";
import {
  addNote,
  buildAgenda,
  markDone,
  publishItem,
  updateItem,
} from "./journal";
import { createMemoryStore, setStoreForTests } from "./journal-store";

afterEach(() => {
  setStoreForTests(null);
});

test("publish, update, note, and mark done", async () => {
  const store = createMemoryStore();
  setStoreForTests(store);

  const created = await publishItem(
    {
      title: "Draft the quote",
      notes: "Started in Cursor.",
      status: "in_flight",
      forDate: "2026-08-30",
    },
    store,
    { kind: "agent", name: "Cursor", platform: "cursor" },
  );

  assert.equal(created.title, "Draft the quote");
  assert.equal(created.status, "in_flight");
  assert.equal(created.sourceAgent, "Cursor");
  assert.equal(created.sourcePlatform, "cursor");
  assert.match(created.updatedBy, /Cursor/);

  const noted = await addNote(
    created.id,
    "Waiting on Ford to review numbers.",
    store,
    FORD_ACTOR,
  );
  assert.match(noted.notes, /Started in Cursor/);
  assert.match(noted.notes, /Waiting on Ford/);
  assert.equal(noted.updatedBy, "Ford");

  const moved = await updateItem(
    { id: created.id, status: "next", forDate: "2026-08-31" },
    store,
    FORD_ACTOR,
  );
  assert.equal(moved.status, "next");
  assert.equal(moved.forDate, "2026-08-31");

  const done = await markDone(created.id, store, {
    kind: "agent",
    name: "Claude",
    platform: "claude",
  });
  assert.equal(done.status, "done");
});

test("agenda puts overdue in-flight on today and dates coming days", () => {
  const today = dateInZone(new Date("2026-08-30T16:00:00.000Z"), "UTC");
  const tomorrow = addDays(today, 1);
  const items = [
    {
      id: "1",
      title: "Live work, no date",
      notes: "",
      status: "in_flight" as const,
      forDate: null,
      sourceAgent: "Cursor",
      sourcePlatform: "cursor",
      createdAt: "2026-08-30T12:00:00.000Z",
      updatedAt: "2026-08-30T12:00:00.000Z",
      updatedBy: "Cursor (cursor)",
    },
    {
      id: "2",
      title: "Due tomorrow",
      notes: "",
      status: "next" as const,
      forDate: tomorrow,
      sourceAgent: "Ford",
      sourcePlatform: "web",
      createdAt: "2026-08-30T12:00:00.000Z",
      updatedAt: "2026-08-30T12:00:00.000Z",
      updatedBy: "Ford",
    },
    {
      id: "3",
      title: "Unscheduled next",
      notes: "",
      status: "next" as const,
      forDate: null,
      sourceAgent: "Grok",
      sourcePlatform: "grok",
      createdAt: "2026-08-30T12:00:00.000Z",
      updatedAt: "2026-08-30T12:00:00.000Z",
      updatedBy: "Grok (grok)",
    },
    {
      id: "4",
      title: "Already done",
      notes: "",
      status: "done" as const,
      forDate: today,
      sourceAgent: "Ford",
      sourcePlatform: "web",
      createdAt: "2026-08-30T12:00:00.000Z",
      updatedAt: "2026-08-30T12:00:00.000Z",
      updatedBy: "Ford",
    },
  ];

  const agenda = buildAgenda(
    items,
    new Date("2026-08-30T16:00:00.000Z"),
    "UTC",
    7,
  );
  assert.equal(agenda.today, today);
  assert.deepEqual(
    agenda.todayItems.map((item) => item.id),
    ["1"],
  );
  assert.equal(agenda.coming[0]?.date, tomorrow);
  assert.deepEqual(
    agenda.coming[0]?.items.map((item) => item.id),
    ["2"],
  );
  assert.deepEqual(
    agenda.unscheduledNext.map((item) => item.id),
    ["3"],
  );
});

test("rejects empty titles", async () => {
  const store = createMemoryStore();
  await assert.rejects(
    () => publishItem({ title: "   " }, store, FORD_ACTOR),
    /Title is required/,
  );
});
