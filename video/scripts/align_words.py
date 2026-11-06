#!/usr/bin/env python3
"""Word timestamps for a short: force-aligns the approved narration (SCRIPT.md) to the voice with WhisperX.

usage: align_words.py <SCRIPT.md> <voice.wav> <out words.json> <out report.md>

1. WhisperX transcribes the voice (faster-whisper) -> heard words with rough times.
2. The narration column of SCRIPT.md is the ground truth. Heard words are matched to script words (difflib) and
   every script line gets a time window from its matched words (interpolated where nothing matched).
3. whisperx.align() force-aligns each script line's own text inside its window (wav2vec2 CTC) -> per-word s/e.
4. Every script word is compared with what was heard; mismatches go to the report.
Output: [{"i": 0, "w": "In", "s": 0.41, "e": 0.55, "line": 1}, ...] (the skill's mix.py reads w/s/e).
"""
import difflib
import json
import re
import sys

import whisperx

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

# ---------------- 1. transcribe
audio = whisperx.load_audio(wav)
dur = len(audio) / 16000
model = whisperx.load_model("medium.en", "cpu", compute_type="int8", language="en")
tr = model.transcribe(audio, batch_size=8, language="en")
amodel, meta = whisperx.load_align_model(language_code="en", device="cpu")
heard_al = whisperx.align(tr["segments"], amodel, meta, audio, "cpu", return_char_alignments=False)
heard = [w for s in heard_al["segments"] for w in s.get("words", []) if "start" in w]
heard_tok = []  # (normalised word, start, end)
for w in heard:
    for part in norm(w["word"]).split():
        heard_tok.append((part, w["start"], w["end"]))

# ---------------- 2. script line windows from matched heard words
script_tok = []  # (normalised part, index of display word)
for i, w in enumerate(words):
    for part in w["say"].split():
        script_tok.append((part, i))
sm = difflib.SequenceMatcher(a=[p for p, _ in script_tok], b=[p for p, _, _ in heard_tok], autojunk=False)
hit = {}  # display word index -> (start, end)
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        i = script_tok[a + k][1]
        s, e = heard_tok[b + k][1], heard_tok[b + k][2]
        hit[i] = (min(hit.get(i, (s, e))[0], s), max(hit.get(i, (s, e))[1], e))

line_ids = [ln for ln, _ in lines]
win = {}
for ln in line_ids:
    idx = [i for i, w in enumerate(words) if w["line"] == ln and i in hit]
    if idx:
        win[ln] = [hit[idx[0]][0], hit[idx[-1]][1]]
# interpolate missing lines between neighbours, then pad each window a little into the gaps
for k, ln in enumerate(line_ids):
    if ln not in win:
        prev_e = max([win[l][1] for l in line_ids[:k] if l in win] or [0.0])
        nxt_s = min([win[l][0] for l in line_ids[k + 1:] if l in win] or [dur])
        win[ln] = [prev_e, nxt_s]
for k, ln in enumerate(line_ids):
    lo = win[line_ids[k - 1]][1] if k else 0.0
    hi = win[line_ids[k + 1]][0] if k + 1 < len(line_ids) else dur
    win[ln] = [max(lo, win[ln][0] - 0.25), min(hi, win[ln][1] + 0.25)]

# ---------------- 3. force-align the script's own text per line
segs = [{"start": win[ln][0], "end": win[ln][1],
         "text": " ".join(w["say"] for w in words if w["line"] == ln)} for ln in line_ids]
al = whisperx.align(segs, amodel, meta, audio, "cpu", return_char_alignments=False)
out, missing = [], []
for seg, ln in zip(al["segments"], line_ids):
    disp = [i for i, w in enumerate(words) if w["line"] == ln]
    parts = [(p, i) for i in disp for p in words[i]["say"].split()]
    aw = seg.get("words", [])
    if len(aw) != len(parts):
        raise SystemExit(f"line {ln}: aligner returned {len(aw)} words for {len(parts)} spoken parts")
    span = {}
    for (p, i), w in zip(parts, aw):
        if "start" in w:
            s, e = span.get(i, (w["start"], w["end"]))
            span[i] = (min(s, w["start"]), max(e, w["end"]))
    for i in disp:
        if i not in span:  # no alignable sound (rare): fall back to the transcript match
            span[i] = hit.get(i, (None, None))
            missing.append(words[i]["w"])
        out.append({"i": i, "w": words[i]["w"], "s": round(span[i][0], 3) if span[i][0] is not None else None,
                    "e": round(span[i][1], 3) if span[i][1] is not None else None, "line": ln})
# fill any remaining holes by interpolation so every word has a time
for k, w in enumerate(out):
    if w["s"] is None:
        prev = next((o["e"] for o in reversed(out[:k]) if o["e"] is not None), 0.0)
        nxt = next((o["s"] for o in out[k + 1:] if o["s"] is not None), dur)
        w["s"], w["e"] = round(prev, 3), round(max(prev, nxt), 3)
json.dump(out, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------- 4. compare what was heard with the script
R = ["# Word alignment report", "",
     f"- Voice: `{wav}` ({dur:.2f} s) · script: `{script_md}` ({len(lines)} lines, {len(words)} words)",
     f"- Heard (WhisperX medium.en): {len(heard_tok)} words · aligned script words: {len(out)}",
     f"- First word {out[0]['w']!r} at {out[0]['s']} s · last word {out[-1]['w']!r} ends at {out[-1]['e']} s", ""]
diffs = [op for op in sm.get_opcodes() if op[0] != "equal"]
R += ["## Script vs heard", "- Every script word was heard as written ✅" if not diffs else
      f"- {len(diffs)} difference(s) between the script and the transcript:"]
for tag, a0, a1, b0, b1 in diffs:
    sw = " ".join(p for p, _ in script_tok[a0:a1]) or "∅"
    hw = " ".join(p for p, _, _ in heard_tok[b0:b1]) or "∅"
    ln = words[script_tok[a0][1]]["line"] if a0 < len(script_tok) else line_ids[-1]
    R.append(f"  - line {ln}: script `{sw}` · heard `{hw}` ({tag})")
if missing:
    R += ["", f"- Words the aligner could not place (times from the transcript instead): {', '.join(missing)}"]
gaps = [(out[k]["e"], out[k + 1]["s"]) for k in range(len(out) - 1) if out[k + 1]["s"] - out[k]["e"] > 0.4]
R += ["", "## Pauses longer than 0.4 s between words"] + [f"- {a:.2f} → {b:.2f} s ({b - a:.2f} s)" for a, b in gaps] or ["- none"]
R += ["", "## Lines", "| line | start | end | words |", "|---|---|---|---|"]
for ln in line_ids:
    ws = [o for o in out if o["line"] == ln]
    R.append(f"| {ln} | {ws[0]['s']:.2f} | {ws[-1]['e']:.2f} | {' '.join(o['w'] for o in ws)} |")
open(out_md, "w", encoding="utf-8").write("\n".join(R) + "\n")
print("\n".join(R))
