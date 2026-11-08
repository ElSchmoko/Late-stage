# In-game card change log

The game has a "Card changes" panel, opened from the icon on the title screen and from the pause menu. A red dot on the title icon marks a version the player hasn't opened yet. For each version, the panel shows each changed card's face before and after:

- Changed stats glow green (up) or red (down); changed text and tier are highlighted.
- New cards are tagged NEW, and retired cards RETIRED (greyed out).

It lists card changes only, and builds them automatically from `game/data.js`, so the text matches the cards exactly.

**For every release with card changes**, after exporting the card data:

```bash
python3 tools/changelog.py add v13 <commit before the changes>
python3 game/build.py --out dist --artifact
```

`add` compares the card data at that commit against the working copy and puts the result at the top. Running it again with the same label replaces that entry. `rebuild` regenerates the history from the `VERSIONS` list in the script.

Releases are grouped into larger updates: edit `VERSIONS` (the newest entry can use `None` as head for the working copy) and run `rebuild`.
