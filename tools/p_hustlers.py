from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


@reg('privateequity', 'Private Equity')
def _():
    return person(0, 'slick', 'blonde', 'puffer', '#3a4a6a', SKY, eyes='open', mouth='smirk', brows='flat', look=3,
                  front=[path('M84 140 L100 158 L116 140 Z', SKY), path('M70 142 L94 206 M130 142 L106 206', 'none')],
                  prop=[rect(132, 96, 60, 56, W, 6), path('M140 140 L154 124 L166 132 L184 106'), path('M174 104 L186 104 L186 116', 'none'),
                        hand(140, 156, SKINS[0]),
                        g([path('M0 20 Q-4 0 14 -4 L40 -4 Q46 -12 54 -8 L50 2 Q58 10 54 20 L44 24 L44 32 L36 32 L36 26 L16 26 L16 32 L8 32 L8 24 Q0 24 0 20 Z', PINK),
                           dot(42, 4, 2.4), path('M24 -4 L32 -4', 'none')], 'translate(14 150) scale(.9)')])


TRIBE = 'Hustler'
