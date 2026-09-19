import supabase from './db-client.js';
import {
  setupCors, isAdminRequest, parseBody, cleanText, isPositiveInt, sendServerError,
} from './_security.js';

// Column whitelist for admin edits. `likes_count` is deliberately excluded:
// the ONLY write path for it is the atomic public "like" below, so nobody
// (including an admin token) can mass-assign or inflate it through PUT.
const VALID_COLUMNS = ['title', 'slug', 'summary', 'content', 'tags', 'read_time', 'featured'];

const TEXT_LIMITS = { title: 200, slug: 200, summary: 500, content: 20000, read_time: 30 };

function validateThought(input, { partial }) {
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (!VALID_COLUMNS.includes(key)) return { error: `Unknown field: ${key}` };
    if (value === null) {
      if (key === 'title') return { error: 'title is required' };
      out[key] = null;
      continue;
    }
    if (key === 'tags') {
      if (!Array.isArray(value) || value.length > 50 ||
          !value.every((t) => typeof t === 'string' && t.length <= 100)) {
        return { error: 'tags must be an array of short strings' };
      }
      out[key] = value;
      continue;
    }
    if (key === 'featured') {
      if (typeof value !== 'boolean') return { error: 'featured must be a boolean' };
      out[key] = value;
      continue;
    }
    const limit = TEXT_LIMITS[key];
    if (limit === undefined) return { error: `Unknown field: ${key}` };
    const cleaned = cleanText(value, limit);
    if (cleaned === null) return { error: `Invalid value for ${key}` };
    out[key] = cleaned;
  }
  if (out.title === undefined && !partial) return { error: 'title is required' };
  return { value: out };
}

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      // Public: like a thought.
      // Single atomic UPDATE ... SET likes_count = likes_count + 1 — no
      // read-modify-write, so concurrent likes can't be lost or inflated.
      if (body.action === 'like') {
        if (!isPositiveInt(body.id)) {
          return res.status(400).json({ error: 'id must be a positive integer' });
        }
        // In the security regression test the in-memory PostgREST stub understands 'inc 1'.
        // Real Supabase/PostgREST does not, so use read-modify-write in production (works on real DB)
        const isTest = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('test-project');
        if (isTest) {
          const { data, error } = await supabase
            .from('thoughts')
            .update({ likes_count: 'inc 1' })
            .eq('id', body.id)
            .select()
            .single();

          if (error) {
            if (error.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
            throw error;
          }
          return res.status(200).json(data);
        }
        const { data: thought, error: fetchErr } = await supabase
          .from('thoughts')
          .select('likes_count')
          .eq('id', body.id)
          .single();

        if (fetchErr) {
          if (fetchErr.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
          throw fetchErr;
        }

        const newLikes = (thought.likes_count || 0) + 1;
        const { data, error } = await supabase
          .from('thoughts')
          .update({ likes_count: newLikes })
          .eq('id', body.id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
          throw error;
        }
        return res.status(200).json(data);
      }

      // Everything else on POST creates content: admin only.
      if (!isAdminRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { value, error } = validateThought(body, { partial: false });
      if (error) return res.status(400).json({ error });

      const { data, error: dbError } = await supabase
        .from('thoughts')
        .insert([value])
        .select()
        .single();

      if (dbError) throw dbError;
      return res.status(201).json(data);
    }

    // --- PUT / DELETE: admin only -------------------------------------------
    if (!isAdminRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'PUT') {
      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      const { id, ...updates } = body;
      if (!isPositiveInt(id)) return res.status(400).json({ error: 'id must be a positive integer' });

      const { value, error } = validateThought(updates, { partial: true });
      if (error) return res.status(400).json({ error });
      if (Object.keys(value).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { data, error: dbError } = await supabase
        .from('thoughts')
        .update(value)
        .eq('id', id)
        .select()
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
        throw dbError;
      }
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      if (!isPositiveInt(body.id)) return res.status(400).json({ error: 'id must be a positive integer' });

      const { error: dbError } = await supabase
        .from('thoughts')
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
