import { createHmac } from 'node:crypto';
import supabase from './db-client.js';
import {
  setupCors, isAdminRequest, parseBody, cleanText, isPositiveInt,
  ALLOWED_AVATAR_COLORS, ALLOWED_BADGES, sendServerError,
} from './_security.js';

const GUESTBOOK_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const RATE_LIMIT_TOMBSTONE_NAME = '__GUESTBOOK_RATE_LIMIT__';
const COOLDOWN_MESSAGE = 'Your message is already awaiting for approval, try again later.';

// Store only a keyed, truncated digest of an IP or browser identity in the
// legacy handle column. The service-role key prevents offline reversal.
function getRateLimitHandle(req, body) {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const realIp = req.headers?.['x-real-ip'];
  const rawIp = typeof realIp === 'string' && realIp.trim()
    ? realIp.trim()
    : typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0].trim()
      : '';
  const browserId = typeof body.browserId === 'string' && /^[a-zA-Z0-9-]{16,64}$/.test(body.browserId)
    ? body.browserId
    : '';
  const identity = rawIp ? `ip:${rawIp}` : browserId ? `browser:${browserId}` : '';
  if (!identity) return null;

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'guestbook-rate-limit';
  const digest = createHmac('sha256', secret).update(identity).digest('hex').slice(0, 32);
  return `rl:${digest}`;
}

// The database keeps a legacy handle column, but guestbook handles are no longer
// collected or exposed. Project only the public guestbook fields on every response.
function withoutHandle(entry) {
  return {
    id: entry.id,
    name: entry.name,
    message: entry.message,
    avatar_color: entry.avatar_color,
    badge: entry.badge,
    approved: entry.approved,
    created_at: entry.created_at,
  };
}

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }

  const isAdmin = isAdminRequest(req);

  try {
    if (req.method === 'GET') {
      let query = supabase.from('guestbook').select('*').order('created_at', { ascending: false });

      // Public users only see approved entries; the owner sees all (incl. pending).
      if (!isAdmin) {
        query = query.eq('approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      const visibleEntries = (data || []).filter((entry) => entry.name !== RATE_LIMIT_TOMBSTONE_NAME);
      return res.status(200).json(visibleEntries.map(withoutHandle));
    }

    if (req.method === 'POST') {
      // Public sign-the-guestbook form. Everything is validated and
      // whitelisted server-side (the client's sanitizeInput is not trusted).
      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      const name = cleanText(body.name, 40);
      if (name === null) {
        return res.status(400).json({ error: 'name is required (max 40 chars)' });
      }
      if (name === RATE_LIMIT_TOMBSTONE_NAME) {
        return res.status(400).json({ error: 'name is reserved' });
      }
      const message = cleanText(body.message, 20);
      if (message === null) {
        return res.status(400).json({ error: 'message is required (max 20 chars)' });
      }

      const rateLimitHandle = getRateLimitHandle(req, body);
      if (!rateLimitHandle) {
        return res.status(503).json({ error: 'Unable to verify submission cooldown. Please try again later.' });
      }

      const { data: previousEntries, error: rateLimitError } = await supabase
        .from('guestbook')
        .select('id, created_at, name')
        .eq('handle', rateLimitHandle)
        .order('created_at', { ascending: false })
        .limit(1);

      if (rateLimitError) throw rateLimitError;
      const previousTime = Date.parse(previousEntries?.[0]?.created_at || '');
      const retryAfterMs = GUESTBOOK_COOLDOWN_MS - (Date.now() - previousTime);
      if (Number.isFinite(previousTime) && retryAfterMs > 0) {
        return res.status(429).json({
          error: COOLDOWN_MESSAGE,
          retryAfterMs,
        });
      }
      if (previousEntries?.[0]?.name === RATE_LIMIT_TOMBSTONE_NAME) {
        const { error: cleanupError } = await supabase
          .from('guestbook')
          .delete()
          .eq('id', previousEntries[0].id);
        if (cleanupError) throw cleanupError;
      }

      // Identity digest is stored only in the legacy handle column, which is
      // omitted from every API response. A persistent browser ID is the fallback
      // when the hosting proxy does not provide a client IP.
      const handle = rateLimitHandle;

      // Visual fields are a closed set — anything else falls back to a safe
      // default so the page never renders attacker-chosen classes/labels.
      const avatar_color = ALLOWED_AVATAR_COLORS.has(body.avatar_color) ? body.avatar_color : 'cyan';
      const badge = ALLOWED_BADGES.has(body.badge) ? body.badge : 'VISITOR';

      const { data, error } = await supabase
        .from('guestbook')
        .insert([{
          name,
          handle,
          message,
          avatar_color,
          badge,
          approved: false, // always starts in moderation
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(withoutHandle(data));
    }

    if (req.method === 'PUT') {
      // Only the owner can approve/reject.
      if (!isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      if (!isPositiveInt(body.id)) {
        return res.status(400).json({ error: 'id must be a positive integer' });
      }
      if (typeof body.approved !== 'boolean') {
        return res.status(400).json({ error: 'approved must be a boolean' });
      }

      const { data, error } = await supabase
        .from('guestbook')
        .update({ approved: body.approved })
        .eq('id', body.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
        throw error;
      }
      return res.status(200).json(withoutHandle(data));
    }

    if (req.method === 'DELETE') {
      // Only the owner can delete.
      if (!isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      if (!isPositiveInt(body.id)) {
        return res.status(400).json({ error: 'id must be a positive integer' });
      }

      const { data: entry, error: lookupError } = await supabase
        .from('guestbook')
        .select('id, handle, created_at')
        .eq('id', body.id)
        .single();

      if (lookupError) {
        if (lookupError.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
        throw lookupError;
      }

      const createdAt = Date.parse(entry.created_at || '');
      const preserveCooldown = typeof entry.handle === 'string'
        && entry.handle.startsWith('rl:')
        && Number.isFinite(createdAt)
        && Date.now() - createdAt < GUESTBOOK_COOLDOWN_MS;

      if (preserveCooldown) {
        const { error: updateError } = await supabase
          .from('guestbook')
          .update({
            name: RATE_LIMIT_TOMBSTONE_NAME,
            message: '',
            avatar_color: 'cyan',
            badge: 'VISITOR',
            approved: false,
          })
          .eq('id', body.id);
        if (updateError) throw updateError;
      } else {
        const { error: deleteError } = await supabase
          .from('guestbook')
          .delete()
          .eq('id', body.id);
        if (deleteError) throw deleteError;
      }

      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    sendServerError(res, err);
  }
}
