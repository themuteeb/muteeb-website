import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    global: {
      fetch: async (url, options) => {
        try {
          const res = await fetch(url, options);
          if (!res.ok && res.status >= 500) triggerRestore();
          return res;
        } catch (err) {
          // network-level failure (DNS / connection refused) — the database
          // project may be paused or waking up; ask the restore service to
          // bring it back before surfacing the error.
          triggerRestore();
          throw err;
        }
      },
    },
  }
);

export default supabase;
