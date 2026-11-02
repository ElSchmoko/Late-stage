import pathlib, random
from playwright.sync_api import sync_playwright
D = pathlib.Path(__file__).parent
errs = []
def tokcenter(pg, sel_js):
    return pg.evaluate(f'''(()=>{{const t={sel_js};if(!t)return null;const r=t.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}})()''')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': 844, 'height': 390})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(f'file://{D}/late-stage-local.html'); pg.wait_for_timeout(800)
    pg.click('text=New run', force=True); pg.wait_for_timeout(700)
    pg.locator('#stage button.ab').nth(1).click(force=True); pg.click('text=Start', force=True); pg.wait_for_timeout(1300)
    FEEDTOK = "[...document.querySelectorAll('.tok')].find(t=>Math.abs(parseFloat(t.style.top)-74)<2)"
    for turn in range(40):
        if pg.evaluate('LSUI.G.screen') != 'shop': break
        me = 'LSUI.G.me'
        # level when affordable after turn 2
        lc = pg.evaluate(f'{me}.levelCost()')
        if lc is not None and pg.evaluate(f'{me}.gold[0]') >= lc + (3 if turn > 3 else 0) and turn >= 1:
            pg.mouse.click(56, 40); pg.wait_for_timeout(500)
        for k in range(6):
            if pg.evaluate(f'{me}.gold[0]') < 3: break
            full = pg.evaluate(f'{me}.board.length') >= 7
            if full:
                # sell weakest by dragging it onto the feed
                c = tokcenter(pg, "[...document.querySelectorAll('.tok')].filter(t=>Math.abs(parseFloat(t.style.top)-180)<3).sort((a,b)=>(+a.querySelector('.st.at').textContent+ +a.querySelector('.st.hp').textContent)-(+b.querySelector('.st.at').textContent+ +b.querySelector('.st.hp').textContent))[0]")
                pg.mouse.move(*c); pg.mouse.down(); pg.mouse.move(c[0], c[1] - 40, steps=5); pg.mouse.move(c[0], 100, steps=8); pg.mouse.up(); pg.wait_for_timeout(600)
            c = tokcenter(pg, FEEDTOK)
            if not c: break
            # drag from feed straight onto the board
            pg.mouse.move(*c); pg.mouse.down(); pg.mouse.move(c[0] + 10, c[1] + 30, steps=5); pg.mouse.move(400, 215, steps=8); pg.mouse.up(); pg.wait_for_timeout(800)
            for _ in range(3):
                if pg.evaluate('LSUI.G.mode') == 'target':
                    t = tokcenter(pg, "document.querySelector('.tok.target-ok')"); pg.mouse.click(*t); pg.wait_for_timeout(700)
                if pg.locator('text=/^Discover|^Triple!/').count():
                    pg.locator('#stage button.ab').first.click(force=True); pg.wait_for_timeout(900)
            # play any hand cards
            for _ in range(3):
                h = tokcenter(pg, "document.querySelector('.hc')")
                if not h or pg.evaluate(f'{me}.board.length') >= 7: break
                pg.mouse.click(h[0], h[1] - 20); pg.wait_for_timeout(700)
                if pg.evaluate('LSUI.G.mode') == 'target':
                    t = tokcenter(pg, "document.querySelector('.tok.target-ok')"); pg.mouse.click(*t); pg.wait_for_timeout(700)
                if pg.locator('text=/^Discover|^Triple!/').count():
                    pg.locator('#stage button.ab').first.click(force=True); pg.wait_for_timeout(900)
        if turn == 6: pg.screenshot(path=str(D / 'shots/t6_shop.png'))
        pg.mouse.click(790, 300); pg.wait_for_timeout(1500)
        if turn == 6: pg.wait_for_timeout(1500); pg.screenshot(path=str(D / 'shots/t6_combat.png'))
        if pg.locator('text=Skip').count(): pg.click('text=Skip', force=True)
        for _ in range(20):
            pg.wait_for_timeout(500)
            if pg.locator('text=/Back to shop|See results/').count(): break
        if pg.locator('text=See results').count(): pg.click('text=See results', force=True); pg.wait_for_timeout(2500); break
        pg.click('text=Back to shop', force=True); pg.wait_for_timeout(1200)
    print('final screen', pg.evaluate('LSUI.G.screen'), 'turns', pg.evaluate('LSUI.G.me.turn'), 'tier', pg.evaluate('LSUI.G.me.tier'), 'place', pg.evaluate('LSUI.G.me.place'))
    pg.screenshot(path=str(D / 'shots/end.png'))
    b.close()
print('errors', errs[:8])
