import { SEED_SONGS } from './src/data/seedSongs.js';
const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
const L = [];
L.push('TOTAL=' + SEED_SONGS.length);
L.push('KEY_B=' + SEED_SONGS.filter((s) => norm(s.key) === 'b').map((s) => s.slug).join(','));
L.push('GMAJ7=' + SEED_SONGS.filter((s) => (s.chords || []).some((c) => norm(c) === 'gmaj7')).map((s) => s.slug).join(','));
L.push('COLDPLAY=' + SEED_SONGS.filter((s) => norm(s.artist).includes('coldplay') || norm(s.title).includes('coldplay')).map((s) => s.slug).join(','));
L.push('IRIS=' + (SEED_SONGS.find((s) => s.slug === 'iris-goo-goo-dolls') ? SEED_SONGS.find((s) => s.slug === 'iris-goo-goo-dolls').key + '/' + SEED_SONGS.find((s) => s.slug === 'iris-goo-goo-dolls').capo : 'MISSING'));
console.log(L.join('\n'));
