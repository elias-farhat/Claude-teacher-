import subprocess, json, numpy as np, wave
SR = 24000; TEMPO = 1.1
R = '/home/claude/claude-teacher-/tts/'
lines = [l.strip() for l in open(R + 'ar/lines.txt', encoding='utf-8') if l.strip()]
HOOKI = [51, 52, 53, 54]; hook = [lines[i] for i in HOOKI]
DROP = {44, 57, 60, 89, 90, 99}
SCENE = {8, 11, 17, 18, 22, 24, 31, 37, 43, 48, 56, 61, 68, 77, 81, 93, 98, 104}
LONG = {26: .7, 38: .9, 54: .7, 55: .6, 67: .6, 68: .8, 72: .6, 84: .6, 85: .5}
def load(fn):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', fn, '-af', f'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo={TEMPO}', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32)
out = [np.zeros(int(SR * .25), np.float32)]; t = .25; H = []; M = []
for k, s in enumerate(hook):
    a = load(f'{R}ar/edge/line_{HOOKI[k]:03d}.mp3'); H.append(dict(i=k, t0=round(t, 3), t1=round(t + len(a) / SR, 3), text=s)); out.append(a); t += len(a) / SR
    g = .35 if k < 3 else 1.0; out.append(np.zeros(int(SR * g), np.float32)); t += g
for i, s in enumerate(lines):
    if i in DROP: M.append(dict(i=i, t0=round(t, 3), t1=round(t, 3), text=s)); continue
    a = load(f'{R}ar/edge/line_{i:03d}.mp3'); M.append(dict(i=i, t0=round(t, 3), t1=round(t + len(a) / SR, 3), text=s)); out.append(a); t += len(a) / SR
    g = .5 if s.endswith('...') else .3
    if i + 1 in SCENE: g = .65
    g = LONG.get(i, g); out.append(np.zeros(int(SR * g), np.float32)); t += g
v = np.concatenate(out); v = v / (np.abs(v).max() + 1e-6) * .9
n = len(v) + SR * 2; tt = np.arange(n) / SR
pad = sum(np.sin(2 * np.pi * f * tt + ph) * amp for f, ph, amp in [(110, 0, .5), (164.8, 1, .3), (220, 2, .25), (261.6, .5, .15), (329.6, 1.7, .1)])
pad *= (0.6 + 0.4 * np.sin(2 * np.pi * tt / 14)) * 0.035
# low heartbeat thumps under the hook
for k in range(int(H[-1]['t1'] / .85) + 1):
    s0 = int((.3 + k * .85) * SR); m = np.arange(int(.18 * SR)) / SR; thump = np.sin(2 * np.pi * 55 * m) * np.exp(-m * 22) * .35
    pad[s0:s0 + len(thump)] += thump[:len(pad[s0:s0 + len(thump)])]
mix = np.zeros(n, np.float32); mix[:len(v)] += v; mix += pad.astype(np.float32); mix = np.clip(mix, -1, 1)
with wave.open('/home/claude/out/ar_voice/voice_ar2.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
json.dump(dict(hook=H, main=M), open('/home/claude/out/ar_voice/timing_ar2.json', 'w'), ensure_ascii=False)
print(round(t, 1))
