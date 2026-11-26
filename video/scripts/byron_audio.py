#!/usr/bin/env python3
"""Music bed + SFX + mix for "His College Banned Dogs, So He Brought a Bear" (Lord Byron at Trinity, 1805-08).

usage: python byron_audio.py <scripts/byron dir> <frames>
reads voice.wav + words.json, writes mix.flac (48 kHz stereo, exactly frames/30 s) and audio-report.md. The voice timing
is untouched (final); only the loud breaths between words are turned down 9 dB. Music: an original playful college
caper (6/8 feel, 112 bpm, F major) for pizzicato bass, bassoon-ish reed, music box and woodblock, ducked under the voice.
SFX (all synthesized): college bell, NO DOGS stamp, page flips, bear growls, the tutors' gasp, a smug ding.
Master: -14 LUFS integrated, <= -1 dBTP.
"""
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "../../.claude/skills/claude-animated-shorts/templates/audio"))
from dsp import SR, TAU, ns, tt, dbg, rng, lp, hp, bp, colored, modal, place, st, integrated, lra, true_peak, read_wav, fades  # noqa: E402

D, FRAMES = sys.argv[1], int(sys.argv[2])
DUR = FRAMES / 30
N = ns(DUR)
words = json.load(open(os.path.join(D, "words.json"), encoding="utf-8"))
R = rng(1805)


def wt(line, w=0):
    ws = [x for x in words if x["line"] == line]
    if isinstance(w, str):
        k = next(i for i, x in enumerate(ws) if x["w"].lower().replace("-", "").startswith(w.lower().replace("-", "")))
    else:
        k = w
    return ws[k]["s"]


# ================================================================ instruments
def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.008, d=0.12, s=0.6, r=0.1, hold=None):
    t = np.arange(n) / SR
    hold = hold if hold is not None else n / SR - r
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d))
    return e * np.clip((hold + r - t) / r, 0, 1)


def accordion(freqs, dur, vol=1.0):
    t = tt(dur)
    y = np.zeros_like(t)
    for f in freqs:
        for det in (0.997, 1.003):  # two reeds, slightly detuned
            for h in range(1, 9):
                y += np.sin(TAU * f * det * h * t + h) / h * (0.8 if h % 2 else 0.45)
    y *= env(len(t), 0.012, 0.15, 0.7, 0.08) * (1 + 0.12 * np.sin(TAU * 6 * t))
    return lp(y, 2600) * vol / len(freqs)


def pizz(f, vol=1.0):
    return modal(0.6, [(f, 1.0, 0.22), (2 * f, 0.35, 0.12), (3 * f, 0.12, 0.07)]) * vol


def musicbox(f, vol=1.0):
    return modal(1.2, [(f, 1.0, 0.5), (2.76 * f, 0.35, 0.18), (5.4 * f, 0.12, 0.08)]) * vol


def shaker(vol=1.0):
    n = ns(0.07)
    return hp(colored(n, R, 0.0), 5000) * np.exp(-np.arange(n) / SR / 0.02) * vol


# F major caper: I - vi - IV - V, the "horrified" stretch in D minor, a warm ending
CH = {"F": [53, 57, 60], "Dm": [50, 53, 57], "Bb": [46, 50, 53], "C": [48, 52, 55], "C7": [48, 52, 55, 58], "Gm": [55, 58, 62], "A7": [45, 49, 52, 55]}
BASS = {"F": 41, "Dm": 38, "Bb": 34, "C": 36, "C7": 36, "Gm": 43, "A7": 33}
BEAT = 60 / 112
BAR = 2 * BEAT


def section(t):
    if t < wt(3) - 0.2:
        return "bright", ["F", "Dm", "Bb", "C7"], 1.0
    if t < wt(4) - 0.2:
        return "stern", ["Dm", "A7", "Dm", "A7"], 0.8          # the rules: no dogs
    if t < wt(6) - 0.2:
        return "sly", ["F", "Bb", "C7", "F"], 1.0               # reading the rules, the bear
    if t < wt(7) - 0.2:
        return "panic", ["Dm", "Gm", "A7", "Dm"], 0.9           # horrified
    if t < wt(9) - 0.2:
        return "sly", ["Bb", "F", "C7", "F"], 1.0
    return "end", ["F", "Bb", "C7", "F"], 0.9


MELODY = [72, 74, 77, None, 76, 74, 72, None, 69, 72, 74, None, 72, 69, 65, None]


def woodblock(vol=1.0):
    return modal(0.12, [(1150, 1.0, 0.03), (2700, 0.4, 0.015)]) * vol


def music():
    m = np.zeros((2, N))
    nb = int(DUR / (BEAT / 2)) + 2
    for b in range(nb):
        t = b * BEAT / 2
        if t >= DUR:
            break
        kind, prog, vol = section(t)
        chord = prog[int(t / BAR) % len(prog)]
        step = b % 4
        if step == 0:
            place(m, pizz(note(BASS[chord]), 0.9 * vol), t)
        elif step == 2:
            place(m, pizz(note(BASS[chord] + 7), 0.6 * vol), t)
        if step in (1, 3):
            place(m, accordion([note(x + 12) for x in CH[chord]], BEAT * 0.28, 0.36 * vol), t, 0.8)
        if kind != "stern":
            place(m, woodblock(0.28 if step % 2 else 0.16), t)
        if kind in ("bright", "sly", "end") and step % 2 == 0:
            mi = MELODY[(b // 2) % 16]
            if mi:
                place(m, musicbox(note(mi), 0.3), t)
        if kind == "panic" and step % 2 == 1:
            place(m, musicbox(note(74 + (b % 3)), 0.22), t)
    tf = words[-1]["s"]
    place(m, accordion([note(x) for x in (53, 57, 60, 65)], DUR - tf, 0.5), tf)
    for k, f in enumerate((77, 81, 84)):
        place(m, musicbox(note(f), 0.36), tf + 0.08 * k)
    return m


# ================================================================ SFX
def sweep_noise(dur, f0, f1, q=1.2, slope=1.0):
    """band of noise whose centre glides f0 -> f1 (overlap-added filtered blocks)"""
    n = ns(dur)
    x = colored(n, R, slope)
    out = np.zeros(n)
    blk = 2048
    win = np.hanning(blk)
    for i in range(0, n, blk // 2):
        seg = np.zeros(blk)
        seg[: min(blk, n - i)] = x[i:i + blk]
        fc = f0 * (f1 / f0) ** (i / max(1, n))
        y = bp(seg, fc / (1 + 0.5 / q), fc * (1 + 0.5 / q))
        out[i:i + blk] += (y * win)[: min(blk, n - i)]
    return out


def whoosh(dur=0.7, up=True):
    n = ns(dur)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return sweep_noise(dur, 300 if up else 2400, 2400 if up else 300) * e * 0.9


def clink(f=2400, vol=1.0):
    return modal(0.5, [(f, 1, 0.12), (2.71 * f, 0.5, 0.05), (5.13 * f, 0.25, 0.03)]) * vol


def coin():
    return clink(3100, 0.6) + np.pad(clink(3600, 0.45), (ns(0.07), 0))[: ns(0.5)]


def rustle(dur=0.35):
    n = ns(dur)
    x = bp(colored(n, R, 0.0), 1800, 7000)
    spikes = np.repeat(R.random(n // 240 + 1) ** 3, 240)[:n]
    return x * spikes * np.sin(np.pi * np.linspace(0, 1, n)) * 1.4


def thud(f=85, vol=1.0):
    t = tt(0.25)
    y = np.sin(TAU * f * t * (1 + 0.6 * np.exp(-t / 0.02))) * np.exp(-t / 0.06)
    y[: ns(0.006)] += R.standard_normal(ns(0.006)) * 0.5
    return y * vol


def pop():
    t = tt(0.08)
    return np.sin(TAU * (900 - 6000 * t) * t) * np.exp(-t / 0.025)


def ding(f=2349, vol=0.6):
    return modal(1.0, [(f, 1, 0.35), (2.0 * f, 0.4, 0.2), (3.01 * f, 0.15, 0.1)]) * vol


def shush(dur=0.45):
    n = ns(dur)
    return hp(colored(n, R, 0.0), 2500) * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.7 * 0.5


def tick():
    n = ns(0.03)
    return bp(colored(n, R, 0.0), 2500, 4500) * np.exp(-np.arange(n) / SR / 0.006) * 1.5


def boing():
    t = tt(0.6)
    return np.sin(TAU * 140 * t + 4 * np.sin(TAU * 9 * t) * np.exp(-t / 0.2)) * np.exp(-t / 0.18)


def splash():
    n = ns(0.45)
    x = lp(colored(n, R, 0.5), 3500) * np.exp(-np.arange(n) / SR / 0.12)
    for k in range(5):
        x[ns(0.03 * k + R.random() * 0.1):][: ns(0.08)] += pop()[: len(x[ns(0.03 * k):][: ns(0.08)])] * 0.3
    return x


def slide_whistle(f0=500, f1=1500, dur=0.5):
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    return np.sin(TAU * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) * 0.5


def train_whistle(dur=1.0):
    t = tt(dur)
    y = sum(np.sin(TAU * f * t) for f in (440, 554, 659)) / 3
    y += 0.15 * hp(colored(len(t), R, 0.0), 1500)
    return y * np.clip(t / 0.08, 0, 1) * np.clip((dur - t) / 0.15, 0, 1) * 0.6


def chug(dur, rate=4.0):
    n = ns(dur)
    out = np.zeros(n)
    for k in range(int(dur * rate)):
        b = bp(colored(ns(0.18), R, 0.5), 250, 1300) * np.exp(-np.arange(ns(0.18)) / SR / 0.05) * (1.0 if k % 2 == 0 else 0.6)
        i = ns(k / rate)
        out[i:i + len(b)] += b[: max(0, min(len(b), n - i))]
    return out * 0.8


def screech(dur=0.8):
    t = tt(dur)
    return (np.sin(TAU * (2500 + 300 * np.sin(TAU * 7 * t)) * t) * 0.4 + 0.3 * hp(colored(len(t), R, 0.0), 3000)) * np.sin(np.pi * t / dur) * 0.5


def police_whistle(dur=0.75):
    t = tt(dur)
    return np.sin(TAU * 2800 * t) * (0.6 + 0.4 * np.sign(np.sin(TAU * 26 * t))) * np.sin(np.pi * t / dur) ** 0.3 * 0.35


def horn(dur=1.6):
    t = tt(dur)
    y = sum(np.sin(TAU * 110 * h * t) / h for h in range(1, 7))
    return lp(y, 900) * np.clip(t / 0.25, 0, 1) * np.clip((dur - t) / 0.3, 0, 1) * 0.5


def rain(dur):
    n = ns(dur)
    x = bp(colored(n, R, 1.0), 700, 8000) * 0.5
    for _ in range(int(dur * 40)):
        i = int(R.random() * (n - 400))
        x[i:i + 300] += tick()[:300][: len(x[i:i + 300])] * 0.4
    return x * np.clip(np.arange(n) / ns(0.4), 0, 1) * np.clip((n - np.arange(n)) / ns(0.4), 0, 1)


def meow():
    t = tt(0.55)
    f = 600 + 300 * np.sin(np.pi * t / 0.55)
    y = np.sin(TAU * np.cumsum(f) / SR + 2 * np.sin(TAU * 3 * f.mean() * t))
    return bp(y, 500, 3000) * np.sin(np.pi * t / 0.55) * 0.5


def gear(dur):
    out = np.zeros(ns(dur))
    for k in range(int(dur * 8)):
        i = ns(k / 8)
        tk = tick()
        out[i:i + len(tk)] += tk[: max(0, min(len(tk), len(out) - i))]
    return out


def mixs(*xs):
    """sum mono clips of different lengths"""
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


def later(x, dt):
    return np.pad(x, (ns(dt), 0))


def squeak(f=2600, dur=0.12):
    t = tt(dur)
    fr = f * (1 + 0.25 * np.sin(np.pi * t / dur))
    return np.sin(TAU * np.cumsum(fr) / SR) * np.sin(np.pi * t / dur) * 0.35


def patter(dur, rate=14):
    out = np.zeros(ns(dur))
    for k in range(int(dur * rate)):
        i = ns(k / rate + R.random() * 0.02)
        tk = tick() * (0.5 + 0.5 * R.random())
        out[i:i + len(tk)] += tk[: max(0, min(len(tk), len(out) - i))]
    return out * 0.7


def snip():
    return mixs(clink(5200, 0.5), later(clink(4300, 0.4), 0.05))


def rip(dur=0.5):
    n = ns(dur)
    x = bp(colored(n, R, 0.2), 900, 6000)
    return x * np.repeat(R.random(n // 120 + 1) ** 2, 120)[:n] * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.5 * 1.3


def cluck():
    out = np.zeros(ns(0.5))
    for k in range(3):
        t = tt(0.07)
        y = bp(np.sin(TAU * 700 * t) + 0.4 * colored(len(t), R, 0.0), 400, 2500) * np.exp(-t / 0.03)
        i = ns(0.13 * k)
        out[i:i + len(y)] += y[: max(0, min(len(y), len(out) - i))]
    return out * 0.8


def cheer(dur=2.0):
    n = ns(dur)
    x = bp(colored(n, R, 0.6), 400, 3500)
    return x * np.clip(np.arange(n) / ns(0.3), 0, 1) * np.clip((n - np.arange(n)) / ns(0.6), 0, 1) * 0.6


def tram_bell():
    return mixs(ding(1568, 0.5), later(ding(1568, 0.45), 0.18))


def drip():
    t = tt(0.15)
    return np.sin(TAU * (1400 + 2500 * t) * t) * np.exp(-t / 0.03) * 0.4


def bell(f=523.0, vol=0.7):
    """a college chapel bell: inharmonic partials, long decay"""
    return modal(2.6, [(f * 0.5, 0.5, 1.6), (f, 1.0, 1.2), (f * 1.19, 0.5, 0.9), (f * 1.5, 0.35, 0.7), (f * 2.0, 0.3, 0.5), (f * 2.74, 0.2, 0.3)]) * vol


def stamp():
    """a rubber stamp slammed on the rule book: low thud plus a wooden clack"""
    return mixs(thud(95, 1.0), woodblock(0.6) * 0.8, later(rustle(0.15) * 0.4, 0.02))


def page_flip():
    return mixs(rustle(0.28), later(slide_whistle(2500, 3800, 0.12) * 0.08, 0.05))


def growl(dur=0.9, vol=0.8):
    """a friendly bear growl: a rough 70-110 Hz voice through a vowel-ish band"""
    t = tt(dur)
    f = 78 + 18 * np.sin(np.pi * t / dur) + 6 * np.sin(TAU * 5 * t)
    ph = TAU * np.cumsum(f) / SR
    y = sum(np.sin(h * ph) / h for h in range(1, 14))
    y *= 1 + 0.5 * colored(len(t), R, 0.0) * 0.6
    y = bp(y, 120, 1400) + 0.15 * bp(colored(len(t), R, 0.5), 200, 900)
    return y * np.sin(np.pi * t / dur) ** 0.6 * vol


def gasp():
    """a crowd intake of breath: rising breathy noise"""
    n = ns(0.5)
    return sweep_noise(0.5, 700, 2600, 1.0, 0.3) * np.linspace(0.2, 1, n) ** 1.5 * np.clip((n - np.arange(n)) / ns(0.06), 0, 1) * 1.2


def sfx():
    s = np.zeros((2, N))
    ev = [
        (1, "bear", lambda: growl(0.8, 0.7)),                                        # hook: the bear on the ribbon
        (2, "Trinity", lambda: mixs(bell(523, 0.6), later(bell(392, 0.5), 0.6))),     # the college bell
        (3, "no", stamp),                                                             # NO DOGS stamp
        (4, "reads", page_flip), (4, "again", page_flip),                             # reading the rules again
        (4, "bears", lambda: ding(1568, 0.4)),                                        # but bears? (the loophole)
        (5, "bear", lambda: growl(1.0, 0.85)),                                        # a real, live, tame bear
        (6, "horrified", gasp),                                                       # the tutors gasp
        (7, "fellowship", lambda: mixs(ding(2093, 0.55), later(ding(2637, 0.5), 0.12))),   # smug ding
        (8, "The", lambda: mixs(page_flip(), later(page_flip(), 0.25), later(page_flip(), 0.5))),   # flipping the rule book
        (9, "claws", lambda: growl(0.7, 0.6)),
    ]
    for ln, w, f in ev:
        place(s, f(), wt(ln, w) - 2 / 30, 1.0)
    return s


# ================================================================ mix
def main():
    tmp = os.path.join(D, "voice48_tmp.wav")      # AI Studio delivers 24 kHz mono: resample (no retiming)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(D, "voice.wav"), "-ar", str(SR), "-ac", "2", tmp], check=True)
    v, sr = read_wav(tmp)
    os.remove(tmp)
    assert sr == SR, sr
    vm = v.mean(0)
    voice = np.zeros(N)
    voice[: min(N, len(vm))] = vm[:N]
    # breaths: anything loud BETWEEN words (gaps > 0.15 s, 40 ms margin) is turned down 9 dB (smooth 20 ms ramps)
    keep = np.zeros(N)
    for x in words:
        keep[max(0, ns(x["s"] - 0.04)): min(N, ns(x["e"] + 0.06))] = 1
    sm = np.convolve(keep, np.ones(ns(0.02)) / ns(0.02), "same")
    breath_g = dbg(-9.0) + (1 - dbg(-9.0)) * np.clip(sm, 0, 1)
    voice *= breath_g
    V = st(voice)
    m, s = music(), sfx()
    # duck the music under the voice: -20 dB while speaking, -13 dB in the gaps (attack 70 ms, release 450 ms)
    e = np.sqrt(np.convolve(voice ** 2, np.ones(ns(0.05)) / ns(0.05), "same"))
    speak = (e > 0.02).astype(float)
    g = np.empty(N)
    acc = 0.0
    a, r = np.exp(-1 / (0.07 * SR)), np.exp(-1 / (0.45 * SR))
    for i in range(N):
        k = a if speak[i] > acc else r
        acc = k * acc + (1 - k) * speak[i]
        g[i] = acc
    vref = integrated(V)
    m *= dbg(vref - integrated(m) - 13) * dbg(-7 * g)               # music ~20 dB under the voice while speaking
    s *= dbg(-8.0 - 20 * np.log10(np.max(np.abs(s)) + 1e-9))       # loudest SFX peak at -8 dBFS (voice peaks ~-1.5)
    y = V + m + s
    y = fades(y, 0.002, 0.25)
    # master: integrated -14 LUFS, then a gentle peak limiter to <= -1 dBTP
    y *= dbg(-14.0 - integrated(y))
    ceil = dbg(-1.2)
    pk = np.max(np.abs(y), axis=0)
    gain = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    gs = np.empty_like(gain)
    acc = 1.0
    rel = np.exp(-1 / (0.08 * SR))
    look = ns(0.002)
    gl = np.minimum(gain, np.concatenate([gain[look:], np.ones(look)]))
    for i in range(N):
        acc = gl[i] if gl[i] < acc else rel * acc + (1 - rel) * gl[i]
        gs[i] = acc
    y *= gs
    y *= dbg(-14.0 - integrated(y))
    tp = true_peak(y)
    if tp > -1.0:
        y *= dbg(-1.0 - tp - 0.05)
    wav = os.path.join(D, "mix_tmp.wav")
    import wave
    with wave.open(wav, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y.T, -1, 1) * 32767).astype("<i2").tobytes())
    out = os.path.join(D, "mix.flac")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "flac", out], check=True)
    os.remove(wav)
    # ---- report ----
    silences = subprocess.run(["ffmpeg", "-nostats", "-i", out, "-af", "silencedetect=n=-45dB:d=0.25", "-f", "null", "-"], capture_output=True, text=True).stderr
    sil = [l.split("] ")[-1] for l in silences.splitlines() if "silence_start" in l]
    rep = ["# Audio report (byron)", "",
           f"- Length {N / SR:.3f} s ({FRAMES} frames @ 30 fps), 48 kHz stereo, FLAC",
           f"- Integrated {integrated(y):.2f} LUFS (target -14) · LRA {lra(y):.1f} LU (bible 1.8-3.5) · true peak {true_peak(y):.2f} dBTP",
           f"- Voice alone {vref:.2f} LUFS (breaths between words -9 dB); music ~20 dB under the voice while speaking, ~13 dB in gaps",
           "- SFX: hook growl, college bell, NO DOGS stamp, page flips, loophole ding, bear growl, the tutors' gasp, smug ding, growl on claws",
           f"- Silences > 0.25 s at -45 dB: {len(sil)}" + (" ✅" if not sil else "")] + [f"  - {x}" for x in sil[:10]]
    open(os.path.join(D, "audio-report.md"), "w", encoding="utf-8").write("\n".join(rep) + "\n")
    print("\n".join(rep))


if __name__ == "__main__":
    main()
