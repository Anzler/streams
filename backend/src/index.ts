import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { supabase } from './supabase';
import { searchTMDB, fetchProviders } from './tmdb';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (_req, res) => res.send('API is running.'));

// TMDB search
app.get('/search', async (req, res) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  const data = await searchTMDB(q);
  res.json(data);
});

// Add title to user queue
app.post('/queue', async (req, res) => {
  const { tmdb_id, media_type, name, release_year, poster_path, bucket, user_id } = req.body;

  // 1. Insert into movies (skip if exists)
  await supabase.from('movies').upsert({
    tmdb_id,
    title: name,
    media_type,
    release_date: `${release_year}-01-01`,
    poster_path
  }, { onConflict: 'tmdb_id' });

  // 2. Link to user queue
  await supabase.from('user_queue').upsert({
    user_id,
    tmdb_id,
    bucket
  });

  res.json({ success: true });
});

// Refresh a specific title’s providers
app.get('/refresh/:tmdb_id', async (req, res) => {
  const tmdb_id = parseInt(req.params.tmdb_id);
  const { data: movie } = await supabase.from('movies').select('*').eq('tmdb_id', tmdb_id).single();

  if (!movie) return res.status(404).json({ error: 'Movie not found' });

  const providerData = await fetchProviders(tmdb_id, movie.media_type);
  const usProviders = providerData?.results?.US ?? {};

  await supabase.from('movies').update({
    watch_providers: usProviders,
    updated_at: new Date().toISOString()
  }).eq('tmdb_id', tmdb_id);

  res.json({ updated: true });
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`API running on port ${process.env.PORT}`);
});

