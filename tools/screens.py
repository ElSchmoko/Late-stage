"""Late Stage game screens (phone landscape 844x390) generated as Design-canvas artboards."""
import html
from lsdata import *

C = {c.name: c for t in TRIBES for c in BY_TRIBE[t]}
C.update({c.name: c for c in NEIGHBOURS})
CITY = '/_blob/78cecd6a14c154e9f009291c1ffa5b86'
HERO = {'remote': 'remote', 'replyall': 'boomer'}


def hero_img(slug):
    return '/_blob/' + BLOB[slug]


W, H = 844, 390
from heroes import HERO_CSS
CSS = CARD_CSS + HERO_CSS + """
.scr{position:relative;width:844px;height:390px;overflow:hidden;background:#fff6dc;font-family:'Nunito',system-ui,sans-serif;color:#2b2140}
.ab{position:absolute}
.bg{position:absolute;left:0;top:0;width:844px;height:390px;display:block}
.dim{position:absolute;inset:0;background:rgba(43,33,64,.55)}
.info{position:absolute;box-sizing:border-box;background:#2b2140;color:#ffffff;box-shadow:0 0 0 3px #ffffff;display:flex;align-items:center;justify-content:center;font-family:'Baloo 2',sans-serif;font-weight:800;line-height:1}
.sb{position:absolute;background:none;border:0;padding:0;margin:0;cursor:pointer;color:#2b2140;font-family:'Baloo 2',sans-serif;font-weight:800;line-height:1}
.sb svg{position:absolute;left:0;top:0;overflow:visible}
.btn{position:absolute;box-sizing:border-box;border:3px solid #2b2140;border-radius:999px;box-shadow:0 0 0 3px #ffffff,0 5px 0 3px #2b2140;font-family:'Baloo 2',sans-serif;font-weight:800;line-height:1;cursor:pointer;color:#2b2140;display:flex;align-items:center;justify-content:center;gap:8px;padding:3px 0 0}
.coin{position:absolute;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:50%;background:radial-gradient(circle,#ffc928 0 58%,#d99a12 58% 66%,#ffc928 66%);border:2.5px solid #2b2140;box-shadow:0 0 0 2.5px #ffffff;font-family:'Baloo 2',sans-serif;font-weight:800;line-height:1;padding-top:2px}
.surf{position:absolute;isolation:isolate;box-sizing:border-box;border:3px solid #2b2140;box-shadow:0 0 0 3px #ffffff}
.tag{position:absolute;left:16px;top:-14px;border:3px solid #2b2140;border-radius:999px;padding:2px 11px 0;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:11px;letter-spacing:.1em;line-height:1.5;white-space:nowrap}
.tok{position:absolute;isolation:isolate;width:68px;height:68px;box-sizing:border-box;border:3px solid #2b2140;border-radius:16px;background-image:radial-gradient(rgba(43,33,64,.16) 1.4px,transparent 1.7px);background-size:8px 8px;box-shadow:0 0 0 4px #ffffff,2px 5px 0 4px #2b2140}
.tok img{position:absolute;left:50%;bottom:-3px;transform:translateX(-50%);width:84px;height:84px;display:block}
.tok .clip{position:absolute;inset:0;border-radius:13px;overflow:hidden}
.st{position:absolute;bottom:-10px;width:28px;height:28px;box-sizing:border-box;border:2.5px solid #2b2140;box-shadow:0 0 0 2.5px #ffffff;display:flex;align-items:center;justify-content:center;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:17px;line-height:1;padding-top:3px;z-index:2}
.at{left:-9px;border-radius:50%;background:#ffc928;transform:rotate(-6deg)}
.hp{right:-9px;border-radius:9px;background:#ff6b5e;transform:rotate(6deg)}
.st.up{background:#2ecb6e}
.st.tmp{border-style:dashed;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.55) 0 3px,transparent 3px 7px)}
.fx{position:absolute;left:-13px !important;top:8px;display:flex;flex-direction:column;gap:2px;z-index:2}
.fx span{width:22px;height:22px;box-sizing:border-box;border-radius:50%;border:2px solid #2b2140;background:#ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #ffffff}
.tier{position:absolute;left:50%;top:-10px;transform:translateX(-50%);display:flex;gap:0;z-index:2;filter:drop-shadow(0 0 1.2px #ffffff) drop-shadow(0 0 1.2px #ffffff)}
.pip{position:absolute;right:-8px;top:-10px;z-index:3;background:#ffffff;border:2.5px solid #2b2140;border-radius:999px;padding:1px 5px 0;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:11px;line-height:1.4;display:flex;gap:2px;align-items:center}
.pip i{width:7px;height:7px;border-radius:50%;border:1.5px solid #2b2140;display:block}
.hc{position:absolute;width:84px;height:112px;box-sizing:border-box;border:3px solid #2b2140;border-radius:14px;background:#ffffff;box-shadow:0 0 0 3px #ffffff,2px 5px 0 3px #2b2140}
.hc .pn{position:relative;margin:5px 5px 0;height:58px;box-sizing:border-box;border:2.5px solid #2b2140;border-radius:9px;overflow:hidden;background-image:radial-gradient(rgba(43,33,64,.16) 1.3px,transparent 1.6px);background-size:7px 7px}
.hc .pn img{position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);width:74px;height:74px;display:block}
.hc .hn{margin:5px 4px 0;text-align:center;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:11px;line-height:1.05}
.hs{position:absolute;bottom:-10px;width:30px;height:30px;box-sizing:border-box;border:2.5px solid #2b2140;box-shadow:0 0 0 2.5px #ffffff;display:flex;align-items:center;justify-content:center;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:18px;line-height:1;padding-top:3px}
.hs.at{left:-10px}.hs.hp{right:-10px;border-radius:9px}
.av{position:absolute;box-sizing:border-box;border-radius:50%;border:2.5px solid #2b2140;overflow:hidden;background:#8fd4ff}
.av img{position:absolute;left:50%;bottom:-12%;transform:translateX(-50%);width:125%;height:125%}
.lob{position:absolute;display:flex;align-items:center;gap:3px;height:30px;padding:0 8px 0 3px;box-sizing:border-box;border-radius:999px;background:#ffffff;border:2.5px solid #2b2140;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:13px;line-height:1;padding-top:2px}
.chip{display:inline-flex;align-items:center;gap:5px;border:2.5px solid #2b2140;border-radius:999px;padding:2px 9px 0 4px;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:12px;line-height:1.4;background:#ffffff;white-space:nowrap}
.chip i{width:12px;height:12px;border-radius:4px;border:2px solid #2b2140;display:block}
.cap{position:absolute;margin:0;font-family:'Baloo 2',sans-serif;font-weight:800;line-height:1}
.panel{position:absolute;box-sizing:border-box;border:3px solid #2b2140;border-radius:24px;background:#ffffff;box-shadow:0 0 0 3px #ffffff,4px 7px 0 3px #2b2140}
.mini .card{transform-origin:top left}
.note{position:absolute;box-sizing:border-box;background:#2b2140;color:#ffffff;border-radius:12px;padding:6px 10px 5px;font-size:11.5px;font-weight:800;line-height:1.3;box-shadow:0 0 0 2.5px #ffffff}
"""

# ---------- icons ----------
FXI = {
    'eot': '<path d="M7 3h10M7 21h10M8 3q0 6 4 9q4-3 4-9M8 21q0-6 4-9q4 3 4 9" fill="#fff6dc"></path>',
    'soc': '<path d="M5 19L19 5M14.5 5H19v4.5"></path><path d="M19 19L5 5M5 9.5V5h4.5"></path>',
    'sold': '<circle cx="12" cy="12" r="8.5" fill="#ffc928"></circle><circle cx="12" cy="12" r="4"></circle>',
    'legacy': KW_ICON['Legacy'], 'seek': KW_ICON['Attention Seeker'], 'ooo': KW_ICON['Out of Office'], 'toxic': KW_ICON['Toxic'],
    'collab': KW_ICON['Collab'], 'shrug': '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" fill="#4fd1c5"></path>',
    'fi': KW_ICON['First Impression'], 'after': '<path d="M12 3v4M12 17v4M3 12h4M17 12h4" ></path><circle cx="12" cy="12" r="3.5" fill="#ffc928"></circle>',
}


def fx_of(name):
    t = face_text(C[name]) if name in C else ''
    out = []
    for key, k in [('seek', 'Attention Seeker'), ('ooo', 'Out of Office'), ('toxic', 'Toxic'), ('collab', 'Collab'),
                   ('soc', 'Start of combat'), ('eot', 'End of turn'), ('sold', 'When sold'), ('legacy', 'Legacy'), ('shrug', 'survives damage')]:
        if k in t:
            out.append(key)
    if not out and t.startswith('After'):
        out.append('after')
    return out[:2]


STAR11 = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4-4.7-4.4 6.4-.8z" fill="#ffc928" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path></svg>'


def tok(name, x, y, atk=None, hp=None, tier=True, golden=False, copies=None, up=None, tmp=False, ring=None, extra='', fx=True, size=None):
    c = C.get(name)
    tc = TRIBE_COL[c.tribe] if c else '#ffc928'
    atk = c.atk if atk is None else atk
    hp = c.hp if hp is None else hp
    if golden:
        atk, hp = (atk * 2 if atk == c.atk else atk), (hp * 2 if hp == c.hp else hp)
    sh = '0 0 0 4px #ffffff,2px 5px 0 4px #2b2140'
    if golden:
        sh = '0 0 0 3px #ffffff,0 0 0 7px #ffc928,0 0 0 9.5px #2b2140,2px 5px 0 9.5px #2b2140'
    if ring:
        sh = f'0 0 0 3px #ffffff,0 0 0 6px {ring},0 0 0 8.5px #2b2140,2px 4px 0 8.5px #2b2140'
    o = f'<div class="tok" style="left: {x}px; top: {y}px; background-color: {tc}; box-shadow: {sh}{extra}">'
    o += f'<div class="clip"><img src="{art(name)}" alt="{html.escape(name)}"></div>'
    if tier and c:
        o += f'<div class="tier" role="img" aria-label="Tier {c.tier}">' + STAR11 * c.tier + '</div>'
    if fx and c:
        f = fx_of(name)
        if f:
            o += '<div class="fx" style="left: 4px">' + ''.join(f'<span>{ico(FXI[k], 14)}</span>' for k in f) + '</div>'
    if copies:
        o += f'<div class="pip" role="img" aria-label="{copies} of 3 copies owned">' + ''.join(
            f'<i style="background: {"#ffc928" if i < copies else "#ffffff"}"></i>' for i in range(3)) + '</div>'
    ac = ' up' if up in ('a', 'b') else ''
    hc = ' up' if up in ('h', 'b') else ''
    tm = ' tmp' if tmp else ''
    o += f'<div class="st at{ac}{tm}">{atk}</div><div class="st hp{hc}{tm}">{hp}</div></div>'
    return o


def hand(name, x, y, rot=0, cost=3):
    c = C[name]
    return (f'<div class="hc" style="left: {x}px; top: {y}px; transform: rotate({rot}deg)">'
            f'<div class="pn" style="background-color: {TRIBE_COL[c.tribe]}"><img src="{art(name)}" alt="{html.escape(name)}"></div>'
            f'<p class="hn">{html.escape(name)}</p>'
            f'<div class="hs at">{c.atk}</div><div class="hs hp">{c.hp}</div></div>')


def coin(x, y, n, s=24):
    return f'<span class="coin" style="left: {x}px; top: {y}px; width: {s}px; height: {s}px; font-size: {round(s * .54)}px">{n}</span>'


def shield(x, y, stars, cost):
    st = ''.join(f'<svg style="position: static" width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">{STAR}</svg>' for _ in range(stars))
    return (f'<button class="sb" style="left: {x}px; top: {y}px; width: 92px; height: 112px" aria-label="Tier {stars}. Level up to tier {stars + 1} for {cost} gold">'
            '<svg width="92" height="112" viewBox="0 0 92 112" aria-hidden="true"><g stroke-linejoin="round">'
            '<path d="M15 6H77Q86 6 86 15V56Q86 82 46 102Q6 82 6 56V15Q6 6 15 6Z" transform="translate(0 5)" fill="#ffffff" stroke="#ffffff" stroke-width="9"></path>'
            '<path d="M15 6H77Q86 6 86 15V56Q86 82 46 102Q6 82 6 56V15Q6 6 15 6Z" fill="#ffffff" stroke="#ffffff" stroke-width="9"></path>'
            '<path d="M15 6H77Q86 6 86 15V56Q86 82 46 102Q6 82 6 56V15Q6 6 15 6Z" transform="translate(0 5)" fill="#2b2140" stroke="#2b2140" stroke-width="3"></path>'
            '<path d="M15 6H77Q86 6 86 15V56Q86 82 46 102Q6 82 6 56V15Q6 6 15 6Z" fill="#c88af8" stroke="#2b2140" stroke-width="3"></path></g></svg>'
            f'<span class="ab" style="left: 6px; right: 6px; top: 16px; display: flex; flex-wrap: wrap; justify-content: center; gap: 0 1px">{st}</span>'
            '<span class="ab" style="left: 0; right: 0; top: 40px; text-align: center; font-size: 11px; letter-spacing: .1em">LEVEL UP</span>'
            '<span class="ab" style="left: 19px; top: 56px; width: 54px; height: 28px; box-sizing: border-box; background: #ffffff; border: 2.5px solid #2b2140; border-radius: 999px; display: flex; align-items: center; justify-content: center; gap: 4px">'
            '<svg style="position: static" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#2b2140" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="#2ecb6e"></circle><path d="M12 17V7.5M7.8 11.5L12 7.3l4.2 4.2"></path></svg>'
            f'<span class="coin" style="position: static; width: 21px; height: 21px; font-size: 12px; box-shadow: none">{cost}</span></span></button>')


def gold(x, y, n, mx, bonus=0):
    o = (f'<div class="info" style="left: {x}px; top: {y}px; width: 84px; height: 40px; border-radius: 999px; gap: 6px; font-size: 21px" role="img" aria-label="{n} of {mx} gold">'
         '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#2b2140" stroke-width="2"><circle cx="12" cy="12" r="10" fill="#ffc928"></circle><circle cx="12" cy="12" r="5" stroke="#d99a12" stroke-width="2.4"></circle></svg>'
         f'<span style="padding-top: 3px">{n}<span style="font-size: 13px; opacity: 0.7">/{mx}</span></span></div>')
    if bonus:
        o += (f'<div class="ab" style="left: {x + 6}px; top: {y + 40}px; background: #ffc928; border: 2.5px solid #2b2140; border-radius: 0 0 10px 10px; padding: 3px 7px 1px; '
              f'font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 11px; line-height: 1.3; white-space: nowrap" role="img" aria-label="{bonus} extra gold next turn">+{bonus} next turn</div>')
    return o


def scroll_btn(x, y, cost=1):
    return (f'<button class="sb" style="left: {x}px; top: {y}px; width: 68px; height: 72px" aria-label="Scroll the Feed, {cost} gold">'
            '<svg width="68" height="72" viewBox="0 0 68 72" aria-hidden="true"><circle cx="34" cy="38" r="28" fill="#ffffff" stroke="#ffffff" stroke-width="9"></circle><circle cx="34" cy="33" r="28" fill="#ffffff" stroke="#ffffff" stroke-width="9"></circle><circle cx="34" cy="38" r="28" fill="#2b2140" stroke="#2b2140" stroke-width="3"></circle><circle cx="34" cy="33" r="28" fill="#8fd4ff" stroke="#2b2140" stroke-width="3"></circle><g transform="translate(18 17) scale(1.34)" fill="none" stroke="#2b2140" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 10A8 8 0 0 0 5.4 6.6"></path><path d="M5 2.8v4.4h4.4"></path><path d="M4.5 14a8 8 0 0 0 14.1 3.4"></path><path d="M19 21.2v-4.4h-4.4"></path></g></svg>'
            f'{coin(46, 46, cost)}</button>')


def save_btn(x, y, on=False):
    fill = '#ff8ab8'
    lab = 'Saved' if on else 'Save'
    return (f'<button class="sb" style="left: {x}px; top: {y}px; width: 58px; height: 74px" aria-label="{"Feed saved for next turn" if on else "Save the Feed for next turn"}" aria-pressed="{"true" if on else "false"}">'
            '<svg width="58" height="74" viewBox="0 0 58 74" aria-hidden="true"><g stroke-linejoin="round"><path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" transform="translate(0 5)" fill="#ffffff" stroke="#ffffff" stroke-width="9"></path><path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" fill="#ffffff" stroke="#ffffff" stroke-width="9"></path><path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" transform="translate(0 5)" fill="#2b2140" stroke="#2b2140" stroke-width="3"></path>'
            f'<path d="M10 6H48Q52 6 52 10V64L29 51L6 64V10Q6 6 10 6Z" fill="{fill}" stroke="#2b2140" stroke-width="3"></path></g></svg>'
            f'<span class="ab" style="left: 0; right: 0; top: 23px; text-align: center; font-size: 14px">{lab}</span></button>')


def ready_btn(x, y, t='0:41', label='Ready'):
    return (f'<button class="sb" style="left: {x}px; top: {y}px; width: 88px; height: 110px" aria-label="{label}">'
            '<svg width="88" height="110" viewBox="0 0 88 110" aria-hidden="true"><rect x="6" y="12" width="76" height="90" rx="38" fill="#ffffff" stroke="#ffffff" stroke-width="9"></rect><rect x="6" y="6" width="76" height="90" rx="38" fill="#ffffff" stroke="#ffffff" stroke-width="9"></rect><rect x="6" y="12" width="76" height="90" rx="38" fill="#2b2140" stroke="#2b2140" stroke-width="3"></rect><rect x="6" y="6" width="76" height="90" rx="38" fill="#2ecb6e" stroke="#2b2140" stroke-width="3"></rect><path d="M22 30Q26 18 40 15" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity="0.7"></path></svg>'
            f'<span class="ab" style="left: 0; right: 0; top: 45px; text-align: center; font-size: 22px">{label}</span></button>')


def power_btn(x, y, name='Work from Home', cost=None, passive=True, ready=True):
    lab = f'Hero power: {name}, ' + ('passive' if passive else f'{cost} gold')
    fill = '#2fd0d0' if ready else '#c9c2d6'
    o = (f'<button class="sb" style="left: {x}px; top: {y}px; width: 70px; height: 76px" aria-label="{lab}">'
         '<svg width="70" height="76" viewBox="0 0 70 76" aria-hidden="true"><g stroke-linejoin="round"><path d="M35 6L62 21V52L35 67L8 52V21Z" transform="translate(0 5)" fill="#ffffff" stroke="#ffffff" stroke-width="9"></path><path d="M35 6L62 21V52L35 67L8 52V21Z" fill="#ffffff" stroke="#ffffff" stroke-width="9"></path><path d="M35 6L62 21V52L35 67L8 52V21Z" transform="translate(0 5)" fill="#2b2140" stroke="#2b2140" stroke-width="3"></path>'
         f'<path d="M35 6L62 21V52L35 67L8 52V21Z" fill="{fill}" stroke="#2b2140" stroke-width="3"></path></g>'
         '<g transform="translate(20 20) scale(1.25)" fill="none" stroke="#2b2140" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="12" rx="2" fill="#fff6dc"></rect><path d="M8 21h8M12 17v4"></path><path d="M9 11l2 2 4-4"></path></g></svg>')
    if not passive:
        o += coin(50, -2, cost)
    o += (f'<span class="ab" style="left: -20px; right: -20px; top: 76px; text-align: center; font-size: 11px; line-height: 1.1; white-space: nowrap">'
          f'{name} <span style="font-family: Nunito, sans-serif; font-size: 10px; opacity: .75">· {"Passive" if passive else "Once per turn"}</span></span></button>')
    return o


def me(x=16, y=290, hp=27, slug='remote', name='The Remote Worker', armor=0):
    o = (f'<div class="av" style="left: {x}px; top: {y}px; width: 88px; height: 88px; border-width: 3px; box-shadow: 0 0 0 4px #ffffff"><img src="{hero_img(slug)}" alt="Your hero, {name}"></div>'
         f'<div class="ab" style="left: {x + 56}px; top: {y + 56}px; width: 42px; height: 34px; box-sizing: border-box; border-radius: 11px; border: 3px solid #2b2140; background: #ff6b5e; box-shadow: 0 0 0 3px #ffffff; display: flex; align-items: center; justify-content: center; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 20px; line-height: 1; padding-top: 3px" role="img" aria-label="Sanity {hp}">{hp}</div>')
    if armor:
        o += (f'<div class="ab" style="left: {x + 60}px; top: {y + 24}px; width: 32px; height: 30px; box-sizing: border-box; border-radius: 8px 8px 16px 16px; border: 3px solid #2b2140; background: #c9c2d6; box-shadow: 0 0 0 3px #ffffff; display: flex; align-items: center; justify-content: center; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 15px; line-height: 1; padding-top: 3px" role="img" aria-label="Boundaries {armor}">{armor}</div>')
    return o


LOBBY = [('remote', 27, 'You', True), ('h_gymbro', 31, 'Gym Bro', False), ('boomer', 22, 'Reply-All', False), ('h_ex', 19, 'The Ex', False),
         ('h_minimalist', 30, 'Minimalist', False), ('h_complainer', 12, 'Complainer', False), ('h_doomscroller', 8, 'Doomscroll', False),
         ('h_serial', 0, 'Serial Ent.', False)]


def lobby_strip(x=114, y=8, nxt='boomer', last=None):
    """Lobby standings, ordered by Sanity: hero portrait + Sanity, next opponent marked, dead players faded."""
    o = f'<div class="ab" style="left: {x}px; top: {y}px; display: flex; gap: 5px" role="list" aria-label="Lobby standings">'
    for i, (slug, hp, nm, you) in enumerate(sorted(LOBBY, key=lambda r: -r[1])):
        dead = hp <= 0
        bg = '#ffc928' if you else '#ffffff'
        ring = 'box-shadow: 0 0 0 3px #ff6b5e;' if slug == nxt else ''
        o += (f'<div role="listitem" aria-label="{i + 1}. {nm}, {hp} Sanity{", next opponent" if slug == nxt else ""}{", out" if dead else ""}" '
              f'style="position: relative; display: flex; align-items: center; gap: 3px; height: 30px; box-sizing: border-box; padding: 2px 8px 0 2px; border-radius: 999px; border: 2.5px solid #2b2140; background: {bg}; {ring} '
              f'font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px; line-height: 1; {"opacity: .45;" if dead else ""}">'
              f'<span style="position: relative; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #2b2140; overflow: hidden; background: #8fd4ff; margin-top: -2px"><img src="{hero_img(slug)}" alt="" style="position: absolute; left: -4px; bottom: -4px; width: 30px; height: 30px"></span>'
              f'{"✕" if dead else hp}')
        if slug == nxt:
            o += '<span style="position: absolute; left: 50%; top: 24px; transform: translateX(-50%); background: #ff6b5e; color: #2b2140; border: 2px solid #2b2140; border-radius: 6px; padding: 1px 4px 0; font-size: 9px; letter-spacing: .08em; line-height: 1.3">NEXT</span>'
        o += '</div>'
    return o + '</div>'


LOBBY_TRIBES = ['Hustler', 'Influencer', 'Punk', 'Philosopher', 'Feral']


def tribes_box(x, y):
    o = (f'<div class="ab" style="left: {x}px; top: {y}px; width: 96px; box-sizing: border-box; background: #ffffff; border: 2.5px solid #2b2140; border-radius: 14px; padding: 6px 6px 7px; box-shadow: 0 0 0 3px #ffffff" role="group" aria-label="Tribes in this lobby">'
         '<p style="margin: 0 0 4px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 10px; letter-spacing: .12em; color: #5a5270; line-height: 1">IN THIS LOBBY</p>')
    for t in LOBBY_TRIBES:
        o += (f'<div style="display: flex; align-items: center; gap: 5px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 11px; line-height: 1.5">'
              f'<i style="width: 10px; height: 10px; border-radius: 3px; border: 2px solid #2b2140; background: {TRIBE_COL[t]}; display: block"></i>{TRIBE_PLURAL[t]}</div>')
    return o + '</div>'


def scr(body, extra_bg=True, dim=False):
    o = '<div class="scr">'
    if extra_bg:
        o += f'<img class="bg" src="{CITY}" alt="">'
    if dim:
        o += '<div class="dim"></div>'
    return o + body + '</div>'


# Board state reused across shop screens
FEED = [('Personal Brand', {}), ('Sneaker Reseller', {'copies': 2}), ('Heckler', {}), ('Stan Account', {}), ('Nosy Neighbour', {})]
BOARD = [('Middle Manager', dict(atk=2, hp=7, ring='#ffc928')), ('Grindset Guru', dict(atk=6, hp=4, up='b')), ('Crypto Bro', {}),
         ('Shower Thinker', {}), ('Sneaker Reseller', dict(atk=7, hp=7, tmp=True)), ('Unpaid Intern', {})]


def feed_surface(items, x=114, y=58, w=616, h=96, saved=False, highlight=None):
    o = (f'<div class="surf" style="left: {x}px; top: {y}px; width: {w}px; height: {h}px; border-radius: 22px; background: #ffffff{"; outline: 3px dashed #ff8ab8; outline-offset: 4px" if saved else ""}">'
         f'<div class="tag" style="background: #ff8ab8">THE FEED · 3 GOLD EACH</div>')
    n = len(items)
    x0 = (w - (n * 68 + (n - 1) * 28)) // 2
    for i, (nm, kw) in enumerate(items):
        o += tok(nm, x0 + i * 96, 16, tier=True, **kw)
    return o + '</div>'


def board_surface(items, x=114, y=166, w=616, h=96, cap=7, gap_at=None, label='YOUR BOARD'):
    o = (f'<div class="surf" style="left: {x}px; top: {y}px; width: {w}px; height: {h}px; border-radius: 24px; background: #eeeaf5">'
         f'<div class="tag" style="background: #ffffff">{label} · {len(items)}/{cap}</div>')
    n = len(items) + (1 if gap_at is not None else 0)
    x0 = (w - (n * 68 + (n - 1) * 20)) // 2
    k = 0
    for i in range(n):
        xx = x0 + i * 88
        if gap_at is not None and i == gap_at:
            o += (f'<div class="ab" style="left: {xx}px; top: 14px; width: 68px; height: 68px; box-sizing: border-box; border: 3px dashed #2b2140; border-radius: 16px; background: rgba(255,255,255,.7); display: flex; align-items: center; justify-content: center">'
                  f'{ico("<path d=\'M12 5v14M5 12h14\'></path>", 24, 3)}</div>')
            continue
        nm, kw = items[k]
        k += 1
        o += tok(nm, xx, 14, **kw)
    return o + '</div>'


def shop_chrome(gold_n=6, bonus=1, saved=False, t='0:41', power_ready=True):
    return (shield(10, 10, 3, 6) + tribes_box(10, 150) + me(armor=4) + gold(746, 10, gold_n, 8, bonus) + scroll_btn(754, 78)
            + save_btn(759, 158, saved) + ready_btn(746, 246, t) + power_btn(134, 286, ready=power_ready))


# ---------------- screens ----------------
def s_title():
    b = ('<div class="ab" style="left: 0; top: 0; width: 844px; height: 390px; background: linear-gradient(180deg, rgba(255,246,220,0) 30%, rgba(255,246,220,.85) 75%)"></div>'
         '<div class="ab" style="left: 0; right: 0; top: 66px; text-align: center">'
         '<p style="margin: 0; display: inline-block; background: #2b2140; color: #ffc928; border-radius: 999px; padding: 3px 14px 1px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: .2em; box-shadow: 0 0 0 3px #ffffff">AN AUTOBATTLER ABOUT MODERN LIFE</p>'
         '<h1 style="margin: 8px 0 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 112px; line-height: .9; letter-spacing: -.02em; color: #ffffff; '
         '-webkit-text-stroke: 5px #2b2140; paint-order: stroke fill; text-shadow: 0 9px 0 #2b2140, 0 0 0 #fff">Late <span style="color: #ff6b5e">Stage</span></h1></div>'
         '<button class="btn" style="left: 302px; top: 236px; width: 240px; height: 62px; background: #2ecb6e; font-size: 30px">'
         + ico('<path d="M7 4.5v15l12-7.5z" fill="#ffffff"></path>', 26, 2.6) + 'New run</button>'
         '<button class="btn" style="left: 252px; top: 318px; width: 160px; height: 44px; background: #ffffff; font-size: 18px">'
         + ico('<rect x="4" y="4" width="7" height="9" rx="1.5" fill="#ff8ab8"></rect><rect x="13" y="4" width="7" height="9" rx="1.5" fill="#8fd4ff"></rect><rect x="4" y="15" width="16" height="5" rx="1.5" fill="#ffc928"></rect>', 20) + 'Collection</button>'
         '<button class="btn" style="left: 432px; top: 318px; width: 160px; height: 44px; background: #ffffff; font-size: 18px">'
         + ico('<circle cx="12" cy="8" r="4" fill="#ffc928"></circle><path d="M4.5 20q1-6 7.5-6t7.5 6"></path>', 20) + 'Heroes 5/12</button>'
         '<button class="sb" style="left: 776px; top: 16px; width: 52px; height: 52px; border-radius: 50%; background: #ffffff; border: 3px solid #2b2140; box-shadow: 0 0 0 3px #ffffff" aria-label="Settings">'
         + ico('<circle cx="12" cy="12" r="3.2"></circle><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"></path>', 26) + '</button>'
         '<div class="ab" style="left: 16px; top: 16px; display: flex; align-items: center; gap: 8px; background: #ffffff; border: 2.5px solid #2b2140; border-radius: 999px; padding: 4px 12px 2px 4px; box-shadow: 0 0 0 3px #ffffff; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px; line-height: 1.2">'
         f'<span class="av" style="position: relative; width: 30px; height: 30px; border-width: 2px"><img src="{hero_img("h_lifecoach")}" alt=""></span>'
         '<span>Next unlock: The Life Coach<br><span style="font-family: Nunito, sans-serif; font-size: 11px; color: #5a5270">Keep one minion alive 3 combats in a row · 2/3</span></span></div>'
         '<div class="ab" style="left: 600px; top: 250px; transform: rotate(8deg)">' + tok('Main Character', 0, 0, fx=False) + '</div>'
         '<div class="ab" style="left: 176px; top: 254px; transform: rotate(-9deg)">' + tok('Trash Panda', 0, 0, fx=False) + '</div>')
    return scr(b)


HEROES3 = [('h_gymbro', 'The Gym Bro', 'Never Skip Leg Day', 'Passive', 'End of turn: give your lowest-Attack minion +1/+1.', 6, 'Even, wide boards'),
           ('boomer', 'The Reply-All Guy', 'Reply All', '1 gold', 'Give a minion of your choice and every minion in the Feed +1/+1.', 5, 'Buffing the Feed'),
           ('h_procrastinator', 'The Procrastinator', 'Tomorrow', 'Passive', 'Unspent gold carries over to next turn, up to 3.', 5, 'Big saved-up turns')]


def s_heroes():
    from heroes import hero_card, HERO_BY
    b = ('<div class="ab" style="left: 30px; top: 12px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 22px; line-height: 1; background: #ffffff; border: 3px solid #2b2140; border-radius: 999px; padding: 6px 16px 2px; box-shadow: 0 0 0 3px #ffffff">Pick your hero</div>')
    for i, slug in enumerate(['h_gymbro', 'boomer', 'h_procrastinator']):
        sel = i == 1
        x = 30 + i * 232
        lift = -8 if sel else 0
        b += (f'<button class="ab" style="left: {x}px; top: {58 + lift}px; width: 203px; height: 303px; padding: 0; border: 0; background: none; cursor: pointer" aria-pressed="{"true" if sel else "false"}" aria-label="{HERO_BY[slug][1]}">'
              f'<div style="transform: scale(.78); transform-origin: top left">{hero_card(HERO_BY[slug], extra_style="box-shadow: 0 0 0 6px #ffc928, 0 0 0 9px #2b2140, 8px 12px 0 9px #2b2140" if sel else "")}</div></button>')
    b += ('<div class="ab" style="left: 722px; top: 58px; width: 106px; box-sizing: border-box; background: #ffffff; border: 2.5px solid #2b2140; border-radius: 16px; padding: 8px 9px 9px; box-shadow: 0 0 0 3px #ffffff">'
          '<p style="margin: 0 0 5px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 10px; letter-spacing: .12em; color: #5a5270; line-height: 1.2">TRIBES IN THIS LOBBY</p>'
          + ''.join(f'<div style="display: flex; align-items: center; gap: 5px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 12px; line-height: 1.6"><i style="width: 10px; height: 10px; border-radius: 3px; border: 2px solid #2b2140; background: {TRIBE_COL[t]}; display: block"></i>{TRIBE_PLURAL[t]}</div>' for t in LOBBY_TRIBES)
          + '</div><button class="btn" style="left: 722px; top: 300px; width: 106px; height: 54px; background: #2ecb6e; font-size: 20px">Start</button>')
    return scr(b)


def s_shop():
    b = (lobby_strip() + feed_surface(FEED) + board_surface(BOARD) + shop_chrome()
         + hand('Corporate Raider', 344, 258, -5) + hand('Pirate Radio', 436, 256, 5)
         + '<div class="note" style="left: 540px; top: 296px; width: 186px">Dashed stats = buff that ends after the next combat. Green stats = buffed this turn.</div>')
    return scr(b)


def big_card(name, x, y, scale=.78, rot=0, style=True):
    c = C[name]
    sname = STYLES.get(c.style, (None, None))[1] if style else None
    return (f'<div class="ab" style="left: {x}px; top: {y}px; width: {240 * scale}px; height: {336 * scale}px">'
            f'<div style="transform: scale({scale}) rotate({rot}deg); transform-origin: top left">{card_html(c, sname)}</div></div>')


def s_hire():
    b = (lobby_strip() + feed_surface([n for n in FEED if n[0] != 'Personal Brand'] + [('Nosy Neighbour', {})][:0])
         + board_surface(BOARD[:5], gap_at=2) + shop_chrome(gold_n=6)
         + '<div class="ab" style="left: 352px; top: 170px; transform: rotate(-6deg)">' + tok('Personal Brand', 0, 0, extra='; transform: scale(1.12)') + '</div>'
         + big_card('Personal Brand', 8, 128, .54)
         + '<div class="note" style="left: 290px; top: 296px; width: 230px">Drop between minions to place it. Placement matters: First Impression targets are picked after you drop.</div>'
         + '<div class="ab" style="left: 560px; top: 300px; display: flex; align-items: center; gap: 6px; background: #ffffff; border: 2.5px solid #2b2140; border-radius: 999px; padding: 3px 10px 1px 4px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px">'
         + '<span class="coin" style="position: static; width: 22px; height: 22px; font-size: 12px">3</span>Hire cost</div>')
    return scr(b)


def s_fire():
    b = (lobby_strip() + feed_surface(FEED) + board_surface([x for x in BOARD if x[0] != 'Crypto Bro'], gap_at=2) + shop_chrome(gold_n=2)
         + '<div class="ab" style="left: 300px; top: 270px; width: 380px; height: 106px; box-sizing: border-box; border: 3px dashed #2b2140; border-radius: 24px; background: rgba(255,201,40,.85); box-shadow: 0 0 0 3px #ffffff"></div>'
         + '<div class="cap" style="left: 420px; top: 296px; font-size: 26px; display: flex; align-items: center; gap: 8px">Sell for <span class="coin" style="position: static; width: 34px; height: 34px; font-size: 19px">4</span></div>'
         + '<div class="cap" style="left: 420px; top: 330px; font-family: Nunito, sans-serif; font-size: 12px; color: #2b2140">Crypto Bro · turn 3 on board · crashes after turn 4</div>'
         + '<div class="ab" style="left: 330px; top: 286px; transform: rotate(8deg)">' + tok('Crypto Bro', 0, 0) + '</div>')
    return scr(b)


def s_discover():
    b = (lobby_strip() + feed_surface(FEED[:3]) + board_surface([('Sneaker Reseller', dict(golden=True))] + BOARD[:4]) + shop_chrome(gold_n=3))
    b += '<div class="dim"></div>'
    b += ('<div class="ab" style="left: 0; right: 0; top: 14px; text-align: center"><span style="display: inline-block; background: #ffc928; border: 3px solid #2b2140; border-radius: 999px; padding: 6px 18px 2px; box-shadow: 0 0 0 3px #ffffff; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 22px; line-height: 1">'
          'Triple! Sneaker Reseller went golden. Discover a ★★★ minion</span></div>')
    for i, nm in enumerate(['Thought Leader', 'Personal Brand', 'Squat Collective']):
        b += big_card(nm, 168 + i * 176, 62, .62)
    b += ('<button class="btn" style="left: 334px; top: 336px; width: 176px; height: 40px; background: #ffffff; font-size: 16px">'
          + ico('<circle cx="12" cy="12" r="3"></circle><path d="M2.5 12q4-7 9.5-7t9.5 7q-4 7-9.5 7t-9.5-7z"></path>', 18) + 'Peek at board</button>')
    return scr(b)


def s_combat():
    enemy = [('Stan Account', dict(atk=3, hp=2)), ('Hype Man', dict(atk=4, hp=6)), ('Viral Video', {}), ('Main Character', dict(atk=13, hp=15, ring='#ffc928')),
             ('Giveaway Host', {}), ('Follower', dict(atk=5, hp=5))]
    mine = [('Middle Manager', dict(atk=2, hp=3, ring='#ffc928')), ('Grindset Guru', dict(atk=6, hp=4)), ('Corporate Raider', {}), ('Sneaker Reseller', dict(golden=True)),
            ('Side Hustle', {}), ('Unpaid Intern', {})]
    C['Follower'] = type('X', (), dict(name='Follower', tribe='Influencer', tier=1, atk=1, hp=1, style='-', text=''))()
    b = (f'<div class="av" style="left: 16px; top: 12px; width: 70px; height: 70px; border-width: 3px; box-shadow: 0 0 0 4px #ffffff"><img src="{hero_img("boomer")}" alt="Opponent, The Reply-All Guy"></div>'
         '<div class="ab" style="left: 62px; top: 56px; width: 38px; height: 30px; box-sizing: border-box; border-radius: 10px; border: 3px solid #2b2140; background: #ff6b5e; box-shadow: 0 0 0 3px #ffffff; display: flex; align-items: center; justify-content: center; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 17px; padding-top: 3px">22</div>'
         '<div class="cap" style="left: 96px; top: 20px; font-size: 15px; background: #ffffff; border: 2.5px solid #2b2140; border-radius: 999px; padding: 4px 10px 1px">The Reply-All Guy<span style="font-family: Nunito, sans-serif; font-size: 11px; color: #5a5270"> · ★★★★</span></div>'
         + board_surface(enemy, x=114, y=72, label='THEIR BOARD') + board_surface(mine, x=114, y=200)
         + me(hp=27, armor=4)
         + '<svg class="ab" style="left: 0; top: 0" width="844" height="390" aria-hidden="true"><path d="M296 210 Q318 150 370 124" fill="none" stroke="#ffffff" stroke-width="13" stroke-linecap="round"></path><path d="M296 210 Q318 150 370 124" fill="none" stroke="#ff6b5e" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 12"></path><path d="M362 114 L380 120 L366 134 Z" fill="#ff6b5e" stroke="#2b2140" stroke-width="3" stroke-linejoin="round"></path></svg>'
         + '<svg class="ab" style="left: 400px; top: 82px" width="46" height="46" viewBox="0 0 44 44" aria-hidden="true"><path d="M22 2l4.5 9 9.5-3.5-2.5 9.5 9 4.5-9 4.5 2.5 9.5-9.5-3.5-4.5 9-4.5-9-9.5 3.5 2.5-9.5-9-4.5 9-4.5-2.5-9.5 9.5 3.5z" fill="#d8433a" stroke="#2b2140" stroke-width="2.5" stroke-linejoin="round"></path><text x="22" y="28" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="15" fill="#ffffff">−6</text></svg>'
         + '<div class="info" style="left: 640px; top: 20px; width: 92px; height: 34px; border-radius: 999px; font-size: 15px; padding-top: 2px" role="img" aria-label="Round 7">Round 7</div>'
         + '<div class="ab" style="left: 124px; top: 310px; width: 600px; display: flex; flex-direction: column; gap: 4px" role="log" aria-label="Combat log">'
         + ''.join(f'<div style="align-self: flex-start; background: {bg}; border: 2.5px solid #2b2140; border-radius: 999px; padding: 3px 12px 1px; font-size: 12.5px; font-weight: 800; line-height: 1.35; opacity: {op}">{t}</div>'
                   for t, bg, op in [('Start of combat · Corporate Raider deals 5 damage to Stan Account', '#ffffff', .55),
                                     ('Grindset Guru attacks Viral Video', '#ffe9a8', 1)])
         + '</div>'
         + '<button class="btn" style="left: 750px; top: 18px; width: 76px; height: 40px; background: #ffffff; font-size: 17px" aria-label="Combat speed, 2 times">2×</button>'
         + '<button class="btn" style="left: 750px; top: 72px; width: 76px; height: 40px; background: #ffffff; font-size: 15px">Skip</button>'
         + '<div class="ab" style="left: 744px; top: 214px; width: 88px; text-align: center; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 12px; line-height: 1.2; background: #ffffff; border: 2.5px solid #2b2140; border-radius: 14px; padding: 6px 4px 4px">You attack first<br><span style="font-family: Nunito, sans-serif; font-size: 10.5px; color: #5a5270">6 v 6: coin flip</span></div>')
    return scr(b)


def s_result():
    b = s_combat()[len('<div class="scr">'):-len('</div>')]
    b += '<div class="dim"></div>'
    b += ('<div class="panel" style="left: 222px; top: 30px; width: 400px; height: 300px; padding: 16px 22px">'
          '<p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 36px; line-height: 1">Lost the round</p>'
          '<p style="margin: 6px 0 0; font-size: 13px; font-weight: 700; color: #5a5270">The Reply-All Guy had 2 minions left.</p>'
          '<div style="margin-top: 10px; display: flex; flex-direction: column; gap: 4px; font-size: 14px; font-weight: 800">'
          '<div style="display: flex; justify-content: space-between"><span>Their tier ★★★★</span><span>4</span></div>'
          '<div style="display: flex; justify-content: space-between"><span>Main Character ★★★★★★ + Follower ★</span><span>7</span></div>'
          '<div style="display: flex; justify-content: space-between; color: #5a5270"><span>Damage cap this turn</span><span>15</span></div>'
          '<div style="display: flex; justify-content: space-between; border-top: 2.5px dashed #2b2140; padding-top: 6px"><span>Boundaries absorb</span><span>−4</span></div>'
          '<div style="display: flex; justify-content: space-between; font-family: \'Baloo 2\', sans-serif; font-size: 24px"><span>Sanity</span><span style="color: #ff6b5e">27 → 20</span></div></div>'
          '<div style="margin-top: 10px; background: #ffe9a8; border: 2.5px solid #2b2140; border-radius: 12px; padding: 6px 10px 4px; font-size: 12.5px; font-weight: 800; line-height: 1.35">'
          'Their Main Character grew to 13/15. Hecklers and Corporate Raiders can snipe a single big threat.</div></div>'
          '<button class="btn" style="left: 334px; top: 338px; width: 176px; height: 42px; background: #2ecb6e; font-size: 20px">Back to shop</button>')
    return '<div class="scr">' + b + '</div>'


def s_detail():
    c = C['Too Big to Fail']
    b = (lobby_strip() + feed_surface(FEED) + board_surface(BOARD) + shop_chrome())
    b += '<div class="dim"></div>'
    b += big_card('Too Big to Fail', 92, 20, 1.02)
    b += ('<div class="panel" style="left: 370px; top: 26px; width: 440px; height: 336px; padding: 18px 22px">'
          '<p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: .12em; color: #5a5270">FULL RULES</p>'
          f'<p style="margin: 6px 0 0; font-size: 15px; font-weight: 700; line-height: 1.5">{fmt(text_of(c))}</p>'
          '<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px">'
          f'<div style="font-size: 12.5px; font-weight: 700; line-height: 1.45">{kw_chip("Attention Seeker")} Enemies must attack Attention Seekers first.</div>'
          '</div>'
          '<div style="margin-top: 14px; display: flex; gap: 10px">'
          '<div style="flex: 1; border: 2.5px solid #2b2140; border-radius: 14px; padding: 8px 10px 6px; background: #fff6dc"><p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 12px; letter-spacing: .1em; color: #5a5270">GOLDEN</p>'
          '<p style="margin: 2px 0 0; font-size: 12.5px; font-weight: 700; line-height: 1.4">12/12. Other Hustlers get <b class="v">+6/+6</b>.</p></div>'
          '<div style="flex: 1; border: 2.5px solid #2b2140; border-radius: 14px; padding: 8px 10px 6px; background: #fff6dc"><p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 12px; letter-spacing: .1em; color: #5a5270">THIS COPY</p>'
          '<p style="margin: 2px 0 0; font-size: 12.5px; font-weight: 700; line-height: 1.4">On board 2 turns. Sells for 1 gold. You own 1 of 3.</p></div></div>'
          f'<p style="margin: 14px 0 0; font-size: 13px; font-style: italic; font-weight: 700; color: #5a5270">{html.escape(flavour_of(c))}</p>'
          '<p style="position: absolute; left: 22px; bottom: 14px; margin: 0; font-size: 11.5px; font-weight: 800; color: #5a5270">Long-press any card, token or hero to open this. Tap anywhere to close.</p></div>')
    return '<div class="scr">' + f'<img class="bg" src="{CITY}" alt="">' + b + '</div>'


def s_end():
    b = ('<div class="panel" style="left: 30px; top: 22px; width: 380px; height: 346px; padding: 18px 22px">'
         '<p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: .12em; color: #5a5270">RUN OVER · TURN 14</p>'
         '<p style="margin: 2px 0 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 44px; line-height: 1">3rd <span style="font-size: 22px; color: #5a5270">of 8</span></p>'
         '<p style="margin: 2px 0 0; font-size: 13px; font-weight: 700">Top 4. Your Hustlers spent 61 gold this run.</p>'
         '<div style="margin-top: 8px; display: flex; flex-direction: column; gap: 2px">')
    final = [('h_gymbro', 'The Gym Bro', 'Ferals'), ('boomer', 'The Reply-All Guy', 'Influencers'), ('remote', 'You', 'Hustlers'),
             ('h_minimalist', 'The Minimalist', 'Philosophers'), ('h_ex', 'The Ex', 'Punks'), ('h_complainer', 'The Complainer', 'Punks'),
             ('h_doomscroller', 'The Doomscroller', 'Hustlers'), ('h_serial', 'The Serial Entrepreneur', 'Influencers')]
    for i, (slug, nm, tr) in enumerate(final):
        you = nm == 'You'
        tt = [k for k, v in TRIBE_PLURAL.items() if v == tr][0]
        b += (f'<div style="display: flex; align-items: center; gap: 8px; height: 24px; box-sizing: border-box; border-radius: 999px; padding: 0 10px 0 3px; {"background: #ffc928; border: 2.5px solid #2b2140;" if you else ""} font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13.5px; line-height: 1">'
              f'<span style="width: 18px; text-align: right">{i + 1}</span><span style="position: relative; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #2b2140; overflow: hidden; background: #8fd4ff"><img src="{hero_img(slug)}" alt="" style="position: absolute; left: -4px; bottom: -4px; width: 30px; height: 30px"></span>'
              f'<span style="flex: 1">{nm}</span><span class="chip" style="padding: 0 7px 0 3px; font-size: 11px"><i style="background: {TRIBE_COL[tt]}"></i>{tr}</span></div>')
    b += '</div></div>'
    b += ('<div class="panel" style="left: 430px; top: 22px; width: 384px; height: 266px; padding: 18px 22px">'
          '<p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: .12em; color: #5a5270">PROGRESS</p>')
    for slug, nm, goal, cur, mx, done in [('h_bargainhunter', 'The Bargain Hunter', 'Hire 100 minions', 100, 100, True),
                                          ('h_doomscroller', 'The Doomscroller', 'Scroll 150 times', 118, 150, False),
                                          ('h_ex', 'The Ex', 'Have your minions Rebrand 25 times', 9, 25, False)]:
        b += (f'<div style="margin-top: 10px; display: flex; align-items: center; gap: 10px">'
              f'<span style="position: relative; width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; border: 2.5px solid #2b2140; overflow: hidden; background: {"#ffc928" if done else "#c9c2d6"}"><img src="{hero_img(slug)}" alt="" style="position: absolute; left: -7px; bottom: -6px; width: 58px; height: 58px; {"" if done else "filter: grayscale(1); opacity: .6"}"></span>'
              f'<div style="flex: 1"><p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 15px; line-height: 1.1">{nm}{" · Unlocked!" if done else ""}</p>'
              f'<p style="margin: 1px 0 4px; font-size: 11.5px; font-weight: 700; color: #5a5270">{goal}</p>'
              f'<div style="height: 10px; border: 2px solid #2b2140; border-radius: 999px; background: #ffffff; overflow: hidden"><div style="width: {100 * cur / mx:.0f}%; height: 100%; background: {"#2ecb6e" if done else "#ffc928"}"></div></div></div>'
              f'<span style="font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px; width: 54px; text-align: right">{cur}/{mx}</span></div>')
    b += '</div>'
    b += ('<button class="btn" style="left: 438px; top: 314px; width: 176px; height: 48px; background: #2ecb6e; font-size: 21px">Play again</button>'
          '<button class="btn" style="left: 634px; top: 314px; width: 172px; height: 48px; background: #ffffff; font-size: 18px">Main menu</button>')
    return scr(b)


SCREENS = [('Title', 'Title screen', s_title), ('HeroSelect', 'Hero select', s_heroes), ('Shop', 'Shop phase', s_shop),
           ('Hire', 'Hiring a minion', s_hire), ('Fire', 'Selling a minion', s_fire), ('Discover', 'Triple and Discover', s_discover),
           ('Combat', 'Combat', s_combat), ('Result', 'Round result', s_result), ('Detail', 'Card detail (long-press)', s_detail),
           ('EndOfRun', 'End of run', s_end)]

KW_DEF = {
    'Attention Seeker': 'Enemies must attack it first.',
    'Out of Office': 'Ignores the first damage it would take.',
    'Toxic': 'Destroys any minion it damages.',
    'First Impression': 'Happens when you play it from your hand.',
    'Legacy': 'Happens when it dies.',
    'Rebrand': 'Comes back once with 1 Health after it dies.',
    'Collab': 'Sticks to a minion: that minion gets its stats and effects, and becomes a Techie too.',
    'Discover': 'Pick 1 of 3 cards to add to your hand.',
}
TRIG_DEF = [('soc', 'Start of combat', 'Happens before the first attack.'), ('eot', 'End of turn', 'Happens when you press Ready.'),
            ('sold', 'When sold', 'Happens when you sell it.'), ('legacy', 'Legacy', 'Happens when it dies.')]


def s_keywords():
    lab = "margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.12em; color: #5a5270"
    b = ('<p style="display: none"></p>' + f'<div style="width: 880px; height: 860px; box-sizing: border-box; padding: 40px 48px; background: #fff6dc; font-family: \'Nunito\', system-ui, sans-serif; color: #2b2140; display: flex; flex-direction: column">'
         f'<p style="{lab}">LATE STAGE · KEYWORDS · extra-bold in rules text, no chips</p><div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px">')
    for k, d in KW_DEF.items():
        b += f'<div style="display: flex; align-items: flex-start; gap: 8px; font-size: 13.5px; font-weight: 700; line-height: 1.4"><span style="flex-shrink: 0; margin-top: 1px">{ico(KW_ICON[k], 17)}</span><span><b class="kw">{k}</b> {d}</span></div>'
    b += f'</div><p style="{lab}; margin-top: 26px">TRIGGERS · extra-bold in rules text, small badges on tokens</p><div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px">'
    for key, k, d in TRIG_DEF:
        b += (f'<div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 700; line-height: 1.4">'
              f'<span style="width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%; border: 2.5px solid #2b2140; background: #ffffff; display: flex; align-items: center; justify-content: center">{ico(FXI[key], 17)}</span>'
              f'<span><b>{k}:</b> {d}</span></div>')
    b += f'</div><p style="{lab}; margin-top: 26px">TOKEN STATES</p>'
    ex = [('Middle Manager', dict(atk=2, hp=4, ring='#ffc928'), 'Attention Seeker', 'Yellow ring: gets attacked first.'),
          ('Sneaker Reseller', dict(golden=True), 'Golden', 'Triple: double stats, effect twice.'),
          ('Grindset Guru', dict(atk=6, hp=4, up='b'), 'Buffed this turn', 'Green stats until Ready.'),
          ('Pub Philosopher', dict(atk=6, hp=3, tmp=True), 'Next combat only', 'Dashed stats vanish after the fight.'),
          ('Sneaker Reseller', dict(tier=True, copies=2), 'In the Feed', 'Stars = tier. Dots = copies you own.'),
          ('Book-Club Stoic', dict(ring='#8fd4ff'), 'Out of Office', 'Blue ring pops on the first hit.')]
    b += '<div style="position: relative; margin-top: 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px 24px">'
    for nm, kw, t, d in ex:
        b += (f'<div style="position: relative; height: 148px; box-sizing: border-box; border: 3px solid #2b2140; border-radius: 20px; background: #eeeaf5">'
              f'<div style="position: absolute; left: 28px; top: 34px; width: 68px; height: 68px">{tok(nm, 0, 0, **kw)}</div>'
              f'<div style="position: absolute; left: 118px; right: 12px; top: 26px"><p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 17px; line-height: 1.1">{t}</p>'
              f'<p style="margin: 4px 0 0; font-size: 12.5px; font-weight: 700; line-height: 1.4">{d}</p></div></div>')
    b += '</div></div>'
    return b


if __name__ == '__main__':
    out = S / 'cards/project'
    (out / 'Keywords.dc.html').write_text(page('Keywords and token states', CSS, s_keywords(), 880, 860))
    for f, title, fn in SCREENS:
        (out / f'{f}.dc.html').write_text(page(title, CSS, fn(), W, H))
        print(f)

