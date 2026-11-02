"""Contact sheet: python3 sheet.py out.png file1.svg ... (label = file stem)"""
import sys, pathlib, base64
from playwright.sync_api import sync_playwright
out, files = sys.argv[1], sys.argv[2:]
cells = ''.join(f'<div class="c"><div class="a"><img src="file://{pathlib.Path(f).resolve()}"></div><p>{pathlib.Path(f).stem}</p></div>' for f in files)
html = f'''<html><body style="margin:0;background:#fff6dc;font-family:sans-serif">
<style>.w{{display:flex;flex-wrap:wrap;gap:14px;padding:14px;width:1100px}}.c{{width:212px}}
.a{{position:relative;height:140px;border:3px solid #2b2140;border-radius:16px;overflow:hidden;background:#b5e05a;background-image:radial-gradient(rgba(43,33,64,.16) 1.7px,transparent 2px);background-size:11px 11px}}
.a img{{position:absolute;left:50%;bottom:-3px;transform:translateX(-50%);width:176px;height:176px}}p{{margin:4px 0 0;font-size:13px;font-weight:700}}</style>
<div class="w">{cells}</div></body></html>'''
p = pathlib.Path(out).with_suffix('.html'); p.write_text(html)
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': 1128, 'height': 400})
    pg.goto(f'file://{p.resolve()}'); pg.wait_for_timeout(300)
    pg.screenshot(path=out, full_page=True); b.close()
print('ok', out)
