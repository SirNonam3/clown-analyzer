// Pawnzo — the Clown Analyzer mascot. Writes mascot/<mood>.svg (head-sticker crop of the logo clown).
//   node scripts/make-mascot.mjs
// Moods: happy (default) · laugh (Clown move) · wow (brilliant) · cool (clean game / streak) · think (analysing) · sad (rough game)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'mascot');
mkdirSync(out, { recursive: true });

const DEFS = `<defs>
  <linearGradient id="piece" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#c3b9ff"/><stop offset="0.5" stop-color="#8f84f6"/><stop offset="1" stop-color="#4fd1c5"/></linearGradient>
  <radialGradient id="nose" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#ff7a85"/><stop offset="1" stop-color="#e02f45"/></radialGradient>
  <linearGradient id="red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4458"/><stop offset="1" stop-color="#d81f3a"/></linearGradient>
  <clipPath id="hatClip"><path d="M218 122 L294 122 L262 40 Z"/></clipPath>
  <filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter></defs>`;
// same clown as logo.svg (hair, pawn head, circus hat, bow tie) without the background
const BODY = `<g fill="#ff3b5c" opacity="0.45" filter="url(#blur)"><circle cx="256" cy="180" r="74"/></g>
  <circle cx="186" cy="150" r="22" fill="#ff3b4f"/><circle cx="173" cy="178" r="20" fill="#ff6a3d"/><circle cx="186" cy="205" r="17" fill="#e0283c"/>
  <circle cx="326" cy="150" r="22" fill="#ff3b4f"/><circle cx="339" cy="178" r="20" fill="#ff6a3d"/><circle cx="326" cy="205" r="17" fill="#e0283c"/>
  <g fill="url(#piece)"><circle cx="256" cy="180" r="68"/><rect x="188" y="244" width="136" height="26" rx="13"/>
    <path d="M214 268 C214 290 208 300 200 312 L312 312 C304 300 298 290 298 268 Z"/></g>
  <g clip-path="url(#hatClip)"><rect x="200" y="30" width="110" height="100" fill="#fff6ee"/>
    <g fill="url(#red)"><path d="M200 118 L310 78 L310 96 L200 136 Z"/><path d="M200 84 L310 44 L310 62 L200 102 Z"/><path d="M200 50 L310 10 L310 28 L200 68 Z"/></g></g>
  <circle cx="262" cy="40" r="15" fill="#ffd23f"/>
  <path d="M256 257 L212 236 L212 278 Z" fill="url(#red)"/><path d="M256 257 L300 236 L300 278 Z" fill="url(#red)"/><circle cx="256" cy="257" r="11" fill="#ffd23f"/>
  <path d="M206 150 A58 58 0 0 1 238 120" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.4"/>`;
const NOSE = `<circle cx="256" cy="200" r="18" fill="url(#nose)"/><circle cx="250" cy="194" r="5" fill="#fff" opacity="0.65"/>`;
const INK = '#1b1638';
const eyes = (px = 0, py = 0, pr = 8) => `<path d="M232 140 L246 170 L232 200 L218 170 Z" fill="#fff"/><path d="M280 140 L294 170 L280 200 L266 170 Z" fill="#fff"/>
  <circle cx="${232 + px}" cy="${170 + py}" r="${pr}" fill="${INK}"/><circle cx="${280 + px}" cy="${170 + py}" r="${pr}" fill="${INK}"/>
  <circle cx="${234.5 + px}" cy="${167 + py}" r="2.8" fill="#fff"/><circle cx="${282.5 + px}" cy="${167 + py}" r="2.8" fill="#fff"/>`;
const star = (x, y, s, c = '#ffd23f') => `<path d="M${x} ${y - s} Q${x + s * .18} ${y - s * .18} ${x + s} ${y} Q${x + s * .18} ${y + s * .18} ${x} ${y + s} Q${x - s * .18} ${y + s * .18} ${x - s} ${y} Q${x - s * .18} ${y - s * .18} ${x} ${y - s}Z" fill="${c}"/>`;
const FACES = {
  happy: eyes() + `<path d="M220 212 Q256 254 292 212 Q256 230 220 212 Z" fill="#e02f45" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>` + NOSE,
  laugh: `<path d="M219 176 Q232 158 245 176" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <path d="M267 176 Q280 158 293 176" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <path d="M208 180 q-7 11 0 16 q7 -5 0 -16z" fill="#7dd3fc"/><path d="M304 180 q-7 11 0 16 q7 -5 0 -16z" fill="#7dd3fc"/>
    <path d="M214 206 Q256 284 298 206 Q256 222 214 206 Z" fill="#7a0f22" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
    <ellipse cx="256" cy="236" rx="15" ry="6" fill="#ff7a85"/>` + NOSE,
  wow: `<path d="M214 136 Q232 122 250 136" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M262 136 Q280 122 298 136" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="232" cy="168" r="16" fill="#fff"/><circle cx="280" cy="168" r="16" fill="#fff"/>
    <circle cx="232" cy="168" r="6" fill="${INK}"/><circle cx="280" cy="168" r="6" fill="${INK}"/>
    <circle cx="234" cy="165" r="2.3" fill="#fff"/><circle cx="282" cy="165" r="2.3" fill="#fff"/>
    <ellipse cx="256" cy="238" rx="11" ry="14" fill="#7a0f22" stroke="#fff" stroke-width="5"/>` + NOSE
    + star(168, 96, 16) + star(346, 92, 13) + star(352, 232, 11, '#ff9cc0') + star(160, 250, 9, '#ff9cc0'),
  cool: `<path d="M194 160 L214 164 M318 160 L298 164" stroke="#14112b" stroke-width="5" stroke-linecap="round"/>
    <rect x="210" y="154" width="42" height="28" rx="11" fill="#14112b"/><rect x="260" y="154" width="42" height="28" rx="11" fill="#14112b"/>
    <rect x="248" y="161" width="16" height="6" rx="3" fill="#14112b"/>
    <path d="M218 172 L232 160 M268 172 L282 160" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.65"/>
    <path d="M224 214 Q256 246 288 214 Q256 226 224 214 Z" fill="#e02f45" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>` + NOSE + star(340, 92, 17),
  think: `<path d="M218 146 L244 146" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M266 140 Q280 128 294 140" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` + eyes(5, -8, 7)
    + `<path d="M238 230 Q252 222 272 230" fill="none" stroke="#e02f45" stroke-width="8" stroke-linecap="round"/>` + NOSE
    + `<circle cx="326" cy="118" r="6" fill="#fff" opacity=".9"/><circle cx="341" cy="99" r="8" fill="#fff" opacity=".9"/><circle cx="359" cy="78" r="11" fill="#fff" opacity=".9"/>`,
  sad: `<path d="M216 150 L242 140" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M296 150 L270 140" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`
    + eyes(0, 7, 7) + `<path d="M222 198 q-7 11 0 16 q7 -5 0 -16z" fill="#7dd3fc"/>
    <path d="M222 244 Q256 212 290 244 Q256 232 222 244 Z" fill="#e02f45" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>` + NOSE,
};
for (const [mood, face] of Object.entries(FACES)) {
  writeFileSync(join(out, `${mood}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="121 32 270 270" width="270" height="270">\n<!-- Pawnzo · ${mood} — generated by scripts/make-mascot.mjs -->\n${DEFS}<g transform="translate(0 20)">${BODY}${face}</g></svg>\n`);
}
console.log('mascot/: ' + Object.keys(FACES).join(', '));
