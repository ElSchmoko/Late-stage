// Card strength check: per card, how much it contributes while on a board.
globalThis.window = globalThis;
require('./data.js'); require('./engine.js'); require('./lobby.js');
const E = LSEngine; E.load(LS_CARDS, LS_STYLES);
const N = +process.argv[2] || 600;
const S = {};  // name -> {turns, given, self, fights, wins, tierSum}
const st = n => S[n] = S[n] || {turns: 0, given: 0, selfSum: 0, fights: 0, wins: 0, late: 0, lateSelf: 0};
const origBuff = E.Player.prototype.buff;
E.Player.prototype.buff = function (m, a, h, src) {
  const before = m.atk + m.hp; origBuff.call(this, m, a, h, src);
  if (src && src !== m && !src.follower) st(src.name).given += (m.atk + m.hp) - before;
};
const origT = E.Player.prototype.tbuff;
E.Player.prototype.tbuff = function (m, a, h, src) { origT.call(this, m, a, h, src); if (src && src !== m) st(src.name).given += (a + h) * 0.5; };
for (let i = 0; i < N; i++) {
  const L = new LSLobby(5000 + i);
  while (!L.over() && L.turn < 30) {
    L.botTurns();
    for (const p of L.alive()) for (const m of p.board) if (!m.follower) { const s = st(m.name); s.turns++; s.selfSum += m.atk + m.hp; if (L.turn >= 8) { s.late++; s.lateSelf += m.atk + m.hp; } }
    L.fightRound();
    for (const r of L.results) for (const [p, won] of [[r.a, r.winner === r.a], [r.b, r.winner === r.b]]) if (p) for (const m of new Set(p.board.map(x => x.name))) { const s = st(m); s.fights++; s.wins += won ? 1 : 0; }
  }
}
const rows = [];
for (const c of LS_CARDS) {
  const s = S[c.name]; if (!s) { rows.push([c.tribe, c.tier, c.name, 0]); continue; }
  rows.push([c.tribe, c.tier, c.name, s.turns, (s.selfSum / s.turns).toFixed(1), (s.given / s.turns).toFixed(1), s.late ? (s.lateSelf / s.late).toFixed(1) : '-', (100 * s.wins / Math.max(1, s.fights)).toFixed(0)]);
}
rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1]);
console.log('tribe\ttier\tname\tturns\tself\tgiven/turn\tlateSelf\twin%');
for (const r of rows) console.log(r.join('\t'));
