// Ladder check: a bot of fixed skill climbs from 0 in rating-matched lobbies; prints where its rating settles.
globalThis.window = globalThis;
require('./data.js'); require('./engine.js'); require('./lobby.js');
const E = LSEngine; E.load(LS_CARDS, LS_STYLES);
const games = +process.argv[2] || 150;
for (const s of (process.argv[3] || '0,0.25,0.5,0.75,1').split(',').map(Number)) {
  let R = 0; const hist = [];
  for (let g = 0; g < games; g++) {
    const L = new LSLobby(50000 + g * 7 + Math.round(s * 1000), {rating: R});
    const me = L.players[0]; me.skill = s; me.rating = R;
    while (!L.over() && L.turn < 30) { L.botTurns(); L.fightRound(); }
    for (const p of L.players) if (!p.place) p.place = 1;
    let d = 0; for (const q of L.players) if (q !== me) { const S = me.place < q.place ? 1 : me.place > q.place ? 0 : .5; d += S - 1 / (1 + Math.pow(10, (q.rating - R) / 400)); }
    R = Math.max(0, R + Math.round(40 * d)); hist.push(R);
  }
  const tail = hist.slice(-Math.floor(games / 2));
  console.log('skill', s, 'settles at', Math.round(tail.reduce((a, b) => a + b, 0) / tail.length), 'after', games, 'games; last', R);
}
