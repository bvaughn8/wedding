import Link from "next/link";
import { Button, Input } from "@/components/ui";
import {
  guestName,
  inviteUrl,
  listHouseholds,
  requireAdmin,
  siteOrigin,
  type AdminHousehold,
} from "@/lib/admin";
import {
  addGuest,
  addHousehold,
  deleteHousehold,
  regenerateInvite,
  removeGuest,
  renameHousehold,
  resetGuestSignIn,
} from "./actions";
import { ActionButton, ActionForm, CopyButton } from "./forms";

export default async function AdminHouseholdsPage() {
  const me = await requireAdmin();
  const [households, { origin, fromEnv }] = await Promise.all([listHouseholds(), siteOrigin()]);

  const guests = households.flatMap((h) => h.guests);
  const signedUp = guests.filter((g) => g.claimed_at).length;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-4xl">Households</h1>
        <p className="mt-2 text-muted">
          {households.length} households · {guests.length} guests · {signedUp} signed up
        </p>
        {!fromEnv ? (
          <p className="mt-3 rounded-lg border border-line bg-white/70 p-3 text-sm text-muted">
            Invite links use <code className="text-ink">{origin}</code>. Set{" "}
            <code className="text-ink">SITE_URL</code> to your real domain before printing
            invitations.
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-line bg-white/70 p-5 sm:p-6">
        <h2 className="font-serif text-2xl">Add a household</h2>
        <ActionForm action={addHousehold} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Household name
            <Input name="name" placeholder="The Patel Family" required maxLength={100} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Guests, one per line
            <textarea
              name="guests"
              required
              rows={3}
              placeholder={"Asha Patel\nRaj Patel"}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <div>
            <Button type="submit">Add household</Button>
          </div>
        </ActionForm>
      </section>

      {households.length === 0 ? (
        <p className="text-muted">No households yet.</p>
      ) : (
        <ul className="space-y-6">
          {households.map((h) => (
            <HouseholdCard
              key={h.id}
              household={h}
              url={inviteUrl(origin, h.invite_token)}
              myGuestId={me.id}
              isMine={h.id === me.household.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function HouseholdCard({
  household: h,
  url,
  myGuestId,
  isMine,
}: {
  household: AdminHousehold;
  url: string;
  myGuestId: string;
  isMine: boolean;
}) {
  const signedUp = h.guests.filter((g) => g.claimed_at).length;

  return (
    <li id={h.id} className="scroll-mt-6 rounded-2xl border border-line bg-white/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-2xl">{h.name}</h2>
        <span className="text-sm text-muted">
          {signedUp}/{h.guests.length} signed up
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-paper p-3">
        <p className="break-all font-mono text-xs text-muted">{url}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-1">
          <CopyButton text={url} />
          <Link
            href={`/admin/qr#${h.id}`}
            className="min-h-9 rounded-md px-2 py-2 text-sm text-muted underline underline-offset-4 hover:text-ink"
          >
            QR code
          </Link>
          <ActionButton
            action={regenerateInvite}
            fields={{ household_id: h.id }}
            confirm={`Make a new invite link for ${h.name}? The old link and any printed QR code will stop working. People already signed up stay signed up.`}
          >
            New link
          </ActionButton>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {h.guests.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
            <div className="min-w-0">
              <p className="font-medium">
                {guestName(g)}
                {g.is_admin ? <Badge>Admin</Badge> : null}
                {g.is_plus_one ? <Badge>Plus-one</Badge> : null}
              </p>
              <p className="break-all text-sm text-muted">
                {g.claimed_at ? `Signed up · ${g.email}` : "Not signed up yet"}
              </p>
            </div>
            {g.id !== myGuestId ? (
              <div className="flex flex-wrap items-center">
                {g.claimed_at ? (
                  <ActionButton
                    action={resetGuestSignIn}
                    fields={{ guest_id: g.id }}
                    confirm={`Reset sign-in for ${guestName(g)}? They'll need to scan the invite again and verify an email.`}
                  >
                    Reset sign-in
                  </ActionButton>
                ) : null}
                <ActionButton
                  action={removeGuest}
                  fields={{ guest_id: g.id }}
                  confirm={`Remove ${guestName(g)} from ${h.name}?`}
                  tone="danger"
                >
                  Remove
                </ActionButton>
              </div>
            ) : (
              <span className="text-sm text-muted">You</span>
            )}
          </li>
        ))}
      </ul>

      <details className="mt-3 group">
        <summary className="min-h-9 cursor-pointer py-2 text-sm text-muted hover:text-ink">
          Add a guest · rename{isMine ? "" : " · delete"}
        </summary>
        <div className="mt-3 space-y-5">
          <ActionForm action={addGuest} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="household_id" value={h.id} />
            <label className="flex min-w-32 flex-1 flex-col gap-1 text-sm">
              First name
              <Input name="first_name" required maxLength={100} />
            </label>
            <label className="flex min-w-32 flex-1 flex-col gap-1 text-sm">
              Last name
              <Input name="last_name" maxLength={100} />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="is_plus_one" className="size-4 accent-accent" />
              Plus-one
            </label>
            <Button type="submit">Add guest</Button>
          </ActionForm>

          <ActionForm action={renameHousehold} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="household_id" value={h.id} />
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
              Household name
              <Input name="name" defaultValue={h.name} required maxLength={100} />
            </label>
            <Button type="submit" variant="ghost">
              Rename
            </Button>
          </ActionForm>

          {!isMine ? (
            <ActionButton
              action={deleteHousehold}
              fields={{ household_id: h.id }}
              confirm={`Delete ${h.name} and all ${h.guests.length} guest(s)? This can't be undone.`}
              tone="danger"
            >
              Delete household
            </ActionButton>
          ) : null}
        </div>
      </details>
    </li>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 rounded-full border border-line px-2 py-0.5 align-middle text-xs font-normal text-muted">
      {children}
    </span>
  );
}
