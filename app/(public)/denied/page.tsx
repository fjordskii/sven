import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { PageShell, TermButton } from "@/components/term";
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
    <PageShell
      cwd="~/denied"
      title="this account is not allowed"
      lead={
        <p>
          Signed in is not the same as allowed. Use the Google account that owns
          this site, or leave.
        </p>
      }
    >
      <div className="flex flex-wrap gap-4">
        <form
          action={async () => {
            "use server";
            await signOut({ redirect: false });
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <TermButton type="submit" tone="accent">
            use a different account
          </TermButton>
        </form>
        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <TermButton type="submit" tone="danger">
              sign out
            </TermButton>
          </form>
        ) : null}
      </div>
    </PageShell>
  );
}
