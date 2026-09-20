# Chordbook — Project Summary

This report documents what was delivered for the **Chordbook** project: a production
React chord-song library that began as a folder of static HTML setlists and was
migrated into a real web app, tested thoroughly, and published to GitHub Pages.

---

## Project

- **Live URL:** https://raidor2050.github.io/Chordbook/ (GitHub Pages, Actions-driven)
- **Source repo:** https://github.com/Raidor2050/Chordbook (default branch `main`)
- **Tech:** React 18, Vite 5 (`base: './'`), HashRouter, playable chord diagrams /
  piano + fretboard improvise maps, original DM Sans / Instrument Serif fonts.
- **Mode today:** runs fully self-contained in the browser using IndexedDB
  ("Local draft"). No account, no server, no external service required.
- **Useful for:** musicians print-ready chord sheets, songbooks, or anyone learning
  chord voicings and pentatonic/major-scale positions.

---

## Architecture

- `src/lib/` — pure, testable helpers (chord-token parsing, key detection, SVG
  diagram renderers, improvise maps, progressions, search, songbuilder validation).
- `src/api/` — storage layer with pluggable backends:
  - `memoryStore` (in-memory demo), `localStore` (IndexedDB — the default today),
  - `supabaseStore` (optional shared backend; reduce bundle when unused),
  - a store **factory** + `toPublicSong` so every backend returns identical,
    edit-token-free public songs.
- `src/context/AppContext.jsx` — app state, search/filter state, and routing glue.
- `src/data/seedSongs.js` — the 10 original setlist songs, fully migrated, each
  with lyrics + chord progression.
- `supabase/schema.sql` + `supabase/seed.sql` — optional collaborative backend:
  RLS-secured `SECURITY DEFINER` write functions (`create_song`, `update_song`,
  `delete_song`), a public read view, edit-token ownership, and server-side
  submission throttling. Prepared but **not activated** — no Supabase credentials
  were available. `scripts/export-seed-sql.mjs` keeps seed data in sync.

---

## GitHub

- Branch `main` with a clean, linear, commit-per-area history (seed migration,
  app scaffold, tests, CI/deploy).
- On every push to `main`, `pages.yml` runs unit tests, builds the bundle, and
  deploys to GitHub Pages.

---

## Live SitE

- **Verified live** at https://raidor2050.github.io/Chordbook/:
  - Home renders all 10 seed songs; search narrows results; song pages show
    chord diagrams (SVG) and improvise maps with zero console errors.
  - Add-song flow and route navigation work on the deployed bundle.

---

## Persistence & Backends

- Default backend is IndexedDB (`localStore`), so songs added without any sign-in
  survive a reload and are stored per-browser.
- Optional Supabase backend (schema + seed + env example included) gives shared,
  cross-visitor storage with per-song edit tokens and throttling. Activate by
  supplying `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in the Pages workflow
  secrets (see `.env.example` and `docs/backends.md`).

---

## Testing

- **Unit (`npm test`): 52 passing** — chord-token parsing/normalization, SVG
  renderers, key detection with confidence scores, chords-in-key/progressions,
  search normalization + filters, songbuilder validation (length caps, abusive
  content, HTML stripping, duplicates), seed integrity (unique slugs, full
  metadata, chord-shape coverage), stores (create/get/update/remove, edit-token
  enforcement, refresh persistence, seeding, slug lookup, dedupe).
- **E2E (Playwright, Chromium + Pixel 5): 9 passing** — home render, search
  narrows, chord search, key filter, add + persist-across-reload, duplicate
  rejection, song page diagrams/improvise/breadcrumb, mobile no-overflow + add
  flow.
- `npm run check` = build + unit tests; CI mirrors the same steps and also
  runs on `main` before every Pages deploy.

---

## Known Limitations

- **Supabase is dormant.** The shared-backend path is fully built and tested in
  isolation, but with no credentials it could not be exercised against a live
  instance, so anonymous sharing / edit tokens / throttling are untested at the
  endpoint level.
- The chord-shape dictionary is the seeded "open chord" subset; uncommon voicings
  fall back to a generic placeholder rather than a tab.
- IndexedDB persistence is per-browser (no cross-device sync without Supabase).
- Playwright E2E screenshots are captured against the local Vite preview server,
  not the deployed URL (the deployed site is smoke-verified separately).
