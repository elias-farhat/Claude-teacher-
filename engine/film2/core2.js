// POV film, part 1: front-facing cast busts, first-person hands, overlays. Painted once, animated live.
window.FILM2 = true;
const CAST2 = {
  ben:   { skin: '#b97a56', skin2: '#9a5f40', hair: '#1e1614', top: '#d9973a', style: 'curly' },
  prof:  { skin: '#e0a985', skin2: '#c48b68', hair: '#9a96a0', top: '#7a5a44', style: 'bald', glasses: true, coat: '#6a4a36' },
  waiter:{ skin: '#d7a07c', skin2: '#bb8461', hair: '#20160f', top: '#f4efe6', style: 'neat', apron: '#7a2f2a' },
  f1:    { skin: '#e9b38f', skin2: '#d0906c', hair: '#c8823a', top: '#6a8ac8', style: 'pony' },
  f2:    { skin: '#8a5a3e', skin2: '#6e4530', hair: '#141010', top: '#c85a6a', style: 'neat' },
  f3:    { skin: '#f0c4a0', skin2: '#d8a07e', hair: '#5a3a22', top: '#5aa07a', style: 'curly' },
  f4:    { skin: '#c99068', skin2: '#a87050', hair: '#2a1a12', top: '#e0b84a', style: 'long' },
  hale:  { skin: '#8a5a3e', skin2: '#6e4530', hair: '#cfcfd6', top: '#f4f1ea', style: 'short', glasses: true, beard: '#bdbdc6', shirt: '#3f6f8f' },
  rose:  { skin: '#ecbd9c', skin2: '#d39a78', hair: '#dcd7e0', top: '#7d9a6b', style: 'bun', glasses: true, old: true },
  roseY: { skin: '#f0c4a0', skin2: '#d8a07e', hair: '#6a4028', top: '#c86a5a', style: 'bun' },
};
const BUST = {};
function bust(id) { if (BUST[id]) return BUST[id]; const d = CAST2[id];
  const torso = gouache('b-torso-' + id, 520, 520, a => {
    a.fillStyle = d.top; a.beginPath(); a.moveTo(-60, 0); a.quadraticCurveTo(-200, 20, -222, 120); a.lineTo(-236, 500); a.lineTo(236, 500); a.lineTo(222, 120); a.quadraticCurveTo(200, 20, 60, 0); a.fill();
    a.fillStyle = 'rgba(0,0,0,.12)'; a.beginPath(); a.moveTo(-60, 0); a.quadraticCurveTo(0, 60, 60, 0); a.fill();
    if (d.coat) { a.fillStyle = d.coat; a.beginPath(); a.moveTo(-60, 2); a.lineTo(-20, 220); a.lineTo(-10, 500); a.lineTo(-236, 500); a.lineTo(-222, 120); a.quadraticCurveTo(-200, 20, -60, 2); a.fill(); a.beginPath(); a.moveTo(60, 2); a.lineTo(20, 220); a.lineTo(10, 500); a.lineTo(236, 500); a.lineTo(222, 120); a.quadraticCurveTo(200, 20, 60, 2); a.fill(); }
    if (d.shirt) { a.fillStyle = d.shirt; a.beginPath(); a.moveTo(-40, 0); a.lineTo(0, 120); a.lineTo(40, 0); a.fill(); a.fillStyle = '#2a3a5a'; a.fillRect(-8, 10, 16, 140); }
    if (d.apron) { a.fillStyle = d.apron; a.fillRect(-150, 200, 300, 300); a.fillRect(-120, 40, 20, 170); a.fillRect(100, 40, 20, 170); }
    if (d.old) { a.fillStyle = '#e8dcc0'; for (let y = 60; y < 480; y += 70) { a.beginPath(); a.arc(0, y, 8, 0, 7); a.fill(); } a.strokeStyle = 'rgba(0,0,0,.15)'; a.lineWidth = 4; a.beginPath(); a.moveTo(0, 20); a.lineTo(0, 500); a.stroke(); }
  }, { origin: [260, 10], size: 7, clip: true, crisp: .4, soft: 2 });
  const head = gouache('b-head-' + id, 320, 360, a => {
    a.fillStyle = d.hair;
    if (d.style === 'long') { a.beginPath(); a.ellipse(0, -90, 118, 150, 0, 0, 7); a.fill(); }
    if (d.style === 'pony') { a.beginPath(); a.ellipse(0, -140, 104, 92, 0, 0, 7); a.fill(); }
    if (d.style === 'curly') for (let k = 0; k < 18; k++) { const an = Math.PI * (.9 + k / 17 * 1.2); a.beginPath(); a.arc(Math.cos(an) * 92, -130 + Math.sin(an) * 92, 30, 0, 7); a.fill(); }
    if (d.style === 'bun') { a.beginPath(); a.arc(0, -248, 42, 0, 7); a.fill(); }
    a.fillStyle = d.skin; a.fillRect(-36, -40, 72, 60);
    a.beginPath(); a.ellipse(-92, -116, 18, 26, 0, 0, 7); a.fill(); a.beginPath(); a.ellipse(92, -116, 18, 26, 0, 0, 7); a.fill();
    a.beginPath(); a.ellipse(0, -122, 90, 110, 0, 0, 7); a.fill();
    a.fillStyle = 'rgba(120,50,40,.10)'; a.beginPath(); a.ellipse(0, -30, 60, 20, 0, 0, 7); a.fill();
    a.fillStyle = d.skin2; a.beginPath(); a.ellipse(0, -96, 13, 20, 0, 0, 7); a.fill();
    if (d.beard) { a.fillStyle = d.beard; a.beginPath(); a.moveTo(-86, -120); a.quadraticCurveTo(-80, 0, 0, 0); a.quadraticCurveTo(80, 0, 86, -120); a.quadraticCurveTo(60, -60, 30, -66); a.quadraticCurveTo(0, -56, -30, -66); a.quadraticCurveTo(-60, -60, -86, -120); a.fill(); }
    a.fillStyle = 'rgba(225,110,100,.35)'; a.beginPath(); a.arc(-52, -84, 18, 0, 7); a.fill(); a.beginPath(); a.arc(52, -84, 18, 0, 7); a.fill();
    if (d.old) { a.strokeStyle = 'rgba(150,90,70,.35)'; a.lineWidth = 3; for (const s of [-1, 1]) { a.beginPath(); a.arc(s * 58, -112, 22, s > 0 ? -.4 : Math.PI - .2, s > 0 ? .3 : Math.PI + .5); a.stroke(); } a.beginPath(); a.moveTo(-30, -186); a.lineTo(30, -186); a.stroke(); }
    a.fillStyle = d.hair;
    if (d.style === 'pony' || d.style === 'long') { a.beginPath(); a.moveTo(-96, -120); a.quadraticCurveTo(-90, -238, 0, -236); a.quadraticCurveTo(90, -238, 98, -120); a.quadraticCurveTo(60, -200, 10, -170); a.quadraticCurveTo(-40, -200, -96, -120); a.fill(); }
    if (d.style === 'curly') for (let k = 0; k < 9; k++) { a.beginPath(); a.arc(-80 + k * 20, -218 + Math.sin(k * 1.3) * 8, 26, 0, 7); a.fill(); }
    if (d.style === 'bun') { a.beginPath(); a.moveTo(-94, -110); a.quadraticCurveTo(-96, -236, 0, -234); a.quadraticCurveTo(96, -236, 94, -110); a.quadraticCurveTo(70, -190, 0, -196); a.quadraticCurveTo(-70, -190, -94, -110); a.fill(); }
    if (d.style === 'neat' || d.style === 'short') { a.beginPath(); a.moveTo(-92, -130); a.quadraticCurveTo(-90, -238, 0, -236); a.quadraticCurveTo(90, -238, 92, -130); a.quadraticCurveTo(40, -210, -92, -130); a.fill(); }
    if (d.style === 'bald') { for (const s of [-1, 1]) { a.beginPath(); a.ellipse(s * 86, -150, 22, 44, 0, 0, 7); a.fill(); } }
  }, { origin: [160, 290], size: 5, clip: true, crisp: .45, soft: 2 });
  const arm = gouache('b-arm-' + id, 120, 360, a => { a.fillStyle = d.coat || d.top; a.beginPath(); a.roundRect(-34, -20, 68, 290, 32); a.fill(); a.fillStyle = d.skin; a.beginPath(); a.ellipse(0, 290, 30, 38, 0, 0, 7); a.fill(); },
    { origin: [60, 40], size: 5, clip: true, crisp: .45, soft: 2 });
  return BUST[id] = { d, torso, head, arm };
}
// o: {s, look:[dx,dy], tilt, face, talk, armL, armR (angles, 0 = hanging, + = toward body centre / up), lean, tears, cough, shake}
function drawBust(id, x, y, o, t) { const B = bust(id), s = o.s || 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.lean || 0);
  const br = Math.sin(t * 2) * 3, sh = o.shake ? Math.sin(t * 40) * o.shake : 0;
  const arm = (side, a) => { ctx.save(); ctx.translate(side * 205, 70 + br); ctx.rotate(-side * a); spr(B.arm, 0, 0, 0, 1); ctx.restore(); };
  arm(-1, o.armL || .12); arm(1, o.armR || .12);
  spr(B.torso, 0, br, 0, 1);
  ctx.save(); ctx.translate(sh, br + (o.cough ? -Math.abs(Math.sin(t * 18)) * 8 * o.cough : 0)); ctx.rotate((o.tilt || 0) + sh * .004);
  spr(B.head, 0, 0, 0, 1); face2(B.d, o, t); ctx.restore();
  if (o.front) for (const [side, a] of o.front) arm(side, a);
  ctx.restore(); }
function face2(d, o, t) { const k = ctx, ink = '#2a1d24', ex = o.face || 'neutral', [lx, ly] = o.look || [0, 0];
  const blink = (hash(Math.floor(t * 1.1) + d.skin.length) > .82 && (t * 1.1 % 1) < .12) || ex === 'closed';
  for (const s of [-1, 1]) { const x = s * 36 + lx * 6, y = -124 + ly * 4;
    if (blink || ex === 'happy') { k.strokeStyle = ink; k.lineWidth = 4; k.beginPath(); if (ex === 'happy') k.arc(x, y + 6, 12, Math.PI * 1.15, Math.PI * 1.85); else k.arc(x, y - 4, 12, Math.PI * .15, Math.PI * .85); k.stroke(); }
    else { const big = ex === 'shock' ? 1.25 : 1; k.fillStyle = '#fbf6ee'; k.beginPath(); k.ellipse(s * 36, -124, 15, 18 * big, 0, 0, 7); k.fill();
      k.fillStyle = ink; k.beginPath(); k.ellipse(x, y, 9 * big, 12 * big, 0, 0, 7); k.fill(); k.fillStyle = '#fff'; k.beginPath(); k.arc(x - 3, y - 5, 3.5, 0, 7); k.fill(); }
    const br = { sad: [-.3, 6], worry: [-.35, 4], scared: [-.45, 2], shock: [0, -10], happy: [.1, -4], smile: [.05, -2], neutral: [0, 0], angry: [.35, 4], closed: [0, 0] }[ex] || [0, 0];
    k.strokeStyle = ink; k.lineWidth = 5; k.lineCap = 'round'; k.beginPath(); k.moveTo(s * 36 - 16, -152 + br[1] + s * br[0] * 16 * -1); k.lineTo(s * 36 + 16, -152 + br[1] + s * br[0] * 16); k.stroke(); }
  const talk = o.talk ? Math.abs(Math.sin(t * 11)) * (hash(Math.floor(t * 5)) > .25 ? 1 : .2) : 0;
  k.lineWidth = 4.5; k.strokeStyle = ink; k.beginPath();
  if (o.cough) { k.fillStyle = '#5a2a30'; k.ellipse(0, -60, 14, 10 + Math.abs(Math.sin(t * 18)) * 8, 0, 0, 7); k.fill(); }
  else if (talk > .15) { k.fillStyle = '#5a2a30'; k.ellipse(0, -60, 16, 4 + talk * 12, 0, 0, 7); k.fill(); }
  else if (ex === 'smile' || ex === 'happy') { k.arc(0, -74, 22, Math.PI * .2, Math.PI * .8); k.stroke(); }
  else if (ex === 'sad' || ex === 'worry' || ex === 'scared') { k.arc(0, -42, 18, Math.PI * 1.2, Math.PI * 1.8); k.stroke(); }
  else if (ex === 'shock') { k.fillStyle = '#5a2a30'; k.ellipse(0, -60, 12, 17, 0, 0, 7); k.fill(); }
  else { k.moveTo(-14, -60); k.lineTo(14, -60); k.stroke(); }
  if (d.glasses) { k.lineWidth = 3.5; k.strokeStyle = '#3a2a30'; k.beginPath(); k.arc(-36, -124, 26, 0, 7); k.moveTo(10, -124); k.arc(36, -124, 26, Math.PI, Math.PI * 3); k.moveTo(-10, -126); k.lineTo(10, -126); k.stroke(); }
  if (o.tears) { k.fillStyle = 'rgba(190,225,255,.9)'; for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const q = (t * .8 + i / 2 + (s > 0 ? .3 : 0)) % 1; k.beginPath(); k.ellipse(s * 40, -104 + q * 60, 5, 8, 0, 0, 7); k.fill(); } } }

// ---------- first-person hands ----------
let HANDB, HANDO;
function buildHands() {
  const back = (name, skin, sleeve) => gouache(name, 560, 760, a => {
    a.fillStyle = sleeve; a.beginPath(); a.moveTo(-130, 90); a.lineTo(130, 90); a.lineTo(190, 460); a.lineTo(-170, 460); a.fill();
    a.fillStyle = shade2(sleeve, 1.15); a.beginPath(); a.roundRect(-140, 50, 280, 76, 28); a.fill();
    a.fillStyle = lin(a, 0, 60, 0, -300, [[0, shade2(skin, .9)], [1, skin]]);
    a.beginPath(); a.moveTo(-104, 70); a.quadraticCurveTo(-124, -90, -100, -170); a.lineTo(104, -176); a.quadraticCurveTo(124, -80, 104, 70); a.fill();
    for (const [x, len] of [[-78, 120], [-26, 140], [26, 134], [78, 110]]) { a.beginPath(); a.roundRect(x - 23, -176 - len, 46, len + 26, 23); a.fill(); }
    a.save(); a.translate(-104, -40); a.rotate(-.9); a.beginPath(); a.roundRect(-26, -140, 54, 160, 26); a.fill(); a.restore();
    a.strokeStyle = 'rgba(120,60,50,.3)'; a.lineWidth = 4; for (const x of [-78, -26, 26, 78]) { a.beginPath(); a.moveTo(x - 12, -190); a.lineTo(x + 12, -190); a.stroke(); }
    a.fillStyle = 'rgba(255,240,230,.55)'; for (const [x, len] of [[-78, 120], [-26, 140], [26, 134], [78, 110]]) { a.beginPath(); a.ellipse(x, -176 - len + 22, 13, 16, 0, 0, 7); a.fill(); }
  }, { origin: [280, 470], size: 6, clip: true, crisp: .45, soft: 2 });
  HANDB = back('pov-handb', '#ebb08a', '#3e8590');
  HANDO = back('pov-hando', '#e8b898', '#7d9a6b');
}
function shade2(hex, k) { const n = parseInt(hex.slice(1), 16); return `rgb(${clamp((n >> 16) * k, 0, 255) | 0},${clamp((n >> 8 & 255) * k, 0, 255) | 0},${clamp((n & 255) * k, 0, 255) | 0})`; }
// right hand holding a phone up in front of you (screen space)
function phoneInHand(x, y, s, t, o = {}) { const bz = o.buzz ? Math.sin(t * 70) * 6 : 0;
  ctx.save(); ctx.translate(x + bz, y); ctx.scale(s, s); ctx.rotate(-.06);
  spr(HANDB, 40, 330, -.1, 1);
  ctx.fillStyle = '#1c1a22'; ctx.beginPath(); ctx.roundRect(-150, -300, 300, 560, 40); ctx.fill();
  const scr = ctx.createLinearGradient(0, -280, 0, 240); scr.addColorStop(0, o.c0 || '#2a4a7a'); scr.addColorStop(1, o.c1 || '#6a4a8a'); ctx.fillStyle = scr; ctx.beginPath(); ctx.roundRect(-134, -282, 268, 524, 30); ctx.fill();
  if (o.draw) o.draw(t);
  ctx.fillStyle = '#ebb08a'; ctx.beginPath(); ctx.roundRect(-196, 40, 74, 200, 36); ctx.fill(); ctx.beginPath(); ctx.roundRect(130, 20, 60, 150, 30); ctx.fill();
  ctx.restore();
  if (o.buzz) { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { const r = 40 + k * 26 + (t * 80 % 26); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sd * 190 * s, y - 80 * s, r, sd > 0 ? -.6 : Math.PI - .6, sd > 0 ? .6 : Math.PI + .6); ctx.stroke(); } } } }
// writing hand (pen tip at x,y)
function writingHand(x, y, s, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#2a3a6a'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(120, -150); ctx.stroke(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
  spr(HANDB, 230, 160, -.75, 1); ctx.restore(); }

// ---------- whiteboard helpers (generic boards built from data) ----------
// items: {k:'s', pts, t0, dur, col, w} strokes | {k:'t', str, x, y, size, col, t0, dur, align}
function wbDraw(items, b, cam) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(BOARD.c, 0, 0, W, H);
  const [cx, cy, z] = cam || [960, 540, 1]; ctx.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z); let tip = null;
  for (const it of items) { let r = null;
    if (it.k === 's') r = drawStroke(it, b); else if (it.k === 't') r = writeText(it.str, it.x, it.y, it.size, it.col, b, it.t0, it.dur, it.align);
    else if (it.k === 'f' && b >= it.t0) it.fn(b - it.t0, b);
    if (r) tip = r; }
  marker(tip, b); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = .5; ctx.drawImage(S.tex, 0, 0); ctx.globalAlpha = 1; }
const st = (pts, t0, dur, col = INK, w = 7) => ({ k: 's', pts: wob(pts, 2.4, t0 * 7 + pts.length), t0, dur, col, w });
const tx = (str, x, y, size, col, t0, dur, align = 'center') => ({ k: 't', str, x, y, size, col, t0, dur: dur ?? Math.max(.25, str.length * .045), align });
const fn = (t0, f) => ({ k: 'f', t0, fn: f });
const headPts = (hx, hy, s = 1) => spline([[-120, 260], [-150, 150], [-172, 30], [-150, -90], [-90, -175], [20, -210], [120, -170], [168, -95], [178, -40], [214, 6], [176, 34], [186, 66], [168, 92], [160, 126], [96, 160], [84, 262]].map(([x, y]) => [hx + x * s, hy + y * s]), 8);

// ---------- overlays ----------
function bubble2(x, y, str, a, tail = 'down') { if (window.SHORTCX != null) x = window.SHORTCX + 40; ctx.save(); ctx.globalAlpha = a; ctx.font = '600 52px Fredoka'; const w = ctx.measureText(str).width + 70;
  ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 50, w, 100, 44); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 20, y + 46); ctx.lineTo(x - 40, y + 100); ctx.lineTo(x + 20, y + 46); ctx.fill();
  ctx.fillStyle = '#3a2430'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y + 2); ctx.restore(); }
function bigText(str, x, y, size, a, col = '#fff6e6', glow = 'rgba(255,200,120,.9)') { ctx.save(); ctx.globalAlpha = a; ctx.font = `700 ${size}px Fredoka`;
  if (window.SHORTCX != null && Math.abs(x - window.SHORTCX) < 400) { x = window.SHORTCX; const w = ctx.measureText(str).width; if (w > 500) { size = size * 500 / w; ctx.font = `700 ${size}px Fredoka`; } } ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = size / 6; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,16,40,.7)'; ctx.strokeText(str, x, y); ctx.shadowColor = glow; ctx.shadowBlur = 30; ctx.fillStyle = col; ctx.fillText(str, x, y); ctx.restore(); }
function notes2(x, y, t, a, dir = 1) { for (let k = 0; k < 6; k++) { const q = (t * .45 + k / 6) % 1; ctx.globalCompositeOperation = 'lighter'; glowAt(x + dir * q * 260 + Math.sin(q * 9 + k) * 30, y - q * 240, 34, .5 * a * (1 - q)); ctx.globalCompositeOperation = 'source-over';
  note(x + dir * q * 260 + Math.sin(q * 9 + k) * 30, y - q * 240, 1.8, a * Math.min(1, (1 - q) * 2)); } }
function letter(x, y, r, a) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = '#fff4e0'; ctx.fillRect(-40, -27, 80, 54);
  ctx.strokeStyle = '#b08a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-40, -27); ctx.lineTo(0, 6); ctx.lineTo(40, -27); ctx.stroke(); ctx.fillStyle = '#c94a4a'; ctx.beginPath(); ctx.arc(0, 6, 8, 0, 7); ctx.fill(); ctx.restore(); }
