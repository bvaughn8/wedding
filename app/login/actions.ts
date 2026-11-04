"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isValidCode,
  isValidEmail,
  normalizeCode,
  normalizeEmail,
} from "@/lib/email";

export type LoginResult = { ok: true } | { ok: false; error: string };

/**
 * Sends a code only to emails already linked to a guest. To avoid revealing
 * who is invited, the response is the same either way.
 */
export async function sendLoginCode(rawEmail: string): Promise<LoginResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from("guests")
    .select("id")
    .eq("email", email)
    .not("user_id", "is", null)
    .maybeSingle();

  if (guest) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
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
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) {
    return { ok: false, error: "That code didn't work. Check it, or send a new one." };
  }
  return { ok: true };
}
