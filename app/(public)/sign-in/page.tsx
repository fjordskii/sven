import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
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
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        Sign in
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
        Continue with Google
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-ink-dim">
        This site is not public. Sign in with the Google account that owns it.
      </p>
      <form
        className="mt-10"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl });
        }}
      >
        <button
          type="submit"
          className="border border-line bg-bg-raised px-4 py-2 text-sm text-ink hover:border-accent hover:text-accent"
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
