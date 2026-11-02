"""Late Stage art kit: sticker-ink portraits on a 200x200 canvas.

Every drawing is a list of SVG shape strings. `sticker()` wraps them so the
shape group is drawn twice: a thick white outline (the sticker edge) and the
ink line on top. Fills come from the shapes, strokes from the two <use>s.
"""

INK = '#2b2140'
Y, G, SKY, PINK, RED, PUR = '#ffc928', '#2ecb6e', '#8fd4ff', '#ff8ab8', '#ff6b5e', '#4a3d6a'
ORA, TEAL, LIL, LIME, GREY, DGREY = '#ff8a3d', '#4fd1c5', '#b18cff', '#b5e05a', '#c9c2d6', '#6b6182'
W, CREAM, BROWN, DBROWN, BLUSH = '#ffffff', '#fff6dc', '#c98a4a', '#8a5a3a', '#ff9a8a'
SKINS = ['#f7d9a4', '#f2c39a', '#e8b48a', '#c98a5e', '#a86b45', '#7a4a2e']
HAIR = {'blonde': '#ffd36b', 'brown': '#8a5a3a', 'dark': '#4a3d6a', 'black': '#2b2140', 'ginger': '#ff8a3d',
        'grey': '#d8d2e2', 'pink': '#ff8ab8', 'teal': '#4fd1c5', 'green': '#2ecb6e', 'purple': '#b18cff',
        'red': '#ff6b5e', 'white': '#ffffff'}


def sticker(parts):
    body = '\n'.join(p for p in parts if p)
    return ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200">\n'
            '<defs>\n<g id="a" stroke-linejoin="round" stroke-linecap="round">\n' + body + '\n</g>\n</defs>\n'
            '<use href="#a" xlink:href="#a" stroke="#ffffff" stroke-width="16"/>\n'
            '<use href="#a" xlink:href="#a" stroke="#2b2140" stroke-width="5"/>\n</svg>\n')


# ---------- primitives ----------
def path(d, fill='none', extra=''):
    return f'<path d="{d}" fill="{fill}"{extra}/>'


def circ(cx, cy, r, fill='none', extra=''):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"{extra}/>'


def ell(cx, cy, rx, ry, fill='none', extra=''):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"{extra}/>'


def rect(x, y, w, h, fill='none', rx=0, extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{extra}/>'


def dot(cx, cy, r, fill=INK):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="none"/>'


def g(parts, t):
    return f'<g transform="{t}">' + '\n'.join(p for p in parts if p) + '</g>'


def star(cx, cy, r, fill=Y, k=0.45):
    import math
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * k
        pts.append(f'{cx + rr * math.cos(a):.1f} {cy + rr * math.sin(a):.1f}')
    return path('M' + ' L'.join(pts) + ' Z', fill)


def sparkle(cx, cy, r=7, fill=W):
    return path(f'M{cx} {cy - r} Q{cx + r * .2} {cy - r * .2} {cx + r} {cy} Q{cx + r * .2} {cy + r * .2} {cx} {cy + r} '
                f'Q{cx - r * .2} {cy + r * .2} {cx - r} {cy} Q{cx - r * .2} {cy - r * .2} {cx} {cy - r} Z', fill)


def heart(cx, cy, s=1, fill=PINK):
    return path(f'M{cx} {cy + 9 * s} Q{cx - 12 * s} {cy} {cx - 10 * s} {cy - 6 * s} Q{cx - 7 * s} {cy - 12 * s} {cx} {cy - 6 * s} '
                f'Q{cx + 7 * s} {cy - 12 * s} {cx + 10 * s} {cy - 6 * s} Q{cx + 12 * s} {cy} {cx} {cy + 9 * s} Z', fill)


def coin(cx, cy, r=9):
    return circ(cx, cy, r, Y) + circ(cx, cy, r * .5, 'none')


def hand(cx, cy, skin, r=10):
    return circ(cx, cy, r, skin)


def bubble(x, y, w, h, fill=W, tail='left'):
    tx = x + 14 if tail == 'left' else x + w - 14
    td = -10 if tail == 'left' else 10
    return path(f'M{x + 10} {y} L{x + w - 10} {y} Q{x + w} {y} {x + w} {y + 10} L{x + w} {y + h - 10} Q{x + w} {y + h} {x + w - 10} {y + h} '
                f'L{tx + 8} {y + h} L{tx + td} {y + h + 10} L{tx} {y + h} L{x + 10} {y + h} Q{x} {y + h} {x} {y + h - 10} '
                f'L{x} {y + 10} Q{x} {y} {x + 10} {y} Z', fill)


# ---------- faces ----------
def face(cx=100, cy=92, s=1.0, eyes='open', mouth='smile', blush=True, brows=None, skin=None, look=0):
    """Eyes centred at cy, mouth below. s scales the spacing (1.0 = human head)."""
    o = []
    ex, er, pr = 15 * s, 11.5 * s, 3.8 * s
    L, R = cx - ex, cx + ex
    if eyes in ('open', 'look', 'wide', 'tired', 'glasses', 'sqglasses', 'angry', 'sad', 'up'):
        o += [circ(L, cy, er, W), circ(R, cy, er, W)]
        pdx = look * s
        pdy = 1.5 * s if eyes != 'up' else -3 * s
        rr = pr * (.8 if eyes == 'wide' else 1)
        o += [dot(L + 1 * s + pdx, cy + pdy, rr), dot(R + 1 * s + pdx, cy + pdy, rr)]
        if eyes == 'tired':
            sk = skin or SKINS[0]
            o += [path(f'M{L - er} {cy} Q{L} {cy - er * 1.4} {L + er} {cy} Z', sk),
                  path(f'M{R - er} {cy} Q{R} {cy - er * 1.4} {R + er} {cy} Z', sk)]
        if eyes == 'glasses':
            o += [circ(L, cy, er + 3 * s, 'none'), circ(R, cy, er + 3 * s, 'none'),
                  path(f'M{L + er + 3 * s} {cy} L{R - er - 3 * s} {cy}')]
        if eyes == 'sqglasses':
            q = er + 3 * s
            o += [rect(L - q, cy - q * .8, 2 * q, q * 1.6, 'none', 5 * s), rect(R - q, cy - q * .8, 2 * q, q * 1.6, 'none', 5 * s),
                  path(f'M{L + q} {cy} L{R - q} {cy}')]
        if eyes == 'angry' and brows is None:
            brows = 'angry'
        if eyes == 'sad' and brows is None:
            brows = 'sad'
    elif eyes == 'happy':
        o += [path(f'M{L - 7 * s} {cy + 3 * s} Q{L} {cy - 7 * s} {L + 7 * s} {cy + 3 * s}'),
              path(f'M{R - 7 * s} {cy + 3 * s} Q{R} {cy - 7 * s} {R + 7 * s} {cy + 3 * s}')]
    elif eyes == 'calm':
        o += [path(f'M{L - 7 * s} {cy} Q{L} {cy + 6 * s} {L + 7 * s} {cy}'),
              path(f'M{R - 7 * s} {cy} Q{R} {cy + 6 * s} {R + 7 * s} {cy}')]
    elif eyes == 'dots':
        o += [dot(L, cy + 2 * s, 4.2 * s), dot(R, cy + 2 * s, 4.2 * s)]
    elif eyes == 'wink':
        o += [circ(L, cy, er, W), dot(L + s, cy + 1.5 * s, pr),
              path(f'M{R - 7 * s} {cy + 3 * s} Q{R} {cy - 7 * s} {R + 7 * s} {cy + 3 * s}')]
    elif eyes == 'x':
        d = 6 * s
        o += [path(f'M{L - d} {cy - d} L{L + d} {cy + d} M{L + d} {cy - d} L{L - d} {cy + d}'),
              path(f'M{R - d} {cy - d} L{R + d} {cy + d} M{R + d} {cy - d} L{R - d} {cy + d}')]
    elif eyes == 'stars':
        o += [star(L, cy, 10 * s), star(R, cy, 10 * s)]
    elif eyes == 'hearts':
        o += [heart(L, cy, .8 * s, RED), heart(R, cy, .8 * s, RED)]
    elif eyes == 'shades':
        o += [path(f'M{cx - 33 * s} {cy - 8 * s} L{cx + 33 * s} {cy - 8 * s} L{cx + 30 * s} {cy + 6 * s} Q{cx + 18 * s} {cy + 13 * s} {cx + 5 * s} {cy + 5 * s} '
                   f'L{cx - 5 * s} {cy + 5 * s} Q{cx - 18 * s} {cy + 13 * s} {cx - 30 * s} {cy + 6 * s} Z', INK),
              path(f'M{cx - 24 * s} {cy - 3 * s} L{cx - 17 * s} {cy - 3 * s} M{cx + 12 * s} {cy - 3 * s} L{cx + 19 * s} {cy - 3 * s}',
                   extra=f' stroke="#ffffff" stroke-width="{2.5 * s}"')]
    elif eyes == 'visor':
        o += [rect(cx - 34 * s, cy - 9 * s, 68 * s, 18 * s, TEAL, 9 * s)]
    if brows == 'angry':
        o += [path(f'M{L - 10 * s} {cy - 18 * s} L{L + 9 * s} {cy - 11 * s}'), path(f'M{R + 10 * s} {cy - 18 * s} L{R - 9 * s} {cy - 11 * s}')]
    elif brows == 'sad':
        o += [path(f'M{L - 10 * s} {cy - 11 * s} L{L + 8 * s} {cy - 17 * s}'), path(f'M{R + 10 * s} {cy - 11 * s} L{R - 8 * s} {cy - 17 * s}')]
    elif brows == 'up':
        o += [path(f'M{L - 9 * s} {cy - 17 * s} Q{L} {cy - 24 * s} {L + 9 * s} {cy - 17 * s}'),
              path(f'M{R - 9 * s} {cy - 17 * s} Q{R} {cy - 24 * s} {R + 9 * s} {cy - 17 * s}')]
    elif brows == 'flat':
        o += [path(f'M{L - 9 * s} {cy - 16 * s} L{L + 9 * s} {cy - 16 * s}'), path(f'M{R - 9 * s} {cy - 16 * s} L{R + 9 * s} {cy - 16 * s}')]
    elif brows == 'one':
        o += [path(f'M{L - 9 * s} {cy - 16 * s} L{L + 9 * s} {cy - 16 * s}'), path(f'M{R - 9 * s} {cy - 22 * s} Q{R} {cy - 26 * s} {R + 9 * s} {cy - 20 * s}')]
    if blush and eyes not in ('shades', 'visor'):
        o += [f'<ellipse cx="{cx - 27 * s}" cy="{cy + 14 * s}" rx="{6 * s}" ry="{3.5 * s}" fill="{BLUSH}" stroke="none"/>',
              f'<ellipse cx="{cx + 27 * s}" cy="{cy + 14 * s}" rx="{6 * s}" ry="{3.5 * s}" fill="{BLUSH}" stroke="none"/>']
    my = cy + 21 * s
    o += [mouth_(cx, my, s, mouth)]
    return o


def mouth_(cx, my, s, m):
    if m == 'smile':
        return path(f'M{cx - 10 * s} {my - 2 * s} Q{cx} {my + 8 * s} {cx + 10 * s} {my - 2 * s}')
    if m == 'small':
        return path(f'M{cx - 6 * s} {my} Q{cx} {my + 5 * s} {cx + 6 * s} {my}')
    if m == 'grin':
        return path(f'M{cx - 14 * s} {my - 4 * s} L{cx + 14 * s} {my - 4 * s} Q{cx + 12 * s} {my + 12 * s} {cx} {my + 12 * s} Q{cx - 12 * s} {my + 12 * s} {cx - 14 * s} {my - 4 * s} Z', W)
    if m == 'teeth':
        return (rect(cx - 13 * s, my - 6 * s, 26 * s, 12 * s, W, 4 * s) +
                path(f'M{cx - 13 * s} {my} L{cx + 13 * s} {my} M{cx - 4 * s} {my - 6 * s} L{cx - 4 * s} {my + 6 * s} M{cx + 4 * s} {my - 6 * s} L{cx + 4 * s} {my + 6 * s}'))
    if m == 'open':
        return ell(cx, my + 2 * s, 7 * s, 8 * s, INK) + f'<ellipse cx="{cx}" cy="{my + 6 * s}" rx="{4 * s}" ry="{2.6 * s}" fill="{RED}" stroke="none"/>'
    if m == 'shout':
        return (path(f'M{cx - 14 * s} {my - 6 * s} Q{cx} {my - 9 * s} {cx + 14 * s} {my - 6 * s} Q{cx + 12 * s} {my + 16 * s} {cx} {my + 16 * s} Q{cx - 12 * s} {my + 16 * s} {cx - 14 * s} {my - 6 * s} Z', INK) +
                f'<ellipse cx="{cx}" cy="{my + 10 * s}" rx="{6 * s}" ry="{3.5 * s}" fill="{RED}" stroke="none"/>')
    if m == 'flat':
        return path(f'M{cx - 8 * s} {my + 1 * s} L{cx + 8 * s} {my + 1 * s}')
    if m == 'smirk':
        return path(f'M{cx - 9 * s} {my + 2 * s} Q{cx + 2 * s} {my + 4 * s} {cx + 10 * s} {my - 4 * s}')
    if m == 'frown':
        return path(f'M{cx - 9 * s} {my + 5 * s} Q{cx} {my - 4 * s} {cx + 9 * s} {my + 5 * s}')
    if m == 'o':
        return circ(cx, my + 2 * s, 4.5 * s, INK)
    if m == 'wavy':
        return path(f'M{cx - 10 * s} {my} Q{cx - 5 * s} {my - 4 * s} {cx} {my} Q{cx + 5 * s} {my + 4 * s} {cx + 10 * s} {my}')
    if m == 'cat':
        return path(f'M{cx - 9 * s} {my - 1 * s} Q{cx - 4 * s} {my + 5 * s} {cx} {my} Q{cx + 4 * s} {my + 5 * s} {cx + 9 * s} {my - 1 * s}')
    if m == 'none':
        return ''
    raise ValueError(m)


# ---------- people ----------
BODY = 'M34 206 Q38 152 72 140 L128 140 Q162 152 166 206 Z'
NECK = 'M88 116 L112 116 L112 140 Q100 148 88 140 Z'


def hair_back(style, col):
    if style == 'long':
        return path('M58 90 Q48 40 100 40 Q152 40 142 90 L150 150 Q126 156 118 136 L82 136 Q74 156 50 150 Z', col)
    if style == 'bob':
        return path('M56 92 Q50 42 100 42 Q150 42 144 92 L148 124 Q130 130 120 120 L80 120 Q70 130 52 124 Z', col)
    if style == 'afro':
        return circ(100, 72, 52, col)
    if style == 'ponytail':
        return path('M128 60 Q160 66 158 110 Q156 132 144 140 Q148 112 132 88 Z', col)
    if style == 'dreads':
        return (path('M58 88 Q50 40 100 40 Q150 40 142 88 L146 146 Q138 150 132 144 L130 120 L70 120 L68 144 Q62 150 54 146 Z', col) +
                path('M58 110 L56 140 M70 116 L68 146 M130 116 L132 146 M142 110 L144 140'))
    if style == 'bun':
        return circ(100, 40, 15, col)
    if style == 'topknot':
        return circ(100, 38, 12, col)
    if style == 'pigtails':
        return circ(52, 74, 16, col) + circ(148, 74, 16, col)
    return ''


def hair_front(style, col):
    if style in ('short', 'bun', 'ponytail', 'dreads'):
        return path('M62 84 Q58 46 100 44 Q142 46 138 84 Q130 64 100 66 Q72 66 62 84 Z', col)
    if style == 'messy':
        return (path('M60 84 Q56 44 98 42 Q144 40 140 84 Q134 66 120 68 Q114 56 100 62 Q88 54 80 68 Q66 66 60 84 Z', col) +
                path('M98 44 Q92 30 104 26 Q98 36 106 43'))
    if style in ('swoop', 'long', 'pigtails'):
        return path('M62 86 Q54 40 104 42 Q148 46 138 86 Q134 64 114 58 Q92 74 64 76 Z', col)
    if style == 'bob':
        return path('M60 88 Q56 44 100 44 Q144 44 140 88 L136 72 Q100 62 64 72 Z', col)
    if style == 'curly':
        return ''.join(circ(x, y, 12, col) for x, y in [(66, 74), (72, 58), (86, 48), (102, 45), (118, 48), (131, 58), (136, 74)])
    if style == 'afro':
        return path('M66 78 Q70 56 100 56 Q130 56 134 78', 'none')
    if style == 'mohawk':
        return path('M90 54 L84 14 L95 30 L100 6 L106 30 L117 14 L111 54 Z', col)
    if style == 'spiky':
        return path('M60 82 L56 52 L70 60 L72 38 L86 50 L96 30 L106 48 L120 34 L124 56 L140 48 L140 82 Q120 64 100 66 Q78 64 60 82 Z', col)
    if style == 'buzz':
        return path('M64 78 Q64 48 100 48 Q136 48 136 78 Q118 64 100 64 Q82 64 64 78 Z', col)
    if style == 'topknot':
        return path('M62 80 Q60 48 100 48 Q140 48 138 80 Q120 62 100 62 Q80 62 62 80 Z', col)
    if style == 'combover':
        return path('M60 86 Q58 60 76 56 Q110 46 140 62 Q118 60 92 66 Q72 70 62 86 Z', col)
    if style == 'sides':  # bald on top
        return path('M60 96 Q58 74 66 66 L70 84 Z', col) + path('M140 96 Q142 74 134 66 L130 84 Z', col)
    if style == 'slick':
        return path('M60 84 Q56 42 100 42 Q144 42 140 84 Q136 60 104 56 Q76 56 60 84 Z', col) + path('M84 50 Q100 46 124 54')
    if style == 'fringe':
        return path('M60 86 Q54 44 100 42 Q146 44 140 86 Q132 66 124 72 Q116 62 108 72 Q98 62 90 72 Q80 62 72 74 Q64 70 60 86 Z', col)
    return ''


def outfit(kind, col, col2=W, skin=None):
    o = [path(BODY, col)]
    if kind == 'tee':
        o += [path('M84 140 Q100 154 116 140')]
    elif kind == 'suit':
        o += [path('M84 140 L100 166 L116 140 Z', W), path('M97 146 L103 146 L106 174 L100 182 L94 174 Z', col2),
              path('M78 140 L96 178 M122 140 L104 178')]
    elif kind == 'shirt':
        o += [path('M84 140 L100 158 L116 140 Z', col2), path('M100 158 L100 206 M100 172 L100 172 M100 188 L100 188')]
    elif kind == 'hoodie':
        o += [path('M66 142 Q100 176 134 142 Q122 132 100 134 Q78 132 66 142 Z', col2),
              path('M92 156 L90 182 M108 156 L110 182'), path('M70 190 L130 190', 'none')]
    elif kind == 'turtle':
        o += [rect(82, 126, 36, 22, col, 10)]
    elif kind == 'leather':
        o += [path('M76 140 L92 170 L100 150 L108 170 L124 140', 'none'), path('M100 150 L100 206'),
              path('M76 140 L64 168 L84 166 Z', col), path('M124 140 L136 168 L116 166 Z', col),
              dot(70, 186, 3, W), dot(130, 186, 3, W), dot(62, 196, 3, W), dot(138, 196, 3, W)]
    elif kind == 'robe':
        o += [path('M72 142 Q96 170 118 206 L138 206 Q120 170 96 140 Z', col2)]
    elif kind == 'apron':
        o += [path('M84 140 Q100 152 116 140'), path('M78 162 L122 162 L126 206 L74 206 Z', col2),
              path('M80 162 L84 140 M120 162 L116 140')]
    elif kind == 'vest':
        o += [path('M84 140 L100 160 L116 140 Z', W), path('M70 142 L92 206 L60 206 Q56 170 70 142 Z', col2),
              path('M130 142 L108 206 L140 206 Q144 170 130 142 Z', col2)]
    elif kind == 'hivis':
        o += [path('M84 140 Q100 154 116 140'), path('M48 178 L152 178 L156 192 L44 192 Z', W)]
    elif kind == 'overalls':
        o += [path('M84 140 Q100 154 116 140'), path('M74 166 L126 166 L130 206 L70 206 Z', col2),
              path('M76 166 L78 140 M124 166 L122 140'), dot(80, 172, 3), dot(120, 172, 3)]
    elif kind == 'sash':
        o += [path('M84 140 Q100 154 116 140'), path('M72 142 L84 140 L148 200 L136 206 Z', col2)]
    elif kind == 'tank':
        sk = skin or SKINS[0]
        o = [path(BODY, sk), path('M66 146 Q72 160 70 206 L130 206 Q128 160 134 146 Q120 160 100 160 Q80 160 66 146 Z', col)]
    elif kind == 'jersey':
        o += [path('M84 140 Q100 154 116 140'), path('M50 160 L66 150 M150 160 L134 150'),
              rect(82, 168, 36, 26, W, 6)]
    elif kind == 'cardigan':
        o += [path('M84 140 L100 162 L116 140 Z', col2), path('M100 162 L100 206'), dot(106, 176, 2.5), dot(106, 192, 2.5)]
    elif kind == 'toga':
        o += [path('M60 150 Q100 156 128 140 L150 172 Q110 168 70 196 Z', col2)]
    elif kind == 'puffer':
        o += [path('M84 140 L100 156 L116 140'), path('M100 156 L100 206'), path('M44 172 Q100 180 156 172 M38 192 Q100 200 162 192')]
    return o


def person(skin=0, hair='short', hc='brown', outfit_='tee', oc=SKY, oc2=W, eyes='open', mouth='smile', brows=None,
           hat=None, hatc=RED, extra=(), back=(), prop=(), front=(), ears=True, look=0, head_dy=0, blush=True):
    sk = SKINS[skin] if isinstance(skin, int) else skin
    hcol = HAIR.get(hc, hc)
    o = list(back)
    o += [hair_back(hair, hcol)]
    o += outfit(outfit_, oc, oc2, sk)
    o += [path(NECK, sk)]
    if outfit_ == 'turtle':
        o += [rect(82, 128, 36, 20, oc, 10)]
    hy = 86 + head_dy
    if ears:
        o += [circ(62, hy + 6, 9, sk), circ(138, hy + 6, 9, sk)]
    o += [circ(100, hy, 38, sk)]
    o += [hair_front(hair, hcol)]
    if 'beard' in extra:
        o += [path(f'M64 {hy + 10} Q66 {hy + 48} 100 {hy + 50} Q134 {hy + 48} 136 {hy + 10} Q130 {hy + 30} 116 {hy + 26} Q100 {hy + 32} 84 {hy + 26} Q70 {hy + 30} 64 {hy + 10} Z', hcol)]
    if 'longbeard' in extra:
        o += [path(f'M64 {hy + 10} Q62 {hy + 70} 100 {hy + 92} Q138 {hy + 70} 136 {hy + 10} Q130 {hy + 30} 116 {hy + 26} Q100 {hy + 32} 84 {hy + 26} Q70 {hy + 30} 64 {hy + 10} Z', hcol)]
    o += face(100, hy + 6, 1, eyes, mouth, blush, brows, sk, look)
    if 'mustache' in extra:
        o += [path(f'M84 {hy + 24} Q92 {hy + 16} 100 {hy + 21} Q108 {hy + 16} 116 {hy + 24} Q108 {hy + 28} 100 {hy + 24} Q92 {hy + 28} 84 {hy + 24} Z', hcol)]
    if 'stubble' in extra:
        o += [dot(x, y, 1.3) for x, y in [(80, hy + 36), (88, hy + 40), (96, hy + 42), (104, hy + 42), (112, hy + 40), (120, hy + 36)]]
    if 'freckles' in extra:
        o += [dot(x, y, 1.4, BROWN) for x, y in [(74, hy + 15), (79, hy + 18), (70, hy + 19), (126, hy + 15), (121, hy + 18), (130, hy + 19)]]
    if 'nosering' in extra:
        o += [circ(104, hy + 21, 3.2)]
    if 'earring' in extra:
        o += [circ(62, hy + 20, 4, Y)]
    if 'bags' in extra:
        o += [path(f'M76 {hy + 17} Q85 {hy + 21} 94 {hy + 17} M106 {hy + 17} Q115 {hy + 21} 124 {hy + 17}')]
    if 'sweat' in extra:
        o += [path(f'M142 {hy - 22} Q150 {hy - 10} 146 {hy - 4} Q138 {hy - 6} 142 {hy - 22} Z', SKY)]
    if 'bandaid' in extra:
        o += [g([rect(-10, -4, 20, 8, '#ffd9b0', 3)], f'translate(122 {hy - 14}) rotate(-30)')]
    if 'scar' in extra:
        o += [path(f'M118 {hy - 18} L126 {hy - 6} M119 {hy - 10} L125 {hy - 14}')]
    if hat:
        o += hat_(hat, hatc, hy)
    o += list(front)
    o += list(prop)
    return o


def hat_(kind, col, hy=86):
    d = hy - 86
    def t(s):
        return g([s], f'translate(0 {d})') if d else s
    if kind == 'cap':
        return [t(path('M60 76 Q60 38 100 38 Q140 38 140 76 Z', col)), t(path('M60 76 Q102 64 152 74 Q156 84 144 86 Q102 76 60 84 Z', col)),
                t(circ(100, 38, 4, col))]
    if kind == 'capback':
        return [t(path('M60 78 Q60 38 100 38 Q140 38 140 78 Z', col)), t(path('M84 78 Q100 66 116 78')), t(path('M128 70 Q148 74 156 66 L152 58 Q140 62 132 58', col))]
    if kind == 'beanie':
        return [t(path('M60 78 Q60 34 100 34 Q140 34 140 78 Z', col)), t(rect(56, 66, 88, 16, col, 8)), t(circ(100, 30, 8, W))]
    if kind == 'headphones':
        return [t(path('M58 88 Q58 40 100 40 Q142 40 142 88')), t(rect(50, 76, 16, 28, col, 7)), t(rect(134, 76, 16, 28, col, 7))]
    if kind == 'headset':
        return [t(path('M58 88 Q58 40 100 40 Q142 40 142 88')), t(rect(50, 76, 16, 28, col, 7)), t(rect(134, 76, 16, 28, col, 7)),
                t(path('M56 102 Q60 122 84 122')), t(circ(86, 122, 4, INK))]
    if kind == 'headband':
        return [t(path('M60 70 Q100 56 140 70 L140 80 Q100 66 60 80 Z', col))]
    if kind == 'bandana':
        return [t(path('M60 78 Q58 40 100 40 Q142 40 140 78 Q100 66 60 78 Z', col)), t(path('M138 70 L156 62 L152 78 Z', col)),
                t(dot(84, 56, 2.5, W)), t(dot(112, 52, 2.5, W)), t(dot(98, 62, 2.5, W))]
    if kind == 'beret':
        return [t(f'<ellipse cx="94" cy="52" rx="42" ry="14" fill="{col}" transform="rotate(-12 94 52)"/>'), t(path('M92 40 L94 32'))]
    if kind == 'crown':
        return [t(path('M70 58 L66 28 L84 42 L100 22 L116 42 L134 28 L130 58 Z', Y)), t(dot(100, 46, 3, RED))]
    if kind == 'hardhat':
        return [t(path('M62 72 Q62 34 100 34 Q138 34 138 72 Z', col)), t(rect(52, 68, 96, 10, col, 5)), t(path('M100 34 L100 66'))]
    if kind == 'straw':
        return [t(ell(100, 64, 62, 13, '#ffe08a')), t(path('M70 64 Q70 30 100 30 Q130 30 130 64 Z', '#ffe08a')), t(path('M70 56 Q100 62 130 56 L130 62 Q100 68 70 62 Z', col))]
    if kind == 'tophat':
        return [t(ell(100, 56, 50, 9, INK)), t(rect(72, 12, 56, 44, INK, 4)), t(rect(72, 42, 56, 9, col))]
    if kind == 'showercap':
        return [t(path('M56 80 Q50 30 100 30 Q150 30 144 80 Q130 74 120 80 Q110 72 100 80 Q90 72 80 80 Q70 74 56 80 Z', col))]
    if kind == 'halo':
        return [t(ell(100, 30, 30, 8, 'none', f' stroke-width="7"')), t(ell(100, 30, 30, 8, 'none'))]
    if kind == 'laurel':
        o = []
        for i, (x, y) in enumerate([(64, 70), (68, 58), (76, 48), (88, 42)]):
            o += [t(f'<ellipse cx="{x}" cy="{y}" rx="9" ry="5" fill="{G}" transform="rotate({-60 + i * 22} {x} {y})"/>')]
            o += [t(f'<ellipse cx="{200 - x}" cy="{y}" rx="9" ry="5" fill="{G}" transform="rotate({60 - i * 22} {200 - x} {y})"/>')]
        return o
    if kind == 'earmuffs':
        return [t(path('M60 86 Q60 36 100 36 Q140 36 140 86')), t(circ(58, 92, 13, col)), t(circ(142, 92, 13, col))]
    if kind == 'curlers':
        return [t(rect(x - 8, y - 6, 16, 12, col, 5)) for x, y in [(72, 52), (92, 44), (112, 44), (130, 54)]]
    if kind == 'balaclava':
        return []
    if kind == 'wizard':
        return [t(path('M62 66 L100 4 L138 66 Z', col)), t(ell(100, 66, 46, 8, col)), t(star(100, 40, 8, Y))]
    if kind == 'flower':
        return [t(circ(132, 54, 7, Y))] + [t(circ(132 + dx, 54 + dy, 6, PINK)) for dx, dy in [(0, -10), (10, 0), (0, 10), (-10, 0)]]
    raise ValueError(kind)


# ---------- reusable props ----------
def phone(x, y, w=26, h=44, col=INK, screen=SKY, rot=0, extra=()):
    p = [rect(x, y, w, h, col, 6), rect(x + 4, y + 6, w - 8, h - 14, screen, 3)] + list(extra)
    return g(p, f'rotate({rot} {x + w / 2} {y + h / 2})') if rot else '\n'.join(p)


def mug(x, y, col=W, band=None):
    o = [path(f'M{x} {y} L{x + 26} {y} L{x + 24} {y + 30} L{x + 2} {y + 30} Z', col),
         path(f'M{x + 25} {y + 7} Q{x + 36} {y + 7} {x + 35} {y + 16} Q{x + 34} {y + 24} {x + 24} {y + 23}')]
    if band:
        o += [rect(x + 3, y + 10, 20, 8, band, 2)]
    return o


def steam(x, y):
    return path(f'M{x} {y} Q{x - 5} {y - 8} {x} {y - 14} M{x + 10} {y - 2} Q{x + 5} {y - 10} {x + 10} {y - 18}')


def box(x, y, w, h, col='#e8b878'):
    return [rect(x, y, w, h, col, 3), path(f'M{x + w / 2 - 6} {y} L{x + w / 2 - 6} {y + 14} L{x + w / 2 + 6} {y + 14} L{x + w / 2 + 6} {y}', '#ffe9a8')]


def mic(x, y, col=DGREY, rot=0):
    p = [rect(x - 4, y + 10, 8, 30, INK, 3), ell(x, y, 11, 13, col), path(f'M{x - 10} {y} L{x + 10} {y} M{x - 8} {y - 6} L{x + 8} {y - 6} M{x - 8} {y + 6} L{x + 8} {y + 6}')]
    return g(p, f'rotate({rot} {x} {y + 20})')


def sign(x, y, w, h, text_lines=(), col=W, stick=True, rot=0):
    p = []
    if stick:
        p += [rect(x + w / 2 - 4, y + h - 2, 8, 50, BROWN, 2)]
    p += [rect(x, y, w, h, col, 4)]
    for i, ln in enumerate(text_lines):
        p += [path(ln)]
    return g(p, f'rotate({rot} {x + w / 2} {y + h})') if rot else '\n'.join(p)


def leaf(cx, cy, rx, ry, rot, fill=G, vein=True):
    o = f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" transform="rotate({rot} {cx} {cy})"/>'
    if vein:
        import math
        a = math.radians(rot)
        dx, dy = rx * .7 * math.cos(a), rx * .7 * math.sin(a)
        o += path(f'M{cx - dx:.1f} {cy - dy:.1f} L{cx + dx:.1f} {cy + dy:.1f}')
    return o


def pot(x, y, w=40, h=30, col=ORA):
    return [path(f'M{x} {y} L{x + w} {y} L{x + w - 5} {y + h} L{x + 5} {y + h} Z', col), rect(x - 3, y - 6, w + 6, 10, col, 3)]


def speech(x, y, w, h, lines=2, fill=W, tail='left'):
    o = [bubble(x, y, w, h, fill, tail)]
    for i in range(lines):
        yy = y + 10 + i * 9
        o += [path(f'M{x + 9} {yy} L{x + w - 9 - (i == lines - 1) * 10} {yy}')]
    return o


def guitar(x, y, rot=-30, col=RED):
    p = [rect(x - 3, y - 64, 6, 52, BROWN, 2), rect(x - 5, y - 74, 10, 12, INK, 3),
         path(f'M{x} {y - 14} Q{x + 18} {y - 18} {x + 16} {y} Q{x + 22} {y + 16} {x} {y + 22} Q{x - 22} {y + 16} {x - 16} {y} Q{x - 18} {y - 18} {x} {y - 14} Z', col),
         circ(x, y + 2, 5, INK), path(f'M{x - 8} {y + 14} L{x + 8} {y + 14}')]
    return g(p, f'rotate({rot} {x} {y})')


def spray(x, y, col=RED, rot=0):
    p = [rect(x, y, 18, 34, col, 4), rect(x + 4, y - 7, 10, 8, GREY, 2), rect(x + 7, y - 11, 4, 4, INK, 1),
         path(f'M{x + 2} {y + 12} L{x + 16} {y + 12}')]
    return g(p, f'rotate({rot} {x + 9} {y + 17})')


def book(x, y, w=34, h=42, col=RED, rot=0):
    p = [rect(x, y, w, h, col, 3), path(f'M{x + 6} {y} L{x + 6} {y + h}'), rect(x + 11, y + 8, w - 16, 8, W, 2)]
    return g(p, f'rotate({rot} {x + w / 2} {y + h / 2})')


def screen(x, y, w, h, col=SKY, frame=INK, stand=True):
    o = [rect(x, y, w, h, frame, 6), rect(x + 5, y + 5, w - 10, h - 10, col, 3)]
    if stand:
        o += [path(f'M{x + w / 2 - 8} {y + h} L{x + w / 2 - 12} {y + h + 10} L{x + w / 2 + 12} {y + h + 10} L{x + w / 2 + 8} {y + h} Z', DGREY)]
    return o


def laptop(x, y, w=56, col=GREY, scr=SKY):
    return [rect(x + 4, y, w - 8, 36, INK, 4), rect(x + 8, y + 4, w - 16, 28, scr, 2),
            path(f'M{x} {y + 36} L{x + w} {y + 36} L{x + w + 4} {y + 44} L{x - 4} {y + 44} Z', col)]


def can(x, y, col=G, rot=0, label=Y):
    p = [rect(x, y, 22, 40, col, 5), ell(x + 11, y + 2, 9, 3, GREY), path(f'M{x + 3} {y + 14} L{x + 19} {y + 14} M{x + 3} {y + 28} L{x + 19} {y + 28}'),
         path(f'M{x + 7} {y + 22} L{x + 13} {y + 16} L{x + 11} {y + 21} L{x + 16} {y + 21} L{x + 9} {y + 27} L{x + 11} {y + 22} Z', label)]
    return g(p, f'rotate({rot} {x + 11} {y + 20})') if rot else '\n'.join(p)


def vinyl(cx, cy, r=26, label=RED):
    return [circ(cx, cy, r, INK), circ(cx, cy, r * .72, 'none', ' stroke="#6b6182" stroke-width="2"'), circ(cx, cy, r * .35, label), dot(cx, cy, 2.5, W)]


def cassette(x, y, col=Y):
    return [rect(x, y, 56, 36, col, 5), rect(x + 8, y + 7, 40, 14, W, 3), circ(x + 18, y + 14, 4, INK), circ(x + 38, y + 14, 4, INK),
            path(f'M{x + 12} {y + 36} L{x + 16} {y + 26} L{x + 40} {y + 26} L{x + 44} {y + 36}')]


def lightning(x, y, s=1, col=Y):
    return path(f'M{x} {y} L{x - 10 * s} {y + 20 * s} L{x - 1 * s} {y + 20 * s} L{x - 6 * s} {y + 38 * s} L{x + 12 * s} {y + 14 * s} L{x + 3 * s} {y + 14 * s} L{x + 8 * s} {y} Z', col)


def wifi(cx, cy, s=1):
    return [path(f'M{cx - 20 * s} {cy - 8 * s} Q{cx} {cy - 26 * s} {cx + 20 * s} {cy - 8 * s}'),
            path(f'M{cx - 12 * s} {cy} Q{cx} {cy - 12 * s} {cx + 12 * s} {cy}'), dot(cx, cy + 7 * s, 4 * s)]


def motion(x, y, n=3, dx=22):
    return path(' '.join(f'M{x} {y + i * 14} L{x + dx - i * 4} {y + i * 14}' for i in range(n)))


def ground(y=196, col=LIME):
    return path(f'M-6 {y} Q100 {y - 10} 206 {y} L206 212 L-6 212 Z', col)


def gs(parts, t):
    """Group with a transform that keeps stroke widths constant (for scaled sub-figures)."""
    import re
    body = '\n'.join(p for p in parts if p)
    body = re.sub(r'<(path|circle|ellipse|rect)\b', r'<\1 vector-effect="non-scaling-stroke"', body)
    return f'<g transform="{t}">' + body + '</g>'
