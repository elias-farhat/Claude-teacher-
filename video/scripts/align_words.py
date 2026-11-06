#!/usr/bin/env python3
"""Word timestamps for a short: force-aligns the approved narration (SCRIPT.md) to the voice.

usage: align_words.py <SCRIPT.md> <voice.wav> <out words.json> <out report.md>

Uses the two building blocks of WhisperX directly (its package pins clash on current runners):
1. torchaudio's MMS_FA wav2vec2 CTC forced aligner aligns the SCRIPT's own words to the audio (one pass, 63 s).
2. faster-whisper (WhisperX's ASR engine, medium.en) transcribes the voice; every script word is compared with what
   was heard, and any mismatch is listed in the report.
Output: [{"i": 0, "w": "In", "s": 0.41, "e": 0.55, "line": 1}, ...] (the skill's mix.py reads w/s/e).
"""
import difflib
import json
import re
import sys

import torch
import torchaudio

script_md, wav, out_json, out_md = sys.argv[1:5]

# ---------------- narration from the script table
lines = []
for row in open(script_md, encoding="utf-8"):
    m = re.match(r"^\|\s*(\d+)\s*\|\s*(.+?)\s*\|", row)
    if m:
        lines.append((int(m.group(1)), m.group(2).strip()))
assert lines, "no narration rows found in " + script_md

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen " \
       "seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def two(n):
    return ONES[n] if n < 20 else TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])


def spell(tok):
    """How a token is spoken, for alignment ('1925' -> 'nineteen twenty five')."""
    if re.fullmatch(r"1[0-9]{3}", tok):
        a, b = int(tok[:2]), int(tok[2:])
        return two(a) + " " + ("hundred" if b == 0 else ("oh " + ONES[b] if b < 10 else two(b)))
    if re.fullmatch(r"\d{1,2}", tok):
        return two(int(tok))
    return tok


def norm(t):
    t = t.lower().replace("’", "'").replace("é", "e").replace("è", "e").replace("à", "a")
    return re.sub(r"[^a-z' ]+", " ", t).strip()


words = []  # display tokens with the line they belong to
for ln, text in lines:
    for tok in re.findall(r"[A-Za-zÀ-ÿ0-9’'\-]+", text):
        words.append({"w": tok.strip("-"), "line": ln, "say": norm(spell(tok.replace("-", " ")))})

# ---------------- 1. forced alignment of the script text
bundle = torchaudio.pipelines.MMS_FA
wave, sr = torchaudio.load(wav)
wave = wave.mean(0, keepdim=True)
if sr != bundle.sample_rate:
    wave = torchaudio.functional.resample(wave, sr, bundle.sample_rate)
dur = wave.shape[1] / bundle.sample_rate
model, tokenizer, aligner = bundle.get_model(with_star=False), bundle.get_tokenizer(), bundle.get_aligner()
parts = [(p, i) for i, w in enumerate(words) for p in w["say"].split()]  # spoken parts -> display word
with torch.inference_mode():
    emission, _ = model(wave)
    spans = aligner(emission[0], tokenizer([p for p, _ in parts]))
fps = emission.shape[1] / dur  # emission frames per second
span = {}
for (p, i), sp in zip(parts, spans):
    s, e = sp[0].start / fps, sp[-1].end / fps
    a, b = span.get(i, (s, e))
    span[i] = (min(a, s), max(b, e))
out = [{"i": i, "w": w["w"], "s": round(span[i][0], 3), "e": round(span[i][1], 3), "line": w["line"]} for i, w in enumerate(words)]
json.dump(out, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------- 2. transcribe and compare with the script
from faster_whisper import WhisperModel  # noqa: E402

asr = WhisperModel("medium.en", device="cpu", compute_type="int8")
segs, _ = asr.transcribe(wav, language="en", word_timestamps=True, vad_filter=False, beam_size=5)
heard = [(p, w.start, w.end) for s in segs for w in (s.words or []) for p in norm(w.word).split()]
sm = difflib.SequenceMatcher(a=[p for p, _ in parts], b=[p for p, _, _ in heard], autojunk=False)
diffs = [op for op in sm.get_opcodes() if op[0] != "equal"]
# timing cross-check: aligned start vs Whisper's start for matched words
deltas = []
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        i = parts[a + k][1]
        deltas.append(abs(span[i][0] - heard[b + k][1]))

R = ["# Word alignment report", "",
     f"- Voice: `{wav}` ({dur:.2f} s) · script: `{script_md}` ({len(lines)} lines, {len(words)} words)",
     "- Method: torchaudio MMS_FA forced alignment of the script text; check transcript by faster-whisper medium.en",
     f"- First word {out[0]['w']!r} at {out[0]['s']} s · last word {out[-1]['w']!r} ends at {out[-1]['e']} s",
     f"- Heard {len(heard)} words; aligned vs Whisper start time: median {sorted(deltas)[len(deltas) // 2]:.3f} s, "
     f"90th pct {sorted(deltas)[int(len(deltas) * 0.9)]:.3f} s" if deltas else "- no matched words", ""]
R += ["## Script vs heard", "- Every script word was heard as written ✅" if not diffs else
      f"- {len(diffs)} difference(s) between the script and the transcript:"]
for tag, a0, a1, b0, b1 in diffs:
    sw = " ".join(p for p, _ in parts[a0:a1]) or "∅"
    hw = " ".join(p for p, _, _ in heard[b0:b1]) or "∅"
    ln = words[parts[min(a0, len(parts) - 1)][1]]["line"]
    R.append(f"  - line {ln}: script `{sw}` · heard `{hw}` ({tag})")
gaps = [(out[k]["e"], out[k + 1]["s"]) for k in range(len(out) - 1) if out[k + 1]["s"] - out[k]["e"] > 0.4]
R += ["", "## Pauses longer than 0.4 s between words"] + ([f"- {a:.2f} → {b:.2f} s ({b - a:.2f} s)" for a, b in gaps] or ["- none"])
R += ["", "## Lines", "| line | start | end | words |", "|---|---|---|---|"]
for ln, _ in lines:
    ws = [o for o in out if o["line"] == ln]
    R.append(f"| {ln} | {ws[0]['s']:.2f} | {ws[-1]['e']:.2f} | {' '.join(o['w'] for o in ws)} |")
open(out_md, "w", encoding="utf-8").write("\n".join(R) + "\n")
print("\n".join(R))
