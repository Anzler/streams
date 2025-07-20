import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { supabase } from './supabase';
import { searchTMDB, fetchProviders } from './tmdb';

dotenv.config();

const app = express();

// ✅ Allow Netlify frontend for CORS
app.use(cors({
  origin: ['https://streamtrack.netlify.app'], // Your Netlify frontend
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// ✅ Health check
app.get('/', (_req, res) => {
  res.send('API is running.');
});

// ✅ TMDB Search
app.get('/search', async (req, res) => {
  const q = req.query.q as string;
  if (!q) {
    return res.status(400).json({ error: 'Missing query' });
  }

  try {
    const data = await searchTMDB(q);
    res.json(data);
  } catch (error) {
    console.error('[TMDB Search Error]', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ✅ Add to queue
app.post('/queue', async (req, res) => {
  const { tmdb_id, media_type, name, release_year, poster_path, bucket, user_id } = req.body;

  try {
    // 1. Add movie if not exists
    await supabase.from('movies').upsert({
      tmdb_id,
      title: name,
      media_type,
      release_date: `${release_year}-01-01`,
      poster_path
    }, { onConflict: 'tmdb_id' });

    // 2. Add to user's queue
    await supabase.from('user_queue').upsert({
      user_id,
      tmdb_id,
      bucket
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Queue Error]', error);
    res.status(500).json({ error: 'Failed to queue item' });
  }
});

// ✅ Refresh streaming provider info
app.get('/refresh/:tmdb_id', async (req, res) => {
  const tmdb_id = parseInt(req.params.tmdb_id);
  if (!tmdb_id) return res.status(400).json({ error: 'Invalid TMDB ID' });

  try {
    const { data: movie } = await supabase
      .from('movies')
      .select('*')
      .eq('tmdb_id', tmdb_id)
      .single();

    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const providerData = await fetchProviders(tmdb_id, movie.media_type);
    const usProviders = providerData?.results?.US ?? {};

    await supabase.from('movies').update({
      watch_providers: usProviders,
      updated_at: new Date().toISOString()
    }).eq('tmdb_id', tmdb_id);

    res.json({ updated: true });
  } catch (error) {
    console.error('[Refresh Error]', error);
    res.status(500).json({ error: 'Failed to refresh providers' });
  }
});

// ✅ Sample quiz routes
app.get('/questions', (_req, res) => {
  res.json([
    { id: 1, text: "Which era of movies do you prefer?" },
    { id: 2, text: "Do you lean toward drama or comedy?" }
  ]);
});

app.get('/decades', (_req, res) => {
  res.json(['1970s', '1980s', '1990s', '2000s', '2010s']);
});

// ✅ Start the Express server
app.listen(process.env.PORT, () => {
  console.log(`API running on port ${process.env.PORT}`);
});

