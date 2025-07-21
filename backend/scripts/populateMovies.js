// /backend/jobs/populateMovies.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TMDB setup
const TMDB_KEY = process.env.TMDB_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const CHECKPOINT_FILE = path.join(__dirname, 'checkpoint.json');
const MAX_PAGES = 1000;

function loadCheckpoint() {
  try {
    const data = fs.readFileSync(CHECKPOINT_FILE);
    const { page } = JSON.parse(data);
    return page;
  } catch {
    return 1;
  }
}

function saveCheckpoint(page) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ page }, null, 2));
}

async function fetchMovies(page) {
  const url = `${BASE_URL}/discover/movie?api_key=${TMDB_KEY}&sort_by=popularity.desc&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error on page ${page}`);
  return res.json();
}

async function insertMovie(movie) {
  const { id, title, release_date, poster_path } = movie;
  const { error } = await supabase.from('movies').upsert({
    tmdb_id: id,
    title,
    media_type: 'movie',
    release_date,
    poster_path
  }, { onConflict: 'tmdb_id' });

  if (error) console.error(`Insert failed for ${title}:`, error.message);
}

(async () => {
  let startPage = loadCheckpoint();
  console.log(`Starting from page ${startPage}...`);

  for (let page = startPage; page <= MAX_PAGES; page++) {
    try {
      const data = await fetchMovies(page);
      for (const movie of data.results) {
        await insertMovie(movie);
      }
      console.log(`✅ Page ${page} done`);
      saveCheckpoint(page + 1);
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`❌ Page ${page} failed:`, err.message);
      break;
    }
  }

  console.log('🎉 Finished cron run');
})();

