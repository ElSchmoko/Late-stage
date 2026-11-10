"""Art for the rewards-track cards (docs/card-plan-v14.md). python3 build_art.py p_track  (or track_sheets.py for review sheets)"""
from artkit import *

ART = {}
TRIBE_OF = {}


def reg(slug, name, tribe):
    def deco(fn):
        ART[name] = (slug, fn)
        TRIBE_OF[name] = tribe
        return fn
    return deco


# ---------- small helpers ----------
def head(cx, cy, r, skin=SKINS[0], eyes='open', mouth='smile', hair=None, hat=None, hatc=RED):
    s = r / 38
    o = [circ(cx, cy, r, skin)]
    if hair:
        o += [path(f'M{cx - r} {cy - 2 * s} Q{cx - r} {cy - r * 1.15} {cx} {cy - r * 1.05} Q{cx + r} {cy - r * 1.15} {cx + r} {cy - 2 * s} Q{cx + r * .5} {cy - r * .55} {cx} {cy - r * .6} Q{cx - r * .5} {cy - r * .55} {cx - r} {cy - 2 * s} Z', hair)]
    o += face(cx, cy + 4 * s, s * .9, eyes, mouth)
    if hat == 'party':
        o += [path(f'M{cx - r * .55} {cy - r * .8} L{cx} {cy - r * 1.9} L{cx + r * .55} {cy - r * .8} Z', hatc), dot(cx, cy - r * 1.9, 3 * s + 1, Y)]
    if hat == 'mohawk':
        o += [path(f'M{cx - 6 * s} {cy - r * .95} L{cx - 12 * s} {cy - r * 1.6} L{cx} {cy - r * 1.3} L{cx + 6 * s} {cy - r * 1.7} L{cx + 10 * s} {cy - r * .95} Z', hatc)]
    return o


def ghost(cx=100, cy=100, fill=W):
    return [path(f'M{cx - 50} {cy + 96} L{cx - 50} {cy} Q{cx - 50} {cy - 56} {cx} {cy - 56} Q{cx + 50} {cy - 56} {cx + 50} {cy} L{cx + 50} {cy + 96} '
                 f'L{cx + 34} {cy + 82} L{cx + 17} {cy + 96} L{cx} {cy + 82} L{cx - 17} {cy + 96} L{cx - 34} {cy + 82} Z', fill)]


def zzz(x, y, s=1):
    return [path(f'M{x} {y} L{x + 12 * s} {y} L{x} {y + 12 * s} L{x + 12 * s} {y + 12 * s}', 'none'),
            path(f'M{x + 18 * s} {y - 18 * s} L{x + 27 * s} {y - 18 * s} L{x + 18 * s} {y - 9 * s} L{x + 27 * s} {y - 9 * s}', 'none')]


def col_stroke(d, col, w=5):
    return path(d, 'none', f' stroke="{col}" stroke-width="{w}"')


def waves(cx, cy, n=3, side=1):
    return [path(f'M{cx + side * (10 + i * 12)} {cy - 12 - i * 6} Q{cx + side * (18 + i * 12)} {cy} {cx + side * (10 + i * 12)} {cy + 12 + i * 6}', 'none') for i in range(n)]


# =====================================================================================================  HUSTLERS
@reg('perfreview', 'Performance Review', 'Hustler')
def _():
    return person(2, 'combover', 'grey', 'suit', DGREY, RED, eyes='glasses', mouth='smirk', brows='flat', look=3,
                  prop=[rect(130, 100, 56, 76, W, 6), rect(146, 94, 24, 12, GREY, 3),
                        *[rect(140, 118 + i * 16, 9, 9, W, 2) for i in range(3)], *[path(f'M154 {122 + i * 16} L178 {122 + i * 16}') for i in range(3)],
                        path('M141 119 L148 126 M148 119 L141 126', 'none', ' stroke="#ff6b5e" stroke-width="4"'),
                        path('M141 155 L148 162 M148 155 L141 162', 'none', ' stroke="#ff6b5e" stroke-width="4"'),
                        g([rect(0, 0, 8, 46, RED, 3), path('M0 46 L4 54 L8 46 Z', W)], 'translate(34 118) rotate(-24)'), hand(36, 160, SKINS[2])])


@reg('loyaltycard', 'Loyalty Card', 'Hustler')
def _():
    return [g([rect(0, 0, 160, 100, '#ffe08a', 16), rect(0, 70, 160, 30, Y, 0), path('M0 70 L160 70'),
               *[circ(22 + i * 29, 86, 10, W) for i in range(5)],
               *[path(f'M{16 + i * 29} {86} L{22 + i * 29} {92} L{30 + i * 29} {80}', 'none', ' stroke="#14a052" stroke-width="4"') for i in range(3)],
               *face(80, 34, .7, 'happy', 'grin')], 'translate(20 40) rotate(-6 80 50)'),
            g([rect(-12, -40, 24, 40, RED, 6), rect(-20, 0, 40, 14, DGREY, 4), circ(0, -46, 9, W)], 'translate(162 154) rotate(18)'),
            sparkle(30, 36, 9, Y), sparkle(186, 64, 7, W)]


@reg('deliveryrider', 'Delivery Rider', 'Hustler')
def _():
    return person(3, 'short', 'black', 'hoodie', G, '#9be0b2', eyes='open', mouth='grin', hat='cap', hatc=G, look=-3, extra=['sweat'],
                  back=[rect(110, 34, 86, 84, ORA, 12), path('M118 58 L188 58'), rect(136, 74, 34, 22, W, 4), path('M144 84 L162 84')],
                  prop=[phone(20, 132, 28, 46, INK, '#9be0b2', -14), hand(38, 168, SKINS[3]), motion(150, 150, 3, 30)])


@reg('fivestar', 'Five-Star Rating', 'Hustler')
def _():
    return [*[star(28 + i * 36, 48 + abs(i - 2) * 8, 15) for i in range(5)],
            rect(58, 80, 84, 120, INK, 14), rect(66, 92, 68, 96, W, 8), *face(100, 126, .7, 'wide', 'teeth'),
            path('M134 102 Q140 112 136 118 Q130 118 134 102 Z', SKY), hand(52, 170, SKINS[1]), hand(148, 170, SKINS[1])]


@reg('taskrabbit', 'Task Rabbit', 'Hustler')
def _():
    return person(W, 'buzz', 'white', 'hivis', Y, eyes='open', mouth='cat', ears=False, look=2,
                  back=[ell(78, 34, 13, 36, W), ell(78, 36, 6, 26, PINK), ell(122, 34, 13, 36, W), ell(122, 36, 6, 26, PINK)],
                  front=[path('M94 112 L100 118 L106 112'), path('M100 118 L100 122')],
                  prop=[*box(130, 132, 62, 50, '#e8b878'), path('M136 164 L184 164 M136 172 L170 172'),
                        path('M24 110 L50 130 L50 140', 'none', ' stroke-width="7"'), path('M24 110 L50 130 L50 140', 'none', ' stroke="#c9c2d6" stroke-width="3"'),
                        hand(46, 150, W)])


@reg('doubleshift', 'Double Shift', 'Hustler')
def _():
    return person(1, 'messy', 'brown', 'apron', SKY, W, eyes='tired', mouth='wavy', extra=['bags'],
                  back=[circ(40, 54, 28, W), path('M40 54 L40 36 M40 54 L54 60'), dot(40, 54, 3)],
                  prop=[*mug(20, 150, W, RED), *mug(152, 150, W, G), steam(28, 140), steam(160, 140),
                        hand(30, 182, SKINS[1]), hand(162, 182, SKINS[1]), rect(110, 158, 26, 14, W, 3), rect(110, 176, 26, 14, Y, 3)])


@reg('ghostkitchen', 'Ghost Kitchen', 'Hustler')
def _():
    return [*ghost(96, 112), *face(96, 110, .8, 'open', 'o'),
            ell(96, 50, 34, 10, W), circ(76, 34, 16, W), circ(96, 26, 18, W), circ(116, 34, 16, W), rect(66, 44, 60, 12, W, 2),
            g([rect(0, 0, 40, 46, '#e0a050', 4), path('M8 0 Q20 -18 32 0', 'none')], 'translate(150 120) rotate(8)'),
            g([rect(0, 0, 40, 46, ORA, 4), path('M8 0 Q20 -18 32 0', 'none')], 'translate(10 128) rotate(-10)'),
            path('M44 140 L48 140 M144 140 L150 140')]


@reg('platformmonopoly', 'Platform Monopoly', 'Hustler')
def _():
    return [path('M62 46 L72 22 L88 38 L100 16 L112 38 L128 22 L138 46 Z', Y), circ(100, 18, 5, RED),
            rect(56, 46, 88, 150, INK, 16), rect(64, 58, 72, 120, '#9be0b2', 8),
            *face(100, 92, .75, 'shades', 'smirk'),
            *[rect(72 + (i % 3) * 20, 120 + (i // 3) * 22, 14, 14, [Y, PINK, SKY, ORA, LIL, W][i], 4) for i in range(6)],
            path('M56 120 Q30 120 26 150', 'none', ' stroke-width="10"'), path('M144 120 Q170 120 174 150', 'none', ' stroke-width="10"'),
            path('M56 120 Q30 120 26 150', 'none', ' stroke="#9be0b2" stroke-width="4"'), path('M144 120 Q170 120 174 150', 'none', ' stroke="#9be0b2" stroke-width="4"'),
            coin(24, 160, 12), coin(176, 160, 12), coin(186, 136, 8), coin(14, 136, 8)]


@reg('cashbackcard', 'Cashback Card', 'Hustler')
def _():
    return [g([rect(0, 0, 150, 96, TEAL, 14), rect(18, 26, 30, 22, Y, 5), path('M18 37 L48 37 M33 26 L33 48'),
               path('M18 72 L60 72 M70 72 L96 72'), *face(110, 40, .55, 'happy', 'grin')], 'translate(14 80) rotate(-8 75 48)'),
            path('M150 70 Q186 40 160 14', 'none', ' stroke-width="6"'), path('M150 70 Q186 40 160 14', 'none', ' stroke="#ffc928" stroke-width="2"'),
            path('M152 8 L164 12 L158 24'), coin(124, 40, 13), coin(150, 66, 9), coin(102, 22, 8)]


@reg('recruitment', 'Recruitment Agency', 'Hustler')
def _():
    return person(0, 'slick', 'blonde', 'suit', '#3a4a6a', SKY, eyes='open', mouth='teeth', brows='flat', look=-3,
                  back=[*head(34, 140, 18, SKINS[4], 'wide', 'o'), *head(166, 150, 16, SKINS[1], 'tired', 'flat')],
                  prop=[sign(130, 44, 64, 40, ['M140 58 L184 58', 'M140 70 L172 70'], Y, True, 8), hand(158, 140, SKINS[0]),
                        star(30, 70, 9), sparkle(186, 112, 6, W)])


# =====================================================================================================  INFLUENCERS
@reg('thirsttrap', 'Thirst Trap', 'Influencer')
def _():
    return person(4, 'long', 'brown', 'tank', PINK, eyes='wink', mouth='o', extra=['earring'],
                  prop=[g([rect(0, 0, 30, 50, INK, 7), rect(4, 6, 22, 36, PINK, 3)], 'translate(144 54) rotate(14)'), hand(160, 112, SKINS[4]),
                        heart(30, 60, 1.1, RED), heart(46, 92, .7, PINK), heart(170, 140, .8, RED), sparkle(24, 120, 6, W)])


@reg('botfarm', 'Bot Farm', 'Influencer')
def _():
    o = [rect(16, 44, 168, 150, '#9aa7b8', 10), path('M16 118 L184 118')]
    for i in range(6):
        x, y = 30 + (i % 3) * 52, 54 + (i // 3) * 74
        o += [rect(x, y, 36, 56, INK, 6), rect(x + 4, y + 6, 28, 40, PINK, 3), dot(x + 12, y + 22, 3), dot(x + 24, y + 22, 3), path(f'M{x + 11} {y + 34} L{x + 25} {y + 34}')]
    return o + [heart(176, 34, .9, RED), heart(24, 30, .7, RED)]


@reg('reactionstreamer', 'Reaction Streamer', 'Influencer')
def _():
    return person(1, 'curly', 'pink', 'hoodie', PINK, '#ffc2da', eyes='wide', mouth='shout', hat='headphones', hatc=PUR,
                  front=[hand(66, 104, SKINS[1]), hand(134, 104, SKINS[1])],
                  prop=[rect(144, 150, 48, 40, INK, 6), rect(149, 155, 38, 26, SKY, 3), path('M160 160 L172 168 L160 176 Z', W),
                        path('M48 52 L38 40 M152 52 L162 40 M100 34 L100 22')])


@reg('donationgoal', 'Donation Goal', 'Influencer')
def _():
    return [rect(18, 34, 164, 24, W, 12), rect(18, 34, 120, 24, PINK, 12), path('M138 36 L138 56'),
            path('M56 82 L144 82 L150 190 Q100 200 50 190 Z', '#e8f7ff'), rect(48, 70, 104, 16, GREY, 6),
            *face(100, 140, .7, 'stars', 'grin'), coin(80, 176, 10), coin(122, 178, 9), coin(100, 66, 9)]


@reg('raidparty', 'Raid Party', 'Influencer')
def _():
    return [*head(150, 120, 30, SKINS[1], 'happy', 'grin', '#8a5a3a', 'party', PINK),
            *head(98, 132, 32, SKINS[4], 'wide', 'open', '#2b2140', 'party', Y),
            *head(46, 128, 28, SKINS[0], 'open', 'teeth', '#ffd36b', 'party', TEAL),
            motion(150, 170, 3, 34), heart(178, 66, .8, RED), sparkle(20, 70, 7, W), star(118, 46, 8)]


@reg('subathon', 'Subathon', 'Influencer')
def _():
    return person(2, 'messy', 'dark', 'hoodie', LIL, PINK, eyes='tired', mouth='wavy', hat='headset', hatc=PINK, extra=['bags'],
                  back=[path('M150 36 Q132 50 142 70 Q160 82 176 66 Q158 66 150 36 Z', Y), sparkle(24, 40, 6, W), sparkle(46, 64, 4, W)],
                  prop=[rect(130, 136, 60, 52, W, 6), rect(130, 136, 60, 14, RED, 6), path('M146 160 Q158 154 158 164 Q158 169 151 169 Q160 169 158 177 Q155 184 145 180 M168 162 L174 158 L174 182', 'none')])


@reg('hypetrain', 'Hype Train', 'Influencer')
def _():
    return [rect(14, 110, 120, 60, PINK, 10), rect(110, 70, 70, 100, '#ff6fa8', 10), rect(122, 84, 46, 30, W, 6),
            *face(145, 99, .5, 'happy', 'grin'), rect(36, 78, 22, 32, DGREY, 3), path('M30 78 L64 78'),
            path('M8 170 L12 156 L4 156 Z', Y), circ(46, 172, 18, DGREY), circ(46, 172, 6, Y), circ(100, 172, 18, DGREY), circ(100, 172, 6, Y),
            circ(156, 172, 18, DGREY), circ(156, 172, 6, Y), path('M46 172 L156 172'),
            heart(48, 52, 1, RED), heart(70, 28, .7, PINK), heart(96, 14, .5, RED)]


@reg('streamerhouse', 'Streamer House', 'Influencer')
def _():
    o = [path('M20 92 L100 30 L180 92 Z', PINK), rect(30, 90, 140, 106, W, 4), rect(86, 150, 28, 46, '#ff6fa8', 3)]
    for x, y, sk, e in [(42, 100, SKINS[0], 'happy'), (118, 100, SKINS[3], 'wide'), (42, 146, SKINS[5], 'wink'), (138, 146, SKINS[2], 'open')]:
        o += [rect(x, y, 40, 34, SKY, 4), *head(x + 20, y + 22, 13, sk, e, 'grin')]
    return o + [circ(100, 62, 12, Y), circ(100, 62, 6, 'none'), path('M150 40 L150 64', 'none'), rect(144, 30, 12, 10, RED, 3)]


@reg('paidverification', 'Paid Verification', 'Influencer')
def _():
    pts = []
    import math
    for i in range(24):
        a = i * math.pi / 12
        r = 60 if i % 2 == 0 else 52
        pts.append(f'{100 + r * math.cos(a):.1f} {96 + r * math.sin(a):.1f}')
    return [path('M' + ' L'.join(pts) + ' Z', '#5ab8ff'), path('M72 98 L92 118 L130 74', 'none', ' stroke-width="14"'),
            path('M72 98 L92 118 L130 74', 'none', ' stroke="#ffffff" stroke-width="7"'),
            g([path('M0 0 L44 0 L60 18 L44 36 L0 36 Z', Y), circ(46, 18, 5, W), path('M10 12 L30 12 M10 24 L24 24')], 'translate(118 150) rotate(-12)'),
            *face(100, 80, .45, 'happy', 'small'), sparkle(26, 40, 8, Y), sparkle(30, 160, 6, W)]


@reg('fanconvention', 'Fan Convention', 'Influencer')
def _():
    return person(5, 'pigtails', 'teal', 'tee', LIL, eyes='stars', mouth='grin', hat='headband', hatc=PINK,
                  back=[path('M66 58 L56 24 L84 46 Z', LIL), path('M134 58 L144 24 L116 46 Z', LIL)],
                  front=[path('M84 140 L100 176 L116 140', 'none', ' stroke="#ff6b5e" stroke-width="4"'), rect(88, 170, 24, 30, W, 3), dot(100, 182, 4, PINK)],
                  prop=[sign(140, 60, 54, 44, [], PINK, True, 8), heart(166, 82, 1, W), hand(166, 150, SKINS[5]), sparkle(26, 80, 7, Y)])


# =====================================================================================================  FERALS
@reg('magpie', 'Magpie', 'Feral')
def _():
    return [g([path('M30 196 L60 140 L150 120 L188 136 L160 150 L150 196 Z', INK),
            path('M60 140 Q100 110 150 120 Q120 150 70 168 Z', '#5ab8ff'),
            circ(130, 86, 36, INK), path('M108 96 Q124 120 150 108 Q156 88 140 80 Q118 82 108 96 Z', W),
            circ(138, 80, 10, W), dot(140, 81, 4), path('M164 82 L194 90 L164 98 Z', DGREY),
            circ(190, 108, 10, 'none', ' stroke="#ffc928" stroke-width="5"'), sparkle(178, 128, 7, Y), sparkle(196, 70, 5, Y),
            path('M84 196 L90 176 M120 196 L118 176')], 'translate(-16 4)')]


@reg('allotment', 'Allotment', 'Feral')
def _():
    return [rect(0, 150, 200, 56, '#a0694a'), path('M0 150 L200 150'),
            leaf(36, 120, 10, 26, -20, G), leaf(52, 118, 10, 26, 20, G), path('M44 140 L40 196 L48 196 Z', ORA),
            circ(104, 140, 30, '#9bd65a'), path('M80 132 Q104 120 128 132 M84 150 Q104 160 124 150', 'none'), *face(104, 140, .45, 'happy', 'smile'),
            leaf(160, 124, 8, 22, 0, G), circ(160, 156, 16, RED), dot(154, 152, 2.5, W),
            sign(150, 40, 44, 30, ['M158 52 L186 52'], W, True, 6), path('M20 196 L180 196', 'none', ' stroke-dasharray="6 10"')]


@reg('tulipbulb', 'Tulip Bulb', 'Feral')
def _():
    return [rect(0, 140, 200, 66, '#a0694a'), path('M0 140 L200 140'),
            path('M100 70 Q60 110 72 150 Q84 176 100 178 Q116 176 128 150 Q140 110 100 70 Z', '#f2d6a2'),
            path('M100 70 Q92 100 96 176 M100 70 Q112 104 106 176', 'none'), path('M88 178 L80 196 M100 180 L100 198 M112 178 L120 196'),
            *face(100, 140, .5, 'calm', 'small'), leaf(92, 54, 8, 20, -30, G), leaf(110, 52, 8, 20, 30, G),
            *zzz(140, 70, 1.1)]


@reg('hedgehog', 'Hedgehog', 'Feral')
def _():
    sp = ' '.join(f'L{100 + 70 * __import__("math").cos(a / 10 * 3.1416 + 3.1416):.0f} {150 - 64 * __import__("math").sin(a / 10 * 3.1416):.0f} L{100 + 52 * __import__("math").cos((a + .5) / 10 * 3.1416 + 3.1416):.0f} {150 - 48 * __import__("math").sin((a + .5) / 10 * 3.1416):.0f}' for a in range(11))
    return [leaf(30, 180, 26, 12, -10, ORA), leaf(170, 184, 26, 12, 14, '#e0a050'), leaf(100, 190, 30, 10, 0, '#c98a4a'),
            path('M30 150 ' + sp + ' L170 150 Z', '#8a5a3a'),
            ell(100, 156, 52, 30, '#f2d6a2'), *face(100, 152, .6, 'calm', 'small'), ell(100, 166, 6, 4, INK),
            *zzz(150, 70), leaf(60, 92, 12, 6, 30, ORA)]


@reg('batcolony', 'Bat Colony', 'Feral')
def _():
    o = [rect(0, 30, 200, 16, '#8a5a3a', 4)]
    for x, s in [(46, .9), (100, 1.1), (154, .9)]:
        o += [gs([path('M0 0 L0 14', 'none'), path('M-30 30 Q-26 70 0 84 Q26 70 30 30 Q14 40 0 30 Q-14 40 -30 30 Z', PUR),
                  circ(0, 92, 18, PUR), path('M-14 104 L-18 116 L-6 108 Z M14 104 L18 116 L6 108 Z', PUR),
                  *face(0, 88, .4, 'calm', 'small')], f'translate({x} 46) scale({s})')]
    return o + zzz(150, 160) + [sparkle(20, 170, 6, W)]


@reg('hibernatingbear', 'Hibernating Bear', 'Feral')
def _():
    return [path('M0 160 Q100 140 200 160 L200 206 L0 206 Z', W),
            ell(100, 160, 80, 40, '#8a5a3a'), circ(60, 96, 14, '#8a5a3a'), circ(140, 96, 14, '#8a5a3a'),
            circ(100, 118, 44, '#a0694a'), ell(100, 134, 20, 14, '#f2d6a2'), ell(100, 128, 7, 5, INK), *face(100, 112, .7, 'calm', 'none'),
            path('M58 92 Q90 50 150 86 L176 70 L162 104 Z', SKY), circ(178, 68, 9, W),
            *zzz(30, 70, 1.2), path('M20 30 L24 34 M180 30 L184 34 M100 22 L104 26', 'none')]


@reg('cicadaswarm', 'Cicada Swarm', 'Feral')
def _():
    def cic(x, y, s, rot):
        return gs([path('M-34 -6 Q-60 30 -20 46 Q-6 20 -6 0 Z', '#e8f7ff'), path('M34 -6 Q60 30 20 46 Q6 20 6 0 Z', '#e8f7ff'),
                   ell(0, 10, 18, 34, '#8fc040'), circ(0, -28, 16, '#6b8f3a'), circ(-12, -32, 7, RED), circ(12, -32, 7, RED),
                   path('M-10 14 L10 14 M-10 26 L10 26', 'none')], f'translate({x} {y}) scale({s}) rotate({rot})')
    return [cic(100, 116, 1.4, 0), cic(30, 50, .55, -30), cic(170, 46, .6, 25), cic(176, 170, .5, 40), cic(24, 168, .5, -40),
            *waves(100, 60, 2, 1), *waves(100, 60, 2, -1)]


@reg('seedvault', 'Seed Vault', 'Feral')
def _():
    return [path('M0 196 L60 60 L100 96 L140 40 L200 196 Z', '#c9d7e8'), path('M44 98 L60 60 L76 76 L64 92 Z M124 76 L140 40 L158 82 L142 74 Z', W),
            rect(56, 120, 88, 76, DGREY, 6), circ(100, 156, 30, GREY), circ(100, 156, 12, 'none'),
            path('M100 126 L100 186 M70 156 L130 156 M79 135 L121 177 M121 135 L79 177', 'none'),
            g([rect(0, 0, 26, 34, Y, 3), leaf(13, 14, 5, 9, 0, G)], 'translate(150 150) rotate(10)'),
            g([rect(0, 0, 26, 34, ORA, 3), leaf(13, 14, 5, 9, 0, G)], 'translate(22 156) rotate(-10)'), sparkle(170, 110, 6, W)]


@reg('foxden', 'Fox Den', 'Feral')
def _():
    def fox(x, y, s):
        return gs([path('M-26 -10 L-34 -44 L-8 -26 Z', ORA), path('M26 -10 L34 -44 L8 -26 Z', ORA),
                   path('M-30 -8 Q-28 -34 0 -34 Q28 -34 30 -8 Q34 14 0 30 Q-34 14 -30 -8 Z', ORA),
                   path('M-30 2 Q-14 8 0 30 Q-26 22 -30 2 Z', W), path('M30 2 Q14 8 0 30 Q26 22 30 2 Z', W),
                   dot(-10, -4, 3), dot(10, -4, 3), ell(0, 16, 5, 4, INK)], f'translate({x} {y}) scale({s})')
    return [path('M-6 206 Q10 90 100 84 Q190 90 206 206 Z', '#9bd65a'), path('M40 206 Q46 130 100 128 Q154 130 160 206 Z', INK),
            fox(78, 172, 1), fox(130, 166, .85), leaf(30, 100, 10, 20, -30, G), leaf(176, 104, 10, 20, 30, G)]


@reg('botanicalgarden', 'Botanical Garden', 'Feral')
def _():
    return [path('M20 196 L20 120 Q20 40 100 30 Q180 40 180 120 L180 196 Z', '#e8f7ff'),
            path('M100 30 L100 196 M20 120 L180 120 M50 60 L50 196 M150 60 L150 196', 'none'),
            leaf(70, 150, 14, 34, -20, G), leaf(130, 150, 14, 34, 20, '#7cc24a'), leaf(100, 100, 12, 40, 0, G),
            circ(66, 104, 8, PINK), circ(136, 98, 8, Y), rect(10, 190, 180, 10, '#a0694a', 3), sparkle(166, 46, 7, W)]


# =====================================================================================================  CREATIVES
@reg('weddingband', 'Wedding Band', 'Creative')
def _():
    return person(3, 'slick', 'black', 'suit', INK, W, eyes='happy', mouth='open', look=-2,
                  front=[path('M88 144 L100 150 L112 144 L112 156 L100 150 L88 156 Z', LIL)],
                  prop=[mic(156, 108, DGREY, 16), hand(152, 150, SKINS[3]), circ(32, 66, 14, 'none', ' stroke="#ffc928" stroke-width="6"'),
                        sparkle(32, 46, 7, W), heart(176, 60, .8, PINK), heart(26, 120, .6, PINK)])


@reg('sampler', 'Sampler', 'Creative')
def _():
    cols = [PINK, Y, TEAL, LIL, ORA, SKY, G, RED, Y, PINK, TEAL, LIL]
    return [rect(18, 58, 164, 128, DGREY, 14), rect(30, 70, 90, 30, '#c6ffd8', 4), *face(75, 82, .4, 'happy', 'grin'),
            circ(146, 85, 14, GREY), path('M146 85 L154 77'), *[rect(32 + (i % 4) * 36, 112 + (i // 4) * 24, 28, 18, cols[i], 4) for i in range(8)],
            path('M180 60 Q196 40 186 20', 'none'), *waves(30, 40, 2, -1)]


@reg('tributeact', 'Tribute Act', 'Creative')
def _():
    return person(1, 'curly', 'pink', 'leather', TEAL, eyes='wide', mouth='grin', extra=['mustache'], head_dy=4,
                  back=[path('M60 44 L70 30 M140 44 L130 30', 'none')],
                  front=[path('M56 68 Q100 40 144 66', 'none', ' stroke="#2b2140" stroke-width="3" stroke-dasharray="5 5"'),
                         *[sparkle(x, y, 4, Y) for x, y in [(66, 172), (134, 172), (84, 194), (116, 194)]]],
                  prop=[mic(30, 120, Y, -10), hand(30, 160, SKINS[1]), path('M138 40 Q158 34 160 54', 'none'), sparkle(170, 70, 7, W)])


@reg('plagiarist', 'Plagiarist', 'Creative')
def _():
    return person(0, 'fringe', 'ginger', 'turtle', INK, eyes='open', mouth='smirk', look=4, brows='flat', hat='beret', hatc=RED,
                  back=[rect(126, 40, 66, 80, W, 4), circ(158, 70, 14, Y), path('M132 110 L150 86 L164 100 L176 84 L188 110 Z', G)],
                  prop=[rect(8, 130, 66, 66, '#e8f7ff', 4, ' opacity=".85"'), circ(40, 156, 12, 'none', ' stroke-dasharray="4 4"'),
                        path('M14 190 L28 170 L40 182 L52 166 L68 190', 'none', ' stroke-dasharray="4 4"'),
                        g([rect(0, 0, 6, 40, Y, 2), path('M0 40 L3 48 L6 40 Z', INK)], 'translate(70 148) rotate(30)'), hand(72, 160, SKINS[0])])


@reg('ghostwriter', 'Ghostwriter', 'Creative')
def _():
    return [*ghost(80, 104, '#f3edff'), *face(80, 96, .8, 'glasses', 'small'),
            rect(104, 140, 92, 56, DGREY, 8), rect(118, 108, 64, 40, W, 2), path('M126 120 L172 120 M126 130 L164 130'),
            *[circ(118 + i * 14, 176, 5, GREY) for i in range(5)],
            g([path('M0 0 Q20 -30 6 -56 Q-6 -30 0 0 Z', W), path('M0 0 L-4 10')], 'translate(36 150) rotate(-20)')]


@reg('encore', 'Encore', 'Creative')
def _():
    return [path('M0 10 L60 10 Q50 100 70 206 L0 206 Z', RED), path('M200 10 L140 10 Q150 100 130 206 L200 206 Z', RED),
            path('M0 10 L200 10', 'none'), path('M20 10 Q24 100 16 206 M40 10 Q44 110 40 206 M180 10 Q176 100 184 206 M160 10 Q156 110 160 206', 'none'),
            path('M70 196 L130 196 L100 60 Z', '#fff6c2'), mic(100, 120, DGREY), path('M100 160 L100 196 M86 196 L114 196'),
            path('M80 70 Q90 50 100 60', 'none'),
            sparkle(84, 40, 7, Y), sparkle(120, 46, 5, W)]


@reg('aiartgen', 'AI Art Generator', 'Creative')
def _():
    return [rect(20, 36, 82, 68, GREY, 14), circ(46, 66, 11, '#7fe0ff'), circ(76, 66, 11, '#7fe0ff'), rect(42, 84, 38, 8, INK, 3),
            path('M61 36 L61 18'), circ(61, 14, 6, RED), rect(30, 104, 62, 80, DGREY, 10), path('M92 130 L130 110', 'none', ' stroke-width="8"'),
            g([rect(0, 0, 6, 40, BROWN, 2), path('M-2 -10 L8 -10 L6 0 L0 0 Z', LIL)], 'translate(130 96) rotate(40)'),
            rect(120, 120, 74, 76, W, 4), path('M138 186 L138 156 Q138 146 146 146 L176 146 Q184 146 184 156 L184 186', '#f2c39a'),
            path('M146 146 L146 128 M154 146 L154 124 M162 146 L162 124 M170 146 L170 126 M178 146 L178 130 M184 152 L192 140', 'none'),
            path('M28 196 L94 196')]


@reg('mashupartist', 'Mashup Artist', 'Creative')
def _():
    return person(2, 'swoop', 'teal', 'tee', LIL, eyes='shades', mouth='grin', hat='headphones', hatc=PINK,
                  back=[path('M62 70 Q66 40 100 40 L100 60 Z', PINK)],
                  prop=[*vinyl(26, 160, 24, Y), *vinyl(174, 160, 24, PINK), hand(44, 152, SKINS[2]), hand(156, 152, SKINS[2]),
                        path('M16 110 L36 100 M184 110 L164 100', 'none'), sparkle(30, 60, 7, Y), sparkle(172, 52, 6, W)])


@reg('biopic', 'Biopic', 'Creative')
def _():
    return [g([rect(0, 0, 130, 26, INK, 3), *[path(f'M{10 + i * 26} 0 L{24 + i * 26} 26', 'none', ' stroke="#ffffff" stroke-width="5"') for i in range(5)]], 'translate(30 46) rotate(-14 0 26)'),
            rect(30, 74, 130, 100, DGREY, 6), path('M30 100 L160 100'), *face(95, 136, .7, 'happy', 'grin'),
            star(176, 50, 14), circ(38, 186, 16, GREY), circ(38, 186, 5, INK), circ(160, 186, 12, GREY), sparkle(16, 40, 6, W)]


@reg('crossoverhit', 'Crossover Hit', 'Creative')
def _():
    cols = ['#14a052', '#ff8ab8', '#d4e24a', '#b18cff', '#5ab8ff', '#ff8a3d', '#4fd1c5']
    import math
    segs = []
    for i, c in enumerate(cols):
        a0, a1 = i * 2 * math.pi / 7, (i + 1) * 2 * math.pi / 7
        segs.append(path(f'M100 112 L{100 + 30 * math.cos(a0):.1f} {112 + 30 * math.sin(a0):.1f} A30 30 0 0 1 {100 + 30 * math.cos(a1):.1f} {112 + 30 * math.sin(a1):.1f} Z', c))
    return [circ(100, 112, 76, INK), circ(100, 112, 58, 'none', ' stroke="#6b6182" stroke-width="2"'), *segs, circ(100, 112, 6, W),
            path('M156 52 L176 28 L190 50', 'none', ' stroke-width="8"'), path('M156 52 L176 28 L190 50', 'none', ' stroke="#2ecb6e" stroke-width="4"'),
            sparkle(26, 34, 9, Y), sparkle(178, 178, 7, W), star(24, 180, 10)]


# =====================================================================================================  TECHIES
@reg('btspeaker', 'Bluetooth Speaker', 'Techie')
def _():
    return [rect(54, 50, 92, 140, '#5ab8ff', 30), *[path(f'M62 {70 + i * 10} L138 {70 + i * 10}', 'none', ' stroke="#2b8fd6" stroke-width="3"') for i in range(4)],
            *face(100, 140, .75, 'happy', 'open'), path('M92 172 L100 164 L108 172 L100 180 Z', W),
            *waves(146, 110, 3, 1), *waves(54, 110, 3, -1)]


@reg('clutchplayer', 'Clutch Player', 'Techie')
def _():
    return person(4, 'spiky', 'black', 'hoodie', INK, DGREY, eyes='angry', mouth='teeth', hat='headset', hatc=SKY, extra=['sweat'],
                  prop=[rect(122, 150, 70, 36, GREY, 16), circ(140, 168, 6, INK), circ(172, 162, 4, RED), circ(180, 172, 4, G),
                        hand(124, 176, SKINS[4]), heart(36, 60, 1, RED), path('M24 86 L48 86', 'none', ' stroke="#ff6b5e" stroke-width="5"'),
                        rect(20, 80, 34, 12, 'none', 4)])


@reg('popupad', 'Pop-Up Ad', 'Techie')
def _():
    return [g([rect(0, 0, 160, 120, W, 8), rect(0, 0, 160, 22, '#5ab8ff', 8), path('M0 22 L160 22'), rect(134, 4, 16, 14, RED, 3),
               path('M138 7 L146 15 M146 7 L138 15', 'none', ' stroke="#ffffff" stroke-width="2.5"'),
               star(42, 70, 26), *face(42, 70, .4, 'happy', 'grin'), rect(80, 46, 64, 12, Y, 4), rect(80, 66, 50, 8, GREY, 3), rect(80, 84, 64, 22, G, 8)],
              'translate(20 46) rotate(-6 80 60)'),
            path('M150 196 L150 150 L162 160 L172 140 L178 144 L168 164 L184 166 Z', W), sparkle(24, 30, 8, Y)]


@reg('battlepass', 'Battle Pass', 'Techie')
def _():
    return [g([rect(0, 0, 176, 70, Y, 10), path('M44 0 L44 70', 'none', ' stroke-dasharray="5 6"'),
               *[circ(66 + i * 26, 50, 8, W if i > 1 else G) for i in range(5)], *face(22, 34, .45, 'happy', 'grin'),
               path('M58 20 L160 20'), path('M58 30 L120 30')], 'translate(12 52) rotate(-8 88 35)'),
            path('M140 166 Q150 140 172 146 Q196 152 186 176 Z', PUR), path('M138 172 L190 176'),
            sparkle(150, 136, 7, W), path('M80 160 L120 160 M110 150 L120 160 L110 170', 'none')]


@reg('databroker', 'Data Broker', 'Techie')
def _():
    return person(1, 'slick', 'dark', 'suit', '#3a4a6a', W, eyes='shades', mouth='smirk',
                  prop=[path('M130 112 L188 112 L184 196 L134 196 Z', '#e8f7ff'), rect(126, 102, 66, 14, GREY, 5),
                        circ(150, 140, 12, '#c98a4a'), dot(146, 136, 2.5), dot(154, 144, 2.5), circ(170, 170, 11, '#c98a4a'), dot(168, 166, 2.5),
                        circ(148, 178, 10, '#c98a4a'), ell(158, 126, 10, 6, W), dot(158, 126, 3), hand(132, 176, SKINS[1])])


@reg('autorenewal', 'Auto-Renewal', 'Techie')
def _():
    return [rect(32, 46, 120, 120, W, 10), rect(32, 46, 120, 28, RED, 10), path('M32 74 L152 74'), rect(56, 36, 8, 20, GREY, 3), rect(120, 36, 8, 20, GREY, 3),
            *face(92, 116, .6, 'tired', 'wavy'),
            path('M164 132 A26 26 0 1 1 140 158', 'none', ' stroke-width="10"'), path('M164 132 A26 26 0 1 1 140 158', 'none', ' stroke="#ffc928" stroke-width="5"'),
            path('M152 126 L166 132 L158 144', 'none'), g([rect(0, 0, 54, 34, TEAL, 6), rect(8, 10, 12, 9, Y, 2)], 'translate(10 150) rotate(-14)')]


@reg('appstore', 'App Store', 'Techie')
def _():
    return [rect(20, 70, 160, 126, W, 6), path('M14 70 L186 70 L176 40 L24 40 Z', '#5ab8ff'),
            *[path(f'M{24 + i * 32} 40 L{14 + i * 34} 70', 'none') for i in range(6)],
            rect(34, 86, 82, 70, '#e8f7ff', 4), *[rect(42 + (i % 3) * 24, 94 + (i // 3) * 24, 18, 18, [PINK, Y, G, ORA, LIL, SKY][i], 5) for i in range(6)],
            rect(128, 110, 40, 86, '#3a4a6a', 4), dot(160, 154, 3, Y), *face(100, 56, .4, 'happy', 'smirk'),
            g([rect(0, 0, 34, 22, Y, 3), path('M8 11 L26 11')], 'translate(132 82) rotate(8)')]


@reg('datacentre', 'Data Centre', 'Techie')
def _():
    o = []
    for x in (14, 70):
        o += [rect(x, 36, 50, 150, '#3d4a66', 6)] + [path(f'M{x} {66 + i * 30} L{x + 50} {66 + i * 30}') for i in range(4)] + \
             [dot(x + 10, 51 + i * 30, 3, G if i % 2 else Y) for i in range(5)]
    return o + [*face(39, 104, .4, 'happy', 'small'),
                path('M128 120 L180 120 L172 196 L136 196 Z', '#cfeeff'), path('M130 136 L178 136', 'none'), path('M130 136 L178 136 L172 196 L136 196 Z', '#5ab8ff'),
                path('M120 60 L156 60 L156 150', 'none', ' stroke-width="8"'), path('M120 60 L156 60 L156 150', 'none', ' stroke="#ff6b5e" stroke-width="4"'),
                path('M182 88 Q190 100 186 106 Q178 106 182 88 Z', SKY)]


@reg('lanparty', 'LAN Party', 'Techie')
def _():
    return [*head(56, 130, 30, SKINS[3], 'wide', 'open', '#2b2140'), *head(144, 130, 30, SKINS[0], 'angry', 'teeth', '#ff8a3d'),
            *screen(14, 40, 80, 56, '#7fe0ff', INK, True), *screen(106, 40, 80, 56, '#ffe08a', INK, True),
            rect(0, 168, 200, 38, '#a0694a', 4), g([rect(0, 0, 54, 14, '#e8b878', 3), path('M4 14 L50 14 L27 34 Z', '#ffc928')], 'translate(74 154)'),
            path('M20 196 Q60 170 100 196 Q140 170 180 196', 'none', ' stroke="#5ab8ff" stroke-width="4"')]


@reg('smartdoorbell', 'Smart Doorbell', 'Techie')
def _():
    return [rect(62, 30, 76, 150, DGREY, 26), circ(100, 84, 30, INK), circ(100, 84, 18, '#5ab8ff'), dot(100, 84, 8, INK), dot(94, 78, 4, W),
            circ(100, 146, 16, '#7fe0ff'), circ(100, 146, 7, 'none'),
            path('M150 70 L166 62 M154 90 L176 90 M150 110 L166 118'), path('M50 70 L34 62 M46 90 L24 90 M50 110 L34 118'),
            path('M40 196 L160 196')]


# =====================================================================================================  PUNKS
@reg('gigposter', 'Gig Poster', 'Punk')
def _():
    return [rect(0, 0, 200, 206, '#e8b89c'), path('M0 40 L200 40 M0 90 L200 90 M0 140 L200 140 M50 0 L50 40 M150 0 L150 40 M100 40 L100 90 M30 90 L30 140 M170 90 L170 140 M80 140 L80 206', 'none'),
            path('M36 30 L164 24 L170 176 L140 168 L128 184 L110 172 L30 178 Z', '#ffe08a'),
            lightning(100, 60, 2.2, ORA), *anarchy_marks(),
            rect(52, 140, 96, 10, INK, 3), rect(64, 156, 72, 8, INK, 3),
            path('M40 34 L48 30 M154 30 L162 32', 'none', ' stroke="#c9c2d6" stroke-width="5"')]


def anarchy_marks():
    return [star(56, 70, 9, PINK), star(150, 104, 8, PINK)]


@reg('bannerdrop', 'Banner Drop', 'Punk')
def _():
    return [rect(0, 30, 200, 20, GREY, 3), path('M0 40 L200 40'), *[rect(10 + i * 30, 50, 6, 24, GREY) for i in range(7)],
            path('M24 74 L176 74 L170 172 Q100 160 30 172 Z', W), path('M24 74 L30 172 M176 74 L170 172', 'none'),
            col_stroke('M46 104 L80 96 L66 136 L104 120 M118 96 Q150 90 152 114 Q150 140 118 134', ORA, 9),
            path('M46 104 L80 96 L66 136 L104 120 M118 96 Q150 90 152 114 Q150 140 118 134', 'none'),
            spray(160, 176, RED, 30)]


@reg('pogodancer', 'Pogo Dancer', 'Punk')
def _():
    return person(0, 'mohawk', 'pink', 'leather', INK, eyes='happy', mouth='shout', extra=['earring'], head_dy=-10,
                  back=[path('M50 120 L30 64 M150 120 L170 64', 'none', ' stroke-width="14"'), path('M50 120 L30 64 M150 120 L170 64', 'none', ' stroke="#f7d9a4" stroke-width="8"'),
                        hand(30, 60, SKINS[0]), hand(170, 60, SKINS[0])],
                  prop=[path('M20 180 L40 170 M20 196 L44 188 M160 170 L180 180 M156 188 L180 196')])


@reg('circlepit', 'Circle Pit', 'Punk')
def _():
    o = [ell(100, 130, 84, 54, '#ffd2b3'), path('M30 100 A76 46 0 1 1 30 160', 'none', ' stroke-width="8" stroke-dasharray="1 0"'),
         path('M24 150 L30 166 L44 156')]
    for (x, y, sk, h, e) in [(56, 92, SKINS[0], RED, 'happy'), (142, 92, SKINS[4], G, 'wide'), (170, 144, SKINS[2], PINK, 'angry'), (100, 176, SKINS[5], Y, 'happy'), (34, 144, SKINS[1], LIL, 'x')]:
        o += head(x, y, 18, sk, e, 'grin', None, 'mohawk', h)
    return o + [sparkle(100, 30, 8, Y)]


@reg('bouncer', 'Bouncer', 'Punk')
def _():
    return person(5, 'buzz', 'black', 'tee', INK, eyes='shades', mouth='flat', brows='angry', extra=['beard'],
                  front=[path('M44 170 Q100 150 156 170 Q160 186 140 190 Q100 172 60 190 Q40 186 44 170 Z', '#7a4a2e')],
                  prop=[path('M138 100 Q150 110 146 126', 'none', ' stroke-width="3"'), circ(140, 98, 4, GREY),
                        rect(150, 40, 44, 56, W, 4), path('M158 52 L186 52 M158 62 L186 62 M158 72 L176 72'),
                        path('M156 84 L188 80', 'none', ' stroke="#ff6b5e" stroke-width="4"')])


@reg('crowdsurfer', 'Crowd Surfer', 'Punk')
def _():
    return [*[hand(x, y, SKINS[i % 6], 11) for i, (x, y) in enumerate([(30, 150), (64, 140), (100, 146), (136, 138), (170, 148)])],
            *[path(f'M{x} {y + 10} L{x} 206', 'none', ' stroke-width="9"') for x, y in [(30, 150), (64, 140), (100, 146), (136, 138), (170, 148)]],
            path('M60 92 L150 100 Q170 104 168 124 L60 126 Z', ORA), path('M150 104 L188 96 L190 110 L168 116', SKINS[2]),
            circ(44, 104, 26, SKINS[2]), path('M24 92 L18 70 L32 84 L38 62 L46 82 L58 66 L58 90 Z', G),
            *face(46, 104, .6, 'happy', 'shout'), path('M70 126 L60 150 M150 126 L160 150', 'none'),
            sparkle(150, 50, 8, Y), sparkle(30, 40, 6, W)]


@reg('wallofdeath', 'Wall of Death', 'Punk')
def _():
    o = []
    for i, (x, y, sk, c) in enumerate([(30, 80, SKINS[0], RED), (22, 130, SKINS[3], G), (48, 172, SKINS[5], PINK)]):
        o += head(x, y, 22, sk, 'angry', 'shout', None, 'mohawk', c)
    for i, (x, y, sk, c) in enumerate([(170, 84, SKINS[2], Y), (178, 134, SKINS[1], LIL), (152, 176, SKINS[4], ORA)]):
        o += head(x, y, 22, sk, 'angry', 'shout', None, 'mohawk', c)
    return o + [path('M60 100 L90 110 M60 140 L88 130 M140 104 L112 112 M140 146 L112 134'), lightning(100, 60, 2, Y)]


@reg('festivalpit', 'Festival Pit', 'Punk')
def _():
    return [ell(100, 186, 96, 22, '#8a5a3a'), path('M10 150 L60 70 L110 150 Z', ORA), path('M60 70 L60 150 M44 150 L60 110 L76 150', 'none'),
            path('M120 186 L124 110 L156 110 L158 160 L188 164 L188 190 L122 192 Z', G), path('M124 130 L156 130'),
            *face(140, 150, .4, 'x', 'wavy'), ell(30, 190, 14, 5, '#6b4630'), ell(176, 196, 12, 4, '#6b4630'),
            g([rect(0, 0, 40, 12, PINK, 4), rect(6, 3, 10, 6, Y, 2)], 'translate(146 40) rotate(20)'), sparkle(120, 50, 7, Y)]


@reg('bootlegmerch', 'Bootleg Merch', 'Punk')
def _():
    return [path('M40 50 L76 34 Q100 46 124 34 L160 50 L184 90 L156 102 L152 196 L48 196 L44 102 L16 90 Z', INK),
            path('M76 34 Q100 52 124 34', 'none'), lightning(98, 76, 1.8, '#ffe08a'),
            path('M66 156 L80 150 L92 158 L108 148 L120 158 L134 150', 'none', ' stroke="#ff8ab8" stroke-width="5"'),
            g([path('M0 0 L40 0 L54 16 L40 32 L0 32 Z', Y), circ(42, 16, 4, W), path('M10 9 L28 9 M10 21 L22 21')], 'translate(140 140) rotate(-16)'),
            path('M150 132 Q140 116 128 122', 'none')]


@reg('soundsystem', 'Sound System', 'Punk')
def _():
    o = []
    for x, y, w, h in [(14, 100, 82, 96), (104, 100, 82, 96), (34, 22, 132, 76)]:
        o += [rect(x, y, w, h, '#3a3045', 6)]
    o += [circ(55, 150, 30, '#6a5d7a'), circ(55, 150, 12, INK), circ(145, 150, 30, '#6a5d7a'), circ(145, 150, 12, INK),
          circ(70, 60, 22, '#6a5d7a'), circ(70, 60, 8, INK), circ(130, 60, 22, '#6a5d7a'), circ(130, 60, 8, INK),
          *face(100, 60, .35, 'angry', 'shout')]
    return o + [*waves(186, 90, 2, 1), *waves(14, 90, 2, -1), lightning(100, 120, 1, ORA)]


# =====================================================================================================  PHILOSOPHERS
@reg('breathwork', 'Breathwork Coach', 'Philosopher')
def _():
    return person(4, 'topknot', 'black', 'tank', TEAL, eyes='calm', mouth='o', hat='headband', hatc=W,
                  prop=[path('M114 122 Q146 124 158 108 Q166 94 154 90 Q144 90 148 102', 'none'),
                        path('M114 132 Q150 140 176 128', 'none'),
                        path('M24 120 Q40 104 56 120 Q72 136 88 120', 'none'), path('M150 140 Q166 124 182 140', 'none'),
                        hand(70, 176, SKINS[4]), hand(130, 176, SKINS[4])])


@reg('debateclub', 'Debate Club', 'Philosopher')
def _():
    return [*head(46, 86, 26, SKINS[1], 'angry', 'shout', '#8a5a3a'), *head(154, 86, 26, SKINS[5], 'angry', 'open', '#2b2140'),
            path('M20 196 L28 120 L66 120 L74 196 Z', '#4fd1c5'), path('M126 196 L134 120 L172 120 L180 196 Z', '#ff8ab8'),
            rect(16, 112, 62, 12, W, 3), rect(122, 112, 62, 12, W, 3),
            *speech(70, 26, 50, 30, 2, W, 'left'), *speech(96, 54, 50, 30, 2, '#fff1a6', 'right'), lightning(100, 120, 1.4, Y)]


@reg('vanlifer', 'Van Lifer', 'Philosopher')
def _():
    return [rect(30, 30, 140, 14, Y, 7), path('M40 44 L50 54 M160 44 L150 54'),
            rect(16, 56, 168, 110, TEAL, 22), path('M16 116 L184 116'), rect(32, 70, 52, 34, '#e8f7ff', 6), rect(116, 70, 52, 34, '#e8f7ff', 6),
            circ(48, 136, 10, Y), circ(152, 136, 10, Y), *face(100, 132, .6, 'calm', 'smile'),
            circ(50, 172, 18, DGREY), circ(50, 172, 7, GREY), circ(150, 172, 18, DGREY), circ(150, 172, 7, GREY),
            leaf(54, 80, 6, 12, -30, G), leaf(66, 80, 6, 12, 30, G), path('M0 190 L200 190', 'none')]


@reg('digitaldetox', 'Digital Detox', 'Philosopher')
def _():
    return [path('M48 60 L152 60 L156 190 Q100 204 44 190 Z', '#e8f7ff'), rect(40, 42, 120, 22, '#c98a4a', 6),
            rect(74, 90, 52, 86, INK, 10), rect(80, 98, 40, 66, SKY, 4), *face(100, 128, .5, 'sad', 'frown'),
            path('M60 72 Q64 120 56 180', 'none', ' stroke="#ffffff" stroke-width="4"'),
            leaf(26, 120, 10, 22, -20, G), leaf(176, 130, 10, 22, 20, G), leaf(24, 160, 8, 18, 30, '#7cc24a'),
            path('M150 30 Q158 20 166 30 M168 18 Q176 8 184 18', 'none')]


@reg('declutter', 'Declutter Coach', 'Philosopher')
def _():
    return person(0, 'bun', 'ginger', 'cardigan', TEAL, W, eyes='happy', mouth='grin', extra=['freckles'],
                  prop=[*box(124, 140, 66, 50, '#e8b878'), path('M126 140 L114 120 M188 140 L198 120'),
                        g([rect(0, 0, 24, 30, PINK, 3)], 'translate(140 92) rotate(-20)'), g([rect(0, 0, 30, 18, Y, 3)], 'translate(166 70) rotate(25)'),
                        circ(132, 64, 9, SKY), sparkle(40, 60, 8, Y), sparkle(30, 110, 5, W),
                        path('M60 150 L28 120', 'none', ' stroke-width="12"'), path('M60 150 L28 120', 'none', ' stroke="#4fd1c5" stroke-width="6"'), hand(26, 116, SKINS[0])])


@reg('silentretreat', 'Silent Retreat', 'Philosopher')
def _():
    return person(2, 'buzz', 'grey', 'robe', '#ffb347', '#ff8a3d', eyes='calm', mouth='flat',
                  front=[path('M100 104 L100 126', 'none', ' stroke-width="8"'), path('M100 104 L100 126', 'none', ' stroke="#e8b48a" stroke-width="4"'), hand(100, 132, SKINS[2], 9)],
                  prop=[rect(160, 40, 10, 156, '#9bd65a', 3), path('M160 80 L170 80 M160 120 L170 120 M160 160 L170 160'), leaf(182, 70, 6, 14, 40, G),
                        rect(26, 60, 10, 136, '#9bd65a', 3), path('M26 100 L36 100 M26 140 L36 140'), leaf(16, 90, 6, 14, -40, G)])


@reg('capsulewardrobe', 'Capsule Wardrobe', 'Philosopher')
def _():
    o = [rect(10, 34, 180, 8, GREY, 4), path('M20 42 L20 196 M180 42 L180 196')]
    for i in range(4):
        x = 34 + i * 36
        o += [path(f'M{x + 14} 42 L{x + 14} 52 M{x} 62 L{x + 14} 52 L{x + 28} 62', 'none'),
              path(f'M{x} 62 L{x + 28} 62 L{x + 30} 150 L{x - 2} 150 Z', '#e8d8bc')]
    return o + [*face(124, 104, .35, 'calm', 'flat'), path('M8 196 L192 196')]


@reg('thevoid', 'The Void', 'Philosopher')
def _():
    return [circ(100, 104, 84, '#3a3045'), circ(100, 104, 62, INK), path('M40 104 Q100 40 160 104 Q100 168 40 104', 'none', ' stroke="#6a5d7a" stroke-width="4"'),
            ell(80, 100, 12, 14, W), ell(120, 100, 12, 14, W), dot(82, 104, 5), dot(122, 104, 5), path('M86 132 Q100 138 114 132', 'none', ' stroke="#ffffff" stroke-width="3"'),
            sparkle(26, 30, 8, W), sparkle(180, 40, 6, '#4fd1c5'), sparkle(176, 176, 7, W), sparkle(20, 170, 5, '#4fd1c5')]


@reg('tenuredprof', 'Tenured Professor', 'Philosopher')
def _():
    return person(1, 'sides', 'grey', 'cardigan', '#a0694a', W, eyes='glasses', mouth='smirk', extra=['longbeard'], brows='flat',
                  front=[path('M88 140 L100 146 L112 140 L112 150 L100 146 L88 150 Z', TEAL)],
                  prop=[book(132, 116, 46, 56, '#4fd1c5', 8), book(140, 160, 46, 36, RED, -4), hand(140, 160, SKINS[1]),
                        *mug(18, 150, W, TEAL), steam(26, 140)])


@reg('tedtalk', 'TED Talk', 'Philosopher')
def _():
    return person(3, 'curly', 'dark', 'turtle', INK, eyes='open', mouth='grin', hat='headset', hatc=GREY,
                  back=[rect(110, 26, 86, 62, W, 6), path('M120 76 L138 56 L152 66 L172 40 L186 52', 'none', ' stroke="#2ecb6e" stroke-width="5"'),
                        path('M120 76 L138 56 L152 66 L172 40 L186 52', 'none')],
                  prop=[ell(100, 204, 98, 16, RED), hand(36, 140, SKINS[3]), path('M36 140 L44 120 L52 124', 'none'),
                        rect(26, 150, 14, 24, DGREY, 4), dot(33, 158, 2.5, RED)])


# =====================================================================================================  NEIGHBOURS
@reg('parcellocker', 'Parcel Locker', 'Neutral')
def _():
    o = [rect(16, 30, 168, 166, '#ffc928', 8)]
    for i in range(6):
        x, y = 26 + (i % 3) * 52, 40 + (i // 3) * 74
        if i == 4:
            o += [rect(x, y, 44, 64, INK, 4), *box(x + 6, y + 22, 32, 36), g([rect(0, 0, 40, 64, '#ffe08a', 4)], f'translate({x + 44} {y}) skewY(10)')]
        else:
            o += [rect(x, y, 44, 64, '#ffe08a', 4), circ(x + 36, y + 32, 3.5, INK)]
    return o + [rect(40, 46, 30, 18, '#8fd4ff', 3), *face(55, 92, .4, 'happy', 'small')]


@reg('nwatch', 'Neighbourhood Watch', 'Neutral')
def _():
    return [rect(10, 20, 180, 180, '#8fd4ff', 6), *[rect(10, 30 + i * 20, 180, 12, W, 2) for i in range(4)],
            *[rect(10, 150 + i * 16, 180, 10, W, 2) for i in range(3)],
            circ(100, 124, 40, SKINS[0]), path('M60 114 Q60 80 100 80 Q140 80 140 114 Q120 96 100 98 Q80 96 60 114 Z', HAIR['grey']),
            circ(82, 120, 15, INK), circ(118, 120, 15, INK), circ(82, 120, 9, '#5ab8ff'), circ(118, 120, 9, '#5ab8ff'), rect(92, 114, 16, 10, INK, 3),
            hand(58, 140, SKINS[0]), hand(142, 140, SKINS[0]), path('M90 152 Q100 148 110 152', 'none')]


# =====================================================================================================  NEW LEGENDARIES
@reg('sponsoredstreamer', 'Sponsored Streamer', 'Legend')
def _():
    return person(2, 'fringe', 'purple', 'jersey', '#5ab8ff', eyes='wink', mouth='grin', hat='headset', hatc=PINK,
                  front=[rect(70, 152, 16, 10, Y, 3), rect(116, 152, 16, 10, PINK, 3)],
                  prop=[can(140, 96, LIME, -14, PINK), hand(152, 144, SKINS[2]), sparkle(176, 80, 8, Y), sparkle(130, 70, 5, W),
                        star(30, 60, 12), path('M20 92 L44 92 M24 102 L40 102', 'none')])


@reg('pensionfund', 'Pension Fund', 'Legend')
def _():
    return [ell(100, 132, 76, 56, PINK), circ(62, 78, 14, PINK), circ(138, 78, 14, PINK), ell(100, 146, 22, 16, '#ff6fa8'),
            dot(92, 146, 4), dot(108, 146, 4), *face(100, 112, .6, 'glasses', 'smile'), rect(84, 74, 32, 7, INK, 3),
            rect(44, 176, 16, 24, PINK, 4), rect(140, 176, 16, 24, PINK, 4),
            path('M176 120 Q194 110 186 96', 'none'), leaf(30, 40, 8, 18, -30, G), leaf(44, 34, 8, 18, 30, G), path('M38 50 L38 70', 'none'),
            coin(160, 56, 12), coin(178, 76, 8), path('M184 196 L184 120 Q184 108 172 110', 'none', ' stroke-width="7"'), path('M184 196 L184 120 Q184 108 172 110', 'none', ' stroke="#a0694a" stroke-width="3"')]


@reg('startupmonk', 'Startup Monk', 'Legend')
def _():
    return person(4, 'buzz', 'black', 'robe', '#ff8a3d', '#ffb347', eyes='calm', mouth='smirk',
                  front=[*[circ(84 + i * 6, 146 + abs(i - 2.5) * 3, 3.5, BROWN) for i in range(6)]],
                  prop=[*laptop(124, 132, 60, GREY, '#c6ffd8'), path('M136 156 L148 146 L156 152 L170 138', 'none', ' stroke="#2ecb6e" stroke-width="3"'),
                        circ(100, 40, 30, 'none', ' stroke="#ffc928" stroke-width="5"'), sparkle(30, 70, 8, Y), sparkle(40, 120, 5, W)])


@reg('coverband', 'Cover Band', 'Legend')
def _():
    return person(0, 'mohawk', 'pink', 'leather', LIL, eyes='stars', mouth='shout', extra=['earring'],
                  front=[*[sparkle(x, y, 4, Y) for x, y in [(70, 172), (130, 172), (100, 192)]]],
                  prop=[guitar(118, 168, 52, ORA), hand(104, 170, SKINS[0]), hand(166, 132, SKINS[0]),
                        lightning(30, 60, 1.4, Y), path('M22 118 L46 108 M24 136 L48 132', 'none')])
