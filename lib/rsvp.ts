import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_COLUMNS, sortEvents, type Rsvp, type WeddingEvent } from "@/lib/events";

export type RsvpGuest = {
  id: string;
  first_name: string;
  last_name: string | null;
  is_plus_one: boolean;
  claimed_at: string | null;
  dietary_notes: string | null;
};

export type HouseholdRsvp = {
  guests: RsvpGuest[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
};

/**
 * Everything the RSVP form needs for one household. Uses the admin client so
 * the server action can trust it; callers must pass the household of the
 * signed-in guest (from getCurrentGuest), never an ID from the browser.
 */
export async function loadHouseholdRsvp(householdId: string): Promise<HouseholdRsvp> {
  const admin = createAdminClient();

  const [{ data: guests, error: gErr }, { data: allEvents, error: eErr }, { data: invites, error: iErr }] =
    await Promise.all([
      admin
        .from("guests")
        .select("id, first_name, last_name, is_plus_one, claimed_at, dietary_notes")
        .eq("household_id", householdId)
        .order("is_plus_one")
        .order("created_at"),
      admin.from("events").select(EVENT_COLUMNS),
      admin.from("event_invites").select("event_id").eq("household_id", householdId),
    ]);
  const error = gErr ?? eErr ?? iErr;
  if (error) throw new Error(`Couldn't load your RSVP: ${error.message}`);

  const invited = new Set((invites ?? []).map((i) => i.event_id));
  const events = sortEvents(
    ((allEvents ?? []) as WeddingEvent[]).filter((e) => e.all_households || invited.has(e.id)),
  );

  const guestIds = (guests ?? []).map((g) => g.id);
  const { data: rsvps, error: rErr } = guestIds.length
    ? await admin
        .from("rsvps")
        .select("guest_id, event_id, attending, meal_choice, responded_by, updated_at")
        .in("guest_id", guestIds)
    : { data: [], error: null };
  if (rErr) throw new Error(`Couldn't load your RSVP: ${rErr.message}`);

  return {
    guests: (guests ?? []) as RsvpGuest[],
    events,
    rsvps: (rsvps ?? []) as Rsvp[],
  };
}

/** How many guest×event answers are still missing. */
export function missingAnswers({ guests, events, rsvps }: HouseholdRsvp) {
  const answered = new Set(rsvps.map((r) => `${r.event_id}:${r.guest_id}`));
  let missing = 0;
  for (const e of events) for (const g of guests) if (!answered.has(`${e.id}:${g.id}`)) missing++;
  return missing;
}
