# Balance method (v8)

Until now, balance rested on two numbers: average placement per playstyle, and one "places gained" value per card. That misses whole classes of problems:

- **A card that is strictly better than another.** Comment Section is Reply Guy with a second Follower at the same tier.
- **A tribe whose cards are interchangeable,** or that all use the same trigger.
- **A style with no card at some tier.**
- **A card that is strong because it's generic,** so every tribe takes it.
- **A tribe that only works early or only late.**

This method checks twelve dimensions. Some are static checks on the card text; the rest come from simulations. Each has an explicit target, so a run produces a list of flags instead of a judgement call.

## Where the ideas come from

| Source | Idea | How it's used here |
| --- | --- | --- |
| Magic's "vanilla test" (stats per cost) | A card's rate is judged against a plain body of the same cost. | Every card is compared with a plain minion of its tier's average stats ("Effect"). |
| 17lands Limited metrics (in-hand vs opening-hand vs drawn-late win rates, improvement when drawn, pick order) | A card's impact depends on when you get it. Raw win rates are biased by the decks a card lands in. Pick rate shows what players think. | "Late" timing value, "Outside" context value, and "Bought" uptake. |
| HSReplay's Battlegrounds hero analysis | Two heroes can share an average placement while one wins often and the other rarely wins. | 1st-place and 8th-place rates per style, not just the average. |
| Riot's TFT set learnings | Power that doesn't match cost frustrates players. Unit timing matters. Traits need effects that change play, not just stats. Overnerfs wreck builds, so change things in small steps. | Power for tier, phase win rates, variety. Fixes are kept small and re-measured. |
| Magic's Limited mechanics guidance | Linear mechanics need enough support per pack, and tribes need enablers before payoffs. Concentrating a mechanic keeps a theme cohesive. | Cohesion (synergy inside vs outside the tribe), style coverage per tier, redundancy. |
| Slay the Spire's design goals | Every card should have a place, and nothing should warp the game. Rarer cards can be stronger. Use pick rate and win rate together. | Uptake (dead cards), generic-power flags. Higher tiers may be stronger because they are rarer in the pool. |
| Schreiber & Romero, *Game Balance* | Transitive balance: cost should match benefit. Change one thing at a time. | Tier-relative targets; fixes measured one round at a time. |

## The twelve dimensions

| # | Dimension | Question | Measured by | Target |
| --- | --- | --- | --- | --- |
| 1 | Power for tier | Is the card's effect worth about what other effects of its tier are worth? | **Effect** = places gained by a bot of the card's tribe that gets it free at the start of the turn its tier opens (turns 1/3/5/7/9/11, played with the bot's own gold), minus a plain minion of the tier's average stats. Measured over the same lobbies with and without the card, counting only lobbies where the bot is still alive at that turn. | Within −0.40…+0.45 of the tier median. |
| 2 | Inner-tribe parity | Inside one tribe and tier, are the options comparable? | Spread of Effect within tribe × tier. | Spread ≤ 0.60. |
| 3 | Dominance | Is any card simply better than another? | Static: same tribe, same or lower tier, identical effect structure (trigger, action, scope), every number ≥ and stats ≥. | None. |
| 4 | Redundancy | Do too many cards in a tribe do the same thing? | Static: cards sharing an exact effect signature. | At most 2 per signature. |
| 5 | Variety | Does a tribe use a range of triggers? | Static: share of the tribe's triggers taken by the most common one. | ≤ 40%. |
| 6 | Tribe curve | Does each tribe have something worthwhile at every tier, and does it compete in every game phase? | (a) A tribe's average card value per tier vs all tribes. (b) Each style needs a card at tiers 1–4. (c) Each style's win rate in decided fights (draws left out) in the early (turns 1–4), mid (5–8), late (9–12) and end (13+) game, compared with all styles in the same phase. Late phases contain only survivors, so their raw rates run high. | (a) 60–150% of the tier average. (b) Covered. (c) Within ±10 points of the phase average. |
| 7 | Timing | Is a cheap card secretly a late-game card? | **Late** = value when bought 3 turns after its tier opens, vs on curve. | Tier 1–2 cards gain ≤ 0.35 by being bought late. |
| 8 | Cohesion | Do the tribe's cards work together, or are they generic power? | **Outside** = Effect in a bot of another tribe. **Synergy** = Effect − Outside. | ≥ 50% of a tribe's cards have Synergy > 0.10. No tribe card worth > 0.35 outside its tribe without being worth more inside it. |
| 9 | Archetypes | Are both styles of every tribe viable? | Average placement per style, standard bots. | Band ≤ 0.60, all better than the big-stats bot. |
| 10 | Variance | Does a style win sometimes, and avoid bottoming out? | 1st-place and 8th-place rates. | 1st 9–17%, 8th ≤ 17%. |
| 11 | Skill robustness | Does balance hold when bots play well? | Placement band with full-skill bots (scouting, simulated buying). | Band ≤ 0.90 (fewer samples). |
| 12 | Uptake | Is any card never taken, or always taken? | How often standard bots hire a card when the Feed offers it, vs the tier median. | 35%–250% of the tier median. |

**Style placements are noisier than they look.** Players in one lobby share its mix of tribes, so their results are correlated. In testing, the same build gave the Followers style 4.41 on one set of 1,400 lobbies and 4.79 on another. The style run therefore uses 3,200 lobbies, split into two halves, and the report states how far the halves disagree. Differences between styles smaller than about half that gap are noise.

## 13 · Build-around ceiling (added after Enlightened Guru)

A player found that Enlightened Guru ("your other Attention Seekers take at most 3 damage at a time") won lobbies almost on its own when built around. The suite had flagged it as the strongest tier-6 card by a factor of four, but it wasn't fixed, and two blind spots made it look smaller than it was:

1. **Bots didn't play their style.** A bot's buying followed its tribe; the style label barely changed anything. So no bot ever stacked Attention Seekers the way a Stoics player does. Bots now value their own style's cards more (`STYLE_PULL`), which makes the two styles of a tribe real archetypes.
2. **Averages hide combos.** "Power for tier" averages a card over both styles of its tribe. A card that is broken in one build and useless in the other looks fine.

| # | Dimension | Question | Measured by | Target |
| --- | --- | --- | --- | --- |
| 13 | Build-around ceiling | How strong is the card in the build that fits it best? | Effect measured separately in each style of its tribe (`--ceiling`); the best one counts. | ≤ tier median + 0.60. |

Bots still play a build-around less sharply than a person who skips buys to protect it, so treat a ceiling near the limit as a warning, and do a hands-on test.

Run it for a tribe or single cards: `node game/balance/sim.js cards 300 Philosopher --ceiling "--card=Enlightened Guru"`.

| Version | Average | Stoics (best) |
| --- | --- | --- |
| Old Guru (cap on every hit) | +1.12 | +1.15 |
| Cap on the first hit each combat | +0.13 | +0.13 |
| **Cap on the first two hits each combat (shipped)** | **+0.36** | **+0.40** |

The tier-6 median is about +0.25–0.30.

The thresholds come from the noise level. With 250 paired lobbies, a card's Effect has a standard error of about ±0.10–0.12, so a ±0.4 gap from the median is about 3–4 standard errors. Bot uptake reflects the bots' buying rules, not human taste, so it only flags extremes.

## Running it

```bash
node game/balance/sim.js cards 250 > cards.json          # dimensions 1, 2, 6a, 7, 8 (about 25 CPU-minutes)
node game/balance/sim.js styles 3200 160 > styles.json   # dimensions 6c, 9, 10, 11, 12 (two halves for a noise check)
node game/balance/report.js cards.json styles.json > docs/balance/report.md
```

`game/balance/model.js` holds the static card model: each rules sentence parsed into trigger, action, amount and scope. Dimensions 3–5 and 6b use it.

## How to act on flags

1. Fix dominance and coverage first. These are design errors, not numbers.
2. Then fix cards outside the power band, starting with the furthest. Prefer changing the effect to changing the body, so the card keeps its identity.
3. Re-run, then check archetypes and heroes. Fix in small steps: a large nerf to a tribe's engine card dropped that tribe to last in v7.
4. Accept a flag only on purpose, and write down why. For example, a tier-6 capstone may be a tribe's strongest card.

## 14 · Expert play (Nov 6)

**Why.** The bots measured a card as a standard player would use it. Our card decisions lean on these numbers, so where a strong player gets far more out of a card than the bot does, we misjudge it. Earlier cases: Enlightened Guru (bots didn't build around Attention Seekers), the Jingle Writer and Reunion Tour combo (bots sold too late), and Main Character boards of 5,000+ stats (bots peaked around 3,300).

**What the bot was missing** (audit of the decision code):

| # | Gap | Effect on measurements |
| --- | --- | --- |
| 1 | Buying was synergy-blind: a card was valued by stats, tribe, style and "is it an engine", never by what it does with this board | Engines that need partners were undervalued: Personal Brand with Main Character, Reunion Tour with sell cards, Ancient Oak with end-of-turn givers |
| 2 | "When sold" cards were sold a turn late or never; Greatest Hits was never looped; Sneaker Reseller and Private Equity got no deliberate sale; Punks were sold even with Squat Collective out | Sell styles were undervalued |
| 3 | Positioning: one giver on each side of the carry, nothing else | Neighbour cards were undervalued: Beehive, Tree Hugger, Wild Boar, Thought Experiment, Shower Thinker, Pub Philosopher, Caretaker, Middle Manager fodder, Landlord, Leaf Blower Guy, Clock In order |
| 4 | Leftover gold was wasted with spend engines out | Passive Income was undervalued |
| 5 | No digging for missing pieces, and capstones were valued like any other card | Build-arounds came together less often |

**The expert layer** (`game/engine.js`, "expert play"). It is on for every bot at skill 0.8+ (the top rating brackets) and for the whole lobby with `--expert`.

- **Synergy-aware value.** Each card's text is tagged by mechanic: Likes, Followers, selling, Legacy, next-combat buffs, Attention Seekers, Collab, Scroll, Rebrand, end of turn, spending, kills, Creative plays, deaths, Feed, Clock In, damage. A card gains value for each board minion that shares a tag (capped at 3 per tag). A missing style capstone is worth +8 from tier 5, so triple Discovers pick it.
- **Sell plays.**
  - Sellout Frontman is sold at once with two or more other Punks.
  - Zine Maker moves left of the carry, then is sold.
  - Anarchist Barista is sold at once with Greatest Hits.
  - Greatest Hits loops: sell a spare Punk, buy the copy back, three times a turn.
  - Sneaker Reseller and Private Equity get one sale a turn.
  - When-sold Punks are kept while Squat Collective is out.
- **Positioning.** The board order is hill-climbed by swaps to maximise neighbour effects:
  - Ferals next to Beehive, Tree Hugger and Wild Boar; Philosophers next to Thought Experiment and Bestselling Author.
  - Shower Thinker and Pub Philosopher pointing at the carry.
  - Fodder left of Middle Manager and next to The Landlord; Leaf Blower Guy away from fragile minions.
  - Clock In minions on the left, so they attack first.
- **Gold.** Leftover gold is scrolled with Thought Leader or Unicorn Startup out, since scrolling counts as spending. The bot digs (up to 5 times) for its tribe.
- **Performers.** With "after you play a Creative" engines out, the bot keeps buying Creatives onto a full board, selling the weakest each time.

Tried and dropped, because it made bots weaker:
- Saving Likes for Main Character: Likes spent now win fights now.
- Scrolling up to 4 times a turn for the capstone: about a 3% chance per Feed, and the gold is missed elsewhere.

**Validation.** In mixed lobbies (half expert, half standard, 1,500 lobbies), experts place 4.28 against 4.72. Every style gains: from +0.11 (Performers) to +0.78 (Passive Income).

**How to use it.** Measure with `--expert` from now on. Treat the standard numbers as how an average player sees a card:

```bash
node game/balance/sim.js styles 3200 1 --expert > styles.json
node game/balance/sim.js cards 150 Hustler,Influencer --expert > cards.json
```

**What changed in the readings** (150 lobbies per card; the eight biggest moves rechecked at 450):

- Most card verdicts hold. In the 150-lobby runs, eight cards moved by about 0.4 or more. At 450 lobbies only Sneaker Reseller kept its move: +0.32 → +0.67 above the tier-2 median, now over the band, because the bot now sells deliberately each turn. The others were noise. Urban Fox, Nihilist and Shower Thinker gained less than 0.15.
- Creatives read a little lower with good play: Indie Band +0.58 → +0.45, Museum Retrospective +0.52 → +0.37. Their edge over a plain minion shrinks when the rest of the lobby also builds well.
- Ceilings rise. Top-10% boards at turn 14 (standard → expert):

| Style | Standard | Expert |
| --- | --- | --- |
| Big Ideas | 989 | 1,388 |
| Main Character | 675 | 927 |
| Exits | 694 | 880 |
| Followers | 472 | 621 |

  The largest Stoics board grows from 1,815 to 2,963. The style order barely moves: Main Character (5.02) and Followers (4.82) are still last, and Overgrowth, Sellouts, Scavengers and Sabotage still lead.
- Noise: two 150-lobby card runs disagree by up to ±0.4 on a single card. Recheck any single-card decision at 450 lobbies or more with `--card=`.
