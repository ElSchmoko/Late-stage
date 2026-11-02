/* Late Stage lobby: 8 players (1 human + 7 bots or 8 bots), pairings, damage, placements. */
(function (root) {
'use strict';
const E = root.LSEngine;

const BOT_HEROES = ['remote', 'boomer', 'h_gymbro', 'h_procrastinator', 'h_bargainhunter', 'h_doomscroller', 'h_serial', 'h_overthinker',
  'h_lifecoach', 'h_minimalist', 'h_complainer', 'h_ex'];

class Lobby {
  constructor(seed, opts = {}) {
    this.rng = E.RNG(seed);
    this.tribes = opts.tribes || this.rng.shuffle(E.TRIBES.slice()).slice(0, 5);
    this.pool = E.buildPool(this.tribes);
    const styles = Object.keys(E.styles()).filter(s => this.tribes.includes(E.styles()[s][0]));
    const options = styles.concat(['BASE']);
    const chosen = this.rng.shuffle(options.slice()).slice(0, opts.human ? 7 : 8);
    const heroes = this.rng.shuffle(BOT_HEROES.filter(h => h !== opts.heroSlug));
    this.players = [];
    if (opts.human) {
      const h = new E.Player('HUMAN', E.RNG(this.rng.int(1, 1e9)), this.pool, {human: true, hero: opts.heroSlug, boundaries: opts.boundaries, name: 'You'});
      h.tribe = null; this.players.push(h); this.human = h;
    }
    chosen.forEach((s, i) => {
      const p = new E.Player(s, E.RNG(this.rng.int(1, 1e9)), this.pool, {hero: heroes[i], name: s});
      this.players.push(p);
    });
    this.turn = 0; this.deadOrder = []; this.ghosts = []; this.lastPairs = [];
  }
  alive() { return this.players.filter(p => p.alive); }
  botTurns() { for (const p of this.alive()) if (!p.human) p.takeTurn(); }
  pair() {
    const alive = this.rng.shuffle(this.alive());
    // keep the human from facing the same opponent twice in a row when possible
    const pairs = [];
    for (let i = 0; i + 1 < alive.length; i += 2) pairs.push([alive[i], alive[i + 1]]);
    if (alive.length % 2) pairs.push([alive[alive.length - 1], null]);
    return pairs;
  }
  nextOpponentFor(p) { const pr = (this.plannedPairs || []).find(x => x[0] === p || x[1] === p); if (!pr) return null; return pr[0] === p ? pr[1] : pr[0]; }
  planPairs() { this.plannedPairs = this.pair(); return this.plannedPairs; }
  /** Runs every fight of the round. Returns the human's fight (with frames) if there is one. */
  fightRound() {
    this.turn += 1;
    const pairs = this.plannedPairs || this.pair();
    this.plannedPairs = null;
    let humanFight = null;
    this.results = [];
    for (let [a, b] of pairs) {
      let ghost = null;
      if (!b) { if (!this.ghosts.length) continue; ghost = this.rng.choice(this.ghosts); }
      if (b && b.human) [a, b] = [b, a];
      const f = new E.Fight(a, b ? b : {ghost: true, name: ghost.name, hero: ghost.hero, tier: ghost.tier}, a.board, b ? b.board : ghost.board, E.RNG(this.rng.int(1, 1e9))).run();
      const btier = b ? b.tier : ghost.tier;
      let dmg = 0, loser = null, winner = null;
      if (f.result !== 0) {
        const wTier = f.result === 1 ? a.tier : btier;
        dmg = Math.min(E.damageCap(this.turn), wTier + f.survivors.reduce((s, m) => s + m.tier, 0));
        loser = f.result === 1 ? b : a; winner = f.result === 1 ? a : b;
        if (loser) this.damage(loser, dmg);
      }
      for (const p of [a, b]) if (p) p.lostLast = p === loser;
      const rec = {a, b, ghost, fight: f, dmg, loser, winner};
      this.results.push(rec);
      if (a.human) humanFight = rec;
    }
    const died = this.players.filter(p => p.alive && p.health <= 0).sort((x, y) => x.health - y.health);
    for (const p of died) {
      p.alive = false; this.ghosts.push({board: p.board.map(m => Object.assign(Object.create(Object.getPrototypeOf(m)), m, {extras: m.extras.slice()})), tier: p.tier, name: p.name, hero: p.hero});
      this.deadOrder.push(p); p.place = 9 - this.deadOrder.length;
    }
    if (this.alive().length <= 1) for (const p of this.alive()) p.place = 1;
    return humanFight;
  }
  damage(p, n) {
    const a = Math.min(p.boundaries, n); p.boundaries -= a; p.health -= n - a; p.lastDamage = {total: n, armor: a};
  }
  over() { return this.alive().length <= 1 || (this.human && !this.human.alive); }
  standings() { return this.players.slice().sort((x, y) => (y.alive - x.alive) || (y.health + y.boundaries) - (x.health + x.boundaries) || ((x.place || 9) - (y.place || 9))); }
}
root.LSLobby = Lobby;
})(typeof window !== 'undefined' ? window : globalThis);
