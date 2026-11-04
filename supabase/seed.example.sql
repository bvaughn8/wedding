-- Example: add households and guests, then list their invite links.
-- Run in Supabase → SQL Editor. Replace the names with your real guest list.

with h as (
  insert into public.households (name) values ('Billy & Simmi') returning id
)
insert into public.guests (household_id, first_name, last_name, is_admin)
select id, g.first_name, g.last_name, true
from h, (values ('Billy', 'Vaughn'), ('Simmi', 'So')) as g(first_name, last_name);

with h as (
  insert into public.households (name) values ('The Example Family') returning id
)
insert into public.guests (household_id, first_name, last_name)
select id, g.first_name, g.last_name
from h, (values ('Alex', 'Example'), ('Sam', 'Example')) as g(first_name, last_name);

-- Invite links to turn into QR codes (swap in your real domain):
select name, 'http://localhost:3000/i/' || invite_token as invite_link
from public.households
order by name;

-- If a link gets forwarded around, give that household a new one:
-- update public.households
--   set invite_token = replace(replace(rtrim(encode(extensions.gen_random_bytes(18), 'base64'), '='), '+', '-'), '/', '_')
--   where name = 'The Example Family';
