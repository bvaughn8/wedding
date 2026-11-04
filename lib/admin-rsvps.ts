import "server-only";
import { guestName, listHouseholds, type AdminGuest, type AdminHousehold } from "@/lib/admin";
import { EVENT_COLUMNS, sortEvents, type Rsvp, type WeddingEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export type EventGuestRow = {
  guest: AdminGuest & { dietary_notes: string | null };
  household: AdminHousehold;
  rsvp: Rsvp | null;
};

export type EventSummary = {
  event: WeddingEvent;
  invitedHouseholdIds: Set<string>;
  rows: EventGuestRow[];
  attending: number;
  declined: number;
  awaiting: number;
  meals: [string, number][];
};

/** Events with per-guest RSVP status, as the signed-in admin (RLS applies). */
export async function loadEventSummaries(): Promise<{
  households: AdminHousehold[];
  summaries: EventSummary[];
}> {
  const supabase = await createClient();
  const [households, events, invites, rsvps, diets] = await Promise.all([
    listHouseholds(),
    supabase.from("events").select(EVENT_COLUMNS),
    supabase.from("event_invites").select("event_id, household_id"),
    supabase.from("rsvps").select("guest_id, event_id, attending, meal_choice, responded_by, updated_at"),
    supabase.from("guests").select("id, dietary_notes"),
  ]);
  const error = events.error ?? invites.error ?? rsvps.error ?? diets.error;
  if (error) throw new Error(`Couldn't load events: ${error.message}`);

  const dietById = new Map((diets.data ?? []).map((d) => [d.id, d.dietary_notes as string | null]));
  const rsvpByKey = new Map(
    ((rsvps.data ?? []) as Rsvp[]).map((r) => [`${r.event_id}:${r.guest_id}`, r]),
  );

  const summaries = sortEvents((events.data ?? []) as WeddingEvent[]).map((event) => {
    const invitedHouseholdIds = new Set(
      (invites.data ?? []).filter((i) => i.event_id === event.id).map((i) => i.household_id as string),
    );
    const rows: EventGuestRow[] = households
      .filter((h) => event.all_households || invitedHouseholdIds.has(h.id))
      .flatMap((household) =>
        household.guests.map((g) => ({
          guest: { ...g, dietary_notes: dietById.get(g.id) ?? null },
          household,
          rsvp: rsvpByKey.get(`${event.id}:${g.id}`) ?? null,
        })),
      );

    const meals = new Map<string, number>();
    for (const r of rows) {
      if (r.rsvp?.attending && r.rsvp.meal_choice) {
        meals.set(r.rsvp.meal_choice, (meals.get(r.rsvp.meal_choice) ?? 0) + 1);
      }
    }

    return {
      event,
      invitedHouseholdIds,
      rows,
      attending: rows.filter((r) => r.rsvp?.attending).length,
      declined: rows.filter((r) => r.rsvp && !r.rsvp.attending).length,
      awaiting: rows.filter((r) => !r.rsvp).length,
      meals: [...meals.entries()].sort((a, b) => b[1] - a[1]),
    };
  });

  return { households, summaries };
}

export { guestName };
