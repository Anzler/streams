import { useState } from 'react';

export function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const onSearch = async () => {
    const res = await fetch(`https://streamstrack-api.onrender.com/search?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setResults(json.results || []);
  };

  return (
    <div className="mb-6">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search titles..."
        className="border p-2 rounded mr-2 w-64"
      />
      <button onClick={onSearch} className="bg-blue-600 text-white px-4 py-2 rounded">
        Search
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
        {results.map((item) => {
          const flatrate = item.watch_providers?.flatrate || [];
          const ads = item.watch_providers?.ads || [];

          return (
            <div key={item.id} className="border p-3 rounded shadow bg-white">
              <img
                src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                alt={item.title}
                className="w-full rounded"
              />
              <div className="mt-2 text-md font-bold">{item.title || item.name}</div>
              <div className="text-sm text-gray-600">{item.release_date}</div>

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
                        title={provider.provider_name}
                        className="h-8"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

