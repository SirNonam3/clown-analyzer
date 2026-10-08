// Builds www/ — the web bundle packaged into the Android and iOS apps.
// The website (GitHub Pages) is served straight from the repo root and doesn't need this step.
import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');

// app files (sw.js and the 1.5 MB asm.js engine are web/file:// only — not needed in the apps)
const FILES = [
  'config.js', 'chess.min.js', 'openings.json', 'privacy.html', 'manifest.json',
  'icon-192.png', 'icon-512.png', 'logo.svg',
  'stockfish-19-lite-single.js', 'stockfish-19-lite-single.wasm', // main engine (Stockfish 19 NNUE)
  'stockfish.wasm.js', 'stockfish.wasm'                           // fallback engine
];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const f of FILES) {
  if (!existsSync(join(root, f))) throw new Error('missing app file: ' + f);
  cpSync(join(root, f), join(out, f));
}
cpSync(join(root, 'sounds'), join(out, 'sounds'), { recursive: true });
cpSync(join(root, 'puzzles'), join(out, 'puzzles'), { recursive: true }); // offline puzzle set (npm run puzzles)
cpSync(join(root, 'pieces'), join(out, 'pieces'), { recursive: true });   // piece sets (Settings → Pieces)
cpSync(join(root, 'mascot'), join(out, 'mascot'), { recursive: true });   // Pawnzo's faces (npm run mascot)

// native bridge → one IIFE bundle (Capacitor core + plugins)
await build({
  entryPoints: [join(root, 'native', 'bridge.js')],
  bundle: true, minify: true, format: 'iife', target: ['es2020'],
  outfile: join(out, 'native.bundle.js'), logLevel: 'warning'
});

// index.html with the bridge loaded right after config.js (before the app script)
const html = readFileSync(join(root, 'index.html'), 'utf8');
const tag = '<script src="config.js"></script>';
if (!html.includes(tag)) throw new Error('config.js script tag not found in index.html');
writeFileSync(join(out, 'index.html'), html.replace(tag, tag + '\n<script src="native.bundle.js"></script>'));

console.log('www/ built:', FILES.length + 4, 'entries');
