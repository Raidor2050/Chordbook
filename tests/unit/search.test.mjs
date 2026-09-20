import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreSong, searchSongs, normalizeText, fuzzyMatch, songPassesFilters } from '../../src/lib/search.js';

const LIBRARY = [
  { id: '1', slug: 'wonderwall', title: 'Wonderwall', artist: 'Oasis', album: '(What\'s the Story) Morning Glory?', key: 'G', capo: 2, tuning: 'Standard', difficulty: 1, chords: ['Em', 'G', 'D', 'A7sus4'] },
  { id: '2', slug: 'yellow', title: 'Yellow', artist: 'Coldplay', key: 'B', capo: 4, tuning: 'Standard', difficulty: 2, chords: ['G', 'D', 'C', 'Em'] },
  { id: '3', slug: 'talk', title: 'Talk', artist: 'Coldplay', key: 'G', capo: 5, tuning: 'Standard', difficulty: 3, chords: ['Em', 'Dsus2', 'C'] },
];

test('normalizeText strips accent/case/punctuation noise', () => {
  assert.equal(normalizeText("Oasis  — Wonderwall!"), 'oasis wonderwall');
});

test('fuzzyMatch allows subsequences and case-insensitive substrings', () => {
  assert.ok(fuzzyMatch('wonder', 'Wonderwall'));
  assert.ok(fuzzyMatch('oasis wonder', 'Oasis Wonderwall'));
  assert.ok(fuzzyMatch('wndrwll', 'Wonderwall'));
  assert.equal(fuzzyMatch('xyz', 'Wonderwall'), false);
});

test('"oasis wonder" surfaces Wonderwall by Oasis above other songs', () => {
  const scored = searchSongs(LIBRARY, 'oasis wonder', {});
  assert.equal(scored[0].title, 'Wonderwall');
  assert.equal(scored[0].artist, 'Oasis');
});

test('search matches chords', () => {
  const scored = searchSongs(LIBRARY, 'a7sus4', {});
  assert.equal(scored.length, 1);
  assert.equal(scored[0].title, 'Wonderwall');
});

test('search respects filters', () => {
  const keyB = searchSongs(LIBRARY, '', { key: 'B' });
  assert.equal(keyB.length, 1);
  assert.equal(keyB[0].title, 'Yellow');
  const capo5 = searchSongs(LIBRARY, '', { capo: '5' });
  assert.equal(capo5[0].title, 'Talk');
  const coldplay = searchSongs(LIBRARY, '', { artist: 'Coldplay' });
  assert.equal(coldplay.length, 2);
});

test('songPassesFilters with a chord filter', () => {
  assert.ok(songPassesFilters(LIBRARY[0], LIBRARY[0].chords, { chord: 'Em' }));
  assert.equal(songPassesFilters(LIBRARY[2], LIBRARY[2].chords, { chord: 'A7sus4' }), false);
});

test('empty query returns everything', () => {
  assert.equal(searchSongs(LIBRARY, '', {}).length, 3);
});