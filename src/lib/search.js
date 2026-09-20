// Client-side search + filter over the shared song library.
// Framework-agnostic pure functions so they are easy to test.

const normalizeRE = new RegExp('[\u0300-\u036f]', 'g');

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalizeText(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(normalizeRE, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Simple subsequence fuzzy matcher used per token. */
export function fuzzyMatch(needle, haystack) {
  if (!needle) return true;
  const stack = normalizeText(haystack);
  if (stack.includes(needle)) return true;
  let ni = 0;
  for (let hi = 0; hi < stack.length && ni < needle.length; hi++) {
    if (stack[hi] === needle[ni]) ni += 1;
  }
  return ni === needle.length;
}

const FIELD_WEIGHT = { title: 10, artist: 6, album: 3, chords: 2, key: 1 };

export function songFields(song, chords) {
  const chordList = (Array.isArray(chords) ? chords : []).join(' ');
  return {
    title: song.title,
    artist: song.artist,
    album: song.album || '',
    chords: chordList,
    key: song.key || '',
  };
}

/**
 * Score a song against a query string. Returns a positive number ranking
 * relevance (higher = better), or 0 when no token matches.
 */
export function scoreSong(song, query, chords) {
  const q = normalizeText(query);
  if (!q) return 1;
  const tokens = q.split(' ').filter(Boolean);
  if (!tokens.length) return 1;
  const fields = songFields(song, chords);
  let score = 0;
  for (const tok of tokens) {
    let best = 0;
    for (const [field, value] of Object.entries(fields)) {
      if (!value) continue;
      if (!fuzzyMatch(tok, value)) continue;
      const norm = normalizeText(value);
      let s = FIELD_WEIGHT[field] || 1;
      if (norm.startsWith(tok)) s += 4;
      if (norm === tok) s += 6;
      if (tok.length >= 4 && norm.includes(tok)) s += 2;
      best = Math.max(best, s);
    }
    if (best === 0) return 0; // every query word must match somewhere
    score += best;
  }
  return score + (song.title ? 0.2 : 0);
}

export function baseFilters() {
  return {
    artist: '',
    key: '',
    difficulty: '',
    capo: '',
    tuning: '',
    chord: '',
  };
}

/** Apply a filter set to a song. Returns true when it passes. */
export function songPassesFilters(song, chords, filters) {
  const f = filters || {};
  if (f.artist && normalizeText(song.artist) !== normalizeText(f.artist)) return false;
  if (f.key) {
    const songKey = String(song.key || '').replace(/m$/i, '').toLowerCase();
    const wantKey = String(f.key).replace(/m$/i, '').toLowerCase();
    if (songKey !== wantKey) return false;
  }
  if (f.difficulty && String(song.difficulty || '') !== String(f.difficulty)) return false;
  if (f.capo && String(song.capo ?? '') !== String(f.capo)) return false;
  if (f.tuning && String(song.tuning || 'Standard').toLowerCase() !== String(f.tuning).toLowerCase())
    return false;
  if (f.chord && !(chords || []).includes(f.chord)) return false;
  return true;
}

/** Aggregate search: scoring + filtering, returns sorted songs. */
export function searchSongs(songs, query, filters) {
  const scored = songs
    .map((s) => ({ song: s, score: scoreSong(s, query, s.chords) }))
    .filter((r) => r.score > 0 && songPassesFilters(r.song, r.song.chords, filters));
  scored.sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title));
  return scored.map((r) => r.song);
}

/** Group of distinct values used to populate filter dropdowns. */
export function distinct(songs, key) {
  const vals = new Set();
  for (const s of songs) {
    const v = s[key];
    if (v === undefined || v === null || v === '') continue;
    vals.add(String(v));
  }
  return [...vals].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}