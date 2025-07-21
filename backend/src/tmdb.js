const fetch = require('node-fetch');

const TMDB = process.env.TMDB_KEY;
const BASE = 'https://api.themoviedb.org/3';

// Search TMDB titles
async function tmdbSearch(query) {
  const url = `${BASE}/search/multi?api_key=${TMDB}&query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url);
  return res.json(); // Filter client-side
}

// Fetch streaming providers by tmdb_id and type
async function tmdbProviders(tmdbId, type, region = 'US') {
  const url = `${BASE}/${type}/${tmdbId}/watch/providers?api_key=${TMDB}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.results?.[region] ?? null;
}

module.exports = {
  tmdbSearch,
  tmdbProviders
};

