import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { searchSongs, distinct, baseFilters } from '../lib/search.js';

function SongCard({ song }) {
  const tags = (song.chords || []).slice(0, 7);
  return (
    <li>
      <Link className="songcard" to={`/song/${song.slug}`}>
        <div>
          <span className="t">{song.title}</span>
          <span className="a">{song.artist}</span>
          <span className="chips">
            {tags.map((c) => (
              <span key={c} className="chordtag">
                {c}
              </span>
            ))}
          </span>
        </div>
        <span className="meta">
          <span>
            Key <b>{song.key || '—'}</b>
          </span>
          <br />
          <span>
            {song.capo ? `Capo ${song.capo}` : 'No capo'} · {song.tuning || 'Standard'}
          </span>
          {song.difficulty ? (
            <>
              <br />
              <span>{'●'.repeat(song.difficulty)}</span>
            </>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

function FilterChip({ label, value, options, onChange, onClear }) {
  if (!value && !options.some((o) => o)) return null;
  return (
    <label className={`chip ${value ? '' : 'clear'}`}>
      {label}
      {options.length > 0 ? (
        <>
          {' '}
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`Filter by ${label.toLowerCase()}`}
          >
            <option value="">{value ? label : 'Any'}</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </>
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${label} filter`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
        >
          ✕
        </button>
      )}
    </label>
  );
}

export default function Home() {
  const { songs, loading, query, setQuery } = useApp();
  const [filters, setFilters] = useState(baseFilters());

  const facets = useMemo(() => {
    const allChords = new Set();
    for (const s of songs) for (const c of s.chords || []) allChords.add(c);
    return {
      artists: distinct(songs, 'artist'),
      keys: distinct(songs, 'key'),
      tunings: distinct(songs, 'tuning'),
      difficulties: [1, 2, 3, 4, 5],
      chords: [...allChords].sort().slice(0, 40),
    };
  }, [songs]);

  const results = useMemo(() => searchSongs(songs, query, filters), [songs, query, filters]);

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters(baseFilters());

  const hasFilters = Object.values(filters).some(Boolean);
  const chordCount = useMemo(() => new Set(songs.flatMap((s) => s.chords || [])).size, [songs]);

  return (
    <>
      <section className="hero">
        <h1>
          A songbook
        </h1>
        <p>
          Browse, search and add songs with chords, chord diagrams and improvisation maps. Songs you
          add are saved to the shared library and appear for everyone.
        </p>
      </section>

      <div className="hero-search">
        <label htmlFor="hero-search" className="skip-link" style={{ position: 'absolute' }}>
          Search the songbook
        </label>
        <div className="search">
          <span className="icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            id="hero-search"
            type="search"
            placeholder="Try “oasis wonder” or “C G Am F”…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="iconbtn"
              style={{ position: 'absolute', right: 6, width: 30, height: 30 }}
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="filters">
        <FilterChip
          label="Artist"
          value={filters.artist}
          options={facets.artists}
          onChange={(v) => setFilter('artist', v)}
          onClear={() => setFilter('artist', '')}
        />
        <FilterChip
          label="Key"
          value={filters.key}
          options={facets.keys}
          onChange={(v) => setFilter('key', v)}
          onClear={() => setFilter('key', '')}
        />
        <FilterChip
          label="Chord"
          value={filters.chord}
          options={facets.chords}
          onChange={(v) => setFilter('chord', v)}
          onClear={() => setFilter('chord', '')}
        />
        <FilterChip
          label="Difficulty"
          value={filters.difficulty}
          options={facets.difficulties}
          onChange={(v) => setFilter('difficulty', v)}
          onClear={() => setFilter('difficulty', '')}
        />
        <FilterChip
          label="Tuning"
          value={filters.tuning}
          options={facets.tunings}
          onChange={(v) => setFilter('tuning', v)}
          onClear={() => setFilter('tuning', '')}
        />
      </div>

      <p className="countline" aria-live="polite">
        {loading
          ? 'Loading the songbook…'
          : `${results.length} of ${songs.length} songs · ${chordCount} chord shapes`}
      </p>

      {loading ? (
        <div className="empty">
          <b>Loading songs…</b>
        </div>
      ) : results.length === 0 ? (
        <div className="empty">
          <b>No songs found.</b>
          <p>
            {hasFilters || query ? 'Try a different search or clear the filters. ' : ''}
            <Link to="/add">Add it to the songbook</Link>.
          </p>
        </div>
      ) : (
        <ul className="songlist">
          {results.map((s) => (
            <SongCard key={s.id} song={s} />
          ))}
        </ul>
      )}
    </>
  );
}