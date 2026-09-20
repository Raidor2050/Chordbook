import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { findSongMetadata } from '../api/providers/chordRetrieval.js';
import { isDuplicateError } from '../api/store.js';
import { validateSong } from '../lib/songBuilder.js';
import SongForm from '../components/SongForm.jsx';

const STAGES = [
  'Finding song…',
  'Finding chord information…',
  'Generating chord diagrams…',
  'Validating data…',
  'Saving to Chordbook…',
  'Done',
];

export default function AddSong() {
  const { addSong, notify } = useApp();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('identify');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(null);
  const [candidates, setCandidates] = useState(null);
  const [picked, setPicked] = useState(null);
  const [saveIndex, setSaveIndex] = useState(-1);
  const [saveDone, setSaveDone] = useState(false);

  const wait = (ms = 240) => new Promise((r) => setTimeout(r, ms));

  const findNow = async () => {
    const q = query.trim();
    if (!q) {
      notify('Enter a song title or "title artist".', 'err');
      return;
    }
    setStatus({ text: 'Finding song…', busy: true });
    setCandidates(null);
    setPicked(null);
    const res = await findSongMetadata(q);
    setStatus(res.message ? { text: res.message, busy: false } : null);
    setCandidates(res.data && res.data.length ? res.data : []);
    setPhase(res.data && res.data.length === 1 ? 'compose' : phase);
    if (res.data && res.data.length === 1) pickCandidate(res.data[0]);
  };

  const pickCandidate = (c) => {
    setPicked(c);
    setCandidates([c]);
    setStatus({ text: `Found: ${c.title} — ${c.artist}`, busy: false });
    setPhase('compose');
  };

  const skipLookup = () => {
    setPicked(null);
    setCandidates(null);
    setStatus(null);
    setPhase('compose');
  };

  const save = async (draft) => {
    setSaveIndex(0);
    setSaveDone(false);
    try {
      await wait(280); // stage 0: finding song (done during the lookup)
      setSaveIndex(1);
      await wait(240); // stage 1: finding chord information (parse + key detect)

      validateSong({ ...draft, key: draft.key || '' });
      setSaveIndex(2);
      await wait(240); // stage 2: generating chord diagrams (previewed live)
      setSaveIndex(3);
      await wait(160);

      let res;
      try {
        res = await addSong(draft);
      } catch (err) {
        if (isDuplicateError(err)) {
          notify('That song is already in Chordbook — open it from the songbook.', 'err');
          setSaveIndex(-1);
          return;
        }
        throw err;
      }
      setSaveIndex(4);
      await wait(260);
      setSaveIndex(5);
      setSaveDone(true);
      notify(`“${res.song.title}” is now in the songbook.`, 'ok');
      setTimeout(() => navigate(`/song/${res.song.slug}`), 650);
    } catch (err) {
      notify(err && err.message ? err.message : 'Could not save the song.', 'err');
      setSaveIndex(-1);
      setSaveDone(false);
    }
  };

  const saveBusy = saveIndex >= 0;

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Songbook</Link>
        <span aria-hidden="true">/</span>
        <span>Add song</span>
      </nav>

      <section className="hero" style={{ paddingTop: 20 }}>
        <h1>
          Add a <em>song</em>
        </h1>
        <p>Find a song, add its chords, and it will appear in the shared songbook for everyone.</p>
      </section>

      {phase === 'identify' ? (
        <section className="step">
          <h2>
            <span className="num">1</span> Identify the song
          </h2>
          <div className="field">
            <label htmlFor="add-query">Song title or “title artist”</label>
            <input
              id="add-query"
              value={query}
              placeholder="e.g. Wonderwall Oasis"
              onKeyDown={(e) => e.key === 'Enter' && findNow()}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn primary" type="button" onClick={findNow} disabled={status && status.busy}>
              Find automatically
            </button>
            <button className="btn ghost" type="button" onClick={skipLookup}>
              Enter details manually
            </button>
          </div>

          {status && (
            <p className="statuspill" role="status" aria-live="polite">
              {status.busy && <span className="spinner" aria-hidden="true" />}
              {status.text}
            </p>
          )}

          {candidates && candidates.length > 0 && (
            <div>
              <p style={{ color: 'var(--ink-faint)', fontSize: 13 }}>Pick the right one, or not listed — continue manually.</p>
              {candidates.map((c, i) => (
                <button key={i} type="button" className="candidate" onClick={() => pickCandidate(c)}>
                  {c.artwork && <img src={c.artwork} alt="" loading="lazy" />}
                  <span className="who">
                    {c.title}
                    <small>
                      {c.artist}
                      {c.album ? ` · ${c.album}` : ''}
                    </small>
                  </span>
                </button>
              ))}
              <button type="button" className="candidate" onClick={skipLookup}>
                <span className="who">
                  Not listed
                  <small>Continue with your own title and artist</small>
                </span>
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="steps">
          <div className="step">
            <h2>
              <span className="num">2</span> Chords &amp; details
            </h2>
            {picked && (
              <p className="statuspill">
                <span aria-hidden="true">✓</span> Found: <b>{picked.title}</b> — {picked.artist}
                {picked.album ? ` · ${picked.album}` : ''}
              </p>
            )}
            <SongForm
              key={picked ? `${picked.title}-${picked.artist}` : 'manual'}
              initial={picked ? { title: picked.title, artist: picked.artist, album: picked.album || '' } : undefined}
              onSave={save}
              submitLabel="Add to Chordbook"
              saving={saveBusy}
              onCancel={() => setPhase('identify')}
            />
          </div>
        </div>
      )}

      {saveBusy && (
        <div className="saveflow" role="dialog" aria-modal="true" aria-label="Saving song">
          <div className="savecard">
            <h2>{saveDone ? 'Added!' : 'Saving to Chordbook'}</h2>
            <ul>
              {STAGES.map((s, i) => (
                <li key={s} className={i < saveIndex || saveDone ? 'done' : i === saveIndex ? 'active' : ''}>
                  <span className="dot" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}