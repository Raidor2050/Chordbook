// Generates supabase/seed.sql from src/data/seedSongs.js so the SQL seed
// never drifts from the app's shipped data.
//
//   npm run seed:sql

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEED_SONGS } from '../src/data/seedSongs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function lit(s) {
  if (s === undefined || s === null) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function jsonLit(v) {
  if (v === undefined || v === null) return "'[]'::jsonb";
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}

function arrLit(a) {
  if (!Array.isArray(a) || !a.length) return `'{}'::text[]`;
  return `ARRAY[${a.map(lit).join(', ')}]::text[]`;
}

const blocks = [];
for (const s of SEED_SONGS) {
  const artistLower = s.artist.toLowerCase().replace(/'/g, "''");
  const chords = arrLit(s.chords);
  blocks.push(`do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values (${lit(s.artist)}, ${lit(artistLower)})
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = ${lit(artistLower)} limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), ${lit(s.slug)}, ${lit(s.title)}, v_artist_id, ${lit(s.artist)},
    ${lit(s.album || null)}, ${lit(s.key || null)}, ${s.capo ?? 'NULL'}, ${lit(s.tuning)},
    ${s.difficulty}, ${lit(s.lyrics)}, ${jsonLit(s.chord_data)}, ${chords},
    ${lit(s.notes)}, ${lit(s.source)}, 'seed', NULL,
    '${s.created_at}', '${s.updated_at}'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(${chords}) as c
  where s.slug = ${lit(s.slug)}
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, ${jsonLit({ title: s.title, artist: s.artist })}, 'seed'
  from public.songs where slug = ${lit(s.slug)}
  on conflict do nothing;
end $$;`);
}

const head = `-- =============================================================================
-- Chordbook seed data — GENERATED FILE (npm run seed:sql).
-- Contains the ten songs migrated from the original setlist project.
-- Run after schema.sql.
-- =============================================================================

`;
const sql = head + blocks.join('\n\n') + '\n';
mkdirSync(join(root, 'supabase'), { recursive: true });
writeFileSync(join(root, 'supabase', 'seed.sql'), sql);
console.log(`wrote supabase/seed.sql (${SEED_SONGS.length} songs)`);