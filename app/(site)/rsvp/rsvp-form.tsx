"use client";

import { useActionState, useState } from "react";
import { Button, ErrorText, Input } from "@/components/ui";
import { formatDate, formatEventWhen, rsvpClosed, type Rsvp, type WeddingEvent } from "@/lib/events";
import type { RsvpGuest } from "@/lib/rsvp";
import { saveRsvp } from "./actions";

type Answer = { attending: "yes" | "no" | ""; meal: string };
const key = (eventId: string, guestId: string) => `${eventId}:${guestId}`;

export function RsvpForm({
  guests,
  events,
  rsvps,
  isAdmin,
}: {
  guests: RsvpGuest[];
  events: WeddingEvent[];
  rsvps: Rsvp[];
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveRsvp, null);

  // Controlled state so React's post-submit form reset can't wipe answers.
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    const init: Record<string, Answer> = {};
    for (const r of rsvps) {
      init[key(r.event_id, r.guest_id)] = {
        attending: r.attending ? "yes" : "no",
        meal: r.meal_choice ?? "",
      };
    }
    return init;
  });
  const [names, setNames] = useState(() =>
    Object.fromEntries(guests.map((g) => [g.id, { first: g.first_name, last: g.last_name ?? "" }])),
  );
  const [diet, setDiet] = useState(() =>
    Object.fromEntries(guests.map((g) => [g.id, g.dietary_notes ?? ""])),
  );

  const answer = (e: string, g: string): Answer => answers[key(e, g)] ?? { attending: "", meal: "" };
  const setAnswer = (e: string, g: string, patch: Partial<Answer>) =>
    setAnswers((prev) => ({ ...prev, [key(e, g)]: { ...answer(e, g), ...patch } }));
  const displayName = (g: RsvpGuest) =>
    [names[g.id]?.first || "Your guest", names[g.id]?.last].filter(Boolean).join(" ");

  const namablePlusOnes = guests.filter((g) => g.is_plus_one && !g.claimed_at);
  const anyoneAttending = Object.values(answers).some((a) => a.attending === "yes");

  return (
    <form action={formAction} className="mt-10 space-y-8">
      {namablePlusOnes.length ? (
        <section className="rounded-2xl border border-line bg-white/70 p-5 sm:p-6">
          <h2 className="font-serif text-2xl">Your plus-one</h2>
          <p className="mt-1 text-sm text-muted">Who are you bringing? Leave blank if you&apos;re not sure yet.</p>
          {namablePlusOnes.map((g) => (
            <div key={g.id} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                First name
                <Input
                  name={`first:${g.id}`}
                  value={names[g.id].first === "Guest" ? "" : names[g.id].first}
                  placeholder="First name"
                  maxLength={100}
                  onChange={(ev) =>
                    setNames((p) => ({ ...p, [g.id]: { ...p[g.id], first: ev.target.value } }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Last name
                <Input
                  name={`last:${g.id}`}
                  value={names[g.id].last}
                  placeholder="Last name"
                  maxLength={100}
                  onChange={(ev) =>
                    setNames((p) => ({ ...p, [g.id]: { ...p[g.id], last: ev.target.value } }))
                  }
                />
              </label>
            </div>
          ))}
        </section>
      ) : null}

      {events.map((e) => {
        const closed = rsvpClosed(e) && !isAdmin;
        return (
          <section key={e.id} className="rounded-2xl border border-line bg-white/70 p-5 sm:p-6">
            <h2 className="font-serif text-3xl">{e.name}</h2>
            {formatEventWhen(e) ? <p className="mt-1 text-muted">{formatEventWhen(e)}</p> : null}
            {e.venue ? <p className="text-muted">{e.venue}</p> : null}
            {e.details ? <p className="mt-3 whitespace-pre-line text-sm">{e.details}</p> : null}
            {e.rsvp_deadline ? (
              <p className={`mt-3 text-sm ${closed ? "text-danger" : "text-muted"}`}>
                {closed ? "RSVPs closed on " : "Please reply by "}
                {formatDate(e.rsvp_deadline, { weekday: undefined })}
                {closed ? " — get in touch with Billy or Simmi to make changes." : "."}
              </p>
            ) : null}

            <ul className="mt-4 divide-y divide-line">
              {guests.map((g) => {
                const a = answer(e.id, g.id);
                return (
                  <li key={g.id} className="py-4">
                    <fieldset disabled={closed || pending}>
                      <legend className="font-medium">{displayName(g)}</legend>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {(["yes", "no"] as const).map((v) => (
                          <label
                            key={v}
                            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40 ${
                              a.attending === v
                                ? "border-accent bg-accent text-white"
                                : "border-line bg-white hover:border-accent"
                            }`}
                          >
                            <input
                              type="radio"
                              className="sr-only"
                              name={`attending:${e.id}:${g.id}`}
                              value={v}
                              checked={a.attending === v}
                              onChange={() => setAnswer(e.id, g.id, { attending: v })}
                            />
                            {v === "yes" ? "Joyfully accepts" : "Regretfully declines"}
                          </label>
                        ))}
                      </div>
                      {a.attending === "yes" && e.meal_options.length ? (
                        <label className="mt-3 flex flex-col gap-1 text-sm">
                          Meal
                          <select
                            name={`meal:${e.id}:${g.id}`}
                            value={a.meal}
                            required
                            onChange={(ev) => setAnswer(e.id, g.id, { meal: ev.target.value })}
                            className="min-h-11 rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                          >
                            <option value="" disabled>
                              Choose a meal…
                            </option>
                            {e.meal_options.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </fieldset>
                    {/* Disabled fieldsets don't submit; keep closed answers in the payload. */}
                    {closed && a.attending ? (
                      <input type="hidden" name={`attending:${e.id}:${g.id}`} value={a.attending} />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {anyoneAttending ? (
        <section className="rounded-2xl border border-line bg-white/70 p-5 sm:p-6">
          <h2 className="font-serif text-2xl">Dietary requirements</h2>
          <p className="mt-1 text-sm text-muted">Allergies, vegetarian, halal… anything the caterers should know.</p>
          <div className="mt-4 space-y-3">
            {guests.map((g) => (
              <label key={g.id} className="flex flex-col gap-1 text-sm">
                {displayName(g)}
                <Input
                  name={`diet:${g.id}`}
                  value={diet[g.id]}
                  maxLength={500}
                  placeholder="None"
                  disabled={pending}
                  onChange={(ev) => setDiet((p) => ({ ...p, [g.id]: ev.target.value }))}
                />
              </label>
            ))}
          </div>
        </section>
      ) : (
        // Keep any saved notes when nobody's currently marked as attending.
        guests.map((g) => <input key={g.id} type="hidden" name={`diet:${g.id}`} value={diet[g.id]} />)
      )}

      <div className="flex flex-col items-center gap-3 pb-6">
        <ErrorText>{state?.error}</ErrorText>
        {state?.ok ? (
          <p role="status" className="text-accent-dark">
            Thank you — your RSVP is saved.
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:px-10">
          {pending ? "Saving…" : "Send RSVP"}
        </Button>
      </div>
    </form>
  );
}
