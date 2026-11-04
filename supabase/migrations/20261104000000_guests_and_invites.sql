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

create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.guests where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.guests where user_id = auth.uid()),
    false
  )
$$;

revoke execute on function public.current_household_id() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.current_household_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

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
  using (id = (select public.current_household_id()) or (select public.is_admin()));

create policy "Admins manage households"
  on public.households for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Guests read own household members"
  on public.guests for select to authenticated
  using (household_id = (select public.current_household_id()) or (select public.is_admin()));

create policy "Admins manage guests"
  on public.guests for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
