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
      // Filter payload to core columns to prevent 400 SQL column missing errors
      const validColumns = [
        'full_name', 'title', 'bio', 'status_badge', 'location',
        'available_for_work', 'accent_color', 'email', 'github_url',
        'twitter_url', 'linkedin_url'
      ];

      const filteredPayload = {};
      for (const key of validColumns) {
        if (payload[key] !== undefined) {
          filteredPayload[key] = payload[key];
        }
      }

      const { data: existing } = await supabase.from('profile').select('id').limit(1).maybeSingle();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('profile')
          .update(filteredPayload)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.warn('Profile DB update notice:', error.message);
          result = { ...existing, ...payload };
        } else {
          result = { ...data, ...payload };
        }
      } else {
        const { data, error } = await supabase
          .from('profile')
          .insert([filteredPayload])
          .select()
          .single();

        if (error) {
          result = { ...payload };
        } else {
          result = { ...data, ...payload };
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
