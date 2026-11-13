"""HD-2D pixel engine: layer placement with parallax/DOF, light shafts, bloom, grade, eyelids, dust, text, tags, portraits."""
import math, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from hd2d_pov import text_img, G, sprite_layer as _sprite_layer, dither_grad, shade_rect

OW, OH, PS = 1280, 720, 5
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
_fonts = {}
def font(sz):
    if sz not in _fonts: _fonts[sz] = ImageFont.truetype(FONT, sz)
    return _fonts[sz]
def clamp(x, a=0., b=1.): return max(a, min(b, x))
def seg(t, a, b): return clamp((t - a) / (b - a)) if b != a else float(t >= a)
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def lerp(a, b, t): return a + (b - a) * t
def pulse(t, a, b, fade=.3): return ease(seg(t, a, a + fade)) * (1 - ease(seg(t, b - fade, b)))

# extra glyphs for tags
G.update({'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'], 'I': ['111', '010', '010', '010', '010', '010', '111'],
          'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'], '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100']})

def arr(im): return np.asarray(im.convert('RGBA'), dtype=np.float32) / 255.
_arr_cache = {}
def place(layer_img, cam, depth=1.0, focus=1.0, dof=6.0, key=None):
    cx, cy, z = cam; s = PS * z * depth
    M = np.float32([[s, 0, OW / 2 - cx * s], [0, s, OH / 2 - cy * s]])
    if key is not None and key in _arr_cache: a = _arr_cache[key]
    else:
        a = arr(layer_img); a[..., :3] *= a[..., 3:4]
        if key is not None: _arr_cache[key] = a
    o = cv2.warpAffine(a, M, (OW, OH), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    sig = abs(depth - focus) * dof * z
    if sig > .4:
        sm = cv2.resize(o, (OW // 4, OH // 4), interpolation=cv2.INTER_AREA); sm = cv2.GaussianBlur(sm, (0, 0), sig / 4)
        o = cv2.resize(sm, (OW, OH), interpolation=cv2.INTER_LINEAR)
    return o
def over(dst, src): return src + dst * (1 - src[..., 3:4])
def blank(): return np.zeros((OH, OW, 4), np.float32)

def sprite(spr, anim, row, col, wx, wy, W, H, scale=2, rim=(1, .9, .7), rim_dir=1):
    return _sprite_layer(spr, anim, row, col, wx, wy, W=W, H=H, rim=rim, rim_dir=rim_dir, scale=scale)

def shafts(t, src, angle, length, width, col=(1, .86, .6), strength=.3):
    w, h = OW // 4, OH // 4; m = np.zeros((h, w), np.float32); sx, sy = src[0] / 4, src[1] / 4
    for k in range(4):
        off = (k - 1.5) * width / 4 * .5; a = math.radians(angle + k * 2.5); dx, dy = math.cos(a), math.sin(a); nx, ny = -dy, dx; L = length / 4; wd = width / 4
        p = np.array([[sx + nx * (off - wd * .2), sy + ny * (off - wd * .2)], [sx + nx * (off + wd * .2), sy + ny * (off + wd * .2)],
                      [sx + nx * (off + wd * .55) + dx * L, sy + ny * (off + wd * .55) + dy * L], [sx + nx * (off - wd * .55) + dx * L, sy + ny * (off - wd * .55) + dy * L]], np.int32)
        cv2.fillConvexPoly(m, p, .35 + .25 * math.sin(t * .7 + k * 1.7))
    m = cv2.GaussianBlur(m, (0, 0), 7) * strength
    return cv2.resize(m, (OW, OH))[..., None] * np.array(col, np.float32)

_rng = np.random.default_rng(3); DUST = _rng.random((50, 4))
def dust(rgb, t, col=(1, .93, .75), n=50, amt=1.0):
    for (u, v, sp, ph) in DUST[:n]:
        x = (u * OW + t * 30 * (sp - .5)) % OW; y = (v * OH + math.sin(t * .6 + ph * 6) * 40 + t * 18 * sp) % OH
        a = (.15 + .25 * (.5 + .5 * math.sin(t * 2 + ph * 9))) * amt
        cv2.circle(rgb, (int(x), int(y)), 2 + int(sp * 3), tuple(c * a for c in col), -1, cv2.LINE_AA)
    return rgb

_yy, _xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
_R = np.sqrt(((_xx - OW / 2) / (OW / 2)) ** 2 + ((_yy - OH / 2) / (OH / 2)) ** 2)
_VIG = (np.clip(_R - .55, 0, 1) ** 1.6)[..., None]
_GRAIN = [(_rng.standard_normal((OH // 2, OW // 2, 1)).astype(np.float32) * .012) for _ in range(6)]
def post(rgb, t=0, bloom=.45, grade=(1.04, 1.0, .94), vign=.55, lids=0., blur=0., sat=1.0, night=False):
    sm = cv2.resize(np.clip(rgb - .72, 0, 1), (OW // 4, OH // 4), interpolation=cv2.INTER_AREA)
    b = cv2.GaussianBlur(sm, (0, 0), 3.5) + cv2.GaussianBlur(sm, (0, 0), 10)
    rgb = rgb + cv2.resize(b, (OW, OH)) * bloom
    if sat != 1.0: g = rgb.mean(-1, keepdims=True); rgb = g + (rgb - g) * sat
    rgb = rgb * np.array(grade, np.float32); rgb = (rgb - .5) * 1.06 + .5
    rgb = rgb * (1 - vign * _VIG)
    if blur > .3: rgb = cv2.GaussianBlur(rgb, (0, 0), blur)
    if lids > 0:
        h = lids * OH * .52; m = np.zeros((OH // 4, OW // 4), np.float32)
        cv2.ellipse(m, (OW // 8, int((-OH * .6 + h) / 4)), (int(OW * .9 / 4), int(OH * .62 / 4)), 0, 0, 360, 1, -1)
        cv2.ellipse(m, (OW // 8, int((OH * 1.6 - h) / 4)), (int(OW * .9 / 4), int(OH * .62 / 4)), 0, 0, 360, 1, -1)
        m = cv2.resize(cv2.GaussianBlur(m, (0, 0), 7), (OW, OH))[..., None]; rgb = rgb * (1 - m) + np.array([.05, .03, .03]) * m
    gr = cv2.resize(_GRAIN[int(t * 24) % 6], (OW, OH), interpolation=cv2.INTER_NEAREST)[..., None]
    return np.clip(rgb + gr, 0, 1)

def tag(lines, wx, wy, W, H, a=1.0, col=(140, 245, 255), plate=(8, 20, 34, 170), edge=(120, 230, 255, 200)):
    im = Image.new('RGBA', (W, H)); ws = [text_img(s, col) for s in lines]; mw = max(t.size[0] for t in ws); y = wy
    ImageDraw.Draw(im).rounded_rectangle((int(wx - mw / 2) - 2, int(wy) - 1, int(wx + mw / 2) + 2, int(wy) + 10 * len(lines) + 2), 3, fill=plate, outline=edge)
    for t in ws: im.alpha_composite(t, (int(wx - t.size[0] / 2), int(y))); y += 10
    if a < 1: im.putalpha(Image.fromarray((np.asarray(im)[..., 3] * a).astype(np.uint8)))
    return im

def ptext(d, xy, s, sz=9, fill=(240, 240, 230), anchor='la', shadow=(20, 24, 22)):
    d.fontmode = '1'
    if shadow: d.text((xy[0] + 1, xy[1] + 1), s, font=font(sz), fill=shadow, anchor=anchor)
    d.text(xy, s, font=font(sz), fill=fill, anchor=anchor)

PORT = '/home/claude/claude-teacher-/engine/art/pxportrait/'
_pc = {}
def portrait(who, mood):
    k = (who, mood)
    if k not in _pc: _pc[k] = Image.open(f'{PORT}{who}_{mood}.png').convert('RGBA')
    return _pc[k]
