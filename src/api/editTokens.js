// Local registry of song → edit-token pairs. Tokens are the ONLY way to
// modify a song created anonymously; they live only in the creator's browser
// and are never rendered into the public UI.

const KEY = 'chordbook:edittokens';

export function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function editTokenFor(id) {
  const map = loadTokens();
  return map[id] || map[String(id)] || null;
}

export function saveEditToken(id, token) {
  if (!token) return;
  const map = loadTokens();
  map[String(id)] = token;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
}

export function clearEditToken(id) {
  const map = loadTokens();
  delete map[String(id)];
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}