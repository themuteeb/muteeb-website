-- Lock down public (anon key) access.
-- All writes go through the server API using the service-role key, which bypasses RLS,
-- so the browser never needs direct write access.

-- Remove anonymous write access.
drop policy if exists "Public update thoughts likes" on public.thoughts;
drop policy if exists "Public insert guestbook" on public.guestbook;
drop policy if exists "Public insert messages" on public.messages;

-- Visitors may only read approved guestbook entries.
drop policy if exists "Public read guestbook" on public.guestbook;
create policy "Public read approved guestbook" on public.guestbook
  for select to public using (approved = true);

-- Visitors may only read published thoughts.
drop policy if exists "Public read thoughts" on public.thoughts;
create policy "Public read published thoughts" on public.thoughts
  for select to public using (published_at is not null);
