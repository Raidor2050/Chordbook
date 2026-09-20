# Chordbook backends

Chordbook needs a place to store songs. There are two modes:

| Mode | Persistence | Sharing |
| --- | --- | --- |
| **Local draft** (default) | IndexedDB in the browser | Only this browser |
| **Supabase shared library** | Supabase Postgres (managed) | Every visitor, instantly |

The app automatically picks **Supabase** when `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are present at build time, otherwise it runs in
**local draft** mode. You can change modes any time by rebuilding.

## Activating the shared library (~10 minutes)

### 1. Create a Supabase project

Create a free project at <https://supabase.com>. Note its Project URL and
**anon** (public) API key from *Settings → API*. The anon key is a **public**
client credential designed to be embedded in browser apps — never copy the
`service_role` key anywhere near the frontend.

### 2. Apply the schema

In the Supabase dashboard: *SQL editor → New query*, open `supabase/schema.sql`,
run it. Then open `supabase/seed.sql` and run it to import the original ten
songs.

The schema does the following (see the file for details):

- `songs`, `artists`, `chords`, `song_chords`, `activities` tables.
- Row Level Security enabled everywhere; anonymous users have **no direct
  table privileges**.
- All writes go through `SECURITY DEFINER` RPCs (`create_song`,
  `update_song`, `delete_song`) that validate input, enforce size limits,
  reject script/spam payloads, deduplicate by normalized title+artist, and
  enforce a server-side submission throttle (15 songs/hour/client key).
- The `song_list` view is the only read path and never exposes the private
  `edit_token` used to authorise later edits/deletes.

### 3. Point the build at your project

Either:

- **Local build**: copy `.env.example` to `.env.local` and fill in the real
  values, then `npm run dev`.
- **GitHub Pages build**: add two repository *secrets* (or variables) in
  GitHub Settings → Secrets and variables → Actions:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

The workflow in `.github/workflows/pages.yml` injects them into the build.
They end up in the browser bundle — that is safe and expected for anon keys.

### 4. Deploy

Push to `main`. The build-and-deploy workflow runs the unit tests, builds the
frontend, and publishes to GitHub Pages.

## Making a new chord shape first-class

1. Add the fingering (six chars, low E first, `x` = muted) to
   `src/lib/shapes.js`.
2. Run `npm run seed:sql` to regenerate the SQL seed rows if you also want it
   in the shared DB chord dictionary.
3. The `/chords` page and every diagram render from `src/lib/shapes.js`, so
   no further work is needed to display it.

## Security notes

- **Client keys only.** The browser bundle contains the anon key + URL. The
  service-role key never touches the frontend or repository.
- **No raw HTML.** All user content is rendered as text via React escaping;
  chord diagrams are generated SVGs.
- **Edit ownership.** A random `edit_token` is issued when a song is created
  and kept only in the creator's browser. Update/delete require it; the SQL
  functions compare it against the stored (private) copy.