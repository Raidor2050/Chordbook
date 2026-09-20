import { useMemo } from 'react';
import { renderChordDiagram } from '../lib/renderChord.js';

/** SVG chord diagram for a chord name; falls back to a placeholder tile. */
export default function ChordDiagram({ name, showName = true }) {
  const svg = useMemo(() => renderChordDiagram(name), [name]);
  if (!svg) {
    return (
      <figure className="diagram-card missing">
        <div className="dg" aria-hidden="true">
          ?
        </div>
        {showName && <figcaption>{name}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className="diagram-card">
      <div className="dg" dangerouslySetInnerHTML={{ __html: svg }} />
      {showName && <figcaption>{name}</figcaption>}
    </figure>
  );
}

/** Row of diagrams for a unique list of chords. */
export function DiagramRow({ chords }) {
  const unique = useMemo(() => [...new Set(chords)].filter(Boolean), [chords]);
  if (!unique.length) return null;
  return (
    <div className="diagram-row">
      {unique.map((c) => (
        <ChordDiagram key={c} name={c} />
      ))}
    </div>
  );
}