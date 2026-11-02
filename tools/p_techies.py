from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


@reg('speedrunner', 'Speedrunner')
def _():
    return person(1, 'spiky', 'teal', 'hoodie', PUR, LIL, eyes='angry', mouth='teeth', hat='headset', hatc=LIME, extra=['sweat'],
                  prop=[circ(160, 150, 26, W), rect(154, 116, 12, 10, Y, 3), path('M160 150 L160 134 M160 150 L172 156'),
                        path('M140 128 L134 122 M180 128 L186 122'), hand(140, 172, SKINS[1]),
                        motion(14, 60, 3, 24)])


@reg('smartplug', 'Smart Plug')
def _():
    return [path('M100 150 Q100 190 150 196 Q190 200 196 180', 'none', ' stroke-width="8"'),
            path('M100 150 Q100 190 150 196 Q190 200 196 180', 'none', ' stroke="#ffffff" stroke-width="3"'),
            rect(50, 66, 100, 92, W, 26), rect(64, 140, 72, 24, GREY, 8),
            rect(76, 166, 10, 20, Y, 2), rect(114, 166, 10, 20, Y, 2),
            *face(100, 102, .8, 'open', 'smile'), circ(136, 80, 5, G),
            *wifi(172, 76, .8)]


@reg('lootbox', 'Loot Box')
def _():
    return [path('M30 70 L170 70 L188 50 L48 50 Z', '#fff2b0', ' stroke-width="0"'),
            *[path(f'M100 96 L{x} 40', 'none', ' stroke="#ffe08a" stroke-width="10"') for x in (40, 80, 120, 160)],
            rect(30, 108, 140, 86, '#c98a4a', 8), path('M30 132 L170 132'),
            path('M34 108 Q30 70 100 64 Q170 70 166 108 Z', '#e0a050'), path('M64 110 L64 194 M136 110 L136 194', 'none', ' stroke-width="0"'),
            rect(58, 66, 14, 128, Y, 3), rect(128, 66, 14, 128, Y, 3), rect(88, 120, 24, 26, Y, 4), dot(100, 132, 3.5),
            path('M90 80 Q90 68 100 68 Q112 68 110 80 Q108 86 100 90 L100 96', 'none', ' stroke-width="0"'),
            sparkle(30, 66, 10, Y), sparkle(172, 60, 8, W), sparkle(160, 164, 6, Y), sparkle(40, 172, 6, W),
            *face(100, 164, .5, 'happy', 'small')]


@reg('robotvacuum', 'Robot Vacuum')
def _():
    return [ell(100, 176, 82, 26, DGREY), ell(100, 164, 82, 26, GREY), ell(100, 160, 30, 10, INK), dot(130, 170, 4, G),
            gs([path('M60 120 L54 82 L78 100 Z', ORA), path('M140 120 L146 82 L122 100 Z', ORA),
                 ell(100, 128, 48, 36, ORA), ell(100, 150, 50, 22, ORA),
                 *face(100, 124, .8, 'happy', 'cat'),
                 path('M60 128 L40 124 M60 136 L40 140 M140 128 L160 124 M140 136 L160 140')], 'translate(10 -14) scale(.9)'),
            path('M150 150 Q190 140 186 108 Q182 98 176 106', 'none', ' stroke-width="0"'),
            motion(4, 160, 3, 20)]


@reg('toxicteammate', 'Toxic Teammate')
def _():
    return person(0, 'spiky', 'green', 'hoodie', INK, DGREY, eyes='angry', mouth='shout', hat='headset', hatc=G,
                  prop=[circ(160, 70, 10, LIME), circ(176, 92, 7, LIME), circ(164, 108, 5, LIME), circ(28, 76, 8, LIME), circ(36, 100, 5, LIME),
                        path('M160 66 L156 62 M164 74 L160 70'),
                        rect(130, 160, 60, 30, GREY, 6), path('M140 168 L148 168 M156 168 L164 168 M172 168 L180 168 M140 178 L180 178')])


@reg('firmware', 'Firmware Update')
def _():
    return [*screen(26, 54, 148, 112, '#ffe9a8', INK, True), *face(100, 92, .8, 'sad', 'wavy'),
            rect(46, 136, 108, 14, W, 7), rect(46, 136, 20, 14, G, 7),
            path('M156 60 Q164 72 160 80 Q152 80 156 60 Z', SKY),
            path('M28 186 L172 186'), circ(176, 50, 14, Y), path('M170 50 L182 50 M176 44 L176 56', 'none', ' stroke="#2b2140"')]


@reg('ragequitter', 'Rage Quitter')
def _():
    return person(3, 'messy', 'red', 'tee', RED, eyes='angry', mouth='shout', extra=['sweat'],
                  back=[g([rect(0, 0, 64, 22, GREY, 4), path('M8 6 L16 6 M22 6 L30 6 M36 6 L44 6 M50 6 L58 6 M8 14 L56 14')], 'translate(8 74) rotate(-30)'),
                        g([rect(0, 0, 64, 22, GREY, 4), path('M8 6 L16 6 M22 6 L30 6 M36 6 L44 6 M50 6 L58 6 M8 14 L56 14')], 'translate(130 44) rotate(30)')],
                  prop=[hand(30, 108, SKINS[3]), hand(168, 108, SKINS[3]), path('M90 48 L86 40 M100 46 L100 38 M110 48 L114 40')])


@reg('smartfridge', 'Smart Fridge')
def _():
    return [rect(44, 44, 112, 170, W, 16), path('M44 108 L156 108'), rect(138, 60, 8, 34, GREY, 3), rect(138, 124, 8, 40, GREY, 3),
            rect(60, 56, 64, 44, INK, 8), rect(64, 60, 56, 36, SKY, 5), *face(92, 74, .5, 'happy', 'smile'),
            rect(62, 128, 18, 18, Y, 3, ' transform="rotate(-10 71 137)"'), circ(110, 140, 9, RED), star(94, 170, 9, PINK),
            *wifi(176, 60, .7)]


@reg('esportscoach', 'E-Sports Coach')
def _():
    return person(4, 'short', 'black', 'jersey', SKY, eyes='open', mouth='open', hat='cap', hatc=INK, brows='angry', extra=['stubble'],
                  front=[path('M80 140 L96 162', 'none'), circ(98, 166, 6, Y)],
                  prop=[rect(136, 120, 52, 70, '#e8b878', 4), rect(142, 128, 40, 56, W, 2),
                        path('M150 140 L156 146 M156 140 L150 146 M168 168 L174 174 M174 168 L168 174'),
                        circ(168, 142, 5, 'none'), path('M152 172 Q160 150 166 146', 'none', ' stroke-dasharray="3 5"'),
                        hand(140, 176, SKINS[4])])


@reg('nchheadphones', 'Noise-Cancelling Headphones')
def _():
    return person(2, 'bun', 'dark', 'hoodie', TEAL, W, eyes='calm', mouth='smile',
                  front=[path('M50 88 Q48 26 100 26 Q152 26 150 88', 'none', ' stroke-width="0"'),
                         path('M54 88 Q52 40 100 40 Q148 40 146 88', 'none'),
                         rect(40, 68, 28, 46, INK, 12), rect(132, 68, 28, 46, INK, 12), rect(46, 76, 16, 30, PINK, 7), rect(138, 76, 16, 30, PINK, 7)],
                  prop=[path('M10 60 Q20 52 14 44 M20 76 Q30 70 24 62', 'none'), path('M176 52 Q186 46 180 36 M184 70 Q194 62 188 54'),
                        path('M8 60 L28 76 M172 36 L192 56', 'none', ' stroke="#ff6b5e" stroke-width="6"')])


@reg('leaderboard', 'Leaderboard')
def _():
    o = [rect(30, 46, 140, 160, INK, 12), rect(38, 58, 124, 140, PUR, 6)]
    for i, (c, w) in enumerate([(Y, 104), (GREY, 84), (ORA, 66)]):
        y = 70 + i * 42
        o += [rect(48, y, w, 30, c, 6), circ(64, y + 15, 9, W), path(f'M84 {y + 15} L{48 + w - 12} {y + 15}')]
    o += [path('M150 40 L146 18 L158 28 L166 14 L174 28 L186 18 L182 40 Z', Y), sparkle(24, 64, 8, Y), sparkle(184, 120, 7, W)]
    return o


@reg('smarthub', 'Smart Home Hub')
def _():
    return [path('M58 92 Q58 72 100 72 Q142 72 142 92 L142 182 Q142 200 100 200 Q58 200 58 182 Z', '#e6e0f0'),
            ell(100, 92, 42, 16, DGREY), ell(100, 90, 32, 10, TEAL, ' stroke-width="0"'), ell(100, 90, 32, 10, 'none'),
            *face(100, 140, .8, 'open', 'smile'),
            path('M66 186 Q100 196 134 186', 'none', ' stroke-dasharray="2 8"'),
            *wifi(100, 56, .9), circ(28, 132, 14, Y), path('M24 140 L24 148 L32 148 L32 140'), rect(162, 116, 28, 34, W, 6), dot(176, 130, 4, G),
            path('M42 132 L58 136 M162 133 L142 136', 'none', ' stroke-dasharray="2 6"')]


@reg('progamer', 'Pro Gamer')
def _():
    return person(5, 'buzz', 'black', 'jersey', RED, eyes='open', mouth='smirk', hat='headset', hatc=TEAL, brows='flat',
                  back=[path('M40 206 L40 60 Q40 34 100 34 Q160 34 160 60 L160 206 Z', INK), path('M58 60 L58 140 M142 60 L142 140', 'none', ' stroke="#ff6b5e" stroke-width="6"')],
                  prop=[path('M118 168 Q118 152 136 152 L172 152 Q190 152 190 168 Q192 190 178 190 Q170 190 166 180 L142 180 Q138 190 130 190 Q116 190 118 168 Z', DGREY),
                        path('M132 164 L132 172 M128 168 L136 168'), dot(172, 162, 3, G), dot(180, 170, 3, RED)])


@reg('quantum', 'Quantum Computer')
def _():
    gold = '#ffd36b'
    return [path('M100 30 L100 60'),
            ell(100, 64, 64, 12, gold), path('M48 66 L56 104 M80 74 L84 104 M120 74 L116 104 M152 66 L144 104', 'none'),
            ell(100, 106, 50, 10, gold), path('M60 108 L68 140 M90 114 L92 140 M110 114 L108 140 M140 108 L132 140'),
            ell(100, 142, 36, 8, gold), path('M74 144 L84 170 M126 144 L116 170'), ell(100, 172, 22, 10, gold),
            path('M88 182 Q100 196 112 182', 'none'), *face(100, 116, .45, 'calm', 'small', blush=False),
            sparkle(30, 90, 9, SKY), sparkle(170, 120, 8, SKY), sparkle(40, 160, 6, LIL), sparkle(168, 60, 6, W)]


@reg('worldrecord', 'World Record')
def _():
    return person(2, 'ponytail', 'ginger', 'jersey', Y, eyes='happy', mouth='grin', hat='headset', hatc=PINK,
                  prop=[path('M140 122 L184 122 L180 148 Q176 166 162 166 Q148 166 144 148 Z', Y), rect(156, 166, 12, 14, Y, 2), rect(146, 178, 32, 10, Y, 3),
                        path('M140 128 Q126 128 128 140 Q130 150 144 148 M184 128 Q198 128 196 140 Q194 150 180 148'), star(162, 140, 7, W),
                        hand(142, 186, SKINS[2]), sparkle(30, 70, 10, Y), sparkle(184, 80, 7, W),
                        *[rect(x, y, 6, 12, c, 2, f' transform="rotate({r} {x} {y})"') for x, y, c, r in [(20, 120, PINK, 30), (40, 56, SKY, -30), (176, 100, G, 30)]]])


TRIBE = 'Techie'
