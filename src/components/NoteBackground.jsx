import { useMemo } from 'react';

/** Deterministic blurred music-note backdrop (ported from the setlist site). */
export default function NoteBackground() {
  const html = useMemo(() => {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    let out = '<svg width="0" height="0" style="position:absolute"><defs>' +
      '<symbol id="cb-n1" viewBox="0 0 24 40"><ellipse cx="8" cy="32" rx="7" ry="5" transform="rotate(-20 8 32)"/><rect x="14" y="4" width="2" height="28"/><path d="M16 4C22 8 24 14 22 22 21 16 19 13 16 12Z"/></symbol>' +
      '<symbol id="cb-n2" viewBox="0 0 40 40"><ellipse cx="8" cy="32" rx="7" ry="5" transform="rotate(-20 8 32)"/><ellipse cx="30" cy="30" rx="7" ry="5" transform="rotate(-20 30 30)"/><rect x="14" y="6" width="2" height="26"/><rect x="36" y="4" width="2" height="24"/><path d="M14 6 38 3V9L14 12Z"/></symbol>' +
      '<symbol id="cb-n3" viewBox="0 0 24 40"><ellipse cx="8" cy="32" rx="7" ry="5" transform="rotate(-20 8 32)"/><rect x="14" y="4" width="2" height="28"/></symbol></defs></svg>';
    for (let i = 0; i < 22; i++) {
      const sz = 30 + rnd() * 110;
      const blur = [2, 4, 8, 14][Math.floor(rnd() * 4)];
      const left = (rnd() * 96).toFixed(1);
      const top = (rnd() * 96).toFixed(1);
      const op = (0.07 + rnd() * 0.16).toFixed(2);
      const rot = ((rnd() - 0.5) * 60).toFixed(0);
      out +=
        `<svg style="left:${left}%;top:${top}%;opacity:${op};filter:blur(${blur}px);transform:rotate(${rot}deg)" width="${sz}" height="${sz}">` +
        `<use href="#cb-n${1 + Math.floor(rnd() * 3)}" /></svg>`;
    }
    return out;
  }, []);

  return <div id="notes" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}