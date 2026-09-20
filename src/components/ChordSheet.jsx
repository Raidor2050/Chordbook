import { isChordToken } from '../lib/chordNames.js';

function ChordRow({ line }) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  return (
    <span className="row c" role="text">
      {tokens.map((t, i) => (
        <span key={i} className={isChordToken(t) ? 'hl' : 'c'}>
          {t}
          {i < tokens.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}

/**
 * Render one section's `chords` spec (rows separated by `|`, chords by
 * spaces) above its associated lyrics, tab style.
 */
export default function ChordSheet({ section, editable = false }) {
  const rows = String(section.chords || '').split('|');
  const lyricLines = String(section.lyrics || '').split('\n');
  return (
    <div className="chordsheet">
      {rows.map((r, i) => (
        <span key={i}>
          {r.trim() ? <ChordRow line={r} /> : null}
          {lyricLines[i] ? <span className="ly">{lyricLines[i]}</span> : null}
        </span>
      ))}
      {lyricLines.length > rows.length &&
        lyricLines.slice(rows.length).map((l, i) =>
          l ? (
            <span className="ly" key={i}>
              {l}
            </span>
          ) : null
        )}
    </div>
  );
}