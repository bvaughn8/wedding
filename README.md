# wedding
Billy and Simmi's Wedding Website

Next.js 16 (App Router) · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Vercel

## How guests sign in

1. Each household gets a unique link, `/i/<token>`, printed on the invitation as a QR code.
2. **First scan:** the guest picks their name, enters their email, and types the 6-digit code we email them. Their email is now linked to their guest record.
3. **After that:** they sign in at `/login` with their email + a fresh code. Scanning the QR again also works — it just emails a code to the address they saved.
4. A signed-in account that isn't linked to a guest sees "We can't find you on the guest list". Row-level security limits each guest to their own household; guests with `is_admin = true` (you two) can see everything.

Each person in a household can link their own email. If a couple shares one email, only one of them can link it — fine, since RSVPs will be per household.

## Setup

### 1. Supabase project
1. Create a project at [supabase.com](https://supabase.com) (Free is fine while building).
2. **SQL Editor** → run `supabase/migrations/20261104000000_guests_and_invites.sql`.
3. Add your guest list — see `supabase/seed.example.sql`. The last query there prints each household's invite link.

### 2. Email codes (important)
Supabase emails a link by default; we want a code.

- **Authentication → Emails → Templates:** edit **Magic Link** *and* **Confirm signup** so the body shows the code, e.g.
  ```html
  <h2>Your sign-in code</h2>
  <p>Enter this code on the wedding site: <strong>{{ .Token }}</strong></p>
  ```
  (Remove the `{{ .ConfirmationURL }}` link.)
- **Authentication → Sign In / Providers → Email:** keep Email enabled. Set the code length (default 6) if you like.
- **Custom SMTP (before real guests use it):** Supabase's built-in email is heavily rate-limited and meant for testing. Create a free [Resend](https://resend.com) account, verify your domain, and enter its SMTP details under **Authentication → Emails → SMTP Settings**.
- **Authentication → URL Configuration:** set the Site URL to your real domain once deployed.

### 3. Run locally
```bash
cp .env.example .env.local   # fill in values from Supabase → Project Settings → API Keys
npm install
npm run dev
```
Open `http://localhost:3000/i/<token>` using a token from the seed query.

### 4. Deploy
Import the repo in Vercel and add the three env vars from `.env.example`. `SUPABASE_SECRET_KEY` must never be prefixed with `NEXT_PUBLIC_`.

## Project layout
```
proxy.ts                    Refreshes the Supabase session; sends signed-out visitors to /login
lib/supabase/               Browser, server, admin (secret key) and proxy clients
lib/guest.ts                getCurrentGuest(): signed-out / not-invited / ok
app/i/[token]/              QR invite: pick name → email → code (first time) or code to saved email
app/login/                  Email + code sign-in for returning guests
app/(site)/                 Everything behind the gate (home for now)
app/auth/signout/           POST to sign out
supabase/migrations/        Database schema + row-level security
```

## Rotating a forwarded invite link
```sql
update public.households
  set invite_token = replace(replace(rtrim(encode(extensions.gen_random_bytes(18), 'base64'), '='), '+', '-'), '/', '_')
  where name = 'The Example Family';
```
Guests who already linked their email can still sign in at `/login`.

## Next up
- Wedding info pages
- RSVP per household
- Photo upload + gallery (Supabase Storage, browser-side thumbnails, approve before showing)
- Admin: guest list, invite link / QR export, RSVP overview, photo moderation, events & suppliers
