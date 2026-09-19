import supabase from './db-client.js';
import {
  setupCors, isAdminRequest, parseBody, cleanText, isPositiveInt,
  ALLOWED_AVATAR_COLORS, ALLOWED_BADGES, sendServerError,
} from './_security.js';

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
      return res.status(200).json(data || []);
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
      const message = cleanText(body.message, 300);
      if (message === null) {
        return res.status(400).json({ error: 'message is required (max 300 chars)' });
      }
      const handle = cleanText(body.handle, 30) || '@guest';

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
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
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
      return res.status(200).json(data);
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

      const { error: dbError } = await supabase
        .from('guestbook')
        .delete()
        .eq('id', body.id);

      if (dbError) throw dbError;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    sendServerError(res, err);
  }
}
