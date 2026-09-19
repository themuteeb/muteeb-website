import { setupCors, isAdminRequest } from './_security.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

/**
 * Owner-only diagnostics for the Supabase connection.
 * (It reports which env vars are configured, so it must not be public.)
 */
export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // diagnostics only — never expose the full URL or project ref
  const urlInfo = {
    urlSet: Boolean(SUPABASE_URL),
    protocol: SUPABASE_URL ? SUPABASE_URL.split('://')[0] : null,
    hostSuffix: SUPABASE_URL.includes('.supabase.co') ? '.supabase.co' : null,
    looksValid: /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL.trim()),
    serviceKeySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    wakeConfigured: Boolean(
      process.env.FULLSTACK_PROJECT_REF && process.env.FULLSTACK_RESTORE_API_URL
    ),
  };

  if (!urlInfo.urlSet) {
    return res.status(200).json({ ok: false, ...urlInfo, restProbe: 'skipped (no url)' });
  }

  try {
    const probe = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/`, {
      method: 'GET',
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '' },
      signal: AbortSignal.timeout(8000),
    });
    return res.status(200).json({
      ok: probe.ok,
      ...urlInfo,
      restProbe: { status: probe.status, statusText: probe.statusText },
    });
  } catch (err) {
    // Keep the raw error out of the public response; owner sees enough.
    return res.status(200).json({
      ok: false,
      ...urlInfo,
      restProbe: { error: 'probe failed', causeCode: err.cause?.code || null },
    });
  }
}
