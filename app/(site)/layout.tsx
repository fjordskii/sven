import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAllowedEmail } from "@/lib/authz";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  if (!isAllowedEmail(session.user.email)) {
    redirect("/denied");
  }
  return children;
}
