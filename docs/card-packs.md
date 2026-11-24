# Card packs (v17, Nov 23) — replaces the rewards tracks

Runs give **XP** and **Cash**. XP levels up the Levels track, Cash buys packs, duplicates become **Clout**, Clout crafts
missing cards. Rating only opens cosmetics. Everything lives in `game/ui.js` ("rewards" section); card sets come from
`sim/cards.py` (`c.set`, exported as `set`).

## Sets
| Set | Opens | Price | Contents |
| --- | --- | --- | --- |
| 1 Side Hustles | Level 1 | 100 | 2 support cards per tribe (the old track levels 1–7), the 7 single-tribe legendaries, Housing Co-op |
| 2 New Wave | Level 10 | 120 | The 7 new playstyles (6 cards each), 4 two-tribe legendaries covering every tribe |
| 3 Hot Takes | Level 20 | 140 | 2 support cards per tribe + 2 Neighbours, 4 more two-tribe legendaries, The Heretic |

Base cards are owned from the start. A set's packs hold 2 cards, 3 after level 5 / 15 / 25 (sets 1 / 2 / 3).

## Odds and economy
- Rarity follows the tier: 1–2 common, 3–4 rare, 5–6 epic; legendaries are their own rarity.
- Every card but the last: 65% common, 27% rare, 8% epic. Last card: 69% rare, 25% epic, 6% legendary.
  A set without a rarity gives the nearest one it has. A legendary is guaranteed in the 10th pack without one (pity).
- Duplicates: 5 / 15 / 30 / 100 Clout. Crafting: 40 / 100 / 240 / 600 Clout.
- Cash per run: 80, 70, 60, 50, 40, 32, 26, 20 (1st..8th). XP per level: 200 + 40 per level (30 levels).
- Simulated (`/tmp` econ model): a full collection takes about 430 runs; level 10 at ~55 runs, level 20 at ~165.

## Levels: the talent tree
Levels 1, 5, 10, 15, 20, 25 and 30 are milestones: 1/10/20 open a set (with a free pack), 5/15/25 add a card to that
set's packs, 30 gives a free pack of every set. Every other level (24 in all) is a talent: pick one of three, one per
direction, for good (`PROF.talents[level] = direction`). Your picks draw a path through the tree.

| Direction | Talents (they cycle row by row) |
| --- | --- |
| Passive Income | +5% Cash · packs −3% · +4 Cash a run · a free pack now |
| Clout Chasing | +10% Clout · crafting −4% · +1% legendary chance · pity 1 pack sooner |
| Grindset | +5% XP · +10 XP for a top-4 finish (alternating); +1 Boundaries at levels 9, 19 and 29 |

## Rating (the Night Line) — cosmetics
12 stations, 1,000–6,500 rating: 4 card sleeves (hand cards and pack card backs), 4 battle backgrounds (recolours of the
city in the shop and fights), 4 effects (neon attack trails, comic hit words, confetti knock-outs, a big entrance when you
play a minion). Cosmetics stay yours after a season reset. Equip in Collection › Style.

## Old profiles
Cards unlocked on the old tracks and legendaries reached on the old Night Line stay owned; players with past runs get
200 Cash. Levels are recomputed from XP; already-reached levels give their free packs, and open forks ask for a choice.

## The card shop and opening
The shop is a little store: packs (card-sized, the set's legendary in a window) stand on a shelf with price tags; the
till shows your Cash, the jar your Clout, the leaflet the odds. Opening happens in a dark room: swipe across the top of
the pack (or tap it three times), the cards slide out and are dealt face down with a rarity glow, tap to reveal.
Duplicates fade back and get a Clout stamp; new cards get a NEW sticker. Buttons: Collection (the card book at that
card), Open another, Back to the shop.

## Card books (Collection › Cards)
One book per tribe on a shelf; each spread shows two tiers (the last: legendaries and the pool rules). Tap a card you own
to put it in or take it out of the Feed pool, ⓘ for details. Rules per tribe: 2–4 cards per tier (counter "X/2"), 18 at
most, 1 legendary. Unowned cards from open sets are greyed out and craftable; cards from sets you can't open yet are "?".
