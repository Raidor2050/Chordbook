import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { knownChords } from '../lib/shapes.js';
import { renderChordDiagram } from '../lib/renderChord.js';

export default function Chords() {
  const chords = useMemo(() => knownChords().sort(), []);
  const [filter, setFilter] = useState('');

  const shown = chords.filter(
    (c) => !filter || c.toLowerCase().includes(filter.toLowerCase()) || c === filter
  );

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Songbook</Link>
        <span aria-hidden="true">/</span>
        <span>Chord shapes</span>
      </nav>
      <section className="hero" style={{ paddingTop: 20 }}>
        <h1>
          Chord <em>shapes</em>
        </h1>
        <p>
          Every shape in Chordbook, generated from the fingering data. Low string on the left; filled
          dots are frets, <span aria-hidden="true">o</span> is open, <span aria-hidden="true">x</span> is muted.
        </p>
      </section>

      <div className="hero-search">
        <div className="search">
          <span className="icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            aria-label="Filter chord shapes"
            placeholder="Filter chords, e.g. Cadd9 or Fm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {shown.length ? (
        <div className="chord-grid">
          {shown.map((c) => {
            const svg = renderChordDiagram(c);
            return (
              <figure key={c} className="chord-tile">
                {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <div style={{ height: 112 }} aria-hidden="true">?</div>}
                <figcaption>{c}</figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <b>No chords match “{filter}”.</b>
        </div>
      )}
      <p style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
        {shown.length} of {chords.length} shapes · Add new shapes through the shared chord dictionary.
      </p>
    </>
  );
}