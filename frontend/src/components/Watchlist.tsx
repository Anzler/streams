// frontend/src/components/Watchlist.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tabs } from './Tabs';
import { useUser } from '../lib/UserContext';

export function Watchlist() {
  const [status, setStatus] = useState<'watching' | 'want_to_watch' | 'watched'>('watching');
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const fetchMovies = async () => {
    setLoading(true);

    if (!user) {
      setMovies([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_queue')
      .select('id, tmdb_id, bucket, movies ( title, poster_path, tagline, runtime, watch_providers, release_date )')
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
    <div className="mt-10 px-4">
      <Tabs value={status} onChange={setStatus} />

      {loading ? (
        <p className="mt-4 text-gray-500 text-sm">Loading...</p>
      ) : movies.length === 0 ? (
        <p className="mt-4 text-gray-500 text-sm">No titles in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          {movies.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition">
              {item.movies?.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w185${item.movies.poster_path}`}
                  alt={item.movies.title}
                  className="rounded mb-3 w-full"
                />
              )}
              <div className="font-semibold text-sm">{item.movies?.title}</div>
              {item.movies?.tagline && (
                <div className="text-xs italic text-gray-500">
                  “{item.movies.tagline}”
                </div>
              )}
              <div className="text-xs text-gray-600">
                {item.movies?.release_date?.slice(0, 4)} • {item.movies?.runtime ? `${item.movies.runtime} min` : '—'}
              </div>

              {item.movies?.watch_providers?.flatrate?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Available with Subscription:
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {item.movies.watch_providers.flatrate.map((provider: any) => (
                      <img
                        key={`f-${provider.provider_id}`}
                        src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="h-6"
                      />
                    ))}
                  </div>
                </div>
              )}

              {item.movies?.watch_providers?.ads?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-green-700 mb-1">
                    Free with Ads:
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
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
    </div>
  );
}

