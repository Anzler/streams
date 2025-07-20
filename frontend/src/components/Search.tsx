const Search = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const onSearch = async () => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then(r=>r.json());
    setResults(res);
  };
  const onAdd = async (item, bucket: 'watching'|'queued'|'watched') => {
    await fetch('/api/add', {
       method:'POST',
       headers:{'Content-Type':'application/json'},
       body: JSON.stringify({
         userId: supabase.auth.getUser().data.user?.id,
         tmdbId: item.id,
         mediaType: item.media_type,
         name: item.title || item.name,
         year: (item.release_date||item.first_air_date||'').slice(0,4),
         posterPath: item.poster_path,
         bucket
       })
    });
  };
  /* render textbox, button, results list with Add buttons */
};

