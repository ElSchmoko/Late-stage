// Simulation half of the balance suite.
//   node game/balance/sim.js cards N [tribes,comma,separated] > out.json   per-card value: on curve, late, outside its tribe
//   node game/balance/sim.js styles N0 N1 > out.json                       per-style placement spread, phase win rates, uptake
globalThis.window = globalThis;
const G = __dirname + '/../';
require(G + 'data.js'); require(G + 'engine.js'); require(G + 'lobby.js');
const E = LSEngine; E.load(LS_CARDS, LS_STYLES);
const STY = LS_STYLES, TRIBES = E.TRIBES;
const TURN = {1: 1, 2: 3, 3: 5, 4: 7, 5: 9, 6: 11}, LATE = 3;
const mode = process.argv[2];

function stylesOf(t) { return Object.keys(STY).filter(s => STY[s][0] === t); }
function setup(seed, cardTribe, own, forceStyle) {
  // the card's tribe is always in the lobby; "own" puts the test bot on that tribe, "off" on another tribe
  const r = E.RNG(seed * 31 + 7);
  const others = TRIBES.filter(t => t !== cardTribe);
  const off = others[seed % others.length];
  const botTribe = cardTribe === 'Neutral' ? others[(seed >> 1) % others.length] : own ? cardTribe : off;
  const tribes = [...new Set([cardTribe === 'Neutral' ? botTribe : cardTribe, botTribe].concat(r.shuffle(others.slice())))].slice(0, 5);
  const L = new LSLobby(seed, {tribes, skill: 0});
  const p = L.players[0], sts = stylesOf(botTribe), st = forceStyle || sts[seed % sts.length];
  p.style_code = st; p.style = st; p.tribe = STY[st][0];
  return {L, p};
}
function run(seed, cardTribe, own, card, turn, forceStyle) {
  const {L, p} = setup(seed, cardTribe, own, forceStyle);
  // the card arrives at the start of the bot's turn, played with the bot's real gold (Venture Capitalist invests it)
  let at = turn;   // a Collab needs a minion to stick to: if the board is empty it arrives a turn later
  if (card) p.onBegin = q => { if (q.turn !== at) return; if (card.collab && !q.board.length) { at++; return; }
    if (!card.collab && q.board.length >= 7) q.board.splice(q.board.indexOf(q.board.reduce((a, m) => (q.value(m) < q.value(a) ? m : a))), 1);
    if (!card.collab || q.board.length) q.play(card, q.gold); };
  let reached = 0;
  while (!L.over() && L.turn < 30) { L.botTurns(); if (p.alive) reached = p.turn; L.fightRound(); }
  for (const q of L.players) if (!q.place) q.place = 1;
  return {place: p.place, reached};
}
const plainOf = (tribe, tier) => {
  const pool = LS_CARDS.filter(c => !c.token && c.tier === tier), avg = k => Math.round(pool.reduce((a, c) => a + c[k], 0) / pool.length);
  return {name: 'Plain', tribe, tier, atk: avg('atk'), hp: avg('hp'), text: '', kind: 'stat', style: '-'};
};

if (mode === 'cards') {
  const N = +process.argv[3] || 200, only = process.argv[4] ? process.argv[4].split(',') : null, CEIL = process.argv.includes('--ceiling'), ONLYCARD = (process.argv.find(a => a.startsWith('--card=')) || '').slice(7);
  const cards = LS_CARDS.filter(c => !c.token && (!only || only.includes(c.tribe)) && (!ONLYCARD || ONLYCARD.split('|').includes(c.name)));
  const tribes = [...new Set(cards.map(c => c.tribe))];
  const out = {};
  const seeds = Array.from({length: N}, (_, i) => 200000 + i);
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const se = a => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length / a.length); };
  for (const tribe of tribes) {
    const base = {own: seeds.map(s => run(s, tribe, true, null, 0)), off: seeds.map(s => run(s, tribe, false, null, 0))};
    // only lobbies where the bot is still in the game when the card arrives count (otherwise late tiers look like nothing)
    const gain = (own, card, turn) => { const b = own ? base.own : base.off, g = [];
      seeds.forEach((s, i) => { if (b[i].reached >= turn) g.push(b[i].place - run(s, tribe, own, card, turn).place); }); return g; };
    const plain = {};
    for (const tier of [...new Set(cards.filter(c => c.tribe === tribe).map(c => c.tier))]) {
      const pc = plainOf(tribe, tier);
      plain[tier] = {own: mean(gain(true, pc, TURN[tier])), late: mean(gain(true, pc, TURN[tier] + LATE)), off: tribe === 'Neutral' ? null : mean(gain(false, pc, TURN[tier]))};
    }
    for (const c of cards.filter(c => c.tribe === tribe)) {
      const g0 = gain(true, c, TURN[c.tier]), gl = gain(true, c, TURN[c.tier] + LATE), go = tribe === 'Neutral' ? null : gain(false, c, TURN[c.tier]);
      // build-around ceiling: the card in each style of its tribe separately (the best fit shows what a player building around it gets)
      let byStyle = null;
      if (CEIL && tribe !== 'Neutral') { byStyle = {};
        for (const st of stylesOf(tribe)) {
          const bs = seeds.map(s => run(s, tribe, true, null, 0, st)), pc = plainOf(tribe, c.tier);
          const g = (card) => { const r = []; seeds.forEach((s, i) => { if (bs[i].reached >= TURN[c.tier]) r.push(bs[i].place - run(s, tribe, true, card, TURN[c.tier], st).place); }); return mean(r); };
          byStyle[st] = g(c) - g(pc);
        } }
      out[c.name] = {tribe, tier: c.tier, style: c.style, byStyle, ceiling: byStyle ? Math.max(...Object.values(byStyle)) : null, raw: mean(g0), rawSE: se(g0), rate: mean(g0) - plain[c.tier].own,
        late: mean(gl) - plain[c.tier].late, off: go ? mean(go) - plain[c.tier].off : null, synergy: go ? (mean(g0) - plain[c.tier].own) - (mean(go) - plain[c.tier].off) : null};
      process.stderr.write('.');
    }
  }
  console.log(JSON.stringify(out));
}

if (mode === 'styles') {
  const N0 = +process.argv[3] || 1600, N1 = +process.argv[4] || 150;
  const res = {};
  const PH = t => t <= 4 ? 'early' : t <= 8 ? 'mid' : t <= 12 ? 'late' : 'end';
  const up = {};   // uptake: name -> {offered, bought, sold, boardTurns}
  const U = n => up[n] = up[n] || {offered: 0, bought: 0, sold: 0, boardTurns: 0};
  const oDraw = E.Player.prototype.drawFeed, oPlay = E.Player.prototype.play, oSell = E.Player.prototype.sell;
  let track = false;
  E.Player.prototype.drawFeed = function () { const f = oDraw.call(this); if (track && !this.human) for (const c of f) U(c.name).offered++; return f; };
  E.Player.prototype.play = function (card, gold, pos, target, bonus) { if (track && bonus && !bonus.golden) U(card.name).bought++; return oPlay.call(this, card, gold, pos, target, bonus); };
  E.Player.prototype.sell = function (m, gold) { if (track && m.c) U(m.c.name).sold++; return oSell.call(this, m, gold); };
  for (const [label, N, skill] of [['skill0', N0, 0], ['skill1', N1, 1]]) {
    const st = {};
    const S = k => st[k] = st[k] || {places: [], ph: {early: [0, 0], mid: [0, 0], late: [0, 0], end: [0, 0]}};   // [wins, losses] (draws left out)
    track = label === 'skill0';
    for (let i = 0; i < N; i++) {
      const L = new LSLobby(700000 + i, {skill});
      while (!L.over() && L.turn < 30) {
        L.botTurns();
        if (track) for (const p of L.alive()) for (const m of p.board) if (m.c) U(m.c.name).boardTurns++;
        L.fightRound();
        for (const r of L.results) for (const p of [r.a, r.b]) if (p && p.style_code) { const ph = S(p.style_code).ph[PH(L.turn)]; if (r.winner === p) ph[0]++; else if (r.loser === p) ph[1]++; }
      }
      for (const p of L.players) { const r = S(p.style_code); r.places.push(p.place || 1); (r[i < N / 2 ? 'hA' : 'hB'] = r[i < N / 2 ? 'hA' : 'hB'] || []).push(p.place || 1); }
    }
    res[label] = Object.fromEntries(Object.entries(st).map(([k, v]) => {
      const n = v.places.length, avg = v.places.reduce((a, b) => a + b, 0) / n;
      const m = a => a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
      return [k, {n, avg, halfDiff: m(v.hA) != null && m(v.hB) != null ? Math.abs(m(v.hA) - m(v.hB)) : null, first: v.places.filter(x => x === 1).length / n, top4: v.places.filter(x => x <= 4).length / n, eighth: v.places.filter(x => x === 8).length / n,
        phase: Object.fromEntries(Object.entries(v.ph).map(([ph, [w, l]]) => [ph, w + l ? w / (w + l) : null]))}];
    }));
  }
  res.uptake = up;
  console.log(JSON.stringify(res));
}
