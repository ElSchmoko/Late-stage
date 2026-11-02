from artkit import *

ART = {}


def reg(slug, name):
    def deco(fn):
        ART[name] = (slug, fn)
        return fn
    return deco


@reg('h_gymbro', 'The Gym Bro')
def _():
    return person(3, 'buzz', 'black', 'tank', RED, eyes='open', mouth='grin', hat='headband', hatc=SKY, brows='flat',
                  prop=[rect(132, 150, 60, 10, DGREY, 4), rect(132, 136, 12, 38, INK, 4), rect(180, 136, 12, 38, INK, 4), hand(162, 156, SKINS[3]),
                        rect(14, 140, 28, 46, PINK, 8), rect(16, 132, 24, 10, W, 4)])


@reg('h_procrastinator', 'The Procrastinator')
def _():
    return person(1, 'messy', 'brown', 'hoodie', LIL, W, eyes='tired', mouth='wavy', extra=['bags'],
                  prop=[phone(140, 128, 30, 50, INK, SKY, 10), hand(150, 176, SKINS[1]),
                        path('M150 70 L166 70 L150 86 L166 86 M172 56 L182 56 L172 66 L182 66', 'none')])


@reg('h_bargainhunter', 'The Bargain Hunter')
def _():
    return person(2, 'bob', 'grey', 'cardigan', TEAL, W, eyes='glasses', mouth='grin',
                  prop=[g([rect(0, 0, 54, 32, '#ffe9a8', 4, ' stroke-dasharray="6 5"'), path('M10 12 L30 12 M10 22 L22 22'), circ(42, 16, 7, RED)], 'translate(134 130) rotate(-10)'),
                        hand(140, 166, SKINS[2]), sparkle(30, 80, 8, Y)])


@reg('h_doomscroller', 'The Doomscroller')
def _():
    return person(0, 'messy', 'dark', 'hoodie', DGREY, GREY, eyes='wide', mouth='flat', extra=['bags'],
                  back=[path('M54 100 Q46 40 100 36 Q154 40 146 100 L150 150 L50 150 Z', DGREY)],
                  front=[path('M68 80 L132 80 L140 140 L60 140 Z', '#8fd4ff', ' opacity="0.25" stroke="none"')],
                  prop=[phone(84, 148, 32, 52, INK, SKY), hand(84, 186, SKINS[0]), hand(116, 186, SKINS[0])])


@reg('h_serial', 'The Serial Entrepreneur')
def _():
    return person(4, 'slick', 'black', 'vest', W, INK, eyes='open', mouth='grin', extra=['earring'], look=2,
                  front=[path('M64 100 Q70 118 90 116'), circ(92, 116, 3.5, INK)],
                  prop=[g([rect(0, 0, 40, 26, W, 3), path('M8 9 L28 9 M8 17 L22 17')], 'translate(136 120) rotate(-16)'),
                        g([rect(0, 0, 40, 26, Y, 3), path('M8 9 L28 9 M8 17 L22 17')], 'translate(146 140) rotate(4)'),
                        g([rect(0, 0, 40, 26, PINK, 3), path('M8 9 L28 9 M8 17 L22 17')], 'translate(140 160) rotate(18)'),
                        hand(146, 186, SKINS[4])])


@reg('h_overthinker', 'The Overthinker')
def _():
    return person(1, 'curly', 'ginger', 'turtle', SKY, eyes='open', mouth='wavy', brows='sad', look=-3,
                  prop=[circ(150, 76, 6, W), circ(164, 64, 9, W), bubble(146, 44, 50, 40, W),
                        path('M156 58 L166 58 M161 53 L161 63 M176 58 L186 58', 'none'), path('M156 72 L186 72'),
                        path('M84 132 L84 150', 'none', ' stroke-width="0"'), hand(78, 128, SKINS[1], 10)])


@reg('h_lifecoach', 'The Life Coach')
def _():
    return person(5, 'afro', 'black', 'suit', PINK, W, eyes='happy', mouth='grin',
                  prop=[rect(138, 116, 46, 62, '#e8b878', 4), rect(144, 124, 34, 50, W, 2), heart(161, 142, .8, RED), path('M150 162 L172 162'),
                        hand(140, 168, SKINS[5]), star(30, 76, 10, Y), sparkle(184, 92, 7, W)])


@reg('h_minimalist', 'The Minimalist')
def _():
    return person(0, 'bun', 'black', 'tee', W, eyes='calm', mouth='small',
                  prop=[*pot(150, 176, 24, 22, W), leaf(156, 166, 8, 4, -50), leaf(168, 166, 8, 4, 50)])


@reg('h_complainer', 'The Complainer')
def _():
    return person(0, 'combover', 'brown', 'shirt', Y, W, eyes='angry', mouth='open', extra=['stubble'],
                  prop=[path('M140 96 L176 96 L176 180 L170 186 L164 180 L158 186 L152 180 L146 186 L140 180 Z', W),
                        path('M148 110 L168 110 M148 122 L164 122 M148 134 L168 134 M148 146 L160 146 M148 160 L168 160'),
                        hand(142, 150, SKINS[0])])


@reg('h_ex', 'The Ex')
def _():
    return person(2, 'long', 'dark', 'leather', INK, eyes='open', mouth='smirk', brows='one', extra=['earring'],
                  front=[path('M70 54 L130 54 L128 64 Q116 70 104 62 L96 62 Q84 70 72 64 Z', INK)],
                  prop=[phone(144, 116, 30, 50, INK, PINK, 8), hand(152, 164, SKINS[2]),
                        *speech(130, 52, 64, 30, 1, W, 'left'), heart(180, 66, .5, RED)])


TRIBE = 'Hero'
