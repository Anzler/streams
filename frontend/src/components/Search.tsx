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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {results.map((item) => (
          <div key={item.id} className="border p-2 rounded">
            <img src={`https://image.tmdb.org/t/p/w185${item.poster_path}`} />
            <div className="text-sm font-bold mt-2">{item.title || item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

