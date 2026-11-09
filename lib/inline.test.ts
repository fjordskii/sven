import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInline } from "./inline";

test("inline markdown tokens", () => {
  assert.deepEqual(parseInline("Open **Themes**, tap `Publish` or [Admin](https://a.b/c) now"), [
    { t: "text", v: "Open " },
    { t: "b", v: "Themes" },
    { t: "text", v: ", tap " },
    { t: "code", v: "Publish" },
    { t: "text", v: " or " },
    { t: "a", v: "Admin", href: "https://a.b/c" },
    { t: "text", v: " now" },
  ]);
});

test("non-http links stay plain text", () => {
  assert.deepEqual(parseInline("[x](javascript:alert(1))"), [
    { t: "text", v: "[x](javascript:alert(1))" },
  ]);
});
