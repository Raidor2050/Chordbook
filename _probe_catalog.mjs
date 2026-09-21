// Probe: dump catalog facts to a text file inside the project so the shell can
// cat it back cleanly (temp-path writes were unreliable in this environment).
import { writeFileSync } from 'node:fs';
import { SEED_SONGS } from './src/data/seedSongs.js';

const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
const title = (s) => String(s.title || '');
const artist = (s) => String(s.artist || '');

const keyB = SEED_SONGS.filter((s) => String(s.key || '').toUpperCase() === 'B');
const coldplay = SEED_SONGS.filter((s) => norm(artist(s)) === 'coldplay');
const gmaj7 = SEED_SONGS.filter((s) => String(s.guitar || '').toUpperCase().includes('GMAJ7') || (s.chords || []).some((c) => String(c).toUpperCase() === 'Gmaj7'));

const lines = [
  'TOTAL=' + SEED_SONGS.length,
  'KEY_B=' + keyB.length + '|' + keyB.map((s) => s.slug).join(','),
  'COLDPLAY=' + coldplay.length + '|' + coldplay.map((s) => s.slug).join(','),
  'GMAJ7=' + gmaj7.length + '|' + gmaj7.map((s) => s.slug).join(','),
  'ALL=' + SEED_SONGS.map((s) => `${s.slug}=${norm(title(s))}~${norm(artist(s))}~key=${String(s.key || '')}~capo=${String(s.capo ?? '')}~bpm=${String(s.bpm ?? '')}`).join(' || '),
];

const out = lines.join('\n');
writeFileSync('G:/AO projects/Chordbook/PROJECT/catalog-facts.txt', out, 'utf8');
console.log('wrote catalog-facts.txt (' + out.length + ' chars)');
