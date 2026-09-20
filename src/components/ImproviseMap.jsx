import { useEffect, useMemo, useState } from 'react';
import { SCALES, NOTES, buildPianoSvg, buildFretboardSvg } from '../lib/improvise.js';

export default function ImproviseMap({ defaultKey }) {
  const initialKey = NOTES.includes(defaultKey) ? defaultKey : 'C';
  const [key, setKey] = useState(initialKey);
  const [scale, setScale] = useState('Major pentatonic');

  useEffect(() => {
    if (NOTES.includes(defaultKey) && defaultKey !== key) setKey(defaultKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultKey]);
  const maps = useMemo(() => {
    try {
      return {
        piano: buildPianoSvg(key, scale),
        board: buildFretboardSvg(key, scale),
      };
    } catch {
      return null;
    }
  }, [key, scale]);

  const note = useMemo(() => {
    const base = 'Gold marks the root.';
    if (scale === 'Major pentatonic') return `${base} Same notes as ${relativeMinor(key)} pentatonic.`;
    if (scale === 'Minor pentatonic') return `${base} Same notes as ${relativeMajor(key)} pentatonic.`;
    return base;
  }, [key, scale]);

  return (
    <section className="improvise sheet" aria-label="Improvisation maps">
      <div className="sheet-head">
        <h3>Improvise</h3>
      </div>
      <div className="sheet-body">
        <div className="ctl">
          <label>
            Key{' '}
            <select
              aria-label="Improvisation key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            >
              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scale{' '}
            <select aria-label="Scale" value={scale} onChange={(e) => setScale(e.target.value)}>
              {Object.keys(SCALES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        {maps && (
          <>
            <div className="viz">
              <h4 style={{ margin: '14px 0 4px', fontSize: 13, color: 'var(--ink-dim)' }}>Piano</h4>
              <div dangerouslySetInnerHTML={{ __html: maps.piano }} />
            </div>
            <div className="viz">
              <h4 style={{ margin: '18px 0 4px', fontSize: 13, color: 'var(--ink-dim)' }}>
                Guitar fretboard, at sounding pitch
              </h4>
              <div dangerouslySetInnerHTML={{ __html: maps.board }} />
            </div>
          </>
        )}
        <p className="note">{note}</p>
      </div>
    </section>
  );
}

function relativeMinor(key) {
  const n = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const i = n.indexOf(key);
  return n[(i + 9) % 12] + ' minor';
}
function relativeMajor(key) {
  const n = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const i = n.indexOf(key);
  return n[(i + 3) % 12];
}