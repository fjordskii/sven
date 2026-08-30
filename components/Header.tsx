import Link from "next/link";
import { auth } from "@/auth";
import { Nav } from "@/components/Nav";
import { SignOutButton } from "@/components/SignOutButton";
import { isAllowedEmail } from "@/lib/authz";

export async function Header() {
  const session = await auth();
  const showSignOut = isAllowedEmail(session?.user?.email);

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="text-ink no-underline hover:text-accent">
          <span className="text-ok">sven</span>
          <span className="text-ink-dim">@</span>
          <span className="text-accent">ops</span>
          <span className="text-ink-dim">:~$</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Nav />
          {showSignOut ? <SignOutButton /> : null}
        </div>
      </div>
    </header>
  );
}
