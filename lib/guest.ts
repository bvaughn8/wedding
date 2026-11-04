import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentGuest = {
  id: string;
  first_name: string;
  last_name: string | null;
  is_admin: boolean;
  household: { id: string; name: string };
};

export type GuestLookup =
  | { status: "signed-out" }
  | { status: "not-invited" }
  | { status: "ok"; guest: CurrentGuest };

/**
 * Who is signed in, and are they on the guest list?
 * Cached per request, so layouts and pages can both call it cheaply.
 */
export const getCurrentGuest = cache(async (): Promise<GuestLookup> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { status: "signed-out" };

  const { data: guest } = await supabase
    .from("guests")
    .select("id, first_name, last_name, is_admin, household:households(id, name)")
    .eq("user_id", userId)
    .maybeSingle();

  if (!guest) return { status: "not-invited" };
  return { status: "ok", guest: guest as unknown as CurrentGuest };
});
