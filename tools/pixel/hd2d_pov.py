"""HD-2D pixel POV sample: first 21 s of the countdown voice.
Pixel layers (native 5x) placed at depths -> per-layer depth of field, warm light shafts, bloom, rim light, dust, vignette, grade."""
import os, sys, math, subprocess
import numpy as np, cv2
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from lpc import Sprite

OW, OH, FPS = 1280, 720, 24; PS = 5            # output size, pixels per art pixel
T_END = 21.0
VOICE = '/home/claude/claude-teacher-/engine/voice_countdown.wav'
OUT = '/home/claude/out/hd2d_pov_sample.mp4'; FR = '/home/claude/out/hd2d/'; os.makedirs(FR, exist_ok=True)
LT = [0.29, 1.8, 2.89, 6.43, 8.15, 9.47, 10.64, 11.65, 14.24, 18.1, 19.88, 20.43]   # line starts (timing_countdown.json)
def clamp(x, a=0., b=1.): return max(a, min(b, x))
def seg(t, a, b): return clamp((t - a) / (b - a))
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def lerp(a, b, t): return a + (b - a) * t
rng = np.random.default_rng(7)

# ---------------- sprites ----------------
mom = Sprite([('body/bodies/female/{anim}.png', 'body', 'light'), ('feet/shoes/basic/thin/{anim}.png', 'cloth', 'brown'), ('legs/pants/thin/{anim}.png', 'cloth', 'navy'),
              ('torso/clothes/longsleeve/scoop/female/{anim}.png', 'cloth', 'rose'), ('head/heads/human/female/{anim}.png', 'body', 'light'),
              ('eyes/human/adult/default/{anim}/brown.png', None, None), ('hair/long/adult/{anim}.png', 'hair', 'dark_brown')])
bro = Sprite([('body/bodies/child/{anim}.png', 'body', 'light'), ('legs/pants/child/{anim}/blue.png', None, None), ('torso/clothes/shirt/child/{anim}/red.png', None, None),
              ('head/heads/human/child/{anim}.png', 'body', 'light'), ('eyes/human/child/{anim}/brown.png', None, None), ('hair/relm_short/child/{anim}.png', 'hair', 'dark_brown')])
def arr(im): return np.array(im.convert('RGBA'), dtype=np.float32) / 255.

# ---------------- pixel font (5x7) ----------------
G = {'0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
     '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
     '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
     '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
     '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
     'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'], 'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
     'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'], ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'], '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'], ' ': ['000'] * 7}
def text_img(s, col=(140, 245, 255)):
    w = sum(len(G[c][0]) + 1 for c in s) + 3; im = Image.new('RGBA', (w, 11)); px = im.load(); x = 2
    for c in s:
        g = G[c]
        for yy, row in enumerate(g):
            for xx, b in enumerate(row):
                if b == '1':
                    px[x + xx, 2 + yy] = col + (255,)
                    for dx, dy in ((1, 1), (1, 0), (0, 1)):          # 1px dark drop outline for readability
                        if px[x + xx + dx, 2 + yy + dy][3] == 0: px[x + xx + dx, 2 + yy + dy] = (10, 40, 60, 200)
        x += len(g[0]) + 1
    return im

# ---------------- set painting (native art pixels) ----------------
def shade_rect(d, box, base, edge_dark=.75, top_light=1.12):
    x0, y0, x1, y1 = box; d.rectangle(box, fill=base)
    d.line((x0, y0, x1, y0), fill=tuple(min(255, int(c * top_light)) for c in base)); d.line((x0, y1, x1, y1), fill=tuple(int(c * edge_dark) for c in base))
    d.line((x1, y0, x1, y1), fill=tuple(int(c * edge_dark) for c in base))
def dither_grad(d, box, c0, c1, vertical=True):
    x0, y0, x1, y1 = box; n = (y1 - y0) if vertical else (x1 - x0)
    for i in range(n + 1):
        t = i / max(1, n)
        for j in range((x1 - x0 + 1) if vertical else (y1 - y0 + 1)):
            tt = t + (((i + j) % 2) * .5 - .25) / max(1, n) * 4
            tt = clamp(tt); c = tuple(int(lerp(a, b, tt)) for a, b in zip(c0, c1))
            d.point((x0 + j, y0 + i) if vertical else (x0 + i, y0 + j), fill=c)

def bedroom():
    W, H = 340, 230; back = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(back)
    dither_grad(d, (0, 0, W - 1, 60), (196, 204, 214), (176, 186, 200))              # ceiling
    d.rectangle((0, 60, W, 64), fill=(150, 156, 170))                                    # crown moulding
    dither_grad(d, (0, 64, W - 1, 196), (124, 150, 168), (98, 122, 142))                 # wall
    for x in range(0, W, 10): d.line((x, 66, x, 194), fill=(116, 142, 160))
    d.ellipse((150, 22, 190, 34), fill=(238, 232, 210)); d.rectangle((168, 0, 171, 24), fill=(90, 90, 96))   # ceiling lamp
    # door + lit hallway
    d.rectangle((136, 98, 214, 196), fill=(92, 62, 44)); dither_grad(d, (142, 104, 208, 196), (255, 226, 172), (226, 186, 132))
    d.rectangle((142, 168, 208, 196), fill=(196, 150, 104)); d.line((142, 168, 208, 168), fill=(160, 116, 80))
    d.rectangle((214, 100, 236, 196), fill=(170, 120, 82)); d.line((214, 100, 214, 196), fill=(120, 82, 56))   # door leaf swung open
    d.rectangle((232, 146, 234, 150), fill=(230, 200, 90))
    # window (left) with morning sky
    shade_rect(d, (24, 86, 96, 150), (226, 222, 210)); dither_grad(d, (29, 91, 91, 145), (170, 214, 240), (250, 226, 180))
    d.line((60, 91, 60, 145), fill=(226, 222, 210)); d.line((29, 118, 91, 118), fill=(226, 222, 210))
    d.rectangle((18, 82, 30, 160), fill=(214, 120, 96)); d.rectangle((90, 82, 102, 160), fill=(214, 120, 96))   # curtains
    # poster + shelf
    shade_rect(d, (258, 96, 300, 140), (240, 210, 120)); d.ellipse((268, 104, 290, 126), fill=(230, 110, 80)); d.rectangle((262, 130, 296, 134), fill=(70, 90, 120))
    shade_rect(d, (250, 154, 318, 158), (140, 96, 64))
    for i, c in enumerate([(200, 70, 70), (70, 120, 200), (230, 190, 70), (90, 160, 90)]): d.rectangle((256 + i * 7, 142, 261 + i * 7, 153), fill=c)
    # floor
    dither_grad(d, (0, 196, W - 1, H - 1), (150, 104, 70), (120, 80, 52))
    for y in range(198, H, 7): d.line((0, y, W, y), fill=(110, 74, 48))
    return back

def bed_front():
    W, H = 340, 230; im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    # blanket hills at the bottom of the frame (we are lying in bed)
    pts = [(0, H)] + [(x, 186 + 10 * math.sin(x / 34) + 6 * math.sin(x / 13)) for x in range(0, W + 1, 4)] + [(W, H)]
    d.polygon(pts, fill=(222, 120, 112));
    for x in range(0, W, 12): d.line((x, 200, x + 6, H), fill=(196, 98, 92))
    d.polygon([(0, H)] + [(x, 212 + 6 * math.sin(x / 20)) for x in range(0, W + 1, 4)] + [(W, H)], fill=(196, 98, 92))
    return im

def kitchen():
    W, H = 380, 230; back = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(back)
    dither_grad(d, (0, 0, W - 1, 170), (206, 190, 160), (184, 166, 134))
    for y in range(110, 170, 6):                                                              # tiles behind the counter
        for x in range((y // 6 % 2) * 6, W, 12): d.rectangle((x, y, x + 10, y + 4), outline=(220, 206, 172))
    shade_rect(d, (0, 40, 150, 92), (120, 160, 150)); [d.line((x, 42, x, 90), fill=(100, 138, 128)) for x in range(37, 150, 37)]   # upper cabinets
    shade_rect(d, (0, 128, 160, 170), (110, 150, 140)); d.rectangle((0, 124, 162, 129), fill=(210, 200, 186))    # counter
    shade_rect(d, (300, 30, 350, 170), (226, 230, 232)); d.line((300, 80, 350, 80), fill=(180, 186, 190)); d.rectangle((342, 50, 344, 70), fill=(150, 150, 156))  # fridge
    # big window, bright morning
    shade_rect(d, (178, 34, 280, 112), (240, 236, 226)); dither_grad(d, (184, 40, 274, 106), (180, 220, 246), (255, 236, 190))
    d.line((229, 40, 229, 106), fill=(240, 236, 226)); d.line((184, 73, 274, 73), fill=(240, 236, 226))
    for i, c in enumerate([(90, 160, 90), (70, 140, 80)]): d.ellipse((190 + i * 60, 100 - 8, 206 + i * 60, 110), fill=c)   # plants
    d.rectangle((192, 106, 204, 112), fill=(190, 110, 70)); d.rectangle((252, 106, 264, 112), fill=(190, 110, 70))
    d.rectangle((0, 170, W, H), fill=(196, 180, 150))
    for x in range(0, W, 16):
        for y in range(170, H, 16): d.rectangle((x, y, x + 15, y + 15), outline=(180, 162, 132))
    return back

def chair_and_cat(ph):
    W, H = 380, 230; im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    shade_rect(d, (300, 150, 344, 156), (150, 100, 64)); d.rectangle((302, 156, 306, 200), fill=(120, 80, 50)); d.rectangle((338, 156, 342, 200), fill=(120, 80, 50))
    d.rectangle((338, 110, 342, 152), fill=(120, 80, 50))
    # sitting orange tabby on the chair (hand-placed pixels)
    O, Dk, L, E = (232, 146, 64), (186, 100, 40), (250, 196, 120), (40, 30, 30)
    cx, base = 316, 150
    d.ellipse((cx - 9, base - 16, cx + 9, base), fill=O)                    # body
    d.ellipse((cx - 7, base - 26, cx + 7, base - 13), fill=O)               # head
    d.polygon([(cx - 7, base - 22), (cx - 6, base - 31), (cx - 2, base - 25)], fill=O); d.polygon([(cx + 7, base - 22), (cx + 6, base - 31), (cx + 2, base - 25)], fill=O)
    d.point([(cx - 5, base - 28), (cx + 5, base - 28)], fill=(240, 150, 150))
    for k in range(3): d.line((cx - 6 + k * 5, base - 14, cx - 4 + k * 5, base - 6), fill=Dk)
    d.ellipse((cx - 4, base - 12, cx + 4, base - 1), fill=L)
    blink = (ph % 40) < 2
    if blink: d.line((cx - 4, base - 20, cx - 2, base - 20), fill=E); d.line((cx + 2, base - 20, cx + 4, base - 20), fill=E)
    else: d.rectangle((cx - 4, base - 21, cx - 3, base - 19), fill=E); d.rectangle((cx + 3, base - 21, cx + 4, base - 19), fill=E)
    d.point((cx, base - 17), fill=(220, 110, 110))
    sw = int(3 * math.sin(ph / 6))                                         # tail swish
    d.line([(cx + 8, base - 3), (cx + 14, base - 6), (cx + 16 + sw, base - 14), (cx + 14 + sw, base - 20)], fill=O, width=3)
    return im

def table_front():
    W, H = 380, 230; im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    shade_rect(d, (60, 160, 290, 168), (176, 120, 78)); d.rectangle((60, 168, 290, 230), fill=(150, 100, 64))
    d.line((60, 168, 290, 168), fill=(110, 70, 44)); d.rectangle((60, 168, 66, 230), fill=(126, 82, 52)); d.rectangle((284, 168, 290, 230), fill=(126, 82, 52))
    d.ellipse((150, 152, 176, 162), fill=(240, 240, 236)); d.ellipse((153, 152, 173, 158), fill=(236, 196, 120))   # cereal bowl
    d.rectangle((110, 146, 118, 160), fill=(240, 240, 250)); d.rectangle((110, 144, 118, 147), fill=(60, 120, 220))   # milk
    d.ellipse((198, 154, 216, 162), fill=(230, 230, 226)); d.rectangle((202, 150, 212, 156), fill=(250, 220, 140))   # toast plate
    return im

BED, BEDF, KIT, TAB = bedroom(), bed_front(), kitchen(), table_front()

# ---------------- compositing helpers (float RGBA premultiplied, output res) ----------------
def place(layer_img, cam, depth=1.0, focus=1.0, dof=6.0, sprite=None):
    """layer_img: PIL RGBA world image (art pixels). cam = (cx, cy, zoom) in world art px. depth: parallax factor (1 = subject plane)."""
    cx, cy, z = cam; s = PS * z * depth
    M = np.float32([[s, 0, OW / 2 - cx * s], [0, s, OH / 2 - cy * s - (1 - depth) * 0]])
    a = arr(layer_img); a[..., :3] *= a[..., 3:4]
    o = cv2.warpAffine(a, M, (OW, OH), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    sig = abs(depth - focus) * dof * z
    if sig > .4: o = cv2.GaussianBlur(o, (0, 0), sig)
    return o
def over(dst, src): return src + dst * (1 - src[..., 3:4])

def sprite_layer(spr, anim, row, col, wx, wy_feet, W=380, H=230, rim=(1.0, .85, .6), rim_dir=-1, scale=1):
    im = Image.new('RGBA', (W, H)); f = spr.frame(anim, row, col)
    if scale != 1: f = f.resize((64 * scale, 64 * scale), Image.NEAREST)
    a = np.array(f).astype(np.float32)
    al = a[..., 3] > 0; edge = al & ~np.roll(al, rim_dir, axis=1)                                   # rim light on the side facing the window
    a[edge, :3] = np.minimum(255, a[edge, :3] * .55 + np.array(rim) * 255 * .6)
    f = Image.fromarray(a.astype(np.uint8)); im.alpha_composite(f, (int(wx - 32 * scale), int(wy_feet - 62 * scale)))
    sh = Image.new('RGBA', (W, H)); ImageDraw.Draw(sh).ellipse((wx - 11 * scale, wy_feet - 3, wx + 11 * scale, wy_feet + 2), fill=(30, 20, 20, 90))
    sh.alpha_composite(im); return sh

def tag_layer(lines, wx, wy, W, H, a=1.0, pulse=0.):
    im = Image.new('RGBA', (W, H)); y = wy
    ws = [text_img(s) for s in lines]; mw = max(t.size[0] for t in ws)
    ImageDraw.Draw(im).rounded_rectangle((int(wx - mw / 2) - 2, int(wy) - 1, int(wx + mw / 2) + 2, int(wy) + 10 * len(lines) + 2), 3, fill=(8, 20, 34, 170), outline=(120, 230, 255, 200))
    for t in ws:
        im.alpha_composite(t, (int(wx - t.size[0] / 2), int(y))); y += 10
    if a < 1: im.putalpha(Image.fromarray((np.array(im)[..., 3] * a).astype(np.uint8)))
    return im

def light_shafts(t, src, angle, length, width, col, strength):
    m = np.zeros((OH, OW), np.float32); sx, sy = src
    for k in range(4):
        off = (k - 1.5) * width * .5; a = math.radians(angle + k * 2.5)
        dx, dy = math.cos(a), math.sin(a); nx, ny = -dy, dx
        p = np.array([[sx + nx * (off - width * .2), sy + ny * (off - width * .2)], [sx + nx * (off + width * .2), sy + ny * (off + width * .2)],
                      [sx + nx * (off + width * .55) + dx * length, sy + ny * (off + width * .55) + dy * length], [sx + nx * (off - width * .55) + dx * length, sy + ny * (off - width * .55) + dy * length]], np.int32)
        cv2.fillConvexPoly(m, p, .35 + .25 * math.sin(t * .7 + k * 1.7))
    m = cv2.GaussianBlur(m, (0, 0), 28) * strength
    return m[..., None] * np.array(col, np.float32)

DUST = rng.random((60, 4))
def dust(img, t, region, col=(1, .93, .75)):
    x0, y0, x1, y1 = region
    for i, (u, v, sp, ph) in enumerate(DUST):
        x = x0 + (u * (x1 - x0) + t * 6 * (sp - .5)) % (x1 - x0); y = y0 + (v * (y1 - y0) + math.sin(t * .6 + ph * 6) * 10 + t * 4 * sp) % (y1 - y0)
        r = 2 + int(sp * 3); a = .25 + .35 * (.5 + .5 * math.sin(t * 2 + ph * 9))
        cv2.circle(img, (int(x), int(y)), r, (col[0] * a, col[1] * a, col[2] * a, a), -1, cv2.LINE_AA)
    return img

def post(rgb, bloom=.55, warm=1.0, vign=.55, lids=0., blur=0.):
    bright = np.clip(rgb - .72, 0, 1); b = cv2.GaussianBlur(bright, (0, 0), 14) + cv2.GaussianBlur(bright, (0, 0), 40)
    rgb = rgb + b * bloom
    rgb = rgb * np.array([1.04 * warm, 1.0, .94 / warm], np.float32)                             # warm morning grade
    rgb = (rgb - .5) * 1.06 + .5
    yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32); r = np.sqrt(((xx - OW / 2) / (OW / 2)) ** 2 + ((yy - OH / 2) / (OH / 2)) ** 2)
    rgb = rgb * (1 - vign * np.clip(r - .55, 0, 1) ** 1.6)[..., None]
    if blur > .3: rgb = cv2.GaussianBlur(rgb, (0, 0), blur)
    if lids > 0:                                                                                  # eyelids: dark curved bands closing from top and bottom
        h = lids * OH * .52; m = np.zeros((OH, OW), np.float32)
        cv2.ellipse(m, (OW // 2, int(-OH * .6 + h)), (int(OW * .9), int(OH * .62)), 0, 0, 360, 1, -1)
        cv2.ellipse(m, (OW // 2, int(OH * 1.6 - h)), (int(OW * .9), int(OH * .62)), 0, 0, 360, 1, -1)
        m = cv2.GaussianBlur(m, (0, 0), 30); rgb = rgb * (1 - m[..., None]) + np.array([.06, .03, .03]) * m[..., None]
    rgb = rgb + (rng.standard_normal((OH, OW, 1)).astype(np.float32) * .012)                     # light grain
    return np.clip(rgb, 0, 1)

def life(t, base_sec, start):
    """mom's countdown: 31y 4m 6d + h:m:s ticking down from `start`"""
    s = base_sec - max(0, t - start); h, r = divmod(int(s), 3600); m, sec = divmod(r, 60); return f'{h:02d}:{m:02d}:{sec:02d}'

# ---------------- shots ----------------
def shot_bedroom(t):
    # 0 - 14.24: waking in bed, tilt from the ceiling down to Mom in the doorway, then push in on her numbers
    tilt = ease(seg(t, 1.0, 4.6)); push = ease(seg(t, LT[3], LT[7] + 1.5))
    cam = (175, lerp(lerp(36, 138, tilt), 106, push), lerp(1.0, 1.6, push) + .02 * math.sin(t * .5))
    focus = 1.0
    img = np.zeros((OH, OW, 4), np.float32)
    img = over(img, place(BED, cam, 1.0, focus, 3))
    col = int(t * 2.2) % 2                                                                           # idle breathing frames
    img = over(img, place(sprite_layer(mom, 'walk', 2, 0, 175, 196 + col, W=340, H=230, rim=(1, .9, .7), rim_dir=1, scale=2), cam, 1.0, focus))
    # tag above her head: appears on "floating above your mom's head", builds line by line
    lines = []
    if t > LT[4]: lines.append('31Y')
    if t > LT[5]: lines[-1] = '31Y 4M'
    if t > LT[6]: lines[-1] = '31Y 4M 6D'
    if t > LT[7]: lines.append(life(t, 13 * 3600 + 22 * 60 + 7, LT[7]))
    a = ease(seg(t, LT[2] + 1.6, LT[2] + 2.6))
    if a > 0:
        if not lines: lines = ['--Y --M --D']
        tl = tag_layer(lines, 175, 84 - 10 * len(lines) + 2 * math.sin(t * 2), 340, 230, a)
        img = over(img, place(tl, cam, 1.0, focus))
    img = over(img, place(BEDF, (cam[0], cam[1] + 6, cam[2]), 1.35, focus, 10))                        # blanket, near, blurred
    rgb = img[..., :3] + light_shafts(t, (OW * .1 - (cam[0] - 176) * 4, -40 - (cam[1] - 80) * 3), 62, 1100, 200, (1, .86, .6), .32)[..., :3] * (1 - push * .5)
    rgb = dust(np.dstack([rgb, np.ones((OH, OW), np.float32)]), t, (0, 0, OW, OH))[..., :3]
    lids = (1 - ease(seg(t, .2, 1.4))) * .95 + .55 * (1 - ease(seg(t, 1.5, 2.6))) * ease(seg(t, .9, 1.5))
    return post(rgb, lids=clamp(lids), blur=(1 - ease(seg(t, .2, 3.0))) * 9)

def shot_kitchen(t):
    # 14.24 - 21: breakfast. brother behind the table (72y), then pan right to the cat (9)
    k = ease(seg(t, LT[9] - .3, LT[9] + .9))
    cam = (lerp(172, 300, k), lerp(118, 130, k), lerp(1.45, 1.75, k) + (t - LT[8]) * .01)
    focus = 1.0
    img = np.zeros((OH, OW, 4), np.float32)
    img = over(img, place(KIT, cam, .92, focus, 4))
    img = over(img, place(sprite_layer(bro, 'walk', 2, 0, 172, 190 + int(abs(math.sin(t * 3))), W=380, H=230, rim=(1, .9, .7), rim_dir=1, scale=2), cam, 1.0, focus))
    img = over(img, place(chair_and_cat(int(t * 24)), cam, 1.0, focus))
    if t > LT[8] + 2.2:
        img = over(img, place(tag_layer(['72Y'], 172, 98 + 2 * math.sin(t * 2), 380, 230, ease(seg(t, LT[8] + 2.2, LT[8] + 2.8))), cam, 1.0, focus))
    if t > LT[10]:
        img = over(img, place(tag_layer(['9Y'], 316, 104 + 2 * math.sin(t * 2), 380, 230, ease(seg(t, LT[10], LT[10] + .3))), cam, 1.0, focus))
    img = over(img, place(TAB, (cam[0], cam[1] + 4, cam[2]), 1.18, focus, 7))
    rgb = img[..., :3] + light_shafts(t, (OW * .5 - (cam[0] - 229) * cam[2] * PS * .92, OH * .5 + (60 - cam[1]) * cam[2] * PS * .92), 118, 1300, 260, (1, .88, .62), .22)[..., :3]
    rgb = dust(np.dstack([rgb, np.ones((OH, OW), np.float32)]), t, (0, 0, OW, OH))[..., :3]
    return post(rgb, warm=1.03, bloom=.35)

def frame(i):
    t = i / FPS
    rgb = shot_bedroom(t) if t < LT[8] - .1 else shot_kitchen(t)
    fade = min(seg(t, 0, .4), 1 - seg(t, T_END - .5, T_END))
    cut = 1 - clamp(1 - abs(t - (LT[8] - .1)) / .12) * .0
    rgb = rgb * fade
    cv2.imwrite(f'{FR}{i:04d}.png', (rgb[..., ::-1] * 255).astype(np.uint8))

if __name__ == '__main__':
    n = int(T_END * FPS); rng_ = range(n)
    if len(sys.argv) > 1: rng_ = [int(float(x) * FPS) for x in sys.argv[1:]]
    else:
        from concurrent.futures import ProcessPoolExecutor
        with ProcessPoolExecutor(2) as ex: list(ex.map(frame, rng_, chunksize=12))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{FR}%04d.png', '-ss', '0', '-t', str(T_END), '-i', VOICE,
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', OUT], check=True)
        print('done'); sys.exit()
    for i in rng_: frame(i)
