import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Toasts from './components/Toasts.jsx';
import NoteBackground from './components/NoteBackground.jsx';
import Home from './pages/Home.jsx';
import SongPage from './pages/Song.jsx';
import AddSong from './pages/AddSong.jsx';
import Chords from './pages/Chords.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const skipToMain = (e) => {
    e.preventDefault();
    const main = document.getElementById('main');
    if (main) main.focus();
  };

  return (
    <div className="app">
      <NoteBackground />
      <a className="skip-link" href="#main" onClick={skipToMain}>
        Skip to content
      </a>
      <Header />
      <main id="main" className="shell" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/song/:slug" element={<SongPage />} />
          <Route path="/add" element={<AddSong />} />
          <Route path="/chords" element={<Chords />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toasts />
    </div>
  );
}