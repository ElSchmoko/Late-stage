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
const NB_GIVERS = new Set(['Rooftop Beehive', 'Thought Experiment', 'Bestselling Author', 'Tree Hugger', 'Wild Boar', 'Desert Hermit',
  'Squat Collective', 'Package Hoarder', 'Open Mic Poet', 'Thought Leader', 'Caretaker', 'Nihilist', 'World Record', 'E-Sports Coach']);
const NEUTRAL_GOOD = {'Caretaker': 2, 'The Landlord': 2, 'Block Party Host': 4, 'Package Hoarder': 1, 'Wi-Fi Leech': 1, 'Leaf Blower Guy': 1};
const SELL_STYLES = ['EX', 'SO'];
const TARGETED_FI = new Set(['Art Student', 'Venture Capitalist', 'Smart Doorbell']);

let CARDS = [], BY_NAME = {}, BY_TRIBE = {}, STYLES = {}, TOKENS = {};
function load(cards, styles) {
  CARDS = cards; BY_NAME = {}; BY_TRIBE = {}; STYLES = styles;
  for (const c of cards) { BY_NAME[c.name] = c; if (c.token) { TOKENS[c.name] = c; continue; } for (const t of [c.tribe, c.tribe2]) if (t) (BY_TRIBE[t] = BY_TRIBE[t] || []).push(c); }
  CLOCK = new Set(cards.filter(c => /Clock In/.test(c.text || '')).map(c => c.name));
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
    this.id = UID++; this.orig = null; this.fb = 0; this.golden = false; this.tribe2 = card && card.tribe2 || null;
  }
  is_(n) { return this.name === n || this.extras.includes(n) || (!!this.mash && this.mash.includes(n)); }
  n(n) { return (this.name === n ? 1 : 0) + this.extras.filter(x => x === n).length + (this.mash ? this.mash.filter(x => x === n).length : 0); }
  w(n) { return (this.name === n ? (this.golden ? 2 : 1) : 0) + this.extras.filter(x => x === n).length + (this.mash ? this.mash.filter(x => x === n).length : 0); }   // golden counts double
  get g() { return this.golden ? 2 : 1; }
  stats() { return this.atk + this.hp; }
}
const isTribe = (o, t) => o.tribe === t || o.tribe2 === t || (t === C && !!o.cross);   // Crossover Hit: every minion counts as a Creative
/** Board-wide states that follow from the line-up: Crossover Hit, and the effects Mashup Artist borrows from its neighbours. */
function auras(b) {
  const cross = b.some(o => o.name === 'Crossover Hit' || (o.mash && o.mash.includes('Crossover Hit')));
  for (const o of b) { o.cross = cross; if (o.name === 'Mashup Artist') o.mash = neighbours(b, o).filter(x => !x.follower && x.name !== 'Mashup Artist').map(x => x.name); }
  if (!cross) for (const o of b) if (o.name === 'Mashup Artist' && o.mash.includes('Crossover Hit')) { for (const x of b) x.cross = true; break; }
}
let CLOCK = new Set(), SOC_PHASE = false;
const hasClockIn = m => CLOCK.has(m.name) || m.extras.some(x => CLOCK.has(x)) || (!!m.mash && m.mash.some(x => CLOCK.has(x)));
const tribeCount = b => { const s = new Set(); for (const o of b) { if (o.tribe !== N) s.add(o.tribe); if (o.tribe2 && o.tribe2 !== N) s.add(o.tribe2); } return s.size; };
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
// The Feed pool: each tribe has up to 3 cards per tier, chosen on the Collection screen (deck = Set of names; null = default).
const DEFAULT_OFF = new Set(['Unboxing Streamer', 'Loot Box']);
const inDeck = (c, deck) => deck ? deck.has(c.name) : !c.legendary && !c.track && !DEFAULT_OFF.has(c.name);
function buildPool(tribes, deck = null) {
  const all = [...new Set(tribes.flatMap(t => BY_TRIBE[t]).filter(c => inDeck(c, deck)).concat(BY_TRIBE[N].filter(c => inDeck(c, deck))))];
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
    this.pro = !!opts.pro; this.v2 = this.pro && opts.v2 !== false; this.skill = this.pro ? 1 : opts.skill ?? 0; this.expert = opts.expert ?? (this.pro || this.skill >= 0.8); this.persona = this.pro && rng ? PERSONAS[Math.floor(rng() * PERSONAS.length)] : PERSONAS[3]; this.kn = knobs(this.skill); this.scrollUses = {}; this.scout = []; this.simSeed = 1; this.rating = opts.rating ?? null; this.powerUsed = false; this.scrollsThisTurn = 0; this.scrollsTotal = 0; this.coachId = null; this.savedFeed = null; this.rereleaseCost = 2; this.merchUsed = {}; this.resellUsed = new Set();
    this.likes = 0; this.likeBonus = 0; this.likesSpent = 0; this.feedBuff = {}; this.creativeAtk = 0; this.creativesThisTurn = 0; this.gigUsed = new Map(); this.dbUses = {}; this.feedRef = null; this.getFeed = null;
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
      if (this.style && c.style === this.style) v += STYLE_PULL * this.commit();   // bots build toward their own style
      if (c.kind === 'eng') { const decay = Math.max(.25, 1 - .25 * Math.max(0, this.tier - c.tier - 1)); v += 1.5 * (1 + c.tier) * decay * this.commit(); }
    }
    if ((SELL_STYLES.includes(this.style) || [H, P].includes(this.tribe)) && c.sellbait) v += 1;
    v += NEUTRAL_GOOD[m.name] || 0;
    if (m.name === 'DJ Upstairs' && ['FO', 'MC', 'PI', 'PE', 'GA'].includes(this.style) && this.count('DJ Upstairs') <= 1) v += 4;
    if (m.name === 'Lawyer Next Door' && ['FO', 'PF'].includes(this.style) && this.count('Lawyer Next Door') <= 1) v += 4;
    if (!m.golden && this.board.some(o => o !== m && o.name === m.name && !o.golden)) v += 1.5 * this.skill;
    if (this.expert && c) v += 0.8 * this.synergy(c, m) * this.commit();
    if (this.pro && c) v += (this.prm || PRO).plan * planWeight(this.style, c.name) * this.commit();
    if (this.expert && c && this.tier >= 5 && c.style === this.style && c.tier === 6 && !this.board.some(o => o !== m && o.name === c.name)) v += 8;
    return v + 1.5 * m.extras.length;
  }
  addLikes(n, src) { if (n > 0) { this.likes += n; this.note('likes', {n, src: src ? src.id : null}); } }
  /** Stats one Like gives this minion (Personal Brand, Main Character and Ring Light Studio raise it). */
  likeValue(m) {
    const rl = this.board.filter(o => o.is_('Ring Light Studio')), ring = rl.length ? (rl.some(o => o.golden) ? 3 : 2) : 1;
    return (1 + this.likeBonus) * (m && m.is_('Main Character') ? (m.golden ? 4 : 2) : 1) * ring;
  }
  giveLike(m) {
    if (this.likes <= 0 || !this.board.includes(m)) return false;
    this.likes -= 1; this.likesSpent += 1;
    const k = this.likeValue(m);
    this.buff(m, k, k); return true;
  }
  spendLikes() {
    while (this.likes > 0 && this.board.length) { const mc = this.board.find(m => m.is_('Main Character')); this.giveLike(mc || this.carry()); } }
  feedBonus(card) { const b = this.feedBuff[card.tribe]; return b ? b : {a: 0, h: 0}; }
  addFeedBuff(tribe, a, h) {
    const b = this.feedBuff[tribe] = this.feedBuff[tribe] || {a: 0, h: 0}; b.a += a; b.h += h;
    const feed = this.getFeed ? this.getFeed() : this.feedRef;
    if (feed) for (const f of feed) if (f.card.tribe === tribe) { f.a += a; f.h += h; }
    this.note('feedbuff', {tribe, a, h});
  }
  /** Side Gig: an ability a minion uses in the shop, paid in gold, once per turn (Double Shift: more). */
  gigOf(m) { if (GIGS[m.name]) return m.name; if (m.mash) for (const x of m.mash) if (GIGS[x]) return x; return null; }
  gigCost(m) { const k = this.gigOf(m); if (!k) return null; const off = this.board.reduce((s, o) => s + (o.is_('App Store') ? o.g : 0), 0); return Math.max(1, GIGS[k].cost - off); }
  gigLimit() { return 1 + this.board.reduce((s, o) => s + (o.is_('Double Shift') ? o.g : 0), 0); }
  gigsLeft(m) { return this.gigLimit() - (this.gigUsed.get(m.id) || 0); }
  canGig(m) { const c = this.gigCost(m); return c != null && this.board.includes(m) && this.gigsLeft(m) > 0 && this.gold[0] >= c && (this.gigTargets(m) === null || this.gigTargets(m).length > 0); }
  /** Who a Side Gig can target: null = no target needed. */
  gigTargets(m) {
    const t = GIGS[this.gigOf(m)].target;
    if (t === 'hustler') return this.board.filter(o => o !== m && isTribe(o, H));
    if (t === 'other') return this.board.filter(o => o !== m && !o.shield);
    if (t === 'any') return this.board.slice();
    return null;
  }
  sideGig(m, target) {
    if (!this.canGig(m)) return false;
    const tg = this.gigTargets(m); if (tg && !tg.includes(target)) return false;
    const k = this.gigOf(m), cost = this.gigCost(m), g = m.g;
    this.gold[0] -= cost; this.gainSpend(cost); this.gigGold = (this.gigGold || 0) + cost; this.gigUsed.set(m.id, (this.gigUsed.get(m.id) || 0) + 1); this.gigThisTurn = true;
    this.note('gig', {id: m.id, n: cost});
    if (k === 'Side Hustle') this.buff(target, 3 * g, 3 * g, m);
    else if (k === 'Delivery Rider') this.buff(m, 2 * g, g, m);
    else if (k === 'Task Rabbit') { target.shield = true; if (g > 1) this.buff(target, 2, 2, m); else this.note('buff', {id: target.id, a: 0, h: 0, src: m.id}); }
    else if (k === 'Ghost Kitchen') for (let i = 0; i < g; i++) this.kitchen();
    else if (k === 'Battle Pass') { const v = (1 + (m.bp || 0)) * g; this.buff(target, v, v, m); m.bp = (m.bp || 0) + 1; }
    else if (k === 'Paid Verification') this.addLikes(2 * g, m);
    else if (k === 'Sponsored Streamer') { for (const o of this.board) if (isTribe(o, I) || isTribe(o, T)) this.buff(o, 2 * g, 2 * g, m); }
    // after a Side Gig
    for (const o of this.board.slice()) {
      if (o.is_('Platform Monopoly')) for (const x of this.board) this.buff(x, 2 * o.g, 2 * o.g, o);
      if (o.is_('App Store')) this.buff(o, 2 * o.g, 2 * o.g, o);
      if (o.is_('Data Broker') && (this.dbUses[o.id] || 0) < 2) { this.dbUses[o.id] = (this.dbUses[o.id] || 0) + 1; this.bonus_next += o.g; this.note('gold_next', {id: o.id, n: o.g}); }
    }
    auras(this.board);
    return true;
  }
  /** Ghost Kitchen: Discover a minion of your tier or lower. */
  kitchen() {
    const cs = this.pool[this.tier][0].filter(c => !c.token), opts = this.rng.choices(cs, cs.map(c => COPIES[c.tier]), 3);
    if (this.human) { this.pending.push({kind: 'discover', options: opts, why: 'gig'}); return; }
    this.gainCard(maxBy(opts, c => this.cardScore(c)));
  }
  /** Bots: spend leftover gold on Side Gigs (cheap ones first), aiming each at the best target. */
  botGigs() {
    for (let guard = 0; guard < 12; guard++) {
      const ms = this.board.filter(m => this.canGig(m) && !(this.gigOf(m) === 'Ghost Kitchen' && this.board.length >= 7 && !this.human));
      if (!ms.length) return;
      const m = minBy(ms, x => this.gigCost(x)), tg = this.gigTargets(m);
      const t = tg ? maxBy(tg, o => [o.stats(), this.value(o)]) : null;
      if (!this.sideGig(m, t)) return;
    }
  }
  /** A card made by an effect (Encore, Recruitment Agency, AI Art Generator, Ghost Kitchen): the player gets it in the hand;
   *  bots play it when there is room (now, or at the start of their next turn). */
  gainCard(card, o = {}) {
    if (this.human) { this.pending.push({kind: 'hand', card, zero: !!o.zero}); return; }
    (this.queue = this.queue || []).push({card, zero: !!o.zero});
  }
  playQueue() {
    const q = this.queue || []; this.queue = [];
    for (const x of q) if (this.board.length < 7 || (x.card.collab && this.board.length)) { const m = this.play(x.card, this.gold, null, null, x.zero ? {zero: true} : null); if (m && x.zero) m.zero = true; }
  }
  commit() { let c = this.turn <= 3 ? .4 : this.turn <= 5 ? .7 : 1; if (this.health < 15) c *= .6; return c; }
  cardScore(card) {
    const m = new M(card); UID--;
    if (this.tribe === null) return m.stats() / 2 + card.tier * .5;
    const pr = this.pro ? (this.prm || PRO) : null;
    let s = this.value(m) + card.tier * (pr ? pr.tierW : .5) + (pr ? (pr.statW - 0.5) * (card.atk + card.hp) / 2 : 0);
    if (card.tribe === this.tribe) {
      const decay = Math.max(.25, 1 - .25 * Math.max(0, this.tier - card.tier - 1));
      if (card.kind === 'fi' || card.collab) s += 1.5 * (1 + card.tier) * decay;
      if (card.discover) s += 2 * decay;
    }
    if (card.name === 'Helpful Neighbour') s += 2;
    if (card.name === 'Jingle Writer' && this.tribe === P && this.punks_sold >= 2) s += 3 + 3 * this.count('Reunion Tour');
    if (card.collab && this.board.length) s += 1;
    if (!card.collab) s += (1.5 + (this.pro ? (this.prm || PRO).twin : 0)) * this.board.filter(x => x.name === card.name && !x.golden).length;
    return s;
  }
  summonFollower(board) {
    board = board || this.board;
    if (board.length >= 7) return null;
    const f = new M(null, true);
    f.atk += this.fbonus; f.hp += this.fbonus;
    const ef = 6 * wsum(board, 'Engagement Farmer'); f.atk += ef; f.hp += ef;
    board.push(f); this.note('summon', {id: f.id}); this.fsum = (this.fsum || 0) + 1;
    return f;
  }
  gainSpend(amount) {
    const before = this.spent; this.spent += amount;
    const cons = this.board.filter(m => m.is_('Consultant')), step = cons.some(m => m.golden) ? 2 : cons.length ? 3 : 4;
    for (let k = 0; k < Math.floor(this.spent / step) - Math.floor(before / step); k++)
      for (const m of doubled(this.board.slice())) if (m.is_('Thought Leader')) for (const o of this.board) if (o !== m && o.tribe === H) this.buff(o, 1, 1, m);
    for (let k = 0; k < Math.floor(this.spent / step) - Math.floor(before / step); k++)
      for (const m of this.board.slice()) if (m.is_('Cashback Card')) { const u = this.cashUses = this.cashUses || {}; if ((u[m.id] || 0) < 2) { u[m.id] = (u[m.id] || 0) + 1; this.gold[0] += m.g; this.note('refund', {id: m.id, n: m.g}); } }
    for (let k = 0; k < Math.floor(this.spent / step) - Math.floor(before / step); k++)
      for (const m of this.board.slice()) if (m.is_('Loyalty Card')) { const o = leftOf(this.board, m); if (o) this.buff(o, 3 * m.g, 3 * m.g, m); }
    for (const tf of this.board.filter(m => m.is_('Tech Founder'))) for (let k = 0; k < Math.floor(this.spent / 3) - Math.floor(before / 3); k++) for (const o of this.board) if (isTribe(o, H) || isTribe(o, T)) this.buff(o, tf.g, tf.g, tf);
    for (const c of cons) for (let k = 0; k < Math.floor(this.spent / 3) - Math.floor(before / 3); k++) for (const o of this.board) if (o !== c && o.tribe === H) this.buff(o, c.g, c.g, c);   // Consultant's own trigger
  }
  carry() { const c = this.board.filter(m => !m.follower); return maxBy(c.length ? c : this.board, m => [m.stats(), this.value(m)]); }
  discoverOptions(tribe, tier) {
    const inPool = new Set(this.pool[6][0]), cards = tribe ? BY_TRIBE[tribe].filter(c => c.tier <= this.tier && inPool.has(c)) : this.pool[6][0].filter(c => c.tier === tier);
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
    const reps = (1 + this.wcount('DJ Upstairs')) * m.g;
    for (let r = 0; r < reps; r++) {
      const n = m.name, others = this.board.filter(o => o !== m);
      if (n === 'Dropshipper') { this.bonus_next += 1; this.note('gold_next', {id: m.id, n: 1}); }
      else if (n === 'Unboxing Streamer') { this.summonFollower(); this.summonFollower(); this.addLikes(2, m); }
      else if (n === 'Personal Brand') { this.addLikes(2, m); this.likeBonus += 1; this.note('likebonus', {id: m.id}); }
      else if (n === 'Engagement Bot') this.addLikes(m.g, m);
      else if (n === 'Ring Light Studio') this.addLikes(2 * m.g, m);
      else if (n === 'Helpful Neighbour') { const by = {}; for (const o of others) if (!o.follower && o.tribe !== N) (by[o.tribe] = by[o.tribe] || []).push(o); for (const t in by) this.buff(this.rng.choice(by[t]), 2 * m.g, 2 * m.g, m); }
      else if (n === 'Venture Capitalist') {
        const inv = Math.min(gold[0], 4);
        if (inv) { gold[0] -= inv; this.gainSpend(inv); const tgt = target && this.board.includes(target) ? target : maxBy(this.board, o => this.value(o)); this.buff(tgt, 3 * inv, 3 * inv, m); this.note('invest', {n: inv}); }
      } else if (n === 'Art Student') {
        const cr = others.filter(o => isTribe(o, C));
        if (cr.length) { const tgt = target && cr.includes(target) ? target : maxBy(cr, o => this.value(o)); this.buff(tgt, 3, 3, m); }
      }
      else if (n === 'Smart Doorbell') {
        const cands = others.filter(o => !o.follower && !isTribe(o, T) && !o.tribe2);
        const t = target && cands.includes(target) ? target : cands.length ? maxBy(cands, o => this.value(o)) : null;
        if (t) { t.tribe2 = T; this.note('collab', {id: t.id, name: n}); }
      } else if (n === 'Wedding Band') { const l = leftOf(this.board, m); if (l && !this.retrig) { this.retrig = true; this.firstImpression(l, gold, null); this.retrig = false; } }
      else if (m.c && m.c.discover) this.discover(m.c.discover, gold);
    }
  }
  afterCollab() {
    for (const x of doubled(this.board.slice())) { const k1 = x.n('Firmware Update'); if (k1) for (const o of this.board) if (isTribe(o, T)) this.buff(o, k1, k1, x); }
  }
  afterPlay(card, played, gold) {
    const asC = card.tribe === C || card.tribe2 === C || this.has('Crossover Hit');
    if (asC) { this.creativesThisTurn += 1; this.creativesTotal = (this.creativesTotal || 0) + 1; if (card.name !== 'Encore') this.lastCreative = card; }
    if (isTribe(card, C) || isTribe(card, I)) for (const x of this.board) if (x !== played && x.is_('Content Creator')) this.addLikes(2 * x.g, x);
    if (played && played.name === 'Record Label' && played.rl0 == null) played.rl0 = this.creativesTotal;
    const reps = asC ? 1 + this.board.reduce((k, o) => k + o.w('World Tour'), 0) : 1;   // World Tour: Creative-play effects trigger twice
    for (let rep = 0; rep < reps; rep++) {
    if (asC) for (const x of this.board) if (x.is_('Merch Stand') && x !== played && (this.merchUsed[x.id] || 0) < 2) { this.merchUsed[x.id] = (this.merchUsed[x.id] || 0) + 1; this.bonus_next += x.g; this.note('gold_next', {id: x.id, n: x.g}); }
    for (const x of doubled(this.board.slice())) {
      if (x === played && !card.collab) continue;
      if (x.is_('Grindset Guru') && card.tribe === H && x !== played) this.buff(x, 1, 1, x);
      if (!asC) continue;
      if (x.is_('Busker')) this.buff(x, 1, 1, x);
      if (x.is_('Indie Band')) { this.buff(x, 1, 1, x); this.buff(played, 2, 2, x); }
      if (x.is_('Festival Headliner')) for (const o of this.board) if (isTribe(o, C) && o !== x) this.buff(o, 2, 2, x);
    }
    }
  }
  stick(card, tgt) {
    tgt.atk += card.atk; tgt.hp += card.hp; tgt.shield = tgt.shield || card.shield; tgt.rebrand = tgt.rebrand || card.rebrand; tgt.toxic = tgt.toxic || card.toxic;
    if (card.tribe === T && tgt.tribe !== T) tgt.tribe2 = T;
    tgt.extras.push(card.name); this.buffed.add(tgt.id); this.note('collab', {id: tgt.id, name: card.name});
    this.afterCollab();
  }
  /** Extra minions a Collab sticks to (Smart Home Hub: +1 each, golden +2). */
  hubExtra() { return this.board.reduce((k, m) => k + m.w('Smart Home Hub'), 0); }
  play(card, gold, pos = null, target = null, bonus = null, more = null) {
    if (card.collab && this.board.length) {
      let tgt = target && this.board.includes(target) ? target : null;
      if (!tgt) { const own = this.tribe === card.tribe ? this.board.filter(x => !x.follower && isTribe(x, card.tribe)) : []; tgt = own.length ? maxBy(own, x => x.stats()) : this.carry(); }
      const extra = this.hubExtra(), done = [tgt];
      this.stick(card, tgt); auras(this.board);
      for (let i = 0; i < extra; i++) {   // the player picks these (more); bots and unpicked slots take the best other minion
        const pick = more && more[i] && this.board.includes(more[i]) && !done.includes(more[i]) ? more[i] : null;
        const rest = this.board.filter(x => !done.includes(x) && !x.follower);
        const t = pick || (rest.length ? maxBy(rest, x => [isTribe(x, T) ? 1 : 0, x.is_('Smart Home Hub') ? 0 : 1, x.stats()]) : null);
        if (!t) break; done.push(t); this.stick(card, t);
      }
      this.afterPlay(card, tgt, gold);
      return tgt;
    }
    const m = new M(card);
    if (bonus) { m.atk += bonus.a || 0; m.hp += bonus.h || 0; }
    if (bonus && bonus.golden) { m.golden = true; m.atk += card.atk; m.hp += card.hp; if (bonus.extras) m.extras.push(...bonus.extras); m.shield = m.shield || !!bonus.shield; m.sell_bonus += bonus.sell || 0; }
    if (card.tribe === C && this.creativeAtk) m.atk += this.creativeAtk;
    if (bonus && bonus.zero) m.zero = true;
    if (pos === null || pos > this.board.length) this.board.push(m); else this.board.splice(pos, 0, m);
    auras(this.board);
    this.note('play', {id: m.id});
    this.firstImpression(m, gold, target);
    if (this.board.includes(m)) this.afterPlay(card, m, gold);
    this.checkTriple(card, gold);
    return m;
  }
  /** Collects a triple: removes fromBoard non-golden board copies and adds up what every copy gained.
   *  pieces: {a, h} gains of the copies that are not on the board (the new one, and any from the hand).
   *  Returns the golden card's spec {a, h, extras, shield, sell}; play(card, gold, pos, target, {...spec, golden: true}) plays it. */
  takeTriple(card, pieces, fromBoard) {
    const same = this.board.filter(x => x.name === card.name && !x.golden && !x.follower).slice(0, fromBoard);
    const spec = {a: 0, h: 0, extras: [], shield: false, sell: 0};
    for (const x of same) {
      spec.a += x.atk - card.atk; spec.h += x.hp - card.hp; spec.extras.push(...x.extras); spec.shield = spec.shield || (x.shield && !card.shield); spec.sell += x.sell_bonus;
      this.board.splice(this.board.indexOf(x), 1);
    }
    for (const pc of pieces) { spec.a += pc.a || 0; spec.h += pc.h || 0; }
    return spec;
  }
  /** Bots: buying the third copy makes the golden card and plays it at once (bots have no hand), First Impression doubled. */
  tripleOnBuy(card, pieces, gold) {
    const onBoard = this.board.filter(x => x.name === card.name && !x.golden && !x.follower).length;
    if (card.collab || onBoard + pieces.length < 3) return null;
    const spec = this.takeTriple(card, pieces, 3 - pieces.length);
    const m = this.play(card, gold, null, null, Object.assign({golden: true}, spec));
    this.note('triple', {id: m.id});
    this.tripleReward(gold);
    return m;
  }
  tripleReward(gold) {
    const t = Math.min(6, this.tier + 1);
    const opts = this.discoverOptions(null, t);
    if (this.human) { this.pending.push({kind: 'discover', options: opts, why: 'triple', tier: t}); return; }
    const best = maxBy(opts, c => this.cardScore(c));
    if (this.board.length < 7 || (best.collab && this.board.length)) this.play(best, gold);
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
    this.tripleReward(gold);
  }
  sellValue(m) {
    if (m.zero) return 0;
    let g = m.name === 'Unpaid Intern' ? 2 * m.g : m.name === 'Crypto Bro' ? (m.turns_on_board > 6 ? 0 : Math.min(1 + m.turns_on_board, 7) * m.g) : 1;
    return g + m.sell_bonus;
  }
  sell(m, gold) {
    const g = this.sellValue(m), i = this.board.indexOf(m), right = this.board[i + 1] || null;
    this.board.splice(i, 1); auras(this.board); gold[0] += g; this.note('sold', {id: m.id, g});
    const reps = m.tribe === P ? 1 + this.wcount('Reunion Tour') : 1;
    for (let r = 0; r < reps; r++) this.whenSold(m, right);
    if (m.tribe === P && !m.follower) this.punks_sold += 1;
    if (m.tribe === P && !m.follower && this.has('Greatest Hits')) { const k = this.board.some(x => x.is_('Greatest Hits') && x.golden) ? 2 : 1; for (const x of this.board) if (x.tribe === P) this.buff(x, k, k); this.ghSold = (this.ghSold || 0) + 1; if (this.ghSold <= 3) for (let i = 0; i < k; i++) this.rerelease.push(m.c); }
    this.afterSell(m);
  }
  whenSold(m, right) {
    if (m.name === 'Punk Philosopher') for (const o of this.board) if (isTribe(o, P) || isTribe(o, PH)) this.buff(o, 3 * m.g, 3 * m.g, m);
    const n = m.name, g = m.g;
    if (n === 'Anarchist Barista') { this.bonus_next += g; this.note('gold_next', {n: g}); }
    else if (n === 'Pension Fund' && m.pens) { for (const o of this.board) if (isTribe(o, H) || isTribe(o, F)) this.buff(o, m.pens, m.pens, m); }
    else if (n === 'Gig Poster') { this.punkDiscountNext = (this.punkDiscountNext || 0) + g; this.note('discount', {n: g}); }
    else if (n === 'Encore' && this.lastCreative) for (let i = 0; i < g; i++) this.gainCard(this.lastCreative);
    else if (n === 'Zine Maker' && right) this.buff(right, 3 * g, 3 * g);
    else if (n === 'Sellout Frontman') { for (const o of this.board) if (o.tribe === P) this.buff(o, 3 * g, 3 * g); this.addFeedBuff(P, g, g); }
    else if (n === 'Jingle Writer') { const k = Math.min(16, 2 * this.punks_sold) * g; if (k) for (const o of this.board) if (o.tribe === P) this.buff(o, k, k); }
  }
  afterSell(sold) {
    for (const o of this.board.slice()) {
      if (o.is_('Recruitment Agency')) { const u = this.raUses = this.raUses || {}; if ((u[o.id] || 0) < 2) { u[o.id] = (u[o.id] || 0) + 1; for (let i = 0; i < o.g; i++) this.gainCard(BY_NAME['Unpaid Intern']); } }
      if (o.is_('Bootleg Merch') && sold && isTribe(sold, P)) { const u = this.bmUses = this.bmUses || {}; if ((u[o.id] || 0) < 2) { u[o.id] = (u[o.id] || 0) + 1; this.gold[0] += o.g; this.note('refund', {id: o.id, n: o.g}); } }
      if (o.is_('Declutter Coach')) { const os = this.board.filter(x => x !== o); if (os.length) this.buff(this.rng.choice(os), 2 * o.g, 2 * o.g, o); }
    }
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
    auras(this.board);
  }
  endOfTurn() {
    auras(this.board);
    let b = this.board; this.in_eot = true; this.oak = 1 + this.wcount('Ancient Oak');
    for (const m of doubled(b.slice())) {
      b = this.board; if (!b.includes(m)) continue;
      for (const n of [m.name].concat(m.mash || [])) {
      if (!b.includes(m)) break;
      if (n === 'Middle Manager') {
        const left = leftOf(b, m);
        if (left) { const v = left; v.atk -= Math.min(1, v.atk); v.hp -= 1; this.note('drain', {id: v.id, src: m.id}); this.buff(m, 1, 1, m);
          if (v.hp <= 0) { b.splice(b.indexOf(v), 1); this.bonus_next += 2; this.note('shopdeath', {id: v.id}); this.onShopDeath(v); } }
      } else if (n === 'Performance Review') {
        const v = rightOf(b, m);
        if (v) { v.atk -= Math.min(1, v.atk); v.hp -= 1; this.note('drain', {id: v.id, src: m.id}); for (const o of b) if (o !== m && o !== v && isTribe(o, H)) this.buff(o, 1, 1, m);
          if (v.hp <= 0) { b.splice(b.indexOf(v), 1); this.note('shopdeath', {id: v.id}); this.onShopDeath(v); } }
      } else if (n === 'Allotment') { const fs = b.filter(o => o !== m && isTribe(o, F)), k = Math.min(3, b.filter(o => isTribe(o, F)).length); if (fs.length) this.buff(this.rng.choice(fs), k, k, m); }
      else if (n === 'Debate Club') { const nb = neighbours(b, m), k = nb.length === 2 && nb[0].tribe !== nb[1].tribe ? 4 : 3; for (const o of nb) this.tbuff(o, k, k, m); }
      else if (n === 'Five-Star Rating') { if (this.gigThisTurn) for (const o of neighbours(b, m)) this.buff(o, 2, 2, m); }
      else if (n === 'Tulip Bulb' || n === 'Hedgehog') {
        if (m.turns_on_board >= 2 && !m.woke) { m.woke = true; if (n === 'Tulip Bulb') this.buff(m, 3 * m.g, 2 * m.g, m); else { this.buff(m, 2 * m.g, 2 * m.g, m); m.shield = true; } }
      } else if (n === 'Bat Colony') { const fs = b.filter(o => o !== m && isTribe(o, F)); if (fs.length) { const o = maxBy(fs, x => x.turns_on_board), k = Math.min(4, o.turns_on_board); if (k) this.buff(o, k, k, m); } }
      else if (n === 'Hibernating Bear') {   // doubles itself (not affected by Ancient Oak)
        if (m.turns_on_board >= 3 && m.turns_on_board % 3 === 0 && (m.dbl || 0) < 3 && m.dblTurn !== this.turn) {
          m.dblTurn = this.turn; m.dbl = (m.dbl || 0) + 1; const f = m.golden ? 2 : 1, a = m.atk * f, h = m.hp * f;
          m.atk += a; m.hp += h; this.buffed.add(m.id); this.note('buff', {id: m.id, a, h, src: m.id});
        }
      } else if (n === 'Cicada Swarm') {
        if (m.turns_on_board >= 3 && b.includes(m)) { for (const o of b) if (o !== m && isTribe(o, F)) this.buff(o, 6 * m.g, 6 * m.g, m); b.splice(b.indexOf(m), 1); this.note('shopdeath', {id: m.id}); this.onShopDeath(m); }
      } else if (n === 'Seed Vault') { for (const o of b) if (o !== m && isTribe(o, F)) { const k = Math.min(4, o.turns_on_board); if (k) this.buff(o, k, k, m); } }
      else if (n === 'Botanical Garden') { const k = b.filter(o => isTribe(o, F)).length; if (k) this.addFeedBuff(F, k, k); }
      else if (n === 'Van Lifer') { if (b.length <= 4) this.buff(m, 1, 1, m); }
      else if (n === 'Capsule Wardrobe') { const k = 7 - b.length; if (k > 0) for (const o of b) this.buff(o, k, k, m); }
      else if (n === 'TED Talk') { const k = 1 + neighbours(b, m).filter(o => isTribe(o, PH)).length; for (const o of b) this.tbuff(o, k, k, m); }
      else if (n === 'AI Art Generator') { const l = leftOf(b, m); if (l && l.c && !l.follower) this.gainCard(l.c, {zero: true}); }
      else if (n === 'Pension Fund') { this.buff(m, 2, 2, m); m.pens = (m.pens || 0) + 2; }
      else if (n === 'Startup Monk') {
        const os = b.filter(o => o !== m);
        if (os.length) { const v = minBy(os, o => [o.atk, -o.hp]); b.splice(b.indexOf(v), 1); this.note('shopdeath', {id: v.id}); for (const o of b) this.buff(o, v.atk, v.hp, m); auras(b); }
      }
      else if (n === 'Stan Account') this.addLikes(2, m);
      else if (n === 'Guerrilla Gardener') this.addFeedBuff(F, 2, 2);
      else if (n === 'Private Equity') {
        const feed = this.getFeed ? this.getFeed() : this.feedRef;
        if (feed && feed.length) { const f = maxBy(feed, x => x.card.atk + x.a); feed.splice(feed.indexOf(f), 1); m.atk += (f.card.atk + f.a) >> 1; m.hp += (f.card.hp + f.h) >> 1; this.buffed.add(m.id); this.note('acquire', {id: m.id, name: f.card.name, a: (f.card.atk + f.a) >> 1, h: (f.card.hp + f.h) >> 1}); }
      }
      else if (n === 'Giveaway Host') { this.fbonus += 1; for (const o of b) if (o.follower) this.buff(o, 1, 1, m); }
      else if (n === 'Caretaker') { for (const o of neighbours(b, m)) { o.taunt = true; this.buff(o, 1, 2, m); } }
      else if (n === 'The Landlord') {
        for (const o of b.filter(x => x !== m)) { o.atk = Math.max(0, o.atk - 1); o.hp -= 1; m.atk += 2; m.hp += 2; this.note('drain', {id: o.id, src: m.id});
          if (o.hp <= 0) { b.splice(b.indexOf(o), 1); this.bonus_next += 2; this.note('shopdeath', {id: o.id}); this.onShopDeath(o); } }
      } else if (n === 'Block Party Host') { for (const o of b) { const k = 2 * neighbours(b, o).length; if (k) this.buff(o, k, k, m); } }
      else if (n === 'Unicorn Startup') { const g = this.spent_this_turn >> 1; if (g) for (const o of b) if (o !== m && o.tribe === H) this.buff(o, g, g, m); }
      else if (n === 'Windowsill Succulent') { if (b.some(o => o !== m && o.tribe === F)) this.buff(m, 1, 1, m); }
      else if (n === 'The Billionaire') { const k = Math.min(10, this.gold[0]); if (k) for (const o of b) if (o !== m && isTribe(o, H)) this.buff(o, k, k, m); }
      else if (n === 'Apex Scavenger') { const feed = this.getFeed ? this.getFeed() : this.feedRef; if (feed && feed.length) { const k = Math.floor(Math.max(...feed.map(x => x.card.atk + (x.a || 0))) / 2); if (k) for (const o of b) if (o !== m && isTribe(o, F)) this.buff(o, k, k, m); } }
      else if (n === 'The Algorithm') { for (const o of b) if (o.extras.length) this.buff(o, o.extras.length, o.extras.length, m); }
      else if (n === 'Housing Co-op') { const ts = new Set(); for (const o of b) if (!o.follower) for (const t of [o.tribe, o.tribe2]) if (t) ts.add(t); for (const o of b) if (o !== m) this.buff(o, 2 * ts.size, 2 * ts.size, m); }
      else if (n === 'Renaissance Thinker') { const by = {}; for (const o of b) for (const t of [o.tribe, o.tribe2]) if (t && t !== N && !o.follower) (by[t] = by[t] || []).push(o); for (const t in by) this.buff(this.rng.choice(by[t]), 2, 2, m); }
      else if (n === 'Wise Old Owl') { const k = tribeCount(b); for (const o of b) if (isTribe(o, F) || isTribe(o, PH)) this.buff(o, k, k, m); }
      else if (n === 'Record Label') { const k = (this.creativesTotal || 0) - (m.rl0 ?? 0), cr = b.filter(o => o !== m && isTribe(o, C)); if (k && cr.length) this.buff(this.rng.choice(cr), k, k, m); }
      else if (n === 'Plant Parent') { const fs = this.rng.shuffle(b.filter(o => o !== m && o.tribe === F)).slice(0, 2); for (const o of fs) this.buff(o, 1, 1, m); }
      else if (n === 'Utilitarian') { const os = b.filter(o => o !== m && isTribe(o, PH)).sort((x, y) => x.atk - y.atk).slice(0, 3); for (const o of os) this.buff(o, 2, 1, m); }
      else if (n === 'Rooftop Beehive') { for (const o of neighbours(b, m)) if (isTribe(o, F)) { this.buff(o, 2, 2, m); o.rebrand = true; } }
      else if (n === 'World Tree') { for (const o of b) if (o !== m && o.tribe === F) this.buff(o, 4, 4, m); }
      else if (n === 'Shower Thinker') { const o = rightOf(b, m); if (o) this.tbuff(o, 3, 3, m); }
      else if (n === 'Pub Philosopher') { const o = leftOf(b, m); if (o) this.tbuff(o, 4, 2, m); }
      else if (n === 'Thought Experiment') { const k = tribeCount(b); for (const o of b) this.tbuff(o, k, k, m); }
      }
      if (!b.includes(m)) continue;
      if (m.n('Smart Plug')) this.buff(m, 0, m.n('Smart Plug'));
      if (m.n('Quantum Computer') && m.extras.length) { const k = 2 * m.n('Quantum Computer') * m.extras.length; this.buff(m, k, k, m); }
      if (m.n('Smart Fridge')) { const k = m.n('Smart Fridge'); for (const o of b) if (isTribe(o, T)) this.buff(o, k, k, m); }
    }
    for (const m of this.board.slice()) if (m.is_('Bot Farm') && (m.farm || 0) < BOT_FARM_MAX && this.board.length < 7) { m.farm = (m.farm || 0) + 1; for (let i = 0; i < 2 * m.g; i++) this.summonFollower(); }
    b = this.board;
    this.in_eot = false;
    for (const m of b) if (m.name === 'Bestselling Author') for (const o of neighbours(b, m)) if (isTribe(o, PH)) this.tbuff(o, m.g, m.g, m);
    for (const m of b) if (m.is_('Grand Unified Theory')) { const tc = tribeCount(b), k = (tc >= 4 ? 3 : 2) + (m.golden ? 1 : 0); for (const o of b) { o.ta += tc * m.g; o.th += tc * m.g; o.ta *= k; o.th *= k; this.buffed.add(o.id); } }
    for (const m of b) if (m.name === 'Bestselling Author') for (const o of b) if (o.ta || o.th) { o.atk += o.ta; o.hp += o.th; this.note('buff', {id: o.id, a: o.ta, h: o.th, src: m.id}); if (!m.golden) o.ta = o.th = 0; }
    for (const m of b) m.fb = this.fbonus;
  }
  onShopDeath(v) {
    const reps = 1 + this.wcount('Lawyer Next Door'), g = v.g;
    for (let r = 0; r < reps; r++) {
      if (v.name === 'Reply Guy') for (let i = 0; i < g; i++) this.summonFollower();
      else if (v.name === 'Comment Section') for (let i = 0; i < 2 * g; i++) this.summonFollower();
      else if (v.name === 'Compost Heap') this.addFeedBuff(F, g, g);
      else if (v.name === 'Golden Parachute Exec') this.bonus_next += 2 * g;
    }
  }
  drawFeed() { const [cards, w] = this.pool[this.tier]; return this.rng.choices(cards, w, FEED_SIZE[this.tier]); }
  feedEntries(cards) { return cards.map(c => { const fb = this.feedBonus(c); return {card: c, a: fb.a, h: fb.h}; }); }
  levelCost() { return this.tier >= 6 ? null : Math.max(0, LEVEL_COST[this.tier + 1] - this.turns_at_tier); }
  minionCost(entry) {
    let c = entry && entry.discount ? entry.discount : this.hero === 'h_bargainhunter' ? 2 : 3;
    if (entry && this.punkDiscount && isTribe(entry.card, P)) c = Math.max(1, c - this.punkDiscount);
    return c;
  }
  /** Call after paying for a hire: uses up Gig Poster's discount. */
  hired(card) { if (this.punkDiscount && isTribe(card, P)) this.punkDiscount = 0; }
  scrollCost() {
    if (this.hero === 'h_doomscroller' && this.scrollsThisTurn === 0) return 0;
    const base = this.hero === 'h_bargainhunter' ? 2 : 1, mag = this.scrollsThisTurn === 0 ? this.board.reduce((k, m) => k + (m.is_('Magpie') ? m.g : 0), 0) : 0;
    return Math.max(0, base - Math.min(mag, 2));
  }
  /** Pays for a Scroll and runs scroll triggers. Returns false if the player can't afford it. */
  payScroll() {
    const c = this.scrollCost(); if (this.gold[0] < c) return false;
    this.gold[0] -= c; if (c) this.gainSpend(c); this.scrollsThisTurn++; this.scrollsTotal++;
    // Scavengers rummage through what the Scroll threw out
    for (const m of this.board.slice()) {
      if (m.is_('City Pigeon') && this.scrollUse(m, 2)) this.buff(m, m.g, m.g, m);
      if (m.is_('Seagull')) { const fs = this.board.filter(o => o !== m && isTribe(o, F)); if (fs.length && this.scrollUse(m, 2, 'sg')) this.buff(this.rng.choice(fs), m.g, m.g, m); }
      if (m.is_('Nature Is Healing') && this.scrollUse(m, 4, 'nh')) { for (const o of this.board) if (o !== m && isTribe(o, F)) this.buff(o, 2 * m.g, 2 * m.g, m); }
      if (m.is_('Rat King') && this.scrollUse(m, 2 * m.g, 'rk')) { const feed = this.getFeed ? this.getFeed() : this.feedRef;
        if (feed && feed.length) { const f = maxBy(feed, x => x.card.atk + (x.a || 0)); this.buff(m, f.card.atk + (f.a || 0), f.card.hp + (f.h || 0), m); } }
    }
    if (this.hero === 'h_doomscroller' && this.scrollsTotal % DOOM_EVERY === 0) this.heroDiscover(this.tier);
    return true;
  }
  scrollUse(m, max, key = '') { const id = m.id + key, k = this.scrollUses[id] || 0; if (k >= max) return false; this.scrollUses[id] = k + 1; return true; }
  /** How many Scroll triggers this board still has this turn (bots scroll leftover gold into them). */
  scrollWant() {
    let n = 0; const U = this.scrollUses;
    for (const m of this.board) {
      if (m.is_('City Pigeon')) n += 2 - (U[m.id] || 0);
      if (m.is_('Seagull') && this.board.some(o => o !== m && isTribe(o, F))) n += 2 - (U[m.id + 'sg'] || 0);
      if (m.is_('Nature Is Healing')) n += 4 * (4 - (U[m.id + 'nh'] || 0));
      if (m.is_('Rat King')) n += 4 * (2 * m.g - (U[m.id + 'rk'] || 0));
    }
    return n;
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
    this.merch_used = this.side_used = this.sold_hustle = false; this.merchUsed = {}; this.resellUsed = new Set(); this.creativesThisTurn = 0; this.gigUsed = new Map(); this.gigThisTurn = false; this.cashUses = {}; this.raUses = {}; this.bmUses = {}; this.dbUses = {}; this.rerelease = []; this.discounts = {}; this.in_eot = this.oak = false;
    this.powerUsed = false; this.scrollsThisTurn = 0; this.scrollUses = {}; this.ghSold = 0; this.punkDiscount = this.punkDiscountNext || 0; this.punkDiscountNext = 0;
    for (const m of this.board) { m.turns_on_board += 1; m.ta = m.th = 0; }
    const carry = this.hero === 'h_procrastinator' ? Math.min(3, this.gold[0]) : 0;
    this.gold = [Math.min(2 + this.turn, 10) + this.bonus_next + carry]; this.gold_from = {base: Math.min(2 + this.turn, 10), bonus: this.bonus_next, carry};
    this.bonus_next = 0; this.spent_start = this.spent;
    const pop = this.board.reduce((k, m) => k + (m.is_('Pop-Up Ad') ? m.g : 0), 0);
    if (pop && this.turn % 2 === 0) { this.gold[0] += pop; this.gold_from.ads = pop; }
    for (const m of this.board.slice()) if (m.is_('Auto-Renewal') && this.gold[0] >= 1) { this.gold[0] -= 1; this.gainSpend(1); for (const o of this.board) if (isTribe(o, T)) this.buff(o, 2 * m.g, 2 * m.g, m); }
    if (this.turn > 1) this.turns_at_tier += 1;
    if (this.hero === 'h_gymbro' && this.turn % GYM_EVERY === 0) this.addLikes(GYM_LIKES);
  }
  takeTurn() {   // bot
    this.beginTurn(); const gold = this.gold, r = this.rng, sk = this.skill;
    if (this.onBegin) this.onBegin(this);   // test hook (balance suite)
    this.playQueue();
    for (const m of this.board.slice()) if (m.name === 'Crypto Bro' && m.turns_on_board >= 6) this.sell(m, gold);
    if ((SELL_STYLES.includes(this.style) || [H, P].includes(this.tribe)) && !(this.expert && this.has('Squat Collective')))
      for (const m of this.board.slice()) if (m.c && m.c.sellbait && m.turns_on_board >= 1 && this.board.length > 4) this.sell(m, gold);
    for (const m of this.board.slice()) if (m.name === 'Encore' && this.lastCreative && m.turns_on_board >= 1 && this.board.length >= 5) this.sell(m, gold);
    if (this.expert && (this.has('Sneaker Reseller') || this.has('Private Equity')) && this.board.length >= 4) {
      const spare = minBy(this.board.filter(o => !o.is_('Sneaker Reseller') && !o.is_('Private Equity') && !o.golden), o => this.value(o) - (o.name === 'Unpaid Intern' ? 3 : 0));
      if (spare) this.sell(spare, gold);
    }
    const target = this.pro ? 1 + [(this.prm || PRO).l2, (this.prm || PRO).l3, (this.prm || PRO).l4, (this.prm || PRO).l5, (this.prm || PRO).l6].filter(t => this.turn >= t).length : CURVE[this.turn] || 6;
    let proRefs = [], proFeed = null;
    if (this.pro) {
      this.planPivot();
    }
    // skill 0 is the standard bot. Skill adds: levelling a turn early when healthy and rich
    let eager = sk >= 0.4 && this.health >= 20 && this.turn >= 4 && r() < sk, hold = false;
    // skill 0.6+: judge the board in simulated fights first; level early when ahead, stabilise when behind and hurting
    const scouted = sk >= 0.5 ? this.scoutBoards() : [];
    if (sk >= 0.6 && scouted.length && this.board.length && this.tier < 6) {
      const w = this.simScore(this.board, scouted);
      if (w >= 0.7 && this.turn >= 3) eager = true;
      if (w < 0.3 && this.health + this.boundaries < 16) { eager = false; hold = this.tier >= target - 1; }
    }
    if (this.pro && !PRO.off.tempo) {   // tempo: level ahead of the curve when ahead and healthy; hold when behind and hurting
      const tp = this.tempo(), safe = this.health + this.boundaries >= (this.prm || PRO).safeHp;
      eager = tp >= (this.prm || PRO).ahead && safe && this.turn >= 3;
      hold = tp <= -(this.prm || PRO).behind && !safe && this.tier >= target - 1;
      if (this.v2) { const d = this.levelPlan(target); eager = d.eager; hold = hold || d.hold; }
    }
    if (this.tier < 6 && !hold && (this.tier < target || (eager && this.tier <= target))) {
      const cost = this.levelCost(); if (gold[0] >= cost + (this.tier >= target && !(this.v2 && eager) ? 3 : 0)) { gold[0] -= cost; this.gainSpend(cost); this.tier += 1; this.turns_at_tier = 0; }
    }
    let feed = this.savedFeed || this.feedEntries(this.drawFeed()); this.savedFeed = null;
    this.getFeed = () => feed;
    let scrolls = 0, digs = 0, swaps = 0, guard = 0, digCap = 0;
    const maxScrolls = 4 + (this.health < 12 ? Math.round(3 * sk) : 0) + (this.pro ? (this.prm || PRO).rolls : 0)
      + (this.v2 && !PRO.off.pair && this.hasPair() ? (this.prm || PRO).pairRolls : 0) + (this.v2 && !PRO.off.payoff && this.payoffMissing() && this.tier >= this.payoffTier() ? (this.prm || PRO).digRolls : 0);
    const hp = this.hero;
    if (hp === 'h_overthinker' && this.canPower() && this.board.length < 7 && gold[0] >= 2 + (this.turn > 2 ? 3 : 0)) this.usePower(null, feed);
    if (hp === 'boomer' && this.canPower() && gold[0] >= 4) this.usePower(this.board.length ? this.carry() : null, feed);
    const opps = scouted;
    const pick = afford => {
      const base = e => this.cardScore(e.card) + (e.a + e.h) / 4;
      let sc = base;
      if (this.pro && !PRO.off.look) {   // lookahead on the best few: what each would make the board grow into
        this.baseGrowth = this.growth(this.board);
        const top = afford.slice().sort((x, y) => base(y) - base(x)).slice(0, 4), lb = new Map(top.map(e => [e, this.lookBonus(e)]));
        sc = e => base(e) + (lb.get(e) || 0);
        afford = top;
      }
      // skill 0.75+: among the top few candidates, test each in simulated fights against scouted boards
      if (sk >= 0.75 && opps.length && afford.length > 1) {
        const top = afford.slice().sort((x, y) => sc(y) - sc(x)).slice(0, 3);
        if (sc(top[0]) - sc(top[top.length - 1]) < 4) return maxBy(top, e => sc(e) + 8 * sk * this.simWith(e, opps));
      }
      return maxBy(afford, sc);
    };
    while (guard++ < 60) {
      if (this.rerelease.length) { for (const c of this.rerelease) feed.push({card: c, a: 0, h: 0}); this.rerelease = []; }
      const afford = feed.filter(e => this.minionCost(e) <= gold[0]);
      const sc = this.scrollCost();
      if (!afford.length && gold[0] < sc) break;
      if (!afford.length && gold[0] < this.minionCost() && sc > 0) break;
      const best = afford.length ? pick(afford) : null;
      const worst = this.board.length ? minBy(this.board, m => this.value(m)) : null;
      if (best && this.tribe && this.turn >= 3 && best.card.tribe !== this.tribe && gold[0] >= this.minionCost() + sc && digs < (this.expert ? 5 : 3) && !feed.some(e => e.card.tribe === this.tribe)) {
        if (this.payScroll()) { digs++; feed = this.feedEntries(this.drawFeed()); continue; }
      }
      if (sc === 0 && scrolls === 0 && best && this.tribe && best.card.tribe !== this.tribe) { this.payScroll(); scrolls++; feed = this.feedEntries(this.drawFeed()); continue; }
      if (best) {
        const twin = !best.card.collab && this.board.filter(x => x.name === best.card.name && !x.golden && !x.follower).length >= 2;
        const cap = this.v2 && !PRO.off.hero && this.hero === 'h_minimalist' ? MINI_MAX : 7;
        const bs = this.cardScore(best.card), free = twin || this.board.length < cap || (best.card.collab && this.board.length);
        const playEngines = this.expert && best.card.tribe === C ? ['World Tour', 'Festival Headliner', 'Busker', 'Indie Band', 'Record Label', 'Merch Stand'].reduce((k, n) => k + this.count(n), 0) : 0;
        if (free || (swaps < (playEngines ? 5 : 3) && (this.pro && !playEngines && !PRO.off.look ? this.proSwapLook(best, worst) : bs > this.value(worst) + (this.pro ? (this.prm || PRO).swapTh : 1.5) - 1.5 * Math.min(3, playEngines)))) {
          if (!free) { this.sell(worst, gold); swaps++; }
          const paid = this.minionCost(best); gold[0] -= paid; this.gainSpend(paid); this.hired(best.card); feed.splice(feed.indexOf(best), 1);
          if (twin) { this.tripleOnBuy(best.card, [{a: best.a, h: best.h}], gold); continue; }
          const played = this.play(best.card, gold, null, null, best);
          this.expertAfterBuy(played, gold);
          // sell Jingle Writer at once when it pays, as a person would (balance tests must see the combo)
          if (best.card.name === 'Jingle Writer' && this.tribe === P && this.punks_sold >= 2 && this.board.filter(o => o.tribe === P).length >= 4) { const m = this.board.find(o => o.name === 'Jingle Writer' && !o.golden); if (m) this.sell(m, gold); }
          continue;
        }
      }
      if (gold[0] >= this.minionCost() + sc && scrolls < maxScrolls) { if (this.payScroll()) { scrolls++; feed = this.feedEntries(this.drawFeed()); continue; } }
      // leftover gold goes into Scroll triggers (City Pigeon, Seagull, Nature Is Healing)
      if (gold[0] >= sc && scrolls < maxScrolls + 6 && (this.scrollWant() > 0 || (this.expert && sc > 0 && (this.has('Thought Leader') || this.has('Unicorn Startup'))))) { if (this.payScroll()) { scrolls++; feed = this.feedEntries(this.drawFeed()); continue; } }
      break;
    }
    this.expertGreatestHits(gold, feed);
    if (hp === 'h_serial' && this.canPower() && this.board.length) { const low = minBy(this.board.filter(m => !m.golden && m.tier < 6), m => [m.tier, this.value(m)]); if (low && low.tier <= this.tier) this.usePower(low, feed); }
    if (hp === 'h_lifecoach' && this.canPower() && this.board.length) this.usePower(this.carry(), feed);
    if (hp === 'boomer' && this.canPower() && this.board.length) this.usePower(this.carry(), feed);
    this.playQueue(); this.botGigs(); this.playQueue();
    this.spendLikes();
    this.spent_this_turn = this.spent - this.spent_start;
    // skilled bots Save a Feed that holds a card they want but couldn't afford
    if (sk >= 0.3 && feed.length && r() < sk + 0.3 && feed.some(e => this.cardScore(e.card) > 9 || this.board.some(m => m.name === e.card.name && !m.golden))) this.savedFeed = feed;
    this.feedRef = feed; this.getFeed = null;
    this.arrange(); if (this.expert) this.arrangeExpert(); this.endOfTurn(); if (opps.length) this.searchOrder(opps, sk);
  }

  // ---- expert play
  /** How many board minions share each of the card's mechanics (capped at 3 per mechanic). */
  synergy(card, exclude = null) {
    const tags = tagsOf(card); if (!tags.length) return 0;
    let s = 0;
    for (const t of tags) {
      let k = 0;
      for (const o of this.board) {
        if (o === exclude) continue;
        if (o.follower ? t === 'followers' : tagsOf(o.c).includes(t) || o.extras.some(x => tagsOf(BY_NAME[x]).includes(t))) k++;
      }
      s += Math.min(3, k);
    }
    return s;
  }
  /** Sell plays right after a buy: cash in "when sold" cards at once (Zine Maker first moves left of the carry). */
  expertAfterBuy(m, gold) {
    if (!this.expert || !m || !this.board.includes(m) || this.has('Squat Collective')) return;
    const punks = this.board.filter(o => o.tribe === P && !o.follower && o !== m).length;
    if (m.name === 'Sellout Frontman' && punks >= 2) this.sell(m, gold);
    else if (m.name === 'Zine Maker' && this.board.length >= 2) { const c = this.carry(); if (c !== m) { this.board.splice(this.board.indexOf(m), 1); this.board.splice(this.board.indexOf(c), 0, m); } this.sell(m, gold); }
    else if (m.name === 'Anarchist Barista' && this.has('Greatest Hits')) this.sell(m, gold);
  }
  /** Greatest Hits: sell a spare Punk and buy its copy back, up to three times a turn (each sale gives your Punks +1/+1). */
  expertGreatestHits(gold, feed) {
    if (!this.expert || !this.has('Greatest Hits')) return;
    for (let i = 0; i < 3 && (this.ghSold || 0) < 3 && gold[0] >= this.minionCost(); i++) {
      const ps = this.board.filter(o => o.tribe === P && !o.follower && !o.golden && !KEEP_PUNKS.has(o.name));
      if (ps.length < 1 || this.board.filter(o => o.tribe === P).length < 3) return;
      const v = minBy(ps, o => this.value(o) - (o.c && o.c.sellbait ? 3 : 0));
      this.sell(v, gold);
      const c = this.rerelease.pop(); this.rerelease = [];
      if (!c) return;
      gold[0] -= this.minionCost(); this.gainSpend(this.minionCost());
      this.expertAfterBuy(this.play(c, gold), gold);
    }
  }
  /** Score of a board order for shop-phase and start-of-combat neighbour effects (higher is better). */
  orderScore(b) {
    let s = 0; const cy = this.carry();
    const isF = o => o && isTribe(o, F), isPH = o => o && isTribe(o, PH);
    b.forEach((m, i) => {
      const L = b[i - 1], R = b[i + 1], nb = [L, R].filter(Boolean), g = m.g;
      if (m.is_('Rooftop Beehive')) s += 4 * g * nb.filter(isF).length;
      if (m.is_('Tree Hugger')) s += 4 * g * nb.filter(isF).length;
      if (m.is_('Wild Boar')) s += 3 * g * nb.filter(isF).length;
      if (m.is_('Caretaker')) s += 3 * g * nb.length;
      if (m.is_('Bestselling Author')) s += 2 * g * nb.filter(isPH).length;
      if (m.is_('Shower Thinker') && R) s += 6 * g + (R === cy ? 3 : 0);
      if (m.is_('Pub Philosopher') && L) s += 6 * g + (L === cy ? 3 : 0);
      if (m.is_('Marathon Monk') && isPH(R)) s += 3 * g;
      if (m.is_('E-Sports Coach')) s += 3 * g * nb.length;
      if (m.is_('Wi-Fi Leech')) s += 2 * g * nb.length;
      if (m.is_('Open Mic Poet')) s += 2 * g * nb.length;
      if (m.is_('Package Hoarder') || m.is_('Caretaker')) for (const o of nb) if (!o.taunt) s += Math.min(o.hp, 30) / 6 - (o === this.carry() ? 2 : 0);
      if (m.is_('Zine Maker') && R) s += 4 + (R === cy ? 4 : 0);
      if (m.is_('Middle Manager')) s += L ? (L.follower || L.stats() <= 4 ? 6 : -L.stats() / 6) : -3;   // fodder on its left pays 2 gold
    });
    b.forEach((m, i) => { if (m.c && /Clock In/.test(m.c.text)) s += (b.length - i) * 0.6; });
    // left attacks first: minions that pay off when they die (Legacy, Rebrand, death triggers) go left, so they die early
    if (this.pro && !PRO.off.legacy) b.forEach((m, i) => { if (m.c && (/Legacy|Rebrand|Grievance|dies/.test(m.c.text) || m.rebrand)) s += (b.length - i) * 0.8; });
    const ci = b.indexOf(cy); if (ci > 0 && ci < b.length - 1) s += 1;
    return s;
  }
  /** Hill-climbs board order with swaps to raise orderScore. */
  arrangeExpert() {
    let b = this.board.slice(), best = this.orderScore(b);
    for (let pass = 0; pass < 3; pass++) {
      let improved = false;
      for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
        [b[i], b[j]] = [b[j], b[i]]; const v = this.orderScore(b);
        if (v > best + 1e-9) { best = v; improved = true; } else [b[i], b[j]] = [b[j], b[i]];
      }
      if (!improved) break;
    }
    this.board = b;
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

// ======================================================================== expert play
// The plays a strong player makes, used by the top rating brackets and by the balance suite to see top boards:
// synergy-aware buying, sell plays, positioning around neighbour effects, spending into spend engines, digging for pieces.
const TAG_RE = [[/Like/, 'likes'], [/Follower/, 'followers'], [/When sold|you sell|Punks you have sold/, 'selling'], [/Legacy/, 'legacy'],
  [/next combat|next-combat/, 'tempbuff'], [/Attention Seeker/, 'taunt'], [/Collab/, 'collab'], [/Scroll/, 'scroll'], [/Rebrand|comes back/, 'rebrand'],
  [/End of turn|end-of-turn/, 'eot'], [/gold you spend|you spent/, 'spend'], [/Toxic|kills a minion/, 'kill'], [/play a Creative|Creatives you|Creative you/, 'cplay'],
  [/minion dies|Grievance/, 'death'], [/in the Feed/, 'feed'], [/Clock In/, 'clock'], [/damage to|start-of-combat damage/, 'damage']];
const TAGS = new Map();
function tagsOf(card) {
  if (!card) return [];
  let t = TAGS.get(card.name);
  if (!t) { t = TAG_RE.filter(([re]) => re.test(card.text)).map(x => x[1]); if (card.taunt && !t.includes('taunt')) t.push('taunt'); if (card.rebrand && !t.includes('rebrand')) t.push('rebrand'); TAGS.set(card.name, t); }
  return t;
}
const capstonesOf = style => CARDS.filter(c => !c.token && c.style === style && c.tier === 6).map(c => c.name);
const KEEP_PUNKS = new Set(['Greatest Hits', 'Reunion Tour', 'General Strike', 'Squat Collective', 'Crust Punk', 'Stage Diver', 'Mosh Pit']);
// Side Gigs: base cost and what they target ('hustler' = another Hustler, 'other' = another minion without Out of Office, 'any', 'none')
const GIGS = {'Side Hustle': {cost: 1, target: 'hustler'}, 'Delivery Rider': {cost: 1, target: 'none'}, 'Task Rabbit': {cost: 2, target: 'other'},
  'Ghost Kitchen': {cost: 2, target: 'none'}, 'Battle Pass': {cost: 1, target: 'any'}, 'Paid Verification': {cost: 1, target: 'none'}, 'Sponsored Streamer': {cost: 2, target: 'none'}};
const HERO_POWERS = {boomer: {cost: 1, target: true}, h_serial: {cost: 1, target: true}, h_overthinker: {cost: 2}, h_lifecoach: {cost: 1, target: true}};
let BOT_FARM_MAX = 3, STYLE_PULL = 2.0, DOOM_EVERY = 5, COACH = 2, GYM_LIKES = 1, COMPLAIN_EVERY = 2, MINI_MAX = 4, MINI_BUFF = 2, GYM_EVERY = 2;

// ======================================================================== combat
function snap(side) {
  return side.b.map(m => ({id: m.id, name: m.name, atk: m.atk, hp: m.hp, shield: m.shield, taunt: m.taunt, toxic: m.toxic, golden: m.golden,
    tier: m.tier, follower: m.follower, tribe: m.tribe, extras: m.extras.slice(), rebrand: m.rebrand}));
}
function perm(m, a, h) { m.atk += a; m.hp += h; if (m.orig) { m.orig.atk += a; m.orig.hp += h; } }
function hit(t, n, src) {
  if (n <= 0 || t.hp <= 0) return 0;
  if (t.side) {
    const b = t.side.b;
    if (SOC_PHASE && (t.is_('Tenured Professor') || neighbours(b, t).some(o => o.is_('Tenured Professor')))) return 0;   // no start-of-combat damage
    const sr = wsum(b, 'Silent Retreat'); if (sr && b.length <= 4) { n -= sr; if (n <= 0) return 0; }
  }
  if (t.shield) { t.shield = false; t.popped = true; t.oooLost = true; return 0; }
  if (t.cap && t.capLeft > 0) { if (n > t.cap) n = t.cap; t.capLeft--; }   // Enlightened Guru: the first hit(s) each combat
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
  const t = new M(TOKENS[name]); t.side = side; t.cross = b.some(x => x.cross); t.hits = 0; t.surv_used = t.kill_used = false; t.speed_used = 0; t.critic = 0; t.retro = 0;
  b.splice(Math.min(idx, b.length), 0, t); return t;
}
function combatFollower(side, idx) {
  const b = side.b; if (b.length >= 7) return null;
  const f = new M(null, true); const fb = Math.max(0, ...b.map(x => x.fb || 0));
  f.side = side; f.cross = b.some(x => x.cross); if (side.p && !side.p.ghost) side.p.fsum = (side.p.fsum || 0) + 1;
  f.atk += fb; f.hp += fb; f.fb = fb;
  const ba = side.baff || 0; f.atk += ba; f.hp += ba;   // Brand Ambassador's bonus for this combat
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
    for (const sd of this.sides) { auras(sd.b); for (const m of sd.b) m.side = sd; sd.attacks = 0; }
  }
  frame(ev) { if (this.quiet) { for (const s of this.sides) for (const m of s.b) { m.popped = false; m.toxicked = false; } return; } this.frames.push(Object.assign({boards: [snap(this.sides[0]), snap(this.sides[1])]}, ev)); for (const s of this.sides) for (const m of s.b) { m.popped = false; m.toxicked = false; } }
  startOfCombat(k) {
    const me = this.sides[k], them = this.sides[1 - k], b = me.b, e = them.b;
    const punks = b.filter(m => m.tribe === P).length, taunts = b.filter(m => m.taunt).length;
    const amp = 2 * wsum(b, 'Crust Punk');   // only for damage to enemy minions (friendly hits never use it)
    const ev = (src, kind, tgts) => this.frame({type: 'soc', side: k, src: src.id, kind, tgts: (tgts || []).map(x => x.id)});
    const hero = me.p && me.p.hero;
    if (hero === 'remote' && b.length) { b[0].shield = true; this.frame({type: 'hero', side: k, hero, tgts: [b[0].id]}); }
    if (hero === 'h_minimalist' && b.length <= MINI_MAX) { const e2 = MINI_BUFF; for (const o of b) { o.atk += e2; o.hp += e2; } this.frame({type: 'hero', side: k, hero, tgts: b.map(o => o.id)}); }
    const reach = (m, r) => { const i = b.indexOf(m); return b.filter((o, j) => o !== m && Math.abs(j - i) <= r); };
    // Brand Ambassador: the bonus holds for this whole combat, so Followers summoned later get it too (see combatFollower)
    for (const m of b.slice()) if (m.name === 'Brand Ambassador') { const kk = m.g * b.filter(o => isTribe(o, I)).length, fs = b.filter(o => o.follower); me.baff = (me.baff || 0) + kk; for (const f of fs) { f.atk += kk; f.hp += kk; } ev(m, 'give', fs); }
    for (const m of b) if (m.name === 'Pop Diva' && me.p && !me.p.ghost) { const k = m.g * (me.p.creativesTotal || 0); const cs = b.filter(o => isTribe(o, C)); for (const o of cs) { o.atk += k; o.hp += k; } if (k) ev(m, 'give', cs); }
    for (const m of b) if (m.name === 'Thirst Trap') { const os = this.rng.shuffle(b.filter(o => o !== m)).slice(0, 2); for (const o of os) o.likeLegacy = (o.likeLegacy || 0) + m.g; if (os.length) ev(m, 'give', os); }
    const bc = b.filter(m => m.is_('Blue Checkmark'));
    for (const m of b.slice()) if (m.name === 'Package Hoarder') { const nb = reach(m, m.g); for (const o of nb) { o.taunt = true; o.atk += 2 * m.g; o.hp += 2 * m.g; } if (nb.length) ev(m, 'give', nb); }
    const gurus = b.filter(m => m.is_('Enlightened Guru'));
    if (gurus.length) { const left = gurus.some(m => m.golden) ? 4 : 2; for (const o of b) if (o.taunt && !o.is_('Enlightened Guru')) { o.cap = 3; o.capLeft = left; } }
    const legend = b.reduce((k, o) => k + o.w('Mohawk Legend'), 0);
    const soc = m => {
      const g = m.g;
      if (m.n('Robot Vacuum') && e.length) for (let i = 0; i < m.n('Robot Vacuum'); i++) { const live = e.filter(x => x.hp > 0); if (live.length) { const t = minBy(live, x => x.hp); hit(t, 2); ev(m, 'shot', [t]); } }
      for (const n of [m.name].concat(m.mash || [])) {
      if (n === 'Corporate Raider' && e.length) { for (let i = 0; i < g; i++) { const live = e.filter(x => x.hp > 0); if (!live.length) break; const t = minBy(live, x => x.hp); hit(t, 6); if (t.hp <= 0 && me.p && !me.p.ghost) me.p.bonus_next += 1; ev(m, 'shot', [t]); } }
      else if (n === 'Paparazzi') { const ts = b.filter(o => isTribe(o, I)).sort((x, y) => y.atk - x.atk).slice(0, 2 * g); for (const t of ts) { t.shield = true; t.atk += 2; t.hp += 2; } if (ts.length) ev(m, 'give', ts); }
      else if (n === 'Quiet-Hours Enforcer' && e.length) { e[0].atk = Math.max(0, e[0].atk - 3 * g); ev(m, 'shot', [e[0]]); }
      else if (n === 'Wi-Fi Leech') { const k2 = neighbours(b, m).length * g; m.atk += k2; m.hp += k2; ev(m, 'self'); }
      else if (n === 'Leaf Blower Guy') { for (let r = 0; r < 2 * g; r++) for (const x of e) hit(x, 1); ev(m, 'sweep', e); }
      else if (n === 'Tree Hugger') { const nb = neighbours(b, m).filter(o => isTribe(o, F)); for (const o of nb) { o.atk += 2 * g; o.hp += 2 * g; } if (nb.length) ev(m, 'give', nb); }
      else if (n === 'Book-Club Stoic') { const os = b.filter(o => o !== m && o.taunt); for (const o of os) { o.atk += 2 * g; o.hp += 2 * g; } if (os.length) ev(m, 'give', os); }
      else if (n === 'Wild Boar') { const nb = reach(m, g).filter(o => isTribe(o, F)); for (const o of nb) o.rebrand = true; if (nb.length) ev(m, 'give', nb); }
      else if (n === 'E-Sports Coach') { const nb = reach(m, g); for (const o of nb) o.toxic = true; if (nb.length) ev(m, 'give', nb); }
      else if (n === 'World Record') { const os = b.filter(o => o !== m && isTribe(o, T)).slice(0, g); for (const o of os) o.toxic = true; if (os.length) ev(m, 'give', os); }
      else if (n === 'Graffiti Kid' && e.length) { hit(e[0], punks * g + amp); ev(m, 'shot', [e[0]]); }
      else if (n === 'Heckler' && e.length) { const t = maxBy(e, x => x.atk); hit(t, 4 * g + amp); ev(m, 'shot', [t]); }
      else if (n === 'Banner Drop') { const ts = e.filter(x => x.taunt && x.hp > 0); for (const x of ts) hit(x, 4 * g + amp); if (ts.length) ev(m, 'shot', ts); }
      else if (n === 'Feedback Loop') { for (const x of e) hit(x, g + amp); const killed = e.some(x => x.hp <= 0); if (killed) for (const o of b) if (o.tribe === P) { o.atk += 2 * g; o.hp += 2 * g; } ev(m, 'sweep', e); }
      else if (n === 'Stage Diver' && e.length) { const t = e[0]; hit(t, m.atk + amp); perm(m, 4 * g, 0); ev(m, 'shot', [t]); }
      else if (n === 'General Strike') { const alive = e.filter(x => x.hp > 0); for (const x of e) hit(x, punks * g + amp); const k2 = 2 * alive.filter(x => x.hp <= 0).length * g; if (k2) for (const o of b) if (o.tribe === P) perm(o, k2, k2); ev(m, 'sweep', e); }
      else if (n === 'Subathon') { const os = b.filter(o => o !== m && o.hp > 0 && hasClockIn(o)); for (let r = 0; r < g; r++) for (const o of os) this.clockIn(me, o, them); if (os.length) ev(m, 'give', os); }
      else if (n === 'Data Centre' && me.p && !me.p.ghost) { const k2 = (me.p.gigGold || 0) * g; if (k2) { for (const o of b) { o.atk += k2; o.hp += k2; } ev(m, 'give', b); } }
      else if (n === 'Crowd Surfer') { const ps = b.filter(o => o !== m && isTribe(o, P) && o.hp > 0); for (const o of ps) if (this.fhit(me, o, 2)) perm(o, 3 * g, 2 * g); if (ps.length) ev(m, 'give', ps); }
      else if (n === 'Festival Pit') { this.festival(me, m); ev(m, 'give', b.filter(o => o !== m)); }
      else if (n === 'Sound System' && me.p && !me.p.ghost) { const k2 = (me.p.punks_sold || 0) * g; for (let i = 0; i < k2; i++) { const live = e.filter(x => x.hp > 0); if (!live.length) break; hit(this.rng.choice(live), 1 + amp); } if (k2) ev(m, 'sweep', e); }
      else if (n === 'Digital Detox') { const k2 = (7 - b.length) * g; if (k2 > 0) { m.atk += k2; m.hp += k2; ev(m, 'self'); } }
      else if (n === 'The Void') { const k2 = 4 * (7 - b.length) * g, few = b.length <= 3; for (const o of b) { if (k2 > 0) { o.atk += k2; o.hp += k2; } if (few) o.shield = true; } ev(m, 'give', b); }
      else if (n === 'Parcel Locker') { const ts = (g > 1 ? neighbours(b, m) : [leftOf(b, m)]).filter(o => o && !o.shield); for (const o of ts) o.shield = true; if (ts.length) ev(m, 'give', ts); }
      }
    };
    for (const m0 of b.slice()) for (let rep = 0; rep < (isTribe(m0, P) ? 1 + legend : 1); rep++) {
      soc(m0);
      // Tribute Act (the minion to its right) and Cover Band (both neighbours) re-trigger start-of-combat effects; re-triggers never chain
      if (!this.retrig && (m0.is_('Tribute Act') || m0.is_('Cover Band'))) {
        this.retrig = true;
        const ts = new Set(); if (m0.is_('Tribute Act')) ts.add(rightOf(b, m0)); if (m0.is_('Cover Band')) for (const o of neighbours(b, m0)) ts.add(o);
        for (let r = 0; r < m0.g; r++) for (const t of ts) if (t && t.hp > 0) { soc(t); this.frame({type: 'trigger', src: m0.id}); }
        this.retrig = false;
      }
    }
    me.vv = P_.vv * wsum(b, 'Viral Video');
  }
  /** Friendly fire (Moshers): returns true if the minion survives. Damage dealt triggers Circle Pit and Wall of Death. */
  fhit(side, t, n) {
    const before = t.hp; hit(t, n); const dealt = before - t.hp;
    if (dealt > 0) {
      for (const v of side.b) if (v.is_('Wall of Death') && (v.wod || 0) < 5) { v.wod = (v.wod || 0) + 1; for (const o of side.b) if (isTribe(o, P) && o.hp > 0) perm(o, v.g, v.g); }
      if (t.hp > 0) { const k = wsum(side.b, 'Circle Pit'); if (k) perm(t, k, k); }
    }
    return t.hp > 0;
  }
  festival(side, src) { const g = src.g; for (const o of side.b.filter(o => o !== src && o.hp > 0)) if (this.fhit(side, o, 1)) perm(o, 2 * g, 2 * g); }
  afterDamage(side) {
    const b = side.b;
    for (const m of b) if (m.oooLost) { m.oooLost = false; const k = 2 * m.n('Noise-Cancelling Headphones'); if (k) { for (const o of b) if (isTribe(o, T) && o.hp > 0) perm(o, k, 0); this.frame({type: 'trigger', src: m.id}); } }
    for (const m of b.slice()) {
      const h = m.hits || 0; if (!h) continue; m.hits = 0;
      if (m.is_('The Cynic')) { const k = h * m.w('The Cynic'); for (const o of b) if (o !== m && isTribe(o, PH)) perm(o, k, k); }
      if (m.taunt && m.hp > 0) { const k = wsum(b, 'Breathwork Coach'); if (k) { perm(m, k * h, 0); this.frame({type: 'trigger', src: m.id}); } }
      if (m.hp > 0 && !m.surv_used && ['Stoicism Podcaster', 'Cold-Plunge Stoic', 'Marathon Monk', 'Desert Hermit'].includes(m.name)) {
        m.surv_used = true; const n = m.name, g = m.g;
        if (n === 'Stoicism Podcaster') perm(m, 0, g); else if (n === 'Cold-Plunge Stoic') perm(m, g, g);
        else if (n === 'Marathon Monk') { const o = rightOf(b, m); if (o && isTribe(o, PH)) perm(o, 2 * g, 2 * g); }
        else for (const o of b) if (o !== m && o.tribe === PH) perm(o, 2 * g, 2 * g);
        this.frame({type: 'trigger', src: m.id});
      }
    }
  }
  clockIn(side, att, them) {
    const g = att.golden ? 2 : 1; let fired = false;
    const pl = side.p && !side.p.ghost ? side.p : null;
    if (att.is_('Reaction Streamer')) { perm(att, att.w('Reaction Streamer'), 0); fired = true; }
    if (att.is_('Donation Goal') && !att.donated && pl) { att.donated = true; pl.bonus_next += att.w('Donation Goal'); fired = true; }
    if (att.is_('Raid Party') && (att.raids || 0) < 2) { att.raids = (att.raids || 0) + 1; const i = side.b.indexOf(att); for (let k = 0; k < 2 * att.w('Raid Party'); k++) combatFollower(side, i + 1); fired = true; }
    if (att.is_('Sponsored Streamer') && (att.sponsor || 0) < 2 && pl) { att.sponsor = (att.sponsor || 0) + 1; pl.bonus_next += g; fired = true; }
    if (att.is_('Streamer House')) { const X = side.attacks || 0, os = this.rng.shuffle(side.b.filter(o => o !== att && o.hp > 0)).slice(0, 2 * att.w('Streamer House')); if (X) for (const o of os) perm(o, X, X); fired = true; }
    if (att.is_('Pogo Dancer')) { for (const o of neighbours(side.b, att)) if (this.fhit(side, o, 1)) perm(o, 2 * att.w('Pogo Dancer'), 0); fired = true; }
    if (att.n('Bluetooth Speaker') && them) { const k = att.n('Bluetooth Speaker'); for (const x of them.b) hit(x, k); fired = true; }   // no source: never Toxic
    if (att.is_('Hype Man') && side.p && !side.p.ghost && side.p.addLikes) { side.p.addLikes(att.n('Hype Man') * g, att); fired = true; }
    if (att.is_('Main Character') && side.p && !side.p.ghost && side.p.addLikes) { side.p.addLikes(3 * g, att); fired = true; }
    if (att.is_('Urban Fox')) { const fs = side.b.filter(o => o !== att && o.tribe === F && o.hp > 0); if (fs.length) { perm(this.rng.choice(fs), 2 * g, 2 * g); fired = true; } }
    if (att.is_('Leaderboard')) { for (const o of side.b) if (o !== att && isTribe(o, T)) perm(o, 2 * g, g); fired = true; }
    if (fired) this.frame({type: 'trigger', src: att.id});
  }
  onKill(side, killer) {
    if (!side.b.includes(killer)) return;
    if (killer === this.curAtt && isTribe(killer, T)) { const k = wsum(side.b, 'LAN Party'); if (k && (killer.lan || 0) < k) { killer.lan = (killer.lan || 0) + 1; killer.extraSwings = (killer.extraSwings || 0) + 1; } }
    if (killer.is_('Speedrunner')) perm(killer, killer.g, killer.g);
    if (killer.is_('Mosh Pit')) { const k = killer.w('Mosh Pit'); for (const o of side.b) if (isTribe(o, P) && o.hp > 0) perm(o, k, k); }
    if (isTribe(killer, T) && side.p) side.p.techie_kills += 1;
    if (isTribe(killer, T)) for (const v of side.b) if (v.is_('World Record')) { for (const o of side.b) if (isTribe(o, T) && o.hp > 0) perm(o, v.g, v.g); this.frame({type: 'trigger', src: v.id}); }
  }
  combatWhenSold(side, m, idx) {
    const b = side.b, n = m.name, g = m.g;
    if (n === 'Anarchist Barista' && side.p && !side.p.ghost) side.p.bonus_next += g;
    else if (n === 'Gig Poster' && side.p && !side.p.ghost) side.p.punkDiscountNext = (side.p.punkDiscountNext || 0) + g;
    else if (n === 'Zine Maker' && idx < b.length) { b[idx].atk += 3 * g; b[idx].hp += 3 * g; }
    else if (n === 'Sellout Frontman') { for (const o of b) if (o.tribe === P) { o.atk += 3 * g; o.hp += 3 * g; } if (side.p && !side.p.ghost && side.p.addFeedBuff) side.p.addFeedBuff(P, g, g); }
    else if (n === 'Jingle Writer') { const k = side.p ? Math.min(16, 2 * (side.p.punks_sold || 0)) * g : 0; for (const o of b) if (o.tribe === P) { o.atk += k; o.hp += k; } }
  }
  /** One Legacy effect (n) of minion m, which died at idx; Sampler uses this to trigger the Legacy of the minion to its right. */
  legacy(side, m, n, idx, nbs) {
    const b = side.b, g = m.g; let legacy = false;
    if (n === 'Reply Guy') { for (let i = 0; i < g; i++) combatFollower(side, idx); legacy = true; }
    else if (n === 'Comment Section') { for (let i = 0; i < 2 * g; i++) combatFollower(side, idx); legacy = true; }
    else if (n === 'Brand Ambassador') { for (let i = 0; i < 2 * g; i++) combatFollower(side, idx); legacy = true; }
    else if (n === 'Punk Philosopher') { for (const o of b) if (isTribe(o, P) || isTribe(o, PH)) perm(o, 3 * g, 3 * g); legacy = true; }
    else if (n === 'Compost Heap') { if (side.p && !side.p.ghost && side.p.addFeedBuff) side.p.addFeedBuff(F, g, g); legacy = true; }
    else if (n === 'Open Mic Poet') { const k = 2; for (const o of nbs) { o.atk += k * g; o.hp += k * g; } legacy = true; }
    else if (n === 'Golden Parachute Exec' && side.p && !side.p.ghost) { side.p.bonus_next += 2 * g; legacy = true; }
    else if (n === 'Struggling Artist') { for (const o of b) { o.atk += g; o.hp += g; } legacy = true; }
    else if (n === 'Nihilist') { for (const o of b) o.atk += g; legacy = true; }
    else if (n === 'Dead Rock Star') { for (const o of b) if (isTribe(o, C)) perm(o, 4 * g, 4 * g); legacy = true; }
    else if (n === 'Rage Quitter') { const kk = m.killer; if (kk && kk.hp > 0) { hit(kk, 5 * g); legacy = true; } }
    else if (n === 'Fan Convention') { const k = Math.min(4, Math.floor(((side.p && side.p.fsum) || 0) / 3)) * g; for (let i = 0; i < k; i++) combatFollower(side, idx); legacy = k > 0; }
    else if (n === 'Smart Doorbell') { for (const o of b) if (isTribe(o, T)) perm(o, g, g); legacy = true; }
    else if (n === 'Biopic') { const k = Math.min(4, side.deaths || 0) * g; for (const o of b) if (isTribe(o, C)) perm(o, k, k); legacy = true; }
    else if (n === 'Sampler' && !this.retrig) {
      const r0 = b[idx];
      if (r0) { this.retrig = true; for (let i = 0; i < g; i++) for (const nn of [r0.name].concat(r0.mash || [])) this.legacy(side, r0, nn, idx + 1, neighbours(b, r0)); this.retrig = false; legacy = true; }
    }
    return legacy;
  }
  resolveDeaths(k, ptr) {
    const side = this.sides[k], b = side.b;
    let changed = true;
    while (changed) {
      changed = false;
      for (const m of b.slice()) {
        if (m.hp > 0) continue;
        if (m.name === 'Too Big to Fail' && !m.tbf_used) { m.tbf_used = true; m.hp = 1; for (const o of b) if (o !== m && o.tribe === H) perm(o, 4 * m.g, 4 * m.g); this.frame({type: 'trigger', src: m.id}); changed = true; continue; }
        const idx = b.indexOf(m), nbs = neighbours(b, m);
        b.splice(idx, 1); if (idx < ptr) ptr -= 1;
        side.deaths = (side.deaths || 0) + 1;
        this.frame({type: 'death', side: k, id: m.id});
        let legacy = false;
        const g = m.g;
        if (m.tribe === P && b.some(x => x.is_('Squat Collective'))) { const r = wsum(b, 'Squat Collective') * (1 + wsum(b, 'Reunion Tour')); for (let i = 0; i < r; i++) this.combatWhenSold(side, m, idx); legacy = true; }
        const reps = 1 + wsum(b, 'Lawyer Next Door');
        for (let r = 0; r < reps; r++) {
          for (const n of [m.name].concat(m.mash || [])) if (this.legacy(side, m, n, idx, nbs)) legacy = true;
          if (m.likeLegacy && side.p && !side.p.ghost && side.p.addLikes) { side.p.addLikes(m.likeLegacy, m); legacy = true; }
        }
        if (legacy) this.frame({type: 'legacy', side: k, id: m.id, name: m.name});
        for (const v of b) {
          if (v.is_('Art Critic')) { perm(v, v.g, v.g); const cs = b.filter(o => o !== v && isTribe(o, C) && o.hp > 0); if (cs.length) perm(this.rng.choice(cs), v.g, v.g); }
          if (v.is_('Festival Pit') && isTribe(m, P) && v.hp > 0) { this.festival(side, v); this.frame({type: 'trigger', src: v.id}); }
          if (v.is_('Ghostwriter')) { const r = rightOf(b, v); if (r && isTribe(r, C) && r.hp > 0) { perm(r, v.g, v.g); this.frame({type: 'trigger', src: v.id}); } }
          if (v.is_('Memorial Mural') && side.deaths % 2 === 0) {
            for (let r = 0; r < v.n('Memorial Mural') * (v.golden ? 2 : 1); r++) {
              const real = side.p && !side.p.ghost && side.p.board;
              if (real) { side.p.creativeAtk = (side.p.creativeAtk || 0) + 1; for (const o of side.p.board) if (isTribe(o, C)) o.atk += 1; }   // the real board: dead ones too
              for (const o of b) if (isTribe(o, C)) o.atk += 1;   // this fight's copies
            }
            this.frame({type: 'trigger', src: v.id});
          }
          if (v.is_('Museum Retrospective') && side.deaths % 2 === 0) { const g = v.golden ? 6 : 3; for (const o of b) if (o !== v && isTribe(o, C)) perm(o, g, g); this.frame({type: 'trigger', src: v.id}); }
        }
        if (m.follower) for (const v of b) if (v.is_('Blue Checkmark')) { for (const o of b) if (isTribe(o, I)) perm(o, 2 * v.g, 2 * v.g); this.frame({type: 'trigger', src: v.id}); }
        if (side.vv > 0) { side.vv--; if (combatFollower(side, idx)) this.frame({type: 'summon', side: k}); }
        const hero = side.p && side.p.hero;
        if (hero === 'h_complainer' && side.deaths % COMPLAIN_EVERY === 0 && b.length) { for (const o of b) { o.atk += 1; o.hp += 1; } this.frame({type: 'hero', side: k, hero, tgts: b.map(o => o.id)}); }
        let back = m.rebrand;
        if (!back && hero === 'h_ex' && !side.exUsed) { side.exUsed = true; back = true; this.frame({type: 'hero', side: k, hero, tgts: []}); }
        if (back) {
          const r = Object.assign(Object.create(Object.getPrototypeOf(m)), m);
          r.hp = 1; r.rebrand = false; r.extras = m.extras.slice(); r.hits = 0; r.id = UID++; r.orig = m.orig;
          b.splice(Math.min(idx, b.length), 0, r); this.frame({type: 'rebrand', side: k, id: r.id});
          if (r.name === 'Cancelled Celebrity') for (let i = 0; i < 3 * r.g; i++) combatFollower(side, b.indexOf(r) + 1);
          // Scavengers: "when it comes back" / "after a friendly Feral comes back"
          if (isTribe(r, F)) { const kf = wsum(b, 'Fox Den'); if (kf) perm(r, 3 * kf, 3 * kf); }
          if (r.is_('Trash Panda')) { const os = b.filter(o => o !== r && isTribe(o, F)); for (const o of os) { o.atk += r.g; o.hp += r.g; } if (os.length) this.frame({type: 'trigger', src: r.id}); }
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
    SOC_PHASE = true; this.startOfCombat(0); this.startOfCombat(1); SOC_PHASE = false;
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
      for (const sd of this.sides) if (sd.b.length === 1 && sd.b[0].is_('Clutch Player')) sd.b[0].toxic = true;
      const att = me.b[ptr[turn]], swings = att.twice || (att.is_('Clutch Player') && me.b.length === 1) ? 2 : 1;
      this.curAtt = att;
      for (let s = 0; s < swings + (att.extraSwings || 0); s++) {
        if (att.hp <= 0 || !me.b.includes(att) || !them.b.length) break;
        me.attacks = (me.attacks || 0) + 1;
        this.clockIn(me, att, them);
        if (them.b.some(x => x.hp <= 0)) {   // a Clock In (Bluetooth Speaker) can kill before the swing: clear the dead, then pick a target
          this.settle(ptr);
          if (att.hp <= 0 || !me.b.includes(att) || !them.b.length) { if (s === 0) ptr[turn] += 1; break; }
        }
        const taunts = them.b.filter(m => m.taunt);
        const tgt = this.rng.choice(taunts.length ? taunts : them.b);
        if (att.is_('Plagiarist')) perm(att, tgt.atk * att.w('Plagiarist'), 0);
        const da = att.atk, dt = tgt.atk;
        const cleave = att.is_('Mosh Pit') || att.is_('Cover Band') ? neighbours(them.b, tgt) : [];
        for (const sd of this.sides) if (sd.b.length === 1 && sd.b[0].is_('Clutch Player')) sd.b[0].toxic = true;
        hit(tgt, att.atk, att); hit(att, tgt.atk, tgt);
        if (att.is_('Pro Gamer')) { const k = att.w('Pro Gamer'); perm(att, 3 * k, 2 * k); }
        if (tgt.is_('Bouncer')) { const kb = tgt.atk * tgt.w('Bouncer'); for (const o of neighbours(me.b, att)) hit(o, kb); }
        for (const w of neighbours(them.b, tgt)) if (w.is_('Neighbourhood Watch') && w.hp > 0) hit(att, 3 * w.g);
        if (hasClockIn(att) && att.hp > 0) { const kh = wsum(me.b, 'Hype Train'); if (kh) perm(att, 2 * kh, 2 * kh); }
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

// ======================================================================== pro bot (Nov 9)
// One brain for every bot in the game. It judges boards in simulated fights against the boards it has seen, looks a turn or
// two ahead so it values engines (spirals), plans its levelling, and places minions for attack order. Difficulty only
// limits its search and adds mistakes. PRO holds the weights that self-play tuning adjusts.
// off.hero: the Minimalist board cap tested slightly worse, so it is off by default
const PRO = {growth: 0.5, tierVal: 0.12, levelHealth: 12, err: 0.35, off: {hero: true},
  plan: 2.0, look: 0.35, ahead: 99, behind: 0.2, safeHp: 16, horizon: 3, stick: 2, curve: -2, twin: 0, rolls: 0,
  // v2 (situational levelling and buying): thresholds
  l2: 2, l3: 5, l4: 7, l5: 9, l6: 11, tierW: 0.5, swapTh: 1.5, statW: 0.5,   // turn on which the pro bot aims to reach each tier
  winHi: 0.72, winLo: 0.35, livesGamble: 3, livesSafe: 2, cheap: 2, payoffTurn: 7, pairRolls: 2, digRolls: 2};
// What a strong player builds toward in each style: [core and enablers, payoffs]. Payoffs count double.
const PLANS = {
  PI: [['Thought Leader', 'Consultant', 'Side Hustle', 'Grindset Guru', 'Venture Capitalist', 'Dropshipper', 'Tech Founder'], ['Unicorn Startup', 'Thought Leader']],
  EX: [['Sneaker Reseller', 'Middle Manager', 'Unpaid Intern', 'Golden Parachute Exec', 'Corporate Raider', 'Crypto Bro'], ['Private Equity', 'Too Big to Fail', 'The Billionaire']],
  FO: [['Giveaway Host', 'Comment Section', 'Reply Guy', 'Viral Video', 'Unboxing Streamer', 'Lawyer Next Door', 'Cancelled Celebrity'], ['Engagement Farmer', 'Brand Ambassador', 'Blue Checkmark']],
  MC: [['Personal Brand', 'Stan Account', 'Hype Man', 'Engagement Bot', 'Paparazzi', 'Content Creator'], ['Main Character', 'Ring Light Studio']],
  OG: [['Rooftop Beehive', 'Plant Parent', 'Guerrilla Gardener', 'Compost Heap', 'Tree Hugger', 'Windowsill Succulent', 'Wise Old Owl'], ['World Tree', 'Ancient Oak', 'Apex Scavenger']],
  SV: [['City Pigeon', 'Seagull', 'Trash Panda', 'Urban Fox', 'Wild Boar'], ['Nature Is Healing', 'Rat King']],
  PF: [['Memorial Mural', 'Art Critic', 'Struggling Artist', 'Open Mic Poet', 'Method Actor', 'Lawyer Next Door'], ['Museum Retrospective', 'Dead Rock Star']],
  PE: [['Indie Band', 'Busker', 'Merch Stand', 'Art Student', 'Record Label', 'Content Creator'], ['Festival Headliner', 'World Tour', 'Pop Diva']],
  GA: [['Smart Fridge', 'Firmware Update', 'Smart Plug', 'Robot Vacuum', 'Noise-Cancelling Headphones', 'Tech Founder'], ['Smart Home Hub', 'Quantum Computer', 'The Algorithm']],
  GM: [['Leaderboard', 'E-Sports Coach', 'Speedrunner', 'Toxic Teammate', 'Rage Quitter'], ['World Record', 'Pro Gamer']],
  SA: [['Feedback Loop', 'Crust Punk', 'Heckler', 'Graffiti Kid', 'Mosh Pit'], ['General Strike', 'Stage Diver', 'Mohawk Legend']],
  SO: [['Jingle Writer', 'Squat Collective', 'Sellout Frontman', 'Zine Maker', 'Anarchist Barista', 'Punk Philosopher'], ['Greatest Hits', 'Reunion Tour']],
  BI: [['Thought Experiment', 'Utilitarian', 'Pub Philosopher', 'Shower Thinker', 'Renaissance Thinker', 'Wise Old Owl'], ['Grand Unified Theory', 'Bestselling Author']],
  ST: [['Desert Hermit', 'Book-Club Stoic', 'Marathon Monk', 'Cold-Plunge Stoic', 'Stoicism Podcaster', 'Package Hoarder', 'Caretaker', 'Punk Philosopher'], ['Enlightened Guru', 'The Cynic']],
};
const planWeight = (style, name) => { const p = PLANS[style]; return !p ? 0 : p[1].includes(name) ? 2 : p[0].includes(name) ? 1 : 0; };
const cloneM = m => { const c = Object.assign(Object.create(Object.getPrototypeOf(m)), m); c.extras = m.extras.slice(); return c; };
function knobs(sk) {
  return {refs: sk < .3 ? 2 : sk < .7 ? 3 : 4, seeds: 1, horizon: sk < .35 ? 0 : 1, cands: sk < .3 ? 2 : sk < .7 ? 3 : 4,
    budget: Math.round(30 + 110 * sk), climb: Math.round(4 + 24 * sk), err: PRO.err * (1 - sk) ** 1.5};
}
const PERSONAS = [   // levelling bias (win-prob units per tier), extra Scrolls, can change tribe
  {name: 'fast', level: 0.06, rolls: -1, flex: false}, {name: 'tempo', level: -0.05, rolls: 2, flex: false},
  {name: 'flex', level: 0, rolls: 0, flex: true}, {name: 'steady', level: 0, rolls: 0, flex: false}, {name: 'greedy', level: 0.03, rolls: 1, flex: true}];
Object.assign(Player.prototype, {
  /** How many more lost fights this player can take, at this stage of the game. */
  lives() { return (this.health + this.boundaries) / Math.max(3, 0.6 * damageCap(this.turn + 1)); },
  /** Chance to win the next fight (simulated against the next opponent's last board), or null if unknown. */
  nextWin() {
    const nx = (this.scout || []).filter(o => o.next && o.board.length); if (!nx.length || !this.board.length) return null;
    const sh = this.shadow(); sh.endOfTurn(); return this.simScore(sh.board, nx, 2);
  },
  /** The style's payoff cards, and whether one is on the board. */
  payoffMissing() { const p = PLANS[this.style]; return !!p && !this.board.some(m => m.c && p[1].includes(m.c.name)); },
  payoffTier() { const p = PLANS[this.style]; if (!p) return 7; const ts = p[1].map(n => BY_NAME[n] && BY_NAME[n].tier).filter(Boolean); return ts.length ? Math.min(...ts) : 7; },
  /** A pair (two copies, not golden) at a tier the Feed still offers: worth rolling for the third. */
  hasPair() { const c = {}; for (const m of this.board) if (!m.golden && !m.follower && m.c && m.tier <= this.tier) c[m.name] = (c[m.name] || 0) + 1; return Object.values(c).some(k => k >= 2); },
  /** v2 levelling: the curve, adjusted by health, next-fight odds, missing payoffs, cheap levels, a full board, pairs and the lobby. */
  levelPlan(target) {
    const off = PRO.off, lives = this.lives(), cost = this.levelCost(), alive = this.aliveCount || 8;
    const full = this.board.filter(m => !m.follower).length >= 7, avgTier = this.board.length ? this.board.reduce((a, m) => a + (m.tier || 1), 0) / this.board.length : 0;
    const win = off.next ? null : this.nextWin();
    let eager = false, hold = false;
    if (!off.payoff && this.payoffMissing() && this.turn >= (this.prm || PRO).payoffTurn && this.tier < this.payoffTier() && lives >= (this.prm || PRO).livesGamble) eager = true;   // go find the payoff
    if (!off.cheap && cost <= (this.prm || PRO).cheap && lives >= (this.prm || PRO).livesSafe) eager = true;                                                    // a level this cheap is nearly free
    if (!off.full && full && avgTier >= this.tier - 0.3 && lives >= (this.prm || PRO).livesSafe) eager = true;                                    // nothing left to upgrade at this tier
    if (!off.next && win != null && win >= (this.prm || PRO).winHi && lives >= (this.prm || PRO).livesGamble) eager = true;                                     // safe this turn: invest
    if (!off.next && win != null && win < (this.prm || PRO).winLo && lives < (this.prm || PRO).livesSafe && this.tier >= target - 1) { eager = false; hold = true; }   // must win now
    if (!off.pair && this.hasPair() && this.tier >= target && cost > (this.prm || PRO).cheap) eager = false;                                       // roll for the triple first
    if (!off.lobby && alive <= 3 && cost > (this.prm || PRO).cheap && win != null && win < 0.5) { eager = false; hold = this.tier >= target - 1; }  // endgame: strength now
    return {eager, hold};
  },
  /** Stats a board gains over the next few turns from its own engines (end of turn, Likes), played forward on a copy. */
  growth(board) {
    const sh = this.shadow(board), now = sh.board.reduce((a, m) => a + m.atk + m.hp, 0);
    for (let t = 0; t < (this.prm || PRO).horizon; t++) { for (const m of sh.board) { m.ta = m.th = 0; } sh.endOfTurn(); sh.likes += 0; sh.spendLikes(); }
    return sh.board.reduce((a, m) => a + m.atk + m.hp, 0) - now;
  },
  /** Extra value of a Feed card from what it makes the board grow into (spirals), on top of its card score. */
  lookBonus(e) {
    if (e.card.collab || this.board.length >= 7) return 0;
    const m = new M(e.card); UID--; m.atk += e.a; m.hp += e.h;
    return (this.prm || PRO).look * Math.max(-10, this.growth(this.board.concat([m])) - this.baseGrowth) / 2;
  },
  /** Tempo: own board against the lobby's typical board (from scouting). >0 ahead, <0 behind. */
  tempo() {
    const s = (this.scout || []).map(o => o.power).sort((a, b) => a - b); if (!s.length) return 0;
    const med = s[s.length >> 1], own = this.board.reduce((a, m) => a + m.atk + m.hp, 0);
    return med ? own / med - 1 : 0;
  },
  /** Switch plan when the board has drifted into another style's plan (counts in plan cards, payoffs double). */
  planPivot() {
    if (this.turn < 4 || this.turn > 10) return;
    const score = st => this.board.reduce((a, m) => a + (m.c ? planWeight(st, m.c.name) : 0), 0);
    const cur = score(this.style), best = maxBy(Object.keys(PLANS), score);
    if (best !== this.style && score(best) >= cur + (this.prm || PRO).stick) { this.style = best; this.tribe = STYLES[best][0]; }   // style_code keeps the starting style (balance results count by it)
  },
  /** A throwaway copy of this player for trying moves; nothing done to it touches the real player. */
  shadow(board = this.board) {
    const sh = Object.create(Player.prototype); Object.assign(sh, this);
    sh.human = false; sh.log = []; sh.pending = []; sh.hand = []; sh.board = board.map(cloneM); sh.gold = [this.gold[0]];
    sh.feedBuff = JSON.parse(JSON.stringify(this.feedBuff)); sh.scrollUses = Object.assign({}, this.scrollUses); sh.buffed = new Set();
    sh.merchUsed = Object.assign({}, this.merchUsed); sh.resellUsed = new Set(this.resellUsed); sh.gigUsed = new Map(this.gigUsed); sh.dbUses = Object.assign({}, this.dbUses); sh.queue = [];
    sh.rerelease = []; sh.discounts = Object.assign({}, this.discounts); sh.getFeed = null; sh.feedRef = ((this.getFeed ? this.getFeed() : this.feedRef) || []).map(e => Object.assign({}, e)); sh.onBegin = null; sh.isShadow = true;
    return sh;
  },
  proRefs() {
    const k = this.kn.refs, s = (this.scout || []).filter(o => o.board.length);
    const next = s.filter(o => o.next), rest = s.filter(o => !o.next).sort((a, b) => b.power - a.power);
    return next.concat(rest).slice(0, k);
  },
  /** Win chance of a combat-ready board against the reference boards (scaled up by `scale` for future turns). */
  wp(board, refs, scale = 1) {
    if (!refs.length || this.fights <= 0) {   // no boards seen yet, or out of thinking time: a stats estimate
      const st = board.reduce((a, m) => a + m.atk + m.ta + m.hp + m.th, 0), exp = (refs.length ? refs.reduce((a, o) => a + o.power, 0) / refs.length : 8 + 14 * this.turn) * scale;
      return 1 / (1 + Math.exp(-(st - exp) / Math.max(10, exp * 0.35)));
    }
    let tot = 0, n = 0;
    for (const o of refs) {
      const ob = scale === 1 ? o.board : o.board.map(m => { const c = cloneM(m); c.atk = Math.round(c.atk * scale); c.hp = Math.round(c.hp * scale); return c; });
      const f = new Fight({ghost: true, hero: this.hero, punks_sold: this.punks_sold}, {ghost: true, hero: o.hero}, board, ob, RNG(7919 * (this.turn * 64 + refs.indexOf(o)) + (scale === 1 ? 0 : 1)));   // paired: every option meets the same fights
      f.quiet = true; f.run(); this.fights--;
      const w = o.next ? 2 : 1, sv = f.survivors.length / 7;
      tot += w * (f.result === 1 ? 0.85 + 0.15 * sv : f.result === 0 ? 0.5 : 0.15 - 0.15 * sv); n += w;
    }
    return tot / n;
  },
  /** How good a shop board is: its fight after end of turn, plus (looking ahead) the same board a turn later against grown opponents. */
  judge(sh, refs) {
    sh.endOfTurn(); let v = this.wp(sh.board, refs);
    if (this.kn.horizon) {
      for (const m of sh.board) { m.ta = m.th = 0; m.turns_on_board += 1; }
      sh.endOfTurn(); v = (1 - (this.prm || PRO).growth) * v + (this.prm || PRO).growth * this.wp(sh.board, refs, this.lobbyGrowth || 1.25);
    }
    return v;
  },
  /** Try a buy on a copy and judge the result. */
  tryBuy(entry, refs, sellFirst = null) {
    const sh = this.shadow();
    if (sellFirst) sh.sell(sh.board[this.board.indexOf(sellFirst)], sh.gold);
    sh.gold[0] -= this.minionCost(entry); sh.play(entry.card, sh.gold, null, null, entry);
    sh.arrange(); sh.arrangeExpert(); return this.judge(sh, refs);
  },
  /** Level now or not: buy greedily on copies both ways and compare, with a value for the higher tier that shrinks late in the game. */
  proWantsLevel(feed, refs) {
    if (this.tier >= 6) return false;
    const cost = this.levelCost(); if (this.gold[0] < cost) return false;
    if (PRO.off.level) return this.tier < (CURVE[this.turn] || 6);
    if (this.rng() < this.kn.err) return this.tier < (CURVE[this.turn] || 6);   // a mistake: follow the plain curve
    const plan = level => {
      const sh = this.shadow(); if (level) sh.gold[0] -= cost;
      const f = feed.slice();
      for (let g = 0; g < 8; g++) {
        const af = f.filter(e => this.minionCost(e) <= sh.gold[0]); if (!af.length || sh.board.length >= 7) break;
        const e = maxBy(af, x => sh.cardScore(x.card) + (x.a + x.h) / 4); f.splice(f.indexOf(e), 1);
        sh.gold[0] -= this.minionCost(e); sh.play(e.card, sh.gold, null, null, e);
      }
      sh.arrange(); return this.judge(sh, refs);
    };
    const left = Math.max(0.15, Math.min(1, (16 - this.turn) / 10)), hurt = this.health + this.boundaries < (this.prm || PRO).levelHealth ? 0.4 : 1;
    const tv = ((this.prm || PRO).tierVal + this.persona.level) * left * hurt * (this.tier <= 3 ? 1.2 : 1);
    return plan(true) + tv > plan(false);
  },
  /** Among the best few affordable cards, take the one whose board judges best (sometimes, at low skill, a worse one). */
  proPick(afford, refs) {
    const sc = e => this.cardScore(e.card) + (e.a + e.h) / 4;
    const top = afford.slice().sort((x, y) => sc(y) - sc(x)).slice(0, this.kn.cands);
    if (top.length < 2 || this.fights <= 0 || PRO.off.pick) return top[0];
    const ranked = top.map(e => [e, this.tryBuy(e, refs)]).sort((a, b) => b[1] - a[1]);
    return ranked.length > 1 && this.rng() < this.kn.err ? ranked[1][0] : ranked[0][0];
  },
  /** Full board, with lookahead: swap when the card (with its growth) beats the weakest minion (with what it adds to growth). */
  proSwapLook(entry, worst) {
    const g0 = this.growth(this.board), lose = g0 - this.growth(this.board.filter(o => o !== worst));
    this.baseGrowth = this.growth(this.board.filter(o => o !== worst));
    const gain = (this.prm || PRO).look * (this.growth(this.board.filter(o => o !== worst).concat([Object.assign(new M(entry.card), {})])) - this.baseGrowth) / 2; UID--;
    return this.cardScore(entry.card) + (entry.a + entry.h) / 4 + gain > this.value(worst) + (this.prm || PRO).look * lose / 2 + (this.prm || PRO).swapTh;
  },
  /** Full board: is selling the weakest minion for this card an upgrade? */
  proSwap(entry, worst, refs) {
    if (this.fights <= 0 || PRO.off.swap) return this.cardScore(entry.card) > this.value(worst) + 1.5;
    const sh = this.shadow(); sh.arrange(); const now = this.judge(sh, refs);
    return this.tryBuy(entry, refs, worst) > now + 0.01;
  },
  /** Order: rules first (attack order, neighbours, Legacy and Rebrand on the left), then swaps checked in simulated fights. */
  arrangePro(refs) {
    this.arrange(); this.arrangeExpert();
    let b = this.board; if (b.length < 3 || !refs.length || this.rng() < this.kn.err || PRO.off.climb) return;
    const judgeOrder = o => { const sh = this.shadow(o); sh.endOfTurn(); return this.wp(sh.board, refs); };
    let best = judgeOrder(b) + 0.005, tries = this.kn.climb;
    while (tries-- > 0 && this.fights > 0) {
      const i = this.rng.int(0, b.length - 1), j = this.rng.int(0, b.length - 1); if (i === j) continue;
      const c = b.slice(); [c[i], c[j]] = [c[j], c[i]];
      const v = judgeOrder(c); if (v > best) { best = v; b = c; }
    }
    this.board = b;
  },
  /** Flexible bots follow what the Feed gave them: switch tribe and style when another tribe dominates the board. */
  proPivot() {
    if (!this.persona.flex || this.turn < 4 || this.turn > 9 || !this.tribe) return;
    const cnt = {}; for (const m of this.board) if (!m.follower && m.tribe !== N) cnt[m.tribe] = (cnt[m.tribe] || 0) + 1;
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    if (!top || top[0] === this.tribe || top[1] < (cnt[this.tribe] || 0) + 2) return;
    const styles = Object.keys(STYLES).filter(k => STYLES[k][0] === top[0]);
    const sc = {}; for (const m of this.board) if (m.c && styles.includes(m.c.style)) sc[m.c.style] = (sc[m.c.style] || 0) + 1;
    this.tribe = top[0]; this.style = maxBy(styles, k => sc[k] || 0); this.style_code = this.style;
  },
});
root.LSEngine = {GIGS, auras, knobsFor: knobs, personaFor: p => PERSONAS[Math.floor(p.rng() * PERSONAS.length)], PRO, inDeck, DEFAULT_OFF, H, I, F, C, T, P, PH, N, TRIBES, FEED_SIZE, LEVEL_COST, CURVE, TARGETED_FI, HERO_POWERS, skillOf, tune: o => { if ('STYLE_PULL' in o) STYLE_PULL = o.STYLE_PULL; ({DOOM_EVERY = DOOM_EVERY, COACH = COACH, GYM_LIKES = GYM_LIKES, COMPLAIN_EVERY = COMPLAIN_EVERY, MINI_MAX = MINI_MAX, MINI_BUFF = MINI_BUFF, GYM_EVERY = GYM_EVERY} = o); if (o.costs) for (const k in o.costs) HERO_POWERS[k].cost = o.costs[k]; }, tuning: () => ({DOOM_EVERY, COACH, GYM_LIKES, COMPLAIN_EVERY, MINI_MAX, MINI_BUFF, GYM_EVERY}), load, RNG, M, Player, Fight, buildPool, damageCap,
  byName: n => BY_NAME[n], byTribe: t => BY_TRIBE[t], styles: () => STYLES};
})(typeof window !== 'undefined' ? window : globalThis);
