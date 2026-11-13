"""10-second pixel-art sample (same scene as the toon3d test): Mom walks in and waves, kid runs in and hops.
Native 320x180, scaled x4 nearest-neighbour to 1280x720. Sprites: Universal LPC (credits required, CC-BY-SA 3.0 / GPL 3.0 / OGA-BY)."""
import os, subprocess, math, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from lpc import Sprite

W, H, S, FPS, DUR = 160, 90, 8, 24, 10.0
OUT = '/home/claude/out/pixel_sample10.mp4'; FR = '/home/claude/out/px10/'; os.makedirs(FR, exist_ok=True)
FLOOR = 82   # y of the feet line

mom = Sprite([('body/bodies/female/{anim}.png', 'body', 'light'), ('feet/shoes/basic/thin/{anim}.png', 'cloth', 'brown'), ('legs/pants/thin/{anim}.png', 'cloth', 'navy'),
              ('torso/clothes/longsleeve/scoop/female/{anim}.png', 'cloth', 'pink'), ('head/heads/human/female/{anim}.png', 'body', 'light'),
              ('eyes/human/adult/default/{anim}/brown.png', None, None), ('hair/long/adult/{anim}.png', 'hair', 'dark_brown')])
kid = Sprite([('body/bodies/child/{anim}.png', 'body', 'amber'), ('legs/pants/child/{anim}/blue.png', None, None), ('torso/clothes/shirt/child/{anim}/green.png', None, None),
              ('head/heads/human/child/{anim}.png', 'body', 'amber'), ('eyes/human/child/{anim}/brown.png', None, None), ('hair/wavy/child/{anim}.png', 'hair', 'blonde')])
UP, LEFT, DOWN, RIGHT = 0, 1, 2, 3

def background():
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im); top = 58   # wall/floor meet; feet stand well inside the floor
    d.rectangle((0, 0, W, top), fill=(236, 214, 178))
    for x in range(0, W, 8): d.line((x, 0, x, top - 16), fill=(228, 204, 166))
    d.rectangle((0, top - 16, W, top), fill=(196, 150, 106)); d.line((0, top - 16, W, top - 16), fill=(120, 82, 56))
    for x in range(4, W, 14): d.rectangle((x, top - 13, x + 10, top - 3), outline=(170, 126, 88))
    d.rectangle((14, 8, 54, 36), fill=(150, 205, 230), outline=(70, 50, 40)); d.line((34, 8, 34, 36), fill=(70, 50, 40)); d.line((14, 22, 54, 22), fill=(70, 50, 40))
    d.rectangle((17, 11, 24, 15), fill=(220, 240, 250))
    d.rectangle((108, 12, 132, 30), fill=(214, 160, 90), outline=(70, 50, 40)); d.ellipse((114, 15, 126, 27), fill=(246, 210, 120))
    d.rectangle((0, top, W, H), fill=(170, 116, 74))
    for i, y in enumerate(range(top, H, 5)):
        d.line((0, y, W, y), fill=(150, 100, 62))
        for x in range((i * 23) % 40, W, 40): d.line((x, y, x, y + 4), fill=(150, 100, 62))
    d.line((0, top, W, top), fill=(110, 70, 44))
    return im
BG = background()

def shadow(im, x, w=18):
    sh = Image.new('RGBA', (W, H)); ImageDraw.Draw(sh).ellipse((x - w // 2, FLOOR - 3, x + w // 2, FLOOR + 1), fill=(60, 30, 20, 70)); im.alpha_composite(sh)

def put(im, spr, anim, row, col, x, lift=0):
    f = spr.frame(anim, row, col); im.alpha_composite(f, (int(round(x)) - 32, FLOOR - 62 - int(round(lift))))

def mom_state(t):
    walk_end = 4.0; x0, x1 = 6, 55
    if t < walk_end: return 'walk', RIGHT, 1 + int(t * 9) % 8, x0 + (x1 - x0) * t / walk_end
    if t < 4.6: return 'walk', RIGHT, 0, x1
    if t < 5.3: return 'walk', DOWN, 0, x1
    if t < 8.4:   # spellcast frames 0-3 raise the arms, 4-5 alternate as a wave
        k = int((t - 5.3) * 10)
        col = k if k < 4 else (4 + (k // 3) % 2)
        return 'spellcast', DOWN, col, x1
    if t < 8.8: return 'spellcast', DOWN, max(0, 3 - int((t - 8.4) * 10)), x1
    return 'walk', DOWN, 0, x1

def kid_state(t):
    if t < 2.4: return None
    x0, x1 = 190, 108
    if t < 5.2: return 'walk', LEFT, 1 + int((t - 2.4) * 15) % 8, x0 + (x1 - x0) * (t - 2.4) / 2.8, 0
    if t < 5.8: return 'walk', LEFT, 0, x1, 0
    lift = 0
    if t > 6.4: lift = abs(math.sin((t - 6.4) * math.pi * 2.2)) * 7 * (1 if t < 9.2 else 0)
    return 'walk', DOWN, 0, x1, lift

def frame(i):
    t = i / FPS; im = BG.copy()
    ms = mom_state(t); ks = kid_state(t)
    shadow(im, int(ms[3]));
    if ks: shadow(im, int(ks[3]), int(14 - ks[4]))
    put(im, mom, ms[0], ms[1], ms[2], ms[3])
    if ks: put(im, kid, ks[0], ks[1], ks[2], ks[3], ks[4])
    im.convert('RGB').resize((W * S, H * S), Image.NEAREST).save(f'{FR}{i:04d}.png')

if __name__ == '__main__':
    for i in range(int(DUR * FPS)): frame(i)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{FR}%04d.png', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', OUT], check=True)
    print('done')
