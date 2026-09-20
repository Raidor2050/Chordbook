// Key detection, chord families and progressions.
// Framework-agnostic pure functions.
import { parseChordToken } from './chordNames.js';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Preferred flat spellings for tonic roots. Guitar-oriented: F# is kept sharp
// (Gb is far less useful for fretboard work) and C# stays sharp.
const FLAT_ROOT_KEYS = ['F', 'Bb', 'Eb', 'Ab'];

const MAJOR_PCS = [0, 2, 4, 5, 7, 9, 11];
const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];

function pcOf(root) {
  if (root == null) return -1;
  let i = NOTES.indexOf(root);
  if (i !== -1) return i;
  i = FLAT_NOTES.indexOf(root);
  return i;
}

/** Spell a pitch class using the table matching the given tonic's spelling. */
function nameNote(pc, tonicNote) {
  const table = FLAT_ROOT_KEYS.includes(String(tonicNote || '')) ? FLAT_NOTES : NOTES;
  return table[((pc % 12) + 12) % 12];
}

function isMajorQuality(quality) {
  if (!quality) return true;
  if (/^m/.test(quality) && !/^maj/.test(quality)) return false;
  if (/^dim/.test(quality) || /^aug/.test(quality)) return false;
  return true;
}

function isMinorQuality(quality) {
  return /^m/.test(quality) && !/^maj/.test(quality);
}

/**
 * Detect the most likely *major* key for a set of chord tokens.
 *
 * Scoring: a Krumhansl–Schmuckler profile correlation over chord roots PLUS a
 * diatonic-family quality bonus (I/IV/V major, ii/iii/vi minor, vii° dim).
 * The quality term is what correctly prefers C for the classic
 * C–G–Am–F (I–V–vi–IV) progression, which root-chroma alone gets wrong.
 */
export function detectKey(chordTokens) {
  const parsed = chordTokens.map(parseChordToken).filter(Boolean);
  if (!parsed.length) return null;

  const present = new Array(12).fill(0);
  for (const c of parsed) {
    const pc = pcOf(c.root);
    if (pc !== -1) present[pc] += 1;
  }

  const qualityBonus = (rootPc, keyPc, quality) => {
    const dy = (rootPc - keyPc + 12) % 12;
    const s = MAJOR_PCS.indexOf(dy);
    if (s === -1) return 0; // chromatic root — not in the key's chords
    const isMinor = isMinorQuality(quality);
    const isMaj = isMajorQuality(quality);
    if (s === 6) return /^(m7b5|dim)/.test(quality) ? 1 : 0.3;
    if (s === 1 || s === 2 || s === 5) {
      if (isMinor) return 1;
      if (/sus/.test(quality)) return 0.6;
      return isMaj ? 0.3 : 0;
    }
    // Tonic, subdominant, dominant family (majors)
    if (isMaj) return 1;
    if (/sus/.test(quality)) return 0.6;
    return isMinor ? 0.25 : 0;
  };

  let bestKey = 0;
  let bestScore = -Infinity;
  for (let k = 0; k < 12; k++) {
    let score = 0;
    for (const c of parsed) {
      const pc = pcOf(c.root);
      if (pc === -1) continue;
      const chroma = (pc - k + 12) % 12;
      score += KS_MAJOR[chroma] * Math.min(2, present[pc]);
      score += qualityBonus(pc, k, c.quality) * 4;
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = k;
    }
  }

  const diversity = Math.min(1, present.filter((p) => p > 0).length / 5);
  const best = [];
  for (let k = 0; k < 12; k++) {
    let score = 0;
    for (const c of parsed) {
      const pc = pcOf(c.root);
      if (pc === -1) continue;
      score += KS_MAJOR[(pc - k + 12) % 12] * Math.min(2, present[pc]);
      score += qualityBonus(pc, k, c.quality) * 4;
    }
    best.push(score);
  }
  best.sort((a, b) => b - a);
  const margin = best[0] - best[1];
  const confidence = Math.min(
    1,
    0.2 + (margin / Math.max(best[0], 1)) * 8 + diversity * 0.25
  );

  return { key: nameNote(bestKey, NOTES[bestKey]), score: bestScore, confidence };
}

/** Whether `key` is written as a minor key, e.g. "Am", "Ebm". */
export function isMinorKeyString(key) {
  return /^[A-Ga-g][#b]?m$/.test(String(key || '').trim());
}

/** Diatonic triads (or sevenths) for a key: C → [C, Dm, Em, F, G, Am, Bdim]. */
export function chordsInKey(key, useSevenths = false) {
  const keyStr = String(key || '').trim().replace(/m$/, '');
  const tonic = pcOf(keyStr);
  if (tonic === -1) return [];
  const out = [];
  for (let s = 0; s < 7; s++) {
    const root = nameNote((tonic + MAJOR_PCS[s]) % 12, keyStr);
    let suffix;
    if (s === 6) suffix = useSevenths ? 'm7b5' : 'dim';
    else if (s === 1 || s === 2 || s === 5) suffix = useSevenths ? 'm7' : 'm';
    else suffix = useSevenths && s === 4 ? '7' : '';
    out.push(root + suffix);
  }
  return out;
}

/**
 * Suggest popular, playable progressions for a key. Accepts both major
 * ("G", "Eb") and minor ("Am", "Ebm") spellings — that decides mode.
 */
export function suggestProgressions(key) {
  const keyStr = String(key || '').trim();
  const isMinor = isMinorKeyString(keyStr);
  const spelledRoot = isMinor ? keyStr.slice(0, -1) : keyStr;
  const tonic = pcOf(spelledRoot);
  if (tonic === -1) return [];
  const L = (deg) => nameNote((tonic + deg) % 12, spelledRoot);

  if (isMinor) {
    const i = L(0), III = L(3), iv = L(5);
    const v = L(7), VI = L(8), VII = L(10);
    return [
      [`${i}m`, VI, `${III}`, VII],
      [`${i}m`, `${iv}m`, `${v}7`, `${i}m`],
      [`${i}m`, `${VII}`, `${VI}`, `${iv}m`],
      [`${i}m`, `${VI}`, `${III}`, `${VII}`],
    ];
  }
  const I = L(0);
  const ii = `${L(2)}m`;
  const IV = L(5);
  const V = L(7);
  const vi = `${L(9)}m`;
  return [
    [I, V, vi, IV],
    [I, vi, IV, V],
    [vi, IV, I, V],
    [I, V, ii, IV],
  ];
}

/** Labeled progression options for a picker UI. */
export function progressionOptions(key) {
  return suggestProgressions(key).map((prog) => ({
    chords: prog,
    label: prog.join('  '),
  }));
}