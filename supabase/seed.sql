-- =============================================================================
-- Chordbook seed data — GENERATED FILE (npm run seed:sql).
-- Contains the ten songs migrated from the original setlist project.
-- Run after schema.sql.
-- =============================================================================

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('Extreme', 'extreme')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'extreme' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'more-than-words-extreme', 'More Than Words', v_artist_id, 'Extreme',
    NULL, 'G', NULL, 'Standard',
    2, '', '[{"name":"Intro","chords":"G G/B Cadd9 Am7 C Dsus4 G D7","lyrics":"","verified":true},{"name":"Verse","chords":"G Cadd9 Am7 C D G|G Cadd9 Am7 C D G","lyrics":"","verified":true},{"name":"Chorus","chords":"G G/B D/F# Em|Bm C D7 G","lyrics":"","verified":true},{"name":"Bridge","chords":"Em D C G","lyrics":"","verified":false}]'::jsonb, ARRAY['G', 'G/B', 'Cadd9', 'Am7', 'C', 'Dsus4', 'D7', 'D', 'D/F#', 'Em', 'Bm']::text[],
    'No capo, G shapes. The recording sits a half step down, so tune down or transpose to match it.', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['G', 'G/B', 'Cadd9', 'Am7', 'C', 'Dsus4', 'D7', 'D', 'D/F#', 'Em', 'Bm']::text[]) as c
  where s.slug = 'more-than-words-extreme'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"More Than Words","artist":"Extreme"}'::jsonb, 'seed'
  from public.songs where slug = 'more-than-words-extreme'
  on conflict do nothing;
end $$;

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('Coldplay', 'coldplay')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'coldplay' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'fix-you-coldplay', 'Fix You', v_artist_id, 'Coldplay',
    NULL, 'Eb', 3, 'Standard',
    2, '', '[{"name":"Intro","chords":"C Em Am7 C/G","lyrics":"","verified":true},{"name":"Verse","chords":"C Em Am7 C/G|C Em Am7 C/G","lyrics":"","verified":true},{"name":"Chorus","chords":"F Em G Gsus4 G|F Em G Gsus4 G","lyrics":"","verified":true},{"name":"Bridge","chords":"Am F C G|C F C G","lyrics":"","verified":false}]'::jsonb, ARRAY['C', 'Em', 'Am7', 'C/G', 'F', 'G', 'Gsus4', 'Am']::text[],
    'Capo 3, C shapes.', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['C', 'Em', 'Am7', 'C/G', 'F', 'G', 'Gsus4', 'Am']::text[]) as c
  where s.slug = 'fix-you-coldplay'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"Fix You","artist":"Coldplay"}'::jsonb, 'seed'
  from public.songs where slug = 'fix-you-coldplay'
  on conflict do nothing;
end $$;

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('Coldplay', 'coldplay')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'coldplay' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'yellow-coldplay', 'Yellow', v_artist_id, 'Coldplay',
    NULL, 'B', 4, 'Standard',
    2, '', '[{"name":"Intro","chords":"G D C G","lyrics":"","verified":true},{"name":"Verse","chords":"G D C G|G D C G","lyrics":"","verified":true},{"name":"Chorus","chords":"C Em D|C Em D|C Em D C","lyrics":"","verified":true},{"name":"Bridge","chords":"G D C G|G D C G","lyrics":"","verified":true}]'::jsonb, ARRAY['G', 'D', 'C', 'Em']::text[],
    'Capo 4, G shapes.', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['G', 'D', 'C', 'Em']::text[]) as c
  where s.slug = 'yellow-coldplay'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"Yellow","artist":"Coldplay"}'::jsonb, 'seed'
  from public.songs where slug = 'yellow-coldplay'
  on conflict do nothing;
end $$;

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('Post Malone', 'post malone')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'post malone' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'sunflower-post-malone', 'Sunflower', v_artist_id, 'Post Malone',
    NULL, 'D', NULL, 'Standard',
    2, '', '[{"name":"Intro","chords":"D G Em G","lyrics":"","verified":true},{"name":"Verse","chords":"D G Em G|D G Em G","lyrics":"","verified":true},{"name":"Chorus","chords":"D G Em G|D G Em G","lyrics":"","verified":true},{"name":"Bridge / Outro","chords":"D G Em G","lyrics":"","verified":false}]'::jsonb, ARRAY['D', 'G', 'Em']::text[],
    'No capo. One four-chord loop runs the whole song.', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['D', 'G', 'Em']::text[]) as c
  where s.slug = 'sunflower-post-malone'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"Sunflower","artist":"Post Malone"}'::jsonb, 'seed'
  from public.songs where slug = 'sunflower-post-malone'
  on conflict do nothing;
end $$;

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('The Fray', 'the fray')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'the fray' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'how-to-save-a-life-the-fray', 'How to Save a Life', v_artist_id, 'The Fray',
    NULL, 'Bb', 3, 'Standard',
    2, '', '[{"name":"Verse","chords":"G D Em C|G D Em C","lyrics":"","verified":false},{"name":"Chorus","chords":"C D Em G D G|C D Em G D G","lyrics":"","verified":true},{"name":"Bridge / Interlude","chords":"D Em G D G","lyrics":"","verified":true}]'::jsonb, ARRAY['G', 'D', 'Em', 'C']::text[],
    'Capo 3, G shapes. Charts disagree on the key, so use the key menu below if it sits wrong for the singer.', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['G', 'D', 'Em', 'C']::text[]) as c
  where s.slug = 'how-to-save-a-life-the-fray'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"How to Save a Life","artist":"The Fray"}'::jsonb, 'seed'
  from public.songs where slug = 'how-to-save-a-life-the-fray'
  on conflict do nothing;
end $$;

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('Kodaline', 'kodaline')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'kodaline' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'all-i-want-kodaline', 'All I Want', v_artist_id, 'Kodaline',
    NULL, 'C', NULL, 'Standard',
    2, '', '[{"name":"Intro","chords":"C","lyrics":"","verified":true},{"name":"Verse","chords":"C G Am F|C G Am F","lyrics":"","verified":false},{"name":"Chorus","chords":"C G|Am F C G|C F C","lyrics":"","verified":true},{"name":"Bridge","chords":"Dm Am F G","lyrics":"","verified":false}]'::jsonb, ARRAY['C', 'G', 'Am', 'F', 'Dm']::text[],
    'No capo. With a capo on 5 you can play the same song in G shapes.', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['C', 'G', 'Am', 'F', 'Dm']::text[]) as c
  where s.slug = 'all-i-want-kodaline'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"All I Want","artist":"Kodaline"}'::jsonb, 'seed'
  from public.songs where slug = 'all-i-want-kodaline'
  on conflict do nothing;
end $$;

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('OneRepublic', 'onerepublic')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'onerepublic' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'secrets-onerepublic', 'Secrets', v_artist_id, 'OneRepublic',
    NULL, 'C', NULL, 'Standard',
    2, '', '[{"name":"Verse","chords":"C Em Am F|C Em Am F","lyrics":"","verified":true},{"name":"Chorus","chords":"C Em Am F|C Em Am F","lyrics":"","verified":true},{"name":"Bridge","chords":"C Em Am F","lyrics":"","verified":false}]'::jsonb, ARRAY['C', 'Em', 'Am', 'F']::text[],
    'No capo, C shapes. Guitar charts online are often a whole step up in D (D F#m Bm G).', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['C', 'Em', 'Am', 'F']::text[]) as c
  where s.slug = 'secrets-onerepublic'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"Secrets","artist":"OneRepublic"}'::jsonb, 'seed'
  from public.songs where slug = 'secrets-onerepublic'
  on conflict do nothing;
end $$;

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('Imagine Dragons', 'imagine dragons')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'imagine dragons' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'demons-imagine-dragons', 'Demons', v_artist_id, 'Imagine Dragons',
    NULL, 'Eb', 3, 'Standard',
    2, '', '[{"name":"Verse","chords":"C G Am F|C G Am F","lyrics":"","verified":true},{"name":"Pre-chorus","chords":"C G Am F|C G Am F","lyrics":"","verified":true},{"name":"Chorus","chords":"C G Am F|C G Am F","lyrics":"","verified":true},{"name":"Bridge","chords":"C G Am F","lyrics":"","verified":true}]'::jsonb, ARRAY['C', 'G', 'Am', 'F']::text[],
    'Capo 3, C shapes. One loop under every section.', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['C', 'G', 'Am', 'F']::text[]) as c
  where s.slug = 'demons-imagine-dragons'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"Demons","artist":"Imagine Dragons"}'::jsonb, 'seed'
  from public.songs where slug = 'demons-imagine-dragons'
  on conflict do nothing;
end $$;

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('Goo Goo Dolls', 'goo goo dolls')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'goo goo dolls' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'iris-goo-goo-dolls', 'Iris', v_artist_id, 'Goo Goo Dolls',
    NULL, 'D', NULL, 'Standard',
    2, '', '[{"name":"Intro","chords":"Bm Bsus2 G Gmaj7 G","lyrics":"","verified":true},{"name":"Verse","chords":"D Em G|Bm A G|D Em G|Bm A G","lyrics":"","verified":true},{"name":"Chorus","chords":"Bm A G|Bm A G|Bm A G|Bm A G","lyrics":"","verified":true},{"name":"Bridge / Interlude","chords":"Bm Bsus2 G Gmaj7 G","lyrics":"","verified":true}]'::jsonb, ARRAY['Bm', 'Bsus2', 'G', 'Gmaj7', 'D', 'Em', 'A']::text[],
    'Standard tuning shapes. The record uses an open tuning (B D D D D D), so the voicings will sound thinner.', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['Bm', 'Bsus2', 'G', 'Gmaj7', 'D', 'Em', 'A']::text[]) as c
  where s.slug = 'iris-goo-goo-dolls'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"Iris","artist":"Goo Goo Dolls"}'::jsonb, 'seed'
  from public.songs where slug = 'iris-goo-goo-dolls'
  on conflict do nothing;
end $$;

do $$
declare
  v_artist_id uuid;
begin
  insert into public.artists (name, sort_name)
  values ('Coldplay', 'coldplay')
  on conflict ((lower(name))) do nothing;

  select id into v_artist_id from public.artists where lower(name) = 'coldplay' limit 1;

  insert into public.songs (
    id, slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token, created_at, updated_at
  ) values (
    gen_random_uuid(), 'the-scientist-coldplay', 'The Scientist', v_artist_id, 'Coldplay',
    NULL, 'F', NULL, 'Standard',
    2, '', '[{"name":"Intro","chords":"Dm7 Bb F Fsus2","lyrics":"","verified":true},{"name":"Verse","chords":"Dm7 Bb F Fsus2|Dm7 Bb F Fsus2","lyrics":"","verified":true},{"name":"Chorus","chords":"Bb F Fsus2|Bb F C/F F6/9 C/G Csus4 C","lyrics":"","verified":true},{"name":"Bridge","chords":"Dm7 Bb F C","lyrics":"","verified":false}]'::jsonb, ARRAY['Dm7', 'Bb', 'F', 'Fsus2', 'C/F', 'F6/9', 'C/G', 'Csus4', 'C']::text[],
    'No capo. Piano-led, so let every chord ring.', 'Migrated from the original setlist project.', 'seed', NULL,
    '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'
  ) on conflict (slug) do nothing;

  insert into public.song_chords (song_id, chord_id)
  select s.id, c
  from public.songs s, unnest(ARRAY['Dm7', 'Bb', 'F', 'Fsus2', 'C/F', 'F6/9', 'C/G', 'Csus4', 'C']::text[]) as c
  where s.slug = 'the-scientist-coldplay'
  on conflict do nothing;

  insert into public.activities (action, song_id, detail, created_by)
  select 'seed', id, '{"title":"The Scientist","artist":"Coldplay"}'::jsonb, 'seed'
  from public.songs where slug = 'the-scientist-coldplay'
  on conflict do nothing;
end $$;
