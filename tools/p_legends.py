from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


def coin(x, y, r=10):
    return [circ(x, y, r, Y), path(f'M{x} {y - r * .5} L{x} {y + r * .5}')]


@reg('billionaire', 'The Billionaire')
def _():
    return person(0, 'slick', 'grey', 'suit', INK, eyes='shades', mouth='smile', hat='tophat', hatc=INK,
                  prop=[*coin(30, 70, 12), *coin(170, 60, 10), *coin(160, 150, 12), rect(14, 150, 40, 26, G, 4), path('M22 163 L46 163')])


@reg('cancelled', 'Cancelled Celebrity')
def _():
    return person(3, 'long', 'blonde', 'leather', PINK, eyes='shades', mouth='o', extra=['earring'],
                  prop=[path('M24 40 L64 80 M64 40 L24 80', 'none', ' stroke-width="9" stroke="#ff6b5e"'),
                        rect(140, 50, 44, 30, W, 8), path('M148 60 L176 60 M148 70 L166 70'), path('M150 80 L146 92 L160 80')])


@reg('apexcrow', 'Apex Scavenger')
def _():
    return [path('M44 206 Q36 140 80 118 L124 118 Q170 140 160 206 Z', INK),
            path('M60 136 Q20 160 22 204 Q58 186 80 150 Z', PUR), path('M140 136 Q180 160 178 204 Q142 186 120 150 Z', PUR),
            circ(100, 88, 42, INK), circ(84, 82, 11, W), circ(116, 82, 11, W), dot(86, 84, 5), dot(118, 84, 5),
            path('M86 98 L136 112 L88 116 Z', GREY), path('M66 50 L76 66 L86 46 L96 62 L104 42 L112 62 L122 46 L130 66 L140 50 L136 72 L70 72 Z', Y),
            *coin(162, 182, 9), rect(20, 176, 28, 22, SKY, 3)]


@reg('popdiva', 'Pop Diva')
def _():
    return person(4, 'afro', 'black', 'sash', PINK, eyes='stars', mouth='o', extra=['earring'],
                  prop=[mic(150, 112, Y, -20), path('M24 56 L30 70 L44 72 L34 82 L36 96 L24 88 L12 96 L14 82 L4 72 L18 70 Z', Y),
                        path('M172 40 L176 50 L186 52 L178 58 L180 68 L172 62 L164 68 L166 58 L158 52 L168 50 Z', Y)])


@reg('algorithm', 'The Algorithm')
def _():
    return [rect(46, 60, 108, 100, DGREY, 22), rect(60, 76, 80, 52, SKY, 10), circ(84, 100, 9, W), circ(116, 100, 9, W), dot(84, 101, 4), dot(116, 101, 4),
            path('M86 116 Q100 124 114 116'), path('M100 60 L100 36'), circ(100, 30, 8, RED),
            rect(66, 160, 68, 40, PUR, 8), path('M24 92 L46 92 M154 92 L176 92 M24 120 L46 120 M154 120 L176 120'),
            circ(20, 92, 5, Y), circ(180, 92, 5, Y), circ(20, 120, 5, G), circ(180, 120, 5, G), path('M80 176 L120 176 M80 188 L108 188', 'none')]


@reg('mohawklegend', 'Mohawk Legend')
def _():
    return person(1, 'mohawk', 'pink', 'leather', INK, eyes='angry', mouth='open', extra=['nosering', 'scar'],
                  prop=[path('M20 60 L36 40 L32 58 L50 52 L30 78 Z', Y), path('M160 50 L182 66 M166 80 L188 76 M164 36 L180 24', 'none', ' stroke-width="6"')])


@reg('renaissance', 'Renaissance Thinker')
def _():
    return person(2, 'curly', 'brown', 'robe', LIL, eyes='calm', mouth='smile', hat='beret', hatc=RED, extra=['longbeard'],
                  prop=[rect(14, 120, 40, 52, CREAM, 4), path('M22 134 L46 134 M22 146 L42 146 M22 158 L46 158'),
                        circ(164, 64, 18, SKY), path('M150 64 L178 64 M164 50 Q154 64 164 78 Q174 64 164 50'), *[]])


@reg('techfounder', 'Tech Founder')
def _():
    return person(0, 'messy', 'ginger', 'hoodie', DGREY, eyes='sqglasses', mouth='smile', extra=['stubble'],
                  prop=[rect(136, 132, 50, 34, SKY, 4), path('M130 170 L192 170'), *coin(30, 60, 11), *coin(46, 90, 9), circ(161, 149, 6, W)])


@reg('contentcreator', 'Content Creator')
def _():
    return person(3, 'bun', 'dark', 'overalls', SKY, eyes='wink', mouth='smile', extra=['freckles'],
                  prop=[rect(18, 98, 24, 40, INK, 6), circ(30, 108, 5, SKY), path('M148 180 L176 96', 'none', ' stroke-width="7" stroke="#c98a4a"'),
                        path('M176 96 L182 80 L170 90 Z', RED), path('M150 44 Q150 34 160 36 Q170 34 170 44 Q170 52 160 58 Q150 52 150 44 Z', RED)])


@reg('wiseowl', 'Wise Old Owl')
def _():
    return [path('M50 206 Q40 130 100 110 Q160 130 150 206 Z', BROWN), path('M74 206 Q70 150 100 140 Q130 150 126 206 Z', CREAM),
            circ(100, 86, 50, BROWN), path('M58 46 L66 70 L78 52 Z', DBROWN), path('M142 46 L134 70 L122 52 Z', DBROWN),
            circ(80, 88, 17, CREAM), circ(120, 88, 17, CREAM), circ(80, 88, 15, 'none'), circ(120, 88, 15, 'none'), path('M95 88 L105 88'),
            dot(80, 90, 6), dot(120, 90, 6), path('M94 104 L106 104 L100 116 Z', ORA),
            rect(140, 176, 46, 26, LIL, 3), path('M30 196 L36 184 M40 198 L44 186', 'none', ' stroke="#2ecb6e" stroke-width="6"')]


@reg('punkphilosopher', 'Punk Philosopher')
def _():
    return person(5, 'spiky', 'ginger', 'toga', W, eyes='tired', mouth='flat', extra=['longbeard', 'nosering'],
                  prop=[ell(160, 160, 26, 40, BROWN), path('M136 140 L184 140 M136 172 L184 172', 'none'),
                        path('M18 50 L58 50 L58 82 L18 82 Z', RED), path('M26 60 L50 72 M50 60 L26 72', 'none', ' stroke="#ffffff"')])
