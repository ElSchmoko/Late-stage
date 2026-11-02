import html
from lsdata import page, S

POP = 'cubic-bezier(.34,1.56,.64,1)'
SPEC = [
    ('SHOP', [
        ('Turn starts', 'Gold coins drop into the counter one by one, 40 ms apart, each with a squash on landing. The Feed tokens deal in from the right like cards, staggered 60 ms, with a little overshoot.', '600'),
        ('Scroll', 'Old Feed tokens flick up and off with a 15° spin; the new ones drop in from above with a bounce. The Scroll button spins 360° and its coin flies out.', '420'),
        ('Save Feed', 'The ribbon swings down like a bookmark, and a dashed pink frame snaps around the Feed with a wobble. Unsaving reverses it.', '260'),
        ('Pick up a token', 'Lifts and scales to 112% with a deeper shadow and tilts toward the drag direction, like a sticker peeled off the page. Valid drop zones pulse; neighbours slide apart to show the gap.', '120'),
        ('Hire', 'The token arcs to the hand slot. The coin cost flies to the gold counter, which ticks down with a red flash.', '320'),
        ('Play from hand', 'The card shrinks into a token on drop and lands with a squash and a white sticker flash. First Impression fires as a burst of rays from the token.', '380'),
        ('Sell', 'The token is crumpled into the yellow drop zone, which burps out coins that spiral into the gold counter (one coin per gold).', '450'),
        ('Level up', 'The shield bounces, a new star stamps in with a spin and sparkle burst, and the cost resets with a slot-machine roll.', '600'),
        ('Buff', 'A coloured streak flies from the source to the target. The stat badges pop to 140% and settle, the number rolls up, and green +X/+Y text floats up and fades.', '350'),
        ('Next-combat buff', 'Same streak, but the stats turn striped and wobble gently while the buff lasts. They pop like a bubble after the fight.', '350'),
        ('Two copies owned', 'The copy dots fill with a ping. A shimmer runs across the matching Feed token to say the next one makes a triple.', '300'),
        ('Triple', 'The three copies fly together, spin, and merge in a white flash. The golden minion lands with a gold ring shockwave and confetti, then the Discover cards fan out.', '900'),
        ('Discover', 'Three cards flip in from face-down, staggered. Tapping one enlarges it and flies it to the hand; the other two fall away.', '500'),
        ('Ready', 'The button presses down 6 px and the board slides down while the opponent board slides in from the top. The screen dims to combat lighting.', '500'),
    ]),
    ('COMBAT', [
        ('Start of combat', 'Every start-of-combat minion glows in turn, left to right. Each effect plays as a projectile (sabotage damage) or a sweep (buffs).', '250 each'),
        ('Attack', 'The attacker winds up (scale 95%, pulls back 8 px), lunges to the target on a curved path, and on impact both shake and the camera jolts by 3 px. Then it springs back to its slot.', '420'),
        ('Damage', 'A red starburst shows −N. The health badge flashes white and shakes, and the number rolls down.', '300'),
        ('Out of Office pop', 'The blue bubble cracks and shatters into 6 shards. "OOO" text puffs away.', '280'),
        ('Toxic', 'A green splat sticks to the target before it dies.', '250'),
        ('Death', 'The token desaturates, tips over 20° and drops off the board with a puff of dust; neighbours slide together.', '380'),
        ('Legacy', 'A ghost of the minion rises out of the slot and releases its effect as sparkles toward the targets.', '450'),
        ('Summon', 'A new token pops in from 0% with overshoot and a ring of dots, and the board makes room.', '300'),
        ('Rebrand', 'The dead minion flips like a card and comes back with a new-paint shine.', '420'),
        ('Round result', 'The surviving attackers leap at the hero portrait one by one; each hit knocks a chunk off Sanity. The results panel slides up.', '300 + 120 each'),
    ]),
    ('META', [
        ('Long-press', 'After 250 ms the token grows into the full card with a spring; everything else blurs and dims.', '260'),
        ('Lobby strip', 'When rankings change, the hero chips swap places with a hop. A knocked-out hero shakes, greys and gets a red X stamp.', '400'),
        ('Hero pick', 'The cards fan in. The chosen one flips to its back side, then flies to the bottom-left portrait slot.', '700'),
        ('End of run', 'The placement number counts up. Unlock progress bars fill, and an unlocked hero card spins in with foil glints.', '1200'),
    ]),
]
RULES = ['Fast by default: input feedback within 1 frame, and most animations under 450 ms. Never block input during shop animations.',
         'Combat runs at 1× or 2× speed (2× halves every duration); Skip resolves instantly.',
         f'Pop-in easing: {POP} (overshoot). Movement easing: ease-out cubic. Nothing linear except coin spin.',
         'Reduce motion setting: no shake or camera jolt, cross-fades instead of flights.']

lab = "margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: .12em; color: #5a5270"
b = ('<div style="width: 1500px; height: 1600px; box-sizing: border-box; padding: 52px 60px; background: #fff6dc; font-family: Nunito, system-ui, sans-serif; color: #2b2140">'
     f'<p style="{lab}">LATE STAGE · MOTION SPEC</p>'
     '<h1 style="margin: 6px 0 10px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 50px; line-height: 1">Everything moves like a sticker</h1>'
     '<ul style="margin: 0 0 30px; padding-left: 20px; font-size: 15px; font-weight: 700; line-height: 1.55">' + ''.join(f'<li>{r}</li>' for r in RULES) + '</ul>'
     '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 26px 40px">')
for sec, rows in SPEC:
    b += f'<div style="grid-column: span 2"><p style="{lab}; font-size: 15px">{sec}</p></div>'
    for name, desc, ms in rows:
        b += (f'<div style="display: flex; gap: 14px; align-items: flex-start"><span style="flex-shrink: 0; min-width: 64px; text-align: center; background: #2b2140; color: #ffc928; border-radius: 999px; padding: 4px 8px 1px; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 13px">{ms} ms</span>'
              f'<div><p style="margin: 0; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: 17px; line-height: 1.15">{name}</p>'
              f'<p style="margin: 2px 0 0; font-size: 13px; font-weight: 700; line-height: 1.45; color: #3d3352">{html.escape(desc)}</p></div></div>')
b += '</div></div>'
(S / 'cards/project/Motion.dc.html').write_text(page("Motion spec", "", b, 1500, 1600))
print('ok')
