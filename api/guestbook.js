import supabase from './db-client.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Auth');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const adminHeader = req.headers['x-admin-auth'];
  const isAdmin = ADMIN_PASSWORD && adminHeader === ADMIN_PASSWORD;

  try {
    if (req.method === 'GET') {
      let query = supabase.from('guestbook').select('*').order('created_at', { ascending: false });

      // Public users only see approved entries
      // Admin sees ALL (approved + pending)
      if (!isAdmin) {
        query = query.eq('approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { name, handle, message, avatar_color, badge } = req.body;
      if (!name || !message) {
        return res.status(400).json({ error: 'Name and message are required' });
      }

      const { data, error } = await supabase
        .from('guestbook')
        .insert([{
          name,
          handle,
          message,
          avatar_color: avatar_color || 'cyan',
          badge: badge || 'VISITOR',
          approved: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      // Only admin can approve/reject
      if (!isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id, approved } = req.body;
      const { data, error } = await supabase
        .from('guestbook')
        .update({ approved })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      // Only admin can delete
      if (!isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.body || req.query;
      const { error } = await supabase
        .from('guestbook')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Guestbook API error:', err);
    res.status(500).json({ error: err.message });
  }
}
