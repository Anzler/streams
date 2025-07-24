const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TMDB
const TMDB_KEY = process.env.TMDB_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const CHECKPOINT_FILE = path.join(__dirname, 'checkpoint.json');

const DELAY_MS = 300;
const START_YEAR = 1980;
const END_YEAR = 2025;
const MAX_PAGES_PER_YEAR = 500;

// Load or initialize checkpoint
function loadCheckpoint() {
  try {
    const data = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { year: START_YEAR, page: 1 };
  }
}

function saveCheckpoint(year, page) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ year, page }, null, 2));
}

// Fetch one page of movies by year
async function fetchMovies(year, page) {
  const url = `${BASE_URL}/discover/movie?api_key=${TMDB_KEY}` +
              `&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false` +
              `&with_origin_country=US&with_original_language=en` +
              `&primary_release_year=${year}&page=${page}`;

  const res = await fetch(url);
  if (res.status === 401) throw new Error('Unauthorized – check your TMDB_KEY in the .env file');
  if (!res.ok) throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
  return res.json();
}

// Fetch full movie details (tagline, runtime)
async function fetchMovieDetails(tmdb_id) {
  const url = `${BASE_URL}/movie/${tmdb_id}?api_key=${TMDB_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) return {};
  return res.json();
}

// Fetch watch providers for the US region
async function fetchWatchProviders(tmdb_id) {
  const url = `${BASE_URL}/movie/${tmdb_id}/watch/providers?api_key=${TMDB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return { note: "Not currently streaming in US" };
  const data = await res.json();
  return data?.results?.US || { note: "Not currently streaming in US" };
}

// Insert a movie into the Supabase DB
async function insertMovie(movie) {
  const {
    id: tmdb_id,
    title,
    overview,
    release_date,
    poster_path,
    genre_ids
  } = movie;

  try {
    const details = await fetchMovieDetails(tmdb_id);
    const watch_providers = await fetchWatchProviders(tmdb_id);

    // ⛔ Skip movies not currently streaming
    if (watch_providers.note === "Not currently streaming in US") {
      console.log(`⏭️ Skipping ${title} (TMDB ID ${tmdb_id}) – not available for streaming`);
      return;
    }

    const { error } = await supabase.from('movies').upsert({
      tmdb_id,
      title,
      overview: overview?.trim() || 'No description available.',
      tagline: details?.tagline || '',
      release_date,
      poster_path,
      genres: genre_ids || [],
      runtime: details?.runtime || 0,
      watch_providers
    }, { onConflict: 'tmdb_id' });

    if (error) {
      console.error(`❌ Insert failed for TMDB ID ${tmdb_id} (${title}):`, error.message);
    }
  } catch (err) {
    console.error(`❌ Failed to insert TMDB ID ${tmdb_id} (${title}):`, err.message);
  }
}

// Main run
(async () => {
  let { year, page } = loadCheckpoint();

  console.log(`🚀 Starting population at year ${year}, page ${page}...\n`);

  for (; year <= END_YEAR; year++) {
    for (; page <= MAX_PAGES_PER_YEAR; page++) {
      try {
        const data = await fetchMovies(year, page);
        for (const movie of data.results) {
          await insertMovie(movie);
        }

        console.log(`✅ Year ${year} - Page ${page}: Imported ${data.results.length} movies`);
        saveCheckpoint(year, page + 1);

        if (data.total_pages && page >= data.total_pages) break;
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      } catch (err) {
        console.error(`❌ Year ${year} - Page ${page}: ${err.message}`);
        return;
      }
    }
    page = 1;
  }

  console.log('\n🎉 Finished populating movies!');
})();

