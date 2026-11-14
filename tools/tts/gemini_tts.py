"""Gemini TTS for a line script, in sections. Writes <dir>/out/sec_XX.wav and <dir>/out/log.txt. Key from env GEMINI_API_KEY only."""
import os, sys, json, time, base64, wave, urllib.request, urllib.error
D = sys.argv[1]; cfg = json.load(open(f'{D}/tts.json'))
lines = [l.strip() for l in open(f'{D}/lines.txt', encoding='utf-8') if l.strip()]
os.makedirs(f'{D}/out', exist_ok=True); log = open(f'{D}/out/log.txt', 'a', encoding='utf-8')
KEY = os.environ['GEMINI_API_KEY']
def call(model, text):
    body = {'contents': [{'parts': [{'text': text}]}],
            'generationConfig': {'responseModalities': ['AUDIO'], 'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': cfg['voice']}}}}}
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent', data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'x-goog-api-key': KEY})
    r = json.load(urllib.request.urlopen(req, timeout=300))
    return base64.b64decode(r['candidates'][0]['content']['parts'][0]['inlineData']['data'])
for k, (a, b) in enumerate(cfg['sections']):
    fn = f'{D}/out/sec_{k:02d}.wav'
    if os.path.exists(fn): continue
    text = cfg['direction'] + '\n\n' + '\n'.join(lines[a:b + 1])
    pcm = None
    for attempt in range(6):
        for model in cfg['models']:
            try: pcm = call(model, text); log.write(f'sec {k} ok {model} {len(pcm)} bytes\n'); break
            except urllib.error.HTTPError as e: log.write(f'sec {k} {model} HTTP {e.code} {e.read()[:300]!r}\n')
            except Exception as e: log.write(f'sec {k} {model} ERR {e!r}\n')
        log.flush()
        if pcm: break
        time.sleep(70)
    if not pcm: continue
    with wave.open(fn, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
    time.sleep(25)
