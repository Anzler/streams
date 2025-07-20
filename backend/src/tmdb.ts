import fetch from 'node-fetch';

const TMDB_KEY = process.env.TMDB_KEY!;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function searchTMDB(query: string) {
  const res = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&api_key=${TMDB_KEY}`);
  return res.json();
}

export async function fetchProviders(tmdb_id: number, media_type: 'movie' | 'tv') {
  const url = `${BASE_URL}/${media_type}/${tmdb_id}/watch/providers?api_key=${TMDB_KEY}`;
  const res = await fetch(url);
  return res.json();
}

