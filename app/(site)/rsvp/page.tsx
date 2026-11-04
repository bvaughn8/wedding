import type { Metadata } from "next";
import { getCurrentGuest } from "@/lib/guest";
import { loadHouseholdRsvp } from "@/lib/rsvp";
import { RsvpForm } from "./rsvp-form";

export const metadata: Metadata = { title: "RSVP · Billy & Simmi" };

export default async function RsvpPage() {
  const current = await getCurrentGuest();
  if (current.status !== "ok") return null; // layout already redirected
  const { guest } = current;

  const data = await loadHouseholdRsvp(guest.household.id);
  const lastUpdate = data.rsvps.reduce<string | null>(
    (latest, r) => (!latest || r.updated_at > latest ? r.updated_at : latest),
    null,
  );
  const lastBy = lastUpdate
    ? data.guests.find((g) => g.id === data.rsvps.find((r) => r.updated_at === lastUpdate)?.responded_by)
    : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-muted">RSVP</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">{guest.household.name}</h1>
        {data.events.length ? (
          <p className="mx-auto mt-3 max-w-md text-muted">
            Let us know who&apos;s coming to each event. You can answer for everyone in your
            household, and change it any time before the deadline.
          </p>
        ) : null}
        {lastUpdate ? (
          <p className="mt-2 text-sm text-muted">
            Last updated{lastBy ? ` by ${lastBy.first_name}` : ""} on{" "}
            {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(
              new Date(lastUpdate),
            )}
            .
          </p>
        ) : null}
      </header>

      {data.events.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-line bg-white/70 p-6 text-center text-muted">
          RSVPs aren&apos;t open yet — we&apos;ll let you know when they are.
        </p>
      ) : (
        <RsvpForm {...data} isAdmin={guest.is_admin} />
      )}
    </div>
  );
}
