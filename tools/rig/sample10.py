"""10-second toon3d animation sample: Mom walks in (side view), turns to camera and waves; kid runs in, stops, turns, waves.
usage: python3 sample10.py  -> /home/claude/out/toon3d_sample10.mp4"""
import sys, math, os, subprocess
from concurrent.futures import ProcessPoolExecutor
sys.path.insert(0, '/home/claude/claude-teacher-/tools/rig')
from toon3d import Char, build

W, H, FPS, DUR = 1280, 720, 24, 10.0
FR = '/home/claude/out/s10/'; os.makedirs(FR, exist_ok=True)
PX = 92; GROUND = 640

def ease(t): t = max(0, min(1, t)); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t
def seg(t, a, b): return ease((t - a) / (b - a))

def walk_pose(ph, amp=24, arm=22):
    s = math.sin(ph); c = math.cos(ph)
    # thigh swings ±amp; the knee bends while that leg swings forward (shin trails), stays straight on stance
    def leg(sg):
        th = amp * sg * s; sw = max(0, sg * c)   # swing phase
        return (th, 2), (th - 10 - 45 * sw, 0)
    lt, ls = leg(1); rt, rs = leg(-1)
    return dict(l_thigh=lt, l_shin=ls, r_thigh=rt, r_shin=rs,
                l_upper=(-arm * s, 8), l_fore=(-arm * s + 18, 6), r_upper=(arm * s, 8), r_fore=(arm * s + 18, 6))

def run_pose(ph):
    s = math.sin(ph); c = math.cos(ph)
    def leg(sg):
        th = 45 * sg * s; sw = max(0, sg * c)
        return (th + 8, 2), (th - 20 - 80 * sw, 0)
    lt, ls = leg(1); rt, rs = leg(-1)
    return dict(spine_pitch=10, l_thigh=lt, l_shin=ls, r_thigh=rt, r_shin=rs,
                l_upper=(-50 * s, 10), l_fore=(-50 * s + 80, 6), r_upper=(50 * s, 10), r_fore=(50 * s + 80, 6), mouth='open')

def mix(a, b, t):
    out = dict(a)
    for k, v in b.items():
        if k in a and isinstance(v, tuple): out[k] = tuple(lerp(x, y, t) for x, y in zip(a[k], v))
        elif k in a and isinstance(v, (int, float)) and not isinstance(v, bool): out[k] = lerp(a[k], v, t)
        else: out[k] = v if t > .5 else a.get(k, v)
    return out

REST = dict(l_thigh=(0, 2), l_shin=(0, 1), r_thigh=(0, 2), r_shin=(0, 1), l_upper=(0, 7), l_fore=(0, 3), r_upper=(0, 7), r_fore=(0, 3), spine_pitch=0)

def mom_at(t):
    # 0-4.2s walk in from the left (side view), 4.2-5.2 stop + turn to 3/4, 5.4-8.5 wave, then smile
    x0, x1 = 120, 470; walk_end = 4.2
    if t < walk_end:
        x = lerp(x0, x1, t / walk_end); ph = 2 * math.pi * t / 1.4
        p = dict(walk_pose(ph), yaw=90, mouth='smile', eyes='open')
    else:
        x = x1; k = seg(t, walk_end, walk_end + .5)
        p = mix(dict(walk_pose(2 * math.pi * walk_end / 1.4), yaw=90), dict(REST, yaw=90), k)
        p['yaw'] = lerp(90, 25, seg(t, walk_end + .2, walk_end + 1.0)); p['mouth'] = 'smile'
        if t > 5.4:
            w = seg(t, 5.4, 5.8) * (1 - seg(t, 8.2, 8.6)); wig = math.sin((t - 5.4) * 2 * math.pi * 1.6)
            p = mix(p, dict(r_upper=(0, 135), r_fore=(0, 160 + 22 * wig), mouth='open', eyes='happy', brows='raised'), w)
    return x, p

def kid_at(t):
    # 2.4-5.6s run in from the right, 5.6-6.4 stop/turn, 6.6+ wave with both arms, small hop
    x0, x1 = W + 120, 830
    if t < 2.4: return None
    if t < 5.6:
        x = lerp(x0, x1, (t - 2.4) / 3.2); ph = 2 * math.pi * (t - 2.4) / .62
        return x, dict(run_pose(ph), yaw=-90, eyes='open')
    x = x1; k = seg(t, 5.6, 6.0); p = mix(dict(run_pose(2 * math.pi * 3.2 / .62), yaw=-90), dict(REST, yaw=-90), k)
    p['yaw'] = lerp(-90, -20, seg(t, 5.8, 6.5)); p['mouth'] = 'smile'
    if t > 6.6:
        w = seg(t, 6.6, 6.9); wig = math.sin((t - 6.6) * 2 * math.pi * 2)
        p = mix(p, dict(l_upper=(0, 140), l_fore=(0, 160 + 20 * wig), r_upper=(0, 140), r_fore=(0, 160 - 20 * wig), mouth='laugh', eyes='happy'), w)
        p['hop'] = abs(math.sin((t - 6.6) * math.pi * 2)) * 18 * w
    return x, p

def blink(t, off): return ((t + off) % 3.3) < .12

BG = f'''<rect width="{W}" height="{H}" fill="#f3e3c8"/>
<rect y="{GROUND - 250}" width="{W}" height="18" fill="#e2c9a2"/>
<rect x="160" y="120" width="260" height="190" rx="10" fill="#bfe0ef" stroke="#000" stroke-width="3"/>
<rect x="160" y="208" width="260" height="10" fill="#fff8" /><rect x="285" y="120" width="10" height="190" fill="#fff8"/>
<rect x="880" y="150" width="150" height="110" rx="6" fill="#e9b872" stroke="#000" stroke-width="3"/><circle cx="955" cy="205" r="30" fill="#f6d27a"/>
<rect y="{GROUND}" width="{W}" height="{H - GROUND}" fill="#c99a6b"/>
<rect y="{GROUND}" width="{W}" height="6" fill="#000" fill-opacity=".15"/>'''

mom = Char('adult_f', skin=4, hair_color=1, hair='long', top='#ec4899', bottom='#2a3550')
kid = Char('child', skin=3, hair_color=3, hair='spiky', top='#f59e0b', bottom='#1e40af', sleeves='short')

def char_svg(ch, x, p, t, off):
    p = dict(p); hop = p.pop('hop', 0)
    if blink(t, off) and p.get('eyes') == 'open': p['eyes'] = 'closed'
    r = build(ch, p, px=PX, origin=(x, 0))
    dy = GROUND - (ch.a['H'] * PX) - hop
    shadow = f'<ellipse cx="{x:.1f}" cy="{GROUND + 4}" rx="{PX * .7 * (1 - hop / 80):.1f}" ry="{PX * .12:.1f}" fill="#000" fill-opacity=".18"/>'
    return shadow + f'<g transform="translate(0 {dy:.1f})">{r["svg"]}</g>'

def frame(i):
    t = i / FPS
    zoom = lerp(1.0, 1.08, ease(t / DUR)); cx, cy = W / 2, H * .6
    body = BG
    mx, mp = mom_at(t); body += char_svg(mom, mx, mp, t, 0)
    k = kid_at(t)
    if k: body += char_svg(kid, k[0], k[1], t, 1.7)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="#f3e3c8"/><g transform="translate({cx} {cy}) scale({zoom:.4f}) translate({-cx} {-cy})">{body}</g></svg>'
    fn = f'{FR}{i:04d}.svg'; open(fn, 'w').write(svg)
    subprocess.run(['rsvg-convert', '-o', fn.replace('.svg', '.png'), fn], check=True); os.remove(fn)
    return i

if __name__ == '__main__':
    n = int(DUR * FPS)
    with ProcessPoolExecutor(2) as ex: list(ex.map(frame, range(n), chunksize=8))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{FR}%04d.png', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '/home/claude/out/toon3d_sample10.mp4'], check=True)
    print('done')
