import json, pathlib
from lsdata import *
from playwright.sync_api import sync_playwright
F = S / 'game/fonts'
fonts = f"""<style>
@font-face{{font-family:'Baloo 2';font-weight:800;src:url('file://{F}/baloo-2-latin-800-normal.woff2')}}
@font-face{{font-family:'Nunito';font-weight:700;src:url('file://{F}/nunito-latin-700-normal.woff2')}}
@font-face{{font-family:'Nunito';font-weight:800;src:url('file://{F}/nunito-latin-800-normal.woff2')}}
@font-face{{font-family:'Nunito';font-weight:900;src:url('file://{F}/nunito-latin-900-normal.woff2')}}
</style>"""
from cards import LEGENDS
cards = [c for t in TRIBES for c in BY_TRIBE[t]] + NEIGHBOURS + LEGENDS
body = ''.join(f'<div class="w" data-n="{html.escape(c.name)}">{card_html(c)}</div>' for c in cards)
p = S / 'tools/_fit.html'
p.write_text(f'<html><head>{fonts}<style>{CARD_CSS}body{{font-family:Nunito}}.w{{display:inline-block;margin:30px}}</style></head><body>{body}</body></html>')
js = """() => { const out = {};
 for (const w of document.querySelectorAll('.w')) { const card = w.querySelector('.card'), t = w.querySelector('.txt');
   let fs = 13.5; t.style.fontSize = fs + 'px';
   while (fs > 10 && (t.getBoundingClientRect().bottom - card.getBoundingClientRect().top) > 288) { fs -= .5; t.style.fontSize = fs + 'px'; }
   out[w.dataset.n] = fs; } return out; }"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--allow-file-access-from-files'])
    pg = b.new_page(); pg.goto(f'file://{p}'); pg.wait_for_timeout(500)
    res = pg.evaluate(js); b.close()
(S / 'tools/fit.json').write_text(json.dumps(res))
small = {k: v for k, v in res.items() if v < 12}
print(len(res), 'below 12px:', small)
