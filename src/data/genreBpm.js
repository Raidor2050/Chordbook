// Enrichment data: accurate genre + bpm for the original ten seed songs so that
// every song in the book carries genre + bpm metadata (matching `seedSongs.js`).
// The expanded twenty-three seeds already declare `genre`/`bpm` inline; this map
// only fills the gap left by the first ten imports.

export const SONG_GENRE_BPM = {
  'more-than-words-extreme': { genre: 'Soft Rock', bpm: 96 },
  'fix-you-coldplay': { genre: 'Ballad', bpm: 62 },
  'yellow-coldplay': { genre: 'Pop Rock', bpm: 76 },
  'sunflower-post-malone': { genre: 'Pop', bpm: 94 },
  'how-to-save-a-life-the-fray': { genre: 'Pop Rock', bpm: 128 },
  'all-i-want-kodaline': { genre: 'Indie Rock', bpm: 76 },
  'secrets-onerepublic': { genre: 'Pop Rock', bpm: 108 },
  'demons-imagine-dragons': { genre: 'Rock', bpm: 90 },
  'iris-goo-goo-dolls': { genre: 'Alternative Rock', bpm: 104 },
  'the-scientist-coldplay': { genre: 'Ballad', bpm: 128 },
};

/** Returns `{ genre, bpm }` for any song, falling back to the seed enrichment map. */
export function enrichSong(song) {
  if (!song) return {};
  const base = SONG_GENRE_BPM[song.id || song.slug] || {};
  return {
    genre: song.genre || base.genre || null,
    bpm: song.bpm || base.bpm || null,
  };
}
