import supabase from './db-client.js';
import { setupCors, parseBody } from './_security.js';

// Public visit tracking. Accepts a page view or a heartbeat from one browser tab.
const SESSION_ID = /^[a-zA-Z0-9-]{16,64}$/;
const BOT_UA = /bot|crawl|spider|slurp|headless|preview|monitor|lighthouse/i;

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

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
