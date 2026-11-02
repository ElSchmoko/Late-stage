import random, json, statistics, sys
from collections import Counter
from cards import POOL, COPIES, H, I
from sim import Player, fight

ARCHS = {
    'Hustlers: Passive Income': {'tribe': H, 'style': 'PI'},
    'Hustlers: Exploitation': {'tribe': H, 'style': 'EX'},
    'Influencers: Followers': {'tribe': I, 'style': 'FO'},
    'Influencers: Main Character': {'tribe': I, 'style': 'MC'},
    'Baseline (best stats)': {'tribe': None, 'style': None},
}
TURNS = 14
RUNS = int(sys.argv[1]) if len(sys.argv) > 1 else 400
SNAP = [6, 9, 12]

def pool_weights():
    pw = {}
    for t in range(1, 7):
        cards = [c for c in POOL if c.tier <= t]
        pw[t] = (cards, [COPIES[c.tier] for c in cards])
    return pw

def main(quiet=False):
    rng = random.Random(42)
    pw = pool_weights()
    curves, snaps, comps = {}, {}, {}
    for name, arch in ARCHS.items():
        per_turn = [[] for _ in range(TURNS)]
        snaps[name] = {t: [] for t in SNAP}
        comp = {t: Counter() for t in SNAP}
        for r in range(RUNS):
            p = Player(arch, random.Random(rng.random()))
            for t in range(TURNS):
                p.take_turn(pw)
                per_turn[t].append(sum(m.stats() for m in p.board))
                if t + 1 in SNAP:
                    import copy
                    snaps[name][t + 1].append([copy.copy(m) for m in p.board])
                    for m in p.board:
                        comp[t + 1][m.name] += 1
        curves[name] = [round(statistics.mean(x), 1) for x in per_turn]
        comps[name] = {t: [(n, round(c / RUNS, 2)) for n, c in comp[t].most_common(8)] for t in SNAP}
    # head to head
    names = list(ARCHS)
    h2h = {}
    for t in SNAP:
        h2h[t] = {}
        for a in names:
            for b in names:
                if a >= b:
                    continue
                w = l = d = 0
                for _ in range(1500):
                    r = fight(rng.choice(snaps[a][t]), rng.choice(snaps[b][t]), rng)
                    if r == 1: w += 1
                    elif r == -1: l += 1
                    else: d += 1
                h2h[t][f'{a} vs {b}'] = (round(w / 1500 * 100), round(l / 1500 * 100), round(d / 1500 * 100))
    # each archetype vs all others pooled (overall win rate)
    overall = {}
    for t in SNAP:
        overall[t] = {}
        for a in names:
            w = n = 0
            for _ in range(3000):
                b = rng.choice([x for x in names if x != a])
                r = fight(rng.choice(snaps[a][t]), rng.choice(snaps[b][t]), rng)
                w += (r == 1) + 0.5 * (r == 0); n += 1
            overall[t][a] = round(w / n * 100)
    out = {'curves': curves, 'comps': comps, 'h2h': h2h, 'overall': overall}
    json.dump(out, open('results.json', 'w'), indent=1)
    if quiet:
        return out
    for n, c in curves.items():
        print(f'{n:32s}', c)
    for t in SNAP:
        print('turn', t, overall[t])
    for n in names:
        print(n)
        for t in SNAP:
            print('  ', t, comps[n][t])

if __name__ == '__main__':
    main()
