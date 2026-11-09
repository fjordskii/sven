import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { isOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isOwner()) redirect("/");
  return (
    <main className="login">
      <LoginForm />
    </main>
  );
}
