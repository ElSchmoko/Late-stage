# Battlegrounds research and the v5 card rework

Source: the Hearthstone wiki's minion pool lists (patch 36.6, pages edited 2025–26). The wiki's own wording is not copied here; effects are summarised.

## What Battlegrounds does right

1. **Every tribe has a rule-bender, not just bigger buffs.** Each tribe has a resource or zone it plays with:
   - Quilboar: Blood Gems, a buff currency in hand.
   - Elementals: buff the Tavern "this game".
   - Demons: eat Tavern minions and pay with hero health.
   - Pirates: gold and golden minions.
   - Mechs: Magnetic.
   - Undead: Attack buffs that apply "wherever they are", plus Avenge and Reborn.
   - Naga: spells cast on minions.
   - Murlocs: buff and summon minions from the hand.
2. **Many different triggers.** Battlecry, Deathrattle, Start of Combat and end of turn, plus:
   - Rally (whenever it attacks).
   - Avenge (N) (after N friendly deaths).
   - Activate (N) (pay gold in the shop).
   - On sell.
   - "After you spend N gold".
   - Choose One.
   - Counters with "(N left)".
3. **Scaling that outlives the minion.** "Beetles have +2/+1 this game", "Elementals in the Tavern have +1/+1 this game", "improves future Ballers". These make every later purchase better, which is the core of long-term building.
4. **Higher tiers do something different, not just more.**
   - Tier 5–6 bodies are 6/6 to 10/12.
   - Their effects multiply: doublers like Brann, Titus and Drakkari, board-wide engines, capstones.
   - Tier 1–2 cards are enablers and tokens.
   - Low-tier self-scalers grow slowly or are capped.
5. **Cross-zone play.** Effects touch the board, the hand, the Tavern and the hero, so a turn has several decisions beyond "buy the biggest".
6. **Visible counters.** "(3 left)", Avenge numbers and gold-spent counters show progress.
7. **Positional effects** (left-most, right-most, adjacent) reward arranging the board.

## Side by side: Battlegrounds mechanic → Late Stage version

| Battlegrounds | Tribe there | Late Stage | Tribe here | Cards |
| --- | --- | --- | --- | --- |
| Blood Gems (Razorfen Geomancer, Fearless Foodie) | Quilboar | **Likes**: a heart pile next to your hero. Each Like gives a minion +1/+1 (more with Personal Brand). | Influencers | Stan Account, Hype Man, Unboxing Streamer, Personal Brand, Ring Light Studio, Main Character |
| Rally (Wolf Pup, Roadboar) | Beasts, Quilboar | **Clock In:** happens every time the minion attacks | Influencers, Ferals, Techies | Hype Man, Urban Fox, Leaderboard |
| Avenge (N) (Relentless Deflector, Eternal Tycoon) | Undead, Mechs | **Grievance (N):** happens every N friendly deaths in a combat | Creatives | Memorial Mural, Museum Retrospective |
| Activate (N) (Suspicious Prisonguard) | Neutral | **Side Gig (N):** pay N gold in the shop, once per turn | Hustlers | Side Hustle |
| Consume a Tavern minion (Flaming Enforcer, Mind Muck) | Demons | **Acquire:** take a Feed minion and gain its stats | Hustlers | Private Equity |
| "Elementals in the Tavern have +1/+1 this game" (Dune Dweller) | Elementals | "Ferals / Punks in the Feed get +X/+X this game" | Ferals, Punks | Guerrilla Gardener, Compost Heap, Sellout Frontman |
| "Your Undead have +1 Attack this game, wherever they are" (Nerubian Deathswarmer) | Undead | "Your Creatives get +1 Attack this game, wherever they are" | Creatives | Memorial Mural |
| Cleave (Blade Collector) | Pirates | Cleave | Punks | Mosh Pit |
| Deathrattle token (Buzzing Vermin) | Beasts | Legacy token: a 1/1 Pigeon with Attention Seeker | Ferals | City Pigeon |
| Leeroy (destroy the killer) | Neutral | Legacy: deal 5 damage to the killer | Techies | Rage Quitter |
| Brann / Titus (doublers) | Neutral | Wedding DJ / Estate Lawyer (already in) | Neighbours | — |
| Magnetic | Mechs | Collab (already in) | Techies | — |

## Strength check (before → after)

The engine was run in 600 bot lobbies, measuring each card's average stats while on a board, the stats it gives other minions, and how often its owner won fights. Full tables: `power_v4.tsv`, `power_v5.tsv`.

Problems found in v4:

- **Influencers ran backwards.** Tier 1 Stan Account averaged 36 stats; the tier 4–6 Influencers averaged 7–11 and won 34–44% of fights.
- **Mosh Pit snowballed without limit.** It stole Attack every combat and averaged 166 stats.
- **Ferals had weak high tiers.** Tier 4–5 bodies (15–21 stats) were smaller than Monstera at tier 2 (34).
- **Low-tier scalers outgrew high tiers.** Grindset Guru, Busker, Speedrunner, Stan Account and Monstera did this, because their growth was uncapped and fast.
- **Effects were repetitive.** About 30 cards were "End of turn / Start of combat: give X +a/+b".

v5 changes:

- **Bodies follow tier.** Tier 5 is roughly 4/8 to 6/6 (12–14 stats) and tier 6 roughly 5/9 to 8/8 (14–16).
- **Slower low-tier scalers.** Grindset Guru, Busker, Monstera and Speedrunner now gain +1/+1.
- **New mechanics.** The ones in the table above replace repetitive "+a/+b" effects on 22 cards.

Results (1,600 bot lobbies):

- Average placement now spans **4.25–4.71** across the 14 playstyles, inside the 0.7 band.
- Every playstyle beats the bot that just buys the biggest stats (4.79).
- Tier averages now rise with tier in every tribe except two:
  - **Techies at tier 1:** Speedrunner and Loot Box stay strong as early carries.
  - **Influencers at tiers 2–4:** their value now comes through Likes, which the measurement doesn't credit to the card that made them.
