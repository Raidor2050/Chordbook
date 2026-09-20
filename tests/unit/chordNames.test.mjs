import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseChordToken,
  isChordToken,
  isChordLine,
  chordsFromSpec,
} from '../../src/lib/chordNames.js';

test('parseChordToken handles roots, qualities and slash basses', () => {
  const chord = parseChordToken('C#m7/E');
  assert.equal(chord.root, 'C#');
  assert.equal(chord.quality, 'm7');
  assert.equal(chord.bass, 'E');
  assert.equal(parseChordToken('G').quality, '');
  assert.equal(parseChordToken('G').bass, null);
  assert.equal(parseChordToken('notachord'), null);
  assert.equal(parseChordToken('F6/9').quality, '6/9');
  assert.equal(parseChordToken('Am7/G').bass, 'G');
});

test('isChordToken covers required chords and rejects garbage', () => {
  const good = ['A', 'Am', 'A7', 'B', 'B7', 'Bm', 'C', 'Cm', 'C7', 'Cadd9', 'Dsus2', 'Dsus4',
    'Em7', 'Asus2', 'A7sus4', 'Fmaj7', 'D/F#', 'G/B', 'F6/9', 'Am7/G', 'Bbmaj7'];
  for (const c of good) assert.ok(isChordToken(c), `${c} should parse`);
  for (const bad of ['', 'H', 'C/', 'Am7//', '123', 'C m', '<script>', 'Cm#']) {
    assert.equal(isChordToken(bad), false, `${bad} should not parse`);
  }
});

test('isChordLine requires every token to be a chord', () => {
  assert.ok(isChordLine('C G Am F'));
  assert.ok(isChordLine('C'));
  assert.equal(isChordLine(''), false);
  assert.equal(isChordLine('some lyrics'), false);
  assert.equal(isChordLine('C G Am lyrics'), false);
});

test('chordsFromSpec extracts unique chords across rows', () => {
  assert.deepEqual(chordsFromSpec('C G Am F|C G Am F'), ['C', 'G', 'Am', 'F']);
  assert.deepEqual(chordsFromSpec('C Dm7 Em|F G'), ['C', 'Dm7', 'Em', 'F', 'G']);
  assert.deepEqual(chordsFromSpec(''), []);
});