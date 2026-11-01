import supabase from './db-client.js';
import { setupCors, isAdminRequest, sendServerError } from './_security.js';

// Owner-only analytics for the admin portal. Never cached.
const LIVE_WINDOW_MS = 3 * 60 * 1000;
const RECENT_LIMIT = 500;

function monthKey(day) {
  return day.slice(0, 7);
}

function yearKey(day) {
  return day.slice(0, 4);
}

function groupTotals(rows, keyOf) {
  const map = new Map();
  for (const row of rows) {
    const key = keyOf(row.day);
    const entry = map.get(key) || { key, visits: 0, views: 0 };
    entry.visits += row.visits;
    entry.views += row.views;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await isAdminRequest(req))) {
    return res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
  }

  try {
    const [dailyRes, sessionsRes] = await Promise.all([
      supabase.from('site_daily_stats').select('day, visits, views').order('day', { ascending: false }),
      supabase
        .from('site_sessions')
        .select('session_id, first_seen, last_seen, views, last_path, referrer, ip, country, region, city, device, browser')
        .order('last_seen', { ascending: false })
        .limit(RECENT_LIMIT),
    ]);
    if (dailyRes.error) throw dailyRes.error;
    if (sessionsRes.error) throw sessionsRes.error;

    const daily = dailyRes.data || [];
    const sessions = sessionsRes.data || [];
    const now = Date.now();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    const live = sessions.filter((s) => now - new Date(s.last_seen).getTime() <= LIVE_WINDOW_MS);
    const todayRow = daily.find((d) => d.day === today);

    return res.status(200).json({
      generatedAt: new Date(now).toISOString(),
      liveUsers: live.length,
      liveVisitors: live,
      today: { visits: todayRow?.visits || 0, views: todayRow?.views || 0 },
      totals: daily.reduce(
        (acc, d) => ({ visits: acc.visits + d.visits, views: acc.views + d.views }),
        { visits: 0, views: 0 },
      ),
      monthly: groupTotals(daily, monthKey).slice(0, 24),
      yearly: groupTotals(daily, yearKey),
      recentVisitors: sessions,
    });
  } catch (err) {
    sendServerError(res, err);
  }
}
