// Supabase-backed provider. THE shared, multi-user implementation: every song
// created here is instantly visible to every other visitor.
//
// Security posture (see supabase/schema.sql):
//   - RLS enabled; anonymous users get SELECT only.
//   - All writes go through SECURITY DEFINER RPCs (create_song, update_song,
//     delete_song) which validate input, deduplicate, and check the editor
//     token before any mutation.
//   - Only the public anon key ever reaches the browser.
//
// Roles: the songs are joined to artists and exposed via the `song_list` view.

import { createClient } from '@supabase/supabase-js';
import { buildSong } from '../lib/songBuilder.js';
import { DuplicateError } from './store.js';

function clientKey() {
  const fromEnv = import.meta.env && import.meta.env.VITE_CLIENT_KEY;
  if (fromEnv) return fromEnv;
  try {
    let key = localStorage.getItem('chordbook:client_key');
    if (!key) {
      const buf = new Uint8Array(12);
      crypto.getRandomValues(buf);
      key = [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('chordbook:client_key', key);
    }
    return key;
  } catch {
    return 'anon';
  }
}

export class SupabaseStore {
  constructor(url, anonKey) {
    this.kind = 'supabase';
    this.label = 'Shared library (cloud)';
    this.url = url;
    this.client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async ready() {
    // A cheap connectivity probe also surfaces clear setup errors early.
    const { error } = await this.client.from('song_list').select('id').limit(1);
    if (error) {
      const code = error.code || '';
      if (code === '42P01' || /relation "song_list" does not exist/.test(error.message)) {
        throw new Error(
          'Chordbook is configured with Supabase but the database is not initialised. Run the schema in supabase/schema.sql (see backend setup docs).'
        );
      }
      // Networking issues should not block local "draft" mode silently — let
      // the store factory's fallback handle them, but report the root cause.
      throw error;
    }
    return this;
  }

  _mapRow(r) {
    if (!r) return null;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      artist: r.artist_name ?? r.artist ?? '',
      album: r.album,
      key: r.key ?? '',
      capo: r.capo ?? null,
      tuning: r.tuning || 'Standard',
      difficulty: r.difficulty ?? 2,
      lyrics: r.lyrics || '',
      chord_data: Array.isArray(r.chord_data) ? r.chord_data : [],
      chords: Array.isArray(r.chords) ? r.chords : [],
      notes: r.notes || '',
      source: r.source || '',
      created_by: r.created_by || null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  async list() {
    const { data, error } = await this.client
      .from('song_list')
      .select('*')
      .order('title')
      .limit(1000);
    if (error) throw this._friendly(error);
    return (data || []).map((r) => this._mapRow(r));
  }

  async get(id) {
    if (!/^[a-z0-9-]{1,120}$/i.test(String(id || ''))) return null;
    const { data, error } = await this.client
      .from('song_list')
      .select('*')
      .or(`slug.eq.${id},id.eq.${id}`)
      .limit(1);
    if (error) throw this._friendly(error);
    return (data && data[0] && this._mapRow(data[0])) || null;
  }

  async create(draft) {
    const song = buildSong(draft);
    const params = {
      p_title: song.title,
      p_artist: song.artist,
      p_album: song.album,
      p_key: song.key || null,
      p_capo: song.capo,
      p_tuning: song.tuning,
      p_difficulty: song.difficulty,
      p_lyrics: song.lyrics,
      p_chord_data: JSON.stringify(song.chord_data),
      p_chords: song.chords,
      p_notes: song.notes,
      p_source: song.source,
      p_client_key: clientKey(),
    };
    const { data, error } = await this.client.rpc('create_song', params);
    if (error) throw this._friendly(error);
    const result = Array.isArray(data) ? data[0] : data;
    if (result && result.error) {
      if (result.error === 'duplicate') {
        throw new DuplicateError(
          `"${song.title}" by ${song.artist} is already in Chordbook.`,
          result.existing ? this._mapRow(result.existing) || null : null
        );
      }
      throw new Error(result.error);
    }
    return {
      song: result.song ? this._mapRow(result.song) : this._mapRow(result),
      editToken: result.edit_token || null,
    };
  }

  async update(slug, patch, token) {
    if (!token) throw new Error('Editing is only available to the person who added this song.');
    const merged = { ...patch };
    const { data, error } = await this.client.rpc('update_song', {
      p_slug: slug,
      p_edit_token: token,
      p_title: merged.title,
      p_artist: merged.artist,
      p_album: merged.album,
      p_key: merged.key,
      p_capo: merged.capo,
      p_tuning: merged.tuning,
      p_difficulty: merged.difficulty,
      p_lyrics: merged.lyrics,
      p_chord_data: merged.chord_data ? JSON.stringify(merged.chord_data) : null,
      p_chords: merged.chords,
      p_notes: merged.notes,
      p_source: merged.source,
    });
    if (error) throw this._friendly(error);
    const result = Array.isArray(data) ? data[0] : data;
    if (result && result.error) throw new Error(result.error);
    return this._mapRow(result && result.song ? result.song : result);
  }

  async remove(slug, token) {
    if (!token) throw new Error('Editing is only available to the person who added this song.');
    const { data, error } = await this.client.rpc('delete_song', {
      p_slug: slug,
      p_edit_token: token,
    });
    if (error) throw this._friendly(error);
    const result = Array.isArray(data) ? data[0] : data;
    if (result && result.error) throw new Error(result.error);
  }

  _friendly(error) {
    const code = error && error.code;
    if (code === '42501') {
      return new Error('Permission denied by the song database. Check the row-level security config in supabase/schema.sql.');
    }
    return error && error.message ? new Error(`Song database error: ${error.message}`) : new Error('Song database error.');
  }
}