import { useMemo } from 'react';

/* ------------------------------------------------------------------ *
 * PianoView / PianoStrip
 * A self-contained piano visualization for the Song page.
 * - PianoStrip: an octave+ strip that lights the notes of one chord on a
 *   piano keyboard (guitar `piano tabs` counterpart).
 * - PianoView: the full panel — a lit keyboard for every chord of the song
 *   plus a "how this chord is put together" construction strip (root / third
 *   / fifth / extensions with interval math).
 * Both are pure functions of the chord name; no store coupling, so they are
 * trivially unit-testable and safe to render on any page.
 * ------------------------------------------------------------------ */

export const PC_BY_NAME = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
export const NAME_BY_PC = Object.fromEntries(Object.entries(PC_BY_NAME).map(([k, v]) => [v, k]));
export const PC_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);

/* Semitone offsets from the root for each quality we can visualize. */
export const QUALITY_SEMIS = {
  '': [0, 4, 7],
  maj: [0, 4, 7],
  'maj7': [0, 4, 7, 11],
  '6': [0, 4, 7, 9],
  '9': [0, 4, 7, 14],
  add9: [0, 4, 7, 14],
  m: [0, 3, 7],
  min: [0, 3, 7],
  'm7': [0, 3, 7, 10],
  'm7b5': [0, 3, 6, 10],
  '7sus4': [0, 5, 7, 10],
  '7': [0, 4, 7, 10],
  sus: [0, 5, 7],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  'dim7': [0, 3, 6, 9],
  aug: [0, 4, 8],
};

/* Interval names keyed by semitone offset (position in the construction). */
export const SEMI_LABEL = {
  0: 'root',
  1: 'b2',
  2: '2',
  3: 'm3',
  4: 'M3',
  5: '4',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: 'M7',
  14: '9',
};

/** Split "C", "Cmaj7", "G#m7b5"… into root + quality. */
export function parseChordToken(token) {
  const t = String(token || '').trim();
  const m = /^([A-G][#b]?)(.*)$/.exec(t);
  if (!m) return null;
  let q = String(m[2] || '').toLowerCase();
  if (q === 'min') q = 'm';
  if (q === 'maj') q = 'maj';
  return { root: m[1], quality: q };
}

/** Build the note objects of a chord: { pc, name, degree, semitone }. */
export function chordToNotes(token) {
  const p = parseChordToken(token);
  if (!p) return [];
  const rootPc = PC_BY_NAME[p.root];
  if (rootPc === undefined) return [];
  const semis = QUALITY_SEMIS[p.quality];
  if (!semis) return [];
  return semis.map((s) => {
    const pc = (rootPc + s) % 12;
    const oct = Math.floor((rootPc + s) / 12);
    return {
      pc,
      name: NAME_BY_PC[pc] + (oct > 0 ? oct + 1 : 70),
      degree: SEMI_LABEL[s] || String(s),
      interval: s,
      accent: s === 0 ? 'root' : s % 12 === 4 ? 'third' : s % 12 === 7 ? 'fifth' : 'tension',
    };
  });
}

/** One octave of piano keys with the chord's pitches highlighted. */
export function PianoStrip({ chord, small = true }) {
  const notes = useMemo(() => chordToNotes(chord), [chord]);
  const litPcs = useMemo(() => new Set(notes.map((n) => n.pc)), [notes]);
  const rootPc = notes[0] ? notes[0].pc : nullL;
  return (
    <div className="piano-strip" role="img" aria-label={`${chord} highlighted on piano`}>
      {PC_NAMES.map((name, pc) => {
        const isBlack = !WHITE_PCS.has(pc);
        const lit = litPcs.has(pc);
        const isRoot = lit && pc === rootPc;
        return (
          <span
            key={name}
            data-pc={pc}
            className={
              'pkey' + (isBlack ? ' black' : ' white') + (lit ? ' lit' : '') + (isRoot ? ' root' : '')
            }
          />
        );
      })}
    </div>
  );
}

/** Show which notes make up a chord (construction visual) with interval labels. */
export function ChordConstruction({ chord }) {
  const notes = useMemo(() => chordToNotes(chord), [chord]);
  if (!notes.length) {
    return (
      <div className="construction empty">
        <em>No construction</em>
      </div>
    );
  }
  return (
    <div className="construction" aria-label={`How ${chord} is built`}>
      <div className="construction-head">
        <b>{chord}</b>
        <span>{rootIntervalName(notes[0])} + {notes.map((_, i) => i + 1).join(' · ')} tones</span>
      </div>
      <div className="construction-notes">
        {notes.map((n, i) => (
          <span key={i} className={'cnote ' + n.accent}>
            <em>{n.name}</em>
            <small>{n.degree}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function rootIntervalName(n) {
  if (!n) return '';
  return QUALITY_SEMIS_ROOT_LABEL[n.interval] || 'chromatic';
}

const QUALITY_SEMIS_ROOT_LABEL = {
  0: 'same pitch class',
  2: 'whole step',
  3: 'minor third stack',
  4: 'major third stack',
};

/** Full piano tab panel for a song: strip + construction per chord. */
export default function PianoView({ chords, songTitle = '' }) {
  const unique = useMemo(() => [...new Set((chords || []).filter(Boolean))], [chords]);
  if (!unique.length) {
    return (
      <section className="piano-panel empty">
        <h3>Piano tabs</h3>
        <p>Add chords above to render the piano view.</p>
      </section>
    );
  }
  return (
    <section className="piano-panel" aria-label={`Piano view${songTitle ? ' for ' + songTitle : ''}`}>
      <h3>Piano tabs &amp; construction</h3>
      <div className="piano-list">
        {unique.map((c) => (
          <div key={c} className="piano-item">
            <PianoStrip chord={c} />
            <ChordConstruction chord={c} />
          </div>
        ))}
      </div>
    </section>
  );
}
