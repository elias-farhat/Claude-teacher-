# Generates images from art/<set>/prompts.json with the Gemini API (runs on GitHub Actions; key in GEMINI_API_KEY).
# Writes art/<set>/<id>.png and art/<set>/log.txt (so failures are visible without the Actions UI).
import json, os, sys, base64, urllib.request, urllib.error, time
key = os.environ.get('GEMINI_API_KEY', ''); d = sys.argv[1]; log = open(os.path.join(d, 'log.txt'), 'w')
def L(*a): print(*a); print(*a, file=log); log.flush()
def call(url, body=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
    try: return json.load(urllib.request.urlopen(req, timeout=180))
    except urllib.error.HTTPError as e: return {'error': e.code, 'body': e.read().decode()[:600]}
if not key: L('NO KEY: GEMINI_API_KEY secret is missing'); sys.exit(0)
B = 'https://generativelanguage.googleapis.com/v1beta'
models = call(B + '/models?pageSize=200'); names = [m['name'] for m in models.get('models', [])]
if not names: L('MODEL LIST FAILED', models); sys.exit(0)
img = [n for n in names if 'image' in n and 'gemini' in n]; imagen = [n for n in names if 'imagen' in n]
L('gemini image models:', img); L('imagen models:', imagen)
spec = json.load(open(os.path.join(d, 'prompts.json'))); style = spec.get('style', '')
for it in spec['images']:
    out = os.path.join(d, it['id'] + '.png')
    if os.path.exists(out): L('skip', it['id']); continue
    prompt = (style + '\n\n' + it['prompt']).strip(); ok = False
    for m in sorted(img, key=lambda n: ('preview' in n, n))[:3]:
        r = call(f'{B}/{m}:generateContent', {'contents': [{'parts': [{'text': prompt}]}], 'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': it.get('aspect', '16:9')}}})
        parts = [p for c in r.get('candidates', []) for p in c.get('content', {}).get('parts', []) if 'inlineData' in p]
        if parts: open(out, 'wb').write(base64.b64decode(parts[0]['inlineData']['data'])); L('ok', it['id'], 'via', m); ok = True; break
        L('fail', it['id'], m, str(r)[:400])
    if not ok:
        for m in imagen[:2]:
            r = call(f'{B}/{m}:predict', {'instances': [{'prompt': prompt}], 'parameters': {'sampleCount': 1, 'aspectRatio': it.get('aspect', '16:9')}})
            p = r.get('predictions', [])
            if p and 'bytesBase64Encoded' in p[0]: open(out, 'wb').write(base64.b64decode(p[0]['bytesBase64Encoded'])); L('ok', it['id'], 'via', m); ok = True; break
            L('fail', it['id'], m, str(r)[:400])
    time.sleep(2)
