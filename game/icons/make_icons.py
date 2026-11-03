"""Render app icons (web + Android) from art/icon.svg (tools/p_icon.py) with Playwright. python3 game/icons/make_icons.py"""
import pathlib, base64
from playwright.sync_api import sync_playwright
D = pathlib.Path(__file__).resolve().parent; G = D.parent; R = G.parent
svg = (R / 'art/icon.svg').read_text()
def page(size, bg=True, pad=0.0):
    """pad: share of the canvas outside the art on each side (Android adaptive foregrounds only show the middle 72 of 108 dp).
    The bin in the art runs past its edges, so a padded canvas still has the bin reaching the sides and bottom."""
    s = svg
    if pad:
        m = 200 * pad / (1 - 2 * pad)
        s = s.replace('viewBox="0 0 200 200"', f'viewBox="{-m:.2f} {-m:.2f} {200 + 2 * m:.2f} {200 + 2 * m:.2f}"')
    art = base64.b64encode(s.encode()).decode()
    dots = f'background-image:radial-gradient(rgba(43,33,64,.18) 18%,transparent 22%);background-size:{size / 7}px {size / 7}px;'
    return f'''<html><body style="margin:0;width:{size}px;height:{size}px;overflow:hidden;background:{'#ffc928' if bg else 'transparent'};{dots}">
<img src="data:image/svg+xml;base64,{art}" style="display:block;width:{size}px;height:{size}px"></body></html>'''
dens = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
A = R / 'android/app/src/main/res'
with sync_playwright() as p:
    b = p.chromium.launch()
    def shot(html, size, out):
        pg = b.new_page(viewport={'width': size, 'height': size}); pg.set_content(html); pg.wait_for_timeout(300)
        out.parent.mkdir(parents=True, exist_ok=True); pg.screenshot(path=str(out), omit_background=True); pg.close()
    for name, size in [('icon-192.png', 192), ('icon-512.png', 512)]:
        shot(page(size), size, D / name)
    for d, size in dens.items():
        shot(page(size), size, A / f'mipmap-{d}/ic_launcher.png')
        fg = int(size * 108 / 48)
        shot(page(fg, True, 18 / 108), fg, A / f'mipmap-{d}/ic_launcher_foreground.png')
    b.close()
print('icons ok')
