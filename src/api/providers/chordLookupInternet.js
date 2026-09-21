// ChordInternetProvider — fetch chords AND capo information from the internet.
//
// Backed by ChordAPI (https://chordsapi.xyz), a free, key-free, CORS-friendly
// public chart service covering a large songbook. We call one documented JSON
// endpoint and normalize it into the app's chart contract. Nothing here
// bypasses auth, paywalls, or scrapes sites whose terms forbid it.
//
// The normalizers are PURE and fully unit-tested against canned fixtures (zero
// network). The only network call is findChordsAndCapo, which is wrapped in an
// 8s timeout + try/catch and can NEVER throw: any failure degrades to the
// always-available manual wizard ("Enter details manually"), which is local
// and never blocks.

const API_ROOT = 'https://chordsapi.xyz/api/1.0';
const TIMEOUT_MS = 8000     ;

const SECTION_HEAD_RE = /^\[([^\]]+)\]\s*$/;
const CHORD_TOKEN_RE =
  /^[A-G][#b]?(?:m|maj|min|dim|aug|sus|maj7|m7|7|9|11|13|add|sus2|sus4|dim7|aug7|\/\w+|\()*.*[A-Za-z0-9]$/;

function result(provider, state, message, data) {
  return { provider, state, message, data: data || null };
}
function badResult(state, message) {
  return result('internet', state, message, null);
}
function okResult(json) {
  return result('internet', 'found', null, normalizeChordApiChart(json));
}

const CHORDY_RE = /^[A-G][#b]?(m|maj|min|dim|aug|sus|6|7|9|11|13|add|sus2|sus4|maj7|m7|\/\w+|\([^)]*\))?(\d)?$/;

function pickStr(obj, keys, fallback) {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return fallback;
}

function capoNumber(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v > 0 ? v : 0;
  if (typeof v === 'string') {
    const m = v.match(/(\d+)/);
    return m && !isNaN(+m[1]) ? +m[1] : 0;
  }
  if (typeof v === 'object') {
    const inner = v.fret ?? v.frets ?? v.position ?? v.value ?? v.capo;
    return capoNumber(inner);
  }
  return 0;
}

function chordToken(c) {
  if (typeof c === 'string') return c.trim();
  if (c && typeof c === 'object') return pickStr(c, ['chord', 'name', 'chordName', 'text'], '');
  return '';
}

function chordTokensFrom(payload, key) {
  const list = payload[key];
  const out = [];
  if (Array.isArray(list)) {
    for (const c of list) {
      const t = chordToken(c);
      if (t && !out.includes(t)) out.push(t);
    }
  } else if (typeof list === 'string') {
    for (const t of list.split(/\s+/)) {
      const clean = t.trim();
      if (clean && !out.includes(clean)) out.push(clean);
    }
  }
  return out;
}

function sectionsFromBody(body, known) {
  const out = [];
  let cur = null;
  const flush = () => {
    if (cur && (cur.chords.length || cur.lyrics.length)) out.push(cur);
    cur = null;
  };
  const ensure = () => {
    if (!cur) cur = { name: '', chords: [], lyrics: [] };
    return cur;
  };
  const capoShape = (t) => CHORDY_RE.test(t);

  for (const raw of String(body || '').split(/\r?\n/)) {
    const line = raw.replace(/\u00a0/g, ' ').trim();
    if (!line) { flush(); continue; }
    const m = SECTION_HEAD_RE.exec(line);
    if (m) { flush(); cur = { name: m[1].trim(), chords: [], lyrics: [] }; continue; }
    const parts = line.split(/[\s|]+/).filter(Boolean);
    const allChordy = parts.length > 0 && parts.every((t) => CHORDY_RE.test(t)) && line.length <= 90;
    if (allChordy && parts.length <= 14) {
      ensure().chords.push(parts.join(' '));
    } else {
      ensure().lyrics.push(line);
    }
  }
  flush();
  if (!out.length && known && known.length) {
    out.push({ name: '', chords: [known.join(' ')], lyrics: [] });
  }
  return out;
}

/**
 * Pure: normalize a ChordAPI chart payload into the app chart contract:
 *   { title, artist, key, capo, tuning, sections:[{name,chords[],lyrics[]}] }
 * Returns null when there is nothing usable. No network. Unit-tested.
 */
export function normalizeChordApiChart(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const song = raw.song && typeof raw.song === 'object' ? raw.song : raw;
  const title = pickStr(song, ['title', 'song', 'name'], '') || pickStr(raw, ['query'], '');
  const artist = pickStr(song, ['artist', 'author'], '');
  const key = pickStr(song, ['key', 'tonality'], '');
  const capo = capoNumber(song.capo ?? song.capoOnFret ?? null);
  const tuning = pickStr(song, ['tuning'], 'Standard');
  const chords = chordTokensFrom(song, 'chords');
  const sections = sectionsFromBody(song.lyrics ?? song.body, chordsphins);
  if (!title && !sections.length && !chords.length) return null;
  return {
    title,
    artist,
    key,
    capo,
    capoPresent: capo > 0,
    tuning,
    tuningRaw: tuning.toUpperCase(),
    sections,
  };
}

/**
 * Fetch chords + capo for a query from the internet. Returns the app result
 * envelope; never throws. Optional AbortSignal supported.
 */
export async function findChordsAndCapo(query, { signal } = {}) {
  const q = String(query || '').trim();
  if (!q) return badResult('empty', 'Type a song title first.');
  const url = `${API_ROOT}/${encodeURIComponent(q)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  if (signal && signal.aborted) { ctrl.abort(); }
  else if (signal && typeof signal.addEventListener === 'function') {
    signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (res.status === 404) return badResult('notfound', 'No chart found on the internet for that. Enter it manually.');
    if (!res.ok) return badResult('unavailable', 'Chord service unavailable right now. Enter the song manually.');
    const json = await res.json();
    const chart = normalizeChordApiChart(json);
    if (!chart) return badResult('notfound', 'Could not read a chart from the internet. Enter it manually.');
    return okResult(json);
  } catch (e) {
    return badResult('unavailable', 'Could not reach the internet chord service. Enter the song manually — it stays local.');
  } finally {
    clearTimeout(timer);
  }
}
