// Balance report: combines the static card model with simulation results and flags every card/tribe/style that misses a target.
//   node game/balance/report.js cards.json styles.json > docs/balance/report.md
globalThis.window = globalThis;
const G = __dirname + '/../';
require(G + 'data.js');
const fs = require('fs');
const {modelOf, dominates, sig} = require('./model.js');
const CARDS = JSON.parse(fs.readFileSync(process.argv[2]));
const STY = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3])) : null;
const STYLES = LS_STYLES;
const T = {   // targets
  rateHigh: 0.45, rateLow: 0.40,          // effect value vs the tier median (places)
  parity: 0.60,                           // max spread of effect value inside one tribe and tier
  tierHole: 0.6, tierSpike: 1.5,          // a tribe's tier mean relative to the global tier mean
  lateGain: 0.35,                         // a tier 1-2 card gaining this much more when bought late is a hidden scaler
  synergyMin: 0.10, cohesionShare: 0.5,   // tribe cards should be worth more inside their tribe
  generic: 0.35,                          // a tribe card this good outside its tribe (and not better inside) is generic power
  triggerShare: 0.40, dupMax: 2,          // variety inside a tribe
  band: 0.60, phaseDev: 0.10, firstLo: 0.09, firstHi: 0.17, eighthHi: 0.17,
  buyLow: 0.35, buyHigh: 2.5};
// Flags accepted on purpose, with the reason. They are listed separately instead of counted.
const ACCEPT = {
  'Timing|Loot Box': 'Discover offers cards up to your tier, so it is meant to get better later.',
  'Timing|Art Student': 'Its First Impression needs another Creative on the board, so it is a little better a turn or two later.',
  'Cohesion|Robot Vacuum': 'Collabs are meant to spread the Techie tag to other tribes\' minions.',
  'Cohesion|Noise-Cancelling Headphones': 'Collabs are meant to spread the Techie tag to other tribes\' minions.',
  'Cohesion|Smart Plug': 'Collabs are meant to spread the Techie tag to other tribes\' minions.',
};
const NEUTRAL_LOW = 0.6;   // Neighbours are generic by design: they may sit lower, but not this far below the tier median
const ms = Object.fromEntries(LS_CARDS.filter(c => !c.token).map(c => [c.name, modelOf(c)]));
const names = Object.keys(ms), TRIBES = [...new Set(names.map(n => ms[n].tribe))];
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const f2 = x => x == null ? '–' : (x >= 0 ? '+' : '') + x.toFixed(2);
const pct = x => x == null ? '–' : Math.round(100 * x) + '%';
const out = [], flags = [];
const accepted = [];
const flag = (dim, who, msg) => { const why = ACCEPT[dim + '|' + who]; if (why) accepted.push({dim, who, msg, why}); else flags.push({dim, who, msg}); };
const P = s => out.push(s);

// ---------- 1 · power for its tier (rate) and 2 · inner-tribe parity
const tierMed = {};
for (let t = 1; t <= 6; t++) tierMed[t] = med(names.filter(n => CARDS[n] && ms[n].tier === t).map(n => CARDS[n].rate));
for (const n of names) { const c = CARDS[n]; if (!c) continue;
  if (c.rate > tierMed[c.tier] + T.rateHigh) flag('Power for tier', n, `effect worth ${f2(c.rate)} vs tier ${c.tier} median ${f2(tierMed[c.tier])}`);
  if (c.rate < tierMed[c.tier] - (ms[n].tribe === 'Neutral' ? NEUTRAL_LOW : T.rateLow)) flag('Power for tier', n, `effect worth ${f2(c.rate)} vs tier ${c.tier} median ${f2(tierMed[c.tier])}`);
}
for (const tr of TRIBES) for (let t = 1; t <= 6; t++) {
  const cs = names.filter(n => ms[n].tribe === tr && ms[n].tier === t && CARDS[n]);
  if (cs.length < 2) continue;
  const v = cs.map(n => CARDS[n].rate), hi = cs[v.indexOf(Math.max(...v))], lo = cs[v.indexOf(Math.min(...v))];
  if (Math.max(...v) - Math.min(...v) > T.parity) flag('Inner-tribe parity', `${tr} tier ${t}`, `${hi} ${f2(CARDS[hi].rate)} vs ${lo} ${f2(CARDS[lo].rate)}`);
}
// ---------- 3 · dominance and redundancy (static)
for (const a of names) for (const b of names) if (dominates(ms[a], ms[b])) flag('Dominance', `${a} > ${b}`, `same effect, same or lower tier, at least as big in every number`);
for (const tr of TRIBES) {
  const bySig = {};
  for (const n of names.filter(n => ms[n].tribe === tr)) for (const p of ms[n].parts) if (p.effects.length) (bySig[sig(p)] = bySig[sig(p)] || []).push(n);
  for (const [s, ns] of Object.entries(bySig)) if (new Set(ns).size > T.dupMax) flag('Redundancy', tr, `${new Set(ns).size} cards share "${s}": ${[...new Set(ns)].join(', ')}`);
  const trig = {}; let tot = 0;
  for (const n of names.filter(n => ms[n].tribe === tr)) for (const t of ms[n].triggers) if (!['KW', 'OTHER'].includes(t)) { trig[t] = (trig[t] || 0) + 1; tot++; }
  const top = Object.entries(trig).sort((a, b) => b[1] - a[1])[0];
  if (top && tr !== 'Neutral' && top[1] / tot > T.triggerShare) flag('Variety', tr, `${top[1]} of ${tot} triggers are ${top[0]}`);
}
// ---------- 4 · tribe play curve: tier holes/spikes, style coverage, phase win rates
const gTier = {}; for (let t = 1; t <= 6; t++) gTier[t] = mean(names.filter(n => CARDS[n] && ms[n].tier === t).map(n => CARDS[n].raw));
for (const tr of TRIBES.filter(t => t !== 'Neutral')) for (let t = 1; t <= 6; t++) {
  const v = mean(names.filter(n => ms[n].tribe === tr && ms[n].tier === t && CARDS[n]).map(n => CARDS[n].raw));
  if (gTier[t] > 0.15 && v < T.tierHole * gTier[t]) flag('Tribe curve', `${tr} tier ${t}`, `cards worth ${v.toFixed(2)} places on average vs ${gTier[t].toFixed(2)} for all tribes (a hole)`);
  if (gTier[t] > 0.15 && v > T.tierSpike * gTier[t]) flag('Tribe curve', `${tr} tier ${t}`, `cards worth ${v.toFixed(2)} places on average vs ${gTier[t].toFixed(2)} for all tribes (a spike)`);
}
for (const st of Object.keys(STYLES)) for (let t = 1; t <= 4; t++) {
  const has = names.some(n => ms[n].style === st && ms[n].tier === t);
  if (!has) flag('Style coverage', `${STYLES[st][0]} / ${STYLES[st][1]}`, `no card for this style at tier ${t}`);
}
// ---------- 5 · timing
for (const n of names) { const c = CARDS[n]; if (!c || c.tier > 2) continue;
  if (c.late - c.rate > T.lateGain) flag('Timing', n, `worth ${f2(c.late)} bought 3 turns late vs ${f2(c.rate)} on curve: an early card that scales late`); }
// ---------- 6 · cohesion
for (const tr of TRIBES.filter(t => t !== 'Neutral')) {
  const cs = names.filter(n => ms[n].tribe === tr && CARDS[n] && CARDS[n].synergy != null);
  const share = cs.filter(n => CARDS[n].synergy > T.synergyMin).length / cs.length;
  if (share < T.cohesionShare) flag('Cohesion', tr, `only ${pct(share)} of its cards are worth more inside the tribe`);
  for (const n of cs) if (CARDS[n].off > T.generic && CARDS[n].synergy < T.synergyMin) flag('Cohesion', n, `generic power: worth ${f2(CARDS[n].off)} to other tribes, ${f2(CARDS[n].rate)} to its own`);
}
// ---------- 7 · archetypes, variance, skill
if (STY) for (const lv of ['skill0', 'skill1']) {
  const s = STY[lv], keys = Object.keys(s).filter(k => k !== 'BASE'), avgs = keys.map(k => s[k].avg);
  const band = Math.max(...avgs) - Math.min(...avgs), lim = lv === 'skill0' ? T.band : T.band + 0.3;
  const noise = Math.max(...keys.map(k => s[k].halfDiff || 0));
  if (lv === 'skill0') P(`Noise check: the two halves of the style run disagree by up to ${noise.toFixed(2)} places, so differences smaller than about ${(noise / 2).toFixed(2)} between styles are not meaningful.\n`);
  if (band > lim) flag('Archetypes', lv, `placement band ${band.toFixed(2)} (target ≤ ${lim.toFixed(2)})`);
  for (const k of keys) {
    const r = s[k], nm = `${STYLES[k][0]} / ${STYLES[k][1]} (${lv})`;
    if (s.BASE && r.avg > s.BASE.avg + (lv === 'skill0' ? 0 : 0.15)) flag('Archetypes', nm, `places ${r.avg.toFixed(2)}, worse than the big-stats bot (${s.BASE.avg.toFixed(2)})`);
    if (lv === 'skill0') {
      if (r.first < T.firstLo || r.first > T.firstHi) flag('Variance', nm, `wins ${pct(r.first)} of lobbies (target ${pct(T.firstLo)}–${pct(T.firstHi)})`);
      if (r.eighth > T.eighthHi) flag('Variance', nm, `finishes 8th in ${pct(r.eighth)} of lobbies`);
      // compared with the average of all styles in that phase (late phases only contain survivors, so raw rates run high)
      for (const [ph, w] of Object.entries(r.phase)) { const avg = mean(keys.map(k2 => s[k2].phase[ph]).filter(x => x != null));
        if (w != null && Math.abs(w - avg) > T.phaseDev) flag('Tribe curve', nm, `${ph} game: wins ${pct(w)} of decided fights vs ${pct(avg)} for all styles`); }
    }
  }
}
// ---------- 8 · uptake
if (STY && STY.uptake) {
  const U = STY.uptake, rate = n => U[n] && U[n].offered > 30 ? U[n].bought / U[n].offered : null;
  for (let t = 1; t <= 6; t++) {
    const ns = names.filter(n => ms[n].tier === t && rate(n) != null), m = med(ns.map(rate));
    for (const n of ns) { const r = rate(n);
      if (r < T.buyLow * m) flag('Uptake', n, `bought ${pct(r)} of the times it is offered (tier ${t} median ${pct(m)})`);
      if (r > T.buyHigh * m) flag('Uptake', n, `bought ${pct(r)} of the times it is offered (tier ${t} median ${pct(m)})`); }
  }
}

// ---------- write
const dims = ['Power for tier', 'Inner-tribe parity', 'Dominance', 'Redundancy', 'Variety', 'Tribe curve', 'Style coverage', 'Timing', 'Cohesion', 'Archetypes', 'Variance', 'Uptake'];
P('# Balance report\n');
P(`Generated from \`${process.argv[2].split('/').pop()}\`${STY ? ` and \`${process.argv[3].split('/').pop()}\`` : ''}. Method: \`docs/balance-method.md\`.\n`);
P('| Dimension | Flags |\n| --- | --- |');
for (const d of dims) P(`| ${d} | ${flags.filter(f => f.dim === d).length} |`);
for (const d of dims) {
  const fs_ = flags.filter(f => f.dim === d); if (!fs_.length) continue;
  P(`\n## ${d}\n`);
  for (const f of fs_) P(`- **${f.who}:** ${f.msg}`);
}
if (accepted.length) { P('\n## Accepted on purpose\n'); for (const f of accepted) P(`- **${f.who}** (${f.dim}): ${f.msg}. *Why it stays:* ${f.why}`); }
P('\n## Card table\n');
P('Values are average places gained by the bot that got the card. "Effect" is the card minus a plain minion of its tier; "Late" is bought 3 turns after its tier opens; "Outside" is in a bot of another tribe; "Synergy" is Effect minus Outside. "Bought" is how often bots hire it when it is offered.\n');
for (const tr of TRIBES) {
  P(`\n### ${tr === 'Neutral' ? 'Neighbours' : tr + 's'}\n`);
  P('| Tier | Card | Style | Raw | Effect | Late | Outside | Synergy | Bought | Triggers |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const n of names.filter(n => ms[n].tribe === tr).sort((a, b) => ms[a].tier - ms[b].tier)) {
    const c = CARDS[n] || {}, u = STY && STY.uptake && STY.uptake[n];
    P(`| ${ms[n].tier} | ${n} | ${ms[n].style} | ${f2(c.raw)} | ${f2(c.rate)} | ${f2(c.late)} | ${f2(c.off)} | ${f2(c.synergy)} | ${u && u.offered ? pct(u.bought / u.offered) : '–'} | ${ms[n].triggers.join(', ')} |`);
  }
}
if (STY) {
  P('\n## Styles\n');
  P('| Style | Avg place | Halves differ by | 1st | Top 4 | 8th | Early (1–4) | Mid (5–8) | Late (9–12) | End (13+) | Avg place (skill 1) |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const k of Object.keys(STY.skill0).sort((a, b) => STY.skill0[a].avg - STY.skill0[b].avg)) {
    const r = STY.skill0[k], r1 = STY.skill1[k];
    P(`| ${k === 'BASE' ? 'Big stats (BASE)' : STYLES[k][0] + ' / ' + STYLES[k][1]} | ${r.avg.toFixed(2)} | ${r.halfDiff != null ? r.halfDiff.toFixed(2) : '–'} | ${pct(r.first)} | ${pct(r.top4)} | ${pct(r.eighth)} | ${pct(r.phase.early)} | ${pct(r.phase.mid)} | ${pct(r.phase.late)} | ${pct(r.phase.end)} | ${r1 ? r1.avg.toFixed(2) : '–'} |`);
  }
}
console.log(out.join('\n'));
fs.writeFileSync(__dirname + '/../../docs/balance/flags.json', JSON.stringify(flags, null, 1));
