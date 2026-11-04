"use server";

import { revalidatePath } from "next/cache";
import { rsvpClosed } from "@/lib/events";
import { getCurrentGuest } from "@/lib/guest";
import { loadHouseholdRsvp } from "@/lib/rsvp";
import { createAdminClient } from "@/lib/supabase/admin";

export type RsvpState = { ok?: boolean; error?: string; savedAt?: string } | null;

const MAX_NAME = 100;
const MAX_NOTES = 500;

function text(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Saves the whole household's RSVP. Field names:
 *   attending:<eventId>:<guestId> = "yes" | "no"
 *   meal:<eventId>:<guestId>      = one of the event's meal_options
 *   diet:<guestId>                = dietary notes
 *   first:<guestId> / last:<guestId> = plus-one's name (unclaimed plus-ones only)
 * Every ID is checked against the signed-in guest's own household.
 */
export async function saveRsvp(_: RsvpState, fd: FormData): Promise<RsvpState> {
  const current = await getCurrentGuest();
  if (current.status !== "ok") return { error: "Please sign in again." };
  const me = current.guest;

  const { guests, events } = await loadHouseholdRsvp(me.household.id);
  if (!events.length) return { error: "There's nothing to RSVP to yet." };

  const rows: {
    guest_id: string;
    event_id: string;
    attending: boolean;
    meal_choice: string | null;
    responded_by: string;
    updated_at: string;
  }[] = [];
  const now = new Date().toISOString();
  const missing: string[] = [];

  for (const e of events) {
    if (rsvpClosed(e) && !me.is_admin) continue; // past the deadline: leave as is
    for (const g of guests) {
      const answer = text(fd, `attending:${e.id}:${g.id}`);
      if (answer !== "yes" && answer !== "no") {
        missing.push(`${e.name}`);
        continue;
      }
      const attending = answer === "yes";
      let meal: string | null = null;
      if (attending && e.meal_options.length) {
        meal = text(fd, `meal:${e.id}:${g.id}`);
        if (!e.meal_options.includes(meal)) {
          return { error: `Please choose a meal for ${g.first_name} at ${e.name}.` };
        }
      }
      rows.push({
        guest_id: g.id,
        event_id: e.id,
        attending,
        meal_choice: meal,
        responded_by: me.id,
        updated_at: now,
      });
    }
  }

  if (missing.length) {
    const names = [...new Set(missing)].join(", ");
    return { error: `Please answer yes or no for everyone at: ${names}.` };
  }

  const admin = createAdminClient();

  // Names for plus-ones who haven't set up their own sign-in yet, and dietary notes.
  for (const g of guests) {
    const update: Record<string, string | null> = {
      dietary_notes: text(fd, `diet:${g.id}`).slice(0, MAX_NOTES) || null,
    };
    if (g.is_plus_one && !g.claimed_at) {
      const first = text(fd, `first:${g.id}`).slice(0, MAX_NAME);
      if (first) {
        update.first_name = first;
        update.last_name = text(fd, `last:${g.id}`).slice(0, MAX_NAME) || null;
      }
    }
    const { error } = await admin
      .from("guests")
      .update(update)
      .eq("id", g.id)
      .eq("household_id", me.household.id);
    if (error) return { error: `Couldn't save: ${error.message}` };
  }

  if (rows.length) {
    const { error } = await admin.from("rsvps").upsert(rows, { onConflict: "guest_id,event_id" });
    if (error) return { error: `Couldn't save your RSVP: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { ok: true, savedAt: now };
}
