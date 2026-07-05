# 🤡 Clown Analyzer

Free chess game analysis in your browser. How many Clown moves did you play?

## Features

- **Import games** from Chess.com or Lichess (username or profile link), or paste any PGN
- **Full game review** — every move graded from **Brilliant (!!)** to **Clown (??)**, powered by Stockfish running locally in your browser (WASM, parallel workers)
- **Accuracy % and estimated Elo** for both players
- **Eval graph** (clickable), key moments, best & worst move highlights, opening detection
- Deep cached evaluations for opening positions via the Lichess cloud API
- Live analysis board with top-3 engine arrows, drag-and-drop pieces, move animations and sounds
- **Share report card** — export your game review as an image

## Run locally

Double-click `start-server.bat` (Windows, needs Python), or:

```
python -m http.server 8777
```

then open http://localhost:8777. Serving over HTTP enables the fast WASM engine; opening `index.html` directly also works but falls back to a slower engine.

## Credits

- Engine: [Stockfish.js](https://github.com/nmrugg/stockfish.js) (GPL)
- Move validation: [chess.js](https://github.com/jhlywa/chess.js)
- Game data: Chess.com and Lichess public APIs
- Move sounds from [freesound](https://freesound.org) community
