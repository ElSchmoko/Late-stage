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
