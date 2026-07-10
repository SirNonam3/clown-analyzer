# Deploying Clown Analyzer to Cloudflare Pages (free)

The site is 100% static — no server code — so hosting is free.

## Files that must be uploaded together
- `index.html`
- `chess.min.js`  (move logic — bundled locally for offline)
- `stockfish-18-lite-single.js`, `stockfish-18-lite-single.wasm`  (main engine — Stockfish 18 NNUE)
- `stockfish.wasm.js`, `stockfish.wasm`, `stockfish.js`  (fallback engines — do not omit)
- `sounds/` folder (all mp3s)
- PWA files: `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-1024.png`, `.well-known/assetlinks.json`

Not needed online: `start-server.bat`, `freesound_community-chess-pieces-60890.mp3` (legacy, unused), `DEPLOY.md`.

## Option A — Direct upload (easiest, no git)
1. Create a free account at https://dash.cloudflare.com
2. Go to **Workers & Pages → Create → Pages → Upload assets**
3. Name the project (e.g. `clown-analyzer`) — this gives you `clown-analyzer.pages.dev`
4. Drag the files/folders listed above into the upload box → **Deploy**
5. Done. Every future update: open the project → **Create new deployment** → upload again.

## Option B — Git-connected (auto-deploy on push)
1. Put the folder in a GitHub repo
2. Cloudflare Pages → **Connect to Git** → pick the repo
3. Build settings: framework **None**, build command **empty**, output dir **/**
4. Every `git push` deploys automatically.

## Custom domain (optional, ~$10/yr)
Buy a domain (Cloudflare Registrar is at-cost), then in the Pages project:
**Custom domains → Set up a domain**. HTTPS is automatic.

## Before going public — checklist
- [ ] Replace `YOUR_USERNAME` in the ☕ Support link in `index.html` with your real Ko-fi/BuyMeACoffee page
- [ ] Stockfish is GPL: add a small credits line/link (e.g. in the footer) to https://github.com/nmrugg/stockfish.js — required for compliance
- [ ] Lichess cloud evals are a free public API — fine at small scale; if traffic grows large, add caching or reduce the prefetch count
- [ ] Chess.com public API: free; re-check their ToS when you add paid features

## Alternatives
Netlify (drag & drop at https://app.netlify.com/drop) and GitHub Pages work identically for this site.
