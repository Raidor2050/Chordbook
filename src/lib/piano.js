import { SEMITONE_NAMES, NOTE_PCS, PC_BY_NAME } from './chordNames.js';

const OCTAVE = 12;

/** Interval (semitone) maps for chord qualities, mid-octave-compact voicings. */
export const QUALITY_INTERVALS = {
  '': [0, 4, 7],
  maj: [0, 4, 7],
  'maj7': [0, 4, 7, 11],
  '6': [0, 4, 7, 9],
  '9': [0, 4, 7, 14],
  'add9': [0, 4, 7, 14],
  m: [0, 3, 7],
  min: [0, 3, 7],
  'm7': [0, 3, 7, 10],
  'mmaj7': [0, 3, 7, 11],
  'm7b5': [0, 3, 6, 10],
  '7': [0, 4, 7, 10],
  '7sus4': [0, 5, 7, 10],
  sus: [0, 5, 7],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  'dim7': [0, 3, 6, 9],
  aug: [0, 4, 8],
  '5': [0, 7],
};

const DEGREE_LABEL = {
  0: 'Root (1)',
  1: 'b9',
  2: '9',
  3: 'b3 (m3)',
  4: '3 (M3)',
  5: '4 (sus4)',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7 (maj7)',
};

/** Root + quality inferred from a chord token (kept in sync w/ chordNames.parseChord). */
export function parseChordToken(token) {
  const t = String(token || '').trim();
  if (!t) return null;
  const m = /^([A-G][#b]?)(.*)$/.exec(t);
  if (!m) return null;
  const root = m[1];
  let q = String(m[2] || '').toLowerCase();
  // normalize common aliases
  const alias = { '': '', maj: '', min: 'm', 'maj7': 'maj7', 'Δ7': 'maj7', 'maj': '', sus2: 'sus2' };
  if (m[2] && !m[2].startsWith('/') && alias[q] !== undefined && q === 'sus2') q = 'sus2';
  return { root, quality: q };
}

/**
 * All note names of a chord, from the root upward (note-names over an octave),
 * plus per-note interval-degree for the construction visual.
 */
export function chordToNotes(token) {
  const parsed = parseChordToken(token);
  if (!parsed) return [];
  const { root, quality } = parsed;
  const intervals = QUALITY_INTERVALS[quality];
  if (!intervals) return [];
  const rootPc = PC_BY_NAME[root];
  if (rootPc === undefined) return [];
  return intervals
    .map((semi) => {
      const pc = (rootPc + semi) % OCTAVE;
      const name = SEMITONE_NAMES[pc];
      return { pc, name, noteName: pc === 0 && semi > 0 ? null : name, degree: (semi % OCTAVE) };
    })
    .map((n, i) => ({ ...n, intervalName: DEGREE_LABEL[n.degree] || '', chordIndex: i }));
}

/**
 * Keyboard strip: the 12 keys of one octave; `highlighted` are pcs (0-11) in the chord,
 * `root` marks the tonic key for the construction visual.
 */
export function keyboardStrip(chordNotes) {
  const pcs = new Set((chordNotes || []).map((n) => n.pc));
  const rootPc = chordNotes && chordNotes[0] ? chordNotes[0].pc : null;
  return SEMITONE_NAMES.map((name, pc) => ({
    name,
    pc,
    isBlack: /[#]/.test(name),
    inChord: pcs.has(pc),
    isRoot: pc === rootPc,
  }));
}
