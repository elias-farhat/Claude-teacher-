// Reusable cast. Each character is a jointed puppet whose parts are painted ONCE (front + darker back limbs);
// poses only change joint angles. Faces are drawn live on top of the painted head so expressions can change.
// Angle convention: 0 = limb hangs straight down, positive = swings forward (toward the way the character faces).
const CAST_DEF = {
  maya:   { skin: '#e9b38f', skin2: '#d0906c', hair: '#3a2620', top: '#3f7f8a', legs: '#2f3a5a', shoe: '#f2ede4', style: 'pony', scale: 1, hood: true },
  ben:    { skin: '#b97a56', skin2: '#9a5f40', hair: '#1e1614', top: '#d9973a', legs: '#5a4a3a', shoe: '#3a2a24', style: 'curly', scale: 1.06 },
  rose:   { skin: '#ecbd9c', skin2: '#d39a78', hair: '#d8d3dc', top: '#7d9a6b', legs: '#5a3d5c', shin: '#c9a08a', shoe: '#3a2a24', style: 'bun', scale: .94, glasses: true, skirt: '#5a3d5c', buttons: true },
  hale:   { skin: '#8a5a3e', skin2: '#6e4530', hair: '#cfcfd6', top: '#f4f1ea', shirt: '#3f6f8f', legs: '#3a3f4a', shoe: '#2a2420', style: 'short', scale: 1.05, glasses: true, beard: '#bdbdc6', coat: true },
  waiter: { skin: '#d7a07c', skin2: '#bb8461', hair: '#20160f', top: '#f4efe6', apron: '#7a2f2a', legs: '#2a2a30', shoe: '#1e1a1a', style: 'neat', scale: 1.02 },
  prof:   { skin: '#e0a985', skin2: '#c48b68', hair: '#9a96a0', top: '#7a5a44', legs: '#4a3c34', shoe: '#2a2020', style: 'bald', scale: 1.04, glasses: true },
};
const DIM = { thigh: 135, shin: 122, arm: 108, fore: 92, hip: 0, torso: 210 };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); return `rgb(${(n >> 16) * k | 0},${(n >> 8 & 255) * k | 0},${(n & 255) * k | 0})`; };
const CAST = {};
function castGet(id) { if (!CAST[id]) CAST[id] = buildChar(id, CAST_DEF[id]); return CAST[id]; }

function buildChar(id, d) {
  const P = {}, op = (o) => Object.assign({ clip: true, size: 5, jitter: 12, angle: () => Math.PI / 2, spread: .5 }, o);
  for (const side of ['f', 'b']) {
    const k = side === 'f' ? 1 : .78;
    P[side + 'thigh'] = painted(id + side + 'thigh', 80, 180, a => { a.fillStyle = shade(d.legs, k); rr(a, -26, -14, 52, 158, 22); }, op({ origin: [40, 20] }));
    P[side + 'shin'] = painted(id + side + 'shin', 120, 170, a => { a.fillStyle = shade(d.shin || d.legs, k); rr(a, -22, -10, 44, 136, 18);
      a.fillStyle = shade(d.shoe, k); a.beginPath(); a.ellipse(16, 126, 38, 16, 0, 0, 7); a.fill(); }, op({ origin: [50, 20] }));
    P[side + 'arm'] = painted(id + side + 'arm', 70, 150, a => { a.fillStyle = shade(d.top, k); rr(a, -20, -16, 40, 132, 19); }, op({ origin: [35, 24] }));
    P[side + 'fore'] = painted(id + side + 'fore', 70, 140, a => { a.fillStyle = shade(d.top, k); rr(a, -17, -12, 34, 96, 16);
      if (d.coat) { a.fillStyle = shade(d.shirt, k); a.fillRect(-17, 74, 34, 10); }
      a.fillStyle = shade(d.skin, k); a.beginPath(); a.arc(0, 98, 17, 0, 7); a.fill(); }, op({ origin: [35, 20] }));
  }
  P.torso = painted(id + 'torso', 240, 420, a => {
    if (d.hood) { a.fillStyle = shade(d.top, .85); a.beginPath(); a.ellipse(-44, -206, 40, 26, -.3, 0, 7); a.fill(); }
    if (d.skirt) { a.fillStyle = d.skirt; a.beginPath(); a.moveTo(-66, -60); a.lineTo(70, -60); a.lineTo(98, 150); a.lineTo(-92, 150); a.fill(); }
    else { a.fillStyle = d.legs; rr(a, -66, -50, 136, 66, 20); }
    a.fillStyle = d.top; a.beginPath(); a.moveTo(-64, -205); a.quadraticCurveTo(4, -232, 72, -205); a.quadraticCurveTo(86, -110, 76, -30); a.lineTo(-70, -30); a.quadraticCurveTo(-78, -120, -64, -205); a.fill();
    if (d.coat) { a.beginPath(); a.moveTo(-70, -60); a.lineTo(76, -60); a.lineTo(92, 110); a.lineTo(-84, 110); a.fill();
      a.fillStyle = d.shirt; a.beginPath(); a.moveTo(14, -214); a.lineTo(52, -210); a.lineTo(40, -60); a.lineTo(26, -60); a.fill(); }
    if (d.apron) { a.fillStyle = d.apron; a.beginPath(); a.moveTo(-50, -120); a.lineTo(76, -120); a.lineTo(84, 90); a.lineTo(-40, 90); a.fill(); }
    if (d.buttons) { a.fillStyle = '#e8dcc0'; a.beginPath(); a.moveTo(30, -214); a.lineTo(54, -212); a.lineTo(44, -40); a.lineTo(36, -40); a.fill(); }
  }, op({ origin: [120, 280], size: 7 }));
  P.head = painted(id + 'head', 220, 260, a => {
    const hairBack = () => { a.fillStyle = d.hair;
      if (d.style === 'pony') { a.beginPath(); a.ellipse(-6, -104, 64, 60, 0, 0, 7); a.fill(); a.beginPath(); a.moveTo(-48, -128); a.quadraticCurveTo(-110, -90, -86, -10); a.quadraticCurveTo(-70, -60, -40, -90); a.fill(); }
      if (d.style === 'curly') for (let k = 0; k < 16; k++) { const an = Math.PI * (.95 + k / 15 * 1.1); a.beginPath(); a.arc(2 + Math.cos(an) * 56, -92 + Math.sin(an) * 60, 24, 0, 7); a.fill(); }
      if (d.style === 'bun') { a.beginPath(); a.arc(-40, -146, 34, 0, 7); a.fill(); a.beginPath(); a.ellipse(0, -100, 64, 54, 0, Math.PI, 0); a.fill(); }
      if (d.style === 'short' || d.style === 'neat') { a.beginPath(); a.ellipse(-2, -104, 60, 52, 0, Math.PI * .95, Math.PI * 2.05); a.fill(); a.fillRect(-60, -110, 30, 50); }
      if (d.style === 'bald') { a.beginPath(); a.ellipse(-30, -80, 34, 34, 0, 0, 7); a.fill(); } };
    hairBack();
    a.fillStyle = d.skin; a.fillRect(-16, -40, 32, 46);
    a.beginPath(); a.ellipse(6, -82, 54, 62, 0, 0, 7); a.fill();
    a.fillStyle = d.skin2; a.beginPath(); a.ellipse(58, -74, 11, 14, 0, 0, 7); a.fill();
    a.fillStyle = d.skin; a.beginPath(); a.ellipse(-26, -80, 11, 15, 0, 0, 7); a.fill();
    if (d.beard) { a.fillStyle = d.beard; a.beginPath(); a.moveTo(-34, -70); a.quadraticCurveTo(-20, -10, 24, -16); a.quadraticCurveTo(54, -20, 56, -46); a.quadraticCurveTo(30, -34, 10, -44); a.quadraticCurveTo(-14, -50, -34, -70); a.fill(); }
    a.fillStyle = d.hair;
    if (d.style === 'pony') { a.beginPath(); a.moveTo(-40, -124); a.quadraticCurveTo(10, -164, 62, -116); a.quadraticCurveTo(30, -126, 4, -112); a.quadraticCurveTo(-20, -104, -40, -124); a.fill(); }
    if (d.style === 'curly') for (let k = 0; k < 7; k++) { a.beginPath(); a.arc(-30 + k * 13, -132 + Math.sin(k) * 6, 18, 0, 7); a.fill(); }
    if (d.style === 'bun') { a.beginPath(); a.moveTo(-50, -118); a.quadraticCurveTo(10, -152, 60, -112); a.quadraticCurveTo(20, -124, -50, -104); a.fill(); }
    if (d.style === 'short' || d.style === 'neat') { a.beginPath(); a.moveTo(-50, -122); a.quadraticCurveTo(10, -160, 60, -118); a.quadraticCurveTo(30, -128, -50, -108); a.fill(); }
    a.fillStyle = 'rgba(220,110,100,.45)'; a.beginPath(); a.arc(30, -52, 12, 0, 7); a.fill();
  }, op({ origin: [110, 210], size: 4, angle: undefined, spread: .6, jitter: 10 }));
  return { id, d, P, scale: d.scale };
}
function rr(a, x, y, w, h, r) { a.beginPath(); a.roundRect(x, y, w, h, r); a.fill(); }

// ---------- poses ----------
const dir = th => [Math.sin(th), Math.cos(th)];
function ik(tx, ty, a, b) { // 2-link IK, elbow kept low/outside; returns [upper, forearmAbs]
  const d = clamp(Math.hypot(tx, ty), Math.abs(a - b) + 1, a + b - 1), th = Math.atan2(tx, ty);
  const al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)), be = Math.acos(clamp((b * b + d * d - a * a) / (2 * b * d), -1, 1));
  const s1 = [th - al, th + be], s2 = [th + al, th - be];
  const e1 = Math.cos(s1[0]), e2 = Math.cos(s2[0]); return e1 > e2 ? s1 : s2;
}
function poseAt(name, t, o = {}) {
  const br = Math.sin(t * 2.1) * .02;
  const P = { lean: 0, head: 0, ft: .04, fb: .06, bt: -.04, bb: .06, fa: .1, ff: .25, ba: -.06, bf: .2, bob: 0, fik: null, bik: null };
  switch (name) {
    case 'walk': case 'run': {
      const run = name === 'run', p = t * (run ? 13 : 7.5), A = run ? .78 : .42, s = Math.sin(p);
      P.ft = A * s; P.bt = -A * s; P.fb = (run ? .35 : .08) + (run ? 1.2 : .6) * Math.max(0, -Math.cos(p)); P.bb = (run ? .35 : .08) + (run ? 1.2 : .6) * Math.max(0, Math.cos(p));
      P.fa = -(run ? .9 : .38) * s; P.ba = (run ? .9 : .38) * s; P.ff = run ? 1.5 : .35; P.bf = run ? 1.5 : .35;
      P.lean = run ? .2 : .04; P.bob = -Math.abs(Math.cos(p)) * (run ? 18 : 7); break; }
    case 'sit': P.ft = 1.5; P.bt = 1.45; P.fb = 1.5; P.bb = 1.4; P.fa = .55; P.ff = .9; P.ba = .4; P.bf = .9; P.lean = -.04 + br; break;
    case 'sitwrite': P.ft = 1.5; P.bt = 1.45; P.fb = 1.5; P.bb = 1.4; P.fik = [92 + Math.sin(t * 9) * 8, 70]; P.ba = .5; P.bf = 1.0; P.lean = .1; P.head = .12; break;
    case 'sitread': P.ft = 1.5; P.bt = 1.45; P.fb = 1.5; P.bb = 1.4; P.fik = [70, 10]; P.bik = [74, 20]; P.head = .18; break;
    case 'sitsad': P.ft = 1.5; P.bt = 1.45; P.fb = 1.5; P.bb = 1.4; P.fa = .7; P.ff = 1.2; P.ba = .6; P.bf = 1.2; P.lean = .22; P.head = .3; break;
    case 'phone': P.fik = [-4, -90]; P.ba = -.05; P.bf = .3; P.head = -.05; break;
    case 'cry': P.fik = [38, -92]; P.bik = [42, -88]; P.head = .26; P.lean = .1 + Math.sin(t * 6) * .01; break;
    case 'sitcry': P.ft = 1.5; P.bt = 1.45; P.fb = 1.5; P.bb = 1.4; P.fik = [40, -88]; P.bik = [44, -84]; P.head = .3; P.lean = .22; break;
    case 'hold': P.fik = o.reach || [118, 92]; P.lean = .12; P.head = .1; break;
    case 'teach': P.fa = 2.1 + Math.sin(t * 2) * .15; P.ff = .3; P.ba = .1; P.bf = .5; break;
    case 'recite': P.fa = .45 + Math.sin(t * 2.6) * .12; P.ff = .9; P.ba = .4 + Math.sin(t * 2.6 + 1) * .12; P.bf = .9; P.head = -.06 + Math.sin(t * 1.3) * .03; break;
    case 'keys': P.fik = [70, 40]; P.head = .12; break;
    case 'read': P.fik = [70, 10]; P.bik = [74, 20]; P.head = .18; break;
    case 'clap': { const c = Math.abs(Math.sin(t * 9)); P.fik = [60 + c * 14, 30]; P.bik = [70 - c * 10, 34]; break; }
    case 'water': P.fa = 1.1 + Math.sin(t * 1.2) * .08; P.ff = .2; break;
    case 'lie': P.ft = 0; P.bt = 0; P.fb = 0; P.bb = 0; P.fa = .05; P.ff = .1; P.ba = 0; P.bf = 0; break;
    default: P.fa += br; P.ba -= br;
  }
  P.lean += br * .3; return P;
}

// ---------- draw a character; returns face centre in screen px (for QA) ----------
function drawChar(ch, x, y, o, t) {
  const sc = (o.scale || 1) * ch.scale, f = o.facing === 'left' ? -1 : 1, P = poseAt(o.pose || 'stand', t + (o.phase || 0), o);
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(f * sc, sc);
  // hip height so the lowest foot touches the ground
  const drop = (th, bd) => DIM.thigh * Math.cos(th) + DIM.shin * Math.cos(th - bd) + 14;
  const hipY = -Math.max(drop(P.ft, P.fb), drop(P.bt, P.bb)) + P.bob;
  const shoulder = (dx) => { const r = P.lean; return [dx * Math.cos(r) + 200 * Math.sin(r), hipY - 200 * Math.cos(r) + dx * Math.sin(r)]; };
  const leg = (s, th, bd, hx) => { const [dx, dy] = dir(th); spr(ch.P[s + 'thigh'], hx, hipY, -th); spr(ch.P[s + 'shin'], hx + dx * DIM.thigh, hipY + dy * DIM.thigh, -(th - bd)); };
  const arm = (s, a, fr, ikT, sx) => { const [px, py] = shoulder(sx); let ua = a, fa = a + fr;
    if (ikT) { const r = ik(ikT[0] - px, ikT[1] - (hipY - 200) - (py - (hipY - 200)), DIM.arm, DIM.fore); ua = r[0]; fa = r[1]; }
    const [dx, dy] = dir(ua); spr(ch.P[s + 'arm'], px, py, -ua); spr(ch.P[s + 'fore'], px + dx * DIM.arm, py + dy * DIM.arm, -fa);
    return [px + dx * DIM.arm + Math.sin(fa) * 100, py + dy * DIM.arm + Math.cos(fa) * 100]; };
  // ik targets are given relative to the shoulder line (x fwd, y down from shoulder)
  const sh0 = hipY - 200, fikT = P.fik && [P.fik[0], sh0 + P.fik[1]], bikT = P.bik && [P.bik[0], sh0 + P.bik[1]];
  const bh = arm('b', P.ba, P.bf, bikT, -14);
  leg('b', P.bt, P.bb, -8); leg('f', P.ft, P.fb, 8);
  spr(ch.P.torso, 0, hipY, -P.lean);
  const [nx, ny] = shoulder(4); const hr = P.head + P.lean * .5;
  spr(ch.P.head, nx, ny - 16, hr);
  ctx.save(); ctx.translate(nx, ny - 16); ctx.rotate(hr); face(ch, o.face || 'neutral', t, o); const m = ctx.getTransform(); ctx.restore();
  const fh = arm('f', P.fa, P.ff, fikT, 12);
  if (o.hold) holdProp(o.hold, fh, bh, t);
  ctx.restore();
  return [m.e + m.a * 6 + m.c * -82, m.f + m.b * 6 + m.d * -82];
}
function face(ch, ex, t, o) {
  const k = ctx, ink = '#2a1d24'; k.lineCap = 'round'; k.strokeStyle = ink; k.fillStyle = ink;
  const blink = hash(Math.floor(t * 1.3) + ch.id.length) > .8 && (t * 1.3 % 1) < .12;
  const eye = (x, s) => { if (ex === 'closed' || ex === 'cry' || blink || ex === 'happy') { k.lineWidth = 3.2; k.beginPath();
      if (ex === 'happy') k.arc(x, -80, 8 * s, Math.PI * 1.15, Math.PI * 1.85); else k.arc(x, -86, 9 * s, Math.PI * .15, Math.PI * .85); k.stroke(); return; }
    const big = ex === 'shock' ? 1.3 : 1; k.fillStyle = ink; k.beginPath(); k.ellipse(x, -84, 5.5 * s * big, 8.5 * s * big, 0, 0, 7); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(x - 2, -87, 2 * s, 0, 7); k.fill(); };
  eye(36, 1); eye(8, .82);
  k.lineWidth = 3; k.beginPath();
  const brow = { sad: [-.25, 6], worry: [-.3, 4], cry: [-.35, 6], shock: [0, -6], happy: [.1, -2], smile: [.1, 0], neutral: [0, 0], closed: [0, 0], angry: [.3, 2] }[ex] || [0, 0];
  for (const [x, w] of [[36, 13], [8, 10]]) { k.moveTo(x - w, -102 + brow[1] - brow[0] * w); k.lineTo(x + w, -102 + brow[1] + brow[0] * w); }
  k.stroke();
  const talk = o.talk ? Math.abs(Math.sin(t * 11)) * (hash(Math.floor(t * 5)) > .25 ? 1 : .2) : 0;
  k.lineWidth = 3.2; k.beginPath();
  if (talk > .15) { k.fillStyle = '#5a2a30'; k.ellipse(36, -42, 8, 3 + talk * 7, 0, 0, 7); k.fill(); }
  else if (ex === 'smile' || ex === 'happy') { k.arc(36, -50, 12, Math.PI * .15, Math.PI * .8); k.stroke(); }
  else if (ex === 'sad' || ex === 'cry' || ex === 'worry') { k.arc(36, -32, 10, Math.PI * 1.2, Math.PI * 1.8); k.stroke(); }
  else if (ex === 'shock') { k.fillStyle = '#5a2a30'; k.ellipse(36, -42, 7, 10, 0, 0, 7); k.fill(); }
  else { k.moveTo(28, -42); k.lineTo(44, -43); k.stroke(); }
  if (ch.d.glasses) { k.lineWidth = 2.5; k.strokeStyle = '#3a2a30'; k.beginPath(); k.arc(36, -84, 17, 0, 7); k.moveTo(19, -86); k.lineTo(-20, -90); k.stroke(); }
  if (ex === 'cry' || o.tears) { k.fillStyle = 'rgba(190,225,255,.9)';
    for (let i = 0; i < 3; i++) { const q = (t * .9 + i / 3) % 1; k.beginPath(); k.ellipse(40 - q * 6, -74 + q * 50, 3.5, 5.5, 0, 0, 7); k.fill(); } }
}
function holdProp(what, h, hb, t) {
  const k = ctx; k.save();
  if (what === 'phone') { k.translate(h[0] + 8, h[1] - 6); k.rotate(-.3); k.fillStyle = '#1e1a24'; k.beginPath(); k.roundRect(-11, -24, 22, 46, 5); k.fill();
    k.fillStyle = 'rgba(150,210,255,.9)'; k.fillRect(-8, -20, 16, 36); }
  if (what === 'keys') { k.translate(h[0] + 6, h[1] + 14); k.strokeStyle = '#e8c060'; k.lineWidth = 3; k.beginPath(); k.arc(0, 0, 9, 0, 7); k.stroke();
    k.fillStyle = '#e8c060'; k.save(); k.rotate(.4 + Math.sin(t * 3) * .1); k.fillRect(-3, 6, 6, 26); k.fillRect(3, 24, 6, 4); k.restore(); k.save(); k.rotate(-.3); k.fillRect(-3, 6, 6, 22); k.restore(); }
  if (what === 'book') { k.translate((h[0] + hb[0]) / 2, (h[1] + hb[1]) / 2 - 10); k.rotate(-.15); k.fillStyle = '#8a3a3a'; k.fillRect(-48, -30, 96, 62);
    k.fillStyle = '#fff4d6'; k.fillRect(-44, -34, 42, 60); k.fillRect(2, -34, 42, 60); k.fillStyle = 'rgba(150,110,70,.6)';
    for (let i = 0; i < 6; i++) { k.fillRect(-40, -26 + i * 8, 34, 2); k.fillRect(6, -26 + i * 8, 34, 2); } }
  if (what === 'can') { k.translate(h[0] + 20, h[1] + 28); k.fillStyle = '#b8733f'; k.beginPath(); k.ellipse(0, 0, 44, 34, 0, 0, 7); k.fill();
    k.fillStyle = '#d99a5a'; k.beginPath(); k.ellipse(-10, -12, 16, 9, -.4, 0, 7); k.fill(); k.strokeStyle = '#8a5a30'; k.lineWidth = 9; k.beginPath(); k.moveTo(36, 0); k.lineTo(96, 30); k.stroke();
    k.lineWidth = 6; k.beginPath(); k.arc(0, -30, 24, Math.PI, 0); k.stroke();
    k.fillStyle = 'rgba(200,230,255,.85)'; for (let i = 0; i < 18; i++) { const ph = (t * 1.8 + i / 18) % 1; k.beginPath(); k.ellipse(98 + ph * 50, 32 + ph * ph * 160, 3, 6, 0, 0, 7); k.fill(); } }
  if (what === 'pen') { k.translate(h[0] + 4, h[1] + 4); k.rotate(.6); k.fillStyle = '#2a3a6a'; k.fillRect(-3, -26, 6, 34); }
  k.restore();
}
