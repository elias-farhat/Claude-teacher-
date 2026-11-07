#!/usr/bin/env python3
"""Music bed + SFX + mix for "The Rat Bounty That Backfired" (STYLE_BIBLE.md 7).

usage: python rats_audio.py <scripts/rats dir> <frames> <frame-qa-rats.json>
reads voice.wav + words.json (+ the camera glide times from the frame QA), writes mix.flac (48 kHz stereo, exactly
frames/30 s) and audio-report.md. The voice is used as-is (final, never retimed). Music: an original sneaky little march
(2/4, 112 bpm, major pentatonic) for pizzicato bass, reed stabs, music box and woodblock whose mood follows the story;
ducked ~20 dB under the voice. SFX: a whoosh on every camera glide and one sound per on-screen action, all synthesized.
Master: -14 LUFS integrated, <= -1 dBTP. DSP helpers come from the claude-animated-shorts skill (templates/audio/dsp.py).
"""
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "../../.claude/skills/claude-animated-shorts/templates/audio"))
from dsp import SR, TAU, ns, tt, dbg, rng, lp, hp, bp, colored, modal, place, st, integrated, lra, true_peak, read_wav, fades  # noqa: E402

D, FRAMES, QA = sys.argv[1], int(sys.argv[2]), sys.argv[3]
DUR = FRAMES / 30
N = ns(DUR)
words = json.load(open(os.path.join(D, "words.json"), encoding="utf-8"))
R = rng(1902)
GLIDES = json.load(open(QA, encoding="utf-8"))["glides"]


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


# chords per bar, by section (C major pentatonic world; A minor for the mystery)
CH = {"C": [48, 52, 55], "G": [43, 47, 50], "F": [41, 45, 48], "Am": [45, 48, 52], "Em": [40, 43, 47], "Dm": [50, 53, 57], "E7": [40, 44, 47, 50], "G7": [43, 47, 50, 53]}
BASS = {"C": 36, "G": 31, "F": 41, "Am": 33, "Em": 28, "Dm": 38, "E7": 28, "G7": 31}
BEAT = 60 / 112
BAR = 2 * BEAT


def section(t):
    if t < wt(5) - 0.2:
        return "bright", ["C", "G", "C", "F", "C", "G", "C", "C"], 1.0
    if t < wt(8) - 0.2:
        return "tense", ["Am", "E7", "Am", "E7"], 0.8
    if t < wt(12) - 0.2:
        return "bouncy", ["C", "F", "G7", "C"], 1.0
    if t < wt(15) - 0.2:
        return "mystery", ["Am", "Dm", "E7", "Am"], 0.8
    if t < wt(19) - 0.2:
        return "warm", ["F", "C", "G", "C"], 0.95
    if t < wt(20) - 0.2:
        return "night", ["Am", "Em", "Am", "E7"], 0.7
    if t < wt(21) - 0.2:
        return "triumph", ["C", "F", "G7", "C"], 1.0
    return "end", ["Am", "G", "C", "C"], 0.8


# a sneaky pentatonic motif for the music box (8 steps = 4 bars of 2 beats)
MELODY = [76, 79, 81, None, 79, 76, 74, None, 72, 74, 76, None, 74, 72, 69, None]


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
        step = b % 4                                   # eighth notes in a 2/4 bar
        if step == 0:
            place(m, pizz(note(BASS[chord]), 0.9 * vol), t)
        elif step == 2:
            place(m, pizz(note(BASS[chord] + 7), 0.6 * vol), t)
        if step in (1, 3):
            stab = accordion([note(x + 12) for x in CH[chord]], BEAT * 0.3, 0.42 * vol)
            place(m, stab, t, 0.8)
        if kind not in ("night",):
            place(m, woodblock(0.3 if step % 2 else 0.18), t)
        if kind in ("bright", "bouncy", "warm", "triumph", "end") and step % 2 == 0:
            mi = MELODY[(b // 2) % 16]
            if mi:
                place(m, musicbox(note(mi + (0 if kind != "end" else -3)), 0.3), t)
        if kind in ("mystery", "night") and step == 0 and (b // 4) % 2 == 0:
            place(m, musicbox(note(69 + (0 if (b // 8) % 2 else 3)), 0.25), t)
    tf = words[-1]["s"]
    place(m, accordion([note(x) for x in (57, 60, 64, 69)], DUR - tf, 0.55), tf)
    for k, f in enumerate((81, 84, 88)):
        place(m, musicbox(note(f), 0.38), tf + 0.08 * k)
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


def sfx():
    s = np.zeros((2, N))
    for g in GLIDES:                                   # a whoosh across every camera glide (peaks mid-glide)
        L = g["t1"] - g["t0"]
        if g["len"] > 6:
            place(s, whoosh(L + 0.2, up=g["len"] > 30), g["t0"] - 0.05, 0.5 if g["len"] > 30 else 0.35)
    ev = [
        (1, "paid", coin), (1, "farming", lambda: mixs(squeak(2800), later(squeak(3200), 0.1))),
        (2, "capital", tram_bell), (3, "gave", snip),
        (4, "rats", lambda: patter(2.4)), (4, "nicest", lambda: mixs(pop() * 0.9, slide_whistle(700, 1800, 0.5) * 0.7)),
        (5, "plague", lambda: thud(55, 0.7)), (5, "kitchen", lambda: squeak(2400)), (5, "dangerous", lambda: thud(60, 0.9)),
        (6, "down", lambda: clink(900, 0.4)), (6, "into", lambda: clink(850, 0.35)),
        (7, "day", lambda: gear(0.7)), (7, "not", lambda: patter(1.0, 20)),
        (8, "rule", lambda: thud(140, 0.8)), (8, "cent", coin),
        (9, "mountain", lambda: thud(50, 0.6)), (9, "desk", lambda: boing() * 0.8),
        (10, "tail", lambda: mixs(whoosh(0.3, up=True) * 0.5, ding(2349, 0.4))),
        (11, "Tails", coin), (11, "pour", coin), (11, "Tens", coin), (11, "thrilled", lambda: slide_whistle(500, 1300, 0.4)),
        (12, "running", lambda: patter(1.0)), (13, "tail", lambda: slide_whistle(900, 600, 0.35)),
        (14, "another", lambda: patter(0.6)), (14, "And", lambda: patter(0.6, 18)),
        (15, "pays", coin), (16, "babies", lambda: mixs(squeak(3400), later(squeak(3000), 0.08))),
        (16, "brand-new", lambda: ding(3136, 0.4)), (17, "egg", cluck), (17, "killing", lambda: whoosh(0.35, up=False) * 0.7),
        (17, "Nobody", lambda: slide_whistle(900, 500, 0.4)), (18, "farms", lambda: squeak(2600)), (18, "reward", coin),
        (19, "cancel", rip), (20, "goes", lambda: horn(1.5)), (20, "President", lambda: cheer(2.2)),
        (21, "stayed", lambda: mixs(squeak(3000), ding(2637, 0.35))),
    ]
    for ln, w, f in ev:
        place(s, f(), wt(ln, w) - 2 / 30, 1.0)
    for k in range(8):                                 # sewer drips under the sewer scenes
        place(s, drip(), wt(3, "sewer") + 0.9 * k, 0.6)
        place(s, drip(), wt(7) - 1.0 + 0.8 * k, 0.6)
    return s


# ================================================================ mix
def main():
    v, sr = read_wav(os.path.join(D, "voice.wav"))
    assert sr == SR, sr
    vm = v.mean(0)
    voice = np.zeros(N)
    voice[: min(N, len(vm))] = vm[:N]
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
    rep = ["# Audio report (rats)", "",
           f"- Length {N / SR:.3f} s ({FRAMES} frames @ 30 fps), 48 kHz stereo, FLAC",
           f"- Integrated {integrated(y):.2f} LUFS (target -14) · LRA {lra(y):.1f} LU (bible 1.8-3.5) · true peak {true_peak(y):.2f} dBTP",
           f"- Voice alone {vref:.2f} LUFS; music ~20 dB under the voice while speaking, ~13 dB in gaps",
           f"- Silences > 0.25 s at -45 dB: {len(sil)}" + (" ✅" if not sil else "")] + [f"  - {x}" for x in sil[:10]]
    open(os.path.join(D, "audio-report.md"), "w", encoding="utf-8").write("\n".join(rep) + "\n")
    print("\n".join(rep))


if __name__ == "__main__":
    main()
