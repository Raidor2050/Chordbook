import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import Brand from './Brand.jsx';
import StoreBadge from './StoreBadge.jsx';

export default function Header() {
  const { query, setQuery } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/^(input|textarea|select)$/i.test(document.activeElement?.tagName || '')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSearch = (value) => {
    setQuery(value);
    if (location.pathname !== '/') navigate('/');
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        <div className="top-search">
          <div className="search">
            <span className="icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <label className="skip-link" htmlFor="global-search" style={{ position: 'absolute' }}>
              Search songs
            </label>
            <input
              ref={inputRef}
              id="global-search"
              type="search"
              role="searchbox"
              aria-label="Search songs"
              placeholder="Search songs, artists, chords…"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
            />
            <span className="kbd hide-mobile" aria-hidden="true">
              /
            </span>
          </div>
        </div>
        <StoreBadge />
        <Link className="btn primary" to="/add">
          <span aria-hidden="true">+</span> Add song
        </Link>
      </div>
    </header>
  );
}