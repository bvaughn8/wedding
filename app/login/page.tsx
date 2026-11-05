import { redirect } from "next/navigation";
import { AuthShell } from "@/components/ui";
import { getCurrentGuest } from "@/lib/guest";
import { safeNextPath } from "@/lib/next-path";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = safeNextPath(typeof rawNext === "string" ? rawNext : null);

  const current = await getCurrentGuest();
  if (current.status === "ok") redirect(next ?? "/");

  return (
    <AuthShell>
      <LoginForm next={next} />
    </AuthShell>
  );
}
