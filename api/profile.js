import supabase from './db-client.js';
import {
  setupCors, isAdminRequest, parseBody, cleanText, sendServerError,
} from './_security.js';

// Column whitelist for owner updates. `admin_passcode` is deliberately NOT
// here: it can never be read back (stripped below) and never written via API.
const VALID_COLUMNS = [
  'full_name', 'title', 'bio', 'status_badge', 'location',
  'available_for_work', 'accent_color', 'email',
  'instagram_handle', 'logo_url',
  'github_url', 'twitter_url', 'linkedin_url',
  'typewriter_roles', 'now_focus', 'quick_facts',
  'headline', 'sound_enabled',
];

const TEXT_LIMITS = {
  full_name: 100, title: 200, bio: 2000, status_badge: 60, location: 100,
  accent_color: 60, email: 200, instagram_handle: 100, logo_url: 2000,
  github_url: 2000, twitter_url: 2000, linkedin_url: 2000, headline: 200,
};

function validateProfilePayload(payload) {
  const out = {};
  for (const key of VALID_COLUMNS) {
    if (payload[key] === undefined) continue;
    const value = payload[key];

    if (key === 'available_for_work' || key === 'sound_enabled') {
      if (typeof value !== 'boolean') return { error: `${key} must be a boolean` };
      out[key] = value;
      continue;
    }

    if (key === 'typewriter_roles' || key === 'quick_facts') {
      if (!Array.isArray(value) || value.length > 50 ||
          !value.every((x) => typeof x === 'string' && x.length <= 200)) {
        return { error: `${key} must be an array of short strings` };
      }
      out[key] = value;
      continue;
    }

    if (key === 'now_focus') {
      if (!Array.isArray(value) || value.length > 50 ||
          !value.every((x) =>
            x && typeof x === 'object' &&
            typeof x.title === 'string' && x.title.length > 0 && x.title.length <= 200 &&
            typeof x.desc === 'string' && x.desc.length <= 500)) {
        return { error: 'now_focus must be an array of { title, desc }' };
      }
      out[key] = value;
      continue;
    }

    // Everything else is a capped text field.
    const limit = TEXT_LIMITS[key] || 2000;
    const cleaned = cleanText(value, limit);
    if (cleaned === null) return { error: `Invalid value for ${key}` };
    out[key] = cleaned;
  }
  return { value: out };
}

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }

  const isAdmin = isAdminRequest(req);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // NEVER expose the admin passcode, to anyone.
        delete data.admin_passcode;

        if (!isAdmin) {
          delete data.email;
          delete data.created_at;
          delete data.updated_at;
        }
      }

      // Return a verification flag when the owner authenticated.
      if (isAdmin) {
        return res.status(200).json({ ...(data || {}), __admin_verified: true });
      }

      return res.status(200).json(data || null);
    }

    if (req.method === 'PUT') {
      // Require owner auth for any updates.
      if (!isAdmin) {
        return res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
      }

      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      const { value, error } = validateProfilePayload(body);
      if (error) return res.status(400).json({ error });
      if (Object.keys(value).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { data: existing } = await supabase
        .from('profile')
        .select('id')
        .limit(1)
        .maybeSingle();

      let result;
      if (existing) {
        const { data, error: dbError } = await supabase
          .from('profile')
          .update(value)
          .eq('id', existing.id)
          .select()
          .single();

        if (dbError) {
          console.warn('Profile update warning:', dbError.message);
          result = { ...existing, ...value };
        } else {
          result = data;
        }
      } else {
        const { data, error: dbError } = await supabase
          .from('profile')
          .insert([value])
          .select()
          .single();

        if (dbError) {
          result = { ...value };
        } else {
          result = data;
        }
      }

      if (result) {
        delete result.admin_passcode;
      }

      return res.status(200).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    sendServerError(res, err);
  }
}
