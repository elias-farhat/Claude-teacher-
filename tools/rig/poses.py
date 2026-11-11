import math, json
from rig import *
OUT = '/home/claude/claude-teacher-/engine/art/rig/'
import os; os.makedirs(OUT, exist_ok=True)
def svg(w, h, body): return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>'
def sides_only(pts, fill):   # filled shape whose TOP edge has no outline (so it continues seamlessly out of the avatar clothes)
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
    s = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts[1:]) 
    return f'<path d="{d}" fill="{fill}"/><path d="{s}" fill="none" stroke="#000" stroke-width="{STROKE}" stroke-linejoin="round"/>'
def ang(p, q): return math.degrees(math.atan2(q[0] - p[0], q[1] - p[1]))
def dist(p, q): return math.hypot(q[0] - p[0], q[1] - p[1])
FIG = {}

# ---------------- 1. Mom standing, adult female H = 5.5 ----------------
H = RULES['height_heads']['adult']; L = landmarks(H); cx = 391.5; S = CLOTHES_X1 - CLOTHES_X0
waist, hip = S * RULES['waist_over_shoulder']['f'], S * RULES['hip_over_shoulder']['f']
top, legs, shoe, skin = '#ec4899', '#2a3550', '#3f2626', '#f1c3a5'
yw, yh, ybot = (L['chest'] + L['navel']) / 2 + 40, L['crotch'] - 70, L['crotch'] - 10
torso = [(117, 860), (666, 860), (cx + S / 2 - 6, 960), (cx + waist / 2, yw), (cx + hip / 2, yh), (cx + hip / 2 - 20, ybot), (cx - hip / 2 + 20, ybot), (cx - hip / 2, yh), (cx - waist / 2, yw), (cx - S / 2 + 6, 960)]
lw = RULES['limb_w_u']
hipJ = [(cx - hip * .24, L['crotch'] - 40), (cx + hip * .24, L['crotch'] - 40)]
ankle_y = L['sole'] - 58; legLen = ankle_y - hipJ[0][1]; thigh = legLen * RULES['thigh_to_shin'] / (1 + RULES['thigh_to_shin']); shin = legLen - thigh
parts = []; body = []
for hj in hipJ:
    kn = (hj[0], hj[1] + thigh); an = (hj[0], ankle_y)
    parts += [('thigh', capsule(hj, kn, lw['thigh'] * U, lw['thigh'] * U * .9)), ('shin', capsule(kn, an, lw['thigh'] * U * .85, lw['shin'] * U))]
    body += [poly(capsule(hj, kn, lw['thigh'] * U, lw['thigh'] * U * .9), legs), poly(capsule(kn, an, lw['thigh'] * U * .85, lw['shin'] * U), legs)]
    sx = 1 if hj[0] > cx else -1; fl = lw['foot_len'] * U
    foot = [(an[0] - fl * .5, L['sole']), (an[0] - fl * .5, an[1] + 6), (an[0] + fl * .5, an[1] + 6), (an[0] + fl * .5, L['sole'] - 14), (an[0] + fl * .5 - 14, L['sole'])]
    parts.append(('foot', foot)); body.append(poly(foot, shoe))
body.insert(0, f'<ellipse cx="{cx}" cy="{L["sole"]}" rx="{hip * .8:.0f}" ry="26" {SHADOW}/>')
body.append(head_svg(dict(seed='mom', rearHairVariant=['longStraight'], rearHairProbability=100, hairVariant=['sideComed'], clothesVariant=['turtleNeck'], clothesColor=['ec4899'], skinColor=['f1c3a5'], hairColor=['724133'], beardProbability=0, eyesVariant=['wide'], mouthVariant=['smile'], eyebrowsVariant=['happy'])))
body.append(sides_only(torso, top)); parts.append(('torso', torso))
body.append(poly([(cx - waist / 2 + 4, yw), (cx + waist / 2 - 4, yw), (cx + hip / 2 - 4, yh), (cx - hip / 2 + 4, yh)], 0, shadow=True))
arm_len = L['crotch'] - 900; upper = arm_len * RULES['upper_to_forearm'] / (1 + RULES['upper_to_forearm']); fore = arm_len - upper
for sx in (-1, 1):
    sh = (cx + sx * (S / 2 - lw['upper'] * U * .45), 880); el = at(sh, sx * 4, upper); wr = at(el, sx * 1, fore)
    hand = capsule(wr, at(wr, sx * 2, RULES['hand_len_u'] * U * .8), lw['fore'] * U * .9, lw['fore'] * U * .75)
    body += [poly(capsule(sh, el, lw['upper'] * U, lw['upper'] * U * .9), top), poly(capsule(el, wr, lw['fore'] * U * 1.05, lw['fore'] * U), top), poly(hand, skin)]
    parts += [('upper', capsule(sh, el, lw['upper'] * U, lw['upper'] * U * .9)), ('fore', capsule(el, wr, lw['fore'] * U * 1.05, lw['fore'] * U)), ('hand', hand)]
FIG['mom_standing'] = dict(w=784, h=int(L['sole'] + 60), svg=''.join(body), H=H, ground=L['sole'], kind='stand',
   ratios={'upper/fore': upper / fore, 'thigh/shin': thigh / shin}, joints={}, parts=parts)

# ---------------- 2. Bus driver, side view seated (profile, facing left), adult male H = 5.5 ----------------
R = RULES['seat']; shirt, pants, skin, hair, cap = '#3a5a8a', '#22283a', '#a36b4f', '#2c1b18', '#0b3286'
torsoLen = L['crotch'] - 40 - 687          # hip joint -> shoulder (same landmarks as standing)
hipJ = (560.0, 1500.0)
tor_dir = 180 - R['recline']                # 'at' angle: 180 = straight up; recline leans back (+x = behind, facing left)
shJ = at(hipJ, 180 - R['recline'], torsoLen)
shJ = (hipJ[0] + math.sin(math.radians(R['recline'])) * torsoLen, hipJ[1] - math.cos(math.radians(R['recline'])) * torsoLen)
thigh_dir = (180 - R['recline']) - R['hip']             # rotate torso direction by the hip angle toward the front (-x)
th_len = legLen * RULES['thigh_to_shin'] / (1 + RULES['thigh_to_shin']); sh_len = legLen - th_len
knee = at(hipJ, thigh_dir + 360, th_len)
shin_dir = thigh_dir + 180 - R['knee']
ankle = at(knee, shin_dir, sh_len)
upper_dir = -R['upper_arm_fwd']; elbow = at(shJ, upper_dir, upper)
fore_dir = upper_dir - (180 - R['elbow']); wrist = at(elbow, fore_dir, fore)
seat_top = hipJ[1] + lw['thigh'] * U * .5 * (1 - R['sink'])
b = []
b.append(poly([(hipJ[0] - 40, seat_top), (hipJ[0] + 230, seat_top), (hipJ[0] + 250, seat_top + 110), (hipJ[0] - 60, seat_top + 110)], '#34343f'))      # cushion
back = [at((hipJ[0] + 150, seat_top + 20), 180 - R['recline'], 0), at((hipJ[0] + 150, seat_top + 20), 180 - R['recline'], 900)]
b.append(poly(capsule(back[0], back[1], 120, 110), '#2b2b33'))
b.append(poly([(hipJ[0] + 60, seat_top + 110), (hipJ[0] + 120, seat_top + 110), (hipJ[0] + 120, ankle[1] + 70), (hipJ[0] + 60, ankle[1] + 70)], '#1e1e26'))
leg_parts = [capsule(hipJ, knee, lw['thigh'] * U * 1.1, lw['thigh'] * U * .9), capsule(knee, ankle, lw['thigh'] * U * .85, lw['shin'] * U)]
foot = [(ankle[0] + 40, ankle[1] - 20), (ankle[0] + 40, ankle[1] + 58), (ankle[0] - lw['foot_len'] * U, ankle[1] + 58), (ankle[0] - lw['foot_len'] * U, ankle[1] + 20), (ankle[0] - 40, ankle[1] - 20)]
b += [poly(p, pants) for p in leg_parts] + [poly(foot, '#151613')]
pel = capsule(hipJ, at(hipJ, 180 - R['recline'], 160), .62 * U, .58 * U); chest = capsule(at(hipJ, 180 - R['recline'], 140), shJ, .58 * U, .5 * U)
b += [poly(pel, pants), poly(chest, shirt), poly(capsule(at(hipJ, 180 - R['recline'], 160), at(hipJ, 180 - R['recline'], 260), .52 * U, .52 * U), shirt)]
neck_top = at(shJ, 180 - R['recline'] + 12, .28 * U); b.append(poly(capsule(shJ, neck_top, .3 * U, .28 * U), skin))
# profile head: height U, depth .92U (E), eye at .59U from top (measured from toon-head front view), cream/iris like the library
hc = (neck_top[0] - .08 * U, neck_top[1] - .52 * U); hw, hh = .46 * U, .5 * U
wheel_c = at(wrist, -100, 0)
b.append(f'<g transform="translate({wrist[0] - 60:.0f} {wrist[1] - 10:.0f}) rotate(-22)"><ellipse rx="34" ry="190" fill="none" stroke="#1e1e26" stroke-width="30"/></g>')
b.append(poly(capsule((wrist[0] - 60, wrist[1] + 150), (wrist[0] - 140, wrist[1] + 520), 34, 34), '#3a3a44'))
b.append(poly(capsule(shJ, elbow, lw['upper'] * U * 1.05, lw['upper'] * U), shirt)); b.append(poly(capsule(elbow, wrist, lw['fore'] * U * 1.05, lw['fore'] * U * .95), shirt))
hand = capsule(wrist, at(wrist, fore_dir, RULES['hand_len_u'] * U * .55), lw['fore'] * U * 1.0, lw['fore'] * U * .9)
b.append(f'<g transform="translate({wrist[0] - 60:.0f} {wrist[1] - 10:.0f}) rotate(-22)"><path d="M -34 -60 A 34 190 0 0 0 -34 60" fill="none" stroke="#1e1e26" stroke-width="30"/></g>')   # front rim over the hand? (rim behind first, hand, then near rim segment)
b.append(poly(hand, skin))
b.append(f'<g transform="translate({wrist[0] - 60:.0f} {wrist[1] - 10:.0f}) rotate(-22)"><path d="M -30 -40 A 34 190 0 0 0 -30 40" fill="none" stroke="#1e1e26" stroke-width="26"/></g>')
x0, y0 = hc
head = (f'<g transform="translate({x0:.1f} {y0:.1f})">'
  f'<path d="M {-hw*.95:.0f} {-hh*.05:.0f} C {-hw:.0f} {-hh*.9:.0f} {hw*.9:.0f} {-hh*1.15:.0f} {hw:.0f} {-hh*.1:.0f} C {hw*1.02:.0f} {hh*.5:.0f} {hw*.4:.0f} {hh*.95:.0f} {-hw*.15:.0f} {hh:.0f} C {-hw*.6:.0f} {hh:.0f} {-hw*.82:.0f} {hh*.75:.0f} {-hw*.86:.0f} {hh*.42:.0f} L {-hw*1.06:.0f} {hh*.2:.0f} L {-hw*.92:.0f} {hh*.1:.0f} Z" fill="{skin}" stroke="#000" stroke-width="{STROKE}"/>'
  f'<path d="M {hw*.18:.0f} {hh*.02:.0f} q {hw*.3:.0f} {-hh*.18:.0f} {hw*.38:.0f} {hh*.12:.0f} q 0 {hh*.3:.0f} {-hw*.3:.0f} {hh*.26:.0f} Z" fill="{skin}" stroke="#000" stroke-width="{STROKE}"/><path d="M {hw*.26:.0f} {hh*.08:.0f} q {hw*.18:.0f} {-hh*.08:.0f} {hw*.22:.0f} {hh*.08:.0f} q -4 {hh*.16:.0f} {-hw*.18:.0f} {hh*.14:.0f} Z" {SHADOW}/>'
  f'<path d="M {-hw*.95:.0f} {-hh*.05:.0f} C {-hw:.0f} {-hh*.95:.0f} {hw*.9:.0f} {-hh*1.2:.0f} {hw:.0f} {-hh*.1:.0f} L {hw*.95:.0f} {hh*.3:.0f} L {hw*.55:.0f} {hh*.2:.0f} C {hw*.5:.0f} {-hh*.25:.0f} {-hw*.3:.0f} {-hh*.35:.0f} {-hw*.9:.0f} {-hh*.25:.0f} Z" fill="{hair}" stroke="#000" stroke-width="{STROKE}"/>'
  f'<path d="M {-hw*1.0:.0f} {-hh*.42:.0f} C {-hw*.95:.0f} {-hh*1.25:.0f} {hw*1.0:.0f} {-hh*1.25:.0f} {hw*1.02:.0f} {-hh*.42:.0f} Z" fill="{cap}" stroke="#000" stroke-width="{STROKE}"/><path d="M {-hw*1.55:.0f} {-hh*.46:.0f} L {-hw*.9:.0f} {-hh*.5:.0f} L {-hw*.9:.0f} {-hh*.36:.0f} L {-hw*1.5:.0f} {-hh*.34:.0f} Z" fill="{cap}" stroke="#000" stroke-width="{STROKE}"/>'
  f'<path d="M {-hw*.98:.0f} {-hh*.42:.0f} L {hw*1.02:.0f} {-hh*.42:.0f} L {hw*1.0:.0f} {-hh*.3:.0f} L {-hw*.95:.0f} {-hh*.3:.0f} Z" {SHADOW}/>'
  f'<path d="M {-hw*.74:.0f} {-hh*.02:.0f} q {hw*.14:.0f} {-hh*.14:.0f} {hw*.3:.0f} 0 q {-hw*.06:.0f} {hh*.12:.0f} {-hw*.16:.0f} {hh*.12:.0f} q {-hw*.12:.0f} 0 {-hw*.14:.0f} {-hh*.12:.0f}Z" fill="#f6f1e4"/><circle cx="{-hw*.62:.0f}" cy="{hh*.02:.0f}" r="{hh*.075:.0f}" fill="#4b2422"/>'
  f'<path d="M {-hw*.82:.0f} {-hh*.16:.0f} q {hw*.18:.0f} {-hh*.08:.0f} {hw*.34:.0f} 0" fill="none" stroke="{hair}" stroke-width="10" stroke-linecap="round"/>'
  f'<path d="M {-hw*.86:.0f} {hh*.5:.0f} q {hw*.14:.0f} {hh*.06:.0f} {hw*.24:.0f} {-hh*.02:.0f}" fill="none" stroke="#611519" stroke-width="5" stroke-linecap="round"/>'
  f'<path d="M {-hw*.6:.0f} {hh*.92:.0f} Q {-hw*.1:.0f} {hh*1.0:.0f} {hw*.4:.0f} {hh*.7:.0f} L {hw*.3:.0f} {hh*.86:.0f} Q {-hw*.1:.0f} {hh*1.1:.0f} {-hw*.6:.0f} {hh*.98:.0f} Z" {SHADOW}/></g>')
b.append(head)
parts_d = [('pelvis', pel), ('chest', chest), ('thigh', leg_parts[0]), ('shin', leg_parts[1]), ('foot', foot), ('upper', capsule(shJ, elbow, lw['upper'] * U * 1.05, lw['upper'] * U)), ('fore', capsule(elbow, wrist, lw['fore'] * U * 1.05, lw['fore'] * U * .95)), ('hand', hand)]
def jang(a, b_, c):   # interior angle at b_
    v1 = (a[0] - b_[0], a[1] - b_[1]); v2 = (c[0] - b_[0], c[1] - b_[1])
    return math.degrees(math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (math.hypot(*v1) * math.hypot(*v2))))
FIG['driver_side'] = dict(w=1100, h=int(ankle[1] + 220), svg=''.join(b), kind='seat', seat_top=seat_top, seat_x=(hipJ[0] - 40, hipJ[0] + 230),
   ratios={'upper/fore': upper / fore, 'thigh/shin': th_len / sh_len}, joints={'hip': jang(shJ, hipJ, knee), 'knee': jang(hipJ, knee, ankle), 'elbow': jang(shJ, elbow, wrist), 'upper_arm_fwd': abs(upper_dir)},
   grip=(hand, ('ellipse', wrist[0] - 60, wrist[1] - 10, 34, 190, -22)), parts=parts_d, H=None)
json.dump({k: {kk: vv for kk, vv in v.items() if kk not in ('svg', 'parts', 'grip')} for k, v in FIG.items()}, open(OUT + 'meta.json', 'w'), indent=1)
for k, v in FIG.items(): open(OUT + k + '.svg', 'w').write(svg(v['w'], v['h'], v['svg']))
import pickle; pickle.dump({k: {kk: vv for kk, vv in v.items() if kk != 'svg'} for k, v in FIG.items()}, open(OUT + 'parts.pkl', 'wb'))
print({k: (v['w'], v['h'], v.get('joints'), {a: round(b, 2) for a, b in v['ratios'].items()}) for k, v in FIG.items()})
