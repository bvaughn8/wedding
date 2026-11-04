import { Button, Input } from "@/components/ui";
import { requireAdmin, type AdminHousehold } from "@/lib/admin";
import { guestName, loadEventSummaries, type EventSummary } from "@/lib/admin-rsvps";
import { formatDate, formatEventWhen, type WeddingEvent } from "@/lib/events";
import { ActionButton, ActionForm } from "../forms";
import { deleteEvent, saveEvent } from "./actions";

export default async function AdminEventsPage() {
  await requireAdmin();
  const { households, summaries } = await loadEventSummaries();

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Events &amp; RSVPs</h1>
          <p className="mt-2 text-muted">
            Guests RSVP per event. Meal options are per event — leave them empty to skip the
            meal question.
          </p>
        </div>
        {summaries.length ? (
          <a
            href="/admin/events/export"
            download
            className="text-sm text-muted underline underline-offset-4 hover:text-ink"
          >
            Export RSVPs (CSV)
          </a>
        ) : null}
      </header>

      {summaries.map((s) => (
        <EventCard key={s.event.id} summary={s} households={households} />
      ))}

      <section className="rounded-2xl border border-line bg-white/70 p-5 sm:p-6">
        <h2 className="font-serif text-2xl">Add an event</h2>
        <ActionForm action={saveEvent} className="mt-4 flex flex-col gap-3">
          <EventFields households={households} />
          <div>
            <Button type="submit">Add event</Button>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}

function EventCard({ summary: s, households }: { summary: EventSummary; households: AdminHousehold[] }) {
  const e = s.event;
  const diets = s.rows.filter((r) => r.rsvp?.attending && r.guest.dietary_notes);

  return (
    <section className="rounded-2xl border border-line bg-white/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-3xl">{e.name}</h2>
        <span className="text-sm text-muted">
          {e.all_households ? "All households" : `${s.invitedHouseholdIds.size} households`}
        </span>
      </div>
      <p className="text-muted">
        {[formatEventWhen(e), e.venue].filter(Boolean).join(" · ") || "No date or venue yet"}
      </p>
      {e.rsvp_deadline ? (
        <p className="text-sm text-muted">
          Reply by {formatDate(e.rsvp_deadline, { weekday: undefined })}
        </p>
      ) : null}

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Attending" value={s.attending} />
        <Stat label="Declined" value={s.declined} />
        <Stat label="Awaiting" value={s.awaiting} />
      </dl>

      {s.meals.length ? (
        <p className="mt-3 text-sm">
          <span className="text-muted">Meals: </span>
          {s.meals.map(([m, n]) => `${m} × ${n}`).join(" · ")}
        </p>
      ) : null}

      {diets.length ? (
        <div className="mt-3 text-sm">
          <p className="text-muted">Dietary notes (attending guests):</p>
          <ul className="mt-1 list-disc pl-5">
            {diets.map((r) => (
              <li key={r.guest.id}>
                {guestName(r.guest)}: {r.guest.dietary_notes}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="mt-4">
        <summary className="min-h-9 cursor-pointer py-2 text-sm text-muted hover:text-ink">
          Guest responses ({s.rows.length})
        </summary>
        <ul className="mt-2 divide-y divide-line text-sm">
          {s.rows.map((r) => (
            <li key={r.guest.id} className="flex flex-wrap justify-between gap-x-4 py-2">
              <span>
                {guestName(r.guest)} <span className="text-muted">· {r.household.name}</span>
              </span>
              <span className={r.rsvp ? (r.rsvp.attending ? "text-accent-dark" : "text-danger") : "text-muted"}>
                {r.rsvp
                  ? r.rsvp.attending
                    ? `Yes${r.rsvp.meal_choice ? ` · ${r.rsvp.meal_choice}` : ""}`
                    : "No"
                  : "Awaiting"}
              </span>
            </li>
          ))}
        </ul>
      </details>

      <details className="mt-1">
        <summary className="min-h-9 cursor-pointer py-2 text-sm text-muted hover:text-ink">
          Edit or delete
        </summary>
        <ActionForm action={saveEvent} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="event_id" value={e.id} />
          <EventFields event={e} invited={s.invitedHouseholdIds} households={households} />
          <div>
            <Button type="submit">Save changes</Button>
          </div>
        </ActionForm>
        <div className="mt-4">
          <ActionButton
            action={deleteEvent}
            fields={{ event_id: e.id }}
            tone="danger"
            confirm={`Delete ${e.name}? Its ${s.attending + s.declined} RSVP answer(s) will be deleted too.`}
          >
            Delete event
          </ActionButton>
        </div>
      </details>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-paper p-3">
      <dd className="font-serif text-3xl">{value}</dd>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

function EventFields({
  event: e,
  invited,
  households,
}: {
  event?: WeddingEvent;
  invited?: Set<string>;
  households: AdminHousehold[];
}) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        Name
        <Input name="name" required maxLength={100} defaultValue={e?.name} placeholder="Ceremony" />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Date
          <Input type="date" name="event_date" defaultValue={e?.event_date ?? ""} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Start time
          <Input type="time" name="start_time" defaultValue={e?.start_time?.slice(0, 5) ?? ""} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          RSVP by
          <Input type="date" name="rsvp_deadline" defaultValue={e?.rsvp_deadline ?? ""} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Venue
        <Input name="venue" maxLength={200} defaultValue={e?.venue ?? ""} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Details for guests
        <textarea name="details" rows={2} defaultValue={e?.details ?? ""} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Meal options, one per line (optional)
        <textarea
          name="meal_options"
          rows={3}
          defaultValue={e?.meal_options.join("\n") ?? ""}
          placeholder={"Chicken\nFish\nVegetarian"}
          className={fieldClass}
        />
      </label>
      <label className="flex w-32 flex-col gap-1 text-sm">
        Order
        <Input type="number" name="sort_order" defaultValue={e?.sort_order ?? 0} />
      </label>

      <fieldset className="text-sm">
        <legend className="mb-1">Who&apos;s invited</legend>
        <label className="flex min-h-9 items-center gap-2">
          <input
            type="radio"
            name="invite"
            value="all"
            defaultChecked={e ? e.all_households : true}
            className="size-4 accent-accent"
          />
          Every household
        </label>
        <label className="flex min-h-9 items-center gap-2">
          <input
            type="radio"
            name="invite"
            value="selected"
            defaultChecked={e ? !e.all_households : false}
            className="size-4 accent-accent"
          />
          Only these households:
        </label>
        <div className="mt-1 grid grid-cols-1 gap-x-4 pl-6 sm:grid-cols-2">
          {households.map((h) => (
            <label key={h.id} className="flex min-h-9 items-center gap-2">
              <input
                type="checkbox"
                name="households"
                value={h.id}
                defaultChecked={invited?.has(h.id) ?? false}
                className="size-4 accent-accent"
              />
              {h.name}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
