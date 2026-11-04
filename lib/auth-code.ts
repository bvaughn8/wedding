import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Escape hatches for signing in before email (SMTP) is set up. Instead of
 * being emailed, the code is generated with the admin API and printed to the
 * server log:
 *
 * - DEV_LOG_AUTH_CODES=true  — dev server only, every email. Ignored when
 *   NODE_ENV is "production".
 * - LOG_ADMIN_AUTH_CODES=true — any environment (incl. Vercel), but only for
 *   admin guests (Billy & Simmi). Guests' codes are always emailed, so a
 *   guest's code never ends up in a log. For a soft launch; remove once
 *   email works.
 */
function devLogAuthCodes() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_LOG_AUTH_CODES === "true"
  );
}

async function isAdminGuest(email: string, guestId?: string) {
  const admin = createAdminClient();
  // On first claim the email isn't linked yet, so the caller passes the
  // (server-validated) guest ID instead.
  const query = admin.from("guests").select("is_admin");
  const { data } = guestId
    ? await query.eq("id", guestId).maybeSingle()
    : await query.eq("email", email).maybeSingle();
  return data?.is_admin === true;
}

async function shouldLogCode(email: string, guestId?: string) {
  if (devLogAuthCodes()) return true;
  if (process.env.LOG_ADMIN_AUTH_CODES !== "true") return false;
  return isAdminGuest(email, guestId);
}

/**
 * Sends a 6-digit email sign-in code (or logs it, see above). Verify it as
 * usual with supabase.auth.verifyOtp({ type: "email" }).
 *
 * `guestId` must come from a server-side lookup (e.g. guestForInvite), never
 * straight from the browser.
 */
export async function sendEmailCode(
  email: string,
  { shouldCreateUser, guestId }: { shouldCreateUser: boolean; guestId?: string },
): Promise<{ error: { message: string } | null }> {
  if (await shouldLogCode(email, guestId)) {
    const admin = createAdminClient();
    if (!shouldCreateUser) {
      // Match signInWithOtp: don't create a user on paths that expect one.
      const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (!data?.users.some((u) => u.email === email)) {
        return { error: { message: "Signups not allowed for otp" } };
      }
    }
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error) return { error };
    console.log(
      `\n[LOG_AUTH_CODES] sign-in code for ${email}: ${data.properties.email_otp}\n`,
    );
    return { error: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser },
  });
  return { error };
}
