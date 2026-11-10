"""Pixel check on a cheap proxy render (CLAUDE.md rule 13, after the math-only camera guard, before the full render).
usage: python pixel-check.py <proxy.mp4> <out_dir> [camera_report.json] [camtrack.json] [headboxes.json] [lensoff.mp4]
Reads the video at 270x480 and fails on:
  FLAT    one flat colour fills more than 55 % of a frame (colours quantised to 8 levels per channel)
  STATIC  the picture barely changes for more than 2 s: on a 27x48 thumbnail with the caption band (rows 58-84 %)
          masked, the mean abs difference between frame i and frame i+60 is < STATIC_T grey levels
  SHARP   the current subject is blurred on a held frame. Inside its projected head box (a prop: its box, from the
          camera guard's headboxes.json) the edge sharpness = mean of the strongest 0.5 % of |Laplacian| / the box's
          contrast (98th - 2nd percentile). It is compared with the SAME frame of a reference proxy rendered with the
          lens blur off (lensoff.mp4): sharpness / reference must be >= 70 % for 3+ frames in a row. A lens that
          focuses correctly leaves the subject untouched (ratio 1.00). Why not "Laplacian variance >= 50 % of the
          video median": calibrated on Rats runs 25 / 26 and proxy 27, any threshold against the video median
          depends on the subject (a grey rat card scores half of a face with glasses) and failed sharp frames.
          Without a reference video the check falls back to 70 % of the video median of the normalised measure.
FLAT skips the frames of 6-frame whips (camtrack.json: a deliberate motion-blur smear between two subjects),
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
trackf = sys.argv[4] if len(sys.argv) > 4 else None
boxf = sys.argv[5] if len(sys.argv) > 5 else None
reff = sys.argv[6] if len(sys.argv) > 6 and os.path.exists(sys.argv[6]) else None
SHARP_T = 0.7
whip = set()
if trackf and os.path.exists(trackf):
    for g in json.load(open(trackf)).get("flights", []):
        if g.get("kind") == "whip": whip.update(range(int(g["t0"] * 30), int(g["t1"] * 30) + 2))
os.makedirs(out, exist_ok=True)
def read(path):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    out = []
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        out.append(np.frombuffer(b, np.uint8).reshape(H, W, 3))
    p.wait()
    return out
frames = read(src)
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
# SHARP
def sharp_of(f, box):
    g = f.astype(np.float32).mean(axis=2)
    a, b, c, d = int(box[0] * W), int(box[1] * H), int(np.ceil(box[2] * W)), int(np.ceil(box[3] * H))
    if c - a < 16: k = (16 - (c - a)) // 2 + 1; a -= k; c += k
    if d - b < 16: k = (16 - (d - b)) // 2 + 1; b -= k; d += k
    r = g[max(0, b):min(H, d), max(0, a):min(W, c)]
    if r.shape[0] < 6 or r.shape[1] < 6: return None
    L = r[1:-1, 1:-1] * 4 - r[:-2, 1:-1] - r[2:, 1:-1] - r[1:-1, :-2] - r[1:-1, 2:]
    A = np.sort(np.abs(L).ravel())
    return float(A[-max(5, A.size // 200):].mean() / max(np.percentile(r, 98) - np.percentile(r, 2), 8)), float(L.var())
sharp, lapv, soft = [None] * n, [None] * n, [False] * n
med = medv = 1.0; mode = "video median"
if boxf and os.path.exists(boxf):
    hb = json.load(open(boxf))
    ref = read(reff) if reff else None
    if ref is not None and len(ref) != n: ref = None
    for i in range(min(n, len(hb))):
        if hb[i] and hb[i][4] and i not in whip:
            m = sharp_of(frames[i], hb[i])
            if not m: continue
            if ref is not None:
                r = sharp_of(ref[i], hb[i])
                if r: sharp[i], lapv[i] = m[0] / max(r[0], 1e-6), m[1] / max(r[1], 1e-6)
            else: sharp[i], lapv[i] = m
    vals = [x for x in sharp if x is not None]
    if vals:
        if ref is not None: mode = "lens-off reference"
        else: med = float(np.median(vals)); medv = float(np.median([x for x in lapv if x is not None]))
        soft = [x is not None and x < SHARP_T * med for x in sharp]
sf = [(a, b) for a, b in spans(soft) if b - a >= 2]
fl = spans([x > FLAT_T and i not in whip for i, x in enumerate(flat)])
st = spans(static)
xcu = []
if guard and os.path.exists(guard):
    rep = json.load(open(guard))
    xcu = [(g["from"], g["to"], g["detail"]) for g in rep.get("ranges", []) if g["rule"] == "XCU" and g.get("critical")]
fmt = lambda a, b: f"{a / fps:6.2f}-{(b + 1) / fps:6.2f} s  f{a}-{b}"
lines = [f"pixel check {os.path.basename(src)}: {n} frames at {W}x{H}",
         f"FLAT (one colour > {int(FLAT_T * 100)} % of the frame): {len(fl)} ranges"] + [f"  {fmt(a, b)}  max {max(flat[a:b + 1]) * 100:.0f} %" for a, b in fl] + \
        [f"STATIC (frame i vs i+{STATIC_N} differ < {STATIC_T} levels, i.e. > 2 s barely changing): {len(st)} ranges"] + [f"  {fmt(a, b)}" for a, b in st] + \
        [f"SHARP (subject's edge sharpness < {int(SHARP_T * 100)} % of the {mode} for 3+ held frames): {len(sf)} ranges"] + [f"  {fmt(a, b)}  min {min(x for x in sharp[a:b + 1] if x is not None) / med * 100:.0f} % of it (Laplacian variance {min(x for x in lapv[a:b + 1] if x is not None) / medv * 100:.0f} %)" for a, b in sf] + \
        [f"XCU bursts (extreme close-ups shorter than 8 frames, from the camera guard): {len(xcu)}"] + [f"  {fmt(a, b)}  {d}" for a, b, d in xcu]
ok = not fl and not st and not xcu and not sf
lines.insert(1, "PASS" if ok else "FAIL")
open(os.path.join(out, "pixel_report.txt"), "w").write("\n".join(lines) + "\n")
json.dump({"pass": ok, "frames": n, "flat": fl, "static": st, "xcu": xcu, "sharp": sf, "flat_frac": [round(x, 3) for x in flat], "d60": [round(x, 2) for x in d60]}, open(os.path.join(out, "pixel_report.json"), "w"))
print("\n".join(lines))
sys.exit(0 if ok else 1)
