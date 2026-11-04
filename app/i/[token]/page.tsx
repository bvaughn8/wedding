import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/ui";
import { getCurrentGuest } from "@/lib/guest";
import { maskEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteFlow, type InviteGuestOption } from "./invite-flow";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: household } = await admin
    .from("households")
    .select("id, name")
    .eq("invite_token", token)
    .maybeSingle();

  if (!household) {
    return (
      <AuthShell>
        <h1 className="font-serif text-2xl">We couldn&apos;t find that invitation</h1>
        <p className="mt-3 text-muted">
          Try scanning the QR code on your invitation again. If you&apos;ve already set
          up your email, you can{" "}
          <Link href="/login" className="text-accent underline underline-offset-4">
            sign in with it
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  // Already signed in as someone in this household? Straight in.
  const current = await getCurrentGuest();
  if (current.status === "ok" && current.guest.household.id === household.id) {
    redirect("/");
  }

  const { data: guests } = await admin
    .from("guests")
    .select("id, first_name, last_name, email, user_id")
    .eq("household_id", household.id)
    .order("created_at");

  // Only masked emails ever reach the browser.
  const options: InviteGuestOption[] = (guests ?? []).map((g) => ({
    id: g.id,
    name: [g.first_name, g.last_name].filter(Boolean).join(" "),
    claimed: Boolean(g.user_id),
    maskedEmail: g.email ? maskEmail(g.email) : null,
  }));

  return (
    <AuthShell>
      <InviteFlow token={token} householdName={household.name} guests={options} />
    </AuthShell>
  );
}
