import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty" style={{ marginTop: 60 }}>
      <b>This page hit a wrong note.</b>
      <p>
        <Link to="/">Back to the songbook</Link>
      </p>
    </div>
  );
}