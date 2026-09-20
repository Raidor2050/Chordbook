export default function Brand() {
  return (
    <a className="brand" href="#/">
      <svg className="mark" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#0e0d0c" />
        <ellipse cx="26" cy="44" rx="9" ry="6" transform="rotate(-20 26 44)" fill="#e9be6a" />
        <rect x="33" y="10" width="3" height="36" rx="1.5" fill="#e9be6a" />
        <path d="M36 12c8 5.5 9.4 12.6 7.6 19-1.4-5.6-3.8-9.2-7.6-11.8Z" fill="#e9be6a" />
        <circle cx="44" cy="38" r="6.5" fill="none" stroke="#e9be6a" strokeWidth="2.5" />
      </svg>
      <b>
        <i>Chord</i>book
      </b>
    </a>
  );
}