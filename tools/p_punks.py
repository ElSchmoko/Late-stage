from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


def anarchy(cx, cy, r, col=INK):
    return [circ(cx, cy, r, 'none'), path(f'M{cx - r * .7} {cy + r * .9} L{cx} {cy - r * 1.05} L{cx + r * .7} {cy + r * .9} M{cx - r * .9} {cy + r * .2} L{cx + r * .9} {cy + r * .2}')]


@reg('graffitikid', 'Graffiti Kid')
def _():
    return person(4, 'short', 'black', 'hoodie', LIME, '#8fc040', eyes='open', mouth='grin', hat='capback', hatc=RED, look=3,
                  back=[path('M10 60 Q30 40 50 62 Q60 76 44 84 Q24 90 22 76', 'none', ' stroke="#ff8ab8" stroke-width="9"'),
                        path('M10 60 Q30 40 50 62 Q60 76 44 84 Q24 90 22 76', 'none'),
                        path('M30 96 L30 120 M46 92 L46 108', 'none', ' stroke="#ff8ab8" stroke-width="5"')],
                  prop=[spray(150, 118, Y, 20), hand(150, 160, SKINS[4]), circ(186, 104, 4, Y), circ(190, 90, 3, Y), circ(180, 82, 2.5, Y)])


@reg('anarchistbarista', 'Anarchist Barista')
def _():
    return person(1, 'buzz', 'pink', 'apron', INK, DGREY, eyes='tired', mouth='flat', extra=['nosering', 'earring'],
                  prop=[path('M138 132 L186 132 L180 176 Q176 186 162 186 Q148 186 144 176 Z', W), ell(162, 134, 24, 7, BROWN),
                        path('M154 138 L162 128 L170 138 M156 134 L168 134', 'none', ' stroke="#ffffff" stroke-width="3"'),
                        path('M186 140 Q198 140 196 152 Q194 162 182 160'), steam(156, 118), hand(146, 180, SKINS[1])])


@reg('zinemaker', 'Zine Maker')
def _():
    return person(0, 'bob', 'purple', 'tee', Y, eyes='glasses', mouth='smile', hat='bandana', hatc=RED,
                  prop=[book(132, 118, 50, 64, W, 8), *anarchy(162, 146, 10), path('M140 170 L172 170'),
                        rect(20, 168, 50, 20, GREY, 6), rect(18, 152, 54, 14, DGREY, 6, ' transform="rotate(-10 45 159)"'),
                        hand(138, 178, SKINS[0])])


@reg('selloutfrontman', 'Sellout Frontman')
def _():
    return person(2, 'mohawk', 'green', 'suit', '#ffe08a', RED, eyes='shades', mouth='grin', extra=['earring'],
                  front=[path('M84 142 Q100 166 116 142', 'none', ' stroke="#ffc928" stroke-width="5"')],
                  prop=[g([rect(0, 0, 40, 22, G, 3), circ(20, 11, 6, '#7fd67a')], 'translate(140 136) rotate(-14)'),
                        g([rect(0, 0, 40, 22, G, 3), circ(20, 11, 6, '#7fd67a')], 'translate(146 154) rotate(8)'),
                        hand(146, 172, SKINS[2]), sparkle(30, 72, 8, Y), sparkle(176, 92, 6, Y)])


@reg('heckler', 'Heckler')
def _():
    return person(0, 'short', 'ginger', 'tee', SKY, eyes='angry', mouth='shout', hat='beanie', hatc=G, extra=['stubble'],
                  front=[path('M66 108 Q60 126 74 138 L90 128 Q82 118 84 108 Z', SKINS[0]), path('M134 108 Q140 126 126 138 L110 128 Q118 118 116 108 Z', SKINS[0])],
                  prop=[path('M150 96 L174 84 M154 112 L182 110 M150 128 L174 138'),
                        g([path('M0 0 L18 0 L16 34 Q9 38 2 34 Z', '#ffd36b'), path('M0 4 L18 4', 'none'), ell(9, 0, 9, 4, W)], 'translate(20 140) rotate(-10)')])


@reg('crustpunk', 'Crust Punk')
def _():
    return person(3, 'dreads', 'brown', 'leather', DGREY, eyes='open', mouth='smirk', extra=['stubble', 'nosering'],
                  front=[rect(56, 168, 22, 18, RED, 2, ' transform="rotate(-8 67 177)"'), rect(122, 172, 22, 16, Y, 2, ' transform="rotate(6 133 180)"'),
                         *anarchy(67, 177, 6)],
                  prop=[g([ell(0, 18, 26, 16, '#c98a4a'), circ(20, 0, 15, '#c98a4a'), path('M10 -8 L6 -22 L18 -12 Z', DBROWN),
                           dot(18, -2, 2.5), dot(26, -2, 2.5), ell(30, 4, 3, 2, INK), path('M-24 12 Q-36 4 -34 -6')], 'translate(160 176)')])


@reg('squat', 'Squat Collective')
def _():
    return [ground(200, '#9ab070'), rect(36, 96, 128, 110, '#d8c4a8', 4), path('M24 100 L100 44 L176 100 Z', '#a0705a'),
            path('M100 44 L100 26'), path('M100 26 L132 32 L100 40 Z', INK), *[path(x) for x in ['M104 28 L112 38 M112 28 L104 38']],
            rect(52, 112, 36, 30, SKY, 3), rect(112, 112, 36, 30, '#a0705a', 3), path('M110 118 L150 136 M110 136 L150 118', 'none'),
            rect(80, 154, 40, 52, RED, 4), dot(112, 180, 3),
            *face(70, 128, .42, 'open', 'smile'),
            path('M40 186 Q60 170 70 184 M136 160 L156 156 L150 176 Z', 'none'), *anarchy(150, 168, 8)]


@reg('feedbackloop', 'Feedback Loop')
def _():
    return [rect(36, 62, 128, 140, INK, 10), rect(48, 74, 104, 22, DGREY, 4),
            *[circ(64 + i * 24, 85, 5, Y) for i in range(4)], circ(100, 146, 40, DGREY), circ(100, 146, 26, '#3a3150'), circ(100, 146, 8, GREY),
            *face(100, 140, .5, 'angry', 'shout'),
            lightning(30, 50, .9, Y), lightning(176, 60, .8, Y),
            path('M14 120 Q4 140 14 160 M186 120 Q196 140 186 160 M8 106 Q-6 140 8 174', 'none')]


@reg('pirateradio', 'Pirate Radio')
def _():
    return [path('M60 82 L140 50'), circ(142, 49, 5, RED),
            rect(20, 82, 160, 110, RED, 14), rect(32, 96, 64, 64, '#3a3150', 32), circ(64, 128, 22, DGREY), circ(64, 128, 8, GREY),
            rect(108, 98, 60, 24, '#ffe9a8', 4), path('M116 110 L160 110'), rect(132, 100, 4, 20, RED, 1),
            circ(124, 150, 9, W), circ(152, 150, 9, W),
            circ(64, 128, 14, W), dot(59, 125, 3), dot(69, 125, 3), path('M58 136 L60 132 L64 136 L68 132 L70 136'),
            path('M150 34 Q160 40 156 52 M162 26 Q178 38 170 58', 'none'), rect(40, 192, 20, 8, INK, 2), rect(140, 192, 20, 8, INK, 2)]


@reg('moshpit', 'Mosh Pit')
def _():
    o = []
    for x, y, skin, hair, hc, eyes, m, oc in [(40, 116, 3, 'mohawk', 'pink', 'angry', 'shout', INK), (160, 112, 0, 'spiky', 'teal', 'happy', 'grin', RED),
                                             (100, 128, 5, 'buzz', 'black', 'angry', 'shout', DGREY)]:
        o += [gs(person(skin, hair, hc, 'leather', oc, eyes=eyes, mouth=m), f'translate({x - 100 * .62} {y - 86 * .62}) scale(.62)')]
    o += [g([path('M0 0 Q-4 -18 6 -22 L20 -22 Q28 -20 26 -6 L20 6 Q8 10 0 0 Z', SKINS[2]), path('M6 -22 L6 -12 M14 -22 L14 -12')], 'translate(70 70) rotate(-10)'),
          g([path('M0 0 Q-4 -18 6 -22 L20 -22 Q28 -20 26 -6 L20 6 Q8 10 0 0 Z', SKINS[4]), path('M6 -22 L6 -12 M14 -22 L14 -12')], 'translate(126 66) rotate(12)'),
          path('M24 60 L34 70 M178 58 L168 68 M100 52 L100 40')]
    return o


@reg('energysponsor', 'Energy-Drink Sponsor')
def _():
    return [rect(54, 50, 92, 156, '#3a3150', 18), ell(100, 54, 40, 10, GREY), rect(94, 40, 14, 10, GREY, 3),
            path('M54 92 L146 92 M54 176 L146 176'), *face(100, 128, .9, 'shades', 'grin'),
            lightning(102, 148, .7, LIME), path('M54 100 L146 100', 'none', ' stroke="#b5e05a" stroke-width="4"'),
            g([rect(0, 0, 22, 14, G, 3)], 'translate(18 80) rotate(-20)'), g([rect(0, 0, 22, 14, G, 3)], 'translate(162 70) rotate(20)'),
            lightning(30, 140, .7, LIME), lightning(176, 130, .7, LIME)]


@reg('reuniontour', 'Reunion Tour')
def _():
    return person(1, 'mohawk', 'grey', 'leather', INK, eyes='sqglasses', mouth='grin', extra=['bags', 'earring'],
                  front=[path('M64 72 L72 76 M128 72 L136 76', 'none')],
                  prop=[rect(160, 96, 8, 108, BROWN, 3), path('M150 98 Q164 82 178 98', 'none', ' stroke-width="8"'), path('M150 98 Q164 82 178 98'),
                        hand(162, 140, SKINS[1]), star(30, 80, 9, Y), path('M26 120 L40 116 M28 136 L42 138')])


@reg('stagediver', 'Stage Diver')
def _():
    sk = SKINS[4]
    o = [path('M150 108 L192 76', 'none', ' stroke-width="18"'), path('M150 108 L192 76', 'none', ' stroke="#6b6182" stroke-width="13"'),
         path('M150 120 L196 112', 'none', ' stroke-width="18"'), path('M150 120 L196 112', 'none', ' stroke="#6b6182" stroke-width="13"'),
         rect(186, 64, 18, 14, INK, 4, ' transform="rotate(-36 195 71)"'), rect(190, 104, 16, 14, INK, 4),
         rect(76, 92, 92, 46, PUR, 22), dot(100, 108, 2.5, W), dot(120, 122, 2.5, W), dot(140, 104, 2.5, W),
         path('M86 98 L52 66', 'none', ' stroke-width="14"'), path('M86 98 L52 66', 'none', ' stroke="#4a3d6a" stroke-width="9"'), circ(48, 62, 9, sk),
         path('M36 120 L4 112 L22 104 L2 92 L26 92 L14 76 L40 94 Z', RED),
         circ(62, 120, 30, sk), *face(64, 120, .72, 'happy', 'grin'),
         motion(150, 150, 2, 20), sparkle(30, 160, 7, Y), sparkle(120, 60, 8, Y)]
    for x, s_ in [(24, 0), (64, 3), (108, 5), (150, 1), (188, 2)]:
        o += [path(f'M{x} 206 L{x} 178', 'none', ' stroke-width="10"'), circ(x, 172, 10, SKINS[s_])]
    return o


@reg('greatesthits', 'Greatest Hits')
def _():
    return [*vinyl(130, 120, 52, PINK), rect(26, 70, 100, 110, Y, 6), rect(36, 80, 80, 90, RED, 4), star(76, 116, 22, Y),
            *face(76, 122, .5, 'happy', 'small', blush=False), sparkle(176, 62, 9, W), sparkle(30, 190, 6, Y)]


@reg('generalstrike', 'General Strike')
def _():
    o = []
    for x, rot, col in [(44, -10, W), (156, 10, Y)]:
        o += [sign(x - 30, 54, 60, 44, [], col, True, rot)]
    o += [g([path('M-12 6 L-12 -10 Q-12 -16 -6 -16 L12 -16 Q18 -16 18 -8 L18 8 Q18 16 8 16 L-4 16 Q-12 16 -12 6 Z', RED),
             path('M-6 -16 L-6 -6 M2 -16 L2 -6 M10 -16 L10 -6')], 'translate(44 76) rotate(-10)'),
          path('M144 68 L170 68 M144 80 L162 80', 'none')]
    for x, sk, hair, hc, eyes in [(46, 4, 'curly', 'black', 'angry'), (154, 0, 'bob', 'ginger', 'angry')]:
        o += [gs(person(sk, hair, hc, 'hivis', ORA, eyes=eyes, mouth='shout'), f'translate({x - 60} 70) scale(.6)')]
    o += [gs(person(2, 'short', 'brown', 'overalls', SKY, Y, eyes='angry', mouth='shout', hat='hardhat', hatc=Y), 'translate(30 66) scale(.7)')]
    return o


TRIBE = 'Punk'
