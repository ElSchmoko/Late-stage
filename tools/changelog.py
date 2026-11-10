"""Card change log for the in-game panel (game/changelog.js).

    python3 tools/changelog.py add "v13" <base-rev>   # diff card data at <base-rev> against the working copy, prepend as a version
    python3 tools/changelog.py rebuild                # regenerate from the VERSIONS list below

Only card changes are listed (tier, stats, card text, new and retired cards), with what the card face looked like before and after.
"""
import json, subprocess, sys, pathlib, re
R = pathlib.Path(__file__).resolve().parent.parent
OUT = R / 'game/changelog.js'
VERSIONS = [  # (label, date, base rev, head rev; None = working copy). Group releases into larger updates.
    ('Update 4', '2026-11-10', 'f44361b', None),   # rewards track: first 14 track cards, Crust Punk wording
    ('Update 3', '2026-11-08', '0265f56', 'f44361b'),
    ('Update 2', '2026-11-07', 'b8618d3', '0265f56'),
    ('Update 1', '2026-11-04', '9137f32', 'b8618d3'),
]
KEYS = ('tier', 'atk', 'hp', 'face')
def cards_at(rev):
    src = (R / 'game/data.js').read_text() if rev is None else subprocess.run(['git', 'show', f'{rev}:game/data.js'], cwd=R, capture_output=True, text=True, check=True).stdout
    m = re.search(r'window\.LS_CARDS=(\[.*?\]);\n', src, re.S)
    return {c['name']: c for c in json.loads(m.group(1)) if not c.get('token') and c['name'] != 'Follower'}
def slim(c): return {k: c.get(k) for k in ('tier', 'atk', 'hp', 'html', 'fit', 'tribe', 'art')}
def diff(a, b):
    out = []
    for n, c in b.items():
        o = a.get(n)
        if o is None: out.append({'name': n, 'new': slim(c)})
        elif any(o.get(k) != c.get(k) for k in KEYS): out.append({'name': n, 'old': slim(o), 'new': slim(c)})
    for n, o in a.items():
        if n not in b: out.append({'name': n, 'old': slim(o)})
    order = {t: i for i, t in enumerate(['Hustler', 'Influencer', 'Feral', 'Creative', 'Techie', 'Punk', 'Philosopher', 'Neutral'])}
    out.sort(key=lambda e: (order.get((e.get('new') or e['old'])['tribe'], 9), (e.get('new') or e['old'])['tier'], e['name']))
    return out
def art_at(rev):
    src = subprocess.run(['git', 'show', f'{rev}:game/data.js'], cwd=R, capture_output=True, text=True, check=True).stdout
    return json.loads(re.search(r'window\.LS_ART=(\{.*?\});\n', src, re.S).group(1))
def write(log, revs=()):
    cur = json.loads(re.search(r'window\.LS_ART=(\{.*?\});\n', (R / 'game/data.js').read_text(), re.S).group(1))
    need = {c['old']['art'] for v in log for c in v['cards'] if 'old' in c} - set(cur)
    extra = {}
    for rev in revs:   # art of retired cards, from the version that still had them
        if need - set(extra): extra.update({k: v for k, v in art_at(rev).items() if k in need})
    OUT.write_text('window.LS_CHANGELOG=' + json.dumps(log, separators=(',', ':')) + ';\nwindow.LS_CHANGELOG_ART=' + json.dumps(extra) + ';\n')
    print(OUT, len(log), 'versions', sum(len(v['cards']) for v in log), 'cards', OUT.stat().st_size, 'bytes')
def load():
    s = OUT.read_text() if OUT.exists() else 'window.LS_CHANGELOG=[];'
    return json.loads(s.split('\n')[0].split('=', 1)[1].rstrip(';'))
if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'rebuild'
    if cmd == 'rebuild':
        write([{'v': v, 'date': d, 'cards': diff(cards_at(a), cards_at(b))} for v, d, a, b in VERSIONS], [a for _, _, a, _ in VERSIONS])
    elif cmd == 'add':
        import datetime
        label, base = sys.argv[2], sys.argv[3]
        log = [e for e in load() if e['v'] != label]
        ch = diff(cards_at(base), cards_at(None))
        if ch: log.insert(0, {'v': label, 'date': datetime.date.today().isoformat(), 'cards': ch})
        write(log, [base] + [a for _, _, a, _ in VERSIONS])
