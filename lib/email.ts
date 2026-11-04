export function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** "simmi@example.com" → "s••••@example.com" — enough to recognise, not to harvest. */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "your email";
  return `${user.slice(0, 1)}••••@${domain}`;
}

/** Codes are 6 digits by default; Supabase allows up to 10 if you change it. */
export function normalizeCode(raw: string) {
  return raw.replace(/\s+/g, "");
}

export function isValidCode(code: string) {
  return /^\d{6,10}$/.test(code);
}
