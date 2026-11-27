// Tribe board calculator: the stats a tribe's board reaches by a given turn, worked out from the numbers in the card
// texts. No game engine, no battles, no randomness, no bot decisions: every card is a written formula (RULES below),
// and the turn-by-turn arithmetic uses fixed, stated assumptions (ASSUME) for gold, levelling, buys and battle counts.
// A search tries board combinations and keeps the one with the most stats at the target turn.
//
//   node tools/tribe_calc.js [turns=3,6,9,13] [--no-battle]
//     -> prints the tables, writes docs/tribe-calc.md and tools/tribe_calc.json
globalThis.window = globalThis;
require('../game/data.js');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const TARGETS = (args.find(a => /^[\d,]+$/.test(a)) || '3,6,9,13').split(',').map(Number);
let BATTLE = !args.includes('--no-battle');
const TRIBES = ['Hustler', 'Influencer', 'Feral', 'Creative', 'Techie', 'Punk', 'Philosopher'];
const CARDS = LS_CARDS.filter(c => !c.token && c.name !== 'Follower');
const BY = Object.fromEntries(CARDS.map(c => [c.name, c]));

// ---------------------------------------------------------------- assumptions (all from the game's numbers, or stated)
const CURVE = {1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 6};            // shop tier by turn (engine)
const LEVEL_COST = {2: 5, 3: 7, 4: 8, 5: 9, 6: 10};                                      // engine; 1 cheaper per turn waited
const phase = t => t <= 4 ? 0 : t <= 7 ? 1 : t <= 10 ? 2 : 3;                            // early, mid, late, exit
const ASSUME = {
  attacks: [1, 1.5, 2, 2],          // attacks per minion per battle
  deaths: [2, 4, 5, 6],             // friendly minions that die per battle
  enemyDeaths: [1, 2, 2, 3],        // enemy minions that die to start-of-combat damage
  survives: 1,                      // times an Attention Seeker survives damage per battle
  hits: 2,                          // times an Attention Seeker takes damage per battle
  enemyAtk: [3, 6, 12, 25],         // the Attack of a typical enemy minion
  cycles: 6,                        // at most this many buy-and-sell cycles per turn
};
const TIER_AVG = {1: [2, 2], 2: [2, 3], 3: [3, 4], 4: [4, 5], 5: [5, 7], 6: [6, 8]};   // a filler minion's body (tier averages)
const feedBest = (tier, buff, tribe) => {   // the biggest minion you'd see in the Feed: one of the tribe with its Feed buff, or any other
  const cs = CARDS.filter(c => c.tier <= tier && !c.legendary), tc = cs.filter(c => c.tribe === tribe);
  const mx = (arr, k) => Math.max(0, ...arr.map(c => c[k]));
  return {a: Math.max(mx(cs, 'atk'), mx(tc, 'atk') + (buff ? buff.a : 0)), h: Math.max(mx(cs, 'hp'), mx(tc, 'hp') + (buff ? buff.h : 0))};
};

// ---------------------------------------------------------------- helpers
const isT = (m, t, st) => m.c.tribe === t || m.c.tribe2 === t || (m.techie && t === 'Techie') || (t === 'Creative' && st && st.crossover > 0 && !m.follower);
const tribesOf = st => new Set(st.board.flatMap(m => [m.c.tribe, m.c.tribe2, m.techie ? 'Techie' : null]).filter(x => x && x !== 'Neutral' && x !== 'Follower')).size;
const others = (st, m, t) => st.board.filter(o => o !== m && (!t || isT(o, t, st)));
const big = arr => arr.length ? arr.reduce((a, o) => (o.atk + o.hp > a.atk + a.hp ? o : a)) : null;
const small = arr => arr.length ? arr.reduce((a, o) => (o.atk + o.hp < a.atk + a.hp ? o : a)) : null;
const nbrs = (st, m) => { const i = st.board.indexOf(m); return [st.board[i - 1], st.board[i + 1]].filter(Boolean); };
function buff(st, m, a, h, kind = 'perm', src = null) {
  if (!m) return;
  if (st.inEot && src && isT(m, 'Feral', st)) { a *= st.oak; h *= st.oak; }   // Ancient Oak
  if (kind === 'temp') { m.ta += a; m.th += h; } else { m.atk += a; m.hp += h; }
  if (st.track && src) st.track[src.c.name] = (st.track[src.c.name] || 0) + a + h;
}
const pDie = st => Math.min(1, ASSUME.deaths[phase(st.t)] / Math.max(1, st.board.length));
const gold = (st, n) => { st.goldNext += n; };
const likes = (st, n) => { st.likes += n; };
const feedBuff = (st, t, a, h) => { const b = st.feed[t] = st.feed[t] || {a: 0, h: 0}; b.a += a; b.h += h; };
function summonFollower(st, src) {
  if (st.board.length >= 7) return null;
  const f = {c: {name: 'Follower', tribe: 'Philosopher', atk: 1, hp: 1}, g: 1, atk: 1 + (st.followerBuff.a), hp: 1 + st.followerBuff.h, ta: 0, th: 0, turns: 0, follower: true};
  st.board.push(f); st.followersSummoned++;
  for (const o of st.board) if (o.c.name === 'The Academy') buff(st, f, 5 * o.g, 5 * o.g, 'perm', o);
  return f;
}

// ---------------------------------------------------------------- the cards: one formula per card text that changes board stats or gold.
// g = 2 for a golden copy. Hooks: fi (First Impression), eot (end of turn), sot (start of turn), hire (after you hire/play a card),
// sell (after you sell a minion), sold (its own When sold), scroll (after a Scroll; k = the Scroll's number this turn), gig (Side Gig),
// spend (every 4 gold you spend; n = how many times this turn), battle (permanent gains from one battle). Cards with none only add their body.
const R = {
  // Hustlers
  'Dropshipper': {fi: (st, m) => gold(st, m.g)},
  'Unpaid Intern': {sellGold: 1},
  'Grindset Guru': {hire: (st, m, x) => { if (x !== m && isT(x, 'Hustler', st)) buff(st, m, m.g, m.g, 'perm', m); }},
  'Sneaker Reseller': {sell: (st, m) => { if (st.used(m, 'sr', 1)) for (const o of others(st, null, 'Hustler')) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); }},
  'Side Hustle': {gig: {cost: 1, fn: (st, m) => buff(st, big(others(st, m, 'Hustler')), 3 * m.g, 3 * m.g, 'perm', m)}},
  'Thought Leader': {spend: (st, m, n) => { for (const o of others(st, m, 'Hustler')) buff(st, o, n * m.g, n * m.g, 'perm', m); }},
  'Crypto Bro': {fi: (st, m) => gold(st, m.g)},   // between -1 and +3: +1 on average
  'Golden Parachute Exec': {battle: (st, m) => gold(st, 2 * m.g * pDie(st))},
  'Venture Capitalist': {fi: (st, m) => { const k = Math.min(4, st.gold); st.gold -= k; st.spent += k; buff(st, big(others(st, m)), 3 * k * m.g, 3 * k * m.g, 'perm', m); }},
  'Consultant': {every: 3, spend: (st, m, n) => buff(st, m, 4 * n * m.g, 4 * n * m.g, 'perm', m)},
  'Private Equity': {eot: (st, m) => { const f = feedBest(st.tier, st.feed[st.tribe], st.tribe); buff(st, m, Math.floor(f.a / 2) * m.g, Math.floor(f.h / 2) * m.g, 'perm', m); }},
  'Unicorn Startup': {eot: (st, m) => { const k = Math.floor(st.spent / 4); for (const o of others(st, m, 'Hustler')) buff(st, o, 2 * k * m.g, 2 * k * m.g, 'perm', m); }},
  'Too Big to Fail': {battle: (st, m) => { if (phase(st.t) >= 2) for (const o of others(st, m, 'Hustler')) buff(st, o, 3 * m.g, 3 * m.g, 'perm', m); }},
  'Performance Review': {eot: (st, m) => { for (const o of others(st, m, 'Hustler')) buff(st, o, m.g, m.g, 'perm', m); }},   // the +1/+1 it takes is a transfer
  'Loyalty Card': {spend: (st, m, n) => buff(st, nbrs(st, m)[0], 3 * n * m.g, 3 * n * m.g, 'perm', m)},
  'Delivery Rider': {gig: {cost: 1, fn: (st, m) => buff(st, m, 2 * m.g, m.g, 'perm', m)}},
  'Five-Star Rating': {eot: (st, m) => { if (st.gigs) for (const o of nbrs(st, m)) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); }},
  'Double Shift': {gigsTwice: true},
  'Platform Monopoly': {afterGig: (st, m) => { for (const o of st.board) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); }},
  'Cashback Card': {spend: (st, m, n) => { st.gold += Math.min(2, n) * m.g; }},
  'Recruitment Agency': {sell: (st, m) => { if (st.used(m, 'ra', 2) && st.board.length < 7) st.board.push(mk(BY['Unpaid Intern'], 1, st)); }},
  'The Billionaire': {eot: (st, m) => buff(st, m, 3 * st.gold * m.g, 3 * st.gold * m.g, 'perm', m), keepGold: true},
  'Tech Founder': {spend: (st, m, n) => { feedBuff(st, 'Hustler', 2 * n * m.g, 2 * n * m.g); feedBuff(st, 'Techie', 2 * n * m.g, 2 * n * m.g); }},
  'Pension Fund': {eot: (st, m) => buff(st, m, 2 * m.g, 2 * m.g, 'perm', m)},
  // Influencers
  'Engagement Bot': {fi: (st, m) => likes(st, 2 * m.g)},
  'Stan Account': {eot: (st, m) => likes(st, 2 * m.g)},
  'Hype Man': {battle: (st, m) => likes(st, m.g * st.att(m))},
  'Personal Brand': {fi: (st, m) => { likes(st, 2 * m.g); st.likeBonus += 1; }},
  'Ring Light Studio': {fi: (st, m) => likes(st, 2 * m.g)},
  'Main Character': {battle: (st, m) => likes(st, 3 * m.g * st.att(m))},
  'Thirst Trap': {battle: (st, m) => likes(st, Math.min(2, ASSUME.deaths[phase(st.t)]) * m.g)},
  'Reaction Streamer': {battle: (st, m) => buff(st, m, m.g * st.att(m), 0, 'perm', m)},
  'Donation Goal': {battle: (st, m) => gold(st, m.g)},
  'Hype Train': {battle: (st, m) => { for (const o of st.board) if (st.clock(o)) buff(st, o, 2 * m.g * st.att(o), 2 * m.g * st.att(o), 'perm', m); }},
  'Streamer House': {battle: (st, m) => { const x = Math.round(st.board.length * ASSUME.attacks[phase(st.t)] / 2); for (const o of others(st, m).slice(0, 2)) buff(st, o, x * m.g * st.att(m), x * m.g * st.att(m), 'perm', m); }},
  'Paid Verification': {gig: {cost: 1, fn: (st, m) => likes(st, 2 * m.g)}},
  'Troll': {battle: (st, m) => buff(st, m, 0, m.g * ASSUME.survives, 'perm', m)},
  'Rage Baiter': {battle: (st, m) => buff(st, m, 2 * m.g * ASSUME.survives, 2 * m.g * ASSUME.survives, 'perm', m)},
  'Prank Vlogger': {battle: (st, m) => buff(st, nbrs(st, m).find(o => isT(o, 'Influencer', st)), 2 * m.g, 2 * m.g, 'perm', m)},
  'Apology Video': {battle: (st, m) => { for (const o of others(st, m, 'Influencer')) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); }},
  'Shock Jock': {battle: (st, m) => { for (const o of others(st, m, 'Influencer')) buff(st, o, ASSUME.hits * m.g, ASSUME.hits * m.g, 'perm', m); }},
  'Drama Channel': {battle: (st, m) => { for (const o of st.board) if (o.c.taunt) buff(st, o, m.g * ASSUME.survives, 0, 'perm', m); }},
  'Content Creator': {hire: (st, m, x) => { if (x !== m && (isT(x, 'Influencer', st) || isT(x, 'Creative', st))) likes(st, 2 * m.g); }},
  'Controversy Magnet': {battle: (st, m) => { for (const o of others(st, m)) if (o.c.taunt) buff(st, o, ASSUME.hits * m.g, ASSUME.hits * m.g, 'perm', m); }},
  'Sponsored Streamer': {battle: (st, m) => gold(st, Math.min(2, st.att(m)) * m.g),
    gig: {cost: 2, fn: (st, m) => { for (const o of st.board) if (isT(o, 'Influencer', st) || isT(o, 'Techie', st)) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); }}},
  // Ferals
  'Windowsill Succulent': {eot: (st, m) => { if (others(st, m, 'Feral').length) buff(st, m, m.g, m.g, 'perm', m); }},
  'City Pigeon': {scroll: (st, m, k) => { if (k <= 2) buff(st, m, m.g, m.g, 'perm', m); }, scrollCap: 2},
  'Trash Panda': {battle: (st, m) => { const p = pDie(st); for (const o of others(st, m, 'Feral')) buff(st, o, m.g * p, m.g * p, 'perm', m); }},
  'Compost Heap': {battle: (st, m) => feedBuff(st, 'Feral', m.g * pDie(st), m.g * pDie(st))},
  'Plant Parent': {eot: (st, m) => { for (const o of others(st, m, 'Feral').slice(0, 2)) buff(st, o, m.g, m.g, 'perm', m); }},
  'Urban Fox': {battle: (st, m) => buff(st, big(others(st, m, 'Feral')), 2 * m.g * st.att(m), 2 * m.g * st.att(m), 'perm', m)},
  'Rooftop Beehive': {eot: (st, m) => { for (const o of nbrs(st, m)) if (isT(o, 'Feral', st)) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); }},
  'Guerrilla Gardener': {eot: (st, m) => feedBuff(st, 'Feral', 2 * m.g, 2 * m.g)},
  'Ancient Oak': {oak: true},
  'World Tree': {eot: (st, m) => { for (const o of others(st, m, 'Feral')) buff(st, o, 4 * m.g, 4 * m.g, 'perm', m); }},
  'Seagull': {scroll: (st, m, k) => { if (k <= 2) buff(st, big(others(st, m, 'Feral')), m.g, m.g, 'perm', m); }, scrollCap: 2},
  'Rat King': {scroll: (st, m, k) => { if (k <= 2) { const f = feedBest(st.tier, st.feed.Feral, 'Feral'); buff(st, m, f.a * m.g, f.h * m.g, 'perm', m); } }, scrollCap: 2},
  'Nature Is Healing': {scroll: (st, m, k) => { if (k <= 4) for (const o of others(st, m, 'Feral')) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); }, scrollCap: 4},
  'Magpie': {magpie: true},
  'Allotment': {eot: (st, m) => buff(st, big(others(st, m, 'Feral')), Math.min(3, others(st, null, 'Feral').length) * m.g, Math.min(3, others(st, null, 'Feral').length) * m.g, 'perm', m)},
  'Tulip Bulb': {eot: (st, m) => { if (m.turns === 2) buff(st, m, 3 * m.g, 2 * m.g, 'perm', m); }},
  'Hedgehog': {eot: (st, m) => { if (m.turns === 2) buff(st, m, 2 * m.g, 2 * m.g, 'perm', m); }},
  'Bat Colony': {eot: (st, m) => { const o = others(st, null, 'Feral').reduce((a, x) => (x.turns > a.turns ? x : a), m); buff(st, o, Math.min(4, o.turns) * m.g, Math.min(4, o.turns) * m.g, 'perm', m); }},
  'Hibernating Bear': {eot: (st, m) => { if (m.turns % 3 === 0 && (m.dbl || 0) < 3 && m.dblTurn !== st.t) { m.dblTurn = st.t; m.dbl = (m.dbl || 0) + 1; const a = m.atk * m.g, h = m.hp * m.g; m.atk += a; m.hp += h; if (st.track) st.track[m.c.name] = (st.track[m.c.name] || 0) + a + h; } }},   // once per turn, 3 times a game, not doubled by Ancient Oak (engine)
  'Cicada Swarm': {eot: (st, m) => { if (m.turns === 3) { for (const o of others(st, m, 'Feral')) buff(st, o, 6 * m.g, 6 * m.g, 'perm', m); m.dead = true; } }},
  'Seed Vault': {eot: (st, m) => { for (const o of others(st, m, 'Feral')) buff(st, o, Math.min(4, o.turns) * m.g, Math.min(4, o.turns) * m.g, 'perm', m); }},
  'Fox Den': {battle: (st, m) => { const n = st.board.filter(o => isT(o, 'Feral', st) && (o.c.rebrand || o.rebrand)).length * pDie(st); for (const o of others(st, m, 'Feral').slice(0, Math.round(n))) buff(st, o, 3 * m.g, 3 * m.g, 'perm', m); }},
  'Botanical Garden': {eot: (st, m) => { const n = st.board.filter(o => isT(o, 'Feral', st)).length; feedBuff(st, 'Feral', n * m.g, n * m.g); }},
  'Apex Scavenger': {eot: (st, m) => { const x = Math.floor(feedBest(st.tier, st.feed.Feral, 'Feral').a / 2); for (const o of others(st, m, 'Feral')) buff(st, o, x * m.g, x * m.g, 'perm', m); }},
  'Wise Old Owl': {eot: (st, m) => { const k = tribesOf(st); for (const o of st.board) if (isT(o, 'Feral', st) || isT(o, 'Philosopher', st)) buff(st, o, k * m.g, k * m.g, 'perm', m); }},
  // Creatives
  'Busker': {hire: (st, m, x) => { if (x !== m && isT(x, 'Creative', st)) for (let r = 0; r < st.tour; r++) buff(st, m, m.g, m.g, 'perm', m); }},
  'Open Mic Poet': {battle: (st, m) => { for (const o of nbrs(st, m)) buff(st, o, 2 * m.g * pDie(st) * st.lawyer, 2 * m.g * pDie(st) * st.lawyer, 'perm', m); }},
  'Art Student': {fi: (st, m) => buff(st, big(others(st, m, 'Creative')), 3 * m.g, 3 * m.g, 'perm', m)},
  'Merch Stand': {hire: (st, m, x) => { if (x !== m && isT(x, 'Creative', st)) for (let r = 0; r < st.tour; r++) if (st.used(m, 'ms', 2)) gold(st, m.g); }},
  'Memorial Mural': {battle: (st, m) => { const k = Math.floor(ASSUME.deaths[phase(st.t)] / 2) * m.g; st.creativeAtk += k; for (const o of st.board) if (isT(o, 'Creative', st)) buff(st, o, k, 0, 'perm', m); }},
  'Indie Band': {hire: (st, m, x) => { if (x !== m && isT(x, 'Creative', st)) for (let r = 0; r < st.tour; r++) { buff(st, x, 2 * m.g, 2 * m.g, 'perm', m); buff(st, m, m.g, m.g, 'perm', m); } }},
  'Conceptual Artist': {fi: (st, m) => st.discover(m, 'Creative')},
  'Art Critic': {battle: (st, m) => { const d = ASSUME.deaths[phase(st.t)]; buff(st, m, d * m.g, d * m.g, 'perm', m); buff(st, big(others(st, m, 'Creative')), d * m.g, d * m.g, 'perm', m); }},
  'Record Label': {eot: (st, m) => buff(st, big(others(st, m, 'Creative')), (st.creativesPlayed - (m.playedAt || 0)) * m.g, (st.creativesPlayed - (m.playedAt || 0)) * m.g, 'perm', m)},
  'Festival Headliner': {hire: (st, m, x) => { if (x !== m && isT(x, 'Creative', st)) for (let r = 0; r < st.tour; r++) for (const o of others(st, m, 'Creative')) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); }},
  'Museum Retrospective': {battle: (st, m) => { const k = Math.floor(ASSUME.deaths[phase(st.t)] / 2); for (const o of others(st, m, 'Creative')) buff(st, o, 3 * k * m.g, 3 * k * m.g, 'perm', m); }},
  'Dead Rock Star': {battle: (st, m) => { const p = Math.min(2, 2 * pDie(st)) * st.lawyer; for (const o of others(st, m, 'Creative')) buff(st, o, 4 * m.g * p, 4 * m.g * p, 'perm', m); }},
  'World Tour': {tour: true},
  'Ghostwriter': {battle: (st, m) => { const d = ASSUME.deaths[phase(st.t)]; buff(st, nbrs(st, m).find(o => isT(o, 'Creative', st)), d * m.g, d * m.g, 'perm', m); }},
  'Plagiarist': {battle: (st, m) => buff(st, m, ASSUME.enemyAtk[phase(st.t)] * st.att(m) * m.g, 0, 'perm', m)},
  'Biopic': {battle: (st, m) => { const k = Math.min(4, ASSUME.deaths[phase(st.t)]) * pDie(st) * st.lawyer; for (const o of st.board) if (isT(o, 'Creative', st)) buff(st, o, k * m.g, k * m.g, 'perm', m); }},
  'Crossover Hit': {crossover: true},
  // Techies
  'Speedrunner': {battle: (st, m) => buff(st, m, m.g * 0.5 * st.att(m), m.g * 0.5 * st.att(m), 'perm', m)},
  'Smart Plug': {eot: (st, m) => buff(st, m.host, 0, m.g, 'perm', m)},
  'Firmware Update': {connect: (st, m) => { for (const o of st.board) if (isT(o, 'Techie', st)) buff(st, o, m.g, m.g, 'perm', m); }},
  'Smart Fridge': {eot: (st, m) => { for (const o of st.board) if (isT(o, 'Techie', st)) buff(st, o, m.g, m.g, 'perm', m); }},
  'Noise-Cancelling Headphones': {battle: (st, m) => { for (const o of st.board) if (isT(o, 'Techie', st)) buff(st, o, 2 * m.g, 0, 'perm', m); }},
  'Leaderboard': {battle: (st, m) => { for (const o of others(st, m, 'Techie')) buff(st, o, 2 * m.g * st.att(m), m.g * st.att(m), 'perm', m); }},
  'Smart Home Hub': {hub: true},
  'Pro Gamer': {battle: (st, m) => buff(st, m, 3 * m.g * 2 * st.att(m), 2 * m.g * 2 * st.att(m), 'perm', m)},
  'Quantum Computer': {eot: (st, m) => { const h = m.host; if (h) buff(st, h, 2 * m.g * (h.connects || 1), 2 * m.g * (h.connects || 1), 'perm', m); }},
  'World Record': {battle: (st, m) => { const k = 0.5 * st.board.filter(o => isT(o, 'Techie', st)).length * ASSUME.attacks[phase(st.t)]; for (const o of st.board) if (isT(o, 'Techie', st)) buff(st, o, k * m.g, k * m.g, 'perm', m); }},
  'Pop-Up Ad': {sot: (st, m) => { if (st.t % 2 === 0) st.gold += m.g; }},
  'Battle Pass': {gig: {cost: 1, fn: (st, m) => { m.uses = (m.uses || 0) + 1; buff(st, big(others(st, m)), m.uses * m.g, m.uses * m.g, 'perm', m); }}},
  'Data Broker': {afterGig: (st, m) => { if (st.used(m, 'db', 2)) gold(st, m.g); }},
  'Auto-Renewal': {sot: (st, m) => { if (st.gold >= 1) { st.gold -= 1; st.spent += 1; for (const o of st.board) if (isT(o, 'Techie', st)) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); } }},
  'App Store': {gigDiscount: 1, afterGig: (st, m) => buff(st, m, 2 * m.g, 2 * m.g, 'perm', m)},
  'Smart Doorbell': {fi: (st, m) => { const o = big(others(st, m).filter(x => !isT(x, 'Techie', st))); if (o) o.techie = true; },
    battle: (st, m) => { const p = pDie(st) * st.lawyer; for (const o of st.board) if (isT(o, 'Techie', st)) buff(st, o, m.g * p, m.g * p, 'perm', m); }},
  'The Algorithm': {eot: (st, m) => { for (const o of st.board) if (o.connects) buff(st, o, o.connects * m.g, o.connects * m.g, 'perm', m); }},
  // Punks
  'Anarchist Barista': {sold: (st, m) => gold(st, m.g)},
  'Zine Maker': {sold: (st, m, right) => buff(st, right, 2 * m.g, 2 * m.g, 'perm', m)},
  'Sellout Frontman': {sold: (st, m) => { for (const o of others(st, m, 'Punk')) buff(st, o, 2 * m.g, 2 * m.g, 'perm', m); feedBuff(st, 'Punk', 2 * m.g, 2 * m.g); }},
  'Mosh Pit': {battle: (st, m) => { const k = st.att(m); for (const o of st.board) if (isT(o, 'Punk', st)) buff(st, o, k * m.g, 0, 'perm', m); }},
  'Jingle Writer': {sold: (st, m) => { const k = Math.min(16, 2 * st.punksSold); for (const o of others(st, m, 'Punk')) buff(st, o, k * m.g, k * m.g, 'perm', m); }},
  'Reunion Tour': {reunion: true},
  'Stage Diver': {battle: (st, m) => buff(st, m, 4 * m.g * st.mohawk, 0, 'perm', m)},
  'Greatest Hits': {sell: (st, m, x) => { if (isT(x, 'Punk', st)) for (const o of st.board) if (isT(o, 'Punk', st)) buff(st, o, m.g, m.g, 'perm', m); }},
  'General Strike': {battle: (st, m) => { const k = 2 * m.g * ASSUME.enemyDeaths[phase(st.t)] * st.mohawk; for (const o of st.board) if (isT(o, 'Punk', st)) buff(st, o, k, k, 'perm', m); }},
  'Gig Poster': {sold: (st, m) => gold(st, m.g)},
  'Pogo Dancer': {battle: (st, m) => { for (const o of nbrs(st, m)) buff(st, o, 2 * m.g * st.att(m), 0, 'perm', m); }},
  'Circle Pit': {battle: (st, m) => { const n = st.friendlyHits(); for (const o of st.board.slice(0, n)) buff(st, o, m.g, m.g, 'perm', m); }},
  'Crowd Surfer': {battle: (st, m) => { for (const o of others(st, m, 'Punk')) buff(st, o, 3 * m.g * st.mohawk, 2 * m.g * st.mohawk, 'perm', m); }},
  'Wall of Death': {battle: (st, m) => { const n = Math.min(5, st.friendlyHits()); for (const o of st.board) if (isT(o, 'Punk', st)) buff(st, o, n * m.g, n * m.g, 'perm', m); }},
  'Festival Pit': {battle: (st, m) => { const times = st.mohawk + Math.round(ASSUME.deaths[phase(st.t)] / 2); for (const o of others(st, m)) buff(st, o, 2 * m.g * times, 2 * m.g * times, 'perm', m); }},
  'Bootleg Merch': {sell: (st, m, x) => { if (isT(x, 'Punk', st) && st.used(m, 'bm', 2)) st.gold += m.g; }},
  'Punk Philosopher': {sold: (st, m) => { for (const o of st.board) if (isT(o, 'Punk', st) || isT(o, 'Philosopher', st)) buff(st, o, 3 * m.g, 3 * m.g, 'perm', m); }},
  'Mohawk Legend': {mohawk: true},
  // Philosophers
  'Shower Thinker': {eot: (st, m) => buff(st, nbrs(st, m)[1] || nbrs(st, m)[0], 3 * m.g, 3 * m.g, 'temp', m)},
  'Pub Philosopher': {eot: (st, m) => buff(st, nbrs(st, m)[0], 4 * m.g, 2 * m.g, 'temp', m)},
  'Thought Experiment': {eot: (st, m) => { const k = tribesOf(st) * m.g; for (const o of st.board) buff(st, o, k, k, 'temp', m); }},
  'Utilitarian': {eot: (st, m) => { const ph = others(st, m, 'Philosopher').sort((a, b) => a.atk - b.atk).slice(0, 3); for (const o of ph) buff(st, o, 2 * m.g, m.g, 'perm', m); }},
  'Bestselling Author': {late: true, eot: (st, m) => { for (const o of nbrs(st, m)) if (isT(o, 'Philosopher', st)) buff(st, o, m.g, m.g, 'temp', m); for (const o of st.board) { o.atk += o.ta; o.hp += o.th; if (st.track) st.track['Bestselling Author'] = (st.track['Bestselling Author'] || 0) + o.ta + o.th; o.ta = o.th = 0; } }},
  'Grand Unified Theory': {late: true, eot: (st, m) => { const k = tribesOf(st) * m.g; for (const o of st.board) { buff(st, o, k, k, 'temp', m); o.ta *= 2; o.th *= 2; } }},
  'Debate Club': {eot: (st, m) => { for (const o of nbrs(st, m)) buff(st, o, 3 * m.g, 3 * m.g, 'temp', m); }},
  'Van Lifer': {eot: (st, m) => { if (st.board.length <= 4) buff(st, m, m.g, m.g, 'perm', m); }},
  'Declutter Coach': {sell: (st, m) => buff(st, big(others(st, m)), 2 * m.g, 2 * m.g, 'perm', m)},
  'Capsule Wardrobe': {eot: (st, m) => { const k = (7 - st.board.length) * m.g; for (const o of st.board) buff(st, o, k, k, 'perm', m); }},
  'TED Talk': {eot: (st, m) => { const k = (1 + nbrs(st, m).filter(o => isT(o, 'Philosopher', st)).length) * m.g; for (const o of st.board) buff(st, o, k, k, 'temp', m); }},
  'Epicurean': {eot: (st, m) => { st.followerBuff.a += m.g; st.followerBuff.h += m.g; for (const o of st.board) if (o.follower) buff(st, o, m.g, m.g, 'perm', m); }},
  'Pythagorean': {fi: (st, m) => { for (let i = 0; i < 2 * m.g; i++) summonFollower(st, m); likes(st, 2 * m.g); }},
  'Philosopher King': {battle: (st, m) => { const fd = Math.min(ASSUME.deaths[phase(st.t)], st.board.filter(o => o.follower).length + (st.has('Hemlock Martyr') ? 2 : 0)); for (const o of st.board) if (isT(o, 'Philosopher', st)) buff(st, o, 3 * fd * m.g, 3 * fd * m.g, 'perm', m); }},
  'Mystery Cult': {eot: (st, m) => { if ((m.cult || 0) < 3 && st.board.length <= 5) { m.cult = (m.cult || 0) + 1; for (let i = 0; i < 2 * m.g; i++) summonFollower(st, m); } }},
  'Renaissance Thinker': {eot: (st, m) => { const ts = new Set(st.board.map(o => o.c.tribe).filter(t => t !== 'Neutral')); for (const t of ts) buff(st, big(st.board.filter(o => isT(o, t, st))), 2 * m.g, 2 * m.g, 'perm', m); }},
  // Neighbours
  'Caretaker': {eot: (st, m) => { for (const o of nbrs(st, m)) buff(st, o, m.g, 2 * m.g, 'perm', m); }},
  'Helpful Neighbour': {fi: (st, m) => { const ts = new Set(st.board.map(o => o.c.tribe).filter(t => t !== 'Neutral')); for (const t of ts) buff(st, big(st.board.filter(o => isT(o, t, st))), 2 * m.g, 2 * m.g, 'perm', m); }},
  'DJ Upstairs': {dj: true},
  'Lawyer Next Door': {lawyer: true},
  'The Landlord': {eot: (st, m) => { for (const o of others(st, m)) { o.atk = Math.max(0, o.atk - 1); o.hp -= 1; m.atk += 2; m.hp += 2; if (st.track) st.track['The Landlord'] = (st.track['The Landlord'] || 0) + 2; if (o.hp <= 0) { o.dead = true; st.goldNext += 2; } } st.board = st.board.filter(o => !o.dead); }},   // net +2 stats per other minion; a minion drained to 0 Health dies for 2 gold
  'Block Party Host': {battle: (st, m) => { const p = pDie(st) * st.lawyer; for (const o of st.board) buff(st, o, 4 * m.g * p, 4 * m.g * p, 'perm', m); }},
  'New Neighbours': {nn: true},
  'Housing Co-op': {eot: (st, m) => { const k = 2 * (tribesOf(st) + (st.board.some(o => o.c.tribe === 'Neutral') ? 1 : 0)) * m.g; for (const o of others(st, m)) buff(st, o, k, k, 'perm', m); }},
};
const CONNECT = new Set(CARDS.filter(c => c.collab).map(c => c.name));
const CLOCK = new Set(CARDS.filter(c => /Clock In/.test(c.text)).map(c => c.name));
const SELL_GOOD = n => !!(R[n] && (R[n].sold || R[n].sellGold));

// ---------------------------------------------------------------- the turn arithmetic for one board plan
function mk(c, g, st) {
  const fb = (st.feed[c.tribe] || {a: 0, h: 0});
  return {c, g, atk: c.atk * g + fb.a + (c.tribe === 'Creative' ? st.creativeAtk : 0), hp: c.hp * g + fb.h, ta: 0, th: 0, turns: 0, playedAt: st.creativesPlayed, techie: false};
}
/** Plays turns 1..T for a plan: `cards` = the board to build (names, '*' = golden), `cycle` = the card bought and sold
 *  for its When sold effect when there's gold to spare. Returns the board stats at the end of turn T (after end of turn). */
function play(tribe, plan, T, track = null) {
  const want = plan.cards.slice().sort((a, b) => BY[a.n].tier - BY[b.n].tier);
  const st = {t: 0, tier: 1, tribe, board: [], hand: [], gold: 0, goldNext: 0, spent: 0, likes: 0, likeBonus: 0, feed: {}, followerBuff: {a: 0, h: 0}, followersSummoned: 0,
    creativesPlayed: 0, creativeAtk: 0, punksSold: 0, turnsAtTier: 0, track, uses: new Map(), gigs: 0, crossover: 0};
  st.used = (m, key, max) => { const k = (m.id || (m.id = Math.random())) + key, n = st.uses.get(k) || 0; if (n >= max) return false; st.uses.set(k, n + 1); return true; };
  st.has = n => st.board.some(o => o.c.name === n);
  st.att = m => ASSUME.attacks[phase(st.t)] * (m.c.name === 'Pro Gamer' ? 1 : 1);
  st.clock = m => CLOCK.has(m.c.name);
  st.friendlyHits = () => (st.has('Pogo Dancer') ? 2 * ASSUME.attacks[phase(st.t)] : 0) + (st.has('Crowd Surfer') ? others(st, null, 'Punk').length : 0) + (st.has('Festival Pit') ? st.board.length - 1 : 0);
  st.discover = (m, t) => { const best = CARDS.filter(c => isT({c}, t) && !c.legendary && c.tier <= Math.min(6, st.tier)).sort((a, b) => (b.atk + b.hp) - (a.atk + a.hp))[0]; if (best && st.board.length < 7) enter(st, best, 1, false); };
  const count = key => st.board.reduce((k, o) => k + (R[o.c.name] && R[o.c.name][key] ? o.g : 0), 0);
  const refresh = () => { st.oak = 1 + count('oak'); st.nn = 1 + count('nn'); st.tour = 1 + count('tour'); st.reunion = 1 + count('reunion'); st.mohawk = 1 + count('mohawk'); st.lawyer = 1 + count('lawyer'); st.dj = 1 + count('dj'); st.crossover = count('crossover'); };
  const hook = (name, ...a) => { for (const o of st.board.slice()) { const r = R[o.c.name]; if (r && r[name]) r[name](st, o, ...a); } };
  function enter(st2, c, g, paid = true) {
    if (CONNECT.has(c.name)) {   // a Connect card attaches to a minion of its tribe instead of taking a slot
      const hosts = st.board.filter(o => !o.follower && (c.name === 'Robot Vacuum' || isT(o, 'Techie', st))); const hub = 1 + count('hub');
      if (!hosts.length) return null;
      const m = mk(c, g, st);
      for (let i = 0; i < Math.min(hub, hosts.length); i++) { const h = hosts.slice().sort((a, b) => (b.atk + b.hp) - (a.atk + a.hp))[i]; h.atk += m.atk; h.hp += m.hp; h.connects = (h.connects || 0) + 1; }
      m.host = hosts[0]; st.attached = st.attached || []; st.attached.push(m);
      for (const o of st.board.slice()) { const r = R[o.c.name]; if (r && r.connect) r.connect(st, o); }
      return m;
    }
    if (st.board.length >= 7) { const f = small(st.board.filter(o => o.filler || o.follower)); if (!f) return null; sellM(f); }
    const m = mk(c, g, st); if (!paid) m.free = true;
    st.board.push(m);
    if (isT(m, 'Creative', st)) st.creativesPlayed += 1;
    refresh();
    const r = R[c.name];
    if (r && r.fi) for (let i = 0; i < st.dj; i++) r.fi(st, m);
    hook('hire', m);
    return m;
  }
  function sellM(m) {
    const i = st.board.indexOf(m), right = st.board[i + 1] || null; st.board.splice(i, 1);
    st.gold += 1 + ((R[m.c.name] && R[m.c.name].sellGold) || 0) * m.g;
    const reps = isT(m, 'Punk', st) ? st.reunion : 1;
    if (R[m.c.name] && R[m.c.name].sold) for (let r = 0; r < reps; r++) R[m.c.name].sold(st, m, right);
    if (isT(m, 'Punk', st)) st.punksSold += 1;
    refresh(); hook('sell', m);
  }
  const pending = want.map(w => ({n: w.n, g: w.g, copies: 0}));
  for (let t = 1; t <= T; t++) {
    st.t = t; st.uses = new Map(); st.gigs = 0;
    for (const o of st.board) { o.turns += 1; o.ta = o.th = 0; }
    st.gold = Math.min(2 + t, 10) + st.goldNext; st.goldNext = 0; st.spent = 0;
    if (t > 1) st.turnsAtTier += 1;
    refresh(); hook('sot');
    if (st.tier < (CURVE[t] || 6)) { const cost = Math.max(0, LEVEL_COST[st.tier + 1] - st.turnsAtTier); if (st.gold >= cost) { st.gold -= cost; st.spent += cost; st.tier += 1; st.turnsAtTier = 0; } }
    // buy the planned cards whose tier is open (a golden copy needs three buys), then fill empty slots
    for (const p of pending) {
      if (p.done) continue;
      const c = BY[p.n]; if (c.tier > st.tier) continue;
      while (!p.done && st.gold >= 3) {
        st.gold -= 3; st.spent += 3; p.copies += 1;
        const need = p.g === 2 ? 3 : 1;
        if (p.copies === 1) { p.m = enter(st, c, 1); if (!p.m) { p.copies = 0; st.gold += 3; st.spent -= 3; break; } }
        else { hook('hire', p.m); if (isT(p.m, 'Creative', st)) st.creativesPlayed += 1; }
        if (p.copies >= need) { if (need === 3 && p.m) { p.m.g = 2; p.m.atk += c.atk; p.m.hp += c.hp; } p.done = true; }
      }
    }
    while (st.gold >= 3 && st.board.length < 7) {   // filler: the best plain body of the tribe on offer, removed later for planned cards
      const c = {name: 'Filler', tribe, atk: TIER_AVG[st.tier][0], hp: TIER_AVG[st.tier][1], tier: st.tier};
      st.gold -= 3; st.spent += 3; const m = mk(c, 1, st); m.filler = true; st.board.push(m); if (tribe === 'Creative') st.creativesPlayed += 1; refresh(); hook('hire', m);
    }
    // spare gold: Side Gigs, then Scrolls for Scroll effects, then buy-and-sell cycles for sell effects
    for (let guard = 0; guard < 40; guard++) {
      let did = false;
      for (const o of st.board.slice()) {
        const r = R[o.c.name]; if (!r || !r.gig) continue;
        const cost = Math.max(1, r.gig.cost - count('gigDiscount')), uses = 1 + count('gigsTwice');
        if (st.gold >= cost && st.used(o, 'gig', uses)) { st.gold -= cost; st.spent += cost; st.gigs += 1; r.gig.fn(st, o); hook('afterGig'); did = true; }
      }
      if (did) continue;
      const scrollCap = st.board.reduce((k, o) => Math.max(k, (R[o.c.name] && R[o.c.name].scrollCap) || 0), 0);
      st.scrolls = st.scrolls && st.scrolls.t === t ? st.scrolls : {t, n: 0};
      const scost = st.scrolls.n === 0 ? Math.max(0, 1 - count('magpie')) : 1;
      if (scrollCap && st.scrolls.n < scrollCap && st.gold >= scost) { st.gold -= scost; st.spent += scost; st.scrolls.n += 1; hook('scroll', st.scrolls.n); continue; }
      const sellHooks = st.board.some(o => R[o.c.name] && R[o.c.name].sell);
      if (plan.cycle && BY[plan.cycle].tier <= st.tier && st.gold >= 3 && (st.cyc || 0) < ASSUME.cycles * t && (sellHooks || SELL_GOOD(plan.cycle))) {
        st.cyc = (st.cyc || 0) + 1; st.gold -= 3; st.spent += 3;
        const m = enter(st, BY[plan.cycle], 1); if (m && st.board.includes(m)) sellM(m); continue;
      }
      break;
    }
    // Every 4 gold you spend (every 3 with Consultant)
    const per = st.board.some(o => o.c.name === 'Consultant') ? 3 : 4, n = Math.floor(st.spent / per);
    if (n) hook('spend', n);
    // end of turn, in board order (Bestselling Author and Grand Unified Theory last), twice with New Neighbours
    st.inEot = true;
    const order = st.board.slice().sort((a, b) => ((R[a.c.name] && R[a.c.name].late ? 1 : 0) - (R[b.c.name] && R[b.c.name].late ? 1 : 0)));
    for (let rep = 0; rep < st.nn; rep++) for (const o of order) { const r = R[o.c.name]; if (r && r.eot && st.board.includes(o)) r.eot(st, o); }
    for (const a of st.attached || []) { const r = R[a.c.name]; if (r && r.eot) for (let rep = 0; rep < st.nn; rep++) r.eot(st, a); }
    st.inEot = false;
    st.board = st.board.filter(o => !o.dead);
    // Likes go to Main Character if you have one, else to your biggest minion
    if (st.likes > 0 && st.board.length) {
      const mc = st.board.find(o => o.c.name === 'Main Character'), tgt = mc || big(st.board);
      const ring = st.board.some(o => o.c.name === 'Ring Light Studio') ? (st.board.some(o => o.c.name === 'Ring Light Studio' && o.g === 2) ? 3 : 2) : 1;
      const v = (1 + st.likeBonus) * (mc ? 2 * mc.g : 1) * ring;
      buff(st, tgt, v * st.likes, v * st.likes, 'perm', {c: {name: 'Likes'}}); st.likes = 0;
    }
    if (t === T) break;
    st.gold = 0;   // gold doesn't carry over
    // the battle after turn t: only permanent gains, from the stated battle counts
    if (BATTLE) for (const o of st.board.slice()) { const r = R[o.c.name]; if (r && r.battle) r.battle(st, o); }
  }
  const stats = st.board.reduce((s, o) => s + o.atk + o.hp, 0);
  return {stats: Math.round(stats), board: st.board, st};
}

// ---------------------------------------------------------------- search: the best board (and buy-and-sell card) for a target turn
function pool(tribe) {
  return CARDS.filter(c => c.tribe === 'Neutral' && !c.legendary || c.tribe === tribe || c.tribe2 === tribe);
}
function legal(plan) {
  const per = {}; let legs = 0;
  for (const x of plan.cards) { const c = BY[x.n]; if (c.legendary) legs++; else if (c.tribe !== 'Neutral') (per[c.tier] = per[c.tier] || new Set()).add(c.name); }
  if (plan.cycle && BY[plan.cycle].tribe !== 'Neutral') (per[BY[plan.cycle].tier] = per[BY[plan.cycle].tier] || new Set()).add(plan.cycle);
  return legs <= 1 && Object.values(per).every(s => s.size <= 3) && new Set(plan.cards.map(x => x.n)).size === plan.cards.length;
}
function best(tribe, T, start = null) {
  const cs = pool(tribe).filter(c => c.tier <= (CURVE[T] || 6));
  const slots = c => (CONNECT.has(c.name) ? 0 : 1);
  const cycles = [null, ...cs.filter(c => c.tribe === tribe && (SELL_GOOD(c.name) || c.tribe === 'Punk')).map(c => c.name)];
  let plan = start ? {cards: start.cards.filter(x => BY[x.n].tier <= (CURVE[T] || 6)), cycle: start.cycle && BY[start.cycle].tier <= (CURVE[T] || 6) ? start.cycle : null} : {cards: [], cycle: null}, val = play(tribe, plan, T).stats;
  const tryPlan = p => (legal(p) && p.cards.reduce((k, x) => k + slots(BY[x.n]), 0) <= 7 ? play(tribe, p, T).stats : -1);
  for (let round = 0; round < 40; round++) {
    let bestP = null, bestV = val;
    const moves = [];
    for (const c of cs) {
      if (!plan.cards.some(x => x.n === c.name)) moves.push({cards: plan.cards.concat([{n: c.name, g: 1}]), cycle: plan.cycle});
      for (const x of plan.cards) if (x.n !== c.name && !plan.cards.some(y => y.n === c.name)) moves.push({cards: plan.cards.filter(y => y !== x).concat([{n: c.name, g: 1}]), cycle: plan.cycle});
    }
    for (const x of plan.cards) { moves.push({cards: plan.cards.map(y => (y === x ? {n: y.n, g: 3 - y.g} : y)), cycle: plan.cycle}); moves.push({cards: plan.cards.filter(y => y !== x), cycle: plan.cycle}); }
    for (const cy of cycles) if (cy !== plan.cycle) moves.push({cards: plan.cards, cycle: cy});
    // pairs: two cards that only pay off together (Bestselling Author + a next-combat buff, Main Character + Ring Light ...)
    const used = plan.cards.reduce((k, x) => k + slots(BY[x.n]), 0);
    const loss = plan.cards.map(x => [x, val - tryPlan({cards: plan.cards.filter(y => y !== x), cycle: plan.cycle})]).sort((a, b) => a[1] - b[1]);
    const drop2 = loss.slice(0, 2).map(e => e[0]);
    const free = cs.filter(c => !plan.cards.some(x => x.n === c.name));
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
      const add = [{n: free[i].name, g: 1}, {n: free[j].name, g: 1}];
      if (used + 2 <= 7) moves.push({cards: plan.cards.concat(add), cycle: plan.cycle});
      else if (drop2.length === 2) moves.push({cards: plan.cards.filter(y => !drop2.includes(y)).concat(add), cycle: plan.cycle});
    }
    for (const p of moves) { const v = tryPlan(p); if (v > bestV) { bestV = v; bestP = p; } }
    if (!bestP) break;
    plan = bestP; val = bestV;
  }
  const track = {}, r = play(tribe, plan, T, track);
  return {stats: r.stats, plan, board: r.board.concat(r.st.attached || []).map(o => `${o.g === 2 ? '★ ' : ''}${o.filler ? `(filler ${o.c.atk}/${o.c.hp})` : o.c.name}${o.host ? ' (attached)' : ` ${Math.round(o.atk)}/${Math.round(o.hp)}`}`),
    sources: Object.entries(track).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round(v)}`)};
}

module.exports = {play, best, R, ASSUME};
if (require.main !== module) return;
const out = {targets: TARGETS, battle: BATTLE, tribes: {}};
for (const tribe of TRIBES) {
  out.tribes[tribe] = {};
  // first without battle effects (shop only), then with them; each search starts from an empty board, from the previous
  // turn's best board and (with battles) from the shop-only best board, and keeps the best result
  const shop = {}; let prev = null; const keep = BATTLE;
  BATTLE = false;
  for (const T of TARGETS) { const a = best(tribe, T), b = prev ? best(tribe, T, prev) : a; shop[T] = b.stats > a.stats ? b : a; prev = shop[T].plan; }
  BATTLE = keep; prev = null;
  for (const T of TARGETS) {
    const tries = [best(tribe, T)]; if (prev) tries.push(best(tribe, T, prev)); if (BATTLE) tries.push(best(tribe, T, shop[T].plan));
    out.tribes[tribe][T] = tries.reduce((x, y) => (y.stats > x.stats ? y : x)); out.tribes[tribe][T].shopOnly = shop[T].stats; prev = out.tribes[tribe][T].plan;
  }
}
const W = TARGETS.length === 4 ? [0.2, 0.3, 0.3, 0.2] : TARGETS.map(() => 1 / TARGETS.length);
const median = xs => { const v = xs.slice().sort((a, b) => a - b); return v[v.length >> 1]; };
const rating = {};
for (const T of TARGETS) { const med = median(TRIBES.map(t => out.tribes[t][T].stats)); for (const t of TRIBES) (rating[t] = rating[t] || {})[T] = Math.round(100 * out.tribes[t][T].stats / med); }
for (const t of TRIBES) rating[t].overall = Math.round(TARGETS.reduce((s, T, i) => s + W[i] * rating[t][T], 0));
out.rating = rating;
fs.writeFileSync(path.join(__dirname, 'tribe_calc.json'), JSON.stringify(out, null, 1));
const rows = TRIBES.slice().sort((a, b) => rating[b].overall - rating[a].overall);
console.log(['Tribe', ...TARGETS.map(T => `T${T}`), ...TARGETS.map(T => `r${T}`), 'overall'].join('\t'));
for (const t of rows) console.log([t, ...TARGETS.map(T => out.tribes[t][T].stats), ...TARGETS.map(T => rating[t][T]), rating[t].overall].join('\t'));
const md = [`# Tribe board calculator`, '', `Generated by \`node tools/tribe_calc.js ${TARGETS.join(',')}${BATTLE ? '' : ' --no-battle'}\`. Board stats = Attack + Health of every minion on the board at the end of the turn. Calculated from the card texts; no game engine, battles or randomness.`, '',
  `| Tribe | ${TARGETS.map(T => `Turn ${T}`).join(' | ')} | Overall rating |`, `| --- |${' --- |'.repeat(TARGETS.length + 1)}`,
  ...rows.map(t => `| ${t} | ${TARGETS.map(T => out.tribes[t][T].stats.toLocaleString('en')).join(' | ')} | ${rating[t].overall} |`), '',
  'Shop only (no battle effects):', '', `| Tribe | ${TARGETS.map(T => `Turn ${T}`).join(' | ')} |`, `| --- |${' --- |'.repeat(TARGETS.length)}`,
  ...rows.map(t => `| ${t} | ${TARGETS.map(T => out.tribes[t][T].shopOnly.toLocaleString('en')).join(' | ')} |`), '',
  ...rows.flatMap(t => [`## ${t}`, '', '| Turn | Stats | Board | Biggest sources |', '| --- | --- | --- | --- |',
    ...TARGETS.map(T => { const r = out.tribes[t][T]; return `| ${T} | ${r.stats.toLocaleString('en')} | ${r.board.join(', ')}${r.plan.cycle ? `; buys and sells ${r.plan.cycle}` : ''} | ${r.sources.join(', ')} |`; }), ''])];
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'tribe-calc.md'), md.join('\n'));
for (const t of rows) { console.log(`\n${t}`); for (const T of TARGETS) console.log(`  T${T} ${out.tribes[t][T].stats}: ${out.tribes[t][T].board.join(', ')}  | from: ${out.tribes[t][T].sources.join(', ')}${out.tribes[t][T].plan.cycle ? ` | cycles ${out.tribes[t][T].plan.cycle}` : ''}`); }
