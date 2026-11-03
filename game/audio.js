/* Late Stage audio: everything is synthesised live with Web Audio (no audio files), so the game stays one offline file.
   - SFX: LSAudio.sfx(name, opts)
   - Music: LSAudio.music('hold' | 'office' | 'review' | null), LSAudio.intensity(0..1) for the shop's layers
   - Settings: LSAudio.get(), LSAudio.set({music, sfx}) (0..1, saved on the device) */
(function (root) {
'use strict';
const KEY = 'ls_audio_v1';
const S = {music: 0.6, sfx: 0.8};
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

let ctx = null, master, musicBus, sfxBus, revIn, noiseBuf, duckGain;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
  ctx = new AC({latencyHint: 'interactive'});
  graph();
  if (want) startMusic(want);
}
function graph() {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp); comp.connect(ctx.destination);
  duckGain = ctx.createGain(); duckGain.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = S.music * 1.25; musicBus.connect(duckGain);
  sfxBus = ctx.createGain(); sfxBus.gain.value = S.sfx; sfxBus.connect(master);
  // small room reverb from a generated impulse
  const len = Math.floor(ctx.sampleRate * 1.8), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  const conv = ctx.createConvolver(); conv.buffer = ir;
  revIn = ctx.createGain(); revIn.gain.value = 0.32; revIn.connect(conv);
  const ret = ctx.createGain(); ret.gain.value = 0.5; conv.connect(ret); ret.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
}
// browsers only allow sound after a user gesture
const unlock = () => init();
if (root.addEventListener) {
  root.addEventListener('pointerdown', unlock, true);
  root.addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
}

// ---------------------------------------------------------------- voice helpers
function out(bus, rev) { const g = ctx.createGain(); g.connect(bus); if (rev) { const s = ctx.createGain(); s.gain.value = rev; g.connect(s); s.connect(revIn); } return g; }
/** Oscillator note with an attack/decay envelope, optional pitch glide and filter. */
function tone(o) {
  const t = o.t ?? ctx.currentTime, dur = o.dur ?? 0.15, v = o.vol ?? 0.3, a = o.a ?? 0.004;
  const osc = ctx.createOscillator(); osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.glide ?? dur));
  if (o.detune) osc.detune.value = o.detune;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = osc;
  if (o.lp || o.hp || o.bp) {
    const fl = ctx.createBiquadFilter(); fl.type = o.lp ? 'lowpass' : o.hp ? 'highpass' : 'bandpass';
    fl.frequency.setValueAtTime(o.lp || o.hp || o.bp, t); if (o.lp2) fl.frequency.exponentialRampToValueAtTime(o.lp2, t + dur); fl.Q.value = o.q ?? 0.7;
    osc.connect(fl); node = fl;
  }
  if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibAmt ?? 8; l.connect(lg); lg.connect(osc.detune); l.start(t); l.stop(t + dur + 0.05); }
  node.connect(g); g.connect(o.out);
  osc.start(t); osc.stop(t + dur + 0.05);
}
function noise(o) {
  const t = o.t ?? ctx.currentTime, dur = o.dur ?? 0.1, v = o.vol ?? 0.3;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const fl = ctx.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f || 2000, t); fl.Q.value = o.q ?? 1;
  if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.a ?? 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(fl); fl.connect(g); g.connect(o.out);
  src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
}
/** FM electric piano (Rhodes-ish): sine carrier, decaying modulator, plus a bell-like tine. */
function epiano(t, m, dur, vel, dest, bright = 1) {
  const f = mtof(m), c = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), tine = ctx.createOscillator(), tg = ctx.createGain(), g = ctx.createGain();
  c.frequency.value = f; mod.frequency.value = f; tine.frequency.value = f * 14;
  mg.gain.setValueAtTime(f * 1.6 * bright, t); mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.6);
  tg.gain.setValueAtTime(f * 0.5 * bright, t); tg.gain.exponentialRampToValueAtTime(1, t + 0.08);
  mod.connect(mg); mg.connect(c.frequency); tine.connect(tg); tg.connect(c.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.006);
  g.gain.exponentialRampToValueAtTime(vel * 0.35, t + Math.min(dur, 0.5)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);
  c.connect(g); g.connect(dest);
  for (const o of [c, mod, tine]) { o.start(t); o.stop(t + dur + 0.4); }
}
function vibes(t, m, dur, vel, dest) {
  const f = mtof(m);
  tone({t, f, dur: dur + 0.6, vol: vel, a: 0.003, out: dest, vib: 5.5, vibAmt: 6});
  tone({t, f: f * 4, dur: 0.25, vol: vel * 0.12, a: 0.002, out: dest});
}
function bass(t, m, dur, vel, dest) {
  const f = mtof(m);
  tone({t, f, type: 'triangle', dur, vol: vel, a: 0.006, out: dest, lp: 900, lp2: 260});
  tone({t, f: f / 2, dur, vol: vel * 0.55, a: 0.008, out: dest});
}
function kick(t, vel, dest) { tone({t, f: 150, f2: 42, glide: 0.11, dur: 0.32, vol: vel, a: 0.002, out: dest}); noise({t, dur: 0.02, vol: vel * 0.2, type: 'lowpass', f: 3000, out: dest}); }
function snare(t, vel, dest, soft) {
  noise({t, dur: soft ? 0.12 : 0.18, vol: vel, type: 'bandpass', f: soft ? 2400 : 1800, q: 0.6, out: dest});
  tone({t, f: 210, f2: 150, dur: 0.1, vol: vel * 0.5, out: dest});
}
function hat(t, vel, dest, open) { noise({t, dur: open ? 0.22 : 0.035, vol: vel, type: 'highpass', f: 7500, q: 0.5, out: dest}); }
function rim(t, vel, dest) { tone({t, f: 1700, dur: 0.03, vol: vel, out: dest, bp: 1700, q: 4}); noise({t, dur: 0.02, vol: vel * 0.5, f: 3000, q: 3, out: dest}); }
function shaker(t, vel, dest) { noise({t, dur: 0.06, a: 0.02, vol: vel, type: 'highpass', f: 5500, out: dest}); }
function lead(t, m, dur, vel, dest) {
  const f = mtof(m);
  tone({t, f, type: 'square', dur, vol: vel, a: 0.008, out: dest, lp: 2600, lp2: 1200, vib: 5, vibAmt: 7});
  tone({t, f: f * 1.003, type: 'sawtooth', dur, vol: vel * 0.35, a: 0.01, out: dest, lp: 1800});
}
function kalimba(t, m, vel, dest) { const f = mtof(m); tone({t, f, dur: 0.6, vol: vel, a: 0.002, out: dest}); tone({t, f: f * 5.4, dur: 0.08, vol: vel * 0.25, out: dest}); }

// ---------------------------------------------------------------- sound effects
const last = {};
const GAIN = {click: 1.45, open: 1.74, close: 2.43, error: 1.51, coin: 1.36, buy: 1.43, sell: 1.66, slap: 1.0, pickup: 1.78, scroll: 3.72, save: 1.4, unsave: 1.6, levelup: 1.68, triple: 1.22, discover: 3.94, pick: 1.4, like: 1.53, buff: 2.07, feedbuff: 1.53, power: 2.04, turn: 1.32, ready: 1.8, fightstart: 1.2, windup: 5.01, hit: 0.57, pop: 1.95, death: 2.45, summon: 2.09, legacy: 1.62, zap: 2.37, sparkle: 1.16, trigger: 1.88, rebrand: 1.97, heroslam: 0.74, charge: 1.78, tick: 2.37, victory: 1.05, defeat: 2.99, unlock: 1.17, rankup: 1.53, rankdown: 1.95};   // evens out loudness (measured offline)
const SFX = {
  click(t, o) { tone({t, f: 1250, f2: 820, dur: 0.05, vol: 0.18, out: o}); },
  open(t, o) { tone({t, f: 520, f2: 980, dur: 0.09, vol: 0.2, out: o}); noise({t, dur: 0.05, vol: 0.05, f: 4000, out: o}); },
  close(t, o) { tone({t, f: 900, f2: 480, dur: 0.08, vol: 0.15, out: o}); },
  error(t, o) { tone({t, f: 150, type: 'square', dur: 0.09, vol: 0.12, lp: 900, out: o}); tone({t: t + 0.11, f: 130, type: 'square', dur: 0.12, vol: 0.12, lp: 900, out: o}); },
  coin(t, o, x) { const p = x.pitch || 0; tone({t, f: 1975 * Math.pow(2, p / 12), dur: 0.12, vol: 0.14, out: o}); tone({t: t + 0.05, f: 2637 * Math.pow(2, p / 12), dur: 0.22, vol: 0.12, out: o}); },
  buy(t, o) { tone({t, f: 988, type: 'triangle', dur: 0.08, vol: 0.22, out: o}); tone({t: t + 0.07, f: 1319, type: 'triangle', dur: 0.25, vol: 0.22, out: o}); noise({t: t + 0.07, dur: 0.25, vol: 0.05, type: 'highpass', f: 6000, out: o}); noise({t, dur: 0.12, vol: 0.08, f: 900, f2: 2500, out: o}); },
  sell(t, o) { noise({t, dur: 0.22, vol: 0.12, f: 2500, f2: 500, q: 0.8, out: o}); for (let i = 0; i < 3; i++) tone({t: t + 0.12 + i * 0.07, f: 1568 * Math.pow(2, i * 4 / 12), dur: 0.14, vol: 0.13, out: o}); },
  slap(t, o) { noise({t, dur: 0.05, vol: 0.35, type: 'lowpass', f: 1800, out: o}); tone({t, f: 190, f2: 60, dur: 0.14, vol: 0.4, out: o}); noise({t: t + 0.015, dur: 0.07, vol: 0.08, f: 5000, q: 2, out: o}); },
  pickup(t, o) { tone({t, f: 400, f2: 700, dur: 0.07, vol: 0.12, out: o}); },
  scroll(t, o) { noise({t, dur: 0.28, a: 0.06, vol: 0.2, f: 400, f2: 3200, q: 1.2, out: o}); for (let i = 0; i < 4; i++) rim(t + 0.04 + i * 0.045, 0.06, o); },
  save(t, o) { noise({t, dur: 0.03, vol: 0.2, f: 3500, q: 2, out: o}); tone({t: t + 0.03, f: 880, dur: 0.12, vol: 0.16, out: o}); tone({t: t + 0.11, f: 1319, dur: 0.3, vol: 0.16, out: o}); },
  unsave(t, o) { tone({t, f: 1319, dur: 0.1, vol: 0.12, out: o}); tone({t: t + 0.08, f: 880, dur: 0.18, vol: 0.12, out: o}); },
  levelup(t, o) { [72, 76, 79, 84].forEach((m, i) => { tone({t: t + i * 0.07, f: mtof(m), type: 'square', dur: 0.18 + (i === 3 ? 0.4 : 0), vol: 0.1, lp: 3500, out: o}); tone({t: t + i * 0.07, f: mtof(m - 12), type: 'triangle', dur: 0.2, vol: 0.14, out: o}); }); noise({t: t + 0.21, dur: 0.6, vol: 0.06, type: 'highpass', f: 7000, out: o}); duck(t, 0.9); },
  triple(t, o) { [72, 74, 76, 79, 81, 84, 86, 88].forEach((m, i) => tone({t: t + i * 0.045, f: mtof(m), dur: 0.35, vol: 0.12, out: o})); tone({t: t + 0.4, f: mtof(96), dur: 0.9, vol: 0.12, out: o}); noise({t, dur: 0.9, a: 0.2, vol: 0.06, type: 'highpass', f: 8000, out: o}); duck(t, 1.2); },
  discover(t, o) { for (let i = 0; i < 3; i++) noise({t: t + i * 0.11, dur: 0.09, vol: 0.1, f: 1500, f2: 4000, out: o}); },
  pick(t, o) { tone({t, f: 660, dur: 0.08, vol: 0.15, out: o}); tone({t: t + 0.06, f: 990, dur: 0.16, vol: 0.15, out: o}); },
  like(t, o) { tone({t, f: 620, f2: 1240, dur: 0.12, vol: 0.18, out: o}); tone({t: t + 0.05, f: 1240, dur: 0.1, vol: 0.08, out: o}); },
  buff(t, o, x) { const p = Math.min(12, x.n || 0); tone({t, f: 700 * Math.pow(2, p / 24), f2: 1100 * Math.pow(2, p / 24), dur: 0.09, vol: 0.09, out: o}); },
  feedbuff(t, o) { for (let i = 0; i < 4; i++) tone({t: t + i * 0.03, f: 1800 + i * 300, dur: 0.12, vol: 0.05, out: o}); },
  power(t, o) { tone({t, f: 300, f2: 1600, dur: 0.3, type: 'sawtooth', vol: 0.07, lp: 2500, out: o}); tone({t: t + 0.05, f: 1200, dur: 0.4, vol: 0.1, vib: 9, vibAmt: 30, out: o}); },
  turn(t, o) { tone({t, f: 1047, dur: 0.4, vol: 0.12, out: o}); tone({t: t + 0.12, f: 1568, dur: 0.6, vol: 0.1, out: o}); },
  ready(t, o) { tone({t, f: 784, dur: 0.12, vol: 0.15, type: 'triangle', out: o}); tone({t: t + 0.1, f: 1175, dur: 0.3, vol: 0.15, type: 'triangle', out: o}); noise({t: t + 0.1, dur: 0.35, a: 0.1, vol: 0.12, f: 600, f2: 3000, out: o}); },
  fightstart(t, o) { noise({t, dur: 0.45, a: 0.12, vol: 0.18, f: 300, f2: 2000, out: o}); kick(t + 0.4, 0.5, o); tone({t: t + 0.4, f: 110, dur: 0.6, vol: 0.2, type: 'sawtooth', lp: 400, out: o}); },
  windup(t, o) { noise({t, dur: 0.16, a: 0.08, vol: 0.1, f: 800, f2: 2200, out: o}); },
  hit(t, o, x) { const k = Math.min(1, 0.4 + (x.n || 1) / 12); kick(t, 0.45 * k + 0.15, o); noise({t, dur: 0.12, vol: 0.25 * k + 0.05, f: 1400, q: 0.7, out: o}); noise({t, dur: 0.05, vol: 0.12, type: 'highpass', f: 5000, out: o}); },
  pop(t, o) { tone({t, f: 2400, dur: 0.25, vol: 0.12, out: o}); tone({t, f: 3600, dur: 0.18, vol: 0.06, out: o}); noise({t, dur: 0.12, vol: 0.12, type: 'highpass', f: 6000, out: o}); },
  death(t, o) { noise({t, dur: 0.35, vol: 0.2, type: 'lowpass', f: 1200, f2: 200, out: o}); tone({t, f: 420, f2: 90, dur: 0.3, vol: 0.12, type: 'triangle', out: o}); },
  summon(t, o) { tone({t, f: 330, f2: 990, dur: 0.12, vol: 0.14, out: o}); noise({t, dur: 0.1, vol: 0.06, f: 3000, out: o}); },
  legacy(t, o) { tone({t, f: 880, f2: 440, dur: 0.6, vol: 0.1, vib: 6, vibAmt: 25, out: o}); tone({t, f: 1320, f2: 660, dur: 0.6, vol: 0.05, out: o}); },
  zap(t, o) { tone({t, f: 1600, f2: 180, dur: 0.18, type: 'square', vol: 0.08, lp: 3000, out: o}); },
  sparkle(t, o) { for (let i = 0; i < 5; i++) tone({t: t + i * 0.035, f: 1500 + Math.random() * 1500, dur: 0.12, vol: 0.06, out: o}); },
  trigger(t, o) { tone({t, f: 740, dur: 0.15, vol: 0.1, out: o}); tone({t: t + 0.05, f: 1110, dur: 0.2, vol: 0.08, out: o}); },
  rebrand(t, o) { noise({t, dur: 0.4, a: 0.35, vol: 0.15, f: 500, f2: 4000, out: o}); tone({t: t + 0.3, f: 1320, dur: 0.3, vol: 0.12, out: o}); },
  heroslam(t, o) { kick(t, 0.9, o); noise({t, dur: 0.8, vol: 0.25, type: 'lowpass', f: 3000, f2: 300, out: o}); tone({t, f: 70, dur: 0.6, vol: 0.4, out: o}); noise({t, dur: 0.06, vol: 0.2, type: 'highpass', f: 4000, out: o}); },
  charge(t, o) { tone({t, f: 200, f2: 800, dur: 0.38, type: 'sawtooth', vol: 0.06, lp: 1500, out: o}); noise({t, dur: 0.38, a: 0.3, vol: 0.1, f: 500, f2: 3000, out: o}); },
  tick(t, o, x) { tone({t, f: 900 + (x.n || 0) * 60, dur: 0.04, vol: 0.12, out: o}); },
  victory(t, o) { const seq = [[72, 0], [76, .12], [79, .24], [84, .36], [83, .6], [84, .72]]; seq.forEach(([m, d], i) => { tone({t: t + d, f: mtof(m), type: 'square', dur: i === 5 ? 0.9 : 0.16, vol: 0.09, lp: 3000, out: o}); tone({t: t + d, f: mtof(m - 12), type: 'triangle', dur: i === 5 ? 0.9 : 0.16, vol: 0.12, out: o}); }); [48, 55, 60].forEach(m => bass(t + 0.72, m, 0.9, 0.12, o)); duck(t, 2); },
  defeat(t, o) { [[67, 0], [66, .45], [65, .9], [64, 1.35]].forEach(([m, d], i) => tone({t: t + d, f: mtof(m - 12), type: 'sawtooth', dur: i === 3 ? 1.3 : 0.4, vol: 0.1, lp: 900, vib: i === 3 ? 6 : 0, vibAmt: 30, out: o})); duck(t, 3); },
  unlock(t, o) { [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => { tone({t: t + i * 0.06, f: mtof(m), dur: 0.5, vol: 0.1, out: o}); }); tone({t: t + 0.45, f: mtof(88), dur: 1.2, vol: 0.1, vib: 5, vibAmt: 10, out: o}); noise({t, dur: 1.4, a: 0.3, vol: 0.06, type: 'highpass', f: 7000, out: o}); duck(t, 2); },
  rankup(t, o) { for (let i = 0; i < 5; i++) tone({t: t + i * 0.05, f: 880 * Math.pow(2, i * 2 / 12), dur: 0.1, vol: 0.09, out: o}); },
  rankdown(t, o) { for (let i = 0; i < 4; i++) tone({t: t + i * 0.06, f: 660 * Math.pow(2, -i * 2 / 12), dur: 0.1, vol: 0.08, out: o}); },
};
function duck(t, dur) {
  if (!duckGain) return; const g = duckGain.gain;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.35, t + 0.05); g.setValueAtTime(0.35, t + dur * 0.7); g.linearRampToValueAtTime(1, t + dur);
}
function sfx(name, x = {}) {
  if (!ctx || !S.sfx || !SFX[name] || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (last[name] && now - last[name] < (x.gap ?? 0.035)) return;   // don't stack identical sounds
  last[name] = now;
  const o = out(sfxBus, x.rev ?? 0.15); o.gain.value = (GAIN[name] || 1) * (x.vol ?? 1);
  SFX[name](now + (x.delay || 0), o, x);
}

// ---------------------------------------------------------------- music
// Each piece is a list of bars; a bar function schedules its notes. Bars carry slight seeded variation so loops don't repeat exactly.
const C = {   // chord voicings (MIDI) and bass roots
  Fmaj7: [[57, 60, 64, 65], 41], Dm7: [[57, 60, 62, 65], 38], Gm7: [[58, 62, 65, 67], 43], C7: [[58, 62, 64, 67], 36], Bbmaj7: [[57, 58, 62, 65], 46], A7: [[55, 59, 61, 64], 45],
  Dm9: [[53, 57, 60, 64], 38], G13: [[53, 59, 64, 69], 43], Cmaj9: [[52, 55, 59, 62], 36], Am7: [[55, 60, 64, 67], 45], Fmaj9: [[55, 57, 60, 64], 41], E7s9: [[56, 62, 67], 40],
  Am: [[57, 60, 64], 45], F: [[57, 60, 65], 41], G: [[55, 59, 62], 43], E7: [[56, 59, 62, 64], 40], Dm: [[57, 62, 65], 38],
};
let rng = 1; const rnd = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647; };

const SONGS = {
  // Title, hero select, collection: bossa-flavoured hold music. "Your call is important to us."
  hold: {bpm: 96, swing: 0, prog: ['Fmaj7', 'Dm7', 'Gm7', 'C7', 'Fmaj7', 'Bbmaj7', 'Gm7', 'C7'],
    mel: [[[0, 69, 6], [6, 67, 2], [8, 65, 4], [12, 64, 4]], [[0, 65, 4], [4, 69, 4], [8, 72, 6], [14, 69, 2]], [[0, 70, 6], [6, 69, 2], [8, 67, 8]], [[0, 64, 4], [4, 67, 4], [8, 70, 4], [12, 74, 4]],
      [[0, 72, 6], [6, 69, 2], [8, 65, 4], [12, 69, 4]], [[0, 74, 6], [6, 72, 2], [8, 69, 8]], [[0, 67, 4], [4, 70, 4], [8, 64, 4], [12, 67, 4]], [[0, 65, 12]]],
    bar(i, T, s, o, L) {
      const [ch, root] = C[this.prog[i % 8]], cyc = Math.floor(i / 8);
      for (const p of [0, 3, 6, 8, 11, 14]) for (const m of ch) epiano(T(p), m, s * 2, 0.045, o.keys, 0.7);
      bass(T(0), root, s * 5, 0.2, o.bass); bass(T(6), root + 7, s * 2, 0.15, o.bass); bass(T(8), root, s * 5, 0.18, o.bass); bass(T(14), root + 7, s * 2, 0.14, o.bass);
      for (const p of [0, 3, 6, 10, 12]) rim(T(p), 0.05, o.drums);
      for (let k = 0; k < 16; k += 2) shaker(T(k), k % 4 ? 0.025 : 0.04, o.drums);
      if (cyc % 2 === 0) for (const [p, m, d] of this.mel[i % 8]) vibes(T(p), m + (cyc % 4 === 2 ? 12 : 0), d * s, 0.07, o.lead);
    }},
  // Shop: lo-fi open-plan office groove; layers come in with intensity (your tier).
  office: {bpm: 80, gain: 1.35, swing: 0.16, prog: ['Dm9', 'G13', 'Cmaj9', 'Am7', 'Dm9', 'G13', 'Fmaj9', 'E7s9'],
    bar(i, T, s, o, L) {
      const [ch, root] = C[this.prog[i % 8]];
      for (const m of ch) epiano(T(0), m, s * 9, 0.05, o.keys, 0.6);
      for (const m of ch) epiano(T(11), m, s * 4, 0.035, o.keys, 0.5);
      bass(T(0), root, s * 6, 0.22, o.bass); bass(T(10), root, s * 3, 0.16, o.bass); bass(T(14), root + (i % 2 ? 10 : 7), s * 2, 0.13, o.bass);
      kick(T(0), 0.3, o.drums); kick(T(7), 0.18, o.drums); kick(T(10), 0.24, o.drums);
      snare(T(4), 0.14, o.drums, true); snare(T(12), 0.14, o.drums, true);
      for (let k = 0; k < 6; k++) if (rnd() < 0.5) noise({t: T(rnd() * 16), dur: 0.01, vol: 0.03, type: 'highpass', f: 2000, out: o.fx});   // vinyl crackle
      if (L > 0.15) for (let k = 0; k < 16; k += 2) hat(T(k), k % 4 ? 0.03 : 0.05, o.drums);
      if (L > 0.35) { const pent = [62, 64, 67, 69, 72, 74, 76, 79]; for (let k = 0; k < 16; k += 2) if (rnd() < 0.3) kalimba(T(k), pent[Math.floor(rnd() * pent.length)], 0.06, o.lead); }
      if (L > 0.65) { for (let k = 0; k < 16; k++) if (k % 2 === 1) shaker(T(k), 0.025, o.drums); ch.forEach((m, j) => kalimba(T((8 + j)), m + 12, 0.04, o.lead)); }
      if (L > 0.85 && i % 2 === 1) hat(T(14), 0.05, o.drums, true);
    }},
  // Combat: "Performance Review", driving minor funk.
  review: {bpm: 124, swing: 0, prog: ['Am', 'F', 'G', 'E7', 'Am', 'Dm', 'F', 'E7'],
    riff: [[[0, 76, 2], [2, 79, 2], [4, 81, 3], [7, 79, 1], [8, 76, 4], [12, 74, 2], [14, 72, 2]], [[0, 69, 4], [4, 72, 2], [6, 74, 2], [8, 72, 8]],
      [[0, 71, 2], [2, 74, 2], [4, 79, 4], [8, 79, 2], [10, 77, 2], [12, 74, 4]], [[0, 76, 2], [2, 80, 2], [4, 83, 4], [8, 80, 4], [12, 76, 4]]],
    bar(i, T, s, o, L) {
      const [ch, root] = C[this.prog[i % 8]], r = root - 12, cyc = Math.floor(i / 8);
      const bl = [[0, 0, 2], [3, 12, 1], [6, 0, 1], [8, 0, 2], [10, 7, 1], [11, 12, 1], [14, 10, 2]];
      for (const [p, d, len] of bl) bass(T(p), r + d, len * s * 0.9, 0.2, o.bass);
      for (const p of [2, 6, 10, 14]) for (const m of ch) epiano(T(p), m + 12, s * 0.8, 0.025, o.keys, 1.4);
      kick(T(0), 0.4, o.drums); kick(T(8), 0.4, o.drums); if (i % 2) kick(T(10), 0.3, o.drums);
      snare(T(4), 0.22, o.drums); snare(T(12), 0.22, o.drums);
      for (let k = 0; k < 16; k++) hat(T(k), k % 2 ? 0.025 : 0.045, o.drums, k === 14);
      if (cyc % 2 === 1 || i % 8 >= 4) for (const [p, m, d] of this.riff[i % 4]) lead(T(p), m, d * s * 0.95, 0.045, o.lead);
      if (i % 8 === 7) for (let k = 12; k < 16; k++) snare(T(k), 0.08 + (k - 12) * 0.03, o.drums);
    }},
};

let want = null, cur = null, level = 0;
function startMusic(name) {
  const now = ctx.currentTime;
  if (cur) { const old = cur; old.stop = true; old.g.gain.cancelScheduledValues(now); old.g.gain.setValueAtTime(old.g.gain.value, now); old.g.gain.linearRampToValueAtTime(0.0001, now + 0.9); setTimeout(() => old.g.disconnect(), 1200); cur = null; }
  if (!name || !SONGS[name]) return;
  const song = SONGS[name], g = ctx.createGain(); g.connect(musicBus);
  g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(song.gain || 1, now + 0.8);
  const mk = (v, r) => { const x = ctx.createGain(); x.gain.value = v; x.connect(g); if (r) { const sx = ctx.createGain(); sx.gain.value = r; x.connect(sx); sx.connect(revIn); } return x; };
  const o = {keys: mk(1, 0.35), bass: mk(1, 0), drums: mk(0.9, 0.08), lead: mk(1, 0.45), fx: mk(1, 0)};
  cur = {name, song, g, o, bar: 0, next: now + 0.1, stop: false};
  schedule();
}
function schedule() {
  if (!cur || cur.stop || !ctx) return;
  const c = cur, s = 60 / c.song.bpm / 4;   // one 16th
  while (c.next < ctx.currentTime + 0.4) {
    const t = c.next, sw = c.song.swing;
    const T = p => t + p * s + (Number.isInteger(p) && p % 2 === 1 ? sw * s : 0);   // swing delays the off 16ths
    c.song.bar(c.bar, T, s, c.o, level);
    c.bar++; c.next += 16 * s;
  }
  setTimeout(schedule, 120);
}
function music(name) {
  if (want === name) return; want = name;
  if (ctx && ctx.state !== 'closed') { if (!cur || cur.name !== name) startMusic(name); }
}
function intensity(x) { level = Math.max(0, Math.min(1, x)); }
function set(o) {
  Object.assign(S, o); save();
  if (ctx) { musicBus.gain.setTargetAtTime(S.music * 1.25, ctx.currentTime, 0.05); sfxBus.gain.setTargetAtTime(S.sfx, ctx.currentTime, 0.05); }
}
/** Test helper: renders a song (bars at a given intensity) or a list of SFX into an AudioBuffer offline. */
async function renderOffline(seconds, job) {
  const keep = [ctx, master, musicBus, sfxBus, revIn, noiseBuf, duckGain, cur];
  ctx = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100); graph();
  if (job.song) {
    const song = SONGS[job.song], s = 60 / song.bpm / 4, g = ctx.createGain(); g.gain.value = song.gain || 1; g.connect(musicBus);
    const mk = (v, r) => { const x = ctx.createGain(); x.gain.value = v; x.connect(g); if (r) { const sx = ctx.createGain(); sx.gain.value = r; x.connect(sx); sx.connect(revIn); } return x; };
    const o = {keys: mk(1, 0.35), bass: mk(1, 0), drums: mk(0.9, 0.08), lead: mk(1, 0.45), fx: mk(1, 0)};
    for (let i = 0, t = 0.05; t < seconds - 1; i++, t += 16 * s) { const t0 = t; const lv = job.levels ? job.levels[Math.min(job.levels.length - 1, Math.floor(i / 8))] : (job.level || 0); song.bar(i, p => t0 + p * s + (Number.isInteger(p) && p % 2 === 1 ? song.swing * s : 0), s, o, lv); }
  } else for (const [name, at, x] of job.sfx) { const o = out(sfxBus, 0.15); o.gain.value = GAIN[name] || 1; SFX[name](at, o, x || {}); }
  const buf = await ctx.startRendering();
  [ctx, master, musicBus, sfxBus, revIn, noiseBuf, duckGain, cur] = keep;
  return buf;
}
root.LSAudio = {_render: renderOffline, sfx, music, intensity, set, get: () => Object.assign({}, S), init, _ctx: () => ctx, _songs: SONGS, _sfxNames: () => Object.keys(SFX)};
})(typeof window !== 'undefined' ? window : globalThis);
