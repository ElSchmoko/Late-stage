# Update 6 (Nov 19): playstyle swap, Connect, card updates

## Playstyle swap
The Attention Seeker playstyle (code `ST`, now "Attention Seekers") moved from the Philosophers to the Influencers, and the
Follower playstyle (code `FO`, "Followers") moved from the Influencers to the Philosophers. Followers (the token) are
Philosophers now. Every card that moved has a new name and new art (`tools/p_v15.py`); the old name lives on in
`sim/cards.py` `SWAP` / `RENAMED`, which the changelog and the profile migration (`ui.js`, `PROF.renamed15`) use.

| Old (Influencer, FO) | New (Philosopher, FO) | | Old (Philosopher, ST) | New (Influencer, ST) |
| --- | --- | --- | --- | --- |
| Reply Guy | Sophist | | Stoicism Podcaster | Troll |
| Giveaway Host | Epicurean | | Cold-Plunge Stoic | Rage Baiter |
| Comment Section | Peripatetic | | Marathon Monk | Prank Vlogger |
| Unboxing Streamer | Pythagorean | | Book-Club Stoic | Reality Star |
| Viral Video | Hemlock Martyr | | Desert Hermit | Apology Video |
| Engagement Farmer | The Academy | | The Cynic | Shock Jock |
| Brand Ambassador | Existentialist | | Enlightened Guru | Crisis PR Firm |
| Blue Checkmark | Philosopher King | | Breathwork Coach (track) | Drama Channel |
| Bot Farm (track) | Mystery Cult | | Tenured Professor (track) | Comments Off |
| Fan Convention (track) | Utopian Commune | | | |

Track stops stay one tribe each: Drama Channel joins Thirst Trap (Lv 2), Mystery Cult joins Debate Club (Lv 7),
Comments Off joins Paid Verification, Utopian Commune joins TED Talk.

## Rules
- **Connect** (was Collab) attaches only to your Techies; Robot Vacuum attaches to any minion and makes it a Techie.
  With no valid minion on the board, a Connect card is played as a normal minion.
- **Golden cards** keep the keywords and extra tribe their copies gained (Attention Seeker, Out of Office, Toxic, Rebrand, Techie ...).
- **Discover** (First Impression) never offers the card that discovers.
- **Grand Unified Theory**: the "triple with 4+ tribes" clause is gone; instead every buff its side gets in combat
  (start of combat, triggers, Legacies) counts double (golden: triple) while it is alive.
- **New Neighbours** (Neighbour, tier 6, 5/7): your end-of-turn effects trigger twice (golden: three times).
- **Block Party Host** is a Legacy now: each of your minions gets +2/+2 permanently per minion next to it.
- **Crypto Bro** is a First Impression: next turn, -1 to +3 extra gold (gold for a turn never goes below 0).
- Keynote Speaker joins the default-off list so the Philosophers' starting pool keeps 3 cards at tier 3.

## Rewards track
XP per level: 300 + 50 per level (was 500 + 50).

## New heroes (Nov 20)
Six unlockable heroes (art in `tools/p_heroes.py`, data in `tools/heroes.py`, rules in `game/engine.js`).
Boundaries were tuned with `node game/herosim.js 900`: all six land between 4.21 and 4.79 average place (old heroes 4.19–4.73).

| Hero | Power | Effect | Boundaries | Unlock |
| --- | --- | --- | --- | --- |
| The Day Trader | Buy the Dip (passive) | Unspent gold (up to 4) is invested; next turn it comes back as 0 to double | 2 | Sell 60 minions |
| The Overachiever | Gold Star (2 gold) | A minion gets +X/+X permanently, X = your tier | 4 | Win a run |
| The Collector | Limited Edition (passive) | Copies of your minions show up in the Feed 4× as often; golden minions get +4/+4 | 10 | Make 10 triples |
| The Networker | Circle Back (1 gold) | A random minion of each tribe you have gets +1/+1 | 8 | Have 5 tribes on your board |
| The Prepper | Bunker Mentality (passive) | Start of combat: your minions get +1 Health per 5 Health you have lost | 9 | Win a combat at 3 Health or less |
| The Trend Chaser | FOMO (passive) | The Feed shows one more minion (7 at tier 6) | 10 | Hire 250 minions |

Sells and triples are counted from this update on (`PROF.stats.sells`, `PROF.stats.triples`).
The Heroes collection page scrolls now (three rows).

Golden Consultant: every 4 gold you spend, gain +8/+8; its passive is the same as the normal card's (every 3 gold).
