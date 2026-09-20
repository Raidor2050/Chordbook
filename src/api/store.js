// SongStore contract + factory. The UI talks to a single store instance; the
// active provider is chosen from environment config at runtime.
//
//   kind: 'memory' | 'local' | 'supabase'
//
// Every provider implements:
//   list()                      -> Array<Song>  (public shape, no edit secrets)
//   get(id)                     -> Song | null
//   create(draft)               -> { song, editToken }
//   update(id, patch, token)    -> Song
//   remove(id, token)           -> void
//
// create() throws a DuplicateError (with .existing) when a song with the same
// normalized title+artist already exists.

import { MemoryStore } from './memoryStore.js';
import { LocalStore } from './localStore.js';

export class DuplicateError extends Error {
  constructor(message, existing) {
    super(message);
    this.name = 'DuplicateError';
    this.existing = existing || null;
  }
}

export function isDuplicateError(err) {
  return err && err.name === 'DuplicateError';
}

export const hasSupabaseConfig = () =>
  Boolean(
    (import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
      (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL))
  ) &&
  Boolean(
    (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
      (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY))
  );

function supabaseConfig() {
  const url =
    (import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL));
  const key =
    (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY));
  return { url, key };
}

let cached = null;

/** Create (or fetch the cached) active store. */
export async function getStore() {
  if (cached) return cached;
  let store = null;
  if (hasSupabaseConfig()) {
    try {
      const { SupabaseStore } = await import('./supabaseStore.js');
      const cfg = supabaseConfig();
      store = new SupabaseStore(cfg.url, cfg.key);
    } catch (err) {
      console.warn('Chordbook: failed to initialise Supabase store — falling back to local.', err);
    }
  }
  if (!store) {
    try {
      store = new LocalStore();
    } catch {
      store = new MemoryStore();
    }
  }
  await store.ready();
  cached = store;
  return store;
}

export function resetStoreForTests() {
  cached = null;
}

/** Public shape used everywhere in the UI. */
export function toPublicSong(song) {
  if (!song) return null;
  const { edit_token: _t, editToken: _e, ...pub } = song;
  return pub;
}