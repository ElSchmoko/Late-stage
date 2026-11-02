"""Modern Life playtest simulator, v2: full 8-player lobbies.
Shop: Battlegrounds economy (3 gold on turn 1, +1 a turn, max 10; minions cost 3, sell for 1; scroll 1;
level-up costs 5/7/8/9/10, minus 1 for each turn waited). Bots follow a fixed level curve and hire by style score.
Combat: Battlegrounds rules (attack left to right, random targets, Attention Seekers first, shields, Toxic,
Legacy, Rebrand). Combat effects marked "permanently" write back to the shop board.
Lobby: 5 of 7 tribes + Neighbours in the pool, 8 bots, 30 Sanity, random pairings, ghosts for odd counts.
Triples: 3 copies merge into a golden minion (double base stats) and Discover a minion one tier up.
No hero powers, so every style plays under the same rules."""
import random, copy, itertools
from cards import ALL, BY_TRIBE, COPIES, STYLES, TRIBES, NEIGHBOURS, H, I, F, C, T, P, PH, N

FEED_SIZE = {1: 3, 2: 4, 3: 4, 4: 5, 5: 5, 6: 6}
LEVEL_COST = {2: 5, 3: 7, 4: 8, 5: 9, 6: 10}
CURVE = {1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 6}

P_ = {'amb_counter': 4, 'vv': 3, 'mc': 4, 'ring': (3, 3), 'grind': (1, 1)}   # tuned in v1
_uid = itertools.count()
LEADER = [2, 1]
TEST_MULT = [1]
AURAS = {}   # tribe-wide leader auras were removed by design

RIGHT_GIVERS = {'Shower Thinker', 'Zine Maker', 'Marathon Monk'}
LEFT_GIVERS = {'Pub Philosopher', 'E-Sports Coach'}
NB_GIVERS = {'Rooftop Beehive', 'Thought Experiment', 'Bestselling Author', 'Tree Hugger', 'Human Chain',
             'Desert Hermit', 'Squat Collective', 'Package Hoarder', 'Open Mic Poet', 'Thought Leader', 'Caretaker',
             'Nihilist', 'World Record'}


class M:
    def __init__(self, card, follower=False):
        self.c = card
        self.follower = follower
        if follower:
            self.name, self.tribe, self.style, self.tier = 'Follower', I, 'FO', 1
            self.atk, self.hp = 1, 1
            self.taunt = self.shield = self.toxic = self.rebrand = self.twice = False
        else:
            self.name, self.tribe, self.style, self.tier = card.name, card.tribe, card.style, card.tier
            self.atk, self.hp = card.atk, card.hp
            self.taunt, self.shield, self.toxic, self.rebrand, self.twice = card.taunt, card.shield, card.toxic, card.rebrand, card.twice
        self.extras = []          # names of Collabs merged into this minion
        self.sell_bonus = 0
        self.turns_on_board = 0
        self.ta = self.th = 0     # "for the next combat" buffs
        self.id = next(_uid)
        self.orig = None
        self.fb = 0
        self.golden = False

    def is_(self, name):
        return self.name == name or name in self.extras

    def n(self, name):
        return (self.name == name) + self.extras.count(name)

    def stats(self):
        return self.atk + self.hp

    def combat_stats(self):
        return self.atk + self.hp + self.ta + self.th


def is_tribe(o, t):
    return o.tribe == t or getattr(o, 'tribe2', None) == t


def neighbours(board, m):
    i = board.index(m)
    return [board[j] for j in (i - 1, i + 1) if 0 <= j < len(board)]


def left_of(board, m):
    i = board.index(m)
    return board[i - 1] if i > 0 else None


def right_of(board, m):
    i = board.index(m)
    return board[i + 1] if i + 1 < len(board) else None


# ======================================================================== shop phase
class Player:
    NEUTRAL_GOOD = {'Caretaker': 2, 'The Landlord': 2, 'Block Party Host': 4, 'Package Hoarder': 1, 'Wi-Fi Leech': 1,
                    'Leaf Blower Guy': 1}
    SELL_STYLES = ('EX', 'SO')
    K = 1.5
    TAG = 2.5
    SYN = 0.0
    ADAPT = True
    WHOLE_TRIBE = True
    SLOPPY = False
    DIG = 3
    BOUNDARIES = 5
    TRIPLES = True

    def __init__(self, style, rng, pool):
        self.style_code = style
        self.tribe = STYLES[style][0] if style in STYLES else None
        self.style = style if style in STYLES else None
        self.rng, self.pool = rng, pool
        self.board, self.tier, self.turn = [], 1, 0
        self.bonus_next = 0
        self.turns_at_tier = 0
        self.spent = 0
        self.buffed = set()
        self.fbonus = 0
        self.health = 30 + self.BOUNDARIES
        self.alive = True
        self.merch_used = False
        self.side_used = False
        self.rerelease = []
        self.discounts = {}
        self.in_eot = False
        self.oak = False
        self.sold_hustle = False
        self.squat_used = 0

    # ---- helpers
    def has(self, name):
        return any(m.is_(name) for m in self.board)

    def count(self, name):
        return sum(m.n(name) for m in self.board)

    def buff(self, m, a, h):
        if self.in_eot and m.tribe == F and self.oak:
            a *= 2; h *= 2
        if TEST_MULT[0] != 1 and self.tribe is not None and m.tribe == self.tribe:
            a = round(a * TEST_MULT[0]); h = round(h * TEST_MULT[0])
        m.atk += a; m.hp += h
        self.buffed.add(m.id)

    def tbuff(self, m, a, h):
        m.ta += a; m.th += h
        self.buffed.add(m.id)

    # ---- valuation
    def value(self, m):
        v = m.stats() / 2 + (m.ta + m.th) / 4
        if self.tribe is None:
            return v
        if m.follower:
            return v + (1 if self.style == 'FO' else 0)
        c = m.c
        if c.tribe == self.tribe or getattr(m, 'tribe2', None) == self.tribe:
            v += self.TAG * self.commit()
            # synergy-aware: each own-tribe payoff already on board makes tribe members worth more
            engines = sum(1 for o in self.board if o is not m and not o.follower and o.tribe == self.tribe
                          and o.c.kind == 'eng' and o.c.tier >= 3)
            v += self.SYN * engines
            if c.kind == 'eng':
                decay = max(0.25, 1 - 0.25 * max(0, self.tier - c.tier - 1))
                w = self.K if (c.style == self.style or self.WHOLE_TRIBE) else self.K / 3
                v += w * (1 + c.tier) * decay * self.commit()
        if (self.style in self.SELL_STYLES or (self.WHOLE_TRIBE and self.tribe in (H, P))) and c.sellbait:
            v += 1
        v += self.NEUTRAL_GOOD.get(m.name, 0)
        if m.name == 'Wedding DJ' and self.style in ('FO', 'MC', 'PI', 'PE', 'GA') and self.count('Wedding DJ') <= 1:
            v += 4
        if m.name == 'Estate Lawyer' and self.style in ('FO', 'PF') and self.count('Estate Lawyer') <= 1:
            v += 4
        v += 1.5 * len(m.extras)
        return v

    def commit(self):
        """How hard the bot leans into its tribe: tempo first, then commit; play safer when low on Sanity."""
        if not self.ADAPT:
            return 1.0
        c = 0.4 if self.turn <= 3 else 0.7 if self.turn <= 5 else 1.0
        if self.health < 15:
            c *= 0.6
        return c

    def card_score(self, card):
        m = M(card)
        if self.tribe is None:
            return m.stats() / 2 + card.tier * 0.5
        s = self.value(m) + card.tier * 0.5
        if card.tribe == self.tribe:
            decay = max(0.25, 1 - 0.25 * max(0, self.tier - card.tier - 1))
            if card.kind == 'fi' or card.collab:
                w = self.K if (card.style == self.style or self.WHOLE_TRIBE) else self.K / 3
                s += w * (1 + card.tier) * decay
            if card.discover:
                s += 2 * decay
        if card.name == 'Helpful Neighbour':
            s += 2
        if card.collab and self.board:
            s += 1          # takes no slot
        if self.TRIPLES and not card.collab:
            k = sum(1 for x in self.board if x.name == card.name and not x.golden)
            s += 1.5 * k
        return s

    # ---- Followers
    def summon_follower(self, board=None):
        board = self.board if board is None else board
        if len(board) >= 7:
            return None
        f = M(None, follower=True)
        f.atk += self.fbonus; f.hp += self.fbonus
        for x in board:
            f.atk += 5 * x.n('Engagement Farmer')
            f.hp += 5 * x.n('Engagement Farmer')
        board.append(f)
        return f

    # ---- gold spent
    def gain_spend(self, amount):
        before = self.spent
        self.spent += amount
        step = 3 if self.has('Consultant') else 4
        for _ in range(self.spent // step - before // step):
            for m in [m for x in list(self.board) for m in ([x, x] if x.golden else [x])]:
                if m.is_('Thought Leader'):
                    for o in self.board:
                        if o is not m and o.tribe == H:
                            self.buff(o, 2, 2)

    # ---- play
    def carry(self):
        cands = [m for m in self.board if not m.follower] or self.board
        return max(cands, key=lambda m: (m.stats(), self.value(m)))

    def discover(self, tribe, gold):
        cards = [c for c in BY_TRIBE[tribe] if c.tier <= self.tier]
        opts = self.rng.choices(cards, weights=[COPIES[c.tier] for c in cards], k=3)
        best = max(opts, key=self.card_score)
        if len(self.board) < 7 or (best.collab and self.board):
            self.play(best, gold)

    def first_impression(self, m, gold):
        reps = 2 if self.has('Wedding DJ') else 1
        for _ in range(reps):
            n = m.name
            others = [o for o in self.board if o is not m]
            if n == 'Dropshipper':
                self.bonus_next += 1
            elif n == 'Engagement Bot':
                self.summon_follower()
            elif n == 'Personal Brand':
                tgt = max(others or [m], key=lambda o: o.atk)
                self.buff(tgt, 4, 4)
            elif n == 'Helpful Neighbour':
                tgt = max(others or [m], key=self.value)
                self.buff(tgt, 2, 2)
            elif n == 'Venture Capitalist':
                inv = min(gold[0], 4)
                if inv:
                    gold[0] -= inv
                    self.gain_spend(inv)
                    self.buff(max(self.board, key=self.value), 2 * inv, 2 * inv)
            elif n == 'Art Student':
                cr = [o for o in others if o.tribe == C]
                if cr:
                    self.buff(max(cr, key=self.value), 2, 2)
            elif n == 'Record Label':
                for o in others:
                    if o.tribe == C:
                        self.buff(o, 3, 3)
            elif m.c is not None and m.c.discover:
                self.discover(m.c.discover, gold)

    def after_collab(self, tgt):
        for x in [m for y in list(self.board) for m in ([y, y] if y.golden else [y])]:
            k1 = x.n('Firmware Update')
            for o in self.board:
                if is_tribe(o, T) and k1:
                    self.buff(o, 2 * k1, k1)

    def after_play(self, card, played, gold=None):
        """'After you play' triggers. played = the minion that entered (or the Collab host)."""
        for x in [m for y in list(self.board) for m in ([y, y] if y.golden else [y])]:
            if x is played and not card.collab:
                continue
            if x.is_('Grindset Guru') and card.tribe == H and x is not played:
                self.buff(x, 2, 1)
            if x.is_('Side Hustle') and card.tribe == H and x is not played and not self.side_used and gold is not None:
                self.side_used = True; gold[0] += 1
            if x.n('World Tour'):
                for o in self.board:
                    if o.tribe == C:
                        self.buff(o, 2 * x.n('World Tour'), 2 * x.n('World Tour'))
            if card.tribe != C:
                continue
            if x.is_('Busker'):
                self.buff(x, 2, 1)
            if x.is_('Merch Stand') and not self.merch_used:
                self.merch_used = True; self.bonus_next += 1
            if x.is_('Indie Band'):
                self.buff(x, 1, 1); self.buff(played, 3, 3)
            if x.is_('Festival Headliner'):
                for o in self.board:
                    if o.tribe == C and o is not x:
                        self.buff(o, 3, 3)

    def play(self, card, gold):
        if card.collab and self.board:
            own = [x for x in self.board if not x.follower and is_tribe(x, card.tribe)] if self.tribe == card.tribe else []
            tgt = max(own, key=lambda x: x.stats()) if own else self.carry()
            tgt.atk += card.atk; tgt.hp += card.hp
            tgt.shield |= card.shield; tgt.rebrand |= card.rebrand; tgt.toxic |= card.toxic
            if card.tribe == T and tgt.tribe != T:
                tgt.tribe2 = T          # a Collab makes its host a Techie too
            if card.name == 'Gig Worker':
                tgt.sell_bonus += 1
            else:
                tgt.extras.append(card.name)
            self.buffed.add(tgt.id)
            self.after_collab(tgt)
            if self.has('Smart Home Hub'):
                rest = [x for x in self.board if x is not tgt and not x.follower]
                if rest:
                    t2 = max(rest, key=lambda x: (is_tribe(x, T), x.stats()))
                    t2.atk += card.atk; t2.hp += card.hp
                    t2.shield |= card.shield; t2.rebrand |= card.rebrand; t2.toxic |= card.toxic
                    if card.tribe == T and t2.tribe != T:
                        t2.tribe2 = T
                    t2.extras.append(card.name)
                    self.after_collab(t2)
            self.after_play(card, tgt, gold)
            return
        m = M(card)
        self.board.append(m)
        self.first_impression(m, gold)
        if m in self.board:
            self.after_play(card, m, gold)
        self.check_triple(card, gold)

    def check_triple(self, card, gold):
        if not self.TRIPLES:
            return
        same = [x for x in self.board if x.name == card.name and not x.golden and not x.follower]
        if len(same) < 3:
            return
        keep = same[0]
        for x in same[1:3]:
            keep.atk += x.atk - card.atk; keep.hp += x.hp - card.hp   # carry over buffs
            keep.shield |= x.shield; keep.extras += x.extras; keep.sell_bonus += x.sell_bonus
            self.board.remove(x)
        keep.atk += card.atk; keep.hp += card.hp                       # double the base stats
        keep.golden = True
        keep.tier = card.tier
        # reward: Discover a minion from one tier higher (any tribe in the lobby)
        t = min(6, self.tier + 1)
        cards = [c for c in self.pool[6][0] if c.tier == t]
        opts = self.rng.choices(cards, k=3)
        best = max(opts, key=self.card_score)
        if len(self.board) < 7 or (best.collab and self.board):
            self.play(best, gold)

    # ---- sell
    def sell(self, m, gold):
        if m.name == 'Unpaid Intern':
            g = 2
        elif m.name == 'Crypto Bro':
            g = 0 if m.turns_on_board > 4 else min(1 + m.turns_on_board, 5)
        else:
            g = 1
        g += m.sell_bonus
        i = self.board.index(m)
        right = self.board[i + 1] if i + 1 < len(self.board) else None
        self.board.remove(m)
        gold[0] += g
        n = m.name
        if not hasattr(self, 'punks_sold'):
            self.punks_sold = 0
        reps = 2 if self.has('Reunion Tour') and m.tribe == P else 1
        for _ in range(reps):
            self.when_sold(m, right)
        if m.tribe == P and not m.follower:
            self.punks_sold = getattr(self, 'punks_sold', 0) + 1
        if m.tribe == P and not m.follower and self.has('Greatest Hits'):
            self.rerelease.append(m.c)
        self.after_sell(m)

    def when_sold(self, m, right):
        n = m.name
        if n == 'Anarchist Barista':
            self.bonus_next += 1
        elif n == 'Zine Maker' and right is not None:
            self.buff(right, 3, 3)
        elif n == 'Sellout Frontman':
            for o in self.board:
                if o.tribe == P:
                    self.buff(o, 2, 2)
        elif n == 'Energy-Drink Sponsor':
            k = min(6, self.punks_sold)
            for o in self.board:
                if o.tribe == P:
                    self.buff(o, k, k)

    def after_sell(self, sold=None):
        for o in [m for x in list(self.board) for m in ([x, x] if x.golden else [x])]:
            if o.is_('Sneaker Reseller') and not self.sold_hustle:
                self.sold_hustle = True
                for x in self.board:
                    if x.tribe == H:
                        self.buff(x, 3, 3)
            if o.is_('Private Equity') and sold is not None:
                hs = [x for x in self.board if x.tribe == H]
                if hs:
                    self.buff(max(hs, key=lambda x: x.atk), max(1, sold.atk // 2), max(1, sold.hp // 2))

    # ---- positioning: carry in the middle, aimed buffers next to it
    def arrange(self):
        b = self.board
        if len(b) < 3:
            return
        cy = self.carry()
        rest = [m for m in b if m is not cy]
        L = next((m for m in rest if m.name in RIGHT_GIVERS), None) or next((m for m in rest if m.name in NB_GIVERS), None)
        if L is not None:
            rest.remove(L)
        R = next((m for m in rest if m.name in LEFT_GIVERS), None) or next((m for m in rest if m.name in NB_GIVERS), None)
        if R is not None:
            rest.remove(R)
        half = len(rest) // 2
        new = rest[:half] + ([L] if L else []) + [cy] + ([R] if R else []) + rest[half:]
        b[:] = new

    # ---- end of turn
    def end_of_turn(self):
        b = self.board
        self.in_eot = True
        self.oak = self.has('Ancient Oak')
        order = [m for x in list(b) for m in ([x, x] if x.golden else [x])]
        for m in order:
            if m not in b:
                continue
            n = m.name
            if n == 'Middle Manager':
                victims = [o for o in b if o is not m]
                if victims:
                    v = min(victims, key=self.value)
                    v.atk -= min(1, v.atk); v.hp -= 1
                    self.buff(m, 1, 1)
                    if v.hp <= 0:
                        b.remove(v); self.bonus_next += 1; self.on_shop_death(v)
            elif n == 'Stan Account':
                self.buff(max(b, key=lambda o: o.atk), 2, 1)
            elif n == 'Hype Man':
                k = sum(1 for o in b if o.tribe == I)
                self.buff(max(b, key=lambda o: o.atk), k, k)
            elif n == 'Ring Light Studio':
                k = 2 * sum(1 for o in b if o.tribe == I and o is not m)
                self.buff(max(b, key=lambda o: o.atk), k, k)
            elif n == 'Giveaway Host':
                k = 2
                self.fbonus += k
                for o in b:
                    if o.follower:
                        self.buff(o, k, k)
            elif n == 'Caretaker':
                for o in neighbours(b, m):
                    self.buff(o, 0, 2)
            elif n == 'The Landlord':
                for o in neighbours(b, m):
                    o.atk = max(0, o.atk - 1); o.hp -= 1; m.atk += 1; m.hp += 1
                    if o.hp <= 0:
                        b.remove(o); self.on_shop_death(o)
            elif n == 'Block Party Host':
                for o in neighbours(b, m):
                    self.buff(o, 2, 2)
            elif n == 'Unicorn Startup':
                g = self.spent_this_turn // 2
                if g:
                    for o in b:
                        if o is not m and o.tribe == H:
                            self.buff(o, g, g)
            elif n == 'Protest Camp':
                for o in b:
                    if o is not m and o.taunt and o.tribe == F:
                        self.buff(o, 3, 3)
            # Ferals
            elif n == 'Windowsill Succulent':
                if m.turns_on_board > 0 and m.turns_on_board % 2 == 0:
                    self.buff(m, 2, 2)
            elif n == 'Monstera':
                self.buff(m, 2, 1)
            elif n == 'Plant Parent':
                for o in b:
                    if o is not m and o.tribe == F:
                        self.buff(o, 2, 2)
            elif n == 'Rooftop Beehive':
                for o in neighbours(b, m):
                    self.buff(o, 1, 1)
            elif n == 'World Tree':
                k = min(3, m.turns_on_board)
                if k:
                    for o in b:
                        if o is not m and o.tribe == F:
                            self.buff(o, k, k)
            # Philosophers: next-combat buffs
            elif n == 'Shower Thinker':
                o = right_of(b, m)
                if o:
                    self.tbuff(o, 2, 2)
            elif n == 'Pub Philosopher':
                o = left_of(b, m)
                if o:
                    self.tbuff(o, 3, 1)
            elif n == 'Thought Experiment':
                for o in neighbours(b, m):
                    self.tbuff(o, 3, 3)
            elif n == 'Utilitarian':
                for o in sorted([o for o in b if o is not m and o.tribe == PH], key=lambda o: o.atk)[:3]:
                    self.buff(o, 3, 3)
            elif n == 'Compost Heap':
                fs = [o for o in b if o is not m and o.tribe == F]
                if fs:
                    self.buff(max(fs, key=lambda o: (o.turns_on_board, o.stats())), 2, 2)
            elif n == 'Leaderboard':
                k = min(3, self.kills_last)
                if k:
                    for o in b:
                        if o is not m and is_tribe(o, T):
                            self.buff(o, k, k)
            # Collab growth
            if m.n('Smart Fridge'):
                k = m.n('Smart Fridge')
                for o in b:
                    if is_tribe(o, T):
                        self.buff(o, k, k)
        self.in_eot = False
        for m in b:
            if m.is_('Grand Unified Theory'):
                for o in b:
                    o.ta *= 2; o.th *= 2
        for m in b:
            if m.name == 'Bestselling Author':
                for o in b:
                    if o.tribe == PH:
                        o.atk += o.ta; o.hp += o.th; o.ta = o.th = 0
        for m in b:
            m.fb = self.fbonus
        for m in b:
            if m.name == 'Main Character':
                cnt = len([x for x in self.buffed if x != m.id]) * P_['mc']
                m.atk += cnt; m.hp += cnt

    def on_shop_death(self, v):
        reps = 2 if self.has('Estate Lawyer') else 1
        for _ in range(reps):
            if v.name == 'Reply Guy':
                self.summon_follower()
            elif v.name in ('Comment Section', 'Unboxing Streamer'):
                self.summon_follower(); self.summon_follower()
            elif v.name == 'Golden Parachute Exec':
                self.bonus_next += 2

    def draw_feed(self):
        cards, weights = self.pool[self.tier]
        return self.rng.choices(cards, weights=weights, k=FEED_SIZE[self.tier])

    def take_turn(self):
        self.turn += 1
        self.kills_last = getattr(self, 'techie_kills', 0)
        self.techie_kills = 0
        self.buffed = set()
        self.merch_used = False
        self.side_used = False
        self.rerelease = []
        self.discounts = {}
        self.in_eot = False
        self.oak = False
        self.sold_hustle = False
        self.squat_used = 0
        for m in self.board:
            m.turns_on_board += 1
            m.resold = False
            m.ta = m.th = 0
        gold = [min(2 + self.turn, 10) + self.bonus_next]
        self.bonus_next = 0
        spent_start = self.spent

        for m in list(self.board):
            if m.name == 'Crypto Bro' and m.turns_on_board >= 4:
                self.sell(m, gold)
        # sell styles cash in sell-bait that has already fought once
        if self.style in self.SELL_STYLES or (self.WHOLE_TRIBE and self.tribe in (H, P)):
            for m in list(self.board):
                if m.c is not None and m.c.sellbait and m.turns_on_board >= 1 and len(self.board) > 4:
                    self.sell(m, gold)

        target = CURVE.get(self.turn, 6)
        if self.tier < target and self.tier < 6:
            cost = max(0, LEVEL_COST[self.tier + 1] - self.turns_at_tier)
            if gold[0] >= cost:
                gold[0] -= cost; self.gain_spend(cost)
                self.tier += 1; self.turns_at_tier = 0
            else:
                self.turns_at_tier += 1
        else:
            self.turns_at_tier += 1

        feed = self.draw_feed()
        scrolls = 0
        digs = 0
        while gold[0] >= 2:
            if self.rerelease:
                for c in self.rerelease:
                    feed.append(c); self.discounts[c.name] = self.discounts.get(c.name, 0) + 1
                self.rerelease = []
            cost_of = lambda c: 2 if self.discounts.get(c.name, 0) > 0 else 3
            afford = [c for c in feed if cost_of(c) <= gold[0]]
            if not afford and gold[0] < 3:
                break
            best = max(afford, key=self.card_score) if afford else None
            if self.SLOPPY and feed and self.rng.random() < 0.25:
                best = self.rng.choice(feed)
            worst = min(self.board, key=self.value) if self.board else None
            # dig for the tribe: roll instead of settling for an off-tribe card
            if (best is not None and self.tribe is not None and self.DIG and self.turn >= 3 and best.tribe != self.tribe
                    and gold[0] >= 4 and digs < self.DIG and not any(c.tribe == self.tribe for c in feed)):
                gold[0] -= 1; self.gain_spend(1); digs += 1
                feed = self.draw_feed()
                continue
            if best is not None:
                bs = self.card_score(best)
                free_slot = len(self.board) < 7 or (best.collab and self.board)
                if free_slot or bs > self.value(worst) + 1.5:
                    if not free_slot:
                        self.sell(worst, gold)
                    cst = cost_of(best)
                    if self.discounts.get(best.name, 0) > 0:
                        self.discounts[best.name] -= 1
                    gold[0] -= cst; self.gain_spend(cst)
                    feed.remove(best)
                    self.play(best, gold)
                    continue
            if gold[0] >= 4 and scrolls < 4:
                gold[0] -= 1; self.gain_spend(1); scrolls += 1
                feed = self.draw_feed()
                continue
            break
        self.spent_this_turn = self.spent - spent_start
        self.arrange()
        self.end_of_turn()


# ======================================================================== combat
def perm(m, a, h):
    m.atk += a; m.hp += h
    if m.orig is not None:
        m.orig.atk += a; m.orig.hp += h


def hit(t, n, src=None):
    """Deal n damage to t. Returns damage dealt (0 if blocked)."""
    if n <= 0 or t.hp <= 0:
        return 0
    if t.shield:
        t.shield = False
        return 0
    if getattr(t, 'cap3', False) and n > 3:
        n = 3
    if src is not None and src.toxic:
        t.hp = min(t.hp - n, 0)
        src.toxic = False
    else:
        t.hp -= n
    t.hits = getattr(t, 'hits', 0) + 1
    return n


class Side:
    def __init__(self, player, board):
        self.p, self.b = player, board
        self.vv = 0


def combat_copy(m):
    c = copy.copy(m)
    c.extras = list(m.extras)
    c.orig = m if not m.follower else None
    c.atk += m.ta; c.hp += m.th
    c.hits = 0
    c.surv_used = False
    c.kill_used = False
    return c


def combat_follower(side, idx):
    board = side.b
    if len(board) >= 7:
        return
    f = M(None, follower=True)
    fb = max([x.fb for x in board] or [0])
    f.atk += fb; f.hp += fb; f.fb = fb
    for x in board:
        f.atk += 5 * x.n('Engagement Farmer')
        f.hp += 5 * x.n('Engagement Farmer')
    f.hits = 0; f.surv_used = False; f.kill_used = False
    board.insert(min(idx, len(board)), f)


def start_of_combat(me, them):
    b, e = me.b, them.b
    for m in list(b):
        tr = AURAS.get(m.name)
        if tr:
            g = 2 if m.golden else 1
            for o in b:
                if o is not m and is_tribe(o, tr):
                    o.atk += LEADER[0] * g; o.hp += LEADER[1] * g
    punks = sum(m.tribe == P for m in b)
    taunts = sum(m.taunt for m in b)
    amp = sum(2 * m.n('Crust Punk') * (2 if m.golden else 1) for m in b)
    for m in list(b):
        if m.name == 'Brand Ambassador':
            for _ in range(min(4, 7 - len(b))):
                combat_follower(me, len(b))
    if any(m.is_('Blue Checkmark') for m in b):
        for o in b:
            if o.follower:
                o.twice = True
    if any(m.is_('Enlightened Guru') for m in b):
        for o in b:
            if o.taunt and not o.is_('Enlightened Guru'):
                o.cap3 = True
    for m in list(b):
        n = m.name
        if m.n('Robot Vacuum') and e:
            for _ in range(m.n('Robot Vacuum')):
                live = [x for x in e if x.hp > 0]
                if live:
                    hit(min(live, key=lambda x: x.hp), 1)
        if n == 'Corporate Raider' and e:
            hit(min(e, key=lambda x: x.hp), 5)
        elif n == 'Paparazzi' and b:
            max(b, key=lambda x: x.atk).shield = True
        elif n == 'Quiet-Hours Enforcer' and e:
            e[0].atk = max(0, e[0].atk - 2)
        elif n == 'Wi-Fi Leech':
            k = len(neighbours(b, m)); m.atk += k; m.hp += k
        elif n == 'Leaf Blower Guy':
            for x in b + e:
                if x is not m:
                    hit(x, 1)
        elif n == 'Tree Hugger':
            for o in neighbours(b, m):
                o.atk += 1; o.hp += 2
        elif n == 'Guerrilla Gardener':
            min(b, key=lambda x: x.hp).shield = True
        elif n == 'Human Chain':
            for o in neighbours(b, m):
                o.shield = True
        elif n == 'Old-Growth Blockade':
            for o in b:
                if o is not m:
                    o.atk += taunts; o.hp += 2 * taunts
        elif n == 'E-Sports Coach':
            o = left_of(b, m)
            if o:
                o.toxic = True
        elif n == 'World Record':
            for o in b:
                if o is not m and is_tribe(o, T):
                    o.toxic = True
        elif n == 'Graffiti Kid' and e:
            hit(e[0], punks + amp)
        elif n == 'Heckler' and e:
            hit(max(e, key=lambda x: x.atk), 3 + amp)
        elif n == 'Feedback Loop':
            for x in e:
                hit(x, 1 + amp)
            if any(x.hp <= 0 for x in e):
                for o in b:
                    if o.tribe == P:
                        perm(o, 3, 2)
        elif n == 'Mosh Pit' and e:
            t = max(e, key=lambda x: x.atk); t.shield = False; hit(t, m.atk + amp)
            if t.hp <= 0:
                perm(m, max(0, t.atk), 0)
        elif n == 'Stage Diver' and e:
            hit(e[0], m.atk + amp)
            perm(m, 2, 0)
        elif n == 'General Strike':
            alive = [x for x in e if x.hp > 0]
            for x in e:
                hit(x, punks + amp)
            k = sum(1 for x in alive if x.hp <= 0)
            if k:
                for o in b:
                    if o.tribe == P:
                        perm(o, k, k)
    me.vv = P_['vv'] * sum(m.n('Viral Video') for m in b)


def after_damage(side):
    """Cynic and 'survives damage' triggers for minions hit since the last check."""
    b = side.b
    for m in list(b):
        h = getattr(m, 'hits', 0)
        if not h:
            continue
        m.hits = 0
        if m.is_('The Cynic'):
            for o in b:
                if o is not m and o.tribe == PH:
                    o.atk += h * m.n('The Cynic')
        if m.hp > 0 and not m.surv_used:
            n = m.name
            if n in ('Stoicism Podcaster', 'Cold-Plunge Stoic', 'Marathon Monk', 'Desert Hermit'):
                m.surv_used = True
                if n == 'Stoicism Podcaster':
                    perm(m, 0, 1)
                elif n == 'Cold-Plunge Stoic':
                    perm(m, 1, 1)
                elif n == 'Marathon Monk':
                    o = right_of(b, m)
                    if o:
                        perm(o, 2, 2)
                elif n == 'Desert Hermit':
                    for o in b:
                        if o is not m and o.tribe == PH:
                            perm(o, 3, 3)


def on_kill(side, killer):
    if killer not in side.b:
        return
    if killer.is_('Speedrunner') and getattr(killer, 'speed_used', 0) < 2:
        killer.speed_used = getattr(killer, 'speed_used', 0) + 1
        perm(killer, 2, 1)
    if killer.is_('Pro Gamer') and not killer.kill_used:
        killer.kill_used = True
        perm(killer, 4, 4)
    if is_tribe(killer, T) and side.p is not None:
        side.p.techie_kills = getattr(side.p, 'techie_kills', 0) + 1


def combat_when_sold(side, m, idx):
    board = side.b
    n = m.name
    if n == 'Anarchist Barista' and side.p is not None:
        side.p.bonus_next += 1
    elif n == 'Zine Maker' and idx < len(board):
        board[idx].atk += 3; board[idx].hp += 3
    elif n == 'Sellout Frontman':
        for o in board:
            if o.tribe == P:
                o.atk += 2; o.hp += 2
    elif n == 'Energy-Drink Sponsor':
        k = min(6, getattr(side.p, 'punks_sold', 0)) if side.p is not None else 0
        for o in board:
            if o.tribe == P:
                o.atk += k; o.hp += k


def resolve_deaths(side, enemy, pointer):
    board = side.b
    changed = True
    while changed:
        changed = False
        for m in list(board):
            if m.hp > 0:
                continue
            if m.name == 'Too Big to Fail' and not getattr(m, 'tbf_used', False):
                m.tbf_used = True; m.hp = 1
                for o in board:
                    if o is not m and o.tribe == H:
                        o.atk += 3; o.hp += 3
                changed = True
                continue
            idx = board.index(m)
            nbs = neighbours(board, m)
            board.remove(m)
            if idx < pointer:
                pointer -= 1
            if m.tribe == P and any(x.is_('Squat Collective') for x in board):
                sold_reps = 2 if any(x.is_('Reunion Tour') for x in board) else 1
                for _ in range(sold_reps):
                    combat_when_sold(side, m, idx)
            reps = 2 if any(x.is_('Estate Lawyer') for x in board) else 1
            for _ in range(reps):
                n = m.name
                if n == 'Reply Guy':
                    combat_follower(side, idx)
                elif n in ('Comment Section', 'Unboxing Streamer'):
                    combat_follower(side, idx); combat_follower(side, idx)
                elif n == 'Package Hoarder':
                    for o in nbs:
                        o.atk += 2; o.hp += 2
                elif n == 'Golden Parachute Exec' and side.p is not None:
                    side.p.bonus_next += 2
                elif n == 'Open Mic Poet':
                    for o in nbs:
                        o.atk += 2; o.hp += 2
                elif n == 'Struggling Artist':
                    for o in board:
                        o.atk += 1; o.hp += 1
                elif n == 'Nihilist':
                    for o in nbs:
                        o.atk += 1
                elif n == 'Dead Rock Star':
                    for o in board:
                        if o.tribe == C:
                            perm(o, 3, 3)
                elif n == 'Rage Quitter':
                    k = getattr(m, 'killer', None)
                    if k is not None and k.hp > 0:
                        hit(k, 3)
            for v in board:
                if v.is_('Art Critic') and getattr(v, 'critic', 0) < 3:
                    v.critic = getattr(v, 'critic', 0) + 1
                    perm(v, 1, 1)
                if v.is_('Memorial Mural'):
                    for o in board:
                        if o is not v and o.tribe == C:
                            o.atk += v.n('Memorial Mural')
                if v.is_('Museum Retrospective') and getattr(v, 'retro', 0) < 2:
                    v.retro = getattr(v, 'retro', 0) + 1
                    for o in board:
                        if o is not v and o.tribe == C:
                            perm(o, 3, 3)
            if side.vv > 0:
                side.vv -= 1
                combat_follower(side, idx)
            if m.rebrand:
                r = copy.copy(m); r.hp = 1; r.rebrand = False; r.extras = list(m.extras); r.hits = 0
                board.insert(min(idx, len(board)), r)
            changed = True
            break
    return pointer


def settle(sides, ptr):
    for _ in range(8):
        for k in (0, 1):
            after_damage(sides[k])
        ptr[0] = resolve_deaths(sides[0], sides[1], ptr[0])
        ptr[1] = resolve_deaths(sides[1], sides[0], ptr[1])
        if not any(m.hp <= 0 for s in sides for m in s.b) and not any(getattr(m, 'hits', 0) for s in sides for m in s.b):
            break


def fight(pa, pb, rng, board_a=None, board_b=None):
    """pa/pb are Players (None for a ghost). Returns (result, survivors): 1 A wins, -1 B wins, 0 draw.
    A board passed explicitly is a snapshot: its permanent effects don't write back."""
    A = [combat_copy(m) for m in (board_a if board_a is not None else pa.board)]
    B = [combat_copy(m) for m in (board_b if board_b is not None else pb.board)]
    if board_a is not None:
        for m in A:
            m.orig = None
    if board_b is not None:
        for m in B:
            m.orig = None
    sides = [Side(pa, A), Side(pb, B)]
    start_of_combat(sides[0], sides[1]); start_of_combat(sides[1], sides[0])
    ptr = [0, 0]
    settle(sides, ptr)
    turn = 0 if len(A) > len(B) else 1 if len(B) > len(A) else rng.randint(0, 1)
    for _ in range(300):
        if not A or not B:
            break
        me, them = sides[turn], sides[1 - turn]
        if not any(m.atk > 0 for m in me.b):
            if not any(m.atk > 0 for m in them.b):
                break
            turn = 1 - turn
            continue
        if ptr[turn] >= len(me.b):
            ptr[turn] = 0
        while me.b[ptr[turn]].atk <= 0:
            ptr[turn] = (ptr[turn] + 1) % len(me.b)
        att = me.b[ptr[turn]]
        swings = 2 if att.twice else 1
        for s in range(swings):
            if att.hp <= 0 or att not in me.b or not them.b:
                break
            taunts = [m for m in them.b if m.taunt]
            tgt = rng.choice(taunts or them.b)
            hit(tgt, att.atk, att)
            hit(att, tgt.atk, tgt)
            if tgt.hp <= 0:
                tgt.killer = att
                on_kill(me, att)
            if att.hp <= 0:
                att.killer = tgt
                on_kill(them, tgt)
            if s == 0:
                ptr[turn] += 1
            settle(sides, ptr)
        turn = 1 - turn
    if A and not B:
        return 1, A
    if B and not A:
        return -1, B
    return 0, []
