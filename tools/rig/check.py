"""Scores rig renders against RULES. Every check is pass/fail with the measured number."""
import json, pickle, subprocess, sys, math
import numpy as np; from PIL import Image, ImageDraw
from rig import RULES, U, HEAD_TOP, STROKE
D = '/home/claude/claude-teacher-/engine/art/rig/'
F = pickle.load(open(D + 'parts.pkl', 'rb'))
def render(name, w, h):
    subprocess.run(['timeout', '60', 'google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', f'--window-size={w},{h}', f'--screenshot={D}{name}.png', f'file://{D}{name}.svg'], capture_output=True)
    return np.array(Image.open(D + name + '.png').convert('RGBA'))
def mask(pts, w, h):
    im = Image.new('1', (w, h), 0); ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=1); return np.array(im)
def components(al):
    from scipy import ndimage
    lab, n = ndimage.label(al); sizes = ndimage.sum(al, lab, range(1, n + 1)); return int((np.array(sizes) > al.sum() * .002).sum())
res = {}
for name, f in F.items():
    w, h = f['w'], f['h']; img = render(name, w, h); al = img[..., 3] > 20; R = []
    ok = lambda label, cond, val, rule, src: R.append(dict(check=label, ok=bool(cond), measured=val, rule=rule, source=src))
    ok('one connected silhouette (no floating parts)', components(al) == 1, components(al), '== 1', 'S: rubric (silhouette/merges)')
    for k, v in f['ratios'].items():
        tgt = RULES['upper_to_forearm'] if k == 'upper/fore' else RULES['thigh_to_shin']; ok(f'{k} ratio', abs(v / tgt - 1) <= .15, round(v, 2), f'{tgt} ±15%', 'S: de Leva / SAE J826')
    if f['kind'] == 'stand':
        ys = np.where(al.any(1))[0]; fig_bottom = f['ground']
        Hm = (fig_bottom - HEAD_TOP) / U; ok('height in heads', abs(Hm / f['H'] - 1) <= .10, round(Hm, 2), f"{f['H']} ±10%", 'S: cartoon adult 5–6 heads')
        feet = [p for n, p in f['parts'] if n == 'foot']; lowest = max(y for p in feet for _, y in p)
        ok('feet touch the ground', abs(lowest - f['ground']) <= 2 * STROKE, round(lowest - f['ground'], 1), f'±{2 * STROKE}px', 'S: grounding rule')
        xs = np.where(al)[1]; cxm = xs.mean(); fx = [x for p in feet for x, _ in p]
        ok('centre of mass over the feet', min(fx) <= cxm <= max(fx), round(cxm, 1), f'{min(fx):.0f}–{max(fx):.0f}', 'S: balance rule')
    else:
        J = f['joints']; S = {'hip': (95, 120), 'knee': (95, 135), 'elbow': (80, 120), 'upper_arm_fwd': (10, 45)}
        for k, (a, b) in S.items(): ok(f'{k} angle', a <= J[k] <= b, round(J[k], 1), f'{a}–{b}°', 'S: Rebiffe / Grandjean seated comfort')
        pel = dict(f['parts'])['pelvis']; low = max(y for _, y in pel)
        ok('hips rest on the seat', 0 <= low - f['seat_top'] <= .08 * U, round(low - f['seat_top'], 1), f'0–{.08 * U:.0f}px sink', 'E: sink 2–6%')
        hand, (_, ex, ey, rx, ry, rot) = f['grip']; hm = mask(hand, w, h)
        th = np.linspace(0, 2 * math.pi, 400); c, s_ = math.cos(math.radians(rot)), math.sin(math.radians(rot))
        rim = Image.new('1', (w, h), 0); dr = ImageDraw.Draw(rim)
        pts = [(ex + (rx * math.cos(t)) * c - (ry * math.sin(t)) * s_, ey + (rx * math.cos(t)) * s_ + (ry * math.sin(t)) * c) for t in th]; dr.line(pts + [pts[0]], fill=1, width=30)
        ov = (hm & np.array(rim)).sum(); ok('hand grips the wheel (overlap)', ov > .15 * hm.sum(), int(ov), '> 15% of hand area', 'S: grip order rule')
    # every limb overlaps its neighbour (no gaps at joints)
    P = f['parts']; chain = [('upper', 'fore'), ('fore', 'hand'), ('thigh', 'shin')]
    for a, b in chain:
        A = [p for n, p in P if n == a]; B = [p for n, p in P if n == b]
        good = all((mask(x, w, h) & mask(y, w, h)).sum() > 200 for x, y in zip(A, B)); ok(f'{a}→{b} joined', good, '', 'overlap > 200px²', 'S: no floating limbs')
    res[name] = dict(score=f"{sum(r['ok'] for r in R)}/{len(R)}", checks=R)
json.dump(res, open(D + 'scores.json', 'w'), indent=1)
for n, r in res.items():
    print(n, r['score']); [print('  ', '✔' if c['ok'] else '✘', c['check'], c['measured'], c['rule']) for c in r['checks']]
