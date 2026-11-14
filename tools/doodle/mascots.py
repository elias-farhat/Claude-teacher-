import math, cv2
from doodle import *
def qmark(p, cx, cy, s, col, w=12):
    pts=[(cx+s*math.cos(math.radians(a)), cy+s*math.sin(math.radians(a))) for a in range(200,420,10)]
    pts+= [(cx+s*.05, cy+s*1.3)]
    p.limb(pts, col, w); p.circ(cx+s*.05, cy+s*1.9, w*.7, col, OL, 3)
def hoodie_guy(p, x, feet, t=1.0):
    w = Who(1, shirt=(232, 120, 40), hair='short', hair_col=(40, 30, 26), glasses=True)
    hx, hy, r = person(p, w, x, feet, 380, 'point', t, 'smile', look=1)
    p.circ(x, feet-205, 30, (255,255,255), OL, 4); p.text((x, feet-203), '؟', 42, (232,120,40))
def watch_buddy(p, x, feet, t=1.0):
    r=95; cy=feet-170
    p.ell(x, feet+4, r*.9, 12, (0,0,0,60), None)
    for s in (-1,1): p.limb([(x+s*30, cy+r*.85), (x+s*36, feet-20)], (60,60,66), 14); p.ell(x+s*44, feet-12, 26, 12, (40,40,44), OL, 3)
    for s,a in ((-1,20),(1,150)): p.limb([(x+s*r*.92, cy+10), (x+s*(r+40), cy+10-math.sin(math.radians(a))*60*s*-1 if s>0 else cy+60)], (60,60,66), 12)
    p.circ(x, cy-r-22, 18, (220,180,70), OL, 4); p.rect(x-12, cy-r-10, x+12, cy-r+6, (220,180,70), OL, 3)
    p.circ(x, cy, r, (230,190,80), OL, 6); p.circ(x, cy, r-16, (250,246,234), OL, 3)
    for k in range(12):
        a=math.radians(k*30); p.line([(x+math.sin(a)*(r-24), cy-math.cos(a)*(r-24)), (x+math.sin(a)*(r-32), cy-math.cos(a)*(r-32))], OL, 3)
    for s in (-1,1): p.circ(x+s*28, cy-12, 20, (255,255,255), OL, 4); p.circ(x+s*28+6, cy-10, 8, OL, None)
    p.chord(x, cy+26, 26, 18, 0, 180, (110,36,40), OL, 3)
    p.line([(x, cy+48), (x, cy+66)], (200,50,40), 4)
def lantern_girl(p, x, feet, t=1.0):
    w = Who(0, scarf=(40,120,110), dress=(236,200,120))
    hx, hy, r = person(p, w, x, feet, 360, 'phone', t, 'happy')
    lx, ly = x+r*1.6, feet-200
    p.line([(lx, ly-70), (lx, ly-40)], OL, 4); p.rect(lx-30, ly-40, lx+30, ly+40, (255,220,120), OL, 4, r=10)
    p.text((lx, ly), '؟', 40, (200,80,30))
p = Pic(); p.im = grad((232,226,210),(206,196,176)); p.d = ImageDraw.Draw(p.im)
hoodie_guy(p, 230, 620); watch_buddy(p, 640, 620); lantern_girl(p, 1020, 620)
for x,s in ((230,'١ — صاحب الفضول'),(640,'٢ — دقيقة'),(1020,'٣ — نور')): label(p, x, 670, s, 28, 'navy')
label(p, W/2, 60, 'اختر شخصية القناة', 36, 'red')
cv2.imwrite('/home/claude/out/mascots.png', post(p.out(), 1.0)[...,::-1].astype('uint8'))
