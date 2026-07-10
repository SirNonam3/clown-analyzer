# Publishing Clown Analyzer to Google Play

The app is now a **PWA** (Progressive Web App): installable, offline-capable, with an
icon and manifest. Google Play accepts PWAs wrapped as a **TWA** (Trusted Web Activity) —
a thin Android app that shows your live site full-screen with no browser UI.

## What's already done (in this repo)
- `manifest.json` — app name, icons, colors, standalone display
- `sw.js` — service worker (works offline after first load)
- `icon-192.png`, `icon-512.png`, `icon-1024.png` — app icons
- Local `chess.min.js` + Stockfish engine → runs offline
- `.well-known/assetlinks.json` — domain-verification file (needs your fingerprint, see below)

**Install it right now (no Play Store, free):** open the live site on Android Chrome →
menu → **Add to Home screen**. It launches full-screen like an app. This alone may be all
you need. The Play Store just gives you a store listing + discoverability.

## What only YOU can do
1. **Google Play Developer account** — one-time **$25** fee at https://play.google.com/console
2. **App signing** — Play generates/holds a signing key; you get a SHA-256 fingerprint
3. **Store listing** — screenshots, description, a privacy policy URL (required)

## Easiest path: PWABuilder (no local Android tooling)
1. Go to https://www.pwabuilder.com and enter your URL:
   `https://sirnonam3.github.io/clown-analyzer/`
2. It scores the PWA and lets you **Package for stores → Android**.
3. Choose the **"Trusted Web Activity"** package. Set:
   - Package ID: `com.clownanalyzer.twa` (or your own reverse-domain id — must stay constant forever)
   - App name: `Clown Analyzer`
   - Let PWABuilder generate the signing key (download and **back it up** — losing it means you can't update the app)
4. Download the `.zip`. It contains:
   - `app-release-bundle.aab` → this is what you upload to Play
   - `assetlinks.json` → **its `sha256_cert_fingerprints` value is what you paste** into
     this repo's `.well-known/assetlinks.json`, then `git push`. This proves you own the
     domain so the app opens with no browser address bar.
5. In the Play Console: create app → upload the `.aab` → fill the listing → submit for review
   (first review typically takes a few days).

## Alternative: Bubblewrap (CLI, more control)
Needs Node + JDK 17 + Android SDK. Then:
```
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://sirnonam3.github.io/clown-analyzer/manifest.json
bubblewrap build
```
Produces the same `.aab` + fingerprint. Same assetlinks step as above.

## After the fingerprint step
Update `.well-known/assetlinks.json` in this repo:
- replace `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT` with the value from PWABuilder/Play
- if you changed the package id, update `package_name` to match
- `git push` — GitHub Pages serves it at
  `https://sirnonam3.github.io/clown-analyzer/.well-known/assetlinks.json`

> Note: TWA verification requires the assetlinks.json to be at the **domain root**
> (`/.well-known/`). On a GitHub Pages *project* site it lives under the repo path. If
> verification fails, the simplest fix is a **custom domain** (e.g. clownanalyzer.com)
> pointed at GitHub Pages, with assetlinks.json at its root. Until then the app still works —
> it just may show a thin address bar.

## Store listing checklist
- [ ] Privacy policy URL (you can host a simple one on the same site)
- [ ] Feature graphic (1024×500) + at least 2 phone screenshots
- [ ] Short (80 char) + full description
- [ ] Content rating questionnaire (this app: Everyone)
- [ ] Category: Games → Board
