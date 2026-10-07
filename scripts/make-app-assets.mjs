// Generates every icon from the master logo (logo.svg):
//   web:  icon-192.png, icon-512.png, icon-1024.png (full), icon-maskable-512.png (safe-zone padded)
//   apps: assets/icon-only.png, icon-foreground.png + icon-background.png (Android adaptive),
//         splash.png / splash-dark.png — then `@capacitor/assets` turns these into all native sizes.
// Change the logo → edit logo.svg → `npm run assets`.
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');
mkdirSync(assets, { recursive: true });

const logo = readFileSync(join(root, 'logo.svg'), 'utf8');
const BG = ['<rect width="512" height="512" fill="#0f1124"/>', '<rect width="512" height="512" fill="url(#bgGlow)"/>'];
for (const b of BG) if (!logo.includes(b)) throw new Error('logo.svg background rect not found: ' + b);

// layers: background only / everything except the background
const defsEnd = logo.indexOf('</defs>') + '</defs>'.length;
const bgOnly = logo.slice(0, defsEnd) + BG.join('') + '</svg>';
const fgOnly = BG.reduce((s, b) => s.replace(b, ''), logo);

const png = (svg, size) => sharp(Buffer.from(svg), { density: Math.ceil(72 * size / 512 * 1.5) })
  .resize(size, size).png().toBuffer();
// put a layer scaled by `scale` in the middle of a background layer (or transparent)
async function composed(size, scale, background) {
  const inner = Math.round(size * scale);
  const fg = await png(fgOnly, inner);
  const base = background
    ? sharp(await png(bgOnly, size))
    : sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  return base.composite([{ input: fg, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }]).png().toBuffer();
}

// --- web / PWA ---
for (const s of [192, 512, 1024]) await sharp(await png(logo, s)).toFile(join(root, `icon-${s}.png`));
await sharp(await composed(512, 0.78, true)).toFile(join(root, 'icon-maskable-512.png')); // fits the 80% maskable circle

// --- native sources for @capacitor/assets ---
await sharp(await png(logo, 1024)).toFile(join(assets, 'icon-only.png'));
await sharp(await composed(1024, 0.64, false)).toFile(join(assets, 'icon-foreground.png')); // inside Android's 66% safe zone
await sharp(await png(bgOnly, 1024)).toFile(join(assets, 'icon-background.png'));

// splash: dark background + glow, the clown in the middle
const SP = 2732;
const splashBg = await sharp(Buffer.from(bgOnly), { density: 400 }).resize(SP, SP).png().toBuffer();
const clown = await png(fgOnly, 1100);
const splash = await sharp(splashBg).composite([{ input: clown, left: (SP - 1100) / 2, top: (SP - 1100) / 2 }]).png().toBuffer();
await sharp(splash).toFile(join(assets, 'splash.png'));
await sharp(splash).toFile(join(assets, 'splash-dark.png'));

console.log('icons generated from logo.svg');
