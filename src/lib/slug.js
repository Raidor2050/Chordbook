// Slug + normalization helpers (pure functions).

export function slugifyPart(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugFor(title, artist) {
  return [title, artist].filter(Boolean).map(slugifyPart).filter(Boolean).join('-') || 'song';
}

export function normalizeCompare(s) {
  return String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Strip HTML tags entirely (defence in depth; UI also renders as text). */
export function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
}

export function sanitizeText(s, limit = 500) {
  return stripHtml(String(s || ''))
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

export function sanitizeLyrics(s, limit = 20000) {
  return String(s || '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '    ')
    .slice(0, limit);
}