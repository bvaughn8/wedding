import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Dev-only escape hatch: with DEV_LOG_AUTH_CODES=true in .env.local, sign-in
 * codes are generated with the admin API and printed to the dev-server log
 * instead of being emailed. Never active in production builds (NODE_ENV is
 * "production" there), whatever the env var says.
 */
export function devLogAuthCodes() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_LOG_AUTH_CODES === "true"
  );
}

/**
 * Sends a 6-digit email sign-in code (or, in dev with DEV_LOG_AUTH_CODES,
 * logs it). Verify it as usual with supabase.auth.verifyOtp({ type: "email" }).
 */
export async function sendEmailCode(
  email: string,
  { shouldCreateUser }: { shouldCreateUser: boolean },
): Promise<{ error: { message: string } | null }> {
  if (devLogAuthCodes()) {
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
      `\n[DEV_LOG_AUTH_CODES] sign-in code for ${email}: ${data.properties.email_otp}\n`,
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
