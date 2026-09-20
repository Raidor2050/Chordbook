import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEED_SONGS } from '../../src/data/seedSongs.js';
import { shapeFor } from '../../src/lib/shapes.js';
import { isChordToken } from '../../src/lib/chordNames.js';

test('every imported song has unique slugs and full metadata', () => {
  const slugs = new Set(SEED_SONGS.map((s) => s.slug));
  assert.equal(slugs.size, SEED_SONGS.length, 'slugs unique');
  for (const s of SEED_SONGS) {
    assert.ok(s.title, s.slug);
    assert.ok(s.artist, s.slug);
    assert.ok(s.key, s.slug);
    assert.ok(Array.isArray(s.chord_data) && s.chord_data.length > 0, `sections for ${s.slug}`);
    assert.ok(Array.isArray(s.chords) && s.chords.length > 0, `chords for ${s.slug}`);
  }
});

test('every predicted chord in the seed has shape coverage', () => {
  const missing = [];
  for (const s of SEED_SONGS) {
    for (const c of s.chords) {
      if (!shapeFor(c)) missing.push(`${s.slug}:${c}`);
    }
  }
  assert.deepEqual(missing, [], 'no undefined chord shapes in the seed');
});

test('all chords across sections are valid chord tokens', () => {
  for (const s of SEED_SONGS) {
    for (const sec of s.chord_data) {
      for (const row of sec.chords.split('|')) {
        for (const tok of row.trim().split(/\s+/)) {
          assert.ok(isChordToken(tok), `${s.slug} section "${sec.name}" token "${tok}"`);
        }
      }
    }
  }
});

test('sections are at least as rich as the original setlist data', () => {
  const originalCounts = {
    'more-than-words-extreme': 4,
    'the-scientist-coldplay': 4,
    'how-to-save-a-life-the-fray': 3,
  };
  for (const [slug, count] of Object.entries(originalCounts)) {
    const s = SEED_SONGS.find((x) => x.slug === slug);
    assert.equal(s.chord_data.length, count, `${slug} keeps ${count} sections`);
  }
});