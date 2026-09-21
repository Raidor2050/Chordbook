import { SEED_SONGS } from "./src/data/seedSongs.js";
import { LocalStore } from "./src/api/localStore.js";
const norm = (x) => String(x || "").toLowerCase().trim().replace(/\s+/g, " ").replace(/\s+/g, " ");
const keyB = SEED_SONGS.filter((s) => String(s.key || "").toUpperCase() === "B").map((s) => s.slug);
const gmaj7 = SEED_SONGS.filter((s) => (s.chords || []).some((c) => /^Gmaj7$/i.test(String(c).trim()))).map((s) => s.slug);
const coldplay = SEED_SONGS.filter((s) => /coldplay/i.test(norm(s.artist + " " + s.title))).map((s) => s.slug);
const g = {};
for (const s of SEED_SONGS) g[String(s.genre || "?").toUpperCase()] = (g[String(s.genre || "?").toUpperCase()] || 0) + 1;
const lines = [
  "TOTAL=" + SEED_SONGS.length,
  "KEY_B=" + keyB.join(","),
  "GMAJ7=" + gmaj7.join(","),
  "COLDPLAY=" + coldplay.join(","),
];
const out = lines.join("\n");
const fs = await import("node:fs");
fs.writeFileSync("C:\\AO_STAMP.txt", out, "utf8");
console.log("probe wrote to C:\\AO_STAMP.txt; stdin:" + out.split("\n").length + " lines");
