// POV test, refined gouache: "Then you reach your front door ... in your hand ... for ten minutes." (lines 8-12)
// The world is a frontal room 2400x2000; the camera is your head (pan, tilt, bob, roll); hands live in screen space.
const WW = 2400, WH = 2000, GR = 1.2;
const DUR = 19.0, CUT1 = 9.0, CUT2 = 15.05;

// ---------- refined gouache painter: soft wash + directional strokes + crisp shape memory ----------
function gouache(name, w, h, draw, o = {}) {
  seedFrom(name);
  const A = document.createElement('canvas'); A.width = Math.ceil(w * GR); A.height = Math.ceil(h * GR);
  const a = A.getContext('2d'); a.scale(GR, GR); if (o.origin) a.translate(o.origin[0], o.origin[1]); draw(a);
  const Bl = document.createElement('canvas'); Bl.width = A.width; Bl.height = A.height; const bl = Bl.getContext('2d');
  bl.filter = `blur(${(o.soft ?? 3) * GR}px)`; bl.drawImage(A, 0, 0); bl.filter = 'none';
  const B = document.createElement('canvas'); B.width = A.width; B.height = A.height; const b = B.getContext('2d');
  b.drawImage(Bl, 0, 0);
  const d = bl.getImageData(0, 0, A.width, A.height).data, da = a.getImageData(0, 0, A.width, A.height).data;
  const pass = (size, alpha, ratio, dens, jit) => { size *= GR; const n = Math.floor(A.width * A.height / (size * size * .45) * dens);
    for (let i = 0; i < n; i++) { const x = rnd() * A.width, y = rnd() * A.height, k = ((y | 0) * A.width + (x | 0)) * 4; if (da[k + 3] < 120) continue;
      const j = (rnd() - .5) * jit, v = .5 + rnd();
      b.fillStyle = `rgba(${clamp(d[k] + j, 0, 255) | 0},${clamp(d[k + 1] + j * .9, 0, 255) | 0},${clamp(d[k + 2] + j * .8, 0, 255) | 0},${alpha})`;
      const ang = (o.angle ? o.angle(x / GR, y / GR) : Math.PI / 2) + (rnd() - .5) * .5, L = size * v;
      b.save(); b.translate(x, y); b.rotate(ang); b.beginPath(); b.ellipse(0, 0, L, L * ratio, 0, 0, 7); b.fill(); b.restore(); } };
  pass((o.size || 10) * 2.4, .28, .62, .6, 10);   // wash
  pass(o.size || 10, .5, .42, 1, 14);             // strokes
  pass((o.size || 10) * .5, .45, .4, .5, 10);     // detail
  b.globalAlpha = o.crisp ?? .3; b.drawImage(A, 0, 0); b.globalAlpha = 1;   // keeps shapes readable ("refined")
  if (o.clip) { b.globalCompositeOperation = 'destination-in'; b.drawImage(Bl, 0, 0); b.drawImage(A, 0, 0); b.globalCompositeOperation = 'source-over'; }
  if (o.post) { b.save(); b.scale(GR, GR); if (o.origin) b.translate(o.origin[0], o.origin[1]); o.post(b); b.restore(); }
  const res = { c: B, w, h, origin: o.origin || [0, 0] };
  if (o.blurCopy) { const C = document.createElement('canvas'); C.width = B.width; C.height = B.height; const g = C.getContext('2d'); g.filter = `blur(${o.blurCopy * GR}px)`; g.drawImage(B, 0, 0); res.blur = C; }
  return res;
}
const lin = (a, x0, y0, x1, y1, st) => { const g = a.createLinearGradient(x0, y0, x1, y1); st.forEach(([p, c]) => g.addColorStop(p, c)); return g; };
const rad = (a, x, y, r0, r1, st) => { const g = a.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([p, c]) => g.addColorStop(p, c)); return g; };

// ---------- the hallway (one frontal wall + floor in perspective) ----------
const FLOOR = 1290, VP = [1200, 760], LAMP = [1820, 760], WIN = [430, 720];
let ROOM, HAND, HANDR;
function buildRoom() {
  ROOM = gouache('pov-hall', WW, WH, a => {
    // wall: warm plaster, lit by the lamp (right) and cool dusk window (left)
    a.fillStyle = lin(a, 0, 0, 0, FLOOR, [[0, '#b98a6e'], [1, '#d7a882']]); a.fillRect(0, 0, WW, FLOOR);
    a.fillStyle = rad(a, LAMP[0], LAMP[1], 30, 900, [[0, 'rgba(255,214,150,.75)'], [1, 'rgba(255,214,150,0)']]); a.fillRect(0, 0, WW, FLOOR);
    a.fillStyle = rad(a, WIN[0], WIN[1], 50, 700, [[0, 'rgba(150,140,220,.35)'], [1, 'rgba(150,140,220,0)']]); a.fillRect(0, 0, WW, FLOOR);
    a.fillStyle = lin(a, 0, 0, 0, 260, [[0, 'rgba(60,30,40,.35)'], [1, 'rgba(60,30,40,0)']]); a.fillRect(0, 0, WW, 260);
    // dado rail + lower wall
    a.fillStyle = '#9a6650'; a.fillRect(0, 980, WW, 18); a.fillStyle = 'rgba(120,70,60,.25)'; a.fillRect(0, 998, WW, FLOOR - 998);
    // window at dusk
    a.fillStyle = '#6e4e44'; a.fillRect(250, 420, 360, 470);
    a.fillStyle = lin(a, 0, 440, 0, 870, [[0, '#2e3270'], [.55, '#b0688c'], [1, '#f2a070']]); a.fillRect(272, 442, 316, 426);
    a.fillStyle = '#3a2e5a'; for (let i = 0; i < 6; i++) { const x = 272 + i * 56, hh = 60 + hash(i + 3) * 110; a.fillRect(x, 868 - hh, 50, hh); }
    a.fillStyle = '#ffd890'; for (let i = 0; i < 14; i++) a.fillRect(280 + hash(i) * 290, 790 + hash(i + 5) * 70, 7, 9);
    a.fillStyle = '#6e4e44'; a.fillRect(424, 442, 12, 426); a.fillRect(272, 650, 316, 12); a.fillStyle = '#e8d2b8'; a.fillRect(236, 884, 388, 22);
    // coat hooks + scarf
    a.fillStyle = '#4a3428'; a.fillRect(700, 560, 200, 16); for (const x of [730, 800, 870]) { a.beginPath(); a.arc(x, 590, 9, 0, 7); a.fill(); }
    a.fillStyle = '#b8483e'; a.beginPath(); a.moveTo(790, 584); a.quadraticCurveTo(760, 700, 778, 860); a.lineTo(812, 860); a.quadraticCurveTo(806, 700, 816, 584); a.fill();
    a.fillStyle = '#e8c06a'; for (let y = 800; y < 860; y += 14) a.fillRect(778, y, 34, 5);
    // the door
    a.fillStyle = '#5a3a2c'; a.fillRect(960, 300, 480, FLOOR - 300);
    a.fillStyle = lin(a, 990, 0, 1410, 0, [[0, '#2d5e54'], [.6, '#3a7466'], [1, '#4c8a76']]); a.fillRect(990, 330, 420, FLOOR - 330);
    for (const [y, hh] of [[380, 330], [770, 440]]) { a.fillStyle = 'rgba(20,50,44,.55)'; a.fillRect(1036, y, 328, hh); a.fillStyle = lin(a, 1040, 0, 1360, 0, [[0, '#356a5e'], [1, '#46826f']]); a.fillRect(1048, y + 12, 304, hh - 24);
      a.fillStyle = 'rgba(255,220,170,.35)'; a.fillRect(1036, y, 328, 6); a.fillRect(1358, y, 6, hh); }
    a.fillStyle = '#c9a050'; a.beginPath(); a.arc(1200, 470, 14, 0, 7); a.fill(); a.fillStyle = '#2a1e18'; a.beginPath(); a.arc(1200, 470, 6, 0, 7); a.fill();
    a.fillStyle = '#c9a050'; a.fillRect(1150, 300 + 0, 0, 0);
    a.fillStyle = '#d9b060'; a.beginPath(); a.arc(1365, 790, 24, 0, 7); a.fill(); a.fillStyle = '#fff0b8'; a.beginPath(); a.arc(1358, 782, 8, 0, 7); a.fill();
    a.fillStyle = '#b08a40'; a.fillRect(1340, 820, 50, 80); a.fillStyle = '#2a1e18'; a.beginPath(); a.ellipse(1365, 868, 6, 12, 0, 0, 7); a.fill();
    // console table with the (empty) key bowl, lamp above
    a.fillStyle = '#6a4430'; a.fillRect(1600, 940, 420, 26); a.fillRect(1626, 966, 18, FLOOR - 966); a.fillRect(1976, 966, 18, FLOOR - 966);
    a.fillStyle = '#d9c4a8'; a.beginPath(); a.ellipse(1720, 930, 70, 22, 0, 0, Math.PI); a.fill(); a.fillStyle = '#b8a084'; a.beginPath(); a.ellipse(1720, 928, 66, 10, 0, 0, 7); a.fill();
    a.fillStyle = '#7a8a5a'; a.beginPath(); a.ellipse(1900, 900, 34, 44, 0, 0, 7); a.fill(); a.fillStyle = '#5e8a4a'; for (let i = 0; i < 9; i++) { a.beginPath(); a.ellipse(1880 + i * 6, 830 - (i % 3) * 18, 10, 26, (i - 4) * .25, 0, 7); a.fill(); }
    a.fillStyle = '#3a2a24'; a.fillRect(LAMP[0] - 4, 520, 8, 160); a.fillStyle = '#ffdc96'; a.beginPath(); a.moveTo(LAMP[0] - 80, 760); a.lineTo(LAMP[0] + 80, 760); a.lineTo(LAMP[0] + 46, 676); a.lineTo(LAMP[0] - 46, 676); a.fill();
    // skirting + floor in perspective
    a.fillStyle = '#e2c8a8'; a.fillRect(0, FLOOR - 34, WW, 34);
    a.fillStyle = lin(a, 0, FLOOR, 0, WH, [[0, '#7a4a32'], [1, '#a8683e']]); a.fillRect(0, FLOOR, WW, WH - FLOOR);
    a.strokeStyle = 'rgba(60,30,20,.5)'; a.lineWidth = 4;
    for (let i = -14; i <= 14; i++) { const xb = VP[0] + i * 240, xt = VP[0] + (xb - VP[0]) * (FLOOR - VP[1]) / (WH - VP[1]) ; a.beginPath(); a.moveTo(xt, FLOOR); a.lineTo(xb, WH); a.stroke(); }
    a.fillStyle = rad(a, LAMP[0], FLOOR + 100, 20, 700, [[0, 'rgba(255,200,130,.35)'], [1, 'rgba(255,200,130,0)']]); a.fillRect(0, FLOOR, WW, WH - FLOOR);
    // doormat (trapezoid)
    a.fillStyle = '#8a3a34'; a.beginPath(); a.moveTo(1010, FLOOR + 40); a.lineTo(1390, FLOOR + 40); a.lineTo(1500, FLOOR + 260); a.lineTo(900, FLOOR + 260); a.fill();
    a.fillStyle = '#a84a40'; a.beginPath(); a.moveTo(1030, FLOOR + 56); a.lineTo(1370, FLOOR + 56); a.lineTo(1468, FLOOR + 244); a.lineTo(932, FLOOR + 244); a.fill();
    // contact shadows
    a.fillStyle = 'rgba(40,20,20,.35)'; a.fillRect(950, FLOOR - 4, 500, 14); a.fillRect(1600, FLOOR - 4, 420, 12);
  }, { size: 11, blurCopy: 9, angle: (x, y) => y > FLOOR ? Math.atan2(WH - VP[1], (x - VP[0]) || .01) : (x > 990 && x < 1410 ? Math.PI / 2 : .05),
       post: a => { a.fillStyle = 'rgba(255,240,210,.9)'; a.font = '700 40px Fredoka'; a.textAlign = 'center'; a.save(); a.translate(1200, FLOOR + 150); a.scale(1.15, .7); a.fillText('HOME', 0, 0); a.restore();
         a.fillStyle = '#c9a050'; a.font = '700 46px Fredoka'; a.fillText('12', 1200, 370); } });
  // your left hand, palm up (screen space; origin = wrist)
  HAND = gouache('pov-hand', 760, 900, a => {
    a.fillStyle = lin(a, -200, 0, 200, 0, [[0, '#2f6a74'], [1, '#4a96a0']]); a.beginPath(); a.moveTo(-150, 80); a.lineTo(150, 80); a.lineTo(230, 560); a.lineTo(-200, 560); a.fill();
    a.fillStyle = '#3e8590'; a.beginPath(); a.roundRect(-160, 40, 320, 80, 30); a.fill(); a.fillStyle = 'rgba(255,230,200,.25)'; a.fillRect(-150, 48, 300, 10);
    a.fillStyle = lin(a, 0, 60, 0, -380, [[0, '#d99a76'], [.5, '#ebb08a'], [1, '#f2be98']]);
    a.beginPath(); a.moveTo(-118, 60); a.quadraticCurveTo(-150, -110, -122, -210); a.lineTo(128, -214); a.quadraticCurveTo(150, -100, 118, 60); a.fill();
    for (const [x, len, w] of [[-95, 150, 52], [-32, 178, 54], [32, 172, 54], [94, 140, 50]]) { a.beginPath(); a.roundRect(x - w / 2, -214 - len, w, len + 30, w / 2); a.fill(); }
    a.beginPath(); a.save(); a.translate(-120, -60); a.rotate(-.75); a.roundRect(-30, -170, 62, 190, 30); a.fill(); a.restore();
    a.fillStyle = 'rgba(190,110,90,.35)'; a.lineWidth = 5; a.strokeStyle = 'rgba(170,100,80,.45)';
    a.beginPath(); a.moveTo(-110, -150); a.quadraticCurveTo(0, -120, 110, -170); a.stroke(); a.beginPath(); a.moveTo(-60, -10); a.quadraticCurveTo(-80, -110, -20, -200); a.stroke();
    a.fillStyle = 'rgba(255,225,200,.5)'; for (const x of [-95, -32, 32, 94]) { a.beginPath(); a.ellipse(x, -214 - [150, 178, 172, 140][[-95, -32, 32, 94].indexOf(x)] + 34, 16, 22, 0, 0, 7); a.fill(); }
  }, { origin: [380, 520], size: 6, clip: true, crisp: .45, soft: 2 });
  HANDR = HAND;
}

// ---------- shot: camera + hands as functions of t (seconds into the test) ----------
// timings (seconds into the clip; voice clip starts at 11.55 s of the full track)
const L = { door: .19, where: 2.94, hand: 4.6, been: 5.64, ten: 8.37 };
function cam(t) {
  const walk = 1 - seg(t, 0, 2.5), bob = Math.sin(t * 9) * 10 * walk, sway = Math.sin(t * 4.5) * 7 * walk;
  // look-around: left to window, right to lamp, then down to hands
  const lookL = ease(seg(t, 2.7, 3.2)) - ease(seg(t, 3.35, 3.85)), lookR = ease(seg(t, 3.85, 4.25)) - ease(seg(t, 4.35, 4.7));
  const down = ease(seg(t, 4.45, 5.15)) - .55 * ease(seg(t, 8.1, 9.0));
  let cx = 1200 - lookL * 560 + lookR * 470 + sway, cy = 760 + bob + down * 740;
  let z = lerp(1.0, 1.3, ease(seg(t, 0, 2.5))) + down * .1;
  const roll = (Math.sin(t * 4.5) * .008 * walk) - lookL * .02 + lookR * .02;
  const hw = W / 2 / z + 90, hh = H / 2 / z + 60; cx = clamp(cx, hw, WW - hw); cy = clamp(cy, hh, WH - hh);
  return { cx, cy, z, roll, down };
}
function povDoor(t, ret) {
  const c = ret ? retCam(t) : cam(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2); ctx.rotate(c.roll); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy);
  ctx.drawImage(ROOM.c, 0, 0, WW, WH);
  const dof = clamp(c.down * 1.3, 0, 1); if (dof > 0) { ctx.globalAlpha = dof; ctx.drawImage(ROOM.blur, 0, 0, WW, WH); ctx.globalAlpha = 1; }
  // living light: lamp glow + dust
  ctx.globalCompositeOperation = 'lighter';
  const fl = 1 + Math.sin(t * 13) * .02 + Math.sin(t * 5.3) * .03;
  ctx.globalAlpha = .3 * fl; ctx.drawImage(S.glow, LAMP[0] - 260, LAMP[1] - 260, 520, 520); ctx.globalAlpha = 1;
  for (let k = 0; k < 40; k++) { const x = 1300 + hash(k) * 900 + Math.sin(t * .4 + k) * 40, y = 500 + ((hash(k + 9) * 900 + t * 18 * (.5 + hash(k + 2))) % 900); glowAt(x, y, 5, .35); }
  ctx.globalCompositeOperation = 'source-over';
  // hands (screen space, attached to the body: they move with the camera roll, not with the world)
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(W / 2, H / 2); ctx.rotate(c.roll * .5); ctx.translate(-W / 2, -H / 2);
  // right hand: empty, searching (rises during "where are your keys?")
  const rUp = ease(seg(t, 3.0, 3.45)) - ease(seg(t, 4.0, 4.5));
  if (rUp > 0) { ctx.save(); ctx.translate(1480, lerp(H + 900, 860, rUp)); ctx.scale(-1.3, 1.3); ctx.rotate(.18 + Math.sin(t * 7) * .04); spr(HANDR, 0, 0, 0, 1); ctx.restore(); }
  // left hand: the keys, revealed as you look down
  const lUp = ease(seg(t, 4.5, 5.2)) - .9 * ease(seg(t, 8.2, 9.2)), lift = Math.max(0, Math.sin((t - 6.0) * 4)) * seg(t, 6.0, 6.2) * (1 - seg(t, 6.75, 6.9)) * 26;
  if (lUp > 0) { const hx = 880 + Math.sin(t * 1.3) * 6, hy = lerp(H + 900, 840, lUp) - lift; ctx.save(); ctx.translate(hx, hy); ctx.scale(1.45, 1.45); ctx.rotate(-.12 + Math.sin(t * 1.1) * .015);
    // contact shadow of the keys on the palm, then the keys
    spr(HAND, 0, 0, 0, 1); keysOnPalm(t, lift); ctx.restore(); }
  // grade, paper, vignette
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(40,20,60,.08)'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(S.tex, 0, 0);
  if (!ret) blink(t);
}
function keysOnPalm(t, lift) {
  const sw = Math.sin(t * 6) * .06 * (1 + lift / 10);
  ctx.save(); ctx.translate(-10, -150); ctx.rotate(.2 + sw);
  ctx.fillStyle = 'rgba(90,40,30,.35)'; ctx.beginPath(); ctx.ellipse(10, 14, 110, 34, .1, 0, 7); ctx.fill();
  ctx.lineWidth = 9; ctx.strokeStyle = '#c8b27a'; ctx.beginPath(); ctx.arc(-30, 0, 34, 0, 7); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,250,220,.8)'; ctx.beginPath(); ctx.arc(-30, 0, 34, 3.6, 4.6); ctx.stroke();
  const key = (r, col, len) => { ctx.save(); ctx.translate(-30, 0); ctx.rotate(r); ctx.translate(34, 0); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(0, -22, 46, 44, 14); ctx.fill();
    ctx.fillStyle = 'rgba(60,40,20,.5)'; ctx.beginPath(); ctx.arc(14, 0, 7, 0, 7); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(40, -9, len, 18);
    for (let i = 0; i < 4; i++) ctx.fillRect(56 + i * 16, 9, 9, 8 + (i % 2) * 6); ctx.fillStyle = 'rgba(255,255,230,.55)'; ctx.fillRect(44, -8, len - 6, 4); ctx.restore(); };
  key(-.25, '#d8b860', 110); key(.35, '#b8bcc4', 90);
  ctx.save(); ctx.translate(-80, 30); ctx.rotate(.4 + sw * 2); ctx.fillStyle = '#c94a4a'; ctx.beginPath(); ctx.roundRect(-26, 0, 52, 66, 16); ctx.fill(); ctx.fillStyle = 'rgba(255,240,220,.85)'; ctx.font = '700 26px Fredoka'; ctx.textAlign = 'center'; ctx.fillText('12', 0, 44); ctx.restore();
  ctx.restore();
}
function blink(t) { const b = Math.max(0, 1 - Math.abs(t - 6.85) / .13); if (b <= 0) return; ctx.fillStyle = '#0c0608';
  const hgt = b * H * .55; ctx.beginPath(); ctx.ellipse(W / 2, -H * .2 + hgt * 1.1, W * .8, H * .45, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(W / 2, H * 1.2 - hgt * 1.1, W * .8, H * .45, 0, 0, 7); ctx.fill(); }
const CAPS = [[.19, 2.43, 'Then you reach your front door.'], [2.94, 4.13, 'Where are your keys?'], [4.6, 5.17, 'In your hand.'], [5.64, 7.62, 'Where they’ve been...'], [8.37, 9.05, 'for ten minutes.'],
  [9.05, 11.19, 'Most people hold about four things in mind at once.'], [11.61, 12.19, 'Maybe seven.'], [12.53, 14.09, 'Scientists still argue about which.'], [14.54, 15.13, 'That’s tiny.'], [15.13, 15.6, 'You?'], [15.97, 18.75, 'A memory the size of one million books.']];
function captions(t) { const i = CAPS.findIndex((c, k) => t >= c[0] - .1 && t < (CAPS[k + 1] ? CAPS[k + 1][0] - .1 : DUR)); if (i < 0) return; const c = CAPS[i]; if (t > c[1] + .7) return;
  ctx.globalAlpha = Math.min(seg(t, c[0] - .1, c[0] + .08), 1 - seg(t, c[1] + .5, c[1] + .7)); ctx.font = '600 50px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(30,12,24,.75)'; ctx.strokeText(c[2], W / 2, H - 80); ctx.fillStyle = '#fff6e6'; ctx.fillText(c[2], W / 2, H - 80); ctx.globalAlpha = 1; }

// ---------- master edit: POV -> whiteboard fact -> POV ----------
function retCam(t) { const q = t - CUT2; return { cx: 1200 + Math.sin(q * .7) * 12, cy: 700, z: 1.12 + q * .03, roll: Math.sin(q * .9) * .004, down: 0 }; }
function render(t) {
  if (t < CUT1) povDoor(t);
  else if (t < CUT2) board(t - CUT1);
  else { povDoor(t, true); pageTunnel(t - CUT2); }
  // transitions: page-swipe into the board, white flash back into POV
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const k1 = 1 - seg(t, CUT1 - .02, CUT1 + .35); if (t >= CUT1 && k1 > 0 && t < CUT2) { const x = W * (1 - ease(1 - k1)); ctx.save(); ctx.translate(x, 0); ctx.fillStyle = 'rgba(30,20,20,.35)'; ctx.fillRect(-40, 0, 40, H); ctx.restore(); }
  const fl = Math.max(0, 1 - Math.abs(t - CUT2) / .18); if (fl > 0) { ctx.fillStyle = `rgba(255,248,230,${fl})`; ctx.fillRect(0, 0, W, H); }
  captions(t);
  const k = Math.min(seg(t, 0, .35), 1 - seg(t, DUR - .5, DUR)); if (k < 1) { ctx.fillStyle = `rgba(14,6,14,${1 - k})`; ctx.fillRect(0, 0, W, H); }
}
// "A memory the size of one million books": glowing pages fly out of the centre, past you
function pageTunnel(q) {
  const n = Math.floor(clamp(q / 2.2, 0, 1) * 160) + 6, cx = W / 2, cy = H * .45;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(q / 1.2, 0, 1) * .5; ctx.drawImage(S.glow, cx - 700, cy - 700, 1400, 1400); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  for (let k = 0; k < n; k++) { const life = 2.4, ph = ((q * (.5 + hash(k) * .4) + hash(k + 3) * life) % life) / life, z = Math.pow(ph, 2.2);
    const an = hash(k + 7) * 6.283, r = 40 + z * 1300, x = cx + Math.cos(an) * r * 1.4, y = cy + Math.sin(an) * r * .9, s = .4 + z * 5;
    const a = Math.min(1, ph * 4) * (1 - Math.max(0, (z - .8) / .2));
    ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 30 * s, .35 * a); ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0); page(x, y, Math.sin(q * 2 + k) * .6, s, a); }
}
if (!window.FILM2) window.render = render;
if (!window.FILM2) document.fonts.load('700 40px Fredoka').then(() => { buildStatic(); buildRoom(); buildBoard(); window.FACES = []; window.SCENE = 'pov-door'; window.DUR = DUR; render(0); window.READY = true; });
