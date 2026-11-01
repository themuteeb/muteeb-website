// ============================================================================
// server/_security.js — shared hardening helpers for every /api function
// ----------------------------------------------------------------------------
// muteeb.in is protected in three layers:
//   1. Supabase RLS (enabled, no public policies — the anon key, which the
//      browser holds, can never read or write table data directly)
//   2. These Vercel functions (the only data gateway — service-role key)
//   3. This module: admin auth, CORS allowlist, input validation, safe errors
//
// Rule of the house:
//   • public GETs return only what the public page needs (no PII)
//   • every mutation, every PII read, and every storage write requires
//     admin auth (X-Admin-Auth header matching the ADMIN_PASSWORD env var)
// ============================================================================

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import supabase from './db-client.js';

// ---------------------------------------------------------------- constants ---

/** Max bytes for normal JSON payloads (Vercel caps requests at ~4.5 MB anyway). */
export const MAX_BODY_BYTES = 256 * 1024;

/** Max DECODED image size for /api/upload. Base64 inflates ~4/3, so 3 MB
 *  of binary stays inside Vercel's default 4.5 MB request limit. */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export const ALLOWED_UPLOAD_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

/** Folders the frontend actually uses (see AdminModal + imageUpload.ts). */
export const ALLOWED_UPLOAD_FOLDERS = new Set(['general', 'logo', 'projects']);

/** Guestbook visual options — must mirror the choices rendered on the page. */
export const ALLOWED_AVATAR_COLORS = new Set(['cyan', 'lime', 'rose', 'purple', 'amber']);
export const ALLOWED_BADGES = new Set(['VISITOR', 'DEVELOPER', 'DESIGNER', 'FRIEND']);

// --------------------------------------------------------------- admin auth ---

/**
 * Constant-time string comparison.
 * Both sides are SHA-256 hashed first so the comparison always runs over
 * equal-length digests — no timing oracle on the passcode, no length leak,
 * and non-string inputs simply compare as "not equal" instead of throwing.
 */
export function timingSafeStrEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}

// ------------------------------------------------------------ admin session ---
// After the password AND the emailed 6-digit code are verified (api/auth.js), the
// owner receives a signed session token. The X-Admin-Auth header carries that token.
// The password alone never grants admin API access.
//
// Each token records the session "epoch" that was current when it was issued. The
// epoch is stored in the profile row (site_settings._sessionEpoch). Bumping it signs
// out every outstanding session at once.

const SESSION_PREFIX = 's1';
export const ADMIN_SESSION_HOURS = 8;

function b64urlEncode(text) {
  return Buffer.from(text, 'utf8').toString('base64url');
}

function sessionSignature(secret, payload) {
  return createHmac('sha256', secret).update(`admin-session|${payload}`).digest('hex');
}

/** Current session epoch, or null if it can't be read (callers must then deny). */
export async function getSessionEpoch() {
  const { data, error } = await supabase
    .from('profile')
    .select('site_settings')
    .limit(1)
    .maybeSingle();
  if (error) return null;
  const epoch = Number(data?.site_settings?._sessionEpoch);
  return Number.isFinite(epoch) ? epoch : 0;
}

/** Create a signed admin session token that expires after ADMIN_SESSION_HOURS. */
export function issueSessionToken(secret, epoch, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ADMIN_SESSION_HOURS * 3600;
  const payload = b64urlEncode(JSON.stringify({ exp, ep: epoch }));
  return `${SESSION_PREFIX}.${payload}.${sessionSignature(secret, payload)}`;
}

/** Verify a token: signature (constant time), expiry, and that its epoch is still current. */
export function verifySessionToken(token, secret, currentEpoch, now = Date.now()) {
  if (!secret || typeof token !== 'string' || typeof currentEpoch !== 'number') return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== SESSION_PREFIX) return false;
  const [, payload, signature] = parts;
  if (!timingSafeStrEqual(signature, sessionSignature(secret, payload))) return false;
  try {
    const { exp, ep } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isInteger(exp) && exp > Math.floor(now / 1000) && ep === currentEpoch;
  } catch {
    return false;
  }
}

/**
 * Is this request from the site owner with a valid, unexpired, unrevoked 2FA session?
 * Fails closed when ADMIN_2FA_SECRET is unset or the session epoch can't be read.
 */
export async function isAdminRequest(req) {
  const secret = process.env.ADMIN_2FA_SECRET;
  if (!secret) return false;
  const header = req && req.headers ? req.headers['x-admin-auth'] : undefined;
  if (typeof header !== 'string' || header.length === 0) return false;
  const epoch = await getSessionEpoch();
  if (epoch === null) return false;
  return verifySessionToken(header, secret, epoch);
}

// -------------------------------------------------------------------- CORS ----

const DEFAULT_ALLOWED_ORIGINS = [
  'https://muteeb.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

/**
 * Exact-origin allowlist. We never reflect an arbitrary Origin, so a random
 * site can't use the browser to read our responses (data exfiltration) or
 * replay admin calls. Vercel preview hosts (*.vercel.app) are allowed so
 * preview deployments keep working; extend via CORS_ALLOWED_ORIGINS
 * (comma-separated exact origins).
 */
export function isAllowedOrigin(origin) {
  if (typeof origin !== 'string' || origin.length === 0 || origin.length > 500) return false;
  const o = origin.toLowerCase();
  if (DEFAULT_ALLOWED_ORIGINS.includes(o)) return true;
  if (o.endsWith('.vercel.app')) return true;
  const extra = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(o);
}

/**
 * Set CORS response headers for this request.
 *  – same-origin (no Origin header): nothing needed, returns {}
 *  – allowed origin: echoes that exact origin (never `*`)
 *  – unknown origin: no headers → the browser blocks reading the response
 */
export function corsHeaders(req) {
  const origin = req && req.headers ? req.headers.origin : undefined;
  if (typeof origin !== 'string' || origin.length === 0) return {};
  if (!isAllowedOrigin(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Auth',
  };
}

/** True when the request may proceed (same-origin or allowed cross-origin). */
export function isCorsAllowed(req) {
  const origin = req && req.headers ? req.headers.origin : undefined;
  if (typeof origin !== 'string' || origin.length === 0) return true;
  return isAllowedOrigin(origin);
}

/** Helper used at the top of every handler: sets CORS headers, reports allow. */
/**
 * Public read endpoints: let Vercel's CDN serve the last response instantly
 * (even if the database is slow or waking up), refreshing in the background.
 * Admin responses are never shared-cached.
 */
export function setPublicReadCache(req, res) {
  // Any request carrying the admin header (valid or not) must never be shared-cached.
  // Vary keeps the CDN's cached visitor copy separate from admin requests.
  res.setHeader('Vary', 'X-Admin-Auth');
  if (req && req.headers && req.headers['x-admin-auth']) {
    res.setHeader('Cache-Control', 'private, no-store');
  } else {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600');
  }
}

export function setupCors(req, res) {
  const headers = corsHeaders(req);
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  return isCorsAllowed(req);
}

// ---------------------------------------------------------------- validation ---

/**
 * Trim, strip C0 control chars + DEL, enforce max length.
 * Returns the cleaned string, or null when invalid (non-string / empty / too long).
 */
export function cleanText(value, maxLen) {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (cleaned.length === 0 || cleaned.length > maxLen) return null;
  return cleaned;
}

export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v.length === 0 || v.length > 200 || /\s/.test(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

/** http(s) URLs only — blocks `javascript:`/`data:` injection via link fields. */
export function isSafeUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2000) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

/**
 * Normalize a Vercel serverless req.body into a plain object.
 * Vercel pre-parses JSON bodies; anything else (string body, array, missing)
 * is rejected explicitly. Returns { ok, status, error, body }.
 */
export function parseBody(req, maxBytes = MAX_BODY_BYTES) {
  let body = req ? req.body : undefined;
  if (body === undefined || body === null) {
    return { ok: false, status: 400, error: 'Missing JSON body', body: null };
  }
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > maxBytes) {
      return { ok: false, status: 413, error: 'Payload too large', body: null };
    }
    try {
      body = JSON.parse(body);
    } catch {
      return { ok: false, status: 400, error: 'Invalid JSON body', body: null };
    }
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, status: 400, error: 'Invalid JSON body', body: null };
  }
  return { ok: true, status: 200, error: null, body };
}

// -------------------------------------------------------------- safe errors ---

/**
 * 500s must never echo internals (SQL fragments, Supabase codes, cause
 * chains) back to the client — details go to server logs only.
 */
export function sendServerError(res, err) {
  console.error('API error:', err && (err.stack || err.message || err));
  res.status(500).json({ error: 'Internal server error' });
}

// ------------------------------------------------------------ IP blocklist ---
// Owner-managed list in table `blocked_ips`. Cached per serverless instance for 5 seconds,
// so a block or unblock applies everywhere within about 5 seconds.
const BLOCK_CACHE_MS = 5 * 1000;
let blockCache = { at: 0, ips: new Set() };
let adminIpCache = { at: 0, ips: new Set() };

/** The visitor's IP as set by Vercel's proxy (not spoofable by the client). */
export function getClientIp(req) {
  const realIp = req?.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim().slice(0, 64);
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim().slice(0, 64);
  return '';
}

/** IPv4 or IPv6 literal. Hostnames and ranges are rejected. */
export function isValidIp(value) {
  if (typeof value !== 'string' || value.length > 45) return false;
  const v4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const v6 = /^[0-9a-fA-F:]{2,39}$/;
  return v4.test(value) || (value.includes(':') && v6.test(value));
}

export function invalidateBlockCache() {
  blockCache = { at: 0, ips: new Set() };
  adminIpCache = { at: 0, ips: new Set() };
}

async function loadAdminIps() {
  if (Date.now() - adminIpCache.at < BLOCK_CACHE_MS) return adminIpCache.ips;
  try {
    const { data, error } = await supabase.from('admin_ips').select('ip').limit(500);
    if (error) throw error;
    adminIpCache = { at: Date.now(), ips: new Set((data || []).map((row) => row.ip)) };
  } catch (err) {
    console.warn('Admin IP list unavailable:', err.message);
    adminIpCache = { at: Date.now(), ips: adminIpCache.ips };
  }
  return adminIpCache.ips;
}

/** True when this IP has completed an admin login. Such IPs are never blocked. */
export async function isAdminIp(ip) {
  if (!ip) return false;
  return (await loadAdminIps()).has(ip);
}

/** Record the caller's IP after a successful admin login. */
export async function rememberAdminIp(req) {
  const ip = getClientIp(req);
  if (!ip || !isValidIp(ip)) return;
  try {
    const { error } = await supabase
      .from('admin_ips')
      .upsert([{ ip, last_seen: new Date().toISOString() }], { onConflict: 'ip' });
    if (error) throw error;
    adminIpCache = { at: 0, ips: new Set() };
  } catch (err) {
    console.warn('Could not record admin IP:', err.message);
  }
}

async function loadBlockedIps() {
  if (Date.now() - blockCache.at < BLOCK_CACHE_MS) return blockCache.ips;
  try {
    const { data, error } = await supabase.from('blocked_ips').select('ip').limit(5000);
    if (error) throw error;
    blockCache = { at: Date.now(), ips: new Set((data || []).map((row) => row.ip)) };
  } catch (err) {
    // Fail open: a database hiccup must not take the whole public site down.
    console.warn('Blocklist unavailable, serving request:', err.message);
    blockCache = { at: Date.now(), ips: blockCache.ips };
  }
  return blockCache.ips;
}

/**
 * Returns true (and sends 403) when the visitor's IP is blocked. Admin requests
 * with a valid session are never blocked, so the owner cannot lock themselves out.
 */
export async function denyIfBlocked(req, res) {
  if (await isAdminRequest(req)) return false;
  const ip = getClientIp(req);
  if (!ip) return false;
  // Most visitors are not blocked, so check the blocklist first and only then look at admin IPs.
  const blocked = await loadBlockedIps();
  if (!blocked.has(ip)) return false;
  if (await isAdminIp(ip)) return false;
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(403).json({ error: 'Access from your network is restricted.', blocked: true });
  return true;
}
