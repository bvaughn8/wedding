-- Events (mehndi, ceremony, reception…), which households are invited to
-- each, and per-guest RSVPs with an optional meal choice.
--
-- Guests read their own household's events/RSVPs through RLS. RSVP writes go
-- through a server action (admin client) that checks household, invitation
-- and meal option first, so guests get no write policies here.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.events (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(name) between 1 and 100),
  -- Venue-local wall-clock date/time; both optional while plans settle.
  event_date     date,
  start_time     time,
  venue          text,
  details        text,
  -- Empty array = don't ask for a meal choice at this event.
  meal_options   text[] not null default '{}',
  -- true: every household is invited. false: only those in event_invites.
  all_households boolean not null default true,
  rsvp_deadline  date,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create table public.event_invites (
  event_id     uuid not null references public.events (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  primary key (event_id, household_id)
);
create index event_invites_household_id_idx on public.event_invites (household_id);

create table public.rsvps (
  guest_id       uuid not null references public.guests (id) on delete cascade,
  event_id       uuid not null references public.events (id) on delete cascade,
  attending      boolean not null,
  meal_choice    text,
  -- Which guest submitted it (anyone in the household can answer for everyone).
  responded_by   uuid references public.guests (id) on delete set null,
  updated_at     timestamptz not null default now(),
  primary key (guest_id, event_id),
  constraint meal_only_when_attending check (attending or meal_choice is null)
);
create index rsvps_event_id_idx on public.rsvps (event_id);
create index rsvps_responded_by_idx on public.rsvps (responded_by);

-- Dietary needs belong to the person, not the event.
alter table public.guests add column dietary_notes text;

-- ---------------------------------------------------------------------------
-- Helper: is the caller's household invited to this event?
-- ---------------------------------------------------------------------------

create or replace function private.household_invited_to(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and (
        e.all_households
        or exists (
          select 1 from public.event_invites i
          where i.event_id = e.id
            and i.household_id = private.current_household_id()
        )
      )
  )
$$;

revoke execute on function private.household_invited_to(uuid) from public, anon;
grant execute on function private.household_invited_to(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Data API access (new tables aren't exposed automatically; anon gets nothing)
-- ---------------------------------------------------------------------------

revoke all on public.events, public.event_invites, public.rsvps from anon;
grant select, insert, update, delete on public.events, public.event_invites, public.rsvps to authenticated;
grant select, insert, update, delete on public.events, public.event_invites, public.rsvps to service_role;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.events        enable row level security;
alter table public.event_invites enable row level security;
alter table public.rsvps         enable row level security;

create policy "Guests read events they're invited to"
  on public.events for select to authenticated
  using ((select private.is_admin()) or private.household_invited_to(id));

create policy "Admins manage events"
  on public.events for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Guests read own household's invites"
  on public.event_invites for select to authenticated
  using (household_id = (select private.current_household_id()) or (select private.is_admin()));

create policy "Admins manage invites"
  on public.event_invites for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Guests read own household's RSVPs"
  on public.rsvps for select to authenticated
  using (
    (select private.is_admin())
    or guest_id in (
      select g.id from public.guests g
      where g.household_id = (select private.current_household_id())
    )
  );

create policy "Admins manage RSVPs"
  on public.rsvps for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
