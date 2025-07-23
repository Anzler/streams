// frontend/src/components/Search.tsx

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async () => {
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
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {results.map((item) => (
          <div key={item.tmdb_id} className="border p-2 rounded">
            {item.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                alt={item.title}
                className="rounded"
              />
            )}
            <div className="text-sm font-bold mt-2">{item.title}</div>
            <div className="text-xs text-gray-600">{item.release_date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

