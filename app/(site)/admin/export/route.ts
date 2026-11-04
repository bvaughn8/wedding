import { getAdmin, guestName, inviteUrl, listHouseholds, siteOrigin } from "@/lib/admin";
import { csvResponse } from "@/lib/csv";

/** GET /admin/export → one row per household, for the invitation designer. */
export async function GET() {
  // Route handlers don't run the (site)/admin layouts, so check here.
  if (!(await getAdmin())) return new Response("Not found", { status: 404 });

  const [households, { origin }] = await Promise.all([listHouseholds(), siteOrigin()]);
  return csvResponse(
    [
      ["household", "guests", "guest_count", "signed_up", "invite_link"],
      ...households.map((h) => [
        h.name,
        h.guests.map(guestName).join(", "),
        h.guests.length,
        h.guests.filter((g) => g.claimed_at).length,
        inviteUrl(origin, h.invite_token),
      ]),
    ],
    "wedding-invites.csv",
  );
}
