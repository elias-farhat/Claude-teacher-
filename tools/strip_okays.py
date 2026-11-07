"""Cut the throwaway 'Okay's out of CapCut voice blocks using okays.json (faster-whisper word times),
refining each cut to the quietest point nearby so the real sentence ending keeps its natural decay.
Usage: python tools/strip_okays.py <name> [pause_s]  ->  scripts/<name>/capcut/clean_blockN.wav + report"""
import sys, json, glob, wave, numpy as np

class sf:
    @staticmethod
    def read(p):
        w = wave.open(p); sr = w.getframerate(); ch = w.getnchannels()
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
        return (a.reshape(-1, ch) if ch > 1 else a), sr
    @staticmethod
    def write(p, a, sr):
        w = wave.open(p, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
name = sys.argv[1]; PAUSE = float(sys.argv[2]) if len(sys.argv) > 2 else 0.30
d = f"scripts/{name}/capcut"; meta = json.load(open(f"{d}/okays.json"))

def env_db(a, sr, hop=0.005):
    w = int(hop * sr); n = len(a) // w
    return 20 * np.log10(np.sqrt((a[:n * w].reshape(n, w) ** 2).mean(1)) + 1e-9), hop

def quietest(env, hop, t, lo, hi):
    i0, i1 = max(0, int((t + lo) / hop)), min(len(env) - 1, int((t + hi) / hop))
    return (i0 + int(np.argmin(env[i0:i1 + 1]))) * hop if i1 > i0 else t

report = []
for blk, info in sorted(meta.items()):
    a, sr = sf.read(f"{d}/{blk}"); a = a if a.ndim == 1 else a.mean(1)
    env, hop = env_db(a, sr)
    words = info["words"]; cuts = []
    for ok in info["okays"]:
        k = next(i for i, w in enumerate(words) if w["s"] == ok["s"] and w["e"] == ok["e"])
        prev_e = words[k - 1]["e"] if k > 0 else 0.0
        nxt_s = words[k + 1]["s"] if k + 1 < len(words) else len(a) / sr
        c0 = quietest(env, hop, ok["s"], -0.12, 0.06)            # gap before "okay"
        c0 = max(c0, prev_e + 0.04)                              # never eat the real last word
        c1 = quietest(env, hop, ok["e"], -0.04, 0.15) if k + 1 < len(words) else len(a) / sr
        c1 = min(max(c1, ok["e"]), nxt_s - 0.02) if k + 1 < len(words) else c1
        cuts.append((c0, c1))
    out = []; pos = 0
    for c0, c1 in cuts:
        i0, i1 = int(c0 * sr), int(c1 * sr)
        loud = env[min(len(env) - 1, int(c0 / hop))] > -40       # no real gap before "okay" -> longer fade
        seg = a[pos:i0].copy(); f = min(len(seg), int((0.07 if loud else 0.02) * sr))
        if f: seg[-f:] *= np.linspace(1, 0, f) ** 1.6           # fade so the cut is smooth
        out += [seg, np.zeros(int(PAUSE * sr))]
        pos = i1
        # natural decay of the sentence end just before the cut
        k1 = int(c0 / hop); k = k1
        while k > 0 and env[k] < -45: k -= 1
        dd = k
        while dd > 0 and env[dd] < -25: dd -= 1
        report.append((blk, round(c0, 2), (k - dd) * 5))
    tail = a[pos:].copy(); f = min(len(tail), int(0.02 * sr))
    if f: tail[:f] *= np.linspace(0, 1, f)
    out.append(tail)
    o = np.concatenate(out)
    sf.write(f"{d}/clean_{blk}", o, sr)
    print(f"{blk}: {len(cuts)} okays cut, {len(a)/sr:.1f}s -> {len(o)/sr:.1f}s")
for blk, t, dec in report:
    print(f"  {blk} sentence end before {t:6.2f}s: fade {dec:4d} ms {'CHOPPED' if dec < 40 else 'natural'}")
