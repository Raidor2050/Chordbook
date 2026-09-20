import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseChartToSections,
  buildSong,
  validateSong,
  sanitizeChordSpec,
  clampDifficulty,
  clampCapo,
} from '../../src/lib/songBuilder.js';
import { slugFor, normalizeCompare, sanitizeText } from '../../src/lib/slug.js';

test('parseChartToSections reads a real pasted chart', () => {
  const text = `[Verse]
C G Am F
First lyric line here
Second lyric line

Chorus: F C G
It's a chorus line`;
  const sections = parseChartToSections(text);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].name, 'Verse');
  assert.equal(sections[0].chords, 'C G Am F');
  assert.match(sections[0].lyrics, /First lyric line/);
  assert.equal(sections[1].name, 'Chorus');
  assert.equal(sections[1].chords, 'F C G');
});

test('parseChartToSections handles multiple chord rows with | separator', () => {
  const sections = parseChartToSections('[Verse]\nC G Am F|C G Am F');
  assert.equal(sections[0].chords, 'C G Am F|C G Am F');
});

test('buildSong produces a validated structured song', () => {
  const song = buildSong({
    title: 'Wonderwall',
    artist: 'Oasis',
    album: 'Morning Glory',
    key: 'G',
    capo: 2,
    difficulty: 1,
    sections: [{ name: 'Verse', chords: 'Em G D A7sus4' }],
  });
  assert.equal(song.slug, slugFor('Wonderwall', 'Oasis'));
  assert.deepEqual(song.chords, ['Em', 'G', 'D', 'A7sus4']);
  assert.ok(song.lyrics !== undefined);
  assert.equal(song.tuning, 'Standard');
  assert.equal(song.capo, 2);
});

test('buildSong detects a key when none is given', () => {
  const song = buildSong({
    title: 'X',
    artist: 'Y',
    sections: [{ name: 'Chords', chords: 'C G Am F' }],
  });
  assert.equal(song.key, 'C');
});

test('buildSong rejects missing title/artist', () => {
  assert.throws(() => buildSong({ title: '', artist: 'X', sections: [] }));
  assert.throws(() => buildSong({ title: 'X', artist: '', sections: [] }));
});

test('buildSong strips HTML out of text fields', () => {
  const song = buildSong({ title: 'Bad <b>x</b>', artist: 'Y<br/>', sections: [] });
  assert.ok(!song.title.includes('<'));
  assert.ok(!song.artist.includes('<'));
});

test('validateSong blocks script payloads', () => {
  assert.throws(() => validateSong({ title: '<script>alert(1)</script>', artist: 'X', lyrics: '' }));
  assert.throws(() => validateSong({ title: 'hey', artist: 'x', lyrics: '', notes: 'data:text/html' }));
});

test('sanitizeChordSpec keeps only chord tokens', () => {
  assert.equal(sanitizeChordSpec('C G notachord|F G'), 'C G|F G');
});

test('clamp helpers bounds numeric inputs', () => {
  assert.equal(clampDifficulty(99), 5);
  assert.equal(clampDifficulty(-3), 1);
  assert.equal(clampDifficulty('x'), 2);
  assert.equal(clampCapo(-1), 0);
  assert.equal(clampCapo(20), 12);
  assert.equal(clampCapo(''), null);
});

test('slug helpers are deterministic and normalized', () => {
  assert.equal(slugFor('More Than Words', 'Extreme'), 'more-than-words-extreme');
  assert.equal(normalizeCompare('Café Boom!'), 'cafeboom');
  assert.equal(sanitizeText('  lots   of  space  ', 500), 'lots of space');
});