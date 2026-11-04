import { getAdmin } from "@/lib/admin";
import { guestName, loadEventSummaries } from "@/lib/admin-rsvps";
import { csvResponse } from "@/lib/csv";

/** GET /admin/events/export → one row per guest per event, for the caterer/venue. */
export async function GET() {
  // Route handlers don't run the (site)/admin layouts, so check here.
  if (!(await getAdmin())) return new Response("Not found", { status: 404 });

  const { summaries } = await loadEventSummaries();
  const rows: (string | number | null)[][] = [
    ["event", "date", "household", "guest", "plus_one", "response", "meal", "dietary_notes", "updated_at"],
  ];
  for (const s of summaries) {
    for (const r of s.rows) {
      rows.push([
        s.event.name,
        s.event.event_date,
        r.household.name,
        guestName(r.guest),
        r.guest.is_plus_one ? "yes" : "",
        r.rsvp ? (r.rsvp.attending ? "attending" : "declined") : "awaiting",
        r.rsvp?.meal_choice ?? "",
        r.guest.dietary_notes ?? "",
        r.rsvp?.updated_at ?? "",
      ]);
    }
  }
  return csvResponse(rows, "wedding-rsvps.csv");
}
