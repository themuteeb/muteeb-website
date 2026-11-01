import supabase from './db-client.js';
import {
  setupCors, isAdminRequest, parseBody, sendServerError,
} from './_security.js';

// Site-wide controls managed from the admin studio. Stored as jsonb on the
// single profile row (column `site_settings`, see supabase/migrations).
export const PALETTES = ['neon', 'white', 'pink', 'violet', 'mono'];
export const SECTION_KEYS = ['now', 'work', 'stack', 'thoughts', 'guestbook', 'contact'];

export const DEFAULT_SITE_SETTINGS = {
  siteEnabled: true,
  maintenanceMessage: 'The site is being updated. Please check back soon.',
  announcement: '',
  palette: 'neon',
  guestbookOpen: true,
  sections: { now: true, work: true, stack: true, thoughts: true, guestbook: true, contact: true },
};

const TOP_KEYS = ['siteEnabled', 'maintenanceMessage', 'announcement', 'palette', 'guestbookOpen', 'sections'];

/**
 * Strict validation. Unknown keys and wrong types are rejected, never coerced.
 * Returns { value } with a complete, normalised settings object, or { error }.
 */
export function validateSiteSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Settings must be an object' };
  }
  for (const key of Object.keys(input)) {
    if (!TOP_KEYS.includes(key)) return { error: `Unknown setting: ${key}` };
  }

  const out = { ...DEFAULT_SITE_SETTINGS, sections: { ...DEFAULT_SITE_SETTINGS.sections } };

  for (const key of ['siteEnabled', 'guestbookOpen']) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'boolean') return { error: `${key} must be a boolean` };
    out[key] = input[key];
  }

  for (const [key, limit] of [['maintenanceMessage', 200], ['announcement', 200]]) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'string' || input[key].length > limit) {
      return { error: `${key} must be a string of at most ${limit} characters` };
    }
    // Empty is allowed (hides the announcement); strip control characters.
    out[key] = input[key].replace(/[\u0000-\u001f\u007f]/g, '').trim();
  }

  if (input.palette !== undefined) {
    if (!PALETTES.includes(input.palette)) return { error: 'palette is not a supported colour preset' };
    out.palette = input.palette;
  }

  if (input.sections !== undefined) {
    const s = input.sections;
    if (!s || typeof s !== 'object' || Array.isArray(s)) return { error: 'sections must be an object' };
    for (const key of Object.keys(s)) {
      if (!SECTION_KEYS.includes(key)) return { error: `Unknown section: ${key}` };
      if (typeof s[key] !== 'boolean') return { error: `sections.${key} must be a boolean` };
      out.sections[key] = s[key];
    }
  }

  return { value: out };
}

/** Merge a stored value over the defaults, dropping anything that no longer validates. */
function normaliseStored(stored) {
  const result = validateSiteSettings(stored && typeof stored === 'object' ? stored : {});
  return result.value || DEFAULT_SITE_SETTINGS;
}

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }

  const isAdmin = isAdminRequest(req);

  try {
    if (req.method === 'GET') {
      if (isAdmin) {
        res.setHeader('Cache-Control', 'private, no-store');
      } else {
        // Short CDN cache so a maintenance toggle reaches visitors within about a minute.
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
      }

      const { data, error } = await supabase
        .from('profile')
        .select('site_settings')
        .limit(1)
        .maybeSingle();

      // If the column is missing or the read fails, keep the site up with defaults.
      if (error) {
        console.warn('Settings read fell back to defaults:', error.message);
        return res.status(200).json(DEFAULT_SITE_SETTINGS);
      }
      return res.status(200).json(normaliseStored(data?.site_settings));
    }

    if (req.method === 'PUT') {
      if (!isAdmin) {
        return res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
      }
      res.setHeader('Cache-Control', 'private, no-store');

      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      const { value, error } = validateSiteSettings(body);
      if (error) return res.status(400).json({ error });

      const { data: existing, error: readError } = await supabase
        .from('profile')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (readError) throw readError;

      const { error: writeError } = existing
        ? await supabase.from('profile').update({ site_settings: value }).eq('id', existing.id)
        : await supabase.from('profile').insert([{ site_settings: value }]);
      if (writeError) throw writeError;

      return res.status(200).json(value);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    sendServerError(res, err);
  }
}

