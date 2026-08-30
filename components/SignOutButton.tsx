import { signOut } from "@/auth";
import { TermButton } from "@/components/term";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/sign-in" });
      }}
    >
      <TermButton type="submit" tone="muted">
        sign out
      </TermButton>
    </form>
  );
}
