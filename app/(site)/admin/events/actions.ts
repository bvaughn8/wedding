"use server";

import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../forms";

const NOT_ADMIN: FormState = { error: "Only Billy & Simmi can do that." };

function text(fd: FormData, key: string, max = 2000) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s: string) => /^\d{2}:\d{2}(:\d{2})?$/.test(s);

/** Creates (no event_id) or updates an event, and its household invite list. */
export async function saveEvent(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return NOT_ADMIN;

  const id = text(fd, "event_id");
  const name = text(fd, "name", 100);
  if (!name) return { error: "Give the event a name, e.g. “Ceremony”." };

  const date = text(fd, "event_date");
  const time = text(fd, "start_time");
  const deadline = text(fd, "rsvp_deadline");
  if (date && !isDate(date)) return { error: "That date doesn't look right." };
  if (time && !isTime(time)) return { error: "That time doesn't look right." };
  if (deadline && !isDate(deadline)) return { error: "That RSVP deadline doesn't look right." };

  const mealOptions = [
    ...new Set(
      text(fd, "meal_options", 5000)
        .split(/\r?\n/)
        .map((m) => m.trim().slice(0, 100))
        .filter(Boolean),
    ),
  ];
  const allHouseholds = text(fd, "invite") !== "selected";
  const householdIds = fd.getAll("households").filter((v): v is string => typeof v === "string");
  if (!allHouseholds && householdIds.length === 0) {
    return { error: "Pick at least one household, or invite everyone." };
  }

  const row = {
    name,
    event_date: date || null,
    start_time: time || null,
    venue: text(fd, "venue", 200) || null,
    details: text(fd, "details") || null,
    meal_options: mealOptions,
    all_households: allHouseholds,
    rsvp_deadline: deadline || null,
    sort_order: Number.parseInt(text(fd, "sort_order"), 10) || 0,
  };

  const supabase = await createClient();
  let eventId = id;
  if (id) {
    const { error } = await supabase.from("events").update(row).eq("id", id);
    if (error) return { error: `Couldn't save: ${error.message}` };
  } else {
    const { data, error } = await supabase.from("events").insert(row).select("id").single();
    if (error || !data) return { error: `Couldn't add the event: ${error?.message}` };
    eventId = data.id;
  }

  // Replace the invite list (unused while all_households is on, but kept tidy).
  const { error: delError } = await supabase.from("event_invites").delete().eq("event_id", eventId);
  if (delError) return { error: `Couldn't update invites: ${delError.message}` };
  if (!allHouseholds) {
    const { error } = await supabase
      .from("event_invites")
      .insert(householdIds.map((household_id) => ({ event_id: eventId, household_id })));
    if (error) return { error: `Couldn't update invites: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteEvent(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", text(fd, "event_id"));
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
