-- Households, guests and invite tokens.
-- Run in Supabase → SQL Editor, or with `supabase db push` if you use the CLI.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.households (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,                       -- e.g. "The Patel Family"
  -- Unguessable token printed on the invitation as a QR code: /i/<token>
  invite_token text not null unique default
    replace(replace(rtrim(encode(extensions.gen_random_bytes(18), 'base64'), '='), '+', '-'), '/', '_'),
  notes        text,
  created_at   timestamptz not null default now()
);

create table public.guests (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  first_name    text not null,
  last_name     text,
  -- Set when the guest first scans the QR code and verifies their email.
  email         text,
  user_id       uuid unique references auth.users (id) on delete set null,
  claimed_at    timestamptz,
  is_plus_one   boolean not null default false,
  is_admin      boolean not null default false,       -- the couple
  created_at    timestamptz not null default now(),
  constraint email_is_lowercase check (email is null or email = lower(email))
);

create unique index guests_email_key on public.guests (email) where email is not null;
create index guests_household_id_idx on public.guests (household_id);

-- ---------------------------------------------------------------------------
-- Helpers used by row-level security
-- ---------------------------------------------------------------------------

-- Kept in a private schema (not exposed through the Data API), so they can't
-- be called as public endpoints. SECURITY DEFINER lets them read guests
-- without recursing into the guests RLS policies; both only ever look up the
-- caller's own row via auth.uid().

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.guests where user_id = (select auth.uid())
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.guests where user_id = (select auth.uid())),
    false
  )
$$;

revoke execute on function private.current_household_id() from public, anon;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.current_household_id() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Data API access
--   Since Oct 2026 Supabase no longer exposes new tables automatically, so
--   grant explicitly. Signed-out visitors (anon) get nothing; signed-in users
--   get table access that RLS below narrows to their own household.
-- ---------------------------------------------------------------------------

revoke all on public.households, public.guests from anon;
grant select, insert, update, delete on public.households, public.guests to authenticated;
grant select, insert, update, delete on public.households, public.guests to service_role;

-- ---------------------------------------------------------------------------
-- Row-level security
--   Guests can read their own household and its members.
--   Admins (the couple) can read and change everything.
--   Linking a guest to a login is done server-side with the secret key,
--   after checking the invite token, so guests get no write access here.
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.guests     enable row level security;

create policy "Guests read own household"
  on public.households for select to authenticated
  using (id = (select private.current_household_id()) or (select private.is_admin()));

create policy "Admins manage households"
  on public.households for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Guests read own household members"
  on public.guests for select to authenticated
  using (household_id = (select private.current_household_id()) or (select private.is_admin()));

create policy "Admins manage guests"
  on public.guests for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
