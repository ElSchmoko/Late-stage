"""Full-game duels: a tribe bot against the stats-only bot until one reaches 0 Sanity."""
import random, sys, json
import lobby, sim
from cards import STYLES, TRIBES

def duel(style, rng, sloppy=False):
    tribe = STYLES[style][0]
    others = [t for t in TRIBES if t != tribe]
    tribes = [tribe] + rng.sample(others, 4)
    pool = lobby.build_pool(tribes)
    a = sim.Player(style, random.Random(rng.random()), pool)
    b = sim.Player('BASE', random.Random(rng.random()), pool)
    if sloppy:
        a.SLOPPY = True
    for turn in range(1, 31):
        a.take_turn(); b.take_turn()
        res, surv = sim.fight(a, b, rng)
        if res == 1:
            b.health -= min(lobby.damage_cap(turn), a.tier + sum(m.tier for m in surv))
        elif res == -1:
            a.health -= min(lobby.damage_cap(turn), b.tier + sum(m.tier for m in surv))
        if a.health <= 0 or b.health <= 0:
            break
    return 1 if b.health <= 0 and a.health > b.health else 0 if a.health <= 0 and b.health > a.health else 0.5

def run(n=1000, sloppy=False, seed=3):
    rng = random.Random(seed)
    return {s: round(100 * sum(duel(s, rng, sloppy) for _ in range(n)) / n, 1) for s in STYLES}

if __name__ == '__main__':
    out = {'tuned': run(), }
    print('tuned ', out['tuned'])
    json.dump(out, open('duels.json', 'w'))
