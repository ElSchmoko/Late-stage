globalThis.window = globalThis;
require('./data.js'); require('./engine.js'); require('./lobby.js');
LSEngine.load(LS_CARDS, LS_STYLES);
const stats = {};
let lengths = 0, frames = 0, fights = 0;
const N = +process.argv[2] || 300;
for (let i = 0; i < N; i++) {
  const L = new LSLobby(1000 + i);
  while (!L.over() && L.turn < 30) { L.botTurns(); L.fightRound(); for (const r of L.results) { frames += r.fight.frames.length; fights++; } }
  for (const p of L.players) { if (!p.place) p.place = 1; (stats[p.style_code] = stats[p.style_code] || []).push(p.place); }
  lengths += L.turn;
}
const rows = Object.entries(stats).map(([k, v]) => [k, v.length, (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2)]).sort((a, b) => a[2] - b[2]);
console.log('avg length', (lengths / N).toFixed(1), 'avg frames/fight', (frames / fights).toFixed(1));
for (const r of rows) console.log(r.join('\t'));
