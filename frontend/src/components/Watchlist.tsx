import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function Watchlist() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const user = await supabase.auth.getUser();
      const uid = user.data.user?.id;

      const { data } = await supabase
        .from('user_queue')
        .select(`bucket, movies (title, poster_path)`)
        .eq('user_id', uid);

      if (data) setItems(data);
    };

    load();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Your Watchlist</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ movies }, i) => (
          <div key={i} className="border p-2 rounded bg-white">
            <img src={`https://image.tmdb.org/t/p/w185${movies.poster_path}`} />
            <div className="text-sm font-bold mt-2">{movies.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

