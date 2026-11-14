"""Arabic countdown film in neon pictogram style.
usage: python3 film_ar.py <timing.json> <voice.wav> [test times... | all]"""
import sys, os, json, math, subprocess
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from neon import *

TJ = json.load(open(sys.argv[1])); VOICE = sys.argv[2]
LINES = [l.strip() for l in open('/home/claude/claude-teacher-/tts/ar/lines.txt', encoding='utf-8') if l.strip()]
def L(i): return TJ[i]['t0']
def E(i): return TJ[i]['t1']
DUR = TJ[-1]['t1'] + 1.5
FPS = 24; FR = '/home/claude/out/film_ar/'; os.makedirs(FR, exist_ok=True); OUT = '/home/claude/out/countdown_ar.mp4'
GROUND = 590
def line_at(t):
    cur = None
    for e in TJ:
        if e['t0'] - .05 <= t <= e['t1'] + .35: cur = e['i']
    return cur
def caption(t):
    i = line_at(t)
    if i is None: return []
    a = min(seg(t, L(i) - .05, L(i) + .12), 1 - seg(t, E(i) + .2, E(i) + .35))
    s = LINES[i]; size = 44
    while font(size).getlength(s) > W - 120 and size > 26: size -= 2
    return [(s, (W / 2, H - 52), size, WHITE, a, False)]
def tagtxt(s, x, y, a=1.0, col=CYAN, size=40): return (s, (x, y), size, col, a, True)
def hms(sec, full=False):
    sec = max(0, int(sec)); h, r = divmod(sec, 3600); m, s = divmod(r, 60)
    return f'{h:02d}:{m:02d}:{s:02d}' if full or h else f'{m:02d}:{s:02d}'
def ground(cv, col=(70, 80, 130)): cv.line((-10, GROUND), (W + 10, GROUND), col, 3)

# ---------- props ----------
def door(cv, x0=470, x1=690, top=230): cv.rect(x0, top, x1, GROUND, GOLD, 5, fill=(26, 20, 8)); cv.circle((x1 - 22, (top + GROUND) / 2 + 20), 5, GOLD, 3)
def table(cv, x0, x1, y): cv.line((x0, y), (x1, y), GOLD, 6); cv.line((x0 + 20, y), (x0 + 20, GROUND), GOLD, 5); cv.line((x1 - 20, y), (x1 - 20, GROUND), GOLD, 5)
def cat(cv, x, y, t, col=GREEN):
    cv.circle((x, y - 28), 30, col, 5); cv.circle((x + 6, y - 78), 22, col, 5)
    cv.poly([(x - 12, y - 92), (x - 8, y - 114), (x + 2, y - 98)], col, 4); cv.poly([(x + 12, y - 98), (x + 22, y - 114), (x + 24, y - 92)], col, 4)
    sw = math.sin(t * 3) * 14; cv.poly([(x + 28, y - 16), (x + 52, y - 30), (x + 58 + sw, y - 62)], col, 5)
def bus(cv, x, col=GOLD):
    cv.rect(x, 330, x + 420, GROUND - 30, col, 6, r=26); cv.circle((x + 80, GROUND - 26), 28, col, 6); cv.circle((x + 330, GROUND - 26), 28, col, 6)
    for k in range(4): cv.rect(x + 150 + k * 66, 360, x + 200 + k * 66, 420, col, 4, r=6)
    cv.rect(x + 20, 360, x + 120, GROUND - 40, col, 4, r=8)
def stroller(cv, x, col=CYAN):
    cv.poly([(x - 70, 470), (x - 70, 540), (x + 50, 540), (x + 50, 500)], col, 5); cv.circle((x - 40, 566), 20, col, 5); cv.circle((x + 30, 566), 20, col, 5)
    pts = [(x - 70 + 60 * math.cos(math.radians(a)) + 60, 500 - 60 * math.sin(math.radians(a))) for a in range(180, 360 + 1, 15)]
    cv.poly([(x - 70 + 70 - 70 * math.cos(math.radians(a)), 500 - 70 * math.sin(math.radians(a))) for a in range(0, 100, 10)], col, 5)
    cv.line((x + 50, 500), (x + 90, 440), col, 5); cv.circle((x - 10, 505), 18, PINK, 4)
def bench(cv, x0, x1, col=GOLD):
    cv.line((x0, 500), (x1, 500), col, 6); cv.line((x0, 440), (x1, 440), col, 5); cv.line((x0, 470), (x1, 470), col, 4)
    for x in (x0 + 18, x1 - 18): cv.line((x, 430), (x, GROUND), col, 5)
def tree(cv, x, s=1.0, col=GREEN): cv.line((x, GROUND), (x, GROUND - 200 * s), (150, 110, 70), 8); cv.circle((x, GROUND - 260 * s), 90 * s, col, 6); cv.circle((x - 60 * s, GROUND - 210 * s), 55 * s, col, 5); cv.circle((x + 60 * s, GROUND - 215 * s), 60 * s, col, 5)
def pigeons(cv, t, x0, n=5, fly=0.0):
    for i in range(n):
        x = x0 + i * 46 + math.sin(t + i) * 4; y = GROUND - 14 - fly * (120 + i * 40); pk = 6 if (t * 2 + i * .4) % 1.5 < .3 and not fly else 0
        cv.circle((x, y), 12, (180, 190, 220), 3); cv.circle((x + 14, y - 14 + pk), 7, (180, 190, 220), 3)
        if fly: cv.line((x - 8, y - 4), (x - 22, y - 18 - 10 * math.sin(t * 30 + i)), (180, 190, 220), 3)
def traffic(cv, x, green):
    cv.line((x, GROUND), (x, 260), (140, 150, 180), 6); cv.rect(x - 34, 150, x + 34, 300, (140, 150, 180), 5, r=12)
    cv.circle((x, 188), 22, RED, 0 if not green else 3, fill=RED if not green else None); cv.circle((x, 262), 22, GREEN, 0 if green else 3, fill=GREEN if green else None)
def zebra(cv, x0):
    for k in range(7): cv.poly([(x0 + k * 60, GROUND + 8), (x0 + k * 60 + 34, GROUND + 8), (x0 + k * 60 + 44, GROUND + 50), (x0 + k * 60 + 10, GROUND + 50)], WHITE, 3, True, fill=(60, 60, 70))
def truck(cv, x, col=RED):
    b = H - 40
    cv.rect(x, b - 330, x + 460, b - 30, col, 7, r=14, fill=(40, 6, 10)); cv.rect(x + 460, b - 250, x + 600, b - 30, col, 7, r=14, fill=(40, 6, 10)); cv.rect(x + 490, b - 230, x + 580, b - 160, col, 4, r=6)
    for wx in (x + 90, x + 360, x + 520): cv.circle((wx, b - 24), 32, col, 7, fill=(20, 4, 6))
    for k in range(6): cv.line((x - 60 - k * 40, 320 + k * 40), (x - 220 - k * 40, 320 + k * 40), col, 4)
def mirror(cv, cx=640):
    cv.rect(cx - 170, 110, cx + 170, GROUND - 20, (200, 210, 230), 7, r=30, fill=(20, 24, 40))
def phone(cv, cx, cy, s=1.0):
    cv.rect(cx - 150 * s, cy - 260 * s, cx + 150 * s, cy + 260 * s, (200, 210, 230), 7, r=34 * s, fill=(10, 12, 22))
def heart(cv, cx, cy, r, col=RED, fill=None):
    pts = [(cx + r * 16 * math.sin(a) ** 3 / 16, cy - r * (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)) / 16) for a in np.linspace(0, 2 * math.pi, 40)]
    cv.poly(pts, col, 5, True, fill)
def star(cv, cx, cy, r, col=GOLD):
    cv.poly([(cx + r * (1 if k % 2 == 0 else .45) * math.cos(math.radians(-90 + k * 36)), cy + r * (1 if k % 2 == 0 else .45) * math.sin(math.radians(-90 + k * 36))) for k in range(10)], col, 5, True)
def xmark(cv, cx, cy, r, p=1.0): cv.line((cx - r, cy - r), (cx - r + 2 * r * p, cy - r + 2 * r * p), RED, 9)
def smile(cv, head, r, col, up=True):
    pts = [(head[0] + r * .5 * math.cos(math.radians(a)), head[1] + r * .15 + r * .35 * math.sin(math.radians(a)) * (1 if up else -1)) for a in range(20, 161, 20)]
    cv.poly(pts, col, 3)
def lids(img, k):
    if k <= 0: return img
    h = k * H * .52; m = np.zeros((H, W), np.float32)
    cv2.ellipse(m, (W // 2, int(-H * .6 + h)), (int(W * .9), int(H * .62)), 0, 0, 360, 1, -1); cv2.ellipse(m, (W // 2, int(H * 1.6 - h)), (int(W * .9), int(H * .62)), 0, 0, 360, 1, -1)
    m = cv2.GaussianBlur(m, (0, 0), 25)[..., None]; return img * (1 - m)

def rnd(k): return (k * 2654435761) % 997
def crowd(cv, t, n, y=GROUND, scale=1.0, xs=None, speed=60, tags=True, a=1.0, cols=(PINK, CYAN, GOLD, GREEN, (200, 140, 255))):
    T = []
    for i in range(n):
        dirn = 1 if i % 2 else -1; x0 = (xs[i] if xs else 80 + i * (1100 / max(1, n - 1)))
        x = (x0 + dirn * speed * (.6 + (i % 3) * .2) * t) % (W + 200) - 100
        h = (210 + (i * 37) % 60) * scale; col = cols[i % len(cols)]
        hd, r = person(cv, x, y, h, col, 'walk', t, dirn, phase=i * 1.3, hair='long' if i % 3 == 0 else None)
        if tags: T.append(tagtxt(f'{rnd(i) % 85 + 3} سنة', x, hd[1] - r - 34, a, size=int(30 * scale + 4)))
    return T

# ---------- shots ----------
def sh_room(t):
    base = background(t=t); cv = Canvas(); ground(cv); door(cv)
    breathe = math.sin(t * 2) * 2
    hd, r = person(cv, 580, GROUND - 4, 320 + breathe, PINK, 'stand', t, 0, hair='long'); smile(cv, hd, r, PINK)
    T = []
    a = ease(seg(t, L(2) + .3, L(3)))
    parts = []
    if t >= L(4): parts.append('31 سنة')
    if t >= L(5): parts.append('4 أشهر')
    if t >= L(6): parts.append('6 أيام')
    T.append(tagtxt(' · '.join(parts) if parts else '؟؟ سنة · ؟؟ شهر · ؟؟ يوم', 580, 120, a, size=46 if parts else 40))
    if t >= L(7): T.append(tagtxt(hms(13 * 3600 + 22 * 60 + 7 - (t - L(7)), True), 580, 180, ease(seg(t, L(7), L(7) + .4)), GOLD, 34))
    zoom = lerp(1.0, 1.12, ease(seg(t, L(3), L(8))))
    img = finish(base, cv.out(), T + caption(t), t, zoom=zoom, flash=0)
    k = (1 - ease(seg(t, .2, 1.4))) * .95 + .5 * (1 - ease(seg(t, 1.5, 2.4))) * ease(seg(t, .9, 1.5))
    img = lids(img, clamp(k))
    if t < 2.6: img = cv2.GaussianBlur(img, (0, 0), 1 + 8 * (1 - ease(seg(t, .2, 2.6))))
    return img

def sh_kitchen(t):
    base = background((14, 16, 30), (34, 24, 30), t, False); cv = Canvas(); ground(cv)
    hd, r = person(cv, 520, GROUND - 6, 230, CYAN, 'sit', t, 1)
    table(cv, 360, 760, 470); cv.circle((560, 455), 22, WHITE, 4)
    cat(cv, 980, GROUND, t)
    T = []
    if t >= L(8) + 1.2: T.append(tagtxt('72 سنة', 520, hd[1] - r - 40, ease(seg(t, L(8) + 1.2, L(8) + 1.6))))
    if t >= L(10): T.append(tagtxt('9 سنوات', 990, 380, ease(seg(t, L(10), L(10) + .3)), GREEN))
    return finish(base, cv.out(), T + caption(t), t, zoom=1.0 + .02 * (t - L(8)))

def sh_street(t):
    base = background((12, 14, 34), (40, 26, 60), t); cv = Canvas(); ground(cv)
    for i, x in enumerate(range(-40, W + 80, 150)):   # skyline outline
        h = 120 + (i * 53) % 160; cv.poly([(x, GROUND - 150), (x, GROUND - 150 - h), (x + 120, GROUND - 150 - h), (x + 120, GROUND - 150)], (60, 64, 110), 3)
    T = []
    if t < L(13):
        T = crowd(cv, t - L(11), 5, tags=t >= L(12), a=ease(seg(t, L(12), L(12) + .4)))
    elif t < L(14):
        bus(cv, 520); hd, r = person(cv, 640, GROUND - 40, 200, GOLD, 'stand', t, -1, hair='cap'); T.append(tagtxt('38 سنة', 640, hd[1] - r - 40))
    elif t < L(15):
        cv.rect(380, 250, 900, GROUND, (200, 160, 120), 5, r=10); hd, r = person(cv, 640, GROUND - 4, 260, (255, 220, 200), 'stand', t, 0)
        cv.rect(hd[0] - r * .9, hd[1] - r * 2.6, hd[0] + r * .9, hd[1] - r * .95, WHITE, 4, r=12); T.append(tagtxt('19 سنة', 640, hd[1] - r * 2.6 - 40))
    else:
        lt = t - L(15); stroller(cv, 600 + lt * 10); person(cv, 760 + lt * 10, GROUND, 250, PINK, 'stand', t, -1, hair='long')
        if t >= L(16): T.append(tagtxt('84 سنة', 590 + lt * 10, 410, ease(seg(t, L(16), L(16) + .3))))
    return finish(base, cv.out(), T + caption(t), t)

def sh_wide(t):
    base = background((10, 12, 30), (40, 20, 54), t); cv = Canvas(); ground(cv, (50, 60, 100))
    z = lerp(1.0, .9, ease(seg(t, L(17), E(17))))
    lt = t - L(17); T = crowd(cv, lt, 9, GROUND - 40, .7, xs=[60 + i * 140 for i in range(9)], speed=20, tags=False) + crowd(cv, lt, 6, GROUND + 30, 1.0, xs=[120 + i * 210 for i in range(6)], speed=25)
    return finish(base, cv.out(), T + caption(t), t, zoom=z)

def big_number(val, label, x=W / 2, y=290, col=GOLD, size=150): return [(val, (x, y), size, col, 1, True), (label, (x, y - 140), 44, WHITE, 1, False)]
def sh_facts1(t):
    base = background((8, 10, 24), (16, 20, 40), t, False); cv = Canvas(); T = []
    if t < L(19):
        n = int(73 * ease(seg(t, L(18) + .4, L(18) + 2.2))); T += big_number(f'{n}', 'متوسّط عمر الإنسان', size=170)
        T.append(('سنة', (W / 2, 420), 46, GOLD, 1, True))
        cv.line((240, 500), (240 + 800 * ease(seg(t, L(18) + .4, L(18) + 2.2)), 500), GREEN, 10)
    else:
        n = int(26800 * ease(seg(t, L(19), L(19) + 1.8))); T += big_number(f'{n:,}', '٧٣ سنة تقريبًا =', y=200, size=110); T.append(('يوم', (W / 2, 290), 44, GOLD, 1, True))
        dim = ease(seg(t, L(20), E(21)))
        shown = int(268 * ease(seg(t, L(19) + .3, L(19) + 2.5)))
        for i in range(shown):
            x = 205 + (i % 34) * 26; y = 350 + (i // 34) * 24
            c = tuple(lerp(v, 40, dim) for v in GOLD); cv.rect(x, y, x + 14, y + 14, c, 0, fill=c)
    return finish(base, cv.out(), T + caption(t), t)

def sh_days(t):
    base = background((12, 14, 34), (40, 26, 60), t); cv = Canvas(); ground(cv)
    T = crowd(cv, t, 5, tags=True, a=.85)
    person(cv, 640, GROUND, 240, WHITE, 'walk', t, 1)
    T.append(('اليوم الأوّل' if t < L(23) else 'اليوم الثاني', (W / 2, 110), 70, WHITE, 1, False))
    return finish(base, cv.out(), T + caption(t), t, desat=0 if t < L(23) else .4)

WZ = None
def walter_left(t): return 360 * (1 - clamp((t - L(26)) / (L(38) - L(26))))
def park(cv, t, eve=False, you=None, fly=0.0, tag=True, tag_a=1.0):
    tree(cv, 180, 1.1); tree(cv, 1120, .9); bench(cv, 440, 840); pigeons(cv, t, 380, fly=fly)
    hd, r = person(cv, 560, GROUND - 4, 260, GOLD, 'sit', t, 1, lean=.25)
    if t >= L(39) - .3: smile(cv, hd, r, GOLD)
    T = []
    if tag:
        s = walter_left(t); T.append(tagtxt(hms(s) if s > 0 else '00:00', 560, hd[1] - r - 50, tag_a, RED if s < 60 else CYAN, 52))
    if you:
        kind, x = you
        if kind == 'sit': person(cv, x, GROUND - 4, 250, WHITE, 'sit', t, -1)
        else: person(cv, x, GROUND, 250, WHITE, kind, t, -1 if x > 640 else 1)
    return T
def sh_park(t):
    base = background((10, 20, 36), (24, 40, 50), t); cv = Canvas(); ground(cv, (60, 110, 90))
    you = None
    if t >= L(27):
        if t < L(28): you = ('stand', 1000)
        elif t < L(30): you = ('walk' if t < L(29) else 'stand', 1000 + 120 * ease(seg(t, L(28), L(29))))
        elif t < L(30) + 1.3: you = ('walk', lerp(1120, 700, ease(seg(t, L(30), L(30) + 1.3))))
        else: you = ('sit', 700)
    T = park(cv, t, you=you, tag=t >= L(25) + .4, tag_a=ease(seg(t, L(25) + .4, L(26))))
    z = lerp(1.0, 1.1, ease(seg(t, L(25), L(27))))
    return finish(base, cv.out(), T + caption(t), t, zoom=z, shake=3 if L(27) <= t < L(28) else 0)

def bubble(cv, cx, cy, w=230, h=150): cv.rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, WHITE, 5, r=30); cv.poly([(cx - 60, cy + h / 2), (cx - 100, cy + h / 2 + 50), (cx - 20, cy + h / 2)], WHITE, 5)
def sh_talk(t):
    base = background((10, 20, 36), (24, 40, 50), t); cv = Canvas(); ground(cv, (60, 110, 90))
    T = park(cv, t, you=('sit', 700)); bx, by = 420, 220
    if L(32) <= t < L(33): bubble(cv, bx, by); heart(cv, bx, by, 50, PINK)
    elif L(33) <= t < L(34):
        bubble(cv, bx, by); T.append(('50 سنة', (bx, by), 52, GOLD, 1, True))
    elif L(34) <= t < L(36):
        bubble(cv, bx, by); cv.rect(bx - 50, by - 45, bx + 50, by + 45, (90, 60, 40), 6, r=14, fill=(40, 26, 18))
        for k in range(3): cv.poly([(bx - 30 + k * 30, by - 60), (bx - 22 + k * 30, by - 80), (bx - 30 + k * 30, by - 100)], (150, 150, 160), 4)
    elif L(36) <= t < L(37): bubble(cv, bx, by); T.append(('هههه', (bx, by), 56, WHITE, 1, False))
    return finish(base, cv.out(), T + caption(t), t, zoom=1.08)

def sh_zero(t):
    k = ease(seg(t, L(37), L(40)))
    base = background(tuple(lerp(a, b, k) for a, b in zip((10, 20, 36), (40, 20, 50))), tuple(lerp(a, b, k) for a, b in zip((24, 40, 50), (255, 130, 80))), t)
    cv = Canvas(); ground(cv, (120, 90, 90))
    zg = ease(seg(t, L(38) + .3, L(38) + 1.6))
    T = park(cv, t, eve=True, you=('sit', 700), tag_a=1 - zg)
    if L(38) <= t < L(38) + 2.5:
        ph = seg(t, L(38) + .2, L(38) + 2.5)
        for i in range(28): cv.circle((560 + math.cos(i * 2.3) * 160 * ph, 150 - ph * (60 + 140 * ((i * 37) % 10) / 10)), 4 * (1 - ph) + 1, GOLD, 0, fill=GOLD)
    z = lerp(1.08, .92, ease(seg(t, L(40), L(43))))
    if t >= L(42): pigeons(cv, t, 380, fly=ease(seg(t, L(42), L(42) + 3)))
    return finish(base, cv.out(), T + caption(t), t, zoom=z)

def sh_facts2(t):
    base = background((8, 10, 24), (16, 20, 40), t, False); cv = Canvas(); T = []
    if t < L(45):
        T += [('جامعة هارفارد', (W / 2, 140), 56, WHITE, 1, False), ('1938', (W / 2, 270), 140, GOLD, 1, True)]
        p = ease(seg(t, L(43) + 1, L(43) + 3)); cv.line((200, 370), (200 + 880 * p, 370), CYAN, 6)
        for k in range(9):
            if p * 8 >= k: cv.line((200 + k * 110, 355), (200 + k * 110, 385), CYAN, 5)
        for k in range(8):
            if t > L(43) + 1.5 + k * .2: person(cv, 260 + k * 110, 520, 100, CYAN, 'stand', t, 0)
        if t >= L(44): T.append(('أكثر من 85 سنة من المتابعة', (W / 2, 580), 38, CYAN, ease(seg(t, L(44), L(44) + .4)), True))
    else:
        T.append(('أقوى سرّ لحياة طويلة؟', (W / 2, 120), 54, WHITE, 1, False))
        cx = [880, 640, 400]
        if t >= L(45) + 1.2: T.append(('$', (cx[0], 330), 130, GREEN, 1, True)); T.append(('المال', (cx[0], 470), 40, WHITE, 1, False)); xmark(cv, cx[0], 330, 70, ease(seg(t, L(45) + 2, L(45) + 2.4)))
        if t >= L(46): star(cv, cx[1], 330, 80); T.append(('الشهرة', (cx[1], 470), 40, WHITE, 1, False)); xmark(cv, cx[1], 330, 70, ease(seg(t, L(46) + .5, L(46) + .9)))
        if t >= L(47):
            s = 1 + .08 * math.sin(t * 6); heart(cv, cx[2], 340, 85 * s, PINK, (90, 20, 50)); T.append(('العلاقات القريبة', (cx[2], 470), 40, PINK, 1, True))
    return finish(base, cv.out(), T + caption(t), t)

def leo_left(t): return 2 * 3600 - (t - L(54)) * 40
def sh_friday(t):
    base = background((12, 14, 34), (40, 26, 60), t); cv = Canvas(); ground(cv); T = []
    if t < L(49): T.append(('الجمعة', (W / 2, H / 2 - 40), 130, GOLD, ease(seg(t, L(48), L(48) + .4)), True))
    else:
        lt = t - L(49); arrive = 2.2; x = lerp(1400, 820, ease(seg(lt, 0, arrive)))
        person(cv, 460, GROUND, 250, WHITE, 'stand', t, 1)
        hd, r = person(cv, x, GROUND, 250, (255, 150, 60), 'run' if lt < arrive else 'stand', t, -1)
        if lt >= arrive: smile(cv, hd, r, (255, 150, 60))
        tag = []
        if t >= L(52): tag = ['0 سنة']
        if t >= L(53): tag = ['0 سنة · 0 يوم']
        if t >= L(54): tag = ['0 سنة · 0 يوم · ساعتان']
        if tag: T.append(tagtxt(tag[0], x, hd[1] - r - 50, 1, RED, 46))
        if L(50) <= t < L(52): T.append(tagtxt('...', x, hd[1] - r - 50, 1, RED, 46))
    shake = 6 if L(55) <= t < L(55) + .8 else 0
    img = finish(base, cv.out(), T + caption(t), t, shake=shake, zoom=lerp(1.0, 1.15, ease(seg(t, L(50), L(55)))))
    if L(55) <= t < L(56): img = img * np.array([1.0, .75, .75])
    return img

def sh_walk(t):
    base = background((20, 14, 34), (120, 60, 70), t); cv = Canvas(); ground(cv); T = []
    if t < L(58):
        person(cv, 520, GROUND, 250, WHITE, 'stand', t, 1); hd, r = person(cv, 780, GROUND, 250, (255, 150, 60), 'phone', t, -1)
        T.append(tagtxt(hms(leo_left(t), True), 780, hd[1] - r - 50, 1, RED, 44))
    else:
        lt = t - L(58); x = 300 + lt * 40
        person(cv, x, GROUND, 250, WHITE, 'walk', t, 1, .5); hd, r = person(cv, x + 150, GROUND, 250, (255, 150, 60), 'walk', t, 1)
        T.append(tagtxt(hms(leo_left(t), True), x + 150, hd[1] - r - 50, 1, RED, 44))
        if t >= L(60): bubble(cv, x + 300, 200, 160, 110); T.append(('؟!', (x + 300, 200), 60, WHITE, 1, False))
    return finish(base, cv.out(), T + caption(t), t)

def leo_six(t): return 360 - (t - L(61)) * (360 / max(.1, (L(66) - L(61))))
def sh_cross(t):
    base = background((20, 14, 34), (110, 50, 70), t); cv = Canvas(); ground(cv); zebra(cv, 700)
    green = t >= L(63); traffic(cv, 1130, green); T = []
    lx = 640
    if t >= L(64): lx = 640 + 110 * ease(seg(t, L(64), L(64) + .6))
    if t >= L(65): lx = lerp(lx, 600, ease(seg(t, L(65), L(65) + .25)))
    pose = 'walk' if L(64) <= t < L(65) else 'stand'
    hd, r = person(cv, lx, GROUND, 250, (255, 150, 60), pose, t, 1)
    person(cv, 470, GROUND, 250, WHITE, 'grab' if t >= L(65) else 'stand', t, 1)
    s = leo_six(t)
    if t < L(66) + .4: T.append(tagtxt(hms(s), lx, hd[1] - r - 50, 1, RED if s < 60 else CYAN, 50))
    else: T.append(tagtxt(f'{int(t * 47) % 90} سنة', lx, hd[1] - r - 50, 1, CYAN, 50))
    shake = 0
    if L(66) - .2 <= t < E(67) + .3:
        tx = lerp(-700, 1400, seg(t, L(66) - .2, E(67) + .3)); truck(cv, tx); shake = 10
    return finish(base, cv.out(), T + caption(t), t, shake=shake, zoom=lerp(1.0, 1.12, ease(seg(t, L(61), L(66)))))

def sh_after(t):
    base = background((20, 14, 34), (110, 50, 70), t); cv = Canvas(); ground(cv); zebra(cv, 700); traffic(cv, 1130, True); T = []
    hd, r = person(cv, 600, GROUND, 250, (255, 150, 60), 'stand' if t < L(76) else 'hug', t, -1 if t >= L(76) else 1)
    person(cv, 470 if t < L(76) else 520, GROUND, 250, WHITE, 'stand' if t < L(76) else 'hug', t, 1)
    if t < L(70): pass
    elif t < L(72): T.append(tagtxt(f'{int(t * 47) % 90} سنة · {int(t * 31) % 12} شهر', 600, hd[1] - r - 50, 1, CYAN, 46))
    else: T.append(tagtxt('61 سنة', 600, hd[1] - r - 50, 1, GREEN, 56))
    if L(74) <= t < L(75): bubble(cv, 820, 200, 230, 120); T.append(('كيف عرفت؟', (820, 200), 40, WHITE, 1, False))
    desat = .8 * (1 - ease(seg(t, L(68), L(70))))
    shake = 2.5 if L(73) <= t < L(75) else 0
    return finish(base, cv.out(), T + caption(t), t, desat=desat, shake=shake, flash=.6 * (1 - ease(seg(t, L(68), L(68) + .8))), zoom=1.06)

def sh_facts3(t):
    base = background((8, 10, 24), (16, 20, 40), t, False); cv = Canvas(); T = []
    if t < L(79):
        n = ease(seg(t, L(77) + .3, L(77) + 2.5)); T += [('حوادث الطرق', (W / 2, 120), 54, WHITE, 1, False), (f'{1.2 * n:.1f} مليون', (W / 2, 260), 120, RED, 1, True), ('وفاة كلّ عام', (W / 2, 370), 44, WHITE, 1, False)]
        if t >= L(78):
            cv.circle((W / 2, 520), 70, WHITE, 5); a = t * 6; cv.line((W / 2, 520), (W / 2 + 55 * math.sin(a), 520 - 55 * math.cos(a)), WHITE, 5)
            T.append(('+2 كلّ دقيقة', (W / 2 + 280, 520), 50, RED, 1, True))
    else:
        T += [('السبب الأوّل للوفاة', (W / 2, 160), 60, WHITE, 1, False), ('من 5 إلى 29 سنة', (W / 2, 300), 90, GOLD, 1, True)]
        if t >= L(80):
            T.append(('الأرقام يمكن أن تتغيّر', (W / 2, 470), 56, GREEN, ease(seg(t, L(80), L(80) + .4)), True))
    return finish(base, cv.out(), T + caption(t), t)

def sh_mirror(t):
    base = background((6, 8, 22), (14, 16, 40), t); cv = Canvas(); ground(cv, (40, 50, 90)); mirror(cv); T = []
    person(cv, 680, GROUND - 40, 300, (110, 120, 170), 'stand', t, -1)        # reflection, dimmer, faces back at you
    hd, r = person(cv, 330, GROUND, 330, WHITE, 'stand', t, 1)                   # you, facing the mirror
    if L(83) <= t < L(86):
        a = .5 + .4 * math.sin(t * 10) if t < L(84) + .6 else max(0, 1 - (t - L(84) - .6) * 2)
        T.append(('؟', (680, 170), 80, (160, 170, 210), a, True))
    if L(87) <= t < L(89):
        T += crowd(cv, t, 4, GROUND - 60, .5, xs=[120, 330, 950, 1160], speed=0)
    zoom = lerp(1.0, 1.15, ease(seg(t, L(81), L(84))))
    return finish(base, cv.out(), T + caption(t), t, zoom=zoom)

def sh_phone(t):
    base = background((6, 8, 22), (14, 16, 40), t); cv = Canvas(); T = []
    if t < L(97):
        phone(cv, W / 2, H / 2 - 10)
        if t >= L(94): cv.rect(W / 2 - 20, 170, W / 2 + 130, 230, CYAN, 0, r=24, fill=(30, 110, 200)); T.append(('أحبّك', (W / 2 + 55, 200), 34, WHITE, 1, False))
        if t >= L(95) + .3:
            cv.rect(W / 2 - 130, 250, W / 2 + 40, 310, WHITE, 0, r=24, fill=(60, 64, 80))
            for k in range(3): heart(cv, W / 2 - 95 + k * 52, 282, 18, RED, RED)
        if t >= L(96): T.append(tagtxt('31 سنة', W / 2, 95, ease(seg(t, L(96), L(96) + .4)), PINK, 50))
        T.append(('أمّي', (W / 2, 120 if t < L(96) else 135), 30, WHITE, 1, False))
    else:
        hd, r = person(cv, W / 2, GROUND, 300, WHITE, 'stand', t, 0); smile(cv, hd, r, WHITE)
    return finish(base, cv.out(), T + caption(t), t)

def sh_facts4(t):
    base = background((8, 10, 24), (16, 20, 40), t, False); cv = Canvas(); T = []
    if t < L(101):
        T.append(('ما الحقيقي؟', (W / 2, 140), 80, GOLD, 1, True))
        if t >= L(99): T.append(('لا يوجد عدّاد فوق رأس أحد', (W / 2, 300), 48, WHITE, 1, False))
        if t >= L(100): T += [('متوسّط العمر = معدّل', (W / 2, 420), 48, CYAN, 1, True), ('وليس وعدًا', (W / 2, 510), 56, RED, ease(seg(t, L(100) + 1.4, L(100) + 1.8)), True)]
    else:
        T += [('يُقصّر العمر', (900, 110), 50, RED, 1, True)]
        items = [('التدخين', L(101) + 1.5), ('الجلوس الطويل', L(101) + 2.3), ('الوحدة', L(101) + 3.1)]
        for k, (s, ts) in enumerate(items):
            if t >= ts: T.append((s, (900, 220 + k * 90), 42, WHITE, 1, False))
        if t >= L(102):
            T.append(('يُطيل العمر', (380, 110), 50, GREEN, 1, True))
            for k, (s, ts) in enumerate([('النوم', L(103)), ('الحركة', L(103) + .9), ('الناس الذين تحبّهم', L(103) + 1.8)]):
                if t >= ts: T.append((s, (380, 220 + k * 90), 42, PINK if k == 2 else WHITE, 1, k == 2))
        cv.line((W / 2 + 20, 90), (W / 2 + 20, 520), (60, 70, 110), 3)
    return finish(base, cv.out(), T + caption(t), t)

def sh_cta(t):
    base = background(t=t); cv = Canvas(); ground(cv); door(cv)
    hd, r = person(cv, 580, GROUND - 4, 320, PINK, 'wave' if t > L(107) else 'stand', t, 0, hair='long'); smile(cv, hd, r, PINK)
    T = [tagtxt('31 سنة · 4 أشهر · 6 أيام', 580, 150, 1, CYAN, 40)]
    if t >= L(107):
        cv.rect(320, 470, 600, 540, WHITE, 5, r=30, fill=(40, 44, 60)); T.append(('لايك 👍'.replace('👍', ''), (460, 505), 40, WHITE, 1, False))
        cv.rect(680, 470, 1000, 540, RED, 5, r=30, fill=(180, 20, 30)); T.append(('اشترك', (840, 505), 40, WHITE, 1, False))
    return finish(base, cv.out(), T + caption(t), t)

SHOTS = [(0, 8, sh_room), (8, 11, sh_kitchen), (11, 17, sh_street), (17, 18, sh_wide), (18, 22, sh_facts1), (22, 24, sh_days), (24, 31, sh_park), (31, 37, sh_talk),
         (37, 43, sh_zero), (43, 48, sh_facts2), (48, 56, sh_friday), (56, 61, sh_walk), (61, 68, sh_cross), (68, 77, sh_after), (77, 81, sh_facts3),
         (81, 93, sh_mirror), (93, 98, sh_phone), (98, 104, sh_facts4), (104, 108, sh_cta)]
def frame_at(t):
    for a, b, f in SHOTS:
        ta = 0 if a == 0 else L(a) - .15; tb = DUR + 1 if b >= 108 else L(b) - .15
        if ta <= t < tb:
            img = f(t); k = seg(t, ta, ta + .2) if a else seg(t, 0, .3)
            return img * (.3 + .7 * k) * (1 - seg(t, DUR - .8, DUR))
    return np.zeros((H, W, 3), np.float32)
def render(i):
    t = i / FPS; cv2.imwrite(f'{FR}{i:05d}.png', frame_at(t)[..., ::-1].astype(np.uint8)); return i

if __name__ == '__main__':
    args = sys.argv[3:]
    if args and args[0] != 'all':
        for x in args: render(int(round(float(x) * FPS)))
        sys.exit()
    from concurrent.futures import ProcessPoolExecutor
    with ProcessPoolExecutor(2) as ex: list(ex.map(render, range(int(DUR * FPS)), chunksize=24))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{FR}%05d.png', '-i', VOICE, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21',
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', OUT], check=True)
    print('done')
