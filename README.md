# Late Stage

A satirical autobattler about modern life, inspired by Hearthstone Battlegrounds. Offline, single-player against 7 bots, built for phones in landscape.

**Play in the browser:** https://elschmoko.github.io/late-stage/
**Android app:** download the latest APK from [Releases](https://github.com/ElSchmoko/late-stage/releases/latest).

## How the pieces fit

| Folder | What it is |
| --- | --- |
| `game/` | The web game: `engine.js` (rules, a port of the balance simulator), `lobby.js` (8-player lobby), `ui.js` (shop, drag and drop, animated combat), `style.css`, `data.js` (generated card data and art). `build.py` bundles everything into one `index.html` with embedded fonts. |
| `android/` | A thin Android app. It loads the GitHub Pages build, so the game updates on its own whenever `game/` changes. Offline, it plays a copy bundled into the APK. It also checks GitHub Releases and offers newer APKs. |
| `art/` | Every card and hero portrait as an SVG, drawn by `tools/artkit.py` and the `tools/p_*.py` specs. |
| `sim/` | The Python balance simulator the card set was tuned with (`python3 sim/lobby.py 1500`). |
| `tools/` | Generators for the art, the card data export and the design boards. |

## Automatic builds

- Push to `game/` → **Deploy web game to GitHub Pages** rebuilds the site. The Android app picks it up on next launch.
- Push to `android/` (or run the workflow by hand) → **Build Android APK** builds a signed APK and publishes it as release `build-N`. Installed apps see the new release and offer the download.

The APK is signed with the committed key in `android/signing/` (see the README there), so every build installs over the previous one.

## Working on it locally

```bash
python3 tools/export_game.py      # cards.py + art/ -> game/data.js
python3 game/build.py             # -> dist/index.html (open it in a browser)
node game/simtest.js 300          # bot-only lobbies, sanity check of the engine
python3 sim/lobby.py 1500         # the original Python simulator
```
