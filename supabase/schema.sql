-- =============================================================================
-- Chordbook — Supabase schema and security policies
-- =============================================================================
-- Run this (or paste it into the Supabase SQL editor / `supabase db reset`) to
-- create the shared song database. See docs/backends.md for the full setup.
--
-- Security model:
--   * Row level security is enabled on every table.
--   * Anonymous visitors are granted SELECT on the *views exactly* and
--     EXECUTE on the write functions. They have NO direct table privileges,
--     and no RLS policies grant them table access — so private columns such
--     as songs.edit_token can never be read or modified by a client.
--   * All writes go through SECURITY DEFINER functions (they run as the
--     schema owner) that validate input, enforce limits, deduplicate, and
--     check the editor token. Only a valid, freshly returned edit token can
--     touch a song created by an anonymous visitor.
--   * Client-side throttling (rateLimit.js) is mirrored server-side in
--     create_song per client key, so cutting the client does not bypass it.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Dictionary tables
-- ---------------------------------------------------------------------------
create table if not exists public.artists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sort_name   text not null default '',
  created_at  timestamptz not null default now()
);
create unique index if not exists artists_lower_name_unique on public.artists (lower(name));

create table if not exists public.chords (
  id      text primary key,          -- canonical name, e.g. 'Cadd9'
  shape   text not null,             -- fingering, six chars, low E first
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Songs
-- ---------------------------------------------------------------------------
create table if not exists public.songs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  artist_id   uuid not null references public.artists(id),
  artist_name text not null,          -- denormalised for cheap list reads
  album       text,
  key         text,
  capo        smallint check (capo is null or (capo between 0 and 12)),
  tuning      text not null default 'Standard',
  difficulty  smallint not null default 2 check (difficulty between 1 and 5),
  lyrics      text not null default '',
  chord_data  jsonb not null default '[]',
  chords      text[] not null default '{}',
  notes       text not null default '',
  source      text not null default '',
  created_by  text,
  edit_token  text,                   -- secret: never exposed via views/policies
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists songs_artist_name_lower on public.songs (lower(artist_name));
create index if not exists songs_title_lower      on public.songs (lower(title));
create index if not exists songs_key_idx          on public.songs (key);
create index if not exists songs_difficulty_idx   on public.songs (difficulty);

-- ---------------------------------------------------------------------------
-- Join + activity
-- ---------------------------------------------------------------------------
create table if not exists public.song_chords (
  song_id   uuid not null references public.songs(id) on delete cascade,
  chord_id  text not null references public.chords(id),
  primary key (song_id, chord_id)
);

create table if not exists public.activities (
  id         bigint generated always as identity primary key,
  action     text not null,
  song_id    uuid references public.songs(id) on delete set null,
  detail     jsonb,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists activities_created_at on public.activities (created_at desc);

-- ---------------------------------------------------------------------------
-- Public read view — the ONLY table path anonymous clients can select.
-- edit_token is deliberately absent.
-- ---------------------------------------------------------------------------
create or replace view public.song_list as
select
  s.id,
  s.slug,
  s.title,
  s.artist_name,
  s.album,
  s.key,
  s.capo,
  s.tuning,
  s.difficulty,
  s.lyrics,
  s.chord_data,
  s.chords,
  s.notes,
  s.source,
  s.created_by,
  s.created_at,
  s.updated_at
from public.songs s;

-- ---------------------------------------------------------------------------
-- Security: enable RLS and lock everything down for anonymous/authenticated
-- ---------------------------------------------------------------------------
alter table public.artists enable row level security;
alter table public.chords enable row level security;
alter table public.songs enable row level security;
alter table public.song_chords enable row level security;
alter table public.activities enable row level security;

-- Anonymous/authenticated get NO direct DML on base tables (defense in depth —
-- PostgREST also has no grant for these). Only explicit grants below apply.
revoke all on public.artists, public.chords, public.songs, public.song_chords, public.activities from anon, authenticated;

-- Read access via the view only.
grant select on public.song_list to anon, authenticated;

-- Explicit RLS policies: allow reads of public (non-secret) rows only through
-- the view; base-table direct reads remain denied to clients.
drop policy if exists song_list_select on public.songs;

------------------------------------------------------------------------------
-- Helper for input validation used by the write functions
------------------------------------------------------------------------------
create or replace function public._clean_text(p text, p_max int)
returns text language sql immutable as $$
  select left(regexp_replace(coalesce(p, ''), '[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]', ' ', 'g'), p_max)
$$;

create or replace function public._sanitize_chord_data(p_json jsonb)
returns jsonb language plpgsql strict as $$
declare
  item        record;
  out_items   jsonb := '[]';
  chord_lines text;
  lyric_text  text;
  clean_name  text;
begin
  if jsonb_typeof(p_json) <> 'array' then
    return '[]'::jsonb;
  end if;
  for item in select * from jsonb_array_elements(p_json) as arr
  loop
    clean_name := public._clean_text(item.arr->>'name', 100);
    chord_lines := public._clean_text(nullif(item.arr->>'chords', ''), 5000);
    lyric_text  := left(regexp_replace(coalesce(item.arr->>'lyrics', ''), '\r\n?', E'\n', 'g'), 20000);
    if clean_name <> '' and chord_lines regexp '[A-G][#b]?' then
      out_items := out_items || jsonb_build_object(
        'name',    clean_name,
        'chords',  chord_lines,
        'lyrics',  lyric_text,
        'verified', coalesce((item.arr->>'verified') = 'true', false)
      );
    end if;
  end loop;
  return out_items;
end;
$$;

create or replace function public._sanitize_chord_tokens(p_chords text[])
returns text[] language plpgsql strict as $$
declare
  c     text;
  out_a text[] := '{}';
begin
  foreach c in array coalesce(p_chords, '{}') loop
    if c ~ '^[A-G][#b]?(maj|min|m|M|dim|aug|sus|add|\+)?\d*(sus\d?|add\d+)?(6\/9)?(/([A-G][#b]?\d*|\d+))?$' and
       c ~ '[A-Ga-g]' and not (c ~* ('script|javascript:')) then
      out_a := array_append(out_a, c);
    end if;
  end loop;
  return out_a;
end;
$$;

create or replace function public._is_abusive(p_text text)
returns boolean language sql immutable as $$
  select
    p_text ilike '%<script%' or
    p_text ilike '%javascript:%' or
    p_text ilike '%data:text/html%' or
    p_text ilike '%onerror=%' or
    p_text ~* '(\bviagra\b|\bclick here\b|\bbuy now\b)' or
    length(p_text) > 50000;
$$;

create or replace function public._record_activity(p_action text, p_song_id uuid, p_detail jsonb, p_who text)
returns void language plpgsql as $$
begin
  insert into public.activities (action, song_id, detail, created_by)
  values (p_action, p_song_id, p_detail, coalesce(p_who, 'anon'));
end;
$$;

------------------------------------------------------------------------------
-- Track throttling per client key
------------------------------------------------------------------------------
create table if not exists public.submission_throttle (
  id          bigint generated always as identity primary key,
  client_key  text not null,
  created_at  timestamptz not null default now()
);
create index if not exists submission_throttle_key_time on public.submission_throttle (client_key, created_at desc);
alter table public.submission_throttle enable row level security;
revoke all on public.submission_throttle from anon, authenticated;

------------------------------------------------------------------------------
-- create_song — the only way a client can add a song
------------------------------------------------------------------------------
create or replace function public.create_song(
  p_title       text,
  p_artist      text,
  p_album       text default null,
  p_key         text default null,
  p_capo        smallint default null,
  p_tuning      text default 'Standard',
  p_difficulty  smallint default 2,
  p_lyrics      text default '',
  p_chord_data  jsonb default '[]',
  p_chords      text[] default '{}',
  p_notes       text default '',
  p_source      text default '',
  p_client_key  text default 'anon'
) returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_title     text;
  v_artist    text;
  v_album     text;
  v_tuning    text;
  v_slug      text;
  v_artist_id uuid;
  v_id        uuid;
  v_token     text;
  v_data      jsonb;
  v_chords    text[];
  v_rows      int;
begin
  -- Server-side throttle: max 15 songs/hour/client key.
  select count(*) into v_rows from public.submission_throttle
    where client_key = p_client_key and created_at > now() - interval '1 hour';
  if v_rows >= 15 then
    return json_build_object('error', 'Too many songs added recently. Please wait and try again.');
  end if;

  v_title  := public._clean_text(p_title, 200);
  v_artist := public._clean_text(p_artist, 200);
  if v_title = '' or v_artist = '' then
    return json_build_object('error', 'Title and artist are required.');
  end if;
  if public._is_abusive(v_title || ' ' || v_artist || ' ' || coalesce(p_lyrics, '')) then
    return json_build_object('error', 'This content cannot be accepted.');
  end if;

  v_album   := public._clean_text(p_album, 200);
  v_tuning  := public._clean_text(coalesce(nullif(p_tuning, ''), 'Standard'), 64);
  v_slug    := lower(regexp_replace(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g') || '-' ||
                     regexp_replace(regexp_replace(v_artist, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'));
  if v_slug = '' or v_slug = '-' then
    return json_build_object('error', 'Could not build an identifier for that title/artist.');
  end if;

  -- Duplicate detection (case/diacritic-insensitive).
  select s.id into v_id from public.songs s
    where lower(s.artist_name) = lower(v_artist) and lower(s.title) = lower(v_title)
    limit 1;
  if v_id is not null then
    return json_build_object('error', 'duplicate', 'existing', (
      select json_build_object(
        'slug', s.slug, 'title', s.title, 'artist_name', s.artist_name,
        'key', s.key, 'capo', s.capo, 'tuning', s.tuning, 'difficulty', s.difficulty)
      from public.songs s where s.id = v_id));
  end if;

  -- Artist upsert (normalised).
  insert into public.artists (name, sort_name)
  values (v_artist, lower(v_artist))
  on conflict ((lower(name))) do update set sort_name = excluded.sort_name
  returning id into v_artist_id;

  v_data   := public._sanitize_chord_data(p_chord_data);
  v_chords := public._sanitize_chord_tokens(p_chords);
  v_token  := encode(gen_random_bytes(24), 'hex');

  -- Chords in v_chords are sanitized tokens, but the join table requires a
  -- real chords row — upsert any token the fixed dictionary does not list.
  insert into public.chords (id, shape)
  select c, '' from unnest(v_chords) as u(c)
  on conflict (id) do nothing;

  insert into public.songs (
    slug, title, artist_id, artist_name, album, key, capo, tuning, difficulty,
    lyrics, chord_data, chords, notes, source, created_by, edit_token
  ) values (
    v_slug, v_title, v_artist_id, v_artist, v_album, public._clean_text(p_key, 16),
    case when p_capo between 0 and 12 then p_capo else null end, v_tuning,
    case when p_difficulty between 1 and 5 then p_difficulty else 2 end,
    left(regexp_replace(coalesce(p_lyrics, ''), '\r\n?', E'\n', 'g'), 20000),
    v_data, v_chords, public._clean_text(p_notes, 2000), public._clean_text(p_source, 1000),
    'anon', v_token
  ) returning id into v_id;

  insert into public.song_chords (song_id, chord_id)
  select v_id, c from unnest(v_chords) as c
  on conflict do nothing;

  insert into public.submission_throttle (client_key) values (p_client_key);
  perform public._record_activity('create', v_id, jsonb_build_object('title', v_title), 'anon');

  return json_build_object(
    'song', (select row_to_json(sl) from public.song_list sl where sl.id = v_id),
    'edit_token', v_token,
    'error', null
  );
end;
$$;

------------------------------------------------------------------------------
-- update_song — requires the edit token handed out at creation
------------------------------------------------------------------------------
create or replace function public.update_song(
  p_slug        text,
  p_edit_token  text,
  p_title       text default null,
  p_artist      text default null,
  p_album       text default null,
  p_key         text default null,
  p_capo        smallint default null,
  p_tuning      text default null,
  p_difficulty  smallint default null,
  p_lyrics      text default null,
  p_chord_data  jsonb default null,
  p_chords      text[] default null,
  p_notes       text default null,
  p_source      text default null
) returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_id        uuid;
  v_dup       uuid;
  v_artist_id uuid;
  v_data      jsonb;
  v_chords    text[];
  v_title     text;
  v_artist    text;
  v_slug      text;
begin
  select id, artist_id into v_id, v_artist_id from public.songs
    where slug = p_slug and edit_token = p_edit_token and edit_token is not null;
  if v_id is null then
    return json_build_object('error', 'This song can only be edited by the person who added it.');
  end if;

  v_title  := public._clean_text(coalesce(p_title, (select title  from public.songs where id = v_id)), 200);
  v_artist := public._clean_text(coalesce(p_artist, (select artist_name from public.songs where id = v_id)), 200);
  if v_title = '' or v_artist = '' then
    return json_build_object('error', 'Title and artist are required.');
  end if;
  if public._is_abusive(v_title || ' ' || v_artist || ' ' || coalesce(p_lyrics, '')) then
    return json_build_object('error', 'This content cannot be accepted.');
  end if;

  -- Rename dedupe: same protections as create_song, excluding this row.
  select s.id into v_dup from public.songs s
    where s.id <> v_id and lower(s.artist_name) = lower(v_artist) and lower(s.title) = lower(v_title)
    limit 1;
  if v_dup is not null then
    return json_build_object('error', 'duplicate');
  end if;

  if v_artist <> (select artist_name from public.songs where id = v_id) then
    insert into public.artists (name, sort_name)
    values (v_artist, lower(v_artist))
    on conflict ((lower(name))) do update set sort_name = excluded.sort_name
    returning id into v_artist_id;
  end if;

  v_data   := public._sanitize_chord_data(coalesce(p_chord_data, (select chord_data from public.songs where id = v_id)));
  v_chords := public._sanitize_chord_tokens(coalesce(p_chords, (select chords from public.songs where id = v_id)));

  insert into public.chords (id, shape)
  select c, '' from unnest(v_chords) as u(c)
  on conflict (id) do nothing;

  v_slug := lower(regexp_replace(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g') || '-' ||
               regexp_replace(regexp_replace(v_artist, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'));

  update public.songs set
    slug = v_slug,
    title = v_title,
    artist_id = v_artist_id,
    artist_name = v_artist,
    album = public._clean_text(p_album, 200),
    key = public._clean_text(p_key, 16),
    capo = case when p_capo between 0 and 12 then p_capo else null end,
    tuning = public._clean_text(coalesce(nullif(p_tuning, ''), 'Standard'), 64),
    difficulty = case when p_difficulty between 1 and 5 then p_difficulty else 2 end,
    lyrics = left(regexp_replace(coalesce(p_lyrics, ''), '\r\n?', E'\n', 'g'), 20000),
    chord_data = v_data,
    chords = v_chords,
    notes = public._clean_text(p_notes, 2000),
    source = public._clean_text(p_source, 1000),
    updated_at = now()
  where id = v_id;

  delete from public.song_chords where song_id = v_id;
  insert into public.song_chords (song_id, chord_id)
  select v_id, c from unnest(v_chords) as c on conflict do nothing;

  perform public._record_activity('update', v_id, jsonb_build_object('title', v_title), 'anon');

  return json_build_object(
    'song', (select row_to_json(sl) from public.song_list sl where sl.id = v_id),
    'error', null
  );
end;
$$;

------------------------------------------------------------------------------
-- delete_song — requires the edit token
------------------------------------------------------------------------------
create or replace function public.delete_song(p_slug text, p_edit_token text)
returns json language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.songs
    where slug = p_slug and edit_token = p_edit_token and edit_token is not null;
  if v_id is null then
    return json_build_object('error', 'This song can only be removed by the person who added it.');
  end if;
  perform public._record_activity('delete', v_id, null, 'anon');
  delete from public.songs where id = v_id;
  return json_build_object('ok', true, 'error', null);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant execute on function public.create_song(text,text,text,text,smallint,text,smallint,text,jsonb,text[],text,text,text) to anon, authenticated;
grant execute on function public.update_song(text,text,text,text,text,text,smallint,text,smallint,text,jsonb,text[],text,text) to anon, authenticated;
grant execute on function public.delete_song(text,text) to anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Public chord dictionary (canonical "open chord" set; the write functions
-- also upsert any sanitized token not listed here).
-- Insert the canonical "open chord" set into public.chords.
insert into public.chords (id, shape) values
  ('A','x02220'),('Am','x02210'),('A7','x02020'),('Am7','x02010'),('Amaj7','x02120'),
  ('Asus2','x02200'),('Asus4','x02230'),('A7sus4','x02030'),
  ('B','x24442'),('Bm','x24432'),('B7','x21202'),('Bm7','x20202'),('Bmaj7','x24342'),
  ('Bsus2','x24422'),('Bb','x13331'),('Bbm','x13321'),('Bb7','x13131'),('Bbmaj7','x13231'),
  ('C','x32010'),('Cm','x35543'),('C7','x32310'),('Cmaj7','x32000'),('Cadd9','x32033'),
  ('Csus2','x30033'),('Csus4','x33011'),('C/E','032010'),('C/F','132010'),('C/G','332010'),
  ('D','xx0232'),('Dm','xx0231'),('D7','xx0212'),('Dm7','xx0211'),('Dmaj7','xx0222'),
  ('Dsus2','xx0230'),('Dsus4','xx0233'),('D/F#','200232'),('D/A','x00232'),
  ('Eb','x68886'),('Ebm','x68876'),('Eb7','x68686'),
  ('E','022100'),('Em','022000'),('E7','020100'),('Em7','022030'),('Emaj7','021100'),('Esus4','022200'),
  ('F','133211'),('Fm','133111'),('F7','131211'),('Fmaj7','xx3210'),('F6','xx3212'),
  ('F6/9','133233'),('Fsus2','xx3011'),('F#m','244222'),('F#7','242322'),
  ('G','320003'),('Gm','355333'),('G7','320001'),('Gmaj7','320002'),('Gsus4','330013'),
  ('G/B','x20003'),('G/D','xx0003'),('G#m','466444'),
  ('Ab','466544'),('Abm','466444'),('Ab7','464544'),
  ('Db','x46664'),('Db7','x46464'),('Dbm','x46654')
on conflict (id) do nothing;