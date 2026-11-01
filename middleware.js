// Vercel Edge Middleware: refuses blocked IPs before any page or file is served.
// The owner's blocklist lives in Supabase (blocked_ips). IPs that completed an admin
// login (admin_ips) are never refused. If the blocklist cannot be read, requests pass
// through (fail open), so a database problem cannot take the whole site down.

const CACHE_MS = 5 * 1000;
let cache = { at: 0, blocked: new Set(), admins: new Set() };

const RESTRICTED_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex"><meta name="theme-color" content="#0a0a0a">
<title>Access restricted</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0a0a0a;color:#f5f5f5;font-family:'JetBrains Mono',ui-monospace,monospace">
<div style="max-width:420px;width:100%;text-align:center;border-radius:24px;padding:32px;border:1px solid rgba(235,255,246,0.23);background:linear-gradient(145deg,rgba(255,255,255,0.15),rgba(255,255,255,0.045) 42%,rgba(255,255,255,0.015)),rgba(8,14,18,0.42);box-shadow:0 24px 72px -34px rgba(0,0,0,0.88),inset 0 1px 0 rgba(255,255,255,0.24)">
<div style="font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#22d3ee">// access restricted</div>
<p style="margin:16px 0 0;font-family:'Sora',system-ui,sans-serif;font-size:14px;line-height:1.6;color:#b8b8b8">Access to this site from your network has been restricted by the site owner.</p>
</div>
</body></html>`;

async function fetchIps(table) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('Supabase environment variables are missing');
  const res = await fetch(`${base}/rest/v1/${table}?select=ip&limit=5000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${table} returned ${res.status}`);
  const rows = await res.json();
  return new Set(rows.map((row) => row.ip));
}

async function currentLists() {
  if (Date.now() - cache.at < CACHE_MS) return cache;
  try {
    const [blocked, admins] = await Promise.all([fetchIps('blocked_ips'), fetchIps('admin_ips')]);
    cache = { at: Date.now(), blocked, admins };
  } catch (err) {
    console.warn('Blocklist unavailable, serving request:', err.message);
    cache = { at: Date.now(), blocked: cache.blocked, admins: cache.admins };
  }
  return cache;
}

function clientIp(request) {
  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim().slice(0, 64);
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim().slice(0, 64) : '';
}

export default async function middleware(request) {
  const ip = clientIp(request);
  if (!ip) return undefined;
  const lists = await currentLists();
  if (!lists.blocked.has(ip) || lists.admins.has(ip)) return undefined;
  return new Response(RESTRICTED_PAGE, {
    status: 403,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

export const config = {
  matcher: '/((?!_vercel/).*)',
};
