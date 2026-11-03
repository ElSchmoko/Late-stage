"""Shared data for Late Stage artboard generators: card list, art blobs, tribe colours, icons, text formatting."""
import json, re, sys, html, importlib, pathlib

S = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(S / 'sim'))
sys.path.insert(0, str(S / 'tools'))
from cards import BY_TRIBE, NEIGHBOURS, STYLES, TRIBES  # noqa

INK = '#2b2140'
TRIBE_COL = {'Hustler': '#14a052', 'Influencer': '#ff8ab8', 'Feral': '#d4e24a', 'Creative': '#b18cff',
             'Techie': '#5ab8ff', 'Punk': '#ff8a3d', 'Philosopher': '#4fd1c5', 'Neutral': '#e6dccb'}
TRIBE_PLURAL = {'Hustler': 'Hustlers', 'Influencer': 'Influencers', 'Feral': 'Ferals', 'Creative': 'Creatives',
                'Techie': 'Techies', 'Punk': 'Punks', 'Philosopher': 'Philosophers', 'Neutral': 'Neighbours'}
TRIBE_LABEL = {'Neutral': 'NEIGHBOUR'}

# ---- art lookup ----
SLUG = {'Dropshipper': 'dropshipper', 'Unpaid Intern': 'intern', 'Grindset Guru': 'grindset', 'Middle Manager': 'manager',
        'Sneaker Reseller': 'reseller', 'Side Hustle': 'gigworker', 'Thought Leader': 'thoughtleader', 'Crypto Bro': 'cryptobro',
        'Golden Parachute Exec': 'parachute', 'Venture Capitalist': 'vc', 'Corporate Raider': 'raider', 'Consultant': 'consultant',
        'Unicorn Startup': 'unicorn', 'Too Big to Fail': 'toobig', 'The Remote Worker': 'remote', 'The Reply-All Guy': 'boomer'}
for mod in ['p_influencers', 'p_ferals', 'p_creatives', 'p_techies', 'p_punks', 'p_philosophers', 'p_neighbours', 'p_hustlers', 'p_heroes']:
    m = importlib.import_module(mod)
    for name, (slug, _) in m.ART.items():
        SLUG[name] = slug
_b = json.loads((S / 'tools/blobs.json').read_text())
BLOB = {pathlib.Path(v).stem: k for k, v in _b.items() if k != 'CITY'}


def art(name):
    return '/_blob/' + BLOB[SLUG[name]]


# ---- extra card info ----
NEIGHBOUR_TEXT = {
    'Nosy Neighbour': 'Attention Seeker.', 'Wi-Fi Leech': 'Start of combat: gain +1/+1 for each minion next to it.',
    'Package Hoarder': 'Legacy: give the minions next to it +3/+3.', 'Quiet-Hours Enforcer': 'Start of combat: the left-most enemy minion loses 3 Attack.',
    'Caretaker': 'End of turn: give the minions next to it +1/+2.', 'Helpful Neighbour': 'First Impression: give a minion +3/+3.',
    'Leaf Blower Guy': 'Start of combat: deal 1 damage to all enemy minions and to the minions next to it.', 'Wedding DJ': 'Your First Impressions trigger twice.',
    'Estate Lawyer': 'Your Legacies trigger twice.', 'The Landlord': 'End of turn: take +1/+1 from each minion next to it.',
    'Block Party Host': 'End of turn: give each of your minions +1/+1 for each minion next to it.'}
FLAVOUR = {
    'Dropshipper': 'Ships from a warehouse he has never seen.', 'Unpaid Intern': 'Paid in exposure. And coffee runs.',
    'Grindset Guru': 'Up at 4 a.m. Posts about it at 4:01.', 'Middle Manager': 'Circling back on your circle back.',
    'Sneaker Reseller': 'Bought all forty pairs. Wears none.', 'Thought Leader': 'Agree? Repost if you agree.', 'Crypto Bro': 'Have fun staying poor.',
    'Golden Parachute Exec': 'Failed upwards. Landed softly.', 'Venture Capitalist': 'Loves the vision. Hates the margins.',
    'Corporate Raider': 'Synergy, but with teeth.', 'Consultant': 'Billed you for this sentence.',
    'Private Equity': 'Bought the shop. Sold the shelves.', 'Unicorn Startup': 'Valued at a billion. Profit: pending.',
    'Corporate Raider': 'Start of combat: deal 6 damage to the lowest-Health enemy. If it dies, +1 gold next turn.',
    'Main Character': 'Attention Seeker. Likes on this count triple. Clock In: get 2 Likes.',
    'Too Big to Fail': 'Somebody else will pay for this.',
    'Reply Guy': 'Actually, …', 'Engagement Bot': 'Great post! Check my profile.', 'Stan Account': 'Would die for them. Has never met them.',
    'Giveaway Host': 'Like, share, tag three friends.', 'Hype Man': 'LET\'S GOOO.', 'Unboxing Streamer': 'Box first. Product second.',
    'Viral Video': 'Seven seconds long. Forty million views.', 'Personal Brand': 'Authentically curated.',
    'Engagement Farmer': 'Plants a hot take. Harvests replies.', 'Paparazzi': 'Was in the bushes before you were.',
    'Brand Ambassador': 'Use code LATESTAGE for 10% off.', 'Ring Light Studio': 'Every face is flawless. Every face is the same.',
    'Blue Checkmark': 'Verified. Allegedly.', 'Main Character': 'Everyone else is an extra.',
    'Nosy Neighbour': 'Signed for your parcel. Opened it.', 'Wi-Fi Leech': 'The password was "password".',
    'Package Hoarder': 'Your parcels, finally.', 'Quiet-Hours Enforcer': 'It is 22:01.', 'Caretaker': 'Fixed the heating. In July.',
    'Helpful Neighbour': 'Brought cake. Still has your drill.', 'Leaf Blower Guy': 'Saturday, 7 a.m.',
    'Wedding DJ': 'Plays the same three songs. Twice.', 'Estate Lawyer': 'Reads the will. Then reads it again.',
    'The Landlord': 'Rent is due. Again.', 'Block Party Host': "Everyone's invited. Bring chairs."}


def text_of(c):
    return NEIGHBOUR_TEXT.get(c.name, c.text) if c.tribe == 'Neutral' else c.text


def flavour_of(c):
    return c.flavour or FLAVOUR.get(c.name, '')


# ---- icons (24x24, ink line) ----
def ico(inner, size=16, sw=2.4):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="{INK}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{inner}</svg>')


KW_ICON = {
    'Attention Seeker': '<path d="M3.5 10v4h3.5l7 4.5v-13L7 10H3.5z" fill="#ffc928"></path><path d="M17.5 9.5q2 2.5 0 5"></path><path d="M20 7q3.5 5 0 10"></path>',
    'Out of Office': '<path d="M3 12a9 9 0 0 1 18 0z" fill="#8fd4ff"></path><path d="M12 12v7.5q0 2-2 2"></path><path d="M12 3v-0.5"></path>',
    'Legacy': '<rect x="5" y="3" width="13" height="17" rx="2" fill="#fff6dc"></rect><path d="M8.5 8h6M8.5 11.5h6M8.5 15h3"></path><circle cx="17" cy="18" r="3.5" fill="#ff6b5e"></circle>',
    'Rebrand': '<path d="M19 9.5A7.5 7.5 0 0 0 5.6 7.6"></path><path d="M5 3.5v4.5h4.5"></path><path d="M5 14.5a7.5 7.5 0 0 0 13.4 1.9"></path><path d="M19 20.5V16h-4.5"></path><path d="M12 9l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#ffc928" stroke-width="1.6"></path>',
    'Toxic': '<path d="M3.5 4.5h17v11H11l-5 4v-4H3.5z" fill="#8ee05a"></path><path d="M12 7.5v4"></path><path d="M12 13.8v0.2"></path>',
    'First Impression': '<rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="#ffffff"></rect><path d="M5 5h14a2.5 2.5 0 0 1 2.5 2.5v3h-19v-3A2.5 2.5 0 0 1 5 5z" fill="#ff6b5e"></path><path d="M7.5 15h9"></path>',
    'Collab': '<rect x="2" y="8" width="12" height="8" rx="4" fill="#8fd4ff"></rect><rect x="10" y="8" width="12" height="8" rx="4"></rect>',
    'Discover': '<circle cx="10" cy="10" r="6.5" fill="#ffffff"></circle><path d="M15 15l5.5 5.5"></path><path d="M10 7.2l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z" fill="#ffc928" stroke-width="1.4"></path>',
}
TRIG_ICON = {
    'Start of combat': '<path d="M5 19L19 5M14.5 5H19v4.5" ></path><path d="M19 19L5 5M5 9.5V5h4.5"></path>',
    'End of turn': '<path d="M7 3h10M7 21h10M8 3q0 6 4 9q4-3 4-9M8 21q0-6 4-9q4 3 4 9" fill="#fff6dc"></path>',
    'When sold': '<circle cx="12" cy="12" r="8.5" fill="#ffc928"></circle><circle cx="12" cy="12" r="4"></circle>',
}
KEYWORDS = list(KW_ICON)


def kw_chip(k, size=15, label=None):
    return f'<b class="kw">{label or k}</b>'


def fmt(text):
    t = html.escape(text, quote=False)
    # keyword lead-ins
    for k in KEYWORDS:
        t = re.sub(rf'(^|(?<=\. )){re.escape(k)}([.:])\s*', lambda m, k=k: kw_chip(k, label=k + m.group(2)) + ' ', t)
    for k in ('Out of Office', 'Toxic', 'Collab', 'Rebrand', 'Attention Seeker', 'Legacy', 'First Impression'):
        t = re.sub(rf'(?<![>\w]){re.escape(k)}s?(?=[ .,"]|$)', lambda m, k=k: kw_chip(k, label=m.group(0)), t)
    t = re.sub(r'Discover (a|an) ', lambda m: kw_chip('Discover') + f' {m.group(1)} ', t)
    for trig in ('Start of combat:', 'End of turn:', 'When sold:', 'Every second end of turn:', 'Once per turn,', 'Twice per combat,', 'Once per combat,', 'Clock In:', 'Cleave:', 'First Impression and end of turn:'):
        t = t.replace(trig, f'<b class="tg">{trig}</b>')
    t = re.sub(r'(Grievance \(\d\):|Side Gig \(\d\):)', r'<b class="tg">\1</b>', t)
    t = re.sub(r'(?<![\w>])(Acquire|Likes?)(?=[ .,])', r'<b class="kw">\1</b>', t)
    t = re.sub(r'(\+\d+/\+\d+) next combat', r'<b class="v tmp">\1</b> next combat', t)
    t = re.sub(r'(?<!>)(\+\d+/\+\d+|\+\d+ gold|\+\d+ (?:Attack|Health)|\d+ (?:extra )?gold|\d+ damage|twice|half its Attack and Health|\d+ times)',
               r'<b class="v">\1</b>', t)
    return t


STAR = '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4-4.7-4.4 6.4-.8z" fill="#ffc928" stroke="#2b2140" stroke-width="2.6" stroke-linejoin="round"></path>'


def stars(n, size=16):
    return (f'<span class="stars" role="img" aria-label="Tier {n}">' +
            ''.join(f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" aria-hidden="true">{STAR}</svg>' for _ in range(n)) + '</span>')


def card_html(c, style_name=None, golden=False):
    tc = TRIBE_COL[c.tribe]
    n = len(c.name)
    nfs = 21 if n <= 15 else max(14, round(208 / (n * .56), 1))
    txt = face_text(c)
    tl = len(txt)
    tfs = f'{FIT.get(c.name, 13)}px'
    st = ''
    ssz = 16 if c.tier <= 4 else 13
    lab = TRIBE_LABEL.get(c.tribe, c.tribe.upper())
    return (f'<div class="card"><div class="art" style="background-color: {tc}">{st}<img src="{art(c.name)}" alt="{html.escape(c.name)}"></div>'
            f'<p class="nm" style="font-size: {nfs}px">{html.escape(c.name)}</p>'
            f'<div class="meta"><span class="trb" style="background: {tc}">{lab}</span>{stars(c.tier, ssz)}</div>'
            f'<p class="txt" style="font-size: {tfs}">{fmt(txt)}</p>'
            f'<div class="sa">{c.atk}</div><div class="sh">{c.hp}</div></div>')


CARD_CSS = """.card{position:relative;width:240px;height:336px;box-sizing:border-box;border:4px solid #2b2140;border-radius:24px;background:#ffffff;box-shadow:5px 7px 0 #2b2140;display:flex;flex-direction:column;flex-shrink:0}
.art{position:relative;margin:12px 12px 0;height:140px;flex-shrink:0;box-sizing:border-box;border:3px solid #2b2140;border-radius:16px;background-image:radial-gradient(rgba(43,33,64,.16) 1.7px,transparent 2px);background-size:11px 11px}
.art img{position:absolute;left:50%;bottom:-3px;transform:translateX(-50%);width:176px;height:176px;display:block}
.sty{position:absolute;left:7px;top:7px;z-index:1;background:#ffffff;border:2px solid #2b2140;border-radius:7px;padding:1px 6px 0;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:10.5px;letter-spacing:.06em;line-height:1.5;text-transform:uppercase}
.nm{margin:10px 14px 0;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:21px;line-height:1.1;white-space:nowrap}
.meta{margin:5px 14px 0;display:flex;align-items:center;gap:8px}
.trb{border:2px solid #2b2140;border-radius:999px;padding:0 8px;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:11px;letter-spacing:.08em;line-height:1.6}
.stars{display:flex;gap:1px}
.txt{margin:8px 14px 0;font-size:13px;font-weight:700;line-height:1.38}
.kw{font-weight:900;white-space:nowrap}
.tg{font-weight:900}
.v.tmp{background:none;border-bottom:2px dashed #2b2140;padding:0 1px}
.v{font-weight:800;background:linear-gradient(transparent 52%,#ffe9a8 52%);padding:0 2px}
.sa,.sh{position:absolute;bottom:-20px;width:62px;height:62px;box-sizing:border-box;border:4px solid #2b2140;box-shadow:0 0 0 4px #ffffff;display:flex;align-items:center;justify-content:center;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:34px;line-height:1;padding-top:5px}
.sa{left:-20px;border-radius:50%;background:#ffc928;transform:rotate(-6deg)}
.sh{right:-20px;border-radius:18px;background:#ff6b5e;transform:rotate(6deg)}"""

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&amp;family=Nunito:wght@600;700;800;900&amp;display=swap" rel="stylesheet">')


def page(title, css, body, w, h):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>
body{{margin:0}}
a{{color:#2b2140}}a:hover{{color:#5a5270}}
{css}
</style>
</helmet>
{body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''

# Card-face wording: the same rule in fewer words. The full rules text lives in the long-press detail view.
SHORT = {
    'Middle Manager': 'Attention Seeker. End of turn: take +1/+1 from the minion on its left. If it dies, +1 gold next turn.',
    'Crypto Bro': 'Sells for +1 gold per turn on board (max 7). Crashes to 0 after 6 turns.',
    'Venture Capitalist': 'First Impression: invest up to 4 gold. A minion gets +3/+3 per gold.',
    'Private Equity': 'End of turn: Acquire the highest-Attack Feed minion: gain half its stats.',
    'Unicorn Startup': 'End of turn: other Hustlers get +1/+1 per 2 gold you spent.',
    'Too Big to Fail': 'Attention Seeker. Survives its first death each combat at 1 Health. Other Hustlers get +4/+4.',
    'Brand Ambassador': 'Start of combat: summon a Follower. Followers get +1/+1 per Influencer you have.',
    'Ring Light Studio': 'End of turn: get 3 Likes per other Influencer.',
    'Blue Checkmark': 'Start of combat: your Followers get Out of Office and +2/+2. They attack twice.',
    'World Tree': 'End of turn: other Ferals get +1/+1 per turn this has been on board (max +4).',
    'Old-Growth Blockade': 'Attention Seeker. Start of combat: others get +1/+1 per Attention Seeker you have.',
    'Museum Retrospective': 'Grievance (2): other Creatives get +3/+3 permanently.',
    'Memorial Mural': 'Grievance (2): your Creatives get +1 Attack this game.',
    'Record Label': 'End of turn: another Creative gets +3/+3 per Creative played this turn.',
    'Robot Vacuum': 'Collab. Start of combat: deal 2 damage to the lowest-Health enemy.',
    'Pro Gamer': 'Attacks twice. Once per combat, after it kills: gain +4/+4 permanently.',
    'Graffiti Kid': 'Start of combat: deal 1 damage per Punk to the left-most enemy.',
    'Feedback Loop': 'Start of combat: deal 1 damage to all enemies. If any die, Punks get +2/+2 this combat.',
    'Energy-Drink Sponsor': 'When sold: other Punks get +2/+2 per Punk sold this game (max +16).',
    'Stage Diver': 'Start of combat: hit the left-most enemy for this Attack, then gain +4 Attack permanently.',
    'General Strike': 'Start of combat: deal 1 damage per Punk to all enemies. Punks get +1/+1 permanently per kill.',
    'Stoicism Podcaster': 'Attention Seeker. Once per combat, after it survives damage: gain +1 Health permanently.',
    'Cold-Plunge Stoic': 'Attention Seeker. Once per combat, after it survives damage: gain +1/+1 permanently.',
    'Marathon Monk': 'Attention Seeker. Once per combat, after it survives damage: the Philosopher on its right gets +2/+2 permanently.',
    'Desert Hermit': 'Attention Seeker. Once per combat, after it survives damage: other Philosophers get +2/+2 permanently.',
    'Shower Thinker': 'End of turn: the minion on its right gets +3/+3 next combat.',
    'Pub Philosopher': 'End of turn: the minion on its left gets +4/+2 next combat.',
    'Thought Experiment': 'End of turn: the Philosophers next to it get +3/+3 next combat.',
    'Bestselling Author': 'End of turn: make next-combat buffs on your minions permanent.',
    'Grand Unified Theory': 'End of turn: your minions get +1/+1 next combat, then double all next-combat buffs.',
    'The Cynic': 'Attention Seeker. After it takes damage, other Philosophers get +1/+1.',
    'Enlightened Guru': 'Attention Seeker. Your other Attention Seekers take at most 3 damage per hit.',
    'Utilitarian': 'Start of combat: your three lowest-Attack other Philosophers get +3/+3.',
}


def face_text(c):
    return SHORT.get(c.name, text_of(c))


import json as _json
_fit = S / 'tools/fit.json'
FIT = _json.loads(_fit.read_text()) if _fit.exists() else {}
