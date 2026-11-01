import supabase from './db-client.js';
import {
  setupCors, isAdminRequest, parseBody, sendServerError,
} from './_security.js';

// Site-wide controls managed from the admin studio. Stored as jsonb on the
// single profile row (column `site_settings`, see supabase/migrations).
export const PALETTES = ['neon', 'white', 'pink', 'violet', 'mono'];
export const SECTION_KEYS = ['now', 'work', 'stack', 'thoughts', 'guestbook', 'contact'];
const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_SITE_SETTINGS = {
  siteEnabled: true,
  maintenanceMessage: 'The site is being updated. Please check back soon.',
  announcement: '',
  palette: 'neon',
  accentHex: '',
  pageTitle: '',
  metaDescription: '',
  guestbookOpen: true,
  sections: { now: true, work: true, stack: true, thoughts: true, guestbook: true, contact: true },
};

const TOP_KEYS = [
  'siteEnabled', 'maintenanceMessage', 'announcement', 'palette', 'accentHex',
  'pageTitle', 'metaDescription', 'guestbookOpen', 'sections',
];
// Internal bookkeeping stored alongside the settings. Never returned or accepted from clients.
const INTERNAL_KEY = '_sessionEpoch';

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

  const textFields = [
    ['maintenanceMessage', 200],
    ['announcement', 200],
    ['pageTitle', 80],
    ['metaDescription', 200],
  ];
  for (const [key, limit] of textFields) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'string' || input[key].length > limit) {
      return { error: `${key} must be a string of at most ${limit} characters` };
    }
    // Empty is allowed; strip control characters.
    out[key] = input[key].replace(/[\u0000-\u001f\u007f]/g, '').trim();
  }

  if (input.accentHex !== undefined) {
    if (input.accentHex !== '' && (typeof input.accentHex !== 'string' || !HEX_COLOUR.test(input.accentHex))) {
      return { error: 'accentHex must be empty or a #rrggbb colour' };
    }
    out.accentHex = input.accentHex.toLowerCase();
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

/** Public view: only validated settings, never internal bookkeeping. */
function normaliseStored(stored) {
  const { [INTERNAL_KEY]: _ignored, ...settings } = stored && typeof stored === 'object' ? stored : {};
  const result = validateSiteSettings(settings);
  return result.value || DEFAULT_SITE_SETTINGS;
}

async function readProfileRow() {
  const { data, error } = await supabase
    .from('profile')
    .select('id, site_settings')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }

  const isAdmin = await isAdminRequest(req);

  try {
    if (req.method === 'GET') {
      res.setHeader('Vary', 'X-Admin-Auth');
      if (isAdmin || req.headers['x-admin-auth']) {
        res.setHeader('Cache-Control', 'private, no-store');
      } else {
        // Short CDN cache so a maintenance toggle reaches visitors within about a minute.
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
      }

      let data;
      try {
        data = await readProfileRow();
      } catch (err) {
        // If the column is missing or the read fails, keep the site up with defaults.
        console.warn('Settings read fell back to defaults:', err.message);
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

      const existing = await readProfileRow();
      // Keep the session epoch when saving: a settings save must not sign anyone out.
      const stored = { ...value, [INTERNAL_KEY]: existing?.site_settings?.[INTERNAL_KEY] ?? 0 };
      const { error: writeError } = existing
        ? await supabase.from('profile').update({ site_settings: stored }).eq('id', existing.id)
        : await supabase.from('profile').insert([{ site_settings: stored }]);
      if (writeError) throw writeError;

      return res.status(200).json(value);
    }

    if (req.method === 'POST') {
      // Owner-only: { action: 'signOutAll' } revokes every outstanding admin session.
      if (!isAdmin) {
        return res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
      }
      res.setHeader('Cache-Control', 'private, no-store');

      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });
      if (body.action !== 'signOutAll') {
        return res.status(400).json({ error: 'Unknown action' });
      }

      const existing = await readProfileRow();
      const current = existing?.site_settings && typeof existing.site_settings === 'object'
        ? existing.site_settings
        : {};
      const nextEpoch = Date.now();
      const { error: writeError } = existing
        ? await supabase.from('profile').update({ site_settings: { ...current, [INTERNAL_KEY]: nextEpoch } }).eq('id', existing.id)
        : await supabase.from('profile').insert([{ site_settings: { [INTERNAL_KEY]: nextEpoch } }]);
      if (writeError) throw writeError;

      return res.status(200).json({ signedOutAll: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    sendServerError(res, err);
  }
}
