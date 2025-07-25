// frontend/src/components/Search.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../lib/UserContext';

export function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const onSearch = async () => {
    if (!q.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .ilike('title', `%${q}%`)
      .limit(20);

    if (error) {
      console.error('Search failed:', error.message);
      setResults([]);
    } else {
      setResults(data || []);
    }

    setLoading(false);
  };

  const handleAdd = async (movie: any) => {
    if (!user) {
      alert('Please sign in to save movies.');
      return;
    }

    const { error } = await supabase.from('user_queue').upsert({
      user_id: user.id,
      tmdb_id: movie.tmdb_id,
      bucket: 'want_to_watch'
    });

    if (error) {
      alert('Failed to add to watchlist');
      console.error(error.message);
    } else {
      alert('Added to your watchlist');
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center mb-4">
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
      </div>

      {results.length === 0 && !loading && (
        <p className="text-sm text-gray-500">No results yet. Try a search.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

              <div className="mt-2 font-bold text-md">{item.title}</div>

              {item.tagline && (
                <div className="text-sm italic text-gray-500">“{item.tagline}”</div>
              )}

              <div className="text-xs text-gray-600 mt-1">
                {item.release_date?.slice(0, 4)} • {item.runtime || '??'} min
              </div>

              {flatrate.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Subscription:</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {flatrate.map((p: any) => (
                      <img
                        key={`f-${p.provider_id}`}
                        src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                        alt={p.provider_name}
                        title={p.provider_name}
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
                    {ads.map((p: any) => (
                      <img
                        key={`a-${p.provider_id}`}
                        src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                        alt={p.provider_name}
                        title={p.provider_name}
                        className="h-8 border border-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              )}

              {user && (
                <button
                  onClick={() => handleAdd(item)}
                  className="mt-3 text-sm text-blue-600 underline"
                >
                  ➕ Add to Watchlist
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

