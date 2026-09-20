// ChordProvider abstraction — automatic chord/chart retrieval is pluggable.
//
//   ChordProvider
//    ├─ PublicMetadataProvider  (title/artist/album via public metadata APIs)
//    ├─ LocalChordAnalyzer      (key detection + starter progression)
//    └─ ManualEntryProvider     (user pastes their own chart)
//
// Automatic retrieval is intentionally conservative: we never scrape sites
// whose terms forbid it, and we never bypass auth/paywalls. When the
// automatic path has nothing to offer the UI degrades to manual entry with a
// clear message, exactly as the product requirements specify.

import { lookupSongCandidates } from '../../lib/metadata.js';
import { detectKey, progressionOptions } from '../../lib/keyDetect.js';

/** Standard result envelope for every provider step. */
function result({ provider, state, message, data }) {
  return { provider, state, message: message || null, data: data || null };
}

/**
 * PublicMetadataProvider: resolves a "Wonderwall Oasis"-style query into
 * candidate { title, artist, album, artwork, preview } matches.
 */
export async function findSongMetadata(query) {
  if (!query || !String(query).trim()) {
    return result({ provider: 'metadata', state: 'empty', message: 'Enter a song title or "title artist".', data: [] });
  }
  try {
    const candidates = await lookupSongCandidates(String(query).trim().slice(0, 200));
    if (!candidates.length) {
      return result({
        provider: 'metadata',
        state: 'notfound',
        message: 'No matches found. You can still enter the song details manually.',
        data: [],
      });
    }
    return result({ provider: 'metadata', state: 'found', data: candidates });
  } catch (err) {
    return result({
      provider: 'metadata',
      state: 'unavailable',
      message: 'Automatic song lookup unavailable. Enter the song details manually.',
      data: [],
    });
  }
}

/**
 * LocalChordAnalyzer: given a key and/or chord tokens, offer a starter
 * progression. Clearly labelled as generated, not "the published chords".
 */
export function suggestStarter(data) {
  const tokens = (data && data.chords) || [];
  let key = (data && data.key) || null;
  let confidence = 0;
  if (!key && tokens.length) {
    const det = detectKey(tokens);
    if (det && det.confidence >= 0.45) {
      key = det.key;
      confidence = det.confidence;
    }
  }
  if (!key) {
    return result({
      provider: 'local',
      state: 'needkey',
      message: 'Pick a key to auto-generate a starter progression.',
      data: null,
    });
  }
  const options = progressionOptions(key);
  return result({
    provider: 'local',
    state: 'found',
    message:
      'Generated a starter progression from the key. These are playable shapes, not the published chords — replace them if you know the real chart.',
    data: { key, confidence, options },
  });
}

/**
 * ManualEntryProvider: the user pastes a chord chart; returns parsed sections.
 * The wizard calls parseChartToSections itself and runs LocalChordAnalyzer to
 * suggest a key.
 */
export function analyzeManualChart(sections) {
  const tokens = [];
  for (const s of sections) {
    for (const row of (s.chords || '').split('|')) {
      for (const t of row.trim().split(/\s+/)) if (t) tokens.push(t);
    }
  }
  const det = tokens.length ? detectKey(tokens) : null;
  return result({
    provider: 'manual',
    state: det && det.confidence >= 0.5 ? 'found' : 'weak',
    message: null,
    data: { key: det ? det.key : null, confidence: det ? det.confidence : 0, tokens },
  });
}