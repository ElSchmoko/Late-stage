# Audio

All sound is synthesised live with the Web Audio API in `game/audio.js`. There are no audio files, so the game stays a single offline HTML file. Browsers only allow sound after the first tap, so audio starts then. It pauses when the app goes to the background.

## Music

| Piece | Where | Style |
| --- | --- | --- |
| Hold music | Title, hero select, Heroes, end screen | Bossa-flavoured muzak in F at 96 BPM. Electric piano comp, walking root/fifth bass, rimshot and shaker, a vibraphone tune every other loop. "Your call is important to us." |
| Open Plan Office | Shop | Lo-fi groove at 80 BPM with swing (Dm9, G13, Cmaj9, Am7…), with vinyl crackle. Layers come in as your tier rises: hats from tier 2, kalimba noodles from tier 3, shaker and arpeggios from tier 5. A layer is also added when you are low on Health. |
| Performance Review | Combat | Minor funk at 124 BPM (Am, F, G, E7…). 16th-note bass, four-on-the-floor kick, offbeat electric-piano stabs, a square-wave lead riff and a snare fill every 8 bars. |

Pieces crossfade when the screen changes. Big moments (level up, triple, unlock, victory) briefly duck the music.

## Sound effects

There are 41 effects:

- **Shop:** buy, slap (play), sell, scroll, Save/unsave, level up, triple, Discover, Likes, buffs (pitch rises with size), hero power, errors.
- **Combat:** fight start, wind-up and hit (louder for bigger hits), Out of Office pop, death, summon, Legacy, start-of-combat zaps and sparkles, Rebrand, the charge and slam when minions hit a hero.
- **End screen:** placement ticks, a victory fanfare or sad trombone, rating up/down, hero unlock.

Each effect's loudness was measured offline and evened out (the `GAIN` table). Identical sounds within 35 ms are merged so busy turns don't stack.

## Volume

The speaker button (title screen, top right; shop, left column) opens Music and Sound sliders. They are saved on the device.

## Checking

`LSAudio._render(seconds, job)` renders a song or a list of effects offline. The preview renders peak at −2 to −5 dBFS with no clipping. Music sits around −25 dBFS RMS.
