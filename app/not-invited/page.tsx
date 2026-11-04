import { redirect } from "next/navigation";
import { AuthShell, Button } from "@/components/ui";
import { getCurrentGuest } from "@/lib/guest";

export const dynamic = "force-dynamic";

export default async function NotInvitedPage() {
  const current = await getCurrentGuest();
  if (current.status === "ok") redirect("/");
  if (current.status === "signed-out") redirect("/login");

  return (
    <AuthShell>
      <h1 className="font-serif text-2xl">We can&apos;t find you on the guest list</h1>
      <p className="mt-3 text-muted">
        This email isn&apos;t linked to an invitation yet. Scan the QR code on your
        invitation to get set up, or sign out and try a different email.
      </p>
      <form action="/auth/signout" method="post" className="mt-6">
        <Button type="submit" className="w-full">
          Sign out
        </Button>
      </form>
    </AuthShell>
  );
}
