// Tribe peak board rating: how many stats (Attack + Health on the board) a tribe can build by a given turn when it
// plays its best plan. No battles and no bot decisions: a planner picks every action itself and the engine only
// applies the card rules (shop phase). Combat effects (Clock In, deaths, Start of combat) are not counted.
//
//   node tools/tribe_peak.js [seeds=3] [turns=3,6,9,13]      -> prints tables, writes docs/tribe-peak.md + tools/tribe_peak.json
//
// Assumptions (see docs/tribe-peak.md): full collection; the Feed always offers any card of the tribe or a Neighbour
// ("peak"); pool rules hold (at most 3 different cards per tier of the tribe, one legendary); levelling follows the
// standard curve; one target turn at a time, so each number is that turn's own peak.
globalThis.window = globalThis;
require('../game/data.js'); require('../game/engine.js');
const E = LSEngine; E.load(LS_CARDS, LS_STYLES);
const fs = require('fs'), path = require('path');
const SEEDS = +process.argv[2] || 3;
const TARGETS = (process.argv[3] || '3,6,9,13').split(',').map(Number);
const TRIBES = ['Hustler', 'Influencer', 'Feral', 'Creative', 'Techie', 'Punk', 'Philosopher'];
const ALL = LS_CARDS.filter(c => !c.token && c.name !== 'Follower');
const BY = Object.fromEntries(ALL.map(c => [c.name, c]));
const inTribe = (c, t) => c.tribe === t || c.tribe2 === t;
const styleOf = t => Object.keys(LS_STYLES).find(k => LS_STYLES[k][0] === t);
const boardStats = p => p.board.reduce((s, m) => s + m.atk + m.hp, 0);
const nextCombat = p => p.board.reduce((s, m) => s + (m.ta || 0) + (m.th || 0), 0);

/** Cards the tribe may buy, given the plan's picks so far (pool rules). */
const COPY_CAP = +(process.env.COPY_CAP || 3);   // copies of one card a plan may buy: 3 = one golden at most
function candidates(tribe, tier, picked) {
  const perTier = {}; let leg = null;
  for (const n of picked.keys()) { const c = BY[n]; if (!c || c.tribe === 'Neutral' && !c.legendary) continue; if (c.legendary) leg = n; else (perTier[c.tier] = perTier[c.tier] || new Set()).add(n); }
  return ALL.filter(c => c.tier <= tier && (picked.get(c.name) || 0) < COPY_CAP && (c.tribe === 'Neutral' && !c.legendary
    || inTribe(c, tribe) && (c.legendary ? (!leg || leg === c.name) : (perTier[c.tier] || new Set()).has(c.name) || (perTier[c.tier] || new Set()).size < 3)));
}

/** Plays the start of a turn: income, levelling on the standard curve, cards waiting in the queue, a fresh Feed. */
function startTurn(p) {
  p.beginTurn();
  const want = E.CURVE[p.turn] || 6;
  if (p.tier < want) { const cost = p.levelCost(); if (p.gold[0] >= cost) { p.gold[0] -= cost; p.gainSpend(cost); p.tier += 1; p.turns_at_tier = 0; } }
  p.playQueue();
  p.feed = p.feedEntries(p.drawFeed()); p.getFeed = () => p.feed;
}
function finishTurn(p) {
  p.playQueue(); p.botGigs(); p.playQueue(); p.spendLikes();
  p.spent_this_turn = p.spent - p.spent_start; p.feedRef = p.feed; p.getFeed = null;
  p.arrange(); p.endOfTurn();
}
const lowest = p => p.board.length ? p.board.reduce((a, m) => (m.atk + m.hp < a.atk + a.hp ? m : a)) : null;
/** Applies one action; returns false if it can't be done. */
function act(p, a, picked) {
  const g = p.gold;
  if (a.k === 'buy') {
    const card = BY[a.n], e = p.feedEntries([card])[0], cost = p.minionCost(e);
    if (g[0] < cost) return false;
    const twin = !p.canConnect(card) && p.board.filter(x => x.name === card.name && !x.golden && !x.follower).length >= 2;
    if (!twin && p.board.length >= 7 && !p.canConnect(card)) { const s = a.sell != null ? p.board[a.sell] : lowest(p); if (!s) return false; p.sell(s, g); }
    g[0] -= cost; p.gainSpend(cost); p.hired(card); picked.set(card.name, (picked.get(card.name) || 0) + 1);
    if (twin) p.tripleOnBuy(card, [{a: e.a, h: e.h}], g); else p.play(card, g, null, null, e);
    p.playQueue(); return true;
  }
  if (a.k === 'sell') { const m = p.board[a.i]; if (!m) return false; p.sell(m, g); p.playQueue(); return true; }
  if (a.k === 'scroll') { if (!p.payScroll()) return false; p.feed = p.feedEntries(p.drawFeed()); return true; }
  return false;
}
/** The rollout policy for turns the planner hasn't decided: buy the biggest, highest-tier card it may, swap out the weakest. */
function greedyTurn(p, tribe, picked) {
  for (let guard = 0; guard < 12; guard++) {
    const cs = candidates(tribe, p.tier, picked); if (!cs.length || p.gold[0] < 3) break;
    const best = cs.reduce((a, c) => (c.tier * 4 + c.atk + c.hp > a.tier * 4 + a.atk + a.hp ? c : a));
    if (p.board.length >= 7) { const lo = lowest(p); if (!lo || lo.atk + lo.hp >= best.atk + best.hp + 2) break; }
    if (!act(p, {k: 'buy', n: best.name}, picked)) break;
  }
}
/** Replays a plan (actions per turn) up to turn T; turns past the plan use the rollout policy. */
function replay(tribe, seed, plan, T, cur = null) {
  const rng = E.RNG(seed), pool = E.buildPool([tribe]);
  const p = new E.Player(styleOf(tribe), rng, pool, {}); const picked = new Map(); const curve = [];
  for (let t = 1; t <= T; t++) {
    startTurn(p);
    const acts = plan[t - 1] || (cur && t === plan.length + 1 ? cur : null);
    if (acts) { for (const a of acts) act(p, a, picked); if (t === plan.length + 1 && cur) greedyTurn(p, tribe, picked); }
    else greedyTurn(p, tribe, picked);
    finishTurn(p);
    curve.push({t, stats: boardStats(p), next: nextCombat(p), n: p.board.length});
  }
  return {p, picked, curve};
}
/** Plans the best route to turn T: each turn, actions are chosen one by one by rolling every option out to T. */
function plan(tribe, seed, T) {
  const done = [];
  for (let t = 1; t <= T; t++) {
    const acts = [];
    for (let step = 0; step < 14; step++) {
      // the state at this point, to list what can be done
      const rng = E.RNG(seed), pool = E.buildPool([tribe]); const p = new E.Player(styleOf(tribe), rng, pool, {}); const picked = new Map();
      for (let u = 1; u < t; u++) { startTurn(p); for (const a of done[u - 1]) act(p, a, picked); finishTurn(p); }
      startTurn(p); for (const a of acts) act(p, a, picked);
      const opts = [{k: 'end'}];
      if (p.gold[0] >= 3) for (const c of candidates(tribe, p.tier, picked)) {
        opts.push({k: 'buy', n: c.name});
        if (p.board.length >= 7) { const order = p.board.map((m, i) => [m.atk + m.hp, i]).sort((a, b) => a[0] - b[0]); if (order[1]) opts.push({k: 'buy', n: c.name, sell: order[1][1]}); }
      }
      p.board.forEach((m, i) => opts.push({k: 'sell', i}));
      if (p.gold[0] >= p.scrollCost() && p.gold[0] >= 1) opts.push({k: 'scroll'});
      let best = null, bestV = -1;
      for (const o of opts) {
        const tryActs = o.k === 'end' ? acts : acts.concat([o]);
        const v = evaluate(tribe, seed, done, tryActs, T, o.k === 'end');
        if (v > bestV + 1e-9) { bestV = v; best = o; }
      }
      if (!best || best.k === 'end') break;
      acts.push(best);
    }
    done.push(acts);
  }
  return done;
}
/** Value of a partial plan: board stats at T (plus a sliver of next-combat stats to break ties). */
function evaluate(tribe, seed, done, acts, T, endNow) {
  const rng = E.RNG(seed), pool = E.buildPool([tribe]); const p = new E.Player(styleOf(tribe), rng, pool, {}); const picked = new Map();
  const t0 = done.length + 1;
  for (let u = 1; u < t0; u++) { startTurn(p); for (const a of done[u - 1]) act(p, a, picked); finishTurn(p); }
  startTurn(p); for (const a of acts) if (!act(p, a, picked)) return -1;
  if (!endNow) greedyTurn(p, tribe, picked);
  finishTurn(p);
  for (let u = t0 + 1; u <= T; u++) { startTurn(p); greedyTurn(p, tribe, picked); finishTurn(p); }
  return boardStats(p) + nextCombat(p) * 0.01;
}

module.exports = {plan, replay, evaluate, candidates, boardStats};
if (require.main !== module) return;
const out = {targets: TARGETS, seeds: SEEDS, tribes: {}};
const t0 = Date.now();
for (const tribe of TRIBES) {
  const res = {peak: {}, next: {}, boards: {}, curve: null};
  for (const T of TARGETS) {
    let sum = 0, nsum = 0, bestRun = null;
    for (let s = 0; s < SEEDS; s++) {
      const seed = 7000 + s * 131, pl = plan(tribe, seed, T), r = replay(tribe, seed, pl, T);
      const v = boardStats(r.p); sum += v; nsum += nextCombat(r.p);
      if (!bestRun || v > bestRun.v) bestRun = {v, board: r.p.board.map(m => `${m.golden ? '★ ' : ''}${m.name} ${m.atk}/${m.hp}`), curve: r.curve, plan: pl};
    }
    res.peak[T] = Math.round(sum / SEEDS); res.next[T] = Math.round(nsum / SEEDS); res.boards[T] = bestRun.board;
    if (T === Math.max(...TARGETS)) res.curve = bestRun.curve.map(x => x.stats);
    process.stderr.write(`${tribe} T${T}: ${res.peak[T]} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  out.tribes[tribe] = res;
}
// ratings: 100 = the median tribe at that turn (the median, so one exploding combo doesn't squash everyone else);
// overall = weighted 0.2 / 0.3 / 0.3 / 0.2 over the four turns
const W = TARGETS.length === 4 ? [0.2, 0.3, 0.3, 0.2] : TARGETS.map(() => 1 / TARGETS.length);
const median = xs => { const v = xs.slice().sort((a, b) => a - b); return v[v.length >> 1]; };
for (const T of TARGETS) {
  const med = median(TRIBES.map(t => out.tribes[t].peak[T]));
  for (const t of TRIBES) (out.tribes[t].rating = out.tribes[t].rating || {})[T] = Math.round(100 * out.tribes[t].peak[T] / med);
}
for (const t of TRIBES) out.tribes[t].overall = Math.round(TARGETS.reduce((s, T, i) => s + W[i] * out.tribes[t].rating[T], 0));
fs.writeFileSync(path.join(__dirname, 'tribe_peak.json'), JSON.stringify(out, null, 1));
const rows = TRIBES.slice().sort((a, b) => out.tribes[b].overall - out.tribes[a].overall);
console.log(['Tribe', ...TARGETS.map(T => `T${T}`), ...TARGETS.map(T => `r${T}`), 'overall'].join('\t'));
for (const t of rows) { const r = out.tribes[t]; console.log([t, ...TARGETS.map(T => r.peak[T]), ...TARGETS.map(T => r.rating[T]), r.overall].join('\t')); }
// a markdown report next to the design docs
const md = [`# Tribe peak board rating`, '', `Generated by \`node tools/tribe_peak.js ${SEEDS} ${TARGETS.join(',')}\` (${SEEDS} seeds, copy cap ${COPY_CAP}). Board stats = Attack + Health of every minion on the board after the turn's end-of-turn effects; no battles.`, '',
  `| Tribe | ${TARGETS.map(T => `Turn ${T}`).join(' | ')} | ${TARGETS.map(T => `Rating T${T}`).join(' | ')} | Overall |`, `| --- |${' --- |'.repeat(TARGETS.length * 2 + 1)}`,
  ...rows.map(t => { const r = out.tribes[t]; return `| ${t} | ${TARGETS.map(T => r.peak[T]).join(' | ')} | ${TARGETS.map(T => r.rating[T]).join(' | ')} | ${r.overall} |`; }),
  '', '## Best boards', '', ...rows.flatMap(t => [`**${t}**`, '', ...TARGETS.map(T => `- Turn ${T}: ${out.tribes[t].boards[T].join(', ')}`), ''])];
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'tribe-peak.md'), md.join('\n'));
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
