// Seed songs migrated from the original setlist project (data/songs.json).
// Structure is the live Chordbook Song shape. Lyrics were not part of the
// original data, so chord sections carry empty lyric lines ready to fill in.
import { slugFor } from '../lib/slug.js';

function capoFromNote(note) {
  const m = /capo\s*(\d+)/i.exec(String(note || ''));
  return m ? Number(m[1]) : null;
}

const RAW = [
  {
    title: 'More Than Words',
    artist: 'Extreme',
    key: 'G',
    guitar: 'No capo, G shapes. The recording sits a half step down, so tune down or transpose to match it.',
    sections: [
      { name: 'Intro', verified: true, chords: 'G G/B Cadd9 Am7 C Dsus4 G D7' },
      { name: 'Verse', verified: true, chords: 'G Cadd9 Am7 C D G|G Cadd9 Am7 C D G' },
      { name: 'Chorus', verified: true, chords: 'G G/B D/F# Em|Bm C D7 G' },
      { name: 'Bridge', verified: false, chords: 'Em D C G' },
    ],
  },
  {
    title: 'Fix You',
    artist: 'Coldplay',
    key: 'Eb',
    guitar: 'Capo 3, C shapes.',
    sections: [
      { name: 'Intro', verified: true, chords: 'C Em Am7 C/G' },
      { name: 'Verse', verified: true, chords: 'C Em Am7 C/G|C Em Am7 C/G' },
      { name: 'Chorus', verified: true, chords: 'F Em G Gsus4 G|F Em G Gsus4 G' },
      { name: 'Bridge', verified: false, chords: 'Am F C G|C F C G' },
    ],
  },
  {
    title: 'Yellow',
    artist: 'Coldplay',
    key: 'B',
    guitar: 'Capo 4, G shapes.',
    sections: [
      { name: 'Intro', verified: true, chords: 'G D C G' },
      { name: 'Verse', verified: true, chords: 'G D C G|G D C G' },
      { name: 'Chorus', verified: true, chords: 'C Em D|C Em D|C Em D C' },
      { name: 'Bridge', verified: true, chords: 'G D C G|G D C G' },
    ],
  },
  {
    title: 'Sunflower',
    artist: 'Post Malone',
    key: 'D',
    guitar: 'No capo. One four-chord loop runs the whole song.',
    sections: [
      { name: 'Intro', verified: true, chords: 'D G Em G' },
      { name: 'Verse', verified: true, chords: 'D G Em G|D G Em G' },
      { name: 'Chorus', verified: true, chords: 'D G Em G|D G Em G' },
      { name: 'Bridge / Outro', verified: false, chords: 'D G Em G' },
    ],
  },
  {
    title: 'How to Save a Life',
    artist: 'The Fray',
    key: 'Bb',
    guitar: 'Capo 3, G shapes. Charts disagree on the key, so use the key menu below if it sits wrong for the singer.',
    sections: [
      { name: 'Verse', verified: false, chords: 'G D Em C|G D Em C' },
      { name: 'Chorus', verified: true, chords: 'C D Em G D G|C D Em G D G' },
      { name: 'Bridge / Interlude', verified: true, chords: 'D Em G D G' },
    ],
  },
  {
    title: 'All I Want',
    artist: 'Kodaline',
    key: 'C',
    guitar: 'No capo. With a capo on 5 you can play the same song in G shapes.',
    sections: [
      { name: 'Intro', verified: true, chords: 'C' },
      { name: 'Verse', verified: false, chords: 'C G Am F|C G Am F' },
      { name: 'Chorus', verified: true, chords: 'C G|Am F C G|C F C' },
      { name: 'Bridge', verified: false, chords: 'Dm Am F G' },
    ],
  },
  {
    title: 'Secrets',
    artist: 'OneRepublic',
    key: 'C',
    guitar: 'No capo, C shapes. Guitar charts online are often a whole step up in D (D F#m Bm G).',
    sections: [
      { name: 'Verse', verified: true, chords: 'C Em Am F|C Em Am F' },
      { name: 'Chorus', verified: true, chords: 'C Em Am F|C Em Am F' },
      { name: 'Bridge', verified: false, chords: 'C Em Am F' },
    ],
  },
  {
    title: 'Demons',
    artist: 'Imagine Dragons',
    key: 'Eb',
    guitar: 'Capo 3, C shapes. One loop under every section.',
    sections: [
      { name: 'Verse', verified: true, chords: 'C G Am F|C G Am F' },
      { name: 'Pre-chorus', verified: true, chords: 'C G Am F|C G Am F' },
      { name: 'Chorus', verified: true, chords: 'C G Am F|C G Am F' },
      { name: 'Bridge', verified: true, chords: 'C G Am F' },
    ],
  },
  {
    title: 'Iris',
    artist: 'Goo Goo Dolls',
    key: 'D',
    guitar: 'Standard tuning shapes. The record uses an open tuning (B D D D D D), so the voicings will sound thinner.',
    sections: [
      { name: 'Intro', verified: true, chords: 'Bm Bsus2 G Gmaj7 G' },
      { name: 'Verse', verified: true, chords: 'D Em G|Bm A G|D Em G|Bm A G' },
      { name: 'Chorus', verified: true, chords: 'Bm A G|Bm A G|Bm A G|Bm A G' },
      { name: 'Bridge / Interlude', verified: true, chords: 'Bm Bsus2 G Gmaj7 G' },
    ],
  },
  {
    title: 'The Scientist',
    artist: 'Coldplay',
    key: 'F',
    guitar: 'No capo. Piano-led, so let every chord ring.',
    sections: [
      { name: 'Intro', verified: true, chords: 'Dm7 Bb F Fsus2' },
      { name: 'Verse', verified: true, chords: 'Dm7 Bb F Fsus2|Dm7 Bb F Fsus2' },
      { name: 'Chorus', verified: true, chords: 'Bb F Fsus2|Bb F C/F F6/9 C/G Csus4 C' },
      { name: 'Bridge', verified: false, chords: 'Dm7 Bb F C' },
    ],
  },
];

function chordsOf(sections) {
  const seen = [];
  for (const s of sections) {
    for (const row of s.chords.split('|')) {
      for (const tok of row.trim().split(/\s+/)) {
        if (tok && !seen.includes(tok)) seen.push(tok);
      }
    }
  }
  return seen;
}

function toSong(raw) {
  const capo = capoFromNote(raw.guitar);
  const tuning = /Standard tuning shapes/.test(raw.guitar) ? 'Standard' : 'Standard';
  const sections = raw.sections.map((s) => ({
    name: s.name,
    chords: s.chords,
    lyrics: '',
    verified: s.verified,
  }));
  return {
    id: slugFor(raw.title, raw.artist),
    slug: slugFor(raw.title, raw.artist),
    title: raw.title,
    artist: raw.artist,
    album: null,
    key: raw.key,
    capo,
    tuning,
    difficulty: 2,
    lyrics: '',
    chord_data: sections,
    chords: chordsOf(sections),
    notes: raw.guitar,
    source: 'Migrated from the original setlist project.',
    created_by: 'seed',
    created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
  };
}

export const SEED_SONGS = RAW.map(toSong);
export const SEED_SONGS_COUNT = SEED_SONGS.length;