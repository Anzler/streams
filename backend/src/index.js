const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { supabase } = require('./supabase');
const { tmdbSearch, tmdbProviders } = require('./tmdb');

dotenv.config();

const app = express();

// ✅ CORS setup: allow frontend requests
app.use(cors({
  origin: '*', // Use your frontend domain instead of '*' in production
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());

// ✅ Health check
app.get('/', (req, res) => res.send('API is running.'));

// ✅ TMDB search endpoint
app.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const data = await tmdbSearch(q);
    res.json(data);
  } catch (error) {
    console.error('[TMDB SEARCH ERROR]', error);
    res.status(500).json({ error: 'Failed to search TMDB' });
  }
});

// ✅ Add title to user queue
app.post('/queue', async (req, res) => {
  const { tmdb_id, media_type, name, release_year, poster_path, bucket, user_id } = req.body;

  try {
    await supabase.from('movies').upsert({
      tmdb_id,
      title: name,
      media_type,
      release_date: `${release_year}-01-01`,
      poster_path
    }, { onConflict: 'tmdb_id' });

    await supabase.from('user_queue').upsert({
      user_id,
      tmdb_id,
      bucket
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[QUEUE ERROR]', error);
    res.status(500).json({ error: 'Failed to queue item' });
  }
});

// ✅ Refresh streaming provider info
app.get('/refresh/:tmdb_id', async (req, res) => {
  const tmdb_id = parseInt(req.params.tmdb_id);

  try {
    const { data: movie } = await supabase
      .from('movies')
      .select('*')
      .eq('tmdb_id', tmdb_id)
      .single();

    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const usProviders = await tmdbProviders(tmdb_id, movie.media_type);

    await supabase.from('movies').update({
      watch_providers: usProviders,
      updated_at: new Date().toISOString()
    }).eq('tmdb_id', tmdb_id);

    res.json({ updated: true });
  } catch (error) {
    console.error('[REFRESH ERROR]', error);
    res.status(500).json({ error: 'Failed to refresh provider info' });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

