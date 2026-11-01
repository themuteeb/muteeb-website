import supabase from './db-client.js';
import { setupCors, isAdminRequest, parseBody, sendServerError } from './_security.js';

// One function for visitor analytics (kept to one file: Vercel Hobby allows 12 functions).
//   POST /api/analytics  public: records a page view or heartbeat from one browser tab.
//   GET  /api/analytics  owner only: returns the admin analytics data. Never cached.
const SESSION_ID = /^[a-zA-Z0-9-]{16,64}$/;
const BOT_UA = /bot|crawl|spider|slurp|headless|preview|monitor|lighthouse/i;
const LIVE_WINDOW_MS = 3 * 60 * 1000;
const RECENT_LIMIT = 500;

function clientIp(req) {
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim().slice(0, 64);
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim().slice(0, 64);
  return '';
}

function headerText(req, name) {
  const value = req.headers?.[name];
  if (typeof value !== 'string') return '';
  try {
    return decodeURIComponent(value).slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
}

function deviceOf(ua) {
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function browserOf(ua) {
  if (/edg/i.test(ua)) return 'Edge';
  if (/opr|opera/i.test(ua)) return 'Opera';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

function refererHost(value) {
  if (typeof value !== 'string' || !value) return '';
  try {
    return new URL(value).host.slice(0, 120);
  } catch {
    return '';
  }
}

async function handleTrack(req, res) {
  const { ok, status, error, body } = parseBody(req, 4 * 1024);
  if (!ok) return res.status(status).json({ error });

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  if (!SESSION_ID.test(sessionId)) return res.status(400).json({ error: 'Invalid session' });
  const kind = body.kind === 'ping' ? 'ping' : body.kind === 'view' ? 'view' : null;
  if (!kind) return res.status(400).json({ error: 'Invalid event' });

  const ua = typeof req.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : '';
  // Bots and preview crawlers are not counted as visitors.
  if (BOT_UA.test(ua)) return res.status(204).end();

  const path = typeof body.path === 'string' && body.path.startsWith('/') ? body.path.slice(0, 200) : '/';

  const { error: rpcError } = await supabase.rpc('track_visit', {
    p_session: sessionId,
    p_kind: kind,
    p_path: path,
    p_referrer: refererHost(body.referrer),
    p_ip: clientIp(req),
    p_country: headerText(req, 'x-vercel-ip-country'),
    p_region: headerText(req, 'x-vercel-ip-country-region'),
    p_city: headerText(req, 'x-vercel-ip-city'),
    p_device: deviceOf(ua),
    p_browser: browserOf(ua),
  });
  if (rpcError) console.warn('Visit tracking failed:', rpcError.message);

  return res.status(204).end();
}

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

async function handleReport(req, res) {
  if (!(await isAdminRequest(req))) {
    return res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
  }
  res.setHeader('Cache-Control', 'private, no-store');

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

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'POST') return await handleTrack(req, res);
    if (req.method === 'GET') return await handleReport(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    sendServerError(res, err);
  }
}
