// Expanded chord shape library. Format matches the original setlist project:
// six characters, low E string first, `x` = muted, `0` = open, digits = fret.
//
// To add a chord later just add an entry here (and to supabase/schema.sql's
// chords seed). Diagrams are generated from these shapes at runtime.

export const SHAPES = {
  A: 'x02220',
  Am: 'x02210',
  A7: 'x02020',
  Am7: 'x02010',
  Amaj7: 'x02120',
  Asus2: 'x02200',
  Asus4: 'x02230',
  A7sus4: 'x02030',
  B: 'x24442',
  Bm: 'x24432',
  B7: 'x21202',
  Bm7: 'x20202',
  Bmaj7: 'x24342',
  Bsus2: 'x24422',
  Bb: 'x13331',
  Bbm: 'x13321',
  Bb7: 'x13131',
  Bbmaj7: 'x13231',
  C: 'x32010',
  Cm: 'x35543',
  C7: 'x32310',
  Cmaj7: 'x32000',
  Cadd9: 'x32033',
  Csus2: 'x30033',
  Csus4: 'x33011',
  'C/E': '032010',
  'C/F': '132010',
  'C/G': '332010',
  D: 'xx0232',
  Dm: 'xx0231',
  D7: 'xx0212',
  Dm7: 'xx0211',
  Dmaj7: 'xx0222',
  Dsus2: 'xx0230',
  Dsus4: 'xx0233',
  'D/F#': '200232',
  'D/A': 'x00232',
  Eb: 'x68886',
  Ebm: 'x68876',
  Eb7: 'x68686',
  E: '022100',
  Em: '022000',
  E7: '020100',
  Em7: '022030',
  Emaj7: '021100',
  Esus4: '022200',
  F: '133211',
  Fm: '133111',
  F7: '131211',
  Fmaj7: 'xx3210',
  F6: 'xx3212',
  'F6/9': '133233',
  Fsus2: 'xx3011',
  'F#m': '244222',
  'F#7': '242322',
  G: '320003',
  Gm: '355333',
  G7: '320001',
  Gmaj7: '320002',
  Gsus4: '330013',
  'G/B': 'x20003',
  'G/D': 'xx0003',
  'G#m': '466444',
  Ab: '466544',
  Abm: '466444',
  Ab7: '464544',
  Db: 'x46664',
  Db7: 'x46464',
  'Dbm': 'x46654',
};

/** Look a chord up, tolerating spacing/case differences. */
export function shapeFor(name) {
  const n = String(name || '').trim();
  if (SHAPES[n]) return SHAPES[n];
  const folded = n.replace(/\s+/g, '');
  if (SHAPES[folded]) return SHAPES[folded];
  const lower = folded.toLowerCase();
  const hit = Object.keys(SHAPES).find((k) => k.toLowerCase() === lower);
  if (hit) return SHAPES[hit];
  return undefined;
}

/** Shape names that have defined fingering data (used by the chord library page). */
export function knownChords() {
  return Object.keys(SHAPES);
}