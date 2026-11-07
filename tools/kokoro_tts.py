#!/usr/bin/env python3
"""Narration voice with Kokoro TTS (Apache-2.0, ONNX on CPU) from the narration column of scripts/<name>/SCRIPT.md.

usage:
  kokoro_tts.py samples <name> <out_dir>                 4 male English narrator voices reading the first 3 lines
  kokoro_tts.py full    <name> <voice> <speed|auto>      the whole narration -> scripts/<name>/voice_raw.wav + sentences.json

Both modes:
  - synthesize ONE SENTENCE AT A TIME, so every sentence ends naturally (Kokoro's own sentence-final intonation),
    trim each clip's trailing silence and give it a 40 ms fade-out, then insert exactly 0.3 s of silence between sentences
  - speed "auto" = calibrated per voice to ~3.7 words/s for the whole read (pauses included): two passes,
    speed *= measured / 3.7 each time (Kokoro speed is clamped to 0.8..1.5)
Mastering to -14 LUFS and word timestamps are separate steps of .github/workflows/voice.yml.
"""
import json
import re
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

TARGET_WPS, PAUSE, FADE = 3.7, 0.3, 0.04
# male English narrator voices of Kokoro v1.0 (US + UK)
SAMPLE_VOICES = ["am_michael", "am_liam", "bm_george", "bm_lewis"]


def narration(name):
    """narration column of the script table (| # | Narration | ... |)"""
    rows = []
    for line in open(f"scripts/{name}/SCRIPT.md", encoding="utf-8"):
        m = re.match(r"^\|\s*(\d+)\s*\|\s*(.+?)\s*\|", line)
        if m:
            rows.append((int(m.group(1)), m.group(2).strip()))
    if not rows:
        raise SystemExit(f"no narration rows in scripts/{name}/SCRIPT.md")
    return rows


def clean(text):
    return text.replace("…", "...").replace("“", '"').replace("”", '"').replace("’", "'").replace("—", ", ")


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", clean(text)) if s.strip()]


def words(text):
    return len(re.findall(r"[A-Za-z0-9']+", text))


def trim(a, sr, thr=0.008):
    """drop leading/trailing silence, fade the tail so the sentence ends cleanly"""
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx):
        a = a[max(0, idx[0] - int(0.01 * sr)): idx[-1] + int(0.06 * sr)]
    n = int(FADE * sr)
    if len(a) > n:
        a = a.copy()
        a[-n:] *= np.linspace(1, 0, n)
    return a


def read(k, rows, voice, speed):
    """synthesize rows sentence by sentence with 0.3 s pauses; returns audio, sr, sentence marks"""
    lang = "en-gb" if voice.startswith("b") else "en-us"
    parts, marks, t, sr = [], [], 0.0, 24000
    sents = [(r, s) for r, text in rows for s in sentences(text)]
    for i, (r, s) in enumerate(sents):
        a, sr = k.create(s, voice=voice, speed=speed, lang=lang)
        a = trim(np.asarray(a, dtype=np.float32), sr)
        marks.append({"row": r, "text": s, "start": round(t, 3), "end": round(t + len(a) / sr, 3)})
        parts.append(a)
        t += len(a) / sr
        if i < len(sents) - 1:
            parts.append(np.zeros(int(PAUSE * sr), dtype=np.float32))
            t += PAUSE
    return np.concatenate(parts), sr, marks


def calibrated(k, rows, voice, speed):
    """speed 'auto': two passes toward ~3.7 words/s overall"""
    n = sum(words(t) for _, t in rows)
    if speed != "auto":
        a, sr, m = read(k, rows, voice, float(speed))
        return a, sr, m, float(speed)
    s = 1.1
    for _ in range(2):
        a, sr, m = read(k, rows, voice, s)
        wps = n / (len(a) / sr)
        s = float(np.clip(s * TARGET_WPS / wps, 0.8, 1.5))
    a, sr, m = read(k, rows, voice, s)
    return a, sr, m, s


def main():
    mode, name = sys.argv[1], sys.argv[2]
    k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
    rows = narration(name)
    if mode == "samples":
        out = sys.argv[3]
        first = rows[:3]
        n = sum(words(t) for _, t in first)
        notes = [f"# Voice samples for scripts/{name} (first 3 narration lines, {n} words)", "",
                 "| voice | speed | length | words/s |", "|---|---|---|---|"]
        for v in SAMPLE_VOICES:
            a, sr, _, s = calibrated(k, first, v, "auto")
            sf.write(f"{out}/{v}.wav", a, sr)
            notes.append(f"| {v} | {s:.2f} | {len(a) / sr:.1f} s | {n / (len(a) / sr):.2f} |")
            print(notes[-1])
        notes += ["", "Pick one, then run the Voice workflow again with mode = full and that voice (speed auto keeps ~3.7 words/s)."]
        open(f"{out}/SAMPLES.md", "w", encoding="utf-8").write("\n".join(notes) + "\n")
    elif mode == "full":
        voice, speed = sys.argv[3], sys.argv[4]
        a, sr, marks, s = calibrated(k, rows, voice, speed)
        sf.write(f"scripts/{name}/voice_raw.wav", a, sr)
        json.dump(marks, open(f"scripts/{name}/sentences.json", "w", encoding="utf-8"), indent=1)
        n = sum(words(t) for _, t in rows)
        print(f"{name}: {voice} speed {s:.2f}, {len(rows)} rows, {len(marks)} sentences, {len(a) / sr:.1f} s, {n / (len(a) / sr):.2f} words/s")
    else:
        raise SystemExit("mode must be samples or full")


if __name__ == "__main__":
    main()
