import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const onSearch = async () => {
    setLoading(true);
    setResults([]);

    const { data, error } = await supabase
      .from('movies')
      .select('tmdb_id, title, release_date, poster_path, watch_providers')
      .ilike('title', `%${q}%`)
      .limit(20);

    if (error) {
      console.error('Search error:', error.message);
    } else {
      setResults(data || []);
    }

    setLoading(false);
  };

  const handleAdd = async (movie: any, bucket: 'watching' | 'want_to_watch' | 'watched') => {
    setSaving(`${movie.tmdb_id}-${bucket}`);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('You must be signed in to save movies.');
      setSaving(null);
      return;
    }

    try {
      await supabase.from('movies').upsert({
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        release_date: movie.release_date,
        poster_path: movie.poster_path
      }, { onConflict: 'tmdb_id' });

      const { error } = await supabase.from('user_queue').upsert({
        user_id: user.id,
        tmdb_id: movie.tmdb_id,
        bucket
      });

      if (error) {
        console.error('Queue error:', error.message);
        alert('Failed to add to watchlist.');
      } else {
        alert(`Saved to "${bucket.replace(/_/g, ' ')}"!`);
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mb-6">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search titles..."
        className="border p-2 rounded mr-2 w-64"
      />
      <button
        onClick={onSearch}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
        {results.map((item) => {
          const flatrate = item.watch_providers?.flatrate || [];
          const ads = item.watch_providers?.ads || [];

          return (
            <div key={item.tmdb_id} className="border p-3 rounded shadow bg-white">
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                  alt={item.title}
                  className="w-full rounded"
                />
              )}
              <div className="mt-2 text-md font-bold">{item.title}</div>
              <div className="text-sm text-gray-600">{item.release_date?.slice(0, 4)}</div>

              {flatrate.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Available with Subscription:</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {flatrate.map((provider: any) => (
                      <img
                        key={`f-${provider.provider_id}`}
                        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="h-8"
                      />
                    ))}
                  </div>
                </div>
              )}

              {ads.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-green-700 mb-1">Free with Ads:</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {ads.map((provider: any) => (
                      <img
                        key={`a-${provider.provider_id}`}
                        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                        alt={provider.provider_name}
                        title={`${provider.provider_name} (ads)`}
                        className="h-8 rounded border border-yellow-500"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-col gap-1">
                {(['watching', 'want_to_watch', 'watched'] as const).map((bucket) => (
                  <button
                    key={bucket}
                    onClick={() => handleAdd(item, bucket)}
                    disabled={saving === `${item.tmdb_id}-${bucket}`}
                    className="text-sm text-blue-600 underline text-left"
                  >
                    {saving === `${item.tmdb_id}-${bucket}`
                      ? 'Saving...'
                      : `➕ Add to ${bucket.replace(/_/g, ' ')}`}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

