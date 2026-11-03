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
