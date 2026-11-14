import sys, re, subprocess, io
sys.path.insert(0, '/home/claude/claude-teacher-/tools/rig')
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from toon3d import Char, build
W, H = 1280, 720
F = '/home/claude/claude-teacher-/engine/fonts/Tajawal-Bold.ttf'
def font(s): return ImageFont.truetype(F, s, layout_engine=ImageFont.Layout.RAQM)
def sil(ch, pose, px, cx, feet, col='#0b0a12'):
    r = build(ch, pose, px=px, origin=(0, 0)); svg = r['svg']
    svg = re.sub(r'fill="#[0-9a-fA-F]{6}"', f'fill="{col}"', svg); svg = re.sub(r'fill-opacity="[^"]*"', '', svg)
    svg = re.sub(r'stroke="#[0-9a-fA-F]{3,6}"', f'stroke="{col}"', svg)
    h = ch.a['H'] * px
    doc = f'<svg xmlns="http://www.w3.org/2000/svg" width="{int(px*3)}" height="{int(h+px)}" viewBox="{-px*1.5} {-px*.3} {px*3} {h+px}">{svg}</svg>'
    png = subprocess.run(['rsvg-convert'], input=doc.encode(), capture_output=True).stdout
    im = Image.open(io.BytesIO(png)).convert('RGBA'); return im, (int(cx - px * 1.5), int(feet - h - px * .3 * 1 + 0))
def sky(top, bot, sun=None):
    t = np.linspace(0, 1, H)[:, None, None]; a = np.array(top, float); b = np.array(bot, float)
    img = (a + (b - a) * t ** 1.3) * np.ones((1, W, 1)); img = img.astype(np.float32)
    if sun:
        yy, xx = np.mgrid[0:H, 0:W]; d = np.sqrt((xx - sun[0]) ** 2 + (yy - sun[1]) ** 2)
        img += (np.clip(1 - d / 520, 0, 1) ** 2)[..., None] * np.array([255, 170, 90]) * .55
        img[d < sun[2]] = [255, 236, 200]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')
def city(img, base, col, seed, hmin, hmax):
    d = ImageDraw.Draw(img); rng = np.random.default_rng(seed); x = -20
    while x < W:
        w = int(rng.integers(50, 120)); h = int(rng.integers(hmin, hmax)); d.rectangle((x, base - h, x + w, base), fill=col)
        if rng.random() < .3: d.rectangle((x + w // 3, base - h - 30, x + w // 3 + 6, base - h), fill=col)
        x += w - 4
    d.rectangle((0, base, W, H), fill=col)
def glow_text(img, s, xy, size, col=(120, 240, 255)):
    lay = Image.new('RGBA', img.size); d = ImageDraw.Draw(lay)
    d.text(xy, s, font=font(size), fill=col + (255,), anchor='mm', direction='rtl', language='ar')
    g = lay.filter(ImageFilter.GaussianBlur(14)); img.alpha_composite(g); img.alpha_composite(g); img.alpha_composite(lay)
def caption(img, s):
    d = ImageDraw.Draw(img)
    d.text((W / 2, H - 70), s, font=font(46), fill=(255, 255, 255), anchor='mm', direction='rtl', language='ar', stroke_width=5, stroke_fill=(0, 0, 0))
img = sky((40, 30, 80), (255, 150, 90), sun=(860, 470, 60))
city(img, 560, (90, 60, 110), 1, 120, 300); city(img, 600, (40, 28, 60), 2, 60, 200)
d = ImageDraw.Draw(img); d.rectangle((0, 600, W, H), fill=(14, 12, 22))
mom = Char('adult_f', hair='long'); im, pos = sil(mom, dict(yaw=25), 110, 520, 640, '#0e0c16'); img.alpha_composite(im, pos)
kid = Char('child', hair='spiky'); im2, pos2 = sil(kid, dict(yaw=-20), 110, 760, 640, '#0e0c16'); img.alpha_composite(im2, pos2)
glow_text(img, '31 سنة  4 أشهر  6 أيام', (520, 130), 40)
glow_text(img, '72 سنة', (760, 260), 40)
caption(img, 'وفوقَ رأسِ أمِّك... أرقامٌ متوهِّجة')
img.convert('RGB').save('/tmp/sil.png')
