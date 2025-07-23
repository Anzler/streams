// src/lib/api.js
import { supabase } from './supabase';

export async function getMovies(limit = 20) {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('release_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

