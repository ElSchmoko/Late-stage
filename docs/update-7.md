# Update 7 (Nov 24)

## Cards
Philosophers had 8 cards at tier 3 and only 2 at tier 4. Three move up a tier, so tiers 3 and 4 hold five cards each and
both keep one card of each playstyle (Biggest Idea, Followers, Minimalism):

| Card | Before | After |
| --- | --- | --- |
| The Academy | tier 3, 4/5 | tier 4, 4/5 |
| Thought Experiment | tier 3, 3/3 | tier 4, 4/4 |
| Mystery Cult | tier 3, 2/5 | tier 4, 3/6 |

Feed pools are repaired once on load: a tier with more than 3 cards drops the extras, a tier with fewer than 2 is filled
with cards you own.

## Card books
Small cards, two per row and filled from the top like a binder page. Cards in your pool float a little above the page
with a soft shadow and an "In pool" label; cards you own but left out are faded with a dashed outline. The book room, the card shop and the
pack opening now fill wide and notched screens edge to edge.

## Levels reset
Every player starts the Levels track again from level 0 (once, on the first start after the update). Talents and unopened
free packs from levels are cleared and come back as the levels are reached again; owned cards, Cash, Clout, rating and
cosmetics stay. The old XP, talents and free packs are kept in the profile (`before1`) in case they need restoring.

## Collection reset
Owned cards are reset too (`flags.cards1`): everyone collects again from the starting cards. Cash and Clout stay; the
old collection and pity counters are kept in the profile (`before2`). Feed pools are repaired on next use.

## Clout and crafting
- The Clout jar in the shop has a purple "Craft" sign with the number of cards you can craft right now; it and the
  Clout wallet in the card books open a short explainer (get Clout from duplicates, find a grey card, craft it) with a
  button that jumps to a card you can craft.
- In the books, craftable cards carry a hammer and their price (purple and pulsing when you can afford it); book spines
  and tier tabs show a purple hammer where something is craftable now.
- The pack summary after duplicates points to the books.
