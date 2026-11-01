-- IPs that have completed an admin login. These are never blocked.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query.
-- Only the server (service-role key) reads or writes this table.
create table if not exists public.admin_ips (
  ip         text primary key,
  last_seen  timestamptz not null default now()
);

alter table public.admin_ips enable row level security;
