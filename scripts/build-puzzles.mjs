// Builds puzzles/ from the Lichess puzzle database (CC0 — https://database.lichess.org/#puzzles).
//   node scripts/build-puzzles.mjs path/to/lichess_db_puzzle.csv.zst
// Keeps ~50k popular, well-tested puzzles spread over every rating band and theme, written as one small
// JSON file per 100-point rating band (puzzles/b12.json = ratings 1200-1299) so the app loads only what it needs.
// Row format: [id, fen, moves, rating, themes]  — fen is BEFORE the opponent's move; moves[0] is that move,
// the rest is the solution (UCI, solver and opponent alternating).
import { createReadStream, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Decompress } from 'fzstd';

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/build-puzzles.mjs lichess_db_puzzle.csv.zst'); process.exit(1); }
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'puzzles');

// quality bar: rating settled, liked by players, played often (relaxed at the extremes, where puzzles are rare)
const MAX_MOVES = 12;
const BAND_MIN = 4, BAND_MAX = 29; // 400-499 … 2900+
const edge = b => b <= 6 || b >= 25;
const bar = b => edge(b) ? { rd: 110, pop: 60, plays: 100 } : { rd: 80, pop: 80, plays: 300 };
const quota = b => b <= 7 ? 1200 : b <= 23 ? 2500 : 900; // most players sit between 800 and 2400
// motifs every band should contain (so theme training finds puzzles everywhere)
const MOTIFS = `advancedPawn anastasiaMate arabianMate attackingF2F7 attraction backRankMate bishopEndgame bodenMate
  capturingDefender castling clearance defensiveMove deflection discoveredAttack doubleBishopMate doubleCheck
  dovetailMate enPassant endgame exposedKing fork hangingPiece hookMate interference intermezzo kingsideAttack
  knightEndgame mateIn1 mateIn2 mateIn3 mateIn4 mateIn5 pawnEndgame pin promotion queenEndgame queenRookEndgame
  queensideAttack quietMove rookEndgame sacrifice skewer smotheredMate trappedPiece underPromotion xRayAttack
  zugzwang opening middlegame discoveredCheck balestraMate blindSwineMate cornerMate epauletteMate killBoxMate
  morphysMate operaMate pillsburysMate swallowstailMate triangleMate vukovicMate`.split(/\s+/).filter(Boolean);
const DROP_THEMES = new Set(['master', 'masterVsMaster', 'superGM']); // about the source game, not the puzzle

const bands = new Map(); // band -> { all: [], motif: Map(theme -> []) }
for (let b = BAND_MIN; b <= BAND_MAX; b++) bands.set(b, { all: [], motif: new Map(MOTIFS.map(m => [m, []])) });
const trim = (arr, keep) => { arr.sort((x, y) => y.s - x.s); arr.length = keep; };

let header = null, rows = 0, kept = 0, rest = '';
const dec = new TextDecoder();
function line(l) {
  if (!l) return;
  const f = l.split(',');
  if (!header) { header = Object.fromEntries(f.map((k, i) => [k, i])); return; }
  rows++;
  const rating = +f[header.Rating], rd = +f[header.RatingDeviation], pop = +f[header.Popularity], plays = +f[header.NbPlays];
  const band = Math.min(BAND_MAX, Math.max(BAND_MIN, Math.floor(rating / 100)));
  const q0 = bar(band);
  if (rd > q0.rd || pop < q0.pop || plays < q0.plays) return;
  const moves = f[header.Moves];
  if (moves.split(' ').length > MAX_MOVES) return;
  const themes = f[header.Themes].split(' ').filter(t => t && !DROP_THEMES.has(t));
  const p = { r: [f[header.PuzzleId], f[header.FEN], moves, rating, themes.join(' ')],
    s: pop + 8 * Math.log10(plays) + Math.random() * 6 }; // popular + well-played, a little shuffled
  const B = bands.get(band), q = quota(band);
  B.all.push(p); if (B.all.length > q * 6) trim(B.all, q * 3);
  for (const t of themes) { const m = B.motif.get(t); if (m) { m.push(p); if (m.length > 240) trim(m, 120); } }
  kept++;
}

const dz = new Decompress((chunk, final) => {
  const text = rest + dec.decode(chunk, { stream: !final });
  const lines = text.split('\n');
  rest = final ? '' : lines.pop();
  for (const l of lines) line(l.trimEnd());
});
await new Promise((res, rej) => {
  createReadStream(src, { highWaterMark: 1 << 22 })
    .on('data', c => dz.push(new Uint8Array(c.buffer, c.byteOffset, c.length)))
    .on('end', () => { dz.push(new Uint8Array(0), true); res(); })
    .on('error', rej);
});
if (rest) line(rest);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const index = { source: 'Lichess puzzle database (CC0) — https://database.lichess.org/#puzzles',
  built: new Date().toISOString().slice(0, 10), total: 0, bands: {}, themes: {} };
for (const [b, B] of bands) {
  const q = quota(b), picked = new Map();
  // 1) up to 40% of the band: the best few of every motif, so rare themes are represented
  const avail = MOTIFS.filter(m => B.motif.get(m).length);
  const perMotif = Math.max(1, Math.floor(q * 0.4 / Math.max(1, avail.length)));
  for (const m of avail) {
    const list = B.motif.get(m).sort((x, y) => y.s - x.s);
    let n = 0;
    for (const p of list) { if (n >= perMotif) break; if (!picked.has(p.r[0])) { picked.set(p.r[0], p); n++; } }
  }
  // 2) fill the rest with the most popular puzzles
  for (const p of B.all.sort((x, y) => y.s - x.s)) { if (picked.size >= q) break; picked.set(p.r[0], p); }
  const rowsOut = [...picked.values()].map(p => p.r);
  for (let i = rowsOut.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rowsOut[i], rowsOut[j]] = [rowsOut[j], rowsOut[i]]; }
  writeFileSync(join(out, `b${b}.json`), JSON.stringify(rowsOut));
  index.bands[b] = rowsOut.length; index.total += rowsOut.length;
  for (const r of rowsOut) for (const t of r[4].split(' ')) if (t) index.themes[t] = (index.themes[t] || 0) + 1;
}
writeFileSync(join(out, 'index.json'), JSON.stringify(index, null, 1));
console.log(`read ${rows.toLocaleString()} puzzles, ${kept.toLocaleString()} passed the quality bar, wrote ${index.total.toLocaleString()} to puzzles/`);
