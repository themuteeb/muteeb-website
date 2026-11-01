import { createHmac, randomInt, randomUUID } from 'node:crypto';
import supabase from '../server/db-client.js';
import {
  setupCors, parseBody, sendServerError, timingSafeStrEqual, issueSessionToken, getSessionEpoch,
  rememberAdminIp,
} from '../server/_security.js';

// Two-step owner login:
//   1. { action: 'start', passcode }            -> emails a 6-digit code, returns a challenge id
//   2. { action: 'verify', challengeId, code }  -> returns a signed admin session token
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 3;
const MAX_STARTS_PER_WINDOW = 5;
const START_WINDOW_MS = 15 * 60 * 1000;
// Server-side throttle on wrong passwords (the browser lockout alone is easy to bypass).
const MAX_FAILED_PASSWORDS = 10;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function codeHash(secret, challengeId, code) {
  return createHmac('sha256', secret).update(`${challengeId}:${code}`).digest('hex');
}

function maskEmail(email) {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 1)}***@${domain}`;
}

function isConfigured() {
  return Boolean(
    process.env.ADMIN_PASSWORD &&
    process.env.ADMIN_2FA_SECRET &&
    process.env.RESEND_API_KEY &&
    process.env.ADMIN_2FA_EMAIL &&
    process.env.ADMIN_2FA_FROM
  );
}

async function sendCodeEmail(code) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ADMIN_2FA_FROM,
      to: [process.env.ADMIN_2FA_EMAIL],
      subject: 'Your admin login code',
      text: `Your muteeb.in admin login code is ${code}. It expires in 10 minutes.\n\nIf you did not try to log in, change ADMIN_PASSWORD in Vercel right away.`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  return response.ok;
}

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Two-factor login is not configured on the server.' });
  }

  const { ok, status, error: bodyError, body } = parseBody(req);
  if (!ok) return res.status(status).json({ error: bodyError });

  const secret = process.env.ADMIN_2FA_SECRET;

  try {
    if (body.action === 'start') {
      const since = new Date(Date.now() - START_WINDOW_MS).toISOString();
      const { count: failCount, error: failReadError } = await supabase
        .from('admin_login_failures')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since);
      if (failReadError) throw failReadError;
      if ((failCount || 0) >= MAX_FAILED_PASSWORDS) {
        return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
      }

      const passcode = typeof body.passcode === 'string' ? body.passcode.trim() : '';
      if (!passcode || !timingSafeStrEqual(passcode, process.env.ADMIN_PASSWORD)) {
        const { error: failInsertError } = await supabase.from('admin_login_failures').insert([{}]);
        if (failInsertError) throw failInsertError;
        return res.status(401).json({ error: 'Incorrect password' });
      }

      // Limit how many login codes can be requested, so inboxes can't be flooded.
      const { count, error: countError } = await supabase
        .from('admin_2fa_challenges')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since);
      if (countError) throw countError;
      if ((count || 0) >= MAX_STARTS_PER_WINDOW) {
        return res.status(429).json({ error: 'Too many login codes requested. Try again in 15 minutes.' });
      }

      const challengeId = randomUUID();
      const code = String(randomInt(0, 1000000)).padStart(6, '0');
      const { error: insertError } = await supabase.from('admin_2fa_challenges').insert([{
        id: challengeId,
        code_hash: codeHash(secret, challengeId, code),
        attempts: 0,
        expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      }]);
      if (insertError) throw insertError;

      const sent = await sendCodeEmail(code);
      if (!sent) {
        await supabase.from('admin_2fa_challenges').delete().eq('id', challengeId);
        return res.status(502).json({ error: 'Could not send the login code. Try again shortly.' });
      }

      return res.status(200).json({
        challengeId,
        sentTo: maskEmail(process.env.ADMIN_2FA_EMAIL),
        expiresInMinutes: CODE_TTL_MS / 60000,
      });
    }

    if (body.action === 'verify') {
      const challengeId = typeof body.challengeId === 'string' ? body.challengeId : '';
      const code = typeof body.code === 'string' ? body.code.trim() : '';
      if (!UUID_RE.test(challengeId) || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: 'Enter the 6-digit code from your email.' });
      }

      const { data: row, error: readError } = await supabase
        .from('admin_2fa_challenges')
        .select('id, code_hash, attempts, expires_at')
        .eq('id', challengeId)
        .maybeSingle();
      if (readError) throw readError;

      if (!row || Date.parse(row.expires_at) < Date.now()) {
        if (row) await supabase.from('admin_2fa_challenges').delete().eq('id', challengeId);
        return res.status(401).json({ error: 'This code has expired. Log in again to get a new one.' });
      }
      if (row.attempts >= MAX_CODE_ATTEMPTS) {
        await supabase.from('admin_2fa_challenges').delete().eq('id', challengeId);
        return res.status(401).json({ error: 'Too many wrong codes. Log in again to get a new one.' });
      }

      if (!timingSafeStrEqual(codeHash(secret, challengeId, code), row.code_hash)) {
        const attempts = row.attempts + 1;
        if (attempts >= MAX_CODE_ATTEMPTS) {
          await supabase.from('admin_2fa_challenges').delete().eq('id', challengeId);
          return res.status(401).json({ error: 'Too many wrong codes. Log in again to get a new one.' });
        }
        await supabase.from('admin_2fa_challenges').update({ attempts }).eq('id', challengeId);
        return res.status(401).json({
          error: `Incorrect code. ${MAX_CODE_ATTEMPTS - attempts} attempt(s) left.`,
        });
      }

      // Single use: only the request that actually deletes the row gets a session.
      const { data: consumed, error: consumeError } = await supabase
        .from('admin_2fa_challenges')
        .delete()
        .eq('id', challengeId)
        .select('id');
      if (consumeError) throw consumeError;
      if (!consumed || consumed.length !== 1) {
        return res.status(401).json({ error: 'This code has already been used. Log in again.' });
      }

      const epoch = await getSessionEpoch();
      if (epoch === null) throw new Error('session epoch unavailable');
      await rememberAdminIp(req);
      return res.status(200).json({ token: issueSessionToken(secret, epoch) });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    sendServerError(res, err);
  }
}
