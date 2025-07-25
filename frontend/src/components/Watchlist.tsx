v// frontend/src/components/Watchlist.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tabs } from './Tabs';

export function Watchlist() {
  const [status, setStatus] = useState<'watching' | 'want_to_watch' | 'watched'>('watching');
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMovies = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMovies([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_queue')
      .select('id, tmdb_id, bucket, movies ( title, poster_path, tagline, runtime, watch_providers )')
      .eq('bucket', status)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching movies:', error.message);
      setMovies([]);
    } else {
      setMovies(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();
  }, [status]);

  return (
    <div className="mt-8">
      <Tabs value={status} onChange={setStatus} />

      {loading ? (
        <p className="mt-4 text-gray-500">Loading...</p>
      ) : (
        <>
          {movies.length === 0 ? (
            <p className="text-sm text-gray-500 mt-4">No titles in this category yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {movies.map((item) => (
                <div key={item.id} className="border rounded p-2 bg-white shadow">
                  <img
                    src={`https://image.tmdb.org/t/p/w185${item.movies?.poster_path}`}
                    alt={item.movies?.title}
                    className="rounded mb-2"
                  />
                  <div className="font-semibold text-sm">{item.movies?.title}</div>
                  <div className="text-xs text-gray-600 italic">{item.movies?.tagline}</div>
                  <div className="text-xs mt-1 text-gray-700">{item.movies?.runtime} min</div>

                  {item.movies?.watch_providers?.flatrate?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 font-semibold">Subscription</div>
                      <div className="flex flex-wrap gap-2">
                        {item.movies.watch_providers.flatrate.map((provider: any) => (
                          <img
                            key={`f-${provider.provider_id}`}
                            src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                            alt={provider.provider_name}
                            title={provider.provider_name}
                            className="h-6 rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {item.movies?.watch_providers?.ads?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-green-700 font-semibold">Ad‑Supported</div>
                      <div className="flex flex-wrap gap-2">
                        {item.movies.watch_providers.ads.map((provider: any) => (
                          <img
                            key={`a-${provider.provider_id}`}
                            src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                            alt={provider.provider_name}
                            title={`${provider.provider_name} (ads)`}
                            className="h-6 rounded border border-yellow-500"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
