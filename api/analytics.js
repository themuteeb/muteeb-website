import supabase from '../server/db-client.js';
import {
  setupCors, isAdminRequest, parseBody, sendServerError, denyIfBlocked,
  getClientIp, isValidIp, invalidateBlockCache, cleanText, isAdminIp,
} from '../server/_security.js';

// One function for visitor analytics and the IP blocklist (kept to one file: Vercel Hobby allows 12 functions).
//   POST   /api/analytics  public: records a page view or heartbeat from one browser tab.
//   GET    /api/analytics  owner only: returns the admin analytics data and blocked IPs.
//   PUT    /api/analytics  owner only: block an IP  { ip, reason }.
//   DELETE /api/analytics  owner only: unblock an IP { ip }.
const SESSION_ID = /^[a-zA-Z0-9-]{16,64}$/;
const BOT_UA = /bot|crawl|spider|slurp|headless|preview|monitor|lighthouse/i;
const LIVE_WINDOW_MS = 3 * 60 * 1000;
const RECENT_LIMIT = 500;

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
    p_ip: getClientIp(req),
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
    const [dailyRes, sessionsRes, blockedRes] = await Promise.all([
      supabase.from('site_daily_stats').select('day, visits, views').order('day', { ascending: false }),
      supabase.from('blocked_ips').select('ip, reason, created_at').order('created_at', { ascending: false }).limit(500),
      supabase
        .from('site_sessions')
        .select('session_id, first_seen, last_seen, views, last_path, referrer, ip, country, region, city, device, browser')
        .order('last_seen', { ascending: false })
        .limit(RECENT_LIMIT),
    ]);
    if (dailyRes.error) throw dailyRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (blockedRes.error) throw blockedRes.error;

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
      blockedIps: blockedRes.data || [],
    });
  } catch (err) {
    sendServerError(res, err);
  }
}

// Owner-only blocklist actions. The owner's own IP can never be blocked here.
async function handleBlock(req, res) {
  if (!(await isAdminRequest(req))) {
    return res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
  }
  res.setHeader('Cache-Control', 'private, no-store');
  const { ok, status, error, body } = parseBody(req);
  if (!ok) return res.status(status).json({ error });

  const ip = typeof body.ip === 'string' ? body.ip.trim() : '';
  if (!isValidIp(ip)) return res.status(400).json({ error: 'Enter a valid IPv4 or IPv6 address.' });

  try {
    if (req.method === 'PUT') {
      if (ip === getClientIp(req)) {
        return res.status(400).json({ error: 'You cannot block the IP address you are using now.' });
      }
      if (await isAdminIp(ip)) {
        return res.status(400).json({ error: 'This IP has logged into the admin panel, so it cannot be blocked.' });
      }
      const reason = cleanText(body.reason ?? '', 120) || '';
      const { error: writeError } = await supabase
        .from('blocked_ips')
        .upsert([{ ip, reason }], { onConflict: 'ip' });
      if (writeError) throw writeError;
    } else {
      const { error: deleteError } = await supabase.from('blocked_ips').delete().eq('ip', ip);
      if (deleteError) throw deleteError;
    }
    invalidateBlockCache();
    return res.status(200).json({ ip, blocked: req.method === 'PUT' });
  } catch (err) {
    sendServerError(res, err);
  }
}

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }
  if (await denyIfBlocked(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'POST') return await handleTrack(req, res);
    if (req.method === 'GET') return await handleReport(req, res);
    if (req.method === 'PUT' || req.method === 'DELETE') return await handleBlock(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    sendServerError(res, err);
  }
}
