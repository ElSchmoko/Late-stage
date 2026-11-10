"""Card pool for the Modern Life sim: all seven tribes plus the neutral Neighbours.
kind: 'eng' = keeps doing something while on the board, 'fi' = value comes once (when played),
'stat' = mostly a body. sellbait = meant to be sold for its effect."""

class Card:
    def __init__(self, name, tribe, tier, atk, hp, style='-', text='', flavour='', taunt=False, shield=False,
                 toxic=False, rebrand=False, collab=False, kind='eng', sellbait=False, discover=None, twice=False):
        self.name, self.tribe, self.tier, self.atk, self.hp = name, tribe, tier, atk, hp
        self.style, self.text, self.flavour = style, text, flavour
        self.taunt, self.shield, self.toxic, self.rebrand = taunt, shield, toxic, rebrand
        self.collab, self.kind, self.sellbait, self.discover, self.twice = collab, kind, sellbait, discover, twice

H, I, F, C, T, P, PH, N = 'Hustler', 'Influencer', 'Feral', 'Creative', 'Techie', 'Punk', 'Philosopher', 'Neutral'
TRIBES = [H, I, F, C, T, P, PH]

HUSTLERS = [
    Card('Dropshipper', H, 1, 2, 2, 'PI', 'First Impression: next turn, gain 1 extra gold.', kind='fi'),
    Card('Unpaid Intern', H, 1, 2, 2, 'EX', 'Sells for 2 gold instead of 1.', kind='stat', sellbait=True),
    Card('Grindset Guru', H, 1, 2, 2, 'PI', 'After you hire another Hustler, gain +2/+1.'),
    Card('Middle Manager', H, 2, 2, 4, 'EX', 'Attention Seeker. End of turn: take +1/+1 from the minion to its left. If that kills it, gain 1 extra gold next turn.', taunt=True),
    Card('Sneaker Reseller', H, 2, 3, 3, 'EX', 'Once per turn, after you sell a minion: give your Hustlers +3/+3.'),
    Card('Side Hustle', H, 2, 2, 3, 'PI', 'Once per turn, after you hire another Hustler, gain 1 gold.', 'Drives for three apps between meetings.'),
    Card('Thought Leader', H, 3, 3, 3, 'PI', 'Every 4 gold you spend: give your other Hustlers +2/+2.'),
    Card('Crypto Bro', H, 3, 3, 3, 'EX', 'Sells for 1 more gold for each turn on your board (max 5). Crashes to 0 after 4 turns.'),
    Card('Golden Parachute Exec', H, 3, 4, 3, 'EX', 'Legacy: next turn, gain 2 extra gold.'),
    Card('Venture Capitalist', H, 4, 3, 4, 'PI', 'First Impression: invest up to 4 of your gold: give a minion +2/+2 per gold invested.', kind='fi'),
    Card('Corporate Raider', H, 4, 4, 4, '-', 'Start of combat: deal 5 damage to the enemy minion with the lowest Health.'),
    Card('Consultant', H, 5, 4, 5, 'PI', 'Your "every 4 gold you spend" effects trigger every 3 gold instead.'),
    Card('Private Equity', H, 5, 4, 5, 'EX', 'After you sell a minion, your highest-Attack Hustler gains half its Attack and Health permanently.'),
    Card('Unicorn Startup', H, 6, 5, 6, 'PI', 'End of turn: give your other Hustlers +1/+1 for every 2 gold you spent this turn.'),
    Card('Too Big to Fail', H, 6, 6, 6, 'EX', 'Attention Seeker. The first time it would die each combat, it survives with 1 Health and your other Hustlers get +3/+3.', taunt=True),
]

INFLUENCERS = [
    Card('Reply Guy', I, 1, 1, 2, 'FO', 'Legacy: summon a 1/1 Follower.'),
    Card('Engagement Bot', I, 1, 1, 1, 'FO', 'First Impression: summon a 1/1 Follower.', kind='fi'),
    Card('Stan Account', I, 1, 1, 2, 'MC', 'End of turn: give your highest-Attack minion +2/+1.'),
    Card('Giveaway Host', I, 2, 2, 3, 'FO', 'End of turn: your Followers get +2/+2 for the rest of the game.'),
    Card('Comment Section', I, 2, 2, 2, 'FO', 'Legacy: summon two 1/1 Followers.', 'First.'),
    Card('Hype Man', I, 2, 2, 3, 'MC', 'End of turn: give your highest-Attack minion +1/+1 for each Influencer you have.'),
    Card('Unboxing Streamer', I, 3, 3, 3, 'FO', 'Legacy: summon two Followers.'),
    Card('Viral Video', I, 3, 3, 3, 'FO', 'After a friendly minion dies, summon a Follower (3 times per combat).'),
    Card('Personal Brand', I, 3, 3, 3, 'MC', 'First Impression: give a minion +3/+3. If it is your highest-Attack minion, +4/+4 instead.', kind='fi'),
    Card('Engagement Farmer', I, 4, 3, 4, 'FO', 'After you summon a Follower, give it +5/+5.'),
    Card('Paparazzi', I, 4, 2, 4, 'MC', 'Start of combat: give your highest-Attack minion Out of Office.'),
    Card('Brand Ambassador', I, 5, 4, 5, 'FO', 'Start of combat: summon a Follower for each empty space on your board (up to 4).'),
    Card('Ring Light Studio', I, 5, 3, 6, 'MC', 'End of turn: give your highest-Attack minion +2/+2 for each other Influencer you have.'),
    Card('Blue Checkmark', I, 6, 4, 6, 'FO', 'Your Followers attack twice.'),
    Card('Main Character', I, 6, 5, 7, 'MC', 'Attention Seeker. End of turn: gain +4/+4 for each other minion that was buffed this turn.', taunt=True),
]

# ---------------------------------------------------------------- Ferals: Overgrowth (OG) / Tree Huggers (TH)
FERALS = [
    Card('Windowsill Succulent', F, 1, 1, 2, 'OG', 'Every second end of turn: gain +2/+2.', 'Watered once. In March.'),
    Card('City Pigeon', F, 1, 1, 3, 'TH', 'Attention Seeker.', 'Will not move for your bike.', taunt=True, kind='stat'),
    Card('Trash Panda', F, 1, 2, 1, '-', 'Rebrand.', 'Evicted from the bin. Moved back in.', rebrand=True, kind='stat'),
    Card('Monstera', F, 2, 2, 3, 'OG', 'End of turn: gain +2/+1.', 'Named Gerald. Has its own account.'),
    Card('Tree Hugger', F, 2, 1, 4, 'TH', 'Attention Seeker. Start of combat: give the minions next to it +1/+2.', 'Not moving until you listen.', taunt=True),
    Card('Compost Heap', F, 2, 1, 4, 'OG', 'End of turn: give the Feral that has been on your board the longest +2/+2.', 'Smells like progress.'),
    Card('Plant Parent', F, 3, 2, 3, 'OG', 'End of turn: give your other Ferals +2/+2.', 'Talks to them. They don\'t answer.'),
    Card('Protest Camp', F, 3, 2, 5, 'TH', 'Attention Seeker. End of turn: give your other Feral Attention Seekers +3/+3.', 'Day 41. There\'s a kombucha rota.', taunt=True),
    Card('Urban Fox', F, 3, 3, 3, '-', 'Out of Office.', 'Screams at 3 a.m. Unbothered by day.', shield=True, kind='stat'),
    Card('Rooftop Beehive', F, 4, 3, 5, 'OG', 'End of turn: give the minions next to it +1/+1.', 'Organic, local, slightly angry.'),
    Card('Guerrilla Gardener', F, 4, 2, 5, 'TH', 'Start of combat: give your lowest-Health minion Out of Office.', 'Planted it at 3 a.m. You\'re welcome.'),
    Card('Ancient Oak', F, 5, 3, 7, 'OG', 'Your end-of-turn effects give Ferals twice as much.', 'Older than the city. Still not a listed building.'),
    Card('Human Chain', F, 5, 4, 6, 'TH', 'Attention Seeker. Start of combat: give the minions next to it Out of Office.', 'Arms linked. Phones out.', taunt=True),
    Card('World Tree', F, 6, 4, 8, 'OG', 'End of turn: give your other Ferals +1/+1 for each turn this has been on your board (max +3).', 'Was here first. Will be here last.'),
    Card('Old-Growth Blockade', F, 6, 4, 8, 'TH', 'Attention Seeker. Start of combat: give your other minions +1/+2 for each Attention Seeker you have.', 'The bulldozers left. The tents stayed.', taunt=True),
]

# ---------------------------------------------------------------- Creatives: Posthumous Fame (PF) / Performers (PE)
CREATIVES = [
    Card('Busker', C, 1, 2, 2, 'PE', 'After you play a Creative, gain +2/+1.', 'Knows four chords. Uses all of them.'),
    Card('Open Mic Poet', C, 1, 1, 2, 'PF', 'Legacy: give the minions next to it +2/+2.', 'Snaps only, please.'),
    Card('Art Student', C, 1, 2, 2, 'PE', 'First Impression: give another Creative +2/+2.', 'Year three of a four-year course. Year seven.', kind='fi'),
    Card('Struggling Artist', C, 2, 2, 2, 'PF', 'Legacy: give your other minions +1/+1.', 'Famous, eventually.'),
    Card('Merch Stand', C, 2, 2, 3, 'PE', 'After you play a Creative, gain 1 extra gold next turn (once per turn).', 'Tote bags. Only tote bags.'),
    Card('Method Actor', C, 2, 3, 2, 'PF', 'Rebrand.', 'Died for the role. Twice.', rebrand=True),
    Card('Memorial Mural', C, 3, 2, 4, 'PF', 'After a friendly minion dies, give your other Creatives +1 Attack.', 'Painted the day after. Signed very large.'),
    Card('Indie Band', C, 3, 3, 3, 'PE', 'After you play a Creative, give it +3/+3 and this +1/+1.', 'You won\'t have heard of them. Neither have they.'),
    Card('Conceptual Artist', C, 3, 2, 3, '-', 'First Impression: Discover a Creative.', 'It\'s a banana. It\'s also a statement.', kind='fi', discover=C),
    Card('Art Critic', C, 4, 3, 4, 'PF', 'After a friendly minion dies, gain +1/+1 permanently (3 times per combat).', 'Always preferred their early work.'),
    Card('Record Label', C, 4, 3, 4, 'PE', 'First Impression: give your other Creatives +3/+3.', 'Owns your masters. And you.', kind='fi'),
    Card('Festival Headliner', C, 5, 4, 5, 'PE', 'After you play a Creative, give your other Creatives +3/+3.', 'Ninety-minute soundcheck.'),
    Card('Museum Retrospective', C, 5, 4, 6, 'PF', 'Twice per combat, after a friendly minion dies: give your other Creatives +3/+3 permanently.', 'Finally appreciated. Finally dead.'),
    Card('Dead Rock Star', C, 6, 5, 6, 'PF', 'Legacy: give your other Creatives +3/+3 permanently.', 'Sales tripled overnight.'),
    Card('World Tour', C, 6, 5, 6, 'PE', 'After you play a minion, give your Creatives +2/+2.', 'Same set, 140 cities.'),
]

# ---------------------------------------------------------------- Techies: Gadgets (GA) / Gamers (GM)
TECHIES = [
    Card('Speedrunner', T, 1, 2, 2, 'GM', 'After this kills a minion, gain +2/+1 permanently (twice per combat).', 'Skips every cutscene, including dinner.'),
    Card('Smart Plug', T, 1, 2, 2, 'GA', 'Collab. (The minion it sticks to becomes a Techie too.)', 'Turns the lights on. Sometimes.', collab=True, kind='fi'),
    Card('Loot Box', T, 1, 1, 1, '-', 'First Impression: Discover a Techie.', 'Contents may vary.', kind='fi', discover=T),
    Card('Robot Vacuum', T, 2, 2, 2, 'GA', 'Collab. Start of combat: deal 1 damage to the enemy minion with the lowest Health.', 'Stuck under the sofa again.', collab=True),
    Card('Toxic Teammate', T, 2, 1, 3, 'GM', 'Toxic.', 'gg ez', toxic=True, kind='stat'),
    Card('Firmware Update', T, 2, 2, 3, 'GA', 'After you Collab, give your Techies +2/+1.', 'Restart required. Again.'),
    Card('Rage Quitter', T, 3, 4, 2, 'GM', 'Legacy: deal 3 damage to the minion that killed it.', 'Uninstalled. Reinstalled by dinner.'),
    Card('Smart Fridge', T, 3, 2, 2, 'GA', 'Collab. End of turn: give your Techies +1/+1.', 'Orders oat milk at 2 a.m.', collab=True),
    Card('E-Sports Coach', T, 3, 3, 4, 'GM', 'Start of combat: give the minion to its left Toxic.', 'Has never played. Knows exactly what you did wrong.'),
    Card('Noise-Cancelling Headphones', T, 4, 2, 4, 'GA', 'Collab. Out of Office.', 'Can\'t hear you. On purpose.', collab=True, shield=True),
    Card('Leaderboard', T, 4, 2, 5, 'GM', 'End of turn: give your other Techies +1/+1 for each enemy minion your Techies killed last combat (max +3).', 'Your name, spelled wrong, at #3.'),
    Card('Smart Home Hub', T, 5, 3, 5, 'GA', 'Your Collabs stick to two minions instead of one.', 'Hey Hub, turn off. Hey Hub. HUB.'),
    Card('Pro Gamer', T, 5, 5, 5, 'GM', 'Attacks twice. After this kills a minion, gain +4/+4 permanently (once per combat).', 'Sponsored by an energy drink and a chair.', twice=True),
    Card('Quantum Computer', T, 6, 5, 5, 'GA', 'Collab. Out of Office. Rebrand.', 'Nobody knows what it does. It does it very fast.', collab=True, shield=True, rebrand=True),
    Card('World Record', T, 6, 5, 6, 'GM', 'Start of combat: give your other Techies Toxic.', 'Frame-perfect. Unverified.'),
]

# ---------------------------------------------------------------- Punks: Sabotage (SA) / Sellouts (SO)
PUNKS = [
    Card('Graffiti Kid', P, 1, 2, 3, 'SA', 'Start of combat: deal 1 damage to the left-most enemy minion for each Punk you have.', 'It\'s a statement.'),
    Card('Anarchist Barista', P, 1, 2, 2, 'SO', 'When sold: next turn, gain 1 extra gold.', 'Refuses tips. Takes them anyway.', kind='stat', sellbait=True),
    Card('Zine Maker', P, 1, 2, 2, 'SO', 'When sold: give the minion to its right +3/+3.', 'Issue #1 of 1.', kind='stat', sellbait=True),
    Card('Sellout Frontman', P, 2, 3, 3, 'SO', 'When sold: give your other Punks +2/+2.', 'Signed to a major label. Still punk, though.', kind='stat', sellbait=True),
    Card('Heckler', P, 2, 3, 3, 'SA', 'Start of combat: deal 3 damage to the enemy minion with the highest Attack.', 'Boo. Encore. Boo.'),
    Card('Crust Punk', P, 2, 3, 3, 'SA', 'Your Punks\' start-of-combat damage to enemy minions is increased by 2.', 'Hasn\'t washed the jacket since 1998.'),
    Card('Squat Collective', P, 3, 3, 4, 'SO', 'Your Punks\' "When sold" effects also trigger when they die.', 'Consensus reached in nine hours.'),
    Card('Feedback Loop', P, 3, 3, 4, 'SA', 'Start of combat: deal 1 damage to all enemy minions. If that kills any, give your Punks +3/+2 permanently.', 'Turned it up. Kept going.'),
    Card('Pirate Radio', P, 3, 2, 3, '-', 'First Impression: Discover a Punk.', 'Broadcasting from a van.', kind='fi', discover=P),
    Card('Mosh Pit', P, 4, 4, 4, 'SA', 'Start of combat: remove Out of Office from the enemy minion with the highest Attack, then deal damage equal to this minion\'s Attack to it. If it dies, gain its Attack permanently.', 'Personal space is a social construct.'),
    Card('Jingle Writer', P, 4, 3, 3, 'SO', 'When sold: give your other Punks +1/+1 for each Punk you have sold this game (max +6).', 'Wrote "Smash the System". Now it sells yoghurt.', kind='stat', sellbait=True),
    Card('Reunion Tour', P, 5, 3, 6, 'SO', 'Your "When sold" effects trigger twice.', 'Only doing it for the fans.'),
    Card('Stage Diver', P, 5, 5, 5, 'SA', 'Start of combat: deal damage equal to this minion\'s Attack to the left-most enemy minion, then gain +2 Attack permanently.', 'Trust fall. No trust.'),
    Card('Greatest Hits', P, 6, 5, 6, 'SO', 'After you sell a Punk, put a copy of it in the Feed. It costs 2 gold.', 'Contains one new song. Nobody listens to it.'),
    Card('General Strike', P, 6, 5, 6, 'SA', 'Start of combat: deal 1 damage to all enemy minions for each Punk you have. Then give your Punks +1/+1 permanently for each enemy minion that died.', 'Nobody works. Everybody wins.'),
]

# ---------------------------------------------------------------- Philosophers: Big Ideas (BI) / Stoics (ST)
PHILOSOPHERS = [
    Card('Shower Thinker', PH, 1, 1, 2, 'BI', 'End of turn: give the minion to its right +2/+2 for the next combat.', 'What if Mondays are a construct?'),
    Card('Stoicism Podcaster', PH, 1, 1, 3, 'ST', 'Attention Seeker. After this survives damage, gain +1 Health permanently (once per combat).', 'Episode 400: Discomfort.', taunt=True),
    Card('Nihilist', PH, 1, 2, 2, '-', 'Legacy: give the minions next to it +1 Attack.', 'Nothing matters. Except this.', kind='stat'),
    Card('Cold-Plunge Stoic', PH, 2, 2, 4, 'ST', 'Attention Seeker. After this survives damage, gain +1/+1 permanently (once per combat).', 'Up at 4 a.m. Tells everyone.', taunt=True),
    Card('Pub Philosopher', PH, 2, 3, 2, 'BI', 'End of turn: give the minion to its left +3/+1 for the next combat.', 'Three pints in, solved free will.'),
    Card('Marathon Monk', PH, 2, 1, 5, 'ST', 'Attention Seeker. After this survives damage, give the minion to its right +2/+2 permanently (once per combat).', 'Runs to clear the mind. Talks the whole way.', taunt=True),
    Card('Thought Experiment', PH, 3, 3, 3, 'BI', 'End of turn: give the minions next to it +3/+3 for the next combat.', 'Imagine a trolley…'),
    Card('Keynote Speaker', PH, 3, 2, 3, '-', 'First Impression: Discover a Philosopher.', 'Disrupting thought itself.', kind='fi', discover=PH),
    Card('Book-Club Stoic', PH, 3, 2, 4, 'ST', 'Attention Seeker. Out of Office.', 'Read one book. Quotes it daily.', taunt=True, shield=True, kind='stat'),
    Card('Utilitarian', PH, 4, 2, 4, 'BI', 'End of turn: give your three lowest-Attack other Philosophers +3/+3.', 'Did the maths. Greatest good, greatest number.'),
    Card('Desert Hermit', PH, 4, 2, 6, 'ST', 'Attention Seeker. After this survives damage, give your other Philosophers +3/+3 permanently (once per combat).', 'Moved off-grid. Posts about it.', taunt=True),
    Card('The Cynic', PH, 5, 3, 9, 'ST', 'Attention Seeker. After this takes damage, give your other Philosophers +1 Attack.', 'Lives in a barrel. Has opinions.', taunt=True),
    Card('Bestselling Author', PH, 5, 3, 6, 'BI', 'End of turn: make the next-combat buffs on your Philosophers permanent.', 'Wrote down your idea. Kept the royalties.'),
    Card('Grand Unified Theory', PH, 6, 4, 7, 'BI', 'End of turn: double the next-combat buffs on your minions.', 'Explains everything. Predicts nothing.'),
    Card('Enlightened Guru', PH, 6, 3, 10, 'ST', 'Attention Seeker. Your other Attention Seekers take at most 3 damage at a time.', 'At peace. Charges €900 a weekend.', taunt=True),
]

NEIGHBOURS = [
    Card('Nosy Neighbour', N, 1, 2, 2, taunt=True, kind='stat'),
    Card('Wi-Fi Leech', N, 1, 1, 2),
    Card('Package Hoarder', N, 2, 1, 4),
    Card('Quiet-Hours Enforcer', N, 2, 3, 3),
    Card('Caretaker', N, 3, 2, 5),
    Card('Helpful Neighbour', N, 3, 3, 3, kind='fi'),
    Card('Leaf Blower Guy', N, 4, 4, 5),
    Card('DJ Upstairs', N, 5, 2, 5),
    Card('Lawyer Next Door', N, 5, 1, 7),
    Card('The Landlord', N, 5, 5, 5),
    Card('Block Party Host', N, 6, 6, 6, text='End of turn: give the minions next to it +2/+2.'),
]

BY_TRIBE = {H: HUSTLERS, I: INFLUENCERS, F: FERALS, C: CREATIVES, T: TECHIES, P: PUNKS, PH: PHILOSOPHERS}
STYLES = {  # style code -> (tribe, display name)
    'PI': (H, 'Passive Income'), 'EX': (H, 'Exploitation'),
    'FO': (I, 'Followers'), 'MC': (I, 'Main Character'),
    'OG': (F, 'Overgrowth'), 'TH': (F, 'Tree Huggers'),
    'PF': (C, 'Posthumous Fame'), 'PE': (C, 'Performers'),
    'GA': (T, 'Gadgets'), 'GM': (T, 'Gamers'),
    'SA': (P, 'Sabotage'), 'SO': (P, 'Sellouts'),
    'BI': (PH, 'Big Ideas'), 'ST': (PH, 'Stoics'),
}
COPIES = {1: 16, 2: 15, 3: 13, 4: 11, 5: 9, 6: 7}
ALL = [c for t in TRIBES for c in BY_TRIBE[t]] + NEIGHBOURS


# ======================================================================== v5 rework (Nov 2026)
# Goals: higher tiers are clearly stronger than lower tiers of the same tribe, low-tier scalers grow slower,
# and more varied mechanics borrowed from Battlegrounds: Likes (a buff resource, like Blood Gems),
# Clock In (Rally), Grievance (Avenge), Side Gig (Activate), Acquire (consume a Feed minion), Cleave,
# and "this game" Feed and tribe buffs. Engine: game/engine.js. The Python sim.py predates v5.
V5 = {
    # Hustlers
    'Grindset Guru': (2, 2, 'After you hire another Hustler, gain +1/+1.'),
    'Sneaker Reseller': (3, 3, 'Once per turn, after you sell a minion: give your Hustlers +2/+2.'),
    'Side Hustle': (2, 3, 'Side Gig (1): give a minion +2/+2.'),
    'Thought Leader': (3, 4, 'Every 4 gold you spend: give your other Hustlers +2/+1.'),
    'Crypto Bro': (4, 4, 'Sells for 1 more gold for each turn on your board (max 6). Crashes to 0 after 5 turns.'),
    'Venture Capitalist': (4, 5, 'First Impression: invest up to 4 of your gold: give a minion +3/+3 per gold invested.'),
    'Corporate Raider': (5, 5, 'Start of combat: deal 6 damage to the enemy minion with the lowest Health.'),
    'Consultant': (5, 6, 'Your "every 4 gold you spend" effects trigger every 3 gold instead.'),
    'Private Equity': (6, 6, 'End of turn: Acquire the highest-Attack minion in the Feed: gain half its stats and it leaves the Feed.'),
    'Unicorn Startup': (6, 8, 'End of turn: give your other Hustlers +1/+1 for every 2 gold you spent this turn.'),
    'Too Big to Fail': (8, 8, 'Attention Seeker. The first time it would die each combat, it survives with 1 Health and your other Hustlers get +3/+3.'),
    # Influencers
    'Stan Account': (1, 2, 'End of turn: get 2 Likes.'),
    'Hype Man': (3, 3, 'Clock In: get 2 Likes.'),
    'Unboxing Streamer': (3, 3, 'First Impression: get 2 Likes. Legacy: summon a Follower.'),
    'Personal Brand': (3, 4, 'First Impression: your Likes give +1/+1 more this game.'),
    'Engagement Farmer': (4, 5, 'After you summon a Follower, give it +5/+5.'),
    'Paparazzi': (3, 6, 'Start of combat: give your highest-Attack minion Out of Office.'),
    'Brand Ambassador': (5, 6, 'Start of combat: summon two Followers. They get +3/+3 for each Influencer you have.'),
    'Ring Light Studio': (3, 8, 'End of turn: get 2 Likes for each other Influencer you have.'),
    'Blue Checkmark': (6, 8, 'Start of combat: your Followers get Out of Office. They attack twice.'),
    'Main Character': (7, 9, 'Attention Seeker. Likes you give this minion count triple.'),
    # Ferals
    'City Pigeon': (2, 2, 'Attention Seeker. Legacy: summon a 1/1 Pigeon with Attention Seeker.'),
    'Monstera': (2, 3, 'End of turn: gain +1/+1.'),
    'Compost Heap': (1, 4, 'Legacy: Ferals in the Feed get +2/+2 this game.'),
    'Plant Parent': (2, 4, 'End of turn: give your other Ferals +1/+1.'),
    'Urban Fox': (3, 3, 'Out of Office. Clock In: give another Feral +2/+2 permanently.'),
    'Rooftop Beehive': (3, 6, 'End of turn: give the minions next to it +2/+2.'),
    'Guerrilla Gardener': (4, 5, 'End of turn: Ferals in the Feed get +1/+1 this game.'),
    'Ancient Oak': (3, 8, 'Your end-of-turn effects give Ferals twice as much.'),
    'Human Chain': (4, 7, 'Attention Seeker. Start of combat: give the minions next to it Out of Office.'),
    'World Tree': (5, 9, 'End of turn: give your other Ferals +1/+1 for each turn this has been on your board (max +4).'),
    'Old-Growth Blockade': (5, 9, 'Attention Seeker. Start of combat: give your other minions +1/+1 for each Attention Seeker you have.'),
    # Creatives
    'Busker': (2, 2, 'After you play a Creative, gain +1/+1.'),
    'Memorial Mural': (2, 5, 'Grievance (2): your Creatives get +1 Attack this game, wherever they are.'),
    'Indie Band': (3, 4, 'After you play a Creative, give it +3/+3 and this +1/+1.'),
    'Art Critic': (4, 5, 'After a friendly minion dies, gain +1/+1 permanently (3 times per combat).'),
    'Record Label': (4, 4, 'After you play a Creative, give it +3/+3 for each Creative you played this turn.'),
    'Festival Headliner': (5, 6, 'After you play a Creative, give your other Creatives +3/+3.'),
    'Museum Retrospective': (4, 8, 'Grievance (2): give your other Creatives +3/+3 permanently.'),
    'Dead Rock Star': (7, 7, 'Legacy: give your other Creatives +4/+4 permanently.'),
    'World Tour': (6, 8, 'After you play a minion, give your Creatives +2/+2.'),
    # Techies
    'Speedrunner': (1, 2, 'After this kills a minion, gain +1/+1 permanently (once per combat).'),
    'Smart Plug': (2, 2, 'Collab. End of turn: the minion it sticks to gains +1 Health.'),
    'Rage Quitter': (5, 3, 'Legacy: deal 5 damage to the minion that killed it.'),
    'Leaderboard': (4, 6, 'Clock In: give your other Techies +2/+1 permanently.'),
    'E-Sports Coach': (4, 5, 'Start of combat: give the minions next to it Toxic.'),
    'Smart Home Hub': (4, 7, 'Your Collabs stick to two minions instead of one.'),
    'Pro Gamer': (6, 6, 'Attacks twice. After this kills a minion, gain +4/+4 permanently (once per combat).'),
    'Quantum Computer': (6, 6, 'Collab. Out of Office. Rebrand.'),
    'World Record': (6, 7, 'Start of combat: give your two left-most other Techies Toxic.'),
    # Punks
    'Zine Maker': (2, 2, 'When sold: give the minion to its right +3/+3.'),
    'Sellout Frontman': (3, 3, 'When sold: give your other Punks +2/+2. Punks in the Feed get +1/+1 this game.'),
    'Mosh Pit': (6, 6, 'Cleave: its attacks also hit the minions next to its target.'),
    'Jingle Writer': (4, 5, 'When sold: give your other Punks +1/+1 for each Punk you have sold this game (max +8).'),
    'Reunion Tour': (4, 8, 'Your "When sold" effects trigger twice.'),
    'Stage Diver': (6, 6, "Start of combat: deal damage equal to this minion's Attack to the left-most enemy minion, then gain +3 Attack permanently."),
    'Greatest Hits': (6, 7, 'After you sell a Punk, put a copy of it in the Feed. It costs 2 gold.'),
    'General Strike': (6, 7, 'Start of combat: deal 1 damage to all enemy minions for each Punk you have. Then give your Punks +1/+1 permanently for each enemy minion that died.'),
    # Philosophers
    'Giveaway Host': (2, 3, 'End of turn: your Followers get +3/+3 this game.'),
    'Protest Camp': (2, 5, 'Attention Seeker. End of turn: give your other Feral Attention Seekers +2/+2.'),
    'Heckler': (3, 3, 'Start of combat: deal 4 damage to the enemy minion with the highest Attack.'),
    'Shower Thinker': (1, 2, 'End of turn: give the minion to its right +3/+3 for the next combat.'),
    'Pub Philosopher': (3, 2, 'End of turn: give the minion to its left +4/+2 for the next combat.'),
    'Nihilist': (2, 2, 'Legacy: give your minions +1 Attack.'),
    'Utilitarian': (3, 5, 'End of turn: give your three lowest-Attack other Philosophers +2/+2.'),
    'The Cynic': (4, 9, 'Attention Seeker. After this takes damage, give your other Philosophers +1/+1.'),
    'Bestselling Author': (4, 7, 'End of turn: make the next-combat buffs on your Philosophers permanent.'),
    'Grand Unified Theory': (5, 9, 'End of turn: double the next-combat buffs on your minions.'),
    'Enlightened Guru': (3, 9, 'Attention Seeker. Your other Attention Seekers take at most 3 damage at a time.'),
    'Desert Hermit': (3, 7, 'Attention Seeker. After this survives damage, give your other Philosophers +3/+3 permanently (once per combat).'),
}
for _c in ALL:
    if _c.name in V5:
        _c.atk, _c.hp, _c.text = V5[_c.name]
        if _c.name == 'Mosh Pit':
            _c.style = 'SA'
# V6: head-to-head test of tiers 1-3 (game/tiertest.js). (tier, atk, hp, text or None)
V6 = {
    'Stan Account': (2, 2, 2, None), 'Comment Section': (1, 2, 2, None), 'Loot Box': (2, 1, 1, None), 'Toxic Teammate': (1, 1, 3, None),
    'Grindset Guru': (1, 1, 2, None), 'Graffiti Kid': (1, 2, 2, None), 'Trash Panda': (1, 2, 2, None), 'Reply Guy': (1, 2, 2, None),
    'Engagement Bot': (1, 2, 1, None), 'Nihilist': (1, 2, 3, None), 'City Pigeon': (1, 2, 3, None), 'Nosy Neighbour': (1, 2, 3, None),
    'Giveaway Host': (2, 2, 3, 'End of turn: your Followers get +2/+2 this game.'),
    'Compost Heap': (2, 1, 4, 'Legacy: Ferals in the Feed get +1/+1 this game.'),
    'Sneaker Reseller': (2, 2, 3, 'Once per turn, after you sell a minion: give your Hustlers +2/+1.'),
    'Side Hustle': (2, 2, 2, None),
    'Robot Vacuum': (2, 2, 2, 'Collab. Start of combat: deal 2 damage to the enemy minion with the lowest Health.'),
    'Tree Hugger': (2, 1, 4, 'Attention Seeker. Start of combat: give the minions next to it +2/+2.'),
    'Package Hoarder': (2, 2, 4, None),
    'Thought Leader': (3, 3, 4, 'Every 4 gold you spend: give your other Hustlers +1/+1.'),
    'Feedback Loop': (3, 3, 4, 'Start of combat: deal 1 damage to all enemy minions. If that kills any, give your Punks +2/+1 permanently.'),
    'Book-Club Stoic': (3, 3, 5, None),
    'Unboxing Streamer': (3, 3, 3, 'First Impression: get 3 Likes. Legacy: summon a Follower.'),
    'Personal Brand': (3, 4, 5, None), 'Rage Quitter': (3, 5, 4, None), 'Keynote Speaker': (3, 3, 3, None),
    'Helpful Neighbour': (3, 3, 4, None),
    # round 2: trim the top of each tier, lift the bottom (Hustlers and Punks most)
    'Smart Plug': (1, 1, 2, None), 'Open Mic Poet': (1, 2, 2, None), 'Wi-Fi Leech': (1, 2, 2, None), 'Dropshipper': (1, 2, 3, None),
    'Zine Maker': (1, 2, 2, 'When sold: give the minion to its right +4/+4.'),
    'Giveaway Host': (2, 2, 3, 'End of turn: your Followers get +1/+1 this game.'),
    'Middle Manager': (2, 3, 4, None), 'Quiet-Hours Enforcer': (2, 3, 4, None),
    'Package Hoarder': (2, 2, 4, 'Legacy: give the minions next to it +3/+3.'),
    'Thought Leader': (3, 3, 4, 'Every 5 gold you spend: give your other Hustlers +1/+1.'),
    'Consultant': (5, 5, 6, 'Your "every 5 gold you spend" effects trigger every 4 gold instead.'),
    'Feedback Loop': (3, 3, 4, 'Start of combat: deal 1 damage to all enemy minions. If that kills any, give your Punks +1/+1 permanently.'),
    'Crypto Bro': (3, 4, 5, None), 'Squat Collective': (3, 4, 5, None), 'Book-Club Stoic': (3, 4, 5, None),
    'Caretaker': (3, 2, 5, None),
    # round 3: tribe balance after the tier fixes
    'Thought Leader': (3, 3, 4, 'Every 4 gold you spend: give your other Hustlers +1/+1.'),
    'Consultant': (5, 5, 6, 'Your "every 4 gold you spend" effects trigger every 3 gold instead.'),
    'Sneaker Reseller': (2, 2, 3, 'Once per turn, after you sell a minion: give your Hustlers +2/+2.'),
    'Giveaway Host': (2, 1, 3, 'End of turn: your Followers get +2/+2 this game.'),
    'Ring Light Studio': (5, 4, 8, None), 'Main Character': (6, 8, 10, None),
    'Feedback Loop': (3, 3, 4, 'Start of combat: deal 1 damage to all enemy minions. If that kills any, give your Punks +2/+1 permanently.'),
    'Sellout Frontman': (2, 3, 4, None),
    # round 4: neutral bodies back (they mostly fed the "big stats" bot); Hustler early bodies back
    'Nosy Neighbour': (1, 2, 2, None), 'Wi-Fi Leech': (1, 1, 2, None), 'Quiet-Hours Enforcer': (2, 3, 3, None), 'Helpful Neighbour': (3, 3, 3, None),
    'Package Hoarder': (2, 1, 4, None), 'Grindset Guru': (1, 2, 2, None), 'Side Hustle': (2, 2, 3, None),
    # round 5: effect buffs for the weaker styles
    'Sellout Frontman': (2, 3, 3, 'When sold: give your other Punks +3/+3. Punks in the Feed get +1/+1 this game.'),
    'Jingle Writer': (4, 4, 5, 'When sold: give your other Punks +1/+1 for each Punk you have sold this game (max +12).'),
    'Personal Brand': (3, 3, 4, 'First Impression: get 2 Likes. Your Likes give +1/+1 more this game.'),
    'Paparazzi': (4, 4, 6, None),
    'Engagement Farmer': (4, 4, 5, 'After you summon a Follower, give it +6/+6.'),
    'Viral Video': (3, 3, 3, 'After a friendly minion dies, summon a Follower (4 times per combat).'),
    'Venture Capitalist': (4, 4, 5, 'First Impression: invest up to 4 of your gold: give a minion +4/+4 per gold invested.'),
    'Too Big to Fail': (6, 8, 8, 'Attention Seeker. The first time it would die each combat, it survives with 1 Health and your other Hustlers get +4/+4.'),
    'Anarchist Barista': (1, 2, 3, None), 'Reunion Tour': (5, 5, 9, None), 'Mosh Pit': (4, 6, 8, None),
    'Stage Diver': (5, 6, 6, "Start of combat: deal damage equal to this minion's Attack to the left-most enemy minion, then gain +4 Attack permanently."),
    'Unicorn Startup': (6, 7, 9, None), 'Consultant': (5, 6, 7, None), 'Private Equity': (5, 6, 8, None),
    'Jingle Writer': (4, 4, 5, 'When sold: give your other Punks +2/+2 for each Punk you have sold this game (max +16).'),
    'Greatest Hits': (6, 7, 8, None),
    # v8: multi-dimension balance pass (docs/balance-method.md)
    'Comment Section': (2, 2, 3, None),
    'Hype Man': (1, 2, 2, 'Clock In: get 1 Like.'),
    'Unboxing Streamer': (3, 3, 3, 'First Impression: summon a Follower and get 2 Likes.'),
    'Giveaway Host': (2, 1, 3, 'End of turn: your Followers get +1/+1 this game.'),
    'Paparazzi': (4, 4, 6, 'Start of combat: give your two highest-Attack Influencers Out of Office.'),
    'Feedback Loop': (3, 3, 4, 'Start of combat: deal 1 damage to all enemy minions. If that kills any, give your Punks +1/+1 permanently.'),
    'Desert Hermit': (4, 3, 7, 'Attention Seeker. After this survives damage, give your other Philosophers +2/+2 permanently (once per combat).'),
    'Rage Quitter': (2, 4, 3, 'Legacy: deal 4 damage to the minion that killed it.'),
    'Thought Leader': (4, 4, 5, None),
    'Side Hustle': (2, 2, 3, 'Side Gig (1): give a Hustler +3/+3.'),
    'Record Label': (4, 4, 4, 'End of turn: give another Creative +3/+3 for each Creative you played this turn.'),
    'Windowsill Succulent': (1, 1, 2, 'End of turn: if you have another Feral, gain +1/+1.'),
    'Monstera': (2, 2, 3, 'After you Scroll, gain +1/+1 (twice per turn).'),
    'Tree Hugger': (2, 1, 4, 'Attention Seeker. Start of combat: give the Ferals next to it +2/+2.'),
    'Rooftop Beehive': (4, 3, 6, 'End of turn: give the Ferals next to it +3/+3.'),
    'Guerrilla Gardener': (4, 4, 5, 'End of turn: Ferals in the Feed get +2/+2 this game.'),
    'Utilitarian': (4, 3, 5, 'Start of combat: give your three lowest-Attack other Philosophers +3/+3.'),
    'Nosy Neighbour': (1, 2, 3, None),
    'Quiet-Hours Enforcer': (2, 3, 3, 'Start of combat: the left-most enemy minion loses 3 Attack.'),
    'Leaf Blower Guy': (4, 4, 5, 'Start of combat: deal 1 damage to all enemy minions and to your minions next to it.'),
    'Venture Capitalist': (3, 3, 4, 'First Impression: invest up to 4 of your gold: give a minion +3/+3 per gold invested.'),
    # v8 pass 2: tribe curves (late Influencers and Philosophers), parity, cohesion
    'Brand Ambassador': (5, 5, 6, 'Start of combat: give your Followers +1/+1 for each Influencer you have.'),
    'Blue Checkmark': (6, 6, 8, 'Start of combat: your Followers get Out of Office and +2/+2. They attack twice.'),
    'Paparazzi': (4, 4, 6, 'Start of combat: give your two highest-Attack Influencers Out of Office and +2/+2.'),
    'Unboxing Streamer': (3, 3, 3, 'First Impression: summon two Followers and get 2 Likes.'),
    'Bestselling Author': (5, 4, 7, 'End of turn: make the next-combat buffs on your minions permanent.'),
    'Grand Unified Theory': (6, 5, 9, 'End of turn: give your minions +1/+1 for the next combat, then double all next-combat buffs.'),
    'Book-Club Stoic': (3, 4, 5, 'Attention Seeker. Out of Office. Start of combat: give your other Attention Seekers +2/+2.'),
    'Thought Experiment': (3, 3, 3, 'End of turn: give the Philosophers next to it +3/+3 for the next combat.'),
    'Marathon Monk': (2, 1, 5, 'Attention Seeker. After this survives damage, give the Philosopher to its right +2/+2 permanently (once per combat).'),
    'Thought Leader': (4, 4, 5, 'Every 5 gold you spend: give your other Hustlers +1/+1.'),
    'Consultant': (5, 6, 7, 'Your "every 5 gold you spend" effects trigger every 4 gold instead.'),
    'Corporate Raider': (4, 5, 5, 'Start of combat: deal 6 damage to the enemy minion with the lowest Health. If it dies, gain 1 extra gold next turn.'),
    'Side Hustle': (2, 2, 3, 'Side Gig (1): give another Hustler +3/+3.'),
    'Indie Band': (3, 3, 4, 'After you play a Creative, give it +2/+2 and this +1/+1.'),
    'Festival Headliner': (5, 5, 6, 'After you play a Creative, give your other Creatives +2/+2.'),
    'Art Student': (1, 2, 2, 'First Impression: give another Creative +3/+3.'),
    'Plant Parent': (3, 2, 4, 'End of turn: give two other Ferals +1/+1.'),
    'Rooftop Beehive': (4, 3, 6, 'End of turn: give the Ferals next to it +2/+2.'),
    'Firmware Update': (2, 2, 3, 'After you Collab, give your Techies +1/+1.'),
    'Feedback Loop': (3, 3, 4, 'Start of combat: deal 1 damage to all enemy minions. If that kills any, give your Punks +2/+2 for this combat.'),
    'Greatest Hits': (6, 7, 8, 'After you sell a Punk, give your Punks +1/+1 and put a copy of it in the Feed.'),
    'Leaf Blower Guy': (4, 5, 6, None),
    'Main Character': (6, 8, 10, 'Attention Seeker. Likes you give this minion count triple. End of turn: get 2 Likes.'),
    'Ring Light Studio': (5, 4, 8, 'End of turn: get 3 Likes for each other Influencer you have.'),
    # v8 pass 3
    'Main Character': (6, 8, 10, 'Attention Seeker. Likes you give this minion count triple. Clock In: get 2 Likes.'),
    'Brand Ambassador': (5, 5, 6, 'Start of combat: summon a Follower, then give your Followers +1/+1 for each Influencer you have.'),
    'Protest Camp': (3, 2, 5, 'Attention Seeker. End of turn: give your other Feral Attention Seekers +3/+3.'),
    'Human Chain': (5, 5, 8, None),
    'World Record': (6, 6, 7, 'Start of combat: give your left-most other Techie Toxic.'),
    'Crypto Bro': (3, 4, 5, 'Sells for 1 more gold for each turn on your board (max 7). Crashes to 0 after 6 turns.'),
    'Rage Quitter': (2, 4, 3, 'Legacy: deal 5 damage to the minion that killed it.'),
    'Consultant': (5, 6, 7, 'Your "every 4 gold you spend" effects trigger every 3 gold instead.'),
    'Thought Leader': (4, 4, 5, 'Every 4 gold you spend: give your other Hustlers +1/+1.'),
    'Enlightened Guru': (6, 3, 9, 'Attention Seeker. The first two times each of your other Attention Seekers takes damage each combat, it takes at most 3.'),
    # player review, Nov 3
    'Middle Manager': (2, 3, 4, 'Attention Seeker. End of turn: take +1/+1 from the minion to its left. If that kills it, gain 2 extra gold next turn.'),
    'Brand Ambassador': (5, 5, 6, 'Start of combat: for this combat, your Followers have +1/+1 for each Influencer you have, including Followers summoned later. Legacy: summon two Followers.'),
    'Ring Light Studio': (5, 4, 8, 'End of turn: get 2 Likes. Likes you give count double while this is on your board.'),
    'City Pigeon': (1, 1, 3, None), 'Windowsill Succulent': (1, 2, 2, 'End of turn: if you have another Feral, gain +1/+1.'),
    'World Tree': (6, 5, 9, 'End of turn: give your other Ferals +2/+2.'),
    'Merch Stand': (2, 2, 3, 'After you play a Creative, gain 1 extra gold next turn (twice per turn).'),
    'Method Actor': (2, 4, 1, None), 'Zine Maker': (1, 2, 1, 'When sold: give the minion to its right +4/+4.'),
}
STYLE_V8 = {'Corporate Raider': 'EX'}
for _c in ALL:
    if _c.name in STYLE_V8: _c.style = STYLE_V8[_c.name]
for _c in ALL:
    if _c.name in V6:
        _c.tier, _c.atk, _c.hp, _t = V6[_c.name]
        if _t: _c.text = _t
# ======================================================================== v9 Feral rework (Nov 3)
# Tree Huggers (Attention Seekers, the Stoics' identity) becomes Scavengers: urban animals that rummage through the bins
# (Scroll triggers, a trigger no other tribe uses) and keep coming back (Rebrand). Overgrowth keeps the plants and plant people.
# Retired: Protest Camp, Human Chain, Old-Growth Blockade (activist Attention Seekers) and Monstera (its Scroll trigger moved
# to the animals). The Pigeon token goes with City Pigeon's Legacy.
STYLES.pop('TH', None); STYLES['SV'] = (F, 'Scavengers')
_RETIRED = {'Protest Camp', 'Human Chain', 'Old-Growth Blockade', 'Monstera'}
FERALS[:] = [c for c in FERALS if c.name not in _RETIRED]
FERALS += [
    Card('Seagull', F, 2, 3, 3, 'SV', 'After you Scroll, give another Feral +1/+1 (twice per turn).', 'Took your chips. Then the bag.'),
    Card('Wild Boar', F, 4, 4, 5, 'SV', 'Start of combat: give the Ferals next to it Rebrand.', 'Knows which day is bin day.'),
    Card('Rat King', F, 5, 4, 7, 'SV', 'After a friendly Feral comes back, give your other Ferals +2/+2.', 'Rules the tunnels. Nobody voted.'),
    Card('Nature Is Healing', F, 6, 5, 9, 'SV', 'After you Scroll, give your other Ferals +2/+2 (twice per turn).', 'Swans in the canal. Foxes on the council.'),
]
_V9 = {  # name: (tier, atk, hp, style, text, taunt, shield, rebrand, kind)
    'City Pigeon': (1, 1, 3, 'SV', 'After you Scroll, gain +1/+1 (twice per turn).', False, False, False, 'eng'),
    'Trash Panda': (1, 2, 1, 'SV', 'Rebrand. When it comes back, give your other Ferals +1/+1.', False, False, True, 'eng'),
    'Urban Fox': (3, 2, 3, 'SV', 'Rebrand. Clock In: give another Feral +2/+2 permanently.', False, False, True, 'eng'),
    'Tree Hugger': (2, 2, 4, 'OG', 'Start of combat: give the Ferals next to it +2/+2.', False, False, False, 'eng'),
    'Guerrilla Gardener': (4, 3, 5, 'OG', None, False, False, False, 'eng'),
    'Compost Heap': (2, 1, 3, 'OG', None, False, False, False, 'eng'),
}
for _c in FERALS:
    if _c.name in _V9:
        _c.tier, _c.atk, _c.hp, _c.style, _t, _c.taunt, _c.shield, _c.rebrand, _c.kind = _V9[_c.name]
        if _t: _c.text = _t
# v9 late-game engines (Nov 3): the weakest late capstones get a way to grow, so every tribe can build a big late board
_V9B = {'Blue Checkmark': 'After a friendly Follower dies, give your Influencers +2/+2 permanently.',
        'World Record': 'Start of combat: give your left-most other Techie Toxic. After a friendly Techie kills a minion, give your Techies +1/+1 permanently.',
        'Bestselling Author': 'End of turn: give the Philosophers next to it +1/+1 for the next combat, then make all next-combat buffs on your minions permanent.'}
for _c in [c for t in TRIBES for c in BY_TRIBE[t]]:
    if _c.name in _V9B: _c.text = _V9B[_c.name]
# v11 player balance (Nov 6): Likes were too strong (Main Character boards of 5,000+ stats), so the Like cards move up a tier and
# Main Character doubles instead of triples. Punk, Feral and Philosopher capstones get stronger.
_V11 = {  # name: (tier, atk, hp, text or None, style or None)
    'Engagement Bot': (1, 2, 2, 'First Impression: get 1 Like.', 'MC'),
    'Hype Man': (2, 2, 4, None, None),
    'Stan Account': (3, 3, 4, None, None),
    'Personal Brand': (4, 4, 6, None, None),
    'Ring Light Studio': (5, None, None, 'First Impression: get 2 Likes. Likes you give count double while this is on your board.', None),
    'Main Character': (6, None, None, 'Attention Seeker. Likes you give this minion count double. Clock In: get 2 Likes.', None),
    'Greatest Hits': (6, None, None, 'After you sell a Punk, give your Punks +1/+1. The first 3 Punks you sell each turn also go back into the Feed.', None),
    'General Strike': (6, None, None, 'Start of combat: deal 2 damage to all enemy minions for each Punk you have. Then give your Punks +2/+2 permanently for each enemy minion that died.', None),
    'World Tree': (6, None, None, 'End of turn: give your other Ferals +4/+4.', None),
    'Grand Unified Theory': (6, None, None, 'End of turn: give your Philosophers +4/+4 for the next combat, then double all next-combat buffs.', None),
}
for _c in [c for t in TRIBES for c in BY_TRIBE[t]]:
    if _c.name in _V11:
        _t, _a, _h, _x, _st = _V11[_c.name]
        _c.tier = _t
        if _a is not None: _c.atk, _c.hp = _a, _h
        if _x: _c.text = _x
        if _st: _c.style = _st
        if _c.name == 'Engagement Bot': _c.kind = 'fi'
_V12 = {  # name: (tier, atk, hp, text or None)  (Neutral texts live in lsdata.NEIGHBOUR_TEXT)
    'Personal Brand': (3, 4, 6, None),
    'Main Character': (6, 10, 12, 'Attention Seeker. Likes you give this minion count double. Clock In: get 3 Likes.'),
    'General Strike': (6, None, None, 'Start of combat: deal 1 damage to all enemy minions for each Punk you have. Then give your Punks +2/+2 permanently for each enemy minion that died.'),
    'Art Critic': (4, None, None, 'After a friendly minion dies, gain +1/+1 permanently.'),
    'Record Label': (4, None, None, 'End of turn: give another Creative +1/+1 for each Creative you have played since this joined your board.'),
    'Rat King': (5, None, None, 'After you Scroll, gain the stats of the highest-Attack minion you scrolled away (twice per turn).'),
    'Quantum Computer': (6, None, None, 'Collab. Out of Office. Rebrand. End of turn: the minion it sticks to gains +2/+2 for each Collab on it.'),
    'Thought Experiment': (3, 3, 3, 'End of turn: give your minions +1/+1 for the next combat for each tribe you have.'),
    'Grand Unified Theory': (6, None, None, 'End of turn: give your minions +1/+1 for the next combat for each tribe you have, then double all next-combat buffs. With 4 or more tribes, triple them instead.'),
    'Package Hoarder': (2, 2, 5, None), 'Caretaker': (3, 2, 5, None), 'The Landlord': (5, 5, 5, None),
}
for _c in [c for t in TRIBES for c in BY_TRIBE[t]] + NEIGHBOURS:
    if _c.name in _V12:
        _t, _a, _h, _x = _V12[_c.name]
        _c.tier = _t
        if _a is not None: _c.atk, _c.hp = _a, _h
        if _x: _c.text = _x
_V13 = {  # name: text  (Neutral texts live in lsdata.NEIGHBOUR_TEXT)
    'World Tour': 'Your "after you play a Creative" effects trigger twice.',
    'Dead Rock Star': 'Rebrand. Legacy: give your other Creatives +4/+4 permanently.',
    'Art Critic': 'After a friendly minion dies, gain +1/+1 permanently and give another Creative +1/+1 permanently.',
    'Nature Is Healing': 'After you Scroll, give your other Ferals +2/+2 (four times per turn).',
    'Rooftop Beehive': 'End of turn: give the Ferals next to it +2/+2 and Rebrand.',
    'Consultant': 'Every 3 gold you spend: give your other Hustlers +1/+1. Your "every 4 gold you spend" effects trigger every 3 gold instead.',
    'Too Big to Fail': 'Attention Seeker. The first time it would die each combat, it survives with 1 Health and your other Hustlers get +4/+4 permanently.',
    'The Cynic': 'Attention Seeker. After this takes damage, give your other Philosophers +1/+1 permanently.',
    'Utilitarian': 'End of turn: give your three lowest-Attack other Philosophers +2/+1 permanently.',
    'Mosh Pit': 'Cleave: its attacks also hit the minions next to its target. After this kills a minion, give your Punks +1/+1 permanently.',
    'Noise-Cancelling Headphones': 'Collab. Out of Office. When the minion it sticks to loses Out of Office, give your Techies +2 Attack permanently.',
}
for _c in [c for t in TRIBES for c in BY_TRIBE[t]] + NEIGHBOURS:
    if _c.name in _V13: _c.text = _V13[_c.name]
    if _c.name == 'Dead Rock Star': _c.rebrand = True
    if _c.name == 'Helpful Neighbour': _c.kind = 'fi'
    if _c.name == 'Pro Gamer': _c.text = 'Attacks twice. After this attacks, gain +3/+2 permanently.'
ALL[:] = [c for t in TRIBES for c in BY_TRIBE[t]] + NEIGHBOURS
TOKENS = [Card('Follower', I, 1, 1, 1, '-', 'A loyal fan.', 'Liked. Shared. Forgot.', kind='stat')]


# Legendary cards (Nov 8): unlocked at 1000 rating, chosen into the Feed pool on the Collection screen; one per tribe.
def _leg(name, tribe, tier, atk, hp, text, flavour, tribe2=None, **kw):
    c = Card(name, tribe, tier, atk, hp, 'LG', text, flavour, **kw); c.legendary = True; c.tribe2 = tribe2; return c
LEGENDS = [
    _leg('The Billionaire', H, 5, 6, 8, 'End of turn: give your other Hustlers +1/+1 for each gold you have left (max 10).', 'Self-made. With some help from Dad.'),
    _leg('Cancelled Celebrity', I, 4, 5, 5, 'Rebrand. When it comes back, summon three Followers.', 'Taking a break. Back next week.', rebrand=True),
    _leg('Apex Scavenger', F, 5, 4, 7, 'End of turn: give your other Ferals +X/+X, where X is half the Attack of the strongest minion in the Feed.', 'Eats first. Eats last.'),
    _leg('Pop Diva', C, 5, 5, 7, 'Start of combat: give your Creatives +1/+1 for each Creative you have played this game.', 'One name. Twelve outfits.'),
    _leg('The Algorithm', T, 5, 5, 7, 'End of turn: give each of your minions +1/+1 for each Collab on it.', 'Recommended for you.'),
    _leg('Mohawk Legend', P, 5, 6, 6, "Your Punks' start-of-combat effects trigger twice.", 'Was here before it was cool.'),
    _leg('Renaissance Thinker', PH, 4, 4, 6, 'End of turn: for each tribe you have, give a random minion of that tribe +2/+2.', 'Painter, inventor, opinions.'),
    _leg('Tech Founder', H, 4, 5, 6, 'Every 3 gold you spend: give your Hustlers and Techies +1/+1.', 'Disrupting breakfast.', tribe2=T),
    _leg('Content Creator', I, 4, 4, 6, 'After you play a Creative or an Influencer, get 2 Likes.', 'Link in bio.', tribe2=C),
    _leg('Wise Old Owl', F, 5, 4, 8, 'End of turn: give your Ferals and Philosophers +1/+1 for each tribe you have.', 'Who? Exactly.', tribe2=PH),
    _leg('Punk Philosopher', P, 5, 6, 6, 'When sold, and when it dies: give your Punks and Philosophers +3/+3 permanently.', 'Lives in a barrel. Plays in a band.', tribe2=PH),
]
for _c in [c for t in TRIBES for c in BY_TRIBE[t]]:
    if _c.name == 'Zine Maker': _c.text = 'When sold: give the minion to its right +3/+3.'
    if _c.name == 'Speedrunner': _c.text = 'After this kills a minion, gain +1/+1 permanently.'


# Rewards track (Nov 10): cards unlocked by levelling up the rewards track (docs/card-plan-v14.md). c.track = the level that
# unlocks it; they stay out of the default Feed pool until the player unlocks them and adds them on the Collection screen.
def _tr(lv, *a, **kw):
    c = Card(*a, **kw); c.track = lv; return c
TRACK = [
    _tr(1, 'Performance Review', H, 2, 3, 2, 'EX', 'End of turn: take +1/+1 from the minion to its right and give your other Hustlers +1/+1.', 'Meets expectations. Barely. Always.'),
    _tr(1, 'Loyalty Card', H, 3, 2, 5, 'PI', 'Every 4 gold you spend: give the minion to its left +3/+3.', 'Nine stamps. The tenth coffee is "out of stock".'),
    _tr(2, 'Thirst Trap', I, 2, 2, 2, 'MC', 'Start of combat: give two other friendly minions "Legacy: get 1 Like."', 'Hydrating. For the content.'),
    _tr(2, 'Bot Farm', I, 3, 2, 5, 'FO', 'End of turn: if you have space, summon two 1/1 Followers (3 times per game).', 'Ten thousand fans. One power strip.'),
    _tr(3, 'Magpie', F, 2, 3, 2, 'SV', 'Your first Scroll each turn costs 1 less.', 'Shiny. Shiny. Mine.'),
    _tr(3, 'Allotment', F, 3, 2, 5, 'OG', 'End of turn: give a random other Feral +1/+1 for each Feral you have (max +3).', 'Waiting list: eleven years.'),
    _tr(4, 'Ghostwriter', C, 2, 2, 3, 'PF', 'After a friendly minion dies, give the Creative to its right +1/+1 permanently.', 'Wrote your memoir. Never met you.'),
    _tr(4, 'Encore', C, 3, 4, 3, 'PE', 'When sold: get a copy of the last Creative you played (except Encore).', 'They never really leave.', kind='stat', sellbait=True),
    _tr(5, 'Bluetooth Speaker', T, 2, 2, 2, 'GA', 'Collab. Clock In: deal 1 damage to all enemy minions. This damage is never Toxic.', 'Paired with the wrong phone. Again.', collab=True),
    _tr(5, 'Clutch Player', T, 3, 4, 4, 'GM', 'Out of Office. While this is your last minion alive, it has Toxic and attacks twice.', '1v5. Still blames the lag.', shield=True),
    _tr(6, 'Gig Poster', P, 2, 3, 2, 'SO', 'When sold: next turn, the first Punk you hire costs 1 less.', 'Stapled over last week\'s gig poster.', kind='stat', sellbait=True),
    _tr(6, 'Banner Drop', P, 3, 3, 5, 'SA', 'Start of combat: deal 4 damage to each enemy Attention Seeker.', 'Hung it from the bridge. Spelled it wrong.'),
    _tr(7, 'Breathwork Coach', PH, 2, 1, 4, 'ST', 'Attention Seeker. After a friendly Attention Seeker survives damage, give it +1 Attack permanently.', 'In for four. Invoice for eight.', taunt=True),
    _tr(7, 'Debate Club', PH, 3, 2, 4, 'BI', 'End of turn: give the minions next to it +3/+3 for the next combat, or +4/+4 if they are from different tribes.', 'Both sides. Loudly.'),
]
for _c in TRACK: BY_TRIBE[_c.tribe].append(_c)
ALL[:] = [c for t in TRIBES for c in BY_TRIBE[t]] + NEIGHBOURS
