import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../lib/UserContext';

export function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const onSearch = async () => {
    setLoading(true);
    const res = await fetch(
      `https://streamstrack-api.onrender.com/search?q=${encodeURIComponent(q)}`
    );
    const json = await res.json();
    setResults(json.results || []);
    setLoading(false);
  };

  const saveToQueue = async (tmdb_id: number) => {
    if (!user) {
      alert('Please sign in to save titles.');
      return;
    }

    const { error } = await supabase.from('user_queue').upsert({
      user_id: user.id,
      tmdb_id,
      bucket: 'want_to_watch',
    });

    if (error) {
      console.error('Failed to save:', error.message);
      alert('Could not save title.');
    } else {
      alert('Added to your watchlist!');
    }
  };

  return (
    <div className="mb-10 px-4">
      {/* Search Bar */}
      <div className="flex items-center border rounded-full px-4 py-2 max-w-xl mx-auto shadow-sm mb-6">
        <svg
          className="w-5 h-5 text-gray-400 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1111.5 4a7.5 7.5 0 015.15 12.65z"
          />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for movies"
          className="flex-grow focus:outline-none bg-transparent"
        />
        <button
          onClick={onSearch}
          disabled={loading}
          className="ml-4 px-4 py-1 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {results.map((item) => {
          const flatrate = item.watch_providers?.flatrate || [];
          const ads = item.watch_providers?.ads || [];

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition"
            >
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                  alt={item.title}
                  className="rounded mb-3 w-full"
                />
              )}
              <div className="font-semibold text-sm">{item.title}</div>
              {item.tagline && (
                <div className="text-xs italic text-gray-500">
                  “{item.tagline}”
                </div>
              )}
              <div className="text-xs text-gray-600">
                {item.release_date?.slice(0, 4)} •{' '}
                {item.runtime ? `${item.runtime} min` : '—'}
              </div>

              {/* Streaming Options */}
              {flatrate.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Available with Subscription:
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {flatrate.map((provider: any) => (
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

              {ads.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-green-700 mb-1">
                    Free with Ads:
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {ads.map((provider: any) => (
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

              {/* Save Button */}
              <button
                onClick={() => saveToQueue(item.id)}
                className="mt-4 text-xs text-blue-600 hover:underline"
              >
                ➕ Add to Watchlist
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

