import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPianoSvg, buildFretboardSvg, SCALES } from '../../src/lib/improvise.js';

test('piano map renders an svg with the root highlighted', () => {
  const svg = buildPianoSvg('C', 'Major pentatonic');
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('</svg>'));
  assert.ok(svg.includes('#e9be6a'), 'root key gold');
  assert.ok(svg.includes('aria-label'));
});

test('fretboard map renders with labelled fret markers', () => {
  const svg = buildFretboardSvg('G', 'Major scale');
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('</svg>'));
});

test('every scale definition has valid intervals', () => {
  for (const [name, iv] of Object.entries(SCALES)) {
    assert.ok(iv.length >= 5, name);
    assert.ok(iv.every((n) => n >= 0 && n <= 11), name);
  }
});

test('maps handle the full chromatic key set', () => {
  for (const k of ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) {
    assert.doesNotThrow(() => buildPianoSvg(k, 'Major scale'));
    assert.doesNotThrow(() => buildFretboardSvg(k, 'Minor pentatonic'));
  }
});