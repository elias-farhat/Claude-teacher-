// Painted storybook engine (test scene: Grandma Rose's balcony at golden hour).
// Layers and characters are painted ONCE from brush dabs; each frame only moves them.
const W = 1920, H = 1080, R = 1.5;          // layers are painted at 1.5x so the camera can push in
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const ease = x => { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

// ---------- the painter: flat drawing -> oriented brush dabs sampled from it ----------
function painted(w, h, draw, o = {}) {
  const A = document.createElement('canvas'); A.width = w * R; A.height = h * R;
  const a = A.getContext('2d'); a.scale(R, R); if (o.origin) a.translate(o.origin[0], o.origin[1]); draw(a);
  const B = document.createElement('canvas'); B.width = A.width; B.height = A.height; const b = B.getContext('2d');
  b.drawImage(A, 0, 0);
  const d = a.getImageData(0, 0, A.width, A.height).data, size = (o.size || 14) * R;
  const n = Math.floor(A.width * A.height / (size * size * .3) * (o.density || 1));
  for (let i = 0; i < n; i++) {
    const x = rnd() * A.width, y = rnd() * A.height, k = ((y | 0) * A.width + (x | 0)) * 4;
    if (d[k + 3] < 140) continue;
    const j = (rnd() - .5) * (o.jitter ?? 18);
    b.fillStyle = `rgba(${clamp(d[k] + j, 0, 255) | 0},${clamp(d[k + 1] + j * .9, 0, 255) | 0},${clamp(d[k + 2] + j * .7, 0, 255) | 0},${o.alpha || .85})`;
    const L = size * (.55 + rnd() * .9), ang = (o.angle ? o.angle(x / R, y / R) : 0) + (rnd() - .5) * (o.spread ?? .6);
    b.save(); b.translate(x, y); b.rotate(ang); b.beginPath(); b.ellipse(0, 0, L, L * .32, 0, 0, 7); b.fill(); b.restore();
  }
  if (o.clip) {
    b.globalCompositeOperation = 'destination-in'; b.drawImage(A, 0, 0); b.globalCompositeOperation = 'source-atop';
    const g = b.createLinearGradient(0, 0, B.width, 0); g.addColorStop(0, 'rgba(70,25,70,.38)'); g.addColorStop(.55, 'rgba(70,25,70,0)'); g.addColorStop(1, 'rgba(255,190,110,.22)');
    b.fillStyle = g; b.fillRect(0, 0, B.width, B.height);
    // rim: mask minus mask shifted left -> thin edge on the sun side
    const M = document.createElement('canvas'); M.width = B.width; M.height = B.height; const m = M.getContext('2d');
    m.drawImage(A, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = 'rgba(255,214,140,.9)'; m.fillRect(0, 0, M.width, M.height);
    m.globalCompositeOperation = 'destination-out'; m.drawImage(A, -7 * R, 2 * R);
    b.globalCompositeOperation = 'source-atop'; b.drawImage(M, 0, 0);
    // soft dark outline just inside the silhouette
    const E = document.createElement('canvas'); E.width = B.width; E.height = B.height; const e = E.getContext('2d');
    e.drawImage(A, 0, 0); e.globalCompositeOperation = 'source-in'; e.fillStyle = 'rgba(50,20,40,.55)'; e.fillRect(0, 0, E.width, E.height);
    e.globalCompositeOperation = 'destination-out'; for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) { e.save(); e.globalAlpha = .5; e.drawImage(A, dx * R, dy * R); e.restore(); }
    b.drawImage(E, 0, 0); b.globalCompositeOperation = 'source-over';
  }
  if (o.post) { b.save(); b.scale(R, R); if (o.origin) b.translate(o.origin[0], o.origin[1]); o.post(b); b.restore(); }
  return { c: B, w, h, origin: o.origin || [0, 0] };
}
// draw a sprite whose local origin sits at world (x,y), with rotation r about that origin
function spr(s, x, y, r = 0, sc = 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(sc, sc); ctx.drawImage(s.c, -s.origin[0], -s.origin[1], s.w, s.h); ctx.restore(); }

// ---------- palette (golden hour) ----------
const C = { sky0: '#4b3f7a', sky1: '#b5608a', sky2: '#f08a56', sky3: '#ffd08a', city: '#5b4876', city2: '#463963', win: '#ffcf7a',
  wall: '#e2a873', wall2: '#c98656', floor: '#b8603e', floor2: '#9a4c31', iron: '#2e2233', pot: '#c06a3e', pot2: '#9a4f2c',
  mint: '#5f9a4a', mint2: '#3f7a3a', mint3: '#8cc46a', skin: '#e9b38f', skin2: '#d0906c', ink: '#2a1d24' };

// ---------- build layers once ----------
let L = {};
function build() {
  L.sky = painted(W, H, a => {
    const g = a.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, C.sky0); g.addColorStop(.42, C.sky1); g.addColorStop(.78, C.sky2); g.addColorStop(1, C.sky3);
    a.fillStyle = g; a.fillRect(0, 0, W, H);
    const s = a.createRadialGradient(1170, 640, 20, 1170, 640, 420); s.addColorStop(0, 'rgba(255,240,190,1)'); s.addColorStop(.18, 'rgba(255,214,140,.9)'); s.addColorStop(1, 'rgba(255,180,110,0)');
    a.fillStyle = s; a.fillRect(0, 0, W, H);
    a.fillStyle = 'rgba(255,190,170,.55)';
    for (const [x, y, w] of [[200, 230, 520], [820, 160, 640], [1250, 330, 560], [380, 420, 420], [1500, 220, 380]]) { a.beginPath(); a.ellipse(x + w / 2, y, w / 2, 20, 0, 0, 7); a.fill(); }
  }, { size: 26, angle: () => 0, spread: .25, jitter: 14 });
  L.city = painted(W, H, a => {
    seed = 11; let x = -20;
    while (x < W + 40) { const w = 60 + rnd() * 110, h = 70 + rnd() * 170, y0 = 690 - h;
      a.fillStyle = rnd() > .5 ? C.city : C.city2; a.fillRect(x, y0, w, h + 80);
      if (rnd() > .78) { a.beginPath(); a.arc(x + w / 2, y0, w * .36, Math.PI, 0); a.fill(); }
      if (rnd() > .85) a.fillRect(x + w * .45, y0 - 90, 10, 90);
      a.fillStyle = C.win; for (let wy = y0 + 18; wy < 680; wy += 26) for (let wx = x + 10; wx < x + w - 12; wx += 20) if (rnd() > .62) a.fillRect(wx, wy, 7, 10);
      x += w + rnd() * 8; }
    a.fillStyle = 'rgba(255,190,140,.35)'; a.fillRect(0, 600, W, 120);   // haze toward the sun
  }, { size: 9, angle: () => Math.PI / 2, spread: .3, jitter: 16 });
  L.balcony = painted(W, H, a => {
    // apartment wall + door on the left, with warm light spilling out
    a.fillStyle = C.wall; a.fillRect(0, 0, 420, H); a.fillStyle = C.wall2; a.fillRect(380, 0, 40, H);
    a.fillStyle = '#7a4a3a'; a.fillRect(70, 260, 260, 640); a.fillStyle = '#ffd59a'; a.fillRect(92, 282, 216, 618);
    a.fillStyle = '#e88a6a'; a.beginPath(); a.moveTo(92, 282); a.quadraticCurveTo(160, 560, 120, 900); a.lineTo(92, 900); a.fill();   // curtain
    a.fillStyle = 'rgba(255,214,150,.6)'; a.beginPath(); a.moveTo(308, 900); a.lineTo(560, 1080); a.lineTo(0, 1080); a.lineTo(92, 900); a.fill();
    // floor tiles
    a.fillStyle = C.floor; a.fillRect(0, 900, W, 180); a.strokeStyle = C.floor2; a.lineWidth = 4;
    for (let i = -10; i < 30; i++) { a.beginPath(); a.moveTo(i * 120, 900); a.lineTo(i * 120 - 220, 1080); a.stroke(); }
    for (const y of [940, 1000]) { a.beginPath(); a.moveTo(0, y); a.lineTo(W, y); a.stroke(); }
    // ledge + wrought-iron railing
    a.fillStyle = '#d99a6a'; a.fillRect(420, 860, W, 44); a.fillStyle = '#b0744a'; a.fillRect(420, 896, W, 10);
    a.fillStyle = C.iron; a.fillRect(420, 650, W, 14); a.fillRect(420, 846, W, 10);
    for (let x = 440; x < W; x += 46) { a.fillRect(x, 650, 7, 200); a.beginPath(); a.arc(x + 23, 760, 16, 0, 7); a.lineWidth = 5; a.strokeStyle = C.iron; a.stroke(); }
    // hanging lamp by the door (a practical light)
    a.fillStyle = C.iron; a.fillRect(445, 120, 4, 160); a.fillStyle = '#ffe2a0'; a.beginPath(); a.arc(447, 300, 26, 0, 7); a.fill();
  }, { size: 12, angle: (x, y) => y > 900 ? 0.15 : Math.PI / 2, spread: .5, jitter: 16 });
  // mint pots (three sprites, sway per frame about the pot base)
  L.pots = [0, 1, 2].map(i => painted(220, 300, a => {
    a.fillStyle = C.pot; a.beginPath(); a.moveTo(-70, -110); a.lineTo(70, -110); a.lineTo(52, 0); a.lineTo(-52, 0); a.fill();
    a.fillStyle = C.pot2; a.fillRect(-78, -128, 156, 26);
    seed = 50 + i * 9;
    for (let k = 0; k < 46; k++) { const ang = -Math.PI / 2 + (rnd() - .5) * 2.2, r = 30 + rnd() * 120;
      a.fillStyle = [C.mint, C.mint2, C.mint3][k % 3]; a.save(); a.translate(Math.cos(ang) * r * .8, -120 + Math.sin(ang) * r); a.rotate(ang + Math.PI / 2); a.beginPath(); a.ellipse(0, 0, 13, 24, 0, 0, 7); a.fill(); a.restore(); }
  }, { clip: true, size: 6, origin: [110, 290], jitter: 20 }));
  // ---- Grandma Rose: body, head, arm with watering can ----
  L.gBody = painted(320, 640, a => {
    a.fillStyle = '#5a3d5c'; a.beginPath(); a.moveTo(-95, -300); a.lineTo(95, -300); a.lineTo(125, -30); a.lineTo(-125, -30); a.fill();   // skirt
    a.fillStyle = '#3a2a24'; a.beginPath(); a.ellipse(-45, -14, 42, 16, 0, 0, 7); a.ellipse(48, -14, 42, 16, 0, 0, 7); a.fill();
    a.fillStyle = '#7d9a6b'; a.beginPath(); a.moveTo(-82, -485); a.quadraticCurveTo(0, -510, 86, -480); a.lineTo(110, -280); a.lineTo(-108, -280); a.closePath(); a.fill(); // cardigan
    a.fillStyle = '#e8dcc0'; a.beginPath(); a.moveTo(-14, -490); a.lineTo(18, -490); a.lineTo(6, -300); a.lineTo(-6, -300); a.fill();       // blouse
    a.fillStyle = '#6b8a5b'; a.beginPath(); a.moveTo(-82, -480); a.quadraticCurveTo(-130, -420, -110, -300); a.lineTo(-80, -300); a.lineTo(-70, -440); a.fill(); // left arm (resting)
    a.fillStyle = C.skin; a.beginPath(); a.arc(-96, -292, 20, 0, 7); a.fill();
  }, { clip: true, size: 7, origin: [160, 620], angle: () => Math.PI / 2, spread: .5, jitter: 14,
       post: a => { a.fillStyle = '#c94a4a'; for (const y of [-450, -410, -370, -330]) { a.beginPath(); a.arc(0, y, 4, 0, 7); a.fill(); } } });
  L.gHead = painted(200, 240, a => {
    a.fillStyle = '#c9c4cf'; a.beginPath(); a.arc(-30, -150, 46, 0, 7); a.fill();        // grey bun
    a.fillStyle = '#d8d3dc'; a.beginPath(); a.ellipse(0, -96, 74, 60, 0, Math.PI, 0); a.fill();
    a.fillStyle = C.skin; a.beginPath(); a.ellipse(4, -70, 62, 72, 0, 0, 7); a.fill();
    a.fillStyle = C.skin2; a.beginPath(); a.ellipse(66, -60, 14, 18, 0, 0, 7); a.fill();   // nose (faces right)
    a.fillStyle = 'rgba(220,110,100,.55)'; a.beginPath(); a.arc(34, -40, 14, 0, 7); a.fill(); // cheek
  }, { clip: true, size: 5, origin: [100, 220], jitter: 10,
       post: a => { a.strokeStyle = C.ink; a.lineWidth = 3.5; a.lineCap = 'round';
         a.beginPath(); a.arc(38, -76, 11, Math.PI * .15, Math.PI * .85); a.stroke();            // closed, content eye
         a.beginPath(); a.arc(38, -78, 20, 0, 7); a.lineWidth = 2.5; a.stroke();                 // round glasses
         a.lineWidth = 3.5; a.beginPath(); a.arc(44, -30, 14, Math.PI * .1, Math.PI * .7); a.stroke(); // smile
         a.strokeStyle = '#9a8fa2'; a.lineWidth = 2; for (let k = 0; k < 6; k++) { a.beginPath(); a.moveTo(-50 + k * 14, -120); a.quadraticCurveTo(-30 + k * 14, -140, -10 + k * 12, -118); a.stroke(); } } });
  L.gArm = painted(300, 200, a => {                       // origin = shoulder; arm reaches right, holds the can
    a.fillStyle = '#7d9a6b'; a.beginPath(); a.moveTo(-10, -20); a.quadraticCurveTo(60, 40, 120, 70); a.lineTo(112, 96); a.quadraticCurveTo(40, 70, -16, 24); a.fill();
    a.fillStyle = C.skin; a.beginPath(); a.arc(128, 86, 18, 0, 7); a.fill();
    a.fillStyle = '#b8733f'; a.beginPath(); a.ellipse(150, 120, 46, 36, 0, 0, 7); a.fill();          // copper can
    a.fillStyle = '#d99a5a'; a.beginPath(); a.ellipse(140, 108, 18, 10, -.4, 0, 7); a.fill();
    a.strokeStyle = '#8a5a30'; a.lineWidth = 9; a.beginPath(); a.moveTo(185, 120); a.lineTo(250, 150); a.stroke();  // spout
    a.lineWidth = 6; a.beginPath(); a.arc(150, 84, 26, Math.PI, 0); a.stroke();                         // handle
  }, { clip: true, size: 5, origin: [30, 40], jitter: 14 });
  // ---- Maya: body + head (3/4 view, facing left toward Grandma) ----
  L.mBody = painted(320, 660, a => {
    a.fillStyle = '#2f3a5a'; a.beginPath(); a.moveTo(-70, -300); a.lineTo(70, -300); a.lineTo(62, -20); a.lineTo(10, -20); a.lineTo(0, -230); a.lineTo(-10, -20); a.lineTo(-62, -20); a.fill(); // jeans
    a.fillStyle = '#f2ede4'; a.beginPath(); a.ellipse(-38, -12, 36, 14, 0, 0, 7); a.ellipse(40, -12, 36, 14, 0, 0, 7); a.fill();
    a.fillStyle = '#3f7f8a'; a.beginPath(); a.moveTo(-88, -500); a.quadraticCurveTo(0, -525, 88, -500); a.lineTo(96, -290); a.lineTo(-96, -290); a.closePath(); a.fill();   // teal hoodie
    a.fillStyle = '#356d77'; a.beginPath(); a.moveTo(-88, -490); a.quadraticCurveTo(-140, -400, -60, -360); a.lineTo(-30, -390); a.quadraticCurveTo(-80, -420, -60, -480); a.fill(); // arm to mug
    a.fillStyle = '#f2ede4'; a.fillRect(-90, -400, 40, 46); a.fillStyle = C.skin; a.beginPath(); a.arc(-58, -372, 16, 0, 7); a.fill();   // mug + hand
  }, { clip: true, size: 7, origin: [160, 640], angle: () => Math.PI / 2, spread: .5, jitter: 14 });
  L.mHead = painted(240, 300, a => {
    a.fillStyle = '#3a2620'; a.beginPath(); a.ellipse(18, -92, 70, 80, 0, 0, 7); a.fill();                  // hair mass (back of head)
    a.beginPath(); a.moveTo(70, -110); a.quadraticCurveTo(120, -60, 96, 20); a.quadraticCurveTo(80, -20, 56, -60); a.fill();   // ponytail
    a.fillStyle = C.skin; a.beginPath(); a.ellipse(-10, -78, 54, 64, 0, 0, 7); a.fill();                     // face
    a.fillStyle = C.skin2; a.beginPath(); a.ellipse(-60, -72, 12, 15, 0, 0, 7); a.fill();                    // nose (faces left)
    a.fillStyle = C.skin; a.beginPath(); a.ellipse(30, -70, 12, 16, 0, 0, 7); a.fill();                      // ear
    a.fillStyle = '#3a2620'; a.beginPath(); a.moveTo(-58, -110); a.quadraticCurveTo(-20, -160, 50, -140); a.quadraticCurveTo(10, -120, -20, -104); a.quadraticCurveTo(-40, -100, -58, -110); a.fill(); // fringe swept back
    a.fillStyle = 'rgba(220,110,100,.45)'; a.beginPath(); a.arc(-28, -48, 12, 0, 7); a.fill();
  }, { clip: true, size: 4, origin: [120, 260], jitter: 10,
       post: a => { a.fillStyle = C.ink; a.beginPath(); a.ellipse(-34, -84, 5.5, 8.5, 0, 0, 7); a.fill();
         a.fillStyle = '#fff'; a.beginPath(); a.arc(-36, -87, 2, 0, 7); a.fill();
         a.strokeStyle = C.ink; a.lineWidth = 3; a.lineCap = 'round'; a.beginPath(); a.moveTo(-48, -102); a.quadraticCurveTo(-36, -108, -22, -104); a.stroke();
         a.beginPath(); a.arc(-40, -38, 10, Math.PI * .2, Math.PI * .8); a.stroke(); } });
  // glow sprite, canvas weave + vignette (static)
  L.glow = document.createElement('canvas'); L.glow.width = L.glow.height = 128;
  { const g = L.glow.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,236,170,1)'); r.addColorStop(.25, 'rgba(255,200,110,.6)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }
  L.tex = document.createElement('canvas'); L.tex.width = W; L.tex.height = H;
  { const g = L.tex.getContext('2d'), d = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, v = 128 + ((x % 4 < 2) ^ (y % 4 < 2) ? 10 : -10) + (hash(x * 7.1 + y * 3.3) - .5) * 40; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; }
    g.putImageData(d, 0, 0);
    const v = g.createRadialGradient(W / 2, H * .45, 420, W / 2, H / 2, 1150); v.addColorStop(0, 'rgba(40,15,30,0)'); v.addColorStop(1, 'rgba(40,15,30,.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
}

// ---------- per frame ----------
const SHOTS = [ // camera keys: [t, cx, cy, zoom]; eased between keys (flights 25-30 frames)
  [0, 960, 540, 1.0], [5.2, 900, 560, 1.07], [6.15, 1150, 520, 1.32], [10, 1180, 515, 1.38]];
function cam(t) { let i = 0; while (i < SHOTS.length - 2 && t > SHOTS[i + 1][0]) i++; const a = SHOTS[i], b = SHOTS[i + 1], k = ease(seg(t, a[0], b[0]));
  let z = lerp(a[3], b[3], k), cx = lerp(a[1], b[1], k), cy = lerp(a[2], b[2], k); const hw = W / 2 / z, hh = H / 2 / z;
  return [clamp(cx, hw, W - hw), clamp(cy, hh, H - hh), z]; }
function layer(img, c, p) { // parallax: p<1 moves less than the camera
  const z = 1 + (c[2] - 1) * p, cx = W / 2 + (c[0] - W / 2) * p, cy = H / 2 + (c[1] - H / 2) * p;
  ctx.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z); ctx.drawImage(img.c, 0, 0, img.w, img.h); }
function worldT(c) { ctx.setTransform(c[2], 0, 0, c[2], W / 2 - c[0] * c[2], H / 2 - c[1] * c[2]); }
const CAPS = [[0.3, 4.7, 'Grandma Rose waters her mint on the balcony.'], [5.0, 9.8, 'She hums a short tune. You’ve known it since childhood.']];
const GX = 560, GY = 1000, MX = 1490, MY = 1010;
function note(x, y, s, a) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#fff2c8';
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, -.4, 0, 7); ctx.fill(); ctx.fillRect(6, -34, 3.5, 34); ctx.beginPath(); ctx.moveTo(9, -34); ctx.quadraticCurveTo(22, -26, 16, -12); ctx.lineTo(9, -24); ctx.fill(); ctx.restore(); }
function page(x, y, r, s, a) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s);
  ctx.fillStyle = '#fff4d6'; ctx.fillRect(-14, -18, 28, 36); ctx.fillStyle = 'rgba(150,110,70,.6)'; for (let k = 0; k < 5; k++) ctx.fillRect(-9, -11 + k * 6, 18 - (k === 4 ? 8 : 0), 2); ctx.restore(); }
function render(t) {
  const c = cam(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  layer(L.sky, c, .25); layer(L.city, c, .45); layer(L.balcony, c, .85);
  worldT(c);
  // mint pots (sway), Grandma, Maya
  [[760, 905, 0], [905, 912, 1], [1050, 905, 2]].forEach(([x, y, i]) => spr(L.pots[i], x, y, Math.sin(t * 1.6 + i * 1.3) * .025, .9));
  const hum = Math.sin(t * 2.4) * .03, pour = .18 + Math.sin(t * 1.2) * .06;
  spr(L.gBody, GX, GY); spr(L.gArm, GX + 60, GY - 455, pour); spr(L.gHead, GX + 6, GY - 500, hum);
  // water from the spout (world position via the arm transform)
  const sx = GX + 60 + Math.cos(pour) * 220 - Math.sin(pour) * 110, sy = GY - 455 + Math.sin(pour) * 220 + Math.cos(pour) * 110;
  ctx.fillStyle = 'rgba(200,230,255,.85)';
  for (let k = 0; k < 26; k++) { const ph = ((t * 1.8 + k / 26) % 1), x = sx + ph * 70 + Math.sin(k) * 4, y = sy + ph * ph * 230; ctx.beginPath(); ctx.ellipse(x, y, 3, 6, 0, 0, 7); ctx.fill(); }
  spr(L.mBody, MX, MY); spr(L.mHead, MX + 4, MY - 515, Math.sin(t * 1.1) * .02 - .03);
  // humming -> notes drift from Grandma, turn into glowing pages that gather around Maya (memory motif)
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 18; k++) {
    const st = 0.8 + k * .42; if (t < st) continue; const q = (t - st) / 3.6; if (q > 1.6) continue;
    const p = ease(Math.min(q, 1)), x0 = GX + 80, y0 = GY - 520, x1 = MX - 60 + Math.cos(k * 2.1 + t) * (90 + k % 3 * 30), y1 = MY - 560 + Math.sin(k * 1.7 + t * .8) * 110;
    const x = lerp(x0, x1, p) + Math.sin(q * 6 + k) * 30, y = lerp(y0, y1, p) - Math.sin(p * Math.PI) * 220;
    ctx.globalAlpha = .55; ctx.drawImage(L.glow, x - 50, y - 50, 100, 100); ctx.globalAlpha = 1;
    if (p < .5) { ctx.globalCompositeOperation = 'source-over'; note(x, y, 1, 1 - p * 2); ctx.globalCompositeOperation = 'lighter'; }
    ctx.globalCompositeOperation = 'source-over'; page(x, y, Math.sin(t * 2 + k) * .5, .9, clamp(p * 2 - .6, 0, 1)); ctx.globalCompositeOperation = 'lighter';
  }
  // dust motes in the light
  for (let k = 0; k < 40; k++) { const x = (hash(k) * W + t * 12 * (1 + hash(k + 3))) % W, y = 200 + hash(k * 2) * 700 + Math.sin(t + k) * 12; ctx.globalAlpha = .35; ctx.drawImage(L.glow, x - 6, y - 6, 12, 12); }
  ctx.globalAlpha = 1;
  // golden light from the sun (screen space), soft god-rays
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sunX = W / 2 + (1170 - W / 2 - (c[0] - W / 2) * .25) * (1 + (c[2] - 1) * .25), sunY = H / 2 + (640 - H / 2 - (c[1] - H / 2) * .25) * (1 + (c[2] - 1) * .25);
  const g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 1100); g.addColorStop(0, 'rgba(255,190,110,.32)'); g.addColorStop(1, 'rgba(255,150,90,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .06; ctx.fillStyle = '#ffd9a0';
  for (let k = 0; k < 6; k++) { const a = Math.PI + .25 + k * .14 + Math.sin(t * .3 + k) * .02; ctx.beginPath(); ctx.moveTo(sunX, sunY); ctx.lineTo(sunX + Math.cos(a) * 2600, sunY + Math.sin(a) * 2600); ctx.lineTo(sunX + Math.cos(a + .05) * 2600, sunY + Math.sin(a + .05) * 2600); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.drawImage(L.tex, 0, 0);
  // subtitle (cinematic, no box)
  for (const [a, b, s] of CAPS) if (t >= a && t < b) { const al = Math.min(seg(t, a, a + .25), 1 - seg(t, b - .25, b));
    ctx.globalAlpha = al; ctx.font = '600 46px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(30,12,24,.75)'; ctx.lineJoin = 'round'; ctx.strokeText(s, W / 2, H - 70); ctx.fillStyle = '#fff6e6'; ctx.fillText(s, W / 2, H - 70); ctx.globalAlpha = 1; }
}
window.render = render; window.DUR = 10;
document.fonts.load('600 46px Fredoka').then(() => { build(); render(0); window.READY = true; });
