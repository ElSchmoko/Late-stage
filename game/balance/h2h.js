// Head to head: half the seats play the pro bot, half the reference bot; every lobby is played twice with the seats swapped.
// usage: node h2h.js N proSkill ref(std|exp|pro0) offList
globalThis.window = globalThis; const G = process.env.GAME || '/home/claude/late-stage/game/';
require(G + 'data.js'); require(G + 'engine.js'); require(G + 'lobby.js'); const E = LSEngine; E.load(LS_CARDS, LS_STYLES);
const N = +process.argv[2] || 100, PS = +process.argv[3], REF = process.argv[4] || 'exp';
for (const k of (process.argv[5] || '').split(',').filter(Boolean)) E.PRO.off[k] = true;
const OVR = {}; for (const kv of (process.argv[6] || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); OVR[k] = +v; }
const pl = {pro: [], ref: []}; let tPro = 0, nPro = 0;
for (let i = 0; i < N; i++) for (const par of [0, 1]) {
  const L = new LSLobby(52000 + i, {skill: 0});
  L.players.forEach((p, k) => {
    p.isPro = k % 2 === par;
    if (p.isPro) { p.pro = true; p.prm = Object.assign({}, E.PRO, OVR); p.v2 = !process.env.NOV2; p.expert = true; p.skill = PS; p.kn = E.knobsFor(PS); p.persona = E.personaFor(p); }
    else if (REF === 'pro') { p.pro = true; p.v2 = false; p.expert = true; p.skill = 1; p.kn = E.knobsFor(1); p.persona = E.personaFor(p); }
    else if (REF === 'exp') { p.skill = 1; p.expert = true; p.kn = E.knobsFor(1); }
    else if (REF === 'std') { p.skill = 0; p.expert = false; p.kn = E.knobsFor(0); }
  });
  while (!L.over() && L.turn < 30) {
    for (const p of L.alive()) p.scout = L.alive().filter(q => q !== p && q.lastSeen).map(q => ({board: q.lastSeen, hero: q.hero, power: q.lastSeen.reduce((s, m) => s + m.atk + m.hp, 0), next: L.nextOpponentFor(p) === q}));
    for (const p of L.alive()) { p.aliveCount = L.alive().length; const t0 = process.hrtime.bigint(); p.takeTurn(); if (p.isPro) { tPro += Number(process.hrtime.bigint() - t0) / 1e6; nPro++; } }
    L.fightRound();
  }
  for (const p of L.players) pl[p.isPro ? 'pro' : 'ref'].push(p.place || 1);
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length, se = a => Math.sqrt(avg(a.map(x => (x - avg(a)) ** 2)) / a.length);
console.log(`[${process.argv[5] || ""} ${process.argv[6] || ""}] pro ${PS} vs ${REF}: pro ${avg(pl.pro).toFixed(2)}±${se(pl.pro).toFixed(2)}  ref ${avg(pl.ref).toFixed(2)}  top1 pro ${(pl.pro.filter(x => x === 1).length / pl.pro.length * 100).toFixed(0)}%  | ${(tPro / nPro).toFixed(1)} ms/turn`);
