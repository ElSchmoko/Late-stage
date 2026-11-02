"""Run simulated 8-player lobbies and collect per-style results."""
import random, json, statistics, sys, copy
from collections import defaultdict, Counter
from cards import ALL, BY_TRIBE, COPIES, STYLES, TRIBES, NEIGHBOURS
from sim import Player, fight

BASE = 'BASE'
MAX_TURNS = 30
CURVE_TURNS = 14


def damage_cap(turn):
    return 5 if turn <= 3 else 10 if turn <= 7 else 15


def build_pool(tribes):
    pool = {}
    cards_all = [c for t in tribes for c in BY_TRIBE[t]] + NEIGHBOURS
    for tier in range(1, 7):
        cs = [c for c in cards_all if c.tier <= tier]
        pool[tier] = (cs, [COPIES[c.tier] for c in cs])
    return pool


def band(turn):
    return 'early' if turn <= 6 else 'mid' if turn <= 10 else 'late'


def run_lobby(rng, stats):
    tribes = rng.sample(TRIBES, 5)
    pool = build_pool(tribes)
    options = [s for s, (t, _) in STYLES.items() if t in tribes] + [BASE]
    chosen = rng.sample(options, 8)
    players = [Player(s, random.Random(rng.random()), pool) for s in chosen]
    dead_order = []
    ghosts = []
    turn = 0
    while sum(p.alive for p in players) > 1 and turn < MAX_TURNS:
        turn += 1
        alive = [p for p in players if p.alive]
        for p in alive:
            p.take_turn()
            if turn <= CURVE_TURNS:
                stats['curve'][p.style_code][turn].append(sum(m.combat_stats() for m in p.board))
        rng.shuffle(alive)
        pairs = [(alive[i], alive[i + 1]) for i in range(0, len(alive) - 1, 2)]
        if len(alive) % 2:
            pairs.append((alive[-1], None))
        for a, b in pairs:
            if b is None:
                if not ghosts:
                    continue
                gboard, gtier = rng.choice(ghosts)
                res, surv = fight(a, None, rng, board_b=gboard)
                btier = gtier
            else:
                res, surv = fight(a, b, rng)
                btier = b.tier
                stats['matchups'][(a.style_code, b.style_code)][res] += 1
                stats['matchups'][(b.style_code, a.style_code)][-res] += 1
                for p, r in ((a, res), (b, -res)):
                    stats['combat'][p.style_code][band(turn)][r] += 1
            if res != 0:
                loser = b if res == 1 else a
                wtier = a.tier if res == 1 else btier
                dmg = min(damage_cap(turn), wtier + sum(m.tier for m in surv))
                if loser is not None:
                    loser.health -= dmg
        # eliminations (lower Sanity places lower)
        died = sorted([p for p in players if p.alive and p.health <= 0], key=lambda p: p.health)
        for p in died:
            p.alive = False
            ghosts.append(([copy.copy(m) for m in p.board], p.tier))
            dead_order.append(p)
    remaining = sorted([p for p in players if p.alive], key=lambda p: p.health)
    order = dead_order + remaining          # first = 8th place
    for i, p in enumerate(order):
        place = 8 - i
        p.place = place
        stats['place'][p.style_code].append(place)
    stats['lobbies'][tuple(sorted(tribes))] += 1
    stats['length'].append(turn)


def new_stats():
    return {'curve': defaultdict(lambda: defaultdict(list)),
            'combat': defaultdict(lambda: defaultdict(Counter)),
            'matchups': defaultdict(Counter),
            'place': defaultdict(list),
            'lobbies': Counter(), 'length': []}


def summarise(stats):
    out = {'styles': {}, 'avg_length': round(statistics.mean(stats['length']), 1), 'lobbies': sum(stats['lobbies'].values())}
    for s, places in stats['place'].items():
        d = {'n': len(places),
             'avg_place': round(statistics.mean(places), 2),
             'top4': round(100 * sum(p <= 4 for p in places) / len(places), 1),
             'first': round(100 * sum(p == 1 for p in places) / len(places), 1),
             'curve': [round(statistics.mean(stats['curve'][s][t]), 1) if stats['curve'][s][t] else None
                       for t in range(1, CURVE_TURNS + 1)],
             'combat': {}}
        for b in ('early', 'mid', 'late'):
            c = stats['combat'][s][b]
            n = c[1] + c[-1] + c[0]
            d['combat'][b] = round(100 * (c[1] + 0.5 * c[0]) / n, 1) if n else None
        out['styles'][s] = d
    mu = {}
    for (a, b), c in stats['matchups'].items():
        n = c[1] + c[-1] + c[0]
        mu[f'{a}|{b}'] = (round(100 * (c[1] + 0.5 * c[0]) / n, 1), n)
    out['matchups'] = mu
    return out


def main(n=1500, seed=7, path='results_v2.json', quiet=False):
    rng = random.Random(seed)
    stats = new_stats()
    for _ in range(n):
        run_lobby(rng, stats)
    out = summarise(stats)
    json.dump(out, open(path, 'w'), indent=1)
    if not quiet:
        show(out)
    return out


def show(out):
    print(f"lobbies {out['lobbies']}  avg length {out['avg_length']} turns")
    rows = sorted(out['styles'].items(), key=lambda kv: kv[1]['avg_place'])
    print(f"{'style':6s} {'n':>5s} {'place':>6s} {'top4':>6s} {'1st':>5s} {'early':>6s} {'mid':>6s} {'late':>6s}  T6/T9/T12/T14 stats")
    for s, d in rows:
        cv = d['curve']
        print(f"{s:6s} {d['n']:5d} {d['avg_place']:6.2f} {d['top4']:6.1f} {d['first']:5.1f} "
              f"{d['combat']['early']:6.1f} {d['combat']['mid']:6.1f} {d['combat']['late'] or 0:6.1f}  "
              f"{cv[5]}/{cv[8]}/{cv[11]}/{cv[13]}")


if __name__ == '__main__':
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 1500)
