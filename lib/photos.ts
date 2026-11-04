import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Private Storage bucket for the site's own photos. */
export const SITE_PHOTOS_BUCKET = "site-photos";

const SIGNED_FOR_SECONDS = 24 * 60 * 60;
const REUSE_FOR_MS = 23 * 60 * 60 * 1000;

// Reuse each signed URL for most of its life so browsers can cache the image
// (a fresh signature every request would mean a fresh download every visit).
const cache = new Map<string, { url: string; until: number }>();

/**
 * Signed URLs for photos in the site-photos bucket, keyed by path
 * ("about/simmi.jpg"). Paths that don't exist are left out (and logged), so
 * callers can fall back to a placeholder.
 *
 * Only call this while rendering for a signed-in guest — the URLs grant access.
 */
export async function signedPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const now = Date.now();
  const result = new Map<string, string>();
  const missing: string[] = [];

  for (const path of new Set(paths)) {
    const hit = cache.get(path);
    if (hit && hit.until > now) result.set(path, hit.url);
    else missing.push(path);
  }
  if (!missing.length) return result;

  const { data, error } = await createAdminClient()
    .storage.from(SITE_PHOTOS_BUCKET)
    .createSignedUrls(missing, SIGNED_FOR_SECONDS);
  if (error) {
    console.warn(`[photos] couldn't sign URLs: ${error.message}`);
    return result;
  }

  for (const item of data ?? []) {
    if (item.signedUrl && item.path) {
      cache.set(item.path, { url: item.signedUrl, until: now + REUSE_FOR_MS });
      result.set(item.path, item.signedUrl);
    } else {
      console.warn(`[photos] ${SITE_PHOTOS_BUCKET}/${item.path ?? "?"}: ${item.error ?? "not found"}`);
    }
  }
  return result;
}
