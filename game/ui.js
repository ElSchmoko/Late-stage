/* Late Stage UI: shop, drag & drop, animated combat playback, screens. */
(function () {
'use strict';
const E = window.LSEngine;
E.load(window.LS_CARDS, window.LS_STYLES);
const TC = window.LS_TRIBE_COL, TP = window.LS_TRIBE_PLURAL;
const HEROES = window.LS_HEROES, HERO = Object.fromEntries(HEROES.map(h => [h.slug, h]));
const STARTERS = ['remote', 'boomer', 'h_gymbro', 'h_procrastinator'];
// ---------------------------------------------------------------- profile: rating, unlocks, lifetime stats (saved on this device)
const PKEY = 'ls_profile_v1';
const START_RATING = 0;
function freshProfile() { return {v: 2, rating: START_RATING, peak: START_RATING, games: 0, top4: 0, wins: 0, unlocked: STARTERS.slice(), seen: STARTERS.slice(), stats: {hires: 0, scrolls: 0, deaths: 0}, flags: {}, history: []}; }
function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(PKEY));
    if (p && p.rating != null) {
      if (!p.v) { p.v = 2; p.rating = Math.max(0, p.rating - 800); p.peak = Math.max(p.rating, (p.peak || 0) - 800); }   // ratings used to start at 800
      return Object.assign(freshProfile(), p, {stats: Object.assign(freshProfile().stats, p.stats), flags: p.flags || {}});
    }
  } catch (e) {}
  return freshProfile();
}
function saveProfile() { try { localStorage.setItem(PKEY, JSON.stringify(PROF)); } catch (e) {} }
const PROF = loadProfile();
// Renamed cards (v15, Nov 19): keep them in the Feed pool and in the run stats under their new names.
const RENAMED = {'Reply Guy': 'Sophist', 'Giveaway Host': 'Epicurean', 'Comment Section': 'Peripatetic', 'Unboxing Streamer': 'Pythagorean', 'Viral Video': 'Hemlock Martyr',
  'Engagement Farmer': 'The Academy', 'Brand Ambassador': 'Existentialist', 'Blue Checkmark': 'Philosopher King', 'Bot Farm': 'Mystery Cult', 'Fan Convention': 'Utopian Commune',
  'Stoicism Podcaster': 'Troll', 'Cold-Plunge Stoic': 'Rage Baiter', 'Marathon Monk': 'Prank Vlogger', 'Book-Club Stoic': 'Reality Star', 'Desert Hermit': 'Apology Video',
  'The Cynic': 'Shock Jock', 'Enlightened Guru': 'Crisis PR Firm', 'Breathwork Coach': 'Drama Channel', 'Tenured Professor': 'Comments Off', 'Cancelled Celebrity': 'The Heretic'};
if (!PROF.renamed16) {   // v16 adds Cancelled Celebrity -> The Heretic; running the map twice is harmless
  const rn = n => RENAMED[n] || n;
  if (PROF.legSeen) PROF.legSeen = PROF.legSeen.map(rn);
  if (PROF.deck) PROF.deck = [...new Set(PROF.deck.map(rn))];
  for (const r of PROF.history || []) if (r && r.c) { const c = {}; for (const k in r.c) c[rn(k)] = (c[rn(k)] || 0) + r.c[k]; r.c = c; }
  PROF.renamed15 = PROF.renamed16 = true; saveProfile();
}
// Season reset (Nov 10): rating, rewards-track progress and unlocked cards start over for every profile; heroes stay unlocked.
// Bump SEASON to run it again. Restoring an older save code runs it on the next load as well.
const SEASON = 1;
let SEASON_NEW = false;
if ((PROF.season || 0) < SEASON) {
  const fresh = (PROF.games || 0) === 0;
  Object.assign(PROF, {season: SEASON, rating: START_RATING, peak: START_RATING, xp: 0, rtSeen: 0, legSeen: []});
  delete PROF.deck;   // the Feed pool goes back to the starting cards
  if (PROF.flags) delete PROF.flags.legendTut;
  saveProfile(); SEASON_NEW = !fresh;
}
const BRACKETS = [[0, 'Unpaid Intern', '#c9c2d6'], [1000, 'Junior Associate', '#8fd4ff'], [2000, 'Middle Management', '#4fd1c5'], [3000, 'Director', '#b18cff'], [4000, 'Vice President', '#ff8ab8'], [5000, 'C-Suite', '#ff8a3d'], [6500, 'Billionaire', '#ffc928']];
const bracketOf = r => BRACKETS.reduce((b, x) => (r >= x[0] ? x : b), BRACKETS[0]);
const UNLOCK = {   // hero -> [goal, progress(profile)]
  h_bargainhunter: [60, P => P.stats.hires], h_doomscroller: [100, P => P.stats.scrolls], h_serial: [1, P => +!!P.flags.tier6],
  h_overthinker: [1, P => +!!P.flags.fourTribes], h_lifecoach: [1, P => +!!P.flags.streak3], h_minimalist: [1, P => +!!P.flags.small],
  h_complainer: [1, P => +!!P.flags.comeback], h_ex: [80, P => P.stats.deaths],
  h_daytrader: [60, P => P.stats.sells || 0], h_overachiever: [1, P => Math.min(1, P.wins || 0)], h_collector: [10, P => P.stats.triples || 0],
  h_networker: [1, P => +!!P.flags.fiveTribes], h_prepper: [1, P => +!!P.flags.bunker], h_trendchaser: [250, P => P.stats.hires]};
const isUnlocked = slug => PROF.unlocked.includes(slug);
/** The hero that stands for you outside a run (the rewards tracks): picked in Collection › Heroes, else the last one played. */
const avatarHero = () => HERO[PROF.avatar] && isUnlocked(PROF.avatar) ? HERO[PROF.avatar] : HERO[G.heroSlug] || HERO[PROF.unlocked[0]] || HEROES[0];
function progressOf(slug) { const u = UNLOCK[slug]; return u ? [Math.min(u[0], u[1](PROF)), u[0]] : [1, 1]; }
let NEW_UNLOCKS = [];
function checkUnlocks() {
  for (const slug of Object.keys(UNLOCK)) if (!isUnlocked(slug)) { const [c, g] = progressOf(slug); if (c >= g) { PROF.unlocked.push(slug); NEW_UNLOCKS.push(slug); if (G.screen === 'shop' || G.screen === 'combat') toast(`New hero unlocked: ${HERO[slug].name}`, 2200); } }
  saveProfile();
}
function ratingChange(me, players) {
  let d = 0;
  for (const q of players) { if (q === me || q.rating == null) continue; const S = me.place < q.place ? 1 : me.place > q.place ? 0 : .5; d += S - 1 / (1 + Math.pow(10, (q.rating - PROF.rating) / 400)); }
  return Math.round(40 * d);
}
const ART = {};
for (const [k, v] of Object.entries(Object.assign({}, window.LS_CHANGELOG_ART || {}, window.LS_ART))) ART[k] = URL.createObjectURL(new Blob([v], {type: 'image/svg+xml'}));
const CARD = Object.fromEntries(window.LS_CARDS.map(c => [c.name, c]));
const artOf = name => ART[name === 'Follower' ? 'follower' : (CARD[name] ? CARD[name].art : 'follower')];
const W = 844, H = 390;

// ---------------------------------------------------------------- helpers
const stage = document.getElementById('core'), screenEl = document.getElementById('stage');
let SCALE = 1, EXT = {l: 0, r: 0};
/** Fills the whole screen: the outer canvas takes the phone's shape, the 844x390 game area sits centred inside the
 *  notch-free part, and the side columns (.edge-l / .edge-r) move out by --exl / --exr toward the screen edges. */
function fit() {
  const wrap = document.getElementById('wrap'), ins = getComputedStyle(document.getElementById('inset'));
  const iL = parseFloat(ins.paddingLeft) || 0, iR = parseFloat(ins.paddingRight) || 0, iT = parseFloat(ins.paddingTop) || 0, iB = parseFloat(ins.paddingBottom) || 0;
  const aw = wrap.clientWidth, ah = wrap.clientHeight;
  const s = Math.min((aw - iL - iR) / W, (ah - iT - iB) / H);
  const sw = aw / s, sh = ah / s, l = iL / s, r = iR / s, safe = sw - l - r;
  const left = l + Math.max(0, (safe - W) / 2);
  SCALE = s;
  css(screenEl, {width: sw, height: sh}); screenEl.style.transform = `scale(${s})`;
  css(stage, {left, top: Math.max(0, (sh - H) / 2)});
  EXT = {l: Math.max(0, left - l - 6), r: Math.max(0, sw - r - (left + W) - 6)};
  stage.style.setProperty('--exl', EXT.l + 'px'); stage.style.setProperty('--exr', EXT.r + 'px');
}
let refitT = null;
addEventListener('resize', () => { fit(); clearTimeout(refitT); refitT = setTimeout(() => { if (LY.ff && G.screen === 'shop' && !G.busy && !G.mode) buildShop(); }, 300); }); addEventListener('orientationchange', () => setTimeout(fit, 250)); fit();
const edge = (side, ...es) => { for (const e of es) if (e) e.classList.add(side === 'l' ? 'edge-l' : 'edge-r'); };
function el(tag, cls, html, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
function css(e, o) { for (const k in o) e.style[k] = typeof o[k] === 'number' && !['opacity', 'zIndex'].includes(k) ? o[k] + 'px' : o[k]; return e; }
const SP = {v: 1};
const sleep = ms => new Promise(r => setTimeout(r, ms / SP.v));
const anim = (e, kf, o) => { if (!e || !e.animate) return Promise.resolve(); const a = e.animate(kf, Object.assign({fill: 'none'}, o, {duration: (o.duration || 300) / (o.raw ? 1 : SP.v)})); return a.finished.catch(() => {}); };
function toStage(cx, cy) { const r = stage.getBoundingClientRect(); return [(cx - r.left) / SCALE, (cy - r.top) / SCALE]; }
function rectOf(e) { const r = e.getBoundingClientRect(), s = stage.getBoundingClientRect(); return {x: (r.left - s.left) / SCALE, y: (r.top - s.top) / SCALE, w: r.width / SCALE, h: r.height / SCALE}; }
const center = r => [r.x + r.w / 2, r.y + r.h / 2];
const STAR = (s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4-4.7-4.4 6.4-.8z" fill="#ffc928" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path></svg>`;
const ico = (inner, s = 14, sw = 2.4) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#2b2140" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const FXI = {
  eot: '<path d="M7 3h10M7 21h10M8 3q0 6 4 9q4-3 4-9M8 21q0-6 4-9q4 3 4 9" fill="#fff6dc"></path>',
  soc: '<path d="M5 19L19 5M14.5 5H19v4.5"></path><path d="M19 19L5 5M5 9.5V5h4.5"></path>',
  sold: '<circle cx="12" cy="12" r="8.5" fill="#ffc928"></circle><circle cx="12" cy="12" r="4"></circle>',
  legacy: '<rect x="5" y="3" width="13" height="17" rx="2" fill="#fff6dc"></rect><path d="M8.5 8h6M8.5 11.5h6M8.5 15h3"></path><circle cx="17" cy="18" r="3.5" fill="#ff6b5e"></circle>',
  seek: '<path d="M3.5 10v4h3.5l7 4.5v-13L7 10H3.5z" fill="#ffc928"></path><path d="M17.5 9.5q2 2.5 0 5"></path><path d="M20 7q3.5 5 0 10"></path>',
  fi: '<rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="#ffffff"></rect><path d="M5 5h14a2.5 2.5 0 0 1 2.5 2.5v3h-19v-3A2.5 2.5 0 0 1 5 5z" fill="#ff6b5e"></path>',
  after: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"></path><circle cx="12" cy="12" r="3.5" fill="#ffc928"></circle>',
  collab: '<rect x="2" y="8" width="12" height="8" rx="4" fill="#8fd4ff"></rect><rect x="10" y="8" width="12" height="8" rx="4"></rect>',
  surv: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" fill="#4fd1c5"></path>',
};
function fxOf(name) {
  const c = CARD[name]; if (!c) return [];
  const t = c.text, out = [];
  if (/Start of combat/.test(t)) out.push('soc');
  if (/End of turn/i.test(t)) out.push('eot');
  if (/When sold/.test(t)) out.push('sold');
  if (/Legacy/.test(t)) out.push('legacy');
  if (/survives damage|takes damage/.test(t)) out.push('surv');
  if (/^First Impression/.test(t)) out.push('fi');
  if (!out.length && /^(After|Once per turn|Twice per combat|Every)/.test(t)) out.push('after');
  return out.slice(0, 2);
}
const BURST = col => `<svg width="46" height="46" viewBox="0 0 44 44" aria-hidden="true"><path d="M22 2l4.5 9 9.5-3.5-2.5 9.5 9 4.5-9 4.5 2.5 9.5-9.5-3.5-4.5 9-4.5-9-9.5 3.5 2.5-9.5-9-4.5 9-4.5-2.5-9.5 9.5 3.5z" fill="${col}" stroke="#2b2140" stroke-width="2.5" stroke-linejoin="round"></path></svg>`;

// ---------------------------------------------------------------- shared visuals
function tokenHTML(m, o = {}) {
  const name = m.name, tribe = m.tribe;
  const atk = o.atk != null ? o.atk : m.atk, hp = o.hp != null ? o.hp : m.hp;
  let s = (m.taunt ? '<div class="seekring"></div>' : '') + `<div class="clip"><img src="${artOf(name)}" alt="" draggable="false">${CARD[name] && CARD[name].legendary ? '<i class="foil"></i>' : ''}</div>`;
  if (m.golden) s += '<i class="spk"></i><i class="spk s2"></i><i class="spk s3"></i>';
  if (o.saved) s += `<div class="bm"><svg width="18" height="24" viewBox="0 0 18 24" aria-hidden="true"><path d="M3 2H15Q16.5 2 16.5 3.5V21.5L9 17L1.5 21.5V3.5Q1.5 2 3 2Z" fill="#ff8ab8" stroke="#2b2140" stroke-width="2.4" stroke-linejoin="round"></path></svg></div>`;
  if (!m.follower && m.tier) s += `<div class="tier">${STAR(13).repeat(m.tier)}</div>`;
  const fx = m.follower ? [] : fxOf(name).concat((m.extras || []).length ? ['collab'] : []).slice(0, 2);
  if (fx.length) s += `<div class="fx">${fx.map(k => `<span>${ico(FXI[k], 13)}</span>`).join('')}</div>`;
  if (o.copies) s += `<div class="pip">${[0, 1, 2].map(i => `<i style="background:${i < o.copies ? '#ffc928' : '#fff'}"></i>`).join('')}</div>`;
  if (m.shield) s += '<div class="ooo"></div>';
  if (m.toxic) s += '<div class="tox"></div>';
  s += `<div class="st at${o.upA ? ' up' : ''}${o.tmp ? ' tmp' : ''}">${atk}</div><div class="st hp${o.upH ? ' up' : ''}${o.tmp ? ' tmp' : ''}${o.hurt ? ' hurt' : ''}">${hp}</div>`;
  return s;
}
/** Tribe background for a portrait: two-tribe cards get the diagonal split, with the usual dot pattern on top. */
const DOTS = 'radial-gradient(rgba(43,33,64,.16) 1.4px,transparent 1.7px)';
const tribe2Of = name => (CARD[name] && CARD[name].tribe2) || null;
const tribeBgCss = (tribe, tribe2, dot = 8) => tribe2 ? `background-image:${DOTS},linear-gradient(135deg,${TC[tribe]} 50%,${TC[tribe2]} 50%);background-size:${dot}px ${dot}px,100% 100%` : `background-color:${TC[tribe] || '#ffc928'}`;
function paintTribe(e, tribe, tribe2, dot = 8) {
  if (tribe2) { e.style.backgroundColor = ''; e.style.backgroundImage = `${DOTS},linear-gradient(135deg,${TC[tribe]} 50%,${TC[tribe2]} 50%)`; e.style.backgroundSize = `${dot}px ${dot}px,100% 100%`; }
  else { e.style.backgroundImage = ''; e.style.backgroundSize = ''; e.style.backgroundColor = TC[tribe] || '#ffc928'; }
}
function makeToken(m, o = {}) {
  const t = el('div', 'tok');
  paintTribe(t, m.tribe, tribe2Of(m.name));
  t.innerHTML = tokenHTML(m, o);
  t.classList.toggle('seek', !!m.taunt); t.classList.toggle('gold', !!m.golden);
  return t;
}
function updateToken(t, m, o = {}) {
  const prevA = t.querySelector('.st.at'), prevH = t.querySelector('.st.hp');
  const oldA = prevA ? +prevA.textContent : null, oldH = prevH ? +prevH.textContent : null;
  t.innerHTML = tokenHTML(m, o);
  paintTribe(t, m.tribe, tribe2Of(m.name));
  t.classList.toggle('seek', !!m.taunt); t.classList.toggle('gold', !!m.golden);
  const na = o.atk != null ? o.atk : m.atk, nh = o.hp != null ? o.hp : m.hp;
  if (oldA !== null && oldA !== na) anim(t.querySelector('.st.at'), [{transform: 'rotate(-6deg) scale(1.55)'}, {transform: 'rotate(-6deg) scale(1)'}], {duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)'});
  if (oldH !== null && oldH !== nh) anim(t.querySelector('.st.hp'), [{transform: 'rotate(6deg) scale(1.55)'}, {transform: 'rotate(6deg) scale(1)'}], {duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)'});
  return [na - (oldA ?? na), nh - (oldH ?? nh)];
}
function fmtStars(n, s = 16) { return `<span class="stars">${STAR(s).repeat(n)}</span>`; }
function cardHTML(c, o = {}) {
  const tc = TC[c.tribe], n = c.name.length, nfs = n <= 15 ? 21 : Math.max(14, Math.round(208 / (n * .56) * 10) / 10);
  const lab = c.tribe === 'Neutral' ? 'NEIGHBOUR' : c.tribe.toUpperCase();
  const tag = c.tribe2 ? `<span class="trb" style="background:${tc}">${lab}</span><span class="trb" style="background:${TC[c.tribe2]}">${c.tribe2.toUpperCase()}</span>` : `<span class="trb" style="background:${tc}">${lab}</span>`;
  const atk = o.atk != null ? o.atk : c.atk, hp = o.hp != null ? o.hp : c.hp;
  const bgc = c.tribe2 ? `background-image:linear-gradient(135deg,${tc} 50%,${TC[c.tribe2]} 50%)` : `background-color:${tc}`;
  return `<div class="card${o.golden ? ' golden' : ''}${c.legendary ? ' legend' : ''}"><div class="art" style="${bgc}"><img src="${ART[c.art]}" alt="" draggable="false"></div>${c.legendary ? '<i class="foil"></i>' : ''}
    <p class="nm" style="font-size:${nfs}px">${c.name}</p><div class="meta${c.tribe2 ? ' duo' : ''}">${tag}${fmtStars(c.tier, c.tribe2 ? 11 : c.tier <= 4 ? 16 : 13)}</div>
    <p class="txt" style="font-size:${o.golden ? c.gold_fit || c.fit : c.fit}px">${o.golden ? c.gold_face || c.html : c.html}</p><div class="sa">${atk}</div><div class="sh">${hp}</div></div>`;
}
const HEXI = '<svg width="40" height="44" viewBox="0 0 40 44" aria-hidden="true"><path d="M20 3L36 12V32L20 41L4 32V12Z" fill="#2fd0d0" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path><path d="M20 12l2.6 5.4 5.9.8-4.3 4.1 1 5.8L20 25.3l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="#ffffff" stroke="#2b2140" stroke-width="2" stroke-linejoin="round"></path></svg>';
const RIB = '<svg width="100%" height="40" viewBox="0 0 252 40" preserveAspectRatio="none" aria-hidden="true"><path d="M4 8H24V34H4L12 21Z" fill="#e0a800" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path><path d="M248 8H228V34H248L240 21Z" fill="#e0a800" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path><path d="M18 4H234V30H18Z" fill="#ffc928" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path></svg>';
const HEART = '<svg width="54" height="50" viewBox="0 0 54 50" aria-hidden="true"><path d="M27 46C10 34 3 25 3 15.5 3 8 9 3 16 3c5 0 9 3 11 7 2-4 6-7 11-7 7 0 13 5 13 12.5C51 25 44 34 27 46Z" fill="#ff6b5e" stroke="#2b2140" stroke-width="4" stroke-linejoin="round"></path></svg>';
const SHIELD = '<svg width="54" height="50" viewBox="0 0 54 50" aria-hidden="true"><path d="M27 3L48 9V24C48 36 38 44 27 47 16 44 6 36 6 24V9Z" fill="#c9c2d6" stroke="#2b2140" stroke-width="4" stroke-linejoin="round"></path></svg>';
function heroHTML(h, locked) {
  const cost = h.cost === 'Passive' ? 'PASSIVE' : `<span style="display:inline-flex;width:18px;height:18px;border-radius:50%;border:2px solid #2b2140;background:#ffc928;align-items:center;justify-content:center;color:#2b2140;font-size:11px;padding-top:2px">${h.cost}</span> GOLD · ONCE PER TURN`;
  const nm = h.name.replace('The ', '');
  return `<div class="hero${locked ? ' locked' : ''}"><div class="in"></div><div class="arch" style="background:${h.col}"><div class="sky" style="background:${h.col}"><div class="rays"></div></div><img src="${ART[h.slug]}" alt="" draggable="false"></div>
   <div class="rib">${RIB}<p style="font-size:${nm.length > 16 ? 16 : 19}px">${nm}</p></div><div class="pw"><div class="hx">${HEXI}</div><div><div class="hpn">${h.power}</div><div class="cost">${cost}</div></div></div>
   <p class="eff">${h.effect_html}</p><div class="bdg" style="left:-16px">${HEART}<span>30</span></div><div class="bdg" style="right:-16px">${SHIELD}<span>${h.boundaries}</span></div>
   ${locked ? `<div class="lock">${ico('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#ffc928"></rect><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"></path>', 30)}<p>${h.unlock}</p></div>` : ''}</div>`;
}
function floatText(x, y, text, cls = '') {
  const f = el('div', 'float ' + cls, text, stage); css(f, {left: x, top: y}); f.style.transform = 'translate(-50%,-50%)';
  anim(f, [{transform: 'translate(-50%,-30%) scale(.6)', opacity: 0}, {transform: 'translate(-50%,-80%) scale(1.15)', opacity: 1, offset: .25}, {transform: 'translate(-50%,-190%) scale(1)', opacity: 0}], {duration: 900, easing: 'ease-out'}).then(() => f.remove());
}
function burstAt(x, y, text, col = '#d8433a') {
  const b = el('div', 'burst', BURST(col) + `<span>${text}</span>`, stage); css(b, {left: x - 23, top: y - 23});
  anim(b, [{transform: 'scale(.2) rotate(-40deg)', opacity: 1}, {transform: 'scale(1.2) rotate(8deg)', opacity: 1, offset: .35}, {transform: 'scale(1) rotate(0)', opacity: 1, offset: .7}, {transform: 'scale(.9)', opacity: 0}], {duration: 700}).then(() => b.remove());
}
async function streak(from, to, col = '#2ecb6e', dur = 260) {
  const s = el('div', 'streak', '', stage); s.style.background = col;
  const [x0, y0] = from, [x1, y1] = to, mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 40;
  await anim(s, [{left: x0 - 7 + 'px', top: y0 - 7 + 'px', transform: 'scale(.6)'}, {left: mx - 7 + 'px', top: my - 7 + 'px', transform: 'scale(1.2)'}, {left: x1 - 7 + 'px', top: y1 - 7 + 'px', transform: 'scale(.8)'}], {duration: dur, easing: 'ease-in-out', fill: 'forwards'});
  s.remove();
}
function ring(x, y, col = '#ffc928', size = 90) {
  const r = el('div', '', '', stage); css(r, {position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', border: `5px solid ${col}`, zIndex: 86, pointerEvents: 'none'});
  anim(r, [{transform: 'scale(.2)', opacity: 1}, {transform: 'scale(1.3)', opacity: 0}], {duration: 520, easing: 'ease-out'}).then(() => r.remove());
}
function confetti(x, y, n = 18) {
  const cols = ['#ffc928', '#ff8ab8', '#8fd4ff', '#2ecb6e', '#b18cff', '#ff6b5e'];
  for (let i = 0; i < n; i++) {
    const c = el('div', '', '', stage); const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
    css(c, {position: 'absolute', left: x, top: y, width: 7, height: 12, background: cols[i % cols.length], border: '1.5px solid #2b2140', borderRadius: '2px', zIndex: 87, pointerEvents: 'none'});
    anim(c, [{transform: 'translate(0,0) rotate(0)', opacity: 1}, {transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 30}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 1, offset: .7}, {transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 30}px) rotate(720deg)`, opacity: 0}], {duration: 1000 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)'}).then(() => c.remove());
  }
}
function toast(text, ms = 1600) {
  const t = el('div', 'toast', text, stage);
  anim(t, [{transform: 'translate(-50%,10px)', opacity: 0}, {transform: 'translate(-50%,0)', opacity: 1, offset: .15}, {transform: 'translate(-50%,0)', opacity: 1, offset: .85}, {transform: 'translate(-50%,-8px)', opacity: 0}], {duration: ms, raw: true}).then(() => t.remove());
}
function coinFly(from, to, n = 1) {
  for (let i = 0; i < Math.min(n, 6); i++) {
    const c = el('span', 'coin', '', stage); css(c, {width: 20, height: 20, left: from[0] - 10, top: from[1] - 10, zIndex: 88});
    anim(c, [{transform: 'translate(0,0) scale(.6)'}, {transform: `translate(${(to[0] - from[0]) / 2}px,${(to[1] - from[1]) / 2 - 50}px) scale(1.2)`, offset: .5}, {transform: `translate(${to[0] - from[0]}px,${to[1] - from[1]}px) scale(.8)`}],
      {duration: 520, delay: i * 70, easing: 'ease-in-out', fill: 'forwards'}).then(() => c.remove());
  }
}

// ---------------------------------------------------------------- sound
const AU = window.LSAudio || {sfx() {}, music() {}, intensity() {}, get: () => ({music: 0, sfx: 0}), set() {}};
const sfx = (n, x) => AU.sfx(n, x);
stage.addEventListener('click', e => { if (e.target.closest('.btn, .coll, .tribebtn')) sfx('click'); }, true);
/** Speaker button with a popover holding the Music and Sound sliders. */
function soundButton(x, y, popLeft = true) {
  const icon = () => { const v = AU.get(); const on = v.music > 0 || v.sfx > 0;
    return ico('<path d="M4 9.5v5h3.5l5 4v-13l-5 4H4z" fill="#ffc928"></path>' + (on ? '<path d="M16 9q1.8 3 0 6"></path><path d="M18.6 6.8q3.6 5.2 0 10.4"></path>' : '<path d="M16.5 9.5l5 5M21.5 9.5l-5 5"></path>'), 22, 2.4); };
  const b = el('button', 'tribebtn', icon(), stage); css(b, {left: x, top: y, display: 'flex', padding: '5px'}); b.setAttribute('aria-label', 'Music and sound volume');
  const pop = el('div', 'tribepop sndpop', '', stage); pop.hidden = true;
  css(pop, popLeft ? {left: x + 46, top: y - 14} : {right: W - x + 6, top: y + 44});
  const row = (k, label) => { const v = AU.get()[k]; return `<label><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(v * 100)}" data-k="${k}" aria-label="${label} volume"></label>`; };
  pop.innerHTML = row('music', 'Music') + row('sfx', 'Sound');
  pop.querySelectorAll('input').forEach(inp => { inp.oninput = () => { AU.set({[inp.dataset.k]: inp.value / 100}); b.innerHTML = icon(); }; inp.onchange = () => { if (inp.dataset.k === 'sfx') sfx('coin'); }; });
  b.onclick = () => { pop.hidden = !pop.hidden; if (!pop.hidden) anim(pop, [{transform: 'scale(.8)', opacity: 0}, {transform: 'scale(1)', opacity: 1}], {duration: 160, raw: true}); };
  SND = {pop, b};
  return b;
}
let SND = null;
stage.addEventListener('pointerdown', e => { if (SND && SND.pop.isConnected && !SND.pop.hidden && !SND.pop.contains(e.target) && !SND.b.contains(e.target)) SND.pop.hidden = true; });
const tierLevel = () => G.me ? Math.min(1, (G.me.tier - 1) / 5 + (G.me.health + G.me.boundaries < 12 ? 0.2 : 0)) : 0;

// ---------------------------------------------------------------- game state
const G = {lobby: null, me: null, hand: [], feed: [], heroUsed: false, busy: false, mode: null, screen: null, firstTurn: true};

// ---------------------------------------------------------------- title
function clear() { stage.innerHTML = ''; applyLayout(false); screenEl.style.background = ''; }
// the colour around the game area on wide or notched screens, for scenes that are not the city
const edgeBg = c => { screenEl.style.background = c; };
function bg(dim) {
  // the city, plus mirrored copies of it on each side so the buildings continue to the screen edges on wide phones
  el('img', 'bg mir l', null, stage).src = ART.city; el('img', 'bg mir r', null, stage).src = ART.city;
  el('img', 'bg', null, stage).src = ART.city; if (dim) el('div', 'fade-bg', null, stage);
}
const ffLabel = () => `${ico('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6 7s-5-2-6.5-4.5L3 13.5a1.6 1.6 0 0 1 2.6-1.8L8 14" fill="#ffe08a"></path>', 22, 2.2)}Fat Finger Mode <span class="sw${PROF.fatFinger ? ' on' : ''}">${PROF.fatFinger ? 'On' : 'Off'}</span>`;
function toggleFatFinger() { PROF.fatFinger = !PROF.fatFinger; saveProfile(); sfx('pop'); }
function showTitle() {
  clear(); G.screen = 'title'; bg(true); AU.music('hold');
  soundButton(790, 12, false); changelogButton(740, 12); statsButton(690, 12);
  setTimeout(legendPopup, 500);
  SEASON_NEW = false;
  const t = el('div', 'ab', `<h1 class="bd" style="margin:8px 0 0;font-size:112px;line-height:.9;letter-spacing:-.02em;color:#fff;-webkit-text-stroke:5px #2b2140;paint-order:stroke fill;text-shadow:0 9px 0 #2b2140">Late <span style="color:#ff6b5e">Stage</span></h1>`, stage);
  css(t, {left: 0, right: 0, top: 74, textAlign: 'center'});
  anim(t.querySelector('h1'), [{transform: 'scale(.6) rotate(-6deg)', opacity: 0}, {transform: 'scale(1.06) rotate(1deg)', opacity: 1, offset: .7}, {transform: 'scale(1) rotate(0)'}], {duration: 700, easing: 'ease-out', raw: true});
  const rc = rankChip(PROF.rating, 15); stage.appendChild(rc); css(rc, {left: '50%', top: 204}); rc.style.transform = 'translateX(-50%)';
  const b = el('button', 'btn', ico('<path d="M7 4.5v15l12-7.5z" fill="#ffffff"></path>', 26, 2.6) + 'New run', stage);
  css(b, {left: 216, top: 256, width: 236, height: 62, background: '#2ecb6e', fontSize: '30px'});
  anim(b, [{transform: 'scale(.95)'}, {transform: 'scale(1.03)'}, {transform: 'scale(.95)'}], {duration: 1800, iterations: Infinity, raw: true});
  b.onclick = showHeroSelect;
  const cb = el('button', 'btn', ico('<rect x="3" y="5" width="8" height="14" rx="2" fill="#ffc928"></rect><rect x="13" y="5" width="8" height="14" rx="2" fill="#ff8ab8"></rect>', 22, 2.4) + 'Collection', stage);
  css(cb, {left: 474, top: 262, width: 172, height: 50, fontSize: '20px'}); cb.onclick = () => showPacks();
  if (freeTotal() || forkOpen().length) { const d = el('span', 'ab bd pk-badge', `${freeTotal() + forkOpen().length}`, cb); css(d, {right: -8, top: -10}); }
  if (PROF.unlocked.some(x => !PROF.seen.includes(x))) { const d = el('span', 'ab', '', cb); css(d, {right: -4, top: -6, width: 16, height: 16, borderRadius: '50%', background: '#ff6b5e', border: '2.5px solid #2b2140'}); }
  const t1 = makeToken({name: 'Main Character', tribe: 'Influencer', atk: 5, hp: 7, tier: 6}); stage.appendChild(t1); css(t1, {left: 672, top: 250}); t1.style.transform = 'rotate(8deg)';
  const t2 = makeToken({name: 'Trash Panda', tribe: 'Feral', atk: 2, hp: 1, tier: 1}); stage.appendChild(t2); css(t2, {left: 120, top: 254}); t2.style.transform = 'rotate(-9deg)';
  for (const [tk, d] of [[t1, 0], [t2, 300]]) anim(tk, [{translate: '0 0'}, {translate: '0 -8px'}, {translate: '0 0'}], {duration: 2200, delay: d, iterations: Infinity, easing: 'ease-in-out', raw: true});
  const n = el('p', 'ab', `v0.2 prototype · build ${(window.LS_BUILD || {}).n || 'dev'} · ${PROF.games} runs played`, stage); css(n, {left: 0, right: 0, bottom: 8, margin: 0, textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#5a5270'});
}

function rankChip(r, fs = 14) {
  const b = bracketOf(r);
  return el('div', 'rankchip', `<span class="rk" style="background:${b[2]}">${STAR(16)}</span><span style="font-size:${fs}px;padding-top:2px">${b[1]}</span><span style="font-size:${fs}px;padding-top:2px;color:#5a5270">${r.toLocaleString('en')}</span>`);
}
function collectionTabs(on) {
  const tabs = el('div', 'ab colltabs', '', stage); css(tabs, {left: 30, top: 12});
  for (const [k, label] of [['packs', `Packs${freeTotal() || forkOpen().length ? ` <span class="dot">${freeTotal() + forkOpen().length}</span>` : ''}`], ['levels', `Levels <span>${rtLevel()}/${RT_LEVELS}</span>`], ['rating', `Rating <span>${rmLevel()}/${RM_TRACK.length}</span>`], ['cards', `Cards <span>${CARDS_ALL().length}</span>`], ['heroes', `Heroes <span>${PROF.unlocked.length}/${HEROES.length}</span>`]]) {
    const b = el('button', 'logtab' + (k === on ? ' on' : ''), label, tabs);
    b.onclick = () => { if (k !== on) { sfx('pop'); k === 'cards' ? showCards() : k === 'levels' ? showTrack('xp') : k === 'rating' ? showNightLine() : k === 'packs' ? showPacks() : showCollection(); } };
  }
  const back = el('button', 'btn', 'Back', stage); css(back, {left: 734, top: 10, width: 90, height: 40, fontSize: '17px'}); back.onclick = showTitle;
}
const TRIBE_ORDER = ['Hustler', 'Influencer', 'Feral', 'Creative', 'Techie', 'Punk', 'Philosopher', 'Neutral'];
const CARDS_ALL = () => window.LS_CARDS.filter(c => !c.token && c.name !== 'Follower');
// ---- the Feed pool ("deck"): per tribe 2-3 cards per tier, plus 1 legendary (see deckToggle)
const LEGENDS = () => CARDS_ALL().filter(c => c.legendary);
function deckSet() {
  if (!PROF.deck) { PROF.deck = CARDS_ALL().filter(c => c.tribe !== 'Neutral' && E.inDeck(c, null)).map(c => c.name); PROF.flags.pool18 = false; }
  if (!PROF.flags.pool18) { PROF.flags.pool18 = true; fixPool(); saveProfile(); }   // once: Update 7 moved cards between tiers
  return new Set(PROF.deck.filter(n => CARD[n] && cardOpen(CARD[n])).concat(CARDS_ALL().filter(c => c.tribe === 'Neutral' && !c.legendary && cardOpen(c)).map(c => c.name)));
}
const tribesOf = c => [c.tribe, c.tribe2].filter(Boolean);
const inTribe = (c, t) => tribesOf(c).includes(t);
// ---- Feed pool rules: per tribe 2 to 3 cards per tier (so 18 at most), plus one legendary
const TIER_MIN = 2, TIER_MAX = 3, TRIBE_MAX = 18;   // TRIBE_MAX is only shown, the tiers already cap it
const tierCount = (d, t, tier) => CARDS_ALL().filter(x => !x.legendary && inTribe(x, t) && x.tier === tier && d.has(x.name)).length;
const tribeCount = (d, t) => CARDS_ALL().filter(x => !x.legendary && inTribe(x, t) && d.has(x.name)).length;
/** Brings every tribe back to 2-3 per tier: drops the extra cards of a full tier, fills a short one with cards you own. */
function fixPool() {
  const inPool = n => PROF.deck.includes(n), count = (t, k) => CARDS_ALL().filter(x => !x.legendary && inTribe(x, t) && x.tier === k && inPool(x.name) && cardOpen(x)).length;
  for (const t of TRIBE_ORDER) { if (t === 'Neutral') continue;
    for (let k = 1; k <= 6; k++) {
      const tier = CARDS_ALL().filter(x => !x.legendary && inTribe(x, t) && x.tier === k);
      for (const x of tier.filter(x => inPool(x.name)).reverse()) if (count(t, k) > TIER_MAX) PROF.deck = PROF.deck.filter(n => n !== x.name);
      for (const x of tier.filter(x => !inPool(x.name) && cardOpen(x)))
        if (count(t, k) < TIER_MIN && tribesOf(x).every(u => u === 'Neutral' || count(u, k) < TIER_MAX)) PROF.deck.push(x.name);
    }
  }
}
function deckToggle(c) {
  const d = deckSet(), on = d.has(c.name);
  if (on) {
    if (!c.legendary) for (const t of tribesOf(c)) if (t !== 'Neutral' && tierCount(d, t, c.tier) <= tierMin(t, c.tier)) return 'min';
    PROF.deck = PROF.deck.filter(n => n !== c.name);
  } else {
    if (!cardOpen(c)) return 'locked';
    for (const t of tribesOf(c)) {
      if (c.legendary) { if (CARDS_ALL().some(x => x.legendary && inTribe(x, t) && d.has(x.name))) return 'legend'; continue; }
      if (t === 'Neutral') continue;
      if (tierCount(d, t, c.tier) >= TIER_MAX) return 'full';
    }
    PROF.deck.push(c.name);
  }
  saveProfile(); return 'ok';
}
const locked0 = c => !cardOpen(c);
const LOCK = ico('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#ffc928"></rect><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"></path>', 26);
const TOGGLE_MSG = {min: c => `Keep at least ${tierMin(tribesOf(c).find(t => t !== 'Neutral'), c.tier)} in this tier`, full: `${TIER_MAX} per tier at most`, legend: 'One legendary per tribe'};
// the minimum drops when a tier has fewer cards you could get yet (e.g. only one in the sets you can open)
const tierMin = (t, tier) => Math.min(TIER_MIN, CARDS_ALL().filter(x => !x.legendary && inTribe(x, t) && x.tier === tier && (cardOpen(x) || setOpen(x.set))).length);
const tierState = (n, min = TIER_MIN) => n < min ? 'low' : n > TIER_MAX ? 'over' : 'ok';
const tierOk = (d, t, k) => tierState(tierCount(d, t, k), tierMin(t, k)) === 'ok';
const tribeOk = (d, t) => t === 'Neutral' || [1, 2, 3, 4, 5, 6].every(k => tierOk(d, t, k));
const WARN_ICO = ico('<path d="M12 3L22 20H2z" fill="#ff6b5e"></path><path d="M12 9.5v4.5" stroke="#fff"></path><circle cx="12" cy="17" r=".6" fill="#fff" stroke="#fff"></circle>', 16, 2.4);
const OK_ICO = ico('<circle cx="12" cy="12" r="10" fill="#2ecb6e"></circle><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff"></path>', 16, 2.4);
/** The pool meter of a book page: three slots, two you must fill and one you may, in red when off. */
function poolMeter(n, legend, min = legend ? 0 : TIER_MIN) {
  const max = legend ? 1 : TIER_MAX, st = legend ? (n > 1 ? 'over' : 'ok') : tierState(n, min);
  let pips = '';
  for (let i = 0; i < Math.max(max, n); i++) pips += `<i class="${i < n ? (i >= max ? 'x' : 'f') : i < min ? 'need' : 'opt'}"></i>`;
  return `<span class="bk-meter ${st}">${st === 'ok' ? OK_ICO : WARN_ICO}<b class="bd">${n}/${max}</b><span class="bk-pips">${pips}</span></span>`;
}
/** Collection › Cards: a card book per tribe on a shelf; each tier fills a whole spread, the legendaries have the last one.
 *  Tap a card you own to put it in or take it out of your Feed pool; the ⓘ shows it big. Cards from packs you can
 *  open but don't own are greyed out and can be crafted; cards from packs you can't open yet stay a "?". */
function showCards(tribe = 'Hustler', o = {}) {
  clear(); G.screen = 'cards'; AU.music('hold'); edgeBg('#6b4a33');
  const room = el('div', 'ab bk-room', '', stage); css(room, {left: -600, top: -400, width: W + 1200, height: H + 800});   // bleeds past the game area to the screen edges
  collectionTabs('cards');
  const clout = el('span', 'ab wal bk-clout', '', stage); css(clout, {left: 586, top: 15});
  const shelf = el('div', 'ab bk-shelf', '', stage); css(shelf, {left: 14, top: 64, width: 106, height: 318});
  const book = el('div', 'ab bk-book', '', stage); css(book, {left: 130, top: 70, width: 700, height: 312});
  const SPREADS = [1, 2, 3, 4, 5, 6, 'L'];   // one tier per spread, the legendaries last
  let cur = tribe, spread = Math.max(0, SPREADS.indexOf(o.tier || 1)), mark = o.mark || null;
  const renderShelf = () => {
    shelf.innerHTML = ''; const d = deckSet();
    for (const t of TRIBE_ORDER) {
      const n = t === 'Neutral' ? null : tribeCount(d, t), sp = el('button', 'bk-spine' + (t === cur ? ' on' : ''), `<b class="bd">${t === 'Neutral' ? 'Neighbours' : TP[t]}</b>${n != null ? `<i>${n}/${TRIBE_MAX}${tribeOk(d, t) ? '' : `<span class="bk-warn">${WARN_ICO}</span>`}</i>` : '<i>always in</i>'}`, shelf);
      sp.style.setProperty('--tc', TC[t]);
      sp.onclick = () => { if (t === cur) return; sfx('pickup'); cur = t; spread = 0; mark = null; renderShelf(); renderBook(true); };
    }
  };
  const cardEl = (c, page, d) => {
    const neutral = cur === 'Neutral' && !c.legendary, own = cardOpen(c), on = own && (neutral || d.has(c.name));
    const craft = !own && setOpen(c.set), hidden = !own && !craft;
    const w = el('div', 'bk-card' + (on ? ' on' : own ? ' off' : craft ? ' craft' : ' lock') + (c.name === mark ? ' mark' : ''), hidden ? mysteryCardHTML(c, `${SET[c.set].name} packs · level ${SET[c.set].lv}`) : cardHTML(c), page);
    if (on) el('span', 'bk-tick', ico('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', 18, 3.6), w);
    if (neutral && own) el('span', 'bk-always bd', 'Always in', w);
    else if (on) el('span', 'bk-always bk-in bd', 'In pool', w);
    if (hidden) { el('span', 'bk-lock', LOCK, w); w.onclick = () => { sfx('pop'); toast(`In ${SET[c.set].name} packs, from level ${SET[c.set].lv}`); }; return w; }
    if (craft) {
      const cost = craftCost(c), afford = (PROF.clout || 0) >= cost;
      el('span', 'bk-craft bd' + (afford ? ' ok' : ''), `${CLOUT_ICO(13)} ${cost}`, w);
      w.onclick = () => showDetail(c, null, [{label: `Craft ${CLOUT_ICO(18)} ${cost}`, color: '#b18cff', disabled: !afford, fn: () => {
        PROF.clout -= cost; gainCardOwned(c); saveProfile(); sfx('triple'); mark = c.name;
        toast(`${c.name} crafted${deckSet().has(c.name) ? ' and put in your pool' : ''}`); renderShelf(); renderBook(false);
        const nw = book.querySelector('.bk-card.mark'); if (nw) { const r = rectOf(nw); confetti(r.x + r.w / 2, r.y + r.h / 2, 30); }
      }}]);
      return w;
    }
    const info = el('button', 'bk-info bd', 'i', w);
    info.onclick = e => { e.stopPropagation(); showDetail(c, null, neutral ? [] : [{label: on ? 'Take out of the pool' : 'Put in the pool', color: on ? '#ffc928' : '#2ecb6e', fn: () => toggle(c)}]); };
    if (!neutral) w.onclick = () => toggle(c);
    else w.onclick = () => showDetail(c, null);
    return w;
  };
  const toggle = c => {
    const was = deckSet().has(c.name), r = deckToggle(c);
    if (r !== 'ok') { sfx('error'); const m = TOGGLE_MSG[r]; toast(typeof m === 'function' ? m(c) : m || 'Not possible'); const ct = book.querySelector('.bk-meter'); if (ct) anim(ct, [{transform: 'scale(1)'}, {transform: 'scale(1.3)', background: '#ffe9e6'}, {transform: 'scale(1)'}], {duration: 420, raw: true}); return; }
    sfx(was ? 'pop' : 'buy'); mark = c.name; renderShelf(); renderBook(false);
  };
  // one tier per spread: the cards are split over both pages, the left header carries the pool meter
  const spreadEls = (key, d) => {
    const cs = CARDS_ALL().filter(c => inTribe(c, cur) && (key === 'L' ? c.legendary : !c.legendary && c.tier === key)).sort((a, b) => (cardOpen(b) - cardOpen(a)) || a.name.localeCompare(b.name));
    const neutral = cur === 'Neutral' && key !== 'L', legend = key === 'L';
    const n = legend ? cs.filter(c => d.has(c.name)).length : neutral ? cs.filter(c => cardOpen(c)).length : tierCount(d, cur, key);
    const min = legend || neutral ? 0 : tierMin(cur, key), st = neutral ? 'ok' : legend ? (n > 1 ? 'over' : 'ok') : tierState(n, min);
    const per = Math.ceil(cs.length / 2);   // the tier is split over both pages, small cards in up to two rows per page
    const L = el('div', 'bk-page l', '', null), R = el('div', 'bk-page r', '', null);
    L.innerHTML = `<div class="bk-ph"><span class="bk-tier">${legend ? '<span class="bd leg">Legendaries</span>' : `${fmtStars(key, 15)}<b class="bd">Tier ${key}</b>`}</span>${neutral ? `<span class="bk-count bd">${n} owned</span>` : poolMeter(n, legend, legend ? 0 : min)}</div>`;
    const hint = neutral ? 'Neighbours are always in your pool' : legend ? (n ? 'Your legendary is in' : 'Optional: one at most') :
      st === 'low' ? `Pick ${min - n} more` : st === 'over' ? `${n - TIER_MAX} too many` : `Pick ${min} to ${TIER_MAX}`;
    R.innerHTML = `<div class="bk-ph r"><span class="bk-hint bd ${st}">${st === 'ok' ? '' : WARN_ICO}${hint}</span></div>`;
    [[L, cs.slice(0, per)], [R, cs.slice(per)]].forEach(([pg, part]) => {
      const grid = el('div', 'bk-grid sm', '', pg);   // two pockets per row, filled from the top like a binder page
      for (const c of part) cardEl(c, grid, d);
    });
    if (!cs.length) el('p', 'bk-empty', 'No cards here', L.querySelector('.bk-grid'));
    return [L, R];
  };
  const renderBook = (fresh, dir = 0) => {
    const d = deckSet();
    book.style.setProperty('--tc', TC[cur]);
    book.innerHTML = `<div class="bk-cover"></div><div class="bk-gutter"></div>`;
    const tabs = el('div', 'bk-tabs', '', book);
    SPREADS.forEach((k, i) => {
      const bad = cur !== 'Neutral' && k !== 'L' && !tierOk(d, cur, k);
      const tb = el('button', 'bk-tab bd' + (i === spread ? ' on' : '') + (bad ? ' bad' : ''), k === 'L' ? '✦' : `${k}★`, tabs);
      if (bad) el('span', 'bk-tabwarn', '!', tb);
      tb.onclick = () => { if (i === spread) return; const dd = i > spread ? 1 : -1; spread = i; sfx('scroll'); renderBook(false, dd); };
    });
    const [L, R] = spreadEls(SPREADS[spread], d); book.appendChild(L); book.appendChild(R);
    el('div', 'bk-title bd', `${cur === 'Neutral' ? 'Neighbours' : TP[cur]}`, book);
    const arrows = [[-1, 'prev', '‹'], [1, 'next', '›']];
    for (const [dd, cls, t] of arrows) { const ar = el('button', `bk-arrow ${cls} bd`, t, book); ar.disabled = spread + dd < 0 || spread + dd >= SPREADS.length; ar.onclick = () => { spread += dd; sfx('scroll'); renderBook(false, dd); }; }
    clout.innerHTML = `${CLOUT_ICO()}<b>${(PROF.clout || 0).toLocaleString('en')}</b><i>Clout</i>`;
    if (fresh) anim(book, [{transform: 'translateX(-40px) rotate(-2deg)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 360, easing: 'cubic-bezier(.3,1.3,.5,1)', raw: true});
    else if (dir) {   // a page turns
      const turn = dir > 0 ? R : L;
      anim(turn, [{transform: `rotateY(${dir > 0 ? 75 : -75}deg)`, opacity: .3}, {transform: 'rotateY(0)', opacity: 1}], {duration: 380, easing: 'cubic-bezier(.3,1.2,.5,1)', raw: true});
      anim(dir > 0 ? L : R, [{opacity: .4}, {opacity: 1}], {duration: 300, raw: true});
    }
    const mk = book.querySelector('.bk-card.mark'); if (mk && fresh !== false) setTimeout(() => mk.scrollIntoView({block: 'nearest'}), 50);
  };
  renderShelf(); renderBook(true);
}
// New legendary cards: one pop-up per newly unlocked batch, with a three-step tutorial the first time.
function legendPopup() {
  return;   // legendaries come from packs now (v17)
  const seen = PROF.legSeen || [], fresh = LEGENDS().filter(c => legendOpen(c) && !seen.includes(c.name)); if (!fresh.length) return;
  PROF.legSeen = seen.concat(fresh.map(c => c.name)); const first = !PROF.flags.legendTut; PROF.flags.legendTut = true; saveProfile();
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 99}); el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.85)';
  const head = el('p', 'ab bd', 'New legendary cards!', ov); css(head, {left: 0, right: 0, top: 14, margin: 0, textAlign: 'center', fontSize: '34px', color: '#ffc928', webkitTextStroke: '2px #2b2140'});
  const fan = el('div', 'ab legfan', '', ov); css(fan, {left: 0, right: 0, top: 66, height: 180});
  const show5 = fresh.slice(0, 5); show5.forEach((c, i) => { const w = el('div', 'logcard', cardHTML(c), fan); w.style.transform = `rotate(${(i - (show5.length - 1) / 2) * 7}deg) translateY(${Math.abs(i - (show5.length - 1) / 2) * 8}px)`; anim(w, [{opacity: 0, transform: 'translateY(60px) scale(.6)'}, {opacity: 1}], {duration: 380, delay: 90 * i, fill: 'backwards', raw: true}); });
  const tut = el('div', 'ab legtut', first ? `<div><span>1</span>${ico('<rect x="3" y="5" width="8" height="14" rx="2" fill="#ffc928"></rect><rect x="13" y="5" width="8" height="14" rx="2" fill="#ff8ab8"></rect>', 20)} Collection › Cards</div>
    <div><span>2</span><i class="slotsdemo"><i class="on"></i><i class="on"></i><i class="on"></i></i> 3 per tier</div><div><span>3</span><span class="gem on"></span> 1 per tribe</div>` : `<div>${fresh.length} new card${fresh.length > 1 ? 's' : ''} for your pool</div>`, ov);
  css(tut, {left: 0, right: 0, top: 268});
  const go = el('button', 'btn', 'Open Cards', ov); css(go, {left: 262, top: 318, width: 180, height: 50, background: '#ffc928', fontSize: '20px'});
  const later = el('button', 'btn', 'Later', ov); css(later, {left: 460, top: 322, width: 120, height: 42, fontSize: '17px'});
  go.onclick = () => { ov.remove(); showCards(fresh[0].tribe); }; later.onclick = () => ov.remove();
  sfx('triple');
}
function showCollection() {
  clear(); G.screen = 'collection'; bg(true); AU.music('hold');
  PROF.seen = PROF.unlocked.slice(); saveProfile();
  collectionTabs('heroes');
  const rc = rankChip(PROF.rating, 13); stage.appendChild(rc); css(rc, {right: 130, top: 14});
  const order = HEROES.map(h => h.slug).sort((a, b) => isUnlocked(b) - isUnlocked(a));
  const wrap = el('div', 'ab heroscroll', '', stage); css(wrap, {left: 0, top: 56, width: W, height: H - 56});   // three rows: scrolls
  el('div', 'ab', '', wrap).style.cssText = `position:absolute;left:0;top:0;width:1px;height:${10 + Math.ceil(order.length / 6) * 160 + 8}px`;
  order.forEach((slug, i) => {
    const h = HERO[slug], lock = !isUnlocked(slug), [c, g] = progressOf(slug);
    const x = 34 + (i % 6) * 130, y = 10 + Math.floor(i / 6) * 160;
    const b = el('button', 'coll', `<div style="position:absolute;inset:0;background:#fff;border:3px solid #2b2140;border-radius:20px;box-shadow:0 0 0 3px #fff,3px 5px 0 3px #2b2140"></div>
      <div style="position:absolute;left:8px;right:8px;top:8px;height:74px;border:2.5px solid #2b2140;border-radius:46px 46px 10px 10px;background:${lock ? '#c9c2d6' : h.col};overflow:visible"><img src="${ART[slug]}" alt="" style="position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);width:92px;height:92px;${lock ? 'filter:grayscale(1) brightness(.7)' : ''}"></div>
      <p class="bd" style="position:absolute;left:4px;right:4px;top:88px;margin:0;text-align:center;font-size:13.5px;line-height:1.05">${h.name.replace('The ', '')}</p>
      ${lock ? `<div class="prog" style="position:absolute;left:12px;right:12px;top:120px"><i style="width:${Math.round(100 * c / g)}%;${c ? '' : 'border:0'}"></i></div><p class="bd" style="position:absolute;left:0;right:0;top:134px;margin:0;text-align:center;font-size:10.5px;color:#5a5270">${g > 1 ? `${c} / ${g}` : 'LOCKED'}</p>
        <span style="position:absolute;right:6px;top:4px">${ico('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#ffc928"></rect><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"></path>', 22)}</span>`
        : `<p style="position:absolute;left:4px;right:4px;top:108px;margin:0;text-align:center;font-size:11px;font-weight:800;color:#5a5270;line-height:1.15">${h.power}</p>`}`, wrap);
    css(b, {left: x, top: y, width: 118, height: 150}); b.setAttribute('aria-label', h.name + (lock ? ' (locked)' : '') + (slug === avatarHero().slug ? ', your avatar' : ''));
    if (!lock && slug === avatarHero().slug && PROF.avatar) el('span', 'avbadge bd', 'You', b);
    anim(b, [{transform: 'translateY(30px) scale(.8)', opacity: 0}, {transform: 'translateY(0) scale(1)', opacity: 1}], {duration: 360, delay: 30 * i, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards', raw: true});
    b.onclick = () => showHeroCard(slug);
  });
}
function showHeroCard(slug) {
  const h = HERO[slug], lock = !isUnlocked(slug), [c, g] = progressOf(slug);
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 95}); el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.82)';
  const card = el('div', 'ab', heroHTML(h, lock), ov); css(card, {left: 150, top: 0}); card.style.transform = 'scale(.92)'; card.style.transformOrigin = 'top left';
  const txt = el('div', 'detail-txt', `<p class="rules" style="font-size:20px"><b>${h.name}</b></p><p class="kwl">Health 30 · Boundaries ${h.boundaries}</p><p class="kwl">Good for: ${h.push}.</p>` +
    (lock ? `<p class="kwl" style="margin-top:14px;color:#ffc928">To unlock: ${h.unlock}.</p><div class="prog" style="width:240px;margin-top:8px"><i style="width:${Math.round(100 * c / g)}%;${c ? '' : 'border:0'}"></i></div><p class="kwl">${g > 1 ? `${c} of ${g}` : 'Not yet'}</p>` : '<p class="kwl" style="margin-top:14px;color:#2ecb6e">Unlocked. Can appear when you pick a hero.</p>'), ov);
  css(txt, {left: 420, top: 70, width: 380});
  anim(card, [{transform: 'scale(.4) rotate(-8deg)', opacity: 0}, {transform: 'scale(.92)', opacity: 1}], {duration: 300, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  ov.onpointerup = () => ov.remove();
  if (!lock) {   // pick this hero as your avatar
    const mine = PROF.avatar === slug, av = el('button', 'btn avbtn', mine ? `${ico('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', 18, 3.4)} Your avatar` : 'Use as avatar', ov);
    css(av, {left: 420, top: 300, width: 200, height: 46, fontSize: '18px', background: mine ? '#fff' : '#ffc928'});
    av.onpointerup = e => e.stopPropagation();
    av.onclick = () => { if (mine) return; PROF.avatar = slug; saveProfile(); sfx('buy'); toast(`${h.name} is your avatar`); ov.remove(); showCollection(); };
  }
}

// ---------------------------------------------------------------- hero select
function showHeroSelect() {
  clear(); G.screen = 'heroes'; bg(false); G.rated = false; G.xpGain = 0; G.cashGain = 0; G.talentAsked = false; AU.music('hold');
  const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  G.seed = seed;
  const rng = E.RNG(seed);
  const pick = rng.shuffle(PROF.unlocked.slice()).slice(0, 3);
  const tribes = rng.shuffle(E.TRIBES.slice()).slice(0, 5);
  G.tribes = tribes;
  const t = el('div', 'ab bd', 'Pick your hero', stage); css(t, {left: 30, top: 12, fontSize: '22px', background: '#fff', border: '3px solid #2b2140', borderRadius: '999px', padding: '6px 16px 2px', boxShadow: '0 0 0 3px #fff'});
  let chosen = null;
  const start = el('button', 'btn', 'Start', stage); css(start, {left: 722, top: 300, width: 106, height: 54, background: '#2ecb6e', fontSize: '20px'}); start.disabled = true;
  pick.forEach((slug, i) => {
    const b = el('button', 'ab', `<div style="transform:scale(.78);transform-origin:top left">${heroHTML(HERO[slug])}</div>`, stage);
    css(b, {left: 30 + i * 232, top: 58, width: 203, height: 303, padding: 0, border: 0, background: 'none', cursor: 'pointer'});
    anim(b, [{transform: 'translateY(60px) rotate(8deg) scale(.8)', opacity: 0}, {transform: 'translateY(0) rotate(0) scale(1)', opacity: 1}], {duration: 520, delay: 90 * i, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards', raw: true});
    b.onclick = () => {
      chosen = slug; start.disabled = false;
      stage.querySelectorAll('.hero').forEach(h => h.style.boxShadow = '');
      b.querySelector('.hero').style.boxShadow = '0 0 0 6px #ffc928, 0 0 0 9px #2b2140, 8px 12px 0 9px #2b2140';
      anim(b, [{transform: 'translateY(0)'}, {transform: 'translateY(-12px)'}, {transform: 'translateY(-6px)'}], {duration: 260, fill: 'forwards', easing: 'ease-out', raw: true});
      stage.querySelectorAll('button.ab').forEach(o => { if (o !== b) anim(o, [{transform: 'translateY(0)'}], {duration: 200, fill: 'forwards', raw: true}); });
    };
  });
  const box = el('div', 'ab', `<p class="bd" style="margin:0 0 5px;font-size:10px;letter-spacing:.12em;color:#5a5270;line-height:1.2">TRIBES IN THIS LOBBY</p>` +
    tribes.map(t => `<div class="bd" style="display:flex;align-items:center;gap:5px;font-size:12px;line-height:1.6"><i style="flex:none;width:10px;height:10px;border-radius:3px;border:2px solid #2b2140;background:${TC[t]};display:block"></i>${TP[t]}</div>`).join(''), stage);
  css(box, {left: 716, top: 58, width: 116, background: '#fff', border: '2.5px solid #2b2140', borderRadius: '16px', padding: '8px 9px 9px', boxShadow: '0 0 0 3px #fff'});
  start.onclick = () => { if (chosen) startRun(chosen); };
}

// ---------------------------------------------------------------- run
function startRun(slug) {
  const h = HERO[slug];
  G.lobby = new window.LSLobby(G.seed, {human: true, heroSlug: slug, boundaries: h.boundaries + bonus('shield'), tribes: G.tribes, rating: PROF.rating, deck: deckSet()});
  G.me = G.lobby.human; G.me.rating = PROF.rating; G.hand = []; G.feed = []; G.heroSlug = slug; G.firstTurn = true; G.streak = 0; G.minHealth = 99; G.saved = false; NEW_UNLOCKS = [];
  G.me.board = [];
  RUN.start();
  newTurn();
}
function drawFeed(keep) {
  const me = G.me;
  if (keep && G.feed.length) { /* saved Feed stays */ } else G.feed = me.drawFeed().map(c => ({card: c, a: me.feedBonus(c).a, h: me.feedBonus(c).h, key: Math.random()}));
  me.getFeed = () => G.feed;
}
function newTurn() {
  const me = G.me, L = G.lobby;
  me.beginTurn(); me.log = me.log.filter(e => e.type === 'likes'); RUN.turn();
  G.heroUsed = false;
  const kept = G.saved && G.feed.length;
  drawFeed(G.saved); G.saved = false;
  L.planPairs();
  buildShop();
  animateTurnStart(kept).then(async () => { if (me.log.length) await playLog(); if (me.pending.length) await handlePending(); });
}

// ---------------------------------------------------------------- shop layout
// Layouts for the shop and fights: normal, or Fat Finger Mode (cards 88 instead of 68, Feed and board nearly edge to edge,
// the left column moved beside the hand). Only sizes and positions change; taps and drags work the same.
const LAYOUTS = {
  normal: {ff: false, tok: 68, x0: 114, w: 616, feedY: 74, boardY: 180, handY: 266, fgap: 28, bgap: 20, feedTop: 58, boardTop: 166, rowH: 96,
    arc: 3, sellMaxY: 140, boardMinY: {feed: 172, other: 158}, boardMaxY: 270, handTop: 268, hand: {cx: 465, spread: 470, w: 84, max: 92},
    cTop: [72, 200], cY: [86, 214], cx0: 114, cw: 616},
  // Fat Finger Mode: four bands, no overlaps. Lobby strip 4-38 (plus Tribes and Menu), Feed 42-146, board 152-256, hand 262-390.
  // Hero, Promote and Hero Power sit left of the hand; Gold, Scroll, Save and Ready on the right rail (x >= 750).
  ff: {ff: true, tok: 88, x0: 8, w: 728, feedY: 50, boardY: 160, handY: 262, arc: 1, fgap: 28, bgap: 20, feedTop: 42, boardTop: 152, rowH: 104,
    sellMaxY: 146, boardMinY: {feed: 160, other: 148}, boardMaxY: 258, handTop: 260, hand: {cx: 489, avail: 454, w: 96, max: 100},
    cTop: [86, 214], cY: [94, 222], cx0: 100, cw: 736},
};
let LY = LAYOUTS.normal;
/** on = this screen uses the card layout (shop, fights); Fat Finger Mode applies only there. */
function applyLayout(on) {
  LY = on && PROF.fatFinger ? LAYOUTS.ff : LAYOUTS.normal;
  if (LY.ff) {   // rows use the full width the phone offers, including the space the side columns moved into
    const w = LAYOUTS.ff.w + EXT.l + EXT.r;
    LY = Object.assign({}, LY, {x0: LAYOUTS.ff.x0 - EXT.l, w, bgap: Math.min(40, (w - 7 * 88) / 6), fgap: Math.min(48, (w - 6 * 88 - 60) / 5),
      cx0: LAYOUTS.ff.cx0 - EXT.l, cw: LAYOUTS.ff.cw + EXT.l + EXT.r, hand: Object.assign({}, LY.hand, {cx: LY.hand.cx + EXT.r / 2, avail: LY.hand.avail + EXT.r})});
  }
  stage.classList.toggle('ff', LY.ff); stage.classList.toggle('themed', !!on);   // battle backgrounds only in the shop and fights
}
const HALF = () => LY.tok / 2;
function rowX(i, n, gap) { return LY.x0 + (LY.w - (n * LY.tok + (n - 1) * gap)) / 2 + i * (LY.tok + gap); }
function feedX(i, n) {   // the Trend Chaser's Feed can hold 7: squeeze the gaps, keep clear of the price coin
  if (n <= 6) return rowX(i, n, LY.fgap);
  const gap = Math.min(LY.fgap, (LY.w - 34 - n * LY.tok) / (n - 1)); return rowX(i, n, gap) + 17;
}
function boardX(i, n) { return rowX(i, n, LY.bgap); }
function handPos(i, n) { const h = LY.hand, sp = Math.min(h.max, h.avail ? (h.avail - h.w) / Math.max(1, n - 1) : h.spread / Math.max(1, n)); const x0 = h.cx - ((n - 1) * sp) / 2 - h.w / 2; return {x: x0 + i * sp, y: LY.handY + Math.abs(i - (n - 1) / 2) * LY.arc, r: (i - (n - 1) / 2) * 3}; }
let S = {};   // shop dom refs
function buildShop() {
  clear(); G.screen = 'shop'; bg(false); AU.music('office'); AU.intensity(tierLevel());
  S = {tok: new Map(), feedTok: new Map(), handEl: new Map()}; applyLayout(true); const ff = LY.ff;
  if (ff) css(el('div', 'ffpaper', '', stage), {left: -EXT.l, top: 38, width: W + EXT.l + EXT.r, height: 420});
  S.lobby = el('div', 'ab', '', stage); css(S.lobby, ff ? {left: 8, top: 4, display: 'flex', gap: '5px', transform: 'scale(.82)', transformOrigin: 'left top'} : {left: 114, top: 8, display: 'flex', gap: '5px'});
  S.feedSurf = el('div', 'surf shelf', `<div class="ledge"></div><span class="coin price-coin" style="left:${ff ? 4 : 2}px;top:${ff ? 39 : 66}px;width:26px;height:26px;font-size:14px">3</span>`, stage); css(S.feedSurf, {left: LY.x0, top: LY.feedTop, width: LY.w, height: LY.rowH, borderRadius: '22px'});
  S.boardSurf = el('div', 'surf desk', '', stage); css(S.boardSurf, {left: LY.x0, top: LY.boardTop, width: LY.w, height: LY.rowH, borderRadius: '24px'});
  S.slots = el('div', 'ab', '', S.boardSurf); css(S.slots, {left: 0, top: 0, width: LY.w - 6, height: LY.rowH - 6, pointerEvents: 'none'});
  for (let i = 0; i < 7; i++) { const sl = el('div', 'slot', '', S.slots); css(sl, {left: (LY.w - (7 * LY.tok + 6 * LY.bgap)) / 2 + i * (LY.tok + LY.bgap) - 3, top: (LY.rowH - LY.tok - 6) / 2 - 1}); }
  S.sellZone = el('div', 'ab bd', '', stage); css(S.sellZone, {left: LY.x0, top: LY.feedTop, width: LY.w, height: LY.rowH, borderRadius: '22px', border: '3px dashed #2b2140', background: 'rgba(255,201,40,.92)', display: 'none', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '26px', zIndex: 5});
  S.handZone = el('div', 'ab', '', stage); css(S.handZone, ff ? {left: 262, top: 260, width: 454 + EXT.r, height: 130} : {left: 200, top: 268, width: 530, height: 122});
  // left column
  S.shield = el('button', 'sb', '', stage); css(S.shield, {left: 10, top: 10, width: 92, height: 112}); if (ff) css(S.shield, {left: 100, top: 266, transform: 'scale(.76)', transformOrigin: 'left top'}); S.shield.onclick = levelUp;
  S.tribes = el('button', 'tribebtn', G.lobby.tribes.map(t => `<i style="background:${TC[t]}"></i>`).join(''), stage);
  css(S.tribes, ff ? {left: 630, top: 3, transform: 'scale(.86)', transformOrigin: 'left top'} : {left: 30, top: 140}); S.tribes.setAttribute('aria-label', 'Tribes in this lobby');
  S.tribePop = el('div', 'tribepop', G.lobby.tribes.map(t => `<div><i style="background:${TC[t]}"></i>${TP[t]}</div>`).join(''), stage);
  css(S.tribePop, ff ? {left: 560, top: 44} : {left: 74, top: 128}); S.tribePop.hidden = true;
  const showT = v => { S.tribePop.hidden = !v; if (v) anim(S.tribePop, [{transform: 'scale(.8)', opacity: 0}, {transform: 'scale(1)', opacity: 1}], {duration: 160, raw: true}); };
  S.tribes.onpointerenter = () => showT(true); S.tribes.onpointerleave = () => showT(false);
  S.tribes.onclick = () => { showT(S.tribePop.hidden); clearTimeout(S.tribeT); S.tribeT = setTimeout(() => showT(false), 2500); };
  S.likes = el('button', 'likes', '', stage); css(S.likes, ff ? {left: 8, top: 262} : {left: 212, top: 318}); S.likes.onclick = useLikes; S.likes.hidden = true;
  S.heroAv = el('div', 'av-big', `<img src="${ART[G.heroSlug]}" alt="">`, stage); css(S.heroAv, ff ? {left: 8, top: 298, width: 88, height: 88} : {left: 16, top: 290, width: 88, height: 88});
  S.heroAv.onclick = () => showHeroDetail();
  S.hp = el('div', 'badge', '', stage); css(S.hp, ff ? {left: 62, top: 352, width: 42, height: 34, fontSize: '20px'} : {left: 72, top: 346, width: 42, height: 34, fontSize: '20px'});
  S.arm = el('div', 'badge arm', '', stage); css(S.arm, ff ? {left: 66, top: 320, width: 32, height: 30, fontSize: '15px'} : {left: 76, top: 314, width: 32, height: 30, fontSize: '15px'});
  S.power = el('button', 'sb', '', stage); css(S.power, ff ? {left: 178, top: 302, width: 70, height: 76} : {left: 134, top: 286, width: 70, height: 76}); S.power.onclick = usePower;
  // right column
  S.gold = el('div', 'info', '', stage); css(S.gold, {left: ff ? 754 : 746, top: ff ? 6 : 10, width: 84, height: 40, borderRadius: '999px', gap: '6px', fontSize: '21px'});
  S.bonus = el('div', 'ab bd', '', stage); css(S.bonus, {left: ff ? 758 : 752, top: ff ? 46 : 50, background: '#ffc928', border: '2.5px solid #2b2140', borderRadius: '0 0 10px 10px', padding: '3px 7px 1px', fontSize: '11px', lineHeight: 1.3, display: 'none'});
  S.scroll = el('button', 'sb', `<svg width="68" height="72" viewBox="0 0 68 72" aria-hidden="true"><circle cx="34" cy="38" r="28" fill="#fff" stroke="#fff" stroke-width="9"></circle><circle cx="34" cy="33" r="28" fill="#fff" stroke="#fff" stroke-width="9"></circle><circle cx="34" cy="38" r="28" fill="#2b2140" stroke="#2b2140" stroke-width="3"></circle><g class="face"><circle cx="34" cy="33" r="28" fill="#8fd4ff" stroke="#2b2140" stroke-width="3"></circle><g class="spin" transform="translate(18 17) scale(1.34)" fill="none" stroke="#2b2140" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 10A8 8 0 0 0 5.4 6.6"></path><path d="M5 2.8v4.4h4.4"></path><path d="M4.5 14a8 8 0 0 0 14.1 3.4"></path><path d="M19 21.2v-4.4h-4.4"></path></g></g></svg><span class="coin" style="left:46px;top:46px;width:24px;height:24px;font-size:13px">1</span>`, stage);
  css(S.scroll, {left: ff ? 763 : 754, top: ff ? 54 : 78, width: 68, height: 72}); S.scroll.setAttribute('aria-label', 'Scroll the Feed, 1 gold'); S.scroll.onclick = scroll;
  S.save = el('button', 'sb', '', stage); css(S.save, {left: ff ? 768 : 759, top: ff ? 130 : 158, width: 58, height: 74}); S.save.onclick = toggleSave;
  S.ready = el('button', 'sb', `<svg width="88" height="110" viewBox="0 0 88 110" aria-hidden="true"><rect x="6" y="12" width="76" height="90" rx="38" fill="#fff" stroke="#fff" stroke-width="9"></rect><rect x="6" y="6" width="76" height="90" rx="38" fill="#fff" stroke="#fff" stroke-width="9"></rect><rect x="6" y="12" width="76" height="90" rx="38" fill="#2b2140" stroke="#2b2140" stroke-width="3"></rect><g class="face"><rect x="6" y="6" width="76" height="90" rx="38" fill="#2ecb6e" stroke="#2b2140" stroke-width="3"></rect><path d="M22 30Q26 18 40 15" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"></path></g></svg><span class="ab" style="left:0;right:0;top:45px;text-align:center;font-size:22px;pointer-events:none">Ready</span>`, stage);
  css(S.ready, {left: ff ? 753 : 746, top: ff ? 244 : 246, width: 88, height: 110}); S.ready.onclick = ready;
  S.menu = el('button', 'tribebtn', ico('<path d="M5 7h14M5 12h14M5 17h14"></path>', 22, 2.8), stage); css(S.menu, ff ? {left: 690, top: 3, display: 'flex', padding: '5px', transform: 'scale(.86)', transformOrigin: 'left top'} : {left: 30, top: 200, display: 'flex', padding: '5px'});
  S.menu.setAttribute('aria-label', 'Menu'); S.menu.onclick = showMenu;
  S.layer = el('div', 'ab', '', stage); css(S.layer, {left: 0, top: 0, width: W, height: H, pointerEvents: 'none'});
  if (ff) { edge('l', S.shield, S.heroAv, S.hp, S.arm, S.power, S.likes); edge('r', S.gold, S.bonus, S.scroll, S.save, S.ready); }
  else { edge('l', S.shield, S.tribes, S.tribePop, S.heroAv, S.hp, S.arm, S.menu, S.power); edge('r', S.gold, S.bonus, S.scroll, S.save, S.ready); }

  renderChrome(); renderAll(false);
}
function shieldSVG(fill) { const d = 'M15 6H77Q86 6 86 15V56Q86 82 46 102Q6 82 6 56V15Q6 6 15 6Z'; return `<svg width="92" height="112" viewBox="0 0 92 112" aria-hidden="true"><g stroke-linejoin="round"><path d="${d}" transform="translate(0 5)" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="${d}" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="${d}" transform="translate(0 5)" fill="#2b2140" stroke="#2b2140" stroke-width="3"></path><path class="face" d="${d}" fill="${fill}" stroke="#2b2140" stroke-width="3"></path></g></svg>`; }
function renderChrome() {
  const me = G.me, L = G.lobby;
  // lobby strip
  const nxt = L.nextOpponentFor(me);
  S.lobby.innerHTML = '';
  for (const p of L.standings()) {
    const c = el('div', 'lobchip' + (p === me ? ' you' : '') + (p === nxt ? ' next' : '') + (!p.alive ? ' dead' : ''), `<span class="av"><img src="${ART[p.hero] || ART.follower}" alt=""></span><i class="tierb" title="Tier ${p.tier}">${p.tier}</i>${p.alive ? p.health + p.boundaries : '✕'}${p === nxt ? '<span class="nx">NEXT</span>' : ''}`, S.lobby);
    c.title = p === me ? 'You' : HERO[p.hero] ? HERO[p.hero].name : p.name;
  }
  // shield
  const lc = me.levelCost();
  const ss = me.tier <= 3 ? 18 : me.tier === 4 ? 16 : me.tier === 5 ? 14 : 12.5;
  S.shield.innerHTML = shieldSVG('#c88af8') + `<span class="ab stars-row" style="left:4px;right:4px;top:${lc === null ? 26 : 17}px;height:18px;display:flex;align-items:center;justify-content:center;gap:0">${STAR(ss).repeat(me.tier)}</span>` +
    (lc === null ? '<span class="ab" style="left:0;right:0;top:52px;text-align:center;font-size:13px;letter-spacing:.12em">MAX TIER</span>' :
    `<span class="ab" style="left:0;right:0;top:40px;text-align:center;font-size:11px;letter-spacing:.1em">LEVEL UP</span><span class="ab" style="left:19px;top:56px;width:54px;height:28px;background:#fff;border:2.5px solid #2b2140;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:4px">${ico('<circle cx="12" cy="12" r="10" fill="#2ecb6e"></circle><path d="M12 17V7.5M7.8 11.5L12 7.3l4.2 4.2"></path>', 18, 2.6)}<span class="coin" style="position:static;width:21px;height:21px;font-size:12px;box-shadow:none">${lc}</span></span>`);
  S.shield.classList.toggle('off', lc !== null && me.gold[0] < lc);
  S.shield.setAttribute('aria-label', lc === null ? `Tier ${me.tier}, max` : `Tier ${me.tier}. Promote for ${lc} gold`);
  // gold
  S.gold.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#2b2140" stroke-width="2"><circle cx="12" cy="12" r="10" fill="#ffc928"></circle><circle cx="12" cy="12" r="5" stroke="#d99a12" stroke-width="2.4"></circle></svg><span style="padding-top:3px">${me.gold[0]}</span>`;
  S.bonus.style.display = me.bonus_next ? 'block' : 'none'; S.bonus.textContent = `${me.bonus_next > 0 ? '+' : '−'}${Math.abs(me.bonus_next)} next turn`;
  const scc = me.scrollCost(); S.scroll.classList.toggle('off', me.gold[0] < scc);
  const sccEl = S.scroll.querySelector('.coin'); sccEl.textContent = scc === 0 ? 'FREE' : scc; sccEl.style.width = scc === 0 ? '40px' : '24px'; sccEl.style.fontSize = scc === 0 ? '10px' : '13px'; sccEl.style.left = scc === 0 ? '38px' : '46px';
  S.save.innerHTML = `<svg width="58" height="74" viewBox="0 0 58 74" aria-hidden="true"><g stroke-linejoin="round"><path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" transform="translate(0 5)" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" transform="translate(0 5)" fill="#2b2140" stroke="#2b2140" stroke-width="3"></path><path class="face" d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" fill="${G.saved ? '#ffc928' : '#ff8ab8'}" stroke="#2b2140" stroke-width="3"></path></g></svg><span class="ab" style="left:0;right:0;top:23px;text-align:center;font-size:14px;pointer-events:none">${G.saved ? 'Saved' : 'Save'}</span>`;
  S.feedSurf.classList.toggle('saved', !!G.saved);
  if (G.saved && !S.saveTag && !G.saveFly) { S.saveTag = el('div', 'savetag', '<svg width="74" height="44" viewBox="0 0 74 44" aria-hidden="true"><path d="M4 4H70V40L37 30L4 40Z" fill="#ff8ab8" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path></svg><span>SAVED</span>', stage); css(S.saveTag, {left: 648, top: 44, width: 74, height: 44}); }
  else if (!G.saved && S.saveTag) { const tg = S.saveTag; S.saveTag = null; anim(tg, [{transform: 'translateY(0) rotate(0)', opacity: 1}, {transform: 'translateY(-30px) rotate(-25deg)', opacity: 0}], {duration: 260, fill: 'forwards', raw: true}).then(() => tg.remove()); }
  // hero / power
  S.hp.textContent = me.health; S.arm.textContent = me.boundaries; S.arm.style.display = me.boundaries > 0 ? 'flex' : 'none';
  const h = HERO[G.heroSlug], passive = me.powerCost() == null;
  const usable = !passive && me.canPower();
  S.power.innerHTML = `<svg width="70" height="76" viewBox="0 0 70 76" aria-hidden="true"><g stroke-linejoin="round"><path d="M35 6L62 21V52L35 67L8 52V21Z" transform="translate(0 5)" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="M35 6L62 21V52L35 67L8 52V21Z" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="M35 6L62 21V52L35 67L8 52V21Z" transform="translate(0 5)" fill="#2b2140" stroke="#2b2140" stroke-width="3"></path><path class="face" d="M35 6L62 21V52L35 67L8 52V21Z" fill="${passive || usable ? '#2fd0d0' : '#c9c2d6'}" stroke="#2b2140" stroke-width="3"></path></g><g transform="translate(20 20) scale(1.25)" fill="none" stroke="#2b2140" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.3l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="#fff"></path></g></svg>` +
    (passive ? '' : `<span class="coin" style="left:50px;top:-2px;width:24px;height:24px;font-size:13px">${me.powerCost()}</span>`) +
    (G.heroSlug === 'h_doomscroller' ? `<span class="ab bd" style="left:44px;top:56px;min-width:26px;height:22px;padding:2px 5px 0;box-sizing:border-box;background:#fff;border:2.5px solid #2b2140;border-radius:999px;font-size:12px;display:flex;align-items:center;justify-content:center" title="Scrolls until the next Discover">${me.doomLeft()}</span>` : '');
  S.power.classList.toggle('off', !passive && !usable); S.power.setAttribute('aria-label', `${h.power}: ${h.effect}`);
  S.feedSurf.querySelector('.price-coin').textContent = me.minionCost();
  S.likes.hidden = !me.likes; S.likes.innerHTML = `<svg width="34" height="32" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 20C4 14 1.5 10 1.5 6.5 1.5 3.5 4 1.5 6.5 1.5c2.2 0 4 1.2 5.5 3.2 1.5-2 3.3-3.2 5.5-3.2 2.5 0 5 2 5 5 0 3.5-2.5 7.5-10.5 13.5Z" fill="#ff6b9a" stroke="#2b2140" stroke-width="2" stroke-linejoin="round"></path></svg><span>${me.likes}</span>`; S.likes.setAttribute('aria-label', `${me.likes} Likes. Tap to give them out`);
}
function copiesOf(name) { return G.me.board.filter(m => m.name === name && !m.golden).length + G.hand.filter(h => h.card.name === name).length; }
function shownStats(m) { return {atk: m.atk + m.ta, hp: m.hp + m.th, tmp: !!(m.ta || m.th), upA: G.me.buffed.has(m.id), upH: G.me.buffed.has(m.id)}; }
function renderAll(animateNew = true, gapAt = null) {
  const me = G.me;
  // board
  const n = me.board.length + (gapAt !== null ? 1 : 0);
  const seen = new Set();
  me.board.forEach((m, i) => {
    const k = gapAt !== null && i >= gapAt ? i + 1 : i;
    let t = S.tok.get(m.id);
    if (!t) { t = makeToken(m, shownStats(m)); S.layer.appendChild(t); S.tok.set(m.id, t); bindToken(t, 'board', m); css(t, {left: boardX(k, n), top: LY.boardY});
      if (animateNew) anim(t, [{transform: 'scale(0)'}, {transform: 'scale(1.18)', offset: .6}, {transform: 'scale(1)'}], {duration: 360, easing: 'ease-out'}); }
    else updateToken(t, m, shownStats(m));
    t.style.transition = 'left .26s cubic-bezier(.22,1,.36,1), top .26s cubic-bezier(.22,1,.36,1)';
    css(t, {left: boardX(k, n), top: LY.boardY}); t._m = m; seen.add(m.id);
  });
  for (const [id, t] of S.tok) if (!seen.has(id)) { if (!t._leaving) t.remove(); S.tok.delete(id); }
  if (S.gapEl) { S.gapEl.remove(); S.gapEl = null; }
  if (gapAt !== null) { S.gapEl = el('div', 'slot-hint', '', S.layer); css(S.gapEl, {left: boardX(gapAt, n), top: LY.boardY}); }
  // feed
  const fseen = new Set();
  G.feed.forEach((f, i) => {
    let t = S.feedTok.get(f.key);
    const m = {name: f.card.name, tribe: f.card.tribe, atk: f.card.atk + f.a, hp: f.card.hp + f.h, tier: f.card.tier, taunt: f.card.taunt, shield: f.card.shield, toxic: f.card.toxic};
    const o = {copies: copiesOf(f.card.name) >= 1 ? copiesOf(f.card.name) : 0, upA: f.a > 0, upH: f.h > 0, saved: !!G.saved};
    if (!t) { t = makeToken(m, o); S.layer.appendChild(t); S.feedTok.set(f.key, t); bindToken(t, 'feed', f); css(t, {left: feedX(i, G.feed.length), top: LY.feedY}); }
    else t.innerHTML = tokenHTML(m, o);
    t.style.transition = 'left .26s cubic-bezier(.22,1,.36,1), top .26s';
    css(t, {left: feedX(i, G.feed.length), top: LY.feedY}); t._f = f; fseen.add(f.key);
  });
  for (const [k, t] of S.feedTok) if (!fseen.has(k)) { if (!t._leaving) t.remove(); S.feedTok.delete(k); }
  // hand
  const hseen = new Set();
  G.hand.forEach((hc, i) => {
    let e = S.handEl.get(hc.key);
    const c = hc.card, p = handPos(i, G.hand.length);
    if (!e) { e = el('div', 'hc' + (hc.golden ? ' golden' : ''), `<div class="pn" style="${tribeBgCss(c.tribe, c.tribe2, 7)}"><img src="${ART[c.art]}" alt="" draggable="false"></div><p class="hn">${c.name}</p><div class="hs at">${c.atk * (hc.golden ? 2 : 1) + hc.a}</div><div class="hs hp">${c.hp * (hc.golden ? 2 : 1) + hc.h}</div>`, S.layer); S.handEl.set(hc.key, e); bindToken(e, 'hand', hc); css(e, {left: p.x, top: p.y + 40}); }
    e.style.transition = 'left .26s cubic-bezier(.22,1,.36,1), top .26s cubic-bezier(.22,1,.36,1), transform .26s';
    requestAnimationFrame(() => { css(e, {left: p.x, top: p.y}); e.style.transform = `rotate(${p.r}deg)`; });
    e._h = hc; hseen.add(hc.key);
  });
  for (const [k, e] of S.handEl) if (!hseen.has(k)) { if (!e._leaving) e.remove(); S.handEl.delete(k); }

  renderChrome();
}

// ---------------------------------------------------------------- shop log animations
async function playLog() {
  const log = G.me.log.splice(0);
  let i = 0;
  for (const e of log) {
    const t = S.tok.get(e.id), src = e.src != null ? S.tok.get(e.src) : null;
    if (e.type === 'buff' || e.type === 'tbuff') {
      if (!t) continue;
      const tc = center(rectOf(t));
      if (src && src !== t) streak(center(rectOf(src)), tc, e.type === 'tbuff' ? '#4fd1c5' : '#2ecb6e', 240);
      setTimeout(() => floatText(tc[0], tc[1] - 30, `+${e.a}/+${e.h}`, e.type === 'tbuff' ? '' : ''), src && src !== t ? 200 : 0);
      if (src) anim(src, [{transform: 'scale(1)'}, {transform: 'scale(1.12)'}, {transform: 'scale(1)'}], {duration: 240});
      sfx('buff', {n: e.a + e.h, gap: 0.06});
      if (++i % 2 === 0) await sleep(70);
    } else if (e.type === 'gold' || e.type === 'gold_next') {
      const r = t ? center(rectOf(t)) : [420, 200];
      floatText(r[0], r[1] - 30, e.type === 'gold' ? `+${e.n} gold` : `${e.n >= 0 ? '+' : '−'}${Math.abs(e.n)} gold next turn`, e.n >= 0 ? 'gold' : 'red');
      if (e.type === 'gold') coinFly(r, center(rectOf(S.gold)), e.n); sfx('coin');
    } else if (e.type === 'triple') {
      if (t) { const c = center(rectOf(t)); ring(c[0], c[1], '#ffc928', 110); confetti(c[0], c[1], 24); anim(t, [{transform: 'scale(.4) rotate(-180deg)'}, {transform: 'scale(1.3) rotate(10deg)', offset: .6}, {transform: 'scale(1)'}], {duration: 700, easing: 'ease-out'}); }
      toast('Triple! Golden minion', 1400); sfx('triple'); PROF.stats.triples = (PROF.stats.triples || 0) + 1;
    } else if (e.type === 'collab') {
      if (t) { const c = center(rectOf(t)); ring(c[0], c[1], '#8fd4ff', 80); floatText(c[0], c[1] - 34, e.name, ''); } sfx('sparkle');
    } else if (e.type === 'acquire') {
      if (t) { const c = center(rectOf(t)); ring(c[0], c[1], '#ffc928', 100); floatText(c[0], c[1] - 34, `Acquired ${e.name}`, 'gold'); } sfx('buy');
    } else if (e.type === 'likes') {
      sfx('like'); const c = center(rectOf(S.heroAv)); for (let k = 0; k < Math.min(e.n, 5); k++) setTimeout(() => floatText(c[0] + 20 + k * 8, c[1] - 30, '♥', 'red'), k * 90);
    } else if (e.type === 'feedbuff') {
      sfx('feedbuff');
      for (const tt of S.feedTok.values()) if (tt._f && tt._f.card.tribe === e.tribe) { const c = center(rectOf(tt)); floatText(c[0], c[1] - 30, `+${e.a}/+${e.h}`); }
    } else if (e.type === 'drain') {
      if (t) anim(t, [{transform: 'translateX(0)'}, {transform: 'translateX(-4px)'}, {transform: 'translateX(4px)'}, {transform: 'translateX(0)'}], {duration: 220}); sfx('zap');
    }
  }
  renderChrome();
}
async function afterAction(animateNew = true) {
  renderAll(animateNew);
  await playLog();
  if (G.me.pending.length) await handlePending();
}

// ---------------------------------------------------------------- shop actions
function costOf(f) { return G.me.minionCost(f); }
/** A third copy makes a triple the moment it is bought: no free board slot or hand slot is needed. */
function tripleReady(card) {
  if (!card || card.collab) return false;
  const onBoard = G.me.board.filter(m => m.name === card.name && !m.golden && !m.follower).length;
  return onBoard + G.hand.filter(h => h.card.name === card.name && !h.golden).length >= 2;
}
/** Forms a triple as a golden card in the hand: board copies are used first (that frees board space), then hand copies.
 *  newPiece: the copy being bought ({a, h}), or null when the third copy is already in the hand (from a Discover). */
function makeTriple(card, newPiece) {
  const me = G.me, need = newPiece ? 2 : 3;
  const onBoard = me.board.filter(m => m.name === card.name && !m.golden && !m.follower).length, fromBoard = Math.min(onBoard, need);
  const fromHand = G.hand.filter(h => h.card.name === card.name && !h.golden).slice(0, need - fromBoard);
  for (const h of fromHand) { G.hand.splice(G.hand.indexOf(h), 1); const e = S.handEl.get(h.key); if (e) { e._leaving = true; e.remove(); } }
  const spec = me.takeTriple(card, [...(newPiece ? [newPiece] : []), ...fromHand.map(h => ({a: h.a, h: h.h}))], fromBoard);
  G.hand.push({card, a: spec.a, h: spec.h, golden: true, extras: spec.extras, shield: spec.shield, sell: spec.sell, kw: spec.kw, tribe2: spec.tribe2, key: Math.random()});
  me.tripleReward(me.gold); toast('Triple! Golden card in your hand', 1500); sfx('triple'); PROF.stats.triples = (PROF.stats.triples || 0) + 1;
}
const handCopies = card => G.hand.filter(h => h.card.name === card.name && !h.golden).length;
function canBuy(f) { if (tripleReady(f.card)) { if (G.me.gold[0] < costOf(f)) { shake(S.gold); toast('Not enough gold'); return false; }
  const onB = G.me.board.filter(m => m.name === f.card.name && !m.golden && !m.follower).length; if (G.hand.length >= 10 && onB >= 2) { toast('Your hand is full'); return false; } return true; } if (G.hand.length >= 10) { toast('Your hand is full'); return false; } if (G.me.gold[0] < costOf(f)) { shake(S.gold); toast('Not enough gold'); return false; } return true; }
function shake(e) { sfx('error'); anim(e, [{transform: 'translateX(0)'}, {transform: 'translateX(-6px)'}, {transform: 'translateX(6px)'}, {transform: 'translateX(-3px)'}, {transform: 'translateX(0)'}], {duration: 300, raw: true}); }
function goldTick(delta) {
  anim(S.gold, [{transform: 'scale(1)'}, {transform: 'scale(1.18)'}, {transform: 'scale(1)'}], {duration: 260, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  const c = center(rectOf(S.gold)); floatText(c[0] - 10, c[1] + 20, (delta > 0 ? '+' : '') + delta, delta > 0 ? 'gold' : 'red');
}
async function buy(f, toBoardAt = null) {
  if (G.busy || !G.feed.includes(f) || !canBuy(f)) return;   // the Feed may have changed (Scroll) since this card was picked up
  const me = G.me, cst = costOf(f);
  me.gold[0] -= cst; me.gainSpend(cst); me.hired(f.card); goldTick(-cst); PROF.stats.hires++; RUN.act('buy', f.card.name); sfx('buy');
  G.feed.splice(G.feed.indexOf(f), 1);
  const hc = {card: f.card, a: f.a, h: f.h, key: Math.random()};
  const t = S.feedTok.get(f.key);
  if (tripleReady(f.card)) {   // the third copy makes the triple at once: a golden card in the hand (no board slot needed)
    if (t) { t._leaving = true; t.remove(); }
    makeTriple(f.card, {a: f.a, h: f.h});
    await afterAction(true); return;
  }
  if (toBoardAt !== null) { if (t) { t._leaving = true; t.remove(); } G.hand.push(hc); await playCard(hc, toBoardAt); return; }
  G.hand.push(hc);
  if (t) { t._leaving = true; const p = handPos(G.hand.length - 1, G.hand.length);
    t.style.transition = 'none'; await anim(t, [{transform: 'translate(0,0) scale(1)'}, {transform: `translate(${(p.x + 8 - parseFloat(t.style.left)) / 2}px,${(p.y - LY.feedY) / 2 - 40}px) scale(1.15) rotate(-10deg)`}, {transform: `translate(${p.x + 8 - parseFloat(t.style.left)}px,${p.y - LY.feedY}px) scale(.9)`, opacity: .2}], {duration: 300, easing: 'ease-in-out', fill: 'forwards'}); t.remove(); }
  renderAll(); G.me.log = [];
}
function needsTarget(card) {
  const me = G.me;
  if (card.collab) { const c = me.connectTargets(card); return c.length ? c : null; }
  if (!E.TARGETED_FI.has(card.name)) return null;
  const cand = card.name === 'Art Student' ? me.board.filter(m => m.tribe === 'Creative') : card.name === 'Smart Doorbell' ? me.board.filter(m => !m.follower && m.tribe !== 'Techie' && !m.tribe2) : me.board.slice();
  if (card.name === 'Venture Capitalist' && me.gold[0] <= 0) return null;
  return cand.length ? cand : null;
}
async function playCard(hc, pos = null, target = null, more = null) {
  if (G.busy) return;
  const me = G.me, card = hc.card;
  if (!G.hand.includes(hc)) { renderAll(); return; }   // already played (a second tap or drag on the same card): never remove another one
  const merges = !hc.golden && me.board.filter(m => m.name === card.name && !m.golden && !m.follower).length >= 2;
  if (!me.canConnect(card) && me.board.length >= 7 && !merges) { toast('Your board is full (7)'); renderAll(); return; }
  if (target === null) {
    const cands = needsTarget(card);
    if (cands) { await chooseTarget(cands, card.collab ? `Choose a minion for ${card.name} to connect to` : `Choose a minion for ${card.name}`, async t => playCard(hc, pos, t), () => renderAll()); return; }
  }
  // Smart Home Hub: the Connect also attaches to more minions; the player picks each one
  if (card.collab && target && more === null) {
    const extra = me.hubExtra(), picked = [];
    for (let i = 0; i < extra; i++) {
      const cands = me.connectTargets(card).filter(m => m !== target && !picked.includes(m));
      if (!cands.length) break;
      let got = null;
      await chooseTarget(cands, `Smart Home Hub: choose another minion for ${card.name} (${i + 2} of ${extra + 1})`, async t => { got = t; }, () => {});
      if (!got) break; picked.push(got);
    }
    return playCard(hc, pos, target, picked);
  }
  if (!G.hand.includes(hc)) { renderAll(); return; }
  G.hand.splice(G.hand.indexOf(hc), 1);
  const e = S.handEl.get(hc.key); if (e) { e._leaving = true; e.remove(); }
  const m = me.play(card, me.gold, pos, target, me.canConnect(card) ? null : {a: hc.a, h: hc.h, golden: !!hc.golden, extras: hc.extras, shield: hc.shield, sell: hc.sell, zero: !!hc.zero, kw: hc.kw, tribe2: hc.tribe2}, more); sfx('slap');
  if (card.collab) { const c = S.tok.get(m.id); }
  G.firstTurn = G.firstTurn && me.turn <= 1;
  // sticker slap
  await afterAction(true);
  if (m && S.tok.get(m.id)) { const t = S.tok.get(m.id), c = center(rectOf(t)); ring(c[0], c[1], '#ffffff', 80); if (fxOn('slam')) { ring(c[0], c[1] + 10, '#ffc928', 170); confetti(c[0], c[1], 16); anim(stage, [{transform: `scale(${SCALE}) translate(0,0)`}, {transform: `scale(${SCALE}) translate(0,4px)`}, {transform: `scale(${SCALE}) translate(0,0)`}], {duration: 200}); } if (card.kind === 'fi' || /^First Impression/.test(card.text)) { ring(c[0], c[1], '#ff6b5e', 110); } }
}
async function sell(m) {
  if (G.busy) return;
  const me = G.me, t = S.tok.get(m.id), g = me.sellValue(m);
  const c = t ? center(rectOf(t)) : [420, 210];
  RUN.act('sell', m.name); me.sell(m, me.gold); sfx('sell'); PROF.stats.sells = (PROF.stats.sells || 0) + 1;
  if (t) { t._leaving = true; t.style.transition = 'none';
    anim(t, [{transform: 'scale(1) rotate(0)'}, {transform: 'scale(1.2) rotate(-12deg)', offset: .3}, {transform: 'scale(0) rotate(200deg)', opacity: 0}], {duration: 380, easing: 'ease-in', fill: 'forwards'}).then(() => t.remove()); }
  coinFly(c, center(rectOf(S.gold)), g); setTimeout(() => goldTick(g), 450);
  floatText(c[0], c[1] - 30, `+${g} gold`, 'gold');
  // Greatest Hits re-release
  for (const card of me.rerelease) G.feed.push({card, a: 0, h: 0, key: Math.random()});
  me.rerelease = [];
  me.log = me.log.filter(x => x.type !== 'sold');
  await afterAction(true);
}
async function scroll() {
  if (G.busy) return; const me = G.me, sc = me.scrollCost();
  if (me.gold[0] < sc) { shake(S.scroll); toast('Not enough gold'); return; }
  me.payScroll(); if (sc) goldTick(-sc); G.saved = false; PROF.stats.scrolls++; RUN.act('roll'); sfx('scroll');
  anim(S.scroll.querySelector('.spin'), [{transform: 'translate(18px,17px) scale(1.34) rotate(0)'}, {transform: 'translate(18px,17px) scale(1.34) rotate(360deg)'}], {duration: 420, raw: true});
  const old = [...S.feedTok.values()]; S.feedTok.clear();
  old.forEach((t, i) => { t._leaving = true; t.style.transition = 'none'; anim(t, [{transform: 'translateY(0) rotate(0)'}, {transform: `translateY(-90px) rotate(${i % 2 ? 15 : -15}deg)`, opacity: 0}], {duration: 220, delay: i * 25, easing: 'ease-in', fill: 'forwards'}).then(() => t.remove()); });
  G.feed = me.drawFeed().map(c => ({card: c, a: me.feedBonus(c).a, h: me.feedBonus(c).h, key: Math.random()}));
  await sleep(120);
  renderAll();
  [...S.feedTok.values()].forEach((t, i) => anim(t, [{transform: 'translateY(-70px)', opacity: 0}, {transform: 'translateY(6px)', opacity: 1, offset: .7}, {transform: 'translateY(0)'}], {duration: 340, delay: i * 50, easing: 'ease-out', fill: 'backwards'}));
  await playLog();
  if (me.pending.length) { await sleep(300); await handlePending(); }
}
function toggleSave() {
  if (G.busy) return;
  G.saved = !G.saved;
  anim(S.save, [{transform: 'translateY(-14px) rotate(-6deg)'}, {transform: 'translateY(3px) rotate(3deg)'}, {transform: 'translateY(0)'}], {duration: 300, easing: 'ease-out', raw: true});
  sfx(G.saved ? 'save' : 'unsave');
  if (G.saved) {
    G.saveFly = true;
    // a bookmark flies from the button to the Feed, a glare wraps the Feed, every minion gets pinned
    const from = center(rectOf(S.save)), bm = el('div', 'savetag', '<svg width="74" height="44" viewBox="0 0 74 44" aria-hidden="true"><path d="M4 4H70V40L37 30L4 40Z" fill="#ff8ab8" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path></svg><span>SAVED</span>', stage);
    css(bm, {left: from[0] - 37, top: from[1] - 22, width: 74, height: 44});
    anim(bm, [{transform: 'translate(0,0) scale(.5) rotate(20deg)'}, {transform: `translate(${(685 - from[0]) / 2}px,${(66 - from[1]) / 2 - 50}px) scale(1.3) rotate(-10deg)`, offset: .55}, {transform: `translate(${685 - from[0]}px,${66 - from[1]}px) scale(1) rotate(0)`}], {duration: 380, easing: 'cubic-bezier(.3,0,.3,1)', raw: true}).then(() => { bm.remove(); G.saveFly = false; renderChrome(); if (S.saveTag) anim(S.saveTag, [{transform: 'rotate(-8deg) scale(1.25)'}, {transform: 'rotate(4deg)'}, {transform: 'rotate(0)'}], {duration: 300, raw: true}); });
    const gl = el('div', 'wrapglare', '', S.feedSurf); anim(gl, [{left: '-130px'}, {left: '630px'}], {duration: 520, easing: 'ease-in-out', raw: true}).then(() => gl.remove());
    anim(S.feedSurf, [{transform: 'scale(1)'}, {transform: 'scale(1.025,.97)'}, {transform: 'scale(.99,1.02)'}, {transform: 'scale(1)'}], {duration: 420, raw: true});
    renderAll(false);
    [...S.feedTok.values()].forEach((t, i) => {
      anim(t, [{transform: 'translateY(0)'}, {transform: 'translateY(-14px) rotate(-4deg)'}, {transform: 'translateY(0)'}], {duration: 300, delay: 120 + i * 70, easing: 'ease-out', raw: true});
      const b = t.querySelector('.bm'); if (b) anim(b, [{transform: 'translateY(-30px) scale(1.6) rotate(-30deg)', opacity: 0}, {transform: 'translateY(0) scale(1) rotate(0)', opacity: 1}], {duration: 300, delay: 160 + i * 70, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards', raw: true});
    });
  } else {
    [...S.feedTok.values()].forEach(t => { const b = t.querySelector('.bm'); if (b) anim(b, [{transform: 'translateY(0) rotate(0)', opacity: 1}, {transform: 'translateY(-26px) rotate(40deg)', opacity: 0}], {duration: 240, fill: 'forwards', raw: true}); });
    setTimeout(() => renderAll(false), 250); renderChrome();
  }
}
async function levelUp() {
  if (G.busy) return; const me = G.me, lc = me.levelCost();
  if (lc === null) return;
  if (me.gold[0] < lc) { shake(S.shield); toast(`Promoting costs ${lc} gold`); return; }
  me.gold[0] -= lc; me.gainSpend(lc); me.tier += 1; me.turns_at_tier = 0; goldTick(-lc); RUN.act('level');
  if (me.tier === 6) { PROF.flags.tier6 = true; checkUnlocks(); }
  sfx('levelup'); AU.intensity(tierLevel());
  renderChrome();
  anim(S.shield, [{transform: 'scale(1) rotate(0)'}, {transform: 'scale(1.25) rotate(-8deg)'}, {transform: 'scale(.95) rotate(4deg)'}, {transform: 'scale(1)'}], {duration: 600, easing: 'ease-out', raw: true});
  const c = center(rectOf(S.shield)); ring(c[0], c[1] - 20, '#ffc928', 120); confetti(c[0], c[1] - 20, 14);
  const stars = S.shield.querySelectorAll('svg')[me.tier];
  if (stars) anim(stars, [{transform: 'scale(3) rotate(-90deg)', opacity: 0}, {transform: 'scale(1) rotate(0)', opacity: 1}], {duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  toast(`Tier ${me.tier}! The Feed now shows ${me.feedSize()} minions`, 1500);
  await playLog();
}
async function useLikes() {
  if (G.busy) return;
  const me = G.me; if (!me.likes || !me.board.length) { toast(me.likes ? 'Play a minion first' : 'No Likes yet'); return; }
  const go = async t => { me.giveLike(t); sfx('like'); renderAll(); await playLog(); if (me.likes > 0) useLikes(); };
  await chooseTarget(me.board.slice(), `Give a Like (+${me.likeValue(null)}/+${me.likeValue(null)}) · ${me.likes} left`, go, () => {});
}
async function usePower() {
  if (G.busy) return;
  const me = G.me, h = HERO[G.heroSlug], pc = me.powerCost();
  if (pc == null) { showHeroDetail(); return; }
  if (me.powerUsed) { toast('Already used this turn'); return; }
  if (me.gold[0] < pc) { shake(S.power); toast('Not enough gold'); return; }
  const def = E.HERO_POWERS[G.heroSlug];
  if (def.target && !me.board.length && G.heroSlug !== 'boomer') { toast('Play a minion first'); return; }
  const go = async t => {
    const before = new Set(me.board.map(m => m.id));
    me.usePower(t, G.feed); goldTick(-pc); PROF.flags = PROF.flags || {}; sfx('power');
    const pc0 = center(rectOf(S.power));
    anim(S.power, [{transform: 'scale(1) rotate(0)'}, {transform: 'scale(1.25) rotate(-12deg)'}, {transform: 'scale(1) rotate(0)'}], {duration: 360, raw: true});
    ring(pc0[0], pc0[1], '#2fd0d0', 100);
    if (G.heroSlug === 'boomer') { for (const tt of S.feedTok.values()) streak(pc0, center(rectOf(tt)), '#2fd0d0', 300); if (t && S.tok.get(t.id)) streak(pc0, center(rectOf(S.tok.get(t.id))), '#2fd0d0', 300); await sleep(260); }
    if (t && S.tok.get(t.id) && G.heroSlug !== 'boomer') { await streak(pc0, center(rectOf(S.tok.get(t.id))), '#2fd0d0', 300); }
    me.log = me.log.filter(e => e.type !== 'feedbuff');
    renderAll(); await playLog();
    for (const m of me.board) if (!before.has(m.id)) { const tk = S.tok.get(m.id); if (tk) { const c = center(rectOf(tk)); ring(c[0], c[1], '#ffc928', 110); confetti(c[0], c[1], 16); floatText(c[0], c[1] - 36, 'Pivot!', 'gold'); } }
    if (me.pending.length) await handlePending();
  };
  if (me.powerNeedsTarget()) await chooseTarget(me.board.slice(), G.heroSlug === 'boomer' ? `${h.power}: choose a minion (the Feed gets +1/+1 too)` : `${h.power}: choose a minion`, go, () => {});
  else await go(null);
}

// ---------------------------------------------------------------- targeting & discover & detail
function chooseTarget(cands, text, onPick, onCancel) {
  return new Promise(res => {
    G.mode = 'target';
    const ov = el('div', 'ab', '', stage); css(ov, {inset: 0, left: 0, top: 0, width: W, height: H, background: 'rgba(43,33,64,.35)', zIndex: 60});
    const lab = el('div', 'toast', text, ov); lab.style.top = '128px';
    const cancel = el('button', 'btn', 'Cancel', ov); css(cancel, {left: 372, top: 300, width: 100, height: 40, fontSize: '16px'});
    const ids = new Set(cands.map(m => m.id));
    const lifted = [];
    for (const [id, t] of S.tok) if (ids.has(id)) { t.style.zIndex = 61; t.classList.add('target-ok'); lifted.push(t); }
    const done = async (m) => {
      G.mode = null; ov.remove(); for (const t of lifted) { t.style.zIndex = ''; t.classList.remove('target-ok'); }
      S.pickHandler = null;
      if (m) await onPick(m); else onCancel();
      res();
    };
    S.pickHandler = m => { if (ids.has(m.id)) { sfx('pick'); done(m); } };
    cancel.onclick = () => done(null);
  });
}
function handlePending() {
  const me = G.me;
  return new Promise(res => {
    const p = me.pending.shift(); if (!p) return res();
    if (p.kind === 'hand') {   // a card made by an effect (Encore): straight into the hand
      if (G.hand.length < 10) { G.hand.push({card: p.card, a: 0, h: 0, zero: !!p.zero, key: Math.random()}); toast(`${p.card.name} added to your hand${p.zero ? ' (sells for 0)' : ''}`); sfx('buy'); } else toast('Your hand is full');
      renderAll(); return handlePending().then(res);
    }
    sfx('discover');
    const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 65});
    el('div', 'dim', '', ov);
    const head = el('div', 'ab bd', p.why === 'gig' ? 'Ghost Kitchen: Discover a minion' : p.why === 'triple' ? `Triple! Discover a ${'★'.repeat(p.tier)} minion` : p.why === 'hero' ? `${HERO[G.heroSlug].power}: Discover a minion` : `Discover a ${TP[p.why] ? TP[p.why].replace(/s$/, '') : 'minion'}`, ov);
    css(head, {left: 0, right: 0, top: 14, textAlign: 'center'}); head.innerHTML = `<span style="display:inline-block;background:#ffc928;border:3px solid #2b2140;border-radius:999px;padding:6px 18px 2px;box-shadow:0 0 0 3px #fff;font-size:22px">${head.textContent}</span>`;
    // look at the board before choosing: the overlay hides, minions can be tapped to inspect, nothing else can be done
    const look = el('button', 'btn', ico('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="#fff"></path><circle cx="12" cy="12" r="3" fill="#2b2140"></circle>', 20, 2.2) + 'Look at board', ov);
    css(look, {left: 342, top: 300, width: 160, height: 42, fontSize: '16px', zIndex: 2});
    look.onclick = () => {
      sfx('close'); ov.style.visibility = 'hidden'; G.busy = true; G.mode = 'peek';
      const back = el('button', 'btn', 'Back to Discover', stage); css(back, {left: 312, top: 322, width: 220, height: 46, fontSize: '18px', background: '#ffc928', zIndex: 70});
      back.onclick = () => { sfx('open'); back.remove(); ov.style.visibility = ''; G.busy = false; G.mode = null; };
    };
    p.options.forEach((c, i) => {
      const b = el('button', 'ab', `<div style="transform:scale(.62);transform-origin:top left">${cardHTML(c)}</div>`, ov);
      css(b, {left: 168 + i * 176, top: 62, width: 149, height: 208, padding: 0, border: 0, background: 'none', cursor: 'pointer'});
      anim(b, [{transform: 'rotateY(90deg) translateY(30px)', opacity: 0}, {transform: 'rotateY(0) translateY(0)', opacity: 1}], {duration: 420, delay: i * 110, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards', raw: true});
      b.onclick = async () => {
        sfx('pick');
        ov.querySelectorAll('button.ab').forEach(o => { if (o !== b) anim(o, [{transform: 'translateY(0)', opacity: 1}, {transform: 'translateY(120px) rotate(12deg)', opacity: 0}], {duration: 300, fill: 'forwards', raw: true}); });
        await anim(b, [{transform: 'scale(1)'}, {transform: 'scale(1.12)'}, {transform: 'translateY(160px) scale(.5)', opacity: 0}], {duration: 420, fill: 'forwards', raw: true});
        ov.remove();
        if (G.hand.length < 10) { G.hand.push({card: c, a: 0, h: 0, key: Math.random()}); if (!c.collab && G.me.board.filter(m => m.name === c.name && !m.golden && !m.follower).length + handCopies(c) >= 3) makeTriple(c, null); }
        renderAll();
        await handlePending(); res();
      };
    });
  });
}
function showDetail(card, inst, actions = [], onClose = null) {
  sfx('open');
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 95});
  el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.82)';
  const c = el('div', 'ab', cardHTML(card, inst ? {atk: inst.atk + (inst.ta || 0), hp: inst.hp + (inst.th || 0), golden: inst.golden} : {}), ov); css(c, {left: 70, top: 22});
  const kws = ['Attention Seeker', 'Out of Office', 'Toxic', 'First Impression', 'Legacy', 'Rebrand', 'Connect', 'Discover', 'Clock In', 'Grievance', 'Side Gig', 'Like', 'Acquire', 'Cleave'].filter(k => card.text.includes(k));
  const KD = {'Attention Seeker': 'Enemies must attack it first.', 'Out of Office': 'Ignores the first damage it would take.', 'Toxic': 'Destroys any minion it damages.', 'First Impression': 'Happens when you play it from your hand.', 'Legacy': 'Happens when it dies.', 'Rebrand': 'Comes back once with 1 Health after it dies.', 'Connect': 'Attaches to one of your Techies: adds its stats and effect. With no Techie to attach to, it is played as a minion.', 'Discover': 'Pick 1 of 3 cards to add to your hand.',
    'Clock In': 'Happens every time it attacks.', 'Grievance': 'Happens every time that many friendly minions have died this combat.', 'Side Gig': 'Pay the gold in the shop to use it, once per turn.', 'Like': 'Give a Like to a minion for +1/+1. Tap the heart next to your hero.', 'Acquire': 'Take a minion out of the Feed.', 'Cleave': 'Also damages the minions next to its target.'};
  const ex = inst && inst.extras && inst.extras.length ? `<p class="kwl">Connected: ${inst.extras.join(', ')}</p>` : '';
  const tmp = inst && (inst.ta || inst.th) ? `<p class="kwl">Includes +${inst.ta}/+${inst.th} for the next combat only.</p>` : '';
  const gold = inst && inst.golden;
  const t = el('div', 'detail-txt', `${gold ? '<p class="kwl" style="color:#ffc928">Tripled: every effect is doubled.</p>' : ''}<p class="rules">${gold ? card.gold_html || card.full_html : card.full_html}</p>${kws.map(k => `<p class="kwl"><b class="kw">${k}:</b> ${KD[k]}</p>`).join('')}${ex}${tmp}<p class="fl">${card.flavour || ''}</p><div class="acts"></div>`, ov);
  css(t, {left: 360, top: 34, width: 440});
  const acts = t.querySelector('.acts');
  const close = () => { ov.remove(); sfx('close'); if (onClose) onClose(); };
  // The buttons sit over the board. A second tap on the minion, or the phone's delayed click from the tap that opened
  // this, used to land on Sell. A button only acts if a fresh press started on it, after the panel had been open a moment.
  const opened = performance.now(), GUARD = 450;
  for (const act of actions) {
    const b = el('button', 'btn', act.label + (act.cost != null ? ` <span class="coin" style="position:static;width:24px;height:24px;font-size:13px;box-shadow:none">${act.cost}</span>` : ''), acts);
    b.style.background = act.color || '#2ecb6e'; if (act.disabled) b.disabled = true;
    let pressed = false;
    b.addEventListener('pointerdown', () => { pressed = performance.now() - opened >= GUARD; });
    b.onclick = e => { e.stopPropagation(); if (!pressed) return; pressed = false; close(); act.fn(); };
  }
  anim(c, [{transform: 'scale(.4) rotate(-8deg)', opacity: 0}, {transform: 'scale(1.04) rotate(1deg)', opacity: 1, offset: .7}, {transform: 'scale(1)'}], {duration: 300, easing: 'ease-out', raw: true});
  anim(t, [{transform: 'translateX(40px)', opacity: 0}, {transform: 'translateX(0)', opacity: 1}], {duration: 260, easing: 'ease-out', raw: true});
  ov.onpointerup = e => { if (!e.target.closest('.btn')) close(); };
}
function showHeroDetail(slug = G.heroSlug, onClose = null) {
  const h = HERO[slug]; if (!h) return; sfx('open');
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 95}); el('div', 'dim', '', ov);
  const c = el('div', 'ab', heroHTML(h), ov); css(c, {left: 292, top: 0}); c.style.transform = 'scale(.92)';
  anim(c, [{transform: 'scale(.4) rotate(-8deg)', opacity: 0}, {transform: 'scale(.92)', opacity: 1}], {duration: 300, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  ov.onpointerup = () => { ov.remove(); sfx('close'); if (onClose) onClose(); };
}

// ---------------------------------------------------------------- pointer: tap, drag, long-press
function bindToken(e, kind, obj) {
  e.addEventListener('pointerdown', ev => {
    if ((G.busy && G.mode !== 'peek') || G.screen !== 'shop') return;
    ev.preventDefault();
    if (G.mode === 'peek') { const up = () => { e.removeEventListener('pointerup', up); showDetailFor(kind, e, true); }; e.addEventListener('pointerup', up); return; }
    if (G.mode === 'target') { if (kind === 'board' && S.pickHandler) S.pickHandler(e._m); return; }
    const [sx, sy] = toStage(ev.clientX, ev.clientY);
    const r = {x: parseFloat(e.style.left), y: parseFloat(e.style.top)};
    let dragging = false, longT = null, done = false;
    e.setPointerCapture(ev.pointerId);
    const move = mv => {
      const [x, y] = toStage(mv.clientX, mv.clientY);
      if (!dragging && Math.hypot(x - sx, y - sy) > DRAG_START) { dragging = true; clearTimeout(longT); startDrag(); }
      if (dragging) { css(e, {left: r.x + x - sx, top: r.y + y - sy}); dragOver(kind, x, y, Math.hypot(x - sx, y - sy)); }
    };
    const startDrag = () => {
      sfx('pickup');
      e.style.transition = 'none'; e.classList.add('drag'); e.style.transform = 'scale(1.12) rotate(-4deg)';
      e.style.boxShadow = kind === 'hand' ? '0 0 0 3px #fff, 6px 14px 0 3px rgba(43,33,64,.5)' : '0 0 0 4px #fff, 6px 14px 0 4px rgba(43,33,64,.5)';
      if (kind === 'board') { S.sellZone.style.display = 'flex'; S.sellZone.innerHTML = `Sell for <span class="coin" style="position:static;width:34px;height:34px;font-size:19px">${G.me.sellValue(e._m)}</span>`; anim(S.sellZone, [{opacity: 0, transform: 'scale(.96)'}, {opacity: 1, transform: 'scale(1)'}], {duration: 160, raw: true}); }
    };
    const cleanup = () => { e.removeEventListener('pointermove', move); e.removeEventListener('pointerup', up); e.removeEventListener('pointercancel', up); clearTimeout(longT); };
    const up = async uev => {
      cleanup(); if (done) return; done = true;
      const [x, y] = toStage(uev.clientX, uev.clientY);
      e.classList.remove('drag'); e.style.boxShadow = ''; S.sellZone.style.display = 'none'; S.sellZone.style.opacity = ''; S.sellZone.style.transform = '';
      if (!dragging) { e.style.transform = kind === 'hand' ? e.style.transform : ''; return onTap(kind, e); }
      e.style.transform = '';
      await onDrop(kind, e, x, y, Math.hypot(x - sx, y - sy));
    };
    e.addEventListener('pointermove', move); e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up);
  });
}
const FOLLOWER = () => CARD['Follower'] || {name: 'Follower', tribe: 'Philosopher', tier: 1, atk: 1, hp: 1, art: 'follower', fit: 13, html: 'A loyal disciple.', full_html: 'A loyal disciple.', text: '', flavour: ''};
function showDetailFor(kind, e, look = false) {
  const me = G.me;
  if (kind === 'feed') { const f = e._f; return showDetail(f.card, {atk: f.card.atk + f.a, hp: f.card.hp + f.h}, look ? [] : [{label: 'Hire', cost: costOf(f), fn: () => buy(f), disabled: me.gold[0] < costOf(f) || (G.hand.length >= 10 && !tripleReady(f.card))}]); }
  if (kind === 'hand') { const h = e._h; return showDetail(h.card, {atk: h.card.atk * (h.golden ? 2 : 1) + h.a, hp: h.card.hp * (h.golden ? 2 : 1) + h.h, golden: h.golden}, look ? [] : [{label: 'Play', fn: () => playCard(h, null), disabled: !me.canConnect(h.card) && me.board.length >= 7 && !(!h.golden && me.board.filter(m => m.name === h.card.name && !m.golden && !m.follower).length >= 2)}]); }
  const m = e._m, card = m.follower ? FOLLOWER() : CARD[m.name] || FOLLOWER();
  const acts = [{label: 'Sell', cost: '+' + me.sellValue(m), color: '#ffc928', fn: () => sell(m)}];
  const gk = me.gigOf(m);
  if (gk) {
    const tg = me.gigTargets(m), left = me.gigsLeft(m), k = (1 + (m.bp || 0)) * m.g;
    const hint = {'Side Hustle': `choose a Hustler for +${3 * m.g}/+${3 * m.g}`, 'Task Rabbit': 'choose a minion for Out of Office', 'Battle Pass': `choose a minion for +${k}/+${k}`}[gk] || '';
    const run = async t => { const g0 = me.gold[0]; me.sideGig(m, t); RUN.act('gig', m.name); sfx('buy'); goldTick(me.gold[0] - g0); renderAll(); await playLog(); if (me.pending.length) await handlePending(); };
    acts.push({label: me.gigLimit() > 1 ? `Side Gig (${Math.max(0, left)} left)` : 'Side Gig', cost: me.gigCost(m), color: '#2fd0d0', disabled: !me.canGig(m), fn: () => tg ? chooseTarget(tg, `Side Gig: ${hint}`, run, () => {}) : run(null)});
  }
  if (me.likes > 0) acts.push({label: 'Give a Like', color: '#ff8ab8', fn: async () => { me.giveLike(m); sfx('like'); renderAll(); await playLog(); }});
  showDetail(card, m, look ? [] : acts);
}
function boardIndexAt(x) { const n = G.me.board.length + 1; let best = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.abs(boardX(i, n) + HALF() - x); if (d < bd) { bd = d; best = i; } } return best; }
let lastGap = null;
// Buying and selling need a deliberate drag: a minimum distance, and the finger clearly inside the target area.
const DRAG_START = 12, DROP_MIN = 45;
const inBoard = (x, y, from) => y > LY.boardMinY[from === 'feed' ? 'feed' : 'other'] && y < LY.boardMaxY && x > LY.x0 - 14 && x < LY.x0 + LY.w + 10;
const inSell = (x, y) => y < LY.sellMaxY && x > LY.x0 - 14 && x < LY.x0 + LY.w + 10;
function dragOver(kind, x, y, dist = 0) {
  if (kind === 'board') { const armed = inSell(x, y) && dist >= DROP_MIN; S.sellZone.style.opacity = armed ? 1 : .45; S.sellZone.style.transform = armed ? 'scale(1.02)' : 'scale(1)'; }
  const overBoard = inBoard(x, y, kind) && (kind === 'board' || dist >= DROP_MIN);
  if ((kind === 'hand' || kind === 'feed') && overBoard && G.me.board.length < 7) { const g = boardIndexAt(x); if (g !== lastGap) { lastGap = g; renderBoardOnly(g); } }
  else if (kind === 'board' && overBoard) { const others = G.me.board.filter(m => m !== S.dragM); }
  else if (lastGap !== null) { lastGap = null; renderBoardOnly(null); }
}
function renderBoardOnly(gap) {
  const me = G.me, n = me.board.length + (gap !== null ? 1 : 0);
  me.board.forEach((m, i) => { const t = S.tok.get(m.id); if (t && !t.classList.contains('drag')) { t.style.transition = 'left .2s cubic-bezier(.22,1,.36,1)'; css(t, {left: boardX(gap !== null && i >= gap ? i + 1 : i, n)}); } });
}
async function onTap(kind, e) { return showDetailFor(kind, e); }
async function onDrop(kind, e, x, y, dist = 999) {
  const far = dist >= DROP_MIN;
  const overBoard = inBoard(x, y, kind) && (kind === 'board' || far);
  const overFeed = inSell(x, y) && far;
  const overHand = y >= LY.handTop && far;
  const gap = lastGap; lastGap = null;
  if (kind === 'feed') {
    if (overBoard && (G.me.board.length < 7 || tripleReady(e._f.card) || G.me.canConnect(e._f.card))) { if (canBuy(e._f)) return buy(e._f, gap !== null ? gap : boardIndexAt(x)); }
    else if (overHand) return buy(e._f);
    renderAll(); return;
  }
  if (kind === 'hand') {
    if (overBoard) return playCard(e._h, gap !== null ? gap : boardIndexAt(x));
    if (overFeed && e._h.card.collab && G.hand.includes(e._h)) {   // a Connect card in the hand can be sold like a minion
      G.hand.splice(G.hand.indexOf(e._h), 1); G.me.gold[0] += 1; sfx('coin'); goldTick(1); G.saved = false;
    }
    renderAll(); return;
  }
  if (kind === 'board') {
    const m = e._m;
    if (overFeed) return sell(m);
    if (overBoard && G.me.board.includes(m)) { const b = G.me.board; b.splice(b.indexOf(m), 1); const n = b.length + 1; let best = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.abs(boardX(i, n) + HALF() - x); if (d < bd) { bd = d; best = i; } } b.splice(best, 0, m); }
    renderAll(); return;
  }
}

// ---------------------------------------------------------------- turn flow
async function animateTurnStart(kept) {
  G.busy = true; sfx('turn');
  const toks = [...S.feedTok.values()];
  if (kept) {
    const gl = el('div', 'wrapglare', '', S.feedSurf); anim(gl, [{left: '630px'}, {left: '-130px'}], {duration: 520, easing: 'ease-in-out', raw: true}).then(() => gl.remove());
    toks.forEach((t, i) => { anim(t, [{transform: 'translateY(0) scale(1)'}, {transform: 'translateY(-10px) scale(1.08)'}, {transform: 'translateY(0) scale(1)'}], {duration: 320, delay: 100 + i * 60, easing: 'ease-out'});
    });
  } else
  toks.forEach((t, i) => anim(t, [{transform: 'translateX(320px) rotate(20deg)', opacity: 0}, {transform: 'translateX(-6px) rotate(-3deg)', opacity: 1, offset: .75}, {transform: 'translateX(0) rotate(0)'}], {duration: 420, delay: 80 + i * 60, easing: 'ease-out', fill: 'backwards'}));
  const g = G.me.gold_from || {};
  anim(S.gold, [{transform: 'scale(.6)'}, {transform: 'scale(1.2)'}, {transform: 'scale(1)'}], {duration: 420, easing: 'ease-out'});
  const c = center(rectOf(S.gold));
  for (let i = 0; i < Math.min(8, G.me.gold[0]); i++) { const co = el('span', 'coin', '', stage); css(co, {width: 18, height: 18, left: c[0] - 9, top: -20, zIndex: 88}); anim(co, [{transform: 'translateY(0)'}, {transform: `translateY(${c[1] + 20}px)`}], {duration: 380, delay: i * 45, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards'}).then(() => co.remove()); }
  if (g.bonus) floatText(c[0], c[1] + 30, `${g.bonus > 0 ? '+' : '−'}${Math.abs(g.bonus)} bonus`, g.bonus > 0 ? 'gold' : 'red');
  if (g.carry) floatText(c[0], c[1] + 46, `+${g.carry} carried over`, 'gold');
  if (g.inv) floatText(c[0], c[1] + 46, `Invested ${g.inv}, got ${g.trade} back`, g.trade >= g.inv ? 'gold' : 'red');
  toast(`Turn ${G.me.turn}`, 1100);
  await sleep(450);
  G.busy = false;
}
async function ready() {
  if (G.busy || G.mode) return;
  G.busy = true;
  const me = G.me;
  me.spent_this_turn = me.spent - me.spent_start;
  RUN.ready();
  me.log = [];
  me.endOfTurn();
  anim(S.ready, [{transform: 'translateY(0)'}, {transform: 'translateY(6px)'}, {transform: 'translateY(0)'}], {duration: 200, raw: true}); sfx('ready');
  if (me.log.length) { renderAll(); await playLog(); await sleep(500); }
  me.log = [];
  G.firstTurn = false;
  G.lobby.botTurns();
  const rec = G.lobby.fightRound(); RUN.fight(rec);
  if (rec) await playCombat(rec); else { toast('Bye round: nobody to fight', 1400); await sleep(1200); }
  G.busy = false;
  if (G.lobby.over()) return showEnd();
  newTurn();
}

// ---------------------------------------------------------------- combat
function cX(i, n) { return LY.cx0 + (LY.cw - (n * LY.tok + (n - 1) * 20)) / 2 + i * (LY.tok + 20); }
async function playCombat(rec) {
  clear(); G.screen = 'combat'; bg(false); AU.music('review'); sfx('fightstart'); applyLayout(true); const ff = LY.ff;
  if (ff) css(el('div', 'ffpaper', '', stage), {left: -EXT.l, top: 44, width: W + EXT.l + EXT.r, height: 420});
  // a ghost (the board of a player who is already out) has no health of its own: mark it so the badge shows a dash, not NaN
  const f = rec.fight, opp = rec.b || Object.assign({ghost: true}, rec.ghost), oppHero = opp.hero;
  const Cm = {els: new Map(), side: new Map()};
  _ce = Cm.els;
  const surfE = el('div', 'surf', '', stage); css(surfE, {left: LY.cx0, top: LY.cTop[0], width: LY.cw, height: LY.rowH, borderRadius: '24px', background: '#eeeaf5'});
  const surfM = el('div', 'surf desk', '', stage); css(surfM, {left: LY.cx0, top: LY.cTop[1], width: LY.cw, height: LY.rowH, borderRadius: '24px'});
  const oav = el('div', 'av-big', `<img src="${ART[oppHero] || ART.follower}" alt="">`, stage); css(oav, {left: 16, top: 12, width: 70, height: 70});
  // every fight of the round is already resolved, so show health as it was before this one (and never below 0)
  const hpOf = (p, before) => Math.max(0, p.health + p.boundaries + (before && rec.loser === p ? rec.dmg : 0));
  const ohp = el('div', 'badge', `${opp.ghost ? '—' : hpOf(opp, true)}`, stage); css(ohp, {left: 60, top: 56, width: 40, height: 30, fontSize: '17px'});
  oav.title = (opp.ghost ? 'Ghost of ' : '') + (HERO[oppHero] ? HERO[oppHero].name : opp.name);
  const otier = el('div', 'tierpill', `${STAR(13)}<span>${opp.tier || 1}</span>`, stage); css(otier, {left: 60, top: 2}); otier.title = `Tier ${opp.tier || 1}`; edge('l', otier);
  const mav = el('div', 'av-big', `<img src="${ART[G.heroSlug]}" alt="">`, stage); css(mav, {left: 16, top: 290, width: 88, height: 88});
  const mhp = el('div', 'badge', `${hpOf(G.me, true)}`, stage); css(mhp, {left: 72, top: 346, width: 42, height: 34, fontSize: '20px'});
  const rnd = el('div', 'info', `Round ${G.lobby.turn}`, stage); css(rnd, {left: ff ? 576 : 640, top: ff ? 8 : 20, width: 92, height: 34, borderRadius: '999px', fontSize: '15px'});
  const spd = el('button', 'btn', SP.v === 1 ? '1×' : '2×', stage); css(spd, ff ? {left: 680, top: 6, width: 64, height: 36, fontSize: '16px'} : {left: 750, top: 18, width: 76, height: 40, fontSize: '17px'});
  spd.onclick = () => { SP.v = SP.v === 1 ? 2 : 1; spd.textContent = SP.v === 1 ? '1×' : '2×'; };
  let skip = false;
  const sk = el('button', 'btn', 'Skip', stage); css(sk, ff ? {left: 756, top: 6, width: 76, height: 36, fontSize: '15px'} : {left: 750, top: 72, width: 76, height: 40, fontSize: '15px'}); sk.onclick = () => { skip = true; };
  edge('l', oav, ohp, mav, mhp); edge('r', spd, sk, rnd);
  const say = () => {};
  const layer = el('div', 'ab', '', stage); css(layer, {left: 0, top: 0, width: W, height: H, pointerEvents: 'none'});
  // tap a minion or a hero to inspect it; the fight pauses while the details are open
  G.cPaused = false;
  const resume = () => { G.cPaused = false; };
  layer.addEventListener('click', e => {
    const t = e.target.closest('.tok'); if (!t || !t._snap || G.cPaused) return;
    const m = t._snap, card = m.follower ? FOLLOWER() : CARD[m.name] || FOLLOWER();
    G.cPaused = true; showDetail(card, {atk: m.atk, hp: Math.max(0, m.hp), golden: m.golden, extras: m.extras || []}, [], resume);
  });
  oav.onclick = () => { if (!G.cPaused && HERO[oppHero]) { G.cPaused = true; showHeroDetail(oppHero, resume); } };
  mav.onclick = () => { if (!G.cPaused) { G.cPaused = true; showHeroDetail(G.heroSlug, resume); } };
  const held = async () => { while (G.cPaused && !skip) await new Promise(r => setTimeout(r, 80)); };
  const sideOf = k => k === 0 ? 1 : 0;  // fight side 0 = me (row 1)
  const nameOf = id => { for (const b of cur) { const m = b.find(x => x.id === id); if (m) return m.name; } return ''; };
  let cur = [[], []];
  function place(boards, opts = {}) {
    const ids = new Set();
    boards.forEach((b, k) => {
      const row = sideOf(k);
      b.forEach((m, i) => {
        let t = Cm.els.get(m.id); ids.add(m.id);
        const prev = cur[k].find(x => x.id === m.id);
        const o = {hurt: prev ? false : false};
        if (!t) {
          t = makeToken(m); layer.appendChild(t); Cm.els.set(m.id, t); t.style.cursor = 'pointer';
          css(t, {left: cX(i, b.length), top: LY.cY[row]});
          if (opts.pop !== false) anim(t, [{transform: 'scale(0)'}, {transform: 'scale(1.2)', offset: .6}, {transform: 'scale(1)'}], {duration: 320, easing: 'ease-out'});
        } else {
          const [da, dh] = updateToken(t, m);
          if (opts.floats !== false && (da > 0 || dh > 0)) { const c = center(rectOf(t)); floatText(c[0], c[1] - 30, `+${Math.max(0, da)}/+${Math.max(0, dh)}`); }
        }
        t.style.transition = `left ${380 / SP.v}ms cubic-bezier(.22,1,.36,1), top ${380 / SP.v}ms`;
        css(t, {left: cX(i, b.length), top: LY.cY[row]}); t._snap = m;
      });
    });
    cur = boards;
  }
  place(f.frames[0].boards, {pop: false});
  // intro: boards slide in
  [...Cm.els.values()].forEach(t => { const top = parseFloat(t.style.top) < 150; anim(t, [{transform: `translateY(${top ? -160 : 160}px)`}, {transform: 'translateY(0)'}], {duration: 420, easing: 'cubic-bezier(.34,1.3,.64,1)', delay: Math.random() * 120}); });
  await sleep(600);
  for (let fi = 1; fi < f.frames.length; fi++) {
    const fr = f.frames[fi];
    if (skip) { continue; }
    await held();
    if (fr.type === 'soc') {
      const s = Cm.els.get(fr.src);
      if (s) { sfx(fr.kind === 'give' ? 'sparkle' : fr.kind === 'summon' ? 'summon' : fr.kind === 'self' ? 'trigger' : 'charge');
        await anim(s, [{transform: 'scale(1)', filter: 'brightness(1)'}, {transform: 'scale(1.22)', filter: 'brightness(1.35)'}, {transform: 'scale(1)', filter: 'brightness(1)'}], {duration: 420});
        if (fr.kind === 'shot' || fr.kind === 'sweep') sfx('zap');
        say(`Start of combat · ${nameOf(fr.src)}`);
        const sc = center(rectOf(s));
        await Promise.all((fr.tgts || []).map(id => { const t = Cm.els.get(id); return t ? streak(sc, center(rectOf(t)), fr.kind === 'give' ? '#2ecb6e' : '#ff6b5e', 420) : null; }));
      }
      diffBursts(cur, fr.boards); place(fr.boards); await sleep(480);
    } else if (fr.type === 'attack') {
      const a = Cm.els.get(fr.att), t = Cm.els.get(fr.tgt);
      say(`${nameOf(fr.att)} attacks ${nameOf(fr.tgt)}`, true);
      if (a && t) {
        const ra = rectOf(a), rt = rectOf(t), dx = rt.x - ra.x, dy = rt.y - ra.y;
        a.style.zIndex = 20;
        a.getAnimations().forEach(x => x.cancel()); sfx('windup');
        const lunge = `translate(${dx * .82}px,${dy * .78}px) scale(1.1) rotate(6deg)`;
        const A = a.animate([{transform: 'translate(0,0) scale(1)'}, {transform: `translate(${-dx * .06}px,${-dy * .12}px) scale(.92) rotate(-5deg)`, offset: .3},
          {transform: lunge, offset: .55, easing: 'cubic-bezier(.34,1.3,.64,1)'}, {transform: lunge, offset: .62}, {transform: 'translate(0,0) scale(1)'}], {duration: 667 / SP.v, easing: 'ease-in-out'});
        if (fxOn('neon')) streak(center(ra), center(rt), '#ff3df2', 300);
        await sleep(367);
        sfx('hit', {n: fr.da || 1, gap: 0});
        anim(t, [{transform: 'translate(0,0)'}, {transform: 'translate(-6px,3px) rotate(-5deg)'}, {transform: 'translate(5px,-2px) rotate(4deg)'}, {transform: 'translate(0,0)'}], {duration: 320});
        anim(stage, [{transform: `scale(${SCALE}) translate(0,0)`}, {transform: `scale(${SCALE}) translate(2px,-2px)`}, {transform: `scale(${SCALE}) translate(-2px,1px)`}, {transform: `scale(${SCALE}) translate(0,0)`}], {duration: 220});
        diffBursts(cur, fr.boards);
        place(fr.boards, {floats: false});
        await A.finished.catch(() => {});
        a.style.zIndex = '';
        await sleep(173);
      } else place(fr.boards);
    } else if (fr.type === 'death') {
      const t = Cm.els.get(fr.id);
      if (t) { sfx('death'); Cm.els.delete(fr.id); t.style.transition = 'none'; t.style.filter = 'grayscale(1)'; if (fxOn('confetti')) { const cc = center(rectOf(t)); confetti(cc[0], cc[1], 22); }
        anim(t, [{transform: 'rotate(0) translateY(0)', opacity: 1}, {transform: 'rotate(-14deg) translateY(-8px)', opacity: 1, offset: .3}, {transform: 'rotate(24deg) translateY(60px)', opacity: 0}], {duration: 380, easing: 'ease-in', fill: 'forwards'}).then(() => t.remove());
        const c = center(rectOf(t)); for (let i = 0; i < 5; i++) { const p = el('div', '', '', stage); css(p, {position: 'absolute', left: c[0], top: c[1] + 20, width: 12, height: 12, borderRadius: '50%', background: '#e6dccb', border: '2px solid #2b2140', zIndex: 83, pointerEvents: 'none'}); anim(p, [{transform: 'translate(0,0) scale(1)', opacity: 1}, {transform: `translate(${(i - 2) * 16}px,${-10 - Math.random() * 14}px) scale(.3)`, opacity: 0}], {duration: 420}).then(() => p.remove()); }
      }
      cur = cur.map(b => b.filter(x => x.id !== fr.id));
      await sleep(420); place(fr.boards); await sleep(200);
    } else if (fr.type === 'legacy') {
      sfx('legacy');
      say(`Legacy · ${fr.name}`);
      const row = sideOf(fr.side), g = el('img', '', null, layer); g.src = artOf(fr.name);
      css(g, {position: 'absolute', left: 380, top: LY.cY[row] - 10, width: 84, height: 84, opacity: .7, filter: 'grayscale(.4) brightness(1.4)', pointerEvents: 'none'});
      await anim(g, [{transform: 'translateY(0) scale(.8)', opacity: .8}, {transform: 'translateY(-40px) scale(1.1)', opacity: 0}], {duration: 420}); g.remove();
      place(fr.boards); await sleep(160);
    } else if (fr.type === 'summon' || fr.type === 'rebrand' || fr.type === 'trigger') {
      sfx(fr.type === 'trigger' ? 'trigger' : fr.type === 'rebrand' ? 'rebrand' : 'summon');
      if (fr.type === 'trigger') { const s = Cm.els.get(fr.src); if (s) { const c = center(rectOf(s)); ring(c[0], c[1], '#4fd1c5', 90); say(`${nameOf(fr.src)} triggers`); } }
      if (fr.type === 'rebrand') say('Rebrand!');
      place(fr.boards); await sleep(420);
    } else if (fr.type === 'hero') {
      const av = sideOf(fr.side) === 1 ? mav : oav, h = HERO[fr.hero]; sfx('power');
      const c = center(rectOf(av));
      anim(av, [{transform: 'scale(1) rotate(0)'}, {transform: 'scale(1.18) rotate(-6deg)'}, {transform: 'scale(1) rotate(0)'}], {duration: 420});
      ring(c[0], c[1], '#2fd0d0', 110);
      if (h) floatText(c[0] + 40, c[1] - 40, h.power, '');
      await Promise.all((fr.tgts || []).map(id => { const t = Cm.els.get(id); return t ? streak(c, center(rectOf(t)), '#2fd0d0', 380) : null; }));
      place(fr.boards); await sleep(380);
    } else if (fr.type === 'first') {
      toast(fr.side === 0 ? 'You attack first' : 'They attack first', 1000);
      await sleep(700);
    } else if (fr.type === 'end') { place(fr.boards); }
  }
  if (skip) { place(f.frames[f.frames.length - 1].boards, {floats: false}); for (const [id, t] of Cm.els) if (!f.frames[f.frames.length - 1].boards.some(b => b.some(m => m.id === id))) { t.remove(); Cm.els.delete(id); } }
  await sleep(300);
  await held();
  // hero damage: survivors wind up together, then dive at the losing hero one after another
  const won = rec.winner === G.me, lost = rec.loser === G.me;
  const survRow = won ? 1 : 0, targetAv = won ? oav : mav;
  if (rec.dmg && (won || lost)) {
    const sv = [...Cm.els.values()].filter(t => Math.abs(parseFloat(t.style.top) - LY.cY[survRow]) < 5);
    const tc = center(rectOf(targetAv));
    sv.forEach(t => t.getAnimations().forEach(x => x.cancel()));
    const up = survRow === 1 ? -1 : 1; sfx('charge');
    await Promise.all(sv.map((t, i) => anim(t, [{transform: 'translateY(0) scale(1)', filter: 'brightness(1)'}, {transform: `translateY(${up * 22}px) scale(1.16) rotate(${i % 2 ? 6 : -6}deg)`, filter: 'brightness(1.25) drop-shadow(0 0 8px #ff6b5e)', offset: .7}, {transform: `translateY(${up * 16}px) scale(1.12)`, filter: 'brightness(1.2) drop-shadow(0 0 6px #ff6b5e)'}], {duration: 380, delay: i * 50, easing: 'ease-out', fill: 'forwards'})));
    const hits = sv.map((t, i) => new Promise(res => setTimeout(() => {
      const r = rectOf(t), dx = tc[0] - r.x - HALF(), dy = tc[1] - r.y - HALF();
      t.style.zIndex = 30; t.getAnimations().forEach(x => x.cancel());
      const A = t.animate([{transform: `translateY(${up * 16}px) scale(1.12) rotate(0)`},
        {transform: `translate(${dx * .5}px,${dy * .5 + up * 90}px) scale(1.05) rotate(-200deg)`, offset: .4},
        {transform: `translate(${dx}px,${dy}px) scale(.62,.82) rotate(-360deg)`, offset: .55, easing: 'ease-out'},
        {transform: `translate(${dx * .8}px,${dy * .8}px) scale(.9) rotate(-360deg)`, offset: .66},
        {transform: 'translate(0,0) scale(1) rotate(-360deg)'}], {duration: 760 / SP.v, easing: 'cubic-bezier(.45,0,.55,1)'});
      setTimeout(() => {
        sfx('hit', {n: 10, gap: 0});
        anim(targetAv, [{transform: 'translate(0,0) scale(1)'}, {transform: 'translate(-8px,5px) scale(.9) rotate(-6deg)'}, {transform: 'translate(6px,-3px) scale(1.04) rotate(4deg)'}, {transform: 'translate(0,0) scale(1)'}], {duration: 260});
        ring(tc[0], tc[1], '#ff6b5e', 120);
        const fl = el('div', 'hitflash', '', stage); css(fl, {left: tc[0] - 44, top: tc[1] - 44, width: 88, height: 88});
        anim(fl, [{opacity: .85}, {opacity: 0}], {duration: 300}).then(() => fl.remove());
        for (let k = 0; k < 6; k++) { const sp = el('div', '', '', stage); const ang = Math.random() * Math.PI * 2, d = 40 + Math.random() * 40;
          css(sp, {position: 'absolute', left: tc[0] - 5, top: tc[1] - 5, width: 10, height: 10, background: '#ffc928', border: '2px solid #2b2140', borderRadius: '2px', zIndex: 88, pointerEvents: 'none'});
          anim(sp, [{transform: 'translate(0,0) rotate(0)', opacity: 1}, {transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) rotate(180deg)`, opacity: 0}], {duration: 380, easing: 'ease-out'}).then(() => sp.remove()); }
        anim(stage, [{transform: `scale(${SCALE}) translate(0,0)`}, {transform: `scale(${SCALE}) translate(4px,-3px)`}, {transform: `scale(${SCALE}) translate(-3px,2px)`}, {transform: `scale(${SCALE}) translate(0,0)`}], {duration: 200});
      }, 0.55 * 760 / SP.v);
      A.finished.catch(() => {}).then(() => { t.style.zIndex = ''; t.style.filter = ''; res(); });
    }, i * 150 / SP.v)));
    await sleep(0.55 * 760 + (sv.length - 1) * 150);
    burstAt(tc[0] + 24, tc[1] - 24, `−${rec.dmg}`); sfx('heroslam');
    if (lost) mhp.textContent = hpOf(G.me, false); else ohp.textContent = opp.ghost ? '—' : hpOf(opp, false);
    anim(lost ? mhp : ohp, [{transform: 'scale(1.7)'}, {transform: 'scale(1)'}], {duration: 360, easing: 'cubic-bezier(.34,1.56,.64,1)'});
    await Promise.all(hits);
    await sleep(700);
  } else await sleep(500);
  trackCombat(rec);
}
function trackCombat(rec) {
  const me = G.me, f = rec.fight, won = rec.winner === me;
  PROF.stats.deaths += f.frames.filter(x => x.type === 'death' && x.side === 0).length;
  G.streak = won ? (G.streak || 0) + 1 : 0;
  if (G.streak >= 3) PROF.flags.streak3 = true;
  if (won) {
    const tribes = new Set(me.board.filter(m => !m.follower && m.tribe !== 'Neutral').map(m => m.tribe));
    if (tribes.size >= 4) PROF.flags.fourTribes = true;
    if (me.board.length <= 3 && G.lobby.turn >= 6) PROF.flags.small = true;
    if (me.health > 0 && me.health <= 3) PROF.flags.bunker = true;
  }
  if (new Set(me.board.filter(m => !m.follower && m.tribe !== 'Neutral').map(m => m.tribe)).size >= 5) PROF.flags.fiveTribes = true;
  G.minHealth = Math.min(G.minHealth ?? 99, me.health);
  checkUnlocks();
}
function diffBursts(prev, next) {
  // simpler: compute per-id hp loss and shield pops
  const all = new Map(); prev.forEach(b => b.forEach(m => all.set(m.id, m)));
  next.forEach(b => b.forEach(m => {
    const p = all.get(m.id); if (!p) return;
    const tEl = findTok(m.id); if (!tEl) return;
    const c = center(rectOf(tEl));
    if (p.shield && !m.shield) { sfx('pop'); ring(c[0], c[1], '#8fd4ff', 90); floatText(c[0], c[1] - 34, 'OOO!', ''); }
    if (m.hp < p.hp) { burstAt(c[0] + 14, c[1] - 14, `−${p.hp - m.hp}`); if (fxOn('pow')) floatText(c[0] - 18, c[1] - 30, ['POW!', 'BAM!', 'BONK!', 'WHAM!', 'OOF!'][Math.floor(Math.random() * 5)], 'pow'); }
  }));
  prev.forEach(b => b.forEach(p => { if (!next.some(nb => nb.some(m => m.id === p.id))) { const t = findTok(p.id); if (t) { const c = center(rectOf(t)); burstAt(c[0] + 14, c[1] - 14, '✕'); } } }));
}
function findTok(id) { return CombatEls().get(id); }
let _ce = null; function CombatEls() { return _ce || new Map(); }
// ---------------------------------------------------------------- end of run
// ---------------------------------------------------------------- run log, stats page and save codes
// Every run is recorded turn by turn (state at Ready, actions, fight result) and kept on the phone: the last 30 runs.
// The Stats page shows what the log says about how you play; the save code copies the whole profile (rating, unlocks,
// pool, logs) as text, to restore on another phone.
const RUN = {
  cur: null, t: null,
  start() { this.cur = {v: 1, at: Date.now(), hero: G.heroSlug, tribes: G.tribes.slice(), rating: PROF.rating, turns: []}; },
  turn() { if (!this.cur) return; const me = G.me; this.t = {n: me.turn, hp: me.health, bd: me.boundaries, tier: me.tier, gold: me.gold[0], buy: [], sell: [], roll: 0, lvl: 0}; this.cur.turns.push(this.t); },
  act(k, name) { const t = this.t; if (!t) return; if (k === 'roll') t.roll++; else if (k === 'level') t.lvl++; else t[k].push(name); },
  ready() { const t = this.t; if (!t) return; const me = G.me; t.left = me.gold[0]; t.tierEnd = me.tier; t.saved = !!G.saved;
    t.board = me.board.map(m => [m.name, m.atk, m.hp, m.golden ? 1 : 0]); t.hand = G.hand.map(h => h.card.name); },
  fight(rec) { const t = this.t; if (!t) return; if (!rec) { t.res = 'bye'; return; } const me = G.me; t.res = rec.winner === me ? 'W' : rec.loser === me ? 'L' : 'D'; t.dmg = rec.dmg; t.opp = (rec.a === me ? rec.b : rec.a) ? (rec.a === me ? rec.b : rec.a).hero : 'ghost'; },
  /** Small per-run summary kept for every game (the full logs keep only the last 30): tier turns, actions, tribe, hired cards. */
  summary() {
    const r = this.cur; if (!r || !r.turns.length) return {};
    const lv = [3, 4, 5, 6].map(t => { const x = r.turns.find(q => (q.tierEnd || q.tier) >= t); return x ? x.n : 0; });
    let h = 0, ro = 0, se = 0; const c = {};
    for (const x of r.turns) { h += x.buy.length; ro += x.roll; se += x.sell.length; for (const n of x.buy) c[n] = (c[n] || 0) + 1; }
    const last = [...r.turns].reverse().find(x => x.board && x.board.length), tc = {};
    if (last) for (const [n] of last.board) { const k = CARD[n] && CARD[n].tribe; if (k && k !== 'Neutral') tc[k] = (tc[k] || 0) + 1; }
    const tr = (Object.entries(tc).sort((a, b) => b[1] - a[1])[0] || [null])[0];
    return {lv, n: r.turns.length, h, ro, se, tr, c};
  },
  end(place, d) { if (!this.cur) return; this.cur.place = place; this.cur.d = d; PROF.runs = (PROF.runs || []).concat([this.cur]).slice(-30); this.cur = this.t = null; saveProfile(); },
};
function statsButton(x, y) {
  const b = el('button', 'tribebtn', ico('<path d="M5 20V12M10 20V6M15 20v-9M20 20V9" stroke-width="3"></path>', 22, 2.4), stage);
  css(b, {left: x, top: y, display: 'flex', padding: '5px'}); b.setAttribute('aria-label', 'Stats and backup'); b.onclick = () => showStats();
}
function playStyle(runs) {
  const lv = [[], [], [], []]; let h = 0, ro = 0, se = 0, n = 0; const tribes = {}, cards = {};
  for (const r of runs) {
    if (!r.lv) continue;
    r.lv.forEach((t, i) => { if (t) lv[i].push(t); }); h += r.h; ro += r.ro; se += r.se; n += r.n;
    if (r.tr) tribes[r.tr] = (tribes[r.tr] || 0) + 1;
    for (const k in r.c) cards[k] = (cards[k] || 0) + r.c[k];
  }
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  return {lv: lv.map(avg), hires: n ? h / n : null, rolls: n ? ro / n : null, sells: n ? se / n : null,
    tribe: (Object.entries(tribes).sort((a, b) => b[1] - a[1])[0] || [null])[0], cards: Object.entries(cards).sort((a, b) => b[1] - a[1]).filter(([k]) => CARD[k]).slice(0, 5)};
}
function placeChart(rec) {
  if (!rec.length) return '<p class="kwl" style="color:#5a5270;margin-top:30px">Play a run to see it here.</p>';
  if (rec.length <= 50) {   // bars: taller is better
    const lab = rec.length <= 20;
    return `<div class="bars${lab ? '' : ' thin'}">${rec.map(r => `<span style="height:${(9 - r.place) * 10}px;background:${r.place === 1 ? '#ffc928' : r.place <= 4 ? '#2ecb6e' : '#c9c2d6'}">${lab ? `<em>${r.place}</em>` : ''}</span>`).join('')}</div>`;
  }
  // all games: rolling average place as a line (1st at the top), with the top-4 zone shaded
  const W2 = 436, H2 = 68, k = Math.max(5, Math.round(rec.length / 25)), pts = [];
  for (let i = 0; i < rec.length; i++) { const w = rec.slice(Math.max(0, i - k + 1), i + 1); pts.push(w.reduce((a, r) => a + r.place, 0) / w.length); }
  const x = i => 4 + (W2 - 8) * i / Math.max(1, pts.length - 1), y = v => 4 + (H2 - 8) * (v - 1) / 7;
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return `<svg class="line" width="${W2}" height="${H2 + 14}" viewBox="0 0 ${W2} ${H2 + 14}" aria-label="Average place over ${rec.length} games">
    <rect x="0" y="${y(1) - 4}" width="${W2}" height="${y(4.5) - y(1) + 4}" rx="8" fill="#e3f7ea"></rect>
    ${[1, 4, 8].map(v => `<text x="${W2 - 2}" y="${y(v) + 4}" text-anchor="end" font-size="10" font-weight="800" fill="#5a5270">${v}</text>`).join('')}
    <path d="${d}" fill="none" stroke="#2b2140" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></path>
    <text x="4" y="${H2 + 12}" font-size="10" font-weight="800" fill="#5a5270">game 1</text><text x="${W2 - 2}" y="${H2 + 12}" text-anchor="end" font-size="10" font-weight="800" fill="#5a5270">game ${rec.length}</text></svg>`;
}
function showStats(range = 10) {
  clear(); G.screen = 'stats'; bg(true); AU.music('hold');
  const t = el('div', 'ab bd', 'Stats', stage); css(t, {left: 30, top: 12, fontSize: '22px', background: '#fff', border: '3px solid #2b2140', borderRadius: '999px', padding: '6px 16px 2px', boxShadow: '0 0 0 3px #fff'});
  const tabs = el('div', 'ab logtabs statrange', '', stage); css(tabs, {left: 132, top: 15});
  for (const [v, lab] of [[10, 'Last 10'], [20, '20'], [50, '50'], [0, 'All']]) { const b = el('button', 'logtab' + (v === range ? ' on' : ''), lab, tabs); b.onclick = () => { if (v !== range) { sfx('pop'); showStats(v); } }; }
  const back = el('button', 'btn', 'Back', stage); css(back, {left: 734, top: 10, width: 90, height: 40, fontSize: '17px'}); back.onclick = showTitle;
  const sv = el('button', 'btn', ico('<path d="M12 4v10M7 10l5 5 5-5M5 19h14" stroke-width="2.8"></path>', 20) + 'Save code', stage); css(sv, {left: 572, top: 10, width: 148, height: 40, fontSize: '16px', background: '#ffc928'}); sv.onclick = showBackup;
  const all = PROF.history || [], rec = range ? all.slice(-range) : all, n = rec.length;
  const pct = x => n ? Math.round(100 * x / n) + '%' : '–', ap = n ? (rec.reduce((a, r) => a + r.place, 0) / n).toFixed(1) : '–';
  const b = bracketOf(PROF.rating);
  const tiles = el('div', 'ab stattiles', `<div class="tile wide"><span class="rk" style="background:${b[2]}">${STAR(20)}</span><div><b>${PROF.rating.toLocaleString('en')}</b><i>${b[1]} · best ${PROF.peak.toLocaleString('en')}</i></div></div>
    <div class="tile"><b>${n}</b><i>runs</i></div><div class="tile"><b>${ap}</b><i>average place</i></div>
    <div class="tile"><b>${pct(rec.filter(r => r.place <= 4).length)}</b><i>top 4</i></div><div class="tile"><b>${pct(rec.filter(r => r.place === 1).length)}</b><i>wins</i></div>`, stage);
  css(tiles, {left: 30, top: 66, width: 300});
  const chart = el('div', 'ab panel statchart', `<p class="bd">${!n ? "No runs yet" : range ? `Last ${n} runs` : `All ${n} runs · average place`}</p>${placeChart(rec)}`, stage);
  css(chart, {left: 346, top: 66, width: 468, height: 122});
  const ps = playStyle(rec), f = x => x == null ? '–' : x.toFixed(1);
  const g = x => x == null ? '–' : (+x.toFixed(1)).toString();
  const how = el('div', 'ab panel stathow', `<div class="hhead"><p class="bd">How you play</p>${ps.tribe ? `<span class="ftribe"><i>Favourite</i><span class="dot" style="background:${TC[ps.tribe]}"></span>${TP[ps.tribe] || ps.tribe}</span>` : ''}</div>
    <div class="hrow"><i>Promoted</i><div class="cells">${[3, 4, 5, 6].map((tt, i) => `<div class="cell lv"><span class="tierpill sm">${STAR(10)}${tt}</span><b>${ps.lv[i] == null ? '–' : '<small>turn</small> ' + g(ps.lv[i])}</b></div>`).join('')}</div></div>
    <div class="hrow"><i>Each turn</i><div class="cells">${[[ps.hires, 'hires'], [ps.rolls, 'Scrolls'], [ps.sells, 'sells']].map(([v, l]) => `<div class="cell"><b>${g(v)}</b><small>${l}</small></div>`).join('')}</div></div>
    <div class="hrow favs"><i>Most hired</i></div>`, stage);
  css(how, {left: 346, top: 198, width: 468, height: 178});
  const favs = how.querySelector('.favs');
  if (!ps.cards.length) el('span', 'none', '–', favs);
  for (const [name, k] of ps.cards) {
    const c = CARD[name], bt = el('button', 'fav', `<span class="pic" style="${tribeBgCss(c.tribe, c.tribe2)}"><img src="${ART[c.art]}" alt=""></span><span class="cnt">×${k}</span>`, favs);
    bt.setAttribute('aria-label', `${name}, hired ${k} times`); bt.title = name; bt.onclick = () => showDetail(c, null);
  }
}
async function packSave() {
  const json = JSON.stringify(PROF);
  try { const cs = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')); const buf = new Uint8Array(await new Response(cs).arrayBuffer());
    let bin = ''; for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode(...buf.subarray(i, i + 8192)); return 'LS1:' + btoa(bin);
  } catch (e) { return 'LS0:' + btoa(unescape(encodeURIComponent(json))); }
}
async function unpackSave(code) {
  code = code.trim().replace(/\s+/g, '');
  if (code.startsWith('LS0:')) return JSON.parse(decodeURIComponent(escape(atob(code.slice(4)))));
  if (!code.startsWith('LS1:')) throw new Error('not a save code');
  const bin = atob(code.slice(4)), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return JSON.parse(await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
}
async function showBackup() {
  sfx('open');
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 99}); el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.82)';
  const p = el('div', 'panel backup', '', ov); css(p, {left: 92, top: 22, width: 660, height: 346});
  const code = await packSave();
  p.innerHTML = `<p class="bd" style="margin:0;font-size:22px">Your save code</p>
    <p class="hint">Everything in one line: rating, heroes, cards, card pool and run logs. Keep it somewhere safe, or paste it on a new phone.</p>
    <div class="row"><textarea class="code" readonly aria-label="Save code">${code}</textarea><button class="btn copy">Copy</button></div>
    <p class="bd" style="margin:14px 0 0;font-size:18px">Restore from a code</p>
    <div class="row"><textarea class="code in" placeholder="Paste a save code" aria-label="Paste a save code"></textarea><button class="btn load">Restore</button></div>
    <p class="hint warn"></p><button class="btn close">Close</button>`;
  const ta = p.querySelector('.code'), warn = p.querySelector('.warn');
  p.querySelector('.copy').onclick = async () => { try { await navigator.clipboard.writeText(code); } catch (e) { ta.select(); document.execCommand('copy'); } sfx('coin'); toast('Save code copied'); };
  p.querySelector('.load').onclick = async () => {
    const lb = p.querySelector('.load');
    try {
      const d = await unpackSave(p.querySelector('.in').value);
      if (d.rating == null) throw new Error('bad');
      if (lb.dataset.sure !== '1') { lb.dataset.sure = '1'; lb.textContent = 'Replace?'; lb.style.background = '#ff6b5e'; warn.textContent = `This replaces your current save (${PROF.rating.toLocaleString('en')} rating) with one at ${d.rating.toLocaleString('en')}. Tap again to confirm.`; return; }
      localStorage.setItem(PKEY, JSON.stringify(d)); location.reload();
    } catch (e) { sfx('error'); warn.textContent = 'That code could not be read. Copy the whole line, including LS1: at the start.'; }
  };
  p.querySelector('.close').onclick = () => ov.remove(); ov.querySelector('.dim').onclick = () => ov.remove();
  anim(p, [{transform: 'translateY(30px) scale(.96)', opacity: 0}, {transform: 'translateY(0) scale(1)', opacity: 1}], {duration: 240, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
}

// ---------------------------------------------------------------- card change log

// Data: game/changelog.js (tools/changelog.py). Each change shows the card face before and after.
const LOG = window.LS_CHANGELOG || [];
const LOGICO = (s = 22) => ico('<rect x="5" y="3" width="14" height="18" rx="2.5" fill="#ffffff"></rect><path d="M9 8h6M9 12h6M9 16h3.5"></path>', s, 2.4);
const logUnseen = () => LOG.length && PROF.seenLog !== LOG[0].v;
function changelogButton(x, y) {
  const b = el('button', 'tribebtn', LOGICO(), stage); css(b, {left: x, top: y, display: 'flex', padding: '5px'}); b.setAttribute('aria-label', 'Card changes');
  if (logUnseen()) { const d = el('span', 'ab', '', b); css(d, {right: -4, top: -5, width: 14, height: 14, borderRadius: '50%', background: '#ff6b5e', border: '2.5px solid #2b2140'}); }
  b.onclick = () => { b.querySelector('span') && b.querySelector('span').remove(); showChangelog(); };
  return b;
}
function logCard(name, c, mark) {
  const w = el('div', 'logcard'); w.innerHTML = cardHTML(Object.assign({name}, c));
  for (const [k, sel] of [['atk', '.sa'], ['hp', '.sh']]) if (mark && mark[k] != null && mark[k] !== c[k]) w.querySelector(sel).classList.add(c[k] > mark[k] ? 'up' : 'down');
  if (mark && mark.tier !== c.tier) w.querySelector('.stars').classList.add('chg');
  if (mark && mark.html !== c.html) w.querySelector('.txt').classList.add('chg');
  return w;
}
function showChangelog() {
  if (LOG.length) { PROF.seenLog = LOG[0].v; saveProfile(); }
  sfx('pop');
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 99}); el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.82)';
  const p = el('div', 'panel logpanel', '', ov); css(p, {left: 24, top: 14, width: W - 48, height: H - 28});
  const head = el('div', 'loghead', `<p class="bd" style="margin:0;font-size:24px">Card changes</p>`, p);
  const tabs = el('div', 'logtabs', '', head);
  const x = el('button', 'btn', 'Close', head); css(x, {position: 'relative', width: 92, height: 38, fontSize: '16px', flexShrink: 0});
  const body = el('div', 'logbody', '', p);
  const show = i => {
    tabs.querySelectorAll('button').forEach((t, j) => t.classList.toggle('on', i === j));
    body.innerHTML = ''; body.scrollTop = 0;
    const v = LOG[i];
    if (!v) { body.innerHTML = '<p class="kwl" style="color:#5a5270">No card changes yet.</p>'; return; }
    for (const ch of v.cards) {
      const row = el('div', 'logrow', '', body);
      if (ch.old && ch.new) { row.appendChild(logCard(ch.was || ch.name, ch.old)); el('div', 'logarrow', '&#10140;', row); const nw = row.appendChild(logCard(ch.name, ch.new, ch.old)); if (ch.was) nw.querySelector('.nm').classList.add('chg'); }
      else { const tag = el('div', 'logtag ' + (ch.new ? 'new' : 'gone'), ch.new ? 'NEW' : 'RETIRED', row); row.appendChild(logCard(ch.name, ch.new || ch.old)); if (!ch.new) row.lastChild.classList.add('gone'); }
    }
  };
  LOG.forEach((v, i) => { const t = el('button', 'logtab', `${v.v} <span>${new Date(v.date + 'T12:00').toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</span>`, tabs); t.onclick = () => { sfx('pop'); show(i); }; });
  show(0);
  const close = () => ov.remove();
  x.onclick = close; ov.querySelector('.dim').onclick = close;
  anim(p, [{transform: 'translateY(30px) scale(.96)', opacity: 0}, {transform: 'translateY(0) scale(1)', opacity: 1}], {duration: 240, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
}

// ---------------------------------------------------------------- pause menu
function showMenu() {
  if (G.busy || G.mode) return;
  G.mode = 'menu';
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 97}); el('div', 'dim', '', ov);
  const p = el('div', 'panel menu', '', ov); css(p, {left: 272, top: 40, width: 300, padding: '18px 22px 20px', textAlign: 'center'});
  const close = () => { ov.remove(); G.mode = null; };
  const main = () => {
    const v = AU.get();
    p.innerHTML = `<p class="bd" style="margin:0 0 14px;font-size:26px">Paused</p>
      <div class="sndpop" style="position:static;box-shadow:none;border:0;padding:0 0 14px;align-items:center">
        <label><span>Music</span><input type="range" min="0" max="100" value="${Math.round(v.music * 100)}" data-k="music" aria-label="Music volume"></label>
        <label><span>Sound</span><input type="range" min="0" max="100" value="${Math.round(v.sfx * 100)}" data-k="sfx" aria-label="Sound volume"></label></div>`;
    p.querySelectorAll('input').forEach(inp => { inp.oninput = () => AU.set({[inp.dataset.k]: inp.value / 100}); inp.onchange = () => { if (inp.dataset.k === 'sfx') sfx('coin'); }; });
    const ffb = el('button', 'btn ffbtn', ffLabel(), p); css(ffb, {position: 'relative', width: '100%', height: 44, fontSize: '16px', marginBottom: '14px'});
    ffb.onclick = () => { toggleFatFinger(); close(); buildShop(); };
    const cl = el('button', 'btn', LOGICO(20) + 'Card changes', p); css(cl, {position: 'relative', width: '100%', height: 42, fontSize: '17px', marginBottom: '14px'}); cl.onclick = () => showChangelog();
    const res = el('button', 'btn', 'Resume', p); css(res, {position: 'relative', width: '100%', height: 46, background: '#2ecb6e', fontSize: '20px', marginBottom: '14px'}); res.onclick = close;
    const q = el('button', 'btn', 'Concede run', p); css(q, {position: 'relative', width: '100%', height: 42, fontSize: '17px'}); q.onclick = confirm;
  };
  const confirm = () => {
    const place = G.lobby.alive().length, suf = ['th', 'st', 'nd', 'rd'][place] && place < 4 ? ['th', 'st', 'nd', 'rd'][place] : 'th';
    p.innerHTML = `<p class="bd" style="margin:0 0 8px;font-size:24px">Concede this run?</p>
      <p style="margin:0 0 16px;font-size:14px;font-weight:800;line-height:1.4;color:#5a5270">You finish ${place}${suf} of 8, and your rating updates as usual.</p>`;
    const yes = el('button', 'btn', 'Concede', p); css(yes, {position: 'relative', width: '100%', height: 46, background: '#ff6b5e', fontSize: '20px', marginBottom: '12px'});
    yes.onclick = () => { ov.remove(); G.mode = null; concede(); };
    const no = el('button', 'btn', 'Keep playing', p); css(no, {position: 'relative', width: '100%', height: 42, fontSize: '17px'}); no.onclick = main;
  };
  main();
  anim(p, [{transform: 'translateY(30px) scale(.94)', opacity: 0}, {transform: 'translateY(0) scale(1)', opacity: 1}], {duration: 240, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  ov.querySelector('.dim').onclick = close;
  G.closeMenu = close;
}
addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (G.mode === 'menu' && G.closeMenu) G.closeMenu(); else if (G.screen === 'shop') showMenu(); });
function concede() {
  const me = G.me, L = G.lobby;
  if (!me.alive) return;
  me.alive = false; me.conceded = true;
  L.ghosts.push({board: me.board.map(m => Object.assign(Object.create(Object.getPrototypeOf(m)), m, {extras: m.extras.slice()})), tier: me.tier, name: me.name, hero: me.hero});
  L.deadOrder.push(me); me.place = 9 - L.deadOrder.length;
  showEnd();
}

function showEnd() {
  clear(); G.screen = 'end'; bg(false); AU.music(null);
  const me = G.me, L = G.lobby;
  let guard = 0;
  while (L.alive().length > 1 && guard++ < 40) { L.botTurns(); L.fightRound(); }
  for (const q of L.alive()) q.place = 1;
  if (!me.place) me.place = me.alive ? 1 : 9 - L.deadOrder.indexOf(me) - 1;
  for (const q of L.players) if (!q.place) q.place = 1;
  const order = L.players.slice().sort((a, b) => (a.place || 1) - (b.place || 1));
  // rating
  const before = PROF.rating, delta = ratingChange(me, L.players), after = Math.max(0, before + delta);
  if (!G.rated) {
    G.rated = true;
    PROF.rating = after; PROF.peak = Math.max(PROF.peak, after); PROF.games++; if (me.place <= 4) PROF.top4++; if (me.place === 1) PROF.wins++;
    if (me.place <= 4 && (G.minHealth ?? 99) <= 10) PROF.flags.comeback = true;
    PROF.history.push(Object.assign({t: Date.now(), hero: G.heroSlug, place: me.place, d: after - before}, RUN.summary())); PROF.history = PROF.history.slice(-3000); RUN.end(me.place, after - before);
    G.xpGain = rtAwardRun(me.place);
    checkUnlocks();
  }
  const p = el('div', 'panel', `<p class="bd" style="margin:0;font-size:13px;letter-spacing:.12em;color:#5a5270">${me.conceded ? 'CONCEDED' : 'RUN OVER'} · ROUND ${L.turn}</p>
    <p class="bd" style="margin:2px 0 0;font-size:44px"><span class="cnt">0</span>${['th', 'st', 'nd', 'rd'][me.place] && me.place < 4 ? ['th', 'st', 'nd', 'rd'][me.place] : 'th'} <span style="font-size:22px;color:#5a5270">of 8</span></p>

    <div class="lst" style="margin-top:8px;display:flex;flex-direction:column;gap:2px"></div>`, stage);
  css(p, {left: 30, top: 22, width: 380, height: 346, padding: '18px 22px'});
  const lst = p.querySelector('.lst');
  order.forEach((q, i) => {
    // the tribe the board actually ended up with (bots can change tribe mid-game; no style labels)
    const cnt = {}; for (const m of q.board || []) if (m.tribe && m.tribe !== 'Neutral' && !m.follower) cnt[m.tribe] = (cnt[m.tribe] || 0) + 1;
    const tr = q === me ? null : (Object.entries(cnt).sort((x, y) => y[1] - x[1])[0] || [null])[0], sty = tr ? [tr, TP[tr] || tr] : null;
    const row = el('div', '', `<span style="width:18px;text-align:right">${q.place || 1}</span><span style="position:relative;width:22px;height:22px;border-radius:50%;border:2px solid #2b2140;overflow:hidden;background:#8fd4ff"><img src="${ART[q.hero] || ART.follower}" alt="" style="position:absolute;left:-4px;bottom:-4px;width:30px;height:30px"></span><span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:26px;height:24px">${q === me ? 'You' : HERO[q.hero] ? HERO[q.hero].name.replace('The ', '') : q.name}</span><span class="tierpill sm">${STAR(10)}<span>${q.tier || 1}</span></span><span style="font-size:11px;color:#5a5270">${(q === me ? before : q.rating ?? '').toLocaleString('en')}</span>${tr ? `<span class="chip" style="padding:0 7px 0 3px;font-size:11px"><i style="background:${TC[tr]}"></i>${sty[1]}</span>` : ''}`, lst);
    css(row, {display: 'flex', alignItems: 'center', gap: '8px', height: 24, borderRadius: '999px', padding: '0 10px 0 3px', fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: '13.5px', lineHeight: 1});
    if (q === me) { row.style.background = '#ffc928'; row.style.border = '2.5px solid #2b2140'; }
    anim(row, [{transform: 'translateX(-30px)', opacity: 0}, {transform: 'translateX(0)', opacity: 1}], {duration: 300, delay: 300 + i * 70, fill: 'backwards', raw: true});
  });
  const cnt = p.querySelector('.cnt'); let k = 8; const iv = setInterval(() => { cnt.textContent = k; sfx('tick', {n: 8 - k, gap: 0}); if (k <= me.place) { clearInterval(iv); sfx(me.place <= 4 ? 'victory' : 'defeat'); setTimeout(() => { if (G.screen === 'end') AU.music('hold'); }, 3500); anim(cnt, [{transform: 'scale(1.6)'}, {transform: 'scale(1)'}], {duration: 300, raw: true}); if (me.place <= 4) confetti(120, 90, 30); } k--; }, 110);
  cnt.style.display = 'inline-block';
  const bA = bracketOf(before), bB = bracketOf(after);
  const right = el('div', 'panel', `<p class="bd" style="margin:0;font-size:13px;letter-spacing:.12em;color:#5a5270">RATING</p>
    <div style="display:flex;align-items:baseline;gap:10px;margin-top:2px"><span class="bd rnum" style="font-size:36px">${before.toLocaleString('en')}</span><span class="bd" style="font-size:22px;color:${delta >= 0 ? '#14a052' : '#ff6b5e'}">${delta >= 0 ? '+' : '−'}${Math.abs(delta)}</span>${G.xpGain ? `<span class="rt-xpchip">+${G.xpGain} XP</span>` : ''}${G.cashGain ? `<span class="rt-xpchip cash">${CASH_ICO(16)} +${G.cashGain}</span>` : ''}</div>
    <div class="rcw" style="margin-top:4px"></div>
    <p class="bd" style="margin:12px 0 0;font-size:13px;letter-spacing:.12em;color:#5a5270">YOUR FINAL BOARD</p><div class="fb" style="position:relative;height:84px;margin-top:10px"></div>`, stage);
  css(right, {left: 430, top: 22, width: 384, height: 266, padding: '18px 22px'});
  const rcw = right.querySelector('.rcw'), chip = rankChip(after, 13); chip.style.position = 'relative'; chip.style.display = 'inline-flex'; rcw.appendChild(chip);
  setTimeout(() => sfx(delta >= 0 ? 'rankup' : 'rankdown'), 1300);
  if (bA[1] !== bB[1]) { const pr = el('span', 'bd', delta > 0 ? 'Promoted!' : 'Demoted', rcw); css(pr, {position: 'relative', marginLeft: '10px', fontSize: '15px', color: delta > 0 ? '#14a052' : '#ff6b5e'}); }
  const rn = right.querySelector('.rnum'); let k2 = 0; const steps = 24;
  const iv2 = setInterval(() => { k2++; rn.textContent = Math.round(before + (after - before) * k2 / steps).toLocaleString('en'); if (k2 >= steps) clearInterval(iv2); }, 40);
  const fb = right.querySelector('.fb');
  me.board.forEach((m, i) => { const t = makeToken(m); fb.appendChild(t); css(t, {left: i * 49 + 2, top: 4}); t.style.transform = 'scale(.68)'; t.style.transformOrigin = 'top left'; });
  const again = el('button', 'btn', 'Play again', stage); css(again, {left: 438, top: 314, width: 176, height: 48, background: '#2ecb6e', fontSize: '21px'}); again.onclick = showHeroSelect;
  const menu = el('button', 'btn', 'Main menu', stage); css(menu, {left: 634, top: 314, width: 172, height: 48, fontSize: '18px'}); menu.onclick = showTitle;
  if (NEW_UNLOCKS.length) setTimeout(() => showUnlocks(NEW_UNLOCKS.splice(0)), 1400); else setTimeout(rtAfterRun, 1600);
}
function showUnlocks(list) {
  if (!list.length) { rtAfterRun(); return; }
  const slug = list.shift(), h = HERO[slug];
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 96}); el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.8)';
  const head = el('div', 'ab bd', '<span style="display:inline-block;background:#ffc928;border:3px solid #2b2140;border-radius:999px;padding:6px 18px 2px;box-shadow:0 0 0 3px #fff;font-size:22px">New hero unlocked!</span>', ov); css(head, {left: 0, right: 0, top: 14, textAlign: 'center'});
  const card = el('div', 'ab', heroHTML(h), ov); css(card, {left: 312, top: 62}); card.style.transform = 'scale(.8)'; card.style.transformOrigin = 'top left';
  anim(card, [{transform: 'scale(.2) rotate(-30deg)', opacity: 0}, {transform: 'scale(.88) rotate(4deg)', opacity: 1, offset: .7}, {transform: 'scale(.8) rotate(0)'}], {duration: 600, easing: 'ease-out', raw: true});
  setTimeout(() => confetti(422, 150, 40), 300); sfx('unlock');
  ov.onpointerup = () => { ov.remove(); showUnlocks(list); };
}

// ---------------------------------------------------------------- rewards (Nov 23): card packs, the Levels track, rating cosmetics
// Runs give XP and Cash. XP levels up the Levels track: it opens a pack set at levels 1, 10 and 20, adds a card to that
// set's packs at levels 5, 15 and 25, and offers a choice between two small bonuses on every other level (a fork).
// Cash buys packs. A pack holds 2 cards (more after the size levels); duplicates turn into Clout, and Clout crafts the
// cards you are missing. Rating (the Night Line) only opens cosmetics: battle backgrounds and battle animations.
const RT_XP_PLACE = [110, 95, 85, 75, 60, 50, 45, 40];          // XP for finishing 1st..8th
const CASH_PLACE = [80, 70, 60, 50, 40, 32, 26, 20];            // Cash for finishing 1st..8th
const RT_LEVELS = 30;
const rtCost = lv => 200 + 40 * (lv - 1);                        // XP for level lv: 200 … 1,360 (23,400 XP, about 330 runs in all)
const SETS = [
  {id: 1, name: 'Side Hustles', lv: 1, price: 100, col: '#ffc928', col2: '#ff8a3d', blurb: 'Support for every playstyle'},
  {id: 2, name: 'New Wave', lv: 10, price: 120, col: '#4fd1c5', col2: '#5ab8ff', blurb: 'A new playstyle for every tribe'},
  {id: 3, name: 'Hot Takes', lv: 20, price: 140, col: '#ff8ab8', col2: '#ff6b5e', blurb: 'More support, more legendaries'},
];
const SET = Object.fromEntries(SETS.map(s => [s.id, s]));
const setCards = id => CARDS_ALL().filter(c => c.set === id);
// Rarity follows the tier: 1-2 common, 3-4 rare, 5-6 epic; legendaries are their own rarity.
const RAR = {common: {label: 'Common', col: '#c9c2d6', clout: 5, craft: 40}, rare: {label: 'Rare', col: '#5ab8ff', clout: 15, craft: 100},
  epic: {label: 'Epic', col: '#b18cff', clout: 30, craft: 240}, legendary: {label: 'Legendary', col: '#ffc928', clout: 100, craft: 600}};
const RAR_ORDER = ['common', 'rare', 'epic', 'legendary'];
const rarityOf = c => c.legendary ? 'legendary' : c.tier >= 5 ? 'epic' : c.tier >= 3 ? 'rare' : 'common';
// Every card but the last: 65% common, 27% rare, 8% epic. The last card: rare or better (69 / 25 / 6% legendary).
// Tuned so a full collection takes about 430 runs (half of the cards much sooner); see docs/card-packs.md.
const ODDS = {first: [['common', 65], ['rare', 27], ['epic', 8]], last: [['rare', 69], ['epic', 25], ['legendary', 6]]};
const PITY = 10;   // a legendary is guaranteed in the 10th pack of a set without one
// ---- the Levels track is a talent tree. Levels 1, 5, 10 … 30 are milestones (packs, bigger packs); every other level
// you pick one talent from one of three directions. A pick is permanent.
const TALENT_ICO = {
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2.5" fill="#7fd99a"></rect><circle cx="12" cy="12" r="3" fill="#fff"></circle>',
  pack: '<rect x="6" y="2.5" width="12" height="19" rx="2" fill="#ffc928"></rect><path d="M6 6.5h12M6 17.5h12"></path><path d="M12 9l1.4 2.6 2.6.4-2 1.8.5 2.7-2.5-1.4-2.5 1.4.5-2.7-2-1.8 2.6-.4z" fill="#fff" stroke-width="1.4"></path>',
  flat: '<circle cx="12" cy="12" r="8.5" fill="#ffc928"></circle><path d="M12 7.5v9M9.5 9.5h4a1.8 1.8 0 0 1 0 3.5h-3a1.8 1.8 0 0 0 0 3.5h4"></path>',
  free: '<rect x="4" y="9" width="16" height="11" rx="2" fill="#ff8ab8"></rect><path d="M4 13h16M12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"></path>',
  clout: '<path d="M12 2.5l2.7 6 6.5.6-4.9 4.3 1.5 6.4L12 16.5l-5.8 3.3 1.5-6.4L2.8 9.1l6.5-.6z" fill="#b18cff"></path>',
  craft: '<path d="M4 20l8.5-8.5" stroke-width="3"></path><path d="M12 6.5l5.5 5.5 3-3L15 3.5z" fill="#ffd98f"></path>',
  pity: '<path d="M12 3l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 10l6-1z" fill="#ffd84a"></path><path d="M12 9v4l2 1.5" stroke-width="1.8"></path>',
  luck: '<path d="M12 21c-5-3.5-8-6.5-8-10.5a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-3 7-8 10.5z" fill="#2ecb6e"></path><path d="M12 9v12"></path>',
  xp: '<path d="M3 18l6-6.5 4 3.5 8-9" fill="none"></path><path d="M15 5.5h6v6" fill="none"></path>',
  top4: '<path d="M7 3h10v6a5 5 0 0 1-10 0z" fill="#ffc928"></path><path d="M12 14v4M8 21h8"></path>',
  shield: '<path d="M12 2.5l8 3v6.5c0 5-4 8.5-8 9.5-4-1-8-4.5-8-9.5V5.5z" fill="#c9c2d6"></path>',
};
const BONUS = {
  cash: {v: 5, label: '+5% Cash from runs', sum: v => `Cash +${v}%`},
  pack: {v: 3, label: 'Packs cost 3% less', sum: v => `Packs −${v}%`},
  flat: {v: 4, label: '+4 Cash after every run', sum: v => `+${v} Cash a run`},
  free: {v: 1, label: 'A free pack, right now', sum: v => `${v} free pack${v > 1 ? 's' : ''}`},
  clout: {v: 10, label: '+10% Clout from duplicates', sum: v => `Clout +${v}%`},
  craft: {v: 4, label: 'Crafting costs 4% less', sum: v => `Crafting −${v}%`},
  pity: {v: 1, label: 'Guaranteed legendary 1 pack sooner', sum: v => `Pity −${v}`},
  luck: {v: 1, label: '+1% legendary chance', sum: v => `Legendary +${v}%`},
  xp: {v: 5, label: '+5% XP from runs', sum: v => `XP +${v}%`},
  top4: {v: 10, label: '+10 XP for a top-4 finish', sum: v => `Top 4 +${v} XP`},
  shield: {v: 1, label: '+1 Boundaries in every run', sum: v => `Boundaries +${v}`},
};
const DIRS = [
  {id: 'money', name: 'Passive Income', col: '#2ecb6e', pale: '#d9f6e2', ico: 'cash', blurb: 'More Cash, cheaper packs, free packs', cycle: ['cash', 'pack', 'flat', 'free']},
  {id: 'clout', name: 'Clout Chasing', col: '#b18cff', pale: '#ece3ff', ico: 'clout', blurb: 'More Clout, cheaper crafting, luckier packs', cycle: ['clout', 'craft', 'luck', 'pity']},
  {id: 'grind', name: 'Grindset', col: '#ff8a3d', pale: '#ffe4d1', ico: 'xp', blurb: 'Level faster, start runs sturdier', cycle: ['xp', 'top4', 'xp', 'top4']},
];
const MILESTONES = {1: {kind: 'set', set: 1}, 5: {kind: 'size', set: 1}, 10: {kind: 'set', set: 2}, 15: {kind: 'size', set: 2}, 20: {kind: 'set', set: 3}, 25: {kind: 'size', set: 3}, 30: {kind: 'final'}};
const RT_TRACK = (() => {
  let row = 0;
  return Array.from({length: RT_LEVELS}, (_, i) => {
    const lv = i + 1, cost = rtCost(lv), m = MILESTONES[lv];
    if (m) return Object.assign({lv, cost}, m);
    const k = row++;   // talent rows: each direction cycles through its talents; Grindset's Boundaries come three times
    return {lv, cost, kind: 'talent', row: k, opts: DIRS.map(d => d.id === 'grind' && [9, 19, 29].includes(lv) ? 'shield' : d.cycle[k % 4])};
  });
})();
/** Level and progress for a total XP amount. */
function rtProgressOf(total) {
  let level = 0, xp = total;
  while (level < RT_LEVELS && xp >= rtCost(level + 1)) { xp -= rtCost(level + 1); level++; }
  return {level, xp: level < RT_LEVELS ? xp : 0, need: level < RT_LEVELS ? rtCost(level + 1) : 0};
}
const rtProgress = () => rtProgressOf(PROF.xp || 0);
const rtLevel = () => rtProgress().level;
const forkPick = lv => (PROF.talents || {})[lv];
const forkOpen = () => RT_TRACK.filter(r => r.kind === 'talent' && r.lv <= rtLevel() && forkPick(r.lv) == null);
/** Sum of a bonus over the talents picked so far. */
function bonus(k) { let s = 0; for (const r of RT_TRACK) if (r.kind === 'talent' && forkPick(r.lv) != null && r.opts[forkPick(r.lv)] === k) s += BONUS[k].v; return s; }
const dirPoints = i => RT_TRACK.filter(r => r.kind === 'talent' && forkPick(r.lv) === i).length;
const setOpen = id => rtLevel() >= SET[id].lv;
const packSize = id => 2 + RT_TRACK.filter(r => r.kind === 'size' && r.set === id && r.lv <= rtLevel()).length;
const legChance = () => ODDS.last.find(x => x[0] === 'legendary')[1] + bonus('luck');
const packPrice = id => Math.round(SET[id].price * (1 - bonus('pack') / 100));
const craftCost = c => Math.round(RAR[rarityOf(c)].craft * (1 - bonus('craft') / 100));
const dupClout = c => Math.round(RAR[rarityOf(c)].clout * (1 + bonus('clout') / 100));
const pityLimit = () => Math.max(4, PITY - bonus('pity'));
const owns = name => (PROF.owned || []).includes(name);
/** Can this card go into the Feed pool? Starting cards always; pack cards once you own them. */
const cardOpen = c => !c.set || owns(c.name);
const freePacks = id => (PROF.free || {})[id] || 0;
const freeTotal = () => SETS.reduce((s, x) => s + (setOpen(x.id) ? freePacks(x.id) : 0), 0);
// ---- moving profiles over from the tracks: cards they had unlocked stay theirs, plus some Cash to start with
const OLD_TRACK = [['Performance Review', 'Loyalty Card'], ['Thirst Trap', 'Drama Channel'], ['Magpie', 'Allotment'], ['Ghostwriter', 'Encore'], ['Bluetooth Speaker', 'Clutch Player'],
  ['Gig Poster', 'Banner Drop'], ['Mystery Cult', 'Debate Club'], ['Delivery Rider', 'Five-Star Rating'], ['Task Rabbit', 'Double Shift'], ['Ghost Kitchen', 'Platform Monopoly'],
  ['Reaction Streamer', 'Donation Goal'], ['Raid Party', 'Subathon'], ['Hype Train', 'Streamer House'], ['Cashback Card', 'Recruitment Agency'], ['Paid Verification', 'Comments Off'],
  ['Tulip Bulb', 'Hedgehog'], ['Bat Colony', 'Hibernating Bear'], ['Cicada Swarm', 'Seed Vault'], ['Pop-Up Ad', 'Battle Pass'], ['Data Broker', 'Auto-Renewal'], ['App Store', 'Data Centre'],
  ['Fox Den', 'Botanical Garden'], ['LAN Party', 'Smart Doorbell'], ['Pogo Dancer', 'Circle Pit'], ['Bouncer', 'Crowd Surfer'], ['Wall of Death', 'Festival Pit'], ['Bootleg Merch', 'Sound System'],
  ['Van Lifer', 'Digital Detox'], ['Declutter Coach', 'Silent Retreat'], ['Capsule Wardrobe', 'The Void'], ['Utopian Commune', 'TED Talk'], ['Parcel Locker', 'Neighbourhood Watch'],
  ['Wedding Band', 'Sampler'], ['Tribute Act', 'Plagiarist'], ['AI Art Generator', 'Mashup Artist'], ['Biopic', 'Crossover Hit']];
const OLD_LEGS = [[1000, ['The Billionaire', 'The Heretic']], [1500, ['Tech Founder']], [2000, ['Apex Scavenger', 'Pop Diva']], [2500, ['Content Creator', 'Controversy Magnet']],
  [3000, ['The Algorithm', 'Mohawk Legend']], [3500, ['Wise Old Owl']], [4000, ['Renaissance Thinker', 'Housing Co-op']], [4500, ['Punk Philosopher']], [5000, ['Sponsored Streamer']],
  [5500, ['Pension Fund']], [6000, ['Cover Band']], [6500, ['Startup Monk']]];
const rmBest = () => Math.max(PROF.peak || 0, PROF.rating || 0);
if (!PROF.packs) {
  const own = new Set(); let xp = PROF.xp || 0;
  for (let lv = 0; lv < OLD_TRACK.length && xp >= 300 + 50 * lv; lv++) { xp -= 300 + 50 * lv; OLD_TRACK[lv].forEach(n => own.add(n)); }
  for (const [at, ns] of OLD_LEGS) if (rmBest() >= at) ns.forEach(n => own.add(n));
  Object.assign(PROF, {packs: 1, owned: [...own], cash: (PROF.games || 0) > 0 ? 200 : 0, clout: 0, talents: {}, free: {}, pity: {}, lvGranted: 0, lvSeen: rtProgressOf(PROF.xp || 0).level, cos: {owned: [], eq: {}}});   // levels already reached: no pop-ups, just the open forks
  saveProfile();
}
PROF.talents = PROF.talents || {}; PROF.free = PROF.free || {}; PROF.pity = PROF.pity || {};
/** Free packs for the set levels reached (also after an XP change while the app was closed). */
function syncLevels() {
  const lvl = rtLevel(); let changed = false;
  for (let lv = (PROF.lvGranted || 0) + 1; lv <= lvl; lv++) { const r = RT_TRACK[lv - 1]; if (r.kind === 'set') { PROF.free[r.set] = freePacks(r.set) + 1; changed = true; } if (r.kind === 'final') for (const x of SETS) PROF.free[x.id] = freePacks(x.id) + 1; PROF.lvGranted = lv; changed = true; }
  if (changed) saveProfile();
}
syncLevels();
/** A new card goes straight into the Feed pool when its tier still has room (and, for a legendary, its tribe has none yet). */
function poolAdd(c) {
  const d = deckSet(); if (!PROF.deck || d.has(c.name) || c.tribe === 'Neutral' && !c.legendary) return false;
  for (const t of tribesOf(c)) {
    if (c.legendary ? CARDS_ALL().some(x => x.legendary && inTribe(x, t) && d.has(x.name)) : tierCount(d, t, c.tier) >= TIER_MAX) return false;
  }
  PROF.deck.push(c.name); return true;
}
function gainCardOwned(c) { if (owns(c.name)) return false; PROF.owned.push(c.name); poolAdd(c); return true; }
/** Rolls the cards of one pack. */
function rollPack(id) {
  const by = {}; for (const c of setCards(id)) (by[rarityOf(c)] = by[rarityOf(c)] || []).push(c);
  const have = r => by[r] && by[r].length;
  // a set without that rarity gives the nearest one it has (never a legendary instead of something else)
  const near = r => { if (have(r)) return r; const i = RAR_ORDER.indexOf(r); for (let d = 1; d < 4; d++) for (const j of [i - d, i + d]) { const x = RAR_ORDER[j]; if (x && x !== 'legendary' && have(x)) return x; } return 'legendary'; };
  const roll = t => { let x = Math.random() * 100; for (const [r, w] of t) { if (x < w) return r; x -= w; } return t[t.length - 1][0]; };
  const n = packSize(id), out = [];
  PROF.pity[id] = (PROF.pity[id] || 0) + 1;
  for (let i = 0; i < n; i++) {
    const last = i === n - 1;
    let r = roll(last ? ODDS.last.map(([q, w]) => [q, q === 'legendary' ? legChance() : q === 'rare' ? w - bonus('luck') : w]) : ODDS.first);
    if (last && PROF.pity[id] >= pityLimit()) r = 'legendary';
    r = near(r);
    if (r === 'legendary') PROF.pity[id] = 0;
    out.push(by[r][Math.floor(Math.random() * by[r].length)]);
  }
  return out;
}
/** Pays for a pack (a free one first), rolls it and books the result: new cards are yours, duplicates become Clout. */
function buyPack(id) {
  if (!setOpen(id)) return null;
  if (freePacks(id) > 0) PROF.free[id] -= 1;
  else { const p = packPrice(id); if ((PROF.cash || 0) < p) return null; PROF.cash -= p; }
  const res = rollPack(id).map(c => { const fresh = !owns(c.name); if (fresh) gainCardOwned(c); else PROF.clout = (PROF.clout || 0) + dupClout(c); return {c, fresh, clout: fresh ? 0 : dupClout(c)}; });
  PROF.packsOpened = (PROF.packsOpened || 0) + 1; saveProfile();
  return res;
}
const canOpen = id => setOpen(id) && (freePacks(id) > 0 || (PROF.cash || 0) >= packPrice(id));
// ---- money chips
const CASH_ICO = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2.5" fill="#7fd99a" stroke="#2b2140" stroke-width="2.4"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="#2b2140" stroke-width="2"/></svg>`;
const CLOUT_ICO = (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.7 6 6.5.6-4.9 4.3 1.5 6.4L12 16.5l-5.8 3.3 1.5-6.4L2.8 9.1l6.5-.6z" fill="#b18cff" stroke="#2b2140" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
const wallet = () => `<span class="wal">${CASH_ICO()}<b>${(PROF.cash || 0).toLocaleString('en')}</b><i>Cash</i></span><span class="wal">${CLOUT_ICO()}<b>${(PROF.clout || 0).toLocaleString('en')}</b><i>Clout</i></span>`;
/** A pack, the size of a card (240 x 336): crimped foil wrapper, the set's featured legendary in a window. */
const PACK_FEATURE = {1: 'The Billionaire', 2: 'Tech Founder', 3: 'Cover Band'};
function packHTML(s, o = {}) {
  const W2 = 240, H2 = 336, crimp = (y, d) => Array.from({length: 25}, (_, i) => `L${i * 10} ${y + (i % 2 ? d : 0)}`).join(' ');
  const feat = CARD[PACK_FEATURE[s.id]];
  return `<div class="pack${o.locked ? ' locked' : ''}" style="--c1:${s.col};--c2:${s.col2}"><svg viewBox="0 0 ${W2} ${H2}" width="${W2}" height="${H2}" aria-hidden="true">
    <defs><linearGradient id="pg${s.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.col}"/><stop offset=".55" stop-color="${s.col2}"/><stop offset="1" stop-color="${s.col}"/></linearGradient>
    <linearGradient id="ps${s.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient></defs>
    <path d="M0 26 ${crimp(26, -7).replace('L0 26 ', '')} L240 310 ${Array.from({length: 25}, (_, i) => `L${240 - i * 10} ${310 + (i % 2 ? 7 : 0)}`).join(' ')} Z" fill="url(#pg${s.id})" stroke="#2b2140" stroke-width="5" stroke-linejoin="round"/>
    <path d="M6 4h228v22H6z" fill="url(#ps${s.id})" stroke="#2b2140" stroke-width="4"/><path d="M6 310h228v22H6z" fill="url(#ps${s.id})" stroke="#2b2140" stroke-width="4"/>
    ${Array.from({length: 23}, (_, i) => `<path d="M${10 + i * 10} 6v18M${10 + i * 10} 312v18" stroke="#2b2140" stroke-opacity=".25" stroke-width="2"/>`).join('')}
    <path d="M-20 250L150 26M60 310L240 70" stroke="#fff" stroke-opacity=".28" stroke-width="22"/><path d="M110 310L240 140" stroke="#fff" stroke-opacity=".18" stroke-width="10"/>
    <circle cx="120" cy="138" r="72" fill="#fff6dc" stroke="#2b2140" stroke-width="5"/><circle cx="120" cy="138" r="80" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="3 9"/></svg>
    <div class="pk-win" style="background:${s.col}"><img src="${ART[feat ? feat.art : 'follower']}" alt="" draggable="false"></div>
    <span class="pk-brand">LATE STAGE</span><span class="pk-set">SET ${s.id}</span><span class="pk-name">${s.name}</span>
    ${o.n ? `<span class="pk-n">${o.n} cards</span>` : ''}${o.locked ? `<span class="pk-lock">${LOCK}</span>` : ''}${o.free ? `<span class="pk-freeb">FREE</span>` : ''}</div>`;
}
/** A pack element at a scale of the card size. */
function packEl(s, scale, o = {}, parent = null) {
  const w = el('div', 'packw', packHTML(s, o), parent); css(w, {width: 240 * scale, height: 336 * scale}); w.firstChild.style.transform = `scale(${scale})`; return w;
}

// ---------------------------------------------------------------- the card shop
function showPacks() {
  clear(); G.screen = 'packs'; AU.music('hold'); edgeBg('#f3d9b6');
  const shop = el('div', 'ab shop', `<div class="sh-wall"></div><div class="sh-win"><i></i><i></i></div><div class="sh-neon bd">Late Stage <span>Cards</span></div>
    <div class="sh-poster p1"><b class="bd">GOTTA<br>HIRE 'EM<br>ALL</b></div><div class="sh-poster p2"><b class="bd">NO<br>REFUNDS</b><i>(it's late stage)</i></div><div class="sh-poster p3"><b class="bd">1 LEGENDARY<br>PER BOX*</b><i>*maybe</i></div>
    <div class="sh-shelf"><i class="br l"></i><i class="br r"></i></div><div class="sh-counter"><i class="top"></i></div>`, stage);
  css(shop, {left: 0, top: 0, width: W, height: H});
  collectionTabs('packs');
  // the shopkeeper leans on the counter, the till shows your Cash, a jar holds your Clout
  const keeper = el('img', 'ab sh-keeper', null, shop); keeper.src = ART.h_collector; css(keeper, {left: 692, top: 186, width: 150, height: 150});
  anim(keeper, [{transform: 'translateY(0) rotate(0)'}, {transform: 'translateY(-3px) rotate(-2deg)'}, {transform: 'translateY(0) rotate(0)'}], {duration: 3200, iterations: Infinity, easing: 'ease-in-out', raw: true});
  el('div', 'ab sh-front', '', shop);
  const till = el('div', 'ab sh-till bd', `<div class="scr">${CASH_ICO(16)}<b>${(PROF.cash || 0).toLocaleString('en')}</b></div><i class="keys"></i><span>Cash</span>`, shop); css(till, {left: 18, top: 312});
  const jar = el('div', 'ab sh-jar bd', `<div class="lid"></div><div class="glass">${CLOUT_ICO(14).repeat(Math.min(6, 1 + Math.floor((PROF.clout || 0) / 150)))}</div><b>${(PROF.clout || 0).toLocaleString('en')}</b><span>Clout</span>`, shop); css(jar, {left: 646, top: 306});
  const leaf = el('button', 'ab sh-leaf bd', '<b>Odds &amp;<br>crafting</b><i>read me</i>', shop); css(leaf, {left: 614, top: 116}); leaf.onclick = showOdds;
  const bell = el('div', 'ab sh-bell', '<i></i><b></b>', shop); css(bell, {left: 600, top: 340});
  bell.onclick = () => { sfx('tick'); anim(bell, [{transform: 'rotate(0)'}, {transform: 'rotate(-12deg)'}, {transform: 'rotate(10deg)'}, {transform: 'rotate(0)'}], {duration: 300, raw: true}); toast(['Be right with you.', 'We do not do refunds.', 'Have you tried opening more packs?', 'Legendaries? Out back. Somewhere.'][Math.floor(Math.random() * 4)]); };
  SETS.forEach((s, i) => {
    const open = setOpen(s.id), fr = freePacks(s.id), all = setCards(s.id), got = all.filter(c => owns(c.name)).length;
    const x = 150 + i * 166, sc = .5;
    const pw = packEl(s, sc, {locked: !open, n: open ? packSize(s.id) : 0, free: open && fr > 0}, shop); pw.classList.add('ab', 'sh-pack'); css(pw, {left: x, top: 100});
    if (open) anim(pw, [{transform: 'rotate(-2deg) translateY(0)'}, {transform: 'rotate(1deg) translateY(-4px)'}, {transform: 'rotate(-2deg) translateY(0)'}], {duration: 2600 + i * 400, iterations: Infinity, easing: 'ease-in-out', raw: true});
    else pw.style.transform = 'rotate(-2deg)';
    // a paper price tag on a string below the shelf
    const tag = el('div', `ab sh-tag bd${open ? '' : ' lock'}${fr && open ? ' free' : ''}`, `<i class="str"></i><b>${!open ? `${LOCK} Level ${s.lv}` : fr ? `FREE${fr > 1 ? ` ×${fr}` : ''}` : `${CASH_ICO(15)} ${packPrice(s.id)}`}</b><span>${s.name} · ${got}/${all.length}</span>`, shop);
    css(tag, {left: x + 6, top: 278}); tag.style.transform = `rotate(${[-3, 2, -1][i]}deg)`;
    const go = () => {
      if (!open) { sfx('error'); anim(pw, [{transform: 'rotate(-2deg) translateX(0)'}, {transform: 'rotate(-2deg) translateX(-5px)'}, {transform: 'rotate(-2deg) translateX(5px)'}, {transform: 'rotate(-2deg) translateX(0)'}], {duration: 260, raw: true}); toast(`${s.name} opens at level ${s.lv}`); return; }
      if (!canOpen(s.id)) { sfx('error'); toast('Not enough Cash'); anim(till, [{transform: 'translateX(0)'}, {transform: 'translateX(-5px)'}, {transform: 'translateX(5px)'}, {transform: 'translateX(0)'}], {duration: 260, raw: true}); return; }
      openPack(s.id, rectOf(pw));
    };
    pw.onclick = go; tag.onclick = go;
  });
}
function showOdds() {
  sfx('open');
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 99}); el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.82)';
  const p = el('div', 'panel pk-oddsp sh-paper', '', ov); css(p, {left: 122, top: 20, width: 600, height: 350});
  const row = r => `<span class="rar" style="background:${RAR[r].col}">${RAR[r].label}</span>`, fake = r => ({tier: r === 'epic' ? 5 : r === 'rare' ? 3 : 1, legendary: r === 'legendary'});
  const last = ODDS.last.map(([q, w]) => [q, q === 'legendary' ? legChance() : q === 'rare' ? w - bonus('luck') : w]);
  p.innerHTML = `<p class="bd" style="margin:0;font-size:22px">How packs work</p>
    <div class="pk-ocols"><div><p class="rt-cap">Every card but the last</p>${ODDS.first.map(([r, w]) => `<p>${row(r)} ${w}%</p>`).join('')}
      <p class="rt-cap" style="margin-top:10px">The last card</p>${last.map(([r, w]) => `<p>${row(r)} ${w}%</p>`).join('')}
      <p class="pk-note">A legendary is guaranteed in the ${pityLimit()}th pack of a set without one.</p></div>
    <div><p class="rt-cap">Duplicate gives · craft costs (Clout)</p>${RAR_ORDER.map(r => `<p>${row(r)} +${dupClout(fake(r))} · craft ${craftCost(fake(r))}</p>`).join('')}
      <p class="pk-note">Rarity follows the tier: tiers 1–2 common, 3–4 rare, 5–6 epic. Craft missing cards in your card books (Collection › Cards).</p></div></div>
    <button class="btn close">Got it</button>`;
  p.querySelector('.close').onclick = () => ov.remove(); ov.querySelector('.dim').onclick = () => ov.remove();
}
/** Opening a pack, in a dark room under a spotlight: swipe across the top to tear it (or tap it three times), the cards
 *  slide out and are dealt face down with a glow that hints at their rarity; tap each to reveal (the best one last). */
async function openPack(id, from = null) {
  const res = buyPack(id); if (!res) return;
  const s = SET[id];
  res.sort((a, b) => RAR_ORDER.indexOf(rarityOf(a.c)) - RAR_ORDER.indexOf(rarityOf(b.c)));
  sfx('pickup');
  const ov = el('div', 'ab po', '<div class="po-bg"></div><div class="po-spot"></div><div class="po-dust"></div><div class="po-rays"></div><div class="po-flash"></div>', stage);
  css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 98}); edgeBg('#120d22');
  const dust = ov.querySelector('.po-dust'); for (let i = 0; i < 26; i++) { const d = el('i', '', '', dust); css(d, {left: Math.random() * W, top: Math.random() * H}); d.style.animationDelay = `-${(Math.random() * 6).toFixed(1)}s`; d.style.animationDuration = `${5 + Math.random() * 5}s`; }
  anim(ov.querySelector('.po-bg'), [{opacity: 0}, {opacity: 1}], {duration: 400, fill: 'forwards', raw: true});
  // the pack: a torn-off strip on top, the body below, the cards hidden inside
  const SC = .78, PW = 240 * SC, PH = 336 * SC, px = W / 2 - PW / 2, py = 34;
  const box = el('div', 'ab po-pack', '', ov); css(box, {left: px, top: py, width: PW, height: PH});
  const stack = el('div', 'po-stack', res.map(() => '<div class="rt-back"><span class="bd">LATE<br>STAGE</span></div>').join(''), box);
  const body = packEl(s, SC, {}, box); body.classList.add('po-body');
  const strip = packEl(s, SC, {}, box); strip.classList.add('po-strip');
  const hint = el('div', 'ab po-hint bd', `<span class="hand">👆</span> Swipe across the top to open`, ov); css(hint, {left: 0, right: 0, top: 352});
  const f = from ? from : {x: W / 2 - 60, y: 120, w: 120, h: 168};
  await anim(box, [{transform: `translate(${f.x + f.w / 2 - W / 2}px,${f.y + f.h / 2 - py - PH / 2}px) scale(${f.w / PW}) rotate(-6deg)`}, {transform: 'translate(0,-8px) scale(1.04) rotate(2deg)', offset: .75}, {transform: 'none'}], {duration: 620, easing: 'cubic-bezier(.3,1.3,.5,1)', raw: true}).finished;
  anim(box, [{transform: 'translateY(0) rotate(0)'}, {transform: 'translateY(-4px) rotate(.8deg)'}, {transform: 'translateY(0) rotate(0)'}], {duration: 2200, iterations: Infinity, easing: 'ease-in-out', raw: true});
  // tearing: follow the finger along the top; three taps tear it too
  await new Promise(done => {
    let prog = 0, sx = null, taps = 0, fin = false;
    const set = p => { prog = Math.max(prog, Math.min(1, p)); strip.style.transform = `translate(${prog * 14}px,${-prog * 16}px) rotate(${-prog * 16}deg)`; strip.style.setProperty('--rip', `${Math.round(prog * 100)}%`); };
    const finish = () => { if (fin) return; fin = true; ov.onpointerdown = ov.onpointermove = ov.onpointerup = null; done(); };
    let moved = false, base = 0;
    ov.onpointerdown = e => { sx = e.clientX; moved = false; base = prog; };
    ov.onpointermove = e => { if (sx == null) return; const dx = (e.clientX - sx) / SCALE; if (Math.abs(dx) > 6) moved = true; const d = base + dx / PW; if (moved && d > prog) { set(d); if (Math.random() < .3) sfx('scroll', {gap: .08}); } if (prog > .8) finish(); };
    ov.onpointerup = () => { sx = null; if (!moved) { taps++; set(taps / 3); sfx('tick', {n: taps, gap: 0}); anim(box, [{transform: 'rotate(0)'}, {transform: `rotate(${taps % 2 ? -3 : 3}deg) scale(1.03)`}, {transform: 'rotate(0)'}], {duration: 160, raw: true}); if (taps >= 3) finish(); } else if (prog < .8) set(prog); };
    setTimeout(() => { if (!fin && prog === 0) hint.classList.add('nudge'); }, 2500);
  });
  hint.remove(); box.getAnimations().forEach(a => a.cancel());
  sfx('scroll'); sfx('sparkle');
  anim(strip, [{transform: getComputedStyle(strip).transform}, {transform: 'translate(220px,-170px) rotate(-70deg)', opacity: 0}], {duration: 520, easing: 'ease-in', fill: 'forwards', raw: true});
  const glow = el('div', 'po-glow', '', box); anim(glow, [{opacity: 0}, {opacity: 1, offset: .3}, {opacity: 0}], {duration: 900, fill: 'forwards', raw: true});
  // the cards rise out, the wrapper drops away
  await sleep(220);
  await anim(stack, [{transform: 'translateY(0)'}, {transform: `translateY(-${PH * .55}px)`}], {duration: 520, easing: 'cubic-bezier(.3,1.2,.6,1)', fill: 'forwards', raw: true}).finished;
  anim(body, [{transform: 'translateY(0)', opacity: 1}, {transform: 'translateY(260px) rotate(6deg)', opacity: 0}], {duration: 480, easing: 'ease-in', fill: 'forwards', raw: true});
  await sleep(160);
  stack.style.visibility = 'hidden';
  // deal face down; the glow at the edges hints at what is inside
  const n = res.length, CS = .62, CW = 240 * CS, gap = n > 2 ? 194 : 220;
  const cards = res.map((r, i) => {
    const rar = rarityOf(r.c), x = W / 2 - CW / 2 + (i - (n - 1) / 2) * gap, y = 54;
    const w = el('div', `ab rt-flip po-card rar-${rar}`, `<div class="rt-back"><span class="bd">LATE<br>STAGE</span></div><div class="rt-front">${cardHTML(r.c)}</div>`, ov);
    css(w, {left: x, top: y}); w.style.transformOrigin = 'top left';
    const rot = (i - (n - 1) / 2) * 3;
    w.animate([{transform: `translate(${W / 2 - CW / 2 - x}px,${py + 20 - y}px) scale(${CS * .8}) rotate(0)`}, {transform: `translate(0,0) scale(${CS}) rotate(${rot}deg)`}], {duration: 460, delay: i * 120, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'both'});
    setTimeout(() => sfx('pick', {gap: 0}), i * 120);
    return {w, r, rar, x, y, rot, shown: false};
  });
  await sleep(460 + n * 120);
  const reveal = el('button', 'btn po-all', 'Reveal all', ov); css(reveal, {left: W / 2 - 70, top: 336, width: 140, height: 40, fontSize: '16px'});
  const tip = el('div', 'ab po-hint bd', 'Tap a card to reveal it', ov); css(tip, {left: 0, right: 0, top: 300});
  let busy = false;
  const flip = async c => {
    if (c.shown) return; c.shown = true; tip.remove();
    const big = c.rar === 'legendary' || c.rar === 'epic';
    if (big) { c.w.classList.add('charge'); sfx('charge'); await sleep(c.rar === 'legendary' ? 1000 : 520); c.w.classList.remove('charge'); }
    c.w.classList.add('on'); sfx(c.rar === 'legendary' ? 'triple' : c.rar === 'epic' ? 'levelup' : 'pop');
    const cx = c.x + CW / 2, cy = c.y + 336 * CS / 2;
    if (c.rar === 'legendary') { anim(ov.querySelector('.po-flash'), [{opacity: .9}, {opacity: 0}], {duration: 700, raw: true}); ov.querySelector('.po-rays').classList.add('on'); ring(cx, cy, '#ffc928', 260); confetti(cx, cy, 60); anim(ov, [{transform: 'translate(0,0)'}, {transform: 'translate(4px,-3px)'}, {transform: 'translate(-3px,2px)'}, {transform: 'translate(0,0)'}], {duration: 260, raw: true}); }
    else if (c.rar === 'epic') { ring(cx, cy, '#b18cff', 190); confetti(cx, cy, 18); }
    else if (c.rar === 'rare') ring(cx, cy, '#5ab8ff', 140);
    await sleep(420);
    const face = c.w.querySelector('.rt-front');
    if (c.r.fresh) {
      const nb = el('div', 'po-new bd', 'NEW', face); anim(nb, [{transform: 'scale(2.4) rotate(-30deg)', opacity: 0}, {transform: 'scale(1) rotate(-12deg)', opacity: 1}], {duration: 320, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'both', raw: true}); sfx('sparkle');
    } else {
      // a duplicate fades back and shows what it turned into
      anim(face.firstChild, [{opacity: 1, filter: 'grayscale(0)'}, {opacity: .42, filter: 'grayscale(.6)'}], {duration: 600, easing: 'ease-out', fill: 'forwards', raw: true});
      const st = el('div', 'po-dup bd', `${CLOUT_ICO(44)}<b>+${c.r.clout}</b><i>duplicate</i>`, face);
      anim(st, [{transform: 'translate(-50%,-50%) scale(2.2) rotate(18deg)', opacity: 0}, {transform: 'translate(-50%,-50%) scale(1) rotate(-6deg)', opacity: 1}], {duration: 360, delay: 260, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'both', raw: true});
      setTimeout(() => sfx('coin'), 300);
    }
  };
  const after = () => {
    reveal.remove();
    const fresh = res.filter(r => r.fresh), cl = res.reduce((a, r) => a + r.clout, 0);
    const sum = el('div', 'ab po-sum bd', `${fresh.length ? `${fresh.length} new card${fresh.length > 1 ? 's' : ''}` : 'No new cards'}${cl ? ` <span>${CLOUT_ICO(16)} +${cl} Clout</span>` : ''}`, ov); css(sum, {left: 0, right: 0, top: 12});
    anim(sum, [{transform: 'translateY(-20px)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 300, raw: true});
    const bar = el('div', 'ab po-bar', '', ov); css(bar, {left: 0, right: 0, top: 334});
    const col = el('button', 'btn', `${ico('<rect x="4" y="4" width="7" height="16" rx="1.5" fill="#ff8ab8"></rect><rect x="13" y="4" width="7" height="16" rx="1.5" fill="#8fd4ff"></rect>', 20)} Collection`, bar); col.style.background = '#8fd4ff';
    const again = el('button', 'btn', canOpen(id) ? (freePacks(id) ? 'Open another · free' : `Open another ${CASH_ICO(18)} ${packPrice(id)}`) : 'Out of Cash', bar); again.style.background = '#ffc928'; again.disabled = !canOpen(id);
    const back = el('button', 'btn', 'Back to the shop', bar); back.style.background = '#2ecb6e';
    const first = (fresh[0] || res[res.length - 1]).c;
    col.onclick = () => { ov.remove(); showCards(first.tribe, {tier: first.legendary ? 'L' : first.tier, mark: first.name}); };
    again.onclick = () => { ov.remove(); showPacks(); openPack(id); };
    back.onclick = () => { ov.remove(); showPacks(); };
    for (const c of cards) c.w.onclick = () => showDetail(c.r.c, null);
  };
  for (const c of cards) c.w.onclick = async () => { if (busy || c.shown) return; busy = true; await flip(c); busy = false; if (cards.every(x => x.shown)) after(); };
  reveal.onclick = async () => { if (busy) return; busy = true; reveal.disabled = true; for (const c of cards) await flip(c); busy = false; after(); };
}

/** A locked card: tribe and tier show, the rest stays a surprise. */
function mysteryCardHTML(c, at) {
  const tr = c.tribe, lab = tr === 'Neutral' ? 'NEIGHBOUR' : tr.toUpperCase();
  const bgc = c.tribe2 ? `background-image:linear-gradient(135deg,${TC[tr]} 50%,${TC[c.tribe2]} 50%)` : `background-color:${TC[tr]}`;
  const tag = c.tribe2 ? `<span class="trb" style="background:${TC[tr]}">${lab}</span><span class="trb" style="background:${TC[c.tribe2]}">${c.tribe2.toUpperCase()}</span>` : `<span class="trb" style="background:${TC[tr]}">${lab}</span>`;
  return `<div class="card rt-card${c.legendary ? ' legend' : ''}"><div class="art" style="${bgc}">${RT_SIL}<span class="rt-q">?</span></div>${c.legendary ? '<i class="foil"></i>' : ''}
    <p class="nm" style="font-size:21px">???</p><div class="meta${c.tribe2 ? ' duo' : ''}">${tag}${fmtStars(c.tier, c.tribe2 ? 11 : c.tier <= 4 ? 16 : 13)}</div>
    <p class="txt" style="font-size:14px;color:#8f86a6">${at || 'A surprise.'}</p><div class="sa">?</div><div class="sh">?</div></div>`;
}

// ---------------------------------------------------------------- Levels: the talent tree
const RT_SIL = '<svg class="rt-sil" viewBox="0 0 68 68" aria-hidden="true"><circle cx="34" cy="27" r="13"/><path d="M7 72c2-17 13-26 27-26s25 9 27 26z"/></svg>';
const RT_TICK = ico('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', 16, 3.6);
const rtState = (r, lvl) => r.lv <= lvl ? 'done' : r.lv === lvl + 1 ? 'next' : 'locked';
const rtXpBar = (P, w) => `<div class="rt-xp" style="width:${w}px"><i style="width:${P.need ? Math.round(100 * P.xp / P.need) : 100}%"></i><b>${P.need ? `${P.xp.toLocaleString('en')} / ${P.need.toLocaleString('en')} XP` : 'Tree complete'}</b></div>`;
const latestSet = () => SETS.filter(s => setOpen(s.id)).pop().id;
const msText = r => r.kind === 'set' ? [`New packs: ${SET[r.set].name}`, 'Your first pack is free'] : r.kind === 'size' ? [`${SET[r.set].name} packs: +1 card`, `${packSize(r.set) + (r.lv > rtLevel() ? 1 : 0)} cards a pack`] : ['The last level', 'A free pack of every set'];
const tIco = (k, s = 24, sw = 2.2) => ico(TALENT_ICO[k], s, sw);
function bonusSummary() {
  const on = Object.keys(BONUS).filter(k => k !== 'free').map(k => [k, bonus(k)]).filter(([, v]) => v);
  return on.length ? on.map(([k, v]) => `<span class="rt-bon">${tIco(k, 13, 2.4)}${BONUS[k].sum(v)}</span>`).join('') : '<span class="rt-bon none">No talents yet</span>';
}
function showTrack(kind = 'xp') {
  if (kind === 'rating') return showNightLine();
  clear(); G.screen = 'rewards'; bg(true); AU.music('hold');
  collectionTabs('levels');
  const P = rtProgress(), lvl = P.level;
  const side = el('div', 'panel rt-side tt-side', '', stage); css(side, {left: 24, top: 64, width: 222, height: 312});
  side.innerHTML = `<div class="rt-head"><div class="rt-lvl"><span class="bd">${lvl}</span></div><p class="bd rt-lvlt">Level ${lvl}<small>of ${RT_LEVELS}</small></p></div>
    ${rtXpBar(P, 182)}<p class="rt-per">Per run: 1st +${RT_XP_PLACE[0]} XP, +${CASH_PLACE[0]} Cash</p>
    <div class="tt-dirs">${DIRS.map((d, i) => `<div class="tt-dir" style="--dc:${d.col};--dp:${d.pale}"><span class="ic">${tIco(d.ico, 18)}</span><b class="bd">${d.name}</b><i>${dirPoints(i)}</i></div>`).join('')}</div>
    <div class="rt-nexthead"><p class="rt-cap">Your talents</p></div><div class="rt-bons">${bonusSummary()}</div>`;
  const p = el('div', 'panel tt-panel', '', stage); css(p, {left: 262, top: 64, width: 558, height: 312});
  const head = el('div', 'tt-head', `<span></span>${DIRS.map(d => `<div class="tt-h" style="--dc:${d.col};--dp:${d.pale}"><span class="ic">${tIco(d.ico, 18)}</span><b class="bd">${d.name}</b></div>`).join('')}`, p);
  const body = el('div', 'tt-scroll', '', p);
  const inner = el('div', 'tt-inner', '', body);
  const COLX = [168, 300, 432], RH = 78, MH = 92;   // column centres, talent row and milestone row heights
  let y = 18; const ys = {};
  for (const r of RT_TRACK) { ys[r.lv] = y + (r.kind === 'talent' ? RH : MH) / 2; y += r.kind === 'talent' ? RH : MH; }
  const Hh = y + 24; css(inner, {height: Hh});
  // the level rail on the left fills up to your XP
  const yAt = lv => lv <= 0 ? 0 : ys[lv], cur = lvl >= RT_LEVELS ? ys[RT_LEVELS] : yAt(lvl) + (ys[lvl + 1] - yAt(lvl)) * (P.need ? P.xp / P.need : 0);
  let svg = `<svg class="tt-lines" width="540" height="${Hh}" aria-hidden="true"><path d="M44 0V${Hh}" class="rail"/><path d="M44 0V${cur}" class="railon"/>`;
  for (const x of COLX) svg += `<path d="M${x} 0V${Hh}" class="col"/>`;
  // your path through the tree: one line from pick to pick
  let prev = null;
  for (const r of RT_TRACK) if (r.kind === 'talent' && forkPick(r.lv) != null) {
    const pt = [COLX[forkPick(r.lv)], ys[r.lv]];
    if (prev) svg += `<path d="M${prev[0]} ${prev[1]}C${prev[0]} ${prev[1] + 40} ${pt[0]} ${pt[1] - 40} ${pt[0]} ${pt[1]}" class="path" style="stroke:${DIRS[forkPick(r.lv)].col}"/>`;
    prev = pt;
  }
  inner.insertAdjacentHTML('beforeend', svg + '</svg>');
  for (const r of RT_TRACK) {
    const st = rtState(r, lvl), cy = ys[r.lv];
    const lb = el('div', `tt-lv bd ${st}`, `${r.lv}`, inner); css(lb, {left: 44, top: cy});
    if (r.kind !== 'talent') {   // milestone: a ribbon across the tree with the pack
      const [a, b] = msText(r), ms = el('div', `tt-ms ${st}`, `<div class="pk"></div><div><b class="bd">${a}</b><i>${b}</i></div>${st === 'done' ? `<span class="ok">${RT_TICK}</span>` : ''}`, inner);
      css(ms, {left: 92, top: cy - 34});
      const pkb = ms.querySelector('.pk');
      if (r.kind === 'final') SETS.forEach((s, i) => { const w = packEl(s, .17, {locked: st !== 'done'}, pkb); w.style.marginLeft = i ? '-26px' : '0'; w.style.transform = `rotate(${(i - 1) * 8}deg)`; });
      else packEl(SET[r.set], .19, {locked: st === 'locked'}, pkb);
      continue;
    }
    const pick = forkPick(r.lv), open = st === 'done' && pick == null;
    r.opts.forEach((k, i) => {
      const d = DIRS[i], on = pick === i, n = el('button', `tt-node ${st}${on ? ' on' : pick != null ? ' off' : ''}${open ? ' open' : ''}`, `<span class="c">${tIco(k, 22)}</span><span class="l">${BONUS[k].label}</span>`, inner);
      css(n, {left: COLX[i], top: cy}); n.style.setProperty('--dc', d.col); n.style.setProperty('--dp', d.pale);
      n.onclick = () => { if (open) talentPop(r, () => showTrack('xp'), i); else { sfx('pop'); toast(on ? 'Your pick' : pick != null ? 'Not picked' : `Reach level ${r.lv} to choose`); } };
    });
  }
  const fo = forkOpen()[0];
  body.scrollTop = Math.max(0, (fo ? ys[fo.lv] : cur) - 120);
}
/** Choosing a talent: three cards, one per direction. */
function talentPop(r, onDone, hi = null) {
  sfx('open');
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 97}); el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.88)';
  const head = el('div', 'ab bd', `<span class="rt-lvpill">Level ${r.lv}: choose a talent</span>`, ov); css(head, {left: 0, right: 0, top: 16, textAlign: 'center'});
  const sub = el('p', 'ab bd', 'One pick per level, for good.', ov); css(sub, {left: 0, right: 0, top: 70, margin: 0, textAlign: 'center', color: '#fff', fontSize: '16px'});
  r.opts.forEach((k, i) => {
    const d = DIRS[i], b = el('button', 'ab tal-card' + (hi === i ? ' hi' : ''), `<span class="dir bd" style="background:${d.col}">${d.name}</span><span class="fk-ico">${tIco(k, 50, 1.9)}</span><b class="bd">${BONUS[k].label}</b><i>${k === 'free' ? `A ${SET[latestSet()].name} pack` : `${d.name}: ${dirPoints(i)} → ${dirPoints(i) + 1}`}</i>`, ov);
    b.style.setProperty('--dc', d.col); b.style.setProperty('--dp', d.pale);
    css(b, {left: W / 2 - 300 + i * 206, top: 104, width: 186, height: 210});
    anim(b, [{transform: 'translateY(80px) scale(.8)', opacity: 0}, {transform: 'translateY(0) scale(1)', opacity: 1}], {duration: 380, delay: 100 * i, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards', raw: true});
    b.onclick = () => {
      PROF.talents = PROF.talents || {}; PROF.talents[r.lv] = i;
      if (k === 'free') { const s = latestSet(); PROF.free[s] = freePacks(s) + 1; }
      saveProfile(); sfx('unlock'); confetti(W / 2 - 207 + i * 206, 200, 30);
      ov.querySelectorAll('.tal-card').forEach(x => { if (x !== b) anim(x, [{opacity: 1}, {opacity: .25, transform: 'scale(.92)'}], {duration: 300, fill: 'forwards', raw: true}); });
      anim(b, [{transform: 'scale(1)'}, {transform: 'scale(1.08)'}, {transform: 'scale(1.03)'}], {duration: 320, fill: 'forwards', raw: true});
      setTimeout(() => { ov.remove(); onDone && onDone(); }, 620);
    };
  });
  const later = el('button', 'btn', 'Later', ov); css(later, {left: W / 2 - 60, top: 334, width: 120, height: 40, fontSize: '16px'}); later.onclick = () => { ov.remove(); if (G.screen === 'end') rmAfterRun(); };
}
/** Level-up moments: milestones show their packs, talent levels ask for a pick. */
function rtLevelPop(r, onDone) {
  if (r.kind === 'talent') return talentPop(r, onDone);
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 96}); el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.86)';
  const head = el('div', 'ab bd', `<span class="rt-lvpill">Level up! Level ${r.lv}</span>`, ov); css(head, {left: 0, right: 0, top: 14, textAlign: 'center'});
  const [a, b] = msText(r);
  const sub = el('p', 'ab bd', `${a}. ${b}!`, ov); css(sub, {left: 0, right: 0, top: 66, margin: 0, textAlign: 'center', color: '#fff', fontSize: '18px'});
  const sets = r.kind === 'final' ? SETS : [SET[r.set]];
  sets.forEach((s, i) => {
    const w = packEl(s, .62, {n: packSize(s.id), free: r.kind !== 'size'}, ov); w.classList.add('ab'); css(w, {left: W / 2 - 75 + (i - (sets.length - 1) / 2) * 120, top: 98});
    anim(w, [{transform: 'translateY(220px) rotate(-20deg) scale(.5)', opacity: 0}, {transform: `translateY(0) rotate(${(i - (sets.length - 1) / 2) * 6 - 3}deg) scale(1)`, opacity: 1}], {duration: 560, delay: i * 120, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'both', raw: true});
  });
  setTimeout(() => confetti(W / 2, 180, 40), 500); sfx('unlock');
  const go = el('button', 'btn', r.kind === 'size' ? 'To the shop' : 'Open it', ov); css(go, {left: W / 2 - 160, top: 334, width: 150, height: 44, background: '#ffc928', fontSize: '18px'});
  const ok = el('button', 'btn', 'Later', ov); css(ok, {left: W / 2 + 12, top: 336, width: 120, height: 40, fontSize: '17px'});
  go.onclick = () => { ov.remove(); showPacks(); if (r.kind === 'set' && canOpen(r.set)) openPack(r.set); };
  ok.onclick = () => { ov.remove(); onDone && onDone(); };
}
function rtAwardRun(place) {
  const g = Math.round((RT_XP_PLACE[place - 1] || RT_XP_PLACE[7]) * (1 + bonus('xp') / 100)) + (place <= 4 ? bonus('top4') : 0);
  const c = Math.round((CASH_PLACE[place - 1] || CASH_PLACE[7]) * (1 + bonus('cash') / 100)) + bonus('flat');
  PROF.xp = (PROF.xp || 0) + g; PROF.cash = (PROF.cash || 0) + c; G.cashGain = c; syncLevels(); return g;
}
function rtAfterRun() {
  if (G.screen !== 'end') return;
  const lvl = rtLevel(), seen = PROF.lvSeen || 0;
  if (lvl <= seen) { const f = forkOpen()[0]; if (f && !G.talentAsked) { G.talentAsked = true; return talentPop(f, rtAfterRun); } rmAfterRun(); return; }
  PROF.lvSeen = seen + 1; saveProfile();
  rtLevelPop(RT_TRACK[seen], rtAfterRun);
}

// ---------------------------------------------------------------- the Night Line: a night train through the city, one station per rating reward
// Side view, scrolls sideways. Layers back to front: sky, far skyline, fog, houses, fog, viaduct with café arches, stations, train + headlight, cards.
const RM_X0 = 190, RM_X1 = 400, RM_SP = 270, RM_H = 306, RM_DECK = 282;
const rmX = r => r.lv ? RM_X1 + (r.lv - 1) * RM_SP : RM_X0;
const RM_STOPS = 8;   // stations on the Night Line (RM_TRACK, below)
const RM_W = RM_X1 + (RM_STOPS - 1) * RM_SP + 420;
/** Where the front of the train is for a rating: between the start and the first station, then station to station. */
function rmTrainX(rating) {
  if (rating < RM_TRACK[0].at) return RM_X0 + (RM_X1 - RM_X0) * Math.max(0, rating) / RM_TRACK[0].at;
  for (let i = 1; i < RM_TRACK.length; i++) { const a = RM_TRACK[i - 1], b = RM_TRACK[i]; if (rating < b.at) return rmX(a) + (rmX(b) - rmX(a)) * (rating - a.at) / (b.at - a.at); }
  return rmX(RM_TRACK[RM_TRACK.length - 1]);
}
/** The city, drawn once per visit. A seeded random keeps it the same every time. */
function rmCity() {
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }, pick = a => a[Math.floor(rnd() * a.length)];
  const INK = '#171230', BASE = RM_DECK + 4;
  let clip = 0;
  // a window: dark, lamp-lit, office-lit, a TV flickering, or someone walking past
  const win = (x, y, w, h, office) => {
    const k = rnd();
    if (k < .05) return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3a5fc4"/><rect class="rm-tv" style="animation-delay:-${(rnd() * 4).toFixed(2)}s" x="${x}" y="${y}" width="${w}" height="${h}" fill="#b9d4ff"/>`;
    if (k < .085) { const id = 'rmc' + (clip++);
      return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffcf73"/>
        <g clip-path="url(#${id})"><g class="rm-walk" style="animation-delay:-${(rnd() * 9).toFixed(2)}s;animation-duration:${(7 + rnd() * 5).toFixed(1)}s"><circle cx="${x + w / 2}" cy="${y + h * .42}" r="${w * .2}" fill="#5a3a2a"/><path d="M${x + w * .16} ${y + h + 1}q${w * .34} -${h * .55} ${w * .68} 0z" fill="#5a3a2a"/></g></g>`; }
    const lit = office ? k < .42 : k < .3;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? (office ? pick(['#d6ecff', '#bfe0ff', '#eef6ff']) : pick(['#ffcf73', '#ffbe5c', '#ffd98f'])) : pick(['#2a2350', '#30285a', '#262046'])}"${lit && !office ? ' class="rm-lamp"' : ''}/>`;
  };
  // 19th-century block: floors with cornices, tall windows, a mansard roof with dormers
  const altbau = (x, w, h) => {
    const top = BASE - h, col = pick(['#5b4a7a', '#4e4470', '#64506e', '#4b5274', '#6a5468']), fh = 26, shop = BASE - 38, fl = Math.floor((shop - top - 30) / fh), cols = Math.floor((w - 14) / 22);
    let s = `<path d="M${x} ${BASE}V${top + 22}h${w}V${BASE}z" fill="${col}" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<path d="M${x + 4} ${top + 22}L${x + 12} ${top}h${w - 24}l8 22z" fill="#3a2f55" stroke="${INK}" stroke-width="2.5"/>`;
    for (let d = 0; d < Math.max(1, cols - 1); d += 2) s += `<path d="M${x + 18 + d * 22} ${top + 20}v-9h12v9" fill="#3a2f55" stroke="${INK}" stroke-width="2"/>` + win(x + 20 + d * 22, top + 13, 8, 7);
    for (let f = 0; f < fl; f++) {
      const y = top + 28 + f * fh;
      s += `<path d="M${x - 2} ${y - 3}h${w + 4}" stroke="${INK}" stroke-width="2"/>`;
      for (let c = 0; c < cols; c++) s += win(x + 10 + c * 22 + (w - 14 - cols * 22) / 2, y + 3, 11, 17);
    }
    // ground floor: a café with an awning, warm windows and guests, or a closed shop
    s += `<path d="M${x - 2} ${shop - 3}h${w + 4}" stroke="${INK}" stroke-width="2.5"/>`;
    const dx = x + w / 2 - 7, ww = (w - 34) / 2;
    if (rnd() < .5) {
      const aw = pick([['#ff6b5e', '#fff'], ['#2ecb6e', '#fff'], ['#ffc928', '#fff']]);
      s += `<rect x="${x + 6}" y="${shop + 9}" width="${ww}" height="22" rx="3" fill="url(#rmcafe)" stroke="${INK}" stroke-width="2"/><rect x="${x + w - 6 - ww}" y="${shop + 9}" width="${ww}" height="22" rx="3" fill="url(#rmcafe)" stroke="${INK}" stroke-width="2"/>`;
      for (const gx of [x + 6 + ww * .35, x + w - 6 - ww * .55]) s += `<circle cx="${gx}" cy="${shop + 20}" r="3.6" fill="#6a4232"/><path d="M${gx - 5} ${shop + 31}q5 -8 10 0z" fill="#6a4232"/>`;
      s += `<rect x="${dx}" y="${shop + 9}" width="14" height="${BASE - shop - 9}" fill="#ffcf73" stroke="${INK}" stroke-width="2"/>`;
      s += `<path d="M${x + 2} ${shop}h${w - 4}l-4 9H${x + 6}z" fill="${aw[0]}" stroke="${INK}" stroke-width="2"/>`;
      for (let k = x + 10; k < x + w - 8; k += 10) s += `<path d="M${k} ${shop + 1}l-1 7" stroke="${aw[1]}" stroke-width="3.5"/>`;
      s += `<ellipse cx="${x + w / 2}" cy="${BASE - 4}" rx="${w * .7}" ry="14" fill="url(#rmspill)"/>`;
    } else s += `<rect x="${x + 6}" y="${shop + 7}" width="${ww}" height="22" rx="3" fill="${pick(['#2a2350', '#3a5fc4', '#2a2350'])}" stroke="${INK}" stroke-width="2"/><rect x="${x + w - 6 - ww}" y="${shop + 7}" width="${ww}" height="22" rx="3" fill="#2a2350" stroke="${INK}" stroke-width="2"/><rect x="${dx}" y="${shop + 7}" width="14" height="${BASE - shop - 7}" fill="#3a2f55" stroke="${INK}" stroke-width="2"/>`;
    return s;
  };
  // glass tower: a grid of small office windows, whole lit floors here and there
  const tower = (x, w, h) => {
    const top = BASE - h; let s = `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="#2f3b63" stroke="${INK}" stroke-width="2.5"/><rect x="${x + w * .35}" y="${top - 12}" width="${w * .3}" height="12" fill="#2f3b63" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="${x + 3}" y="${top + 3}" width="${w * .28}" height="${h - 6}" fill="#fff" opacity=".05"/>`;
    for (let y = top + 8; y < BASE - 30; y += 11) {
      const floorLit = rnd() < .22;
      for (let xx = x + 6; xx < x + w - 10; xx += 11) s += floorLit ? `<rect x="${xx}" y="${y}" width="8" height="6" fill="${pick(['#e6f4ff', '#cde8ff'])}"/>` : win(xx, y, 8, 6, true);
    }
    s += `<rect x="${x + 6}" y="${BASE - 24}" width="${w - 12}" height="24" fill="#cfe6ff" stroke="${INK}" stroke-width="2"/><path d="M${x + w / 2} ${BASE - 24}V${BASE}" stroke="${INK}" stroke-width="2"/>`;   // lit lobby
    return s;
  };
  // far skyline: soft silhouettes, a TV tower and a dome
  let far = '';
  for (let x = -20; x < RM_W; ) {
    const w = 40 + rnd() * 60, h = 90 + rnd() * 120, y = BASE - 20 - h;
    far += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h + 60}" fill="#2a2452"/>`;
    for (let k = 0; k < 4; k++) if (rnd() < .6) far += `<rect x="${(x + 6 + rnd() * (w - 14)).toFixed(0)}" y="${(y + 8 + rnd() * (h - 20)).toFixed(0)}" width="4" height="4" fill="#5f5596"/>`;
    x += w + rnd() * 16;
  }
  const tvTower = x => `<path d="M${x - 3} ${BASE}V58h6V${BASE}z" fill="#2a2452"/><circle cx="${x}" cy="74" r="13" fill="#2a2452"/><path d="M${x - 1} 58V22h2V58z" fill="#2a2452"/><circle class="rm-blink" cx="${x}" cy="21" r="2.5" fill="#ff6b5e"/>`;
  const dome = x => `<path d="M${x - 46} ${BASE}V190h92V${BASE}z" fill="#2a2452"/><path d="M${x - 34} 190a34 36 0 0 1 68 0z" fill="#2a2452"/><path d="M${x - 2} 154v-12h4v12z" fill="#2a2452"/><path d="M${x - 6} 144h12" stroke="#2a2452" stroke-width="3"/>`;
  far += tvTower(700) + dome(1500) + tvTower(2620) + dome(3240);
  // houses, side by side
  let mid = '';
  for (let x = -30; x < RM_W; ) {
    const t = rnd(), isTower = t < .26, w = isTower ? 64 + rnd() * 30 : 96 + rnd() * 40, h = isTower ? 230 + rnd() * 40 : 160 + rnd() * 40;
    mid += isTower ? tower(x, w, h) : altbau(x, w, h);
    x += w + 4 + rnd() * 10;
  }
  // the top of the viaduct along the bottom: rails, a stone coping and the brickwork
  const deck = RM_DECK;
  let via = `<defs><linearGradient id="rmcafe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3a0"/><stop offset="1" stop-color="#ffa944"/></linearGradient>
    <radialGradient id="rmspill"><stop offset="0" stop-color="#ffc56a" stop-opacity=".45"/><stop offset="1" stop-color="#ffc56a" stop-opacity="0"/></radialGradient></defs>`;
  via += `<rect x="-10" y="${deck + 4}" width="${RM_W + 20}" height="${RM_H - deck}" fill="#7a4250" stroke="${INK}" stroke-width="3"/>`;
  for (let r = 0; r < 3; r++) { const y = deck + 10 + r * 6; via += `<path d="M-10 ${y}H${RM_W + 10}" stroke="#5e2f3c" stroke-width="1.5"/>`; for (let x = (r % 2) * 9; x < RM_W; x += 18) via += `<path d="M${x} ${y}v6" stroke="#5e2f3c" stroke-width="1.5"/>`; }
  via += `<rect x="-10" y="${deck}" width="${RM_W + 20}" height="6" fill="#b8aac8" stroke="${INK}" stroke-width="2.5"/><path d="M-10 ${deck - 1}H${RM_W + 10}" stroke="#d8d0e6" stroke-width="2.5"/>`;
  // a little park with a monument where the line ends: trees, a lamp, a column with a golden figure
  const px = RM_W - 210;
  let park = `<path d="M${px - 30} ${deck - 2}q130 -14 260 0v${BASE - deck + 2}h-260z" fill="#24406a"/>`;
  park += `<rect x="${px + 70}" y="${deck - 120}" width="14" height="118" fill="#cdbfa3" stroke="${INK}" stroke-width="2.5"/><rect x="${px + 60}" y="${deck - 12}" width="34" height="12" fill="#b8aa8e" stroke="${INK}" stroke-width="2.5"/><rect x="${px + 64}" y="${deck - 126}" width="26" height="8" fill="#b8aa8e" stroke="${INK}" stroke-width="2.5"/>`;
  park += `<path d="M${px + 77} ${deck - 128}l-6 -14 6 -12 6 12z" fill="#ffc928" stroke="${INK}" stroke-width="2"/><path d="M${px + 71} ${deck - 142}l-14 -6 12 10M${px + 83} ${deck - 142}l14 -6 -12 10" fill="#ffc928" stroke="${INK}" stroke-width="2"/><circle cx="${px + 77}" cy="${deck - 158}" r="4" fill="#ffc928" stroke="${INK}" stroke-width="2"/>`;
  for (const [tx, r] of [[px + 10, 26], [px + 140, 30], [px + 186, 22]]) park += `<path d="M${tx} ${deck}v-30" stroke="${INK}" stroke-width="4"/><circle cx="${tx}" cy="${deck - 36 - r * .4}" r="${r}" fill="#2e5a4a" stroke="${INK}" stroke-width="2.5"/>`;
  park += `<path d="M${px + 112} ${deck}v-44" stroke="${INK}" stroke-width="3"/><circle cx="${px + 112}" cy="${deck - 46}" r="5" fill="#fff1b8" stroke="${INK}" stroke-width="2"/>`;
  return {far, mid, via, park, deck};
}

const RM_TRAIN = `<svg class="rm-trainsvg" width="236" height="52" viewBox="0 0 236 52" aria-hidden="true"><g stroke="#171230" stroke-width="3" stroke-linejoin="round">
  ${[0, 78].map(x => `<rect x="${x + 2}" y="8" width="72" height="36" rx="8" fill="#ffc928"/><rect x="${x + 2}" y="31" width="72" height="7" fill="#e0a800"/>${[10, 30, 50].map(w => `<rect x="${x + w}" y="14" width="14" height="13" rx="3" fill="#ffd98f"/>`).join('')}<circle cx="${x + 15}" cy="46" r="5" fill="#3a3045"/><circle cx="${x + 61}" cy="46" r="5" fill="#3a3045"/>`).join('')}
  <path d="M156 8h46c14 0 24 14 30 28v4c0 3-2 4-5 4h-71z" fill="#ff6b5e"/><rect x="156" y="31" width="76" height="7" fill="#d8433a"/>
  <rect x="166" y="14" width="14" height="13" rx="3" fill="#ffd98f"/><path d="M198 13h6c6 0 12 6 15 14h-21z" fill="#bfe0ff"/>
  <circle cx="171" cy="46" r="5" fill="#3a3045"/><circle cx="217" cy="46" r="5" fill="#3a3045"/><circle cx="229" cy="34" r="3.5" fill="#fff6c2"/>
  <path d="M74 26h4M152 26h4" stroke-width="4"/>
  ${[17, 37, 57, 95, 115, 135].map(x => `<path class="rm-pax" d="M${x - 3} 27q3 -7 6 0zM${x} 18.5a2.6 2.6 0 1 0 .1 0" fill="#5a3a2a" stroke="none"/>`).join('')}
</g></svg>`;

/** A station: canopy, lamp and a hanging sign with the rating. */
const rmStation = (r, st) => `<div class="rm-stn ${st}" style="left:${rmX(r)}px"><i class="rm-glow"></i>
  <svg width="150" height="78" viewBox="0 0 150 78" aria-hidden="true"><g stroke="#171230" stroke-width="3" stroke-linejoin="round">
  <path d="M6 18L20 4h110l14 14z" fill="${st === 'locked' ? '#4a4270' : '#ffc928'}"/><rect x="4" y="18" width="142" height="6" fill="${st === 'locked' ? '#3a3260' : '#e0a800'}"/>
  <path d="M18 24v54M132 24v54" stroke-width="4"/><path d="M75 24v6"/><path d="M71 30h8l-2 6h-4z" fill="${st === 'locked' ? '#6a628c' : '#fff6c2'}"/></g></svg>
  <span class="rm-sign bd">${STAR(11)}${r.at.toLocaleString('en')}</span></div>`;


// ---------------------------------------------------------------- the Night Line: rating opens cosmetics
const COS = [   // rating opens battle backgrounds and battle effects (no card sleeves for now)
  {at: 1000, kind: 'bg', id: 'dusk', name: 'Dusk'}, {at: 1750, kind: 'fx', id: 'neon', name: 'Neon Trails'},
  {at: 2500, kind: 'bg', id: 'night', name: 'Night Shift'}, {at: 3250, kind: 'fx', id: 'pow', name: 'Comic Hits'},
  {at: 4000, kind: 'bg', id: 'neon', name: 'Neon City'}, {at: 4750, kind: 'fx', id: 'confetti', name: 'Confetti KOs'},
  {at: 5500, kind: 'bg', id: 'golden', name: 'Golden Hour'}, {at: 6500, kind: 'fx', id: 'slam', name: 'Big Entrance'}];
const COS_KIND = {bg: 'Battle background', fx: 'Battle animation'};
const COS_KINDS = ['bg', 'fx'];
const cosKey = c => c.kind + ':' + c.id;
const RM_TRACK = COS.map((c, i) => ({lv: i + 1, at: c.at, cos: c}));
const rmLevel = () => RM_TRACK.filter(r => rmBest() >= r.at).length;
// cosmetics stay yours after a season reset
const cosOwned = c => rmBest() >= c.at || (PROF.cos.owned || []).includes(cosKey(c));
function cosSync() { let ch = false;
  if (PROF.cos.eq && PROF.cos.eq.sleeve) { delete PROF.cos.eq.sleeve; ch = true; }   // sleeves were taken out
  if ((PROF.cos.owned || []).some(k => k.startsWith('sleeve:'))) { PROF.cos.owned = PROF.cos.owned.filter(k => !k.startsWith('sleeve:')); ch = true; } for (const c of COS) if (rmBest() >= c.at && !PROF.cos.owned.includes(cosKey(c))) { PROF.cos.owned.push(cosKey(c)); ch = true; } if (ch) saveProfile(); }
cosSync();
const cosOn = kind => (PROF.cos.eq || {})[kind] || null;
const fxOn = id => cosOn('fx') === id;
function applyCos() {
  stage.className = stage.className.split(' ').filter(x => !/^(sl|bgt|cfx)-/.test(x)).join(' ');
  for (const k of COS_KINDS) { const v = cosOn(k); if (v) stage.classList.add((k === 'bg' ? 'bgt-' : 'cfx-') + v); }
}
applyCos();
function equipCos(c) {
  if (!cosOwned(c)) { sfx('error'); toast(`Unlocks at ${c.at.toLocaleString('en')} rating`); return; }
  PROF.cos.eq = PROF.cos.eq || {}; const on = cosOn(c.kind) === c.id;
  PROF.cos.eq[c.kind] = on ? null : c.id; saveProfile(); applyCos(); sfx(on ? 'pop' : 'buy');
  toast(on ? `${c.name} taken off` : `${c.name} on`);
}
/** A small preview of a cosmetic. */
function cosPreview(c) {
  if (c.kind === 'bg') return `<img class="cp-bg bgt-prev-${c.id}" src="${ART.city}" alt="">`;
  const I = {neon: '<path d="M3 17C8 15 9 7 21 5" stroke="#ff3df2" stroke-width="3.4" fill="none"></path><circle cx="21" cy="5" r="2.6" fill="#fff"></circle>',
    pow: '<path d="M12 2l2 6 6-3-3 6 6 2-6 2 3 6-6-3-2 6-2-6-6 3 3-6-6-2 6-2-3-6 6 3z" fill="#ffc928"></path>',
    confetti: '<rect x="4" y="4" width="4" height="7" fill="#ff8ab8" transform="rotate(-20 6 7)"></rect><rect x="14" y="3" width="4" height="7" fill="#8fd4ff" transform="rotate(25 16 6)"></rect><rect x="9" y="13" width="4" height="7" fill="#2ecb6e" transform="rotate(10 11 16)"></rect><rect x="17" y="13" width="4" height="7" fill="#ffc928"></rect>',
    slam: '<circle cx="12" cy="12" r="4" fill="#ffc928"></circle><circle cx="12" cy="12" r="9" fill="none"></circle><path d="M12 1v3M12 20v3M1 12h3M20 12h3"></path>'};
  return `<span class="cp-fx">${ico(I[c.id], 40, 2)}</span>`;
}
function cosTok(c, st) {
  const t = el('div', `tok rt-tok cos-tok k-${c.kind}${st === 'locked' ? ' rt-locked' : ''}${cosOn(c.kind) === c.id ? ' worn' : ''}`);
  t.innerHTML = `<div class="clip">${cosPreview(c)}</div>${st === 'done' ? `<span class="rt-got">${RT_TICK}</span>` : ''}`;
  t.setAttribute('role', 'button'); t.setAttribute('aria-label', c.name); t.onclick = e => { e.stopPropagation(); equipCos(c); showNightLine(); };
  return t;
}
function rmProgress() {
  const best = rmBest(), lv = rmLevel(), prev = lv ? RM_TRACK[lv - 1].at : 0, next = RM_TRACK[lv];
  return {best, lv, prev, next, frac: next ? Math.max(0, (best - prev) / (next.at - prev)) : 1};
}
const rmBar = (P, w) => `<div class="rt-xp rm-xp" style="width:${w}px"><i style="width:${Math.round(100 * Math.min(1, P.frac))}%"></i><b>${P.next ? `${P.best.toLocaleString('en')} / ${P.next.at.toLocaleString('en')}` : 'Last stop reached'}</b></div>`;
function showNightLine() {
  clear(); G.screen = 'nightline'; bg(true); AU.music('hold');
  collectionTabs('rating');
  const P = rmProgress();
  const side = el('div', 'panel rt-side rm-side', '', stage); css(side, {left: 24, top: 64, width: 222, height: 312});
  side.innerHTML = `<div class="rt-head"><div class="rt-lvl rm-badge"><span class="bd">${P.lv}</span></div><p class="bd rt-lvlt">Station ${P.lv}<small>of ${RM_TRACK.length}</small></p></div>
    ${rmBar(P, 182)}<p class="rt-per">Your best rating opens cosmetics</p><div class="rt-nexthead"><p class="rt-cap">Your style</p></div><div class="cos-rows"></div>`;
  const rows = side.querySelector('.cos-rows');
  for (const k of COS_KINDS) {   // tap a row to cycle through what you own
    const mine = COS.filter(c => c.kind === k && cosOwned(c)), cur = COS.find(c => c.kind === k && c.id === cosOn(k));
    const r = el('button', 'cos-row', `<span class="cr-prev">${cur ? cosPreview(cur) : '<i class="cp-none"></i>'}</span><span><small>${COS_KIND[k]}</small><b>${cur ? cur.name : 'Default'}</b></span><i class="cr-n">${mine.length ? '⟳' : ''}</i>`, rows);
    r.onclick = () => {
      if (!mine.length) { sfx('error'); toast(`Reach ${COS.find(c => c.kind === k).at.toLocaleString('en')} rating for your first one`); return; }
      const i = cur ? mine.indexOf(cur) : -1, nx = mine[i + 1] || null;
      PROF.cos.eq[k] = nx ? nx.id : null; saveProfile(); applyCos(); sfx('pop'); showNightLine();
    };
  }
  const p = el('div', 'panel rt-roadp rm-panel', '', stage); css(p, {left: 262, top: 64, width: 558, height: 312});
  const body = el('div', 'rm-scroll', '', p);
  const inner = el('div', 'rm-inner', '', body); css(inner, {width: RM_W, height: RM_H});
  const C = rmCity(), tx = rmTrainX(P.best);
  inner.innerHTML = `<div class="rm-sky"><i class="rm-moon"></i><svg class="rm-stars" width="${RM_W}" height="140" aria-hidden="true">${Array.from({length: 70}, (_, i) => `<circle cx="${(i * 197) % RM_W}" cy="${(i * 53) % 120 + 6}" r="${i % 5 ? 1.1 : 1.8}" fill="#fff" opacity="${.3 + (i % 4) * .15}"/>`).join('')}</svg></div>
    <svg class="rm-far" width="${RM_W}" height="${RM_H}" aria-hidden="true">${C.far}</svg>
    <i class="rm-fog f1"></i>
    <svg class="rm-mid" width="${RM_W}" height="${RM_H}" aria-hidden="true">${C.mid}</svg>
    <i class="rm-fog f2"></i>
    <svg class="rm-via" width="${RM_W}" height="${RM_H}" aria-hidden="true">${C.park}${C.via}
      <path d="M0 ${C.deck - 1}H${tx - 4}" stroke="#ffc928" stroke-width="4"/></svg>
    <i class="rm-fog f3"></i><i class="rm-haze"></i>`;
  for (const r of RM_TRACK) inner.insertAdjacentHTML('beforeend', rmStation(r, rtState(r, P.lv)));
  const hero = avatarHero();
  const train = el('div', 'rm-train', `<i class="rm-beam"></i><i class="rm-beamfog"></i>${RM_TRAIN}<div class="av" style="background:${hero.col}"><img src="${ART[hero.slug]}" alt=""></div>`, inner);
  css(train, {left: tx, top: C.deck - 51});
  anim(train.querySelector('.rm-trainsvg'), [{translate: '0 0'}, {translate: '0 -1px'}, {translate: '0 0'}], {duration: 380, iterations: Infinity, raw: true});
  for (const r of RM_TRACK) {   // the cosmetic floats above its station
    const st = cosOwned(r.cos) ? 'done' : rtState(r, P.lv), g = el('div', `rt-grp rm-grp ${st}`, '', inner); css(g, {left: rmX(r), top: 44});
    const box = el('div', 'rt-toks', '', g); box.appendChild(cosTok(r.cos, st));
    el('p', 'rm-cosl bd', `${r.cos.name}<small>${COS_KIND[r.cos.kind]}</small>`, g);
  }
  const far = inner.querySelector('.rm-far'), f1 = inner.querySelector('.f1');
  body.onscroll = () => { const s = body.scrollLeft; far.style.transform = `translateX(${s * .45}px)`; f1.style.translate = `${s * .2}px 0`; };
  body.scrollLeft = Math.max(0, tx - 230); body.onscroll();
}
/** After a run: a pop-up for each new cosmetic. */
function rmAfterRun() {
  if (G.screen !== 'end') return;
  const seen = PROF.cos.seen || [], c = COS.find(x => cosOwned(x) && !seen.includes(cosKey(x)));
  cosSync();
  if (!c) return;
  PROF.cos.seen = seen.concat(cosKey(c)); saveProfile();
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 96}); el('div', 'dim', '', ov).style.background = 'rgba(23,18,48,.9)';
  const head = el('div', 'ab bd', `<span class="rt-lvpill">Station ${c.at.toLocaleString('en')}</span>`, ov); css(head, {left: 0, right: 0, top: 16, textAlign: 'center'});
  const sub = el('p', 'ab bd', `New ${COS_KIND[c.kind].toLowerCase()}: ${c.name}`, ov); css(sub, {left: 0, right: 0, top: 70, margin: 0, textAlign: 'center', color: '#fff', fontSize: '20px'});
  const pv = el('div', `ab cos-big k-${c.kind}`, cosPreview(c), ov); css(pv, {left: W / 2 - 90, top: 110, width: 180, height: 180});
  anim(pv, [{transform: 'scale(.4) rotate(-12deg)', opacity: 0}, {transform: 'scale(1) rotate(0)', opacity: 1}], {duration: 480, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  setTimeout(() => confetti(W / 2, 180, 40), 400); sfx('unlock');
  const go = el('button', 'btn', 'Use it', ov); css(go, {left: W / 2 - 150, top: 320, width: 140, height: 44, background: '#ffc928', fontSize: '18px'});
  const ok = el('button', 'btn', 'Later', ov); css(ok, {left: W / 2 + 12, top: 322, width: 120, height: 40, fontSize: '17px'});
  go.onclick = () => { PROF.cos.eq[c.kind] = c.id; saveProfile(); applyCos(); ov.remove(); rmAfterRun(); };
  ok.onclick = () => { ov.remove(); rmAfterRun(); };
}

window.LSUI = {showTitle, G, rc: () => renderChrome(), rebuild: () => { buildShop(); }, end: () => showEnd(), playCard, prof: () => PROF, test: {levelPop: lv => rtLevelPop(RT_TRACK[lv - 1], () => {}), afterRun: () => { G.screen = 'end'; G.talentAsked = false; rtAfterRun(); }, cosPop: () => { G.screen = 'end'; PROF.cos.seen = []; rmAfterRun(); }, buy: () => buy(G.feed[0]), ready: () => ready(), levelUp: () => levelUp(), scroll: () => scroll(), stats: r => showStats(r), backup: () => showBackup(), rewards: () => showTrack('xp'), night: () => showNightLine(), books: (t, o) => showCards(t, o || {}), packs: () => showPacks(), open: id => openPack(id), rmPop: () => { G.screen = 'end'; rmAfterRun(); }, levelUp: l => rtLevelUp(l)}};
showTitle();
})();
