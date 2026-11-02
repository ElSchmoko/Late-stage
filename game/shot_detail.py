import pathlib
from playwright.sync_api import sync_playwright
D = pathlib.Path(__file__).parent
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1.5)
    pg.goto(f'file://{D.parent}/dist/index.html'); pg.wait_for_timeout(800)
    pg.click('text=New run', force=True); pg.wait_for_timeout(700)
    pg.locator('#stage button.ab').nth(0).click(force=True); pg.click('text=Start', force=True); pg.wait_for_timeout(1500)
    t = pg.evaluate("(()=>{const t=[...document.querySelectorAll('.tok')].find(t=>Math.abs(parseFloat(t.style.top)-74)<2);const r=t.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
    pg.mouse.click(*t); pg.wait_for_timeout(600); pg.screenshot(path=str(D / 'shots/detail.png'))
    pg.mouse.click(40, 380); pg.wait_for_timeout(300)
    pg.hover('.tribebtn'); pg.wait_for_timeout(300); pg.screenshot(path=str(D / 'shots/tribes.png'))
    b.close()
