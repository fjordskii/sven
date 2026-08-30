import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { PageShell, TermButton } from "@/components/term";
import { isAllowedEmail, safeCallbackUrl } from "@/lib/authz";

export const metadata = {
  title: "Sign in",
  description: "Sign in with Google to view this site.",
};

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(
    typeof params.callbackUrl === "string" ? params.callbackUrl : undefined,
  );
  const session = await auth();

  if (session?.user && isAllowedEmail(session.user.email)) {
    redirect(callbackUrl);
  }
  if (session?.user) {
    redirect("/denied");
  }

  return (
    <PageShell
      cwd="~/sign-in"
      title="continue with Google"
      lead={
        <p>This site is not public. Sign in with the Google account that owns it.</p>
      }
    >
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl });
        }}
      >
        <TermButton type="submit" tone="accent">
          continue with google
        </TermButton>
      </form>
    </PageShell>
  );
}
