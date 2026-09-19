import supabase from './db-client.js';
import {
  setupCors, isAdminRequest, parseBody, cleanText, isSafeUrl, isPositiveInt, sendServerError,
} from './_security.js';

const COLUMN_LIMITS = {
  title: 200,
  slug: 200,
  subtitle: 200,
  description: 5000,
  category: 60,
  image_url: 2000,
  live_url: 2000,
  github_url: 2000,
};

const VALID_COLUMNS = [
  'title', 'slug', 'subtitle', 'description', 'category', 'tags',
  'image_url', 'live_url', 'github_url', 'metrics', 'featured', 'display_order',
];

/**
 * Validate a project payload against the table's columns.
 * Rejects unknown columns (no mass assignment), enforces type/length caps,
 * and requires http(s) URLs on the link fields (no javascript: payloads).
 */
function validateProject(input, { partial }) {
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
    if (key === 'metrics') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { error: 'metrics must be an object' };
      }
      out[key] = value;
      continue;
    }
    if (key === 'featured') {
      if (typeof value !== 'boolean') return { error: 'featured must be a boolean' };
      out[key] = value;
      continue;
    }
    if (key === 'display_order') {
      if (!Number.isInteger(value) || value < 0 || value > 10000) {
        return { error: 'display_order must be an integer' };
      }
      out[key] = value;
      continue;
    }
    const limit = COLUMN_LIMITS[key];
    if (limit === undefined) return { error: `Unknown field: ${key}` };
    const cleaned = cleanText(value, limit);
    if (cleaned === null) return { error: `Invalid value for ${key}` };
    if ((key === 'live_url' || key === 'github_url' || key === 'image_url') &&
        !isSafeUrl(cleaned)) {
      return { error: `${key} must be an http(s) URL` };
    }
    out[key] = cleaned;
  }
  if (out.title === undefined) {
    if (partial) return { value: out };
    return { error: 'title is required' };
  }
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
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // --- everything below mutates data: admin only --------------------------
    if (!isAdminRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      const { value, error } = validateProject(body, { partial: false });
      if (error) return res.status(400).json({ error });

      const { data, error: dbError } = await supabase
        .from('projects')
        .insert([value])
        .select()
        .single();

      if (dbError) throw dbError;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      const { id, ...updates } = body;
      if (!isPositiveInt(id)) return res.status(400).json({ error: 'id must be a positive integer' });

      const { value, error } = validateProject(updates, { partial: true });
      if (error) return res.status(400).json({ error });
      if (Object.keys(value).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { data, error: dbError } = await supabase
        .from('projects')
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
        .from('projects')
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
