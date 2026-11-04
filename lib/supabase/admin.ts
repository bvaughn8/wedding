import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the secret key. Bypasses row-level security.
 * Only use in server code, and only after you have validated the request
 * yourself (e.g. checked an invite token).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
