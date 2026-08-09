import { createClient } from '@supabase/supabase-js';

const storageClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { fileName, fileType, fileBase64, folder = 'general' } = req.body;

      if (!fileName || !fileType || !fileBase64) {
        return res.status(400).json({ error: 'fileName, fileType and fileBase64 are required' });
      }

      const base64Data = fileBase64.replace(/^data:.*;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const safeName = `${folder}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      const { error } = await storageClient.storage
        .from('images')
        .upload(safeName, buffer, {
          contentType: fileType,
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = storageClient.storage
        .from('images')
        .getPublicUrl(safeName);

      return res.status(200).json({ url: urlData.publicUrl, path: safeName });
    }

    if (req.method === 'DELETE') {
      const { path } = req.body;
      if (!path) return res.status(400).json({ error: 'path is required' });

      const { error } = await storageClient.storage
        .from('images')
        .remove([path]);

      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Upload API error:', err);
    res.status(500).json({ error: err.message });
  }
}
