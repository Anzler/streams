import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

type Bucket = 'watching' | 'wishlist' | 'watched';

type Provider = {
  provider_name: string;
  logo_path: string;
};

type Title = {
  tmdb_id: number;
  title: string;
  release_date: string;
  poster_path: string;
  watch_providers: {
    flatrate?: Provider[];
  };
  last_provider_sync: string;
};

type WatchlistItem = {
  bucket: Bucket;
  movies: Title;
};

export function Watchlist() {
  const [data, setData] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      setLoading(true);
      const user = await supabase.auth.getUser();
      const uid = user.data.user?.id;

      const { data, error } = await supabase
        .from('user_queue')
        .select(`
          bucket,
          movies (
            tmdb_id,
            title,
            release_date,
            poster_path,
            watch_providers,
            last_provider_sync
          )
        `)
        .eq('user_id', uid);

      if (!error) setData(data || []);
      setLoading(false);
    };

    fetchWatchlist();

    // Optional: Realtime updates
    const channel = supabase.channel('watch_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'movies' },
        (payload) => {
          console.log('Realtime movie update received:', payload);
          fetchWatchlist(); // Re-fetch to get fresh data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div>Loading watchlist...</div>;

  const group = (bucket: Bucket) =>
    data.filter((item) => item.bucket === bucket);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Watchlist</h2>
      {(['watching', 'wishlist', 'watched'] as Bucket[]).map((bucket) => (
        <div key={bucket} className="mb-8">
          <h3 className="text-xl font-semibold capitalize mb-2">
            {bucket}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {group(bucket).map((item, idx) => (
              <Card key={idx} title={item.movies} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({ title }: { title: Title }) {
  const poster = title.poster_path
    ? `https://image.tmdb.org/t/p/w185${title.poster_path}`
    : '/placeholder.jpg';

  const providers = title.watch_providers?.flatrate ?? [];

  return (
    <div className="border rounded-lg bg-white shadow p-2">
      <img
        src={poster}
        alt={title.title}
        className="rounded w-full mb-2"
      />
      <div className="text-sm font-semibold">{title.title}</div>

      {providers.length > 0 ? (
        <div className="flex flex-wrap mt-1">
          {providers.map((p, i) => (
            <img
              key={i}
              src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
              alt={p.provider_name}
              title={p.provider_name}
              className="h-6 mr-1 mt-1"
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-1">
          Not on any provider
        </p>
      )}

      <p className="text-xs text-gray-400 mt-1">
        Updated {formatDistanceToNow(new Date(title.last_provider_sync))} ago
      </p>
    </div>
  );
}

