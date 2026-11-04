// Shared by server and client components — no server-only imports here.

export type WeddingEvent = {
  id: string;
  name: string;
  event_date: string | null; // "2027-06-12"
  start_time: string | null; // "17:30:00"
  venue: string | null;
  details: string | null;
  meal_options: string[];
  all_households: boolean;
  rsvp_deadline: string | null;
  sort_order: number;
};

export const EVENT_COLUMNS =
  "id, name, event_date, start_time, venue, details, meal_options, all_households, rsvp_deadline, sort_order";

export type Rsvp = {
  guest_id: string;
  event_id: string;
  attending: boolean;
  meal_choice: string | null;
  responded_by: string | null;
  updated_at: string;
};

/** Dates are venue-local wall-clock values, so format them in UTC to avoid shifting. */
export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

export function formatEventWhen(e: Pick<WeddingEvent, "event_date" | "start_time">) {
  const parts = [];
  if (e.event_date) parts.push(formatDate(e.event_date));
  if (e.start_time) parts.push(formatTime(e.start_time));
  return parts.join(" · ");
}

/** Today's date as YYYY-MM-DD. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** RSVPs stay open through the whole deadline day. */
export function rsvpClosed(e: Pick<WeddingEvent, "rsvp_deadline">) {
  return !!e.rsvp_deadline && e.rsvp_deadline < today();
}

export function sortEvents<T extends Pick<WeddingEvent, "sort_order" | "event_date" | "start_time" | "name">>(
  events: T[],
) {
  return [...events].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      (a.event_date ?? "9999").localeCompare(b.event_date ?? "9999") ||
      (a.start_time ?? "99").localeCompare(b.start_time ?? "99") ||
      a.name.localeCompare(b.name),
  );
}
