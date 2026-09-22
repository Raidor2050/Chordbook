import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { DiagramRow } from '../components/ChordDiagram.jsx';
import ChordSheet from '../components/ChordSheet.jsx';
import MetaGrid from '../components/MetaGrid.jsx';
import ImproviseMap from '../components/ImproviseMap.jsx';
import SongForm from '../components/SongForm.jsx';
import PianoView from '../components/PianoView.jsx';
import { SONG_LYRICS } from '../data/lyrics.js';

export default function SongPage() {
  const { slug } = useParams();
  const { songs, loading, updateSong, removeSong, notify, editTokenFor } = useApp();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const song = useMemo(() => songs.find((s) => s.slug === slug || s.id === slug) || null, [songs, slug]);

  const token = song ? editTokenFor(song.id) || editTokenFor(song.slug) : null;
  const canEdit = Boolean(token);

  if (loading) {
    return (
      <div className="empty">
        <b>Loading…</b>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="empty">
        <b>Song not found.</b>
        <p>
          It may have been removed. <Link to="/">Back to the songbook</Link>.
        </p>
      </div>
    );
  }

  const chords = song.chords || [];
  const useKey = String(song.key || 'C').replace(/m$/i, '') || 'C';

  const onEditSave = async (draft) => {
    setSaving(true);
    try {
      await updateSong(song, draft, token);
      notify('Song updated.', 'ok');
      setEditing(false);
    } catch (err) {
      notify(err && err.message ? err.message : 'Could not update the song.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    try {
      await removeSong(song, token);
      notify('Song removed.', 'ok');
      window.location.hash = '#/';
    } catch (err) {
      notify(err && err.message ? err.message : 'Could not remove the song.', 'err');
    }
  };

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Songbook</Link>
        <span aria-hidden="true">/</span>
        <span>{song.title}</span>
      </nav>

      {editing ? (
        <section className="step" style={{ marginTop: 14 }}>
          <h2>Edit song</h2>
          <SongForm
            initial={song}
            onSave={onEditSave}
            onCancel={() => setEditing(false)}
            saving={saving}
            submitLabel="Save changes"
          />
        </section>
      ) : (
        <>
          <header className="songhead">
            <h1>{song.title}</h1>
            <p className="artist-line">
              by <b>{song.artist}</b>
              {song.album ? <> · <em>{song.album}</em></> : null}
            </p>
            <MetaGrid song={song} />
          </header>

          <div className="actions-row">
            <button type="button" className="btn small ghost" onClick={() => window.print()}>
              Print / PDF
            </button>
            {canEdit && (
              <>
                <button type="button" className="btn small" onClick={() => setEditing(true)}>
                  Edit
                </button>
                {confirmDelete ? (
                  <button type="button" className="btn small danger" onClick={onDelete}>
                    Really delete?
                  </button>
                ) : (
                  <button type="button" className="btn small danger ghost" onClick={() => setConfirmDelete(true)} onBlur={() => setTimeout(() => setConfirmDelete(false), 2000)}>
                    Delete
                  </button>
                )}
              </>
            )}
            {!canEdit && (
              <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>
                Added by the community — only the creator can edit.
              </span>
            )}
          </div>

          {chords.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, color: 'var(--ink-dim)', fontWeight: 600 }}>Chords</h3>
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '4px 0 8px' }}
                aria-label="Chord list"
              >
                {chords.map((c) => (
                  <span key={c} className="chordtag">
                    {c}
                  </span>
                ))}
              </div>
              <DiagramRow chords={chords} />
            </>
          )}

          {(song.chord_data || []).length > 0 && (
            <div style={{ marginTop: 8 }}>
              {(song.chord_data || []).map((sec, i) => (
                <section key={i} className="sheet">
                  <header className="sheet-head">
                    <h3>{sec.name || `Section ${i + 1}`}</h3>
                    {sec.verified ? (
                      <span className="flag">Checked</span>
                    ) : (
                      <span className="flag">Best-known chords — check by ear</span>
                    )}
                  </header>
                  <div className="sheet-body">
                    <ChordSheet section={{ ...sec, lyrics: (SONG_LYRICS[song.slug] || [])[i] || sec.lyrics }} />
                  </div>
                </section>
              ))}
            </div>
          )}

          {!song.chord_data?.length && !song.lyrics && (
            <div className="empty">
              <b>No chords yet.</b>
              {canEdit ? (
                <p>
                  <button className="btn primary" type="button" onClick={() => setEditing(true)}>
                    Add chords
                  </button>
                </p>
              ) : (
                <p>Ask the person who added this song to fill them in.</p>
              )}
            </div>
          )}

          <ImproviseMap defaultKey={useKey} />

          {(song.notes || song.source) && (
            <aside className="sheet" style={{ marginTop: 18 }}>
              <div className="sheet-head">
                <h3>Notes &amp; source</h3>
              </div>
              <div className="sheet-body" style={{ color: 'var(--ink-dim)' }}>
                {song.notes && <p style={{ marginTop: 0 }}>{song.notes}</p>}
                {song.source && <p style={{ margin: 0, fontSize: 13 }}>Source: {song.source}</p>}
              </div>
            </aside>
          )}
        </>
      )}
    </>
  );
}