// Local persistent store backed by IndexedDB. Songs survive refreshes and
// browser restarts, preserving this browser's copy of the shared library.
// When a Supabase backend is configured (see store.js) this fallback is not
// used — the cloud becomes the source of truth and cross-session sharing works.

import { SEED_SONGS } from '../data/seedSongs.js';
import { buildSong } from '../lib/songBuilder.js';
import { normalizeCompare } from '../lib/slug.js';
import { DuplicateError, toPublicSong } from './store.js';
import { randomToken } from './memoryStore.js';

const DB_NAME = 'chordbook';
const DB_VERSION = 1;
const SONGS = 'songs';
const META = 'meta';

export class LocalStore {
  constructor() {
    this.kind = 'local';
    this.label = 'Local draft (this browser)';
    this.db = null;
  }

  _open() {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve(this.db);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(SONGS)) db.createObjectStore(SONGS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'k' });
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    });
  }

  _tx(store, mode = 'readonly') {
    return this.db.transaction(store, mode).objectStore(store);
  }

  _get(store, id) {
    return new Promise((resolve, reject) => {
      const rq = this._tx(store).get(id);
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    });
  }

  _getAll(store) {
    return new Promise((resolve, reject) => {
      const rq = this._tx(store).getAll();
      rq.onsuccess = () => resolve(rq.result || []);
      rq.onerror = () => reject(rq.error);
    });
  }

  _put(store, value) {
    return new Promise((resolve, reject) => {
      const rq = this._tx(store, 'readwrite').put(value);
      rq.onsuccess = () => resolve();
      rq.onerror = () => reject(rq.error);
    });
  }

  _del(store, id) {
    return new Promise((resolve, reject) => {
      const rq = this._tx(store, 'readwrite').delete(id);
      rq.onsuccess = () => resolve();
      rq.onerror = () => reject(rq.error);
    });
  }

  async ready() {
    await this._open();
    const seeded = await this._get(META, 'seeded');
    if (!seeded || seeded.v !== '1') {
      const txPromises = SEED_SONGS.map((s) => this._put(SONGS, { ...s, id: s.slug }));
      await Promise.all(txPromises);
      await this._put(META, { k: 'seeded', v: '1', at: new Date().toISOString() });
    }
    return this;
  }

  async list() {
    const rows = await this._getAll(SONGS);
    return rows
      .map((r) => ({ ...r, id: r.slug }))
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((r) => toPublicSong(r));
  }

  async get(id) {
    const rows = await this._getAll(SONGS);
    const match = rows.find((s) => s.id === id || s.slug === id);
    return match ? toPublicSong({ ...match, id: match.slug }) : null;
  }

  async _find(song) {
    const rows = await this._getAll(SONGS);
    const key = `${normalizeCompare(song.title)}|${normalizeCompare(song.artist)}`;
    return rows.find((s) => `${normalizeCompare(s.title)}|${normalizeCompare(s.artist)}` === key) || null;
  }

  async create(draft) {
    const song = buildSong(draft);
    const existing = await this._find(song);
    if (existing) {
      throw new DuplicateError(
        `"${song.title}" by ${song.artist} is already in Chordbook.`,
        toPublicSong({ ...existing, id: existing.slug })
      );
    }
    const now = new Date().toISOString();
    const record = {
      ...song,
      id: song.slug,
      created_by: 'local',
      created_at: now,
      updated_at: now,
      edit_token: randomToken(),
    };
    await this._put(SONGS, record);
    return { song: toPublicSong(record), editToken: record.edit_token };
  }

  async update(id, patch, token) {
    const rows = await this._getAll(SONGS);
    const rec = rows.find((s) => s.id === id || s.slug === id);
    if (!rec) throw new Error('Song not found.');
    if (rec.edit_token && rec.edit_token !== token) {
      throw new Error('This song can only be edited by the person who added it.');
    }
    const merged = { ...rec, ...patch, id: rec.id, edit_token: rec.edit_token };
    merged.updated_at = new Date().toISOString();
    await this._put(SONGS, merged);
    return toPublicSong({ ...merged, id: merged.slug });
  }

  async remove(id, token) {
    const rows = await this._getAll(SONGS);
    const rec = rows.find((s) => s.id === id || s.slug === id);
    if (!rec) return;
    if (rec.edit_token && rec.edit_token !== token) {
      throw new Error('This song can only be edited by the person who added it.');
    }
    await this._del(SONGS, rec.id);
  }
}