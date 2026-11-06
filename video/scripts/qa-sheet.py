#!/usr/bin/env python3
"""QA contact sheet + QA.md from render-stills.mjs output (a still every N frames with its [qa] probe).
usage: qa-sheet.py <dir with still-*.jpg + qa-*.json> <out sheet.jpg> <out QA.md> [frame-qa.json summary]
Flags: NOTHING = no character / key prop visible (in frame and not hidden by geometry); LOW = a face below 55 % of
the frame height (the captions sit at 70 %); XCU = a face taller than 26 % of the frame. Flight frames are listed
separately (travel between places is expected to show only the city)."""
import glob, json, os, sys
from PIL import Image, ImageDraw

d, sheet, md = sys.argv[1:4]
rows = []
for q in sorted(glob.glob(os.path.join(d, "qa-*.json"))):
    j = json.load(open(q))
    f = j.get("f")
    faces = [x for x in j.get("faces", []) if x["size"] > 0.04]
    flags = []
    if j.get("missing"): flags.append("NO-PROBE")
    elif not j.get("vis"): flags.append("NOTHING")
    if any(x["y"] > 0.55 for x in faces): flags.append("LOW")
    if any(x["size"] > 0.26 for x in faces): flags.append("XCU")
    rows.append((f, j, flags))
cols, tw, th = 8, 180, 320
S = Image.new("RGB", (cols * (tw + 6), ((len(rows) + cols - 1) // cols) * (th + 24)), "white")
dr = ImageDraw.Draw(S)
for k, (f, j, flags) in enumerate(rows):
    x, y = (k % cols) * (tw + 6), (k // cols) * (th + 24)
    p = os.path.join(d, f"still-{f:05d}.jpg")
    if os.path.exists(p): S.paste(Image.open(p).resize((tw, th)), (x, y))
    hard = [g for g in flags if g != "NOTHING" or not j.get("flight")]
    col = (220, 40, 40) if hard else (240, 160, 40) if flags else (60, 160, 80)
    dr.rectangle([x, y, x + tw - 1, y + th - 1], outline=col, width=4)
    dr.rectangle([x, y + th, x + tw, y + th + 22], fill=col)
    dr.text((x + 4, y + th + 5), f"{f / 30:5.1f}s f{f} " + (" ".join(flags) or "ok") + (" (flight)" if j.get("flight") else ""), fill="white")
S.save(sheet, quality=85)
hold = [(f, fl) for f, j, fl in rows if fl and not (fl == ["NOTHING"] and j.get("flight"))]
fly = [f for f, j, fl in rows if fl == ["NOTHING"] and j.get("flight")]
L = ["# QA stills", "", f"- {len(rows)} stills (one every {rows[1][0] - rows[0][0] if len(rows) > 1 else '?'} frames), each probed in the page: "
     "characters / key props that are in frame and not hidden by geometry, face positions and sizes",
     f"- **Flagged (not in a flight): {len(hold)}**" + ("" if hold else " ✅")]
L += [f"  - {f / 30:.1f} s (f{f}): {', '.join(fl)}" for f, fl in hold]
L += [f"- Flight frames showing only the city (travel between places, expected): {len(fly)}" + (f" — at {', '.join(f'{f / 30:.1f} s' for f in fly)}" if fly else "")]
if len(sys.argv) > 4 and os.path.exists(sys.argv[4]):
    r = json.load(open(sys.argv[4]))["report"]
    L += ["", "## Every frame, analytic (camera + cast replayed, no rendering)",
          f"- Camera cuts (one-frame discontinuities): **{r['cuts']}** · {r['cutFrames']}",
          f"- Faces below 55 %: {r['facesBelow55']}", f"- Extreme close-ups: {r['extremeCloseUps']}",
          f"- Nothing in frame (incl. flights): {r['nothingInFrame']}", f"- Largest camera step: {r['maxStep']}"]
open(md, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("\n".join(L))
