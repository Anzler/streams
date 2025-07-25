import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // tracks which movie is saving

  const onSearch = async () => {
    setLoading(true);
    setResults([]);

    const { data, error } = await supabase
      .from('movies')
      .select('*')
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
      // Upsert movie into 'movies' table
      await supabase.from('movies').upsert({
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        release_date: movie.release_date,
        poster_path: movie.poster_path
      }, { onConflict: 'tmdb_id' });

      // Insert into user_queue
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
        {results.map((item) => (
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

            <div className="mt-3 flex flex-col gap-2">
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
        ))}
      </div>
    </div>
  );
}

