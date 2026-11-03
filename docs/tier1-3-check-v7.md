# Tier 1–3 head-to-head check (v7)

## Method (`node game/tiertest.js 400 3`)

The old per-card table credited Likes and economy cards poorly, so this check measures cards directly:

1. Each card is given for free to a bot of its own tribe at the start of its tier: turn 1 for tier 1, turn 3 for tier 2, turn 5 for tier 3.
2. The same 400 lobbies are replayed without the card.
3. The change in that bot's final placement is the card's value ("places gained").

Raw "places gained" also reflects how weak the tribe's bot is without help, so each tribe also gets a plain minion with its tier's average stats (2/2, 2/3, 3/4). **"Over plain"** is the card's value minus that plain body: what its effect is worth. Typical standard error is ±0.1.

Full tables: `tier1-3_before.tsv` and `tier1-3_after.tsv` (the after table includes the over-plain column).

## Before → after ("places gained", raw)

| Tier | Before range | After range | Biggest outliers before |
| --- | --- | --- | --- |
| 1 | 0.59–1.70 | 0.68–1.56 | Loot Box 1.70, Stan Account 1.45, Grindset Guru 1.45 · Trash Panda 0.59 |
| 2 | 0.66–1.98 | 0.89–1.84 | Giveaway Host 1.98, Compost Heap 1.75 · Robot Vacuum 0.66, Comment Section 0.69 |
| 3 | 0.50–2.58 | 0.73–2.44 | Thought Leader 2.58, Feedback Loop 2.23 · Book-Club Stoic 0.50 |

## Changes

### Tier moves

- **Stan Account** moved to tier 2 (2/2). In the after table it sits in the upper middle of tier 2 (1.25 raw, 0.73 over plain), next to Hype Man.
- **Comment Section** moved to tier 1.
- **Loot Box** moved to tier 2. Discovering at tier 1 made it a 2-for-1 on turn 1.
- **Toxic Teammate** moved to tier 1.

### Trimmed

| Card | Change |
| --- | --- |
| Compost Heap | +1/+1 to Ferals in the Feed (was +2/+2) |
| Smart Plug | 1/2 |
| Feedback Loop | Punk buff applied less often |
| Graffiti Kid | 2/2 |
| Giveaway Host | 1/3 body |

### Lifted

| Card | Change |
| --- | --- |
| Reply Guy | 2/2 |
| Engagement Bot | 2/1 |
| Trash Panda | 2/2 |
| City Pigeon | 2/3 |
| Nihilist | 2/3 |
| Open Mic Poet | 2/2 |
| Dropshipper | 2/3 |
| Zine Maker | +4/+4 |
| Anarchist Barista | 2/3 |
| Robot Vacuum | 2 damage |
| Tree Hugger | +2/+2 |
| Middle Manager | 3/4 |
| Book-Club Stoic | 4/5 |
| Crypto Bro | 4/5 |
| Squat Collective | 4/5 |
| Unboxing Streamer | 3 Likes |
| Rage Quitter | 5/4 |
| Keynote Speaker | 3/3 |
| Caretaker | +1/+2 |

### Tribe balance afterwards

Some of the tier changes pulled Hustlers, Influencers and Punks down, and buffing the plain neutral minions mostly helped the "big stats" bot. So:

- **Neutral bodies** went back to what they were.
- **Weaker styles** got effect buffs, mostly on tier 4–6 cards:

  | Card | Buff |
  | --- | --- |
  | Personal Brand | Also gets 2 Likes |
  | Engagement Farmer | +6/+6 |
  | Viral Video | 4 times per combat |
  | Paparazzi | 4/6 |
  | Ring Light Studio | 4/8 |
  | Main Character | 8/10 |
  | Sellout Frontman | +3/+3 |
  | Energy-Drink Sponsor | +2/+2 per Punk sold, max +16 |
  | Reunion Tour | 5/9 |
  | Greatest Hits | 7/8 |
  | Mosh Pit | 6/8 |
  | Stage Diver | +4 Attack |
  | Venture Capitalist | +4/+4 per gold |
  | Too Big to Fail | +4/+4 |
  | Unicorn Startup | 7/9 |
  | Consultant | 6/7 |
  | Private Equity | 6/8 |

**Result** (`node game/simtest.js 1600`): all 14 playstyles place 4.32–4.67, and every one beats the big-stats bot (4.68). Before, the range was 4.14–4.69 and only partly ahead of it.

**Heroes:** their Boundaries were re-tuned afterwards. All 12 heroes now place 4.34–4.59 (`node game/herosim.js 1500`).

## Still above their tier

These cards are their tribe's engine. Nerfing them further sank the whole tribe in testing.

| Card | Tier | Over plain | Tier's typical value |
| --- | --- | --- | --- |
| Thought Leader | 3 | 1.56 | ~0.85 |
| Feedback Loop | 3 | 1.28 | ~0.85 |
| Giveaway Host | 2 | 1.32 | ~0.70 |

Options for these:

- move them up a tier and give their tribes something else early, or
- accept them as the tier's "build-around" picks.
