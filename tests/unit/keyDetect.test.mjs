import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectKey, suggestProgressions, chordsInKey, isMinorKeyString } from '../../src/lib/keyDetect.js';

test('detectKey identifies the tonic of common progressions', () => {
  assert.equal(detectKey(['C', 'G', 'Am', 'F']).key, 'C');
  assert.equal(detectKey(['G', 'D', 'Em', 'C']).key, 'G');
  assert.equal(detectKey(['D', 'A', 'Bm', 'G']).key, 'D');
  assert.equal(detectKey(['F', 'C', 'Dm', 'Bb']).key, 'F');
});

test('detectKey returns high confidence for a clean diatonic set', () => {
  const det = detectKey(['C', 'G', 'Am', 'F']);
  assert.ok(det.confidence > 0.6, `confidence ${det.confidence}`);
});

test('detectKey handles slash and sus chords', () => {
  assert.equal(detectKey(['C', 'G/B', 'Am', 'F']).key, 'C');
  assert.equal(detectKey(['D', 'A', 'Bsus2', 'G']).key, 'D');
});

test('detectKey returns null on empty input', () => {
  assert.equal(detectKey([]), null);
});

test('isMinorKeyString', () => {
  assert.ok(isMinorKeyString('Am'));
  assert.ok(isMinorKeyString('Ebm'));
  assert.equal(isMinorKeyString('C'), false);
  assert.equal(isMinorKeyString('C#'), false);
});

test('chordsInKey builds the diatonic majors/minors/dim', () => {
  assert.deepEqual(chordsInKey('C', false), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
  assert.deepEqual(chordsInKey('G', false), ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim']);
  const sevenths = chordsInKey('C', true);
  assert.ok(sevenths.includes('Am7'));
  assert.ok(sevenths.includes('G7'));
});

test('suggestProgressions returns playable chords in the right key', () => {
  const opts = suggestProgressions('G');
  assert.ok(opts.length >= 3);
  for (const prog of opts) {
    assert.ok(prog.length >= 3);
    assert.ok(prog.every((c) => /^[A-G][#b]?(m|7|dim|m7)?$/.test(c) || /m/.test(c)));
  }
  const first = opts[0];
  assert.equal(first[0], 'G', 'progression starts on the tonic');
});

test('suggestProgressions handles minor keys', () => {
  const opts = suggestProgressions('Am');
  assert.ok(opts.length >= 3);
  assert.ok(opts[0][0] === 'Am');
});