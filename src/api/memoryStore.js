// In-memory store (used by tests, build-time usage, and as last resort when
// IndexedDB is unavailable). Always seeded with the imported setlist songs.

import { SEED_SONGS } from '../data/seedSongs.js';
import { buildSong } from '../lib/songBuilder.js';
import { DuplicateError, toPublicSong } from './store.js';
import { normalizeCompare } from '../lib/slug.js';

export class MemoryStore {
  constructor() {
    this.kind = 'memory';
    this.label = 'In-memory';
    this.songs = new Map(SEED_SONGS.map((s) => [s.id, structuredClone(s)]));
  }

  async ready() {
    return this;
  }

  list() {
    const out = [];
    for (const s of this.songs.values()) out.push(toPublicSong({ ...s, id: s.slug }));
    return out.sort((a, b) => a.title.localeCompare(b.title));
  }

  async get(id) {
    const match = this.songs.get(id) || [...this.songs.values()].find((s) => s.slug === id);
    return match ? toPublicSong({ ...match, id: match.slug }) : null;
  }

  async create(draft) {
    const song = buildSong(draft);
    if (this._exists(song)) {
      const existing = this._find(song);
      throw new DuplicateError(
        `"${song.title}" by ${song.artist} is already in Chordbook.`,
        existing
      );
    }
    const editToken = randomToken();
    const now = new Date().toISOString();
    const record = {
      ...song,
      id: song.slug,
      created_by: 'local',
      created_at: now,
      updated_at: now,
      edit_token: editToken,
    };
    this.songs.set(record.id, record);
    return { song: publicSong(record), editToken };
  }

  async update(id, patch, token) {
    const rec = this.songs.get(id) || [...this.songs.values()].find((s) => s.slug === id);
    if (!rec) throw new Error('Song not found.');
    this._guard(rec, token);
    const merged = { ...rec, ...patch, id: rec.id, edit_token: rec.edit_token };
    merged.updated_at = new Date().toISOString();
    this.songs.set(merged.id, merged);
    return publicSong(merged);
  }

  async remove(id, token) {
    const rec = this.songs.get(id) || [...this.songs.values()].find((s) => s.slug === id);
    if (!rec) return;
    this._guard(rec, token);
    this.songs.delete(rec.id);
  }

  _guard(rec, token) {
    if (!rec.edit_token) {
      // Seed songs have no owner edit token — provide one historically.
      return;
    }
    if (rec.edit_token !== token) {
      throw new Error('This song can only be edited by the person who added it.');
    }
  }

  _find(song) {
    const key = `${normalizeCompare(song.title)}|${normalizeCompare(song.artist)}`;
    for (const s of this.songs.values()) {
      if (`${normalizeCompare(s.title)}|${normalizeCompare(s.artist)}` === key) return s;
    }
    return null;
  }

  _exists(song) {
    return Boolean(this._find(song));
  }
}

function publicSong(rec) {
  const { edit_token, ...rest } = rec;
  return rest;
}

export function randomToken() {
  const buf = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
    return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}