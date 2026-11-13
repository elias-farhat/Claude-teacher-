"""Compose Universal-LPC sprite layers (PNG only, no code from the repo is run) with palette recolors.
Sheets: 64x64 frames; rows 0 up, 1 left, 2 down, 3 right."""
import json, os
from PIL import Image
ROOT = '/home/claude/lpc_src/ulpc/'
SP = ROOT + 'spritesheets/'
PAL = {k: json.load(open(f'{ROOT}palette_definitions/{k}/{k}_ulpc.json')) for k in ('cloth', 'hair', 'body')}
BASE = {'cloth': 'white', 'hair': 'orange', 'body': 'light'}
def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def recolor(im, kind, target):
    if not kind or not target or target == BASE[kind]: return im
    src = [hexrgb(c) for c in PAL[kind][BASE[kind]]]; dst = [hexrgb(c) for c in PAL[kind][target]]
    m = {s: d for s, d in zip(src, dst)}; px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in m: px[x, y] = m[(r, g, b)] + (a,)
    return im

_cache = {}
def layer(path, kind=None, color=None):
    k = (path, kind, color)
    if k not in _cache:
        if not os.path.exists(SP + path): _cache[k] = None
        else: _cache[k] = recolor(Image.open(SP + path).convert('RGBA'), kind, color)
    return _cache[k]

class Sprite:
    def __init__(self, layers): self.layers = layers   # list of (path_template with {anim}, kind, color)
    def sheet(self, anim):
        ims = [layer(p.format(anim=anim), k, c) for p, k, c in self.layers]
        ims = [i for i in ims if i is not None]
        out = Image.new('RGBA', ims[0].size)
        for i in ims:
            if i.size == out.size: out.alpha_composite(i)
        return out
    def frame(self, anim, row, col):
        s = self.sheet(anim); n = s.size[0] // 64; col %= n
        return s.crop((col * 64, row * 64, col * 64 + 64, row * 64 + 64))
    def nframes(self, anim): return self.sheet(anim).size[0] // 64
