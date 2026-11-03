# v8 balance changes (from the 12-dimension check)

Each change is listed with the flag it answered. Before: `report-v7-before.md`. After: `report.md`.

## Design errors (dominance, coverage, redundancy, variety)

| Change | Why |
| --- | --- |
| Comment Section moves to tier 2 (2/3) | **Dominance:** at tier 1 it was Reply Guy with a second Follower. |
| Unboxing Streamer: "First Impression: summon two Followers and get 2 Likes" (was a Legacy summon) | **Redundancy:** three Influencers shared "Legacy: summon". |
| Hype Man moves to tier 1 (2/2, "Clock In: get 1 Like") | **Style coverage:** Main Character had no tier-1 card. |
| Rage Quitter moves to tier 2 (4/3, 4 damage) | **Style coverage:** Gamers had no tier-2 card. |
| Corporate Raider joins Exploitation, and gains "if it dies, +1 gold next turn" | **Style coverage:** Exploitation had no tier-4 card. |
| Venture Capitalist moves to tier 3 (+3/+3 per gold invested) | **Style coverage:** Passive Income had no tier-3 card after Thought Leader moved up. |
| Thought Leader moves to tier 4 (4/5) | **Power for tier / parity:** it was 2× the tier-3 median. Also fills the Hustler tier-4 hole. Trying "every 5 gold" dropped Passive Income below the big-stats bot, so it stays at every 4 gold, one tier later. Consultant makes it every 3 gold. |
| Record Label: end of turn, another Creative +3/+3 per Creative played this turn | **Variety:** 6 of 14 Creative triggers were "after you play". |
| Monstera: "After you Scroll, gain +1/+1 (twice per turn)" | **Variety:** 7 of 14 Feral triggers were end of turn. A new trigger, and a reason to scroll. |
| Utilitarian: start of combat, three lowest-Attack Philosophers +3/+3 | **Variety:** 6 of 14 Philosopher triggers were end of turn. |

## Tribe curves (late-game holes)

| Change | Why |
| --- | --- |
| Brand Ambassador: at start of combat, summons a Follower, then Followers get +1/+1 per Influencer | **Tribe curve:** the Influencer tier 4–6 cards added about zero places. |
| Blue Checkmark: Followers also get +2/+2 | **Tribe curve:** Influencer tier 6. |
| Paparazzi: two highest-Attack Influencers get Out of Office and +2/+2 | **Tribe curve:** Influencer tier 4. **Cohesion:** it was generic. |
| Main Character also gets 2 Likes whenever it attacks (Clock In); Ring Light Studio 3 Likes per other Influencer | **Archetypes:** Main Character placed worse than the big-stats bot, and its capstone only multiplied Likes it didn't make. |
| Bestselling Author makes all next-combat buffs permanent (not just Philosophers') | **Tribe curve:** the Philosopher tier-5 Big Ideas card added about zero. |
| Grand Unified Theory: +1/+1 next combat to all your minions, then doubles | **Tribe curve:** Philosopher tier 6. |
| Book-Club Stoic: also gives your other Attention Seekers +2/+2 at start of combat | **Power for tier:** it was a vanilla body at tier 3. |
| Greatest Hits: selling a Punk also gives your Punks +1/+1 | **Tribe curve:** Punk tier 6 added about zero. |

## Pass 3 (after the second full run)

| Change | Why |
| --- | --- |
| Main Character makes its Likes on Clock In instead of at end of turn | **Redundancy:** three Influencers made Likes at end of turn. |
| Brand Ambassador also summons a Follower first | **Power for tier:** still about zero, because Main Character bots have few Followers. |
| Protest Camp +3/+3; Human Chain 5/8 | **Archetypes:** Tree Huggers fell behind the big-stats bot when Tree Hugger became Feral-only. |
| World Record gives Toxic to one Techie (was two) | **Skill robustness / variance:** Gamers won 18% of lobbies, and smart bots (which search board orders) made it the strongest style by far. |
| Crypto Bro max 7 gold, crashes after 6 turns; Rage Quitter 5 damage | **Power for tier:** the lowest cards of their tiers. |

## Power for tier and parity

| Change | Why |
| --- | --- |
| Giveaway Host +1/+1 a turn (was +2/+2) | Top of tier 2. |
| Feedback Loop: the Punk buff is +2/+2 for that combat, not permanent | Top of tier 3, through permanent snowballing. |
| Desert Hermit +2/+2 (was +3/+3) | 2× the tier-4 median. |
| Indie Band +2/+2 to the played Creative; Festival Headliner +2/+2 | Above tier 3 / spike at Creative tier 5. |
| Plant Parent: two other Ferals +1/+1 (was all); Rooftop Beehive +2/+2 to adjacent Ferals | Above tier 3 / tier 4. |
| Firmware Update +1/+1 (was +2/+1) | Parity gap at Techie tier 2. |
| Art Student +3/+3 | Weakest tier-1 Creative. |
| Quiet-Hours Enforcer −3 Attack; Leaf Blower hits enemies and its neighbours only (5/6); Nosy Neighbour 2/3 | Neighbours far below their tiers. |

## Cohesion (generic power → tribal)

| Change | Why |
| --- | --- |
| Side Hustle: Side Gig gives another Hustler +3/+3 | Worth as much to other tribes as to Hustlers. |
| Tree Hugger, Rooftop Beehive: buff adjacent Ferals only | Same. |
| Thought Experiment, Marathon Monk: buff Philosophers only | Same. |
| Windowsill Succulent: grows only with another Feral | Same. |

## Measurement fixes found along the way

- **Injected cards** now arrive at the start of the bot's turn and are played with its real gold. Before, Venture Capitalist invested 0 gold and read as worthless.
- **Late tiers** count only lobbies where the bot is still alive when the card arrives. Before, tiers 5–6 were diluted by eliminated bots.
- **Collabs** wait until there is a minion to stick to.
- **Phase win rates** leave out draws and are compared with the average of all styles in that phase, because late phases contain only survivors.

## After player feedback (Enlightened Guru)

| Change | Why |
| --- | --- |
| Enlightened Guru: the cap of 3 damage applies only to the first two hits each of your other Attention Seekers takes in a combat | **Build-around ceiling:** worth +1.15 places in a Stoics build, against a tier-6 median of about +0.27. The old version made a board of Attention Seekers nearly unkillable. |
| Bots now favour cards of their own style | The suite couldn't see build-around combos because no bot built around anything. |

## Player card review (Nov 3)

Each changed card was re-measured (200 paired lobbies, `--card=` filter). Effect is places gained against a plain body of the tier; the tier medians are from the full v8 run.

| Change | Why | Effect before → after (tier median) |
| --- | --- | --- |
| Middle Manager: killing the drained minion gives 2 extra gold (was 1) | Player review | +0.42 → +0.51 (0.66) |
| Brand Ambassador: the Follower summon moves from start of combat to Legacy (two Followers) | On a full board the start-of-combat summon did nothing. A Legacy summon happens after a death, so there is always room. | −0.05 → +0.19 (0.30) |
| Ring Light Studio: end of turn, get 2 Likes; while it's on your board, Likes count double (was 3 Likes per other Influencer) | Too many Likes to hand out one by one. Fewer Likes, each worth more. | +0.86 → +0.62 (0.30) |
| City Pigeon 1/3 (was 2/3) | Player review | +0.40 → +0.41 (0.40) |
| Windowsill Succulent 2/2 (was 1/2) | Player review | +0.54 → +0.74 (0.40) |
| World Tree: end of turn, other Ferals +2/+2 | It arrives at tier 6, too late for a slow effect. | +0.02 → +0.25 (0.23) |
| Merch Stand: twice per turn | Player review | +0.92 → +1.04 (0.66) |
| Method Actor 4/1 (was 3/2); Zine Maker 2/1 (was 2/2) | Player review | +0.72 → +0.66; +0.34 → +0.37 |

All are within the power band (−0.40…+0.45 of the tier median). Style placements after the change (1,400 lobbies, skill 0): 4.24–4.72, all at or ahead of the big-stats bot (4.73).

## v9: Feral rework (Nov 3)

**Problem.** Five Ferals were Attention Seekers (City Pigeon and its token, Tree Hugger, Protest Camp, Human Chain, Old-Growth Blockade). That is the Stoics' identity (seven Attention Seekers), and the activist cards didn't match the urban-wildlife flavour. Ferals were a weaker copy of Stoics.

**Change.** Tree Huggers becomes **Scavengers (SV)**: urban animals that rummage through the bins and keep coming back.
- **Scroll triggers ("rummaging").** No other tribe used them; Monstera was the only one, and it moves out with its plant.
- **Rebrand payoffs ("you can't get rid of them").** Rebrand was spread thinly across three tribes.

Overgrowth keeps the plants and plant people, and is unchanged apart from taking Tree Hugger and Guerrilla Gardener.

| Card | Style | Tier | Stats | Text |
| --- | --- | --- | --- | --- |
| City Pigeon | SV | 1 | 1/3 | After you Scroll, gain +1/+1 (twice per turn). |
| Trash Panda | SV | 1 | 2/1 | Rebrand. When it comes back, give your other Ferals +1/+1. |
| Seagull (new) | SV | 2 | 3/3 | After you Scroll, give another Feral +1/+1 (twice per turn). |
| Urban Fox | SV | 3 | 2/3 | Rebrand (was Out of Office). Clock In: give another Feral +2/+2 permanently. |
| Wild Boar (new) | SV | 4 | 4/5 | Start of combat: give the Ferals next to it Rebrand. |
| Rat King (new) | SV | 5 | 4/7 | After a friendly Feral comes back, give your other Ferals +2/+2. |
| Nature Is Healing (new) | SV | 6 | 5/9 | After you Scroll, give your other Ferals +1/+1 (twice per turn). |
| Tree Hugger | OG | 2 | 2/4 | Loses Attention Seeker (+1 Attack). |
| Guerrilla Gardener | OG | 4 | 3/5 | Moves to Overgrowth. |
| Compost Heap | OG | 2 | 1/3 | −1 Health. |

Retired: Protest Camp, Human Chain, Old-Growth Blockade, Monstera, and the Pigeon token.

Bots now put leftover gold into Scrolls while they still have Scroll triggers to use.

**Tuning.** The first version put both Feral styles on top (Scavengers 4.01, Overgrowth 4.05). Turning off the bots' extra scrolling only moved them to 4.11/4.15, so the cards were the cause. Each Feral card sat 0.2–0.3 above its tier median, and the Scavenger cards that buff any Feral also lifted Overgrowth. Changes, one round at a time:
1. Seagull +1 Health; Wild Boar −1/−1; Nature Is Healing three → twice per turn; Guerrilla Gardener −1 Attack; Compost Heap −1 Health; Urban Fox −1 Attack. Result: Overgrowth 4.21, Scavengers still 4.04.
2. Trash Panda back to 2/1; Wild Boar loses its own Rebrand (4/5). Result: Scavengers 4.20, Overgrowth 4.37 (1,400 lobbies).

**Checks after the change.**

| Check | Result | Target |
| --- | --- | --- |
| Styles, standard bots (3,200 lobbies, `styles-v9.json`) | Scavengers 4.31, Overgrowth 4.35; all styles 4.19–4.76 | Band ≤ 0.60 ✓ |
| 1st / 8th place | Scavengers 13% / 10%, Overgrowth 14% / 11% | 9–17% / ≤ 17% ✓ |
| Early-game win rate | 0.51 / 0.50 | Within ±10 points ✓ |
| Build-around ceiling (`--ceiling`, `cards-v9-ferals.json`) | Highest margin: Urban Fox +1.17, against a limit of +1.53 | ≤ tier median + 0.60 ✓ |
| Dominance, redundancy | None; at most 2 cards per effect signature | ✓ |
| Trigger variety | Most common Feral trigger (end of turn) 33%, was 43% | ≤ 40% ✓ |
| Style coverage | Both styles have a card at tiers 1–6 | ✓ |
| Smart bots | Band 0.94, driven by Posthumous Fame and Passive Income, not Ferals | ≤ 0.90 (noisy, half-diffs up to 1.3) |

**Also fixed.** Two stat-only entries from the earlier player review overwrote newer card texts. Windowsill Succulent's card showed an old rule, and Zine Maker showed +3/+3 while giving +4/+4.

### Nature Is Healing buff (player feedback)

At +1/+1 twice per turn (+2/+2 a turn at most), it read as weak for a tier-6 capstone. Two stronger versions were measured (200 paired lobbies, `--ceiling`):

| Version | Average Effect | Ceiling | Tier-6 limit |
| --- | --- | --- | --- |
| +2/+2, twice per turn (**shipped**) | +0.49 | +0.50 | +0.83 |
| +2/+2, three times per turn | +0.57 | +0.74 | +0.83 |

The three-times version is close to the build-around limit, and people scroll more reliably than bots do (the Enlightened Guru lesson), so the twice-per-turn version ships: up to +4/+4 to every other Feral each turn, against World Tree's free +2/+2.

Styles after the buff (3,200 lobbies): 4.21–4.76, band 0.55. Scavengers 4.23, Overgrowth 4.27. Both Feral styles win 17–18% of lobbies, at the edge of the 9–17% target (Passive Income and Gadgets are at 18% too). Watch this.

## v10: late-game engines, theming, Philosophers (Nov 3)

### Punks: big boards are a combo ceiling, not tribe strength

A player found that Energy-Drink Sponsor (now **Jingle Writer**) plus Reunion Tour builds very big boards. The measurements:

- **Average Punk card value is at or below the other tribes** at tiers 1, 3, 4 and 5 (`cards-v8.json`).
- **The bots under-played the combo.** They sold Jingle Writer a turn after buying it and never bought back the Greatest Hits copies. Bots now sell it straight away when it pays (two or more Punks sold, four or more Punks on board) and value it more with Reunion Tour.
- **Board size with combo-playing bots** (sum of Attack and Health, top 10% of boards at turn 14): Sellouts about 1,470 and Sabotage about 1,070, against 600–790 for every other style.
- **Placement stays in line** because the boards arrive late (turn 14+), when most lobbies are decided: Sellouts 4.28, top of a 4.28–4.67 band. Sellouts wins 19% of lobbies (21% with smart bots), above the 17% target. **Accepted on purpose:** the late explosion is the Punks' identity.

The player preferred buffing other tribes to nerfing Punks. Matching a 1,400-stat board everywhere would inflate the whole game and leave Punks behind on wins. Instead, the three weakest late capstones get a way to keep growing:

| Card | Was | Now | Effect: before → after (tier median) |
| --- | --- | --- | --- |
| Blue Checkmark (FO, 6) | Followers get Out of Office and +2/+2, attack twice | After a friendly Follower dies, give your Influencers +2/+2 permanently. | +0.02 → +0.08 (+0.23); Followers builds +0.22 |
| World Record (GM, 6) | Left-most other Techie gets Toxic | Also: after a friendly Techie kills a minion, give your Techies +1/+1 permanently. | +0.06 → +0.51 (+0.23); ceiling +0.49 (limit +0.83) |
| Bestselling Author (BI, 5) | Next-combat buffs become permanent | First gives the Philosophers next to it +1/+1 for the next combat. | +0.13 → +0.34 (+0.30) |

Discarded versions:
- Bestselling Author giving *all* Philosophers +1/+1: +0.91, ceiling +0.92, over the +0.90 limit.
- Blue Checkmark with Followers +3/+3 or +4/+4 "this game" (and a summon): about +0.0. Late-game boards are full, so few Followers exist to buff.

Styles after the changes (3,200 lobbies, `styles-v10.json`):

| Check | Result | Target |
| --- | --- | --- |
| Standard bots, all styles | 4.28–4.67, band 0.39 (was 0.55) | ≤ 0.60 ✓ |
| Big Ideas | 4.65 → 4.62 | |
| Gamers | 4.47 → 4.38; wins 21% of lobbies | Win rate above the 9–17% target (watch) |
| Smart bots | Band 1.12; Sellouts 3.87 vs Big Ideas 4.99 | Above target; noisy (half-diffs up to 1.47) |

### Theming

| Card | Change | Why |
| --- | --- | --- |
| Energy-Drink Sponsor → **Jingle Writer** (Punk) | New name, art and flavour ("Wrote 'Smash the System'. Now it sells yoghurt."); same effect | A corporate sponsor isn't punk. A punk who sold their anthem to an advert is, and it fits the selling-out effect. |
| Wedding DJ → **DJ Upstairs** (Neighbour) | Name and flavour; same art and effect | Neighbours are people on your street. |
| Estate Lawyer → **Lawyer Next Door** (Neighbour) | Name and flavour; same art and effect | Same reason. |
| Corporate Raider | Flavour restored ("Synergy, but with teeth.") | A duplicate entry had replaced it with the rules text. |

Checked and kept: Paparazzi (Influencer, Main Character), Record Label (Creative, Performers), Keynote Speaker (Philosopher), and Gamers sitting under Techies.

### Philosophers

Five Philosophers are now drawn as women: Stoicism Podcaster, Utilitarian, The Cynic, Grand Unified Theory and Enlightened Guru. Together with Book-Club Stoic and Bestselling Author, that's 7 of 15.

### Bug guards

The UI removed cards with `splice(indexOf(x), 1)`. When the card was no longer there (a second play of the same hand card, a buy after the Feed changed, or reordering a minion that had gone), that deleted the *last* card in the hand, Feed or board instead. These paths now check first. This is the likely cause of a player losing hand cards around a Scroll, though it wasn't reproduced.
