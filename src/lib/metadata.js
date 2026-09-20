// PublicMetadataProvider — enrichment of title/artist/album using the iTunes
// Search API. Public, key-free, designed for media lookup. Fails gracefully.
//
// This is one provider in a ChordProvider abstraction (see src/api/providers).

const MAX_RESULTS = 5;
const TIMEOUT_MS = 6000;

export async function searchiTunes(term, signal) {
  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', term);
  url.searchParams.set('entity', 'musicTrack');
  url.searchParams.set('media', 'music');
  url.searchParams.set('limit', String(MAX_RESULTS));

  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Metadata service returned ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.results)) return [];
  return data.results.map((r) => ({
    title: r.trackName || '',
    artist: r.artistName || '',
    album: r.collectionName || null,
    artwork: r.artworkUrl100 ? r.artworkUrl100.replace('100x100', '300x300') : null,
    preview: r.previewUrl || null,
  }));
}

function withTimeout(promise, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      timer && ctrl.signal.addEventListener('abort', () => reject(new Error('Metadata service timed out')), { once: true })
    ),
  ]).finally(() => clearTimeout(timer));
}

/** Hands a real AbortSignal to fetch and enforces an overall timeout. */
export async function lookupSongCandidates(input) {
  const term = String(input || '').trim();
  if (!term) return [];
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await searchiTunes(term, ctrl.signal);
  } finally {
    clearTimeout(timeout);
  }
}