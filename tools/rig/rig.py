"""Skeleton rig for ToonHead-style bodies. Every proportion comes from RULES (sourced or marked estimate).
Units: avatar canvas px (768 canvas, head height u = 452 px, head top y = 139.5, chin y = 591.5)."""
import json, math, re, sys
sys.path[:0] = ['/home/claude/libs/py', '/home/claude/libs/dicebear/src/python/core/src']
from dicebear import Avatar, Style
ST = Style(json.load(open('/home/claude/libs/dstyles/src/toon-head.json')))
U, HEAD_TOP, CHIN = 452.0, 139.5, 591.5
STROKE, SHADOW = 2.6, 'fill="#000" fill-opacity=".2"'
CLOTHES_BOTTOM_Y, CLOTHES_X0, CLOTHES_X1 = 892.2, 115.0, 668.0   # measured from toon-head clothes path (translate 107.3,587.5; h553 at y304.7)

RULES = {  # src: S = sourced, E = estimate
  'height_heads':      {'adult': 5.5, 'child': 4.0, 'baby': 2.5},           # S: average cartoon adult 5-6 heads; cartoon baby ~2.5
  'loomis_landmarks':  {'chest': 2, 'navel': 3, 'crotch': 4, 'knee': 6, 'sole': 8},  # S: Loomis 8-head; below-chin scaled by (H-1)/7 (E)
  'upper_to_forearm':  1.3,                                                   # S: de Leva 1996 (derived ratio)
  'thigh_to_shin':     1.03,                                                  # S: SAE J826 431.5/417.5 mm
  'wrist_at':          'crotch',                                              # S: Loomis (female wrist level with crotch)
  'hand_len_u':        0.36,                                                  # E: toon hand 0.3-0.5 head
  'waist_over_shoulder': {'f': .62, 'm': .78}, 'hip_over_shoulder': {'f': .92, 'm': .74},   # S-derived: Loomis f waist 1/2, hips 2/2; m hips 1.5/2.33 (softened, E)
  'limb_w_u':          {'upper': .23, 'fore': .19, 'thigh': .33, 'shin': .24, 'foot_len': .42},  # E
  'seat':              {'hip': 105, 'knee': 120, 'ankle': 100, 'recline': 18, 'upper_arm_fwd': 35, 'elbow': 100, 'sink': .04},  # S: Rebiffe/Grandjean ranges; recline between SAE 25 and Pheasant <10 (E); sink 2-6% (E)
}
def landmarks(H):
    k = (H - 1) / 7.0; L = RULES['loomis_landmarks']
    y = lambda heads: HEAD_TOP + U * (1 + (heads - 1) * k)
    return {n: y(v) for n, v in L.items()} | {'sole': HEAD_TOP + U * H}

def avatar_inner(opt):
    s = Avatar(ST, opt).to_string()
    s = re.sub(r'<rect width="768" height="768"', '<rect width="768" height="2000"', s)   # unclip so the shoulder dome + clothes show fully
    return re.sub(r'^<svg[^>]*>|</svg>$', '', s.strip())
def head_svg(opt, x=0, y=0, scale=1.0):
    return f'<g transform="translate({x} {y}) scale({scale})">{avatar_inner(opt)}</g>'

def capsule(p, q, w1, w2, n=10):
    (x1, y1), (x2, y2) = p, q; a = math.atan2(y2 - y1, x2 - x1); nx, ny = -math.sin(a), math.cos(a)
    pts = [(x1 + nx * w1 / 2, y1 + ny * w1 / 2), (x2 + nx * w2 / 2, y2 + ny * w2 / 2)]
    pts += [(x2 + w2 / 2 * math.cos(a + math.pi / 2 - math.pi * i / n), y2 + w2 / 2 * math.sin(a + math.pi / 2 - math.pi * i / n)) for i in range(1, n)]
    pts += [(x2 - nx * w2 / 2, y2 - ny * w2 / 2), (x1 - nx * w1 / 2, y1 - ny * w1 / 2)]
    pts += [(x1 + w1 / 2 * math.cos(a - math.pi / 2 - math.pi * i / n), y1 + w1 / 2 * math.sin(a - math.pi / 2 - math.pi * i / n)) for i in range(1, n)]
    return pts
def poly(pts, fill, shadow=False):
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
    return f'<path d="{d}" {SHADOW}/>' if shadow else f'<path d="{d}" fill="{fill}" stroke="#000" stroke-width="{STROKE}" stroke-linejoin="round"/>'
def at(p, ang_deg, length): a = math.radians(ang_deg); return (p[0] + math.sin(a) * length, p[1] + math.cos(a) * length)   # 0deg = straight down
