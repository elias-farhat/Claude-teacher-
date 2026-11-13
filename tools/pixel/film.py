"""Full HD-2D pixel film: 'What if you could see everyone's countdown' (voice_countdown.wav, 243 s).
usage: python3 film.py            -> render all + mux
       python3 film.py 12.5 40 ... -> render single test frames into /home/claude/out/film/"""
import sys, os, json, math, subprocess
import numpy as np, cv2
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from px_engine import *
import sets, cast
import hd2d_pov as H0

FPS = 24
VOICE = '/home/claude/claude-teacher-/engine/voice_countdown.wav'
TJ = json.load(open('/home/claude/claude-teacher-/engine/timing_countdown.json'))
def LT(i): return TJ[i]['t0']
def LE(i): return TJ[i]['t1']
DUR = 243.12
FR = '/home/claude/out/film/'; os.makedirs(FR, exist_ok=True)
OUT = '/home/claude/out/countdown_hd2d.mp4'

YOU, MOM, LEO, WAL, DRV, BAK = cast.you(), cast.mom(), cast.leo(), cast.walter(), cast.driver(), cast.baker()
YOU_SAD = cast.you('sad'); LEO_SHOCK = cast.leo('shock'); WAL_CLOSE = cast.walter('closing')
CROWD = [cast.crowd(i) for i in range(6)]
UP, LEFT, DOWN, RIGHT = 0, 1, 2, 3

STREET = sets.street(); STREET_EVE = sets.street(evening=1); CROSS_EVE = sets.street(crosswalk=True, evening=1)
PARK = sets.park(); PARK_EVE = sets.park(evening=1); BENCH_B = sets.bench(part='back'); BENCH_F = sets.bench(part='front')
NIGHT = sets.night_room(); MIRROR_F = sets.mirror_frame(); MIRROR_G = sets.mirror_glass(); BOARD = sets.chalkboard()
BUS = sets.bus(); BUS_IN = sets.bus_interior(); STROLLER = sets.stroller(); LIGHT_R, LIGHT_G = sets.traffic_light(False), sets.traffic_light(True)

def walkcol(t, rate=9): return 1 + int(t * rate) % 8
def hms(sec):
    sec = max(0, int(sec)); h, r = divmod(sec, 3600); m, s = divmod(r, 60); return f'{h:02d}:{m:02d}:{s:02d}'

# ---------------- generic building blocks ----------------
def scene(layers, cam, focus=1.0):
    img = blank()
    for L in layers:
        if L is None: continue
        im, depth = L[0], L[1]; dof = L[2] if len(L) > 2 else 6; key = L[3] if len(L) > 3 else None
        c = cam if len(L) < 5 else L[4]
        img = over(img, place(im, c, depth, focus, dof, key))
    return img

def screen_img(img, pil, x, y, s, anchor='c'):
    """composite a small PIL RGBA at screen position (x,y), nearest-scaled by s"""
    a = arr(pil); a[..., :3] *= a[..., 3:4]; h, w = a.shape[:2]
    a = cv2.resize(a, (int(w * s), int(h * s)), interpolation=cv2.INTER_NEAREST); h, w = a.shape[:2]
    x0 = int(x - w / 2) if anchor in ('c', 'b') else int(x); y0 = int(y - h / 2) if anchor == 'c' else (int(y - h) if anchor == 'b' else int(y))
    X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(OW, x0 + w), min(OH, y0 + h)
    if X1 <= X0 or Y1 <= Y0: return img
    src = a[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]; img[Y0:Y1, X0:X1] = src + img[Y0:Y1, X0:X1] * (1 - src[..., 3:4]); return img

def finish(img, t, shaft=None, dust_amt=1.0, **pp):
    rgb = img[..., :3].copy()
    if shaft: rgb = rgb + shafts(t, *shaft)
    if dust_amt: rgb = dust(rgb, t, amt=dust_amt)
    return post(rgb, t, **pp)

def portrait_shot(t, who, mood, bg, bgcam, talk=None, tagl=None, tag_a=1., shake=0., grade=(1.04, 1, .94), shaft=None, blink=True, x=OW / 2, extra=None):
    img = scene([(bg, .8, 9, id(bg))], bgcam)
    img[..., :3] *= .82
    m = mood
    if talk and talk[0] <= t <= talk[1] and int(t * 8) % 2 == 0: m = 'talk' if mood in ('neutral', 'worry') else ('happy' if mood == 'smile' else mood)
    if blink and m in ('neutral', 'talk', 'worry', 'shock') and (t * 1.0) % 3.7 < .13: m = 'closed'
    bob = math.sin(t * 2.1) * 4; jx = (math.sin(t * 61) * shake * 6); jy = math.cos(t * 47) * shake * 4
    img = screen_img(img, portrait(who, m), x + jx, OH + 110 + bob + jy, 6.6, 'b')
    if tagl: img = screen_img(img, tag(tagl, 60, 1, 120, 12 + 10 * len(tagl), tag_a), x, 70, 5, 'c')
    if extra: img = extra(img)
    return finish(img, t, shaft, dust_amt=.6, grade=grade, bloom=.35)

def walkers(t, W, H, specs, scale=1):
    """specs: (sprite, x0, speed px/s, y_feet, dir_row, phase) -> one RGBA layer with all walkers + list of head positions"""
    im = Image.new('RGBA', (W, H)); heads = []
    for spr, x0, v, y, row, ph in sorted(specs, key=lambda s: s[3]):
        x = x0 + v * t
        col = walkcol(t + ph) if v else 0
        im.alpha_composite(sprite(spr, 'walk', row, col, x, y, W, H, scale=scale)); heads.append((x, y - 56 * scale))
    return im, heads

def tags_layer(W, H, items, a=1.0):
    im = Image.new('RGBA', (W, H))
    for lines, x, y in items: im.alpha_composite(tag(lines, x, y - 10 * len(lines), W, H, a))
    return im

def rand_tag(k, t=None, spin=False):
    h = (k * 2654435761) % 1000
    if spin: return [f'{int((t * 37 + k * 13) % 90):02d}Y']
    return [f'{(h * 7) % 88 + 3}Y']

# ---------------- shots ----------------
def sh_street_intro(t):
    # 20.43 You step outside -> 23.3 everyone has one
    k = ease(seg(t, LT(11), LT(12) + .5)); cam = (lerp(250, 260, k), lerp(176, 160, k), lerp(2.6, 1.7, k))
    crowd = [(CROWD[0], 120, 14, 186, RIGHT, 0), (CROWD[1], 420, -16, 190, LEFT, .3), (CROWD[2], 60, 12, 192, RIGHT, .6), (CROWD[3], 330, -12, 186, LEFT, .1), (CROWD[4], 220, 9, 194, RIGHT, .4)]
    lt = t - LT(11); wl, heads = walkers(lt, 520, 230, crowd)
    a = ease(seg(t, LT(12), LT(12) + .6))
    lay = [(STREET, .9, 5, 'street'), (wl, 1.0)]
    if a > 0: lay.append((tags_layer(520, 230, [(rand_tag(i), x, y) for i, (x, y) in enumerate(heads)], a), 1.0))
    img = scene(lay, cam)
    lids = 0
    return finish(img, t, ((OW * .15, -80), 60, 1300, 260, (1, .9, .65), .22), grade=(1.05, 1, .93))

def sh_bus(t):
    cam = (405, 166, 2.5 + (t - LT(13)) * .05)
    drv = sprite(DRV, 'walk', DOWN, 0, 400, 196, 520, 230, scale=1)
    lay = [(STREET, .9, 5, 'street'), (BUS_IN, 1.0, 6, 'busin'), (drv, 1.0), (BUS, 1.0, 6, 'bus')]
    lay.append((tag(['38Y'], 400, 124, 520, 230, ease(seg(t, LT(13) + .15, LT(13) + .5))), 1.0))
    return finish(scene(lay, cam), t, ((OW * .1, -80), 62, 1300, 240, (1, .9, .65), .2))

def sh_baker(t):
    cam = (358, 150, 2.6 + (t - LT(14)) * .05)
    bk = sprite(BAK, 'walk', DOWN, 0, 362, 172, 520, 230, scale=1)
    lay = [(STREET, .9, 5, 'street'), (bk, 1.0), (tag(['19Y'], 362, 100, 520, 230, ease(seg(t, LT(14), LT(14) + .3))), 1.0)]
    return finish(scene(lay, cam), t, ((OW * .1, -80), 62, 1300, 240, (1, .9, .65), .2))

def sh_stroller(t):
    k = ease(seg(t, LT(15), LT(16) + .6)); cam = (lerp(166, 150, k), lerp(170, 166, k), lerp(2.3, 2.7, k))
    lt = t - LT(15); mx = 172 + lt * 2
    st = Image.new('RGBA', (520, 230)); st.alpha_composite(STROLLER, (int(lt * 2), 0))
    mom2 = sprite(CROWD[4], 'walk', LEFT, walkcol(lt, 6), mx + 14, 196, 520, 230, scale=1)
    lay = [(STREET, .9, 5, 'street'), (mom2, 1.0), (st, 1.0)]
    a = ease(seg(t, LT(16), LT(16) + .4))
    if a > 0: lay.append((tag(['84Y'], 146 + lt * 2, 158, 520, 230, a), 1.0))
    return finish(scene(lay, cam), t, ((OW * .1, -80), 62, 1300, 240, (1, .9, .65), .2))

def sh_wide_tags(t):
    lt = t - LT(17); cam = (260, lerp(150, 140, ease(seg(lt, 0, 5))), lerp(1.3, 1.1, ease(seg(lt, 0, 5))))
    crowd = [(CROWD[i % 6], 40 + i * 50 + (i % 3) * 7, (5 + i % 4 * 2) * (1 if i % 2 else -1), 182 + (i % 3) * 7, RIGHT if i % 2 else LEFT, i * .3) for i in range(9)]
    wl, heads = walkers(lt, 520, 230, crowd)
    tl = tags_layer(520, 230, [(rand_tag(i, t, spin=False), x, y) for i, (x, y) in enumerate(heads)])
    return finish(scene([(STREET, .9, 4, 'street'), (wl, 1.0), (tl, 1.0)], cam), t, ((OW * .15, -80), 60, 1300, 260, (1, .9, .65), .22))

# ---- chalkboard facts ----
def board_shot(t, items, cam=None):
    """items: list of (t_start, kind, args); kind 'text' (x,y,str,size,color) | 'dots' | 'icon'. chalk reveal left->right"""
    if cam is None: cam = (150, 80, .98 + .01 * math.sin(t * .3))
    lay = Image.new('RGBA', (300, 170)); d = ImageDraw.Draw(lay)
    for ts, kind, a in items:
        if t < ts: continue
        p = ease(seg(t, ts, ts + .7))
        if kind == 'text':
            x, y, s, sz, col = a; tmp = Image.new('RGBA', (300, 170)); dd = ImageDraw.Draw(tmp); ptext(dd, (x, y), s, sz, col, 'ma', None)
            bb = tmp.getbbox()
            if bb: tmp = tmp.crop((0, 0, int(bb[0] + (bb[2] - bb[0]) * p) + 1, 170)); lay.alpha_composite(tmp)
        elif kind == 'fn': a(d, t - ts, p)
    img = scene([(BOARD, 1.0, 4, 'board'), (lay, 1.0)], cam)
    return finish(img, t, ((OW * .05, -60), 58, 1300, 240, (1, .9, .68), .25), dust_amt=.8, grade=(1.03, 1, .95), bloom=.25)

CHALK, YEL, BLU, RED, GRN = (240, 240, 228), (250, 214, 120), (150, 210, 250), (250, 120, 110), (150, 230, 150)
def dots_fn(n_on, dim=0.0):
    def f(d, lt, p):
        n = int(268 * min(1, lt / 2.5)) if n_on is None else 268
        for i in range(n):
            x = 40 + (i % 34) * 6.6; y = 76 + (i // 34) * 6
            c = tuple(int(lerp(v, 90, dim)) for v in YEL)
            d.rectangle((x, y, x + 3, y + 3), fill=c)
    return f
def icon_dollar_x(x, y):
    def f(d, lt, p): ptext(d, (x, y), '$', 22, (180, 230, 160), 'mm', None); (d.line((x - 12, y - 12, x + 12, y + 12), fill=RED, width=3) if lt > .8 else None)
    return f
def icon_star_x(x, y):
    def f(d, lt, p):
        pts = [(x + 12 * math.cos(math.radians(-90 + k * 36)) * (1 if k % 2 == 0 else .45), y + 12 * math.sin(math.radians(-90 + k * 36)) * (1 if k % 2 == 0 else .45)) for k in range(10)]
        d.polygon(pts, fill=YEL)
        if lt > .6: d.line((x - 12, y - 12, x + 12, y + 12), fill=RED, width=3)
    return f
def icon_heart(x, y, s=1.0):
    def f(d, lt, p):
        k = s * (1 + .08 * math.sin(lt * 6)); r = 7 * k
        d.ellipse((x - 2 * r, y - r, x, y + r), fill=RED); d.ellipse((x, y - r, x + 2 * r, y + r), fill=RED); d.polygon([(x - 2 * r + 1, y + 2), (x + 2 * r - 1, y + 2), (x, y + 2.6 * r)], fill=RED)
    return f
def bar_fn(d, lt, p):
    w = 200 * min(1, lt / 1.5); d.rectangle((50, 92, 50 + w, 100), fill=GRN); ptext(d, (50, 104), '0', 8, CHALK, 'ma', None)
    if lt > 1.5: ptext(d, (250, 104), '73', 8, CHALK, 'ma', None)
def ruler_fn(d, lt, p):
    for k in range(9):
        x = 40 + k * 28
        if lt > k * .15: d.line((x, 106, x, 112), fill=CHALK); ptext(d, (x, 114), str(1938 + k * 11) if k % 2 == 0 else '', 7, CHALK, 'ma', None)
    d.line((40, 109, 40 + 224 * min(1, lt / 1.4), 109), fill=CHALK, width=2)

def sh_facts1(t):
    items = [(LT(18), 'text', (150, 28, 'AVERAGE HUMAN LIFE', 11, CHALK)), (LT(18) + 1.2, 'text', (150, 48, '~ 73 YEARS', 18, YEL))]
    if t < LT(19): items.append((LT(18) + 1.6, 'fn', bar_fn))
    else:
        items = [(LT(18), 'text', (150, 24, '73 YEARS =', 11, CHALK)), (LT(19), 'text', (150, 40, '~ 26,800 DAYS', 18, YEL)), (LT(19) + .3, 'fn', dots_fn(None, dim=ease(seg(t, LT(20), LT(21) + .5)) * .85))]
        if t > LT(21): items.append((LT(21), 'text', (150, 126, 'WE NEVER COUNT THEM', 10, BLU)))
    return board_shot(t, items)

def sh_facts2(t):
    if t < LT(45):
        items = [(LT(43), 'text', (150, 28, 'HARVARD STUDY', 13, CHALK)), (LT(43) + 1.0, 'text', (150, 50, 'SINCE 1938', 16, YEL)), (LT(43) + 2.0, 'fn', ruler_fn)]
        if t > LT(44): items.append((LT(44), 'text', (150, 80, 'ONE OF THE LONGEST STUDIES OF ADULT LIFE', 8, BLU)))
    else:
        items = [(LT(45), 'text', (150, 24, 'STRONGEST CLUE TO A LONG LIFE?', 10, CHALK)), (LT(45) + 1.6, 'fn', icon_dollar_x(80, 74)), (LT(45) + 1.6, 'text', (80, 96, 'MONEY', 9, CHALK)),
                 (LT(46), 'fn', icon_star_x(150, 74)), (LT(46), 'text', (150, 96, 'FAME', 9, CHALK)),
                 (LT(47), 'fn', icon_heart(220, 70, 1.2)), (LT(47) + .3, 'text', (220, 96, 'CLOSE', 9, YEL)), (LT(47) + .5, 'text', (220, 108, 'RELATIONSHIPS', 9, YEL))]
    return board_shot(t, items)

def car_fn(d, lt, p):
    x = 60 + (lt * 40) % 180; d.rectangle((x, 80, x + 30, 92), fill=RED); d.rectangle((x + 6, 72, x + 22, 80), fill=RED); d.ellipse((x + 3, 89, x + 11, 97), fill=CHALK); d.ellipse((x + 19, 89, x + 27, 97), fill=CHALK)
def sh_facts3(t):
    items = [(LT(77), 'text', (150, 24, 'ROAD CRASHES', 12, CHALK)), (LT(77) + 1.2, 'text', (150, 42, '~1.2 MILLION DEATHS / YEAR', 11, YEL)), (LT(77) + 2, 'fn', car_fn)]
    if t > LT(78): items.append((LT(78), 'text', (150, 104, 'MORE THAN 2 EVERY MINUTE', 10, RED)))
    if t > LT(79): items = [(LT(79), 'text', (150, 30, '#1 CAUSE OF DEATH', 13, CHALK)), (LT(79) + 1.5, 'text', (150, 54, 'AGES 5 - 29', 18, YEL))]
    if t > LT(80): items.append((LT(80), 'text', (150, 100, 'SO THE NUMBERS CAN CHANGE', 10, GRN)))
    return board_shot(t, items)

def sh_facts4(t):
    if t < LT(101):
        items = [(LT(98), 'text', (150, 26, "SO WHAT'S REAL?", 14, YEL)), (LT(99), 'text', (150, 58, 'NO ONE CAN SEE A COUNTDOWN', 10, CHALK)),
                 (LT(100), 'text', (150, 80, 'LIFE EXPECTANCY = AN AVERAGE', 10, CHALK)), (LT(100) + 1.4, 'text', (150, 96, 'NOT A PROMISE', 12, RED))]
    else:
        items = [(LT(101), 'text', (80, 22, 'SHORTENS', 11, RED)), (LT(101) + 1.5, 'text', (80, 44, 'SMOKING', 9, CHALK)), (LT(101) + 2.2, 'text', (80, 60, 'SITTING STILL', 9, CHALK)), (LT(101) + 3.0, 'text', (80, 76, 'LONELINESS', 9, CHALK))]
        if t > LT(102): items += [(LT(102), 'text', (220, 22, 'LENGTHENS', 11, GRN)), (LT(103), 'text', (220, 44, 'SLEEP', 9, CHALK)), (LT(103) + .9, 'text', (220, 60, 'MOVEMENT', 9, CHALK)), (LT(103) + 1.8, 'text', (220, 76, 'PEOPLE YOU LOVE', 9, YEL)), (LT(103) + 1.8, 'fn', icon_heart(220, 104, .9))]
    return board_shot(t, items)

def sh_days(t):
    lt = t - LT(22); cam = (lerp(200, 280, ease(seg(lt, 0, 3.3))), 158, 1.6)
    crowd = [(YOU, 140, 16, 196, RIGHT, 0)] + [(CROWD[i], 40 + i * 90, (10 + i * 3) * (1 if i % 2 else -1), 184 + (i % 2) * 6, RIGHT if i % 2 else LEFT, i * .4) for i in range(5)]
    wl, heads = walkers(lt, 520, 230, crowd)
    tl = tags_layer(520, 230, [(rand_tag(i + 3, t, spin=False), x, y) for i, (x, y) in enumerate(heads[1:]) if True], .9)
    img = scene([(STREET, .9, 4, 'street'), (wl, 1.0), (tl, 1.0)], cam)
    card = Image.new('RGBA', (80, 20)); d = ImageDraw.Draw(card); ptext(d, (40, 4), 'DAY 1' if t < LT(23) else 'DAY 2', 12, (255, 255, 255), 'ma', (0, 0, 0))
    img = screen_img(img, card, OW * .8, 64, 5)
    return finish(img, t, ((OW * .15, -80), 60, 1300, 260, (1, .9, .65), .18), sat=1.0 if t < LT(23) else .75)

# ---- park / Walter ----
WAL_ZERO = LT(38)
def walter_sec(t): return 360 * (1 - clamp((t - LT(26)) / (WAL_ZERO - LT(26))))
def park_layers(t, you_state=None, eve=False, flown=0.0, tag_a=1.0, zero_glow=0.0):
    W, Hh = 420, 230; bg = PARK_EVE if eve else PARK
    ppl = Image.new('RGBA', (W, Hh))
    walt = WAL_CLOSE if t > LT(37) else WAL
    ppl.alpha_composite(sprite(walt, 'sit', DOWN, 0, 184, 186, W, Hh))
    if you_state:
        kind, x = you_state
        if kind == 'walk': ppl.alpha_composite(sprite(YOU, 'walk', LEFT, walkcol(t), x, 192, W, Hh))
        else: ppl.alpha_composite(sprite(YOU, 'sit', DOWN, 0, x, 186, W, Hh))
    lay = [(bg, .88, 5, 'parkE' if eve else 'park'), (BENCH_B, 1.0, 6, 'benchb'), (ppl, 1.0), (BENCH_F, 1.0, 6, 'benchf'), (sets.pigeons(t, flown=flown), 1.0)]
    if tag_a > 0:
        s = walter_sec(t); col = (255, 150, 140) if s < 60 else (140, 245, 255)
        tg = tag([hms(s)] if s > 0 else ['00:00:00'], 184, 74, W, Hh, tag_a * (1 - zero_glow), col=col)
        lay.append((tg, 1.0))
    return lay

def sh_park_intro(t):
    lt = t - LT(24); push = ease(seg(t, LT(25), LT(26) + .6))
    cam = (lerp(220, 186, push), lerp(140, 104, push), lerp(1.3, 2.0, push))
    return finish(scene(park_layers(t, tag_a=ease(seg(t, LT(25) + .3, LT(26)))), cam), t, ((OW * .9, -80), 118, 1300, 260, (1, .92, .7), .25))

def sh_you_freeze(t):
    if t < LT(28): return portrait_shot(t, 'you', 'shock', PARK, (186, 128, 2.0), shake=.15)
    if t < LT(29):   # glance along the path (walking away is an option)
        k = ease(seg(t, LT(28), LT(29))); return finish(scene(park_layers(t), (lerp(186, 330, k), 150, 1.7)), t, ((OW * .9, -80), 118, 1300, 260, (1, .92, .7), .25))
    return portrait_shot(t, 'you', 'worry', PARK, (300, 140, 2.0))

def sh_sit_down(t):
    lt = t - LT(30); arrive = LT(30) + 1.2
    st = ('walk', lerp(300, 236, seg(t, LT(30), arrive))) if t < arrive else ('sit', 236)
    cam = (210, 140, 1.6)
    return finish(scene(park_layers(t, st), cam), t, ((OW * .9, -80), 118, 1300, 260, (1, .92, .7), .25))

def toast_bubble(img):
    b = Image.new('RGBA', (60, 44)); d = ImageDraw.Draw(b)
    d.rounded_rectangle((2, 2, 58, 34), 8, fill=(250, 248, 240), outline=(60, 50, 40)); d.polygon([(14, 34), (22, 34), (10, 42)], fill=(250, 248, 240))
    d.rounded_rectangle((18, 8, 42, 30), 4, fill=(60, 40, 30)); d.rectangle((21, 11, 39, 27), fill=(40, 26, 20))
    for k in range(3): d.line((26 + k * 5, 6, 28 + k * 5, 0), fill=(150, 150, 150))
    return screen_img(img, b, OW * .78, OH * .28, 5)
def sh_walter_talk(t):
    if t < LT(36):
        mood = 'neutral'; talk = (LT(32), LE(35)); extra = toast_bubble if LT(34) <= t < LT(36) else None
        if t < LT(32): talk = None
        if t > LT(33) and t < LT(34): mood = 'smile'
        return portrait_shot(t, 'walter', mood, PARK, (180, 120, 2.0), talk=talk, tagl=[hms(walter_sec(t))], extra=extra)
    return portrait_shot(t, 'walter', 'happy', PARK, (180, 120, 2.0), tagl=[hms(walter_sec(t))])

def sh_quiet(t):
    zg = ease(seg(t, WAL_ZERO + .2, WAL_ZERO + 1.6))
    cam = (200, 108, lerp(1.7, 1.9, seg(t, LT(37), LT(39))))
    img = scene(park_layers(t, ('sit', 236), eve=True, zero_glow=zg), cam)
    if WAL_ZERO <= t < WAL_ZERO + 2.4:     # the zero dissolves into rising light motes
        ph = seg(t, WAL_ZERO + .2, WAL_ZERO + 2.4)
        for k in range(26):
            x = OW / 2 + (184 - cam[0]) * PS * cam[2] + math.cos(k * 2.3) * ph * 180; y = OH / 2 + (74 - cam[1]) * PS * cam[2] - ph * (80 + 120 * ((k * 37) % 10) / 10)
            cv2.circle(img, (int(x), int(y)), 4, (1, .95, .8, 1), -1, cv2.LINE_AA) if ph < .98 else None
    return finish(img, t, ((OW * .9, -80), 118, 1400, 300, (1, .75, .5), .32), grade=(1.08, .98, .88))

def sh_smiling(t): return portrait_shot(t, 'walter', 'closed', PARK_EVE, (180, 120, 2.0), blink=False, grade=(1.08, .98, .88), shaft=((OW * .9, -80), 118, 1400, 300, (1, .75, .5), .3))
def sh_understand(t):
    if t < LT(41): return portrait_shot(t, 'you', 'sad', PARK_EVE, (220, 120, 2.0), grade=(1.08, .98, .88))
    k = ease(seg(t, LT(41), LT(43))); cam = (lerp(212, 210, k), lerp(140, 124, k), lerp(1.8, 1.05, k))
    return finish(scene(park_layers(t, ('sit', 236), eve=True, flown=ease(seg(t, LT(42), LT(42) + 3)), tag_a=0), cam), t, ((OW * .9, -80), 118, 1400, 300, (1, .75, .5), .32), grade=(1.08, .98, .88))

# ---- Friday / Leo ----
def leo_tag(t):
    L = []
    if t >= LT(52): L = ['0Y']
    if t >= LT(53): L = ['0Y 0D']
    if t >= LT(54): L = ['0Y 0D 2H']
    return L
def sh_friday(t):
    lt = t - LT(48); cam = (260, 146, 1.5)
    img = scene([(STREET, .9, 4, 'street')], cam)
    card = Image.new('RGBA', (120, 30)); d = ImageDraw.Draw(card); ptext(d, (60, 6), 'FRIDAY', 18, (255, 236, 160), 'ma', (40, 20, 10))
    img = screen_img(img, card, OW / 2, OH * .42, 9 * (1 + .05 * ease(seg(lt, 0, 2))))
    return finish(img, t, ((OW * .15, -80), 60, 1300, 260, (1, .9, .65), .22))
def sh_leo_arrive(t):
    lt = t - LT(49); arrive = 2.4
    x = lerp(470, 300, ease(seg(lt, 0, arrive)))
    l = sprite(LEO, 'run' if lt < arrive else 'walk', LEFT, int(lt * 12) % 8 if lt < arrive else 0, x, 196, 520, 230, scale=1)
    cam = (lerp(340, 300, ease(seg(lt, 0, arrive))), 160, 2.1)
    return finish(scene([(STREET, .9, 5, 'street'), (l, 1.0)], cam), t, ((OW * .15, -80), 60, 1300, 260, (1, .9, .65), .22))
def sh_leo_number(t):
    if t < LT(55):
        tl = leo_tag(t) or None
        return portrait_shot(t, 'leo', 'happy' if t < LT(50) + .3 else 'neutral', STREET, (300, 120, 2.0), tagl=tl, talk=None)
    return portrait_shot(t, 'you', 'shock', STREET, (300, 120, 2.0), shake=.25, grade=(1.0, .95, .95))
def sh_dont_tell(t): return portrait_shot(t, 'you', 'sad' if t < LT(57) else 'worry', STREET, (300, 120, 2.0))
def sh_long_way(t):
    if t >= LT(60): return portrait_shot(t, 'leo', 'neutral', STREET_EVE, (300, 120, 2.0), talk=(LT(60), LE(60)), tagl=[hms(2 * 3600 - (t - LT(54)) * 40)], grade=(1.07, .98, .9))
    lt = t - LT(58)
    ppl = Image.new('RGBA', (520, 230))
    ppl.alpha_composite(sprite(LEO, 'walk', RIGHT, walkcol(lt), 120 + lt * 14, 194, 520, 230, scale=1)); ppl.alpha_composite(sprite(YOU, 'walk', RIGHT, walkcol(lt + .4), 104 + lt * 14, 198, 520, 230, scale=1))
    tg = tag([hms(2 * 3600 - (t - LT(54)) * 40)], 120 + lt * 14, 124, 520, 230)
    cam = (114 + lt * 14, 156, 1.9)
    return finish(scene([(STREET_EVE, .9, 5, 'streetE'), (ppl, 1.0), (tg, 1.0)], cam), t, ((OW * .05, -80), 50, 1400, 300, (1, .75, .5), .3), grade=(1.07, .98, .9))

def leo_six(t): return 360 - (t - LT(61)) * (360 / (LT(66) - LT(61)))      # 6 minutes reach ~0 at the truck
def sh_crosswalk(t):
    lt = t - LT(61); green = t >= LT(63)
    # Leo steps forward at LT64, yanked back at LT65
    lx = 196
    if t >= LT(64): lx = 196 + 24 * ease(seg(t, LT(64), LT(64) + .5))
    if t >= LT(65): lx = lerp(lx, 190, ease(seg(t, LT(65), LT(65) + .25)))
    ppl = Image.new('RGBA', (520, 230))
    ppl.alpha_composite(sprite(YOU, 'walk', RIGHT, 0, 178, 198, 520, 230, scale=1))
    ppl.alpha_composite(sprite(LEO_SHOCK if t > LT(65) else LEO, 'walk', RIGHT, walkcol(t) if LT(64) <= t < LT(65) else 0, lx, 196, 520, 230, scale=1))
    lay = [(CROSS_EVE, .9, 5, 'crossE'), (LIGHT_G if green else LIGHT_R, .97, 5), (ppl, 1.0)]
    s = leo_six(t); tl = [hms(s)] if t < LT(66) + .5 else [f'{int(t * 47) % 90:02d}Y {int(t * 31) % 12}M']
    lay.append((tag(tl, lx, 126, 520, 230, col=(255, 150, 140) if s < 60 and t < LT(66) + .5 else (140, 245, 255)), 1.0))
    if t >= LT(66) - .3:
        tx = lerp(-260, 560, seg(t, LT(66) - .3, LT(67) + .4)); tr = sets.truck(int(tx)); lay.append((tr, 1.0))
    cam = (lerp(208, 214, ease(seg(t, LT(61), LT(66)))), 158, lerp(1.15, 1.4, ease(seg(t, LT(61), LT(66)))))
    if LT(66) - .3 <= t < LT(67) + .4: cam = (cam[0] + math.sin(t * 70) * 1.2, cam[1] + math.cos(t * 53) * .8, cam[2])
    img = scene(lay, cam)
    if LT(66) <= t < LT(67) + .3:   # motion smear
        img = cv2.blur(img, (31, 1))
    return finish(img, t, ((OW * .05, -80), 50, 1400, 300, (1, .75, .5), .28), grade=(1.07, .98, .9))
def sh_silence(t):
    k = 1 - ease(seg(t, LT(68), LT(69) + .8))
    ppl = Image.new('RGBA', (520, 230)); ppl.alpha_composite(sprite(YOU, 'walk', RIGHT, 0, 180, 198, 520, 230, scale=1)); ppl.alpha_composite(sprite(LEO_SHOCK, 'walk', LEFT, 0, 196, 196, 520, 230, scale=1))
    img = scene([(CROSS_EVE, .9, 6, 'crossE'), (ppl, 1.0)], (190, 162, 2.4))
    return finish(img, t, None, dust_amt=.3, sat=.25 + .5 * (1 - k), grade=(1.0, 1.0, 1.0), blur=2 * k)
def spin_tag(t):
    if t < LT(71): return [f'{int(t * 47) % 90:02d}Y {int(t * 31) % 12}M']
    if t < LT(72): return ['?' * 1 + 'Y']
    return ['61Y']
def sh_spin(t):
    if t < LT(73): return portrait_shot(t, 'leo', 'shock', CROSS_EVE, (200, 120, 2.0), tagl=spin_tag(t), grade=(1.06, .98, .92))
    if t < LT(75): return portrait_shot(t, 'leo', 'worry', CROSS_EVE, (200, 120, 2.0), shake=.35 if t < LT(74) else .15, talk=(LT(74), LE(74)), tagl=['61Y'])
    if t < LT(76): return portrait_shot(t, 'you', 'sad', CROSS_EVE, (200, 120, 2.0))
    ppl = Image.new('RGBA', (520, 230)); ppl.alpha_composite(sprite(LEO, 'walk', RIGHT, 0, 202, 196, 520, 230, scale=1)); ppl.alpha_composite(sprite(YOU, 'walk', LEFT, 0, 212, 198, 520, 230, scale=1))
    return finish(scene([(CROSS_EVE, .9, 6, 'crossE'), (ppl, 1.0), (tag(['61Y'], 204, 128, 520, 230), 1.0)], (206, 152, lerp(2.0, 2.3, seg(t, LT(76), LT(77))))), t, ((OW * .05, -80), 50, 1400, 300, (1, .75, .5), .3), grade=(1.08, .98, .9))

# ---- mirror ----
def sh_mirror(t):
    up = ease(seg(t, LT(83), LT(84) + .4))
    if LT(86) <= t < LT(89) or t >= LT(91):
        mood = 'neutral' if t < LT(89) else ('smile' if t >= LT(91) else 'neutral')
        return portrait_shot(t, 'you', mood, NIGHT, (170, 120, 2.0), grade=(.85, .92, 1.12), blink=True)
    refl = Image.new('RGBA', (340, 230)); refl.alpha_composite(MIRROR_G)
    rs = sprite(YOU, 'walk', DOWN, 0, 178, 206, 340, 230, scale=2, rim=(.7, .8, 1))
    mask = Image.new('L', (340, 230)); ImageDraw.Draw(mask).rectangle((120, 60, 220, 200), fill=255)
    rs.putalpha(Image.fromarray(np.minimum(np.asarray(rs)[..., 3], np.asarray(mask)))); refl.alpha_composite(rs)
    me = sprite(YOU, 'walk', UP, 0, 142, 228, 340, 230, scale=2, rim=(.7, .8, 1))
    lay = [(NIGHT, .92, 5, 'night'), (refl, 1.0), (MIRROR_F, 1.0, 5, 'mframe'), (me, 1.16, 8)]
    if LT(84) <= t < LT(86) + .5:   # where a number would be: a faint "?" that never resolves
        lay.append((tag(['?'], 178, 82, 340, 230, .35 + .25 * math.sin(t * 9), col=(170, 180, 200), plate=(20, 24, 40, 90), edge=(120, 130, 160, 120)), 1.0))
    cam = (172, lerp(140, 112, up), lerp(1.05, 1.4, ease(seg(t, LT(81), LT(83)))))
    return finish(scene(lay, cam), t, ((OW * .05, -40), 60, 1100, 200, (.6, .7, 1.0), .18), dust_amt=.3, grade=(.85, .92, 1.12), bloom=.5)

def sh_phone(t):
    msgs = [('r', 'Love you', ease(seg(t, LT(94), LT(94) + .2))), ('l', '<3', ease(seg(t, LT(95) + .4, LT(95) + .7)))]
    if t >= LT(97): return portrait_shot(t, 'you', 'smile', NIGHT, (170, 120, 2.0), grade=(.95, .95, 1.05))
    img = scene([(NIGHT, .9, 10, 'night')], (170, 130, 2.0)); img[..., :3] *= .6
    img = screen_img(img, sets.phone_screen(t, msgs), OW / 2, OH / 2 + 10 + math.sin(t * 1.3) * 4, 3.4)
    if t >= LT(96): img = screen_img(img, tag(['31Y'], 30, 1, 60, 14, ease(seg(t, LT(96), LT(96) + .4))), OW / 2 + 150, 130, 5)
    return finish(img, t, None, dust_amt=.2, grade=(.92, .95, 1.08), bloom=.6)

def sh_cta(t):
    # callback: the bedroom doorway in the morning, Mom with her number; questions as pixel cards
    cam = (175, 128, 1.15 + .01 * (t - LT(104)))
    img = scene([(H0.BED, 1.0, 3, 'bed'), (sprite(MOM, 'walk', DOWN, 0, 175, 196, 340, 230), 1.0), (tag(['31Y 4M 6D'], 175, 74, 340, 230), 1.0)], cam)
    card = Image.new('RGBA', (220, 40)); d = ImageDraw.Draw(card)
    if t < LT(105): s1 = 'YOUR OWN NUMBER?'
    elif t < LT(106): s1 = 'PAUSE TIME?'
    elif t < LT(107): s1 = 'COMMENT BELOW'
    else: s1 = 'LIKE + SUBSCRIBE'
    if t >= LT(107):
        d.rounded_rectangle((20, 6, 100, 30), 6, fill=(60, 60, 70)); ptext(d, (60, 11), 'LIKE', 11, (255, 255, 255), 'ma', None)
        d.rounded_rectangle((110, 6, 210, 30), 6, fill=(220, 40, 40)); ptext(d, (160, 11), 'SUBSCRIBE', 11, (255, 255, 255), 'ma', None)
    else: ptext(d, (110, 10), s1, 14, (255, 236, 160), 'ma', (30, 20, 10))
    img = screen_img(img, card, OW / 2, OH * .9, 4.5)
    return finish(img, t, ((OW * .1 - 0, -60), 62, 1100, 200, (1, .86, .6), .3))

SHOTS = [
    (0, LT(8) - .1, lambda t: H0.shot_bedroom(t)),
    (LT(8) - .1, LT(11), lambda t: H0.shot_kitchen(t)),
    (LT(11), LT(13) - .05, sh_street_intro), (LT(13) - .05, LT(14), sh_bus), (LT(14), LT(15), sh_baker), (LT(15), LT(17), sh_stroller),
    (LT(17), LT(18) - .2, sh_wide_tags), (LT(18) - .2, LT(22), sh_facts1), (LT(22), LT(24), sh_days),
    (LT(24), LT(27), sh_park_intro), (LT(27), LT(30), sh_you_freeze), (LT(30), LT(31), sh_sit_down), (LT(31), LT(37), sh_walter_talk),
    (LT(37), LT(39), sh_quiet), (LT(39), LT(40), sh_smiling), (LT(40), LT(43) - .2, sh_understand), (LT(43) - .2, LT(48), sh_facts2),
    (LT(48), LT(49), sh_friday), (LT(49), LT(50), sh_leo_arrive), (LT(50), LT(56), sh_leo_number), (LT(56), LT(58), sh_dont_tell), (LT(58), LT(61), sh_long_way),
    (LT(61), LT(68), sh_crosswalk), (LT(68), LT(70), sh_silence), (LT(70), LT(77) - .2, sh_spin), (LT(77) - .2, LT(81), sh_facts3),
    (LT(81), LT(93), sh_mirror), (LT(93), LT(98), sh_phone), (LT(98), LT(104), sh_facts4), (LT(104), DUR + 1, sh_cta),
]
def frame_at(t):
    for a, b, f in SHOTS:
        if a <= t < b:
            rgb = f(t)
            k = min(seg(t, a, a + .18), 1.0) if a > 0 else seg(t, 0, .4)      # quick dip-in at each cut
            k = min(k, 1 - seg(t, DUR - .6, DUR))
            return rgb * (.25 + .75 * k) if a > 0 and t < DUR - .6 else rgb * k
    return np.zeros((OH, OW, 3), np.float32)

def render(i):
    t = i / FPS; rgb = frame_at(t)
    cv2.imwrite(f'{FR}{i:05d}.png', (np.clip(rgb, 0, 1)[..., ::-1] * 255).astype(np.uint8)); return i

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'ranges':
        idx = []
        for r in sys.argv[2:]:
            a, b = map(float, r.split('-')); idx += list(range(int(a * FPS), int(b * FPS) + 1))
        from concurrent.futures import ProcessPoolExecutor
        with ProcessPoolExecutor(2) as ex: list(ex.map(render, idx, chunksize=12))
        sys.exit()
    if len(sys.argv) > 1 and sys.argv[1] != 'all':
        for x in sys.argv[1:]: render(int(round(float(x) * FPS)))
        sys.exit()
    n = int(DUR * FPS)
    from concurrent.futures import ProcessPoolExecutor
    with ProcessPoolExecutor(2) as ex: list(ex.map(render, range(n), chunksize=24))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{FR}%05d.png', '-i', VOICE, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', OUT], check=True)
    print('done')
