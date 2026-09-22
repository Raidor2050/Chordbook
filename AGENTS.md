# AGENTS.md — Chordbook (guitar + piano songbook)

Vite + React app (`.jsx`, ESM). Data lives in the browser/localStorage via
IndexedDB + an in-memory mirror; no backend server is required to develop.

## Commands (run from `G:\AO projects\Chordbook\PROJECT`)

- `npm run check` — build (`vite build`) + full unit suite, then Playwright e2e.
  This is the repo gate: unit, build, and e2e all must pass before pushing.
- `node --test tests/unit/*.test.mjs` — unit-only, faster loop.
- `npx playwright test --reporter=line` — e2e only (needs a local build first).
- `npm run deploy` — builds `dist` and pushes the `gh-pages` deploy branch.
- `npm run lint` / `npm run format` — sanity helpers (repo ships clean).

## Ground rules for agents

- **Never refactor the seed catalog count.** Unit tests (`stores.test.mjs`,
  `seedSongs.test.mjs`) and e2e counts (`home.spec.js`, `add.spec.js`) hard-code
  the exact totals: **23 seed songs**, **24 after one manual add**. Any catalog
  edit must keep arguments like `23`/`24` in sync or the full gate fails.
- **Every seed song must carry `key`, `chords`, `capo`, `genre`, and `bpm`.**
  `src/data/seedSongs.js` (raw array, 23 entries) is the single source of truth;
  `toSong()` normalizes it. New songs added to that array *must* include genre +
  bpm — the e2e genre/chord filters assert against specific values (e.g. key `B`
  → 2 songs: Yellow + I'm Yours; `Gmaj7` → 1 song: Iris; `coldplay` → 3 songs).
- **Snap to the E2E contract** (`tests/e2e/*.spec.js`): `.dg` diagrams ≥ 7 on a
  song page, `Chord list` aria label, improvise-map `svg`, breadcrumbs, "N of N
  songs" countlines, the Ctrl+K hero-search input with placeholder
  `Try “oasis wonder” or “C G Am F”…`. Changing these strings/selectors breaks
  the Playwright gate.
- **Keep chord math in lib modules.** Chord construction lives in
  `src/lib/chordToNotes.js` / quality tables keyed by lowercase quality strings
  (`maj`, `m`, `7`, `m7`, `sus`, `sus2`, `7sus4`, `dim`…). Reuse these rather
  than re-deriving note math in new files.
- **State is shared via `AppContext`** (`useApp()`: `songs`, `loading`,
  `query`, `setQuery`, `filters`, `addSong`, `updateSong`, `removeSong`,
  `editTokenFor`, `toasts`/`notify`). Components must use this context, never a
  second global store.
- **Pages** live in `src/pages/` (`Home`, `Song`, `AddSong`, `Chords`,
  `NotFound`); reusable view components in `src/components/`. New reusable UI
  (piano strip, play buttons, meta chips) belongs in `src/components/`.

## Architecture notes

- `SEED_SONGS` → `toSong()` adds `slug`, `capo`, `genre`, `bpm` defaults and
  normalizes `chord_data` sections. Home filter facets (key/chord/artist/genre)
  derive from `search.js` (`searchSongs`, `baseFilters`, `distinct`).
- Editing + deleting are token-gated (edit tokens); creation goes through the
  shared store so edits appear for everyone — do not bypass
  `assertCanSubmit`/`recordSubmission` (rate limiting) in new write paths.
- Duplicate song detection is slug+normalized case-insensitive; new `create`
  calls must handle `DuplicateError` via `isDuplicateError()`.
- Add page (`AddSong`) inserts a new song and the catalog count becomes **24 of
  24** — keep the e2e countline in sync on both Home and Add.

## Operational gotchas

- The working dir has spaces (`AO projects`); always use the full quoted path,
  never `cd` in a command.
- PowerShell 5.1 is default; use `Get-Content`/`node --test`/`npm run check` for
  verifiable output. Files under `src/` may show mojibake in some tool reads —
  prefer running the gate (`npm run check`) over trusting a raw read.
- On push, GitHub Pages auto-deploys from `main` (project site). Verify with
  `npm run deploy` only after `npm run check` is fully green.
