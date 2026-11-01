-- Server-side throttle for wrong admin passwords.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query.
-- Only the server (service-role key) reads or writes this table.
create table if not exists public.admin_login_failures (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now()
);

alter table public.admin_login_failures enable row level security;
