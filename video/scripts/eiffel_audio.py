#!/usr/bin/env python3
"""Music bed + SFX + mix for "The Man Who Sold the Eiffel Tower" (STYLE_BIBLE.md 7).

usage: python eiffel_audio.py <scripts/eiffel dir> <frames>
reads voice.wav + words.json, writes mix.flac (48 kHz stereo, exactly frames/30 s) and audio-report.md.
The voice is used as-is (timing untouched). Music: an original waltz (3/4, 126 bpm) for accordion, pizzicato bass,
music box and shaker whose harmony follows the story; ducked ~20 dB under the voice. SFX: a whoosh on every camera
flight / whip and one sound per on-screen action, all synthesized. Master: -14 LUFS integrated, <= -1 dBTP.
DSP helpers come from the claude-animated-shorts skill (templates/audio/dsp.py).
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
R = rng(1925)


def wt(line, w=0):
    ws = [x for x in words if x["line"] == line]
    if isinstance(w, str):
        k = next(i for i, x in enumerate(ws) if x["w"].lower().startswith(w.lower()))
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


# chords (MIDI roots + quality) per bar, by section
CH = {"F": [53, 57, 60], "C7": [48, 52, 55, 58], "Bb": [58, 62, 65], "Dm": [50, 53, 57], "A7": [45, 49, 52, 55], "Gm": [55, 58, 62], "C": [48, 52, 55]}
BASS = {"F": 41, "C7": 36, "Bb": 46, "Dm": 38, "A7": 33, "Gm": 43, "C": 36}
BEAT = 60 / 126
BAR = 3 * BEAT


def section(t):
    if t < wt(10) - 0.2:
        return "major", ["F", "C7", "F", "Bb", "F", "C7", "F", "F"], 1.0
    if t < wt(14) - 0.2:
        return "tense", ["Dm", "A7", "Dm", "A7"], 0.75
    if t < wt(18) - 0.2:
        return "major", ["F", "Bb", "C7", "F"], 1.0
    if t < wt(20) - 0.2:
        return "travel", ["F", "C7", "F", "C7"], 1.0
    if t < wt(23) - 0.2:
        return "night", ["Dm", "Gm", "A7", "Dm"], 0.8
    if t < wt(24) - 0.2:
        return "major", ["Bb", "F", "C", "F"], 0.95
    return "end", ["Dm", "Bb", "C", "F"], 0.7


MELODY = [72, None, 76, 77, None, 76, 74, None, 72, 69, None, None]  # music-box motif over 4 bars (3 beats each)


def music():
    m = np.zeros((2, N))
    nb = int(DUR / BEAT) + 2
    for b in range(nb):
        t = b * BEAT
        if t >= DUR:
            break
        kind, prog, vol = section(t)
        chord = prog[int(t / BAR) % len(prog)]
        beat = b % 3
        if beat == 0:
            place(m, pizz(note(BASS[chord]), 0.9 * vol), t)
        else:
            stab = accordion([note(x) for x in CH[chord]], BEAT * (0.55 if kind != "tense" else 0.9), 0.55 * vol)
            place(m, stab, t, 0.9 if kind != "tense" else 0.6)
        place(m, shaker(0.25 if kind != "travel" else 0.4), t)
        if kind == "travel":
            place(m, shaker(0.25), t + BEAT / 2)
        if kind in ("major", "end") and (b // 12) % 2 == 0:
            mi = MELODY[b % 12]
            if mi:
                place(m, musicbox(note(mi + (0 if chord in ("F", "Bb", "C", "C7") else -1)), 0.32), t)
    # final resolution: F major chord + music-box sparkle on the last word, ringing to the end
    tf = words[-1]["s"]
    place(m, accordion([note(x) for x in (53, 57, 60, 65)], DUR - tf, 0.6), tf)
    for k, f in enumerate((72, 76, 79, 84)):
        place(m, musicbox(note(f), 0.4), tf + 0.06 * k)
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


# camera transitions (story.ts: flights between exteriors, whips into / out of interiors), centred on the move
FLY, WHIP, LEADF = 0.75, 0.3, 0.3
TRANS = [(4, 0, "fly"), (5, 0, "whip"), (6, 0, "whip"), (6, "fanciest", "whip"), (7, "secret", "whip"), (14, 0, "whip"), (15, 0, "whip"),
         (16, 0, "whip"), (17, 0, "whip"), (18, 0, "whip"), (20, 0, "whip"), (21, 0, "whip"), (21, "New", "whip"), (22, 0, "whip"),
         (23, 0, "fly"), (24, 0, "whip"), (2, "tried", "whip"), (3, 0, "fly")]


def sfx():
    s = np.zeros((2, N))
    for ln, w, kind in TRANS:
        L = FLY if kind == "fly" else WHIP
        t0 = wt(ln, w) - L * LEADF
        place(s, whoosh(L + 0.25, up=kind == "fly"), t0 - 0.1, 0.55 if kind == "fly" else 0.45)
    place(s, whoosh(3.2, up=False), 0.0, 0.35)                       # line 1: the long fly-down the tower
    ev = [
        (1, "scrap", lambda: clink(1900, 0.35)), (2, "came", lambda: rustle(0.2)), (2, "tried", lambda: ding(2637, 0.5)),
        (3, "rusty", lambda: rustle(0.5) * 0.6), (3, "ugly", lambda: clink(4200, 0.5)),
        (4, "morning", lambda: rustle(0.45)), (5, "pays", coin), (5, "forger", lambda: thud(110, 0.5)), (5, "government", lambda: thud(110, 0.5)),
        (5, "letterhead", lambda: thud(110, 0.6)), (6, "Paris", coin), (8, "selling", lambda: rustle(0.5)), (9, 0, lambda: thud(70, 0.9)),
        (9, "Not", lambda: shush()), (9, "anyone", lambda: shush() * 0.8), (11, 0, lambda: gear(1.1) * 0.6), (11, "off", lambda: boing() * 0.7),
        (13, "bribe", lambda: splash() * 0.7), (14, "fake", lambda: ding(3136, 0.45)), (14, "money", coin),
        (15, "crooked", lambda: slide_whistle(600, 1400, 0.45)), (16, "Suddenly", lambda: pop() * 0.8), (17, 0, lambda: rustle(0.6)),
        (17, "tower", lambda: rustle(0.3) * 0.7), (18, 0, lambda: train_whistle(1.1)), (18, "seventy", coin), (19, "Nothing", lambda: rustle(0.6)),
        (20, "anyone", lambda: meow() * 0.6), (21, 0, lambda: screech(0.9)), (22, "police", lambda: police_whistle()),
        (22, "time", lambda: police_whistle() * 0.8), (23, 0, lambda: horn(1.8)), (25, "apprentice", lambda: ding(1760, 0.4)),
    ]
    for ln, w, f in ev:
        place(s, f(), wt(ln, w) - 2 / 30, 1.0)
    place(s, chug(wt(20) - wt(18) - 0.3), wt(18) + 0.4, 0.45)
    for k in range(5):                                                 # envelopes into mailboxes
        place(s, rustle(0.18) * 0.7, wt(7) + 0.28 * k, 1.0)
    place(s, rain(wt(25) - wt(24) + 0.6), wt(24) - 0.2, 0.35)
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
    rep = ["# Audio report (eiffel)", "",
           f"- Length {N / SR:.3f} s ({FRAMES} frames @ 30 fps), 48 kHz stereo, FLAC",
           f"- Integrated {integrated(y):.2f} LUFS (target -14) · LRA {lra(y):.1f} LU (bible 1.8-3.5) · true peak {true_peak(y):.2f} dBTP",
           f"- Voice alone {vref:.2f} LUFS; music ~20 dB under the voice while speaking, ~13 dB in gaps",
           f"- Silences > 0.25 s at -45 dB: {len(sil)}" + (" ✅" if not sil else "")] + [f"  - {x}" for x in sil[:10]]
    open(os.path.join(D, "audio-report.md"), "w", encoding="utf-8").write("\n".join(rep) + "\n")
    print("\n".join(rep))


if __name__ == "__main__":
    main()
