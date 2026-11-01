-- IP blocklist managed from the admin portal (ANALYTICS tab).
-- Run once in Supabase: Dashboard -> SQL Editor -> New query.
-- Only the server (service-role key) reads or writes this table.
create table if not exists public.blocked_ips (
  ip          text primary key,
  reason      text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.blocked_ips enable row level security;
