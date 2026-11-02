"""Hero data + elaborate hero card frame."""
import html
from lsdata import BLOB, fmt, ico, page, S

HEROES = [
    # slug, name, power, cost, effect, pushes, boundaries, unlock, colour
    ('remote', 'The Remote Worker', 'Work from Home', 'Passive', 'Minions you Save in the Feed gain +1/+1 at the start of each turn they stay saved.', 'Saving strong Feed minions', 6, None, '#8fd4ff'),
    ('boomer', 'The Reply-All Guy', 'Reply All', '1', 'Give a minion of your choice and every minion in the Feed +1/+1.', 'Buffing the Feed', 5, None, '#ff9a8a'),
    ('h_gymbro', 'The Gym Bro', 'Never Skip Leg Day', 'Passive', 'End of turn: give your lowest-Attack minion +1/+1.', 'Even, wide boards', 6, None, '#ffc928'),
    ('h_procrastinator', 'The Procrastinator', 'Tomorrow', 'Passive', 'Unspent gold carries over to next turn, up to 3.', 'Big saved-up turns', 5, None, '#b18cff'),
    ('h_bargainhunter', 'The Bargain Hunter', 'Coupon Clipper', 'Passive', 'Minions cost 2 gold. Scrolling costs 2 gold.', 'Hiring lots, scrolling little', 2, 'Hire 100 minions', '#4fd1c5'),
    ('h_doomscroller', 'The Doomscroller', 'Endless Feed', 'Passive', 'Your first Scroll each turn is free.', 'Hunting triples', 5, 'Scroll 150 times', '#5ab8ff'),
    ('h_serial', 'The Serial Entrepreneur', 'Pivot', '2', 'Transform a friendly minion into a random minion one tier higher.', 'Turning duds into upgrades', 0, 'Reach ★★★★★★', '#2ecb6e'),
    ('h_overthinker', 'The Overthinker', 'Pros and Cons', '1', 'Discover a minion of your tier and add it to the Feed. You still pay 3 gold to hire it.', 'Finding specific cards', 4, 'Win with 4 tribes on your board', '#ff8a3d'),
    ('h_lifecoach', 'The Life Coach', 'Accountability Partner', '1', 'Choose a minion. If it survives the next combat, it gains +2/+2 permanently.', 'Protecting one carry', 6, 'Keep one minion alive 3 combats in a row', '#ff8ab8'),
    ('h_minimalist', 'The Minimalist', 'Sparks Joy', 'Passive', 'Start of combat: give your minions +1/+1 for each empty board slot.', 'Small elite boards', 8, 'Win a combat with 3 or fewer minions', '#e6dccb'),
    ('h_complainer', 'The Complainer', 'Refund Request', 'Passive', 'After you lose a combat, gain 2 extra gold next turn.', 'Comebacks', 8, 'Top 4 after dropping below 10 Sanity', '#b5e05a'),
    ('h_ex', 'The Ex', 'Back Again', 'Passive', 'The first friendly minion that dies each combat comes back with 1 Health.', 'Legacy and death synergies', 3, 'Have your minions Rebrand 25 times', '#ff6b5e'),
]
HERO_BY = {h[0]: h for h in HEROES}

HERO_CSS = """
.hero{position:relative;text-align:left;width:260px;height:388px;box-sizing:border-box;border:4px solid #2b2140;border-radius:30px;flex-shrink:0;
 background:linear-gradient(135deg,#ffd6ec 0%,#fff2b0 22%,#c8f2e4 44%,#cfe2ff 66%,#ead6ff 88%,#ffd6ec 100%);box-shadow:6px 8px 0 #2b2140}
.hero::before{content:'';position:absolute;inset:0;border-radius:26px;background-image:radial-gradient(rgba(255,255,255,.75) 1.4px,transparent 1.8px),repeating-linear-gradient(115deg,rgba(255,255,255,0) 0 18px,rgba(255,255,255,.35) 18px 24px);background-size:9px 9px,auto}
.hero .in{position:absolute;left:10px;right:10px;top:10px;bottom:10px;border:3px solid #2b2140;border-radius:22px;background:#ffffff}
.hero .arch{position:absolute;left:14px;right:14px;top:14px;height:170px;box-sizing:border-box;border:3px solid #2b2140;border-radius:110px 110px 16px 16px;overflow:visible}
.hero .arch .sky{position:absolute;inset:0;border-radius:107px 107px 13px 13px;overflow:hidden}
.hero .arch .rays{position:absolute;left:50%;top:60%;width:420px;height:420px;margin:-210px 0 0 -210px;background:repeating-conic-gradient(rgba(255,255,255,.38) 0 9deg,rgba(255,255,255,0) 9deg 18deg)}
.hero .arch img{position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);width:200px;height:200px;display:block}
.hero .rib{position:absolute;left:-8px;right:-8px;top:166px;height:40px;z-index:2}
.hero .rib svg{position:absolute;inset:0}
.hero .rib p{position:absolute;left:0;right:0;top:9px;margin:0;text-align:center;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:19px;line-height:1;white-space:nowrap}
.hero .pw{position:absolute;left:22px;right:22px;top:216px;display:flex;align-items:center;gap:8px}
.hero .pw .hx{width:40px;height:44px;flex-shrink:0;position:relative}
.hero .pw .hpn{font-family:'Baloo 2',sans-serif;font-weight:800;font-size:16px;line-height:1.05}
.hero .pw .cost{display:inline-flex;align-items:center;gap:3px;margin-top:3px;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:11px;letter-spacing:.06em;line-height:1;color:#5a5270}
.hero .eff{position:absolute;left:22px;right:22px;top:268px;margin:0;font-size:12.5px;font-weight:700;line-height:1.4}
.hero .bdg{position:absolute;bottom:-16px;width:54px;height:50px;display:flex;align-items:center;justify-content:center;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:22px;line-height:1;padding-top:6px;box-sizing:border-box;z-index:3}
.hero .bdg svg{position:absolute;inset:0}
.hero .bdg span{position:relative}
.hero .lock{position:absolute;left:13px;right:13px;top:208px;bottom:13px;border-radius:0 0 19px 19px;background:#3d3352;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 18px 14px;box-sizing:border-box;color:#ffffff;text-align:center}
.hero .lock p{margin:6px 0 0;font-size:13px;font-weight:800;line-height:1.35}
.hero.locked .arch{filter:grayscale(1)}
.hero .lock .ch{font-family:'Baloo 2',sans-serif;font-weight:800;font-size:11px;letter-spacing:.12em;color:#ffc928;margin-top:8px}
"""

HEX = ('<svg width="40" height="44" viewBox="0 0 40 44" aria-hidden="true"><path d="M20 3L36 12V32L20 41L4 32V12Z" fill="#2fd0d0" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path>'
       '<path d="M20 12l2.6 5.4 5.9.8-4.3 4.1 1 5.8L20 25.3l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="#ffffff" stroke="#2b2140" stroke-width="2" stroke-linejoin="round"></path></svg>')
RIB = ('<svg width="100%" height="40" viewBox="0 0 252 40" preserveAspectRatio="none" aria-hidden="true">'
       '<path d="M4 8H24V34H4L12 21Z" fill="#e0a800" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path>'
       '<path d="M248 8H228V34H248L240 21Z" fill="#e0a800" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path>'
       '<path d="M18 4H234V30H18Z" fill="#ffc928" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path></svg>')
HEART = ('<svg width="54" height="50" viewBox="0 0 54 50" aria-hidden="true"><path d="M27 46C10 34 3 25 3 15.5 3 8 9 3 16 3c5 0 9 3 11 7 2-4 6-7 11-7 7 0 13 5 13 12.5C51 25 44 34 27 46Z" '
         'fill="#ff6b5e" stroke="#2b2140" stroke-width="4" stroke-linejoin="round"></path></svg>')
SHIELD = ('<svg width="54" height="50" viewBox="0 0 54 50" aria-hidden="true"><path d="M27 3L48 9V24C48 36 38 44 27 47 16 44 6 36 6 24V9Z" fill="#c9c2d6" stroke="#2b2140" stroke-width="4" stroke-linejoin="round"></path></svg>')
LOCK = ico('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#ffc928"></rect><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"></path>', 34, 2.4)


def hero_card(h, locked=False, extra_style=''):
    slug, nm, pw, cost, eff, push, bnd, unlock, col = h
    fs = 19 if len(nm) <= 18 else 16
    cost_html = ('PASSIVE' if cost == 'Passive' else
                 f'<span style="display: inline-flex; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #2b2140; background: #ffc928; align-items: center; justify-content: center; color: #2b2140; font-size: 11px; padding-top: 2px; box-sizing: border-box">{cost}</span> GOLD · ONCE PER TURN')
    o = (f'<div class="hero{" locked" if locked else ""}" style="{extra_style}"><div class="in"></div>'
         f'<div class="arch" style="background: {col}"><div class="sky" style="background: {col}"><div class="rays"></div></div>'
         f'<img src="/_blob/{BLOB[slug]}" alt="{html.escape(nm)}"></div>'
         f'<div class="rib">{RIB}<p style="font-size: {fs}px">{html.escape(nm.replace("The ", ""))}</p></div>'
         f'<div class="pw"><div class="hx">{HEX}</div><div><div class="hpn">{html.escape(pw)}</div><div class="cost">{cost_html}</div></div></div>'
         f'<p class="eff">{fmt(eff)}</p>'
         f'<div class="bdg" style="left: -16px" role="img" aria-label="30 Sanity">{HEART}<span>30</span></div>'
         f'<div class="bdg" style="right: -16px" role="img" aria-label="{bnd} Boundaries">{SHIELD}<span>{bnd}</span></div>')
    if locked:
        o += f'<div class="lock">{LOCK}<div class="ch">TO UNLOCK</div><p>{html.escape(unlock)}</p></div>'
    return o + '</div>'


def board():
    b = ('<div style="width: 1340px; height: 1600px; box-sizing: border-box; padding: 56px 64px; background: #fff6dc; font-family: Nunito, system-ui, sans-serif; color: #2b2140">'
         '<p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 15px; letter-spacing: .14em; color: #5a5270">LATE STAGE · HEROES</p>'
         '<h1 style="margin: 6px 0 4px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 56px; line-height: 1">12 heroes</h1>'
         '<p style="margin: 0 0 40px; font-size: 16px; font-weight: 700; color: #3d3352">Heroes are not minions, so they get their own frame: a foil card, an arched portrait with sun rays, a name ribbon, a hero-power plate, and Sanity and Boundaries badges. 4 start unlocked; locked heroes show their challenge.</p>'
         '<div style="display: grid; grid-template-columns: repeat(4, 260px); gap: 54px 50px">')
    for i, h in enumerate(HEROES):
        b += hero_card(h, locked=h[7] is not None and i > 5)
    return b + '</div></div>'


if __name__ == '__main__':
    (S / 'cards/project/Heroes.dc.html').write_text(page('Hero cards', HERO_CSS, board(), 1340, 1600))
    print('ok')
