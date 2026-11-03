// Bot skill check: 4 bots at skill A vs 4 bots at skill B in each lobby.
globalThis.window = globalThis;
require('./data.js'); require('./engine.js'); require('./lobby.js');
const E = LSEngine; E.load(LS_CARDS, LS_STYLES);
const N = +process.argv[2] || 600, A = +(process.argv[3] ?? 0), B = +(process.argv[4] ?? 1);
const st = {A: [], B: []};
for (let i = 0; i < N; i++) {
  const L = new LSLobby(3000 + i, {skill: 1});
  L.players.forEach((p, j) => { p.skill = j % 2 ? B : A; p.grp = j % 2 ? 'B' : 'A'; });
  while (!L.over() && L.turn < 30) { L.botTurns(); L.fightRound(); }
  for (const p of L.players) st[p.grp].push(p.place || 1);
}
for (const k of ['A', 'B']) console.log(k, k === 'A' ? A : B, (st[k].reduce((a, b) => a + b, 0) / st[k].length).toFixed(2));
