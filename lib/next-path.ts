/**
 * The ?next= path to return to after sign-in. Only same-site paths are
 * allowed ("/rsvp"), never "//evil.com" or "https://…", so it can't be used
 * as an open redirect.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
