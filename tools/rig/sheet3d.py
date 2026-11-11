"""Renders a sample sheet of toon3d characters at many angles/poses and scores each one.
usage: python3 sheet3d.py <round_name>"""
import sys, json, subprocess, math
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, '/home/claude/claude-teacher-/tools/rig')
from toon3d import Char, build

OUT = '/home/claude/claude-teacher-/engine/art/rig3d/'
import os; os.makedirs(OUT, exist_ok=True)
rnd = sys.argv[1] if len(sys.argv) > 1 else 'r1'

mom = lambda: Char('adult_f', skin=4, hair_color=1, hair='long', top='#ec4899', bottom='#2a3550', skirt=False)
dad = lambda: Char('adult_m', skin=2, hair_color=0, hair='short', top='#3b82f6', bottom='#374151', beard=True)
kid = lambda: Char('child', skin=3, hair_color=3, hair='spiky', top='#f59e0b', bottom='#1e40af', sleeves='short')
baby = lambda: Char('baby', skin=4, hair_color=4, hair='bald', top='#a7f3d0', bottom='#a7f3d0')
gran = lambda: Char('elder_f', skin=1, hair_color=5, hair='bun', top='#7c3aed', bottom='#4b5563', skirt=True, glasses=True)
driver = lambda: Char('adult_m', skin=0, hair_color=0, hair='short', top='#1f6f5c', bottom='#2b2b2b', cap='#1f6f5c')

WALK = dict(l_thigh=(25, 2), l_shin=(-5, 0), r_thigh=(-20, 2), r_shin=(-35, 0), l_upper=(-25, 8), l_fore=(-10, 6), r_upper=(25, 8), r_fore=(45, 6))
SIT = dict(seated=True, l_thigh=(85, 4), l_shin=(-10, 0), r_thigh=(85, 4), r_shin=(-10, 0), l_upper=(30, 6), l_fore=(80, 4), r_upper=(30, 6), r_fore=(80, 4))
WAVE = dict(r_upper=(0, 130), r_fore=(0, 165), mouth='open', eyes='happy')
PHONE = dict(hold='phone', r_upper=(20, 8), r_fore=(120, -10), head_pitch=12, look=(0, 1), mouth='neutral' )

RUN = dict(spine_pitch=12, l_thigh=(55, 2), l_shin=(-20, 0), r_thigh=(-30, 2), r_shin=(-95, 0), l_upper=(-45, 8), l_fore=(30, 6), r_upper=(45, 8), r_fore=(110, 6), mouth='open')
SIT_FRONT = dict(SIT, l_thigh=(85, 10), r_thigh=(85, 10), l_shin=(-5, 2), r_shin=(-5, 2), l_upper=(15, 10), l_fore=(70, 0), r_upper=(15, 10), r_fore=(70, 0))
LIE_UP = dict(l_upper=(0, 40), l_fore=(0, 70), r_upper=(0, 40), r_fore=(0, 70), l_thigh=(0, 14), r_thigh=(0, 14), eyes='happy', mouth='open')
samples = [
  ('mom front', mom(), dict(yaw=0)), ('mom 3/4', mom(), dict(yaw=35)), ('mom side', mom(), dict(yaw=90)), ('mom back', mom(), dict(yaw=180)),
  ('dad walk 3/4', dad(), dict(WALK, yaw=40)), ('dad walk side', dad(), dict(WALK, yaw=-90)), ('kid wave', kid(), dict(WAVE, yaw=15)), ('kid sit 3/4', kid(), dict(SIT, yaw=45)),
  ('gran 3/4', gran(), dict(yaw=-30, mouth='smile')), ('driver sit side', driver(), dict(SIT, yaw=-90, l_upper=(55, 0), l_fore=(95, 0), r_upper=(55, 0), r_fore=(95, 0))),
  ('baby front', baby(), dict(yaw=10, mouth='open', eyes='happy')), ('mom phone 3/4', mom(), dict(PHONE, yaw=25)),
  ('kid run side', kid(), dict(RUN, yaw=90)), ('dad sit front', dad(), dict(SIT_FRONT, yaw=0)), ('dad back 3/4', dad(), dict(yaw=150)), ('gran side', gran(), dict(yaw=-90)),
  ('baby lying (top)', baby(), dict(LIE_UP, yaw=0, screen_rot=-90, lying=True)), ('mom lying side', mom(), dict(yaw=90, screen_rot=-90, lying=True, eyes='closed', mouth='smile')),
  ('kid walk front', kid(), dict(WALK, yaw=0)), ('driver 3/4 phone', driver(), dict(PHONE, yaw=-35)),
]
CELL_W, CELL_H, PX = 360, 520, 82
def score(img, meta, cell):
    al = img[..., 3] > 30
    lab, n = ndimage.label(al); sizes = ndimage.sum(al, lab, range(1, n + 1)); comps = int((np.array(sizes) > al.sum() * .003).sum())
    ys, xs = np.where(al)
    R = []
    R.append(('one silhouette', comps == 1, comps))
    R.append(('inside cell', xs.min() > 2 and xs.max() < CELL_W - 3 and ys.min() > 2 and ys.max() < CELL_H - 3, f'{xs.min()}-{xs.max()},{ys.min()}-{ys.max()}'))
    H_meas = (ys.max() - ys.min()) / PX
    if not meta['seated']:
        R.append(('height in heads', abs(H_meas / meta['H'] - 1) < .12, f"{H_meas:.2f}/{meta['H']}"))
        bottom_band = al[ys.max() - 14: ys.max() + 1]; fx = np.where(bottom_band.any(0))[0]; cx = xs.mean()
        R.append(('balanced (CoM over feet)', fx.min() - 6 <= cx <= fx.max() + 6, f'{cx:.0f} in {fx.min()}-{fx.max()}'))
    # joint seams: outline pixels on the limb centre-line next to a joint (artist rule: attached parts read as one shape)
    if meta.get('rot'): return R
    J = meta['J']; dark = (img[..., :3].max(-1) < 70) & (img[..., 3] > 200); seams = 0
    near = 'l' if meta['Jz']['l_sh'] >= meta['Jz']['r_sh'] else 'r'
    for a_, b_ in [('l_hip', 'l_kn'), ('r_hip', 'r_kn'), ('l_kn', 'l_an'), ('r_kn', 'r_an'), (near + '_sh', near + '_el')]:
        (x0, y0), (x1, y1) = J[a_], J[b_]
        for t in np.linspace(.05, .3, 6):
            x, y = int(x0 + (x1 - x0) * t), int(y0 + (y1 - y0) * t)
            if 0 <= y < img.shape[0] and 0 <= x < img.shape[1] and dark[max(0, y - 1):y + 2, max(0, x - 1):x + 2].any():
                L_ = math.hypot(x1 - x0, y1 - y0) or 1; ux, uy = (x1 - x0) / L_, (y1 - y0) / L_
                def dk(dx, dy):
                    xx, yy = int(round(x + dx)), int(round(y + dy)); return 0 <= yy < img.shape[0] and 0 <= xx < img.shape[1] and dark[yy, xx]
                along = dk(ux * 5, uy * 5) and dk(-ux * 5, -uy * 5)      # a line parallel to the bone = edge of an overlapping limb, not a seam
                if not along: seams += 1
    R.append(('no joint seams', seams <= 1, seams))
    return R

cells, results = [], {}
for i, (name, ch, pose) in enumerate(samples):
    r = build(ch, pose, px=PX, origin=(CELL_W / 2, 0))
    J = r['joints']; ys = [p[1] for p in J.values()]
    head_top = J['head'][1] - .55 * PX; dy = 20 - head_top
    if pose.get('seated'):
        st = r['seat']; x0 = st['x0']; x1 = st['x1']
        if st['back'] is not None: x0, x1 = min(x0, st['back'] - 20), max(x1, st['back'] + 20)
        seat = f'<rect x="{x0:.1f}" y="{st["top"]:.1f}" width="{x1 - x0:.1f}" height="{.75 * PX:.1f}" rx="10" fill="#8b5e3c" stroke="#000" stroke-width="2"/>'
    else: seat = ''
    rot = pose.get('screen_rot', 0); tr = f'translate(0 {dy:.1f})'
    if rot:   # lying: same figure turned on screen; centred in the cell
        ys_ = [p[1] for p in J.values()]; cy_ = (min(ys_) - .55 * PX + max(ys_)) / 2
        tr = f'translate({CELL_W / 2:.1f} {CELL_H / 2:.1f}) rotate({rot}) scale({min(1, (CELL_W - 30) / ((max(ys_) - min(ys_) + .9 * PX))):.3f}) translate({-CELL_W / 2:.1f} {-cy_:.1f})'
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{CELL_W}" height="{CELL_H}" viewBox="0 0 {CELL_W} {CELL_H}"><g transform="{tr}">{seat}{r["svg"]}</g></svg>'
    fn = f'{OUT}{rnd}_{i:02d}.svg'; open(fn, 'w').write(svg)
    # transparent render without the seat for scoring
    open(fn.replace('.svg', '_ns.svg'), 'w').write(svg.replace(seat, ''))
    cells.append((name, fn, dict(H=ch.a['H'], seated=bool(pose.get('seated')) or bool(pose.get('screen_rot')), rot=pose.get('screen_rot', 0), J={k: (v[0], v[1] + dy) for k, v in J.items()}, Jz=r['Jz'])))

def shot(svg_path):
    png = svg_path.replace('.svg', '.png')
    subprocess.run(['timeout', '60', 'google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', f'--window-size={CELL_W},{CELL_H}', f'--screenshot={png}', f'file://{svg_path}'], capture_output=True)
    return np.array(Image.open(png).convert('RGBA'))

cols = 4; rows = math.ceil(len(cells) / cols)
sheet = Image.new('RGB', (cols * CELL_W, rows * (CELL_H + 40)), '#f4efe6')
from PIL import ImageDraw, ImageFont
dr = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
except Exception: font = None
tot_ok = tot = 0
for i, (name, fn, meta) in enumerate(cells):
    img = shot(fn); ns = shot(fn.replace('.svg', '_ns.svg'))
    R = score(ns, meta, i) if True else None; ok = sum(r[1] for r in R); tot_ok += ok; tot += len(R)
    results[name] = dict(score=f'{ok}/{len(R)}', checks=[dict(check=c, ok=bool(o), measured=str(m)) for c, o, m in R])
    x, y = (i % cols) * CELL_W, (i // cols) * (CELL_H + 40)
    sheet.paste(Image.fromarray(img), (x, y + 40), Image.fromarray(img))
    fails = ', '.join(c for c, o, m in R if not o)
    dr.text((x + 8, y + 4), f'{name}  {ok}/{len(R)}', fill='#111', font=font)
    if fails: dr.text((x + 8, y + 22), 'x ' + fails, fill='#b91c1c', font=font)
sheet.save(f'{OUT}sheet_{rnd}.png')
json.dump(results, open(f'{OUT}scores_{rnd}.json', 'w'), indent=1)
print(f'TOTAL {tot_ok}/{tot}')
for n, r in results.items(): print(n, r['score'], [c['check'] + ':' + c['measured'] for c in r['checks'] if not c['ok']])
