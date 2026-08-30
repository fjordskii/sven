import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { isAllowedEmail } from "@/lib/authz";
import { site } from "@/lib/site";

const nav = [
  { href: "/", label: "Board" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
] as const;

export async function Header() {
  const session = await auth();
  const showSignOut = isAllowedEmail(session?.user?.email);

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-6 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-serif text-lg tracking-tight text-ink no-underline hover:text-accent"
        >
          {site.name}
        </Link>
        <nav aria-label="Primary" className="flex gap-5 text-sm text-ink-dim">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
          {showSignOut ? <SignOutButton /> : null}
        </nav>
      </div>
    </header>
  );
}
