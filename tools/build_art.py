"""python3 build.py p_influencers [...]  -> writes ../cards/art/<slug>.svg and a contact sheet"""
import sys, importlib, pathlib, subprocess
from artkit import sticker
ART = pathlib.Path(__file__).resolve().parent.parent / 'art'
for mod in sys.argv[1:]:
    m = importlib.import_module(mod)
    files = []
    for name, (slug, fn) in m.ART.items():
        f = ART / f'{slug}.svg'
        svg = sticker(fn()); f.write_text(svg)
        import xml.dom.minidom; xml.dom.minidom.parseString(svg)
        files.append(str(f))
    subprocess.run(['python3', str(pathlib.Path(__file__).parent / 'sheet.py'), f'../review/sheet_{mod}.png', *files], check=True)
