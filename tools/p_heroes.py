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



@reg('h_daytrader', 'The Day Trader')
def _():
    chart = [rect(10, 34, 64, 52, INK, 8), path('M18 76 L30 62 L40 70 L52 50 L66 44', 'none', f' stroke="{G}" stroke-width="4"'),
             path('M58 42 L68 42 L68 52', 'none', f' stroke="{G}" stroke-width="4"'), path('M18 56 L30 64', 'none', f' stroke="{RED}" stroke-width="4"')]
    return person(1, 'slick', 'brown', 'suit', '#3a5a8a', RED, eyes='wide', mouth='grin', brows='up', extra=['sweat'],
                  back=chart,
                  prop=[phone(142, 112, 32, 54, INK, '#d6f5df', -10, [path('M150 150 L158 138 L164 144 L172 128', 'none', f' stroke="{G}" stroke-width="3"')]),
                        hand(150, 164, SKINS[1]), coin(176, 70, 9), coin(186, 92, 7)])


@reg('h_overachiever', 'The Overachiever')
def _():
    return person(2, 'ponytail', 'black', 'cardigan', '#ffb547', W, eyes='happy', mouth='grin', extra=['freckles'],
                  front=[circ(84, 160, 10, Y), path('M80 168 L76 186 L84 180 L90 188 L88 168', RED)],
                  prop=[g([rect(0, 0, 44, 56, W, 4), path('M8 12 L30 12 M8 22 L34 22 M8 32 L26 32'), path('M18 44 Q22 36 28 44 Q32 50 36 40', 'none', f' stroke="{RED}" stroke-width="3"')], 'translate(138 108) rotate(8)'),
                        star(168, 112, 13, Y), hand(146, 170, SKINS[2]), star(26, 70, 9, Y), star(42, 50, 6, Y), sparkle(180, 70, 7, W)])


@reg('h_collector', 'The Collector')
def _():
    shelf = [rect(4, 100, 52, 6, BROWN, 2), rect(10, 70, 16, 30, '#ffd84a', 3), circ(18, 64, 8, '#ffd84a'), rect(32, 78, 18, 22, PINK, 3)]
    return person(3, 'buzz', 'dark', 'tee', DGREY, eyes='stars', mouth='open', hat='capback', hatc=PUR, extra=['earring'],
                  back=shelf,
                  prop=[g([rect(0, 0, 50, 34, W, 4), path('M0 22 Q25 14 50 22', 'none'), path('M6 30 Q26 6 46 22 L46 30 Z', '#ffd84a')], 'translate(138 130) rotate(-8)'),
                        hand(144, 170, SKINS[3]), sparkle(172, 104, 8, Y), sparkle(150, 96, 5, W)])


@reg('h_networker', 'The Networker')
def _():
    return person(0, 'swoop', 'blonde', 'suit', '#5a6fb8', W, eyes='open', mouth='grin', extra=['earring'],
                  front=[rect(84, 152, 30, 20, W, 3), path('M90 159 L108 159 M90 165 L102 165')],
                  prop=[g([rect(0, 0, 40, 24, W, 3), path('M7 8 L26 8 M7 16 L20 16'), circ(32, 12, 4, '#5a6fb8')], 'translate(140 110) rotate(-12)'),
                        g([rect(0, 0, 40, 24, Y, 3), path('M7 8 L26 8 M7 16 L20 16'), circ(32, 12, 4, RED)], 'translate(148 132) rotate(6)'),
                        hand(150, 160, SKINS[0]), circ(30, 56, 9, SKY), circ(22, 88, 7, PINK), circ(48, 76, 7, LIME), path('M30 56 L22 88 M30 56 L48 76 M22 88 L48 76', 'none')])


@reg('h_prepper', 'The Prepper')
def _():
    cans = [rect(4 + 18 * i, 160 - 20 * j, 16, 20, c, 3) for i, j, c in [(0, 0, RED), (1, 0, G), (2, 0, Y), (0, 1, SKY), (1, 1, RED)]]
    return person(4, 'buzz', 'black', 'vest', '#8a9a5a', '#6b7a44', eyes='open', mouth='flat', brows='angry', hat='bandana', hatc='#6b7a44', extra=['beard'],
                  back=cans,
                  prop=[rect(140, 112, 44, 56, '#c98a4a', 6), path('M140 130 L184 130'), rect(154, 104, 16, 10, '#a86b45', 3),
                        circ(162, 148, 9, '#ffd84a'), path('M157 148 L167 148 M162 143 L162 153'), hand(144, 168, SKINS[4])])


@reg('h_trendchaser', 'The Trend Chaser')
def _():
    return person(3, 'pigtails', 'teal', 'puffer', '#ff9ec7', W, eyes='hearts', mouth='open', extra=['nosering'],
                  prop=[rect(136, 120, 48, 52, W, 6), path('M136 132 L184 132'), path('M148 120 Q150 104 160 104 Q170 104 172 120', 'none'), heart(160, 152, .7, RED),
                        hand(140, 170, SKINS[3]), phone(10, 70, 30, 50, INK, SKY, -12, [path('M18 92 L30 88 M18 100 L28 98', 'none')]),
                        sparkle(44, 56, 7, Y), sparkle(186, 96, 6, W), path('M46 130 L56 122 M44 142 L58 142')])


TRIBE = 'Hero'
