// Head-to-head card test for low tiers: give one card for free to a bot of the card's tribe at the start of that tier
// (tier 1: turn 1, tier 2: turn 3, tier 3: turn 5) and compare against the identical lobby without it.
// Reports the change in final placement (negative = better) and in fight win rate over the next 4 rounds.
// Usage: node game/tiertest.js N [maxTier] [filter]
globalThis.window = globalThis;
require('./data.js'); require('./engine.js'); require('./lobby.js');
const E = LSEngine; E.load(LS_CARDS, LS_STYLES);
const N = +process.argv[2] || 300, MAXT = +process.argv[3] || 3, FILTER = process.argv[4] || null;
const STY = LS_STYLES, TURN = {1: 1, 2: 3, 3: 5};
function run(seed, tribe, card) {
  const others = E.TRIBES.filter(t => t !== tribe);
  const r = E.RNG(seed); const tribes = [tribe === 'Neutral' ? others[0] : tribe].concat(r.shuffle(others.slice()).filter(t => t !== tribe).slice(0, 4));
  const L = new LSLobby(seed, {tribes, skill: 0});
  const p = L.players[0];
  const styles = Object.keys(STY).filter(s => STY[s][0] === (tribe === 'Neutral' ? tribes[0] : tribe));
  const st = styles[seed % styles.length]; p.style_code = st; p.style = st; p.tribe = STY[st][0];
  let wins = 0, fights = 0;
  const t0 = card ? TURN[card.tier] : 99;
  while (!L.over() && L.turn < 30) {
    for (const q of L.alive()) {
      q.takeTurn();
      if (q === p && card && q.turn === t0) {
        if (!card.collab && q.board.length >= 7) q.board.splice(q.board.indexOf(q.board.reduce((a, m) => (q.value(m) < q.value(a) ? m : a))), 1);
        if (!card.collab || q.board.length) q.play(card, [0]);
      }
    }
    L.fightRound();
    if (L.turn > (card ? t0 : 0) && L.turn <= (card ? t0 : 0) + 4) for (const rec of L.results) { if (rec.a === p || rec.b === p) { fights++; if (rec.winner === p) wins++; } }
  }
  for (const q of L.players) if (!q.place) q.place = 1;
  return {place: p.place, wins, fights};
}
const cards = LS_CARDS.filter(c => !c.token && c.tier <= MAXT && (!FILTER || c.tribe === FILTER || c.name === FILTER));
const byTribe = {};
for (const c of cards) (byTribe[c.tribe] = byTribe[c.tribe] || []).push(c);
const rows = [];
for (const [tribe, cs] of Object.entries(byTribe)) {
  const base = []; for (let i = 0; i < N; i++) base.push(run(100000 + i, tribe, null));
  // a plain minion with the tier's average stats, same tribe: what a card is worth beyond its body
  const vanilla = {};
  for (const t of [...new Set(cs.map(c => c.tier))]) {
    const pool = LS_CARDS.filter(c => !c.token && c.tier === t), avg = k => Math.round(pool.reduce((a, c) => a + c[k], 0) / pool.length);
    const v = {name: 'Plain ' + t, tribe: tribe === 'Neutral' ? 'Neutral' : tribe, tier: t, atk: avg('atk'), hp: avg('hp'), text: '', kind: 'stat', style: '-'};
    let dp = 0; for (let i = 0; i < N; i++) dp += run(100000 + i, tribe, v).place - base[i].place;
    vanilla[t] = -dp / N; rows.push([t, tribe, `(plain ${v.atk}/${v.hp})`, vanilla[t].toFixed(2), '-', '-', '0.00']);
  }
  for (const c of cs) {
    let dp = 0, w = 0, f = 0, sq = 0;
    for (let i = 0; i < N; i++) { const x = run(100000 + i, tribe, c); const d = x.place - base[i].place; dp += d; sq += d * d; w += x.wins; f += x.fights; }
    const m = dp / N, se = Math.sqrt(Math.max(0, sq / N - m * m) / N);
    rows.push([c.tier, tribe, c.name, (-m).toFixed(2), se.toFixed(2), (100 * w / Math.max(1, f)).toFixed(0), (-m - vanilla[c.tier]).toFixed(2)]);
  }
}
rows.sort((a, b) => a[0] - b[0] || b[6] - a[6]);
console.log('tier\ttribe\tcard\tplaces gained\t±\twin% next 4 rounds\tover plain body');
for (const r of rows) console.log(r.join('\t'));
