from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


@reg('busker', 'Busker')
def _():
    return person(2, 'short', 'brown', 'tee', ORA, eyes='calm', mouth='open', hat='beanie', hatc=TEAL, extra=['stubble'],
                  prop=[guitar(150, 168, -36, Y), hand(132, 150, SKINS[2]), hand(170, 176, SKINS[2]),
                        path('M22 56 L22 76 Q16 76 16 82 Q16 88 22 88 Q28 88 28 82 L28 64 L38 60', 'none'),
                        path('M30 96 L30 112 Q24 112 24 118 Q24 124 30 124 Q36 124 36 118 L36 100 L44 98')])


@reg('openmic', 'Open Mic Poet')
def _():
    return person(4, 'short', 'black', 'turtle', INK, eyes='calm', mouth='small', hat='beret', hatc=RED, extra=['mustache'],
                  prop=[path('M160 206 L160 120', 'none', ' stroke-width="6"'), mic(160, 106, DGREY, 10),
                        book(20, 140, 36, 46, Y, -12), hand(52, 166, SKINS[4]),
                        path('M150 70 Q160 62 168 70 M174 60 Q180 54 186 60')])


@reg('artstudent', 'Art Student')
def _():
    return person(1, 'bob', 'teal', 'apron', W, SKY, eyes='open', mouth='smile', look=2,
                  extra=['freckles'],
                  front=[ell(80, 108, 6, 4, PINK, ' stroke="none"')],
                  prop=[path('M136 150 Q132 120 160 116 Q194 114 192 140 Q190 160 170 160 Q162 160 164 168 Q164 180 150 176 Q138 170 136 150 Z', '#f2c78e'),
                        circ(152, 128, 6, RED), circ(170, 124, 6, Y), circ(182, 138, 6, SKY), circ(150, 148, 6, G), circ(176, 152, 5, W),
                        g([rect(-3, -40, 6, 46, BROWN, 2), path('M-4 -40 L0 -54 L4 -40 Z', PINK)], 'translate(44 150) rotate(-24)'),
                        hand(46, 156, SKINS[1])])


@reg('strugglingartist', 'Struggling Artist')
def _():
    return person(0, 'messy', 'dark', 'hoodie', DGREY, GREY, eyes='tired', mouth='wavy', extra=['bags', 'stubble'],
                  prop=[path('M140 148 L182 148 L176 196 L146 196 Z', W), rect(136, 140, 50, 10, RED, 3),
                        path('M150 140 Q154 110 160 98 M164 140 Q166 110 174 100'), path('M148 168 L174 168', 'none'),
                        steam(152, 92), dot(42, 168, 3, RED), dot(52, 182, 3, SKY), dot(32, 186, 3, Y)])


@reg('merchstand', 'Merch Stand')
def _():
    def tee(x, y, col):
        return path(f'M{x} {y} L{x + 12} {y - 6} Q{x + 20} {y} {x + 28} {y - 6} L{x + 40} {y} L{x + 36} {y + 12} L{x + 32} {y + 10} L{x + 32} {y + 40} L{x + 8} {y + 40} L{x + 8} {y + 10} L{x + 4} {y + 12} Z', col)
    return [rect(16, 60, 168, 12, RED, 4), path('M24 72 L24 150 M176 72 L176 150'),
            path('M16 60 L36 44 L164 44 L184 60', '#ffe08a'),
            tee(30, 82, PINK), star(50, 104, 7, W), tee(80, 82, Y), heart(100, 104, .6, RED), tee(130, 82, SKY), lightning(152, 92, .5, W),
            rect(10, 148, 180, 58, '#e8b878', 6), path('M10 168 L190 168'),
            rect(36, 132, 30, 18, LIL, 3), rect(132, 128, 26, 22, W, 3), heart(145, 139, .5, PINK),
            path('M150 160 L176 160 L180 176 L154 176 Z', Y), dot(160, 166, 2.4)]


@reg('methodactor', 'Method Actor')
def _():
    return person(2, 'slick', 'brown', 'turtle', PUR, eyes='angry', mouth='flat', extra=['stubble', 'sweat'],
                  front=[path('M100 50 Q140 50 140 92 Q140 130 100 132 Z', W), path('M108 86 Q118 78 128 86 Q118 96 108 86 Z', INK),
                         path('M110 110 Q120 122 132 108')],
                  prop=[hand(140, 132, SKINS[2]), path('M24 60 L36 70 M18 86 L32 88')])


@reg('mural', 'Memorial Mural')
def _():
    o = [rect(0, 40, 200, 170, '#e8907a')]
    for r, y in enumerate(range(54, 200, 22)):
        off = 0 if r % 2 else 24
        o += [path(f'M0 {y} L200 {y}')]
        for x in range(off, 200, 48):
            o += [path(f'M{x} {y} L{x} {y + 22}')]
    o += [circ(100, 104, 52, '#ffe9a8'), circ(100, 108, 32, SKINS[3]), *hat_('halo', Y, 82),
          path('M68 100 Q68 70 100 70 Q132 70 132 100 Q120 84 100 86 Q80 84 68 100 Z', PUR),
          *face(100, 110, .8, 'calm', 'smile')]
    for x, c in [(30, Y), (60, RED), (140, PINK), (172, Y)]:
        o += [rect(x - 7, 176, 14, 26, W, 3), path(f'M{x} 176 Q{x - 6} 166 {x} 158 Q{x + 6} 166 {x} 176 Z', ORA)]
    o += [circ(100, 190, 10, RED), circ(88, 194, 8, PINK), circ(112, 194, 8, PINK)]
    return o


@reg('indieband', 'Indie Band')
def _():
    return person(0, 'fringe', 'dark', 'cardigan', '#e8b878', W, eyes='calm', mouth='small', hat='beanie', hatc=ORA, extra=['mustache'],
                  prop=[circ(158, 160, 26, '#f2c78e'), circ(158, 160, 17, 'none'),
                        *[circ(158 + dx, 160 + dy, 4.5, Y) for dx, dy in [(0, -22), (22, 0), (0, 22), (-22, 0)]],
                        hand(140, 172, SKINS[0]), path('M180 120 L190 110 M186 134 L198 132')])


@reg('conceptualartist', 'Conceptual Artist')
def _():
    return person(0, 'buzz', 'grey', 'turtle', INK, eyes='glasses', mouth='smirk', brows='flat', head_dy=4,
                  back=[rect(144, 88, 54, 62, W, 4), path('M150 108 Q158 148 194 120 L188 110 Q166 128 160 102 Z', Y),
                        rect(164, 96, 12, 28, '#c9c2d6', 2, ' transform="rotate(-35 170 110)"')],
                  prop=[path('M120 168 L140 148', 'none', ' stroke-width="7"'), hand(142, 146, SKINS[0], 9)])


@reg('artcritic', 'Art Critic')
def _():
    return person(1, 'combover', 'grey', 'suit', '#7a6a9a', RED, eyes='open', mouth='frown', brows='one', look=-2,
                  front=[circ(115, 92, 15, 'none'), path('M128 100 Q134 120 126 140')],
                  prop=[rect(140, 132, 46, 60, '#e8b878', 4), rect(148, 126, 30, 10, DGREY, 3), rect(146, 140, 34, 46, W, 2),
                        path('M154 152 L172 152 M154 162 L168 162'), path('M154 174 L160 180 M160 174 L154 180 M164 174 L170 180 M170 174 L164 180'),
                        hand(142, 176, SKINS[1])])


@reg('recordlabel', 'Record Label')
def _():
    return person(3, 'slick', 'black', 'suit', INK, Y, eyes='shades', mouth='smirk', extra=['stubble'],
                  front=[path('M84 142 Q100 160 116 142', 'none', ' stroke="#ffc928" stroke-width="5"')],
                  prop=[*vinyl(162, 140, 30, Y), circ(162, 140, 30, 'none', ' stroke="#ffc928" stroke-width="4"'), hand(142, 162, SKINS[3]),
                        sparkle(186, 102, 8, Y), sparkle(140, 104, 6, W)])


@reg('headliner', 'Festival Headliner')
def _():
    return person(5, 'afro', 'pink', 'leather', LIL, eyes='shades', mouth='shout', extra=['earring'],
                  prop=[mic(152, 120, Y, -20), hand(150, 150, SKINS[5]),
                        *[rect(x, y, 6, 12, c, 2, f' transform="rotate({r} {x} {y})"') for x, y, c, r in
                          [(24, 60, Y, 20), (40, 100, SKY, -30), (170, 64, PINK, 40), (184, 100, G, 10), (20, 140, RED, 60)]],
                        star(30, 180, 9, Y)])


@reg('retrospective', 'Museum Retrospective')
def _():
    return [rect(0, 30, 200, 180, '#f4ecdc'),
            rect(46, 46, 108, 112, '#e0b040', 6), rect(58, 58, 84, 88, SKY, 2),
            circ(100, 98, 22, SKINS[2]), path('M78 96 Q78 72 100 72 Q122 72 122 96 Q112 84 100 86 Q88 84 78 96 Z', BROWN),
            path('M70 146 Q76 122 100 120 Q124 122 130 146 Z', RED), *face(100, 100, .5, 'calm', 'smile'),
            rect(78, 162, 44, 10, W, 2),
            rect(14, 150, 8, 56, Y, 3), circ(18, 146, 8, Y), rect(178, 150, 8, 56, Y, 3), circ(182, 146, 8, Y),
            path('M22 160 Q60 184 100 172 Q140 184 178 160', 'none', ' stroke-width="0"'),
            path('M22 160 Q60 186 100 174 Q140 186 178 160', 'none', ' stroke="#ff6b5e" stroke-width="7"'),
            path('M22 160 Q60 186 100 174 Q140 186 178 160')]


@reg('deadrockstar', 'Dead Rock Star')
def _():
    ghost = '#e6f2ff'
    return [path('M44 206 Q40 150 72 136 L128 136 Q160 150 156 206 L140 196 L124 206 L108 196 L92 206 L76 196 L60 206 Z', ghost),
            path('M76 136 L90 164 L100 146 L110 164 L124 136'),
            circ(62, 92, 9, ghost), circ(138, 92, 9, ghost), circ(100, 86, 38, ghost),
            path('M90 54 L84 14 L95 32 L100 8 L106 32 L117 14 L111 54 Z', PUR),
            *face(100, 92, 1, 'x', 'grin'), *hat_('halo', Y, 100),
            guitar(160, 168, -40, RED), path('M24 80 Q30 70 36 80 M26 130 Q32 120 38 130')]


@reg('worldtour', 'World Tour')
def _():
    return [rect(10, 84, 180, 90, LIL, 14), rect(10, 150, 180, 24, PUR, 0), rect(10, 84, 180, 20, W, 10),
            rect(22, 110, 30, 28, SKY, 4), rect(60, 110, 30, 28, SKY, 4), rect(98, 110, 30, 28, SKY, 4), rect(144, 108, 36, 52, SKY, 4),
            path('M162 108 L162 160'), star(42, 94, 6, Y), star(100, 94, 6, Y), star(158, 94, 6, Y),
            circ(50, 176, 16, INK), circ(50, 176, 6, GREY), circ(150, 176, 16, INK), circ(150, 176, 6, GREY),
            circ(104, 62, 17, SKY), path('M96 50 Q104 58 98 66 Q92 70 94 76', 'none'), path('M110 48 Q116 58 112 64 Q120 68 118 74', 'none'), motion(4, 182, 2, 14), sparkle(172, 54, 8, Y)]


TRIBE = 'Creative'
