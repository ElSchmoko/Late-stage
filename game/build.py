"""Build the single-file web game into dist/ (index.html + sw.js + manifest).
Usage: python3 game/build.py [--out dist]   (BUILD_NUMBER / GITHUB_SHA env vars set the version)"""
import base64, json, os, pathlib, sys, datetime
D = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path(sys.argv[sys.argv.index('--out') + 1]) if '--out' in sys.argv else D.parent / 'dist'
OUT.mkdir(parents=True, exist_ok=True)
n = os.environ.get('BUILD_NUMBER') or os.environ.get('GITHUB_RUN_NUMBER') or 'dev'
sha = (os.environ.get('GITHUB_SHA') or 'local')[:7]
build = {'n': n, 'sha': sha, 'date': datetime.date.today().isoformat()}

faces = [('Baloo 2', 700, 'baloo-2-latin-700-normal'), ('Baloo 2', 800, 'baloo-2-latin-800-normal'),
         ('Nunito', 700, 'nunito-latin-700-normal'), ('Nunito', 800, 'nunito-latin-800-normal'), ('Nunito', 900, 'nunito-latin-900-normal')]
fonts = ''.join("@font-face{font-family:'%s';font-weight:%d;font-display:block;src:url(data:font/woff2;base64,%s) format('woff2')}"
                % (fam, w, base64.b64encode((D / 'fonts' / f'{f}.woff2').read_bytes()).decode()) for fam, w, f in faces)
js = lambda f: (D / f).read_text()
html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#2b2140"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png">
<title>Late Stage</title>
<style>{fonts}{js('style.css')}</style></head>
<body><div id="wrap"><div id="stage"></div></div><div class="rotate"><span>Turn your phone sideways</span></div>
<script>window.LS_BUILD={json.dumps(build)};</script>
<script>{js('data.js')}</script><script>{js('engine.js')}</script><script>{js('lobby.js')}</script><script>{js('audio.js')}</script><script>{js('ui.js')}</script>
<script>if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{{}});</script>
</body></html>'''
(OUT / 'index.html').write_text(html)
(OUT / 'version.json').write_text(json.dumps(build))
(OUT / 'sw.js').write_text(f'''const CACHE='late-stage-{n}-{sha}';
self.addEventListener('install',e=>{{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','manifest.webmanifest'])).then(()=>self.skipWaiting()))}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))}});
self.addEventListener('fetch',e=>{{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r}}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))))}});
''')
(OUT / 'manifest.webmanifest').write_text(json.dumps({'name': 'Late Stage', 'short_name': 'Late Stage', 'start_url': './', 'display': 'fullscreen',
    'orientation': 'landscape', 'background_color': '#2b2140', 'theme_color': '#2b2140',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'}]}))
for s in (192, 512):
    src = D / 'icons' / f'icon-{s}.png'
    if src.exists():
        (OUT / src.name).write_bytes(src.read_bytes())
(OUT / '.nojekyll').write_text('')
if '--artifact' in sys.argv:
    frag = html.split('<body>', 1)[1].rsplit('</body>', 1)[0]
    head = f'<title>Late Stage</title><meta name="theme-color" content="#2b2140"><style>{fonts}{js("style.css")}</style>'
    frag = frag.replace("<script>if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});</script>", '')
    (OUT / 'artifact.html').write_text(head + frag)
print('built', OUT / 'index.html', len(html), build)
