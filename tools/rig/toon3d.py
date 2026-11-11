"""toon3d: any-angle ToonHead-style characters.
3D skeleton (head-height units, y down, z toward the viewer at yaw 0) -> orthographic projection -> shapely silhouettes -> SVG.
Style (from TOONHEAD_STYLE.md): flat fills, one thin black outline per merged silhouette, 20%-black flat shadow shapes,
cream sclera + big dark iris, palette from toon-head. Proportions from reports/Cartoon body construction rules.md."""
import math
from shapely.geometry import Point, Polygon, LineString, MultiPolygon, box
from shapely.ops import unary_union
from shapely import affinity

SKIN = ['#5c3829', '#a36b4f', '#b98e6a', '#c68e7a', '#f1c3a5']
HAIR = ['#2c1b18', '#724133', '#a55728', '#b58143', '#d6b370', '#dcd8d0']
EYE_W, IRIS, LASH, MOUTH, TONGUE = '#f6f1e4', '#4b2422', '#4b2422', '#611519', '#e0564b'

# ---------------- vector helpers ----------------
def rotY(p, a):   # yaw about the vertical axis
    x, y, z = p; c, s = math.cos(a), math.sin(a); return (x * c + z * s, y, -x * s + z * c)
def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def mul(a, k): return (a[0] * k, a[1] * k, a[2] * k)
def direction(pitch, roll, base=(0, 1, 0)):
    """unit vector for a limb: start pointing down (+y); pitch rotates toward the front (+z), roll toward the character's left (+x). degrees"""
    p, r = math.radians(pitch), math.radians(roll)
    return (math.sin(r) * math.cos(p), math.cos(r) * math.cos(p), math.sin(p) * math.cos(r) if abs(r) < 1e-9 else math.sin(p))
def norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1; return tuple(c / l for c in v)

def capsule2d(p, q, w1, w2, res=16):
    a, b = Point(p).buffer(w1 / 2, res), Point(q).buffer(w2 / 2, res)
    dx, dy = q[0] - p[0], q[1] - p[1]; L = math.hypot(dx, dy) or 1e-6; nx, ny = -dy / L, dx / L
    quad = Polygon([(p[0] + nx * w1 / 2, p[1] + ny * w1 / 2), (q[0] + nx * w2 / 2, q[1] + ny * w2 / 2), (q[0] - nx * w2 / 2, q[1] - ny * w2 / 2), (p[0] - nx * w1 / 2, p[1] - ny * w1 / 2)])
    return unary_union([a, b, quad])
def smooth(g, r): return g.buffer(r, 16).buffer(-r * 2, 16).buffer(r, 16) if r > 0 else g
def ellipse(cx, cy, rx, ry, rot=0, res=48):
    e = affinity.scale(Point(0, 0).buffer(1, res), rx, ry); e = affinity.rotate(e, rot, origin=(0, 0)); return affinity.translate(e, cx, cy)

def to_path(g):
    if g.is_empty: return ''
    polys = g.geoms if hasattr(g, 'geoms') else [g]; d = []
    for pg in polys:
        if pg.geom_type != 'Polygon': continue
        for ring in [pg.exterior] + list(pg.interiors):
            c = list(ring.coords); d.append('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in c) + 'Z')
    return ' '.join(d)
def lines_path(g):
    if g.is_empty: return ''
    gs = g.geoms if hasattr(g, 'geoms') else [g]; d = []
    for l in gs:
        if l.geom_type == 'LineString': d.append('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in l.coords))
        elif l.geom_type in ('Polygon',): d.append(to_path(l))
    return ' '.join(d)

# ---------------- character spec ----------------
AGES = {   # H = height in heads. sourced: cartoon adult 5-6, cute/child ~3-4, baby ~2.5. leg share/widths: estimates (report)
  'adult_f': dict(H=5.5, sh=1.22, waist=.62, hip=.92, legs=.57, limb=1.0, neck=.30),
  'adult_m': dict(H=5.6, sh=1.38, waist=.80, hip=.76, legs=.56, limb=1.12, neck=.34),
  'child':   dict(H=4.0, sh=1.02, waist=.84, hip=.86, legs=.50, limb=.92, neck=.26),
  'baby':    dict(H=2.6, sh=.90, waist=.98, hip=.95, legs=.40, limb=1.3, neck=.18),
  'elder_f': dict(H=5.2, sh=1.18, waist=.74, hip=.92, legs=.55, limb=.98, neck=.24, stoop=14),
  'elder_m': dict(H=5.3, sh=1.30, waist=.86, hip=.80, legs=.55, limb=1.08, neck=.26, stoop=14),
}
class Char:
    def __init__(self, age='adult_f', skin=4, hair_color=1, hair='long', top='#ec4899', bottom='#2a3550', shoes='#3f2626',
                 skirt=False, sleeves='long', beard=None, glasses=False, cap=None, eye_color=IRIS):
        self.a = dict(AGES[age]); self.age = age; self.skin = SKIN[skin] if isinstance(skin, int) else skin
        self.hairc = HAIR[hair_color] if isinstance(hair_color, int) else hair_color; self.hair = hair
        self.top, self.bottom, self.shoes, self.skirt, self.sleeves = top, bottom, shoes, skirt, sleeves
        self.beard, self.glasses, self.cap, self.eye = beard, glasses, cap, eye_color

    # proportions (head units). below-chin landmarks: Loomis 8-head positions scaled into (H-1) with a leg share (report section 1)
    def dims(self):
        a = self.a; H = a['H']; body = H - 1; legs = body * a['legs']; trunk = body - legs
        return dict(H=H, chin=1.0, shoulder=1.0 + a['neck'] * .55 + .08, crotch=1.0 + trunk, sole=H,
                    sh_w=a['sh'] * .5 * 1.22 / 1.22, legs=legs, trunk=trunk,
                    upper=None)

# ---------------- pose ----------------
DEFAULT_POSE = dict(
    yaw=0, root=(0, 0, 0), spine_pitch=0, spine_roll=0, head_yaw=0, head_pitch=0, head_roll=0,
    l_upper=(0, 7), l_fore=(0, 3), r_upper=(0, 7), r_fore=(0, 3),      # (pitch fwd, roll outward) degrees; l = character's left (+x)
    l_thigh=(0, 2), l_shin=(0, 1), r_thigh=(0, 2), r_shin=(0, 1), l_foot=0, r_foot=0,
    face='smile', eyes='open', mouth='smile', brows='happy', look=(0, 0),
    seated=False, lying=False, hold=None)

def build(ch, pose, px=300.0, origin=(0, 0)):
    """returns dict: layers (list of (z, svg)), parts (name -> shapely geometry in px), joints (name -> 2D px), meta"""
    P = dict(DEFAULT_POSE); P.update(pose); a = ch.a; H = a['H']; yaw = math.radians(P['yaw'])
    body = H - 1; legs = body * a['legs']; trunk = body - legs; L = a['limb']
    stoop = a.get('stoop', 0)
    # --- 3D joints (head units, character space: +x = character's left, +y down, +z forward) ---
    ground = H
    crotch_y = 1.0 + trunk
    hip_c = (0, crotch_y - .12, 0)
    thigh_len = legs * 1.03 / 2.03 * .98; shin_len = legs * 1.0 / 2.03 * .98; foot_h = legs * .04
    if P['seated']:
        hip_c = (0, P.get('seat_y', crotch_y), 0)
    if P['lying']: pass
    root = P['root']
    hip_c = add(hip_c, root)
    spine_dir = norm(direction(180 - 0, 0))   # placeholder (overwritten below)
    sp, sr = math.radians(P['spine_pitch'] - stoop * .3), math.radians(P['spine_roll'])
    spine_dir = norm((math.sin(sr), -math.cos(sp) * math.cos(sr), math.sin(sp)))     # pointing up; pitch>0 leans forward
    trunk_len = (crotch_y - .12) - (1.0 + a['neck'] * .6)
    neck_base = add(hip_c, mul(spine_dir, trunk_len))
    sh_half = a['sh'] * .5 * .9
    side = norm((math.cos(sr), math.sin(sr), 0))
    shoulders = {'l': add(neck_base, add(mul(side, sh_half - .1 * L), (0, .1, 0))), 'r': add(neck_base, add(mul(side, -(sh_half - .1 * L)), (0, .1, 0)))}
    neck_dir = norm(add(spine_dir, (0, 0, math.sin(math.radians(stoop)) * .9)))
    head_c = add(neck_base, mul(neck_dir, a['neck'] * .55 + .48))
    # arms: wrist at crotch when hanging (Loomis), upper:fore = 1.3 (de Leva)
    arm_len = (crotch_y - .05) - shoulders['l'][1]; upper_len = arm_len * 1.3 / 2.3; fore_len = arm_len - upper_len
    J = {'hip_c': hip_c, 'neck': neck_base, 'head': head_c}
    for s, sgn in (('l', 1), ('r', -1)):
        pu, ru = P[f'{s}_upper']; pf, rf = P[f'{s}_fore']
        sh = shoulders[s]; el = add(sh, mul(direction(pu, ru * sgn), upper_len))
        wr = add(el, mul(direction(pf, rf * sgn), fore_len))
        J[f'{s}_sh'], J[f'{s}_el'], J[f'{s}_wr'] = sh, el, wr
        hp = add(hip_c, (sgn * a['hip'] * .5 * .44, .06, 0))
        pt, rt = P[f'{s}_thigh']; ps, rs = P[f'{s}_shin']
        kn = add(hp, mul(direction(pt, rt * sgn), thigh_len)); an = add(kn, mul(direction(ps, rs * sgn), shin_len))
        J[f'{s}_hip'], J[f'{s}_kn'], J[f'{s}_an'] = hp, kn, an
    # ground the figure: lowest ankle sits foot_h above the ground unless seated/lying
    if not P['seated'] and not P['lying']:
        low = max(J['l_an'][1], J['r_an'][1]); dy = ground - foot_h - low
        J = {k: add(v, (0, dy, 0)) for k, v in J.items()}
    # --- projection ---
    ox, oy = origin
    def proj(p):
        q = rotY(p, yaw); return (ox + q[0] * px, oy + q[1] * px), q[2]
    J2 = {k: proj(v)[0] for k, v in J.items()}; Jz = {k: proj(v)[1] for k, v in J.items()}
    U = px; S = 2.6 / 452 * px * 1.25    # outline width scaled from the library (2px at u=452), slightly bolder for video
    layers = []; parts = {}
    def put(z, g, fill, outline=True, name=None, extra='', hide=None):
        if g.is_empty: return
        if hide is not None and outline and not hide.is_empty:
            line = g.boundary.difference(hide)
            layers.append((z, f'<path d="{to_path(g)}" fill="{fill}" stroke="none"/><path d="{lines_path(line)}" fill="none" stroke="#000" stroke-width="{S:.2f}" stroke-linecap="round" stroke-linejoin="round"/>'))
            if name: parts[name] = g
            return
        layers.append((z, f'<path d="{to_path(g)}" fill="{fill}" stroke="{"#000" if outline else "none"}" stroke-width="{S:.2f}" stroke-linejoin="round" {extra}/>'))
        if name: parts[name] = g
    def shade(z, g):
        if not g.is_empty: layers.append((z, f'<path d="{to_path(g)}" fill="#000" fill-opacity=".2"/>'))
    def darker(hexc, k=.86):
        n = int(hexc[1:], 16); return '#%02x%02x%02x' % (int((n >> 16) * k), int((n >> 8 & 255) * k), int((n & 255) * k))
    # widths (head units, estimates calibrated to the toon-head neck = 132/452 = .29)
    W = dict(upper=.23 * L, fore=.20 * L, hand=.21 * L, thigh=.36 * L, shin=.26 * L, neck=a['neck'])
    # --- torso: stacked cross-sections along the spine, width depends on yaw ---
    def secw(w, d):   # projected half-width of an elliptic cross-section (w = half width, d = half depth)
        return math.sqrt((w * math.cos(yaw)) ** 2 + (d * math.sin(yaw)) ** 2)
    fem = ch.age.endswith('_f'); dk = 1.25
    levels = [(0.0, a['hip'] * .5 * .95, .27 * dk), (.22, a['hip'] * .5, (.31 if fem else .28) * dk), (.5, a['waist'] * .5 * a['sh'] / 1.22 * 1.1, .24 * dk), (.74, a['sh'] * .5 * .8, (.31 if fem else .28) * dk), (.94, a['sh'] * .5 * .9, .25 * dk), (1.0, a['sh'] * .5 * .55, .2 * dk)]
    tpts_l, tpts_r = [], []
    for t, w, d in levels:
        c = add(hip_c, mul(spine_dir, trunk_len * t)); (cx, cy), _ = proj(c); hw = secw(w, d) * px
        # axis perpendicular to projected spine
        (tx, ty), _ = proj(add(c, spine_dir)); dx, dy = tx - cx, ty - cy; l = math.hypot(dx, dy) or 1; nx, ny = -dy / l, dx / l
        # forward lean shifts the chest mass forward in side views (belly/chest depth)
        tpts_l.append((cx + nx * hw, cy + ny * hw)); tpts_r.append((cx - nx * hw, cy - ny * hw))
    torso = smooth(Polygon(tpts_l + tpts_r[::-1]).buffer(0), .03 * px)
    (bcx, bcy), _ = proj(add(hip_c, (0, .02, -.03)))

    # shoulder caps: deltoid circles merged into the torso so arms grow out of a round shoulder
    for s in 'lr': torso = torso.union(Point(J2[f'{s}_sh']).buffer(W['upper'] * .62 * px))
    torso = smooth(torso, .02 * px)
    pel_top = proj(add(hip_c, mul(spine_dir, trunk_len * .3)))[0][1]
    zt = proj(hip_c)[1]
    # neck
    neck = capsule2d(J2['neck'], proj(add(J['head'], (0, .32, -.04)))[0], W['neck'] * px, W['neck'] * px * .92)
    # --- limbs (each limb = one merged silhouette, no seams) ---
    def limb(seg, w1, w2, w3):
        g = unary_union([capsule2d(J2[seg[0]], J2[seg[1]], w1 * px, w2 * px), capsule2d(J2[seg[1]], J2[seg[2]], w2 * px, w3 * px)])
        return smooth(g, .04 * px)
    def hand_shape(s):
        wr, el = J2[f'{s}_wr'], J2[f'{s}_el']; dx, dy = wr[0] - el[0], wr[1] - el[1]; l = math.hypot(dx, dy) or 1; ux, uy = dx / l, dy / l
        hl = .30 * L * px; c = (wr[0] + ux * hl * .45, wr[1] + uy * hl * .45)
        palm = ellipse(c[0], c[1], W['hand'] * px * .55, hl * .55, math.degrees(math.atan2(uy, ux)) - 90)
        side_sgn = 1 if s == 'l' else -1
        facing = math.cos(yaw)
        tx = c[0] - uy * W['hand'] * px * .5 * side_sgn * (1 if facing >= 0 else -1); ty = c[1] + ux * W['hand'] * px * .5 * side_sgn * (1 if facing >= 0 else -1)
        thumb = capsule2d((c[0] - ux * hl * .1, c[1] - uy * hl * .1), (tx + ux * hl * .1, ty + uy * hl * .1), W['hand'] * px * .32, W['hand'] * px * .26)
        return smooth(palm.union(thumb), .006 * px)
    def foot_shape(s):
        an = J[f'{s}_an']; fl = .36 * L
        heel = proj(add(an, (0, .05, -.06)))[0]; toe = proj(add(an, (0, .07, fl)))[0]
        g = capsule2d(heel, toe, .17 * L * px, .2 * L * px).union(ellipse((heel[0] + toe[0]) / 2, (heel[1] + toe[1]) / 2, .13 * L * px, .09 * L * px))
        gy = proj((0, ground, 0))[0][1]
        if not P['seated'] and not P['lying']: g = g.intersection(box(-1e5, -1e5, 1e5, gy))
        return smooth(g, .015 * px)
    sleeve_c = ch.top; pants_c = ch.bottom
    limb_layers = []
    for s in 'lr':
        arm = limb((f'{s}_sh', f'{s}_el', f'{s}_wr'), W['upper'], W['fore'] * 1.02, W['fore'] * .92)
        leg = limb((f'{s}_hip', f'{s}_kn', f'{s}_an'), W['thigh'], W['shin'] * 1.05, W['shin'] * .9)
        z_arm = (Jz[f'{s}_el'] + Jz[f'{s}_wr']) / 2; z_leg = (Jz[f'{s}_kn'] + Jz[f'{s}_an']) / 2
        far = (Jz[f'{s}_sh'] < zt - .02)
        limb_layers.append((z_arm, s, 'arm', arm, far)); fwd_knee = Jz[f'{s}_kn'] - Jz[f'{s}_hip'] > .5
        limb_layers.append(((zt + .0026 + z_leg * .001) if fwd_knee and not ch.skirt else (zt - .01 + z_leg * .001), s, 'leg', leg, Jz[f'{s}_hip'] < zt - .02))
    # --- head ---
    hc2, hz = proj(J['head']); hyaw = yaw + math.radians(P['head_yaw'])
    rx, ry, rz = .44, .5, .46
    def hp(lon, lat, r=1.0, hy=None):   # head surface point -> screen (with head yaw)
        lo, la = math.radians(lon), math.radians(lat)
        p = (rx * r * math.sin(lo) * math.cos(la), -ry * r * math.sin(la), rz * r * math.cos(lo) * math.cos(la))
        q = rotY(p, hyaw if hy is None else hy); pitch = math.radians(P['head_pitch'])
        y2 = q[1] * math.cos(pitch) - q[2] * math.sin(pitch); z2 = q[1] * math.sin(pitch) + q[2] * math.cos(pitch)
        return (hc2[0] + q[0] * px, hc2[1] + y2 * px), z2
    cran_w = math.sqrt((rx * math.cos(hyaw)) ** 2 + (rz * math.sin(hyaw)) ** 2)
    cran = ellipse(hc2[0], hc2[1] - .03 * px, cran_w * px, ry * .94 * px)
    (jx, jy), _ = hp(0, -38, .55); jaw_w = math.sqrt((rx * .78 * math.cos(hyaw)) ** 2 + (rz * .72 * math.sin(hyaw)) ** 2)
    jaw = ellipse(jx, jy, jaw_w * px, .3 * px)
    head = smooth(cran.union(jaw), .02 * px)
    # nose: bump on the silhouette when turned (lon 0, lat -16)
    (nx_, ny_), nz = hp(0, -16, 1.06)
    if abs(math.sin(hyaw)) > .35: head = head.union(Point(nx_, ny_).buffer(.055 * px))
    ears = []
    for lon in (90, -90):
        (ex, ey), ez = hp(lon, -14, .98)
        if ez > -.25: ears.append((ez, ellipse(ex, ey, (.06 + .05 * abs(math.cos(math.radians(lon) + hyaw))) * px, .1 * px)))
    # --- hair ---
    hairc = ch.hairc; hair_back, hair_front = None, None
    def surf_region(cond, r=1.07, step=5, rad=.085, only_front=False):
        pts = []
        for lon in range(-180, 180, step):
            for lat in range(-90, 91, step):
                if cond(lon, lat):
                    (x, y), z = hp(lon, lat, r)
                    if (not only_front) or z > -.02: pts.append(Point(x, y).buffer(rad * px, 6))
        return smooth(unary_union(pts), .045 * px).simplify(.6) if pts else Polygon()
    style = ch.hair
    def hairline(lon):   # latitude above which the head is covered (degrees). front fringe higher, sides/back lower
        a_ = abs(lon)
        if style in ('bald',): return 999
        base = 34 if a_ < 50 else (34 - (a_ - 50) / 40 * 44 if a_ < 90 else -10 - (a_ - 90) / 90 * 40)
        if style == 'side' and -40 < lon < 25: base -= 10 if lon < 0 else 4
        if style == 'long' and a_ > 40: base -= 16
        if style == 'spiky': base += 0
        return base
    if style != 'bald_sides':
        hair_front = surf_region(lambda lo, la: la >= hairline(lo), only_front=True)
        if style == 'bald': hair_front = surf_region(lambda lo, la: abs(lo) > 70 and -30 < la < 10, only_front=True)
    hair_back = surf_region(lambda lo, la: la >= hairline(lo) - 10, r=1.1)
    if style == 'long':
        (bx, by), bz = hp(180, 0, 1.0); (sx_, sy_), _ = hp(0, 0, 1)
        sheet = ellipse(hc2[0] + (bx - hc2[0]) * .4, hc2[1] + .5 * px, (cran_w * (1 - .3 * abs(math.sin(hyaw))) + .05) * px, .68 * px)
        hair_back = hair_back.union(sheet)
    if style == 'bun':
        (bx, by), bz = hp(160, 55, 1.18); hair_back = hair_back.union(Point(bx, by).buffer(.17 * px))
    if style == 'spiky':
        sp_ = []
        for i, lon in enumerate(range(-80, 81, 20)):
            (x0, y0), z0 = hp(lon, 40, 1.05); (x1, y1), _ = hp(lon + 6, 66, 1.32)
            sp_.append(Polygon([(x0 - .07 * px, y0), (x1, y1), (x0 + .07 * px, y0)]))
        hair_front = hair_front.union(unary_union(sp_)) if hair_front is not None else unary_union(sp_)
    if style == 'short' or style == 'side' or style == 'spiky':
        pass
    if style in ('bald',): hair_back = Polygon()
    # --- face features ---
    face_svg = []
    def eye(lon):
        (ex, ey), ez = hp(lon, -8, 1.0)
        if ez < .05: return
        fs = max(.45, math.cos(math.radians(lon) + hyaw))     # foreshortening (floor keeps the profile eye readable)
        ex += (hc2[0] - ex) * .18 * abs(math.sin(hyaw))
        w, h = .095 * px * fs, .075 * px
        st = P['eyes']
        lx, ly = P['look']
        if st in ('closed', 'happy'):
            k = 1 if st == 'happy' else -1
            face_svg.append(f'<path d="M{ex - w:.1f} {ey:.1f} Q{ex:.1f} {ey - k * h * 1.1:.1f} {ex + w:.1f} {ey:.1f}" fill="none" stroke="{LASH}" stroke-width="{.016 * px:.1f}" stroke-linecap="round"/>')
            return
        face_svg.append(f'<path d="M{ex - w:.1f} {ey:.1f} Q{ex:.1f} {ey - h * 1.55:.1f} {ex + w:.1f} {ey - h * .1:.1f} Q{ex:.1f} {ey + h * 1.25:.1f} {ex - w:.1f} {ey:.1f}Z" fill="{EYE_W}"/>')
        ir = .062 * px; shift = math.sin(hyaw) * w * .25
        face_svg.append(f'<clipPath id="e{int(ex)}{int(ey)}"><path d="M{ex - w:.1f} {ey:.1f} Q{ex:.1f} {ey - h * 1.55:.1f} {ex + w:.1f} {ey - h * .1:.1f} Q{ex:.1f} {ey + h * 1.25:.1f} {ex - w:.1f} {ey:.1f}Z"/></clipPath>'
                        f'<ellipse cx="{ex + shift + lx * w * .4:.1f}" cy="{ey + ly * h * .3 + h * .05:.1f}" rx="{ir * fs:.1f}" ry="{ir:.1f}" fill="{ch.eye}" clip-path="url(#e{int(ex)}{int(ey)})"/>')
        face_svg.append(f'<path d="M{ex - w * 1.05:.1f} {ey + h * .05:.1f} Q{ex:.1f} {ey - h * 1.6:.1f} {ex + w * 1.08:.1f} {ey - h * .15:.1f}" fill="none" stroke="{LASH}" stroke-width="{.014 * px:.1f}" stroke-linecap="round"/>')
    def brow(lon):
        (bx, by), bz = hp(lon, 10, 1.0)
        if bz < .05: return
        fs = max(.15, math.cos(math.radians(lon) + hyaw)); w = .085 * px * fs
        tilt = {'happy': -.02, 'sad': .05, 'angry': -.06, 'raised': -.02, 'neutral': 0}[P['brows']] * px * (1 if lon > 0 else -1)
        lift = {'raised': -.04, 'happy': -.01}.get(P['brows'], 0) * px
        face_svg.append(f'<path d="M{bx - w:.1f} {by + lift - tilt:.1f} Q{bx:.1f} {by + lift - .03 * px:.1f} {bx + w:.1f} {by + lift + tilt:.1f}" fill="none" stroke="{hairc if style != "bald" else "#8a8490"}" stroke-width="{.028 * px:.1f}" stroke-linecap="round"/>')
    for lon in (21, -21): brow(lon); eye(lon)
    if nz > .05:
        fs = max(.2, math.cos(hyaw))
        face_svg.append(f'<path d="M{nx_ - .03 * px * fs:.1f} {ny_ + .01 * px:.1f} q{.03 * px * fs:.1f} {.022 * px:.1f} {.06 * px * fs:.1f} 0" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="{.016 * px:.1f}" stroke-linecap="round"/>')
    (mx, my), mz = hp(0, -36, 1.0)
    if mz > -.2:
        fs = max(.45, math.cos(hyaw)); w = .1 * px * fs; m = P['mouth']; mx += (hc2[0] - mx) * .22 * abs(math.sin(hyaw))
        if m == 'smile': face_svg.append(f'<path d="M{mx - w:.1f} {my - .01 * px:.1f} Q{mx:.1f} {my + .05 * px:.1f} {mx + w:.1f} {my - .01 * px:.1f}" fill="none" stroke="{MOUTH}" stroke-width="{.016 * px:.1f}" stroke-linecap="round"/>')
        elif m == 'sad': face_svg.append(f'<path d="M{mx - w * .8:.1f} {my + .03 * px:.1f} Q{mx:.1f} {my - .03 * px:.1f} {mx + w * .8:.1f} {my + .03 * px:.1f}" fill="none" stroke="{MOUTH}" stroke-width="{.016 * px:.1f}" stroke-linecap="round"/>')
        else:
            oh = {'open': .07, 'laugh': .06, 'o': .06}.get(m, .05) * px
            face_svg.append(f'<path d="M{mx - w:.1f} {my - .01 * px:.1f} Q{mx:.1f} {my + oh * 1.8:.1f} {mx + w:.1f} {my - .01 * px:.1f}Z" fill="{MOUTH}"/>'
                            f'<path d="M{mx - w * .55:.1f} {my + oh * .7:.1f} Q{mx:.1f} {my + oh * 1.5:.1f} {mx + w * .55:.1f} {my + oh * .7:.1f}Z" fill="{TONGUE}"/>'
                            f'<path d="M{mx - w * .8:.1f} {my - .005 * px:.1f} L{mx + w * .8:.1f} {my - .005 * px:.1f} L{mx + w * .7:.1f} {my + .02 * px:.1f} L{mx - w * .7:.1f} {my + .02 * px:.1f}Z" fill="{EYE_W}"/>')
    if ch.glasses:
        for lon in (21, -21):
            (ex, ey), ez = hp(lon, -8, 1.04)
            if ez > .05:
                fs = max(.2, math.cos(math.radians(lon) + hyaw)); face_svg.append(f'<ellipse cx="{ex:.1f}" cy="{ey:.1f}" rx="{.12 * px * fs:.1f}" ry="{.1 * px:.1f}" fill="none" stroke="#2a2026" stroke-width="{.016 * px:.1f}"/>')
    if ch.beard:
        bd = surf_region(lambda lo, la: abs(lo) < 80 and -85 < la < -48 or (55 < abs(lo) < 85 and -48 <= la < -10), r=1.03, only_front=True)
    else: bd = None
    # --- assemble with depth ---
    face_front = math.cos(hyaw) > -.05
    zh = hz
    put(zh - .9, hair_back if hair_back is not None else Polygon(), hairc)              # back hair behind everything of the head
    for zz, side_, kind, g, far in limb_layers:
        fill = (darker(sleeve_c) if far else sleeve_c) if kind == 'arm' else (darker(pants_c) if far else pants_c)
        if kind == 'arm' and ch.sleeves == 'short':
            put(zz, g, ch.skin)
            sl = g.intersection(Point(J2[f'{side_}_sh']).buffer(.28 * px)); put(zz + .0001, sl, fill)
        else:
            hide = None
            if kind == 'arm' and not far: hide = torso.buffer(-S).intersection(Point(J2[f'{side_}_sh']).buffer(W['upper'] * px * .95))
            put(zz, g, fill, name=f'{side_}_{kind}', hide=hide)
        if kind == 'arm':
            if P['hold'] == 'phone' and side_ == 'r':
                wx, wy_ = J2['r_wr']; ex_, ey_ = J2['r_el']; dx, dy = wx - ex_, wy_ - ey_; l = math.hypot(dx, dy) or 1
                c = (wx + dx / l * .17 * px, wy_ + dy / l * .17 * px - .06 * px)
                ph = affinity.rotate(box(c[0] - .1 * px, c[1] - .19 * px, c[0] + .1 * px, c[1] + .19 * px).buffer(.02 * px).buffer(-.01 * px), -15 * math.cos(yaw), origin=c)
                put(zz + .0005, ph, '#22252b', name='phone')
            put(zz + .001, hand_shape(side_), darker(ch.skin) if far else ch.skin, name=f'{side_}_hand')
        else:
            put(zz + .001, foot_shape(side_), ch.shoes, name=f'{side_}_foot')
            if Jz[f'{side_}_kn'] - Jz[f'{side_}_hip'] > .5 and abs(math.cos(yaw)) > .5:
                kc = J2[f'{side_}_kn']; shade(zz + .0002, g.intersection(box(-1e5, kc[1] + W['thigh'] * px * .2, 1e5, 1e5)).intersection(Point(kc).buffer(W['thigh'] * px * .75)))
    # torso z = 0 relative; garment split: top above waist, bottom (pants/skirt) below
    wy = proj(add(hip_c, mul(spine_dir, trunk_len * .3)))[0][1]
    top_g = torso.intersection(box(-1e5, -1e5, 1e5, wy)); bot_g = torso.intersection(box(-1e5, wy - 2, 1e5, 1e5))
    if ch.skirt:
        (kx1, ky1) = J2['l_kn']; (kx2, ky2) = J2['r_kn']; hw = abs(J2['l_hip'][0] - J2['r_hip'][0]) / 2 + W['thigh'] * px
        cxm = (J2['l_hip'][0] + J2['r_hip'][0]) / 2; ky = max(ky1, ky2) - .1 * px
        bot_g = bot_g.union(Polygon([(cxm - hw * .8, wy), (cxm + hw * .8, wy), (cxm + hw * 1.25, ky), (cxm - hw * 1.25, ky)]))
    put(zt + .002, neck, ch.skin, name='neck')
    if math.cos(hyaw) > .5: shade(zt + .0021, neck.intersection(ellipse(jx, jy + .3 * px, jaw_w * px, .12 * px)))
    if not ch.skirt:
        brief = unary_union([capsule2d(J2['l_hip'], J2['r_hip'], W['thigh'] * px, W['thigh'] * px), bot_g]); bot_g = smooth(brief, .03 * px)
    legs_u = unary_union([parts[k] for k in ('l_leg', 'r_leg') if k in parts])
    hips_zone = unary_union([Point(J2[k]).buffer(W['thigh'] * px * 1.1) for k in ('l_hip', 'r_hip')])
    put(zt + (.0025 if ch.skirt else 0), bot_g, pants_c, name='pelvis', hide=None if ch.skirt else legs_u.buffer(-S).intersection(hips_zone)); put(zt + .003, top_g, ch.top, name='torso')
    shade(zt + .0031, top_g.intersection(box(-1e5, wy - .06 * px, 1e5, wy + 1)))
    col = Point(J2['neck']).buffer(W['neck'] * px * .7).intersection(top_g); put(zt + .0032, col, darker(ch.top, .8), outline=False)
    # head group (above torso/neck when facing front; still above when facing back)
    hz_ = zt + .5
    for ez, e in ears:
        put(hz_ - .01 if ez < 0 else hz_ + .001, e, ch.skin)
    put(hz_, head, ch.skin, name='head')
    if bd is not None: put(hz_ + .003, bd, hairc)
    if hair_front is not None and not hair_front.is_empty:
        if math.cos(hyaw) < -.2: hair_front = hair_front.union(hair_back.intersection(head.buffer(.02 * px)))
        put(hz_ + .004, hair_front.intersection(head.buffer(.06 * px)) if style not in ('spiky',) else hair_front, hairc, name='hair')
    if ch.cap:
        cap = surf_region(lambda lo, la: la >= 30, r=1.1, only_front=False)
        (vx, vy), vz = hp(0, 30, 1.12); (vx2, vy2), _ = hp(0, 30, 1.6)
        visor = capsule2d((vx, vy), (vx2, vy2), .06 * px, .05 * px) if abs(math.sin(hyaw)) > .2 else ellipse(vx, vy + .02 * px, .3 * px * max(.3, math.cos(hyaw)), .06 * px)
        put(hz_ + .005, cap.intersection(box(-1e5, -1e5, 1e5, hp(0, 30, 1.1)[0][1] + .02 * px)), ch.cap); put(hz_ + .006, visor, ch.cap)
    if face_front or True: layers.append((hz_ + .01, ''.join(face_svg)))
    layers.sort(key=lambda t: t[0])
    seat = None
    if P['seated']:
        hx = (J2['l_hip'][0] + J2['r_hip'][0]) / 2; kx = (J2['l_kn'][0] + J2['r_kn'][0]) / 2
        front = kx - math.copysign(.18 * px, kx - hx) if abs(kx - hx) > .3 * px else None
        x0, x1 = (min(front, hx - math.copysign(.4 * px, kx - hx)), max(front, hx - math.copysign(.4 * px, kx - hx))) if front is not None else (hx - .75 * px, hx + .75 * px)
        seat = dict(top=max(J2['l_hip'][1], J2['r_hip'][1]) + W['thigh'] * px * .5, x0=x0, x1=x1, back=None)
    return dict(seat=seat, Jz=Jz, svg=''.join(s for _, s in layers), parts=parts, joints=J2, joints3=J, ground=proj((0, ground, 0))[0][1], head_top=proj((0, 0, 0))[0][1] if False else None, px=px, H=H)
