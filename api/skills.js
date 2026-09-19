import supabase from './db-client.js';
import {
  setupCors, isAdminRequest, parseBody, cleanText, isPositiveInt, sendServerError,
} from './_security.js';

const VALID_COLUMNS = ['name', 'category', 'level', 'icon', 'display_order'];

/** Validate a skill payload. Unknown columns are rejected (no mass assignment). */
function validateSkill(input, { partial }) {
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (!VALID_COLUMNS.includes(key)) return { error: `Unknown field: ${key}` };
    if (value === null) {
      if (key === 'name') return { error: 'name is required' };
      out[key] = null;
      continue;
    }
    if (key === 'level') {
      if (!Number.isInteger(value) && !(typeof value === 'string' && value.trim() !== '' && Number.isInteger(Number(value)))) {
        return { error: 'level must be an integer between 0 and 100' };
      }
      const n = Number(value);
      if (n < 0 || n > 100) return { error: 'level must be between 0 and 100' };
      out[key] = n;
      continue;
    }
    if (key === 'display_order') {
      if (!Number.isInteger(value) && !(typeof value === 'string' && value.trim() !== '' && Number.isInteger(Number(value)))) {
        return { error: 'display_order must be an integer' };
      }
      const n = Number(value);
      if (n < 0 || n > 10000) return { error: 'display_order must be between 0 and 10000' };
      out[key] = n;
      continue;
    }
    const cleaned = cleanText(value, 100);
    if (cleaned === null) return { error: `Invalid value for ${key}` };
    out[key] = cleaned;
  }
  if (out.name === undefined && !partial) return { error: 'name is required' };
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
        .from('skills')
        .select('*')
        .order('display_order', { ascending: true });

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

      const { value, error } = validateSkill(body, { partial: false });
      if (error) return res.status(400).json({ error });

      const { data, error: dbError } = await supabase
        .from('skills')
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

      const { value, error } = validateSkill(updates, { partial: true });
      if (error) return res.status(400).json({ error });
      if (Object.keys(value).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { data, error: dbError } = await supabase
        .from('skills')
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
        .from('skills')
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
