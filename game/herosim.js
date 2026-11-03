// Hero balance: average placement per hero across all-bot lobbies (standard bots).
// Usage: node game/herosim.js N [boundaries-json] [tune-json]
globalThis.window = globalThis;
require('./data.js'); require('./engine.js'); require('./lobby.js');
const E = LSEngine; E.load(LS_CARDS, LS_STYLES);
const N = +process.argv[2] || 600;
const HEROES = LS_HEROES.map(h => h.slug), ARM = Object.fromEntries(LS_HEROES.map(h => [h.slug, h.boundaries]));
if (process.argv[3]) Object.assign(ARM, JSON.parse(process.argv[3]));
if (process.argv[4]) E.tune(JSON.parse(process.argv[4]));
const st = {};
for (let i = 0; i < N; i++) {
  if (process.env.DBG) process.stderr.write(i + " ");
  const rng = E.RNG(777 + i);
  const hs = rng.shuffle(HEROES.slice()).slice(0, 8);
  const L = new LSLobby(9000 + i, {botHeroes: hs, skill: 0});
  for (const p of L.players) p.boundaries = ARM[p.hero];
  while (!L.over() && L.turn < 30) { L.botTurns(); L.fightRound(); }
  for (const p of L.players) (st[p.hero] = st[p.hero] || []).push(p.place || 1);
}
const rows = Object.entries(st).map(([k, v]) => [k, v.length, (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2), ARM[k]]).sort((a, b) => a[2] - b[2]);
for (const r of rows) console.log(r.join('\t'));
