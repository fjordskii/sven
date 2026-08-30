import { auth } from "@/auth";
import { isAllowedEmail } from "@/lib/authz";

export async function requireOwner() {
  const session = await auth();
  if (!session?.user || !isAllowedEmail(session.user.email)) {
    throw new Error("Unauthorized");
  }
  return session.user;
}
