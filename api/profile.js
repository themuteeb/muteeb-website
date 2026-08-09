import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data || null);
    }

    if (req.method === 'PUT') {
      const payload = { ...req.body };

      const validColumns = [
        'full_name', 'title', 'bio', 'status_badge', 'location',
        'available_for_work', 'accent_color', 'email',
        'instagram_handle', 'logo_url',
        'github_url', 'twitter_url', 'linkedin_url',
        'typewriter_roles', 'now_focus', 'quick_facts',
        'admin_passcode', 'headline', 'sound_enabled'
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
      return res.status(200).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Profile API error:', err);
    res.status(500).json({ error: err.message });
  }
}
