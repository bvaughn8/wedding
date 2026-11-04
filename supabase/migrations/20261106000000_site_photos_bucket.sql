-- Private bucket for the site's own photos (Our story page, etc.).
-- Upload files in the Supabase dashboard: Storage → site-photos.
--
-- No storage policies on purpose: guests never read the bucket directly.
-- The server signs short-lived URLs with the secret key (which bypasses RLS)
-- only for signed-in guests, so photos aren't reachable without a sign-in.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-photos',
  'site-photos',
  false,
  10 * 1024 * 1024, -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;
