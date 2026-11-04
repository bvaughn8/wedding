# Wedding website — Billy & Simmi

Private, mobile-first wedding site: info pages, RSVPs, guest photo uploads + gallery, and an admin area for events/supplier tracking.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Vercel · Resend (SMTP for auth emails)

Decisions and their reasoning: `claude/tech-stack-and-auth-decisions.md` (local, gitignored — read it before changing architecture).

## Commands

```bash
npm install          # Node >= 22.12 (Tailwind v4 + supabase-js need it; 20.x fails the build)
npm run dev          # http://localhost:3000 — restart after editing .env.local
npm run build        # production build; run before calling work done
npm run typecheck    # tsc --noEmit
```

### Database migrations (Supabase CLI)

The repo is linked to the remote project (`ajebevwzlxlvjzzkjqbg`; link state in `supabase/.temp/`). Apply new files in `supabase/migrations/` with:

```bash
npx supabase db push --remote --dry-run   # preview which migrations will run
npx supabase db push --remote             # apply; prompts for the database password
```

`--remote` is required here (there's no local Supabase stack). The CLI records applied migrations, so each push only runs new files. To add a migration, create `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql`; never edit one that's already been pushed. Seeds aren't applied by `db push`.

No linter is configured yet (`next lint` was removed in Next 16; add ESLint or Biome directly if needed). No test suite yet.

## Environment

`.env.local` (gitignored; template in `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — `sb_publishable_…`, safe in the browser
- `SUPABASE_SECRET_KEY` — `sb_secret_…`, **server only**. Bypasses RLS. Never prefix with `NEXT_PUBLIC_`, never import `lib/supabase/admin.ts` from client code.
- `SITE_URL` — e.g. `https://billyandsimmi.com`; base for invite links and QR codes. Falls back to the request host (fine locally, wrong for printing).
- `DEV_LOG_AUTH_CODES=true` — dev only: sign-in codes are printed to the `npm run dev` log (`[DEV_LOG_AUTH_CODES] …`) instead of emailed (`lib/auth-code.ts`). Ignored when `NODE_ENV` is production. `/login` still only issues codes for emails already linked to a guest.

## Testing the app locally

1. Apply migrations with `npx supabase db push --remote` (see above), then in the Supabase SQL Editor run a copy of `supabase/seed.example.sql` with real names. Its last query prints invite links.
2. `npm run dev`, open `http://localhost:3000/i/<invite_token>`.
   - Household name + guest names shown → DB + secret key work.
   - "We couldn't find that invitation" → connected, but token not in `households`.
3. Email-code sign-in also needs: custom SMTP (Resend) configured in Supabase **first** (new Free-plan projects can't edit templates on default SMTP), then the **Magic Link** and **Confirm signup** templates edited to show `{{ .Token }}` instead of a link.

## Auth model (read before touching auth)

- Each household has an unguessable `households.invite_token`, printed on the invitation as a QR code → `/i/<token>`.
- **First scan:** guest picks their name → enters email → verifies a 6-digit email OTP → `guests.user_id` + `guests.email` are set (`app/i/[token]/actions.ts`, `confirmClaim`).
- **Later:** `/login` with email + OTP. Re-scanning the QR for an already-linked guest sends a code to their saved email.
- Codes, not magic links (links open inside email apps' in-app browsers on phones).
- `/login` deliberately doesn't reveal whether an email is on the guest list.
- **The gate is the guest list**, not the login: `proxy.ts` only refreshes the session and redirects signed-out users; `app/(site)/layout.tsx` uses `getCurrentGuest()` (`lib/guest.ts`) to require a linked guest, else `/not-invited`.
- Every server action re-validates the invite token server-side; never trust guest/household IDs from the browser alone.
- Admins are guests with `is_admin = true` (Billy & Simmi).

## Layout

```
proxy.ts                  Next 16 "proxy" (formerly middleware): session refresh + signed-out redirect
lib/supabase/client.ts    browser client
lib/supabase/server.ts    server client (acts as the user; RLS applies)
lib/supabase/admin.ts     secret-key client (bypasses RLS; server only)
lib/supabase/proxy.ts     updateSession() used by proxy.ts
lib/guest.ts              getCurrentGuest(): signed-out | not-invited | ok
lib/email.ts              email/code normalisation + masking
app/i/[token]/            QR invite flow (page, client flow, server actions)
app/login/                returning-guest sign-in
app/(site)/               everything behind the gate
app/(site)/admin/         admin only (requireAdmin in lib/admin.ts): households, guests, invite links, QR print page, CSV export
app/(site)/rsvp/          household RSVP form + saveRsvp action
app/not-invited/          signed in but not linked to a guest
app/auth/signout/         POST sign-out
components/ui.tsx         shared UI primitives
supabase/migrations/      schema, grants, RLS
```

## Supabase conventions & gotchas

- The Supabase plugin is useful here: `claude plugin marketplace add anthropics/claude-plugins-official` then `claude plugin install supabase@claude-plugins-official`. Follow its skill (check the Supabase changelog/docs; don't rely on memory).
- **New tables are not exposed to the Data API automatically** (Supabase change, enforced Oct 30, 2026). Every new table's migration must include explicit grants, then `enable row level security`, then policies:
  ```sql
  grant select, insert, update, delete on public.x to authenticated;
  grant select, insert, update, delete on public.x to service_role;
  -- anon gets nothing: the whole site is behind sign-in
  ```
- RLS helpers live in the non-exposed `private` schema (`private.current_household_id()`, `private.is_admin()`), `security definer`, `search_path = ''`. Keep new helpers there, never in `public`.
- RLS pattern: guests see their own household's rows; admins see/manage everything. Writes that need extra checks go through server actions with the admin client.
- Use `supabase.auth.getClaims()` on the server, not `getSession()`.
- Next 16: `params`, `searchParams`, `cookies()`, `headers()` are async — `await` them.
- No generated DB types yet; consider `supabase gen types typescript` once the schema settles.
- Commit `package-lock.json`.
- **Storage buckets are separate by purpose.** `site-photos` (private) holds the couple's photos for site content (Our story, etc.): uploaded in the dashboard, referenced by path in `content/*.ts`, served via signed URLs from `lib/photos.ts` (`signedPhotoUrls`). It must **never** be listed or shown in the guest photo gallery. The gallery gets its own bucket.

## Status

**Done:** project scaffold, households/guests schema + RLS, QR-invite + email-OTP sign-in, guest-list gate, animated home page (`components/doodles.tsx`), admin households/invites/QR/CSV, events + per-guest RSVPs with per-event meal options (`/rsvp`, `/admin/events`). Build passes on Node 22; invite flow + admin households tested by hand.

**Not yet tested in a browser:** RSVP form and `/admin/events` (migration is applied).

**RSVP model:** `events` (with `meal_options text[]`, `all_households`, `rsvp_deadline`), `event_invites` (when not all households), `rsvps` (guest × event), `guests.dietary_notes`. Anyone in a household answers for all of it; writes go through `app/(site)/rsvp/actions.ts` with the admin client after checking household/invite/meal/deadline. New guests land on `/rsvp` right after first sign-up.

**Next up**
1. Wedding info pages (schedule, venue, travel, FAQ).
2. Email (Resend SMTP) so real guests get codes.
3. Guest photo gallery: its **own** private Supabase Storage bucket (not `site-photos`), direct browser uploads via signed upload URLs, browser-side thumbnail generation (also converts iPhone HEIC), originals kept, admin approve/hide before photos show in the gallery. Open question: photos only, or videos too?
4. Admin: photo moderation, supplier tracking.
5. Deploy to Vercel + custom domain; upgrade Supabase to Pro ($25/mo) shortly before RSVPs open (Free pauses after 1 week idle, 1 GB storage, 50 MB uploads).
