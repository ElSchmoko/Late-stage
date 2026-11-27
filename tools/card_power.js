// Card power: for every card, the best board that includes it, compared with its tribe's best board (100 = it belongs in
// the best board). Uses the tribe calculator's formulas and search (tools/tribe_calc.js); no engine, no battles.
//   node tools/card_power.js   -> tools/card_power.json, docs/card-power.md
globalThis.window = globalThis;
const {best} = require('./tribe_calc.js');
const fs = require('fs'), path = require('path');
const calc = require('./tribe_calc.json');
const TRIBES = Object.keys(calc.tribes), TS = [6, 9, 13];
const CURVE = {1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 6};
const cards = LS_CARDS.filter(c => !c.token && c.name !== 'Follower');
const out = [];
const t0 = Date.now();
for (const c of cards) {
  const tribes = c.tribe === 'Neutral' ? TRIBES : [c.tribe, c.tribe2].filter(Boolean);
  const row = {name: c.name, tribe: c.tribe + (c.tribe2 ? '/' + c.tribe2 : ''), tier: c.tier, legendary: !!c.legendary, power: {}, own: {}, bestTribe: {}};
  for (const T of TS) {
    if (c.tier > (CURVE[T] || 6)) continue;
    let bestR = null, bestTr = null, ratio = -1;
    for (const tr of tribes) {
      const base = calc.tribes[tr][T];
      const inBase = base.plan.cards.some(x => x.n === c.name) || base.plan.cycle === c.name;
      const r = inBase ? base : best(tr, T, base.plan, c.name);
      const q = r.stats / base.stats;
      if (q > ratio) { ratio = q; bestR = r; bestTr = tr; }
    }
    row.power[T] = Math.round(100 * ratio); row.bestTribe[T] = bestTr;
    const src = (bestR.sources || []).find(s => s.startsWith(c.name + ' '));
    row.own[T] = src ? +src.slice(c.name.length + 1) : 0;
  }
  out.push(row);
  process.stderr.write(`${c.name} ${JSON.stringify(row.power)} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
}
fs.writeFileSync(path.join(__dirname, 'card_power.json'), JSON.stringify(out, null, 1));
