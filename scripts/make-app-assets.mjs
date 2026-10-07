// Renders the source images for `npm run assets` (Capacitor icon/splash generator):
//   assets/icon-only.png        full icon (iOS + legacy Android)
//   assets/icon-foreground.png  Android adaptive icon foreground (pawn, transparent, safe-zone sized)
//   assets/icon-background.png  Android adaptive icon background (brand gradient)
//   assets/splash.png / splash-dark.png  2732x2732 launch screens
// Zero dependencies: draws with plain math and writes PNGs with node:zlib.
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(outDir, { recursive: true });

function crc32(buf) { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePNG(path, w, h, rgba) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

// Pawn + clown nose in a 512-unit design space. Returns [r,g,b] or null.
function pawnColor(x, y) {
  const inRR = (y0, y1, hw, r) => {
    if (y < y0 || y > y1) return false; const dx = Math.abs(x - 256); if (dx > hw) return false;
    const rx = hw - r; if (dx <= rx) return true;
    const ny = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y; if (ny === y) return true;
    return (dx - rx) ** 2 + (y - ny) ** 2 <= r * r;
  };
  if ((x - 256) ** 2 + (y - 186) ** 2 <= 20 * 20) return [230, 70, 70];              // clown nose
  if ((x - 256) ** 2 + (y - 168) ** 2 <= 60 * 60) return [245, 243, 235];             // head
  if (inRR(206, 224, 52, 8)) return [245, 243, 235];                                  // collar
  if (y >= 214 && y <= 352 && Math.abs(x - 256) <= 64 + (150 - 64) * (y - 214) / 138) return [245, 243, 235]; // body
  if (inRR(346, 396, 104, 16)) return [245, 243, 235];                                // base
  return null;
}
const grad = t => [Math.round(124 - 60 * t), Math.round(108 + 88 * t), Math.round(240 - 50 * t)]; // violet → teal

// Render a square tile. mode: 'icon' (gradient+pawn), 'fg' (pawn only, transparent), 'bg' (gradient only).
function tile(size, mode, pawnScale = 1, SS = 2) {
  const S = size * SS, out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const X = (x * SS + sx + 0.5) / S, Y = (y * SS + sy + 0.5) / S; // 0..1
      let c = null, al = 0;
      if (mode !== 'fg') { c = grad((X + Y) / 2); al = 255; }
      if (mode !== 'bg') {
        const p = pawnColor(256 + (X * 512 - 256) / pawnScale, 256 + (Y * 512 - 256) / pawnScale);
        if (p) { c = p; al = 255; }
      }
      if (c) { r += c[0]; g += c[1]; b += c[2]; } a += al;
    }
    const n = SS * SS, o = (y * size + x) * 4, cov = a / 255;
    out[o] = cov ? Math.round(r / cov) : 0; out[o + 1] = cov ? Math.round(g / cov) : 0;
    out[o + 2] = cov ? Math.round(b / cov) : 0; out[o + 3] = Math.round(a / n);
  }
  return out;
}

writePNG(join(outDir, 'icon-only.png'), 1024, 1024, tile(1024, 'icon'));
writePNG(join(outDir, 'icon-foreground.png'), 1024, 1024, tile(1024, 'fg', 0.62)); // inside the 66% safe zone
writePNG(join(outDir, 'icon-background.png'), 1024, 1024, tile(1024, 'bg', 1, 1));

// Splash: dark brand background with a rounded icon tile in the middle.
const SP = 2732, T = 640, R = 150, off = (SP - T) / 2;
const splash = Buffer.alloc(SP * SP * 4);
for (let i = 0; i < SP * SP; i++) { splash[i * 4] = 13; splash[i * 4 + 1] = 15; splash[i * 4 + 2] = 26; splash[i * 4 + 3] = 255; }
const icon = tile(T, 'icon');
for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
  const cx = Math.min(Math.max(x, R), T - R), cy = Math.min(Math.max(y, R), T - R);
  const d = Math.hypot(x - cx, y - cy); if (d > R) continue;          // rounded corners
  const k = Math.min(1, R - d + 0.5);                                   // 1px soft edge
  const s = (y * T + x) * 4, o = ((y + off) * SP + (x + off)) * 4;
  for (let c = 0; c < 3; c++) splash[o + c] = Math.round(splash[o + c] * (1 - k) + icon[s + c] * k);
}
writePNG(join(outDir, 'splash.png'), SP, SP, splash);
writePNG(join(outDir, 'splash-dark.png'), SP, SP, splash);
console.log('assets/ written: icon-only, icon-foreground, icon-background, splash, splash-dark');
