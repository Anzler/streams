import { createClient } from '@supabase/supabase-js';
import { tmdbProviders } from '../tmdb.js';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  const { data: titles } = await supabase.from('titles').select('id, tmdb_id, media_type');
  for (const t of titles!) {
    const prov = await tmdbProviders(t.tmdb_id, t.media_type, process.env.WATCH_REGION);
    await supabase.from('titles').update({
       providers_json: prov || {},
       last_provider_sync: new Date().toISOString()
    }).eq('id', t.id);
    await new Promise(r => setTimeout(r, 350));   // be kind to TMDB rate limit
  }
  console.log('refresh done');
})();

