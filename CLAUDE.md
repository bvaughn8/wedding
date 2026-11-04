# Wedding website — Billy & Simmi

Private, mobile-first wedding site: info pages, RSVPs, guest photo uploads + gallery, and an admin area for events/supplier tracking.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Vercel · Resend (SMTP for auth emails)

Decisions and their reasoning: `claude/tech-stack-and-auth-decisions.md` (local, gitignored — read it before changing architecture).

## Commands

```bash
npm install          # Node >= 20.9
npm run dev          # http://localhost:3000 — restart after editing .env.local
npm run build        # production build; run before calling work done
npm run typecheck    # tsc --noEmit
```

No linter is configured yet (`next lint` was removed in Next 16; add ESLint or Biome directly if needed). No test suite yet.

## Environment

`.env.local` (gitignored; template in `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — `sb_publishable_…`, safe in the browser
- `SUPABASE_SECRET_KEY` — `sb_secret_…`, **server only**. Bypasses RLS. Never prefix with `NEXT_PUBLIC_`, never import `lib/supabase/admin.ts` from client code.

## Testing the app locally

1. Supabase SQL Editor: run `supabase/migrations/*.sql` in order, then a copy of `supabase/seed.example.sql` with real names. Its last query prints invite links.
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

## Status

**Done:** project scaffold, households/guests schema + RLS, QR-invite + email-OTP sign-in, guest-list gate, placeholder home page.

**Not yet verified end-to-end:** files were written without being able to run `npm install`/`build` in the original environment. First step in a new session: `npm run build` and fix anything that fails, then test the invite flow.

**Next up**
1. Admin page: list households, invite links, printable QR codes / CSV export for the invitation designer.
2. Wedding info pages (schedule, venue, travel, FAQ).
3. RSVP per household — per-person attending + meal choice; plus-ones are a flag on `guests`.
4. Photos: private Supabase Storage bucket, direct browser uploads via signed upload URLs, browser-side thumbnail generation (also converts iPhone HEIC), originals kept, admin approve/hide before photos show in the gallery. Open question: photos only, or videos too?
5. Admin: RSVP overview, photo moderation, events & supplier tracking.
6. Deploy to Vercel + custom domain; upgrade Supabase to Pro ($25/mo) shortly before RSVPs open (Free pauses after 1 week idle, 1 GB storage, 50 MB uploads).
