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
const P_ = {vv: 4, mc: 4};
const RIGHT_GIVERS = new Set(['Shower Thinker', 'Zine Maker', 'Marathon Monk']);
const LEFT_GIVERS = new Set(['Pub Philosopher']);
const NB_GIVERS = new Set(['Rooftop Beehive', 'Thought Experiment', 'Bestselling Author', 'Tree Hugger', 'Human Chain', 'Desert Hermit',
  'Squat Collective', 'Package Hoarder', 'Open Mic Poet', 'Thought Leader', 'Caretaker', 'Nihilist', 'World Record', 'E-Sports Coach']);
const NEUTRAL_GOOD = {'Caretaker': 2, 'The Landlord': 2, 'Block Party Host': 4, 'Package Hoarder': 1, 'Wi-Fi Leech': 1, 'Leaf Blower Guy': 1};
const SELL_STYLES = ['EX', 'SO'];
const TARGETED_FI = new Set(['Personal Brand', 'Helpful Neighbour', 'Art Student', 'Venture Capitalist']);

let CARDS = [], BY_NAME = {}, BY_TRIBE = {}, STYLES = {}, TOKENS = {};
function load(cards, styles) {
  CARDS = cards; BY_NAME = {}; BY_TRIBE = {}; STYLES = styles;
  for (const c of cards) { BY_NAME[c.name] = c; if (c.token) { TOKENS[c.name] = c; continue; } (BY_TRIBE[c.tribe] = BY_TRIBE[c.tribe] || []).push(c); }
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
  w(n) { return (this.name === n ? (this.golden ? 2 : 1) : 0) + this.extras.filter(x => x === n).length; }   // golden counts double
  get g() { return this.golden ? 2 : 1; }
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
const wsum = (b, n) => b.reduce((s, m) => s + m.w(n), 0);
const skillOf = r => Math.max(0, Math.min(1, r / 5000));

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
    this.skill = opts.skill ?? 0; this.scout = []; this.simSeed = 1; this.rating = opts.rating ?? null; this.powerUsed = false; this.scrollsThisTurn = 0; this.scrollsTotal = 0; this.coachId = null; this.savedFeed = null; this.rereleaseCost = 2; this.merchUsed = new Set(); this.resellUsed = new Set();
    this.likes = 0; this.likeBonus = 0; this.likesSpent = 0; this.feedBuff = {}; this.creativeAtk = 0; this.creativesThisTurn = 0; this.gigUsed = new Set(); this.feedRef = null; this.getFeed = null;
  }
  has(n) { return this.board.some(m => m.is_(n)); }
  count(n) { return this.board.reduce((s, m) => s + m.n(n), 0); }
  wcount(n) { return wsum(this.board, n); }
  note(type, data) { if (this.human) this.log.push(Object.assign({type}, data)); }
  buff(m, a, h, src) {
    if (this.in_eot && m.tribe === F && this.oak) { a *= this.oak; h *= this.oak; }
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
    if (!m.golden && this.board.some(o => o !== m && o.name === m.name && !o.golden)) v += 1.5 * this.skill;
    return v + 1.5 * m.extras.length;
  }
  addLikes(n, src) { if (n > 0) { this.likes += n; this.note('likes', {n, src: src ? src.id : null}); } }
  giveLike(m) {
    if (this.likes <= 0 || !this.board.includes(m)) return false;
    this.likes -= 1; this.likesSpent += 1;
    const k = (1 + this.likeBonus) * (m.is_('Main Character') ? (m.golden ? 6 : 3) : 1);
    this.buff(m, k, k); return true;
  }
  spendLikes() { while (this.likes > 0 && this.board.length) { const mc = this.board.find(m => m.is_('Main Character')); this.giveLike(mc || this.carry()); } }
  feedBonus(card) { const b = this.feedBuff[card.tribe]; return b ? b : {a: 0, h: 0}; }
  addFeedBuff(tribe, a, h) {
    const b = this.feedBuff[tribe] = this.feedBuff[tribe] || {a: 0, h: 0}; b.a += a; b.h += h;
    const feed = this.getFeed ? this.getFeed() : this.feedRef;
    if (feed) for (const f of feed) if (f.card.tribe === tribe) { f.a += a; f.h += h; }
    this.note('feedbuff', {tribe, a, h});
  }
  canGig(m) { return m.is_('Side Hustle') && !this.gigUsed.has(m.id) && this.gold[0] >= 1; }
  sideGig(m, target) {
    if (!this.canGig(m) || !this.board.includes(target)) return false;
    this.gold[0] -= 1; this.gainSpend(1); this.gigUsed.add(m.id);
    const k = m.golden ? 4 : 2; this.buff(target, k, k, m); return true;
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
    const ef = 6 * wsum(board, 'Engagement Farmer'); f.atk += ef; f.hp += ef;
    board.push(f); this.note('summon', {id: f.id});
    return f;
  }
  gainSpend(amount) {
    const before = this.spent; this.spent += amount;
    const cons = this.board.filter(m => m.is_('Consultant')), step = cons.some(m => m.golden) ? 2 : cons.length ? 3 : 4;
    for (let k = 0; k < Math.floor(this.spent / step) - Math.floor(before / step); k++)
      for (const m of doubled(this.board.slice())) if (m.is_('Thought Leader')) for (const o of this.board) if (o !== m && o.tribe === H) this.buff(o, 1, 1, m);
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
    const reps = (1 + this.wcount('Wedding DJ')) * m.g;
    for (let r = 0; r < reps; r++) {
      const n = m.name, others = this.board.filter(o => o !== m);
      if (n === 'Dropshipper') { this.bonus_next += 1; this.note('gold_next', {id: m.id, n: 1}); }
      else if (n === 'Unboxing Streamer') this.addLikes(3, m);
      else if (n === 'Personal Brand') { this.addLikes(2, m); this.likeBonus += 1; this.note('likebonus', {id: m.id}); }
      else if (n === 'Engagement Bot') this.summonFollower();
      else if (n === 'Helpful Neighbour') { const tgt = target && this.board.includes(target) ? target : maxBy(others.length ? others : [m], o => this.value(o)); this.buff(tgt, 3, 3, m); }
      else if (n === 'Venture Capitalist') {
        const inv = Math.min(gold[0], 4);
        if (inv) { gold[0] -= inv; this.gainSpend(inv); const tgt = target && this.board.includes(target) ? target : maxBy(this.board, o => this.value(o)); this.buff(tgt, 4 * inv, 4 * inv, m); this.note('invest', {n: inv}); }
      } else if (n === 'Art Student') {
        const cr = others.filter(o => o.tribe === C);
        if (cr.length) { const tgt = target && cr.includes(target) ? target : maxBy(cr, o => this.value(o)); this.buff(tgt, 2, 2, m); }
      }
      else if (m.c && m.c.discover) this.discover(m.c.discover, gold);
    }
  }
  afterCollab() {
    for (const x of doubled(this.board.slice())) { const k1 = x.n('Firmware Update'); if (k1) for (const o of this.board) if (isTribe(o, T)) this.buff(o, 2 * k1, k1, x); }
  }
  afterPlay(card, played, gold) {
    if (card.tribe === C) this.creativesThisTurn += 1;
    if (card.tribe === C) for (const x of this.board) if (x.is_('Merch Stand') && x !== played && !this.merchUsed.has(x.id)) { this.merchUsed.add(x.id); this.bonus_next += x.g; this.note('gold_next', {id: x.id, n: x.g}); }
    for (const x of doubled(this.board.slice())) {
      if (x === played && !card.collab) continue;
      if (x.is_('Grindset Guru') && card.tribe === H && x !== played) this.buff(x, 1, 1, x);
      if (x.n('World Tour')) for (const o of this.board) if (o.tribe === C) this.buff(o, 2 * x.n('World Tour'), 2 * x.n('World Tour'), x);
      if (card.tribe !== C) continue;
      if (x.is_('Busker')) this.buff(x, 1, 1, x);
      if (x.is_('Indie Band')) { this.buff(x, 1, 1, x); this.buff(played, 3, 3, x); }
      if (x.is_('Record Label') && x !== played) this.buff(played, 3 * this.creativesThisTurn, 3 * this.creativesThisTurn, x);
      if (x.is_('Festival Headliner')) for (const o of this.board) if (o.tribe === C && o !== x) this.buff(o, 3, 3, x);
    }
  }
  stick(card, tgt) {
    tgt.atk += card.atk; tgt.hp += card.hp; tgt.shield = tgt.shield || card.shield; tgt.rebrand = tgt.rebrand || card.rebrand; tgt.toxic = tgt.toxic || card.toxic;
    if (card.tribe === T && tgt.tribe !== T) tgt.tribe2 = T;
    tgt.extras.push(card.name); this.buffed.add(tgt.id); this.note('collab', {id: tgt.id, name: card.name});
    this.afterCollab();
  }
  play(card, gold, pos = null, target = null, bonus = null) {
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
    if (bonus) { m.atk += bonus.a; m.hp += bonus.h; }
    if (card.tribe === C && this.creativeAtk) m.atk += this.creativeAtk;
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
    let g = m.name === 'Unpaid Intern' ? 2 * m.g : m.name === 'Crypto Bro' ? (m.turns_on_board > 5 ? 0 : Math.min(1 + m.turns_on_board, 6) * m.g) : 1;
    return g + m.sell_bonus;
  }
  sell(m, gold) {
    const g = this.sellValue(m), i = this.board.indexOf(m), right = this.board[i + 1] || null;
    this.board.splice(i, 1); gold[0] += g; this.note('sold', {id: m.id, g});
    const reps = m.tribe === P ? 1 + this.wcount('Reunion Tour') : 1;
    for (let r = 0; r < reps; r++) this.whenSold(m, right);
    if (m.tribe === P && !m.follower) this.punks_sold += 1;
    if (m.tribe === P && !m.follower && this.has('Greatest Hits')) { const k = this.board.some(x => x.is_('Greatest Hits') && x.golden) ? 2 : 1; for (let i = 0; i < k; i++) this.rerelease.push(m.c); }
    this.afterSell(m);
  }
  whenSold(m, right) {
    const n = m.name, g = m.g;
    if (n === 'Anarchist Barista') { this.bonus_next += g; this.note('gold_next', {n: g}); }
    else if (n === 'Zine Maker' && right) this.buff(right, 4 * g, 4 * g);
    else if (n === 'Sellout Frontman') { for (const o of this.board) if (o.tribe === P) this.buff(o, 3 * g, 3 * g); this.addFeedBuff(P, g, g); }
    else if (n === 'Energy-Drink Sponsor') { const k = Math.min(16, 2 * this.punks_sold) * g; if (k) for (const o of this.board) if (o.tribe === P) this.buff(o, k, k); }
  }
  afterSell(sold) {
    for (const o of this.board) if (o.is_('Sneaker Reseller') && !this.resellUsed.has(o.id)) { this.resellUsed.add(o.id); for (const x of this.board) if (x.tribe === H) this.buff(x, 2 * o.g, 2 * o.g, o); }
    for (const o of doubled(this.board.slice())) {
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
    let b = this.board; this.in_eot = true; this.oak = 1 + this.wcount('Ancient Oak');
    for (const m of doubled(b.slice())) {
      b = this.board; if (!b.includes(m)) continue;
      const n = m.name;
      if (n === 'Middle Manager') {
        const left = leftOf(b, m);
        if (left) { const v = left; v.atk -= Math.min(1, v.atk); v.hp -= 1; this.note('drain', {id: v.id, src: m.id}); this.buff(m, 1, 1, m);
          if (v.hp <= 0) { b.splice(b.indexOf(v), 1); this.bonus_next += 1; this.note('shopdeath', {id: v.id}); this.onShopDeath(v); } }
      } else if (n === 'Stan Account') this.addLikes(2, m);
      else if (n === 'Ring Light Studio') this.addLikes(2 * b.filter(o => o.tribe === I && o !== m).length, m);
      else if (n === 'Guerrilla Gardener') this.addFeedBuff(F, 1, 1);
      else if (n === 'Private Equity') {
        const feed = this.getFeed ? this.getFeed() : this.feedRef;
        if (feed && feed.length) { const f = maxBy(feed, x => x.card.atk + x.a); feed.splice(feed.indexOf(f), 1); m.atk += (f.card.atk + f.a) >> 1; m.hp += (f.card.hp + f.h) >> 1; this.buffed.add(m.id); this.note('acquire', {id: m.id, name: f.card.name, a: (f.card.atk + f.a) >> 1, h: (f.card.hp + f.h) >> 1}); }
      }
      else if (n === 'Giveaway Host') { this.fbonus += 2; for (const o of b) if (o.follower) this.buff(o, 2, 2, m); }
      else if (n === 'Caretaker') { for (const o of neighbours(b, m)) this.buff(o, 1, 2, m); }
      else if (n === 'The Landlord') {
        for (const o of neighbours(b, m)) { o.atk = Math.max(0, o.atk - 1); o.hp -= 1; m.atk += 1; m.hp += 1; this.note('drain', {id: o.id, src: m.id});
          if (o.hp <= 0) { b.splice(b.indexOf(o), 1); this.note('shopdeath', {id: o.id}); this.onShopDeath(o); } }
      } else if (n === 'Block Party Host') { for (const o of b) { const k = neighbours(b, o).length; if (k) this.buff(o, k, k, m); } }
      else if (n === 'Unicorn Startup') { const g = this.spent_this_turn >> 1; if (g) for (const o of b) if (o !== m && o.tribe === H) this.buff(o, g, g, m); }
      else if (n === 'Protest Camp') { for (const o of b) if (o !== m && o.taunt && o.tribe === F) this.buff(o, 2, 2, m); }
      else if (n === 'Windowsill Succulent') { if (m.turns_on_board > 0 && m.turns_on_board % 2 === 0) this.buff(m, 2, 2, m); }
      else if (n === 'Monstera') this.buff(m, 1, 1, m);
      else if (n === 'Plant Parent') { for (const o of b) if (o !== m && o.tribe === F) this.buff(o, 1, 1, m); }
      else if (n === 'Rooftop Beehive') { for (const o of neighbours(b, m)) this.buff(o, 2, 2, m); }
      else if (n === 'World Tree') { const k = Math.min(4, m.turns_on_board); if (k) for (const o of b) if (o !== m && o.tribe === F) this.buff(o, k, k, m); }
      else if (n === 'Shower Thinker') { const o = rightOf(b, m); if (o) this.tbuff(o, 3, 3, m); }
      else if (n === 'Pub Philosopher') { const o = leftOf(b, m); if (o) this.tbuff(o, 4, 2, m); }
      else if (n === 'Thought Experiment') { for (const o of neighbours(b, m)) this.tbuff(o, 3, 3, m); }
      else if (n === 'Utilitarian') { for (const o of b.filter(o => o !== m && o.tribe === PH).sort((x, y) => x.atk - y.atk).slice(0, 3)) this.buff(o, 2, 2, m); }
      if (m.n('Smart Plug')) this.buff(m, 0, m.n('Smart Plug'));
      if (m.n('Smart Fridge')) { const k = m.n('Smart Fridge'); for (const o of b) if (isTribe(o, T)) this.buff(o, k, k, m); }
    }
    b = this.board;
    this.in_eot = false;
    for (const m of b) if (m.is_('Grand Unified Theory')) { const k = m.golden ? 3 : 2; for (const o of b) { o.ta *= k; o.th *= k; } }
    for (const m of b) if (m.name === 'Bestselling Author') for (const o of b) if (o.tribe === PH && (o.ta || o.th)) { o.atk += o.ta; o.hp += o.th; this.note('buff', {id: o.id, a: o.ta, h: o.th, src: m.id}); if (!m.golden) o.ta = o.th = 0; }
    for (const m of b) m.fb = this.fbonus;
  }
  onShopDeath(v) {
    const reps = 1 + this.wcount('Estate Lawyer'), g = v.g;
    for (let r = 0; r < reps; r++) {
      if (v.name === 'Reply Guy') for (let i = 0; i < g; i++) this.summonFollower();
      else if (v.name === 'Comment Section') for (let i = 0; i < 2 * g; i++) this.summonFollower();
      else if (v.name === 'Unboxing Streamer') for (let i = 0; i < g; i++) this.summonFollower();
      else if (v.name === 'Compost Heap') this.addFeedBuff(F, g, g);
      else if (v.name === 'Golden Parachute Exec') this.bonus_next += 2 * g;
    }
  }
  drawFeed() { const [cards, w] = this.pool[this.tier]; return this.rng.choices(cards, w, FEED_SIZE[this.tier]); }
  feedEntries(cards) { return cards.map(c => { const fb = this.feedBonus(c); return {card: c, a: fb.a, h: fb.h}; }); }
  levelCost() { return this.tier >= 6 ? null : Math.max(0, LEVEL_COST[this.tier + 1] - this.turns_at_tier); }
  minionCost(entry) { if (entry && entry.discount) return entry.discount; return this.hero === 'h_bargainhunter' ? 2 : 3; }
  scrollCost() { if (this.hero === 'h_doomscroller' && this.scrollsThisTurn === 0) return 0; return this.hero === 'h_bargainhunter' ? 2 : 1; }
  /** Pays for a Scroll and runs scroll triggers. Returns false if the player can't afford it. */
  payScroll() {
    const c = this.scrollCost(); if (this.gold[0] < c) return false;
    this.gold[0] -= c; if (c) this.gainSpend(c); this.scrollsThisTurn++; this.scrollsTotal++;
    if (this.hero === 'h_doomscroller' && this.scrollsTotal % DOOM_EVERY === 0) this.heroDiscover(this.tier);
    return true;
  }
  doomLeft() { return DOOM_EVERY - (this.scrollsTotal % DOOM_EVERY); }

  // ---- hero powers
  powerCost() { const h = HERO_POWERS[this.hero]; return h ? h.cost : null; }
  canPower() { const c = this.powerCost(); return c != null && !this.powerUsed && this.gold[0] >= c; }
  powerNeedsTarget() { const h = HERO_POWERS[this.hero]; return !!(h && h.target) && this.board.length > 0; }
  usePower(target, feed) {
    if (!this.canPower()) return false;
    const c = this.powerCost(); this.gold[0] -= c; if (c) this.gainSpend(c); this.powerUsed = true;
    const h = this.hero;
    if (h === 'boomer') {
      if (target && this.board.includes(target)) this.buff(target, 1, 1);
      const f = feed || (this.getFeed ? this.getFeed() : null); if (f) for (const e of f) { e.a += 1; e.h += 1; }
      this.note('feedbuff', {tribe: '*', a: 1, h: 1});
    } else if (h === 'h_serial' && target && this.board.includes(target)) {
      const t = Math.min(6, target.tier + 1), opts = this.pool[6][0].filter(c => c.tier === t && !c.collab);
      const card = this.rng.choice(opts), m = new M(card);
      if (target.c) { m.atk += Math.max(0, target.atk - target.c.atk); m.hp += Math.max(0, target.hp - target.c.hp); }   // keeps what it gained
      if (card.tribe === C && this.creativeAtk) m.atk += this.creativeAtk;
      this.board[this.board.indexOf(target)] = m; this.note('transform', {id: m.id, old: target.id});
      this.checkTriple(card, this.gold);
    } else if (h === 'h_overthinker') this.heroDiscover(this.tier, true);
    else if (h === 'h_lifecoach' && target && this.board.includes(target)) { this.tbuff(target, 2, 2); this.coachId = target.id; }
    return true;
  }
  heroDiscover(tier, orLower) {
    let opts = this.discoverOptions(null, tier);
    if (orLower) { const cs = this.pool[tier][0].filter(c => !c.token); opts = this.rng.choices(cs, cs.map(c => COPIES[c.tier]), 3); }
    if (this.human) { this.pending.push({kind: 'discover', options: opts, why: 'hero', tier}); return; }
    const best = maxBy(opts, c => this.cardScore(c));
    if (this.board.length < 7 || (best.collab && this.board.length)) this.play(best, this.gold);
  }
  /** After combat: Life Coach keeps the buff if the minion survived. */
  afterCombat(survivedIds) {
    if (this.coachId != null) { const m = this.board.find(x => x.id === this.coachId); if (m && survivedIds.has(m.id)) { m.atk += COACH; m.hp += COACH; this.note('buff', {id: m.id, a: COACH, h: COACH}); } this.coachId = null; }
  }

  // ---- turn structure (shared)
  beginTurn() {
    this.turn += 1; this.kills_last = this.techie_kills; this.techie_kills = 0; this.buffed = new Set();
    this.merch_used = this.side_used = this.sold_hustle = false; this.merchUsed = new Set(); this.resellUsed = new Set(); this.creativesThisTurn = 0; this.gigUsed = new Set(); this.rerelease = []; this.discounts = {}; this.in_eot = this.oak = false;
    this.powerUsed = false; this.scrollsThisTurn = 0;
    for (const m of this.board) { m.turns_on_board += 1; m.ta = m.th = 0; }
    const carry = this.hero === 'h_procrastinator' ? Math.min(3, this.gold[0]) : 0;
    this.gold = [Math.min(2 + this.turn, 10) + this.bonus_next + carry]; this.gold_from = {base: Math.min(2 + this.turn, 10), bonus: this.bonus_next, carry};
    this.bonus_next = 0; this.spent_start = this.spent;
    if (this.turn > 1) this.turns_at_tier += 1;
    if (this.hero === 'h_gymbro' && this.turn % GYM_EVERY === 0) this.addLikes(GYM_LIKES);
  }
  takeTurn() {   // bot
    this.beginTurn(); const gold = this.gold, r = this.rng, sk = this.skill;
    for (const m of this.board.slice()) if (m.name === 'Crypto Bro' && m.turns_on_board >= 5) this.sell(m, gold);
    if (SELL_STYLES.includes(this.style) || [H, P].includes(this.tribe))
      for (const m of this.board.slice()) if (m.c && m.c.sellbait && m.turns_on_board >= 1 && this.board.length > 4) this.sell(m, gold);
    const target = CURVE[this.turn] || 6;
    // skill 0 is the standard bot. Skill adds: levelling a turn early when healthy and rich
    let eager = sk >= 0.4 && this.health >= 20 && this.turn >= 4 && r() < sk, hold = false;
    // skill 0.6+: judge the board in simulated fights first; level early when ahead, stabilise when behind and hurting
    const scouted = sk >= 0.5 ? this.scoutBoards() : [];
    if (sk >= 0.6 && scouted.length && this.board.length && this.tier < 6) {
      const w = this.simScore(this.board, scouted);
      if (w >= 0.7 && this.turn >= 3) eager = true;
      if (w < 0.3 && this.health + this.boundaries < 16) { eager = false; hold = this.tier >= target - 1; }
    }
    if (this.tier < 6 && !hold && (this.tier < target || (eager && this.tier <= target))) {
      const cost = this.levelCost(); if (gold[0] >= cost + (this.tier >= target ? 3 : 0)) { gold[0] -= cost; this.gainSpend(cost); this.tier += 1; this.turns_at_tier = 0; }
    }
    let feed = this.savedFeed || this.feedEntries(this.drawFeed()); this.savedFeed = null;
    this.getFeed = () => feed;
    let scrolls = 0, digs = 0, swaps = 0, guard = 0;
    const maxScrolls = 4 + (this.health < 12 ? Math.round(3 * sk) : 0);
    const hp = this.hero;
    if (hp === 'h_overthinker' && this.canPower() && this.board.length < 7 && gold[0] >= 2 + (this.turn > 2 ? 3 : 0)) this.usePower(null, feed);
    if (hp === 'boomer' && this.canPower() && gold[0] >= 4) this.usePower(this.board.length ? this.carry() : null, feed);
    const opps = scouted;
    const pick = afford => {
      const sc = e => this.cardScore(e.card) + (e.a + e.h) / 4;
      // skill 0.75+: among the top few candidates, test each in simulated fights against scouted boards
      if (sk >= 0.75 && opps.length && afford.length > 1) {
        const top = afford.slice().sort((x, y) => sc(y) - sc(x)).slice(0, 3);
        if (sc(top[0]) - sc(top[top.length - 1]) < 4) return maxBy(top, e => sc(e) + 8 * sk * this.simWith(e, opps));
      }
      return maxBy(afford, sc);
    };
    while (guard++ < 60) {
      if (this.rerelease.length) { for (const c of this.rerelease) feed.push({card: c, a: 0, h: 0, discount: this.rereleaseCost}); this.rerelease = []; }
      const afford = feed.filter(e => this.minionCost(e) <= gold[0]);
      const sc = this.scrollCost();
      if (!afford.length && gold[0] < sc) break;
      if (!afford.length && gold[0] < this.minionCost() && sc > 0) break;
      const best = afford.length ? pick(afford) : null;
      const worst = this.board.length ? minBy(this.board, m => this.value(m)) : null;
      if (best && this.tribe && this.turn >= 3 && best.card.tribe !== this.tribe && gold[0] >= this.minionCost() + sc && digs < 3 && !feed.some(e => e.card.tribe === this.tribe)) {
        if (this.payScroll()) { digs++; feed = this.feedEntries(this.drawFeed()); continue; }
      }
      if (sc === 0 && scrolls === 0 && best && this.tribe && best.card.tribe !== this.tribe) { this.payScroll(); scrolls++; feed = this.feedEntries(this.drawFeed()); continue; }
      if (best) {
        const bs = this.cardScore(best.card), free = this.board.length < 7 || (best.card.collab && this.board.length);
        if (free || (swaps < 3 && bs > this.value(worst) + 1.5)) {
          if (!free) { this.sell(worst, gold); swaps++; }
          gold[0] -= this.minionCost(best); this.gainSpend(this.minionCost(best)); feed.splice(feed.indexOf(best), 1); this.play(best.card, gold, null, null, best); continue;
        }
      }
      if (gold[0] >= this.minionCost() + sc && scrolls < maxScrolls) { if (this.payScroll()) { scrolls++; feed = this.feedEntries(this.drawFeed()); continue; } }
      break;
    }
    if (hp === 'h_serial' && this.canPower() && this.board.length) { const low = minBy(this.board.filter(m => !m.golden && m.tier < 6), m => [m.tier, this.value(m)]); if (low && low.tier <= this.tier) this.usePower(low, feed); }
    if (hp === 'h_lifecoach' && this.canPower() && this.board.length) this.usePower(this.carry(), feed);
    if (hp === 'boomer' && this.canPower() && this.board.length) this.usePower(this.carry(), feed);
    for (const m of this.board.slice()) if (this.canGig(m) && this.board.length) this.sideGig(m, this.carry());
    this.spendLikes();
    this.spent_this_turn = this.spent - this.spent_start;
    // skilled bots Save a Feed that holds a card they want but couldn't afford
    if (sk >= 0.3 && feed.length && r() < sk + 0.3 && feed.some(e => this.cardScore(e.card) > 9 || this.board.some(m => m.name === e.card.name && !m.golden))) this.savedFeed = feed;
    this.feedRef = feed; this.getFeed = null;
    this.arrange();
    this.endOfTurn();
    if (opps.length) this.searchOrder(opps, sk);
  }

  // ---- scouting (smarter bots): simulated fights against the boards opponents showed last round
  scoutBoards() {
    const s = this.scout || []; if (!s.length) return [];
    const next = s.filter(o => o.next), rest = s.filter(o => !o.next).sort((a, b) => b.power - a.power);
    return next.concat(rest).slice(0, 3);
  }
  simScore(board, opps, seeds = 1) {
    let tot = 0, n = 0;
    for (const o of opps) for (let k = 0; k < seeds; k++) {
      const f = new Fight({ghost: true, hero: this.hero, punks_sold: this.punks_sold}, {ghost: true, hero: o.hero}, board, o.board, RNG(this.simSeed++ * 7919));
      f.quiet = true; f.run();
      const w = (o.next ? 2 : 1);
      tot += w * (f.result === 1 ? 1 + 0.02 * f.survivors.length : f.result === 0 ? 0.5 : 0); n += w;
    }
    return tot / n;
  }
  simWith(entry, opps) {
    const m = new M(entry.card); UID--; m.atk += entry.a; m.hp += entry.h;
    let b = this.board.slice();
    if (entry.card.collab) { if (!b.length) return 0; const c = this.carry(); const cp = Object.assign(Object.create(M.prototype), c, {extras: c.extras.concat(entry.card.name), atk: c.atk + entry.card.atk, hp: c.hp + entry.card.hp}); b[b.indexOf(c)] = cp; }
    else if (b.length >= 7) { const w = minBy(b, x => this.value(x)); b.splice(b.indexOf(w), 1, m); } else b.push(m);
    return this.simScore(b, opps);
  }
  /** Tries several orderings of the board in simulated fights and keeps the best one. */
  searchOrder(opps, sk) {
    const b = this.board; if (b.length < 2) return;
    const cands = [b.slice()];
    const byStats = b.slice().sort((x, y) => x.stats() - y.stats());
    cands.push(byStats, byStats.slice().reverse());
    cands.push(b.filter(m => m.taunt).concat(b.filter(m => !m.taunt)));
    cands.push(b.filter(m => !m.taunt).concat(b.filter(m => m.taunt)));
    const legacyFirst = b.filter(m => m.c && /Legacy|Rebrand/.test(m.c.text)).concat(b.filter(m => !(m.c && /Legacy|Rebrand/.test(m.c.text))));
    cands.push(legacyFirst);
    for (let i = 0; i < Math.round(4 * sk); i++) cands.push(this.rng.shuffle(b.slice()));
    const seeds = sk >= 0.9 ? 2 : 1;
    let best = cands[0], bs = this.simScore(cands[0], opps, seeds) + 0.01;   // small bias to keep the current order on ties
    for (const c of cands.slice(1)) { const v = this.simScore(c, opps, seeds); if (v > bs) { bs = v; best = c; } }
    this.board = best;
  }
}

const HERO_POWERS = {boomer: {cost: 1, target: true}, h_serial: {cost: 1, target: true}, h_overthinker: {cost: 2}, h_lifecoach: {cost: 1, target: true}};
let DOOM_EVERY = 5, COACH = 2, GYM_LIKES = 1, COMPLAIN_EVERY = 2, MINI_MAX = 4, MINI_BUFF = 2, GYM_EVERY = 2;

// ======================================================================== combat
function snap(side) {
  return side.b.map(m => ({id: m.id, name: m.name, atk: m.atk, hp: m.hp, shield: m.shield, taunt: m.taunt, toxic: m.toxic, golden: m.golden,
    tier: m.tier, follower: m.follower, tribe: m.tribe, extras: m.extras.slice(), rebrand: m.rebrand}));
}
function perm(m, a, h) { m.atk += a; m.hp += h; if (m.orig) { m.orig.atk += a; m.orig.hp += h; } }
function hit(t, n, src) {
  if (n <= 0 || t.hp <= 0) return 0;
  if (t.shield) { t.shield = false; t.popped = true; return 0; }
  if (t.cap && n > t.cap) n = t.cap;
  if (src && src.toxic) { t.hp = Math.min(t.hp - n, 0); src.toxic = false; t.toxicked = true; } else t.hp -= n;
  t.hits = (t.hits || 0) + 1;
  return n;
}
class Side { constructor(p, b) { this.p = p; this.b = b; this.vv = 0; } }
function combatCopy(m) {
  const c = Object.assign(Object.create(Object.getPrototypeOf(m)), m);
  c.extras = m.extras.slice(); c.orig = m.follower ? null : m; c.atk += m.ta; c.hp += m.th; c.hits = 0; c.surv_used = c.kill_used = false;
  c.speed_used = 0; c.critic = 0; c.retro = 0; c.tbf_used = false; c.cap = 0;
  return c;
}
function combatToken(side, idx, name) {
  const b = side.b; if (b.length >= 7) return null;
  const t = new M(TOKENS[name]); t.hits = 0; t.surv_used = t.kill_used = false; t.speed_used = 0; t.critic = 0; t.retro = 0;
  b.splice(Math.min(idx, b.length), 0, t); return t;
}
function combatFollower(side, idx) {
  const b = side.b; if (b.length >= 7) return null;
  const f = new M(null, true); const fb = Math.max(0, ...b.map(x => x.fb || 0));
  f.atk += fb; f.hp += fb; f.fb = fb;
  const ef = 6 * wsum(b, 'Engagement Farmer'); f.atk += ef; f.hp += ef;
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
  frame(ev) { if (this.quiet) { for (const s of this.sides) for (const m of s.b) { m.popped = false; m.toxicked = false; } return; } this.frames.push(Object.assign({boards: [snap(this.sides[0]), snap(this.sides[1])]}, ev)); for (const s of this.sides) for (const m of s.b) { m.popped = false; m.toxicked = false; } }
  startOfCombat(k) {
    const me = this.sides[k], them = this.sides[1 - k], b = me.b, e = them.b;
    const punks = b.filter(m => m.tribe === P).length, taunts = b.filter(m => m.taunt).length;
    const amp = 2 * wsum(b, 'Crust Punk');
    const ev = (src, kind, tgts) => this.frame({type: 'soc', side: k, src: src.id, kind, tgts: (tgts || []).map(x => x.id)});
    const hero = me.p && me.p.hero;
    if (hero === 'remote' && b.length) { b[0].shield = true; this.frame({type: 'hero', side: k, hero, tgts: [b[0].id]}); }
    if (hero === 'h_minimalist' && b.length <= MINI_MAX) { const e2 = MINI_BUFF; for (const o of b) { o.atk += e2; o.hp += e2; } this.frame({type: 'hero', side: k, hero, tgts: b.map(o => o.id)}); }
    const reach = (m, r) => { const i = b.indexOf(m); return b.filter((o, j) => o !== m && Math.abs(j - i) <= r); };
    for (const m of b.slice()) if (m.name === 'Brand Ambassador') { const kk = 3 * m.g * b.filter(o => o.tribe === I).length; for (let i = 0; i < 2; i++) { const f = combatFollower(me, b.indexOf(m) + 1); if (f) { f.atk += kk; f.hp += kk; } } ev(m, 'summon'); }
    const bc = b.filter(m => m.is_('Blue Checkmark'));
    if (bc.length) { const plus = bc.some(m => m.golden) ? 4 : 0; for (const o of b) if (o.follower) { o.twice = true; o.shield = true; o.atk += plus; o.hp += plus; } ev(bc[0], 'give', b.filter(o => o.follower)); }
    const gurus = b.filter(m => m.is_('Enlightened Guru'));
    if (gurus.length) { const cap = gurus.some(m => m.golden) ? 2 : 3; for (const o of b) if (o.taunt && !o.is_('Enlightened Guru')) o.cap = cap; }
    for (const m of b.slice()) {
      const n = m.name, g = m.g;
      if (m.n('Robot Vacuum') && e.length) for (let i = 0; i < m.n('Robot Vacuum'); i++) { const live = e.filter(x => x.hp > 0); if (live.length) { const t = minBy(live, x => x.hp); hit(t, 2); ev(m, 'shot', [t]); } }
      if (n === 'Corporate Raider' && e.length) { for (let i = 0; i < g; i++) { const live = e.filter(x => x.hp > 0); if (!live.length) break; const t = minBy(live, x => x.hp); hit(t, 6); ev(m, 'shot', [t]); } }
      else if (n === 'Paparazzi' && b.length) { const ts = b.slice().sort((x, y) => y.atk - x.atk).slice(0, g); for (const t of ts) t.shield = true; ev(m, 'give', ts); }
      else if (n === 'Quiet-Hours Enforcer' && e.length) { e[0].atk = Math.max(0, e[0].atk - 2 * g); ev(m, 'shot', [e[0]]); }
      else if (n === 'Wi-Fi Leech') { const k2 = neighbours(b, m).length * g; m.atk += k2; m.hp += k2; ev(m, 'self'); }
      else if (n === 'Leaf Blower Guy') { for (const x of b.concat(e)) if (x !== m) hit(x, g); ev(m, 'sweep', b.concat(e).filter(x => x !== m)); }
      else if (n === 'Tree Hugger') { const nb = neighbours(b, m); for (const o of nb) { o.atk += 2 * g; o.hp += 2 * g; } ev(m, 'give', nb); }
      else if (n === 'Human Chain') { const nb = reach(m, g); for (const o of nb) o.shield = true; ev(m, 'give', nb); }
      else if (n === 'Old-Growth Blockade') { const os = b.filter(o => o !== m); for (const o of os) { o.atk += taunts * g; o.hp += taunts * g; } ev(m, 'give', os); }
      else if (n === 'E-Sports Coach') { const nb = reach(m, g); for (const o of nb) o.toxic = true; if (nb.length) ev(m, 'give', nb); }
      else if (n === 'World Record') { const os = b.filter(o => o !== m && isTribe(o, T)).slice(0, 2 * g); for (const o of os) o.toxic = true; if (os.length) ev(m, 'give', os); }
      else if (n === 'Graffiti Kid' && e.length) { hit(e[0], punks * g + amp); ev(m, 'shot', [e[0]]); }
      else if (n === 'Heckler' && e.length) { const t = maxBy(e, x => x.atk); hit(t, 4 * g + amp); ev(m, 'shot', [t]); }
      else if (n === 'Feedback Loop') { for (const x of e) hit(x, g + amp); const killed = e.some(x => x.hp <= 0); if (killed) for (const o of b) if (o.tribe === P) perm(o, 2 * g, g); ev(m, 'sweep', e); }
      else if (n === 'Stage Diver' && e.length) { const t = e[0]; hit(t, m.atk + amp); perm(m, 4 * g, 0); ev(m, 'shot', [t]); }
      else if (n === 'General Strike') { const alive = e.filter(x => x.hp > 0); for (const x of e) hit(x, punks * g + amp); const k2 = alive.filter(x => x.hp <= 0).length * g; if (k2) for (const o of b) if (o.tribe === P) perm(o, k2, k2); ev(m, 'sweep', e); }
    }
    me.vv = P_.vv * wsum(b, 'Viral Video');
  }
  afterDamage(side) {
    const b = side.b;
    for (const m of b.slice()) {
      const h = m.hits || 0; if (!h) continue; m.hits = 0;
      if (m.is_('The Cynic')) { const k = h * m.w('The Cynic'); for (const o of b) if (o !== m && o.tribe === PH) { o.atk += k; o.hp += k; } }
      if (m.hp > 0 && !m.surv_used && ['Stoicism Podcaster', 'Cold-Plunge Stoic', 'Marathon Monk', 'Desert Hermit'].includes(m.name)) {
        m.surv_used = true; const n = m.name, g = m.g;
        if (n === 'Stoicism Podcaster') perm(m, 0, g); else if (n === 'Cold-Plunge Stoic') perm(m, g, g);
        else if (n === 'Marathon Monk') { const o = rightOf(b, m); if (o) perm(o, 2 * g, 2 * g); }
        else for (const o of b) if (o !== m && o.tribe === PH) perm(o, 3 * g, 3 * g);
        this.frame({type: 'trigger', src: m.id});
      }
    }
  }
  clockIn(side, att) {
    const g = att.golden ? 2 : 1; let fired = false;
    if (att.is_('Hype Man') && side.p && !side.p.ghost && side.p.addLikes) { side.p.addLikes(2 * att.n('Hype Man') * g, att); fired = true; }
    if (att.is_('Urban Fox')) { const fs = side.b.filter(o => o !== att && o.tribe === F && o.hp > 0); if (fs.length) { perm(this.rng.choice(fs), 2 * g, 2 * g); fired = true; } }
    if (att.is_('Leaderboard')) { for (const o of side.b) if (o !== att && isTribe(o, T)) perm(o, 2 * g, g); fired = true; }
    if (fired) this.frame({type: 'trigger', src: att.id});
  }
  onKill(side, killer) {
    if (!side.b.includes(killer)) return;
    if (killer.is_('Speedrunner') && killer.speed_used < 1) { killer.speed_used++; perm(killer, killer.g, killer.g); }
    if (killer.is_('Pro Gamer') && !killer.kill_used) { killer.kill_used = true; perm(killer, 4 * killer.g, 4 * killer.g); }
    if (isTribe(killer, T) && side.p) side.p.techie_kills += 1;
  }
  combatWhenSold(side, m, idx) {
    const b = side.b, n = m.name, g = m.g;
    if (n === 'Anarchist Barista' && side.p && !side.p.ghost) side.p.bonus_next += g;
    else if (n === 'Zine Maker' && idx < b.length) { b[idx].atk += 4 * g; b[idx].hp += 4 * g; }
    else if (n === 'Sellout Frontman') { for (const o of b) if (o.tribe === P) { o.atk += 3 * g; o.hp += 3 * g; } if (side.p && !side.p.ghost && side.p.addFeedBuff) side.p.addFeedBuff(P, g, g); }
    else if (n === 'Energy-Drink Sponsor') { const k = side.p ? Math.min(16, 2 * (side.p.punks_sold || 0)) * g : 0; for (const o of b) if (o.tribe === P) { o.atk += k; o.hp += k; } }
  }
  resolveDeaths(k, ptr) {
    const side = this.sides[k], b = side.b;
    let changed = true;
    while (changed) {
      changed = false;
      for (const m of b.slice()) {
        if (m.hp > 0) continue;
        if (m.name === 'Too Big to Fail' && !m.tbf_used) { m.tbf_used = true; m.hp = 1; for (const o of b) if (o !== m && o.tribe === H) { o.atk += 4 * m.g; o.hp += 4 * m.g; } this.frame({type: 'trigger', src: m.id}); changed = true; continue; }
        const idx = b.indexOf(m), nbs = neighbours(b, m);
        b.splice(idx, 1); if (idx < ptr) ptr -= 1;
        side.deaths = (side.deaths || 0) + 1;
        this.frame({type: 'death', side: k, id: m.id});
        let legacy = false;
        const g = m.g;
        if (m.tribe === P && b.some(x => x.is_('Squat Collective'))) { const r = wsum(b, 'Squat Collective') * (1 + wsum(b, 'Reunion Tour')); for (let i = 0; i < r; i++) this.combatWhenSold(side, m, idx); legacy = true; }
        const reps = 1 + wsum(b, 'Estate Lawyer');
        for (let r = 0; r < reps; r++) {
          const n = m.name;
          if (n === 'Reply Guy') { for (let i = 0; i < g; i++) combatFollower(side, idx); legacy = true; }
          else if (n === 'Comment Section') { for (let i = 0; i < 2 * g; i++) combatFollower(side, idx); legacy = true; }
          else if (n === 'Unboxing Streamer') { for (let i = 0; i < g; i++) combatFollower(side, idx); legacy = true; }
          else if (n === 'City Pigeon') { for (let i = 0; i < g; i++) combatToken(side, idx, 'Pigeon'); legacy = true; }
          else if (n === 'Compost Heap') { if (side.p && !side.p.ghost && side.p.addFeedBuff) side.p.addFeedBuff(F, g, g); legacy = true; }
          else if (n === 'Package Hoarder' || n === 'Open Mic Poet') { const k = n === 'Package Hoarder' ? 3 : 2; for (const o of nbs) { o.atk += k * g; o.hp += k * g; } legacy = true; }
          else if (n === 'Golden Parachute Exec' && side.p && !side.p.ghost) { side.p.bonus_next += 2 * g; legacy = true; }
          else if (n === 'Struggling Artist') { for (const o of b) { o.atk += g; o.hp += g; } legacy = true; }
          else if (n === 'Nihilist') { for (const o of b) o.atk += g; legacy = true; }
          else if (n === 'Dead Rock Star') { for (const o of b) if (o.tribe === C) perm(o, 4 * g, 4 * g); legacy = true; }
          else if (n === 'Rage Quitter') { const kk = m.killer; if (kk && kk.hp > 0) { hit(kk, 5 * g); legacy = true; } }
        }
        if (legacy) this.frame({type: 'legacy', side: k, id: m.id, name: m.name});
        for (const v of b) {
          if (v.is_('Art Critic') && v.critic < 3) { v.critic++; perm(v, v.g, v.g); }
          if (v.is_('Memorial Mural') && side.deaths % 2 === 0) {
            for (let r = 0; r < v.n('Memorial Mural') * (v.golden ? 2 : 1); r++) { if (side.p && !side.p.ghost) side.p.creativeAtk = (side.p.creativeAtk || 0) + 1; for (const o of b) if (o.tribe === C) perm(o, 1, 0); }
            this.frame({type: 'trigger', src: v.id});
          }
          if (v.is_('Museum Retrospective') && side.deaths % 2 === 0) { const g = v.golden ? 6 : 3; for (const o of b) if (o !== v && o.tribe === C) perm(o, g, g); this.frame({type: 'trigger', src: v.id}); }
        }
        if (side.vv > 0) { side.vv--; if (combatFollower(side, idx)) this.frame({type: 'summon', side: k}); }
        const hero = side.p && side.p.hero;
        if (hero === 'h_complainer' && side.deaths % COMPLAIN_EVERY === 0 && b.length) { for (const o of b) { o.atk += 1; o.hp += 1; } this.frame({type: 'hero', side: k, hero, tgts: b.map(o => o.id)}); }
        let back = m.rebrand;
        if (!back && hero === 'h_ex' && !side.exUsed) { side.exUsed = true; back = true; this.frame({type: 'hero', side: k, hero, tgts: []}); }
        if (back) {
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
        this.clockIn(me, att);
        const da = att.atk, dt = tgt.atk;
        const cleave = att.is_('Mosh Pit') ? neighbours(them.b, tgt) : [];
        hit(tgt, att.atk, att); hit(att, tgt.atk, tgt);
        for (const nb of cleave) { hit(nb, att.atk); if (nb.hp <= 0) { nb.killer = att; this.onKill(me, att); } }
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

root.LSEngine = {H, I, F, C, T, P, PH, N, TRIBES, FEED_SIZE, LEVEL_COST, CURVE, TARGETED_FI, HERO_POWERS, skillOf, tune: o => { ({DOOM_EVERY = DOOM_EVERY, COACH = COACH, GYM_LIKES = GYM_LIKES, COMPLAIN_EVERY = COMPLAIN_EVERY, MINI_MAX = MINI_MAX, MINI_BUFF = MINI_BUFF, GYM_EVERY = GYM_EVERY} = o); if (o.costs) for (const k in o.costs) HERO_POWERS[k].cost = o.costs[k]; }, tuning: () => ({DOOM_EVERY, COACH, GYM_LIKES, COMPLAIN_EVERY, MINI_MAX, MINI_BUFF, GYM_EVERY}), load, RNG, M, Player, Fight, buildPool, damageCap,
  byName: n => BY_NAME[n], byTribe: t => BY_TRIBE[t], styles: () => STYLES};
})(typeof window !== 'undefined' ? window : globalThis);
