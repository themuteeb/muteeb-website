const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

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
    return res.status(200).json({
      ok: false,
      ...urlInfo,
      restProbe: {
        error: err.message,
        causeCode: err.cause?.code || null,
        causeMessage: err.cause?.message || null,
      },
    });
  }
}
