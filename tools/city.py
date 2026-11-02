"""Generate the fake-3D city background: buildings rise from the screen edges toward the viewer.
Each footprint is a rectangle on the ground; its roof is the footprint scaled away from the
vanishing point (centre of the plaza) by k, so walls that face the centre become visible.
Buildings line the left, right and top edges; the bottom stays open for the hand."""
import random, sys

W, H = 844, 390
VP = (422.0, 215.0)
INK = '#4a3d6a'
SW = 2.2

PAL = {  # roof, lit wall, shaded wall
    'lilac':  ('#f3ecfd', '#dccbf7', '#c9b2f0'),
    'butter': ('#fff4c9', '#ffe28f', '#f6cf68'),
    'sky':    ('#e6f6ff', '#bfe6fb', '#9fd6f4'),
    'peach':  ('#ffe6db', '#ffc9b6', '#f7ad95'),
    'mint':   ('#e4f8ec', '#bfecd3', '#9bdcb9'),
    'white':  ('#ffffff', '#ebe6f3', '#d8d0e6'),
}

def sc(p, k, kx=None):
    kx = k if kx is None else kx
    return (VP[0] + (p[0] - VP[0]) * kx, VP[1] + (p[1] - VP[1]) * k)

def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

def poly(pts, fill, sw=SW):
    d = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    return f'<polygon points="{d}" fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>'

def rect(x, y, w, h, fill, rx=2, sw=SW):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" stroke="{INK}" stroke-width="{sw}"/>'

def circ(cx, cy, r, fill, sw=SW):
    return f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fill}" stroke="{INK}" stroke-width="{sw}"/>'

def facade(g0, g1, r0, r1, cols, floors, rnd, door=None, awning=None):
    """Windows on a wall. u runs along the wall, v from the ground (0) up to the roof (1)."""
    def P(u, v):
        return lerp(lerp(g0, g1, u), lerp(r0, r1, u), v)
    out = []
    for i in range(cols):
        for j in range(floors):
            if door is not None and j == 0 and i == door:
                continue
            u0, u1 = (i + 0.24) / cols, (i + 0.76) / cols
            v0, v1 = (j + 0.28) / floors, (j + 0.74) / floors
            fill = '#ffe58a' if rnd.random() < 0.2 else '#ffffff'
            out.append(poly([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], fill, 1.6))
    if door is not None:
        u0, u1 = (door + 0.26) / cols, (door + 0.74) / cols
        vt = 0.62 / floors
        out.append(poly([P(u0, 0), P(u1, 0), P(u1, vt), P(u0, vt)], '#8a5a3a', 1.8))
    if awning:
        n = 8
        va, vb = 0.62 / floors, 0.92 / floors
        for t in range(n):
            ua, ub = 0.04 + 0.92 * t / n, 0.04 + 0.92 * (t + 1) / n
            out.append(poly([P(ua, va), P(ub, va), P(ub, vb), P(ua, vb)], awning if t % 2 == 0 else '#ffffff', 1.6))
    return out

def building(b, rnd):
    x0, y0, x1, y1, k, pal, detail = b
    roof_c, wall_lit, wall_shade = PAL[pal]
    g = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    top_row = y1 < 60 and x0 > 100
    kx = 1 + (k - 1) * 0.25 if top_row else None   # top row leans back gently so shopfronts stay upright
    r = [sc(p, k, kx) for p in g]
    out = []
    walls = []
    if VP[0] > x1: walls.append((1, 2, wall_lit, False))    # right wall
    if VP[0] < x0: walls.append((3, 0, wall_shade, False))  # left wall
    if VP[1] > y1: walls.append((2, 3, wall_lit, True))     # front wall facing down (top row of buildings)
    if VP[1] < y0: walls.append((0, 1, wall_shade, False))  # wall facing up
    for a, c, fill, front in walls:
        out.append(poly([g[a], g[c], r[c], r[a]], fill))
        length = ((g[a][0] - g[c][0]) ** 2 + (g[a][1] - g[c][1]) ** 2) ** 0.5
        vertical_wall = abs(g[a][0] - g[c][0]) < 0.5
        depth = abs(g[a][0] - r[a][0]) if vertical_wall else abs(g[a][1] - r[a][1])
        if depth >= (24 if vertical_wall else 30) and length >= 26:
            cols = max(1, int(length / 30))
            floors = max(1, round(depth / 21))
            door = cols // 2 if (front and detail in ('door', 'shop')) else None
            awning = '#ff8ab8' if (front and detail == 'shop') else ('#2fd0d0' if (front and detail == 'cafe') else None)
            # walls run g[a] -> g[c]; for the front wall that is right-to-left, so flip for a left-to-right reading
            out += facade(g[a], g[c], r[a], r[c], cols, floors, rnd, door, awning)
    rx0, ry0 = r[0]; rx1, ry1 = r[2]
    out.append(poly(r, roof_c))
    ins = 7
    out.append(f'<rect x="{rx0+ins:.1f}" y="{ry0+ins:.1f}" width="{rx1-rx0-2*ins:.1f}" height="{ry1-ry0-2*ins:.1f}" rx="3" fill="none" stroke="{INK}" stroke-width="1.6" opacity="0.55"/>')
    if detail == 'tank':
        px = rx1 - 30 if VP[0] > rx1 else rx0 + 30
        py = ry1 - 30 if VP[1] > ry1 else ry0 + 30
        out.append(circ(px, py, 13, '#ffffff'))
        out.append(f'<path d="M{px-13:.1f} {py:.1f} H{px+13:.1f} M{px:.1f} {py-13:.1f} V{py+13:.1f}" stroke="{INK}" stroke-width="1.6" opacity="0.6"/>')
    elif detail == 'ac':
        px = rx1 - 34 if VP[0] > rx1 else rx0 + 12
        py = (max(ry0, 0) + min(ry1, H)) / 2 - 10
        out.append(rect(px, py, 22, 20, '#ffffff', 3))
        out.append(circ(px + 11, py + 10, 6, '#eeeaf5', 1.6))
    elif detail == 'garden':
        px0 = rx1 - 44 if VP[0] > rx1 else rx0 + 10
        py0 = max(ry0, 0) + 14
        out.append(rect(px0, py0, 34, min(ry1, H) - py0 - 14, '#9bdcb9', 6))
        for t in range(3):
            out.append(circ(px0 + 17 + (t % 2) * 6 - 3, py0 + 14 + t * 22, 8, '#2ecb6e', 1.8))
    elif detail == 'helipad':
        px = rx1 - 34 if VP[0] > rx1 else rx0 + 34
        py = min(ry1, H) - 44
        out.append(circ(px, py, 20, '#ffffff'))
        out.append(f'<path d="M{px-7:.1f} {py-8:.1f} V{py+8:.1f} M{px+7:.1f} {py-8:.1f} V{py+8:.1f} M{px-7:.1f} {py:.1f} H{px+7:.1f}" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"/>')
    elif detail == 'solar':
        px0 = rx1 - 46 if VP[0] > rx1 else rx0 + 10
        for t in range(3):
            out.append(rect(px0, ry0 + 20 + t * 24, 34, 17, '#8fd4ff', 2, 1.6))
    elif detail == 'billboard':
        px = rx1 - 60 if VP[0] > rx1 else rx0 + 8
        py = (max(ry0, 0) + min(ry1, H)) / 2 - 16
        out.append(rect(px, py, 50, 30, '#ff8ab8', 4))
        out.append(f'<path d="M{px+25:.1f} {py+22:.1f} l-8 -8 a4.5 4.5 0 0 1 8 -5 a4.5 4.5 0 0 1 8 5 z" fill="#ffffff" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>')
    return out

BUILDINGS = [
    # left edge
    (-80, -80, 98, 80, 1.20, 'lilac', 'tank'),
    (-80, 94, 86, 184, 1.11, 'butter', 'ac'),
    (-80, 198, 94, 296, 1.15, 'sky', 'garden'),
    (-80, 310, 102, 470, 1.24, 'peach', 'helipad'),
    # right edge
    (746, -80, 924, 68, 1.17, 'mint', 'ac'),
    (756, 82, 924, 176, 1.23, 'peach', 'billboard'),
    (750, 190, 924, 290, 1.11, 'lilac', 'solar'),
    (742, 304, 924, 470, 1.19, 'butter', 'tank'),
    # top edge: shop fronts facing the plaza
    (112, -80, 238, 38, 1.22, 'sky', 'door'),
    (250, -80, 404, 38, 1.17, 'peach', 'shop'),
    (416, -80, 522, 38, 1.25, 'white', 'door'),
    (534, -80, 622, 38, 1.18, 'butter', 'cafe'),
    (634, -80, 734, 38, 1.22, 'mint', 'door'),
]

def main(out_path):
    rnd = random.Random(7)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
             '<defs><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="1.6" fill="#2b2140" opacity="0.07"/></pattern></defs>',
             f'<rect x="0" y="0" width="{W}" height="{H}" fill="#ece6f3"/>',
             f'<path d="M98 44 V{H} M746 44 V{H}" stroke="#ffffff" stroke-width="3" stroke-dasharray="14 12"/>',
             f'<rect x="110" y="44" width="624" height="{H}" rx="28" fill="#fff6dc" stroke="{INK}" stroke-width="{SW}"/>',
             f'<rect x="110" y="44" width="624" height="{H}" rx="28" fill="url(#dots)"/>']
    for b in sorted(BUILDINGS, key=lambda b: b[4]):
        parts += building(b, rnd)
    parts.append('</svg>')
    open(out_path, 'w').write('\n'.join(parts))

if __name__ == '__main__':
    main(sys.argv[1])
