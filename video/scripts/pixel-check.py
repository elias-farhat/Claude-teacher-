"""Pixel check on a cheap proxy render (CLAUDE.md rule 13, after the math-only camera guard, before the full render).
usage: python pixel-check.py <proxy.mp4> <out_dir> [camera_report.json]
Reads the video at 270x480 and fails on:
  FLAT    one flat colour fills more than 55 % of a frame (colours quantised to 8 levels per channel)
  STATIC  the picture barely changes for more than 2 s: on a 27x48 thumbnail with the caption band (rows 58-84 %)
          masked, the mean abs difference between frame i and frame i+60 is < STATIC_T grey levels
and reports the camera guard's XCU bursts (extreme close-ups shorter than 8 frames, e.g. a whip into a face).
Writes <out_dir>/pixel_report.txt + pixel_report.json; exit 1 on any failure."""
import json, os, subprocess, sys
import numpy as np

W, H = 270, 480
FLAT_T, STATIC_T, STATIC_N = 0.55, 8.0, 60
TW, TH = 27, 48
rows = np.r_[0:int(TH * 0.58), int(TH * 0.84):TH]
src, out = sys.argv[1], sys.argv[2]
guard = sys.argv[3] if len(sys.argv) > 3 else None
os.makedirs(out, exist_ok=True)
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
frames = []
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    frames.append(np.frombuffer(b, np.uint8).reshape(H, W, 3))
p.wait()
n = len(frames)
fps = 30.0
flat, grey = [], []
for i, f in enumerate(frames):
    q = (f // 32).astype(np.int32)
    key = q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]
    frac = np.bincount(key.ravel(), minlength=512).max() / key.size
    flat.append(float(frac))
    g = f.astype(np.float32).mean(axis=2).reshape(TH, H // TH, TW, W // TW).mean(axis=(1, 3))
    grey.append(g[rows])
static = [False] * n
d60 = []
for i in range(n - STATIC_N):
    d = float(np.abs(grey[i] - grey[i + STATIC_N]).mean()); d60.append(d)
    if d < STATIC_T:
        for k in range(i, i + STATIC_N + 1): static[k] = True
def spans(mask):
    s, a = [], None
    for i, m in enumerate(mask + [False]):
        if m and a is None: a = i
        if not m and a is not None: s.append((a, i - 1)); a = None
    return s
fl = spans([x > FLAT_T for x in flat])
st = spans(static)
xcu = []
if guard and os.path.exists(guard):
    rep = json.load(open(guard))
    xcu = [(g["from"], g["to"], g["detail"]) for g in rep.get("ranges", []) if g["rule"] == "XCU" and g.get("critical")]
fmt = lambda a, b: f"{a / fps:6.2f}-{(b + 1) / fps:6.2f} s  f{a}-{b}"
lines = [f"pixel check {os.path.basename(src)}: {n} frames at {W}x{H}",
         f"FLAT (one colour > {int(FLAT_T * 100)} % of the frame): {len(fl)} ranges"] + [f"  {fmt(a, b)}  max {max(flat[a:b + 1]) * 100:.0f} %" for a, b in fl] + \
        [f"STATIC (frame i vs i+{STATIC_N} differ < {STATIC_T} levels, i.e. > 2 s barely changing): {len(st)} ranges"] + [f"  {fmt(a, b)}" for a, b in st] + \
        [f"XCU bursts (extreme close-ups shorter than 8 frames, from the camera guard): {len(xcu)}"] + [f"  {fmt(a, b)}  {d}" for a, b, d in xcu]
ok = not fl and not st and not xcu
lines.insert(1, "PASS" if ok else "FAIL")
open(os.path.join(out, "pixel_report.txt"), "w").write("\n".join(lines) + "\n")
json.dump({"pass": ok, "frames": n, "flat": fl, "static": st, "xcu": xcu, "flat_frac": [round(x, 3) for x in flat], "d60": [round(x, 2) for x in d60]}, open(os.path.join(out, "pixel_report.json"), "w"))
print("\n".join(lines))
sys.exit(0 if ok else 1)
