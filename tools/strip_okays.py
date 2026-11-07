"""Remove the throwaway 'Okay's from CapCut voice blocks.
Whisper word times (okays.json) only say roughly WHERE each Okay is; the cut itself uses the sound:
every Okay is its own island of voice with silence on both sides, so the whole island is removed and
both cut points sit inside silence (no clicks, no leftover '-kay'). The real sentence before it keeps
its full natural decay. Usage: python tools/strip_okays.py <name> [pause_s]"""
import sys, json, wave, numpy as np
name = sys.argv[1]; PAUSE = float(sys.argv[2]) if len(sys.argv) > 2 else 0.30
d = f"scripts/{name}/capcut"; meta = json.load(open(f"{d}/okays.json"))
HOP = 0.005

def load(p):
    w = wave.open(p); sr = w.getframerate(); ch = w.getnchannels()
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    return (a.reshape(-1, ch).mean(1) if ch > 1 else a), sr

def save(p, a, sr):
    w = wave.open(p, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()

def islands(a, sr, thr=-42, merge=0.07, min_len=0.06):
    n = int(len(a) / sr / HOP); h = int(HOP * sr)
    env = 20 * np.log10(np.sqrt((a[:n * h].reshape(n, h) ** 2).mean(1)) + 1e-9)
    on = env > thr; isl = []; i = 0
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]: j += 1
            isl.append([i * HOP, j * HOP]); i = j
        else: i += 1
    out = []
    for s, e in isl:                                   # merge tiny gaps (the dip inside "O-kay")
        if out and s - out[-1][1] < merge: out[-1][1] = e
        else: out.append([s, e])
    return [x for x in out if x[1] - x[0] >= min_len]

for blk, info in sorted(meta.items()):
    a, sr = load(f"{d}/{blk}"); isl = islands(a, sr)
    words = info["words"]; used = set(); cuts = []
    for ok in info["okays"]:
        k = words.index(ok)
        prev_e = words[k - 1]["e"] if k > 0 else 0.0
        mid = (ok["s"] + ok["e"]) / 2
        # candidate islands: start after the previous word has (roughly) ended, short like an "okay"
        cand = [i for i, (s, e) in enumerate(isl) if i not in used and s >= prev_e - 0.25 and 0.15 <= e - s <= 0.9]
        i = min(cand, key=lambda i: abs((isl[i][0] + isl[i][1]) / 2 - mid))
        used.add(i)
        prev_end = isl[i - 1][1] if i > 0 else 0.0           # end of the real sentence (incl. its decay)
        next_start = isl[i + 1][0] if i + 1 < len(isl) else None
        c0 = min(prev_end + 0.12, isl[i][0] - 0.01)           # keep the sentence's full tail
        c1 = (max(next_start - 0.05, isl[i][1] + 0.01) if next_start is not None else len(a) / sr)
        cuts.append((c0, c1, isl[i][0], isl[i][1]))
    cuts.sort(); out = []; pos = 0
    for c0, c1, s, e in cuts:
        seg = a[int(pos * sr):int(c0 * sr)].copy(); f = min(len(seg), int(0.01 * sr))
        if f: seg[-f:] *= np.linspace(1, 0, f)
        out += [seg, np.zeros(int(max(0.0, PAUSE - 0.17) * sr))]   # 0.12 s tail + pause + 0.05 s lead-in ~= PAUSE
        pos = c1
    tail = a[int(pos * sr):].copy(); f = min(len(tail), int(0.01 * sr))
    if f: tail[:f] *= np.linspace(0, 1, f)
    out.append(tail); o = np.concatenate(out)
    save(f"{d}/clean_{blk}", o, sr)
    print(f"{blk}: removed {len(cuts)} okays " + ", ".join(f"[{s:.2f}-{e:.2f}]" for _, _, s, e in cuts) + f"  {len(a)/sr:.1f}s -> {len(o)/sr:.1f}s")
