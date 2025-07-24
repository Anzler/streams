// frontend/src/components/Watchlist.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tabs } from './Tabs';

export function Watchlist() {
  const [bucket, setBucket] = useState('watching');
  const [movies, setMovies] = useState<any[]>([]);

  useEffect(() => {
    const fetchMovies = async () => {
      const { data: queue } = await supabase
        .from('user_queue')
        .select('tmdb_id')
        .eq('bucket', bucket);

      const ids = queue?.map((q) => q.tmdb_id) || [];

      if (ids.length > 0) {
        const { data } = await supabase
          .from('movies')
          .select('*')
          .in('tmdb_id', ids);

        setMovies(data || []);
      } else {
        setMovies([]);
      }
    };

    fetchMovies();
  }, [bucket]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Your Watchlist</h2>
      <Tabs value={bucket} onChange={setBucket} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {movies.map((movie) => (
          <div key={movie.tmdb_id} className="border p-2 rounded">
            <img
              src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
              alt={movie.title}
              className="w-full rounded"
            />
            <div className="font-bold mt-2 text-sm">{movie.title}</div>
            <div className="text-xs text-gray-500">{movie.release_date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

