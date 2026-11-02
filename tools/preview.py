"""Render a .dc.html artboard locally for review: python3 preview.py <file.dc.html> <out.png> <w> <h> [scale]"""
import re, sys, json, pathlib
from playwright.sync_api import sync_playwright

S = pathlib.Path(__file__).resolve().parent.parent
BLOBS = json.loads((S / 'tools/blobs.json').read_text())
F = S / 'game/fonts'
FONTS = f"""<style>
@font-face{{font-family:'Baloo 2';font-weight:700;src:url('file://{F}/baloo-2-latin-700-normal.woff2')}}
@font-face{{font-family:'Baloo 2';font-weight:800;src:url('file://{F}/baloo-2-latin-800-normal.woff2')}}
@font-face{{font-family:'Nunito';font-weight:700;src:url('file://{F}/nunito-latin-700-normal.woff2')}}
@font-face{{font-family:'Nunito';font-weight:800;src:url('file://{F}/nunito-latin-800-normal.woff2')}}
@font-face{{font-family:'Nunito';font-weight:900;src:url('file://{F}/nunito-latin-900-normal.woff2')}}
</style>"""

src, out, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 1
html = pathlib.Path(src).read_text()
html = html.replace('{{tribe}}', '#2ecb6e')
html = re.sub(r'<script src="./support.js"></script>', '', html)
html = re.sub(r'<link[^>]+fonts.googleapis[^>]*>', '', html)
for bid, path in BLOBS.items():
    html = html.replace(f'/_blob/{bid}', f'file://{S / path}')
html = html.replace('<head>', '<head>' + FONTS, 1)
tmp = S / 'tools/_render.html'
tmp.write_text(html)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=scale)
    pg.goto(f'file://{tmp}')
    pg.wait_for_timeout(500)
    pg.screenshot(path=out)
    b.close()
print('ok', out)
