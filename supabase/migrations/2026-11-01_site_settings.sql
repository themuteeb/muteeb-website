-- Site-wide controls (maintenance mode, palette, section visibility, announcement).
-- Run once in Supabase: Dashboard -> SQL Editor -> New query.
alter table public.profile add column if not exists site_settings jsonb;
