import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="sitefoot">
      <div className="sitefoot-inner">
        <span>
          Chordbook · a shared guitar songbook. Songs and lyrics remain the property of their rights holders.
        </span>
        <span>
          <Link to="/chords">Chord shapes</Link> ·{' '}
          <a href="https://github.com/Raidor2050/Chordbook" target="_blank" rel="noreferrer">
            Source
          </a>
        </span>
      </div>
    </footer>
  );
}