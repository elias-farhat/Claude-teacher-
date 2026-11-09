"""4 x 4 contact sheet of the camera guard's worst frames, each labelled with its time and failing rules.
usage: python guard-sheet.py <stills dir with notes.json> <out.jpg>"""
import json, os, sys, textwrap
from PIL import Image, ImageDraw, ImageFont
d, out = sys.argv[1], sys.argv[2]
notes = json.load(open(os.path.join(d, "notes.json")))
W, H = 324, 576
font = ImageFont.load_default()
try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
except OSError: pass
S = Image.new("RGB", (W * 4, (H + 70) * 4), (20, 20, 24))
for i, n in enumerate(notes[:16]):
    p = os.path.join(d, f"still-{n['f']:05d}.jpg")
    x, y = (i % 4) * W, (i // 4) * (H + 70)
    if os.path.exists(p): S.paste(Image.open(p).convert("RGB").resize((W, H)), (x, y))
    g = ImageDraw.Draw(S)
    g.text((x + 4, y + H + 2), f"{n['f'] / 30:.2f} s  (f{n['f']})", fill=(255, 220, 120), font=font)
    lines = [l for q in n["lines"][:3] for l in textwrap.wrap(q, 44)][:4]
    for k, l in enumerate(lines): g.text((x + 4, y + H + 18 + k * 13), l, fill=(240, 240, 240), font=font)
S.save(out, quality=85)
print("wrote", out)
