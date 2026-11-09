import { parseInline } from "@/lib/inline";

/** Renders the tiny inline-markdown subset as React nodes (no raw HTML). */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((n, i) => {
        switch (n.t) {
          case "b":
            return <strong key={i}>{n.v}</strong>;
          case "code":
            return <code key={i}>{n.v}</code>;
          case "a":
            return (
              <a key={i} className="out" href={n.href} target="_blank" rel="noopener noreferrer">
                {n.v}
              </a>
            );
          default:
            return <span key={i}>{n.v}</span>;
        }
      })}
    </>
  );
}
