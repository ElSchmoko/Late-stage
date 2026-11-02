from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


def hedge(y=150):
    return [path(f'M-6 206 L-6 {y} Q10 {y - 16} 26 {y} Q42 {y - 18} 58 {y} Q74 {y - 16} 90 {y} Q106 {y - 18} 122 {y} Q138 {y - 16} 154 {y} '
                 f'Q170 {y - 18} 186 {y} Q198 {y - 12} 206 {y} L206 206 Z', '#3fc070')]


@reg('nosyneighbour', 'Nosy Neighbour')
def _():
    return person(0, 'bob', 'grey', 'cardigan', PINK, W, eyes='open', mouth='o', hat='curlers', hatc=SKY,
                  front=[rect(70, 80, 26, 26, INK, 9), rect(104, 80, 26, 26, INK, 9), rect(92, 86, 16, 10, DGREY, 3),
                         circ(83, 93, 7, SKY), circ(117, 93, 7, SKY), *hedge(156),
                         hand(70, 112, SKINS[0], 9), hand(130, 112, SKINS[0], 9)])


@reg('wifileech', 'Wi-Fi Leech')
def _():
    return person(2, 'messy', 'dark', 'hoodie', G, '#1f9a50', eyes='open', mouth='smirk', look=4, brows='one',
                  prop=[*laptop(116, 140, 72, GREY, SKY), *wifi(152, 166, .5), *wifi(36, 70, 1),
                        path('M50 92 Q70 120 64 150', 'none', ' stroke-dasharray="3 7"')])


@reg('packagehoarder', 'Package Hoarder')
def _():
    o = person(4, 'short', 'black', 'tee', SKY, eyes='happy', mouth='grin', look=0)
    o += box(20, 140, 70, 66) + box(104, 150, 82, 56) + box(120, 108, 54, 44, '#d8a868') + box(30, 100, 50, 42, '#d8a868')
    o += [path('M36 172 L72 172 M118 180 L172 180'), heart(150, 128, .5, RED)]
    return o


@reg('quiethours', 'Quiet-Hours Enforcer')
def _():
    return person(1, 'short', 'grey', 'robe', SKY, W, eyes='angry', mouth='o', extra=['bags'],
                  front=[path('M102 140 L102 104', 'none', ' stroke-width="8"'), circ(102, 140, 9, SKINS[1]),
                         path('M98 104 L98 96 M106 104 L106 96', 'none')],
                  prop=[circ(160, 150, 26, W), circ(146, 126, 9, RED), circ(174, 126, 9, RED), path('M160 150 L160 134 M160 150 L170 152'),
                        path('M146 172 L140 180 M174 172 L180 180'), path('M136 112 L130 104 M184 112 L190 104')])


@reg('caretaker', 'Caretaker')
def _():
    return person(3, 'short', 'brown', 'overalls', '#7a9a5a', SKY, eyes='open', mouth='smile', hat='cap', hatc=ORA, extra=['mustache'],
                  prop=[g([path('M-6 0 L-6 -56 Q-18 -60 -18 -72 L-10 -72 L-10 -64 L10 -64 L10 -72 L18 -72 Q18 -60 6 -56 L6 0 Z', GREY)], 'translate(160 180) rotate(14)'),
                        hand(158, 172, SKINS[3]), rect(10, 172, 40, 26, RED, 4), rect(18, 162, 24, 12, 'none', 4)])


@reg('helpfulneighbour', 'Helpful Neighbour')
def _():
    return person(5, 'curly', 'black', 'apron', Y, W, eyes='happy', mouth='grin',
                  prop=[ell(150, 168, 40, 10, W), path('M118 168 L118 140 Q150 128 182 140 L182 168 Q150 176 118 168 Z', PINK),
                        path('M118 142 Q150 150 182 142 L182 136 Q150 126 118 136 Z', W), circ(150, 126, 8, RED), path('M150 118 L154 108'),
                        hand(118, 174, SKINS[5]), hand(182, 174, SKINS[5]),
                        g([rect(0, 0, 34, 16, Y, 5), rect(32, 4, 14, 8, GREY, 2), rect(6, 14, 12, 18, Y, 4)], 'translate(14 136) rotate(-10)')])


@reg('leafblower', 'Leaf Blower Guy')
def _():
    return person(1, 'short', 'ginger', 'vest', '#7a9a5a', ORA, eyes='shades', mouth='grin', hat='earmuffs', hatc=Y,
                  prop=[g([rect(0, 0, 64, 18, ORA, 8), rect(-16, -8, 22, 34, DGREY, 6)], 'translate(128 150) rotate(-14)'), hand(140, 166, SKINS[1]),
                        leaf(176, 112, 10, 6, -30, ORA), leaf(186, 136, 9, 5, 40, Y), leaf(164, 96, 8, 5, 10, RED), leaf(26, 80, 9, 5, 40, ORA),
                        motion(164, 120, 3, 24)])


@reg('weddingdj', 'Wedding DJ')
def _():
    return person(2, 'slick', 'dark', 'vest', W, PUR, eyes='closed' if False else 'happy', mouth='grin', hat='headphones', hatc=PINK,
                  front=[path('M98 146 L102 146 L104 156 L96 156 Z', RED)],
                  prop=[rect(8, 164, 184, 42, DGREY, 8), *vinyl(54, 180, 18, Y), *vinyl(146, 180, 18, PINK), rect(92, 172, 16, 22, INK, 3),
                        sparkle(28, 74, 9, Y), sparkle(176, 70, 8, PINK), circ(172, 108, 5, Y), path('M168 108 L168 92 L176 90')])


@reg('estatelawyer', 'Estate Lawyer')
def _():
    return person(0, 'sides', 'grey', 'suit', DGREY, PUR, eyes='glasses', mouth='flat', brows='flat', look=2,
                  prop=[path('M132 112 L184 112 L184 190 L132 190 Z', '#fff2d0'), rect(126, 104, 64, 12, '#f2dcae', 6), rect(126, 186, 64, 12, '#f2dcae', 6),
                        path('M142 130 L174 130 M142 142 L170 142 M142 154 L172 154'), circ(170, 172, 9, RED),
                        hand(130, 150, SKINS[0])])


@reg('landlord', 'The Landlord')
def _():
    return person(0, 'slick', 'grey', 'suit', '#5a3d6a', Y, eyes='open', mouth='smirk', brows='angry', hat='tophat', hatc=RED,
                  extra=['mustache'], look=-2,
                  prop=[circ(158, 158, 14, 'none', ' stroke="#ffc928" stroke-width="5"'), circ(158, 158, 14, 'none'),
                        g([rect(0, 0, 8, 26, Y, 2), rect(8, 16, 8, 5, Y, 1)], 'translate(146 166) rotate(18)'),
                        g([rect(0, 0, 8, 22, GREY, 2), rect(8, 12, 7, 5, GREY, 1)], 'translate(164 168) rotate(-12)'),
                        hand(150, 150, SKINS[0]), coin(30, 150, 10), coin(40, 176, 10)])


@reg('blockparty', 'Block Party Host')
def _():
    o = [path('M-4 56 Q100 80 204 56', 'none')]
    for i, x in enumerate(range(10, 200, 30)):
        c = [RED, Y, SKY, G, PINK, ORA, LIL][i % 7]
        y = 56 + 22 * (1 - ((x - 100) / 104) ** 2) * .5
        o += [path(f'M{x - 10} {y} L{x + 10} {y + 1} L{x} {y + 18} Z', c)]
    o += person(4, 'short', 'black', 'apron', SKY, RED, eyes='happy', mouth='grin', extra=['beard'],
                prop=[path('M136 150 L192 150 Q190 176 164 178 Q138 176 136 150 Z', INK), rect(130, 144, 68, 8, GREY, 3),
                      rect(140, 136, 22, 9, '#c0603a', 4), rect(166, 134, 22, 9, '#c0603a', 4), steam(154, 124),
                      path('M30 168 L54 120', 'none', ' stroke-width="6"'), hand(30, 172, SKINS[4])])
    return o


TRIBE = 'Neutral'
