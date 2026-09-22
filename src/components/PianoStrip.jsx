import { useMemo } from 'react';

/* Self-contained mini piano. Note-math is inlined here so this strip can be
   dropped into any component without import-coupling hazards. */

const NOTE_PC = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const PC_NAMES = Object.entries(NOTE_PC).sort((a, b) => a[1] - b[1]).map(([n]) => n);
const WHITE = [0, 2, 4, 5, 7, 9, 11];

const QUALITY_SEMIS = {
  '': [0, 4, 7], maj: [0, 4, 7], maj7: [0, 4, 7, 11], '6': [0, 4, 7, 9], '7': [0, 4, 7, 10],
  '9': [0, 4, 7, 14], add9: [0, 4, 7, 14], '11': [0, 4, 7, 10, 14],
  m: [0, 3, 7], m7: [0, 3, 7, 10], m7b5: [0, 3, 6, 10], mmaj7: [0, 3, 7, 11],
  dim: [0, 3, 6], dim7: [0, 3, 6, 9], aug: [0, 4, 8],
  sus: [0, 5, 7], sus2: [0, 2, 7], sus4: [0, 5, 7], '7sus4': [0, 5, 7, 10], '5': [0, 7],
};
const INTERVAL_LABEL = ['root', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

function chordNotes(token) {
  const m = /^([A-G][#b]?)(.*)$/.exec(String(token || '').trim());
  if (!m) return [];
  const rootPc = NOTE_PC[m[1]];
  if (rootPc === undefined) return [];
  const q = String(m[2] || '').toLowerCase();
  const semis = QUALITY_SEMIS[q];
  if (!semis) return [];
  return semis.map((s) => {
    const pc = (rootPc + s) % 12;
    return { pc, name: PC_NAMES[pc], interval: INTERVAL_LABEL[s % 12] };
  });
}

function isBlack(pc) {
  return !WHITE.includes(pc);
}

/** One octave of piano keys; lights up the notes of `chord`. */
export function PianoStrip({ chord }) {
  const notes = useMemo(() => chordNotes(chord), [chord]);
  const pcs = useMemo(() => new Set(notes.map((n) => n.pc)), [notes]);
  const rootPc = notes[0] ? notes[0].pc : null; // root is first note in construction order
  const keys = PC_NAMES.map((name, pc) => ({
    name,
    pc,
    black: isBlack(pc),
    lit: pcs.has(pc),
    root: pc === rootPc,
  }));

  return (
    <div className="piano-strip" aria-label={`${chord} on piano`}>
      <div className="piano-whites">{WHITE.map((pc) => {
        const k = keys[pc];
        return (
          <span key={pc} className={'pkey white' + (k.lit ? ' lit' : '') + (k.root ? ' root' : '')}>
            {k.lit ? PC_NAMES[pc] : ''}
          </span>
        );
      })}</div>
      <div className="piano-blacks">{PC_NAMES.map((name, pc) =>
        isBlack(pc) ? (
          <span key={pc} className={'pkey black' + (pcs.has(pc) ? ' lit' : '') + (pc === rootPc ? ' root' : '')} />
        ) : null
      )}</div>
      <div className="piano-constr" aria-label={`${chord} chord construction`}>
        <span className="pchord">{chord}</span>
        <span className="pnotes">
          {notes.length ? notes.map((n, i) => (
            <i key={i} className={n.interval === 'root' ? 'root' : ''}>
              {n.name} <em>{n.interval === 'root' ? 'root' : n.interval === '3' ? '3rd' : n.interval === '5' ? '5th' : n.interval === '7' ? '7th' : n.interval}</em>
            </i>
          )) : '—'}
        </span>
      </div>
    </div>
  );
}

export default PianoStrip;
