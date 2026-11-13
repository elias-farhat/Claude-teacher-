"""Pixel sets (art pixels, PIL) for the countdown film."""
import math
from PIL import Image, ImageDraw
from px_engine import dither_grad, shade_rect, ptext

def _bricks(d, box, base, line):
    x0, y0, x1, y1 = box; d.rectangle(box, fill=base)
    for i, y in enumerate(range(y0, y1, 5)):
        d.line((x0, y, x1, y), fill=line)
        for x in range(x0 + (i % 2) * 6, x1, 12): d.line((x, y, x, y + 4), fill=line)

def street(W=520, H=230, crosswalk=False, evening=0.0):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    sky0 = (150, 200, 236) if evening < .5 else (240, 160, 120); sky1 = (236, 232, 214) if evening < .5 else (250, 210, 150)
    dither_grad(d, (0, 0, W - 1, 120), sky0, sky1)
    # far skyline
    for i, x in enumerate(range(-10, W, 46)):
        h = 40 + (i * 37) % 50; d.rectangle((x, 120 - h, x + 40, 120), fill=(150, 160, 180) if evening < .5 else (170, 120, 120))
    # main buildings
    cols = [(196, 120, 96), (214, 184, 140), (120, 150, 170), (200, 150, 110), (170, 110, 100), (220, 200, 160)]
    x = 0; k = 0
    while x < W:
        w = 70 + (k * 29) % 40; top = 40 + (k * 17) % 30; c = cols[k % len(cols)]
        if k % 2: _bricks(d, (x, top, x + w, 170), c, tuple(int(v * .86) for v in c))
        else: shade_rect(d, (x, top, x + w, 170), c)
        for wy in range(top + 10, 140, 22):
            for wx in range(x + 8, x + w - 12, 20):
                shade_rect(d, (wx, wy, wx + 11, wy + 14), (60, 70, 90)); d.line((wx + 1, wy + 1, wx + 10, wy + 1), fill=(160, 190, 220))
                if (wx + wy + k) % 3 == 0: d.rectangle((wx + 2, wy + 3, wx + 9, wy + 13), fill=(250, 220, 150))
        d.rectangle((x, top - 4, x + w, top), fill=tuple(int(v * .7) for v in c))
        x += w; k += 1
    # bakery storefront at x 300-380
    shade_rect(d, (300, 120, 384, 170), (240, 226, 200)); d.rectangle((306, 132, 340, 166), fill=(250, 214, 150)); d.rectangle((346, 130, 378, 170), fill=(130, 80, 50))
    for i in range(7): d.polygon([(300 + i * 12, 112), (312 + i * 12, 112), (312 + i * 12, 122), (300 + i * 12, 122)], fill=(220, 70, 70) if i % 2 else (250, 240, 230))
    shade_rect(d, (310, 100, 374, 111), (90, 60, 40)); ptext(d, (342, 99), 'BAKERY', 8, (250, 230, 180), 'ma', None)
    for i in range(4): d.ellipse((310 + i * 7, 150, 316 + i * 7, 156), fill=(200, 140, 70))
    # sidewalk + road
    d.rectangle((0, 170, W, 196), fill=(196, 190, 180))
    for xx in range(0, W, 20): d.line((xx, 170, xx - 6, 196), fill=(176, 170, 162))
    d.rectangle((0, 196, W, 199), fill=(150, 146, 140)); d.rectangle((0, 199, W, H), fill=(80, 82, 90))
    for xx in range(0, W, 40): d.rectangle((xx, 214, xx + 20, 216), fill=(230, 220, 160))
    if crosswalk:
        for i in range(8): d.polygon([(220 + i * 12, 199), (228 + i * 12, 199), (232 + i * 12 + 6, H), (222 + i * 12 + 6, H)], fill=(236, 236, 230))
    # bus stop sign
    d.rectangle((460, 120, 462, 172), fill=(90, 90, 96)); shade_rect(d, (452, 112, 470, 126), (40, 120, 200)); ptext(d, (461, 113), 'BUS', 6, (255, 255, 255), 'ma', None)
    return im

def traffic_light(green):
    im = Image.new('RGBA', (520, 230)); d = ImageDraw.Draw(im)
    d.rectangle((246, 124, 248, 182), fill=(60, 60, 66)); shade_rect(d, (241, 104, 253, 128), (40, 40, 44))
    d.ellipse((243, 106, 251, 114), fill=(70, 20, 20) if green else (255, 60, 50)); d.ellipse((243, 118, 251, 126), fill=(40, 255, 120) if green else (20, 60, 30))
    return im

def bus(W=520, H=230, x=380):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    body = [(x, 120), (x + 150, 120), (x + 150, 200), (x, 200)]
    d.rounded_rectangle((x, 118, x + 150, 204), 6, fill=(240, 190, 40), outline=(60, 40, 20))
    d.rectangle((x, 182, x + 150, 190), fill=(200, 150, 30))
    for i in range(4): d.rectangle((x + 40 + i * 27, 128, x + 62 + i * 27, 150), fill=(110, 150, 180))
    d.rectangle((x + 4, 124, x + 34, 196), fill=(0, 0, 0, 0))                       # open front door (see-through: interior + driver drawn behind)
    d.ellipse((x + 18, 196, x + 38, 216), fill=(30, 30, 34)); d.ellipse((x + 112, 196, x + 132, 216), fill=(30, 30, 34))
    return im

def stroller(x=150, y=196):
    im = Image.new('RGBA', (520, 230)); d = ImageDraw.Draw(im)
    d.pieslice((x - 18, y - 40, x + 18, y - 4), 180, 360, fill=(110, 140, 200), outline=(50, 60, 90)); d.rectangle((x - 18, y - 22, x + 18, y - 10), fill=(90, 120, 180))
    d.line((x + 18, y - 22, x + 30, y - 40), fill=(60, 60, 66), width=2); d.ellipse((x - 14, y - 6, x - 4, y + 3), fill=(40, 40, 44)); d.ellipse((x + 6, y - 6, x + 16, y + 3), fill=(40, 40, 44))
    d.ellipse((x - 9, y - 30, x + 3, y - 18), fill=(246, 210, 186)); d.point([(x - 6, y - 25), (x - 1, y - 25)], fill=(40, 30, 30))
    d.pieslice((x - 10, y - 32, x + 4, y - 22), 180, 360, fill=(250, 240, 200))
    return im

def park(W=420, H=230, evening=0.0):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    s0 = (150, 200, 236); s1 = (230, 236, 210)
    if evening: s0 = (236, 150, 110); s1 = (250, 214, 150)
    dither_grad(d, (0, 0, W - 1, 130), s0, s1)
    for i, x in enumerate(range(-20, W + 40, 34)):                                  # tree line
        r = 26 + (i * 13) % 14; cy = 104 - (i * 7) % 16
        g = (70, 130, 70) if not evening else (100, 110, 60)
        d.ellipse((x - r, cy - r, x + r, cy + r), fill=g); d.ellipse((x - r + 6, cy - r + 4, x + r - 12, cy + r - 16), fill=tuple(min(255, int(c * 1.18)) for c in g))
        d.rectangle((x - 3, cy + r - 6, x + 3, 140), fill=(110, 80, 56))
    d.rectangle((0, 132, W, H), fill=(110, 170, 90) if not evening else (130, 150, 80))
    for i in range(400): x = (i * 53) % W; y = 134 + (i * 29) % 96; d.point((x, y), fill=(90, 150, 76))
    d.polygon([(0, 186), (W, 176), (W, 206), (0, 214)], fill=(214, 196, 160))           # path
    # lamp post
    d.rectangle((320, 92, 323, 178), fill=(50, 54, 60)); d.ellipse((314, 84, 329, 96), fill=(250, 236, 180))
    return im

def bench(W=420, H=230, x0=150, x1=250, y=178, part='back'):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    if part == 'back':
        for k in range(3): shade_rect(d, (x0, y - 46 + k * 9, x1, y - 40 + k * 9), (150, 96, 60))
        d.rectangle((x0 + 6, y - 48, x0 + 10, y), fill=(60, 60, 66)); d.rectangle((x1 - 10, y - 48, x1 - 6, y), fill=(60, 60, 66))
    else:
        shade_rect(d, (x0 - 4, y - 18, x1 + 4, y - 12), (170, 110, 70)); d.rectangle((x0, y - 12, x0 + 4, y + 4), fill=(60, 60, 66)); d.rectangle((x1 - 4, y - 12, x1, y + 4), fill=(60, 60, 66))
    return im

def pigeons(t, n=5, cx=200, y=196, W=420, H=230, flown=0.0):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    for i in range(n):
        x = cx - 40 + i * 19 + int(3 * math.sin(t * .7 + i)); yy = y + (i % 2) * 4 - int(flown * (60 + i * 12)); peck = int((t * 2 + i * .37) % 1.6 < .3)
        c = (140, 146, 160); d.ellipse((x - 5, yy - 6, x + 5, yy), fill=c); d.ellipse((x + 2 - (0 if not peck else -1), yy - 9 + peck * 3, x + 7, yy - 4 + peck * 3), fill=(120, 126, 140))
        d.point((x + 5, yy - 7 + peck * 3), fill=(20, 20, 20)); d.point((x + 8, yy - 6 + peck * 3), fill=(230, 160, 60))
        if flown > 0: d.line((x - 6, yy - 4, x - 1, yy - 8 - int(4 * math.sin(t * 30 + i))), fill=c, width=2)
    for i in range(12): d.point((cx - 50 + (i * 23) % 100, y + 2 + (i % 3)), fill=(230, 200, 140))   # crumbs
    return im

def truck(x, W=520, H=230):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((x, 112, x + 150, 206), 4, fill=(200, 60, 50), outline=(60, 20, 20)); d.rectangle((x + 150, 136, x + 196, 206), fill=(220, 220, 226), outline=(60, 60, 66))
    d.rectangle((x + 160, 142, x + 190, 162), fill=(110, 150, 180)); ptext(d, (x + 75, 150), 'FREIGHT', 9, (250, 240, 220), 'mm', None)
    for wx in (x + 20, x + 60, x + 166): d.ellipse((wx, 196, wx + 24, 220), fill=(30, 30, 34)); d.ellipse((wx + 7, 203, wx + 17, 213), fill=(120, 120, 126))
    return im

def night_room(W=340, H=230):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    dither_grad(d, (0, 0, W - 1, 196), (54, 62, 96), (40, 46, 74))
    for x in range(0, W, 10): d.line((x, 0, x, 194), fill=(50, 58, 90))
    shade_rect(d, (24, 60, 84, 120), (70, 80, 110)); dither_grad(d, (29, 65, 79, 115), (20, 30, 70), (60, 60, 110))       # dark window
    d.ellipse((60, 72, 70, 82), fill=(240, 240, 220))                                                                   # moon
    d.rectangle((0, 196, W, H), fill=(70, 56, 60)); [d.line((0, y, W, y), fill=(60, 48, 52)) for y in range(198, H, 7)]
    shade_rect(d, (250, 150, 300, 196), (110, 80, 60)); d.rectangle((268, 130, 272, 150), fill=(80, 80, 86)); d.polygon([(258, 130), (282, 130), (276, 116), (264, 116)], fill=(250, 220, 150))  # lamp
    return im

def mirror_frame(W=340, H=230, x0=120, x1=220, y0=60, y1=200):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((x0 - 6, y0 - 6, x1 + 6, y1 + 6), 8, fill=(150, 110, 60), outline=(70, 50, 30))
    d.rectangle((x0, y0, x1, y1), fill=(0, 0, 0, 0))
    return im

def mirror_glass(W=340, H=230, x0=120, x1=220, y0=60, y1=200):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    dither_grad(d, (x0, y0, x1, y1), (60, 80, 110), (40, 56, 84))
    for k in range(3): d.line((x0 + 10 + k * 8, y0 + 4, x0 + 40 + k * 8, y0 + 34), fill=(110, 130, 160))
    return im

def chalkboard(W=300, H=170):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    dither_grad(d, (0, 0, W - 1, H - 1), (210, 190, 160), (180, 160, 130))
    shade_rect(d, (14, 12, W - 14, H - 26), (120, 84, 50)); dither_grad(d, (20, 18, W - 21, H - 33), (52, 76, 64), (40, 60, 52))
    for i in range(40): d.point(((i * 71) % (W - 50) + 24, (i * 37) % (H - 60) + 22), fill=(70, 96, 84))
    shade_rect(d, (10, H - 26, W - 10, H - 20), (150, 104, 64))
    for i, c in enumerate([(250, 250, 240), (250, 210, 120), (150, 210, 250)]): d.rectangle((40 + i * 12, H - 30, 48 + i * 12, H - 27), fill=c)
    return im

def phone_screen(t, msgs):
    """phone UI 110x190 art px; msgs: list of (side, text, alpha)"""
    im = Image.new('RGBA', (130, 220)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((8, 4, 122, 214), 12, fill=(30, 30, 36), outline=(10, 10, 12))
    d.rectangle((14, 18, 116, 200), fill=(236, 240, 246)); d.rectangle((14, 18, 116, 34), fill=(70, 110, 190)); ptext(d, (65, 21), 'Mom', 9, (255, 255, 255), 'ma', None)
    y = 44
    for side, s, a in msgs:
        if a <= 0: continue
        w = 14 + len(s) * 7 if not s.startswith('<3') else 52
        x0 = 112 - w if side == 'r' else 18
        col = (70, 140, 250) if side == 'r' else (214, 216, 224)
        d.rounded_rectangle((x0, y, x0 + w, y + 18), 6, fill=col)
        if s.startswith('<3'):
            for k in range(3):
                hx = x0 + 10 + k * 15; d.ellipse((hx - 5, y + 4, hx, y + 9), fill=(230, 50, 80)); d.ellipse((hx, y + 4, hx + 5, y + 9), fill=(230, 50, 80)); d.polygon([(hx - 5, y + 7), (hx + 5, y + 7), (hx, y + 14)], fill=(230, 50, 80))
        else: ptext(d, (x0 + 7, y + 4), s, 9, (255, 255, 255) if side == 'r' else (30, 30, 36), 'la', None)
        y += 24
    return im

def bus_interior(W=520, H=230, x=380):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im); d.rectangle((x + 2, 122, x + 40, 198), fill=(54, 60, 70)); d.rectangle((x + 2, 122, x + 40, 130), fill=(40, 44, 52)); return im
