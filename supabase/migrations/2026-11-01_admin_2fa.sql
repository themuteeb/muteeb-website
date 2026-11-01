-- Admin two-factor login: short-lived email code challenges.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query.
-- Only the server (service-role key) reads or writes this table; RLS blocks everything else.
create table if not exists public.admin_2fa_challenges (
  id          uuid primary key,
  code_hash   text not null,
  attempts    integer not null default 0,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.admin_2fa_challenges enable row level security;
