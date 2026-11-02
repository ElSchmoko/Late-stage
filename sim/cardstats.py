"""Card power: average final placement of players holding a card at turn 10 (lower = stronger)."""
import random, statistics, sys, json
from collections import defaultdict
import lobby, sim
from cards import ALL

def run(n=2000, seed=5):
    rng = random.Random(seed)
    held = defaultdict(list)
    orig = lobby.run_lobby
    stats = lobby.new_stats()
    for _ in range(n):
        snap = {}
        # monkeypatch take_turn to snapshot at turn 10
        tt = sim.Player.take_turn
        def take(self, _tt=tt):
            _tt(self)
            if self.turn == 10:
                snap[id(self)] = (self, {m.name for m in self.board} | {e for m in self.board for e in m.extras})
        sim.Player.take_turn = take
        before = {k: list(v) for k, v in stats['place'].items()}
        # run lobby and capture players' places
        players_places = []
        r = random.Random(rng.random())
        # replicate run_lobby but get places per player object
        o_place = stats['place']
        lobby.run_lobby(r, stats)
        sim.Player.take_turn = tt
        for pid, (p, names) in snap.items():
            pl = getattr(p, 'place', None)
            if pl is None: continue
            for nm in names:
                held[nm].append(pl)
    return held

if __name__ == '__main__':
    held = run(int(sys.argv[1]) if len(sys.argv) > 1 else 2000)
    rows = sorted(((statistics.mean(v), len(v), k) for k, v in held.items() if len(v) >= 30))
    for m, n, k in rows:
        print(f'{m:5.2f} {n:5d} {k}')
