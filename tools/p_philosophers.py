from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


def bulb(cx, cy, s=1):
    return [path(f'M{cx - 12 * s} {cy} Q{cx - 12 * s} {cy - 18 * s} {cx} {cy - 18 * s} Q{cx + 12 * s} {cy - 18 * s} {cx + 12 * s} {cy} Q{cx + 12 * s} {cy + 6 * s} {cx + 6 * s} {cy + 12 * s} L{cx - 6 * s} {cy + 12 * s} Q{cx - 12 * s} {cy + 6 * s} {cx - 12 * s} {cy} Z', Y),
            rect(cx - 6 * s, cy + 12 * s, 12 * s, 8 * s, GREY, 2), path(f'M{cx - 20 * s} {cy - 18 * s} L{cx - 26 * s} {cy - 24 * s} M{cx + 20 * s} {cy - 18 * s} L{cx + 26 * s} {cy - 24 * s} M{cx} {cy - 26 * s} L{cx} {cy - 32 * s}')]


@reg('showerthinker', 'Shower Thinker')
def _():
    return person(2, 'short', 'brown', 'tank', W, eyes='up', mouth='o', hat='showercap', hatc=PINK,
                  prop=[circ(36, 130, 12, W), circ(26, 112, 8, W), circ(48, 104, 6, W), circ(166, 132, 10, W), circ(178, 116, 6, W),
                        *bulb(164, 74, .9),
                        g([ell(0, 10, 18, 12, Y), circ(12, -6, 10, Y), path('M20 -6 L30 -4 L20 0 Z', ORA), dot(14, -8, 2)], 'translate(158 180)')])


@reg('stoicpodcaster', 'Stoicism Podcaster')
def _():
    return person(0, 'buzz', 'brown', 'tee', INK, eyes='calm', mouth='flat', hat='headphones', hatc=DGREY, extra=['beard'],
                  prop=[path('M146 206 L146 160 L176 130', 'none', ' stroke-width="6"'), mic(176, 112, DGREY, 30),
                        rect(14, 64, 34, 20, RED, 10), dot(26, 74, 4, W), path('M34 70 L40 74 L34 78', 'none')])


@reg('nihilist', 'Nihilist')
def _():
    return person(0, 'slick', 'black', 'turtle', INK, eyes='tired', mouth='flat', hat='beret', hatc=INK, extra=['bags'],
                  prop=[*speech(132, 50, 60, 36, 0), dot(150, 68, 3.5), dot(162, 68, 3.5), dot(174, 68, 3.5),
                        path('M30 150 Q20 130 34 120 Q48 110 38 90', 'none', ' stroke="#c9c2d6" stroke-width="5"')])


@reg('coldplunge', 'Cold-Plunge Stoic')
def _():
    blue = '#cfe6f7'
    return [*person(1, 'topknot', 'dark', 'tank', blue, eyes='calm', mouth='flat', extra=['beard'], hat=None)[:],
            path('M10 150 L190 150 L178 206 L22 206 Z', SKY), path('M10 150 L190 150', 'none', ' stroke-width="0"'),
            rect(4, 144, 192, 14, W, 7), rect(30, 128, 22, 22, W, 4, ' transform="rotate(-14 41 139)"'),
            rect(146, 130, 24, 22, W, 4, ' transform="rotate(12 158 141)"'), rect(110, 156, 18, 16, W, 3),
            path('M30 70 Q24 76 30 82 Q36 88 30 94 M170 70 Q164 76 170 82 Q176 88 170 94', 'none')]


@reg('pubphilosopher', 'Pub Philosopher')
def _():
    return person(0, 'sides', 'ginger', 'cardigan', '#7a9a5a', W, eyes='happy', mouth='open', extra=['mustache'],
                  front=[circ(100, 104, 6, '#ff9a8a')],
                  prop=[path('M140 120 L176 120 L172 186 L144 186 Z', '#ffc95a'), path('M140 120 Q144 108 158 112 Q170 104 178 116 L176 124 L140 124 Z', W),
                        path('M178 136 Q192 138 190 152 Q188 166 174 164'), hand(146, 176, SKINS[0]),
                        path('M40 130 L40 92', 'none', ' stroke-width="8"'), circ(40, 132, 10, SKINS[0]), dot(40, 82, 6, SKINS[0])])


@reg('marathonmonk', 'Marathon Monk')
def _():
    return person(3, 'bald', 'black', 'toga', ORA, '#ffb27a', eyes='calm', mouth='smile', hat='headband', hatc=RED, extra=['sweat'],
                  front=[rect(76, 164, 48, 32, W, 4), path('M86 174 L114 174 M86 184 L106 184')],
                  prop=[motion(8, 120, 3, 26), motion(160, 160, 2, 24)])


@reg('thoughtexperiment', 'Thought Experiment')
def _():
    return [path('M30 120 L170 120 L170 206 L30 206 Z', '#e8b878'), path('M30 120 L10 96 L60 96 L80 120 Z', '#f2c78e'),
            path('M170 120 L190 96 L140 96 L120 120 Z', '#f2c78e'),
            path('M66 122 L60 92 L82 108 Z', GREY), path('M134 122 L140 92 L118 108 Z', GREY),
            path('M58 124 Q58 96 100 96 Q142 96 142 124 Z', GREY),
            circ(84, 112, 8, W), dot(85, 113, 3), path('M110 106 L122 118 M122 106 L110 118'),
            path('M94 120 Q100 124 106 120'), rect(52, 150, 96, 26, W, 3), path('M60 163 L140 163'),
            path('M84 46 Q84 34 100 34 Q116 34 116 46 Q116 56 104 60 L104 68', 'none', ' stroke-width="0"'),
            path('M86 60 Q86 46 100 46 Q114 46 114 58 Q114 66 102 70 L102 78'), dot(102, 88, 3.5)]


@reg('keynote', 'Keynote Speaker')
def _():
    return person(1, 'short', 'grey', 'turtle', INK, eyes='glasses', mouth='smile', extra=['stubble'],
                  back=[rect(126, 44, 74, 56, W, 4), *bulb(162, 72, .7)],
                  front=[path('M64 100 Q70 118 90 116'), circ(92, 116, 3.5, INK)],
                  prop=[rect(144, 140, 16, 30, DGREY, 5), dot(152, 148, 3, RED), hand(150, 172, SKINS[1])])


@reg('bookclubstoic', 'Book-Club Stoic')
def _():
    return person(4, 'bob', 'grey', 'cardigan', '#b18cff', W, eyes='glasses', mouth='smile',
                  prop=[book(20, 140, 52, 40, TEAL, -6), hand(68, 168, SKINS[4]),
                        path('M150 112 L180 112 Q182 136 165 140 Q148 136 150 112 Z', '#c0405a'), path('M165 140 L165 168 M154 170 L176 170'),
                        hand(156, 160, SKINS[4])])


@reg('utilitarian', 'Utilitarian')
def _():
    return person(2, 'short', 'brown', 'shirt', W, SKY, eyes='open', mouth='wavy', brows='sad', extra=['sweat'],
                  back=[path('M140 206 L170 150', 'none', ' stroke-width="7"'), circ(172, 146, 9, RED), rect(126, 196, 44, 10, DGREY, 3)],
                  prop=[hand(160, 160, SKINS[2]),
                        rect(14, 140, 40, 54, GREY, 5), rect(20, 146, 28, 12, LIME, 2), *[rect(20 + c * 10, 164 + r * 10, 7, 7, W, 1) for c in range(3) for r in range(2)]])


@reg('deserthermit', 'Desert Hermit')
def _():
    return person(3, 'long', 'grey', 'robe', '#d8c4a8', '#c0a880', eyes='calm', mouth='none', extra=['longbeard'],
                  back=[circ(170, 60, 18, Y), path('M150 60 L140 60 M190 60 L198 60 M170 40 L170 32')],
                  prop=[rect(154, 70, 8, 140, BROWN, 3), circ(158, 66, 8, BROWN), hand(158, 140, SKINS[3]),
                        g([rect(-10, -40, 20, 46, G, 10), rect(-26, -30, 12, 24, G, 6), rect(14, -24, 12, 20, G, 6)], 'translate(30 206)')])


@reg('cynic', 'The Cynic')
def _():
    return person(0, 'sides', 'grey', 'tank', '#d8c4a8', eyes='open', mouth='frown', brows='one', extra=['beard'], look=-3,
                  front=[path('M28 140 L172 140 Q182 176 168 206 L32 206 Q18 176 28 140 Z', BROWN), path('M24 158 Q100 168 176 158 M24 190 Q100 200 176 190'),
                         ell(100, 140, 72, 10, '#d8a06a')],
                  prop=[path('M160 140 L166 120'), rect(152, 86, 30, 36, Y, 5), path('M152 98 L182 98 M152 110 L182 110'),
                        path('M160 86 Q167 74 174 86'), circ(167, 104, 5, ORA, ' stroke="none"')])


@reg('bestseller', 'Bestselling Author')
def _():
    return person(1, 'swoop', 'blonde', 'turtle', TEAL, eyes='sqglasses', mouth='smirk',
                  front=[path('M76 140 Q100 158 124 140 L130 150 L124 186 L116 152 Q100 160 84 152 Z', RED)],
                  prop=[book(134, 104, 50, 66, PUR, 6), star(164, 128, 12, Y), path('M142 160 L172 160', 'none'), hand(140, 166, SKINS[1]),
                        sparkle(28, 72, 8, Y), sparkle(184, 86, 6, W)])


@reg('unifiedtheory', 'Grand Unified Theory')
def _():
    return person(0, 'curly', 'white', 'cardigan', '#a07a5a', W, eyes='wide', mouth='o', brows='up', extra=['mustache'],
                  back=[rect(-4, 40, 208, 120, '#2e5a4a', 6), rect(-4, 40, 208, 120, 'none', 6),
                        path('M8 60 Q16 52 22 62 Q28 72 34 60 M8 82 L40 82 M16 74 L16 90 M10 104 Q24 96 38 106', 'none', ' stroke="#ffffff" stroke-width="3"'),
                        path('M150 62 L170 62 M160 54 L160 70 M150 88 Q160 78 172 90 Q182 100 190 86 M154 112 L188 112 M160 120 L180 120', 'none', ' stroke="#ffffff" stroke-width="3"'),
                        circ(178, 136, 9, 'none', ' stroke="#ffffff" stroke-width="3"')],
                  prop=[rect(144, 150, 8, 22, W, 2, ' transform="rotate(30 148 161)"'), hand(150, 170, SKINS[0])])


@reg('guru', 'Enlightened Guru')
def _():
    o = [circ(100, 110, 88, '#fff2b0', ' stroke-width="0"'), circ(100, 110, 88, 'none', ' stroke-dasharray="2 12"'),
         circ(100, 110, 74, 'none', ' stroke-dasharray="2 12"')]
    o += person(3, 'topknot', 'black', 'robe', W, ORA, eyes='calm', mouth='smile', extra=['beard'])
    o += [path('M92 168 L100 146 L108 168 Z', SKINS[3]), path('M82 150 Q100 186 118 150', 'none'),
          *[dot(100 + 18 * __import__('math').cos(a / 10), 162 + 14 * __import__('math').sin(a / 10), 3, RED) for a in range(0, 31, 4)],
          ell(100, 202, 70, 10, '#cfe6f7'), sparkle(30, 70, 7, W), sparkle(170, 64, 7, W)]
    return o


TRIBE = 'Philosopher'
