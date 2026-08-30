"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "board" },
  { href: "/work", label: "work" },
  { href: "/about", label: "about" },
] as const;

export function Nav() {
  const path = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => {
        const active =
          item.href === "/" ? path === "/" : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "text-accent no-underline"
                : "text-ink-dim no-underline hover:text-ink"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
