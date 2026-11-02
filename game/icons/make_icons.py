"""Render app icons (web + Android) from HTML with Playwright. python3 game/icons/make_icons.py"""
import pathlib, base64
from playwright.sync_api import sync_playwright
D = pathlib.Path(__file__).resolve().parent; G = D.parent; R = G.parent
font = base64.b64encode((G / 'fonts/baloo-2-latin-800-normal.woff2').read_bytes()).decode()
art = (R / 'art/trashpanda.svg').read_text()
def page(size, bg=True, safe=1.0):
    s = size * safe
    return f'''<html><head><style>@font-face{{font-family:B;src:url(data:font/woff2;base64,{font})}}
body{{margin:0;width:{size}px;height:{size}px;display:flex;align-items:center;justify-content:center;background:{'#ffc928' if bg else 'transparent'};
 {'background-image:radial-gradient(rgba(43,33,64,.18) '+str(size/60)+'px,transparent '+str(size/50)+'px);background-size:'+str(size/9)+'px '+str(size/9)+'px;' if bg else ''}}}
.w{{position:relative;width:{s}px;height:{s}px}}
.a{{position:absolute;left:50%;top:{s*.02}px;transform:translateX(-50%);width:{s*.78}px;height:{s*.78}px}}
.t{{position:absolute;left:0;right:0;bottom:{s*.06}px;text-align:center;font-family:B;font-size:{s*.25}px;line-height:.82;color:#fff;-webkit-text-stroke:{s*.03}px #2b2140;paint-order:stroke fill;letter-spacing:-.02em}}
.t span{{color:#ff6b5e}}</style></head><body><div class="w"><img class="a" src="data:image/svg+xml;base64,{base64.b64encode(art.encode()).decode()}"><div class="t">LATE<br><span>STAGE</span></div></div></body></html>'''
jobs = [('icon-192.png', 192, True, .92), ('icon-512.png', 512, True, .92)]
dens = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
A = R / 'android/app/src/main/res'
with sync_playwright() as p:
    b = p.chromium.launch()
    def shot(html, size, out):
        pg = b.new_page(viewport={'width': size, 'height': size}); pg.set_content(html); pg.wait_for_timeout(300)
        out.parent.mkdir(parents=True, exist_ok=True); pg.screenshot(path=str(out), omit_background=True); pg.close()
    for name, size, bg, safe in jobs:
        shot(page(size, bg, safe), size, D / name)
    for d, size in dens.items():
        shot(page(size, True, .92), size, A / f'mipmap-{d}/ic_launcher.png')
        fg = int(size * 108 / 48)
        shot(page(fg, False, .62), fg, A / f'mipmap-{d}/ic_launcher_foreground.png')
    b.close()
print('icons ok')
