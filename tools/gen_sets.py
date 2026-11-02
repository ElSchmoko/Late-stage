import html, pathlib
from lsdata import *

STYLE_BLURB = {
    'PI': 'Hire Hustlers and spend gold. Every coin you spend turns into stats.',
    'EX': 'Sell, squeeze and cash out. Your board feeds on itself.',
    'FO': 'Flood the board with 1/1 Followers, then make them huge.',
    'MC': 'Pour every buff into your single highest-Attack star.',
    'OG': 'Slow growers that get bigger at every end of turn.',
    'TH': 'Attention Seekers that hold the line and shelter the rest.',
    'PE': 'Every Creative you play makes the whole band bigger.',
    'PF': 'Deaths and Legacies make the survivors legendary.',
    'GA': 'Collab gadgets onto your best minions to make them Techies.',
    'GM': 'Kill-hungry minions that level up in the middle of a fight.',
    'SA': 'Start-of-combat damage that wrecks the enemy before the first hit.',
    'SO': 'Sell Punks for value. Their When sold effects keep paying out.',
    'BI': 'Big next-combat buffs that the right cards make permanent.',
    'ST': 'Attention Seekers that grow every time they survive a hit.',
}
NB_BLURB = 'Neighbours turn up in every lobby, whichever tribes are in it. They are glue: buffs for whoever sits next to them, two rule-doublers, and The Landlord.'
FLEX = 'Flex cards (no tag) fit either style.'

CSS = CARD_CSS + """
.lbl{margin:0;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:15px;letter-spacing:.12em;color:#5a5270;line-height:1;display:flex;align-items:center;gap:8px}
.grp{display:flex;flex-direction:column;gap:22px}
.cards{display:flex;gap:44px}
.cw{display:flex;flex-direction:column;width:240px}
.fl{margin:34px 4px 0;font-size:13px;font-style:italic;font-weight:700;color:#5a5270;line-height:1.4}
.sty-card{box-sizing:border-box;border:3px solid #2b2140;border-radius:20px;background:#ffffff;padding:18px 20px;width:330px}
.sty-card h3{margin:0;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:22px;line-height:1.1}
.sty-card p{margin:6px 0 0;font-size:14px;font-weight:700;line-height:1.45;color:#3d3352}
"""


def board(tribe):
    cards = BY_TRIBE[tribe] if tribe != 'Neutral' else NEIGHBOURS
    tc = TRIBE_COL[tribe]
    styles = [(k, v[1]) for k, v in STYLES.items() if v[0] == tribe]
    by_tier = {t: [c for c in cards if c.tier == t] for t in range(1, 7)}
    rows = [[1, 2], [3, 4], [5, 6]] if tribe != 'Neutral' else [[1, 2, 3], [4, 5, 6]]
    sname = dict(styles)

    def group(t):
        cs = by_tier[t]
        inner = ''.join(f'<div class="cw">{card_html(c)}<p class="fl">{html.escape(flavour_of(c))}</p></div>' for c in cs)
        return f'<div class="grp"><p class="lbl">{stars(t, 18)}TIER {t}</p><div class="cards">{inner}</div></div>'

    head = (f'<div style="display: flex; align-items: flex-start; gap: 40px">'
            f'<div style="width: 520px"><p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 15px; letter-spacing: .14em; color: #5a5270">LATE STAGE · CARD SET</p>'
            f'<h1 style="margin: 6px 0 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 64px; line-height: 1; display: flex; align-items: center; gap: 18px">'
            f'<span style="width: 40px; height: 40px; border: 4px solid #2b2140; border-radius: 12px; background: {tc}; box-shadow: 3px 4px 0 #2b2140"></span>{TRIBE_PLURAL[tribe]}</h1>'
            f'<p style="margin: 12px 0 0; font-size: 16px; font-weight: 700; line-height: 1.5; color: #3d3352">{len(cards)} cards. '
            + (FLEX if tribe != 'Neutral' else NB_BLURB) + '</p></div>')
    if tribe != 'Neutral':
        for code, name in styles:
            head += (f'<div class="sty-card"><span class="sty" style="position: static; display: inline-block">{name}</span>'
                     f'<p>{STYLE_BLURB[code]}</p></div>')
    head += '</div>'
    body_rows = ''.join(f'<div style="display: flex; gap: 84px">{"".join(group(t) for t in r)}</div>' for r in rows)
    H = 1880 if tribe != 'Neutral' else 1420
    body = (f'<div style="width: 1840px; height: {H}px; box-sizing: border-box; padding: 64px; background: #fff6dc; '
            f'font-family: \'Nunito\', system-ui, sans-serif; color: #2b2140; display: flex; flex-direction: column; gap: 64px">{head}{body_rows}</div>')
    return page(f'{TRIBE_PLURAL[tribe]} card set', CSS, body, 1840, H), H


if __name__ == '__main__':
    import sys
    out = pathlib.Path(sys.argv[sys.argv.index('--out') + 1]) if '--out' in sys.argv else S / 'cards/project'
    out.mkdir(parents=True, exist_ok=True)
    for t in TRIBES + ['Neutral']:
        h, H = board(t)
        (out / f'Set{TRIBE_PLURAL[t]}.dc.html').write_text(h)
        print(t, H)
