import { redirect } from "next/navigation";
import { AuthShell } from "@/components/ui";
import { getCurrentGuest } from "@/lib/guest";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const current = await getCurrentGuest();
  if (current.status === "ok") redirect("/");

  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
