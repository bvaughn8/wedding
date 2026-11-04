"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmailCode } from "@/lib/auth-code";
import {
  isValidCode,
  isValidEmail,
  normalizeCode,
  normalizeEmail,
} from "@/lib/email";

export type LoginResult = { ok: true; firstTime?: boolean } | { ok: false; error: string };

/**
 * Sends a code only to emails already on a guest: either linked at sign-up, or
 * pre-filled by an admin (then the guest is linked on verify). To avoid
 * revealing who is invited, the response is the same either way.
 */
export async function sendLoginCode(rawEmail: string): Promise<LoginResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from("guests")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (guest) {
    const { error } = await sendEmailCode(email, {
      // Pre-filled guests may not have a login yet.
      shouldCreateUser: !guest.user_id,
      guestId: guest.id,
    });
    if (error) {
      return { ok: false, error: `We couldn't send your code: ${error.message}` };
    }
  }

  return { ok: true };
}

export async function verifyLoginCode(
  rawEmail: string,
  rawCode: string,
): Promise<LoginResult> {
  const email = normalizeEmail(rawEmail);
  const code = normalizeCode(rawCode);
  if (!isValidCode(code)) {
    return { ok: false, error: "Enter the code from your email (numbers only)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.user) {
    return { ok: false, error: "That code didn't work. Check it, or send a new one." };
  }

  // First sign-in for a guest whose email an admin pre-filled: link them now.
  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("guests")
    .select("id")
    .eq("email", email)
    .is("user_id", null)
    .maybeSingle();
  if (pending) {
    const { data: linked, error: linkError } = await admin
      .from("guests")
      .update({ user_id: data.user.id, claimed_at: new Date().toISOString() })
      .eq("id", pending.id)
      .is("user_id", null)
      .select("id");
    if (linkError || !linked?.length) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: "We couldn't finish setting you up. Please try again, or let Billy & Simmi know.",
      };
    }
    return { ok: true, firstTime: true };
  }

  return { ok: true };
}
