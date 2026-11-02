/* Late Stage engine: a JavaScript port of the balance simulator (sim.py, round 4).
   Shop rules, bot logic and combat match the Python version; combat additionally records
   a list of frames (board snapshots + event) that the UI plays back as animations. */
(function (root) {
'use strict';
const H = 'Hustler', I = 'Influencer', F = 'Feral', C = 'Creative', T = 'Techie', P = 'Punk', PH = 'Philosopher', N = 'Neutral';
const TRIBES = [H, I, F, C, T, P, PH];
const FEED_SIZE = {1: 3, 2: 4, 3: 4, 4: 5, 5: 5, 6: 6};
const LEVEL_COST = {2: 5, 3: 7, 4: 8, 5: 9, 6: 10};
const CURVE = {1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 6};
const COPIES = {1: 16, 2: 15, 3: 13, 4: 11, 5: 9, 6: 7};
const P_ = {vv: 3, mc: 4};
const RIGHT_GIVERS = new Set(['Shower Thinker', 'Zine Maker', 'Marathon Monk']);
const LEFT_GIVERS = new Set(['Pub Philosopher', 'E-Sports Coach']);
const NB_GIVERS = new Set(['Rooftop Beehive', 'Thought Experiment', 'Bestselling Author', 'Tree Hugger', 'Human Chain', 'Desert Hermit',
  'Squat Collective', 'Package Hoarder', 'Open Mic Poet', 'Thought Leader', 'Caretaker', 'Nihilist', 'World Record']);
const NEUTRAL_GOOD = {'Caretaker': 2, 'The Landlord': 2, 'Block Party Host': 4, 'Package Hoarder': 1, 'Wi-Fi Leech': 1, 'Leaf Blower Guy': 1};
const SELL_STYLES = ['EX', 'SO'];
const TARGETED_FI = new Set(['Personal Brand', 'Helpful Neighbour', 'Art Student', 'Venture Capitalist']);

let CARDS = [], BY_NAME = {}, BY_TRIBE = {}, STYLES = {};
function load(cards, styles) {
  CARDS = cards; BY_NAME = {}; BY_TRIBE = {}; STYLES = styles;
  for (const c of cards) { BY_NAME[c.name] = c; (BY_TRIBE[c.tribe] = BY_TRIBE[c.tribe] || []).push(c); }
}

// ---------- rng ----------
function RNG(seed) {
  let a = seed >>> 0;
  const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.choice = arr => arr[Math.floor(r() * arr.length)];
  r.choices = (arr, weights, k) => {
    const out = [], tot = weights ? weights.reduce((x, y) => x + y, 0) : arr.length;
    for (let i = 0; i < k; i++) {
      if (!weights) { out.push(arr[Math.floor(r() * arr.length)]); continue; }
      let x = r() * tot, j = 0;
      while (x >= weights[j] && j < arr.length - 1) { x -= weights[j]; j++; }
      out.push(arr[j]);
    }
    return out;
  };
  r.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  return r;
}

// ---------- minions ----------
let UID = 1;
class M {
  constructor(card, follower = false) {
    this.c = card; this.follower = follower;
    if (follower) { this.name = 'Follower'; this.tribe = I; this.style = 'FO'; this.tier = 1; this.atk = 1; this.hp = 1;
      this.taunt = this.shield = this.toxic = this.rebrand = this.twice = false; }
    else { Object.assign(this, {name: card.name, tribe: card.tribe, style: card.style, tier: card.tier, atk: card.atk, hp: card.hp,
      taunt: card.taunt, shield: card.shield, toxic: card.toxic, rebrand: card.rebrand, twice: card.twice}); }
    this.extras = []; this.sell_bonus = 0; this.turns_on_board = 0; this.ta = 0; this.th = 0;
    this.id = UID++; this.orig = null; this.fb = 0; this.golden = false; this.tribe2 = null;
  }
  is_(n) { return this.name === n || this.extras.includes(n); }
  n(n) { return (this.name === n ? 1 : 0) + this.extras.filter(x => x === n).length; }
  stats() { return this.atk + this.hp; }
}
const isTribe = (o, t) => o.tribe === t || o.tribe2 === t;
const neighbours = (b, m) => { const i = b.indexOf(m); return [b[i - 1], b[i + 1]].filter(x => x); };
const leftOf = (b, m) => { const i = b.indexOf(m); return i > 0 ? b[i - 1] : null; };
const rightOf = (b, m) => { const i = b.indexOf(m); return i + 1 < b.length ? b[i + 1] : null; };
const maxBy = (arr, f) => arr.reduce((best, x) => (best === null || cmp(f(x), f(best)) > 0 ? x : best), null);
const minBy = (arr, f) => arr.reduce((best, x) => (best === null || cmp(f(x), f(best)) < 0 ? x : best), null);
function cmp(a, b) { if (Array.isArray(a)) { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1; } return 0; } return a === b ? 0 : a > b ? 1 : -1; }
const doubled = b => b.flatMap(x => x.golden ? [x, x] : [x]);

// ---------- pool ----------
function buildPool(tribes) {
  const all = tribes.flatMap(t => BY_TRIBE[t]).concat(BY_TRIBE[N]);
  const pool = {};
  for (let t = 1; t <= 6; t++) { const cs = all.filter(c => c.tier <= t); pool[t] = [cs, cs.map(c => COPIES[c.tier])]; }
  return pool;
}

// ======================================================================== player (bots and human)
class Player {
  constructor(style, rng, pool, opts = {}) {
    this.style_code = style; this.tribe = STYLES[style] ? STYLES[style][0] : null; this.style = STYLES[style] ? style : null;
    this.rng = rng; this.pool = pool; this.board = []; this.tier = 1; this.turn = 0; this.bonus_next = 0; this.turns_at_tier = 0;
    this.spent = 0; this.buffed = new Set(); this.fbonus = 0; this.boundaries = opts.boundaries ?? 5; this.health = 30; this.alive = true;
    this.merch_used = false; this.side_used = false; this.rerelease = []; this.discounts = {}; this.in_eot = false; this.oak = false;
    this.sold_hustle = false; this.punks_sold = 0; this.kills_last = 0; this.techie_kills = 0; this.spent_this_turn = 0;
    this.human = !!opts.human; this.hero = opts.hero || null; this.name = opts.name || style;
    this.hand = []; this.feed = []; this.saved = false; this.gold = [0]; this.log = []; this.pending = []; this.lostLast = false;
  }
  has(n) { return this.board.some(m => m.is_(n)); }
  count(n) { return this.board.reduce((s, m) => s + m.n(n), 0); }
  note(type, data) { if (this.human) this.log.push(Object.assign({type}, data)); }
  buff(m, a, h, src) {
    if (this.in_eot && m.tribe === F && this.oak) { a *= 2; h *= 2; }
    m.atk += a; m.hp += h; this.buffed.add(m.id);
    this.note('buff', {id: m.id, a, h, src: src ? src.id : null});
  }
  tbuff(m, a, h, src) { m.ta += a; m.th += h; this.buffed.add(m.id); this.note('tbuff', {id: m.id, a, h, src: src ? src.id : null}); }
  value(m) {
    let v = m.stats() / 2 + (m.ta + m.th) / 4;
    if (this.tribe === null) return v;
    if (m.follower) return v + (this.style === 'FO' ? 1 : 0);
    const c = m.c;
    if (c.tribe === this.tribe || m.tribe2 === this.tribe) {
      v += 2.5 * this.commit();
      if (c.kind === 'eng') { const decay = Math.max(.25, 1 - .25 * Math.max(0, this.tier - c.tier - 1)); v += 1.5 * (1 + c.tier) * decay * this.commit(); }
    }
    if ((SELL_STYLES.includes(this.style) || [H, P].includes(this.tribe)) && c.sellbait) v += 1;
    v += NEUTRAL_GOOD[m.name] || 0;
    if (m.name === 'Wedding DJ' && ['FO', 'MC', 'PI', 'PE', 'GA'].includes(this.style) && this.count('Wedding DJ') <= 1) v += 4;
    if (m.name === 'Estate Lawyer' && ['FO', 'PF'].includes(this.style) && this.count('Estate Lawyer') <= 1) v += 4;
    return v + 1.5 * m.extras.length;
  }
  commit() { let c = this.turn <= 3 ? .4 : this.turn <= 5 ? .7 : 1; if (this.health < 15) c *= .6; return c; }
  cardScore(card) {
    const m = new M(card); UID--;
    if (this.tribe === null) return m.stats() / 2 + card.tier * .5;
    let s = this.value(m) + card.tier * .5;
    if (card.tribe === this.tribe) {
      const decay = Math.max(.25, 1 - .25 * Math.max(0, this.tier - card.tier - 1));
      if (card.kind === 'fi' || card.collab) s += 1.5 * (1 + card.tier) * decay;
      if (card.discover) s += 2 * decay;
    }
    if (card.name === 'Helpful Neighbour') s += 2;
    if (card.collab && this.board.length) s += 1;
    if (!card.collab) s += 1.5 * this.board.filter(x => x.name === card.name && !x.golden).length;
    return s;
  }
  summonFollower(board) {
    board = board || this.board;
    if (board.length >= 7) return null;
    const f = new M(null, true);
    f.atk += this.fbonus; f.hp += this.fbonus;
    for (const x of board) { f.atk += 5 * x.n('Engagement Farmer'); f.hp += 5 * x.n('Engagement Farmer'); }
    board.push(f); this.note('summon', {id: f.id});
    return f;
  }
  gainSpend(amount) {
    const before = this.spent; this.spent += amount;
    const step = this.has('Consultant') ? 3 : 4;
    for (let k = 0; k < Math.floor(this.spent / step) - Math.floor(before / step); k++)
      for (const m of doubled(this.board.slice())) if (m.is_('Thought Leader')) for (const o of this.board) if (o !== m && o.tribe === H) this.buff(o, 2, 2, m);
  }
  carry() { const c = this.board.filter(m => !m.follower); return maxBy(c.length ? c : this.board, m => [m.stats(), this.value(m)]); }
  discoverOptions(tribe, tier) {
    const cards = tribe ? BY_TRIBE[tribe].filter(c => c.tier <= this.tier) : this.pool[6][0].filter(c => c.tier === tier);
    const w = tribe ? cards.map(c => COPIES[c.tier]) : null;
    return this.rng.choices(cards, w, 3);
  }
  discover(tribe, gold) {
    const opts = this.discoverOptions(tribe);
    if (this.human) { this.pending.push({kind: 'discover', options: opts, why: tribe}); return; }
    const best = maxBy(opts, c => this.cardScore(c));
    if (this.board.length < 7 || (best.collab && this.board.length)) this.play(best, gold);
  }
  firstImpression(m, gold, target) {
    const reps = this.has('Wedding DJ') ? 2 : 1;
    for (let r = 0; r < reps; r++) {
      const n = m.name, others = this.board.filter(o => o !== m);
      if (n === 'Dropshipper') { this.bonus_next += 1; this.note('gold_next', {id: m.id, n: 1}); }
      else if (n === 'Engagement Bot') this.summonFollower();
      else if (n === 'Personal Brand') {
        const tgt = target && this.board.includes(target) ? target : maxBy(others.length ? others : [m], o => o.atk);
        const top = maxBy(this.board, o => o.atk);
        const k = tgt.atk >= top.atk ? 4 : 3; this.buff(tgt, k, k, m);
      } else if (n === 'Helpful Neighbour') { const tgt = target && this.board.includes(target) ? target : maxBy(others.length ? others : [m], o => this.value(o)); this.buff(tgt, 2, 2, m); }
      else if (n === 'Venture Capitalist') {
        const inv = Math.min(gold[0], 4);
        if (inv) { gold[0] -= inv; this.gainSpend(inv); const tgt = target && this.board.includes(target) ? target : maxBy(this.board, o => this.value(o)); this.buff(tgt, 2 * inv, 2 * inv, m); this.note('invest', {n: inv}); }
      } else if (n === 'Art Student') {
        const cr = others.filter(o => o.tribe === C);
        if (cr.length) { const tgt = target && cr.includes(target) ? target : maxBy(cr, o => this.value(o)); this.buff(tgt, 2, 2, m); }
      } else if (n === 'Record Label') { for (const o of others) if (o.tribe === C) this.buff(o, 3, 3, m); }
      else if (m.c && m.c.discover) this.discover(m.c.discover, gold);
    }
  }
  afterCollab() {
    for (const x of doubled(this.board.slice())) { const k1 = x.n('Firmware Update'); if (k1) for (const o of this.board) if (isTribe(o, T)) this.buff(o, 2 * k1, k1, x); }
  }
  afterPlay(card, played, gold) {
    for (const x of doubled(this.board.slice())) {
      if (x === played && !card.collab) continue;
      if (x.is_('Grindset Guru') && card.tribe === H && x !== played) this.buff(x, 2, 1, x);
      if (x.is_('Side Hustle') && card.tribe === H && x !== played && !this.side_used && gold) { this.side_used = true; gold[0] += 1; this.note('gold', {id: x.id, n: 1}); }
      if (x.n('World Tour')) for (const o of this.board) if (o.tribe === C) this.buff(o, 2 * x.n('World Tour'), 2 * x.n('World Tour'), x);
      if (card.tribe !== C) continue;
      if (x.is_('Busker')) this.buff(x, 2, 1, x);
      if (x.is_('Merch Stand') && !this.merch_used) { this.merch_used = true; this.bonus_next += 1; this.note('gold_next', {id: x.id, n: 1}); }
      if (x.is_('Indie Band')) { this.buff(x, 1, 1, x); this.buff(played, 3, 3, x); }
      if (x.is_('Festival Headliner')) for (const o of this.board) if (o.tribe === C && o !== x) this.buff(o, 3, 3, x);
    }
  }
  stick(card, tgt) {
    tgt.atk += card.atk; tgt.hp += card.hp; tgt.shield = tgt.shield || card.shield; tgt.rebrand = tgt.rebrand || card.rebrand; tgt.toxic = tgt.toxic || card.toxic;
    if (card.tribe === T && tgt.tribe !== T) tgt.tribe2 = T;
    tgt.extras.push(card.name); this.buffed.add(tgt.id); this.note('collab', {id: tgt.id, name: card.name});
    this.afterCollab();
  }
  play(card, gold, pos = null, target = null) {
    if (card.collab && this.board.length) {
      let tgt = target && this.board.includes(target) ? target : null;
      if (!tgt) { const own = this.tribe === card.tribe ? this.board.filter(x => !x.follower && isTribe(x, card.tribe)) : []; tgt = own.length ? maxBy(own, x => x.stats()) : this.carry(); }
      this.stick(card, tgt);
      if (this.has('Smart Home Hub')) {
        const rest = this.board.filter(x => x !== tgt && !x.follower);
        if (rest.length) this.stick(card, maxBy(rest, x => [isTribe(x, T) ? 1 : 0, x.stats()]));
      }
      this.afterPlay(card, tgt, gold);
      return tgt;
    }
    const m = new M(card);
    if (pos === null || pos > this.board.length) this.board.push(m); else this.board.splice(pos, 0, m);
    this.note('play', {id: m.id});
    this.firstImpression(m, gold, target);
    if (this.board.includes(m)) this.afterPlay(card, m, gold);
    this.checkTriple(card, gold);
    return m;
  }
  checkTriple(card, gold) {
    const same = this.board.filter(x => x.name === card.name && !x.golden && !x.follower);
    if (same.length < 3) return;
    const keep = same[0];
    for (const x of same.slice(1, 3)) {
      keep.atk += x.atk - card.atk; keep.hp += x.hp - card.hp; keep.shield = keep.shield || x.shield;
      keep.extras.push(...x.extras); keep.sell_bonus += x.sell_bonus; this.board.splice(this.board.indexOf(x), 1);
    }
    keep.atk += card.atk; keep.hp += card.hp; keep.golden = true; keep.tier = card.tier;
    this.note('triple', {id: keep.id});
    const t = Math.min(6, this.tier + 1);
    const opts = this.discoverOptions(null, t);
    if (this.human) { this.pending.push({kind: 'discover', options: opts, why: 'triple', tier: t}); return; }
    const best = maxBy(opts, c => this.cardScore(c));
    if (this.board.length < 7 || (best.collab && this.board.length)) this.play(best, gold);
  }
  sellValue(m) {
    let g = m.name === 'Unpaid Intern' ? 2 : m.name === 'Crypto Bro' ? (m.turns_on_board > 4 ? 0 : Math.min(1 + m.turns_on_board, 5)) : 1;
    return g + m.sell_bonus;
  }
  sell(m, gold) {
    const g = this.sellValue(m), i = this.board.indexOf(m), right = this.board[i + 1] || null;
    this.board.splice(i, 1); gold[0] += g; this.note('sold', {id: m.id, g});
    const reps = this.has('Reunion Tour') && m.tribe === P ? 2 : 1;
    for (let r = 0; r < reps; r++) this.whenSold(m, right);
    if (m.tribe === P && !m.follower) this.punks_sold += 1;
    if (m.tribe === P && !m.follower && this.has('Greatest Hits')) this.rerelease.push(m.c);
    this.afterSell(m);
  }
  whenSold(m, right) {
    const n = m.name;
    if (n === 'Anarchist Barista') { this.bonus_next += 1; this.note('gold_next', {n: 1}); }
    else if (n === 'Zine Maker' && right) this.buff(right, 3, 3);
    else if (n === 'Sellout Frontman') { for (const o of this.board) if (o.tribe === P) this.buff(o, 2, 2); }
    else if (n === 'Energy-Drink Sponsor') { const k = Math.min(6, this.punks_sold); if (k) for (const o of this.board) if (o.tribe === P) this.buff(o, k, k); }
  }
  afterSell(sold) {
    for (const o of doubled(this.board.slice())) {
      if (o.is_('Sneaker Reseller') && !this.sold_hustle) { this.sold_hustle = true; for (const x of this.board) if (x.tribe === H) this.buff(x, 3, 3, o); }
      if (o.is_('Private Equity') && sold) { const hs = this.board.filter(x => x.tribe === H); if (hs.length) this.buff(maxBy(hs, x => x.atk), Math.max(1, sold.atk >> 1), Math.max(1, sold.hp >> 1), o); }
    }
  }
  arrange() {
    const b = this.board; if (b.length < 3) return;
    const cy = this.carry(); const rest = b.filter(m => m !== cy);
    let L = rest.find(m => RIGHT_GIVERS.has(m.name)) || rest.find(m => NB_GIVERS.has(m.name)) || null; if (L) rest.splice(rest.indexOf(L), 1);
    let R = rest.find(m => LEFT_GIVERS.has(m.name)) || rest.find(m => NB_GIVERS.has(m.name)) || null; if (R) rest.splice(rest.indexOf(R), 1);
    const half = rest.length >> 1;
    this.board = [...rest.slice(0, half), ...(L ? [L] : []), cy, ...(R ? [R] : []), ...rest.slice(half)];
  }
  endOfTurn() {
    let b = this.board; this.in_eot = true; this.oak = this.has('Ancient Oak');
    for (const m of doubled(b.slice())) {
      b = this.board; if (!b.includes(m)) continue;
      const n = m.name;
      if (n === 'Middle Manager') {
        const vict = b.filter(o => o !== m);
        if (vict.length) { const v = minBy(vict, o => this.value(o)); v.atk -= Math.min(1, v.atk); v.hp -= 1; this.note('drain', {id: v.id, src: m.id}); this.buff(m, 1, 1, m);
          if (v.hp <= 0) { b.splice(b.indexOf(v), 1); this.bonus_next += 1; this.note('shopdeath', {id: v.id}); this.onShopDeath(v); } }
      } else if (n === 'Stan Account') this.buff(maxBy(b, o => o.atk), 2, 1, m);
      else if (n === 'Hype Man') { const k = b.filter(o => o.tribe === I).length; this.buff(maxBy(b, o => o.atk), k, k, m); }
      else if (n === 'Ring Light Studio') { const k = 2 * b.filter(o => o.tribe === I && o !== m).length; if (k) this.buff(maxBy(b, o => o.atk), k, k, m); }
      else if (n === 'Giveaway Host') { this.fbonus += 2; for (const o of b) if (o.follower) this.buff(o, 2, 2, m); }
      else if (n === 'Caretaker') { for (const o of neighbours(b, m)) this.buff(o, 0, 2, m); }
      else if (n === 'The Landlord') {
        for (const o of neighbours(b, m)) { o.atk = Math.max(0, o.atk - 1); o.hp -= 1; m.atk += 1; m.hp += 1; this.note('drain', {id: o.id, src: m.id});
          if (o.hp <= 0) { b.splice(b.indexOf(o), 1); this.note('shopdeath', {id: o.id}); this.onShopDeath(o); } }
      } else if (n === 'Block Party Host') { for (const o of neighbours(b, m)) this.buff(o, 2, 2, m); }
      else if (n === 'Unicorn Startup') { const g = this.spent_this_turn >> 1; if (g) for (const o of b) if (o !== m && o.tribe === H) this.buff(o, g, g, m); }
      else if (n === 'Protest Camp') { for (const o of b) if (o !== m && o.taunt && o.tribe === F) this.buff(o, 3, 3, m); }
      else if (n === 'Windowsill Succulent') { if (m.turns_on_board > 0 && m.turns_on_board % 2 === 0) this.buff(m, 2, 2, m); }
      else if (n === 'Monstera') this.buff(m, 2, 1, m);
      else if (n === 'Plant Parent') { for (const o of b) if (o !== m && o.tribe === F) this.buff(o, 2, 2, m); }
      else if (n === 'Rooftop Beehive') { for (const o of neighbours(b, m)) this.buff(o, 1, 1, m); }
      else if (n === 'World Tree') { const k = Math.min(3, m.turns_on_board); if (k) for (const o of b) if (o !== m && o.tribe === F) this.buff(o, k, k, m); }
      else if (n === 'Shower Thinker') { const o = rightOf(b, m); if (o) this.tbuff(o, 2, 2, m); }
      else if (n === 'Pub Philosopher') { const o = leftOf(b, m); if (o) this.tbuff(o, 3, 1, m); }
      else if (n === 'Thought Experiment') { for (const o of neighbours(b, m)) this.tbuff(o, 3, 3, m); }
      else if (n === 'Utilitarian') { for (const o of b.filter(o => o !== m && o.tribe === PH).sort((x, y) => x.atk - y.atk).slice(0, 3)) this.buff(o, 3, 3, m); }
      else if (n === 'Compost Heap') { const fs = b.filter(o => o !== m && o.tribe === F); if (fs.length) this.buff(maxBy(fs, o => [o.turns_on_board, o.stats()]), 2, 2, m); }
      else if (n === 'Leaderboard') { const k = Math.min(3, this.kills_last); if (k) for (const o of b) if (o !== m && isTribe(o, T)) this.buff(o, k, k, m); }
      if (m.n('Smart Fridge')) { const k = m.n('Smart Fridge'); for (const o of b) if (isTribe(o, T)) this.buff(o, k, k, m); }
    }
    b = this.board;
    if (this.hero === 'h_gymbro' && b.length) this.buff(minBy(b, o => o.atk), 1, 1);
    this.in_eot = false;
    for (const m of b) if (m.is_('Grand Unified Theory')) for (const o of b) { o.ta *= 2; o.th *= 2; }
    for (const m of b) if (m.name === 'Bestselling Author') for (const o of b) if (o.tribe === PH && (o.ta || o.th)) { o.atk += o.ta; o.hp += o.th; this.note('buff', {id: o.id, a: o.ta, h: o.th, src: m.id}); o.ta = o.th = 0; }
    for (const m of b) m.fb = this.fbonus;
    for (const m of b) if (m.name === 'Main Character') { const k = [...this.buffed].filter(x => x !== m.id).length * P_.mc; if (k) { m.atk += k; m.hp += k; this.note('buff', {id: m.id, a: k, h: k, src: m.id}); } }
  }
  onShopDeath(v) {
    const reps = this.has('Estate Lawyer') ? 2 : 1;
    for (let r = 0; r < reps; r++) {
      if (v.name === 'Reply Guy') this.summonFollower();
      else if (v.name === 'Comment Section' || v.name === 'Unboxing Streamer') { this.summonFollower(); this.summonFollower(); }
      else if (v.name === 'Golden Parachute Exec') this.bonus_next += 2;
    }
  }
  drawFeed() { const [cards, w] = this.pool[this.tier]; return this.rng.choices(cards, w, FEED_SIZE[this.tier]); }
  levelCost() { return this.tier >= 6 ? null : Math.max(0, LEVEL_COST[this.tier + 1] - this.turns_at_tier); }

  // ---- turn structure (shared)
  beginTurn() {
    this.turn += 1; this.kills_last = this.techie_kills; this.techie_kills = 0; this.buffed = new Set();
    this.merch_used = this.side_used = this.sold_hustle = false; this.rerelease = []; this.discounts = {}; this.in_eot = this.oak = false;
    for (const m of this.board) { m.turns_on_board += 1; m.ta = m.th = 0; }
    const carry = this.hero === 'h_procrastinator' ? Math.min(3, this.gold[0]) : 0;
    this.gold = [Math.min(2 + this.turn, 10) + this.bonus_next + carry]; this.gold_from = {base: Math.min(2 + this.turn, 10), bonus: this.bonus_next, carry};
    this.bonus_next = 0; this.spent_start = this.spent;
    if (this.turn > 1) this.turns_at_tier += 1;
  }
  takeTurn() {   // bot
    this.beginTurn(); const gold = this.gold;
    for (const m of this.board.slice()) if (m.name === 'Crypto Bro' && m.turns_on_board >= 4) this.sell(m, gold);
    if (SELL_STYLES.includes(this.style) || [H, P].includes(this.tribe))
      for (const m of this.board.slice()) if (m.c && m.c.sellbait && m.turns_on_board >= 1 && this.board.length > 4) this.sell(m, gold);
    const target = CURVE[this.turn] || 6;
    if (this.tier < target && this.tier < 6) { const cost = this.levelCost(); if (gold[0] >= cost) { gold[0] -= cost; this.gainSpend(cost); this.tier += 1; this.turns_at_tier = 0; } }
    let feed = this.drawFeed(), scrolls = 0, digs = 0;
    while (gold[0] >= 2) {
      if (this.rerelease.length) { for (const c of this.rerelease) { feed.push(c); this.discounts[c.name] = (this.discounts[c.name] || 0) + 1; } this.rerelease = []; }
      const costOf = c => (this.discounts[c.name] || 0) > 0 ? 2 : 3;
      const afford = feed.filter(c => costOf(c) <= gold[0]);
      if (!afford.length && gold[0] < 3) break;
      const best = afford.length ? maxBy(afford, c => this.cardScore(c)) : null;
      const worst = this.board.length ? minBy(this.board, m => this.value(m)) : null;
      if (best && this.tribe && this.turn >= 3 && best.tribe !== this.tribe && gold[0] >= 4 && digs < 3 && !feed.some(c => c.tribe === this.tribe)) {
        gold[0] -= 1; this.gainSpend(1); digs++; feed = this.drawFeed(); continue;
      }
      if (best) {
        const bs = this.cardScore(best), free = this.board.length < 7 || (best.collab && this.board.length);
        if (free || bs > this.value(worst) + 1.5) {
          if (!free) this.sell(worst, gold);
          const cst = costOf(best); if ((this.discounts[best.name] || 0) > 0) this.discounts[best.name] -= 1;
          gold[0] -= cst; this.gainSpend(cst); feed.splice(feed.indexOf(best), 1); this.play(best, gold); continue;
        }
      }
      if (gold[0] >= 4 && scrolls < 4) { gold[0] -= 1; this.gainSpend(1); scrolls++; feed = this.drawFeed(); continue; }
      break;
    }
    this.spent_this_turn = this.spent - this.spent_start;
    this.arrange(); this.endOfTurn();
  }
}

// ======================================================================== combat
function snap(side) {
  return side.b.map(m => ({id: m.id, name: m.name, atk: m.atk, hp: m.hp, shield: m.shield, taunt: m.taunt, toxic: m.toxic, golden: m.golden,
    tier: m.tier, follower: m.follower, tribe: m.tribe, extras: m.extras.slice(), rebrand: m.rebrand}));
}
function perm(m, a, h) { m.atk += a; m.hp += h; if (m.orig) { m.orig.atk += a; m.orig.hp += h; } }
function hit(t, n, src) {
  if (n <= 0 || t.hp <= 0) return 0;
  if (t.shield) { t.shield = false; t.popped = true; return 0; }
  if (t.cap3 && n > 3) n = 3;
  if (src && src.toxic) { t.hp = Math.min(t.hp - n, 0); src.toxic = false; t.toxicked = true; } else t.hp -= n;
  t.hits = (t.hits || 0) + 1;
  return n;
}
class Side { constructor(p, b) { this.p = p; this.b = b; this.vv = 0; } }
function combatCopy(m) {
  const c = Object.assign(Object.create(Object.getPrototypeOf(m)), m);
  c.extras = m.extras.slice(); c.orig = m.follower ? null : m; c.atk += m.ta; c.hp += m.th; c.hits = 0; c.surv_used = c.kill_used = false;
  c.speed_used = 0; c.critic = 0; c.retro = 0; c.tbf_used = false; c.cap3 = false;
  return c;
}
function combatFollower(side, idx) {
  const b = side.b; if (b.length >= 7) return null;
  const f = new M(null, true); const fb = Math.max(0, ...b.map(x => x.fb || 0));
  f.atk += fb; f.hp += fb; f.fb = fb;
  for (const x of b) { f.atk += 5 * x.n('Engagement Farmer'); f.hp += 5 * x.n('Engagement Farmer'); }
  f.hits = 0; f.surv_used = f.kill_used = false; f.speed_used = 0;
  b.splice(Math.min(idx, b.length), 0, f); return f;
}

class Fight {
  constructor(pa, pb, boardA, boardB, rng) {
    this.rng = rng; this.frames = [];
    const A = boardA.map(combatCopy), B = boardB.map(combatCopy);
    if (pa === null || pa.ghost) A.forEach(m => m.orig = null);
    if (pb === null || pb.ghost) B.forEach(m => m.orig = null);
    this.sides = [new Side(pa, A), new Side(pb, B)];
  }
  frame(ev) { this.frames.push(Object.assign({boards: [snap(this.sides[0]), snap(this.sides[1])]}, ev)); for (const s of this.sides) for (const m of s.b) { m.popped = false; m.toxicked = false; } }
  startOfCombat(k) {
    const me = this.sides[k], them = this.sides[1 - k], b = me.b, e = them.b;
    const punks = b.filter(m => m.tribe === P).length, taunts = b.filter(m => m.taunt).length;
    const amp = b.reduce((s, m) => s + 2 * m.n('Crust Punk') * (m.golden ? 2 : 1), 0);
    const ev = (src, kind, tgts) => this.frame({type: 'soc', side: k, src: src.id, kind, tgts: (tgts || []).map(x => x.id)});
    if (me.p && me.p.hero === 'h_minimalist') {}  // not in v0.1
    for (const m of b.slice()) if (m.name === 'Brand Ambassador') { let n = Math.min(4, 7 - b.length); for (let i = 0; i < n; i++) combatFollower(me, b.length); if (n) ev(m, 'summon'); }
    if (b.some(m => m.is_('Blue Checkmark'))) for (const o of b) if (o.follower) o.twice = true;
    if (b.some(m => m.is_('Enlightened Guru'))) for (const o of b) if (o.taunt && !o.is_('Enlightened Guru')) o.cap3 = true;
    for (const m of b.slice()) {
      const n = m.name;
      if (m.n('Robot Vacuum') && e.length) for (let i = 0; i < m.n('Robot Vacuum'); i++) { const live = e.filter(x => x.hp > 0); if (live.length) { const t = minBy(live, x => x.hp); hit(t, 1); ev(m, 'shot', [t]); } }
      if (n === 'Corporate Raider' && e.length) { const t = minBy(e, x => x.hp); hit(t, 5); ev(m, 'shot', [t]); }
      else if (n === 'Paparazzi' && b.length) { const t = maxBy(b, x => x.atk); t.shield = true; ev(m, 'give', [t]); }
      else if (n === 'Quiet-Hours Enforcer' && e.length) { e[0].atk = Math.max(0, e[0].atk - 2); ev(m, 'shot', [e[0]]); }
      else if (n === 'Wi-Fi Leech') { const k2 = neighbours(b, m).length; m.atk += k2; m.hp += k2; ev(m, 'self'); }
      else if (n === 'Leaf Blower Guy') { for (const x of b.concat(e)) if (x !== m) hit(x, 1); ev(m, 'sweep', b.concat(e).filter(x => x !== m)); }
      else if (n === 'Tree Hugger') { const nb = neighbours(b, m); for (const o of nb) { o.atk += 1; o.hp += 2; } ev(m, 'give', nb); }
      else if (n === 'Guerrilla Gardener') { const t = minBy(b, x => x.hp); t.shield = true; ev(m, 'give', [t]); }
      else if (n === 'Human Chain') { const nb = neighbours(b, m); for (const o of nb) o.shield = true; ev(m, 'give', nb); }
      else if (n === 'Old-Growth Blockade') { const os = b.filter(o => o !== m); for (const o of os) { o.atk += taunts; o.hp += 2 * taunts; } ev(m, 'give', os); }
      else if (n === 'E-Sports Coach') { const o = leftOf(b, m); if (o) { o.toxic = true; ev(m, 'give', [o]); } }
      else if (n === 'World Record') { const os = b.filter(o => o !== m && isTribe(o, T)); for (const o of os) o.toxic = true; if (os.length) ev(m, 'give', os); }
      else if (n === 'Graffiti Kid' && e.length) { hit(e[0], punks + amp); ev(m, 'shot', [e[0]]); }
      else if (n === 'Heckler' && e.length) { const t = maxBy(e, x => x.atk); hit(t, 3 + amp); ev(m, 'shot', [t]); }
      else if (n === 'Feedback Loop') { for (const x of e) hit(x, 1 + amp); const killed = e.some(x => x.hp <= 0); if (killed) for (const o of b) if (o.tribe === P) perm(o, 3, 2); ev(m, 'sweep', e); }
      else if (n === 'Mosh Pit' && e.length) { const t = maxBy(e, x => x.atk); t.shield = false; hit(t, m.atk + amp); if (t.hp <= 0) perm(m, Math.max(0, t.atk), 0); ev(m, 'shot', [t]); }
      else if (n === 'Stage Diver' && e.length) { const t = e[0]; hit(t, m.atk + amp); perm(m, 2, 0); ev(m, 'shot', [t]); }
      else if (n === 'General Strike') { const alive = e.filter(x => x.hp > 0); for (const x of e) hit(x, punks + amp); const k2 = alive.filter(x => x.hp <= 0).length; if (k2) for (const o of b) if (o.tribe === P) perm(o, k2, k2); ev(m, 'sweep', e); }
    }
    me.vv = P_.vv * b.reduce((s, m) => s + m.n('Viral Video'), 0);
  }
  afterDamage(side) {
    const b = side.b;
    for (const m of b.slice()) {
      const h = m.hits || 0; if (!h) continue; m.hits = 0;
      if (m.is_('The Cynic')) for (const o of b) if (o !== m && o.tribe === PH) o.atk += h * m.n('The Cynic');
      if (m.hp > 0 && !m.surv_used && ['Stoicism Podcaster', 'Cold-Plunge Stoic', 'Marathon Monk', 'Desert Hermit'].includes(m.name)) {
        m.surv_used = true; const n = m.name;
        if (n === 'Stoicism Podcaster') perm(m, 0, 1); else if (n === 'Cold-Plunge Stoic') perm(m, 1, 1);
        else if (n === 'Marathon Monk') { const o = rightOf(b, m); if (o) perm(o, 2, 2); }
        else for (const o of b) if (o !== m && o.tribe === PH) perm(o, 3, 3);
        this.frame({type: 'trigger', src: m.id});
      }
    }
  }
  onKill(side, killer) {
    if (!side.b.includes(killer)) return;
    if (killer.is_('Speedrunner') && killer.speed_used < 2) { killer.speed_used++; perm(killer, 2, 1); }
    if (killer.is_('Pro Gamer') && !killer.kill_used) { killer.kill_used = true; perm(killer, 4, 4); }
    if (isTribe(killer, T) && side.p) side.p.techie_kills += 1;
  }
  combatWhenSold(side, m, idx) {
    const b = side.b, n = m.name;
    if (n === 'Anarchist Barista' && side.p && !side.p.ghost) side.p.bonus_next += 1;
    else if (n === 'Zine Maker' && idx < b.length) { b[idx].atk += 3; b[idx].hp += 3; }
    else if (n === 'Sellout Frontman') { for (const o of b) if (o.tribe === P) { o.atk += 2; o.hp += 2; } }
    else if (n === 'Energy-Drink Sponsor') { const k = side.p ? Math.min(6, side.p.punks_sold || 0) : 0; for (const o of b) if (o.tribe === P) { o.atk += k; o.hp += k; } }
  }
  resolveDeaths(k, ptr) {
    const side = this.sides[k], b = side.b;
    let changed = true;
    while (changed) {
      changed = false;
      for (const m of b.slice()) {
        if (m.hp > 0) continue;
        if (m.name === 'Too Big to Fail' && !m.tbf_used) { m.tbf_used = true; m.hp = 1; for (const o of b) if (o !== m && o.tribe === H) { o.atk += 3; o.hp += 3; } this.frame({type: 'trigger', src: m.id}); changed = true; continue; }
        const idx = b.indexOf(m), nbs = neighbours(b, m);
        b.splice(idx, 1); if (idx < ptr) ptr -= 1;
        this.frame({type: 'death', side: k, id: m.id});
        let legacy = false;
        if (m.tribe === P && b.some(x => x.is_('Squat Collective'))) { const r = b.some(x => x.is_('Reunion Tour')) ? 2 : 1; for (let i = 0; i < r; i++) this.combatWhenSold(side, m, idx); legacy = true; }
        const reps = b.some(x => x.is_('Estate Lawyer')) ? 2 : 1;
        for (let r = 0; r < reps; r++) {
          const n = m.name;
          if (n === 'Reply Guy') { combatFollower(side, idx); legacy = true; }
          else if (n === 'Comment Section' || n === 'Unboxing Streamer') { combatFollower(side, idx); combatFollower(side, idx); legacy = true; }
          else if (n === 'Package Hoarder' || n === 'Open Mic Poet') { for (const o of nbs) { o.atk += 2; o.hp += 2; } legacy = true; }
          else if (n === 'Golden Parachute Exec' && side.p && !side.p.ghost) { side.p.bonus_next += 2; legacy = true; }
          else if (n === 'Struggling Artist') { for (const o of b) { o.atk += 1; o.hp += 1; } legacy = true; }
          else if (n === 'Nihilist') { for (const o of nbs) o.atk += 1; legacy = true; }
          else if (n === 'Dead Rock Star') { for (const o of b) if (o.tribe === C) perm(o, 3, 3); legacy = true; }
          else if (n === 'Rage Quitter') { const kk = m.killer; if (kk && kk.hp > 0) { hit(kk, 3); legacy = true; } }
        }
        if (legacy) this.frame({type: 'legacy', side: k, id: m.id, name: m.name});
        for (const v of b) {
          if (v.is_('Art Critic') && v.critic < 3) { v.critic++; perm(v, 1, 1); }
          if (v.is_('Memorial Mural')) for (const o of b) if (o !== v && o.tribe === C) o.atk += v.n('Memorial Mural');
          if (v.is_('Museum Retrospective') && v.retro < 2) { v.retro++; for (const o of b) if (o !== v && o.tribe === C) perm(o, 3, 3); }
        }
        if (side.vv > 0) { side.vv--; if (combatFollower(side, idx)) this.frame({type: 'summon', side: k}); }
        if (m.rebrand) {
          const r = Object.assign(Object.create(Object.getPrototypeOf(m)), m);
          r.hp = 1; r.rebrand = false; r.extras = m.extras.slice(); r.hits = 0; r.id = UID++; r.orig = m.orig;
          b.splice(Math.min(idx, b.length), 0, r); this.frame({type: 'rebrand', side: k, id: r.id});
        }
        changed = true; break;
      }
    }
    return ptr;
  }
  settle(ptr) {
    for (let i = 0; i < 8; i++) {
      this.afterDamage(this.sides[0]); this.afterDamage(this.sides[1]);
      ptr[0] = this.resolveDeaths(0, ptr[0]); ptr[1] = this.resolveDeaths(1, ptr[1]);
      if (!this.sides.some(s => s.b.some(m => m.hp <= 0 || m.hits))) break;
    }
  }
  run() {
    const [A, B] = [this.sides[0].b, this.sides[1].b];
    this.frame({type: 'start'});
    this.startOfCombat(0); this.startOfCombat(1);
    const ptr = [0, 0]; this.settle(ptr);
    let turn = A.length > B.length ? 0 : B.length > A.length ? 1 : this.rng.int(0, 1);
    this.first = turn;
    this.frame({type: 'first', side: turn});
    for (let guard = 0; guard < 300; guard++) {
      const sA = this.sides[0].b, sB = this.sides[1].b;
      if (!sA.length || !sB.length) break;
      const me = this.sides[turn], them = this.sides[1 - turn];
      if (!me.b.some(m => m.atk > 0)) { if (!them.b.some(m => m.atk > 0)) break; turn = 1 - turn; continue; }
      if (ptr[turn] >= me.b.length) ptr[turn] = 0;
      while (me.b[ptr[turn]].atk <= 0) ptr[turn] = (ptr[turn] + 1) % me.b.length;
      const att = me.b[ptr[turn]], swings = att.twice ? 2 : 1;
      for (let s = 0; s < swings; s++) {
        if (att.hp <= 0 || !me.b.includes(att) || !them.b.length) break;
        const taunts = them.b.filter(m => m.taunt);
        const tgt = this.rng.choice(taunts.length ? taunts : them.b);
        const da = att.atk, dt = tgt.atk;
        hit(tgt, att.atk, att); hit(att, tgt.atk, tgt);
        this.frame({type: 'attack', side: turn, att: att.id, tgt: tgt.id, da, dt});
        if (tgt.hp <= 0) { tgt.killer = att; this.onKill(me, att); }
        if (att.hp <= 0) { att.killer = tgt; this.onKill(them, tgt); }
        if (s === 0) ptr[turn] += 1;
        this.settle(ptr);
      }
      turn = 1 - turn;
    }
    const a = this.sides[0].b, b = this.sides[1].b;
    this.result = a.length && !b.length ? 1 : b.length && !a.length ? -1 : 0;
    this.survivors = this.result === 1 ? a : this.result === -1 ? b : [];
    this.frame({type: 'end', result: this.result});
    return this;
  }
}

const damageCap = turn => turn <= 3 ? 5 : turn <= 7 ? 10 : 15;

root.LSEngine = {H, I, F, C, T, P, PH, N, TRIBES, FEED_SIZE, LEVEL_COST, CURVE, TARGETED_FI, load, RNG, M, Player, Fight, buildPool, damageCap,
  byName: n => BY_NAME[n], byTribe: t => BY_TRIBE[t], styles: () => STYLES};
})(typeof window !== 'undefined' ? window : globalThis);
