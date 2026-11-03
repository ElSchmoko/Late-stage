// Structured model of every card: its effects as {trigger, action, amount, scope, mech} parsed from the rules text,
// plus a static power estimate. Used by the static checks (dominance, redundancy, variety, coverage, enablers/payoffs).
'use strict';
const NUM = {a: 1, an: 1, one: 1, two: 2, three: 3, four: 4};
const TRIGGERS = [
  [/^First Impression/i, 'FI'], [/^Every second end of turn|^End of turn/i, 'EOT'], [/^Start of combat/i, 'SOC'], [/^Legacy/i, 'LEG'],
  [/^When sold/i, 'SOLD'], [/^Clock In/i, 'CLOCK'], [/^Grievance/i, 'GRIEV'], [/^Side Gig/i, 'GIG'], [/^After you play a Creative|^After you play a minion/i, 'PLAY'],
  [/^After you hire/i, 'HIRE'], [/^After you Scroll/i, 'SCROLL'], [/^Once per turn, after you sell|^After you sell/i, 'SELL'], [/^After this survives damage|^After this takes damage/i, 'HURT'],
  [/^After this kills/i, 'KILL'], [/^After a friendly minion dies/i, 'DIES'], [/^After you summon/i, 'SUMMON'], [/^After you Collab/i, 'COLLAB'],
  [/^Every \d+ gold/i, 'SPEND'], [/^Sells for/i, 'SELLVAL'], [/^The first time it would die/i, 'DEATHSAVE'], [/^Your /i, 'AURA'], [/^Cleave/i, 'CLEAVE'],
  [/^Attacks twice/i, 'KW'], [/^(Attention Seeker|Out of Office|Rebrand|Toxic|Collab)\b/i, 'KW']];
const MECH = [[/Like/, 'likes'], [/Follower/, 'followers'], [/in the Feed|Feed/, 'feed'], [/sold|sell/i, 'selling'], [/gold/, 'gold'], [/Collab/, 'collab'],
  [/next combat/, 'tempbuff'], [/Attention Seeker/, 'taunt'], [/Legac/, 'legacy'], [/Discover/, 'discover'], [/damage/, 'damage'], [/Toxic/, 'toxic'],
  [/Out of Office/, 'shield'], [/dies|die\b|died/, 'death'], [/Creative/, 'creative-play'], [/kills/, 'kill'], [/spend|spent/, 'spend']];

function scopeOf(t) {
  if (/in the Feed/.test(t)) return 'feed';
  if (/next to it|on each side/.test(t)) return 'neighbours';
  if (/to its right|to its left|on its right|on its left/.test(t)) return 'adjacent1';
  if (/Followers?/.test(t) && /your Followers|it \+/.test(t)) return 'followers';
  if (/Attention Seekers/.test(t) && /give|get/.test(t)) return 'tribe-taunts';
  if (/^After this kills|\bgain\b/.test(t) && !/\bgive\b/.test(t)) return 'self';
  if (/your (other )?(three lowest|two left-most|highest)/i.test(t)) return 'some';
  if (/(your|other) (other )?(Hustlers|Influencers|Ferals|Creatives|Techies|Punks|Philosophers|Feral Attention Seekers)/i.test(t)) return 'tribe';
  if (/your (other )?minions|each of your minions|all other minions/i.test(t)) return 'all';
  if (/enemy/.test(t)) return 'enemy';
  if (/give it \+/.test(t)) return 'played';
  if (/give a minion|give another|a minion|give a Hustler/i.test(t)) return 'one';
  if (/\bgain\b|this \+|this minion/i.test(t)) return 'self';
  return 'self';
}
function parseSentence(s) {
  const trig = (TRIGGERS.find(([re]) => re.test(s)) || [null, 'OTHER'])[1];
  const eff = [];
  let m;
  const stats = [...s.matchAll(/\+(\d+)\/\+(\d+)/g)].map(x => +x[1] + +x[2]);
  if (stats.length) eff.push({action: 'buff', amount: stats.reduce((a, b) => a + b, 0), scope: scopeOf(s)});
  if ((m = s.match(/\+(\d+) (Attack|Health)/))) eff.push({action: 'buff', amount: +m[1], scope: scopeOf(s)});
  if ((m = s.match(/get (\d+) Likes/))) eff.push({action: 'likes', amount: +m[1], scope: 'player'});
  if ((m = s.match(/summon (a|an|one|two|three|four) /i))) eff.push({action: 'summon', amount: NUM[m[1].toLowerCase()], scope: 'self'});
  if ((m = s.match(/deal (\d+) damage/))) eff.push({action: 'damage', amount: +m[1], scope: /all/.test(s) ? 'enemy-all' : 'enemy-one'});
  if (/deal damage equal/.test(s)) eff.push({action: 'damage', amount: 6, scope: 'enemy-one'});
  if ((m = s.match(/gain (\d+) extra gold/))) eff.push({action: 'gold', amount: +m[1], scope: 'player'});
  if (/Discover/.test(s)) eff.push({action: 'discover', amount: 1, scope: 'player'});
  if (/Acquire/.test(s)) eff.push({action: 'acquire', amount: 1, scope: 'feed'});
  if (/give .*(Out of Office|Toxic)/.test(s)) eff.push({action: 'keyword', amount: 1, scope: scopeOf(s)});
  if (/trigger twice|twice as much|count triple|stick to two|every 3 gold|at most 3|double the|permanent\./.test(s)) eff.push({action: 'amplify', amount: 1, scope: 'player'});
  if (/loses (\d+) Attack/.test(s)) eff.push({action: 'debuff', amount: +s.match(/loses (\d+)/)[1], scope: 'enemy-one'});
  if (/take \+1\/\+1 from/.test(s)) { eff.length = 0; eff.push({action: 'drain', amount: 2, scope: 'neighbours'}); }
  if (/Sells for/.test(s)) eff.push({action: 'gold', amount: 1, scope: 'player'});
  if (/put a copy/.test(s)) eff.push({action: 'copy', amount: 1, scope: 'feed'});
  if (/comes back|survives with 1 Health/.test(s)) eff.push({action: 'survive', amount: 1, scope: 'self'});
  const mech = MECH.filter(([re]) => re.test(s)).map(x => x[1]);
  return {trigger: trig, effects: eff, mech, text: s};
}
function modelOf(c) {
  const kws = ['taunt', 'shield', 'toxic', 'rebrand', 'twice', 'collab'].filter(k => c[k]);
  const sentences = c.text.split(/(?<=\.)\s+/).filter(s => s && !/^(Attention Seeker|Out of Office|Rebrand|Toxic|Collab|Cleave[^:]*|Attacks twice)\.$/.test(s.trim()));
  const parts = sentences.map(parseSentence).filter(p => p.trigger !== 'KW' || p.effects.length);
  return {name: c.name, tribe: c.tribe, tier: c.tier, style: c.style, atk: c.atk, hp: c.hp, kws, parts,
    triggers: [...new Set(parts.map(p => p.trigger))], mech: [...new Set(parts.flatMap(p => p.mech))]};
}
const sig = p => p.trigger + ':' + p.effects.map(e => e.action + '@' + e.scope).sort().join('+');
/** a dominates b: same tribe, a.tier <= b.tier, same effect signature, every amount >= and stats >=, keywords superset, and better in at least one. */
function dominates(a, b) {
  if (a.name === b.name || a.tribe !== b.tribe || a.tier > b.tier || !a.parts.length || a.parts.length !== b.parts.length) return false;
  const sa = a.parts.map(sig).sort().join('|'), sb = b.parts.map(sig).sort().join('|');
  if (sa !== sb || /OTHER|AURA/.test(sa)) return false;
  if (a.atk < b.atk || a.hp < b.hp || !b.kws.every(k => a.kws.includes(k))) return false;
  const amt = m => m.parts.slice().sort((x, y) => sig(x).localeCompare(sig(y))).flatMap(p => p.effects.map(e => e.amount));
  const A = amt(a), B = amt(b);
  if (A.some((x, i) => x < B[i])) return false;
  return A.some((x, i) => x > B[i]) || a.atk > b.atk || a.hp > b.hp || a.tier < b.tier || a.kws.length > b.kws.length;
}
module.exports = {modelOf, dominates, sig};
