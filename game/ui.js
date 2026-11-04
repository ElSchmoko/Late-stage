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
const BRACKETS = [[0, 'Unpaid Intern', '#c9c2d6'], [1000, 'Junior Associate', '#8fd4ff'], [2000, 'Middle Management', '#4fd1c5'], [3000, 'Director', '#b18cff'], [4000, 'Vice President', '#ff8ab8'], [5000, 'C-Suite', '#ff8a3d'], [6500, 'Billionaire', '#ffc928']];
const bracketOf = r => BRACKETS.reduce((b, x) => (r >= x[0] ? x : b), BRACKETS[0]);
const UNLOCK = {   // hero -> [goal, progress(profile)]
  h_bargainhunter: [60, P => P.stats.hires], h_doomscroller: [100, P => P.stats.scrolls], h_serial: [1, P => +!!P.flags.tier6],
  h_overthinker: [1, P => +!!P.flags.fourTribes], h_lifecoach: [1, P => +!!P.flags.streak3], h_minimalist: [1, P => +!!P.flags.small],
  h_complainer: [1, P => +!!P.flags.comeback], h_ex: [80, P => P.stats.deaths]};
const isUnlocked = slug => PROF.unlocked.includes(slug);
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
for (const [k, v] of Object.entries(window.LS_ART)) ART[k] = URL.createObjectURL(new Blob([v], {type: 'image/svg+xml'}));
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
  let s = (m.taunt ? '<div class="seekring"></div>' : '') + `<div class="clip"><img src="${artOf(name)}" alt="" draggable="false"></div>`;
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
function makeToken(m, o = {}) {
  const t = el('div', 'tok');
  t.style.backgroundColor = TC[m.tribe] || '#ffc928';
  t.innerHTML = tokenHTML(m, o);
  t.classList.toggle('seek', !!m.taunt); t.classList.toggle('gold', !!m.golden);
  return t;
}
function updateToken(t, m, o = {}) {
  const prevA = t.querySelector('.st.at'), prevH = t.querySelector('.st.hp');
  const oldA = prevA ? +prevA.textContent : null, oldH = prevH ? +prevH.textContent : null;
  t.innerHTML = tokenHTML(m, o);
  t.style.backgroundColor = TC[m.tribe] || '#ffc928';
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
  const atk = o.atk != null ? o.atk : c.atk, hp = o.hp != null ? o.hp : c.hp;
  return `<div class="card${o.golden ? ' golden' : ''}"><div class="art" style="background-color:${tc}"><img src="${ART[c.art]}" alt="" draggable="false"></div>
    <p class="nm" style="font-size:${nfs}px">${c.name}</p><div class="meta"><span class="trb" style="background:${tc}">${lab}</span>${fmtStars(c.tier, c.tier <= 4 ? 16 : 13)}</div>
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
function clear() { stage.innerHTML = ''; applyLayout(false); }
function bg(dim) {
  // the city, plus mirrored copies of it on each side so the buildings continue to the screen edges on wide phones
  el('img', 'bg mir l', null, stage).src = ART.city; el('img', 'bg mir r', null, stage).src = ART.city;
  el('img', 'bg', null, stage).src = ART.city; if (dim) el('div', 'fade-bg', null, stage);
}
const ffLabel = () => `${ico('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6 7s-5-2-6.5-4.5L3 13.5a1.6 1.6 0 0 1 2.6-1.8L8 14" fill="#ffe08a"></path>', 22, 2.2)}Fat Finger Mode <span class="sw${PROF.fatFinger ? ' on' : ''}">${PROF.fatFinger ? 'On' : 'Off'}</span>`;
function toggleFatFinger() { PROF.fatFinger = !PROF.fatFinger; saveProfile(); sfx('pop'); }
function showTitle() {
  clear(); G.screen = 'title'; bg(true); AU.music('hold');
  soundButton(790, 12, false);
  const t = el('div', 'ab', `<p class="bd" style="margin:0;display:inline-block;background:#2b2140;color:#ffc928;border-radius:999px;padding:4px 14px 2px;font-size:13px;letter-spacing:.2em;box-shadow:0 0 0 3px #fff">AN AUTOBATTLER ABOUT MODERN LIFE</p>
    <h1 class="bd" style="margin:8px 0 0;font-size:112px;line-height:.9;letter-spacing:-.02em;color:#fff;-webkit-text-stroke:5px #2b2140;paint-order:stroke fill;text-shadow:0 9px 0 #2b2140">Late <span style="color:#ff6b5e">Stage</span></h1>`, stage);
  css(t, {left: 0, right: 0, top: 64, textAlign: 'center'});
  anim(t.querySelector('h1'), [{transform: 'scale(.6) rotate(-6deg)', opacity: 0}, {transform: 'scale(1.06) rotate(1deg)', opacity: 1, offset: .7}, {transform: 'scale(1) rotate(0)'}], {duration: 700, easing: 'ease-out', raw: true});
  const rc = rankChip(PROF.rating, 15); stage.appendChild(rc); css(rc, {left: '50%', top: 204}); rc.style.transform = 'translateX(-50%)';
  const b = el('button', 'btn', ico('<path d="M7 4.5v15l12-7.5z" fill="#ffffff"></path>', 26, 2.6) + 'New run', stage);
  css(b, {left: 216, top: 256, width: 236, height: 62, background: '#2ecb6e', fontSize: '30px'});
  anim(b, [{transform: 'scale(.95)'}, {transform: 'scale(1.03)'}, {transform: 'scale(.95)'}], {duration: 1800, iterations: Infinity, raw: true});
  b.onclick = showHeroSelect;
  const cb = el('button', 'btn', ico('<rect x="3" y="5" width="8" height="14" rx="2" fill="#ffc928"></rect><rect x="13" y="5" width="8" height="14" rx="2" fill="#ff8ab8"></rect>', 22, 2.4) + `Heroes <span style="font-size:13px;color:#5a5270">${PROF.unlocked.length}/${HEROES.length}</span>`, stage);
  css(cb, {left: 474, top: 262, width: 162, height: 50, fontSize: '20px'}); cb.onclick = showCollection;
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
function showCollection() {
  clear(); G.screen = 'collection'; bg(true); AU.music('hold');
  PROF.seen = PROF.unlocked.slice(); saveProfile();
  const t = el('div', 'ab bd', `Heroes <span style="font-size:15px;color:#5a5270">${PROF.unlocked.length} of ${HEROES.length} unlocked</span>`, stage);
  css(t, {left: 30, top: 12, fontSize: '22px', background: '#fff', border: '3px solid #2b2140', borderRadius: '999px', padding: '6px 16px 2px', boxShadow: '0 0 0 3px #fff'});
  const rc = rankChip(PROF.rating, 13); stage.appendChild(rc); css(rc, {right: 130, top: 14});
  const back = el('button', 'btn', 'Back', stage); css(back, {left: 734, top: 10, width: 90, height: 40, fontSize: '17px'}); back.onclick = showTitle;
  const order = HEROES.map(h => h.slug).sort((a, b) => isUnlocked(b) - isUnlocked(a));
  order.forEach((slug, i) => {
    const h = HERO[slug], lock = !isUnlocked(slug), [c, g] = progressOf(slug);
    const x = 34 + (i % 6) * 130, y = 66 + Math.floor(i / 6) * 160;
    const b = el('button', 'coll', `<div style="position:absolute;inset:0;background:#fff;border:3px solid #2b2140;border-radius:20px;box-shadow:0 0 0 3px #fff,3px 5px 0 3px #2b2140"></div>
      <div style="position:absolute;left:8px;right:8px;top:8px;height:74px;border:2.5px solid #2b2140;border-radius:46px 46px 10px 10px;background:${lock ? '#c9c2d6' : h.col};overflow:visible"><img src="${ART[slug]}" alt="" style="position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);width:92px;height:92px;${lock ? 'filter:grayscale(1) brightness(.7)' : ''}"></div>
      <p class="bd" style="position:absolute;left:4px;right:4px;top:88px;margin:0;text-align:center;font-size:13.5px;line-height:1.05">${h.name.replace('The ', '')}</p>
      ${lock ? `<div class="prog" style="position:absolute;left:12px;right:12px;top:120px"><i style="width:${Math.round(100 * c / g)}%;${c ? '' : 'border:0'}"></i></div><p class="bd" style="position:absolute;left:0;right:0;top:134px;margin:0;text-align:center;font-size:10.5px;color:#5a5270">${g > 1 ? `${c} / ${g}` : 'LOCKED'}</p>
        <span style="position:absolute;right:6px;top:4px">${ico('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#ffc928"></rect><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"></path>', 22)}</span>`
        : `<p style="position:absolute;left:4px;right:4px;top:108px;margin:0;text-align:center;font-size:11px;font-weight:800;color:#5a5270;line-height:1.15">${h.power}</p>`}`, stage);
    css(b, {left: x, top: y, width: 118, height: 150}); b.setAttribute('aria-label', h.name + (lock ? ' (locked)' : ''));
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
}

// ---------------------------------------------------------------- hero select
function showHeroSelect() {
  clear(); G.screen = 'heroes'; bg(false); G.rated = false; AU.music('hold');
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
    tribes.map(t => `<div class="bd" style="display:flex;align-items:center;gap:5px;font-size:12px;line-height:1.6"><i style="width:10px;height:10px;border-radius:3px;border:2px solid #2b2140;background:${TC[t]};display:block"></i>${TP[t]}</div>`).join(''), stage);
  css(box, {left: 722, top: 58, width: 106, background: '#fff', border: '2.5px solid #2b2140', borderRadius: '16px', padding: '8px 9px 9px', boxShadow: '0 0 0 3px #fff'});
  start.onclick = () => { if (chosen) startRun(chosen); };
}

// ---------------------------------------------------------------- run
function startRun(slug) {
  const h = HERO[slug];
  G.lobby = new window.LSLobby(G.seed, {human: true, heroSlug: slug, boundaries: h.boundaries, tribes: G.tribes, rating: PROF.rating});
  G.me = G.lobby.human; G.me.rating = PROF.rating; G.hand = []; G.feed = []; G.heroSlug = slug; G.firstTurn = true; G.streak = 0; G.minHealth = 99; G.saved = false; NEW_UNLOCKS = [];
  G.me.board = [];
  newTurn();
}
function drawFeed(keep) {
  const me = G.me;
  if (keep && G.feed.length) { /* saved Feed stays */ } else G.feed = me.drawFeed().map(c => ({card: c, a: me.feedBonus(c).a, h: me.feedBonus(c).h, key: Math.random()}));
  me.getFeed = () => G.feed;
}
function newTurn() {
  const me = G.me, L = G.lobby;
  me.beginTurn(); me.log = me.log.filter(e => e.type === 'likes');
  G.heroUsed = false;
  const kept = G.saved && G.feed.length;
  drawFeed(G.saved); G.saved = false;
  L.planPairs();
  buildShop();
  animateTurnStart(kept).then(() => { if (me.log.length) playLog(); });
}

// ---------------------------------------------------------------- shop layout
// Layouts for the shop and fights: normal, or Fat Finger Mode (cards 88 instead of 68, Feed and board nearly edge to edge,
// the left column moved beside the hand). Only sizes and positions change; taps and drags work the same.
const LAYOUTS = {
  normal: {ff: false, tok: 68, x0: 114, w: 616, feedY: 74, boardY: 180, handY: 266, fgap: 28, bgap: 20, feedTop: 58, boardTop: 166, rowH: 96,
    arc: 3, sellMaxY: 140, boardMinY: {feed: 172, other: 158}, boardMaxY: 270, handTop: 268, hand: {cx: 465, spread: 470, w: 84, max: 92},
    cTop: [72, 200], cY: [86, 214], cx0: 114, cw: 616},
  // Fat Finger Mode: four bands, no overlaps. Lobby strip 4-38 (plus Tribes and Menu), Feed 42-146, board 152-256, hand 262-390.
  // Hero, Level Up and Hero Power sit left of the hand; Gold, Scroll, Save and Ready on the right rail (x >= 750).
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
  stage.classList.toggle('ff', LY.ff);
}
const HALF = () => LY.tok / 2;
function rowX(i, n, gap) { return LY.x0 + (LY.w - (n * LY.tok + (n - 1) * gap)) / 2 + i * (LY.tok + gap); }
function feedX(i, n) { return rowX(i, n, LY.fgap); }
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
    const c = el('div', 'lobchip' + (p === me ? ' you' : '') + (p === nxt ? ' next' : '') + (!p.alive ? ' dead' : ''), `<span class="av"><img src="${ART[p.hero] || ART.follower}" alt=""></span>${p.alive ? p.health + p.boundaries : '✕'}${p === nxt ? '<span class="nx">NEXT</span>' : ''}`, S.lobby);
    c.title = p === me ? 'You' : HERO[p.hero] ? HERO[p.hero].name : p.name;
  }
  // shield
  const lc = me.levelCost();
  const ss = me.tier <= 3 ? 18 : me.tier === 4 ? 16 : me.tier === 5 ? 14 : 12.5;
  S.shield.innerHTML = shieldSVG('#c88af8') + `<span class="ab stars-row" style="left:4px;right:4px;top:${lc === null ? 26 : 17}px;height:18px;display:flex;align-items:center;justify-content:center;gap:0">${STAR(ss).repeat(me.tier)}</span>` +
    (lc === null ? '<span class="ab" style="left:0;right:0;top:52px;text-align:center;font-size:13px;letter-spacing:.12em">MAX TIER</span>' :
    `<span class="ab" style="left:0;right:0;top:40px;text-align:center;font-size:11px;letter-spacing:.1em">LEVEL UP</span><span class="ab" style="left:19px;top:56px;width:54px;height:28px;background:#fff;border:2.5px solid #2b2140;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:4px">${ico('<circle cx="12" cy="12" r="10" fill="#2ecb6e"></circle><path d="M12 17V7.5M7.8 11.5L12 7.3l4.2 4.2"></path>', 18, 2.6)}<span class="coin" style="position:static;width:21px;height:21px;font-size:12px;box-shadow:none">${lc}</span></span>`);
  S.shield.classList.toggle('off', lc !== null && me.gold[0] < lc);
  S.shield.setAttribute('aria-label', lc === null ? `Tier ${me.tier}, max` : `Tier ${me.tier}. Level up for ${lc} gold`);
  // gold
  S.gold.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#2b2140" stroke-width="2"><circle cx="12" cy="12" r="10" fill="#ffc928"></circle><circle cx="12" cy="12" r="5" stroke="#d99a12" stroke-width="2.4"></circle></svg><span style="padding-top:3px">${me.gold[0]}</span>`;
  S.bonus.style.display = me.bonus_next ? 'block' : 'none'; S.bonus.textContent = `+${me.bonus_next} next turn`;
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
    if (!e) { e = el('div', 'hc' + (hc.golden ? ' golden' : ''), `<div class="pn" style="background-color:${TC[c.tribe]}"><img src="${ART[c.art]}" alt="" draggable="false"></div><p class="hn">${c.name}</p><div class="hs at">${c.atk + hc.a}</div><div class="hs hp">${c.hp + hc.h}</div>`, S.layer); S.handEl.set(hc.key, e); bindToken(e, 'hand', hc); css(e, {left: p.x, top: p.y + 40}); }
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
      floatText(r[0], r[1] - 30, e.type === 'gold' ? `+${e.n} gold` : `+${e.n} gold next turn`, 'gold');
      if (e.type === 'gold') coinFly(r, center(rectOf(S.gold)), e.n); sfx('coin');
    } else if (e.type === 'triple') {
      if (t) { const c = center(rectOf(t)); ring(c[0], c[1], '#ffc928', 110); confetti(c[0], c[1], 24); anim(t, [{transform: 'scale(.4) rotate(-180deg)'}, {transform: 'scale(1.3) rotate(10deg)', offset: .6}, {transform: 'scale(1)'}], {duration: 700, easing: 'ease-out'}); }
      toast('Triple! Golden minion', 1400); sfx('triple');
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
function canBuy(f) { if (tripleReady(f.card)) { if (G.me.gold[0] < costOf(f)) { shake(S.gold); toast('Not enough gold'); return false; } return true; } if (G.hand.length >= 10) { toast('Your hand is full'); return false; } if (G.me.gold[0] < costOf(f)) { shake(S.gold); toast('Not enough gold'); return false; } return true; }
function shake(e) { sfx('error'); anim(e, [{transform: 'translateX(0)'}, {transform: 'translateX(-6px)'}, {transform: 'translateX(6px)'}, {transform: 'translateX(-3px)'}, {transform: 'translateX(0)'}], {duration: 300, raw: true}); }
function goldTick(delta) {
  anim(S.gold, [{transform: 'scale(1)'}, {transform: 'scale(1.18)'}, {transform: 'scale(1)'}], {duration: 260, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  const c = center(rectOf(S.gold)); floatText(c[0] - 10, c[1] + 20, (delta > 0 ? '+' : '') + delta, delta > 0 ? 'gold' : 'red');
}
async function buy(f, toBoardAt = null) {
  if (G.busy || !G.feed.includes(f) || !canBuy(f)) return;   // the Feed may have changed (Scroll) since this card was picked up
  const me = G.me, cst = costOf(f);
  me.gold[0] -= cst; me.gainSpend(cst); goldTick(-cst); PROF.stats.hires++; sfx('buy');
  G.feed.splice(G.feed.indexOf(f), 1);
  const hc = {card: f.card, a: f.a, h: f.h, key: Math.random()};
  const t = S.feedTok.get(f.key);
  if (tripleReady(f.card)) {   // triple at once: board copies first, then copies from the hand
    if (t) { t._leaving = true; t.remove(); }
    const onBoard = me.board.filter(m => m.name === f.card.name && !m.golden && !m.follower).length;
    const fromHand = G.hand.filter(h => h.card.name === f.card.name && !h.golden).slice(0, Math.max(0, 2 - onBoard));
    for (const h of fromHand) { G.hand.splice(G.hand.indexOf(h), 1); const e = S.handEl.get(h.key); if (e) { e._leaving = true; e.remove(); } }
    const res = me.tripleOnBuy(f.card, [{a: f.a, h: f.h}, ...fromHand.map(h => ({a: h.a, h: h.h}))], me.gold);
    if (res === 'hand') { G.hand.push({card: f.card, a: f.a + fromHand.reduce((s, h) => s + h.a, 0), h: f.h + fromHand.reduce((s, h) => s + h.h, 0), golden: true, key: Math.random()}); toast('Triple! Golden minion', 1400); sfx('triple'); }
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
  if (card.collab) return me.board.length ? me.board.filter(m => true) : null;
  if (!E.TARGETED_FI.has(card.name)) return null;
  const cand = card.name === 'Art Student' ? me.board.filter(m => m.tribe === 'Creative') : me.board.slice();
  if (card.name === 'Venture Capitalist' && me.gold[0] <= 0) return null;
  return cand.length ? cand : null;
}
async function playCard(hc, pos = null, target = null) {
  if (G.busy) return;
  const me = G.me, card = hc.card;
  if (!G.hand.includes(hc)) { renderAll(); return; }   // already played (a second tap or drag on the same card): never remove another one
  const merges = !hc.golden && me.board.filter(m => m.name === card.name && !m.golden && !m.follower).length >= 2;
  if (!card.collab && me.board.length >= 7 && !merges) { toast('Your board is full (7)'); renderAll(); return; }
  if (target === null) {
    const cands = needsTarget(card);
    if (cands) { await chooseTarget(cands, card.collab ? `Choose a minion for ${card.name} to stick to` : `Choose a minion for ${card.name}`, async t => playCard(hc, pos, t), () => renderAll()); return; }
  }
  if (!G.hand.includes(hc)) { renderAll(); return; }
  G.hand.splice(G.hand.indexOf(hc), 1);
  const e = S.handEl.get(hc.key); if (e) { e._leaving = true; e.remove(); }
  const m = me.play(card, me.gold, pos, target); sfx('slap');
  if (m && !card.collab) { m.atk += hc.a; m.hp += hc.h; if (hc.golden) { m.golden = true; m.atk += card.atk; m.hp += card.hp; } }
  if (card.collab) { const c = S.tok.get(m.id); }
  G.firstTurn = G.firstTurn && me.turn <= 1;
  // sticker slap
  await afterAction(true);
  if (m && S.tok.get(m.id)) { const t = S.tok.get(m.id), c = center(rectOf(t)); ring(c[0], c[1], '#ffffff', 80); if (card.kind === 'fi' || /^First Impression/.test(card.text)) { ring(c[0], c[1], '#ff6b5e', 110); } }
}
async function sell(m) {
  if (G.busy) return;
  const me = G.me, t = S.tok.get(m.id), g = me.sellValue(m);
  const c = t ? center(rectOf(t)) : [420, 210];
  me.sell(m, me.gold); sfx('sell');
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
  me.payScroll(); if (sc) goldTick(-sc); G.saved = false; PROF.stats.scrolls++; sfx('scroll');
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
  if (me.gold[0] < lc) { shake(S.shield); toast(`Level up costs ${lc} gold`); return; }
  me.gold[0] -= lc; me.gainSpend(lc); me.tier += 1; me.turns_at_tier = 0; goldTick(-lc);
  if (me.tier === 6) { PROF.flags.tier6 = true; checkUnlocks(); }
  sfx('levelup'); AU.intensity(tierLevel());
  renderChrome();
  anim(S.shield, [{transform: 'scale(1) rotate(0)'}, {transform: 'scale(1.25) rotate(-8deg)'}, {transform: 'scale(.95) rotate(4deg)'}, {transform: 'scale(1)'}], {duration: 600, easing: 'ease-out', raw: true});
  const c = center(rectOf(S.shield)); ring(c[0], c[1] - 20, '#ffc928', 120); confetti(c[0], c[1] - 20, 14);
  const stars = S.shield.querySelectorAll('svg')[me.tier];
  if (stars) anim(stars, [{transform: 'scale(3) rotate(-90deg)', opacity: 0}, {transform: 'scale(1) rotate(0)', opacity: 1}], {duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  toast(`Tier ${me.tier}! The Feed now shows ${E.FEED_SIZE[me.tier]} minions`, 1500);
  await playLog();
}
async function useLikes() {
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
    sfx('discover');
    const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 65});
    el('div', 'dim', '', ov);
    const head = el('div', 'ab bd', p.why === 'triple' ? `Triple! Discover a ${'★'.repeat(p.tier)} minion` : p.why === 'hero' ? `${HERO[G.heroSlug].power}: Discover a minion` : `Discover a ${TP[p.why] ? TP[p.why].replace(/s$/, '') : 'minion'}`, ov);
    css(head, {left: 0, right: 0, top: 14, textAlign: 'center'}); head.innerHTML = `<span style="display:inline-block;background:#ffc928;border:3px solid #2b2140;border-radius:999px;padding:6px 18px 2px;box-shadow:0 0 0 3px #fff;font-size:22px">${head.textContent}</span>`;
    p.options.forEach((c, i) => {
      const b = el('button', 'ab', `<div style="transform:scale(.62);transform-origin:top left">${cardHTML(c)}</div>`, ov);
      css(b, {left: 168 + i * 176, top: 62, width: 149, height: 208, padding: 0, border: 0, background: 'none', cursor: 'pointer'});
      anim(b, [{transform: 'rotateY(90deg) translateY(30px)', opacity: 0}, {transform: 'rotateY(0) translateY(0)', opacity: 1}], {duration: 420, delay: i * 110, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards', raw: true});
      b.onclick = async () => {
        sfx('pick');
        ov.querySelectorAll('button.ab').forEach(o => { if (o !== b) anim(o, [{transform: 'translateY(0)', opacity: 1}, {transform: 'translateY(120px) rotate(12deg)', opacity: 0}], {duration: 300, fill: 'forwards', raw: true}); });
        await anim(b, [{transform: 'scale(1)'}, {transform: 'scale(1.12)'}, {transform: 'translateY(160px) scale(.5)', opacity: 0}], {duration: 420, fill: 'forwards', raw: true});
        ov.remove();
        if (G.hand.length < 10) G.hand.push({card: c, a: 0, h: 0, key: Math.random()});
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
  const kws = ['Attention Seeker', 'Out of Office', 'Toxic', 'First Impression', 'Legacy', 'Rebrand', 'Collab', 'Discover', 'Clock In', 'Grievance', 'Side Gig', 'Like', 'Acquire', 'Cleave'].filter(k => card.text.includes(k));
  const KD = {'Attention Seeker': 'Enemies must attack it first.', 'Out of Office': 'Ignores the first damage it would take.', 'Toxic': 'Destroys any minion it damages.', 'First Impression': 'Happens when you play it from your hand.', 'Legacy': 'Happens when it dies.', 'Rebrand': 'Comes back once with 1 Health after it dies.', 'Collab': 'Sticks to a minion: adds its stats and effect, and makes it a Techie too.', 'Discover': 'Pick 1 of 3 cards to add to your hand.',
    'Clock In': 'Happens every time it attacks.', 'Grievance': 'Happens every time that many friendly minions have died this combat.', 'Side Gig': 'Pay the gold in the shop to use it, once per turn.', 'Like': 'Give a Like to a minion for +1/+1. Tap the heart next to your hero.', 'Acquire': 'Take a minion out of the Feed.', 'Cleave': 'Also damages the minions next to its target.'};
  const ex = inst && inst.extras && inst.extras.length ? `<p class="kwl">Collabs: ${inst.extras.join(', ')}</p>` : '';
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
    if (G.busy || G.screen !== 'shop') return;
    ev.preventDefault();
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
const FOLLOWER = () => CARD['Follower'] || {name: 'Follower', tribe: 'Influencer', tier: 1, atk: 1, hp: 1, art: 'follower', fit: 13, html: 'A loyal fan.', full_html: 'A loyal fan.', text: '', flavour: ''};
function showDetailFor(kind, e) {
  const me = G.me;
  if (kind === 'feed') { const f = e._f; return showDetail(f.card, {atk: f.card.atk + f.a, hp: f.card.hp + f.h}, [{label: 'Hire', cost: costOf(f), fn: () => buy(f), disabled: me.gold[0] < costOf(f) || (G.hand.length >= 10 && !tripleReady(f.card))}]); }
  if (kind === 'hand') { const h = e._h; return showDetail(h.card, {atk: h.card.atk + h.a, hp: h.card.hp + h.h, golden: h.golden}, [{label: 'Play', fn: () => playCard(h, null), disabled: !h.card.collab && me.board.length >= 7 && !(!h.golden && me.board.filter(m => m.name === h.card.name && !m.golden && !m.follower).length >= 2)}]); }
  const m = e._m, card = m.follower ? FOLLOWER() : CARD[m.name] || FOLLOWER();
  const acts = [{label: 'Sell', cost: '+' + me.sellValue(m), color: '#ffc928', fn: () => sell(m)}];
  if (m.is_('Side Hustle')) acts.push({label: 'Side Gig', cost: 1, color: '#2fd0d0', disabled: !me.canGig(m), fn: () => chooseTarget(me.board.filter(o => (o.tribe === 'Hustler' || o.tribe2 === 'Hustler') && o !== m), `Side Gig: choose a Hustler for +${m.golden ? 6 : 3}/+${m.golden ? 6 : 3}`, async t => { me.sideGig(m, t); goldTick(-1); renderAll(); await playLog(); }, () => {})});
  if (me.likes > 0) acts.push({label: 'Give a Like', color: '#ff8ab8', fn: async () => { me.giveLike(m); sfx('like'); renderAll(); await playLog(); }});
  showDetail(card, m, acts);
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
    if (overBoard && (G.me.board.length < 7 || tripleReady(e._f.card))) { if (canBuy(e._f)) return buy(e._f, gap !== null ? gap : boardIndexAt(x)); }
    else if (overHand) return buy(e._f);
    renderAll(); return;
  }
  if (kind === 'hand') {
    if (overBoard) return playCard(e._h, gap !== null ? gap : boardIndexAt(x));
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
  if (g.bonus) floatText(c[0], c[1] + 30, `+${g.bonus} bonus`, 'gold');
  if (g.carry) floatText(c[0], c[1] + 46, `+${g.carry} carried over`, 'gold');
  toast(`Turn ${G.me.turn}`, 1100);
  await sleep(450);
  G.busy = false;
}
async function ready() {
  if (G.busy || G.mode) return;
  G.busy = true;
  const me = G.me;
  me.spent_this_turn = me.spent - me.spent_start;
  me.log = [];
  me.endOfTurn();
  anim(S.ready, [{transform: 'translateY(0)'}, {transform: 'translateY(6px)'}, {transform: 'translateY(0)'}], {duration: 200, raw: true}); sfx('ready');
  if (me.log.length) { renderAll(); await playLog(); await sleep(500); }
  me.log = [];
  G.firstTurn = false;
  G.lobby.botTurns();
  const rec = G.lobby.fightRound();
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
  const f = rec.fight, opp = rec.b || rec.ghost, oppHero = opp.hero;
  const Cm = {els: new Map(), side: new Map()};
  _ce = Cm.els;
  const surfE = el('div', 'surf', '', stage); css(surfE, {left: LY.cx0, top: LY.cTop[0], width: LY.cw, height: LY.rowH, borderRadius: '24px', background: '#eeeaf5'});
  const surfM = el('div', 'surf desk', '', stage); css(surfM, {left: LY.cx0, top: LY.cTop[1], width: LY.cw, height: LY.rowH, borderRadius: '24px'});
  const oav = el('div', 'av-big', `<img src="${ART[oppHero] || ART.follower}" alt="">`, stage); css(oav, {left: 16, top: 12, width: 70, height: 70});
  // every fight of the round is already resolved, so show health as it was before this one (and never below 0)
  const hpOf = (p, before) => Math.max(0, p.health + p.boundaries + (before && rec.loser === p ? rec.dmg : 0));
  const ohp = el('div', 'badge', `${opp.ghost ? '—' : hpOf(opp, true)}`, stage); css(ohp, {left: 60, top: 56, width: 40, height: 30, fontSize: '17px'});
  oav.title = (opp.ghost ? 'Ghost of ' : '') + (HERO[oppHero] ? HERO[oppHero].name : opp.name);
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
      if (t) { sfx('death'); Cm.els.delete(fr.id); t.style.transition = 'none'; t.style.filter = 'grayscale(1)';
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
  }
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
    if (m.hp < p.hp) burstAt(c[0] + 14, c[1] - 14, `−${p.hp - m.hp}`);
  }));
  prev.forEach(b => b.forEach(p => { if (!next.some(nb => nb.some(m => m.id === p.id))) { const t = findTok(p.id); if (t) { const c = center(rectOf(t)); burstAt(c[0] + 14, c[1] - 14, '✕'); } } }));
}
function findTok(id) { return CombatEls().get(id); }
let _ce = null; function CombatEls() { return _ce || new Map(); }
// ---------------------------------------------------------------- end of run
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
    PROF.history.push({t: Date.now(), hero: G.heroSlug, place: me.place, d: after - before}); PROF.history = PROF.history.slice(-50);
    checkUnlocks();
  }
  const p = el('div', 'panel', `<p class="bd" style="margin:0;font-size:13px;letter-spacing:.12em;color:#5a5270">${me.conceded ? 'CONCEDED' : 'RUN OVER'} · ROUND ${L.turn}</p>
    <p class="bd" style="margin:2px 0 0;font-size:44px"><span class="cnt">0</span>${['th', 'st', 'nd', 'rd'][me.place] && me.place < 4 ? ['th', 'st', 'nd', 'rd'][me.place] : 'th'} <span style="font-size:22px;color:#5a5270">of 8</span></p>

    <div class="lst" style="margin-top:8px;display:flex;flex-direction:column;gap:2px"></div>`, stage);
  css(p, {left: 30, top: 22, width: 380, height: 346, padding: '18px 22px'});
  const lst = p.querySelector('.lst');
  order.forEach((q, i) => {
    const sty = q.style_code && window.LS_STYLES[q.style_code] ? window.LS_STYLES[q.style_code] : null;
    const tr = sty ? sty[0] : null;
    const row = el('div', '', `<span style="width:18px;text-align:right">${q.place || 1}</span><span style="position:relative;width:22px;height:22px;border-radius:50%;border:2px solid #2b2140;overflow:hidden;background:#8fd4ff"><img src="${ART[q.hero] || ART.follower}" alt="" style="position:absolute;left:-4px;bottom:-4px;width:30px;height:30px"></span><span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:26px;height:24px">${q === me ? 'You' : HERO[q.hero] ? HERO[q.hero].name.replace('The ', '') : q.name}</span><span style="font-size:11px;color:#5a5270">${(q === me ? before : q.rating ?? '').toLocaleString('en')}</span>${tr ? `<span class="chip" style="padding:0 7px 0 3px;font-size:11px"><i style="background:${TC[tr]}"></i>${sty[1]}</span>` : q === me ? '' : '<span class="chip" style="padding:0 7px;font-size:11px">Big stats</span>'}`, lst);
    css(row, {display: 'flex', alignItems: 'center', gap: '8px', height: 24, borderRadius: '999px', padding: '0 10px 0 3px', fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: '13.5px', lineHeight: 1});
    if (q === me) { row.style.background = '#ffc928'; row.style.border = '2.5px solid #2b2140'; }
    anim(row, [{transform: 'translateX(-30px)', opacity: 0}, {transform: 'translateX(0)', opacity: 1}], {duration: 300, delay: 300 + i * 70, fill: 'backwards', raw: true});
  });
  const cnt = p.querySelector('.cnt'); let k = 8; const iv = setInterval(() => { cnt.textContent = k; sfx('tick', {n: 8 - k, gap: 0}); if (k <= me.place) { clearInterval(iv); sfx(me.place <= 4 ? 'victory' : 'defeat'); setTimeout(() => { if (G.screen === 'end') AU.music('hold'); }, 3500); anim(cnt, [{transform: 'scale(1.6)'}, {transform: 'scale(1)'}], {duration: 300, raw: true}); if (me.place <= 4) confetti(120, 90, 30); } k--; }, 110);
  cnt.style.display = 'inline-block';
  const bA = bracketOf(before), bB = bracketOf(after);
  const right = el('div', 'panel', `<p class="bd" style="margin:0;font-size:13px;letter-spacing:.12em;color:#5a5270">RATING</p>
    <div style="display:flex;align-items:baseline;gap:10px;margin-top:2px"><span class="bd rnum" style="font-size:36px">${before.toLocaleString('en')}</span><span class="bd" style="font-size:22px;color:${delta >= 0 ? '#14a052' : '#ff6b5e'}">${delta >= 0 ? '+' : '−'}${Math.abs(delta)}</span></div>
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
  if (NEW_UNLOCKS.length) setTimeout(() => showUnlocks(NEW_UNLOCKS.splice(0)), 1400);
}
function showUnlocks(list) {
  if (!list.length) return;
  const slug = list.shift(), h = HERO[slug];
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 96}); el('div', 'dim', '', ov).style.background = 'rgba(43,33,64,.8)';
  const head = el('div', 'ab bd', '<span style="display:inline-block;background:#ffc928;border:3px solid #2b2140;border-radius:999px;padding:6px 18px 2px;box-shadow:0 0 0 3px #fff;font-size:22px">New hero unlocked!</span>', ov); css(head, {left: 0, right: 0, top: 14, textAlign: 'center'});
  const card = el('div', 'ab', heroHTML(h), ov); css(card, {left: 312, top: 62}); card.style.transform = 'scale(.8)'; card.style.transformOrigin = 'top left';
  anim(card, [{transform: 'scale(.2) rotate(-30deg)', opacity: 0}, {transform: 'scale(.88) rotate(4deg)', opacity: 1, offset: .7}, {transform: 'scale(.8) rotate(0)'}], {duration: 600, easing: 'ease-out', raw: true});
  setTimeout(() => confetti(422, 150, 40), 300); sfx('unlock');
  ov.onpointerup = () => { ov.remove(); showUnlocks(list); };
}

window.LSUI = {showTitle, G, rc: () => renderChrome(), rebuild: () => { buildShop(); }, end: () => showEnd()};
showTitle();
})();
