export default function MetaGrid({ song }) {
  const cells = [
    { k: 'Key', v: song.key || '—', chordname: true },
    { k: 'Capo', v: song.capo ? `Fret ${song.capo}` : 'None' },
    { k: 'Tuning', v: song.tuning || 'Standard' },
    { k: 'Difficulty', v: song.difficulty ? `${song.difficulty}/5` : '—' },
  ];
  return (
    <div className="meta-grid">
      {cells.map((c) => (
        <div key={c.k} className="meta-cell">
          <div className="k">{c.k}</div>
          <div className={c.chordname ? 'v chordname' : 'v'}>{c.v}</div>
        </div>
      ))}
    </div>
  );
}