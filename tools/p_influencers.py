from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


@reg('replyguy', 'Reply Guy')
def _():
    return person(0, 'messy', 'brown', 'hoodie', GREY, DGREY, eyes='sqglasses', mouth='smirk', brows='one',
                  prop=[phone(146, 120, 30, 50, INK, W, -8, [path('M154 136 L170 136 M154 144 L166 144 M154 152 L170 152')]),
                        hand(150, 168, SKINS[0]), *speech(144, 48, 52, 30, 2), path('M166 160 L166 160')])


@reg('engagementbot', 'Engagement Bot')
def _():
    return [path('M40 206 Q42 150 66 144 L134 144 Q158 150 160 206 Z', GREY), rect(78, 160, 44, 30, SKY, 8), heart(100, 175, .9, RED),
            rect(88, 122, 24, 24, DGREY, 4),
            path('M100 60 L100 46'), heart(100, 50, .8, PINK),
            rect(54, 56, 92, 74, GREY, 24), rect(64, 68, 72, 48, INK, 14),
            circ(84, 88, 9, TEAL), circ(116, 88, 9, TEAL), path('M90 104 Q100 110 110 104', extra=' stroke="#4fd1c5"'),
            rect(42, 78, 12, 26, DGREY, 5), rect(146, 78, 12, 26, DGREY, 5),
            # thumbs up
            path('M156 150 L156 128 Q156 118 164 118 L166 134 L180 134 Q188 134 186 142 L182 162 Q180 168 172 168 L156 168 Z', GREY),
            sparkle(30, 40, 8), sparkle(176, 92, 6)]


@reg('stanaccount', 'Stan Account')
def _():
    return person(2, 'pigtails', 'pink', 'tee', PINK, eyes='hearts', mouth='open',
                  prop=[g([rect(158, 100, 8, 60, DGREY, 3), circ(162, 92, 16, Y), star(162, 92, 9, W)], 'rotate(12 162 160)'),
                        hand(160, 164, SKINS[2]), heart(30, 60, 1, RED), heart(176, 56, .8, PINK), heart(36, 126, .7, PINK)])


@reg('giveawayhost', 'Giveaway Host')
def _():
    return person(4, 'swoop', 'dark', 'suit', LIL, Y, eyes='happy', mouth='grin', extra=['earring'],
                  prop=[rect(138, 140, 50, 44, RED, 5), rect(134, 130, 58, 14, RED, 4), rect(158, 130, 10, 54, Y),
                        path('M163 130 Q146 108 152 126 Q140 118 160 130 Z M163 130 Q182 108 174 126 Q186 118 166 130 Z', Y),
                        hand(140, 182, SKINS[4]), *[rect(x, y, 6, 10, c, 2, f' transform="rotate({r} {x} {y})"') for x, y, c, r in
                                                   [(30, 56, Y, 20), (164, 60, SKY, -30), (40, 120, PINK, 40), (176, 96, G, 10)]]])


@reg('commentsection', 'Comment Section')
def _():
    o = []
    for (x, y, w, h, fill, eyes, m, tail) in [(8, 46, 104, 44, W, 'angry', 'shout', 'left'),
                                             (90, 94, 104, 44, Y, 'happy', 'grin', 'right'),
                                             (12, 142, 104, 44, SKY, 'open', 'o', 'left')]:
        o += [bubble(x, y, w, h, fill, tail)]
        o += face(x + 26, y + 17, .5, eyes, m, True)
        o += [path(f'M{x + 50} {y + 16} L{x + w - 12} {y + 16} M{x + 50} {y + 28} L{x + w - 22} {y + 28}')]
    o += [heart(170, 60, .9, RED), heart(150, 176, .7, PINK)]
    return o


@reg('hypeman', 'Hype Man')
def _():
    return person(5, 'buzz', 'black', 'jersey', ORA, eyes='angry', mouth='shout', hat='capback', hatc=Y, brows='up',
                  prop=[g([path('M150 110 L176 92 L176 148 L150 130 Z', RED), rect(136, 108, 16, 24, W, 4), rect(176, 90, 10, 60, DGREY, 4),
                           rect(140, 130, 8, 22, INK, 3)], 'rotate(-8 160 120)'),
                        hand(146, 150, SKINS[5]), path('M14 40 L32 50 M8 64 L28 66 M16 88 L32 82'),
                        path('M186 70 L196 58 M190 90 L200 88', 'none')])


@reg('unboxing', 'Unboxing Streamer')
def _():
    return person(1, 'bun', 'ginger', 'tee', TEAL, eyes='wide', mouth='o', hat='headset', hatc=PINK, brows='up', extra=['freckles'],
                  prop=[path('M128 156 L190 156 L186 206 L132 206 Z', '#e8b878'), path('M128 156 L118 138 L156 140 L160 156 Z', '#f2c78e'),
                        path('M190 156 L198 136 L166 138 L160 156 Z', '#f2c78e'),
                        sparkle(160, 118, 10, Y), sparkle(184, 124, 6), sparkle(140, 120, 6), hand(130, 176, SKINS[1])])


@reg('viralvideo', 'Viral Video')
def _():
    return [rect(54, 18, 92, 176, INK, 18), rect(62, 34, 76, 136, '#ffe9a8', 8),
            *face(100, 74, .9, 'stars', 'grin'),
            circ(100, 132, 15, RED), path('M95 124 L109 132 L95 140 Z', W),
            rect(90, 178, 20, 6, DGREY, 3),
            path('M146 120 Q176 116 176 92 Q190 104 184 128 Q178 150 150 152 Z', ORA), path('M154 134 Q170 132 170 116 Q178 128 172 140 Z', Y),
            heart(30, 62, 1, RED), heart(24, 104, .8, PINK), heart(32, 150, .7, PINK), heart(172, 64, .7, RED)]


@reg('personalbrand', 'Personal Brand')
def _():
    return person(3, 'long', 'dark', 'tee', W, eyes='wink', mouth='smirk', extra=['earring'],
                  back=[circ(100, 92, 74, 'none', ' stroke-dasharray="2 14"')],
                  prop=[rect(130, 50, 52, 40, Y, 10), circ(156, 70, 11, INK), circ(156, 70, 5, SKY), rect(168, 56, 8, 5, W, 2),
                        path('M152 90 L152 150', extra=' stroke-width="6"'), hand(152, 152, SKINS[3]),
                        sparkle(30, 60, 9, Y), sparkle(36, 130, 6, W)])


@reg('engagementfarmer', 'Engagement Farmer')
def _():
    return person(1, 'short', 'blonde', 'overalls', '#ffe08a', SKY, eyes='happy', mouth='smile', hat='straw', hatc=RED,
                  prop=[*pot(140, 168, 44, 26, ORA), path('M162 168 L162 120'), heart(146, 128, 1, PINK), heart(178, 118, .9, RED),
                        path('M162 140 Q150 134 146 128 M162 128 Q172 122 178 118'),
                        g([path('M0 0 L30 0 L26 24 L4 24 Z', SKY), path('M30 6 L48 -6', extra=' stroke-width="6"'), path('M2 4 Q-10 4 -10 14 Q-8 22 4 20')],
                          'translate(120 90) rotate(20)'), path('M172 92 L174 100 M178 94 L182 102')])


@reg('paparazzi', 'Paparazzi')
def _():
    return person(0, 'slick', 'dark', 'vest', DGREY, '#8a8270', eyes='open', mouth='grin', extra=['stubble'], look=3,
                  front=[rect(78, 76, 72, 46, INK, 8), rect(92, 68, 22, 10, INK, 3), circ(124, 99, 17, DGREY), circ(124, 99, 9, SKY),
                         rect(138, 80, 8, 6, W, 1), hand(78, 120, SKINS[0])],
                  prop=[path('M166 30 L172 52 L194 48 L176 62 L190 80 L168 70 L160 92 L156 68 L134 70 L150 56 L138 38 L158 46 Z', Y)])


@reg('brandambassador', 'Brand Ambassador')
def _():
    return person(2, 'bob', 'black', 'sash', W, PINK, eyes='happy', mouth='grin', extra=['earring'],
                  prop=[rect(148, 80, 30, 62, G, 10), rect(152, 72, 22, 12, W, 4), rect(152, 100, 22, 22, W, 4), heart(163, 111, .5, RED),
                        hand(150, 140, SKINS[2]), hand(176, 120, SKINS[2], 9), sparkle(186, 70, 8, Y), sparkle(136, 64, 6, W)])


@reg('ringlight', 'Ring Light Studio')
def _():
    return [path('M100 150 L66 206 M100 150 L134 206 M100 150 L100 206', 'none'), rect(94, 126, 12, 30, DGREY, 4),
            circ(100, 102, 56, W), circ(100, 102, 38, Y),
            rect(82, 70, 36, 64, INK, 8), rect(87, 77, 26, 50, SKY, 4), *face(100, 98, .55, 'happy', 'grin'),
            *[sparkle(x, y, r, Y) for x, y, r in [(26, 60, 9), (176, 56, 8), (178, 150, 6), (22, 148, 6)]]]


@reg('bluecheck', 'Blue Checkmark')
def _():
    import math
    pts = []
    for i in range(24):
        a = i * math.pi / 12
        r = 66 if i % 2 == 0 else 57
        pts.append(f'{100 + r * math.cos(a):.1f} {124 + r * math.sin(a):.1f}')
    return [path('M' + ' L'.join(pts) + ' Z', '#3aa0ff'), *face(100, 108, .9, 'shades', 'smirk'),
            path('M76 150 L94 164 L126 134', extra=' stroke="#ffffff" stroke-width="9"'), path('M76 150 L94 164 L126 134', 'none'),
            sparkle(178, 60, 9, Y), sparkle(24, 84, 6, W)]


@reg('maincharacter', 'Main Character')
def _():
    return person(3, 'long', 'ginger', 'suit', RED, Y, eyes='shades', mouth='smirk',
                  back=[path('M100 -10 L-10 206 L210 206 Z', '#fff2b0'), star(28, 62, 12), star(174, 58, 9), star(176, 150, 7, W)],
                  prop=[path('M58 18 L48 6 M100 12 L100 -2 M142 18 L152 6')])


TRIBE = 'Influencer'


@reg('follower', 'Follower')
def _():
    return person(1, 'short', 'brown', 'hoodie', W, GREY, eyes='dots', mouth='small', blush=True,
                  prop=[phone(140, 126, 28, 46, INK, SKY, 6, [heart(154, 146, .5, RED)]), hand(148, 172, SKINS[1])])
