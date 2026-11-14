"""Doodle-explainer style (matches the reference Arabic story channel): flat muted backgrounds, thick dark outlines,
googly-eyed big-head characters, cream/red/navy rounded labels, paper cards, calendars, heavy vignette + grain, slow pushes."""
import math, random
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, S = 1280, 720, 2
OL = (38, 32, 36)                      # outline
FONT = '/home/claude/claude-teacher-/engine/fonts/Tajawal-Bold.ttf'
_f = {}
def font(sz):
    sz = int(sz)
    if sz not in _f: _f[sz] = ImageFont.truetype(FONT, sz, layout_engine=ImageFont.Layout.RAQM)
    return _f[sz]
def clamp(x, a=0., b=1.): return max(a, min(b, x))
def seg(t, a, b): return clamp((t - a) / (b - a)) if b != a else float(t >= a)
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def lerp(a, b, t): return a + (b - a) * t
def shade(c, k): return tuple(max(0, min(255, int(v * k))) for v in c)

class Pic:
    """2x supersampled drawing surface; coordinates in 1280x720 space."""
    def __init__(self, bg=None):
        self.im = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 255) if bg is None else bg + (255,)) if not isinstance(bg, Image.Image) else bg.copy()
        self.d = ImageDraw.Draw(self.im)
    def _p(self, pts): return [(x * S, y * S) for x, y in pts]
    def rect(self, x0, y0, x1, y1, fill, ol=OL, w=4, r=0):
        if r: self.d.rounded_rectangle((x0 * S, y0 * S, x1 * S, y1 * S), r * S, fill=fill, outline=ol, width=int(w * S) if ol else 0)
        else: self.d.rectangle((x0 * S, y0 * S, x1 * S, y1 * S), fill=fill, outline=ol, width=int(w * S) if ol else 0)
    def ell(self, cx, cy, rx, ry, fill, ol=OL, w=4): self.d.ellipse(((cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S), fill=fill, outline=ol, width=int(w * S) if ol else 0)
    def circ(self, cx, cy, r, fill, ol=OL, w=4): self.ell(cx, cy, r, r, fill, ol, w)
    def poly(self, pts, fill, ol=OL, w=4):
        self.d.polygon(self._p(pts), fill=fill)
        if ol: self.d.line(self._p(pts + [pts[0]]), fill=ol, width=int(w * S), joint='curve')
    def line(self, pts, col, w=4): self.d.line(self._p(pts), fill=col, width=int(w * S), joint='curve')
    def limb(self, pts, col, w):   # outlined thick stroke with round caps
        for ww, c in ((w + 7, OL), (w, col)):
            self.d.line(self._p(pts), fill=c, width=int(ww * S), joint='curve')
            for x, y in (pts[0], pts[-1]): r = ww / 2; self.d.ellipse(((x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S), fill=c)
    def arc(self, cx, cy, rx, ry, a0, a1, col, w=3): self.d.arc(((cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S), a0, a1, fill=col, width=int(w * S))
    def chord(self, cx, cy, rx, ry, a0, a1, fill, ol=OL, w=4): self.d.chord(((cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S), a0, a1, fill=fill, outline=ol, width=int(w * S) if ol else 0)
    def pie(self, cx, cy, rx, ry, a0, a1, fill, ol=OL, w=4): self.d.pieslice(((cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S), a0, a1, fill=fill, outline=ol, width=int(w * S) if ol else 0)
    def text(self, xy, s, size, fill=(40, 34, 38), anchor='mm', stroke=0, stroke_fill=None):
        self.d.text((xy[0] * S, xy[1] * S), s, font=font(size * S), fill=fill, anchor=anchor, direction='rtl', language='ar', stroke_width=int(stroke * S), stroke_fill=stroke_fill)
    def tw(self, s, size): return font(size * S).getlength(s) / S
    def paste(self, other, alpha=1.0):
        if alpha >= 1: self.im.alpha_composite(other.im)
        else:
            o = other.im.copy(); o.putalpha(o.getchannel('A').point(lambda v: int(v * alpha))); self.im.alpha_composite(o)
    def blur_bg(self, r): self.im = self.im.filter(ImageFilter.GaussianBlur(r * S)); self.d = ImageDraw.Draw(self.im)
    def out(self): return np.asarray(self.im.convert('RGB').resize((W, H), Image.LANCZOS), np.float32)

# ---------------- labels / cards (reference look) ----------------
CREAM, CREAM_T, RED_L, NAVY_L = (243, 230, 196), (52, 40, 34), (196, 62, 54), (30, 52, 104)
def label(p, cx, cy, s, size=26, kind='cream', a=1.0):
    if a <= 0: return
    w = p.tw(s, size) + size * 1.1; h = size * 1.55
    fill, tc = {'cream': (CREAM, CREAM_T), 'red': (RED_L, (255, 255, 255)), 'navy': (NAVY_L, (255, 255, 255)), 'green': ((54, 140, 80), (255, 255, 255))}[kind]
    p.rect(cx - w / 2 + 4, cy - h / 2 + 5, cx + w / 2 + 4, cy + h / 2 + 5, (0, 0, 0, 90), None, 0, r=8)       # drop shadow
    p.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, fill, OL, 3, r=8)
    p.text((cx, cy + 1), s, size, tc)

def paper(p, cx, cy, title, lines, w=520, h=360, rot=-1.5, reveal=1.0):
    card = Pic((0, 0, 0)); card.im = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); card.d = ImageDraw.Draw(card.im)
    card.rect(cx - w / 2 + 8, cy - h / 2 + 10, cx + w / 2 + 8, cy + h / 2 + 10, (0, 0, 0, 110), None, 0)
    card.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, (240, 232, 214), (120, 104, 90), 2)
    card.text((cx, cy - h / 2 + 52), title, 34, (150, 40, 36)); card.line([(cx - w / 2 + 50, cy - h / 2 + 84), (cx + w / 2 - 50, cy - h / 2 + 84)], (150, 40, 36), 2)
    for i, s in enumerate(lines):
        if reveal * len(lines) > i: card.text((cx, cy - h / 2 + 140 + i * 50), s, 30, (40, 34, 38))
    for k in range(3): card.line([(cx - w / 2 + 40, cy + h / 2 - 50 + k * 10), (cx - w / 2 + 210, cy + h / 2 - 50 + k * 10)], (200, 190, 175), 2)
    if rot: card.im = card.im.rotate(rot, center=(cx * S, cy * S), resample=Image.BICUBIC)
    p.im.alpha_composite(card.im)

def calendar(p, cx, cy, top, num, sub=None, sc=1.0):
    w, h = 190 * sc, 200 * sc
    p.rect(cx - w / 2 + 6, cy - h / 2 + 8, cx + w / 2 + 6, cy + h / 2 + 8, (0, 0, 0, 110), None, 0, r=12)
    p.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, (246, 242, 234), OL, 3, r=12)
    p.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2 + 52 * sc, (205, 52, 46), OL, 3, r=12); p.rect(cx - w / 2 + 2, cy - h / 2 + 30 * sc, cx + w / 2 - 2, cy - h / 2 + 52 * sc, (205, 52, 46), None, 0)
    p.text((cx, cy - h / 2 + 27 * sc), top, 26 * sc, (255, 255, 255)); p.text((cx, cy + 28 * sc), num, 96 * sc, (34, 30, 32))
    if sub: label(p, cx, cy + h / 2 + 34 * sc, sub, 22 * sc, 'red')

def big_number(p, cx, cy, s, sub=None, col=(232, 64, 56), size=150):
    p.text((cx + 5, cy + 6), s, size, (0, 0, 0, 140)); p.text((cx, cy), s, size, col, stroke=6, stroke_fill=(255, 255, 255))
    if sub: label(p, cx, cy + size * .62, sub, 24, 'red')

def wall_clock(p, cx, cy, r, t_hours):
    p.circ(cx + 6, cy + 8, r, (0, 0, 0, 90), None); p.circ(cx, cy, r, (248, 248, 246), OL, 10); p.circ(cx, cy, r - 12, None, (60, 60, 64), 2)
    for k in range(12):
        a = math.radians(k * 30); p.line([(cx + math.sin(a) * (r - 22), cy - math.cos(a) * (r - 22)), (cx + math.sin(a) * (r - 34), cy - math.cos(a) * (r - 34))], OL, 5 if k % 3 == 0 else 3)
    hh = t_hours % 12; ah = math.radians(hh * 30); am = math.radians((hh * 60 % 60) * 6)
    p.line([(cx, cy), (cx + math.sin(ah) * r * .5, cy - math.cos(ah) * r * .5)], OL, 9); p.line([(cx, cy), (cx + math.sin(am) * r * .75, cy - math.cos(am) * r * .75)], OL, 6)
    a_s = math.radians((t_hours * 3600 % 60) * 6); p.line([(cx, cy), (cx + math.sin(a_s) * r * .8, cy - math.cos(a_s) * r * .8)], (200, 50, 40), 3); p.circ(cx, cy, 8, OL, None)

# ---------------- characters ----------------
SKIN = [(236, 192, 150), (214, 160, 118), (178, 124, 86), (140, 94, 64)]
class Who:
    def __init__(self, skin=0, shirt=(70, 120, 196), pants=(52, 60, 82), hair='short', hair_col=(98, 62, 40), scarf=None, dress=None, coat=False,
                 glasses=False, beard=None, cap=None, chef=False, kid=False, old=False, shoes=(30, 28, 30)):
        self.skin = SKIN[skin] if isinstance(skin, int) else skin; self.shirt, self.pants, self.hair, self.hair_col = shirt, pants, hair, hair_col
        self.scarf, self.dress, self.coat, self.glasses, self.beard, self.cap, self.chef, self.kid, self.old, self.shoes = scarf, dress, coat, glasses, beard, cap, chef, kid, old, shoes

def head(p, w, cx, cy, r, expr='normal', look=0.0, t=0.0, talk=False, blink=True):
    if w.scarf:     # hijab: draped shape behind and around the face
        p.ell(cx, cy + r * .15, r * 1.22, r * 1.28, w.scarf); p.poly([(cx - r * 1.05, cy + r * .6), (cx + r * 1.05, cy + r * .6), (cx + r * 1.3, cy + r * 1.7), (cx - r * 1.3, cy + r * 1.7)], w.scarf)
    if w.hair == 'long' and not w.scarf: p.ell(cx, cy + r * .45, r * 1.12, r * 1.3, w.hair_col)
    p.circ(cx, cy, r, w.skin, OL, 5)
    if w.scarf: p.chord(cx, cy - r * .02, r * 1.04, r * 1.06, 180, 360, w.scarf, OL, 4); p.arc(cx, cy + r * .1, r * .98, r * 1.0, 200, 340, shade(w.scarf, .8), 3)
    elif w.hair in ('short', 'long', 'spiky', 'kid'):
        p.chord(cx, cy - r * .08, r * 1.02, r * .98, 180, 360, w.hair_col, OL, 4)
        p.poly([(cx - r * .98, cy - r * .2), (cx - r * .6, cy - r * .55), (cx - r * .2, cy - r * .3), (cx + r * .3, cy - r * .55), (cx + r * .98, cy - r * .2), (cx + r * .9, cy - r * .55), (cx - r * .9, cy - r * .55)], w.hair_col, None)
        if w.hair == 'spiky':
            p.poly([(cx - r * .9, cy - r * .45), (cx - r * .7, cy - r * 1.18), (cx - r * .3, cy - r * .92), (cx + r * .05, cy - r * 1.25), (cx + r * .35, cy - r * .9), (cx + r * .8, cy - r * 1.1), (cx + r * .9, cy - r * .45)], w.hair_col, OL, 3)
    elif w.hair == 'bald':
        p.chord(cx - r * .92, cy + r * .02, r * .2, r * .4, 90, 270, w.hair_col, OL, 3); p.chord(cx + r * .92, cy + r * .02, r * .2, r * .4, 270, 90, w.hair_col, OL, 3)
        p.arc(cx - r * .25, cy - r * .55, r * .3, r * .18, 200, 320, (255, 255, 255, 120), 3)
    if w.cap: p.chord(cx, cy - r * .2, r * 1.04, r * .9, 180, 360, w.cap, OL, 4); p.rect(cx - r * .2, cy - r * .3, cx + r * 1.35, cy - r * .16, w.cap, OL, 3, r=4)
    if w.chef: p.rect(cx - r * .75, cy - r * 1.75, cx + r * .75, cy - r * .7, (250, 250, 250), OL, 4, r=10); p.circ(cx - r * .45, cy - r * 1.75, r * .35, (250, 250, 250)); p.circ(cx + r * .45, cy - r * 1.75, r * .35, (250, 250, 250)); p.circ(cx, cy - r * 1.95, r * .42, (250, 250, 250))
    # eyes: big googly rings
    er = r * .3; ey = cy - r * .02; ex = r * .34
    closed = blink and (t * 1.0 + cx * .013) % 3.4 < .12
    for sgn in (-1, 1):
        x = cx + sgn * ex
        if expr == 'happy' or closed:
            p.arc(x, ey + er * .3, er * .8, er * .7, 200, 340, OL, 5)
        elif expr == 'sad':
            p.circ(x, ey, er, (255, 255, 255), OL, 5); p.chord(x, ey, er, er, 180, 360, w.skin, OL, 4); p.circ(x + look * er * .35, ey + er * .35, er * .3, OL, None)
        else:
            p.circ(x, ey, er, (255, 255, 255), OL, 6 if w.glasses else 5)
            pr = er * (.22 if expr == 'shock' else .36); p.circ(x + look * er * .45, ey + (er * .05), pr, OL, None)
    if w.glasses: p.line([(cx - ex + er, ey), (cx + ex - er, ey)], OL, 4)
    by = ey - er - r * .14
    if expr in ('sad', 'worry'): p.line([(cx - ex - er * .7, by + 2), (cx - ex + er * .6, by - 8)], OL, 4); p.line([(cx + ex + er * .7, by + 2), (cx + ex - er * .6, by - 8)], OL, 4)
    elif expr == 'shock': p.arc(cx - ex, by - 4, er * .7, er * .4, 200, 340, OL, 4); p.arc(cx + ex, by - 4, er * .7, er * .4, 200, 340, OL, 4)
    if w.beard: p.chord(cx, cy + r * .2, r * .92, r * .78, 0, 180, w.beard, OL, 4)
    if w.old: p.arc(cx - ex, ey + er * 1.1, er * .6, er * .25, 20, 160, shade(w.skin, .7), 2); p.arc(cx + ex, ey + er * 1.1, er * .6, er * .25, 20, 160, shade(w.skin, .7), 2)
    my = cy + r * .55
    open_ = talk and int(t * 8) % 2 == 0
    if expr == 'shock' or open_: p.ell(cx, my, r * .14, r * .17, (90, 30, 34), OL, 3)
    elif expr in ('happy', 'smile'): p.chord(cx, my - r * .1, r * .28, r * .2, 0, 180, (110, 36, 40), OL, 3)
    elif expr in ('sad', 'worry'): p.arc(cx, my + r * .12, r * .2, r * .12, 200, 340, OL, 4)
    else: p.arc(cx, my - r * .08, r * .18, r * .1, 20, 160, OL, 4)

def person(p, w, x, feet, h, pose='stand', t=0.0, expr='normal', look=0.0, talk=False, phase=0.0, arm=None, lean=0.0, blink=True):
    """front-facing doodle person. h = full height px. returns head (cx, cy, r)"""
    r = h * (.17 if not w.kid else .2); legl = h * (.3 if not w.kid else .26); bodyh = h - 2 * r - legl - r * .15
    sit = pose == 'sit'
    if sit: legl *= .55
    hip_y = feet - legl; sh_y = hip_y - bodyh; hy = sh_y - r * 1.12
    bw_top, bw_bot = r * .78, r * .9
    s = math.sin(t * 2 * math.pi * 1.7 + phase)
    p.ell(x, feet + 4, r * 1.15, r * .16, (0, 0, 0, 45), None)                  # ground shadow
    # legs
    if pose == 'walk': la, lb = 14 * s, -14 * s
    elif pose == 'run': la, lb = 28 * s, -28 * s
    else: la = lb = 0
    for sgn, ang in ((-1, la), (1, lb)):
        hx = x + sgn * r * .42
        if sit:
            kx, ky = hx + sgn * 4, hip_y + legl * .15; fx, fy = kx, feet
        else:
            fx, fy = hx + math.sin(math.radians(ang)) * legl, hip_y + math.cos(math.radians(ang)) * legl; kx, ky = (hx + fx) / 2, (hip_y + fy) / 2
        p.limb([(hx, hip_y - 4), (kx, ky), (fx, fy - 8)], w.pants if not w.dress else w.skin, r * .32)
        p.ell(fx + sgn * 6, fy - 4, r * .38, r * .2, w.shoes, OL, 3)
    # body
    top = w.dress or w.shirt
    if w.dress:
        p.poly([(x - bw_top, sh_y), (x + bw_top, sh_y), (x + bw_bot * 1.25, hip_y + legl * .62), (x - bw_bot * 1.25, hip_y + legl * .62)], w.dress)
    else:
        p.poly([(x - bw_top, sh_y + 6), (x - bw_top * .9, sh_y - 2), (x + bw_top * .9, sh_y - 2), (x + bw_top, sh_y + 6), (x + bw_bot, hip_y + 6), (x - bw_bot, hip_y + 6)], top)
        if w.coat: p.line([(x, sh_y + 4), (x, hip_y + 4)], OL, 3); p.line([(x - r * .25, sh_y), (x - r * .05, sh_y + bodyh * .35)], OL, 3); p.line([(x + r * .25, sh_y), (x + r * .05, sh_y + bodyh * .35)], OL, 3)
    # arms
    def arm_pts(sgn, a1, a2):
        sx, sy = x + sgn * bw_top * .92, sh_y + r * .25; l = bodyh * .55
        ex_, ey_ = sx + math.sin(math.radians(a1)) * l * sgn, sy + math.cos(math.radians(a1)) * l
        hx_, hy_ = ex_ + math.sin(math.radians(a2)) * l * sgn, ey_ + math.cos(math.radians(a2)) * l
        return [(sx, sy), (ex_, ey_), (hx_, hy_)]
    A = {'stand': ((14, 6), (14, 6)), 'walk': ((14 + 22 * s, 8 + 22 * s), (14 - 22 * s, 8 - 22 * s)), 'run': ((20 + 45 * s, 70), (20 - 45 * s, 70)),
         'sit': ((20, 60), (20, 60)), 'wave': ((14, 6), (150, 170 + 22 * math.sin(t * 9))), 'point': ((14, 6), (75, 85)), 'hug': ((60, 120), (60, 120)),
         'phone': ((14, 6), (40, 160)), 'shrug': ((40, 120), (40, 120)), 'cheer': ((150, 175), (150, 175))}[pose if not arm else 'stand']
    if arm: A = arm
    sleeve = w.dress or w.shirt
    for sgn, (a1, a2) in ((-1, A[0]), (1, A[1])):
        pts = arm_pts(sgn, a1, a2); p.limb(pts, sleeve, r * .28); p.circ(pts[-1][0], pts[-1][1], r * .17, w.skin, OL, 3)
    # neck + head
    p.limb([(x, sh_y + 2), (x, sh_y - r * .4)], w.skin, r * .12)
    head(p, w, x + lean * r, hy, r, expr, look, t, talk, blink)
    if pose == 'phone':
        hp = arm_pts(1, 40, 160)[-1]; p.rect(hp[0] - r * .3, hp[1] - r * .55, hp[0] + r * .3, hp[1] + r * .2, (40, 44, 56), OL, 3, r=4)
    return x + lean * r, hy, r

def cat(p, x, feet, s=1.0, t=0.0):
    c = (226, 140, 64); p.ell(x, feet + 3, 40 * s, 7 * s, (0, 0, 0, 60), None)
    sw = math.sin(t * 3) * 10
    p.limb([(x + 26 * s, feet - 12 * s), (x + 50 * s, feet - 30 * s), (x + 54 * s + sw, feet - 64 * s)], c, 9 * s)
    p.ell(x, feet - 26 * s, 34 * s, 28 * s, c, OL, 4)
    hx, hy = x - 4 * s, feet - 70 * s
    p.poly([(hx - 26 * s, hy - 8 * s), (hx - 22 * s, hy - 40 * s), (hx - 4 * s, hy - 22 * s)], c, OL, 4); p.poly([(hx + 26 * s, hy - 8 * s), (hx + 22 * s, hy - 40 * s), (hx + 4 * s, hy - 22 * s)], c, OL, 4)
    p.circ(hx, hy, 28 * s, c, OL, 4)
    for k in (-1, 1): p.circ(hx + k * 10 * s, hy - 2 * s, 7 * s, (255, 255, 255), OL, 3); p.circ(hx + k * 10 * s, hy - 1 * s, 3 * s, OL, None)
    p.poly([(hx - 3 * s, hy + 8 * s), (hx + 3 * s, hy + 8 * s), (hx, hy + 12 * s)], (200, 90, 90), None)

# ---------------- backgrounds ----------------
def grad(top, bot):
    g = np.linspace(0, 1, H * S, dtype=np.float32)[:, None, None]
    a = np.array(top, np.float32) + (np.array(bot, np.float32) - np.array(top, np.float32)) * g
    a = np.repeat(a, W * S, 1); return Image.fromarray(a.astype(np.uint8)).convert('RGBA')

def city_bg(evening=False, crosswalk=False, seed=3):
    p = Pic(); p.im = grad((206, 216, 222), (236, 236, 228)) if not evening else grad((120, 92, 120), (236, 160, 120)); p.d = ImageDraw.Draw(p.im)
    rnd = random.Random(seed); x = -30
    cols = [(236, 228, 214), (214, 222, 230), (226, 214, 200), (204, 214, 222)]
    while x < W:
        w = rnd.randint(130, 190); top = rnd.randint(60, 230); c = cols[rnd.randint(0, 3)]
        if evening: c = shade(c, .78)
        p.rect(x, top, x + w, 470, c, (120, 120, 126), 2)
        for wy in range(top + 18, 450, 30):
            for wx in range(x + 14, x + w - 20, 26):
                wc = (120, 150, 190) if rnd.random() > .3 else (236, 180, 80)
                if evening and rnd.random() > .5: wc = (250, 206, 110)
                p.rect(wx, wy, wx + 14, wy + 18, wc, None, 0)
        x += w + rnd.randint(10, 60)
    for tx in range(60, W, 230):
        p.rect(tx - 4, 400, tx + 4, 470, (130, 96, 70), None, 0); p.circ(tx, 392, 44, (110, 170, 90), (80, 120, 60), 2); p.circ(tx - 14, 380, 16, (130, 190, 106), None)
    p.rect(0, 470, W, 520, (214, 206, 190), None, 0); p.line([(0, 470), (W, 470)], (150, 140, 126), 3)
    p.rect(0, 520, W, H, (104, 104, 108), None, 0); p.line([(0, 520), (W, 520)], (70, 70, 74), 4)
    for dx in range(20, W, 120): p.rect(dx, 612, dx + 60, 618, (236, 236, 230), None, 0)
    if crosswalk:
        for k in range(8): p.rect(600 + k * 52, 528, 632 + k * 52, H, (240, 240, 236), None, 0)
    return p.im

def room_bg(wall=(150, 138, 112), stripe=None, floor=(120, 96, 76)):
    p = Pic(); p.im = grad(shade(wall, 1.08), shade(wall, .86)); p.d = ImageDraw.Draw(p.im)
    for x in range(0, W, 60): p.rect(x, 0, x + 30, 520, shade(wall, .96) + (255,), None, 0)
    p.rect(0, 120, W, 132, shade(wall, .7), None, 0)
    p.rect(0, 520, W, H, floor, None, 0); p.line([(0, 520), (W, 520)], shade(floor, .6), 5)
    for x in range(-80, W, 140): p.line([(x, 520), (x - 120, H)], shade(floor, .85), 3)
    return p.im

def park_bg(evening=False):
    p = Pic(); p.im = grad((176, 210, 226), (226, 236, 222)) if not evening else grad((150, 96, 120), (246, 170, 110)); p.d = ImageDraw.Draw(p.im)
    for k, x in enumerate(range(-40, W + 60, 110)):
        r = 70 + (k * 23) % 40; g = (110, 160, 96) if not evening else (130, 120, 80)
        p.rect(x - 6, 380, x + 6, 470, (120, 90, 64), None, 0); p.circ(x, 370 - (k % 3) * 18, r, g, shade(g, .75), 2)
    p.rect(0, 460, W, H, (128, 178, 100) if not evening else (150, 150, 90), None, 0)
    p.poly([(0, 600), (W, 560), (W, 640), (0, H)], (220, 204, 168), None)
    p.rect(1100, 300, 1108, 470, (70, 70, 76), None, 0); p.ell(1104, 296, 22, 14, (250, 240, 190), OL, 3)
    return p.im

def blueprint_bg():
    p = Pic(); p.im = grad((26, 38, 64), (16, 24, 42)); p.d = ImageDraw.Draw(p.im)
    for x in range(0, W, 40): p.line([(x, 0), (x, H)], (36, 52, 84), 1)
    for y in range(0, H, 40): p.line([(0, y), (W, y)], (36, 52, 84), 1)
    return p.im

def dark_bg():
    p = Pic(); p.im = grad((48, 38, 30), (20, 16, 14)); p.d = ImageDraw.Draw(p.im)
    rnd = random.Random(2)
    for i in range(70): x, y = rnd.random() * W, rnd.random() * H; p.circ(x, y, 1.2, (200, 180, 150, 90), None)
    return p.im

# ---------------- post: camera, vignette, grain ----------------
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = (1 - .62 * np.clip(np.sqrt(((_xx - W / 2) / (W * .62)) ** 2 + ((_yy - H / 2) / (H * .62)) ** 2) - .35, 0, 1) ** 1.4)[..., None]
_rng = np.random.default_rng(1); GRAIN = [(_rng.standard_normal((H // 2, W // 2)).astype(np.float32) * 5) for _ in range(6)]
def post(img, t=0, zoom=1.0, cx=W / 2, cy=H / 2, shake=0.0, flash=0.0, red=0.0, desat=0.0, dim=1.0):
    if zoom != 1.0 or shake:
        M = cv2.getRotationMatrix2D((cx, cy), 0, zoom); M[0, 2] += math.sin(t * 61) * shake; M[1, 2] += math.cos(t * 47) * shake
        img = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    if desat: g = img.mean(-1, keepdims=True); img = g + (img - g) * (1 - desat)
    if red: img = img * np.array([1.0, 1 - .3 * red, 1 - .3 * red])
    img = img * VIG * dim
    img = img + cv2.resize(GRAIN[int(t * 12) % 6], (W, H))[..., None]
    if flash: img = img + (255 - img) * flash
    return np.clip(img, 0, 255)
