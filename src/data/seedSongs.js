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
  {
    title: 'Wonderwall',
    artist: 'Oasis',
    key: 'Em',
    genre: 'Rock',
    bpm: 87,
    guitar: 'No capo, Em shapes — the classic open-tab voicing.',
    sections: [
      { name: 'Intro', verified: true, chords: 'Em7 G Dsus4 A7sus4 Cadd9|D G D' },
      { name: 'Verse', verified: true, chords: 'Em7 G Dsus4 A7sus4 Cadd9|G D Em7' },
      { name: 'Chorus', verified: true, chords: 'Cadd9 G D Em7|Cadd9 G D G' },
    ],
  },
  {
    title: 'Let It Be',
    artist: 'The Beatles',
    key: 'C',
    genre: 'Rock',
    bpm: 73,
    guitar: 'No capo in C. Capo 5 with G shapes also works.',
    sections: [
      { name: 'Verse', verified: true, chords: 'C G Am F|C G Am F' },
      { name: 'Chorus', verified: true, chords: 'C G Am F|C G F C' },
      { name: 'Outro', verified: false, chords: 'C G Am F|F C' },
    ],
  },
  {
    title: 'Brown Eyed Girl',
    artist: 'Van Morrison',
    key: 'G',
    genre: 'Folk',
    bpm: 114,
    guitar: 'No capo, G shapes.',
    sections: [
      { name: 'Verse', verified: true, chords: 'G C G D|G C G D' },
      { name: 'Chorus', verified: true, chords: 'G C G D|G C D G' },
      { name: 'Bridge', verified: false, chords: 'Em C D G' },
    ],
  },
  {
    title: "Knockin' On Heaven's Door",
    artist: 'Bob Dylan',
    key: 'G',
    genre: 'Rock',
    bpm: 96,
    guitar: 'No capo, G shapes.',
    sections: [
      { name: 'Verse', verified: true, chords: 'G D Am|G D C' },
      { name: 'Chorus', verified: true, chords: 'G D Am C|G D C' },
    ],
  },
  {
    title: "I'm Yours",
    artist: 'Jason Mraz',
    key: 'B',
    genre: 'Pop',
    bpm: 124,
    guitar: 'Capo 4, G shapes. The record sits in B.',
    sections: [
      { name: 'Verse', verified: true, chords: 'G D Em C|G D Em C' },
      { name: 'Chorus', verified: true, chords: 'C D G Em|C D G D Em C D G' },
      { name: 'Bridge', verified: false, chords: 'C D G Em|C D' },
    ],
  },
  {
    title: 'Riptide',
    artist: 'Vance Joy',
    key: 'Am',
    genre: 'Indie',
    bpm: 102,
    guitar: 'No capo, Am shapes.',
    sections: [
      { name: 'Verse', verified: true, chords: 'Am G C|Am G C' },
      { name: 'Chorus', verified: true, chords: 'F G Am|F G Am' },
      { name: 'Bridge', verified: false, chords: 'F G C' },
    ],
  },
  {
    title: 'Can’t Help Falling in Love',
    artist: 'Elvis Presley',
    key: 'C',
    genre: 'Pop',
    bpm: 100,
    guitar: 'No capo in C. Many players capo 5 and use G shapes.',
    sections: [
      { name: 'Verse', verified: true, chords: 'C Em Am F|C Em Am F' },
      { name: 'Chorus', verified: true, chords: 'C G Am F|C G C' },
    ],
  },
  {
    title: 'Hallelujah',
    artist: 'Leonard Cohen',
    key: 'C',
    genre: 'Folk',
    bpm: 62,
    guitar: 'No capo in C. Buckley plays the same C chords.',
    sections: [
      { name: 'Verse', verified: true, chords: 'C Am C Am|F G C G' },
      { name: 'Chorus', verified: false, chords: 'Am F G C' },
    ],
  },
  {
    title: "Free Fallin'",
    artist: 'Tom Petty',
    key: 'F',
    genre: 'Rock',
    bpm: 85,
    guitar: 'No capo, F shapes.',
    sections: [
      { name: 'Verse', verified: true, chords: 'F C Dm Bb|F C Dm Bb' },
      { name: 'Chorus', verified: true, chords: 'F C Dm Bb|F C' },
    ],
  },
  {
    title: 'Sweet Home Alabama',
    artist: 'Lynyrd Skynyrd',
    key: 'D',
    genre: 'Rock',
    bpm: 97,
    guitar: 'No capo, D shapes. Double-time feel in D.',
    sections: [
      { name: 'Chorus', verified: true, chords: 'D C G D|D C G D' },
      { name: 'Verse', verified: true, chords: 'D C G D|D C G D' },
    ],
  },
  {
    title: 'Take Me Home, Country Roads',
    artist: 'John Denver',
    key: 'A',
    genre: 'Country',
    bpm: 82,
    guitar: 'Capo 2 for the close-to-record pitch, or play A shapes with no capo.',
    sections: [
      { name: 'Verse', verified: true, chords: 'A E F#m D|A E F#m D' },
      { name: 'Chorus', verified: true, chords: 'A E F#m D|A E A' },
      { name: 'Bridge', verified: false, chords: 'D A E F#m' },
    ],
  },
  {
    title: 'With or Without You',
    artist: 'U2',
    key: 'D',
    genre: 'Rock',
    bpm: 110,
    guitar: 'No capo, D shapes. Endless D A Bm G cycle.',
    sections: [
      { name: 'Intro / Verse', verified: true, chords: 'D A Bm G|D A Bm G' },
      { name: 'Chorus', verified: true, chords: 'D A Bm G|D A Bm G' },
    ],
  },
  {
    title: 'Save Tonight',
    artist: 'Eagle-Eye Cherry',
    key: 'Am',
    genre: 'Pop',
    bpm: 78,
    guitar: 'No capo, Am shapes. One loop, all the way.',
    sections: [
      { name: 'Verse', verified: true, chords: 'Am F C G|Am F C G' },
      { name: 'Chorus', verified: true, chords: 'Am F C G|Am F C G' },
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