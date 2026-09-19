import supabase from './db-client.js';
import {
  setupCors, isAdminRequest, parseBody, cleanText, isValidEmail, isPositiveInt, sendServerError,
} from './_security.js';

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }

  try {
    if (req.method === 'GET') {
      // The inbox contains sender e-mail addresses (PII). It is ONLY
      // readable by the site owner — the public page never loads it.
      if (!isAdminRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      // Public contact form.
      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      const sender_name = cleanText(body.sender_name, 100);
      if (sender_name === null) {
        return res.status(400).json({ error: 'sender_name is required (max 100 chars)' });
      }
      if (!isValidEmail(body.sender_email)) {
        return res.status(400).json({ error: 'sender_email must be a valid e-mail address' });
      }
      const bodyText = cleanText(body.body, 5000);
      if (bodyText === null) {
        return res.status(400).json({ error: 'body is required (max 5000 chars)' });
      }
      const subject = body.subject === undefined
        ? 'Portfolio Contact Inquiry'
        : cleanText(body.subject, 200);
      if (subject === null) {
        return res.status(400).json({ error: 'subject must be at most 200 chars' });
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_name,
          sender_email: body.sender_email.trim(),
          subject,
          body: bodyText,
          read_status: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      // Deleting inbox messages is an owner operation.
      if (!isAdminRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      if (!isPositiveInt(body.id)) {
        return res.status(400).json({ error: 'id must be a positive integer' });
      }

      const { error: dbError } = await supabase
        .from('messages')
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
