# v6: hero rework, tripled minions, rating ladder

## Hero rework

### What was wrong

- Only 4 of the 12 hero powers did anything in the engine. The other 8 showed text but had no effect, and bots never used a power.
- The ones that worked ignored the v5 mechanics.
- Several were plain stat drips. The Gym Bro, for example, gave +1/+1 at end of turn.

### Design rules taken from the v5 research

1. Every hero bends one rule or uses one v5 mechanic (Likes, Grievance, the Feed, Discover, Out of Office). None just adds stats.
2. Active powers are cheap (1–2 gold) and ask for a decision: which minion, and when.
3. Passives change how you build:
   - small board: Minimalist
   - wide board that trades: Complainer
   - saving gold: Procrastinator
   - hunting triples: Doomscroller
4. Power level is balanced with Boundaries (armour), as Battlegrounds does: strong powers get little armour, weak ones get a lot.
5. Every power runs in the engine, so bots use it too and it can be measured.

### The 12 heroes

| Hero | Power | Cost | Effect | Boundaries | Avg place |
| --- | --- | --- | --- | --- | --- |
| Remote Worker | Auto-Reply | Passive | Start of combat: give your left-most minion Out of Office. | 9 | 4.55 |
| Reply-All Guy | Reply All | 1 | Give a minion +1/+1, and every minion in the Feed +1/+1. | 5 | 4.40 |
| Gym Bro | Never Skip Leg Day | Passive | Every second turn: get a Like. | 5 | 4.65 |
| Procrastinator | Tomorrow | Passive | Unspent gold carries over to next turn, up to 3. | 1 | 4.45 |
| Bargain Hunter | Coupon Clipper | Passive | Minions cost 2 gold. Scrolling costs 2 gold. | 1 | 4.51 |
| Doomscroller | Endless Feed | Passive | First Scroll each turn is free. Every 5th Scroll: Discover a minion of your tier. | 5 | 4.48 |
| Serial Entrepreneur | Pivot | 1 | Transform a friendly minion into a random one a tier higher; it keeps the stats it gained. | 10 | 4.53 |
| Overthinker | Pros and Cons | 2 | Discover a minion from your tier or lower. | 2 | 4.43 |
| Life Coach | Accountability Partner | 1 | Give a minion +2/+2 for the next combat; if it survives, it keeps the buff. | 6 | 4.54 |
| Minimalist | Sparks Joy | Passive | Start of combat: if you have 4 or fewer minions, give them +2/+2. | 5 | 4.36 |
| Complainer | Speak to the Manager | Passive | Grievance (2): give your minions +1/+1 for this combat. | 6 | 4.52 |
| The Ex | Back Again | Passive | The first friendly minion that dies each combat comes back with 1 Health. | 7 | 4.53 |

"Avg place" is the average placement over 1,800 all-bot lobbies with every bot at full skill (`node game/herosim.js 1800`). The spread is 4.36–4.65.

Tuning history:

- The Minimalist started at "+1/+1 per empty slot" (3.54). That was huge early on, so it became a 4-or-fewer threshold.
- The Gym Bro's Like every turn placed 4.13, so it became every second turn.
- The Serial Entrepreneur placed 6.01 while Pivot threw away the minion's buffs. It now keeps the gained stats and costs 1.
- The Overthinker placed 3.88 when it discovered from exactly its tier, so it now discovers from its tier or lower.

### Unlocks

The first four heroes are unlocked from the start. The other eight unlock from play, tracked on the device:

- **Bargain Hunter:** hire 60 minions.
- **Doomscroller:** scroll 100 times.
- **Serial Entrepreneur:** reach tier 6.
- **Overthinker:** win a combat with 4 tribes on your board.
- **Life Coach:** win 3 combats in a row.
- **Minimalist:** win a combat with 3 or fewer minions after turn 5.
- **Complainer:** finish top 4 after dropping to 10 Health or less.
- **The Ex:** have 80 of your minions die in combat.

## Tripled (golden) minions

Before this round, tripled minions doubled only some of their effects:

- End-of-turn effects and "after you play" effects were doubled.
- Start of combat, Legacy, When sold, survive triggers, kill triggers and auras did nothing extra.

Every card with an effect now has an explicit tripled text (`tools/golden.py`), and the engine implements it. The rules:

- **Numbers double:** +X/+Y, damage, gold, Likes, and the number of Followers or Pigeons summoned.
- **"Triggers twice" auras trigger three times:** Wedding DJ, Estate Lawyer and Reunion Tour.
- **"Once per turn" cards that used one shared flag now count each minion separately.** A tripled Merch Stand gives 2 gold and a tripled Sneaker Reseller gives +4/+4.
- **Keyword-only cards** (Trash Panda, Nosy Neighbour, the Collabs) just get double stats.
- **Greatest Hits tripled** puts two copies in the Feed at 2 gold each. A cheaper rebuy would have let you sell and rebuy forever.

Text and engine mismatches fixed along the way:

- **Middle Manager** now takes from the minion to its left, as its text says. Before, it took from the weakest minion.
- **Block Party Host** now does what its text says.
- **Guerrilla Gardener** had a leftover start-of-combat Out of Office that wasn't on the card. Removed.
- **Side Hustle** had a leftover "+1 gold" effect. Removed.

## Rating ladder

- **Rating:** everyone starts at 800. After a run, the rating moves by Elo against each of the 7 bots: 40 × Σ(result − expected). With equal ratings, 1st place gives +140, 4th +20, 5th −20 and 8th −140.
- **Bot ratings:** each bot is rated around the player's rating (±140). A bot's skill is (rating − 600) / 4000, capped to 0–1.
- **What bot skill changes:**
  - Low-skill bots sometimes buy a random card, forget to level, skip the sell-to-upgrade swap, scroll less, don't arrange the board, and hand out Likes at random.
  - Under 0.35 skill, many bots switch to "big stats only".
  - High-skill bots level a turn early when healthy, value pairs toward triples, Save a Feed with a card they want, and scroll more when low on Health.
- **Brackets:**

  | From | Bracket |
  | --- | --- |
  | 0 | Unpaid Intern |
  | 1,000 | Junior Associate |
  | 2,000 | Middle Management |
  | 3,000 | Director |
  | 4,000 | Vice President |
  | 5,000 | C-Suite |
  | 6,500 | Billionaire |

Checks:

- **`node game/skillsim.js 800 0 1`:** zero-skill bots place 5.22 on average and full-skill bots 3.78 in the same lobbies.
- **`node game/laddersim.js 160`:** a player of fixed skill settles at about 1,000 (skill 0), 1,600 (0.5), 2,300 (0.75) and 4,600 (1.0).
