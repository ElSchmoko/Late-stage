"""Export card data + art for the playable build."""
import json, pathlib
from lsdata import *
from heroes import HEROES
from cards import TOKENS
cards = []
SLUG['Pigeon'] = 'pigeon'; SLUG['Follower'] = 'follower'
for c in [c for t in TRIBES for c in BY_TRIBE[t]] + NEIGHBOURS + TOKENS:
    cards.append(dict(name=c.name, tribe=c.tribe, tier=c.tier, atk=c.atk, hp=c.hp, style=c.style, text=text_of(c), face=face_text(c),
                      flavour=flavour_of(c), taunt=c.taunt, shield=c.shield, toxic=c.toxic, rebrand=c.rebrand, collab=c.collab,
                      kind=c.kind, sellbait=c.sellbait, discover=c.discover, twice=c.twice, art=SLUG[c.name], fit=FIT.get(c.name, 13),
                      html=fmt(face_text(c)), full_html=fmt(text_of(c)), token=c in TOKENS))
heroes = [dict(slug=h[0], name=h[1], power=h[2], cost=h[3], effect=h[4], effect_html=fmt(h[4]), push=h[5], boundaries=h[6], unlock=h[7], col=h[8]) for h in HEROES]
art = {}
A = S / 'art'
need = {c['art'] for c in cards} | {h['slug'] for h in heroes} | {'follower', 'city'}
for slug in need:
    art[slug] = (A / f'{slug}.svg').read_text().strip()
out = S / 'game/data.js'
out.write_text('window.LS_CARDS=' + json.dumps(cards) + ';\nwindow.LS_HEROES=' + json.dumps(heroes) + ';\nwindow.LS_TRIBE_COL=' + json.dumps(TRIBE_COL)
               + ';\nwindow.LS_TRIBE_PLURAL=' + json.dumps(TRIBE_PLURAL) + ';\nwindow.LS_STYLES=' + json.dumps({k: list(v) for k, v in STYLES.items()})
               + ';\nwindow.LS_ART=' + json.dumps(art) + ';\n')
print(len(cards), len(heroes), len(art), out.stat().st_size)
