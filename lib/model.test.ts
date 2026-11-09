import { test } from "node:test";
import assert from "node:assert/strict";
import { ValidationError, parseCreate, parseUpdate, sortItems, type Item } from "./model";

const base: Item = {
  id: 1, key: null, title: "t", product: "Other", ask: "a", why: "", priority: "normal",
  status: "needs_you", link: null, opened_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-01T00:00:00.000Z", resolved_at: null, notes: [],
};

test("sort: urgent first, then newest", () => {
  const items: Item[] = [
    { ...base, id: 1, priority: "low", opened_at: "2026-11-09T00:00:00.000Z" },
    { ...base, id: 2, priority: "normal", opened_at: "2026-11-02T00:00:00.000Z" },
    { ...base, id: 3, priority: "urgent", opened_at: "2026-11-01T00:00:00.000Z" },
    { ...base, id: 4, priority: "normal", opened_at: "2026-11-05T00:00:00.000Z" },
    { ...base, id: 5, status: "done", resolved_at: "2026-11-09T00:00:00.000Z" },
  ];
  assert.deepEqual(sortItems(items).map((i) => i.id), [3, 4, 2, 1, 5]);
});

test("parseCreate defaults and validation", () => {
  const c = parseCreate({ title: " Hi ", ask: "Do it" });
  assert.equal(c.title, "Hi");
  assert.equal(c.product, "Other");
  assert.equal(c.priority, "normal");
  assert.throws(() => parseCreate({ ask: "x" }), ValidationError);
  assert.throws(() => parseCreate({ title: "x", ask: "y", product: "Nope" }), ValidationError);
  assert.throws(() => parseCreate({ title: "x", ask: "y", link: "javascript:alert(1)" }), ValidationError);
});

test("parseUpdate resolve shortcut and empty body", () => {
  assert.deepEqual(parseUpdate({ resolve: true }), { status: "done" });
  assert.deepEqual(parseUpdate({ link: null }), { link: null });
  assert.throws(() => parseUpdate({}), ValidationError);
});
