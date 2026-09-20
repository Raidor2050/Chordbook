import { test } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { LocalStore } from '../../src/api/localStore.js';
import { MemoryStore } from '../../src/api/memoryStore.js';
import { DuplicateError, isDuplicateError } from '../../src/api/store.js';

async function newStores() {
  const local = new LocalStore();
  await local.ready();
  const mem = new MemoryStore();
  await mem.ready();
  return { local, mem };
}

test('both stores are seeded with the ten imported setlist songs', async () => {
  const { local, mem } = await newStores();
  for (const store of [local, mem]) {
    const songs = await store.list();
    assert.equal(songs.length, 10, `${store.kind} has 10 seed songs`);
    const titles = songs.map((s) => s.title);
    assert.ok(titles.includes('Yellow'));
    assert.ok(titles.includes('The Scientist'));
    const iris = await store.get('iris-goo-goo-dolls');
    assert.equal(iris && iris.key, 'D');
    assert.equal(iris && iris.capo, null);
    assert.ok(iris && iris.chords.length > 0);
  }
});

test('seed songs never leak edit tokens in list/get output', async () => {
  const { local } = await newStores();
  const songs = await local.list();
  for (const s of songs) {
    assert.equal(s.edit_token, undefined, 'no edit token in public output');
    assert.equal(s.editToken, undefined);
  }
});

test('create then get returns the song; duplicate create is rejected', async () => {
  const { local, mem } = await newStores();
  for (const store of [local, mem]) {
    const { song, editToken } = await store.create({
      title: 'Wonderwall',
      artist: 'Oasis',
      sections: [{ name: 'Verse', chords: 'Em G D A7sus4' }],
    });
    assert.ok(song.id);
    assert.ok(editToken);
    const fetched = await store.get(song.id);
    assert.equal(fetched.title, 'Wonderwall');
    assert.deepEqual(fetched.chords, ['Em', 'G', 'D', 'A7sus4']);

    await assert.rejects(
      store.create({ title: 'wonderwall ', artist: 'oasis', sections: [] }),
      (err) => isDuplicateError(err) && err.existing && err.existing.title === 'Wonderwall'
    );
  }
});

test('a second store instance still sees the song (refresh persistence)', async () => {
  const local = new LocalStore();
  await local.ready();
  const { song } = await local.create({ title: 'Persist Me', artist: 'Test Band', sections: [{ name: 'Verse', chords: 'C G' }] });

  // Simulates a page reload: brand-new store over the same IndexedDB.
  const second = new LocalStore();
  await second.ready();
  const fetched = await second.get(song.id);
  assert.equal(fetched.title, 'Persist Me');
  const all = await second.list();
  assert.ok(all.some((s) => s.slug === song.slug));
});

test('update requires the correct edit token', async () => {
  const { local } = await newStores();
  const { song, editToken } = await local.create({ title: 'Edit Me', artist: 'Band', sections: [{ name: 'A', chords: 'C' }] });
  await assert.rejects(local.update(song.id, { title: 'Nope' }, 'wrong-token'));
  const updated = await local.update(song.id, { title: 'Edited' }, editToken);
  assert.equal(updated.title, 'Edited');
  const fetched = await local.get(song.id);
  assert.equal(fetched.title, 'Edited');
});

test('remove requires the correct edit token and removes the song', async () => {
  const { local } = await newStores();
  const { song, editToken } = await local.create({ title: 'Delete Me', artist: 'Band', sections: [{ name: 'A', chords: 'C' }] });
  await assert.rejects(local.remove(song.id, 'wrong'));
  await local.remove(song.id, editToken);
  assert.equal(await local.get(song.id), null);
});

test('create returns structured chord_data', async () => {
  const { local } = await newStores();
  const { song } = await local.create({
    title: 'Structured',
    artist: 'Band',
    key: 'G',
    capo: 2,
    tuning: 'Drop D',
    difficulty: 3,
    lyrics: 'line one\nline two',
    sections: [
      { name: 'Verse', chords: 'G C', lyrics: 'line one' },
      { name: 'Chorus', chords: 'D Em', lyrics: 'line two' },
    ],
    notes: 'play it soft',
  });
  assert.equal(song.tuning, 'Drop D');
  assert.equal(song.difficulty, 3);
  assert.equal(song.chord_data.length, 2);
  assert.deepEqual(song.chords, ['G', 'C', 'D', 'Em']);
});

test('DuplicateError carries the existing public song', () => {
  const e = new DuplicateError('dup', { id: 'x', title: 'Y' });
  assert.ok(isDuplicateError(e));
  assert.equal(e.existing.title, 'Y');
});