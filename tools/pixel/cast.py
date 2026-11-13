"""Cast for the countdown video, built from Universal-LPC layers.  Sprite(...) layers: (path with {anim}, palette kind, colour)."""
from lpc import Sprite, SP
import os

def eyes(age, mood='default', color='brown'):
    base = {'adult': 'eyes/human/adult', 'child': 'eyes/human/child', 'elderly': 'eyes/human/elderly'}[age]
    if mood != 'default' and not os.path.isdir(f'{SP}{base}/{mood}'): mood = 'default'
    return (f'{base}/{mood}/{{anim}}/{color}.png' if age == 'adult' else f'{base}/{{anim}}/{color}.png', None, None)

def person(body, skin, head, hair, hair_col, torso, torso_col, legs='pants', legs_col='navy', shoes_col='brown', hat=None, hat_col=None, beard=None, beard_col=None,
           apron=None, apron_col='white', mood='default', age='adult', eye_col='brown'):
    leg_t = {'male': 'male', 'female': 'thin', 'teen': 'thin'}[body]; shoe_t = leg_t if leg_t != 'male' else 'male'
    L = [(f'body/bodies/{body}/{{anim}}.png', 'body', skin),
         (f'feet/shoes/basic/{"thin" if body != "male" else "male"}/{{anim}}.png', 'cloth', shoes_col),
         (f'legs/{legs}/{leg_t}/{{anim}}.png', 'cloth', legs_col),
         (torso.format(b=body) + '/{anim}.png', 'cloth', torso_col)]
    if apron: L.append((f'torso/aprons/{apron}/{"male" if body == "male" else "female"}/{{anim}}.png', 'cloth', apron_col))
    L.append((f'head/heads/human/{head}/{{anim}}.png', 'body', skin))
    L.append(eyes(age, mood, eye_col))
    if beard: L.append((f'beards/beard/{beard}/{{anim}}.png', 'hair', beard_col or hair_col))
    if hair: L.append((f'hair/{hair}/adult/{{anim}}.png', 'hair', hair_col))
    if hat: L.append((f'hat/{hat}/adult/{{anim}}.png', 'cloth', hat_col))
    return Sprite(L)

def mom(mood='default'):
    return person('female', 'light', 'female', 'long', 'dark_brown', 'torso/clothes/longsleeve/scoop/{b}', 'rose', mood=mood)
def you(mood='default'):
    return person('teen', 'light', 'male', 'messy1', 'dark_brown', 'torso/clothes/longsleeve/longsleeve2_polo/{b}', 'teal', legs_col='charcoal', mood=mood)
def leo(mood='default'):
    return person('teen', 'amber', 'male', 'spiked', 'black', 'torso/clothes/longsleeve/longsleeve2_cardigan/{b}', 'orange', legs_col='navy', mood=mood)
def walter(mood='default'):
    return person('male', 'light', 'male_elderly', 'balding', 'white', 'torso/clothes/longsleeve/longsleeve2_cardigan/{b}', 'forest', legs_col='gray', beard='trimmed', beard_col='white', mood=mood, age='elderly' if False else 'adult')
def driver():
    return person('male', 'bronze', 'male', 'buzzcut', 'black', 'torso/clothes/longsleeve/longsleeve2_polo/{b}', 'navy', legs_col='charcoal')
def baker():
    return person('male', 'olive', 'male', 'plain', 'black', 'torso/clothes/longsleeve/longsleeve/{b}', 'white', legs_col='gray', apron='apron', apron_col='white', beard='medium', beard_col='black')
CROWD_SPECS = [
    ('female', 'taupe', 'female', 'bob', 'black', 'torso/clothes/longsleeve/longsleeve2_vneck/{b}', 'yellow'),
    ('male', 'light', 'male', 'parted', 'sandy', 'torso/clothes/longsleeve/longsleeve2_buttoned/{b}', 'sky'),
    ('female', 'brown', 'female', 'curly_long', 'black', 'torso/clothes/longsleeve/longsleeve2_scoop/{b}', 'purple'),
    ('male', 'amber', 'male', 'flat_top_fade', 'black', 'torso/clothes/longsleeve/longsleeve2_polo/{b}', 'red'),
    ('female', 'light', 'female', 'pixie', 'blonde', 'torso/clothes/longsleeve/longsleeve2_cardigan/{b}', 'green'),
    ('male', 'olive', 'male', 'buzzcut', 'dark_brown', 'torso/clothes/longsleeve/longsleeve/{b}', 'slate'),
]
def crowd(i):
    b, s, h, hr, hc, t, tc = CROWD_SPECS[i % len(CROWD_SPECS)]; return person(b, s, h, hr, hc, t, tc, legs_col=['navy', 'charcoal', 'brown', 'gray'][i % 4])
