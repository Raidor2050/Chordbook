// Improvise maps ported from the original setlist engine: an SVG piano and a
// 15-fret board showing the scale notes with the root highlighted. Pure
// functions returning SVG strings (generated content only — no user HTML).

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const SCALES = {
  'Major pentatonic': [0, 2, 4, 7, 9],
  'Major scale': [0, 2, 4, 5, 7, 9, 11],
  'Minor pentatonic': [0, 3, 5, 7, 10],
  'Natural minor': [0, 2, 3, 5, 7, 8, 10],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
};

function flatKeys(root, scaleName) {
  const flatRoots = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];
  const minorArr = ['C', 'D', 'G', 'F'];
  if (flatRoots.includes(root)) return true;
  if (minorArr.includes(root) && /minor/i.test(scaleName)) return true;
  return false;
}

/** Pitch class for a key, accepting sharp or flat spellings. */
function rootPc(key) {
  let i = NOTES.indexOf(key);
  if (i !== -1) return i;
  i = FLAT.indexOf(key);
  if (i !== -1) return i;
  return 0; // unknown key — default to C
}

export function buildPianoSvg(key, scaleName) {
  const root = rootPc(key);
  const names = flatKeys(key, scaleName) ? FLAT : NOTES;
  const pcs = SCALES[scaleName].map((x) => (x + root) % 12);
  const W = 50;
  const H = 150;
  const BW = 30;
  const whitePcs = [0, 2, 4, 5, 7, 9, 11];
  let o = '<svg viewBox="0 0 700 ' + H + '" role="img" aria-label="Piano keys in the ' + key + ' ' + scaleName + ' scale">';
  for (let i = 0; i < 14; i++) {
    const pc = whitePcs[i % 7];
    const on = pcs.indexOf(pc) > -1;
    const x = i * W;
    o += '<rect x="' + x + '" y="0" width="' + W + '" height="' + H + '" fill="' +
      (pc === root ? '#e9be6a' : on ? '#f2efe9' : 'rgba(242,239,233,.06)') +
      '" stroke="rgba(242,239,233,.4)"/>';
    if (on)
      o += '<text x="' + (x + W / 2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#000" font-family="DM Sans,sans-serif">' + names[pc] + '</text>';
  }
  const bo = [0, 1, 3, 4, 5];
  const bp = [1, 3, 6, 8, 10];
  for (let i = 0; i < 10; i++) {
    const w = bo[i % 5] + 7 * Math.floor(i / 5);
    const pc = bp[i % 5];
    const on = pcs.indexOf(pc) > -1;
    const x = (w + 1) * W - BW / 2;
    o += '<rect x="' + x + '" y="0" width="' + BW + '" height="' + H * 0.6 + '" rx="2" fill="' +
      (pc === root ? '#e9be6a' : on ? '#b9b3a6' : '#000') +
      '" stroke="rgba(242,239,233,.5)"/>';
    if (on)
      o += '<text x="' + (x + BW / 2) + '" y="' + (H * 0.6 - 9) + '" text-anchor="middle" font-size="11" font-weight="600" fill="#000" font-family="DM Sans,sans-serif">' + names[pc] + '</text>';
  }
  return o + '</svg>';
}

export function buildFretboardSvg(key, scaleName) {
  const root = rootPc(key);
  const names = flatKeys(key, scaleName) ? FLAT : NOTES;
  const pcs = SCALES[scaleName].map((x) => (x + root) % 12);
  const open = [64, 59, 55, 50, 45, 40];
  const X0 = 46;
  const L = 850;
  const N = 15;
  const fx = (n) => X0 + (L * (1 - Math.pow(2, -n / 12))) / (1 - Math.pow(2, -N / 12));
  let o = '<svg viewBox="0 0 920 196" role="img" aria-label="Guitar fretboard in the ' + key + ' ' + scaleName + ' scale">';
  [3, 5, 7, 9, 15].forEach((n) => {
    o += '<circle cx="' + (fx(n - 1) + fx(n)) / 2 + '" cy="94" r="5" fill="rgba(242,239,233,.12)"/>';
  });
  o += '<circle cx="' + (fx(11) + fx(12)) / 2 + '" cy="66" r="5" fill="rgba(242,239,233,.12)"/>';
  o += '<circle cx="' + (fx(11) + fx(12)) / 2 + '" cy="122" r="5" fill="rgba(242,239,233,.12)"/>';
  for (let f = 0; f <= N; f++)
    o += '<line x1="' + fx(f) + '" x2="' + fx(f) + '" y1="24" y2="164" stroke="rgba(242,239,233,' + (f ? 0.3 : 0.9) + ')" stroke-width="' + (f ? 1 : 4) + '"/>';
  for (let i = 0; i < 6; i++)
    o += '<line x1="' + X0 + '" x2="' + fx(N) + '" y1="' + (24 + i * 28) + '" y2="' + (24 + i * 28) + '" stroke="rgba(242,239,233,.45)" stroke-width="' + (1 + i * 0.35) + '"/>';
  for (let i = 0; i < 6; i++)
    for (let f = 0; f <= N; f++) {
      const pc = (open[i] + f) % 12;
      if (pcs.indexOf(pc) < 0) continue;
      const cx = f ? (fx(f - 1) + fx(f)) / 2 : 24;
      const cy = 24 + i * 28;
      const isr = pc === root;
      o += '<circle cx="' + cx + '" cy="' + cy + '" r="11" fill="' + (isr ? '#e9be6a' : '#f2efe9') + '" opacity="' + (isr ? 1 : 0.88) + '"/>';
      o += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="10" font-weight="600" fill="#000" font-family="DM Sans,sans-serif">' + names[pc] + '</text>';
    }
  [3, 5, 7, 9, 12, 15].forEach((n) => {
    o += '<text x="' + (fx(n - 1) + fx(n)) / 2 + '" y="190" text-anchor="middle" font-size="11" fill="#a19c93" font-family="DM Sans,sans-serif">' + n + '</text>';
  });
  return o + '</svg>';
}