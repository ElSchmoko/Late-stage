from lsdata import page
FIXED = [
 ('Tier shield still said “Senior”', 'Job titles were dropped, so the shield shows stars only, plus “Level up” and the cost.'),
 ('Opponent was still “The Boomer”', 'Combat now shows The Reply-All Guy.'),
 ('A 0-cost Paycheck sat in the hand', 'That broke the “no 0-cost cards” rule, and the Paycheck no longer exists. The hand now holds real minions.'),
 ('Stale stats and wording', 'Corporate Raider was 5/5, and the boards used old card text. Every board is now generated from the live card list.'),
 ('Selling always said +1 gold', 'The sell zone shows the real value and why (Crypto Bro: 4 gold, turn 3 of 4).'),
 ('No lobby, only “3rd/8”', 'A strip lists all 8 heroes ranked by Sanity. The next opponent is marked and knocked-out players fade.'),
 ('Lobby tribes were hidden', '5 of 7 tribes per lobby is the biggest planning input. It is now shown in hero select and in the shop.'),
 ('Bonus gold was invisible', 'A “+1 next turn” tab hangs under the gold counter.'),
 ('No board capacity', 'The board label reads “Your board · 6/7”.'),
 ('Hero power was a mystery house', 'It now has a name, shows passive or active, and greys out once used.'),
 ('Effects invisible on tokens', 'Trigger badges show on tokens: start of combat, end of turn, when sold, Legacy, Shrug Off and keywords.'),
 ('Next-combat buffs looked permanent', 'This was an open question in the design doc. Stats lasting one combat are dashed; stats buffed this turn are green.'),
 ('No triple tracking', 'Feed tokens show copy dots (●●○) and golden minions get a gold ring.'),
 ('Every card art was green', 'Each tribe has its own colour; attack yellow and health red stay reserved.'),
 ('Keyword sheet out of date', 'It still listed Multitasking, Side Hustle and Spend 5. It is rebuilt with the 8 live keywords and 4 triggers.'),
 ('Card text too long for a phone', 'Mosh Pit ran to 179 characters. Card faces use shorter wording, and every text is measured and auto-fitted so it never runs under the stat badges. Full rules are in the long-press view.'),
 ('Keyword chips were noisy', 'Keywords are now plain extra-bold text; icons live only on tokens and in the glossary.'),
 ('Combat explained nothing', 'Combat gets a log ticker, an attack arrow, “who attacks first and why”, 2× and Skip, and a damage breakdown after the round.'),
]
NEW = ['Title screen with the Late Stage logo and next-unlock progress', 'Hero select: 1 of 3, power, Boundaries, lobby tribes',
       'Hire: big card preview while dragging, plus a drop slot', 'Triple → golden → Discover modal with “Peek at board”',
       'Long-press card detail: full rules, keyword glossary, golden version, this copy', 'Round result: why you took that damage',
       'End of run: final standings with tribes, hero-unlock progress']
OPEN = ['Collection / codex and settings screens', 'First-run tutorial: a guided first shop turn before unlock challenges take over',
        'Colour-blind check: tribe colour is always paired with a name, but pink/orange and lime/green need a simulator pass',
        'Hand limit (10) and what happens on overflow',
        'Sound design']

lab = "margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: .12em; color: #5a5270"
b = ('<div style="width: 1400px; height: 1000px; box-sizing: border-box; padding: 48px 56px; background: #fff6dc; font-family: Nunito, system-ui, sans-serif; color: #2b2140; display: flex; gap: 48px">'
     f'<div style="flex: 1.35"><p style="{lab}">UX REVIEW · WHAT WAS SUB-PAR, AND THE FIX</p>'
     '<h1 style="margin: 6px 0 18px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 44px; line-height: 1">18 fixes on the boards (round 2: no turn timer, no playstyle tags)</h1>'
     '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 22px">')
for i, (t, d) in enumerate(FIXED):
    b += (f'<div style="display: flex; gap: 10px"><span style="flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid #2b2140; background: #2ecb6e; display: flex; align-items: center; justify-content: center; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px; padding-top: 2px; box-sizing: border-box">{i + 1}</span>'
          f'<div><p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 15.5px; line-height: 1.2">{t}</p>'
          f'<p style="margin: 2px 0 0; font-size: 12.5px; font-weight: 700; line-height: 1.4; color: #3d3352">{d}</p></div></div>')
b += '</div></div><div style="flex: 1; display: flex; flex-direction: column; gap: 22px">'
for title, items, col in [('NEW SCREENS (WERE MISSING)', NEW, '#ffffff'), ('STILL OPEN', OPEN, '#ffe9a8')]:
    b += (f'<div style="border: 3px solid #2b2140; border-radius: 22px; background: {col}; padding: 20px 22px; box-shadow: 4px 6px 0 #2b2140">'
          f'<p style="{lab}">{title}</p><ul style="margin: 10px 0 0; padding-left: 20px; font-size: 14px; font-weight: 700; line-height: 1.5">'
          + ''.join(f'<li style="margin-bottom: 4px">{x}</li>' for x in items) + '</ul></div>')
b += '</div></div>'
open('../cards/project/UXReview.dc.html', 'w').write(page('UX review', '', b, 1400, 1000))
