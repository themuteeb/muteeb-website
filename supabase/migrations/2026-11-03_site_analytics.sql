-- Visitor analytics for the admin portal.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query.
-- Only the server (service-role key) reads or writes these tables.

-- One row per visit (browser tab). Holds the visitor's IP and approximate location.
create table if not exists public.site_sessions (
  session_id  text primary key,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  views       integer not null default 0,
  last_path   text not null default '/',
  referrer    text not null default '',
  ip          text not null default '',
  country     text not null default '',
  region      text not null default '',
  city        text not null default '',
  device      text not null default '',
  browser     text not null default ''
);
create index if not exists site_sessions_last_seen_idx on public.site_sessions (last_seen desc);

-- One row per day (Asia/Kolkata). Keeps all-time, monthly and yearly totals small and permanent.
create table if not exists public.site_daily_stats (
  day     date primary key,
  visits  integer not null default 0,
  views   integer not null default 0
);

alter table public.site_sessions enable row level security;
alter table public.site_daily_stats enable row level security;

-- Records a page view (kind = 'view') or a heartbeat (kind = 'ping').
create or replace function public.track_visit(
  p_session  text,
  p_kind     text,
  p_path     text,
  p_referrer text,
  p_ip       text,
  p_country  text,
  p_region   text,
  p_city     text,
  p_device   text,
  p_browser  text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'Asia/Kolkata')::date;
  v_new boolean := false;
begin
  if p_kind = 'view' then
    insert into site_sessions (session_id, views, last_path, referrer, ip, country, region, city, device, browser)
    values (p_session, 1, p_path, p_referrer, p_ip, p_country, p_region, p_city, p_device, p_browser)
    on conflict (session_id) do update set
      last_seen = now(),
      views = site_sessions.views + 1,
      last_path = excluded.last_path
    returning (xmax = 0) into v_new;

    if v_new then
      insert into site_daily_stats (day, visits, views) values (v_day, 1, 1)
      on conflict (day) do update set
        visits = site_daily_stats.visits + 1,
        views = site_daily_stats.views + 1;
    else
      insert into site_daily_stats (day, visits, views) values (v_day, 0, 1)
      on conflict (day) do update set views = site_daily_stats.views + 1;
    end if;
  else
    update site_sessions set last_seen = now() where session_id = p_session;
  end if;
end;
$$;

-- Only the server (service role) may call the function.
revoke execute on function public.track_visit(text, text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
