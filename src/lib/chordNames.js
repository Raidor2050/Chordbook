// Chord-name parsing and normalization (framework-agnostic, pure functions).

const ROOT_RE = /^([A-Ga-g][#b]?)/;

// Matches a complete chord token such as C, Am, Cadd9, F6/9, B7sus4, D/F#, Am7/G.
export const CHORD_TOKEN_RE =
  /^[A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add|\+)?\d*(?:sus\d?|add\d+)?(?:6\/9)?(?:\/(?:[A-G][#b]?\d*|\d+))?$/;

/** Split "C#m7/E" into { root: 'C#', quality: 'm7', bass: 'E' }. */
export function parseChordToken(token) {
  const t = String(token || '').trim();
  const m = t.match(ROOT_RE);
  if (!m) return null;
  const root = m[1].toUpperCase();
  const rest = t.slice(root.length);
  let bass = null;
  const slash = rest.lastIndexOf('/');
  if (slash !== -1) {
    const b = rest.slice(slash + 1);
    if (/^[A-G][#b]?\d*$/.test(b)) {
      bass = b.toUpperCase();
      return { token: t, root, quality: rest.slice(0, slash), bass };
    }
  }
  return { token: t, root, quality: rest, bass: null };
}

export function isChordToken(token) {
  return CHORD_TOKEN_RE.test(String(token || '').trim());
}

/** True when a line consists only of chord tokens (split on whitespace). */
export function isChordLine(line) {
  const tokens = String(line || '').trim().split(/\s+/);
  if (tokens.length === 0 || (tokens.length === 1 && tokens[0] === '')) return false;
  return tokens.every(isChordToken);
}

/** Extract every distinct chord token from a raw chart string. `|` separates rows. */
export function chordsFromSpec(spec) {
  const seen = [];
  for (const row of String(spec || '').split('|')) {
    for (const tok of row.trim().split(/\s+/)) {
      if (tok && isChordToken(tok) && !seen.includes(tok)) seen.push(tok);
    }
  }
  return seen;
}