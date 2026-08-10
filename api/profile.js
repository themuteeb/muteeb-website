import supabase from './db-client.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Auth');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const adminHeader = req.headers['x-admin-auth'];
  const isAdmin = ADMIN_PASSWORD && adminHeader === ADMIN_PASSWORD;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // NEVER expose admin_passcode field to anyone
        delete data.admin_passcode;

        if (!isAdmin) {
          delete data.email;
          delete data.created_at;
          delete data.updated_at;
        }
      }

      // Return special flag if admin authenticated
      if (isAdmin) {
        return res.status(200).json({ ...(data || {}), __admin_verified: true });
      }

      return res.status(200).json(data || null);
    }

    if (req.method === 'PUT') {
      // Require admin auth for any updates
      if (!isAdmin) {
        return res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
      }

      const payload = { ...req.body };

      const validColumns = [
        'full_name', 'title', 'bio', 'status_badge', 'location',
        'available_for_work', 'accent_color', 'email',
        'instagram_handle', 'logo_url',
        'github_url', 'twitter_url', 'linkedin_url',
        'typewriter_roles', 'now_focus', 'quick_facts',
        'headline', 'sound_enabled'
      ];

      const filteredPayload = {};
      for (const key of validColumns) {
        if (payload[key] !== undefined) {
          filteredPayload[key] = payload[key];
        }
      }

      const { data: existing } = await supabase
        .from('profile')
        .select('id')
        .limit(1)
        .maybeSingle();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('profile')
          .update(filteredPayload)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.warn('Profile update warning:', error.message);
          result = { ...existing, ...filteredPayload };
        } else {
          result = data;
        }
      } else {
        const { data, error } = await supabase
          .from('profile')
          .insert([filteredPayload])
          .select()
          .single();

        if (error) {
          result = { ...filteredPayload };
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
    console.error('Profile API error:', err);
    res.status(500).json({ error: err.message });
  }
}
