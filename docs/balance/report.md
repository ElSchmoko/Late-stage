Noise check: the two halves of the style run disagree by up to 0.20 places, so differences smaller than about 0.10 between styles are not meaningful.

# Balance report

Generated from `cards_v10.json` and `styles_v10b.json`. Method: `docs/balance-method.md`.

| Dimension | Flags |
| --- | --- |
| Power for tier | 13 |
| Inner-tribe parity | 9 |
| Dominance | 0 |
| Redundancy | 0 |
| Variety | 1 |
| Tribe curve | 6 |
| Style coverage | 0 |
| Timing | 0 |
| Cohesion | 11 |
| Archetypes | 2 |
| Variance | 1 |
| Uptake | 2 |

## Power for tier

- **Thought Leader:** effect worth +1.46 vs tier 4 median +0.67
- **Crypto Bro:** effect worth +0.12 vs tier 3 median +0.93
- **Stan Account:** effect worth +1.24 vs tier 2 median +0.66
- **Giveaway Host:** effect worth +1.37 vs tier 2 median +0.66
- **Hype Man:** effect worth +0.88 vs tier 1 median +0.40
- **Unboxing Streamer:** effect worth +0.47 vs tier 3 median +0.93
- **Ring Light Studio:** effect worth +0.86 vs tier 5 median +0.30
- **Protest Camp:** effect worth +1.43 vs tier 3 median +0.93
- **Robot Vacuum:** effect worth +0.24 vs tier 2 median +0.66
- **Squat Collective:** effect worth +0.35 vs tier 3 median +0.93
- **Desert Hermit:** effect worth +1.38 vs tier 4 median +0.67
- **Enlightened Guru:** effect worth +0.97 vs tier 6 median +0.23
- **Helpful Neighbour:** effect worth +0.20 vs tier 3 median +0.93

## Inner-tribe parity

- **Hustler tier 3:** Golden Parachute Exec +1.00 vs Crypto Bro +0.12
- **Hustler tier 4:** Thought Leader +1.46 vs Corporate Raider +0.60
- **Influencer tier 1:** Hype Man +0.88 vs Reply Guy +0.24
- **Influencer tier 2:** Giveaway Host +1.37 vs Comment Section +0.62
- **Influencer tier 5:** Ring Light Studio +0.86 vs Brand Ambassador -0.05
- **Feral tier 2:** Compost Heap +0.93 vs Monstera +0.31
- **Creative tier 1:** Busker +0.78 vs Art Student +0.17
- **Philosopher tier 6:** Enlightened Guru +0.97 vs Grand Unified Theory +0.36
- **Neutral tier 3:** Caretaker +0.88 vs Helpful Neighbour +0.20

## Variety

- **Feral:** 6 of 14 triggers are EOT

## Tribe curve

- **Hustler tier 4:** cards worth 1.60 places on average vs 0.99 for all tribes (a spike)
- **Feral tier 6:** cards worth 0.05 places on average vs 0.31 for all tribes (a hole)
- **Creative tier 5:** cards worth 0.82 places on average vs 0.36 for all tribes (a spike)
- **Philosopher tier 6:** cards worth 0.69 places on average vs 0.31 for all tribes (a spike)
- **Philosopher / Big Ideas (skill0):** end game: wins 69% of decided fights vs 58% for all styles
- **Punk / Sellouts (skill0):** end game: wins 48% of decided fights vs 58% for all styles

## Cohesion

- **Middle Manager:** generic power: worth +0.49 to other tribes, +0.42 to its own
- **Golden Parachute Exec:** generic power: worth +1.00 to other tribes, +1.00 to its own
- **Venture Capitalist:** generic power: worth +0.78 to other tribes, +0.66 to its own
- **Reply Guy:** generic power: worth +0.37 to other tribes, +0.24 to its own
- **Engagement Bot:** generic power: worth +0.43 to other tribes, +0.41 to its own
- **Hype Man:** generic power: worth +1.01 to other tribes, +0.88 to its own
- **Loot Box:** generic power: worth +0.58 to other tribes, +0.53 to its own
- **Toxic Teammate:** generic power: worth +0.42 to other tribes, +0.51 to its own
- **Heckler:** generic power: worth +0.53 to other tribes, +0.61 to its own
- **Pirate Radio:** generic power: worth +0.76 to other tribes, +0.63 to its own
- **Shower Thinker:** generic power: worth +0.46 to other tribes, +0.40 to its own

## Archetypes

- **Influencer / Followers (skill0):** places 4.68, worse than the big-stats bot (4.66)
- **skill1:** placement band 1.52 (target ≤ 0.90)

## Variance

- **Philosopher / Big Ideas (skill0):** wins 18% of lobbies (target 9%–17%)

## Uptake

- **Quiet-Hours Enforcer:** bought 3% of the times it is offered (tier 2 median 8%)
- **Estate Lawyer:** bought 8% of the times it is offered (tier 5 median 24%)

## Accepted on purpose

- **Art Student** (Timing): worth +0.63 bought 3 turns late vs +0.17 on curve: an early card that scales late. *Why it stays:* Its First Impression needs another Creative on the board, so it is a little better a turn or two later.
- **Loot Box** (Timing): worth +0.90 bought 3 turns late vs +0.53 on curve: an early card that scales late. *Why it stays:* Discover offers cards up to your tier, so it is meant to get better later.
- **Noise-Cancelling Headphones** (Cohesion): generic power: worth +0.45 to other tribes, +0.43 to its own. *Why it stays:* Collabs are meant to spread the Techie tag to other tribes' minions.

## Card table

Values are average places gained by the bot that got the card. "Effect" is the card minus a plain minion of its tier; "Late" is bought 3 turns after its tier opens; "Outside" is in a bot of another tribe; "Synergy" is Effect minus Outside. "Bought" is how often bots hire it when it is offered.


### Hustlers

| Tier | Card | Style | Raw | Effect | Late | Outside | Synergy | Bought | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dropshipper | PI | +1.35 | +0.31 | +0.40 | +0.18 | +0.13 | 10% | FI |
| 1 | Unpaid Intern | EX | +1.32 | +0.28 | +0.33 | +0.03 | +0.25 | 6% | SELLVAL |
| 1 | Grindset Guru | PI | +1.66 | +0.62 | +0.36 | +0.03 | +0.59 | 6% | HIRE |
| 2 | Middle Manager | EX | +1.54 | +0.42 | +0.36 | +0.49 | -0.08 | 11% | EOT, OTHER |
| 2 | Sneaker Reseller | EX | +1.97 | +0.84 | +0.90 | +0.14 | +0.70 | 8% | SELL |
| 2 | Side Hustle | PI | +2.12 | +0.99 | +0.60 | +0.24 | +0.76 | 8% | GIG |
| 3 | Crypto Bro | EX | +1.00 | +0.12 | +0.19 | +0.29 | -0.16 | 15% | SELLVAL, OTHER |
| 3 | Golden Parachute Exec | EX | +1.88 | +1.00 | +0.11 | +1.00 | -0.00 | 12% | LEG |
| 3 | Venture Capitalist | PI | +1.54 | +0.66 | +0.19 | +0.78 | -0.12 | 13% | FI |
| 4 | Thought Leader | PI | +2.03 | +1.46 | +0.40 | +0.17 | +1.29 | 18% | SPEND |
| 4 | Corporate Raider | EX | +1.17 | +0.60 | +0.06 | +0.35 | +0.25 | 20% | SOC, OTHER |
| 5 | Consultant | PI | +0.18 | +0.14 | -0.06 | +0.01 | +0.13 | 30% | AURA |
| 5 | Private Equity | EX | +0.45 | +0.41 | +0.01 | +0.28 | +0.13 | 32% | EOT |
| 6 | Unicorn Startup | PI | +0.49 | +0.47 | +0.10 | +0.02 | +0.45 | 34% | EOT |
| 6 | Too Big to Fail | EX | +0.15 | +0.12 | +0.01 | +0.10 | +0.02 | 34% | DEATHSAVE |

### Influencers

| Tier | Card | Style | Raw | Effect | Late | Outside | Synergy | Bought | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Reply Guy | FO | +0.82 | +0.24 | +0.30 | +0.37 | -0.13 | 7% | LEG |
| 1 | Engagement Bot | FO | +0.99 | +0.41 | +0.31 | +0.43 | -0.02 | 6% | FI |
| 1 | Hype Man | MC | +1.46 | +0.88 | +0.37 | +1.01 | -0.13 | 6% | CLOCK |
| 2 | Stan Account | MC | +1.61 | +1.24 | +0.35 | +0.93 | +0.31 | 7% | EOT |
| 2 | Giveaway Host | FO | +1.74 | +1.37 | +0.72 | -0.06 | +1.42 | 7% | EOT |
| 2 | Comment Section | FO | +0.99 | +0.62 | +0.39 | +0.36 | +0.26 | 9% | LEG |
| 3 | Unboxing Streamer | FO | +0.94 | +0.47 | +0.11 | +0.31 | +0.16 | 12% | FI |
| 3 | Viral Video | FO | +1.44 | +0.97 | +0.57 | +0.30 | +0.67 | 12% | DIES |
| 3 | Personal Brand | MC | +1.40 | +0.93 | +0.65 | +0.40 | +0.53 | 15% | FI, AURA |
| 4 | Engagement Farmer | FO | +0.74 | +0.67 | +0.27 | +0.01 | +0.66 | 18% | SUMMON |
| 4 | Paparazzi | MC | +1.14 | +1.08 | +0.32 | +0.48 | +0.60 | 21% | SOC |
| 5 | Brand Ambassador | FO | -0.06 | -0.05 | -0.04 | +0.04 | -0.09 | 23% | SOC |
| 5 | Ring Light Studio | MC | +0.85 | +0.86 | +0.18 | +0.02 | +0.84 | 25% | EOT |
| 6 | Blue Checkmark | FO | +0.09 | +0.02 | -0.02 | +0.00 | +0.02 | 25% | SOC, OTHER |
| 6 | Main Character | MC | +0.41 | +0.34 | +0.04 | +0.12 | +0.22 | 32% | OTHER, CLOCK |

### Ferals

| Tier | Card | Style | Raw | Effect | Late | Outside | Synergy | Bought | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Windowsill Succulent | OG | +1.32 | +0.54 | +0.44 | +0.23 | +0.30 | 5% | EOT |
| 1 | City Pigeon | TH | +1.18 | +0.40 | +0.41 | +0.29 | +0.11 | 8% | LEG |
| 1 | Trash Panda | - | +1.12 | +0.34 | +0.29 | +0.34 | -0.01 | 5% |  |
| 2 | Monstera | OG | +0.94 | +0.31 | +0.22 | +0.30 | +0.01 | 8% | SCROLL |
| 2 | Tree Hugger | TH | +1.16 | +0.54 | +0.57 | -0.04 | +0.57 | 9% | SOC |
| 2 | Compost Heap | OG | +1.55 | +0.93 | +0.32 | -0.01 | +0.94 | 8% | LEG |
| 3 | Plant Parent | OG | +1.27 | +0.94 | +0.19 | +0.08 | +0.85 | 11% | EOT |
| 3 | Protest Camp | TH | +1.76 | +1.43 | +0.69 | +0.06 | +1.37 | 13% | EOT |
| 3 | Urban Fox | - | +1.33 | +1.00 | +0.22 | +0.22 | +0.78 | 8% | CLOCK |
| 4 | Rooftop Beehive | OG | +0.79 | +0.74 | +0.19 | +0.08 | +0.66 | 17% | EOT |
| 4 | Guerrilla Gardener | TH | +0.68 | +0.63 | +0.03 | -0.01 | +0.64 | 18% | EOT |
| 5 | Ancient Oak | OG | +0.38 | +0.49 | -0.04 | +0.02 | +0.47 | 24% | AURA |
| 5 | Human Chain | TH | +0.49 | +0.60 | +0.02 | +0.11 | +0.49 | 31% | SOC |
| 6 | World Tree | OG | -0.06 | +0.02 | +0.00 | -0.01 | +0.03 | 27% | EOT |
| 6 | Old-Growth Blockade | TH | +0.15 | +0.23 | +0.06 | +0.01 | +0.21 | 27% | SOC |

### Creatives

| Tier | Card | Style | Raw | Effect | Late | Outside | Synergy | Bought | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Busker | PE | +1.30 | +0.78 | +0.56 | +0.02 | +0.76 | 6% | PLAY |
| 1 | Open Mic Poet | PF | +1.04 | +0.52 | +0.59 | +0.33 | +0.19 | 6% | LEG |
| 1 | Art Student | PE | +0.69 | +0.17 | +0.63 | +0.06 | +0.11 | 7% | FI |
| 2 | Struggling Artist | PF | +1.11 | +0.56 | +0.22 | +0.26 | +0.30 | 6% | LEG |
| 2 | Merch Stand | PE | +1.47 | +0.92 | +0.24 | +0.06 | +0.86 | 8% | PLAY |
| 2 | Method Actor | PF | +1.27 | +0.72 | +0.39 | +0.27 | +0.44 | 8% |  |
| 3 | Memorial Mural | PF | +1.48 | +1.18 | +0.52 | +0.14 | +1.05 | 13% | GRIEV |
| 3 | Indie Band | PE | +1.64 | +1.35 | +0.38 | +0.03 | +1.32 | 13% | PLAY |
| 3 | Conceptual Artist | - | +1.50 | +1.21 | +0.17 | +0.42 | +0.78 | 10% | FI |
| 4 | Art Critic | PF | +0.72 | +0.57 | +0.24 | +0.28 | +0.29 | 17% | DIES |
| 4 | Record Label | PE | +1.11 | +0.97 | +0.11 | +0.04 | +0.93 | 16% | EOT |
| 5 | Festival Headliner | PE | +0.86 | +0.69 | +0.03 | +0.00 | +0.69 | 22% | PLAY |
| 5 | Museum Retrospective | PF | +0.79 | +0.63 | +0.13 | +0.17 | +0.46 | 25% | GRIEV |
| 6 | Dead Rock Star | PF | +0.18 | +0.20 | +0.07 | -0.02 | +0.22 | 25% | LEG |
| 6 | World Tour | PE | +0.53 | +0.54 | +0.07 | +0.03 | +0.52 | 26% | PLAY |

### Techies

| Tier | Card | Style | Raw | Effect | Late | Outside | Synergy | Bought | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Speedrunner | GM | +1.25 | +0.64 | +0.10 | +0.19 | +0.45 | 5% | KILL |
| 1 | Smart Plug | GA | +1.18 | +0.56 | +0.54 | +0.32 | +0.24 | 7% | EOT |
| 1 | Toxic Teammate | GM | +1.12 | +0.51 | +0.42 | +0.42 | +0.09 | 5% |  |
| 2 | Loot Box | - | +1.10 | +0.53 | +0.90 | +0.58 | -0.04 | 7% | FI |
| 2 | Robot Vacuum | GA | +0.81 | +0.24 | +0.14 | +0.20 | +0.04 | 12% | SOC |
| 2 | Firmware Update | GA | +1.33 | +0.76 | +0.45 | +0.01 | +0.76 | 8% | COLLAB |
| 2 | Rage Quitter | GM | +0.84 | +0.27 | +0.25 | +0.24 | +0.03 | 11% | LEG |
| 3 | Smart Fridge | GA | +1.70 | +1.10 | +0.71 | +0.47 | +0.63 | 16% | EOT |
| 3 | E-Sports Coach | GM | +1.71 | +1.10 | +0.61 | +0.63 | +0.47 | 15% | SOC |
| 4 | Noise-Cancelling Headphones | GA | +0.77 | +0.43 | +0.25 | +0.45 | -0.02 | 22% |  |
| 4 | Leaderboard | GM | +1.02 | +0.68 | +0.10 | +0.07 | +0.61 | 19% | CLOCK |
| 5 | Smart Home Hub | GA | +0.60 | +0.47 | +0.22 | -0.01 | +0.48 | 21% | AURA |
| 5 | Pro Gamer | GM | +0.43 | +0.30 | +0.01 | +0.07 | +0.23 | 24% | KILL |
| 6 | Quantum Computer | GA | +0.48 | +0.47 | +0.22 | +0.37 | +0.10 | 46% |  |
| 6 | World Record | GM | +0.07 | +0.06 | +0.04 | -0.01 | +0.07 | 21% | SOC |

### Punks

| Tier | Card | Style | Raw | Effect | Late | Outside | Synergy | Bought | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Graffiti Kid | SA | +1.18 | +0.35 | +0.36 | +0.20 | +0.15 | 7% | SOC |
| 1 | Anarchist Barista | SO | +1.09 | +0.25 | +0.26 | +0.24 | +0.02 | 10% | SOLD |
| 1 | Zine Maker | SO | +1.17 | +0.34 | +0.43 | +0.28 | +0.06 | 7% | SOLD |
| 2 | Sellout Frontman | SO | +1.64 | +0.94 | +0.60 | +0.06 | +0.88 | 9% | SOLD, OTHER |
| 2 | Heckler | SA | +1.31 | +0.61 | +0.38 | +0.53 | +0.08 | 10% | SOC |
| 2 | Crust Punk | SA | +1.26 | +0.56 | +0.34 | +0.02 | +0.54 | 11% | AURA |
| 3 | Squat Collective | SO | +0.92 | +0.35 | +0.21 | +0.28 | +0.07 | 17% | AURA |
| 3 | Feedback Loop | SA | +1.46 | +0.90 | +0.58 | +0.44 | +0.45 | 14% | SOC, OTHER |
| 3 | Pirate Radio | - | +1.20 | +0.63 | +0.18 | +0.76 | -0.12 | 12% | FI |
| 4 | Mosh Pit | SA | +0.96 | +0.64 | +0.13 | +0.45 | +0.19 | 30% | CLEAVE |
| 4 | Energy-Drink Sponsor | SO | +0.77 | +0.45 | +0.41 | +0.02 | +0.43 | 16% | SOLD |
| 5 | Reunion Tour | SO | +0.27 | +0.22 | +0.11 | +0.02 | +0.21 | 32% | AURA |
| 5 | Stage Diver | SA | +0.28 | +0.23 | +0.12 | +0.13 | +0.10 | 26% | SOC |
| 6 | Greatest Hits | SO | +0.15 | +0.06 | +0.04 | +0.03 | +0.04 | 31% | SELL, OTHER |
| 6 | General Strike | SA | +0.51 | +0.43 | +0.17 | +0.02 | +0.41 | 26% | SOC, OTHER |

### Philosophers

| Tier | Card | Style | Raw | Effect | Late | Outside | Synergy | Bought | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Shower Thinker | BI | +0.83 | +0.40 | +0.21 | +0.46 | -0.05 | 5% | EOT |
| 1 | Stoicism Podcaster | ST | +1.03 | +0.60 | +0.11 | +0.26 | +0.35 | 7% | HURT |
| 1 | Nihilist | - | +0.67 | +0.25 | +0.07 | +0.28 | -0.03 | 8% | LEG |
| 2 | Cold-Plunge Stoic | ST | +1.30 | +0.95 | +0.40 | +0.56 | +0.39 | 10% | HURT |
| 2 | Pub Philosopher | BI | +1.05 | +0.70 | +0.51 | +0.43 | +0.27 | 8% | EOT |
| 2 | Marathon Monk | ST | +1.20 | +0.85 | +0.33 | +0.02 | +0.83 | 10% | HURT |
| 3 | Thought Experiment | BI | +0.85 | +0.68 | +0.43 | +0.05 | +0.63 | 11% | EOT |
| 3 | Keynote Speaker | - | +1.08 | +0.90 | +0.17 | +0.44 | +0.46 | 12% | FI |
| 3 | Book-Club Stoic | ST | +1.30 | +1.12 | +0.56 | +0.59 | +0.53 | 14% | SOC |
| 4 | Utilitarian | BI | +1.00 | +0.87 | +0.25 | +0.06 | +0.81 | 15% | SOC |
| 4 | Desert Hermit | ST | +1.52 | +1.38 | +0.22 | +0.22 | +1.16 | 20% | HURT |
| 5 | The Cynic | ST | +0.49 | +0.43 | +0.15 | +0.14 | +0.29 | 30% | HURT |
| 5 | Bestselling Author | BI | +0.19 | +0.13 | -0.06 | +0.01 | +0.12 | 23% | EOT |
| 6 | Grand Unified Theory | BI | +0.39 | +0.36 | +0.13 | +0.04 | +0.32 | 27% | EOT |
| 6 | Enlightened Guru | ST | +1.00 | +0.97 | +0.23 | +0.01 | +0.96 | 22% | AURA |

### Neighbours

| Tier | Card | Style | Raw | Effect | Late | Outside | Synergy | Bought | Triggers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Nosy Neighbour | - | +0.76 | +0.16 | +0.18 | – | – | 4% |  |
| 1 | Wi-Fi Leech | - | +0.72 | +0.13 | +0.22 | – | – | 3% | SOC |
| 2 | Package Hoarder | - | +0.80 | +0.20 | +0.24 | – | – | 4% | LEG |
| 2 | Quiet-Hours Enforcer | - | +0.78 | +0.19 | +0.20 | – | – | 3% | SOC |
| 3 | Caretaker | - | +1.36 | +0.88 | +0.22 | – | – | 11% | EOT |
| 3 | Helpful Neighbour | - | +0.68 | +0.20 | +0.20 | – | – | 8% | FI |
| 4 | Leaf Blower Guy | - | +0.39 | +0.36 | +0.01 | – | – | 16% | SOC |
| 5 | Wedding DJ | - | -0.09 | -0.09 | -0.01 | – | – | 9% | AURA |
| 5 | Estate Lawyer | - | -0.03 | -0.03 | -0.01 | – | – | 8% | AURA |
| 5 | The Landlord | - | -0.03 | -0.03 | -0.01 | – | – | 19% | EOT |
| 6 | Block Party Host | - | +0.14 | +0.12 | +0.05 | – | – | 24% | EOT |

## Styles

| Style | Avg place | Halves differ by | 1st | Top 4 | 8th | Early (1–4) | Mid (5–8) | Late (9–12) | End (13+) | Avg place (skill 1) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Creative / Posthumous Fame | 4.31 | 0.15 | 13% | 54% | 11% | 45% | 51% | 61% | 53% | 4.13 |
| Philosopher / Big Ideas | 4.34 | 0.07 | 18% | 52% | 11% | 50% | 56% | 52% | 69% | 4.82 |
| Creative / Performers | 4.36 | 0.13 | 11% | 55% | 13% | 45% | 50% | 61% | 49% | 5.08 |
| Philosopher / Stoics | 4.38 | 0.20 | 16% | 49% | 9% | 50% | 57% | 50% | 67% | 4.32 |
| Feral / Overgrowth | 4.40 | 0.09 | 15% | 52% | 13% | 49% | 50% | 59% | 60% | 4.66 |
| Punk / Sabotage | 4.41 | 0.09 | 11% | 52% | 12% | 49% | 53% | 56% | 49% | 4.12 |
| Hustler / Passive Income | 4.49 | 0.10 | 16% | 49% | 16% | 47% | 44% | 65% | 59% | 4.72 |
| Techie / Gamers | 4.51 | 0.04 | 16% | 48% | 13% | 51% | 48% | 55% | 65% | 3.56 |
| Hustler / Exploitation | 4.55 | 0.11 | 14% | 49% | 17% | 46% | 44% | 64% | 57% | 4.20 |
| Punk / Sellouts | 4.56 | 0.17 | 10% | 50% | 13% | 49% | 51% | 55% | 48% | 4.54 |
| Techie / Gadgets | 4.56 | 0.05 | 14% | 48% | 13% | 51% | 47% | 54% | 60% | 4.13 |
| Feral / Tree Huggers | 4.59 | 0.08 | 13% | 48% | 13% | 46% | 48% | 57% | 57% | 4.64 |
| Influencer / Main Character | 4.62 | 0.07 | 11% | 49% | 12% | 53% | 48% | 52% | 57% | 4.39 |
| Big stats (BASE) | 4.66 | 0.01 | 3% | 49% | 8% | 60% | 58% | 39% | 37% | 5.16 |
| Influencer / Followers | 4.68 | 0.20 | 12% | 47% | 14% | 53% | 50% | 52% | 59% | 4.65 |
