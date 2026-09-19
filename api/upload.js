import { createClient } from '@supabase/supabase-js';
import {
  setupCors, isAdminRequest, parseBody, cleanText,
  MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_CONTENT_TYPES, ALLOWED_UPLOAD_FOLDERS, sendServerError,
} from './_security.js';

const storageClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'images';

/**
 * A deletable object path must be exactly what this endpoint writes:
 *  <allowed-folder>/<timestamp>_<sanitized-filename>
 * No leading slashes, no backslashes, no ".." segments, no absolute paths.
 */
function isSafeDeletePath(path) {
  if (typeof path !== 'string' || path.length < 3 || path.length > 300) return false;
  if (path.startsWith('/') || path.includes('\\')) return false;
  const segments = path.split('/');
  if (segments.length !== 2) return false;
  const [folder, file] = segments;
  if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) return false;
  if (file === '' || file === '.' || file === '..') return false;
  return true;
}

export default async function handler(req, res) {
  const corsOk = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(204).end() : res.status(403).end();
  }

  // The upload endpoint writes to a PUBLIC bucket with the service-role key:
  // there is no recovery path for abuse, so it is owner-only.
  if (!isAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'POST') {
      // Base64 inflates ~4/3; allow room for the data: URL prefix.
      const { ok, status, error: bodyError, body } = parseBody(req, MAX_UPLOAD_BYTES * 3);
      if (!ok) return res.status(status).json({ error: bodyError });

      const { fileName, fileType, fileBase64, folder } = body;

      if (typeof fileBase64 !== 'string' || fileBase64.length === 0) {
        return res.status(400).json({ error: 'fileBase64 (string) is required' });
      }

      // Cheap checks first so oversized/invalid payloads die before anything
      // else is processed.
      const base64Data = fileBase64.replace(/^data:.*;base64,/, '');
      if (!/^[A-Za-z0-9+/=\r\n]+$/.test(base64Data)) {
        return res.status(400).json({ error: 'fileBase64 is not valid base64' });
      }
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
        return res.status(413).json({ error: `Image must be at most ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` });
      }

      if (!ALLOWED_UPLOAD_CONTENT_TYPES.has(fileType)) {
        // Public bucket + arbitrary content-type = stored XSS. Images only.
        return res.status(415).json({
          error: 'Only image/png, image/jpeg, image/webp and image/gif are allowed',
        });
      }
      const safeFolder = ALLOWED_UPLOAD_FOLDERS.has(folder) ? folder : null;
      if (safeFolder === null) {
        return res.status(400).json({ error: 'folder must be one of: general, logo, projects' });
      }

      const rawName = cleanText(fileName, 100);
      if (rawName === null) {
        return res.status(400).json({ error: 'fileName must be 1-100 characters' });
      }
      // Take the basename, then scrub to a strict charset.
      const baseName = rawName.split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g, '_');
      if (baseName.length === 0 || baseName === '.' || baseName === '..') {
        return res.status(400).json({ error: 'fileName is not valid' });
      }

      const safeName = `${safeFolder}/${Date.now()}_${baseName.startsWith('.') ? `_${baseName}` : baseName}`;

      const { error } = await storageClient.storage
        .from(BUCKET)
        .upload(safeName, buffer, {
          contentType: fileType,
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = storageClient.storage.from(BUCKET).getPublicUrl(safeName);
      return res.status(200).json({ url: urlData.publicUrl, path: safeName });
    }

    if (req.method === 'DELETE') {
      const { ok, status, error: bodyError, body } = parseBody(req);
      if (!ok) return res.status(status).json({ error: bodyError });

      const { path } = body;
      if (!isSafeDeletePath(path)) {
        return res.status(400).json({ error: 'path is not a valid object path in the images bucket' });
      }

      const { error } = await storageClient.storage.from(BUCKET).remove([path]);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    sendServerError(res, err);
  }
}
