# Late Stage

A satirical autobattler about modern life, inspired by Hearthstone Battlegrounds. Offline, single-player against 7 bots, built for phones in landscape.

**Play in the browser:** https://elschmoko.github.io/Late-stage/
**Android app:** download the latest APK from [Releases](https://github.com/ElSchmoko/Late-stage/releases/latest).

## How the pieces fit

| Folder | What it is |
| --- | --- |
| `game/` | The web game: `engine.js` (rules, a port of the balance simulator), `lobby.js` (8-player lobby), `ui.js` (shop, drag and drop, animated combat), `style.css`, `data.js` (generated card data and art). `build.py` bundles everything into one `index.html` with embedded fonts. |
| `android/` | A thin Android app. It loads the GitHub Pages build, so the game updates on its own whenever `game/` changes. Offline, it plays a copy bundled into the APK. It also checks GitHub Releases and offers newer APKs. |
| `art/` | Every card and hero portrait as an SVG, drawn by `tools/artkit.py` and the `tools/p_*.py` specs. |
| `sim/` | `cards.py` is the card list (names, stats, text); the rest is the original Python simulator, which predates the v5 rework. Balance is now tested with the game engine itself (`node game/simtest.js`, `node game/power.js`). |
| `docs/` | Battlegrounds research, the v5 card rework, the v6 hero rework / tripled minions / rating ladder, and the per-card strength tables. |
| `tools/` | Generators for the art, the card data export and the design boards. |

## Automatic builds

- Push to `game/` → **Deploy web game to GitHub Pages** rebuilds the site. The Android app picks it up on next launch.
- Push to `android/` (or run the workflow by hand) → **Build Android APK** builds a signed APK and publishes it as release `build-N`. Installed apps see the new release and offer the download.

The APK is signed with the committed key in `android/signing/` (see the README there), so every build installs over the previous one.

## Working on it locally

```bash
python3 tools/export_game.py      # cards.py + art/ -> game/data.js
python3 game/build.py             # -> dist/index.html (open it in a browser)
node game/simtest.js 1600         # bot-only lobbies: average placement per playstyle
node game/power.js 600            # per-card strength table
node game/herosim.js 1800         # average placement per hero
node game/skillsim.js 800 0 1     # bot skill 0 vs skill 1 in the same lobbies
node game/laddersim.js 160        # where a player of fixed skill settles on the rating ladder
```

Full balance check (12 dimensions, see `docs/balance-method.md`):

```bash
node game/balance/sim.js cards 250 > cards.json
node game/balance/sim.js styles 3200 160 > styles.json
node game/balance/report.js cards.json styles.json > docs/balance/report.md
```
