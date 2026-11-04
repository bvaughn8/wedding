"use server";

import { revalidatePath } from "next/cache";
import { getAdmin, newInviteToken } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, normalizeEmail } from "@/lib/email";
import type { FormState } from "./forms";

// Every action re-checks admin status itself, and runs as the signed-in user,
// so the "Admins manage …" RLS policies are a second line of defence.

const NOT_ADMIN: FormState = { error: "Only Billy & Simmi can do that." };
const MAX_NAME = 100;

function text(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** "Alex Example" → { first_name: "Alex", last_name: "Example" }; one guest per line. */
function parseGuestLines(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .map((line) => {
      const [first, ...rest] = line.split(" ");
      return { first_name: first.slice(0, MAX_NAME), last_name: rest.join(" ").slice(0, MAX_NAME) || null };
    });
}

function done(): FormState {
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function addHousehold(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const name = text(fd, "name").slice(0, MAX_NAME);
  const guests = parseGuestLines(text(fd, "guests"));
  if (!name) return { error: "Give the household a name, e.g. “The Patel Family”." };
  if (!guests.length) return { error: "Add at least one guest, one per line." };
  if (guests.length > 20) return { error: "That's a lot of guests for one household — split it up?" };

  const supabase = await createClient();
  const { data: household, error } = await supabase
    .from("households")
    .insert({ name })
    .select("id")
    .single();
  if (error || !household) return { error: `Couldn't add the household: ${error?.message}` };

  const { error: guestError } = await supabase
    .from("guests")
    .insert(guests.map((g) => ({ ...g, household_id: household.id })));
  if (guestError) {
    await supabase.from("households").delete().eq("id", household.id);
    return { error: `Couldn't add the guests: ${guestError.message}` };
  }
  return done();
}

export async function renameHousehold(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const id = text(fd, "household_id");
  const name = text(fd, "name").slice(0, MAX_NAME);
  if (!name) return { error: "The name can't be empty." };
  const supabase = await createClient();
  const { error } = await supabase.from("households").update({ name }).eq("id", id);
  return error ? { error: error.message } : done();
}

export async function addGuest(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const householdId = text(fd, "household_id");
  const first = text(fd, "first_name").slice(0, MAX_NAME);
  const last = text(fd, "last_name").slice(0, MAX_NAME);
  if (!first) return { error: "First name is required (use “Guest” for an unnamed plus-one)." };

  const supabase = await createClient();
  const { error } = await supabase.from("guests").insert({
    household_id: householdId,
    first_name: first,
    last_name: last || null,
    is_plus_one: fd.get("is_plus_one") === "on",
  });
  return error ? { error: `Couldn't add the guest: ${error.message}` } : done();
}

export async function removeGuest(_: FormState, fd: FormData): Promise<FormState> {
  const me = await getAdmin();
  if (!me) return NOT_ADMIN;
  const id = text(fd, "guest_id");
  if (id === me.id) return { error: "You can't remove yourself." };
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  return error ? { error: error.message } : done();
}

/**
 * Pre-fills (or clears) the email of a guest who hasn't signed up yet, so they
 * can sign in at /login without the QR code. Once a guest has signed up their
 * email is tied to their login; use "Reset sign-in" to change it.
 */
export async function setGuestEmail(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const id = text(fd, "guest_id");
  const raw = text(fd, "email");
  const email = raw ? normalizeEmail(raw) : null;
  if (email && !isValidEmail(email)) return { error: "That doesn't look like an email address." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .update({ email })
    .eq("id", id)
    .is("user_id", null)
    .select("id");
  if (error?.code === "23505") return { error: "Another guest already has that email." };
  if (error) return { error: error.message };
  if (!data?.length) return { error: "This guest has already signed up; use Reset sign-in to change their email." };
  return done();
}

/** Unlinks a guest's login (e.g. they used the wrong email) so they can set up again. */
export async function resetGuestSignIn(_: FormState, fd: FormData): Promise<FormState> {
  const me = await getAdmin();
  if (!me) return NOT_ADMIN;
  const id = text(fd, "guest_id");
  if (id === me.id) return { error: "You can't reset your own sign-in here." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update({ user_id: null, email: null, claimed_at: null })
    .eq("id", id);
  return error ? { error: error.message } : done();
}

export async function regenerateInvite(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return NOT_ADMIN;
  const supabase = await createClient();
  const { error } = await supabase
    .from("households")
    .update({ invite_token: newInviteToken() })
    .eq("id", text(fd, "household_id"));
  return error ? { error: error.message } : done();
}

export async function deleteHousehold(_: FormState, fd: FormData): Promise<FormState> {
  const me = await getAdmin();
  if (!me) return NOT_ADMIN;
  const id = text(fd, "household_id");
  if (id === me.household.id) return { error: "You can't delete your own household." };
  const supabase = await createClient();
  const { error } = await supabase.from("households").delete().eq("id", id);
  return error ? { error: error.message } : done();
}
