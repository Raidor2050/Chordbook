import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderChordDiagram } from '../../src/lib/renderChord.js';
import { shapeFor, knownChords, SHAPES } from '../../src/lib/shapes.js';

test('every required chord shape exists in the library', () => {
  const required = ['A', 'Am', 'A7', 'B', 'Bm', 'B7', 'C', 'Cm', 'C7', 'D', 'Dm', 'D7', 'E', 'Em', 'E7',
    'F', 'Fm', 'F7', 'G', 'Gm', 'G7', 'Cadd9', 'Dsus2', 'Dsus4', 'Em7', 'Asus2', 'A7sus4', 'Fmaj7'];
  for (const c of required) {
    assert.ok(shapeFor(c), `shape for ${c}`);
  }
});

test('shapes are six valid characters', () => {
  for (const [name, shape] of Object.entries(SHAPES)) {
    assert.equal(shape.length, 6, `${name} shape has 6 strings`);
    assert.match(shape, /^[x0-9]{6}$/, `${name} shape is ` + shape);
    for (const ch of shape) {
      if (ch !== 'x') assert.ok(Number(ch) >= 0 && Number(ch) <= 15, `${name} fret ${ch} in range`);
    }
  }
});

test('knownChords lists entries from the dictionary', () => {
  assert.ok(knownChords().length >= 40);
});

test('renderChordDiagram produces valid SVG for known chords', () => {
  for (const c of ['C', 'F', 'G', 'Bm', 'Cadd9', 'D/F#', 'F6/9']) {
    const svg = renderChordDiagram(c);
    assert.ok(svg, `svg for ${c}`);
    assert.ok(svg.startsWith('<svg'), `${c} starts with <svg`);
    assert.ok(svg.includes(`</svg>`), `${c} closes the svg`);
  }
});

test('barre chords draw a barre rect', () => {
  const F = renderChordDiagram('F');
  assert.ok(F.includes('rx="5"'), 'F barre has a rounded barre rect');
});

test('unknown chord returns null', () => {
  assert.equal(renderChordDiagram('Hm7'), null);
});

test('shapeFor tolerates case and spacing', () => {
  assert.equal(shapeFor('Cadd9'), 'x32033');
  assert.equal(shapeFor(' cadd9 '), 'x32033');
  assert.equal(shapeFor('nope'), undefined);
});