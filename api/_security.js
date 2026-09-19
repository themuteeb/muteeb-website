// ============================================================================
// api/_security.js — shared hardening helpers for every /api function
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

import { createHash, timingSafeEqual } from 'node:crypto';

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

/**
 * Is this request from the site owner?
 * Reads ADMIN_PASSWORD lazily (fail closed if unset), requires the
 * X-Admin-Auth header, and compares it in constant time.
 */
export function isAdminRequest(req) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return false;
  const header = req && req.headers ? req.headers['x-admin-auth'] : undefined;
  if (typeof header !== 'string' || header.length === 0) return false;
  return timingSafeStrEqual(header, configured);
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
