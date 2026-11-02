/* Late Stage UI: shop, drag & drop, animated combat playback, screens. */
(function () {
'use strict';
const E = window.LSEngine;
E.load(window.LS_CARDS, window.LS_STYLES);
const TC = window.LS_TRIBE_COL, TP = window.LS_TRIBE_PLURAL;
const HEROES = window.LS_HEROES, HERO = Object.fromEntries(HEROES.map(h => [h.slug, h]));
const STARTERS = ['remote', 'boomer', 'h_gymbro', 'h_procrastinator'];
const ART = {};
for (const [k, v] of Object.entries(window.LS_ART)) ART[k] = URL.createObjectURL(new Blob([v], {type: 'image/svg+xml'}));
const CARD = Object.fromEntries(window.LS_CARDS.map(c => [c.name, c]));
const artOf = name => ART[name === 'Follower' ? 'follower' : (CARD[name] ? CARD[name].art : 'follower')];
const W = 844, H = 390;

// ---------------------------------------------------------------- helpers
const stage = document.getElementById('stage');
let SCALE = 1;
function fit() {
  const wrap = document.getElementById('wrap'), cs = getComputedStyle(wrap);
  const aw = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const s = Math.min(aw / W, ah / H);
  SCALE = s; stage.style.transform = `scale(${s})`;
}
addEventListener('resize', fit); fit();
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
  let s = `<div class="clip"><img src="${artOf(name)}" alt="" draggable="false"></div>`;
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
    <p class="txt" style="font-size:${c.fit}px">${c.html}</p><div class="sa">${atk}</div><div class="sh">${hp}</div></div>`;
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

// ---------------------------------------------------------------- game state
const G = {lobby: null, me: null, hand: [], feed: [], heroUsed: false, busy: false, mode: null, screen: null, firstTurn: true};

// ---------------------------------------------------------------- title
function clear() { stage.innerHTML = ''; }
function bg(dim) { el('img', 'bg', null, stage).src = ART.city; if (dim) el('div', 'fade-bg', null, stage); }
function showTitle() {
  clear(); G.screen = 'title'; bg(true);
  const t = el('div', 'ab', `<p class="bd" style="margin:0;display:inline-block;background:#2b2140;color:#ffc928;border-radius:999px;padding:4px 14px 2px;font-size:13px;letter-spacing:.2em;box-shadow:0 0 0 3px #fff">AN AUTOBATTLER ABOUT MODERN LIFE</p>
    <h1 class="bd" style="margin:8px 0 0;font-size:112px;line-height:.9;letter-spacing:-.02em;color:#fff;-webkit-text-stroke:5px #2b2140;paint-order:stroke fill;text-shadow:0 9px 0 #2b2140">Late <span style="color:#ff6b5e">Stage</span></h1>`, stage);
  css(t, {left: 0, right: 0, top: 64, textAlign: 'center'});
  anim(t.querySelector('h1'), [{transform: 'scale(.6) rotate(-6deg)', opacity: 0}, {transform: 'scale(1.06) rotate(1deg)', opacity: 1, offset: .7}, {transform: 'scale(1) rotate(0)'}], {duration: 700, easing: 'ease-out', raw: true});
  const b = el('button', 'btn', ico('<path d="M7 4.5v15l12-7.5z" fill="#ffffff"></path>', 26, 2.6) + 'New run', stage);
  css(b, {left: 302, top: 250, width: 240, height: 62, background: '#2ecb6e', fontSize: '30px'});
  anim(b, [{transform: 'scale(.95)'}, {transform: 'scale(1.03)'}, {transform: 'scale(.95)'}], {duration: 1800, iterations: Infinity, raw: true});
  b.onclick = showHeroSelect;
  const t1 = makeToken({name: 'Main Character', tribe: 'Influencer', atk: 5, hp: 7, tier: 6}); stage.appendChild(t1); css(t1, {left: 620, top: 250}); t1.style.transform = 'rotate(8deg)';
  const t2 = makeToken({name: 'Trash Panda', tribe: 'Feral', atk: 2, hp: 1, tier: 1}); stage.appendChild(t2); css(t2, {left: 160, top: 254}); t2.style.transform = 'rotate(-9deg)';
  for (const [tk, d] of [[t1, 0], [t2, 300]]) anim(tk, [{translate: '0 0'}, {translate: '0 -8px'}, {translate: '0 0'}], {duration: 2200, delay: d, iterations: Infinity, easing: 'ease-in-out', raw: true});
  const n = el('p', 'ab', `v0.1 prototype · build ${(window.LS_BUILD || {}).n || 'dev'} · all 7 tribes · 7 bots`, stage); css(n, {left: 0, right: 0, bottom: 8, margin: 0, textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#5a5270'});
}

// ---------------------------------------------------------------- hero select
function showHeroSelect() {
  clear(); G.screen = 'heroes'; bg(false);
  const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  G.seed = seed;
  const rng = E.RNG(seed);
  const pick = rng.shuffle(STARTERS.slice()).slice(0, 3);
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
  G.lobby = new window.LSLobby(G.seed, {human: true, heroSlug: slug, boundaries: h.boundaries, tribes: G.tribes});
  G.me = G.lobby.human; G.hand = []; G.feed = []; G.heroSlug = slug; G.firstTurn = true;
  G.me.board = [];
  newTurn();
}
function drawFeed(keep) {
  const me = G.me;
  if (keep && G.feed.length) {
    if (G.heroSlug === 'remote') for (const f of G.feed) { f.a += 1; f.h += 1; }
  } else G.feed = me.drawFeed().map(c => ({card: c, a: 0, h: 0, key: Math.random()}));
}
function newTurn() {
  const me = G.me, L = G.lobby;
  me.beginTurn(); me.log = [];
  G.heroUsed = false;
  drawFeed(G.saved); G.saved = false;
  L.planPairs();
  buildShop();
  animateTurnStart();
}

// ---------------------------------------------------------------- shop layout
const FEED_Y = 74, BOARD_Y = 180, HAND_Y = 266;
function feedX(i, n) { return 114 + (616 - (n * 68 + (n - 1) * 28)) / 2 + i * 96; }
function boardX(i, n) { return 114 + (616 - (n * 68 + (n - 1) * 20)) / 2 + i * 88; }
function handPos(i, n) { const sp = Math.min(92, 470 / Math.max(1, n)); const x0 = 465 - ((n - 1) * sp) / 2 - 42; return {x: x0 + i * sp, y: HAND_Y + Math.abs(i - (n - 1) / 2) * 3, r: (i - (n - 1) / 2) * 3}; }
let S = {};   // shop dom refs
function buildShop() {
  clear(); G.screen = 'shop'; bg(false);
  S = {tok: new Map(), feedTok: new Map(), handEl: new Map()};
  S.lobby = el('div', 'ab', '', stage); css(S.lobby, {left: 114, top: 8, display: 'flex', gap: '5px'});
  S.feedSurf = el('div', 'surf', '<div class="tag" style="background:#ff8ab8">THE FEED · 3 GOLD EACH</div>', stage); css(S.feedSurf, {left: 114, top: 58, width: 616, height: 96, borderRadius: '22px', background: '#fff'});
  S.boardSurf = el('div', 'surf', '<div class="tag" style="background:#fff">YOUR BOARD</div>', stage); css(S.boardSurf, {left: 114, top: 166, width: 616, height: 96, borderRadius: '24px', background: '#eeeaf5'});
  S.sellZone = el('div', 'ab bd', '', stage); css(S.sellZone, {left: 114, top: 58, width: 616, height: 96, borderRadius: '22px', border: '3px dashed #2b2140', background: 'rgba(255,201,40,.92)', display: 'none', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '26px', zIndex: 5});
  S.handZone = el('div', 'ab', '', stage); css(S.handZone, {left: 200, top: 268, width: 530, height: 122});
  // left column
  S.shield = el('button', 'sb', '', stage); css(S.shield, {left: 10, top: 10, width: 92, height: 112}); S.shield.onclick = levelUp;
  S.tribes = el('div', 'ab', `<p class="bd" style="margin:0 0 4px;font-size:10px;letter-spacing:.12em;color:#5a5270">IN THIS LOBBY</p>` + G.lobby.tribes.map(t => `<div class="bd" style="display:flex;align-items:center;gap:5px;font-size:11px;line-height:1.5"><i style="width:10px;height:10px;border-radius:3px;border:2px solid #2b2140;background:${TC[t]};display:block"></i>${TP[t]}</div>`).join(''), stage);
  css(S.tribes, {left: 10, top: 146, width: 96, background: '#fff', border: '2.5px solid #2b2140', borderRadius: '14px', padding: '6px 6px 7px', boxShadow: '0 0 0 3px #fff'});
  S.heroAv = el('div', 'av-big', `<img src="${ART[G.heroSlug]}" alt="">`, stage); css(S.heroAv, {left: 16, top: 290, width: 88, height: 88});
  S.heroAv.onclick = () => showHeroDetail();
  S.hp = el('div', 'badge', '', stage); css(S.hp, {left: 72, top: 346, width: 42, height: 34, fontSize: '20px'});
  S.arm = el('div', 'badge arm', '', stage); css(S.arm, {left: 76, top: 314, width: 32, height: 30, fontSize: '15px'});
  S.power = el('button', 'sb', '', stage); css(S.power, {left: 134, top: 286, width: 70, height: 76}); S.power.onclick = usePower;
  // right column
  S.gold = el('div', 'info', '', stage); css(S.gold, {left: 746, top: 10, width: 84, height: 40, borderRadius: '999px', gap: '6px', fontSize: '21px'});
  S.bonus = el('div', 'ab bd', '', stage); css(S.bonus, {left: 752, top: 50, background: '#ffc928', border: '2.5px solid #2b2140', borderRadius: '0 0 10px 10px', padding: '3px 7px 1px', fontSize: '11px', lineHeight: 1.3, display: 'none'});
  S.scroll = el('button', 'sb', `<svg width="68" height="72" viewBox="0 0 68 72" aria-hidden="true"><circle cx="34" cy="38" r="28" fill="#fff" stroke="#fff" stroke-width="9"></circle><circle cx="34" cy="33" r="28" fill="#fff" stroke="#fff" stroke-width="9"></circle><circle cx="34" cy="38" r="28" fill="#2b2140" stroke="#2b2140" stroke-width="3"></circle><g class="face"><circle cx="34" cy="33" r="28" fill="#8fd4ff" stroke="#2b2140" stroke-width="3"></circle><g class="spin" transform="translate(18 17) scale(1.34)" fill="none" stroke="#2b2140" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 10A8 8 0 0 0 5.4 6.6"></path><path d="M5 2.8v4.4h4.4"></path><path d="M4.5 14a8 8 0 0 0 14.1 3.4"></path><path d="M19 21.2v-4.4h-4.4"></path></g></g></svg><span class="coin" style="left:46px;top:46px;width:24px;height:24px;font-size:13px">1</span>`, stage);
  css(S.scroll, {left: 754, top: 78, width: 68, height: 72}); S.scroll.setAttribute('aria-label', 'Scroll the Feed, 1 gold'); S.scroll.onclick = scroll;
  S.save = el('button', 'sb', '', stage); css(S.save, {left: 759, top: 158, width: 58, height: 74}); S.save.onclick = toggleSave;
  S.ready = el('button', 'sb', `<svg width="88" height="110" viewBox="0 0 88 110" aria-hidden="true"><rect x="6" y="12" width="76" height="90" rx="38" fill="#fff" stroke="#fff" stroke-width="9"></rect><rect x="6" y="6" width="76" height="90" rx="38" fill="#fff" stroke="#fff" stroke-width="9"></rect><rect x="6" y="12" width="76" height="90" rx="38" fill="#2b2140" stroke="#2b2140" stroke-width="3"></rect><g class="face"><rect x="6" y="6" width="76" height="90" rx="38" fill="#2ecb6e" stroke="#2b2140" stroke-width="3"></rect><path d="M22 30Q26 18 40 15" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"></path></g></svg><span class="ab" style="left:0;right:0;top:45px;text-align:center;font-size:22px;pointer-events:none">Ready</span>`, stage);
  css(S.ready, {left: 746, top: 246, width: 88, height: 110}); S.ready.onclick = ready;
  S.layer = el('div', 'ab', '', stage); css(S.layer, {left: 0, top: 0, width: W, height: H, pointerEvents: 'none'});
  S.hint = el('div', 'ab', '', stage); css(S.hint, {left: 220, top: 300, width: 500, textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#5a5270', pointerEvents: 'none'});
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
  S.shield.innerHTML = shieldSVG(lc === null ? '#ffc928' : '#c88af8') + `<span class="ab" style="left:6px;right:6px;top:16px;display:flex;flex-wrap:wrap;justify-content:center;gap:0 1px">${STAR(17).repeat(me.tier)}</span>` +
    (lc === null ? '<span class="ab" style="left:0;right:0;top:50px;text-align:center;font-size:12px;letter-spacing:.1em">MAX</span>' :
    `<span class="ab" style="left:0;right:0;top:40px;text-align:center;font-size:11px;letter-spacing:.1em">LEVEL UP</span><span class="ab" style="left:19px;top:56px;width:54px;height:28px;background:#fff;border:2.5px solid #2b2140;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:4px">${ico('<circle cx="12" cy="12" r="10" fill="#2ecb6e"></circle><path d="M12 17V7.5M7.8 11.5L12 7.3l4.2 4.2"></path>', 18, 2.6)}<span class="coin" style="position:static;width:21px;height:21px;font-size:12px;box-shadow:none">${lc}</span></span>`);
  S.shield.classList.toggle('off', lc === null || me.gold[0] < lc);
  S.shield.setAttribute('aria-label', lc === null ? `Tier ${me.tier}, max` : `Tier ${me.tier}. Level up for ${lc} gold`);
  // gold
  S.gold.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#2b2140" stroke-width="2"><circle cx="12" cy="12" r="10" fill="#ffc928"></circle><circle cx="12" cy="12" r="5" stroke="#d99a12" stroke-width="2.4"></circle></svg><span style="padding-top:3px">${me.gold[0]}</span>`;
  S.bonus.style.display = me.bonus_next ? 'block' : 'none'; S.bonus.textContent = `+${me.bonus_next} next turn`;
  S.scroll.classList.toggle('off', me.gold[0] < 1);
  S.save.innerHTML = `<svg width="58" height="74" viewBox="0 0 58 74" aria-hidden="true"><g stroke-linejoin="round"><path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" transform="translate(0 5)" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" transform="translate(0 5)" fill="#2b2140" stroke="#2b2140" stroke-width="3"></path><path class="face" d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" fill="${G.saved ? '#ffc928' : '#ff8ab8'}" stroke="#2b2140" stroke-width="3"></path></g></svg><span class="ab" style="left:0;right:0;top:23px;text-align:center;font-size:14px;pointer-events:none">${G.saved ? 'Saved' : 'Save'}</span>`;
  S.feedSurf.style.outline = G.saved ? '3px dashed #ff8ab8' : 'none'; S.feedSurf.style.outlineOffset = '4px';
  // hero / power
  S.hp.textContent = me.health; S.arm.textContent = me.boundaries; S.arm.style.display = me.boundaries > 0 ? 'flex' : 'none';
  const h = HERO[G.heroSlug], passive = h.cost === 'Passive';
  const usable = !passive && !G.heroUsed && me.gold[0] >= +h.cost;
  S.power.innerHTML = `<svg width="70" height="76" viewBox="0 0 70 76" aria-hidden="true"><g stroke-linejoin="round"><path d="M35 6L62 21V52L35 67L8 52V21Z" transform="translate(0 5)" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="M35 6L62 21V52L35 67L8 52V21Z" fill="#fff" stroke="#fff" stroke-width="9"></path><path d="M35 6L62 21V52L35 67L8 52V21Z" transform="translate(0 5)" fill="#2b2140" stroke="#2b2140" stroke-width="3"></path><path class="face" d="M35 6L62 21V52L35 67L8 52V21Z" fill="${passive || usable ? '#2fd0d0' : '#c9c2d6'}" stroke="#2b2140" stroke-width="3"></path></g><g transform="translate(20 20) scale(1.25)" fill="none" stroke="#2b2140" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.3l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="#fff"></path></g></svg>` +
    (passive ? '' : `<span class="coin" style="left:50px;top:-2px;width:24px;height:24px;font-size:13px">${h.cost}</span>`) +
    `<span class="ab" style="left:-20px;right:-20px;top:76px;text-align:center;font-size:11px;line-height:1.1;white-space:nowrap;pointer-events:none">${h.power} <span style="font-family:Nunito,sans-serif;font-size:10px;opacity:.75">· ${passive ? 'Passive' : G.heroUsed ? 'Used' : 'Once per turn'}</span></span>`;
  S.boardSurf.querySelector('.tag').textContent = `YOUR BOARD · ${me.board.length}/7`;
  S.feedSurf.querySelector('.tag').textContent = `THE FEED · ${G.heroSlug === 'h_bargainhunter' ? 2 : 3} GOLD EACH`;
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
    if (!t) { t = makeToken(m, shownStats(m)); S.layer.appendChild(t); S.tok.set(m.id, t); bindToken(t, 'board', m); css(t, {left: boardX(k, n), top: BOARD_Y});
      if (animateNew) anim(t, [{transform: 'scale(0)'}, {transform: 'scale(1.18)', offset: .6}, {transform: 'scale(1)'}], {duration: 360, easing: 'ease-out'}); }
    else updateToken(t, m, shownStats(m));
    t.style.transition = 'left .26s cubic-bezier(.22,1,.36,1), top .26s cubic-bezier(.22,1,.36,1)';
    css(t, {left: boardX(k, n), top: BOARD_Y}); t._m = m; seen.add(m.id);
  });
  for (const [id, t] of S.tok) if (!seen.has(id)) { if (!t._leaving) t.remove(); S.tok.delete(id); }
  if (S.gapEl) { S.gapEl.remove(); S.gapEl = null; }
  if (gapAt !== null) { S.gapEl = el('div', 'slot-hint', '', S.layer); css(S.gapEl, {left: boardX(gapAt, n), top: BOARD_Y}); }
  // feed
  const fseen = new Set();
  G.feed.forEach((f, i) => {
    let t = S.feedTok.get(f.key);
    const m = {name: f.card.name, tribe: f.card.tribe, atk: f.card.atk + f.a, hp: f.card.hp + f.h, tier: f.card.tier, taunt: f.card.taunt, shield: f.card.shield, toxic: f.card.toxic};
    const o = {copies: copiesOf(f.card.name) >= 1 ? copiesOf(f.card.name) : 0, upA: f.a > 0, upH: f.h > 0};
    if (!t) { t = makeToken(m, o); S.layer.appendChild(t); S.feedTok.set(f.key, t); bindToken(t, 'feed', f); css(t, {left: feedX(i, G.feed.length), top: FEED_Y}); }
    else t.innerHTML = tokenHTML(m, o);
    t.style.transition = 'left .26s cubic-bezier(.22,1,.36,1), top .26s';
    css(t, {left: feedX(i, G.feed.length), top: FEED_Y}); t._f = f; fseen.add(f.key);
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
  S.hint.textContent = G.firstTurn && !me.board.length ? (G.hand.length ? 'Drag the card onto your board, or tap it to play it.' : 'Tap a minion in the Feed to hire it for 3 gold.') : '';
  S.hint.style.display = G.hand.length ? 'none' : 'block';
  if (G.hand.length && G.firstTurn && !me.board.length) { S.hint.style.display = 'block'; S.hint.style.top = '248px'; } else S.hint.style.top = '300px';
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
      if (++i % 2 === 0) await sleep(70);
    } else if (e.type === 'gold' || e.type === 'gold_next') {
      const r = t ? center(rectOf(t)) : [420, 200];
      floatText(r[0], r[1] - 30, e.type === 'gold' ? `+${e.n} gold` : `+${e.n} gold next turn`, 'gold');
      if (e.type === 'gold') coinFly(r, center(rectOf(S.gold)), e.n);
    } else if (e.type === 'triple') {
      if (t) { const c = center(rectOf(t)); ring(c[0], c[1], '#ffc928', 110); confetti(c[0], c[1], 24); anim(t, [{transform: 'scale(.4) rotate(-180deg)'}, {transform: 'scale(1.3) rotate(10deg)', offset: .6}, {transform: 'scale(1)'}], {duration: 700, easing: 'ease-out'}); }
      toast('Triple! Golden minion', 1400);
    } else if (e.type === 'collab') {
      if (t) { const c = center(rectOf(t)); ring(c[0], c[1], '#8fd4ff', 80); floatText(c[0], c[1] - 34, e.name, ''); }
    } else if (e.type === 'drain') {
      if (t) anim(t, [{transform: 'translateX(0)'}, {transform: 'translateX(-4px)'}, {transform: 'translateX(4px)'}, {transform: 'translateX(0)'}], {duration: 220});
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
function costOf(f) { return f.discount ? 2 : G.heroSlug === 'h_bargainhunter' ? 2 : 3; }
function canBuy(f) { if (G.hand.length >= 10) { toast('Your hand is full'); return false; } if (G.me.gold[0] < costOf(f)) { shake(S.gold); toast('Not enough gold'); return false; } return true; }
function shake(e) { anim(e, [{transform: 'translateX(0)'}, {transform: 'translateX(-6px)'}, {transform: 'translateX(6px)'}, {transform: 'translateX(-3px)'}, {transform: 'translateX(0)'}], {duration: 300, raw: true}); }
function goldTick(delta) {
  anim(S.gold, [{transform: 'scale(1)'}, {transform: 'scale(1.18)'}, {transform: 'scale(1)'}], {duration: 260, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  const c = center(rectOf(S.gold)); floatText(c[0] - 10, c[1] + 20, (delta > 0 ? '+' : '') + delta, delta > 0 ? 'gold' : 'red');
}
async function buy(f, toBoardAt = null) {
  if (G.busy || !canBuy(f)) return;
  const me = G.me, cst = costOf(f);
  me.gold[0] -= cst; me.gainSpend(cst); goldTick(-cst);
  G.feed.splice(G.feed.indexOf(f), 1);
  const hc = {card: f.card, a: f.a, h: f.h, key: Math.random()};
  const t = S.feedTok.get(f.key);
  if (toBoardAt !== null) { if (t) { t._leaving = true; t.remove(); } G.hand.push(hc); await playCard(hc, toBoardAt); return; }
  G.hand.push(hc);
  if (t) { t._leaving = true; const p = handPos(G.hand.length - 1, G.hand.length);
    t.style.transition = 'none'; await anim(t, [{transform: 'translate(0,0) scale(1)'}, {transform: `translate(${(p.x + 8 - parseFloat(t.style.left)) / 2}px,${(p.y - FEED_Y) / 2 - 40}px) scale(1.15) rotate(-10deg)`}, {transform: `translate(${p.x + 8 - parseFloat(t.style.left)}px,${p.y - FEED_Y}px) scale(.9)`, opacity: .2}], {duration: 300, easing: 'ease-in-out', fill: 'forwards'}); t.remove(); }
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
  if (!card.collab && me.board.length >= 7) { toast('Your board is full (7)'); renderAll(); return; }
  if (target === null) {
    const cands = needsTarget(card);
    if (cands) { await chooseTarget(cands, card.collab ? `Choose a minion for ${card.name} to stick to` : `Choose a minion for ${card.name}`, async t => playCard(hc, pos, t), () => renderAll()); return; }
  }
  G.hand.splice(G.hand.indexOf(hc), 1);
  const e = S.handEl.get(hc.key); if (e) { e._leaving = true; e.remove(); }
  const m = me.play(card, me.gold, pos, target);
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
  me.sell(m, me.gold);
  if (t) { t._leaving = true; t.style.transition = 'none';
    anim(t, [{transform: 'scale(1) rotate(0)'}, {transform: 'scale(1.2) rotate(-12deg)', offset: .3}, {transform: 'scale(0) rotate(200deg)', opacity: 0}], {duration: 380, easing: 'ease-in', fill: 'forwards'}).then(() => t.remove()); }
  coinFly(c, center(rectOf(S.gold)), g); setTimeout(() => goldTick(g), 450);
  floatText(c[0], c[1] - 30, `+${g} gold`, 'gold');
  // Greatest Hits re-release
  for (const card of me.rerelease) G.feed.push({card, a: 0, h: 0, key: Math.random(), discount: true});
  me.rerelease = [];
  me.log = me.log.filter(x => x.type !== 'sold');
  await afterAction(true);
}
async function scroll() {
  if (G.busy) return; const me = G.me;
  if (me.gold[0] < 1) { shake(S.scroll); toast('Not enough gold'); return; }
  me.gold[0] -= 1; me.gainSpend(1); goldTick(-1); G.saved = false;
  anim(S.scroll.querySelector('.spin'), [{transform: 'translate(18px,17px) scale(1.34) rotate(0)'}, {transform: 'translate(18px,17px) scale(1.34) rotate(360deg)'}], {duration: 420, raw: true});
  const old = [...S.feedTok.values()]; S.feedTok.clear();
  old.forEach((t, i) => { t._leaving = true; t.style.transition = 'none'; anim(t, [{transform: 'translateY(0) rotate(0)'}, {transform: `translateY(-90px) rotate(${i % 2 ? 15 : -15}deg)`, opacity: 0}], {duration: 220, delay: i * 25, easing: 'ease-in', fill: 'forwards'}).then(() => t.remove()); });
  G.feed = me.drawFeed().map(c => ({card: c, a: 0, h: 0, key: Math.random()}));
  await sleep(120);
  renderAll();
  [...S.feedTok.values()].forEach((t, i) => anim(t, [{transform: 'translateY(-70px)', opacity: 0}, {transform: 'translateY(6px)', opacity: 1, offset: .7}, {transform: 'translateY(0)'}], {duration: 340, delay: i * 50, easing: 'ease-out', fill: 'backwards'}));
  await playLog();
}
function toggleSave() {
  G.saved = !G.saved; renderChrome();
  anim(S.save, [{transform: 'translateY(-14px) rotate(-6deg)'}, {transform: 'translateY(3px) rotate(3deg)'}, {transform: 'translateY(0)'}], {duration: 300, easing: 'ease-out', raw: true});
  if (G.saved) anim(S.feedSurf, [{transform: 'scale(1)'}, {transform: 'scale(1.02)'}, {transform: 'scale(1)'}], {duration: 260, raw: true});
}
async function levelUp() {
  if (G.busy) return; const me = G.me, lc = me.levelCost();
  if (lc === null) return;
  if (me.gold[0] < lc) { shake(S.shield); toast(`Level up costs ${lc} gold`); return; }
  me.gold[0] -= lc; me.gainSpend(lc); me.tier += 1; me.turns_at_tier = 0; goldTick(-lc);
  renderChrome();
  anim(S.shield, [{transform: 'scale(1) rotate(0)'}, {transform: 'scale(1.25) rotate(-8deg)'}, {transform: 'scale(.95) rotate(4deg)'}, {transform: 'scale(1)'}], {duration: 600, easing: 'ease-out', raw: true});
  const c = center(rectOf(S.shield)); ring(c[0], c[1] - 20, '#ffc928', 120); confetti(c[0], c[1] - 20, 14);
  const stars = S.shield.querySelectorAll('svg')[me.tier];
  if (stars) anim(stars, [{transform: 'scale(3) rotate(-90deg)', opacity: 0}, {transform: 'scale(1) rotate(0)', opacity: 1}], {duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  toast(`Tier ${me.tier}! The Feed now shows ${E.FEED_SIZE[me.tier]} minions`, 1500);
  await playLog();
}
async function usePower() {
  const h = HERO[G.heroSlug];
  if (h.cost === 'Passive') { showHeroDetail(); return; }
  if (G.heroUsed) { toast('Already used this turn'); return; }
  if (G.me.gold[0] < +h.cost) { toast('Not enough gold'); return; }
  if (G.heroSlug === 'boomer') {
    const go = async t => {
      G.me.gold[0] -= 1; G.me.gainSpend(1); G.heroUsed = true; goldTick(-1);
      if (t) G.me.buff(t, 1, 1);
      for (const f of G.feed) { f.a += 1; f.h += 1; }
      const pc = center(rectOf(S.power));
      for (const tt of S.feedTok.values()) streak(pc, center(rectOf(tt)), '#2fd0d0', 300);
      await sleep(260); renderAll(); await playLog();
    };
    if (G.me.board.length) await chooseTarget(G.me.board.slice(), 'Reply All: choose a minion (the Feed gets +1/+1 too)', go, () => {}); else await go(null);
  }
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
    S.pickHandler = m => { if (ids.has(m.id)) done(m); };
    cancel.onclick = () => done(null);
  });
}
function handlePending() {
  const me = G.me;
  return new Promise(res => {
    const p = me.pending.shift(); if (!p) return res();
    const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 65});
    el('div', 'dim', '', ov);
    const head = el('div', 'ab bd', p.why === 'triple' ? `Triple! Discover a ${'★'.repeat(p.tier)} minion` : `Discover a ${TP[p.why] ? TP[p.why].replace(/s$/, '') : 'minion'}`, ov);
    css(head, {left: 0, right: 0, top: 14, textAlign: 'center'}); head.innerHTML = `<span style="display:inline-block;background:#ffc928;border:3px solid #2b2140;border-radius:999px;padding:6px 18px 2px;box-shadow:0 0 0 3px #fff;font-size:22px">${head.textContent}</span>`;
    p.options.forEach((c, i) => {
      const b = el('button', 'ab', `<div style="transform:scale(.62);transform-origin:top left">${cardHTML(c)}</div>`, ov);
      css(b, {left: 168 + i * 176, top: 62, width: 149, height: 208, padding: 0, border: 0, background: 'none', cursor: 'pointer'});
      anim(b, [{transform: 'rotateY(90deg) translateY(30px)', opacity: 0}, {transform: 'rotateY(0) translateY(0)', opacity: 1}], {duration: 420, delay: i * 110, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards', raw: true});
      b.onclick = async () => {
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
function showDetail(card, inst) {
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 95});
  el('div', 'dim', '', ov);
  const ex = inst && inst.extras && inst.extras.length ? `<p style="margin:10px 0 0;font-size:12.5px;font-weight:800">Collabs: ${inst.extras.join(', ')}</p>` : '';
  const c = el('div', 'ab', cardHTML(card, inst ? {atk: inst.atk, hp: inst.hp, golden: inst.golden} : {}), ov); css(c, {left: 92, top: 22});
  const kws = ['Attention Seeker', 'Out of Office', 'Toxic', 'First Impression', 'Legacy', 'Rebrand', 'Collab', 'Discover'].filter(k => card.text.includes(k));
  const KD = {'Attention Seeker': 'Enemies must attack it first.', 'Out of Office': 'Ignores the first damage it would take.', 'Toxic': 'Destroys any minion it damages.', 'First Impression': 'Happens when you play it from your hand.', 'Legacy': 'Happens when it dies.', 'Rebrand': 'Comes back once with 1 Health after it dies.', 'Collab': 'Sticks to a minion: adds its stats and effect, and makes it a Techie too.', 'Discover': 'Pick 1 of 3 cards to add to your hand.'};
  const pnl = el('div', 'panel', `<p class="bd" style="margin:0;font-size:13px;letter-spacing:.12em;color:#5a5270">FULL RULES</p><p style="margin:6px 0 0;font-size:15px;font-weight:700;line-height:1.5">${card.full_html}</p>
    ${kws.map(k => `<p style="margin:8px 0 0;font-size:12.5px;font-weight:700;line-height:1.4"><b class="kw">${k}:</b> ${KD[k]}</p>`).join('')}${ex}
    ${inst && (inst.ta || inst.th) ? `<p style="margin:8px 0 0;font-size:12.5px;font-weight:800">Next combat only: +${inst.ta}/+${inst.th}</p>` : ''}
    <p style="margin:14px 0 0;font-size:13px;font-style:italic;font-weight:700;color:#5a5270">${card.flavour}</p><p style="position:absolute;left:22px;bottom:12px;margin:0;font-size:11.5px;font-weight:800;color:#5a5270">Tap anywhere to close.</p>`, ov);
  css(pnl, {left: 370, top: 26, width: 440, height: 336, padding: '18px 22px'});
  anim(c, [{transform: 'scale(.4) rotate(-8deg)', opacity: 0}, {transform: 'scale(1.04) rotate(1deg)', opacity: 1, offset: .7}, {transform: 'scale(1)'}], {duration: 300, easing: 'ease-out', raw: true});
  anim(pnl, [{transform: 'translateX(40px)', opacity: 0}, {transform: 'translateX(0)', opacity: 1}], {duration: 260, easing: 'ease-out', raw: true});
  ov.onpointerup = () => ov.remove();
}
function showHeroDetail() {
  const h = HERO[G.heroSlug];
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 95}); el('div', 'dim', '', ov);
  const c = el('div', 'ab', heroHTML(h), ov); css(c, {left: 292, top: 0}); c.style.transform = 'scale(.92)';
  anim(c, [{transform: 'scale(.4) rotate(-8deg)', opacity: 0}, {transform: 'scale(.92)', opacity: 1}], {duration: 300, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  ov.onpointerup = () => ov.remove();
}

// ---------------------------------------------------------------- pointer: tap, drag, long-press
function bindToken(e, kind, obj) {
  e.addEventListener('pointerdown', ev => {
    if (G.busy || G.screen !== 'shop') return;
    ev.preventDefault();
    if (G.mode === 'target') { if (kind === 'board' && S.pickHandler) S.pickHandler(e._m); return; }
    const [sx, sy] = toStage(ev.clientX, ev.clientY);
    const r = {x: parseFloat(e.style.left), y: parseFloat(e.style.top)};
    let dragging = false, longT = setTimeout(() => { if (!dragging) { longT = null; done = true; cleanup(); showDetailFor(kind, e); } }, 420), done = false;
    e.setPointerCapture(ev.pointerId);
    const move = mv => {
      const [x, y] = toStage(mv.clientX, mv.clientY);
      if (!dragging && Math.hypot(x - sx, y - sy) > 7) { dragging = true; clearTimeout(longT); startDrag(); }
      if (dragging) { css(e, {left: r.x + x - sx, top: r.y + y - sy}); dragOver(kind, x, y); }
    };
    const startDrag = () => {
      e.style.transition = 'none'; e.classList.add('drag'); e.style.transform = 'scale(1.12) rotate(-4deg)';
      e.style.boxShadow = kind === 'hand' ? '0 0 0 3px #fff, 6px 14px 0 3px rgba(43,33,64,.5)' : '0 0 0 4px #fff, 6px 14px 0 4px rgba(43,33,64,.5)';
      if (kind === 'board') { S.sellZone.style.display = 'flex'; S.sellZone.innerHTML = `Sell for <span class="coin" style="position:static;width:34px;height:34px;font-size:19px">${G.me.sellValue(e._m)}</span>`; anim(S.sellZone, [{opacity: 0, transform: 'scale(.96)'}, {opacity: 1, transform: 'scale(1)'}], {duration: 160, raw: true}); }
    };
    const cleanup = () => { e.removeEventListener('pointermove', move); e.removeEventListener('pointerup', up); e.removeEventListener('pointercancel', up); clearTimeout(longT); };
    const up = async uev => {
      cleanup(); if (done) return; done = true;
      const [x, y] = toStage(uev.clientX, uev.clientY);
      e.classList.remove('drag'); e.style.boxShadow = ''; S.sellZone.style.display = 'none';
      if (!dragging) { e.style.transform = kind === 'hand' ? e.style.transform : ''; return onTap(kind, e); }
      e.style.transform = '';
      await onDrop(kind, e, x, y);
    };
    e.addEventListener('pointermove', move); e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up);
  });
}
function showDetailFor(kind, e) {
  if (kind === 'feed') showDetail(e._f.card, {atk: e._f.card.atk + e._f.a, hp: e._f.card.hp + e._f.h});
  else if (kind === 'hand') showDetail(e._h.card, {atk: e._h.card.atk + e._h.a, hp: e._h.card.hp + e._h.h, golden: e._h.golden});
  else { const m = e._m; if (m.follower) showDetail({name: 'Follower', tribe: 'Influencer', tier: 1, atk: 1, hp: 1, art: 'follower', fit: 13, html: 'A loyal 1/1 fan. Summoned by Influencers.', full_html: 'A loyal fan. Summoned by Influencers.', text: '', flavour: 'Liked. Shared. Forgot.'}, m); else showDetail(CARD[m.name], m); }
}
function boardIndexAt(x) { const n = G.me.board.length + 1; let best = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.abs(boardX(i, n) + 34 - x); if (d < bd) { bd = d; best = i; } } return best; }
let lastGap = null;
function dragOver(kind, x, y) {
  const overBoard = y > 150 && y < 270 && x > 100 && x < 740;
  if ((kind === 'hand' || kind === 'feed') && overBoard && G.me.board.length < 7) { const g = boardIndexAt(x); if (g !== lastGap) { lastGap = g; renderBoardOnly(g); } }
  else if (kind === 'board' && overBoard) { const others = G.me.board.filter(m => m !== S.dragM); }
  else if (lastGap !== null) { lastGap = null; renderBoardOnly(null); }
}
function renderBoardOnly(gap) {
  const me = G.me, n = me.board.length + (gap !== null ? 1 : 0);
  me.board.forEach((m, i) => { const t = S.tok.get(m.id); if (t && !t.classList.contains('drag')) { t.style.transition = 'left .2s cubic-bezier(.22,1,.36,1)'; css(t, {left: boardX(gap !== null && i >= gap ? i + 1 : i, n)}); } });
}
async function onTap(kind, e) {
  if (kind === 'feed') return buy(e._f);
  if (kind === 'hand') return playCard(e._h, null);
  if (kind === 'board') return showDetailFor(kind, e);
}
async function onDrop(kind, e, x, y) {
  const overBoard = y > 150 && y < 270 && x > 100 && x < 740;
  const overFeed = y < 160 && x > 100 && x < 740;
  const overHand = y >= 262;
  const gap = lastGap; lastGap = null;
  if (kind === 'feed') {
    if (overBoard && G.me.board.length < 7) { if (canBuy(e._f)) return buy(e._f, gap !== null ? gap : boardIndexAt(x)); }
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
    if (overBoard) { const b = G.me.board; b.splice(b.indexOf(m), 1); const n = b.length + 1; let best = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.abs(boardX(i, n) + 34 - x); if (d < bd) { bd = d; best = i; } } b.splice(best, 0, m); }
    renderAll(); return;
  }
}

// ---------------------------------------------------------------- turn flow
async function animateTurnStart() {
  G.busy = true;
  const toks = [...S.feedTok.values()];
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
  anim(S.ready, [{transform: 'translateY(0)'}, {transform: 'translateY(6px)'}, {transform: 'translateY(0)'}], {duration: 200, raw: true});
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
const CY = [86, 214];   // y of [enemy, me] rows
function cX(i, n) { return 114 + (616 - (n * 68 + (n - 1) * 20)) / 2 + i * 88; }
async function playCombat(rec) {
  clear(); G.screen = 'combat'; bg(false);
  const f = rec.fight, opp = rec.b || rec.ghost, oppHero = opp.hero;
  const Cm = {els: new Map(), side: new Map()};
  _ce = Cm.els;
  const surfE = el('div', 'surf', '<div class="tag" style="background:#fff">THEIR BOARD</div>', stage); css(surfE, {left: 114, top: 72, width: 616, height: 96, borderRadius: '24px', background: '#eeeaf5'});
  const surfM = el('div', 'surf', '<div class="tag" style="background:#ffc928">YOUR BOARD</div>', stage); css(surfM, {left: 114, top: 200, width: 616, height: 96, borderRadius: '24px', background: '#eeeaf5'});
  const oav = el('div', 'av-big', `<img src="${ART[oppHero] || ART.follower}" alt="">`, stage); css(oav, {left: 16, top: 12, width: 70, height: 70});
  const ohp = el('div', 'badge', `${opp.ghost ? '—' : opp.health + opp.boundaries}`, stage); css(ohp, {left: 60, top: 56, width: 40, height: 30, fontSize: '17px'});
  const oname = el('div', 'ab bd', `${opp.ghost ? 'Ghost of ' : ''}${HERO[oppHero] ? HERO[oppHero].name : opp.name} <span style="font-family:Nunito,sans-serif;font-size:11px;color:#5a5270">· ${'★'.repeat(opp.tier)}</span>`, stage);
  css(oname, {left: 96, top: 22, fontSize: '15px', background: '#fff', border: '2.5px solid #2b2140', borderRadius: '999px', padding: '4px 10px 1px'});
  const mav = el('div', 'av-big', `<img src="${ART[G.heroSlug]}" alt="">`, stage); css(mav, {left: 16, top: 290, width: 88, height: 88});
  const mhp = el('div', 'badge', `${G.me.health + (rec.loser === G.me ? 0 : 0)}`, stage); css(mhp, {left: 72, top: 346, width: 42, height: 34, fontSize: '20px'});
  const preHealth = G.me.health + (rec.loser === G.me ? rec.dmg : 0) + G.me.boundaries;
  mhp.textContent = preHealth;
  const rnd = el('div', 'info', `Round ${G.lobby.turn}`, stage); css(rnd, {left: 640, top: 20, width: 92, height: 34, borderRadius: '999px', fontSize: '15px'});
  const spd = el('button', 'btn', SP.v === 1 ? '1×' : '2×', stage); css(spd, {left: 750, top: 18, width: 76, height: 40, fontSize: '17px'});
  spd.onclick = () => { SP.v = SP.v === 1 ? 2 : 1; spd.textContent = SP.v === 1 ? '1×' : '2×'; };
  let skip = false;
  const sk = el('button', 'btn', 'Skip', stage); css(sk, {left: 750, top: 72, width: 76, height: 40, fontSize: '15px'}); sk.onclick = () => { skip = true; };
  const logBox = el('div', 'log', '', stage);
  const say = (t, hl) => { const d = el('div', '', t, logBox); if (hl) d.style.background = '#ffe9a8'; while (logBox.children.length > 2) logBox.firstChild.remove(); anim(d, [{transform: 'translateY(10px)', opacity: 0}, {transform: 'translateY(0)', opacity: 1}], {duration: 200}); };
  const layer = el('div', 'ab', '', stage); css(layer, {left: 0, top: 0, width: W, height: H, pointerEvents: 'none'});
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
          t = makeToken(m); layer.appendChild(t); Cm.els.set(m.id, t);
          css(t, {left: cX(i, b.length), top: CY[row]});
          if (opts.pop !== false) anim(t, [{transform: 'scale(0)'}, {transform: 'scale(1.2)', offset: .6}, {transform: 'scale(1)'}], {duration: 320, easing: 'ease-out'});
        } else {
          const [da, dh] = updateToken(t, m);
          if (opts.floats !== false && (da > 0 || dh > 0)) { const c = center(rectOf(t)); floatText(c[0], c[1] - 30, `+${Math.max(0, da)}/+${Math.max(0, dh)}`); }
        }
        t.style.transition = `left ${260 / SP.v}ms cubic-bezier(.22,1,.36,1), top ${260 / SP.v}ms`;
        css(t, {left: cX(i, b.length), top: CY[row]});
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
    if (fr.type === 'soc') {
      const s = Cm.els.get(fr.src);
      if (s) { await anim(s, [{transform: 'scale(1)', filter: 'brightness(1)'}, {transform: 'scale(1.2)', filter: 'brightness(1.35)'}, {transform: 'scale(1)', filter: 'brightness(1)'}], {duration: 260});
        say(`Start of combat · ${nameOf(fr.src)}`);
        const sc = center(rectOf(s));
        await Promise.all((fr.tgts || []).map(id => { const t = Cm.els.get(id); return t ? streak(sc, center(rectOf(t)), fr.kind === 'give' ? '#2ecb6e' : '#ff6b5e', 260) : null; }));
      }
      diffBursts(cur, fr.boards); place(fr.boards); await sleep(260);
    } else if (fr.type === 'attack') {
      const a = Cm.els.get(fr.att), t = Cm.els.get(fr.tgt);
      say(`${nameOf(fr.att)} attacks ${nameOf(fr.tgt)}`, true);
      if (a && t) {
        const ra = rectOf(a), rt = rectOf(t), dx = rt.x - ra.x, dy = rt.y - ra.y;
        a.style.zIndex = 20;
        await anim(a, [{transform: 'translate(0,0) scale(1)'}, {transform: `translate(${-dx * .06}px,${-dy * .1}px) scale(.94) rotate(-4deg)`}], {duration: 120, easing: 'ease-out', fill: 'forwards'});
        await anim(a, [{transform: `translate(${-dx * .06}px,${-dy * .1}px) scale(.94)`}, {transform: `translate(${dx * .82}px,${dy * .78}px) scale(1.1) rotate(6deg)`}], {duration: 150, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards'});
        anim(t, [{transform: 'translate(0,0)'}, {transform: 'translate(-5px,3px) rotate(-4deg)'}, {transform: 'translate(4px,-2px) rotate(3deg)'}, {transform: 'translate(0,0)'}], {duration: 220});
        anim(stage, [{transform: `scale(${SCALE}) translate(0,0)`}, {transform: `scale(${SCALE}) translate(2px,-2px)`}, {transform: `scale(${SCALE}) translate(-2px,1px)`}, {transform: `scale(${SCALE}) translate(0,0)`}], {duration: 180});
        diffBursts(cur, fr.boards);
        place(fr.boards, {floats: false});
        await anim(a, [{transform: `translate(${dx * .82}px,${dy * .78}px) scale(1.1)`}, {transform: 'translate(0,0) scale(1)'}], {duration: 200, easing: 'cubic-bezier(.34,1.3,.64,1)'});
        a.style.zIndex = '';
        await sleep(90);
      } else place(fr.boards);
    } else if (fr.type === 'death') {
      const t = Cm.els.get(fr.id);
      if (t) { Cm.els.delete(fr.id); t.style.transition = 'none'; t.style.filter = 'grayscale(1)';
        anim(t, [{transform: 'rotate(0) translateY(0)', opacity: 1}, {transform: 'rotate(-14deg) translateY(-8px)', opacity: 1, offset: .3}, {transform: 'rotate(24deg) translateY(60px)', opacity: 0}], {duration: 380, easing: 'ease-in', fill: 'forwards'}).then(() => t.remove());
        const c = center(rectOf(t)); for (let i = 0; i < 5; i++) { const p = el('div', '', '', stage); css(p, {position: 'absolute', left: c[0], top: c[1] + 20, width: 12, height: 12, borderRadius: '50%', background: '#e6dccb', border: '2px solid #2b2140', zIndex: 83, pointerEvents: 'none'}); anim(p, [{transform: 'translate(0,0) scale(1)', opacity: 1}, {transform: `translate(${(i - 2) * 16}px,${-10 - Math.random() * 14}px) scale(.3)`, opacity: 0}], {duration: 420}).then(() => p.remove()); }
      }
      cur = cur.map(b => b.filter(x => x.id !== fr.id));
      await sleep(200); place(fr.boards);
    } else if (fr.type === 'legacy') {
      say(`Legacy · ${fr.name}`);
      const row = sideOf(fr.side), g = el('img', '', null, layer); g.src = artOf(fr.name);
      css(g, {position: 'absolute', left: 380, top: CY[row] - 10, width: 84, height: 84, opacity: .7, filter: 'grayscale(.4) brightness(1.4)', pointerEvents: 'none'});
      await anim(g, [{transform: 'translateY(0) scale(.8)', opacity: .8}, {transform: 'translateY(-40px) scale(1.1)', opacity: 0}], {duration: 420}); g.remove();
      place(fr.boards); await sleep(160);
    } else if (fr.type === 'summon' || fr.type === 'rebrand' || fr.type === 'trigger') {
      if (fr.type === 'trigger') { const s = Cm.els.get(fr.src); if (s) { const c = center(rectOf(s)); ring(c[0], c[1], '#4fd1c5', 90); say(`${nameOf(fr.src)} triggers`); } }
      if (fr.type === 'rebrand') say('Rebrand!');
      place(fr.boards); await sleep(260);
    } else if (fr.type === 'first') {
      say(fr.side === 0 ? 'You attack first' : 'They attack first', true);
      await sleep(350);
    } else if (fr.type === 'end') { place(fr.boards); }
  }
  if (skip) { place(f.frames[f.frames.length - 1].boards, {floats: false}); for (const [id, t] of Cm.els) if (!f.frames[f.frames.length - 1].boards.some(b => b.some(m => m.id === id))) { t.remove(); Cm.els.delete(id); } }
  await sleep(300);
  // hero damage
  const won = rec.winner === G.me, lost = rec.loser === G.me;
  const survRow = won ? 1 : 0, targetAv = won ? oav : mav;
  if (rec.dmg && (won || lost)) {
    const sv = [...Cm.els.values()].filter(t => Math.abs(parseFloat(t.style.top) - CY[survRow]) < 5);
    const tc = center(rectOf(targetAv));
    for (const t of sv) {
      const r = rectOf(t);
      await anim(t, [{transform: 'translate(0,0)'}, {transform: `translate(${tc[0] - r.x - 34}px,${tc[1] - r.y - 34}px) scale(.8) rotate(-10deg)`}], {duration: 220, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards'});
      anim(targetAv, [{transform: 'translate(0,0)'}, {transform: 'translate(-6px,4px)'}, {transform: 'translate(0,0)'}], {duration: 160});
      anim(t, [{transform: `translate(${tc[0] - r.x - 34}px,${tc[1] - r.y - 34}px) scale(.8)`}, {transform: 'translate(0,0)'}], {duration: 240, fill: 'forwards'});
      await sleep(90);
    }
    burstAt(tc[0] + 20, tc[1] - 20, `−${rec.dmg}`);
    if (lost) mhp.textContent = G.me.health + G.me.boundaries; else ohp.textContent = opp.ghost ? '—' : opp.health + opp.boundaries;
    anim(lost ? mhp : ohp, [{transform: 'scale(1.6)'}, {transform: 'scale(1)'}], {duration: 360, easing: 'cubic-bezier(.34,1.56,.64,1)'});
    await sleep(500);
  }
  await showResult(rec);
}
function diffBursts(prev, next) {
  // simpler: compute per-id hp loss and shield pops
  const all = new Map(); prev.forEach(b => b.forEach(m => all.set(m.id, m)));
  next.forEach(b => b.forEach(m => {
    const p = all.get(m.id); if (!p) return;
    const tEl = findTok(m.id); if (!tEl) return;
    const c = center(rectOf(tEl));
    if (p.shield && !m.shield) { ring(c[0], c[1], '#8fd4ff', 90); floatText(c[0], c[1] - 34, 'OOO!', ''); }
    if (m.hp < p.hp) burstAt(c[0] + 14, c[1] - 14, `−${p.hp - m.hp}`);
  }));
  prev.forEach(b => b.forEach(p => { if (!next.some(nb => nb.some(m => m.id === p.id))) { const t = findTok(p.id); if (t) { const c = center(rectOf(t)); burstAt(c[0] + 14, c[1] - 14, '✕'); } } }));
}
function findTok(id) { return CombatEls().get(id); }
let _ce = null; function CombatEls() { return _ce || new Map(); }
async function showResult(rec) {
  const me = G.me, won = rec.winner === me, lost = rec.loser === me;
  const ov = el('div', 'ab', '', stage); css(ov, {left: 0, top: 0, width: W, height: H, zIndex: 90}); el('div', 'dim', '', ov);
  const opp = rec.b || rec.ghost, oppName = (opp.ghost ? 'Ghost of ' : '') + (HERO[opp.hero] ? HERO[opp.hero].name : opp.name);
  const surv = rec.fight.survivors;
  const title = won ? 'Won the round' : lost ? 'Lost the round' : 'Draw';
  let rows = '';
  if (rec.dmg) {
    const tierW = won ? me.tier : opp.tier;
    rows = `<div style="display:flex;justify-content:space-between"><span>${won ? 'Your' : 'Their'} tier ${'★'.repeat(tierW)}</span><span>${tierW}</span></div>
      <div style="display:flex;justify-content:space-between"><span>${surv.length} surviving minion${surv.length === 1 ? '' : 's'} (tiers)</span><span>${surv.reduce((s, m) => s + m.tier, 0)}</span></div>
      <div style="display:flex;justify-content:space-between;color:#5a5270"><span>Damage cap this round</span><span>${E.damageCap(G.lobby.turn)}</span></div>
      <div style="display:flex;justify-content:space-between;font-family:'Baloo 2',sans-serif;font-size:22px;border-top:2.5px dashed #2b2140;padding-top:6px"><span>${won ? 'Damage dealt' : 'Damage taken'}</span><span style="color:${won ? '#2ecb6e' : '#ff6b5e'}">${rec.dmg}</span></div>`;
    if (lost && me.lastDamage && me.lastDamage.armor) rows += `<div style="display:flex;justify-content:space-between;color:#5a5270"><span>Boundaries absorbed</span><span>${me.lastDamage.armor}</span></div>`;
  }
  const tip = lost ? tipFor(rec) : won ? 'Nice. Keep building: every turn the Feed gets stronger.' : 'Nobody was left standing. No damage either way.';
  const p = el('div', 'panel', `<p class="bd" style="margin:0;font-size:36px">${title}</p><p style="margin:6px 0 0;font-size:13px;font-weight:700;color:#5a5270">vs ${oppName}</p>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:4px;font-size:14px;font-weight:800">${rows}</div>
    <div style="margin-top:10px;background:#ffe9a8;border:2.5px solid #2b2140;border-radius:12px;padding:6px 10px 4px;font-size:12.5px;font-weight:800;line-height:1.35">${tip}</div>`, ov);
  css(p, {left: 222, top: 30, width: 400, height: 300, padding: '16px 22px'});
  anim(p, [{transform: 'translateY(60px) scale(.9)', opacity: 0}, {transform: 'translateY(0) scale(1)', opacity: 1}], {duration: 360, easing: 'cubic-bezier(.34,1.56,.64,1)', raw: true});
  if (won) confetti(422, 60, 26);
  const b = el('button', 'btn', G.lobby.over() ? 'See results' : 'Back to shop', ov); css(b, {left: 334, top: 338, width: 176, height: 42, background: '#2ecb6e', fontSize: '20px'});
  await new Promise(r => b.onclick = r);
}
function tipFor(rec) {
  const opp = rec.b || rec.ghost, ob = opp.board || [];
  const big = ob.length ? ob.reduce((a, m) => (m.atk + m.hp > a.atk + a.hp ? m : a), ob[0]) : null;
  if (G.me.board.length < 4) return 'Fill your board: more minions means more attacks and less damage taken.';
  if (big && big.atk + big.hp > 25) return `Their ${big.name} is huge. Start-of-combat damage and Toxic can deal with one big threat.`;
  if (G.me.tier < opp.tier) return `They were a tier higher. Level up when you have spare gold.`;
  return 'Look for minions of one tribe: synergies beat raw stats in the long run.';
}

// ---------------------------------------------------------------- end of run
function showEnd() {
  clear(); G.screen = 'end'; bg(false);
  const me = G.me, L = G.lobby;
  let guard = 0;
  while (L.alive().length > 1 && guard++ < 40) { L.botTurns(); L.fightRound(); }
  for (const q of L.alive()) q.place = 1;
  if (!me.place) me.place = me.alive ? 1 : 9 - L.deadOrder.indexOf(me) - 1;
  const order = L.players.slice().sort((a, b) => (a.place || 1) - (b.place || 1));
  const p = el('div', 'panel', `<p class="bd" style="margin:0;font-size:13px;letter-spacing:.12em;color:#5a5270">RUN OVER · ROUND ${L.turn}</p>
    <p class="bd" style="margin:2px 0 0;font-size:44px"><span class="cnt">0</span>${['th', 'st', 'nd', 'rd'][me.place] && me.place < 4 ? ['th', 'st', 'nd', 'rd'][me.place] : 'th'} <span style="font-size:22px;color:#5a5270">of 8</span></p>
    <p style="margin:2px 0 0;font-size:13px;font-weight:700">${me.place <= 4 ? 'Top 4. Well played.' : 'Bottom 4. The next run will go better.'}</p>
    <div class="lst" style="margin-top:8px;display:flex;flex-direction:column;gap:2px"></div>`, stage);
  css(p, {left: 30, top: 22, width: 380, height: 346, padding: '18px 22px'});
  const lst = p.querySelector('.lst');
  order.forEach((q, i) => {
    const sty = q.style_code && window.LS_STYLES[q.style_code] ? window.LS_STYLES[q.style_code] : null;
    const tr = sty ? sty[0] : null;
    const row = el('div', '', `<span style="width:18px;text-align:right">${q.place || 1}</span><span style="position:relative;width:22px;height:22px;border-radius:50%;border:2px solid #2b2140;overflow:hidden;background:#8fd4ff"><img src="${ART[q.hero] || ART.follower}" alt="" style="position:absolute;left:-4px;bottom:-4px;width:30px;height:30px"></span><span style="flex:1">${q === me ? 'You' : HERO[q.hero] ? HERO[q.hero].name : q.name}</span>${tr ? `<span class="chip" style="padding:0 7px 0 3px;font-size:11px"><i style="background:${TC[tr]}"></i>${sty[1]}</span>` : q === me ? '' : '<span class="chip" style="padding:0 7px;font-size:11px">Big stats</span>'}`, lst);
    css(row, {display: 'flex', alignItems: 'center', gap: '8px', height: 24, borderRadius: '999px', padding: '0 10px 0 3px', fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: '13.5px', lineHeight: 1});
    if (q === me) { row.style.background = '#ffc928'; row.style.border = '2.5px solid #2b2140'; }
    anim(row, [{transform: 'translateX(-30px)', opacity: 0}, {transform: 'translateX(0)', opacity: 1}], {duration: 300, delay: 300 + i * 70, fill: 'backwards', raw: true});
  });
  const cnt = p.querySelector('.cnt'); let k = 8; const iv = setInterval(() => { cnt.textContent = k; if (k <= me.place) { clearInterval(iv); anim(cnt, [{transform: 'scale(1.6)'}, {transform: 'scale(1)'}], {duration: 300, raw: true}); if (me.place <= 4) confetti(120, 90, 30); } k--; }, 110);
  cnt.style.display = 'inline-block';
  const right = el('div', 'panel', `<p class="bd" style="margin:0;font-size:13px;letter-spacing:.12em;color:#5a5270">YOUR FINAL BOARD</p><div class="fb" style="position:relative;height:196px;margin-top:16px"></div>`, stage);
  css(right, {left: 430, top: 22, width: 384, height: 266, padding: '18px 22px'});
  const fb = right.querySelector('.fb');
  me.board.forEach((m, i) => { const t = makeToken(m); fb.appendChild(t); css(t, {left: (i % 4) * 84 + 6, top: Math.floor(i / 4) * 92 + 6}); t.style.transform = 'scale(.9)'; });
  const again = el('button', 'btn', 'Play again', stage); css(again, {left: 438, top: 314, width: 176, height: 48, background: '#2ecb6e', fontSize: '21px'}); again.onclick = showHeroSelect;
  const menu = el('button', 'btn', 'Main menu', stage); css(menu, {left: 634, top: 314, width: 172, height: 48, fontSize: '18px'}); menu.onclick = showTitle;
}

window.LSUI = {showTitle, G};
showTitle();
})();
