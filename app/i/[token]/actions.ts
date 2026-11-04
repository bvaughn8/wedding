"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmailCode } from "@/lib/auth-code";
import {
  isValidCode,
  isValidEmail,
  maskEmail,
  normalizeCode,
  normalizeEmail,
} from "@/lib/email";

export type ActionResult =
  | { ok: true; maskedEmail?: string }
  | { ok: false; error: string };

const INVALID_INVITE =
  "This invitation link doesn't look right. Please scan the QR code on your invitation again.";

type InviteGuest = {
  id: string;
  household_id: string;
  email: string | null;
  user_id: string | null;
};

/** Every action re-checks the token: the browser is never trusted on its own. */
async function guestForInvite(token: string, guestId: string) {
  const admin = createAdminClient();

  const { data: household } = await admin
    .from("households")
    .select("id")
    .eq("invite_token", token)
    .maybeSingle();
  if (!household) return null;

  const { data: guest } = await admin
    .from("guests")
    .select("id, household_id, email, user_id")
    .eq("id", guestId)
    .eq("household_id", household.id)
    .maybeSingle();

  return (guest as InviteGuest | null) ?? null;
}

/* ------------------------------------------------------------------------ */
/* First visit: guest picks their name, enters an email, verifies a code.    */
/* ------------------------------------------------------------------------ */

export async function startClaim(
  token: string,
  guestId: string,
  rawEmail: string,
): Promise<ActionResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const guest = await guestForInvite(token, guestId);
  if (!guest) return { ok: false, error: INVALID_INVITE };
  if (guest.user_id) {
    return { ok: false, error: "You're already set up. Go back and pick your name to sign in." };
  }

  const admin = createAdminClient();
  const { data: taken } = await admin
    .from("guests")
    .select("id")
    .eq("email", email)
    .neq("id", guest.id)
    .maybeSingle();
  if (taken) {
    return {
      ok: false,
      error:
        "That email is already linked to another guest. Please use a different one.",
    };
  }

  const { error } = await sendEmailCode(email, { shouldCreateUser: true });
  if (error) {
    return { ok: false, error: `We couldn't send your code: ${error.message}` };
  }

  return { ok: true, maskedEmail: maskEmail(email) };
}

export async function confirmClaim(
  token: string,
  guestId: string,
  rawEmail: string,
  rawCode: string,
): Promise<ActionResult> {
  const email = normalizeEmail(rawEmail);
  const code = normalizeCode(rawCode);
  if (!isValidCode(code)) {
    return { ok: false, error: "Enter the code from your email (numbers only)." };
  }

  const guest = await guestForInvite(token, guestId);
  if (!guest) return { ok: false, error: INVALID_INVITE };
  if (guest.user_id) {
    return { ok: false, error: "This guest has already been set up." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
  if (error || !data.user) {
    return { ok: false, error: "That code didn't work. Check it, or send a new one." };
  }

  // Only link if nobody claimed this guest in the meantime.
  const admin = createAdminClient();
  const { data: linked, error: linkError } = await admin
    .from("guests")
    .update({ user_id: data.user.id, email, claimed_at: new Date().toISOString() })
    .eq("id", guest.id)
    .is("user_id", null)
    .select("id");

  if (linkError || !linked?.length) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "We couldn't finish setting you up. Please try again, or let Billy & Simmi know.",
    };
  }

  return { ok: true };
}

/* ------------------------------------------------------------------------ */
/* Return visit via QR: guest is already set up, so email their saved address */
/* ------------------------------------------------------------------------ */

export async function sendCodeToSavedEmail(
  token: string,
  guestId: string,
): Promise<ActionResult> {
  const guest = await guestForInvite(token, guestId);
  if (!guest) return { ok: false, error: INVALID_INVITE };
  if (!guest.user_id || !guest.email) {
    return { ok: false, error: "You haven't set up an email yet." };
  }

  const { error } = await sendEmailCode(guest.email, { shouldCreateUser: false });
  if (error) {
    return { ok: false, error: `We couldn't send your code: ${error.message}` };
  }

  return { ok: true, maskedEmail: maskEmail(guest.email) };
}

export async function verifySavedEmailCode(
  token: string,
  guestId: string,
  rawCode: string,
): Promise<ActionResult> {
  const code = normalizeCode(rawCode);
  if (!isValidCode(code)) {
    return { ok: false, error: "Enter the code from your email (numbers only)." };
  }

  const guest = await guestForInvite(token, guestId);
  if (!guest?.email) return { ok: false, error: INVALID_INVITE };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: guest.email,
    token: code,
    type: "email",
  });
  if (error) {
    return { ok: false, error: "That code didn't work. Check it, or send a new one." };
  }

  return { ok: true };
}
