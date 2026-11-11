# Synthesised sound effects for the POV memory video (no assets needed). Writes sfx.wav aligned to the voice timeline.
import json, sys, wave, numpy as np
SR = 44100; tim = json.load(open(sys.argv[1])); dur = float(sys.argv[2]); out = np.zeros(int(SR * dur))
L = lambda i: tim[i]['t0']
def add(sig, at, g=1.0):
    i = int(at * SR); n = min(len(sig), len(out) - i); out[i:i + n] += sig[:n] * g
def env(n, a=.02, r=.1):
    e = np.ones(n); ka, kr = int(a * SR), int(r * SR); e[:ka] = np.linspace(0, 1, ka); e[-kr:] = np.linspace(1, 0, kr); return e
def hum(at):  # soft hummed tune (mint tune), voice-like: sine + 2nd/3rd harmonics + vibrato
    notes = [(392, .35), (440, .35), (494, .5), (440, .3), (392, .6)]; t0 = at
    for f, d in notes:
        n = int(d * SR); tt = np.arange(n) / SR; vib = 1 + .006 * np.sin(2 * np.pi * 5.5 * tt)
        ph = 2 * np.pi * f * np.cumsum(vib) / SR; s = np.sin(ph) + .35 * np.sin(2 * ph) + .12 * np.sin(3 * ph)
        add(s * env(n, .05, .12), t0, .09); t0 += d
def buzz(at, length):
    for k in range(int(length / .6)):
        n = int(.35 * SR); tt = np.arange(n) / SR; s = np.sign(np.sin(2 * np.pi * 180 * tt)) * .5 + np.sin(2 * np.pi * 90 * tt)
        add(s * env(n, .01, .05), at + k * .6, .07)
def applause(at, length):
    rng = np.random.default_rng(3)
    for k in range(int(length * 40)):
        n = int(.03 * SR); s = rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * .006)); add(s, at + rng.random() * length, .05 * (.5 + rng.random()))
def cough(at):
    rng = np.random.default_rng(7)
    for k, d in enumerate([.0, .28]):
        n = int(.22 * SR); s = rng.standard_normal(n); s = np.convolve(s, np.ones(30) / 30, 'same') * np.exp(-np.arange(n) / (SR * .06)); add(s, at + d, .25)
cough(L(3) + 1.25); applause(L(32), 1.6); hum(L(67) + .05); buzz(L(85), 3.4); hum(L(101) + .05); hum(L(102))
out = np.clip(out, -1, 1); w = wave.open(sys.argv[3], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close(); print('sfx ok')
