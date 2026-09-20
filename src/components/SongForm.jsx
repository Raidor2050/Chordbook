import { useMemo, useState } from 'react';
import { isChordToken, chordsFromSpec } from '../lib/chordNames.js';
import { detectKey, progressionOptions } from '../lib/keyDetect.js';
import { parseChartToSections } from '../lib/songBuilder.js';
import { DiagramRow } from './ChordDiagram.jsx';

const EMPTY_SECTION = { name: '', chords: '', lyrics: '' };

function SectionEditor({ value, onChange, onRemove }) {
  return (
    <div className="section-card">
      <div className="row2">
        <div className="field">
          <label>Section name</label>
          <input
            value={value.name}
            placeholder="Verse, Chorus, Bridge…"
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Chords</label>
          <input
            className="mono"
            value={value.chords}
            placeholder="C G Am F  (use | for a new chord line)"
            onChange={(e) => onChange({ ...value, chords: e.target.value })}
          />
        </div>
      </div>
      <div className="field">
        <label>Lyrics (one line per chord line, optional)</label>
        <textarea
          value={value.lyrics}
          rows={2}
          placeholder="Lyric line under the chords…"
          onChange={(e) => onChange({ ...value, lyrics: e.target.value })}
        />
      </div>
      <button type="button" className="btn small danger ghost" onClick={onRemove}>
        Remove section
      </button>
    </div>
  );
}

/**
 * The core song editing surface. Used by the Add Song wizard and the
 * edit-on-song-page flow.
 */
export default function SongForm({ initial, onSave, submitLabel, onCancel, saving }) {
  const [title, setTitle] = useState((initial && initial.title) || '');
  const [artist, setArtist] = useState((initial && initial.artist) || '');
  const [album, setAlbum] = useState((initial && initial.album) || '');
  const [key, setKey] = useState((initial && initial.key) || '');
  const [capo, setCapo] = useState((initial && initial.capo != null ? String(initial.capo) : ''));
  const [tuning, setTuning] = useState((initial && initial.tuning) || 'Standard');
  const [difficulty, setDifficulty] = useState(initial && initial.difficulty ? String(initial.difficulty) : '2');
  const [notes, setNotes] = useState((initial && initial.notes) || '');
  const [source, setSource] = useState((initial && initial.source) || '');
  const [lyrics, setLyrics] = useState((initial && initial.lyrics) || '');
  const [sections, setSections] = useState(
    (initial && initial.chord_data && initial.chord_data.length
      ? initial.chord_data.map((s) => ({ name: s.name, chords: s.chords, lyrics: s.lyrics || '' }))
      : [])
  );
  const [chartBox, setChartBox] = useState('');
  const [showChartBox, setShowChartBox] = useState(false);

  const allChords = useMemo(() => {
    const out = [];
    for (const s of sections) for (const c of chordsFromSpec(s.chords)) if (!out.includes(c)) out.push(c);
    return out;
  }, [sections]);

  const weightHints = useMemo(() => {
    // Warn about non-chord tokens so users catch typos early.
    const bad = new Set();
    for (const s of sections) {
      for (const tok of (s.chords || '').split(/[\s|]+/)) {
        if (tok && !isChordToken(tok)) bad.add(tok);
      }
    }
    return [...bad];
  }, [sections]);

  const detected = useMemo(() => {
    const det = detectKey(allChords);
    return det;
  }, [allChords]);

  const applyChart = () => {
    const parsed = parseChartToSections(chartBox);
    if (!parsed.length) return;
    setSections((prev) => [...prev, ...parsed]);
    setShowChartBox(false);
    setChartBox('');
  };

  const setSection = (i, next) => setSections((s) => s.map((x, j) => (j === i ? next : x)));
  const addSection = () => setSections((s) => [...s, { ...EMPTY_SECTION }]);
  const removeSection = (i) => setSections((s) => s.filter((_, j) => j !== i));

  const submit = async (e) => {
    e.preventDefault();
    await onSave({
      title,
      artist,
      album,
      key,
      capo: capo === '' ? null : Number(capo),
      tuning,
      difficulty: Number(difficulty),
      notes,
      source,
      lyrics,
      sections: sections.filter((s) => s.name || s.chords),
    });
  };

  const canSubmit = title.trim() && artist.trim() && sections.some((s) => s.chords.trim());

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="sf-title">Title</label>
          <input id="sf-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sf-artist">Artist</label>
          <input id="sf-artist" required value={artist} onChange={(e) => setArtist(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sf-album">Album (optional)</label>
          <input id="sf-album" value={album} onChange={(e) => setAlbum(e.target.value)} />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="sf-key">Key</label>
          <input id="sf-key" value={key} placeholder="e.g. G, Am, Eb" onChange={(e) => setKey(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sf-capo">Capo (0–12)</label>
          <input
            id="sf-capo"
            type="number"
            min="0"
            max="12"
            value={capo}
            placeholder="None"
            onChange={(e) => setCapo(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="sf-tuning">Tuning</label>
          <select id="sf-tuning" value={tuning} onChange={(e) => setTuning(e.target.value)}>
            {[
              'Standard',
              'Drop D',
              'Half step down',
              'Whole step down',
              'Open D',
              'Open G',
              'DADGAD',
              'Dropped D / DADGBE',
            ].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sf-diff">Difficulty</label>
          <select id="sf-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d} — {['Easy', 'Easy-moderate', 'Moderate', 'Hard', 'Very hard'][d - 1]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="sf-notes">Notes (optional)</label>
        <textarea
          id="sf-notes"
          rows={2}
          value={notes}
          placeholder="Playing hints, capo positions, style notes…"
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <b style={{ fontSize: 14 }}>Chord sections</b>
          <button type="button" className="btn small" onClick={() => setShowChartBox((v) => !v)}>
            {showChartBox ? 'Hide chart paste' : 'Paste a chart'}
          </button>
          <button type="button" className="btn small ghost" onClick={addSection}>
            + Add section
          </button>
          {allChords.length > 0 && (
            <button
              type="button"
              className="btn small ghost"
              onClick={() => detected && detected.key && setKey(detected.key)}
              title={detected ? `Detected ${detected.key} (${Math.round(detected.confidence * 100)}% confidence)` : 'Not enough chords to detect a key'}
            >
              Detect key: {detected && detected.confidence >= 0.45 ? detected.key : '…'}
            </button>
          )}
        </div>

        {showChartBox && (
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="sf-chart">Paste chord chart text</label>
            <textarea
              id="sf-chart"
              rows={5}
              className="mono"
              value={chartBox}
              placeholder={'[Verse]\nC G Am F\nFirst lyric line\nSecond lyric line\n\n[Chorus]\nF C G\n…'}
              onChange={(e) => setChartBox(e.target.value)}
            />
            <button type="button" className="btn small primary" style={{ justifySelf: 'start' }} onClick={applyChart}>
              Import sections
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          {sections.length === 0 ? (
            <div>
              {key.trim() && progressionOptions(key.trim()).length ? (
                <>
                  <p className="field hint" style={{ margin: '0 0 4px' }}>
                    No sections yet — pick a starter progression for {key.trim()} to get going
                    (generated shapes, replace with the real chart if you know it):
                  </p>
                  {progressionOptions(key.trim()).map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      className="prog-opt"
                      onClick={() => {
                        setSections([{ name: 'Main', chords: opt.chords.join(' '), lyrics: '' }]);
                        if (!key) setKey(opt.chords.length ? opt.chords[0] : '');
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </>
              ) : (
                <p className="empty" style={{ padding: 20 }}>
                  Add a chart section, paste one,{' '}
                  <button className="btn small ghost" type="button" onClick={addSection}>
                    create one
                  </button>
                  , or set a Key to generate a starter progression.
                </p>
              )}
            </div>
          ) : (
            sections.map((s, i) => (
              <SectionEditor key={i} value={s} onChange={(next) => setSection(i, next)} onRemove={() => removeSection(i)} />
            ))
          )}
        </div>

        {weightHints.length > 0 && (
          <p className="field hint" style={{ color: 'var(--rose)', marginTop: 10 }}>
            Not recognized as chords: {weightHints.join(', ')}
          </p>
        )}
      </div>

      {allChords.length > 0 && (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-dim)' }}>Chord diagrams</label>
          <DiagramRow chords={allChords} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn primary" type="submit" disabled={saving || !canSubmit}>
          {saving ? 'Saving…' : submitLabel || 'Save song'}
        </button>
        {onCancel && (
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}