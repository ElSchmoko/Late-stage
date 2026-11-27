// Design what-ifs for the tribe calculator: runs tools/tribe_calc.js with card changes switched on and compares.
//   node tools/whatif.js   -> docs/whatif.md, tools/whatif.json
const {execFileSync} = require('child_process'), fs = require('fs'), path = require('path');
const VARIANTS = {
  apexBase: 'Apex Scavenger: X is half the printed Attack of the biggest Feral in the Feed (Feed buffs no longer count), at most twice your tier',
  oakPos: 'Ancient Oak: only the end-of-turn effects of the two minions next to it give Ferals twice as much',
  nnPos: 'New Neighbours: only the end-of-turn effect of the minion to its left triggers twice',
  jingleTurn: 'Jingle Writer: +2/+2 for each Punk you sold this turn (instead of this game, up to +16)',
  reunionOnce: 'Reunion Tour: the first Punk you sell each turn triggers its When sold twice (no stacking)',
  likesCap: 'Personal Brand: your Likes give at most +2/+2 more in total; a golden Main Character counts Likes 3 times (not 4)',
  techBuff: 'Techies: Auto-Renewal gives +3/+3 (was +2/+2), The Algorithm +2/+2 per Connect (was +1/+1)',
  philBuff: 'Philosophers: TED Talk gives twice as much (+2/+2, plus +2/+2 per Philosopher next to it)',
};
const SETS = {baseline: [], 'all changes': Object.keys(VARIANTS)};
for (const k of Object.keys(VARIANTS)) SETS[k] = [k];
const res = {};
for (const [name, vs] of Object.entries(SETS)) {
  const outp = execFileSync('node', [path.join(__dirname, 'tribe_calc.js'), '--json', `--variant=${vs.join(',')}`], {maxBuffer: 1 << 26}).toString();
  res[name] = JSON.parse(outp.trim().split('\n').pop()); process.stderr.write(`${name} done\n`);
}
fs.writeFileSync(path.join(__dirname, 'whatif.json'), JSON.stringify({VARIANTS, res}, null, 1));
const TR = Object.keys(res.baseline), TS = Object.keys(res.baseline[TR[0]]);
for (const name of Object.keys(SETS)) console.log(name.padEnd(14), TR.map(t => `${t.slice(0, 4)} ${TS.map(T => res[name][t][T].stats).join('/')}`).join('  '));
