<img src="logo.svg" alt="Clown Analyzer logo" width="120" align="right">

# Clown Analyzer

Free chess game analysis — on the web, Android and iOS. How many Clown moves did you play?

**Web:** https://sirnonam3.github.io/clown-analyzer/

## Features

- **Import games** from Chess.com and Lichess at the same time (username or profile link), or paste any PGN / FEN
- **Full game review** — every move graded from **Brilliant (!!)** to **Clown (??)** (plus Miss), powered by **Stockfish 19 NNUE** running on your device (WASM, parallel workers)
- **Accuracy % and estimated Elo** for both players, eval graph, key moments, best & worst moves
- **Opening names** from the full Lichess opening database (3,865 lines) + deep cached Lichess cloud evals
- **History** — every review is saved on your device; reopen instantly, track your accuracy trend
- **Puzzles** generated from your own mistakes, plus the Lichess daily puzzle
- Live board with top-3 engine arrows, instant judgement of moves you try, drag-and-drop, animations, sounds
- **Share report card** as an image
- Installable PWA (works offline) and native **Android / iOS apps** (Capacitor)

## Project layout

| Path | What |
|---|---|
| `index.html` | the whole app (UI + engine glue + review logic) |
| `config.js` | account settings: ads, Premium keys, support link, analytics |
| `native/bridge.js` | app-only features: AdMob, RevenueCat Premium, haptics, share sheet |
| `scripts/build-www.mjs` | builds `www/` for the apps |
| `android/`, `ios/` | Capacitor native projects |
| `STORES.md` | how to publish on Google Play and the App Store |

## Run locally

Web: double-click `start-server.bat` (needs Python) or `python -m http.server 8777`, then open
http://localhost:8777.

Apps: `npm install` then `npm run sync`; every `git push` builds an Android APK and the iOS app on
GitHub Actions (see `STORES.md`).

Logo: `logo.svg` is the master. After editing it, `npm run assets` regenerates every web, Android and
iOS icon and splash screen (other logo options live in `branding/`).

## Credits

- Engine: [Stockfish.js](https://github.com/nmrugg/stockfish.js) (GPL-3.0)
- Move validation: [chess.js](https://github.com/jhlywa/chess.js)
- Openings: [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) (CC0)
- Game data: Chess.com and Lichess public APIs
- Move sounds from [freesound](https://freesound.org) community
