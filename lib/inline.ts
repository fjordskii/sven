export type Inline =
  | { t: "text"; v: string }
  | { t: "b"; v: string }
  | { t: "code"; v: string }
  | { t: "a"; v: string; href: string };

const TOKEN = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

/** Tiny inline markdown: **bold**, `code`, [text](http(s)://url). Everything else is plain text. */
export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ t: "text", v: src.slice(last, i) });
    if (m[1] !== undefined) out.push({ t: "b", v: m[1] });
    else if (m[2] !== undefined) out.push({ t: "code", v: m[2] });
    else out.push({ t: "a", v: m[3], href: m[4] });
    last = i + m[0].length;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}
