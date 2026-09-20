// Client-side submission throttle (honeypot + frequency limits) to blunt spam
// on the anonymous "Add Song" path. The Supabase path also enforces its own
// server-side limits inside create_song (see supabase/schema.sql).

const KEY = 'chordbook:submit_stamps';
const MAX_PER_HOUR = 12;
const MIN_GAP_MS = 15000;

function stamps() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStamps(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-60)));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Throws with a user-friendly message when the client is over the limit. */
export function assertCanSubmit() {
  const now = Date.now();
  const list = stamps().filter((t) => now - t < 3600_000);
  if (list.length >= MAX_PER_HOUR) {
    throw new Error('Slow down — too many songs added in the last hour. Please try again later.');
  }
  if (list.length && now - list[list.length - 1] < MIN_GAP_MS) {
    throw new Error('Just a moment — please wait before adding another song.');
  }
}

export function recordSubmission() {
  const now = Date.now();
  saveStamps([...stamps(), now]);
}

/** Honeypot: hidden field humans never fill. Submit is aborted if filled. */
export function isBotHoneypot(b) {
  return Boolean(b) && String(b).length > 0;
}