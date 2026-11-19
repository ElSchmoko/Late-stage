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
