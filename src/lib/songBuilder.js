// Build + validate Song objects from user input.
import { isChordToken } from './chordNames.js';
import { detectKey } from './keyDetect.js';
import { slugFor, sanitizeText, sanitizeLyrics } from './slug.js';

// ---- Limits (mirrored server-side for the Supabase path) -------------------
export const LIMITS = {
  title: 200,
  artist: 200,
  album: 200,
  key: 16,
  tuning: 64,
  notes: 2000,
  source: 1000,
  lyrics: 20000,
  sections: 100,
  chordsPerSection: 1000,
};

export const DIFFICULTIES = [1, 2, 3, 4, 5];

export function clampDifficulty(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 2;
  return Math.max(1, Math.min(5, Math.round(v)));
}

/**
 * Parse a pasted chord chart block into sections.
 * Supported syntax:
 *   [Verse]                     optional bracket or bare label line
 *   C G Am F|C G Am F           chord rows (`|` separates repeated rows)
 *   Line of lyrics here         lyric line(s) under the chord(s)
 *
 * Returns [{ name, chords, lyrics }] with chords as a spec string.
 */
export function parseChartToSections(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));
  const sections = [];
  let cur = null;
  let buf = [];

  const flush = () => {
    if (cur && buf.length) {
      const chords = buf.join('|');
      if (chords.trim()) {
        sections.push({
          name: cur.name,
          chords: chords.trim(),
          lyrics: cur.lyrics.join('\n'),
          verified: cur.verified,
        });
      }
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Section header: "[Verse]" / "### Verse" / "chord: Intro" / "Chorus: F C G"
    const header =
      trimmed.match(/^\[([^\]]+)\]$/) ||
      trimmed.match(/^(?:chord[s]?|section)\s*[:.]\s*(.+)$/i) ||
      trimmed.match(/^#+\s*(.+)$/);
    if (header) {
      flush();
      cur = { name: sanitizeText(header[1], 100) || 'Section', lyrics: [], verified: false };
      buf = [];
      continue;
    }

    // Bare keyword label: "Chorus 2: F C G" (only for known section keywords so
    // lyric lines like "She said: hello" are not split apart).
    const labelMatch = trimmed.match(/^([^:\n]{0,40})\s*[:.]\s*([\s\S]*)$/);
    if (labelMatch && /^(intro|verse|pre\s*-?\s*chorus|chorus|bridge|interlude|solo|outro|coda|hook|middle\s*8|tag|part|break|end)s?(?:\s+\d+)?$/i.test(labelMatch[1])) {
      flush();
      cur = { name: sanitizeText(labelMatch[1], 100) || 'Section', lyrics: [], verified: false };
      buf = [];
      const rest = labelMatch[2].trim();
      if (rest) {
        const rows = rest
          .split('|')
          .map((r) => r.trim().split(/\s+/).filter((t) => t.length > 0))
          .filter((r) => r.length > 0);
        if (rows.length && rows.every((r) => r.every(isChordToken))) {
          for (const row of rows) buf.push(row.join(' '));
        } else {
          cur.lyrics.push(rest);
        }
      }
      continue;
    }

    if (!cur) {
      cur = { name: 'Section 1', lyrics: [], verified: false };
      buf = [];
    }

    // Chord line: every `|`-separated row is all-chord tokens.
    const rows = trimmed
      .split('|')
      .map((r) => r.trim().split(/\s+/).filter((t) => t.length > 0))
      .filter((r) => r.length > 0);
    if (rows.length && rows.every((r) => r.every(isChordToken))) {
      for (const row of rows) buf.push(row.join(' '));
    } else {
      cur.lyrics.push(trimmed);
    }
  }
  flush();
  return sections;
}

/** Finalize a draft into a valid Song-shaped object. */
export function buildSong(draft) {
  const title = sanitizeText(draft.title, LIMITS.title);
  const artist = sanitizeText(draft.artist, LIMITS.artist);
  if (!title || !artist) {
    throw new Error('Title and artist are required.');
  }

  const sections = Array.isArray(draft.sections)
    ? draft.sections
        .map((s) => ({
          name: sanitizeText(s.name, 100) || 'Section',
          chords: sanitizeChordSpec(s.chords),
          lyrics: sanitizeLyrics(Array.isArray(s.lyrics) ? s.lyrics.join('\n') : s.lyrics, LIMITS.lyrics),
          verified: !!s.verified,
        }))
        .filter((s) => s.chords.length > 0)
    : [];

  const chords = [];
  for (const s of sections) {
    for (const tok of s.chords.split(/[\s|]+/)) {
      if (tok && !chords.includes(tok)) chords.push(tok);
    }
  }

  const detected = chords.length ? detectKey(chords) : null;
  const key = sanitizeText(draft.key, LIMITS.key) === ''
      ? (detected && detected.confidence >= 0.5 ? detected.key : '')
      : sanitizeText(draft.key, LIMITS.key);

  const song = {
    title,
    artist,
    album: sanitizeText(draft.album, LIMITS.album) || null,
    key,
    capo: draft.capo === '' || draft.capo == null ? null : clampCapo(draft.capo),
    tuning: sanitizeText(draft.tuning, LIMITS.tuning) || 'Standard',
    difficulty: clampDifficulty(draft.difficulty),
    lyrics: sanitizeLyrics(draft.lyrics, LIMITS.lyrics),
    chord_data: sections,
    chords,
    notes: sanitizeText(draft.notes, LIMITS.notes) || '',
    source: sanitizeText(draft.source, LIMITS.source) || '',
    slug: slugFor(title, artist),
  };
  return song;
}

export function clampCapo(n) {
  if (n === '' || n === null || n === undefined) return null;
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.max(0, Math.min(12, Math.round(v)));
}

export function sanitizeChordSpec(spec) {
  return String(spec || '')
    .replace(/\r/g, ' ')
    .split('|')
    .map((row) => row.trim().split(/\s+/).filter((t) => isChordToken(t)).join(' '))
    .filter((row) => row.length > 0)
    .join('|');
}

/** Validate a fully formed song object; throws with a helpful message. */
export function validateSong(song) {
  if (!song || !sanitizeText(song.title) || !sanitizeText(song.artist)) {
    throw new Error('A song needs a title and an artist.');
  }
  if (song.title.length > LIMITS.title || song.artist.length > LIMITS.artist) {
    throw new Error('Title/artist too long.');
  }
  if (String(song.lyrics || '').length > LIMITS.lyrics) {
    throw new Error('Lyrics too long.');
  }
  if (Array.isArray(song.chord_data) && song.chord_data.length > LIMITS.sections) {
    throw new Error('Too many sections.');
  }
  // Reject obvious HTML/script payloads (React escapes output anyway; this
  // is defense-in-depth before data leaves the client).
  const blob = JSON.stringify(song).toLowerCase();
  for (const bad of ['<script', 'javascript:', 'data:text/html', 'onerror=', 'onclick=']) {
    if (blob.includes(bad)) throw new Error('Unsafe content in song data.');
  }
  return true;
}