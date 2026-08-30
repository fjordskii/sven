import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { isAllowedEmail } from "@/lib/authz";

export const metadata = {
  title: "No access",
  description: "This Google account is not allowed to view this site.",
};

export default async function DeniedPage() {
  const session = await auth();
  if (session?.user && isAllowedEmail(session.user.email)) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        No access
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
        This account is not allowed
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-ink-dim">
        Signed in is not the same as allowed. Use the Google account that owns
        this site, or leave.
      </p>
      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <form
          action={async () => {
            "use server";
            await signOut({ redirect: false });
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="border border-line bg-bg-raised px-4 py-2 text-ink hover:border-accent hover:text-accent"
          >
            Use a different account
          </button>
        </form>
        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <button type="submit" className="px-4 py-2 text-ink-dim hover:text-ink">
              Sign out
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
