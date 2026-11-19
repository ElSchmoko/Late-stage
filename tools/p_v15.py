"""v15 art (Nov 19): the Follower playstyle moves to the Philosophers (schools of thought and their followers),
the Attention Seeker playstyle moves to the Influencers; plus the Follower token and New Neighbours."""
from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


TOGA, STONE, HEM = '#f4efe4', '#e6dccb', '#9bd65a'


def scroll(x, y, w=40, h=26, rot=0):
    p = [rect(x, y, w, h, CREAM, 3), circ(x, y + h / 2, h / 2 + 2, '#f0e2b8'), circ(x + w, y + h / 2, h / 2 + 2, '#f0e2b8'),
         path(f'M{x + 8} {y + 9} L{x + w - 8} {y + 9} M{x + 8} {y + 17} L{x + w - 14} {y + 17}')]
    return g(p, f'rotate({rot} {x + w / 2} {y + h / 2})')


def column(x, y, h, w=14):
    return [rect(x - 3, y, w + 6, 6, STONE, 2), rect(x, y + 6, w, h - 12, W), path(f'M{x + w / 2} {y + 10} L{x + w / 2} {y + h - 10}'),
            rect(x - 3, y + h - 6, w + 6, 6, STONE, 2)]


def tiny(cx, cy, s, skin, hair, hc, oc, eyes='dots', mouth='small', hat=None, hatc=RED, outfit_='toga', oc2=W, extra=()):
    return g(person(skin, hair, hc, outfit_, oc, oc2, eyes=eyes, mouth=mouth, hat=hat, hatc=hatc, extra=extra), f'translate({cx - 100 * s} {cy - 100 * s}) scale({s})')


# ---------------------------------------------------------------- Philosophers: Followers
@reg('sophist', 'Sophist')
def _():
    return person(2, 'slick', 'black', 'toga', TOGA, TEAL, eyes='wink', mouth='smirk', brows='one', extra=['earring'],
                  prop=[*speech(8, 40, 54, 34, 0), path('M22 52 L30 60 L22 68 M48 52 L40 60 L48 68'),
                        path('M150 112 Q140 130 150 150 Q170 160 184 146 Q192 126 178 112 Z', '#c98a4a'), path('M152 112 Q164 104 176 112'),
                        rect(158, 98, 12, 10, '#a86b45', 3), coin(168, 132, 8), hand(150, 156, SKINS[2]), coin(30, 128, 9), coin(42, 142, 7)])


@reg('epicurean', 'Epicurean')
def _():
    grapes = [circ(160 + dx, 96 + dy, 7, PUR) for dx, dy in [(-8, 0), (6, 0), (-1, 10), (-14, 10), (12, 10), (-7, 20), (6, 20), (0, 30)]]
    return person(1, 'curly', 'brown', 'toga', TOGA, LIME, eyes='happy', mouth='grin', hat='laurel',
                  prop=[path('M160 92 Q164 80 172 78', 'none', ' stroke-width="4"'), ell(176, 78, 8, 4, G, ' transform="rotate(-20 176 78)"'), *grapes,
                        path('M24 120 L56 120 Q54 140 40 142 Q26 140 24 120 Z', Y), path('M40 142 L40 160 M30 162 L50 162'), ell(40, 122, 14, 3, '#b0345a'),
                        hand(40, 150, SKINS[1]), sparkle(30, 70, 7, W)])


@reg('peripatetic', 'Peripatetic')
def _():
    o = [tiny(162, 150, .42, 0, 'short', 'brown', TOGA), tiny(184, 160, .38, 4, 'bun', 'black', TOGA)]
    o += person(3, 'sides', 'grey', 'toga', TOGA, SKY, eyes='open', mouth='open', extra=['beard'], look=-3,
                prop=[path('M54 132 L22 96', 'none', ' stroke-width="6"'), hand(22, 94, SKINS[3]), path('M8 72 L18 82 M4 92 L14 92 M14 60 L20 74'),
                      motion(158, 70, 3, 0)])
    return o


@reg('pythagorean', 'Pythagorean')
def _():
    tri = [g([rect(138, 26, 56, 56, '#e8d7b0', 6), path('M150 70 L182 70 L150 38 Z', W), rect(150, 70, 32, 8, Y), rect(142, 38, 8, 32, PINK),
           path('M150 70 L156 70 L156 64 L150 64'), path('M154 38 L186 66', 'none', f' stroke="{SKY}" stroke-width="4"')], 'translate(2 40) rotate(8 166 54)')]
    return person(0, 'buzz', 'ginger', 'robe', W, TEAL, eyes='glasses', mouth='smile', extra=['longbeard'],
                  back=tri,
                  prop=[ell(36, 160, 15, 10, '#c9a36a'), path('M28 160 Q36 154 44 160'), circ(36, 160, 22, 'none', f' stroke="{RED}" stroke-width="6"'),
                        path('M20 176 L52 144', 'none', f' stroke="{RED}" stroke-width="6"')])


@reg('hemlock', 'Hemlock Martyr')
def _():
    return person(4, 'sides', 'white', 'toga', TOGA, '#cfe6f7', eyes='calm', mouth='smile', extra=['beard'],
                  back=[circ(100, 82, 62, '#fff2b0', ' stroke-width="0"'), circ(100, 82, 62, 'none', ' stroke-dasharray="2 11"')],
                  prop=[path('M142 112 L182 112 Q180 140 162 142 Q144 140 142 112 Z', '#d8c4a8'), ell(162, 114, 20, 5, HEM),
                        path('M162 142 L162 160 M150 164 L174 164'), hand(150, 150, SKINS[4]),
                        path('M168 100 Q172 90 166 84 Q160 76 166 68', 'none', f' stroke="{HEM}" stroke-width="4"'),
                        leaf(30, 128, 12, 6, -30, HEM), leaf(42, 112, 10, 5, 20, HEM), path('M36 150 L36 118')])


@reg('academy', 'The Academy')
def _():
    o = [path('M14 70 L100 22 L186 70 Z', W), path('M30 66 L100 30 L170 66'), rect(10, 70, 180, 12, STONE, 2)]
    for x in (24, 62, 124, 162):
        o += column(x, 82, 96)
    o += [path('M86 178 L86 118 Q100 102 114 118 L114 178 Z', '#3a3260'), rect(4, 178, 192, 10, STONE, 2), rect(-2, 188, 204, 12, W, 2),
          circ(100, 50, 10, 'none'), path('M92 56 L108 56 L100 42 Z', Y), path('M100 40 L100 60'),
          tiny(100, 168, .34, 1, 'short', 'brown', TOGA, eyes='stars')]
    return o


@reg('existentialist', 'Existentialist')
def _():
    return person(1, 'bob', 'black', 'turtle', '#3a3045', eyes='glasses', mouth='flat', brows='flat', hat='beret', hatc='#b0345a',
                  front=[path('M80 140 Q100 150 120 140 L124 156 Q100 164 76 156 Z', RED)],
                  prop=[ell(160, 180, 34, 8, W), rect(156, 186, 8, 20, DGREY), *mug(146, 146, W, None), steam(158, 128),
                        book(18, 120, 42, 52, Y, -10), path('M30 138 L48 134 M30 148 L46 145'), hand(44, 170, SKINS[1])])


@reg('philosopherking', 'Philosopher King')
def _():
    return person(2, 'long', 'grey', 'toga', TOGA, PUR, eyes='calm', mouth='smirk', brows='up', hat='crown', hatc=Y, extra=['longbeard'],
                  prop=[rect(160, 70, 8, 136, Y, 3), circ(164, 60, 14, W), *bulb_(164, 60),
                        hand(164, 146, SKINS[2]), scroll(14, 136, 36, 22, -14), sparkle(30, 60, 8, Y), sparkle(184, 108, 6, W)])


def bulb_(cx, cy):
    return [circ(cx, cy - 2, 8, Y), rect(cx - 4, cy + 6, 8, 5, GREY, 1)]


@reg('mysterycult', 'Mystery Cult')
def _():
    hood = '#5a4a8a'
    o = [path('M28 206 Q30 140 60 128 L140 128 Q170 140 172 206 Z', hood), path('M100 132 L100 206', 'none'),
         path('M54 126 Q46 40 100 34 Q154 40 146 126 Q120 132 100 132 Q80 132 54 126 Z', hood),
         path('M70 118 Q66 62 100 58 Q134 62 130 118 Q100 126 70 118 Z', '#2b2140'),
         circ(88, 92, 4, Y, ' stroke="none"'), circ(112, 92, 4, Y, ' stroke="none"')]
    o += [path('M82 160 Q100 150 118 160 L118 178 Q100 186 82 178 Z', Y), circ(100, 168, 6, W), dot(100, 168, 3)]
    for x in (22, 178):
        o += [rect(x - 7, 150, 14, 46, CREAM, 3), path(f'M{x} 150 L{x} 144'), path(f'M{x} 128 Q{x + 9} 138 {x} 146 Q{x - 9} 138 {x} 128 Z', ORA)]
    o += [sparkle(40, 50, 7, Y), sparkle(164, 40, 6, W)]
    return o


@reg('utopiancommune', 'Utopian Commune')
def _():
    wheel = [circ(160, 82, 30, W), path('M160 52 L160 112 M130 82 L190 82 M139 61 L181 103 M181 61 L139 103'),
             circ(160, 82, 6, Y), path('M160 46 L156 38 L164 38 Z', RED)]
    return person(3, 'dreads', 'brown', 'overalls', '#ffe08a', '#9bd65a', eyes='happy', mouth='smile', hat='flower',
                  back=wheel,
                  prop=[path('M30 206 L42 120', 'none', ' stroke-width="6"'), path('M32 120 L52 122 L50 100 L36 98 Z', GREY), hand(40, 158, SKINS[3]),
                        leaf(176, 182, 12, 6, -30, G), leaf(186, 168, 10, 5, 30, G), path('M180 198 L182 166')])


# ---------------------------------------------------------------- Influencers: Attention Seekers
@reg('troll', 'Troll')
def _():
    sk = '#9bd65a'
    return person(sk, 'messy', 'purple', 'hoodie', DGREY, GREY, eyes='open', mouth='teeth', brows='angry', blush=False,
                  prop=[phone(140, 118, 32, 52, INK, W, -8, [path('M148 136 L164 134 M148 146 L160 144')]), hand(150, 170, sk),
                        bubble(6, 40, 56, 34, RED), path('M18 52 L26 60 M26 52 L18 60 M34 52 L50 52 M34 62 L46 62'),
                        bubble(130, 40, 52, 30, Y, 'right'), path('M144 50 L170 50 M144 60 L162 60')])


@reg('ragebaiter', 'Rage Baiter')
def _():
    angry = [circ(32, 160, 18, RED), path('M22 154 L30 158 M42 154 L34 158'), path('M24 170 Q32 162 40 170')]
    return person(4, 'swoop', 'blonde', 'tee', PINK, eyes='shades', mouth='grin', extra=['earring'],
                  prop=[path('M150 168 L184 30', 'none', ' stroke-width="5"'), hand(154, 168, SKINS[4]), circ(162, 150, 8, GREY),
                        path('M184 30 Q120 40 46 132', 'none', ' stroke-width="2" stroke-dasharray="4 6"'), path('M46 132 L46 140 Q46 148 38 146'),
                        *angry, path('M14 140 L8 132 M50 140 L56 132 M32 136 L32 128')])


@reg('prankvlogger', 'Prank Vlogger')
def _():
    return person(0, 'short', 'ginger', 'tee', Y, eyes='happy', mouth='open', hat='capback', hatc=RED, extra=['freckles'],
                  prop=[path('M148 170 L176 62', 'none', ' stroke-width="5"'), rect(160, 34, 32, 30, INK, 6), circ(176, 49, 8, SKY), dot(186, 40, 2.5, RED),
                        hand(150, 168, SKINS[0]),
                        path('M14 120 L54 120 L50 158 L18 158 Z', '#8fd4ff'), path('M14 120 Q34 112 54 120'), path('M12 118 Q34 92 56 118', 'none'),
                        path('M30 110 Q24 98 30 92 M42 108 Q48 96 42 90', 'none', f' stroke="{SKY}" stroke-width="3"')])


@reg('realitystar', 'Reality Star')
def _():
    return person(2, 'long', 'blonde', 'suit', PINK, W, eyes='shades', mouth='smirk', extra=['earring'],
                  prop=[rect(12, 40, 54, 30, INK, 8), dot(26, 55, 6, RED), path('M38 50 L56 50 M38 60 L50 60', 'none', ' stroke="#ffffff" stroke-width="3"'),
                        sparkle(170, 60, 10, Y), sparkle(184, 100, 6, W), sparkle(30, 110, 6, W), star(156, 160, 14, Y), hand(148, 172, SKINS[2])])


@reg('apologyvideo', 'Apology Video')
def _():
    return person(1, 'short', 'brown', 'hoodie', GREY, W, eyes='tired', mouth='frown', brows='sad', extra=['bags'],
                  back=[rect(4, 26, 192, 120, '#3a3045', 10), rect(4, 26, 192, 120, 'none', 10)],
                  prop=[path('M14 156 L186 156', 'none', ' stroke-width="4"'), circ(60, 156, 7, RED),
                        path('M150 36 L150 60 L170 48 Z', W), rect(20, 36, 22, 14, RED, 3), path('M24 43 L38 43', 'none', ' stroke="#ffffff"'),
                        rect(148, 166, 40, 30, W, 4), path('M156 166 Q168 150 178 166', W), path('M44 176 L56 168')])


@reg('shockjock', 'Shock Jock')
def _():
    return person(3, 'combover', 'black', 'shirt', ORA, W, eyes='open', mouth='shout', brows='angry', hat='headphones', hatc=DGREY, extra=['stubble'],
                  prop=[rect(12, 34, 62, 28, RED, 8), circ(28, 48, 6, W), path('M42 42 L64 42 M42 54 L58 54', 'none', ' stroke="#ffffff" stroke-width="4"'),
                        path('M8 28 L2 22 M78 28 L84 22'),
                        path('M120 206 L120 170 L150 142', 'none', ' stroke-width="6"'), mic(158, 122, DGREY, 30),
                        path('M172 96 L188 88 M176 108 L194 108 M172 120 L188 128')])


@reg('crisispr', 'Crisis PR Firm')
def _():
    return person(0, 'bob', 'dark', 'suit', '#3a3045', TEAL, eyes='open', mouth='smile', brows='flat', hat='headset', hatc=DGREY, extra=['sweat'],
                  prop=[rect(144, 120, 28, 52, RED, 8), rect(150, 110, 16, 12, DGREY, 3), path('M158 110 Q170 96 184 98', 'none', ' stroke-width="5"'),
                        path('M184 98 L190 92 L194 104 Z', DGREY), hand(152, 168, SKINS[0]),
                        path('M20 168 Q14 148 26 134 Q28 146 36 144 Q34 126 46 116 Q48 138 56 146 Q62 160 52 172 Z', ORA),
                        path('M30 168 Q28 156 36 148 Q38 158 44 160 Q46 168 42 172 Z', Y),
                        *[circ(x, y, r, W) for x, y, r in [(70, 132, 7), (60, 120, 9), (48, 108, 6)]]])


@reg('dramachannel', 'Drama Channel')
def _():
    return person(5, 'afro', 'black', 'tee', LIL, eyes='stars', mouth='o', brows='up', extra=['earring'],
                  prop=[path('M140 128 L180 128 L174 196 L146 196 Z', W), path('M148 128 L152 196 M160 128 L160 196 M172 128 L168 196', 'none', f' stroke="{RED}" stroke-width="5"'),
                        *[circ(x, y, 8, '#fff6c2') for x, y in [(146, 124), (158, 118), (170, 122), (180, 126), (152, 112), (166, 110)]],
                        hand(146, 176, SKINS[5]),
                        path('M18 120 L50 120 L46 146 L22 146 Z', W), path('M50 126 Q60 126 58 134 Q56 140 48 140'), ell(34, 121, 16, 3, '#c98a4a'),
                        path('M18 120 Q8 132 16 146 Q22 156 14 166', 'none', ' stroke="#c98a4a" stroke-width="4"'), ell(20, 172, 14, 4, '#c98a4a')])


@reg('commentsoff', 'Comments Off')
def _():
    return [phone(46, 22, 108, 180, INK, W),
            bubble(64, 46, 72, 40, PINK), path('M76 60 L118 60 M76 72 L106 72'),
            bubble(64, 98, 72, 40, SKY, 'right'), path('M78 112 L120 112 M78 124 L110 124'),
            path('M56 40 L144 150', 'none', f' stroke="{RED}" stroke-width="9"'),
            rect(78, 150, 44, 34, Y, 6), path('M86 150 L86 140 Q86 126 100 126 Q114 126 114 140 L114 150', 'none', ' stroke-width="6"'), dot(100, 166, 4),
            sparkle(26, 60, 8, Y), sparkle(176, 120, 7, W)]


# ---------------------------------------------------------------- token and Neighbour
@reg('follower', 'Follower')
def _():
    return person(1, 'short', 'brown', 'toga', TOGA, TEAL, eyes='stars', mouth='small', blush=True,
                  prop=[rect(138, 124, 40, 50, CREAM, 4), path('M146 136 L170 136 M146 146 L166 146 M146 156 L170 156'),
                        path('M182 110 L160 150', 'none', ' stroke-width="4"'), hand(144, 172, SKINS[1]), heart(30, 70, .7, PINK)])


@reg('newneighbours', 'New Neighbours')
def _():
    a = person(4, 'bun', 'black', 'tee', SKY, eyes='happy', mouth='grin', extra=['earring'])
    b = person(0, 'messy', 'ginger', 'shirt', Y, W, eyes='open', mouth='smile', extra=['freckles'])
    o = [g(a, 'translate(-26 4) scale(.82)'), g(b, 'translate(70 22) scale(.74)')]
    o += [*box(20, 150, 72, 50), path('M30 180 L58 180', 'none'), *box(108, 160, 80, 40, '#d9a868'), *box(128, 126, 48, 36),
          path('M156 126 L150 104 Q150 96 158 98 L164 112', SKINS[0]), sparkle(30, 40, 7, Y), sparkle(178, 50, 6, W)]
    return o
