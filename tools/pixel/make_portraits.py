"""Toon-head (DiceBear, CC BY 4.0 Johan Melin) portraits -> 112 px pixel portraits, per character and mood."""
import json, sys, subprocess, os
import numpy as np
from PIL import Image
os.chdir('/home/claude/libs'); sys.path[:0] = ['py', 'dicebear/src/python/core/src']
from dicebear import Avatar, Style
st = Style(json.load(open('dstyles/src/toon-head.json')))
OUT = '/home/claude/claude-teacher-/engine/art/pxportrait/'
C = {
 'mom':    dict(rearHairVariant=['longStraight'], rearHairProbability=100, hairVariant=['sideComed'], clothesVariant=['turtleNeck'], clothesColor=['c2547a'], skinColor=['f1c3a5'], hairColor=['3b2219'], beardProbability=0),
 'you':    dict(rearHairProbability=0, hairVariant=['undercut'], clothesVariant=['tShirt'], clothesColor=['1f8a8a'], skinColor=['f1c3a5'], hairColor=['3b2219'], beardProbability=0),
 'leo':    dict(rearHairProbability=0, hairVariant=['spiky'], clothesVariant=['openJacket'], clothesColor=['e8742a'], skinColor=['c68e7a'], hairColor=['1a1214'], beardProbability=0),
 'walter': dict(rearHairProbability=0, hairProbability=0, clothesVariant=['openJacket'], clothesColor=['2f6a3c'], skinColor=['f1c3a5'], hairColor=['dcd8d0'], beardVariant=['fullBeard'], beardProbability=100),
 'bro':    dict(rearHairProbability=0, hairVariant=['spiky'], clothesVariant=['tShirt'], clothesColor=['c0392b'], skinColor=['f1c3a5'], hairColor=['3b2219'], beardProbability=0),
 'driver': dict(rearHairProbability=0, hairVariant=['undercut'], clothesVariant=['shirt'], clothesColor=['26386b'], skinColor=['a36b4f'], hairColor=['1a1214'], beardProbability=0),
}
MOODS = {'neutral': ('wide', 'neutral', 'smile'), 'talk': ('wide', 'neutral', 'agape'), 'happy': ('happy', 'happy', 'laugh'), 'smile': ('happy', 'happy', 'smile'),
         'sad': ('humble', 'sad', 'sad'), 'shock': ('wide', 'raised', 'agape'), 'worry': ('wide', 'sad', 'sad'), 'closed': ('humble', 'neutral', 'smile')}
def pixelize(png, n=28):
    a = np.array(Image.open(png).convert('RGBA')); al = a[..., 3] > 110
    rgb = Image.fromarray(a[..., :3]).quantize(n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    o = np.dstack([np.array(rgb), (al * 255).astype(np.uint8)])
    edge = al & ~(np.roll(al, 1, 0) & np.roll(al, -1, 0) & np.roll(al, 1, 1) & np.roll(al, -1, 1)); o[edge, :3] = (o[edge, :3] * .35).astype(np.uint8)
    return Image.fromarray(o)
for who, o in C.items():
    for mood, (e, b, m) in MOODS.items():
        svg = Avatar(st, dict(o, seed=who, eyesVariant=[e], eyebrowsVariant=[b], mouthVariant=[m])).to_string()
        sp = f'/tmp/p_{who}_{mood}.svg'; open(sp, 'w').write(svg)
        subprocess.run(['rsvg-convert', '-w', '112', '-h', '112', sp, '-o', sp + '.png'], check=True)
        pixelize(sp + '.png').save(f'{OUT}{who}_{mood}.png')
print('ok')
