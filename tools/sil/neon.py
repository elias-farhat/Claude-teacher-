"""Neon pictogram style: dark background, glowing line-art people/props, glowing countdowns, big Arabic captions."""
import math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, SS = 1280, 720, 2          # supersample for clean lines
FONT = '/home/claude/claude-teacher-/engine/fonts/Tajawal-Bold.ttf'
_f = {}
def font(s):
    if s not in _f: _f[s] = ImageFont.truetype(FONT, s, layout_engine=ImageFont.Layout.RAQM)
    return _f[s]
CYAN, PINK, GOLD, WHITE, RED, GREEN = (90, 230, 255), (255, 90, 170), (255, 200, 90), (235, 240, 255), (255, 80, 80), (90, 255, 150)

def clamp(x, a=0., b=1.): return max(a, min(b, x))
def seg(t, a, b): return clamp((t - a) / (b - a)) if b != a else float(t >= a)
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def lerp(a, b, t): return a + (b - a) * t

_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_VIG = 1 - .65 * np.clip(np.sqrt(((_xx - W / 2) / (W / 2)) ** 2 + ((_yy - H / 2) / (H / 2)) ** 2) - .45, 0, 1) ** 1.5
def background(top=(10, 12, 30), bot=(28, 16, 48), t=0, stars=True):
    g = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    img = np.array(top, np.float32) + (np.array(bot, np.float32) - np.array(top, np.float32)) * g
    img = np.repeat(img, W, 1)
    if stars:
        rng = np.random.default_rng(5); pts = rng.random((90, 3))
        for x, y, p in pts:
            a = .3 + .3 * math.sin(t * 1.5 + p * 20); cv2.circle(img, (int(x * W), int(y * H * .7)), 1, (200 * a, 210 * a, 255 * a), -1, cv2.LINE_AA)
    return img

class Canvas:
    """line layer at SS resolution; everything drawn here glows"""
    def __init__(self): self.c = np.zeros((H * SS, W * SS, 3), np.float32)
    def P(self, p): return (int(p[0] * SS), int(p[1] * SS))
    def line(self, a, b, col, w=6): cv2.line(self.c, self.P(a), self.P(b), col, int(w * SS), cv2.LINE_AA)
    def poly(self, pts, col, w=6, closed=False, fill=None):
        arr = np.array([self.P(p) for p in pts], np.int32)
        if fill is not None: cv2.fillPoly(self.c, [arr], fill, cv2.LINE_AA)
        cv2.polylines(self.c, [arr], closed, col, int(w * SS), cv2.LINE_AA)
    def circle(self, c, r, col, w=6, fill=None):
        if fill is not None: cv2.circle(self.c, self.P(c), int(r * SS), fill, -1, cv2.LINE_AA)
        cv2.circle(self.c, self.P(c), int(r * SS), col, int(w * SS) if w > 0 else -1, cv2.LINE_AA)
    def rect(self, x0, y0, x1, y1, col, w=6, r=0, fill=None):
        if r:
            pts = []
            for cx, cy, a0 in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
                for k in range(7): a = math.radians(a0 + k * 15); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
            self.poly(pts, col, w, True, fill)
        else: self.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], col, w, True, fill)
    def out(self): return cv2.resize(self.c, (W, H), interpolation=cv2.INTER_AREA)

def glow_comp(base, layer, strength=1.0):
    sm = cv2.resize(layer, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    g = cv2.resize(cv2.GaussianBlur(sm, (0, 0), 4) * 1.6 + cv2.GaussianBlur(sm, (0, 0), 12) * 1.2, (W, H))
    return base + g * strength * .55 + layer

# ---------------- pictogram person ----------------
def person(cv, x, feet, h, col, pose='stand', t=0, face=1, phase=0.0, arm=None, lean=0.0, hair=None):
    """h = total height px. face: +1 facing right, -1 left, 0 front. pose: stand | walk | run | sit | wave | hug | grab | cross"""
    u = h / 7.0; w = u * 0.95
    head_r = u * .95
    hip = (x, feet - u * 3.1); sh_y = feet - u * 5.2
    if pose == 'sit': hip = (x, feet - u * 2.0); sh_y = hip[1] - u * 2.1
    if pose == 'lie': pass
    neck = (x + lean * u * 2, sh_y); head = (neck[0] + lean * u * .6, sh_y - head_r * 1.25)
    lw = max(4, u * .55)
    cv.circle(head, head_r, col, lw * .8)
    if hair == 'long': cv.poly([(head[0] - head_r * 1.05, head[1]), (head[0] - head_r * 1.15, head[1] + head_r * 1.6)], col, lw * .6); cv.poly([(head[0] + head_r * 1.05, head[1]), (head[0] + head_r * 1.15, head[1] + head_r * 1.6)], col, lw * .6)
    if hair == 'bun': cv.circle((head[0] - face * head_r * .6, head[1] - head_r * .95), head_r * .35, col, lw * .6)
    if hair == 'cap': cv.line((head[0] - head_r, head[1] - head_r * .35), (head[0] + head_r * (1 + .9 * face if face else 1), head[1] - head_r * .35), col, lw * .7)
    cv.line(neck, hip, col, lw * 1.25)
    # arms
    def limb(a, ang1, ang2, l1, l2, wdt):
        b = (a[0] + math.sin(math.radians(ang1)) * l1, a[1] + math.cos(math.radians(ang1)) * l1)
        c = (b[0] + math.sin(math.radians(ang2)) * l2, b[1] + math.cos(math.radians(ang2)) * l2)
        cv.poly([a, b, c], col, wdt); return c
    s = math.sin(t * 2 * math.pi * (1.6 if pose == 'walk' else 2.6) + phase)
    shp = (neck[0], neck[1] + u * .35)
    if pose in ('walk', 'run'):
        amp = 28 if pose == 'walk' else 50
        A = [(amp * s * face, amp * s * face + (20 if pose == 'run' else 8) * face), (-amp * s * face, -amp * s * face + (20 if pose == 'run' else 8) * face)]
        Lg = [(30 * s * face if pose == 'walk' else 45 * s * face, (30 * s if pose == 'walk' else 45 * s) * face - max(0, -s) * 40 * face), (-30 * s * face if pose == 'walk' else -45 * s * face, -(30 * s if pose == 'walk' else 45 * s) * face - max(0, s) * 40 * face)]
    elif pose == 'sit':
        A = [(15 * face, 70 * face), (10 * face, 60 * face)]; Lg = [(90 * face, 0), (85 * face, 0)]
    elif pose == 'wave':
        A = [(8, 4), (170 * (face or 1), 150 * (face or 1) + 25 * math.sin(t * 9))]; Lg = [(6, 3), (-6, -3)]
    elif pose == 'hug':
        A = [(60 * face, 120 * face), (55 * face, 115 * face)]; Lg = [(4, 2), (-4, -2)]
    elif pose == 'grab':
        A = [(80 * face, 85 * face), (10, 5)]; Lg = [(6, 3), (-6, -3)]
    elif pose == 'phone':
        A = [(20 * face, 150 * face), (5, 3)]; Lg = [(5, 2), (-5, -2)]
    else:
        A = [(18, 8), (-18, -8)] if face == 0 else [(12 * face, 6 * face), (-6 * face, 2 * face)]; Lg = [(7, 3), (-7, -3)]
    if arm: A = arm
    for (a1, a2) in A: limb(shp, a1, a2, u * 1.35, u * 1.25, lw)
    for (l1, l2) in Lg: limb(hip, l1, l2, u * 1.55, u * 1.55, lw * 1.1)
    return head, head_r

# ---------------- text ----------------
def text_layer(items):
    """items: (str, (x,y), size, color, alpha, glow) -> (sharp RGBA np, glow np)"""
    im = Image.new('RGBA', (W, H)); gl = Image.new('RGBA', (W, H))
    for s, xy, size, col, a, glow in items:
        if a <= 0: continue
        tgt = gl if glow else None
        d = ImageDraw.Draw(im)
        kw = dict(font=font(size), anchor='mm', direction='rtl', language='ar')
        if glow:
            ImageDraw.Draw(gl).text(xy, s, fill=tuple(col) + (int(255 * a),), **kw)
            d.text(xy, s, fill=tuple(col) + (int(255 * a),), **kw)
        else:
            d.text(xy, s, fill=tuple(col) + (int(255 * a),), stroke_width=max(2, size // 9), stroke_fill=(0, 0, 0, int(230 * a)), **kw)
    return np.asarray(im, np.float32) / 255., np.asarray(gl, np.float32) / 255.

def finish(base, lines, texts, t=0, shake=0, zoom=1.0, flash=0.0, desat=0.0):
    img = glow_comp(base, lines)
    fixed = [x for x in texts if x[1][1] > H - 90]; texts = [x for x in texts if x[1][1] <= H - 90]
    sharp, gl = text_layer(texts)
    if gl[..., 3].any():
        g = gl[..., :3] * gl[..., 3:4]; sm = cv2.resize(g, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
        img = img + cv2.resize(cv2.GaussianBlur(sm, (0, 0), 4) * 2.2 + cv2.GaussianBlur(sm, (0, 0), 10) * 1.4, (W, H)) * 255 * .5
    img = img * (1 - sharp[..., 3:4]) + sharp[..., :3] * 255 * sharp[..., 3:4]
    if zoom != 1.0 or shake:
        M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, zoom); M[0, 2] += math.sin(t * 61) * shake; M[1, 2] += math.cos(t * 47) * shake
        img = cv2.warpAffine(img, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    if fixed:
        fs, _ = text_layer(fixed); img = img * (1 - fs[..., 3:4]) + fs[..., :3] * 255 * fs[..., 3:4]
    if desat: g = img.mean(-1, keepdims=True); img = g + (img - g) * (1 - desat)
    img = img * _VIG[..., None]
    if flash: img = img + (255 - img) * flash
    return np.clip(img, 0, 255)
