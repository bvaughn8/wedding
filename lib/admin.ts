import "server-only";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCurrentGuest, type CurrentGuest } from "@/lib/guest";
import { createClient } from "@/lib/supabase/server";

/** The signed-in admin, or null. Use in route handlers and server actions. */
export async function getAdmin(): Promise<CurrentGuest | null> {
  const current = await getCurrentGuest();
  return current.status === "ok" && current.guest.is_admin ? current.guest : null;
}

/** For admin pages: non-admins get a plain 404, so the area isn't advertised. */
export async function requireAdmin(): Promise<CurrentGuest> {
  const admin = await getAdmin();
  if (!admin) notFound();
  return admin;
}

/**
 * Base URL for invite links. Set SITE_URL (e.g. https://billyandsimmi.com)
 * before printing invitations; otherwise falls back to the current host.
 */
export async function siteOrigin(): Promise<{ origin: string; fromEnv: boolean }> {
  const fromEnv = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return { origin: fromEnv, fromEnv: true };
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return { origin: `${proto}://${host}`, fromEnv: false };
}

export function inviteUrl(origin: string, token: string) {
  return `${origin}/i/${token}`;
}

/** Same shape as the column default in the migration: 24 url-safe chars. */
export function newInviteToken() {
  return randomBytes(18).toString("base64url");
}

export type AdminGuest = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  claimed_at: string | null;
  is_plus_one: boolean;
  is_admin: boolean;
  created_at: string;
};

export type AdminHousehold = {
  id: string;
  name: string;
  invite_token: string;
  notes: string | null;
  created_at: string;
  guests: AdminGuest[];
};

/** All households with their guests. Runs as the signed-in admin (RLS applies). */
export async function listHouseholds(): Promise<AdminHousehold[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("households")
    .select(
      "id, name, invite_token, notes, created_at, guests(id, first_name, last_name, email, claimed_at, is_plus_one, is_admin, created_at)",
    )
    .order("name")
    .order("created_at", { referencedTable: "guests" });
  if (error) throw new Error(`Couldn't load households: ${error.message}`);
  return (data ?? []) as AdminHousehold[];
}

export function guestName(g: Pick<AdminGuest, "first_name" | "last_name">) {
  return [g.first_name, g.last_name].filter(Boolean).join(" ");
}
