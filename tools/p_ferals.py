from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


BARK, DBARK, LEAF2 = '#b07a4a', '#8a5a3a', '#7fd67a'


@reg('succulent', 'Windowsill Succulent')
def _():
    o = [rect(14, 60, 172, 150, SKY, 10), path('M100 60 L100 206 M14 132 L186 132'), rect(4, 176, 192, 24, W, 6)]
    o += pot(62, 146, 76, 36, ORA)
    for cx, cy, rx, ry, r in [(70, 120, 14, 26, -40), (130, 120, 14, 26, 40), (84, 110, 13, 28, -16), (116, 110, 13, 28, 16)]:
        o += [leaf(cx, cy, rx, ry, r, '#7fd6a0', False)]
    o += [ell(100, 120, 30, 26, '#9ce3b4')]
    o += face(100, 116, .55, 'happy', 'small')
    o += [sparkle(160, 80, 8, Y)]
    return o


@reg('pigeon', 'City Pigeon')
def _():
    return [path('M30 206 Q20 150 60 128 L140 128 Q190 150 176 206 Z', GREY),
            path('M60 140 Q40 160 44 196 Q70 180 80 150 Z', DGREY), path('M140 140 Q160 160 156 196 Q130 180 120 150 Z', DGREY),
            ell(100, 138, 34, 20, '#8fd6b4'), ell(100, 146, 30, 14, LIL),
            circ(100, 96, 40, GREY), *face(100, 92, .9, 'open', 'none'),
            path('M92 104 L100 122 L108 104 Q100 98 92 104 Z', ORA), path('M96 102 Q100 98 104 102', W),
            rect(140, 160, 38, 12, Y, 3, ' transform="rotate(-24 159 166)"'), rect(146, 150, 30, 10, '#ffe08a', 3, ' transform="rotate(-36 161 155)"')]


@reg('trashpanda', 'Trash Panda')
def _():
    return [path('M66 78 L58 46 L86 62 Z', GREY), path('M134 78 L142 46 L114 62 Z', GREY),
            ell(100, 96, 46, 40, GREY),
            path('M58 92 Q74 72 98 90 Q102 104 92 110 Q72 114 58 92 Z', INK), path('M142 92 Q126 72 102 90 Q98 104 108 110 Q128 114 142 92 Z', INK),
            circ(84, 94, 9, W), circ(116, 94, 9, W), dot(86, 96, 3.6), dot(114, 96, 3.6),
            ell(100, 120, 22, 14, W), ell(100, 112, 7, 5, INK), path('M92 124 Q100 130 108 124'),
            rect(34, 130, 132, 80, DGREY, 6), rect(26, 124, 148, 16, GREY, 6), path('M60 150 L60 200 M100 150 L100 200 M140 150 L140 200'),
            circ(64, 128, 10, GREY), circ(136, 128, 10, GREY),
            path('M142 120 L176 96 L184 120 Z', '#ffd36b'), dot(166, 110, 3, RED), dot(174, 114, 3, RED), path('M142 120 L176 96', 'none', ' stroke-width="7"'),
            path('M16 186 Q24 172 34 182')]


@reg('monstera', 'Monstera')
def _():
    def mleaf(cx, cy, r, rot):
        return g([path(f'M0 0 Q-{r} -{r * .6} -{r * .2} -{r * 1.5} Q{r * .4} -{r * 1.3} {r * .9} -{r * .6} Q{r * .7} -{r * .1} 0 0 Z', G),
                  path(f'M0 0 Q{r * .2} -{r * .8} {r * .1} -{r * 1.3}'),
                  path(f'M-{r * .45} -{r * .55} L-{r * .15} -{r * .62} M{r * .6} -{r * .55} L{r * .25} -{r * .62} M-{r * .3} -{r * 1.05} L{r * .02} -{r * 1.0}')],
                 f'translate({cx} {cy}) rotate({rot})')
    return [path('M100 150 Q96 120 70 96 M100 150 Q104 110 130 88 M100 150 Q100 120 100 80'),
            mleaf(70, 110, 42, -40), mleaf(132, 104, 42, 36), mleaf(100, 98, 40, 0),
            *pot(56, 146, 88, 50, '#ff8ab8'), *face(100, 172, .55, 'happy', 'smile')]


@reg('treehugger', 'Tree Hugger')
def _():
    return person(2, 'dreads', 'brown', 'tee', LIME, eyes='calm', mouth='smile', hat='flower', extra=['freckles'],
                  back=[rect(138, 40, 52, 170, BARK, 8), path('M150 70 Q156 90 150 110 M174 130 Q168 150 176 170'),
                        leaf(184, 64, 16, 9, -30), leaf(150, 50, 14, 8, 20)],
                  prop=[path('M120 150 Q150 136 166 150', 'none', ' stroke-width="0"'),
                        path('M130 146 Q150 140 158 156 L150 164 Q138 154 128 158 Z', SKINS[2]), hand(160, 150, SKINS[2]),
                        heart(46, 70, .9, PINK)])


@reg('compost', 'Compost Heap')
def _():
    return [path('M14 206 Q20 120 100 110 Q180 120 186 206 Z', DBROWN),
            path('M40 150 Q50 130 64 140 Q60 156 40 150 Z', Y), path('M64 140 L66 128'),
            ell(146, 150, 12, 14, RED), path('M146 136 L148 128'), leaf(154, 132, 7, 4, -20),
            path('M120 180 Q130 170 142 180 Q150 188 162 182', 'none', ' stroke-width="0"'),
            ell(76, 182, 10, 5, '#ffe9a8'), path('M30 190 L40 186 M164 196 L176 192'),
            *face(100, 154, .7, 'happy', 'smile'),
            path('M100 110 Q96 80 116 66 Q132 58 136 72 Q138 84 124 84', 'none', ' stroke-width="14"'),
            path('M100 110 Q96 80 116 66 Q132 58 136 72 Q138 84 124 84', 'none', ' stroke="#ff9ab0" stroke-width="9"'),
            dot(126, 68, 2.4), dot(132, 70, 2.4), path('M58 82 Q62 70 70 76 M150 70 Q158 60 164 68')]


@reg('plantparent', 'Plant Parent')
def _():
    return person(1, 'bun', 'ginger', 'cardigan', '#7fd6a0', '#ffe9a8', eyes='glasses', mouth='smile', extra=['freckles'],
                  prop=[g([path('M0 0 L34 0 L30 28 L4 28 Z', TEAL), path('M34 6 L52 -8 L56 -4 L40 12', TEAL), path('M2 6 Q-12 6 -10 16 Q-8 24 4 22')],
                          'translate(136 108) rotate(-6)'), hand(138, 136, SKINS[1]),
                        path('M190 96 L194 104 M184 100 L186 108'),
                        *pot(30, 168, 30, 24, PINK), leaf(38, 156, 12, 6, -60), leaf(52, 154, 12, 6, 50), leaf(45, 146, 12, 6, 0)])


@reg('protestcamp', 'Protest Camp')
def _():
    return [ground(198), path('M20 200 L100 70 L180 200 Z', ORA), path('M100 70 L80 200 L120 200 Z', '#ffb27a'),
            path('M100 70 L100 52'), path('M100 52 L130 58 L100 66 Z', G),
            ell(100, 172, 18, 26, INK), *face(100, 168, .45, 'open', 'small'),
            sign(146, 120, 44, 30, ['M154 130 L182 130 M154 138 L174 138']), leaf(170, 134, 0, 0, 0, G, False),
            path('M30 200 L18 178 M170 200 L182 178')]


@reg('urbanfox', 'Urban Fox')
def _():
    return [path('M50 206 Q56 150 100 140 Q144 150 150 206 Z', ORA), path('M80 146 Q100 196 120 146 Z', W),
            path('M60 84 L52 40 L90 62 Z', ORA), path('M140 84 L148 40 L110 62 Z', ORA), path('M62 76 L58 52 L80 66 Z', INK),
            path('M138 76 L142 52 L120 66 Z', INK),
            path('M56 82 Q60 52 100 52 Q140 52 144 82 Q152 112 100 138 Q48 112 56 82 Z', ORA),
            path('M58 96 Q78 106 100 138 Q60 122 58 96 Z', W), path('M142 96 Q122 106 100 138 Q140 122 142 96 Z', W),
            path('M76 90 Q85 84 94 92', 'none'), path('M106 92 Q115 84 124 90'), dot(86, 94, 3.6), dot(114, 94, 3.6),
            ell(100, 124, 7, 5, INK), path('M90 112 Q100 118 112 108'),
            path('M150 206 Q190 180 182 130 Q178 150 160 160 Z', ORA), path('M182 130 Q186 146 174 156 Q178 140 182 130 Z', W)]


@reg('beehive', 'Rooftop Beehive')
def _():
    def bee(x, y, rot=0):
        return g([ell(-6, -10, 8, 6, W), ell(6, -10, 8, 6, W), ell(0, 0, 12, 9, Y), path('M-3 -8 L-3 8 M4 -8 L4 8'),
                  dot(-7, -1, 1.8)], f'translate({x} {y}) rotate({rot})')
    return [rect(0, 186, 200, 20, '#d97a5a'), path('M0 186 L200 186'),
            rect(46, 152, 108, 38, W, 4), rect(40, 116, 120, 40, W, 4), rect(46, 80, 108, 40, W, 4), rect(36, 70, 128, 14, '#ffe08a', 4),
            rect(80, 176, 40, 8, INK, 3), *face(100, 100, .6, 'happy', 'smile'),
            path('M40 136 L160 136', 'none'),
            bee(26, 108, -20), bee(174, 98, 20), bee(170, 154, 10), path('M30 120 Q20 140 40 150', 'none', ' stroke-dasharray="3 8"')]


@reg('guerrillagardener', 'Guerrilla Gardener')
def _():
    return [path('M34 206 Q38 152 72 140 L128 140 Q162 152 166 206 Z', '#3d8a52'), path('M84 140 Q100 154 116 140'),
            path(NECK, '#3d8a52'), circ(100, 88, 40, '#3d8a52'), rect(68, 76, 64, 26, SKINS[2], 12),
            *face(100, 89, 1, 'open', 'none', blush=False, brows='flat'),
            path('M70 64 Q100 54 130 64 M90 46 L92 52 M110 46 L108 52'),
            circ(162, 120, 16, DBROWN), dot(156, 116, 2.5, Y), dot(168, 124, 2.5, Y), dot(164, 112, 2.5, LIME), hand(150, 136, SKINS[2]),
            path('M176 100 L186 90 M182 112 L196 108 M170 92 L172 80'),
            path('M24 206 L24 170'), circ(24, 164, 7, Y), *[circ(24 + dx, 164 + dy, 6, PINK) for dx, dy in [(0, -9), (9, 0), (0, 9), (-9, 0)]],
            leaf(32, 186, 10, 5, -30)]


@reg('ancientoak', 'Ancient Oak')
def _():
    return [path('M64 206 Q74 160 72 130 L128 130 Q126 160 136 206 Z', BARK), path('M64 206 Q50 196 40 206 M136 206 Q150 196 160 206'),
            circ(56, 92, 40, G), circ(144, 92, 40, G), circ(100, 74, 46, '#3fc070'), circ(74, 120, 30, G), circ(126, 120, 30, G),
            circ(100, 108, 26, G),
            *face(100, 160, .6, 'calm', 'none', blush=False),
            path('M86 176 Q93 170 100 175 Q107 170 114 176 Q107 186 100 182 Q93 186 86 176 Z', '#d8d2e2'),
            path('M80 150 Q85 146 90 150 M110 150 Q115 146 120 150'),
            circ(60, 80, 5, RED), circ(150, 104, 5, RED), circ(118, 60, 5, RED)]


@reg('humanchain', 'Human Chain')
def _():
    def mini(cx, skin, hair, hc, oc, eyes, m):
        return gs(person(skin, hair, hc, 'tee', oc, eyes=eyes, mouth=m), f'translate({cx - 100 * .58} 84) scale(.58)')
    o = [mini(40, 4, 'afro', 'black', Y, 'happy', 'grin'), mini(160, 0, 'long', 'ginger', PINK, 'open', 'smile'),
         mini(100, 2, 'short', 'brown', TEAL, 'calm', 'smile')]
    o += [path('M56 178 Q70 168 84 178', 'none', ' stroke-width="0"'),
          path('M60 176 Q72 166 84 174', 'none'), circ(72, 170, 7, SKINS[4]), circ(128, 170, 7, SKINS[0])]
    o += [path('M18 74 L10 56 L26 62 Z', G), path('M176 66 L190 52 L192 70 Z', G)]
    return o


@reg('worldtree', 'World Tree')
def _():
    return [path('M70 206 Q80 170 84 130 L116 130 Q120 170 130 206 Z', BARK), path('M70 206 Q40 190 20 206 M130 206 Q160 190 180 206 M90 206 L84 196'),
            circ(100, 96, 76, '#3fc070'), circ(46, 120, 30, G), circ(154, 120, 30, G), circ(100, 70, 50, G),
            circ(64, 82, 13, SKY), path('M56 78 Q62 74 66 80 Q70 86 62 90', LIME),
            circ(140, 74, 11, SKY), path('M134 72 Q140 68 144 74', LIME),
            circ(104, 128, 12, SKY), path('M98 126 Q104 120 110 128', LIME),
            *face(100, 164, .5, 'calm', 'smile', blush=True),
            path('M30 70 Q38 62 46 70 Q54 62 62 70', 'none'), sparkle(170, 50, 8, Y), sparkle(30, 150, 6, Y)]


@reg('blockade', 'Old-Growth Blockade')
def _():
    o = [rect(18, 40, 50, 170, BARK, 8), path('M30 80 Q36 100 30 120'), circ(30, 46, 30, G), circ(66, 50, 22, G),
         path('M68 136 L198 120 L198 132 L68 148 Z', BARK)]
    o += [gs(person(4, 'curly', 'black', 'hoodie', G, '#3d8a52', eyes='angry', mouth='flat'), 'translate(66 42) scale(.62)')]
    o += [path('M44 206 L44 176 L190 172 L190 206', 'none'), rect(40, 168, 154, 34, W, 4),
          path('M52 180 L120 180 M52 192 L100 192'), leaf(160, 186, 14, 8, -30), leaf(176, 182, 10, 6, 30),
          path('M74 142 L76 168 M182 128 L180 168')]
    return o


TRIBE = 'Feral'
