// SVG chord diagram renderer, ported from the original setlist engine and
// kept compatible with the same shape format (six chars, low E first).
import { shapeFor } from './shapes.js';

/**
 * Render an SVG chord diagram for `name` using its fingering shape.
 * Returns an SVG string, or null when no shape is known.
 */
export function renderChordDiagram(name, opts = {}) {
  const raw = shapeFor(name);
  if (!raw) return null;
  const frets = String(raw)
    .split('')
    .map((c) => (c === 'x' ? -1 : parseInt(c, 10)));
  if (frets.length !== 6) return null;

  const played = frets.filter((f) => f > 0);
  const min = Math.min(...played);
  const max = Math.max(...played);
  const base = max <= 4 ? 1 : min;
  const x = 16;
  const sx = (i) => x + i * 12;

  let o = '';
  o += `<line x1="16" x2="76" y1="28" y2="28" stroke="rgba(242,239,233,.95)" stroke-width="3"/>`;

  // Fret lines (4 fret spaces visible). The nut is drawn as part of the top line.
  for (let k = 1; k <= 4; k++) {
    o += `<line x1="16" x2="76" y1="${28 + k * 16}" y2="${28 + k * 16}" stroke="rgba(242,239,233,.3)" stroke-width="1"/>`;
  }
  for (let i = 0; i < 6; i++) {
    o += `<line x1="${sx(i)}" x2="${sx(i)}" y1="28" y2="92" stroke="rgba(242,239,233,.45)"/>`;
  }

  const seen = new Set();
  // Muted / open markers above the nut.
  for (let i = 0; i < 6; i++) {
    if (frets[i] < 0)
      o += `<text x="${sx(i)}" y="21" text-anchor="middle" font-size="11" fill="#a19c93" font-family="DM Sans,sans-serif">x</text>`;
    else if (frets[i] === 0)
      o += `<circle cx="${sx(i)}" cy="17" r="3.5" fill="none" stroke="#a19c93"/>`;
  }

  // Barre detection: two or more strings share the lowest fret across a run
  // of >= 3 strings with no gap/muted string in between.
  const indices = [];
  frets.forEach((v, j) => {
    if (v === min) indices.push(j);
  });
  const first = indices[0];
  const last = indices[indices.length - 1];
  if (indices.length >= 2 && last - first >= 3) {
    let contiguous = true;
    for (let k = first; k <= last; k++) if (frets[k] < min) contiguous = false;
    if (contiguous) {
      o += `<rect x="${sx(first) - 6}" y="${28 + (min - base) * 16 + 3}" width="${sx(last) - sx(first) + 12}" height="10" rx="5" fill="#f2efe9"/>`;
    }
  }

  // Remaining finger dots.
  for (let i = 0; i < 6; i++) {
    if (frets[i] > 0)
      o += `<circle cx="${sx(i)}" cy="${28 + (frets[i] - base) * 16 + 8}" r="5.5" fill="#f2efe9"/>`;
  }
  if (base > 1)
    o += `<text x="79" y="40" font-size="10" fill="#a19c93" font-family="DM Sans,sans-serif">${base}fr</text>`;

  const labeled = opts.ariaLabel !== false;
  const aria = labeled ? ` role="img" aria-label="${name} chord diagram"` : '';
  return `<svg viewBox="0 0 92 112"${aria} focusable="false"><title>${name}</title>${o}</svg>`;
}