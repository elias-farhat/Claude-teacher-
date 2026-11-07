"""Full narration voice from scripts/<name>/SCRIPT.md with Kokoro (am_liam by default).
One sentence at a time so every sentence ends naturally; short pauses between sentences,
a slightly longer pause between script rows."""
import re, sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
name, voice, speed = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "am_liam"), float(sys.argv[3] if len(sys.argv) > 3 else 1.25)
rows = [l.split("|")[2].strip() for l in open(f"scripts/{name}/SCRIPT.md", encoding="utf-8") if re.match(r"^\| \d+ \|", l)]
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
sr = 24000; parts = []; marks = []; t = 0.0
for ri, row in enumerate(rows):
    text = row.replace("…", "...").replace("“", '"').replace("”", '"').replace("’", "'")
    sents = [s for s in re.split(r"(?<=[.!?])\s+(?=[A-Z\"'])", text) if s.strip()]
    for si, s in enumerate(sents):
        a, sr = k.create(s, voice=voice, speed=speed, lang="en-us")
        marks.append({"row": ri + 1, "text": s, "start": round(t, 3), "end": round(t + len(a) / sr, 3)})
        parts.append(a); t += len(a) / sr
        gap = 0.16 if si < len(sents) - 1 else 0.24
        if ri == len(rows) - 1 and si == len(sents) - 1: gap = 0.35
        parts.append(np.zeros(int(gap * sr), dtype=a.dtype)); t += gap
out = np.concatenate(parts)
sf.write(f"scripts/{name}/voice_raw.wav", out, sr)
json.dump(marks, open(f"scripts/{name}/sentences.json", "w"), indent=1)
words = sum(len(r.split()) for r in rows)
print(f"{name}: {len(rows)} rows, {len(marks)} sentences, {len(out)/sr:.1f}s, {words/(len(out)/sr):.2f} words/s")
