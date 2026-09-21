import { useMemo } from 'react';

/**
 * Note-name + pitch-class helpers shared by the piano strip and the chord
 * construction visual. Local (no importer coupling) so the piano view stays a
 * pure, dependency-light component.
 */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const INTERVAL_LABELS = ['root', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

/** Semitone intervals (relative to root) for the qualities we display. */
const QUALITY_INTERVALS = {
  '': [0, 4, 7],
  maj: [0, 4, 7],
  maj7: [0, 4, 7, 11],
  '6': [0, 4, 7, 9],
  '9': [0, 4, 7, 14],
  add9: [0, 4, 7, 14],
  m: [0, 3, 7],
  min: [0, 3, 7],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  '7': [0, 4, 7, 10],
  '7sus4': [0, 5, 7, 10],
  sus: [0, 5, 7],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  '5': [0, 7],
};

const QUALITY_DISPLAY = {
  '': 'Major triad',
  maj: 'Major triad',
  m: 'Minor triad',
  min: 'Minor triad',
  maj7: 'Major 7th',
  '7': 'Dominant 7th',
  m7: 'Minor 7th',
  m7b5: 'Half-diminished 7th',
  '6': 'Major 6th',
  '9': 'Dominant 9th',
  add9: 'Major add9',
  sus: 'Suspended (4)',
  sus2: 'Suspended 2nd',
  sus4: 'Suspended 4th',
  '7sus4': '7th suspended 4th',
  dim: 'Diminished triad',
  dim7: 'Diminished 7th',
  aug: 'Augmented triad',
  '5': 'Power chord (5th)',
};

/** Break a chord token into { root, quality } where quality is a lowercase key. */
function parseChord(chord) {
  const t = String(chord || '').trim();
  const m = /^([A-G][#b]?)(.*)$/.exec(t);
  if (!m) return null;
  const root = m[1];
  let q = String(m[2] || '').toLowerCase();
  if (q === 'maj') q = 'maj';
  if (q === 'm') q = 'm';
  if (q === 'min') q = 'm';
  if (q === 'aug') q = 'aug';
  if (q === 'dim') q = 'dim';
  return { root, quality: q, raw: t };
}

/** The notes (name + pc + interval) that make up a chord, highest note up to 2 octaves. */
export function chordToNotes(chord) {
  const w = /^([A-G][#b]?)(.*)$/.exec(String(chord || '').trim());
  if (!w) return [];
  const rootPc = NOTE_NAMES.indexOf(w[1]);
  if (rootPc < 0) return [];
  let q = String(w[2] || '').toLowerCase();
  if (q === 'maj') q = 'maj';
  if (q === 'min') q = 'm';
  const intervals = QUALITY_INTERVALS[q];
  if (!intervals) return [];
  return intervals.map((semi) => {
    const pc = (rootPc + semi) % 12;
    return {
      name: NOTE_NAMES[(rootPc + semi) % 12],
      pc,
      intervalIdx: semi % 12,
      interval: INTERVAL_LABELS[semi % 12],
      octave: Math.floor((rootPc + semi) / 12),
    };
  });
}

/** A single button-like key for the on-screen piano. */
function PianoKey({ note, parent }) {
  const isBlack = note.name.includes('#');
  const cls = ['pkey', isBlack ? 'black' : 'white'];
  if (note.kind === 'root') cls.push('root');
  if (note.kind === 'chord') cls.push('chord');
  if (note.kind === 'tension') cls.push('tension');
  return (
    <div className={cls.join(' ')} data-pc={note.pc} title={note.name}>
      <span className="pkey-name">{note.name}</span>
    </div>
  );
}

/**
 * Piano split: a rendered keyboard for one chord with its notes highlighted,
 * plus a construction strip (interval → degree label) beneath it.
 */
export function PianoChord({ chord }) {
  const model = useMemo(() => {
    const notes = chordToNotes(chord);
    if (!notes.length) return null;
    const pcs = new Set(notes.map((n) => n.pc));
    return notes.map((n) => ({
      ...n,
      kind: n.intervalIdx === 0 ? 'root' : [4, 3].includes(n.intervalIdx) ? 'chord' : 'tension',
    }));
  }, [chord]);

  return (
    <div className="piano-chord" aria-label={`${chord} on piano`}>
      <div className="piano-strip" role="img" aria-label={`Notes of ${chord}`}>
        <div className="piano-white">
          {NOTE_NAMES.map((name, i) => (
            <PianoKey
              key={name}
              parent={name}
              note={{ name, pc: i, kind: model && model.some((m) => m.pc === i) ? model.find((m) => m.pc === i).kind : null }}
            />
          ))}
        </div>
        <div className="piano-black">
          {NOTE_NAMES.map((name, i) =>
            name.includes('#') ? (
              <PianoKey key={name} parent={name} note={{ name, pc: i, kind: model && model.find((m) => m.pc === i) ? 'chord' : null }} />
            ) : null
          )}
        </div>
      </div>
      <div className="piano-construction">
        <u>{chord}</u>
        {model && model.length ? (
          <span>
            {model
              .map((m) => `${m.name} · ${m.interval}${m.kind === 'root' ? ' (root)' : ''}`)
              .join('  +  ')}
          </span>
        ) : (
          <span>─</span>
        )}
      </div>
    </div>
  );
}

/**
 * Split-screen: one column renders the guitar-side (managed by the parent),
 * this component renders the piano side. Lyrics run down the middle, rendered
 * by the parent's ChordSheet; this just provides the tab + construction visuals.
 */
export default function PianoView({ chords, fallback }) {
  const list = useMemo(() => [...new Set((chords || []).filter(Boolean))], [chords]);
  if (!list.length) {
    return (
      <div className="piano-view">
        <h3>Piano</h3>
        <p className="piano-empty">No chords yet — add some in the tab above.</p>
      </div>
    );
  }
  return (
    <div className="piano-view">
      <h3>Piano tabs &amp; construction</h3>
      <div className="piano-grid">
        {list.map((c) => (
          <PianoChord key={c} chord={c} />
        ))}
      </div>
    </div>
  );
}
