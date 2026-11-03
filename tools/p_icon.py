"""App icon: the Trash Panda peeking over the bin rim. python3 build_art.py p_icon -> art/icon.svg"""
from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


BIN, BIN_D, LID = '#6b6182', '#564d6b', '#c9c2d6'


@reg('icon', 'App Icon')
def _():
    def paw(x, y, flip=1):
        # paw gripping the rim: pad plus three claws hooked over the edge
        return g([ell(0, 0, 17, 14, GREY), path('M-8 6 L-9 13 M0 7 L0 15 M8 6 L9 13', 'none', ' stroke-width="3.5"')],
                 f'translate({x} {y}) scale({flip} 1)')
    head = g([
        # ears, with tufts
        path('M-44 -12 L-58 -62 L-12 -36 Z', GREY), path('M44 -12 L58 -62 L12 -36 Z', GREY),
        path('M-42 -22 L-49 -48 L-25 -34 Z', INK), path('M42 -22 L49 -48 L25 -34 Z', INK),
        ell(0, 2, 62, 50, GREY),
        # forehead stripe and the mask
        path('M-6 -46 Q0 -40 6 -46 L4 -18 Q0 -14 -4 -18 Z', BIN_D),
        path('M-58 2 Q-38 -30 -4 -6 Q0 14 -12 22 Q-42 28 -58 2 Z', INK), path('M58 2 Q38 -30 4 -6 Q0 14 12 22 Q42 28 58 2 Z', INK),
        # white brows above the mask
        path('M-46 -18 Q-30 -30 -14 -20', 'none', f' stroke="{W}" stroke-width="5"'), path('M46 -18 Q30 -30 14 -20', 'none', f' stroke="{W}" stroke-width="5"'),
        # eyes glancing sideways, with catchlights
        circ(-23, 2, 12.5, W), circ(23, 2, 12.5, W), dot(-17, 4, 5.4), dot(29, 4, 5.4),
        circ(-15, 2, 1.8, W, ' stroke="none"'), circ(31, 2, 1.8, W, ' stroke="none"'),
    ], 'translate(100 118) scale(1.25)')
    return [
        head,
        # bin body (full bleed) with ribs and a shadow under the rim
        rect(-80, 140, 360, 160, BIN), rect(-80, 150, 360, 12, BIN_D, 0, ' stroke="none"'),
        path('M-12 166 L-12 236 M44 166 L44 236 M100 166 L100 236 M156 166 L156 236 M212 166 L212 236'),
        # rim, with a highlight
        rect(-84, 126, 368, 26, LID, 12), path('M8 134 L84 134', 'none', f' stroke="{W}" stroke-width="5"'),
        # tier-star sticker on the bin
        g([star(0, 0, 15, Y)], 'translate(128 184) rotate(-12)'),
        paw(30, 132), paw(170, 132, -1),
    ]
