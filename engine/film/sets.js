// Reusable sets. Each set paints its layers once (lazily) and declares its light.
// layers: drawn behind the cast with parallax p; front: drawn over the cast (p = 1, world space).
const SETS = {};
const SET_DEF = {};
function setGet(id) { if (!SETS[id]) SETS[id] = SET_DEF[id](); return SETS[id]; }
const skyOpt = { size: 26, angle: () => 0, spread: .25, jitter: 14 }, wallOpt = { size: 12, angle: (x, y) => y > 900 ? .15 : Math.PI / 2, spread: .5, jitter: 16 };
function grad(a, y0, y1, stops) { const g = a.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
function sun(a, x, y, r, c0, c1) { const s = a.createRadialGradient(x, y, 10, x, y, r); s.addColorStop(0, c0); s.addColorStop(1, c1); a.fillStyle = s; a.fillRect(0, 0, W, H); }
function cityRow(a, base, c1, c2, win, sd, dens = .62, clip) { seed = sd; let x = -20; if (clip) { a.save(); a.beginPath(); a.rect(...clip); a.clip(); }
  while (x < W + 40) { const w = 60 + rnd() * 110, h = 70 + rnd() * 170, y0 = base - h; a.fillStyle = rnd() > .5 ? c1 : c2; a.fillRect(x, y0, w, h + 400);
    if (rnd() > .78) { a.beginPath(); a.arc(x + w / 2, y0, w * .36, Math.PI, 0); a.fill(); }
    a.fillStyle = win; for (let wy = y0 + 18; wy < base - 10; wy += 26) for (let wx = x + 10; wx < x + w - 12; wx += 20) if (rnd() > dens) a.fillRect(wx, wy, 7, 10);
    x += w + rnd() * 8; } if (clip) a.restore(); }
function tiles(a, y, c1, c2) { a.fillStyle = c1; a.fillRect(0, y, W, H - y); a.strokeStyle = c2; a.lineWidth = 4;
  for (let i = -10; i < 30; i++) { a.beginPath(); a.moveTo(i * 120, y); a.lineTo(i * 120 - 220, H); a.stroke(); }
  for (const yy of [y + 40, y + 100]) { a.beginPath(); a.moveTo(0, yy); a.lineTo(W, yy); a.stroke(); } }
function boards(a, y, c1, c2) { a.fillStyle = c1; a.fillRect(0, y, W, H - y); a.strokeStyle = c2; a.lineWidth = 3;
  for (let yy = y + 30; yy < H; yy += 38) { a.beginPath(); a.moveTo(0, yy); a.lineTo(W, yy); a.stroke(); } }
function shelf(a, x, y, w, h, cols, sd) { seed = sd; a.fillStyle = '#5a3a2a'; a.fillRect(x - 10, y - 10, w + 20, h + 20);
  for (let r = 0; r < Math.floor(h / 90); r++) { let bx = x; const by = y + r * 90; a.fillStyle = '#3a241a'; a.fillRect(x, by, w, 86);
    while (bx < x + w - 14) { const bw = 12 + rnd() * 16, bh = 50 + rnd() * 30; a.fillStyle = cols[(rnd() * cols.length) | 0]; a.fillRect(bx, by + 86 - bh, bw, bh); bx += bw + 2; } } }
function silhouettes(a, y, n, col, sd, sz = 1) { seed = sd; for (let i = 0; i < n; i++) { const x = i / n * W + rnd() * 40, s = (.8 + rnd() * .4) * sz;
  a.fillStyle = col; a.beginPath(); a.arc(x, y - 70 * s, 34 * s, 0, 7); a.fill(); a.beginPath(); a.ellipse(x, y + 10 * s, 64 * s, 70 * s, 0, Math.PI, 0); a.fill(); a.fillRect(x - 64 * s, y + 10 * s, 128 * s, 200); } }

// ---------- 1. lecture hall (golden morning) ----------
SET_DEF.lecture = () => ({
  layers: [{ img: painted('lec-back', W, H, a => {
    a.fillStyle = '#c98a5a'; a.fillRect(0, 0, W, H); a.fillStyle = '#b5784c'; for (let x = 0; x < W; x += 160) a.fillRect(x, 0, 12, 760);
    for (const x of [1180, 1480, 1780]) { a.fillStyle = '#7a4a3a'; a.fillRect(x - 10, 80, 200, 520); a.fillStyle = grad(a, 90, 590, ['#ffe7b0', '#ffc37a']); a.fillRect(x, 90, 180, 500);
      a.fillStyle = '#7a4a3a'; a.fillRect(x + 86, 90, 8, 500); a.fillRect(x, 330, 180, 8); }
    a.fillStyle = '#5a3a28'; a.fillRect(150, 170, 820, 440); a.fillStyle = '#2f4a3c'; a.fillRect(170, 190, 780, 400);
    a.strokeStyle = 'rgba(240,240,220,.75)'; a.lineWidth = 4; seed = 3; for (let r = 0; r < 7; r++) { a.beginPath(); let x = 210; a.moveTo(x, 240 + r * 48); while (x < 880 - rnd() * 200) { x += 20; a.lineTo(x, 240 + r * 48 + (rnd() - .5) * 8); } a.stroke(); }
    a.beginPath(); a.arc(800, 300, 50, 0, 7); a.stroke();
    boards(a, 760, '#9a5a36', '#7a4428'); a.fillStyle = '#b06a40'; a.fillRect(0, 740, W, 24);
  }, wallOpt), p: .8 }],
  front: painted('lec-desk', W, H, a => { a.fillStyle = '#8a5232'; a.fillRect(980, 820, 940, 30); a.fillStyle = '#6e3e24'; a.fillRect(1000, 850, 900, 230);
    a.fillStyle = '#7a4628'; for (let x = 1060; x < 1900; x += 220) a.fillRect(x, 870, 150, 180);
    a.fillStyle = '#fff4d6'; a.save(); a.translate(1260, 812); a.rotate(-.05); a.fillRect(-60, -6, 120, 10); a.restore(); a.save(); a.translate(1620, 812); a.rotate(.04); a.fillRect(-60, -6, 120, 10); a.restore();
  }, { size: 10, angle: () => 0, spread: .4, jitter: 14 }),
  light: { x: 1500, y: 300, col: '255,200,130', a: .3, rays: true }, grade: null });

// ---------- 2. front door (dusk corridor) ----------
SET_DEF.door = () => ({
  layers: [{ img: painted('door', W, H, a => {
    a.fillStyle = '#a8806a'; a.fillRect(0, 0, W, H); a.fillStyle = '#8f6a58'; a.fillRect(0, 700, W, 220);
    a.fillStyle = '#5a6a8a'; a.fillRect(160, 200, 300, 380); a.fillStyle = grad(a, 210, 570, ['#3a3f78', '#b4708a', '#f09a6a']); a.fillRect(176, 216, 268, 348); a.fillStyle = '#5a6a8a'; a.fillRect(304, 216, 10, 348);
    a.fillStyle = '#4a3428'; a.fillRect(820, 150, 420, 790); a.fillStyle = '#2f6a5a'; a.fillRect(850, 180, 360, 760);
    a.fillStyle = '#285a4c'; a.fillRect(890, 230, 280, 260); a.fillRect(890, 540, 280, 330); a.fillStyle = '#e8c060'; a.beginPath(); a.arc(1160, 580, 18, 0, 7); a.fill();
    a.fillStyle = '#d0a040'; a.fillRect(1010, 330, 40, 26);
    a.fillStyle = '#3a2a24'; a.fillRect(1430, 250, 6, 120); a.fillStyle = '#ffd98a'; a.beginPath(); a.ellipse(1433, 400, 46, 40, 0, Math.PI, 0); a.fill(); a.fillRect(1395, 398, 76, 12);
    tiles(a, 930, '#7a5040', '#62402f'); a.fillStyle = '#8a3a3a'; a.fillRect(860, 940, 340, 40);
  }, wallOpt), p: .85 }],
  light: { x: 1433, y: 400, col: '255,205,140', a: .3, rays: false }, grade: 'rgba(60,40,110,.12)' });

// ---------- 3. mind library (inner space, indigo + gold) ----------
SET_DEF.mind = () => ({
  layers: [{ img: painted('mind-sky', W, H, a => { a.fillStyle = grad(a, 0, H, ['#120c2c', '#2a1f55', '#4a2f6a', '#2a1a3a']); a.fillRect(0, 0, W, H);
      sun(a, 960, 520, 700, 'rgba(255,200,130,.45)', 'rgba(120,80,160,0)'); }, skyOpt), p: .2 },
    { img: painted('mind-shelves', W, H, a => { const cols = ['#7a3a4a', '#3a5a7a', '#8a6a3a', '#4a6a4a', '#6a4a7a', '#9a5a3a'];
      for (const [x, y, w, h, s] of [[40, 160, 380, 720, 1], [1500, 160, 380, 720, 2], [470, 260, 240, 560, 3], [1210, 260, 240, 560, 4]]) shelf(a, x, y, w, h, cols, s);
      a.fillStyle = 'rgba(40,20,60,.45)'; a.fillRect(470, 250, 240, 580); a.fillRect(1210, 250, 240, 580);
      a.fillStyle = '#2a1a3a'; a.fillRect(0, 900, W, 180); a.fillStyle = 'rgba(255,200,130,.25)'; a.beginPath(); a.ellipse(960, 960, 600, 60, 0, 0, 7); a.fill(); }, wallOpt), p: .6 }],
  light: { x: 960, y: 480, col: '255,200,130', a: .22, rays: false }, grade: null, mind: true });

// ---------- 4/5. bedroom (day / night) ----------
function bedroom(night) { return () => ({
  layers: [{ img: painted(night ? 'bed-n' : 'bed-d', W, H, a => {
    a.fillStyle = night ? '#3a3560' : '#e2b48a'; a.fillRect(0, 0, W, H); a.fillStyle = night ? '#322d55' : '#d4a27a'; a.fillRect(0, 720, W, 200);
    a.fillStyle = night ? '#2a2440' : '#8a5a40'; a.fillRect(1200, 160, 460, 440);
    a.fillStyle = night ? grad(a, 180, 580, ['#141a40', '#2a3a70']) : grad(a, 180, 580, ['#9ad0f0', '#ffe6b0']); a.fillRect(1220, 180, 420, 400);
    if (night) { a.fillStyle = '#fff6d8'; a.beginPath(); a.arc(1540, 270, 44, 0, 7); a.fill(); a.fillStyle = '#2a3a70'; a.beginPath(); a.arc(1520, 258, 40, 0, 7); a.fill(); a.fillStyle = '#ffffff';
      for (let i = 0; i < 14; i++) a.fillRect(1230 + hash(i) * 400, 190 + hash(i + 9) * 380, 3, 3); }
    else { cityRow(a, 580, '#c99a9a', '#b08aa0', '#fff0c0', 21, .9, [1220, 180, 420, 400]); }
    a.fillStyle = night ? '#2a2440' : '#8a5a40'; a.fillRect(1426, 180, 10, 400); a.fillRect(1220, 376, 420, 10);
    shelf(a, 120, 200, 360, 540, night ? ['#4a3a6a', '#3a4a6a', '#5a3a5a'] : ['#b04a4a', '#4a7aa0', '#d0a040', '#5a9a6a'], 31);
    a.fillStyle = night ? '#4a3a5a' : '#a0623e'; a.fillRect(560, 700, 520, 26); a.fillRect(590, 726, 22, 200); a.fillRect(1030, 726, 22, 200);
    a.fillStyle = night ? '#5a4a6a' : '#d08a5a'; a.fillRect(940, 600, 30, 100); a.beginPath(); a.moveTo(900, 600); a.lineTo(1010, 600); a.lineTo(980, 540); a.lineTo(930, 540); a.fill();
    seed = 41; for (let i = 0; i < 4; i++) { a.fillStyle = ['#7a3a4a', '#3a5a7a', '#8a6a3a', '#4a6a4a'][i]; a.fillRect(640 + i * 6, 676 - i * 22, 150, 22); }
    a.fillStyle = night ? '#4a4070' : '#b07ab0'; a.fillRect(1250, 760, 640, 170); a.fillStyle = night ? '#6a5a90' : '#e6c4e0'; a.fillRect(1260, 720, 220, 60);
    boards(a, 920, night ? '#3a2e4a' : '#a46a44', night ? '#2a2038' : '#8a5634');
  }, wallOpt), p: .85 }],
  light: night ? { x: 955, y: 570, col: '255,200,120', a: .35, rays: false } : { x: 1430, y: 380, col: '255,215,150', a: .3, rays: true },
  grade: night ? 'rgba(20,20,70,.22)' : null, night }); }
SET_DEF.bedroom = bedroom(false); SET_DEF.bedroomNight = bedroom(true);

// ---------- 6. pizza place ----------
SET_DEF.cafe = () => ({
  layers: [{ img: painted('cafe', W, H, a => {
    a.fillStyle = '#a24e3a'; a.fillRect(0, 0, W, H); a.strokeStyle = '#8a3e2c'; a.lineWidth = 4; for (let y = 20; y < 760; y += 40) { a.beginPath(); a.moveTo(0, y); a.lineTo(W, y); a.stroke(); for (let x = (y / 40 % 2) * 60; x < W; x += 120) { a.beginPath(); a.moveTo(x, y); a.lineTo(x, y + 40); a.stroke(); } }
    a.fillStyle = '#4a2a20'; a.fillRect(160, 160, 640, 420); a.fillStyle = grad(a, 170, 570, ['#f0905a', '#ffd08a']); a.fillRect(176, 176, 608, 388);
    cityRow(a, 570, '#7a5070', '#5a4060', '#ffd07a', 61, .7, [176, 176, 608, 388]);
    a.fillStyle = '#2e5a3a'; a.fillRect(1100, 160, 560, 120); 
    for (const x of [400, 960, 1520]) { a.fillStyle = '#2a1a14'; a.fillRect(x - 2, 0, 4, 120); a.fillStyle = '#e8b04a'; a.beginPath(); a.ellipse(x, 140, 60, 36, 0, Math.PI, 0); a.fill(); }
    tiles(a, 900, '#d8c8a8', '#b8a080'); a.fillStyle = '#c8b090'; for (let i = 0; i < 16; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) a.fillRect(i * 120, 900 + j * 60, 120, 60);
  }, Object.assign({ post: a => { a.fillStyle = '#fff2d8'; a.font = '700 70px Fredoka'; a.textAlign = 'center'; a.fillText('PIZZA', 1380, 248); } }, wallOpt)), p: .85 }],
  front: painted('cafe-table', W, H, a => { a.fillStyle = '#e8e0d0'; a.fillRect(600, 780, 760, 26); a.fillStyle = '#c0392b'; for (let x = 600; x < 1360; x += 40) a.fillRect(x, 780, 20, 26);
    a.fillStyle = '#5a3a28'; a.fillRect(640, 806, 26, 274); a.fillRect(1300, 806, 26, 274);
    for (const [x, y] of [[760, 760], [900, 744], [1040, 760], [1180, 744]]) { a.fillStyle = '#e8b04a'; a.beginPath(); a.ellipse(x, y, 66, 18, 0, 0, 7); a.fill(); a.fillStyle = '#c0392b'; for (let i = 0; i < 5; i++) { a.beginPath(); a.arc(x - 40 + i * 20, y - 2 + (i % 2) * 4, 7, 0, 7); a.fill(); } } }, { size: 8, angle: () => 0, spread: .4, jitter: 14 }),
  light: { x: 480, y: 360, col: '255,190,120', a: .3, rays: true }, grade: null });

// ---------- 7. neuroscience lab (cool teal) ----------
SET_DEF.lab = () => ({
  layers: [{ img: painted('lab', W, H, a => {
    a.fillStyle = '#4a7a82'; a.fillRect(0, 0, W, H); a.fillStyle = '#3e6a72'; a.fillRect(0, 740, W, 180);
    for (const [x, y] of [[180, 200], [620, 200]]) { a.fillStyle = '#1e2a34'; a.fillRect(x, y, 380, 260); a.fillStyle = '#123a4a'; a.fillRect(x + 14, y + 14, 352, 232);
      a.fillStyle = '#ffb07a'; a.beginPath(); a.ellipse(x + 190, y + 130, 110, 80, 0, 0, 7); a.fill(); a.strokeStyle = '#ff7a5a'; a.lineWidth = 5; for (let k = 0; k < 6; k++) { a.beginPath(); a.arc(x + 160 + k * 14, y + 110 + (k % 2) * 30, 24, 0, 3); a.stroke(); } }
    shelf(a, 1300, 160, 460, 360, ['#d8e4e8', '#a0c0c8', '#e8a87a', '#7aa0b0'], 71);
    a.fillStyle = '#d8e0e0'; a.fillRect(120, 640, 900, 30); a.fillStyle = '#b8c4c4'; a.fillRect(140, 670, 860, 250);
    for (let i = 0; i < 4; i++) { a.fillStyle = ['#e85a5a', '#5ab0e8', '#e8d05a', '#7ae8a0'][i]; a.beginPath(); a.moveTo(220 + i * 70, 640); a.lineTo(250 + i * 70, 640); a.lineTo(262 + i * 70, 590); a.lineTo(208 + i * 70, 590); a.fill(); }
    tiles(a, 920, '#b8c8c8', '#98a8a8');
  }, Object.assign({}, wallOpt)), p: .85 }],
  light: { x: 1500, y: 160, col: '200,235,255', a: .25, rays: true }, grade: 'rgba(30,80,110,.10)' });

// ---------- 8. balcony (the approved look) ----------
SET_DEF.balcony = () => {
  const C = { sky0: '#4b3f7a', sky1: '#b5608a', sky2: '#f08a56', sky3: '#ffd08a', city: '#5b4876', city2: '#463963', win: '#ffcf7a', wall: '#e2a873', wall2: '#c98656', floor: '#b8603e', floor2: '#9a4c31', iron: '#2e2233', pot: '#c06a3e', pot2: '#9a4f2c', mint: '#5f9a4a', mint2: '#3f7a3a', mint3: '#8cc46a' };
  const s = { layers: [
    { img: painted('bal-sky', W, H, a => { a.fillStyle = grad(a, 0, 720, [C.sky0, C.sky1, C.sky2, C.sky3]); a.fillRect(0, 0, W, H); sun(a, 1170, 640, 420, 'rgba(255,240,190,1)', 'rgba(255,180,110,0)');
      a.fillStyle = 'rgba(255,190,170,.55)'; for (const [x, y, w] of [[200, 230, 520], [820, 160, 640], [1250, 330, 560], [380, 420, 420], [1500, 220, 380]]) { a.beginPath(); a.ellipse(x + w / 2, y, w / 2, 20, 0, 0, 7); a.fill(); } }, skyOpt), p: .25 },
    { img: painted('bal-city', W, H, a => { cityRow(a, 690, C.city, C.city2, C.win, 11); a.fillStyle = 'rgba(255,190,140,.35)'; a.fillRect(0, 600, W, 120); }, { size: 9, angle: () => Math.PI / 2, spread: .3, jitter: 16 }), p: .45 },
    { img: painted('bal-set', W, H, a => {
      a.fillStyle = C.wall; a.fillRect(0, 0, 420, H); a.fillStyle = C.wall2; a.fillRect(380, 0, 40, H);
      a.fillStyle = '#7a4a3a'; a.fillRect(70, 260, 260, 640); a.fillStyle = '#ffd59a'; a.fillRect(92, 282, 216, 618);
      a.fillStyle = '#e88a6a'; a.beginPath(); a.moveTo(92, 282); a.quadraticCurveTo(160, 560, 120, 900); a.lineTo(92, 900); a.fill();
      tiles(a, 900, C.floor, C.floor2);
      a.fillStyle = '#d99a6a'; a.fillRect(420, 860, W, 44); a.fillStyle = '#b0744a'; a.fillRect(420, 896, W, 10);
      a.fillStyle = C.iron; a.fillRect(420, 650, W, 14); a.fillRect(420, 846, W, 10);
      for (let x = 440; x < W; x += 46) { a.fillRect(x, 650, 7, 200); a.beginPath(); a.arc(x + 23, 760, 16, 0, 7); a.lineWidth = 5; a.strokeStyle = C.iron; a.stroke(); }
      a.fillStyle = C.iron; a.fillRect(445, 120, 4, 160); a.fillStyle = '#ffe2a0'; a.beginPath(); a.arc(447, 300, 26, 0, 7); a.fill(); }, wallOpt), p: .85 }],
    pots: [0, 1, 2].map(i => painted('pot' + i, 220, 300, a => { a.fillStyle = C.pot; a.beginPath(); a.moveTo(-70, -110); a.lineTo(70, -110); a.lineTo(52, 0); a.lineTo(-52, 0); a.fill();
      a.fillStyle = C.pot2; a.fillRect(-78, -128, 156, 26); seed = 50 + i * 9;
      for (let k = 0; k < 46; k++) { const ang = -Math.PI / 2 + (rnd() - .5) * 2.2, r = 30 + rnd() * 120; a.fillStyle = [C.mint, C.mint2, C.mint3][k % 3]; a.save(); a.translate(Math.cos(ang) * r * .8, -120 + Math.sin(ang) * r); a.rotate(ang + Math.PI / 2); a.beginPath(); a.ellipse(0, 0, 13, 24, 0, 0, 7); a.fill(); a.restore(); }
    }, { clip: true, size: 6, origin: [110, 290], jitter: 20 })),
    light: { x: 1170, y: 640, col: '255,190,110', a: .32, rays: true, sunPar: .25 }, grade: null };
  return s; };

// ---------- 9. championship stage ----------
SET_DEF.stage = () => ({
  layers: [{ img: painted('stage', W, H, a => {
    a.fillStyle = '#1e1428'; a.fillRect(0, 0, W, H);
    a.fillStyle = '#7a1e2a'; for (const [x, w] of [[0, 360], [1560, 360]]) { a.fillRect(x, 0, w, 900); }
    a.fillStyle = '#5a1420'; for (let x = 20; x < 360; x += 70) { a.fillRect(x, 0, 18, 900); a.fillRect(1580 + x - 20, 0, 18, 900); }
    a.fillStyle = '#8a2a34'; a.fillRect(0, 0, W, 110); a.fillStyle = '#e8c060'; a.fillRect(0, 106, W, 8);
    a.fillStyle = '#2a2040'; a.fillRect(560, 170, 800, 120); 
    a.fillStyle = '#6a4030'; a.fillRect(0, 880, W, 200); a.fillStyle = '#8a5a40'; a.fillRect(0, 870, W, 20);
    a.fillStyle = '#3a2a30'; a.fillRect(1200, 640, 160, 240); a.fillStyle = '#5a3a40'; a.fillRect(1180, 620, 200, 30);
  }, Object.assign({ post: a => { a.fillStyle = '#ffe6a0'; a.font = '700 54px Fredoka'; a.textAlign = 'center'; a.fillText('NATIONAL MEMORY CHAMPIONSHIP', 960, 250); } }, wallOpt)), p: .85 }],
  front: painted('audience', W, H, a => silhouettes(a, 1020, 14, '#120a18', 81, 1.15), { size: 10, angle: () => Math.PI / 2, spread: .4, jitter: 8 }),
  light: { x: 960, y: -100, col: '255,240,200', a: .2, rays: false, spot: [960, 900] }, grade: 'rgba(30,10,40,.25)' });

// ---------- 10. hospital room (soft evening) ----------
SET_DEF.hospital = () => ({
  layers: [{ img: painted('hosp', W, H, a => {
    a.fillStyle = '#9ab8b0'; a.fillRect(0, 0, W, H); a.fillStyle = '#88a8a0'; a.fillRect(0, 720, W, 200);
    a.fillStyle = '#6a807a'; a.fillRect(1260, 160, 480, 420); a.fillStyle = grad(a, 170, 570, ['#6a5a9a', '#e88a6a', '#ffcf8a']); a.fillRect(1276, 176, 448, 388);
    cityRow(a, 570, '#7a5a7a', '#6a4a6a', '#ffd07a', 91, .75, [1276, 176, 448, 388]); a.fillStyle = '#6a807a'; a.fillRect(1494, 176, 12, 388);
    a.fillStyle = '#c8d8e8'; for (let x = 80; x < 400; x += 40) { a.beginPath(); a.moveTo(x, 80); a.quadraticCurveTo(x + 20, 500, x, 900); a.lineTo(x + 40, 900); a.quadraticCurveTo(x + 50, 500, x + 40, 80); a.fill(); }
    a.fillStyle = '#c0c8c8'; a.fillRect(560, 220, 8, 640); a.fillStyle = 'rgba(220,240,255,.8)'; a.beginPath(); a.roundRect(530, 230, 70, 100, 12); a.fill();
    a.fillStyle = '#2a343a'; a.fillRect(1080, 300, 150, 110); a.fillStyle = '#1a3a2a'; a.fillRect(1090, 310, 130, 90);
    tiles(a, 920, '#c8d0c8', '#a8b0a8');
  }, wallOpt), p: .85 }],
  front: painted('hosp-bed', W, H, a => {
    a.fillStyle = '#d8dce0'; a.fillRect(560, 640, 30, 300); a.fillRect(1340, 700, 24, 240);
    a.fillStyle = '#f2f0ea'; a.beginPath(); a.roundRect(590, 690, 760, 90, 30); a.fill();
    a.fillStyle = '#b8bcc4'; a.fillRect(600, 790, 760, 30); a.fillRect(620, 820, 14, 140); a.fillRect(1320, 820, 14, 140);
  }, { size: 9, angle: () => 0, spread: .4, jitter: 12 }),
  blanket: painted('hosp-blanket', W, H, a => { a.fillStyle = '#8aa0c8'; a.beginPath(); a.moveTo(800, 640); a.quadraticCurveTo(1060, 580, 1360, 640); a.lineTo(1360, 800); a.lineTo(790, 800); a.fill();
    a.fillStyle = '#a8b8d8'; a.fillRect(790, 632, 46, 168); }, { size: 9, angle: () => 0, spread: .4, jitter: 12 }),
  pillow: true, light: { x: 1500, y: 360, col: '255,200,140', a: .3, rays: true }, grade: null });

// ---------- 11. city street at dusk (scrolls for walk / run) ----------
SET_DEF.street = () => ({
  layers: [{ img: painted('st-sky', W, H, a => { a.fillStyle = grad(a, 0, 700, ['#3a3070', '#a05a8a', '#f09060']); a.fillRect(0, 0, W, H); }, skyOpt), p: .2 },
    { img: painted('st-far', W, H, a => { cityRow(a, 640, '#5b4876', '#463963', '#ffcf7a', 101); }, { size: 9, angle: () => Math.PI / 2, spread: .3, jitter: 16 }), p: .4, scroll: .25 },
    { img: painted('st-near', W, H, a => { seed = 111; let x = 0;
      while (x < W) { const w = 300 + rnd() * 200; a.fillStyle = ['#a0604a', '#8a5a6a', '#b07a50', '#7a5a7a'][(rnd() * 4) | 0]; a.fillRect(x, 120, w - 10, 760);
        a.fillStyle = '#ffd68a'; for (let wy = 200; wy < 700; wy += 120) for (let wx = x + 30; wx < x + w - 70; wx += 90) a.fillRect(wx, wy, 50, 70);
        a.fillStyle = '#3a2a30'; a.fillRect(x + w / 2 - 40, 740, 80, 140); x += w; }
      for (let lx = 200; lx < W; lx += 640) { a.fillStyle = '#2a2230'; a.fillRect(lx, 420, 10, 480); a.fillStyle = '#ffe2a0'; a.beginPath(); a.arc(lx + 5, 420, 22, 0, 7); a.fill(); }
      a.fillStyle = '#7a6a70'; a.fillRect(0, 880, W, 80); a.fillStyle = '#4a4050'; a.fillRect(0, 960, W, 120);
      a.fillStyle = '#e8d8a0'; for (let x2 = 0; x2 < W; x2 += 160) a.fillRect(x2, 1010, 80, 8); }, wallOpt), p: .85, scroll: 1 }],
  light: { x: 300, y: 300, col: '255,180,120', a: .28, rays: false }, grade: 'rgba(60,30,90,.12)' });
