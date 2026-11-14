"""Countdown film (Arabic) in the reference doodle-explainer style. No narration subtitles (reference has none): labels, cards, calendars, numbers.
usage: python3 film_doodle.py <timing.json> <voice.wav> [test times | all]"""
import sys, os, json, math, subprocess
import numpy as np, cv2
from PIL import ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doodle import *

_D = json.load(open(sys.argv[1])); VOICE = sys.argv[2]
TJ, HOOK = _D['main'], _D['hook']; HOOK_END = HOOK[-1]['t1'] + .5
def L(i): return TJ[i]['t0']
def E(i): return TJ[i]['t1']
DUR = TJ[-1]['t1'] + 1.5; FPS = 24
FR = '/home/claude/out/film_doodle/'; os.makedirs(FR, exist_ok=True); OUT = '/home/claude/out/countdown_doodle.mp4'

def hms(sec, full=False):
    sec = max(0, int(sec)); h, r = divmod(sec, 3600); m, s = divmod(r, 60)
    return f'{h:02d}:{m:02d}:{s:02d}' if full or h else f'{m:02d}:{s:02d}'
def rnd(k): return (k * 2654435761) % 997

MOM = Who(0, scarf=(70, 90, 140), dress=(150, 110, 160))
YOU = Who(1, shirt=(60, 140, 150), hair='short', hair_col=(70, 46, 30))
BRO = Who(0, shirt=(200, 70, 60), hair='kid', hair_col=(90, 60, 40), kid=True)
ALI = Who(2, shirt=(226, 120, 50), hair='spiky', hair_col=(30, 24, 26))
WALT = Who(0, shirt=(70, 110, 80), hair='bald', hair_col=(230, 230, 230), beard=(236, 236, 236), glasses=True, old=True)
DRV = Who(2, shirt=(40, 70, 130), hair='short', hair_col=(30, 24, 26), cap=(40, 70, 130))
BAK = Who(1, shirt=(245, 245, 245), coat=True, hair='short', hair_col=(40, 30, 26), chef=True)
CROWD = [Who(1, scarf=(150, 70, 70), dress=(200, 170, 120)), Who(0, shirt=(70, 120, 196), hair='short', hair_col=(120, 80, 50)), Who(3, shirt=(230, 190, 70), hair='short', hair_col=(30, 24, 26)),
         Who(2, scarf=(60, 120, 110), dress=(110, 90, 150)), Who(0, shirt=(250, 250, 250), coat=True, glasses=True, hair='short', hair_col=(90, 60, 40)), Who(1, shirt=(200, 80, 90), hair='short', hair_col=(50, 34, 26))]
HOST = Who(2, shirt=(60, 64, 80), hair='none', hair_col=(0, 0, 0))

_bg = {}
def bg(name):
    if name not in _bg:
        _bg[name] = {'city': lambda: city_bg(), 'city_eve': lambda: city_bg(True), 'cross': lambda: city_bg(True, True), 'bed': lambda: room_bg((150, 138, 112), floor=(120, 96, 76)),
                     'kitchen': lambda: room_bg((180, 150, 110), floor=(150, 120, 90)), 'night': lambda: room_bg((64, 72, 104), floor=(60, 52, 60)), 'park': lambda: park_bg(), 'park_eve': lambda: park_bg(True),
                     'blue': blueprint_bg, 'dark': dark_bg}[name]()
    return _bg[name]
def canvas(name): p = Pic(); p.im = bg(name).copy(); p.d = ImageDraw.Draw(p.im); return p

def door(p, x0, x1, top=210, bottom=520):
    p.rect(x0 - 16, top - 16, x1 + 16, bottom, (120, 84, 60), OL, 4); p.rect(x0, top, x1, bottom, (250, 226, 170), OL, 3)
def bench(p, x0, x1, y, front=True):
    if not front:
        for k in range(3): p.rect(x0, y - 120 + k * 28, x1, y - 102 + k * 28, (160, 110, 70), OL, 3, r=4)
        for x in (x0 + 20, x1 - 20): p.rect(x - 6, y - 126, x + 6, y, (70, 70, 76), OL, 2)
    else:
        p.rect(x0 - 10, y - 30, x1 + 10, y - 12, (176, 122, 78), OL, 3, r=4); p.rect(x0 + 14, y - 12, x0 + 26, y + 40, (70, 70, 76), OL, 2); p.rect(x1 - 26, y - 12, x1 - 14, y + 40, (70, 70, 76), OL, 2)
def bubble(p, cx, cy, w=200, h=130):
    p.poly([(cx - 50, cy + h / 2 - 6), (cx - 90, cy + h / 2 + 46), (cx - 10, cy + h / 2 - 6)], (255, 255, 255)); p.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, (255, 255, 255), OL, 4, r=30)
    p.rect(cx - 52, cy + h / 2 - 8, cx - 8, cy + h / 2 + 2, (255, 255, 255), None, 0)
def heart(p, cx, cy, r, col=(220, 60, 80)):
    pts = [(cx + r * 16 * math.sin(a) ** 3 / 16, cy - r * (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)) / 16) for a in np.linspace(0, 2 * math.pi, 40)]
    p.poly(pts, col, OL, 4)
def traffic(p, x, green):
    p.rect(x - 6, 260, x + 6, 520, (70, 70, 76), OL, 2); p.rect(x - 34, 150, x + 34, 280, (50, 50, 56), OL, 4, r=10)
    p.circ(x, 185, 22, (240, 60, 50) if not green else (90, 30, 30), OL, 3); p.circ(x, 245, 22, (60, 220, 110) if green else (30, 70, 40), OL, 3)
def truck(p, x):
    p.rect(x, 300, x + 440, 610, (210, 60, 50), OL, 5, r=10); p.rect(x + 440, 400, x + 580, 610, (230, 230, 232), OL, 5, r=10); p.rect(x + 470, 420, x + 560, 490, (150, 190, 220), OL, 4, r=6)
    for wx in (x + 90, x + 340, x + 510): p.circ(wx, 612, 40, (40, 40, 44), OL, 5); p.circ(wx, 612, 16, (150, 150, 156), OL, 3)
    for k in range(5): p.line([(x - 40 - k * 50, 360 + k * 50), (x - 200 - k * 50, 360 + k * 50)], (255, 255, 255, 180), 6)
def bus(p, x):
    p.rect(x, 240, x + 520, 560, (236, 186, 50), OL, 5, r=24); p.rect(x, 500, x + 520, 520, (200, 150, 40), None, 0)
    for k in range(4): p.rect(x + 170 + k * 84, 280, x + 236 + k * 84, 360, (150, 190, 220), OL, 4, r=8)
    p.circ(x + 100, 560, 40, (40, 40, 44), OL, 5); p.circ(x + 420, 560, 40, (40, 40, 44), OL, 5)
def stroller(p, x, y):
    p.pie(x, y - 60, 80, 70, 180, 360, (120, 150, 210), OL, 4); p.rect(x - 80, y - 60, x + 80, y - 20, (100, 130, 196), OL, 4, r=8)
    p.line([(x + 80, y - 40), (x + 130, y - 120)], OL, 6); p.circ(x - 50, y, 22, (50, 50, 54), OL, 4); p.circ(x + 50, y, 22, (50, 50, 54), OL, 4)
def lids(img, k):
    if k <= 0: return img
    h = k * H * .52; m = np.zeros((H, W), np.float32)
    cv2.ellipse(m, (W // 2, int(-H * .6 + h)), (int(W * .9), int(H * .62)), 0, 0, 360, 1, -1); cv2.ellipse(m, (W // 2, int(H * 1.6 - h)), (int(W * .9), int(H * .62)), 0, 0, 360, 1, -1)
    m = cv2.GaussianBlur(m, (0, 0), 25)[..., None]; return img * (1 - m)
def push(t, a, b, z0=1.0, z1=1.07): return lerp(z0, z1, ease(seg(t, a, b)))

# ---------------- shots ----------------
def sh_hook(t):
    h = HOOK; p = canvas('city')
    person(p, YOU, 470, 600, 300, 'stand', t, 'normal' if t < h[3]['t0'] else 'shock', look=1)
    hx, hy, r = person(p, ALI, 790, 600, 300, 'stand', t, 'happy')
    tag = '...' if t < h[1]['t0'] else ('0 سنة' if t < h[2]['t0'] else ('0 سنة · 0 يوم' if t < h[3]['t0'] else None))
    if tag: label(p, hx, hy - r - 40, tag, 28, 'red')
    else: big_number(p, hx, hy - r - 90, 'ساعتان', None, size=86)
    rw = seg(t, HOOK_END - .7, HOOK_END)
    return post(p.out(), t, zoom=push(t, 0, h[3]['t1'], 1.0, 1.15) + .2 * rw, cy=330, shake=10 * rw + (2 if t >= h[3]['t0'] else 0), desat=.8 * rw, flash=.9 * rw ** 3, red=.5 if h[3]['t0'] <= t < HOOK_END - .7 else 0)

def sh_tuesday(t):
    p = canvas('dark'); calendar(p, W / 2, H / 2 - 20, 'صباح يوم', 'الثلاثاء'.strip(), None, 1.25) if False else None
    w, h = 300, 260; cx, cy = W / 2, H / 2
    p.rect(cx - w / 2 + 6, cy - h / 2 + 8, cx + w / 2 + 6, cy + h / 2 + 8, (0, 0, 0, 110), None, 0, r=14); p.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, (246, 242, 234), OL, 3, r=14)
    p.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2 + 64, (205, 52, 46), OL, 3, r=14); p.rect(cx - w / 2 + 2, cy - h / 2 + 40, cx + w / 2 - 2, cy - h / 2 + 64, (205, 52, 46), None, 0)
    p.text((cx, cy - h / 2 + 33), 'صباح', 32, (255, 255, 255)); p.text((cx, cy + 34), 'الثلاثاء', 70, (34, 30, 32))
    return post(p.out(), t, zoom=push(t, L(0) - .3, L(1), .9, 1.0))

def sh_room(t):
    p = canvas('bed'); wall_clock(p, 1040, 200, 70, 7 + t / 3600 * 60); door(p, 520, 760)
    hx, hy, r = person(p, MOM, 640, 520, 300, 'stand', t, 'smile')
    parts = []
    if t >= L(4): parts.append('31 سنة')
    if t >= L(5): parts.append('4 أشهر')
    if t >= L(6): parts.append('6 أيام')
    if t >= L(2) + .3: label(p, hx, hy - r - 50, ' · '.join(parts) if parts else '؟؟', 30, 'cream', ease(seg(t, L(2) + .3, L(3))))
    if t >= L(7): label(p, hx, hy - r - 98, hms(13 * 3600 + 22 * 60 + 7 - (t - L(7)), True), 26, 'red')
    img = post(p.out(), t, zoom=push(t, L(3), L(8), 1.0, 1.12), cy=300)
    tt = t - L(1) + .2
    k = (1 - ease(seg(tt, .2, 1.4))) * .95 + .5 * (1 - ease(seg(tt, 1.5, 2.4))) * ease(seg(tt, .9, 1.5))
    img = lids(img, clamp(k))
    if tt < 2.6: img = cv2.GaussianBlur(img, (0, 0), 1 + 8 * (1 - ease(seg(tt, .2, 2.6))))
    return img

def sh_kitchen(t):
    p = canvas('kitchen'); p.rect(860, 150, 1100, 330, (170, 210, 230), OL, 5); p.line([(980, 150), (980, 330)], OL, 4)
    hx, hy, r = person(p, BRO, 470, 600, 250, 'sit', t, 'smile')
    p.rect(260, 470, 700, 500, (176, 122, 78), OL, 4); p.rect(280, 500, 300, 640, (140, 96, 60), OL, 3); p.rect(660, 500, 680, 640, (140, 96, 60), OL, 3)
    p.ell(560, 462, 44, 14, (250, 250, 250), OL, 3); p.rect(360, 420, 386, 470, (250, 250, 250), OL, 3, r=4)
    cat(p, 900, 600, 1.1, t)
    if t >= L(8) + 1.2: label(p, hx, hy - r - 40, '72 سنة', 28, 'cream', ease(seg(t, L(8) + 1.2, L(8) + 1.6)))
    if t >= L(10): label(p, 900, 470, '9 سنوات', 28, 'cream')
    return post(p.out(), t, zoom=push(t, L(8), L(11), 1.0, 1.05))

def crowd(p, t, n, feet, h, speed, labels=True, a=1.0, xs=None, size=24):
    for i in range(n):
        d = 1 if i % 2 else -1; x0 = xs[i] if xs else 100 + i * (1080 / max(1, n - 1))
        x = (x0 + d * speed * (.7 + (i % 3) * .2) * t) % (W + 300) - 150
        hx, hy, r = person(p, CROWD[i % 6], x, feet, h, 'walk', t, 'normal', look=d, phase=i)
        if labels: label(p, hx, hy - r - 26, f'{rnd(i) % 85 + 3} سنة', size, 'cream', a)

def sh_street(t):
    if t < L(13):
        p = canvas('city'); crowd(p, t - L(11), 5, 600, 270, 50, labels=t >= L(12), a=ease(seg(t, L(12), L(12) + .3)))
        return post(p.out(), t, zoom=push(t, L(11), L(13), 1.0, 1.04))
    if t < L(14):
        p = canvas('city'); bus(p, 520); hx, hy, r = person(p, DRV, 430, 590, 290, 'stand', t, 'smile', look=-1); label(p, hx, hy - r - 40, '38 سنة', 28)
        return post(p.out(), t, zoom=push(t, L(13), L(14), 1.0, 1.05))
    if t < L(15):
        p = canvas('city'); p.rect(380, 160, 900, 520, (236, 226, 206), OL, 5)
        for k in range(9): p.rect(380 + k * 58, 160, 438 + k * 58, 220, (200, 60, 54) if k % 2 else (250, 246, 240), OL, 3)
        label(p, 640, 140, 'مخبز', 30, 'navy')
        hx, hy, r = person(p, BAK, 640, 600, 300, 'stand', t, 'smile')
        p.rect(400, 440, 880, 560, (190, 140, 96), OL, 5)
        for k in range(5): p.ell(470 + k * 90, 440, 34, 16, (220, 160, 80), OL, 3)
        label(p, hx, hy - r * 2.3 - 30, '19 سنة', 28)
        return post(p.out(), t, zoom=push(t, L(14), L(15), 1.0, 1.05))
    p = canvas('city'); lt = t - L(15)
    person(p, CROWD[3], 820 + lt * 6, 600, 290, 'stand', t, 'smile', look=-1)
    sx = 600 + lt * 6; p.circ(sx - 10, 500, 28, SKIN[0], OL, 4); p.circ(sx - 20, 498, 4, OL, None); p.circ(sx + 0, 498, 4, OL, None)
    stroller(p, sx, 600)
    if t >= L(16): label(p, sx - 10, 420, '84 سنة', 28, 'cream', ease(seg(t, L(16), L(16) + .3)))
    return post(p.out(), t, zoom=push(t, L(15), L(17), 1.0, 1.06))

def sh_wide(t):
    p = canvas('city'); lt = t - L(17)
    crowd(p, lt, 7, 520, 160, 20, labels=True, xs=[60 + i * 190 for i in range(7)], size=18)
    crowd(p, lt + 3, 5, 640, 250, 25, labels=True, xs=[120 + i * 260 for i in range(5)], size=24)
    return post(p.out(), t, zoom=push(t, L(17), E(17), 1.06, 1.0))

def sh_facts1(t):
    p = canvas('dark')
    if t < L(19):
        n = int(73 * ease(seg(t, L(18) + .3, L(18) + 2))); big_number(p, W / 2, 300, str(n), 'سنة', size=200); label(p, W / 2, 110, 'متوسّط عمر الإنسان اليوم', 32, 'cream')
    else:
        n = int(26800 * ease(seg(t, L(19), L(19) + 1.6))); p.text((W / 2, 110), f'{n:,}', 96, (240, 200, 90), stroke=5, stroke_fill=OL); label(p, W / 2, 190, 'يوم تقريبًا', 26, 'red')
        dim = ease(seg(t, L(20), E(21))); shown = int(268 * ease(seg(t, L(19) + .3, L(19) + 2.4)))
        for i in range(shown):
            x = 190 + (i % 34) * 27; y = 260 + (i // 34) * 30; c = tuple(int(lerp(v, 70, dim)) for v in (232, 190, 80))
            p.circ(x, y, 10, c, shade(c, .6), 2)
        if t >= L(21): label(p, W / 2, 560, 'ومعظمها لا نعدّها أبدًا', 30, 'cream', ease(seg(t, L(21), L(21) + .3)))
    return post(p.out(), t, zoom=push(t, L(18), L(22), 1.0, 1.05))

def sh_days(t):
    p = canvas('city' if t < L(23) else 'city_eve'); crowd(p, t, 4, 600, 260, 40, xs=[100, 330, 950, 1180])
    person(p, YOU, 640, 610, 300, 'walk', t, 'normal' if t < L(23) else 'worry', look=1)
    label(p, W / 2, 70, 'اليوم الأوّل' if t < L(23) else 'اليوم الثاني', 34, 'navy')
    return post(p.out(), t, desat=0 if t < L(23) else .35)

def walter_left(t): return 360 * (1 - clamp((t - L(26)) / (L(38) - L(26))))
def sh_park(t):
    eve = t >= L(37); p = canvas('park_eve' if eve else 'park')
    bench(p, 330, 870, 560, front=False)
    wm, talk = 'normal', False
    if L(31) <= t < L(36): talk = L(32) <= t < E(35)
    if L(33) <= t < L(34): wm = 'smile'
    if L(36) <= t < L(37): wm = 'happy'
    if L(37) <= t: wm = 'happy' if t >= L(39) - .3 else 'normal'
    hx, hy, r = person(p, WALT, 480, 590, 290, 'sit', t, wm, look=1, talk=talk, blink=wm != 'happy')
    if L(27) <= t < L(30) + 1.3:
        if t < L(28): person(p, YOU, 1040, 620, 300, 'stand', t, 'shock', look=-1)
        elif t < L(30): person(p, YOU, 1040 + 140 * ease(seg(t, L(28), L(29))), 620, 300, 'walk' if t < L(29) else 'stand', t, 'worry', look=1)
        else: person(p, YOU, lerp(1180, 720, ease(seg(t, L(30), L(30) + 1.3))), 610, 300, 'walk', t, 'normal', look=-1)
    elif t >= L(30) + 1.3:
        ym = 'sad' if L(40) - .2 <= t < L(41) else ('smile' if t >= L(41) else 'normal')
        person(p, YOU, 720, 590, 290, 'sit', t, ym, look=-1)
    bench(p, 330, 870, 600, front=True)
    for i in range(5):
        fly = ease(seg(t, L(42), L(42) + 3)) if t >= L(42) else 0
        x = 180 + i * 40 + math.sin(t + i) * 3; y = 640 - fly * (150 + i * 40); pk = 5 if (t * 2 + i * .4) % 1.5 < .3 and not fly else 0
        p.ell(x, y, 15, 11, (170, 176, 196), OL, 3); p.circ(x + 13, y - 12 + pk, 8, (150, 156, 180), OL, 3)
    if L(25) + .4 <= t < L(38) + 1.4:
        s = walter_left(t); a = ease(seg(t, L(25) + .4, L(26))) * (1 - ease(seg(t, L(38) + .4, L(38) + 1.4)))
        label(p, hx, hy - r - 40, hms(s) if s > 0 else '00:00', 30, 'red' if s < 60 else 'cream', a)
    bx, by = 260, 180
    if L(32) <= t < L(33): bubble(p, bx, by); heart(p, bx, by, 44)
    elif L(33) <= t < L(34): bubble(p, bx, by); p.text((bx, by), '50 سنة', 40, (180, 50, 40))
    elif L(34) <= t < L(36): bubble(p, bx, by); p.rect(bx - 44, by - 36, bx + 44, by + 36, (70, 44, 30), OL, 4, r=12)
    elif L(36) <= t < L(37): bubble(p, bx, by); p.text((bx, by), 'هههه', 44, OL)
    if L(38) <= t < L(38) + 2.2:
        ph = seg(t, L(38) + .2, L(38) + 2.2)
        for i in range(18): p.circ(hx + math.cos(i * 2.3) * 120 * ph, hy - r - 40 - ph * (40 + 120 * ((i * 37) % 10) / 10), 6 * (1 - ph) + 1, (255, 230, 150), None)
    z = push(t, L(25), L(27), 1.0, 1.1); z = lerp(z, .96, ease(seg(t, L(40), L(43))))
    return post(p.out(), t, zoom=z, cx=560, cy=380, shake=3 if L(27) <= t < L(28) else 0)

def sh_facts2(t):
    if t < L(45):
        p = canvas('dark'); paper(p, W / 2, H / 2, 'دراسة جامعة هارفارد', ['منذ عام 1938', 'تابعت مئات الأشخاص طوال حياتهم', 'أكثر من 85 سنة من المتابعة'], reveal=ease(seg(t, L(43) + .5, L(43) + 4)))
        return post(p.out(), t, zoom=push(t, L(43), L(45), 1.0, 1.05))
    p = canvas('blue'); label(p, W / 2, 90, 'أقوى سرّ لحياة طويلة وصحية؟', 34, 'cream')
    items = [(880, 'المال', L(45) + 1.2), (640, 'الشهرة', L(46)), (400, 'العلاقات القريبة', L(47))]
    for k, (x, s, ts) in enumerate(items):
        if t < ts: continue
        p.rect(x - 100, 220, x + 100, 420, (30, 48, 80), (120, 160, 220), 3, r=14)
        if k == 0: p.text((x, 318), '$', 110, (90, 200, 110))
        elif k == 1:
            pts = [(x + 70 * (1 if j % 2 == 0 else .45) * math.cos(math.radians(-90 + j * 36)), 320 + 70 * (1 if j % 2 == 0 else .45) * math.sin(math.radians(-90 + j * 36))) for j in range(10)]; p.poly(pts, (240, 200, 70), OL, 4)
        else: heart(p, x, 330, 62 * (1 + .06 * math.sin(t * 6)))
        label(p, x, 470, s, 26, 'red' if k < 2 else 'green')
        if k < 2 and t >= ts + .8: p.line([(x - 80, 240), (x + 80, 400)], (230, 60, 50), 12); p.line([(x + 80, 240), (x - 80, 400)], (230, 60, 50), 12)
    return post(p.out(), t)

def sh_friday(t):
    if t < L(49):
        p = canvas('dark'); w, h = 300, 260; cx, cy = W / 2, H / 2
        p.rect(cx - w / 2 + 6, cy - h / 2 + 8, cx + w / 2 + 6, cy + h / 2 + 8, (0, 0, 0, 110), None, 0, r=14); p.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, (246, 242, 234), OL, 3, r=14)
        p.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2 + 64, (205, 52, 46), OL, 3, r=14); p.rect(cx - w / 2 + 2, cy - h / 2 + 40, cx + w / 2 - 2, cy - h / 2 + 64, (205, 52, 46), None, 0)
        p.text((cx, cy - h / 2 + 33), 'بعد أيام', 30, (255, 255, 255)); p.text((cx, cy + 34), 'الجمعة', 76, (34, 30, 32))
        return post(p.out(), t, zoom=push(t, L(48), L(49), .92, 1.0))
    p = canvas('city'); lt = t - L(49); arrive = 2.0; x = lerp(1450, 800, ease(seg(lt, 0, arrive)))
    person(p, YOU, 470, 600, 300, 'stand', t, 'shock' if t >= L(55) else ('worry' if t >= L(52) else 'normal'), look=1)
    hx, hy, r = person(p, ALI, x, 600, 300, 'run' if lt < arrive else 'stand', t, 'happy', look=-1)
    tag = None
    if L(50) <= t < L(52): tag = '...'
    if t >= L(52): tag = '0 سنة'
    if t >= L(53): tag = '0 سنة · 0 يوم'
    if t >= L(54): tag = '0 سنة · 0 يوم · ساعتان'
    if tag: label(p, hx, hy - r - 40, tag, 28, 'red')
    return post(p.out(), t, zoom=push(t, L(50), L(55), 1.0, 1.15), cy=320, shake=6 if L(55) <= t < L(55) + .8 else 0, red=.6 if L(55) <= t < L(56) else 0)

def leo_left(t): return 2 * 3600 - (t - L(54)) * 40
def sh_walk(t):
    p = canvas('city_eve')
    if t < L(58):
        person(p, YOU, 470, 600, 300, 'stand', t, 'sad', look=1); hx, hy, r = person(p, ALI, 800, 600, 300, 'phone', t, 'happy', look=-1, talk=True)
    else:
        lt = t - L(58); x = 300 + lt * 30
        person(p, YOU, x, 610, 300, 'walk', t, 'worry', look=1); hx, hy, r = person(p, ALI, x + 250, 600, 300, 'walk', t, 'happy' if t < L(60) else 'normal', look=-1 if t >= L(60) else 1, talk=t >= L(60), phase=1.3)
        if t >= L(60): bubble(p, hx + 170, hy - 80, 150, 100); p.text((hx + 170, hy - 80), '؟!', 50, OL)
    label(p, hx, hy - r - 40, hms(leo_left(t), True), 26, 'red')
    return post(p.out(), t)

def leo_six(t): return 360 - (t - L(61)) * (360 / max(.1, (L(66) - L(61))))
def sh_cross(t):
    p = canvas('cross'); traffic(p, 1120, t >= L(63))
    lx = 700
    if t >= L(64): lx = 700 + 120 * ease(seg(t, L(64), L(64) + .6))
    if t >= L(65): lx = lerp(lx, 660, ease(seg(t, L(65), L(65) + .25)))
    person(p, YOU, 460, 560, 300, 'point' if t >= L(65) else 'stand', t, 'shock' if t >= L(65) else 'worry', look=1)
    hx, hy, r = person(p, ALI, lx, 560, 300, 'walk' if L(64) <= t < L(65) else 'stand', t, 'shock' if t >= L(65) else 'normal', look=1)
    s = leo_six(t)
    if t < L(66) + .4: label(p, hx, hy - r - 40, hms(s), 28, 'red' if s < 60 else 'cream')
    else: label(p, hx, hy - r - 40, f'{int(t * 47) % 90} سنة', 28, 'cream')
    shake = 0
    if L(66) - .2 <= t < E(67) + .3: truck(p, lerp(-760, 1500, seg(t, L(66) - .2, E(67) + .3))); shake = 9
    return post(p.out(), t, zoom=push(t, L(61), L(66), 1.0, 1.08), cy=330, shake=shake)

def sh_after(t):
    p = canvas('cross'); traffic(p, 1120, True)
    hug = t >= L(76); k = ease(seg(t, L(76), L(76) + .5)) if hug else 0
    ym = 'shock' if t < L(75) else ('sad' if not hug else 'happy')
    lm = 'shock' if t < L(74) else ('worry' if not hug else 'happy')
    person(p, YOU, lerp(460, 560, k), 560, 300, 'hug' if hug else 'stand', t, ym, look=1)
    hx, hy, r = person(p, ALI, lerp(700, 650, k), 560, 300, 'hug' if hug else 'stand', t, lm, look=-1, talk=L(74) <= t < E(74) + .3, lean=math.sin(t * 40) * .05 if L(73) <= t < L(75) else 0)
    if L(70) <= t < L(72): label(p, hx, hy - r - 40, f'{int(t * 47) % 90} سنة · {int(t * 31) % 12} شهر', 28, 'cream')
    elif t >= L(72): label(p, hx, hy - r - 40, '61 سنة', 32, 'green')
    if L(74) <= t < L(75) + .3: bubble(p, 980, 170, 260, 110); p.text((980, 170), 'كيف عرفت؟', 38, OL)
    return post(p.out(), t, desat=.85 * (1 - ease(seg(t, L(68), L(70)))), flash=.6 * (1 - ease(seg(t, L(68), L(68) + .8))), zoom=1.04, cy=330)

def sh_facts3(t):
    if t < L(79):
        p = canvas('dark'); n = ease(seg(t, L(77) + .3, L(77) + 2.2))
        label(p, W / 2, 100, 'حوادث الطرق', 34, 'cream'); big_number(p, W / 2, 290, f'{1.2 * n:.1f} مليون', 'وفاة كلّ عام', size=130)
        if t >= L(78): wall_clock(p, 470, 560, 70, t / 60); label(p, 760, 560, 'أكثر من اثنين كلّ دقيقة', 28, 'red')
        return post(p.out(), t, zoom=push(t, L(77), L(79), 1.0, 1.05))
    p = canvas('dark'); paper(p, W / 2, H / 2 - 20, 'السبب الأوّل للوفاة', ['للأعمار من 5 إلى 29 سنة'] + (['إذن... الأرقام يمكن أن تتغيّر'] if t >= L(80) else []), h=320)
    return post(p.out(), t, zoom=push(t, L(79), L(81), 1.0, 1.04))

def sh_mirror(t):
    p = canvas('night'); mx0, my0, mx1, my1 = 640, 110, 1000, 560
    p.rect(mx0 - 18, my0 - 18, mx1 + 18, my1 + 18, (190, 196, 210), OL, 5, r=20); p.rect(mx0, my0, mx1, my1, (120, 150, 190), OL, 3)
    refl = Pic(); refl.im = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); refl.d = ImageDraw.Draw(refl.im)
    ym = 'normal' if t < L(91) else 'smile'
    if L(84) <= t < L(87): ym = 'worry'
    person(refl, YOU, 820, 600, 330, 'stand', t, ym, look=-1, blink=False)
    crop = refl.im.crop((mx0 * S, my0 * S, mx1 * S, my1 * S)); tint = Image.new('RGBA', crop.size, (130, 160, 210, 70)); crop.alpha_composite(tint)
    p.im.alpha_composite(crop, (mx0 * S, my0 * S))
    for k in range(3): p.line([(mx0 + 30 + k * 26, my0 + 10), (mx0 + 120 + k * 26, my0 + 100)], (230, 240, 255, 120), 6)
    person(p, YOU, 400, 620, 330, 'stand', t, ym, look=1)
    if L(83) <= t < L(86):
        a = .6 + .4 * math.sin(t * 9) if t < L(84) + .6 else max(0, 1 - (t - L(84) - .6) * 2)
        label(p, 820, 150, '؟', 34, 'cream', a)
    return post(p.out(), t, zoom=push(t, L(81), L(84), 1.0, 1.08), cx=700, cy=330, dim=.9)

def sh_phone(t):
    if t >= L(97):
        p = canvas('night'); person(p, YOU, 640, 640, 380, 'stand', t, 'smile'); return post(p.out(), t, zoom=push(t, L(97), L(98), 1.0, 1.05), dim=.95)
    p = canvas('dark'); cx, cy = W / 2, H / 2
    p.rect(cx - 170, cy - 300, cx + 170, cy + 300, (30, 32, 40), OL, 6, r=36); p.rect(cx - 150, cy - 270, cx + 150, cy + 270, (236, 240, 246), None, 0, r=20)
    p.rect(cx - 150, cy - 270, cx + 150, cy - 210, (60, 100, 180), None, 0, r=20); p.text((cx, cy - 240), 'أمّي', 30, (255, 255, 255))
    if t >= L(94): p.rect(cx - 10, cy - 180, cx + 130, cy - 120, (60, 130, 240), OL, 3, r=24); p.text((cx + 60, cy - 150), 'أحبّك', 30, (255, 255, 255))
    if t >= L(95) + .3:
        p.rect(cx - 130, cy - 100, cx + 30, cy - 40, (214, 216, 224), OL, 3, r=24)
        for k in range(3): heart(p, cx - 95 + k * 48, cy - 72, 15)
    if t >= L(96): label(p, cx + 300, cy - 240, '31 سنة', 30, 'cream', ease(seg(t, L(96), L(96) + .3)))
    return post(p.out(), t, zoom=push(t, L(93), L(97), 1.0, 1.06))

def sh_facts4(t):
    p = canvas('dark')
    if t < L(101):
        paper(p, W / 2, H / 2 - 10, 'إذن... ما الحقيقي؟', ['لا يوجد عدّاد فوق رأس أحد', 'متوسّط العمر مجرّد معدّل', 'وليس وعدًا'], reveal=ease(seg(t, L(98) + .5, L(100) + 2)))
    else:
        paper(p, 900, H / 2, 'يُقصّر العمر', [s for s, ts in (('التدخين', L(101) + 1.5), ('الجلوس الطويل', L(101) + 2.3), ('الوحدة', L(101) + 3.1)) if t >= ts], w=380, h=330, rot=1.5)
        if t >= L(102): paper(p, 380, H / 2, 'يُطيل العمر', [s for s, ts in (('النوم', L(103)), ('الحركة', L(103) + .9), ('الناس الذين تحبّهم', L(103) + 1.8)) if t >= ts], w=380, h=330, rot=-1.5)
    return post(p.out(), t, zoom=push(t, L(98), L(104), 1.0, 1.04))

def sh_cta(t):
    p = canvas('bed'); door(p, 520, 760)
    hx, hy, r = person(p, MOM, 640, 520, 300, 'wave' if t >= L(107) else 'stand', t, 'smile')
    label(p, hx, hy - r - 50, '31 سنة · 4 أشهر · 6 أيام', 30, 'cream')
    qs = [('ماذا ستفعل لو رأيت رقمك؟', L(104)), ('وماذا لو استطعت إيقاف الزمن؟', L(105)), ('اكتب في التعليقات', L(106))]
    shown = [(s, ts) for s, ts in qs if t >= ts]
    if shown and t < L(107): s, ts = shown[-1]; label(p, W / 2, 620, s, 36, 'navy', ease(seg(t, ts, ts + .3)))
    if t >= L(107): label(p, 470, 620, 'لايك', 34, 'navy'); label(p, 810, 620, 'اشترك', 34, 'red')
    return post(p.out(), t, zoom=push(t, L(104), DUR, 1.0, 1.05))

SHOTS = [(0, 1, sh_tuesday), (1, 8, sh_room), (8, 11, sh_kitchen), (11, 17, sh_street), (17, 18, sh_wide), (18, 22, sh_facts1), (22, 24, sh_days), (24, 43, sh_park),
         (43, 48, sh_facts2), (48, 56, sh_friday), (56, 61, sh_walk), (61, 68, sh_cross), (68, 77, sh_after), (77, 81, sh_facts3), (81, 93, sh_mirror), (93, 98, sh_phone),
         (98, 104, sh_facts4), (104, 108, sh_cta)]
def frame(t):
    if t < HOOK_END: return sh_hook(t) * seg(t, 0, .25)
    for a, b, f in SHOTS:
        ta = HOOK_END if a == 0 else L(a) - .15; tb = DUR + 1 if b >= 108 else L(b) - .15
        if ta <= t < tb:
            img = f(t); k = seg(t, ta, ta + .25)
            return img * (.25 + .75 * k) * (1 - seg(t, DUR - .8, DUR))
    return np.zeros((H, W, 3), np.float32)
def render(i): t = i / FPS; cv2.imwrite(f'{FR}{i:05d}.png', np.clip(frame(t), 0, 255)[..., ::-1].astype(np.uint8)); return i

if __name__ == '__main__':
    args = sys.argv[3:]
    if args and args[0] != 'all':
        for x in args: render(int(round(float(x) * FPS)))
        sys.exit()
    from concurrent.futures import ProcessPoolExecutor
    with ProcessPoolExecutor(2) as ex: list(ex.map(render, range(int(DUR * FPS)), chunksize=24))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{FR}%05d.png', '-i', VOICE, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', OUT], check=True)
    print('done')
