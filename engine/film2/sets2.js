// POV film, part 2: first-person sets (frontal, painted once in refined gouache). World size 2400x1500 unless noted.
const SW = 2400, SH = 1500, SETS2 = {};
function set2(id) { return SETS2[id] || (SETS2[id] = SETDEF2[id]()); }
const opt = (o = {}) => Object.assign({ size: 11, angle: (x, y) => .05 }, o);
function floorPersp(a, y0, vx, c0, c1, line, w = SW, h = SH) { a.fillStyle = lin(a, 0, y0, 0, h, [[0, c0], [1, c1]]); a.fillRect(0, y0, w, h - y0); a.strokeStyle = line; a.lineWidth = 4;
  for (let i = -16; i <= 16; i++) { const xb = vx + i * 260; a.beginPath(); a.moveTo(vx + (xb - vx) * .35, y0); a.lineTo(xb, h); a.stroke(); } }
function windowAt(a, x, y, w, h, sky, frame = '#6e4e44') { a.fillStyle = frame; a.fillRect(x - 20, y - 20, w + 40, h + 40); a.fillStyle = lin(a, 0, y, 0, y + h, sky); a.fillRect(x, y, w, h);
  a.fillStyle = frame; a.fillRect(x + w / 2 - 6, y, 12, h); a.fillRect(x, y + h * .45, w, 12); }
function shelfRow(a, x, y, w, rows, cols) { a.fillStyle = '#5a3a2a'; a.fillRect(x - 12, y - 12, w + 24, rows * 96 + 24);
  for (let r = 0; r < rows; r++) { let bx = x; a.fillStyle = '#3a241a'; a.fillRect(x, y + r * 96, w, 90); while (bx < x + w - 16) { const bw = 14 + hash(bx + r) * 18, bh = 52 + hash(bx * 3 + r) * 32; a.fillStyle = cols[(hash(bx * 7 + r) * cols.length) | 0]; a.fillRect(bx, y + r * 96 + 90 - bh, bw, bh); bx += bw + 3; } } }
const BOOKC = ['#8a3a3a', '#3a5a8a', '#8a6a2a', '#3a7a5a', '#6a3a7a', '#b0603a'];
const SETDEF2 = {
  classroom: () => ({ img: gouache('s-class', SW, SH, a => {
      a.fillStyle = lin(a, 0, 0, 0, 1050, [[0, '#b98a62'], [1, '#d6a878']]); a.fillRect(0, 0, SW, 1050);
      a.fillStyle = rad(a, 300, 500, 40, 1100, [[0, 'rgba(255,225,160,.6)'], [1, 'rgba(255,225,160,0)']]); a.fillRect(0, 0, SW, 1050);
      windowAt(a, 60, 220, 420, 620, [[0, '#9ad0f0'], [1, '#ffe6b0']], '#7a5038'); a.fillStyle = '#5a9a5a'; a.beginPath(); a.ellipse(200, 760, 140, 80, 0, 0, 7); a.fill();
      a.fillStyle = '#5a3a28'; a.fillRect(700, 200, 1180, 560); a.fillStyle = '#2f4a3c'; a.fillRect(722, 222, 1136, 516);
      a.strokeStyle = 'rgba(240,240,220,.7)'; a.lineWidth = 5; for (let r = 0; r < 7; r++) { a.beginPath(); let x = 780; a.moveTo(x, 280 + r * 62); while (x < 1500 - hash(r) * 300) { x += 26; a.lineTo(x, 280 + r * 62 + (hash(x) - .5) * 8); } a.stroke(); }
      a.beginPath(); a.arc(1680, 360, 70, 0, 7); a.stroke(); a.beginPath(); a.moveTo(1600, 520); a.lineTo(1780, 520); a.lineTo(1690, 400); a.closePath(); a.stroke();
      a.fillStyle = '#e8e0d0'; a.fillRect(700, 760, 1180, 16);
      a.fillStyle = '#ffffff'; a.beginPath(); a.arc(2100, 300, 70, 0, 7); a.fill(); a.strokeStyle = '#3a2a24'; a.lineWidth = 6; a.stroke(); a.beginPath(); a.moveTo(2100, 300); a.lineTo(2100, 250); a.moveTo(2100, 300); a.lineTo(2140, 310); a.stroke();
      floorPersp(a, 1050, 1200, '#8a5232', '#a8683e', 'rgba(60,30,20,.35)');
      a.fillStyle = '#7a4a2c'; a.fillRect(900, 980, 800, 40); a.fillStyle = '#6a3e24'; a.fillRect(920, 1020, 760, 200);
    }, opt({ blurCopy: 8 })),
    front: gouache('s-class-desk', SW, SH, a => { a.fillStyle = '#9a6038'; a.beginPath(); a.moveTo(-100, 1240); a.lineTo(SW + 100, 1240); a.lineTo(SW + 100, SH); a.lineTo(-100, SH); a.fill(); a.fillStyle = '#b07040'; a.fillRect(-100, 1230, SW + 200, 22);
      a.fillStyle = '#fbf6ea'; a.save(); a.translate(1200, 1350); a.rotate(-.03); a.fillRect(-300, -90, 290, 200); a.fillRect(10, -90, 290, 200); a.fillStyle = 'rgba(80,90,150,.45)'; for (let i = 0; i < 6; i++) { a.fillRect(-270, -60 + i * 28, 240, 4); a.fillRect(40, -60 + i * 28, 220 - (i === 5 ? 90 : 0), 4); } a.restore(); }, opt({ size: 9 })) }),
  street: () => ({ w: 4800, img: gouache('s-street', 4800, SH, a => {
      a.fillStyle = lin(a, 0, 0, 0, 500, [[0, '#8ac0e8'], [1, '#ffe2b0']]); a.fillRect(0, 0, 4800, 500);
      let x = 0; const cols = ['#c98a6a', '#8a9ab0', '#d6b07a', '#a87a8a', '#7aa08a'];
      for (let i = 0; x < 4800; i++) { const w = 560 + hash(i) * 260; a.fillStyle = cols[i % 5]; a.fillRect(x, 160 + hash(i + 2) * 120, w - 8, 1100);
        a.fillStyle = '#fff2d0'; for (let wy = 300; wy < 640; wy += 150) for (let wx = x + 50; wx < x + w - 120; wx += 150) { a.fillRect(wx, wy, 80, 100); a.fillStyle = 'rgba(80,110,150,.5)'; a.fillRect(wx + 6, wy + 6, 68, 88); a.fillStyle = '#fff2d0'; }
        a.fillStyle = shade2(cols[i % 5], .7); a.fillRect(x + 30, 760, w - 70, 90); a.fillStyle = 'rgba(200,230,255,.55)'; a.fillRect(x + 60, 880, w - 260, 300); a.fillStyle = '#4a3a34'; a.fillRect(x + w - 190, 880, 130, 380); x += w; }
      a.fillStyle = '#9a9090'; a.fillRect(0, 1260, 4800, 240); a.strokeStyle = 'rgba(60,50,50,.4)'; a.lineWidth = 4; for (let i = 0; i < 4800; i += 200) { a.beginPath(); a.moveTo(i, 1260); a.lineTo(i - 80, 1500); a.stroke(); }
      a.fillStyle = '#f2e8d0'; a.fillRect(2380, 700, 640, 220); a.strokeStyle = '#c94a4a'; a.lineWidth = 12; a.strokeRect(2390, 710, 620, 200);
    }, opt({ blurCopy: 6, post: a => { a.fillStyle = '#3a2a30'; a.font = '700 64px Fredoka'; a.textAlign = 'center'; a.fillText('PIANO LESSONS', 2700, 790); a.fillStyle = '#c94a4a'; a.font = '700 72px Fredoka'; a.fillText('CALL 555-0147', 2700, 880); } })) }),
  homeDay: () => homeDesk(false), homeNight: () => homeDesk(true),
  pizza: () => ({ img: gouache('s-pizza', SW, SH, a => {
      a.fillStyle = '#a24e3a'; a.fillRect(0, 0, SW, SH); a.strokeStyle = '#8a3e2c'; a.lineWidth = 5; for (let y = 20; y < 1100; y += 48) { a.beginPath(); a.moveTo(0, y); a.lineTo(SW, y); a.stroke(); for (let x = (y / 48 % 2) * 70; x < SW; x += 140) { a.beginPath(); a.moveTo(x, y); a.lineTo(x, y + 48); a.stroke(); } }
      windowAt(a, 120, 240, 560, 440, [[0, '#f0905a'], [1, '#ffd08a']], '#4a2a20');
      a.fillStyle = '#2e5a3a'; a.fillRect(900, 120, 760, 150);
      for (const x of [500, 1200, 1900]) { a.fillStyle = '#2a1a14'; a.fillRect(x - 3, 0, 6, 130); a.fillStyle = '#e8b04a'; a.beginPath(); a.ellipse(x, 160, 80, 50, 0, Math.PI, 0); a.fill(); }
      a.fillStyle = 'rgba(255,200,120,.3)'; for (const x of [500, 1200, 1900]) { a.beginPath(); a.ellipse(x, 300, 240, 160, 0, 0, 7); a.fill(); }
      floorPersp(a, 1100, 1200, '#d8c8a8', '#b8a080', 'rgba(120,90,60,.3)');
    }, opt({ blurCopy: 7, post: a => { a.fillStyle = '#fff2d8'; a.font = '700 96px Fredoka'; a.textAlign = 'center'; a.fillText('PIZZA', 1280, 230); } })),
    front: gouache('s-pizza-table', SW, SH, a => { a.fillStyle = '#e8e0d0'; a.beginPath(); a.moveTo(300, 1000); a.lineTo(2100, 1000); a.lineTo(2500, SH); a.lineTo(-100, SH); a.fill();
      a.fillStyle = '#c0392b'; for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { const y0 = 1000 + j * 125, y1 = y0 + 125, f0 = (y0 - 1000) / 500, f1 = (y1 - 1000) / 500; const x0 = 300 - 400 * f0, x1 = 300 - 400 * f1, w0 = (1800 + 800 * f0) / 14, w1 = (1800 + 800 * f1) / 14; a.beginPath(); a.moveTo(x0 + i * w0, y0); a.lineTo(x0 + (i + 1) * w0, y0); a.lineTo(x1 + (i + 1) * w1, y1); a.lineTo(x1 + i * w1, y1); a.fill(); }
      for (const [x, y, r] of [[700, 1090, 150], [1200, 1060, 140], [1700, 1090, 150], [1100, 1330, 210]]) { a.fillStyle = '#d89a4a'; a.beginPath(); a.ellipse(x, y, r * 1.1, r * .42, 0, 0, 7); a.fill(); a.fillStyle = '#e8b04a'; a.beginPath(); a.ellipse(x, y - 4, r, r * .36, 0, 0, 7); a.fill(); a.fillStyle = '#c0392b'; for (let i = 0; i < 7; i++) { a.beginPath(); a.ellipse(x + Math.cos(i * 2.4) * r * .6, y - 4 + Math.sin(i * 2.4) * r * .2, r * .12, r * .05, 0, 0, 7); a.fill(); } } }, opt({ size: 9 })) }),
  exam: () => ({ img: set2('classroom').img, front: gouache('s-exam-desk', SW, SH, a => { a.fillStyle = '#9a6038'; a.fillRect(-100, 900, SW + 200, SH); a.fillStyle = '#b07040'; a.fillRect(-100, 890, SW + 200, 20);
      a.fillStyle = '#fbf8f0'; a.save(); a.translate(1200, 1180); a.rotate(-.04); a.fillRect(-460, -260, 920, 600); a.fillStyle = 'rgba(80,90,150,.25)'; for (let i = 0; i < 12; i++) a.fillRect(-420, -150 + i * 40, 840, 3); a.restore(); }, opt({ size: 9, post: a => { a.save(); a.translate(1200, 1180); a.rotate(-.04); a.fillStyle = '#3a2430'; a.font = '700 52px Fredoka'; a.textAlign = 'left'; a.fillText('FINAL EXAM', -420, -190); a.restore(); } })) }),
  ceiling: () => ({ img: gouache('s-ceiling', SW, SH, a => { a.fillStyle = lin(a, 0, 0, SW, SH, [[0, '#2a2850'], [1, '#3a3466']]); a.fillRect(0, 0, SW, SH);
      a.fillStyle = 'rgba(160,180,255,.18)'; a.beginPath(); a.moveTo(300, 200); a.lineTo(900, 260); a.lineTo(1100, 900); a.lineTo(380, 860); a.fill();
      a.strokeStyle = 'rgba(20,20,40,.35)'; a.lineWidth = 10; a.beginPath(); a.moveTo(600, 230); a.lineTo(740, 880); a.moveTo(340, 530); a.lineTo(1000, 580); a.stroke();
      a.fillStyle = '#4a4470'; a.beginPath(); a.arc(1500, 700, 120, 0, 7); a.fill(); a.fillStyle = '#5a5480'; for (let i = 0; i < 4; i++) { a.save(); a.translate(1500, 700); a.rotate(i * Math.PI / 2 + .3); a.beginPath(); a.ellipse(260, 0, 220, 50, 0, 0, 7); a.fill(); a.restore(); }
      a.fillStyle = 'rgba(20,16,40,.6)'; a.fillRect(0, 1300, SW, 200); }, opt({ size: 14 })) }),
  doctor: () => ({ img: gouache('s-doctor', SW, SH, a => { a.fillStyle = lin(a, 0, 0, 0, SH, [[0, '#cfe0dc'], [1, '#b0c8c4']]); a.fillRect(0, 0, SW, SH);
      for (const [x, y] of [[260, 260], [1760, 260]]) { a.fillStyle = '#2a343a'; a.fillRect(x, y, 380, 300); a.fillStyle = '#e8eef0'; a.fillRect(x + 16, y + 16, 348, 268); a.fillStyle = '#ffb07a'; a.beginPath(); a.ellipse(x + 190, y + 150, 120, 90, 0, 0, 7); a.fill(); a.strokeStyle = '#d0704a'; a.lineWidth = 6; for (let k = 0; k < 6; k++) { a.beginPath(); a.arc(x + 150 + k * 18, y + 130 + (k % 2) * 30, 28, 0, 3); a.stroke(); } }
      a.fillStyle = '#7a5a40'; a.fillRect(900, 220, 200, 150); a.fillRect(1300, 220, 200, 150); a.fillStyle = '#f4ead0'; a.fillRect(915, 235, 170, 120); a.fillRect(1315, 235, 170, 120);
      shelfRow(a, 1900, 700, 420, 4, ['#d8e4e8', '#a0c0c8', '#e8a87a', '#7aa0b0']); floorPersp(a, 1200, 1200, '#a8b8b0', '#8a9a94', 'rgba(60,80,70,.25)'); }, opt({ blurCopy: 7 })),
    front: gouache('s-doctor-desk', SW, SH, a => { a.fillStyle = '#6a4a34'; a.beginPath(); a.moveTo(300, 1040); a.lineTo(2100, 1040); a.lineTo(2400, SH); a.lineTo(0, SH); a.fill(); a.fillStyle = '#7a5a40'; a.fillRect(300, 1030, 1800, 20);
      a.fillStyle = '#e8eef0'; a.fillRect(1500, 1070, 260, 180); a.fillStyle = '#c84a4a'; a.beginPath(); a.ellipse(800, 1120, 70, 40, 0, 0, 7); a.fill(); a.fillStyle = '#f4f0e8'; a.fillRect(900, 1150, 360, 220); }, opt({ size: 9 })) }),
  balconyUp: () => ({ img: gouache('s-balup', SW, SH, a => { a.fillStyle = lin(a, 0, 0, 0, SH, [[0, '#6a5a9a'], [.5, '#e88a7a'], [1, '#ffcf8a']]); a.fillRect(0, 0, SW, SH);
      a.fillStyle = '#d99a6a'; a.fillRect(500, 0, 1400, SH); a.fillStyle = '#c4845a'; for (let y = 60; y < SH; y += 120) a.fillRect(500, y, 1400, 8);
      a.fillStyle = '#7a4a3a'; a.fillRect(820, 100, 760, 520); a.fillStyle = '#ffd59a'; a.fillRect(850, 130, 700, 490);
      a.fillStyle = '#e2a873'; a.fillRect(650, 640, 1100, 60); a.fillStyle = '#b0744a'; a.fillRect(650, 700, 1100, 30);
      a.fillStyle = '#c4845a'; a.beginPath(); a.moveTo(650, 730); a.lineTo(1750, 730); a.lineTo(1700, 800); a.lineTo(700, 800); a.fill();
      windowAt(a, 760, 1000, 300, 360, [[0, '#ffe0a0'], [1, '#ffc070']], '#7a4a3a'); windowAt(a, 1340, 1000, 300, 360, [[0, '#ffe0a0'], [1, '#ffc070']], '#7a4a3a'); }, opt({ blurCopy: 6 })),
    front: gouache('s-balup-rail', SW, SH, a => { a.fillStyle = '#2e2233'; a.fillRect(650, 420, 1100, 14); a.fillRect(650, 620, 1100, 14); for (let x = 670; x < 1750; x += 46) a.fillRect(x, 420, 8, 210);
      for (const x of [800, 1580]) { a.fillStyle = '#c06a3e'; a.beginPath(); a.moveTo(x - 80, 330); a.lineTo(x + 80, 330); a.lineTo(x + 60, 430); a.lineTo(x - 60, 430); a.fill(); a.fillStyle = '#5f9a4a'; for (let k = 0; k < 14; k++) { a.beginPath(); a.ellipse(x + Math.cos(k) * 60, 300 - (k % 4) * 22, 16, 28, k, 0, 7); a.fill(); } } }, opt({ size: 7 })) }),
  roseClose: () => ({ img: gouache('s-roseclose', SW, SH, a => { a.fillStyle = lin(a, 0, 0, 0, SH, [[0, '#4b3f7a'], [.5, '#f08a56'], [1, '#ffd08a']]); a.fillRect(0, 0, SW, SH);
      cityRow(a, 1000, '#5b4876', '#463963', '#ffcf7a', 11); a.fillStyle = '#e2a873'; a.fillRect(0, 0, 520, SH); a.fillStyle = '#7a4a3a'; a.fillRect(120, 300, 300, 900); a.fillStyle = '#ffd59a'; a.fillRect(140, 320, 260, 880); }, opt({ blurCopy: 8 })),
    front: gouache('s-roseclose-rail', SW, SH, a => { a.fillStyle = '#2e2233'; a.fillRect(0, 1180, SW, 18); for (let x = 20; x < SW; x += 60) a.fillRect(x, 1180, 10, 400);
      for (const x of [600, 1900]) { a.fillStyle = '#c06a3e'; a.beginPath(); a.moveTo(x - 130, 1060); a.lineTo(x + 130, 1060); a.lineTo(x + 100, 1220); a.lineTo(x - 100, 1220); a.fill(); a.fillStyle = '#5f9a4a'; for (let k = 0; k < 22; k++) { a.beginPath(); a.ellipse(x + Math.cos(k) * 100, 1010 - (k % 5) * 30, 22, 38, k, 0, 7); a.fill(); } } }, opt({ size: 8 })) }),
  arena: () => ({ img: gouache('s-arena', SW, SH, a => { a.fillStyle = '#140c1c'; a.fillRect(0, 0, SW, SH);
      for (let r = 0; r < 7; r++) { const y = 560 + r * 110; a.fillStyle = `rgb(${30 + r * 6},${18 + r * 3},${40 + r * 4})`; a.fillRect(0, y, SW, 110); for (let x = (r % 2) * 30; x < SW; x += 60) { a.fillStyle = `rgba(${60 + r * 10},${40 + r * 6},${70 + r * 6},1)`; a.beginPath(); a.arc(x, y + 30, 22 + r * 2, 0, 7); a.fill(); a.fillRect(x - 26 - r * 2, y + 50, 52 + r * 4, 60); } }
      a.fillStyle = '#2a2040'; a.fillRect(820, 120, 760, 360); a.fillStyle = '#0a0a14'; a.fillRect(850, 150, 700, 300);
      a.fillStyle = '#6a4030'; a.fillRect(0, 1340, SW, 160); a.fillStyle = '#8a5a40'; a.fillRect(0, 1330, SW, 20); }, opt({ size: 10, post: a => { a.fillStyle = '#ffe6a0'; a.font = '700 56px Fredoka'; a.textAlign = 'center'; a.fillText('NATIONAL MEMORY CHAMPIONSHIP', 1200, 90); } })) }),
  corridor: () => ({ img: gouache('s-corr', SW, SH, a => { const vx = 1200, vy = 700; a.fillStyle = '#3a3048'; a.fillRect(0, 0, SW, SH);
      a.fillStyle = '#4a405a'; a.beginPath(); a.moveTo(0, 0); a.lineTo(vx - 160, vy - 120); a.lineTo(vx - 160, vy + 120); a.lineTo(0, SH); a.fill(); a.beginPath(); a.moveTo(SW, 0); a.lineTo(vx + 160, vy - 120); a.lineTo(vx + 160, vy + 120); a.lineTo(SW, SH); a.fill();
      a.fillStyle = '#5a4a40'; a.beginPath(); a.moveTo(0, SH); a.lineTo(vx - 160, vy + 120); a.lineTo(vx + 160, vy + 120); a.lineTo(SW, SH); a.fill();
      a.fillStyle = '#fff2c8'; a.fillRect(vx - 160, vy - 120, 320, 240);
      for (let i = 1; i < 8; i++) { const f = Math.pow(.72, i), x0 = vx - (vx) * f - 160 * (1 - f), y0 = vy - vy * f - 120 * (1 - f), w = SW * f + 320 * (1 - f); a.fillStyle = 'rgba(255,240,200,.8)'; a.fillRect(x0 + w * .4, y0 + 6, w * .2, 10 * f + 4); } }, opt({ size: 10 })) }),
  hospital: () => ({ img: gouache('s-hosp', SW, SH, a => { a.fillStyle = lin(a, 0, 0, 0, SH, [[0, '#a8c4bc'], [1, '#8aa8a0']]); a.fillRect(0, 0, SW, SH);
      windowAt(a, 1700, 200, 520, 600, [[0, '#6a5a9a'], [.6, '#e88a6a'], [1, '#ffcf8a']], '#6a807a');
      a.fillStyle = '#c0c8c8'; a.fillRect(300, 200, 10, 900); a.fillStyle = 'rgba(220,240,255,.8)'; a.beginPath(); a.roundRect(260, 210, 90, 130, 14); a.fill();
      a.fillStyle = '#2a343a'; a.fillRect(420, 300, 220, 160); a.fillStyle = '#1a3a2a'; a.fillRect(434, 314, 192, 132);
      a.fillStyle = '#e8ecee'; a.fillRect(700, 420, 1000, 120); a.fillStyle = '#d0d8dc'; a.fillRect(700, 400, 1000, 30); a.fillStyle = '#f2f0ea'; a.beginPath(); a.ellipse(1200, 690, 250, 95, 0, 0, 7); a.fill(); a.fillStyle = 'rgba(160,170,180,.35)'; a.beginPath(); a.ellipse(1200, 720, 200, 50, 0, 0, Math.PI); a.fill(); }, opt({ blurCopy: 7 })),
    front: gouache('s-hosp-bed', SW, SH, a => {
      a.fillStyle = '#8aa0c8'; a.beginPath(); a.moveTo(500, 940); a.quadraticCurveTo(1200, 840, 1900, 940); a.lineTo(2300, SH); a.lineTo(100, SH); a.fill(); a.fillStyle = '#a8b8d8'; a.beginPath(); a.moveTo(500, 940); a.quadraticCurveTo(1200, 840, 1900, 940); a.lineTo(1900, 1000); a.quadraticCurveTo(1200, 900, 500, 1000); a.fill(); }, opt({ size: 9 })) }),
  hallway: () => ({ img: gouache('s-hall', SW, SH, a => { a.fillStyle = lin(a, 0, 0, 0, SH, [[0, '#b8ccc8'], [1, '#98aca8']]); a.fillRect(0, 0, SW, SH); a.fillStyle = '#e8ecee'; for (let x = 200; x < SW; x += 600) a.fillRect(x, 60, 300, 40);
      a.fillStyle = '#6a8a9a'; a.fillRect(300, 300, 300, 800); a.fillRect(1700, 300, 300, 800); a.fillStyle = '#c8d4d8'; a.fillRect(0, 1100, SW, 400); a.fillStyle = '#3a6a8a'; a.fillRect(900, 200, 600, 110); }, opt({ size: 11, post: a => { a.fillStyle = '#fff'; a.font = '700 60px Fredoka'; a.textAlign = 'center'; a.fillText('WARD 3', 1200, 275); } })) }),
  mailbox: () => ({ img: gouache('s-mail', SW, SH, a => { a.fillStyle = lin(a, 0, 0, 0, 800, [[0, '#8ac0e8'], [1, '#ffe2b0']]); a.fillRect(0, 0, SW, SH); a.fillStyle = '#d6b07a'; a.fillRect(0, 200, SW, 900);
      windowAt(a, 300, 320, 400, 400, [[0, '#ffe8b0'], [1, '#ffc070']], '#8a5a3a'); a.fillStyle = '#5a3a2c'; a.fillRect(1700, 280, 380, 820); a.fillStyle = '#3a6a5a'; a.fillRect(1720, 300, 340, 800);
      a.fillStyle = '#5f9a4a'; a.fillRect(0, 1100, SW, 400); a.fillStyle = '#4a3a30'; a.fillRect(1160, 760, 60, 600); }, opt({ blurCopy: 7 })) }),
};
function homeDesk(night) { return { img: gouache(night ? 's-home-n' : 's-home-d', SW, SH, a => {
    a.fillStyle = night ? '#3a3560' : '#e2b48a'; a.fillRect(0, 0, SW, SH);
    windowAt(a, 1500, 160, 600, 560, night ? [[0, '#141a40'], [1, '#2a3a70']] : [[0, '#9ad0f0'], [1, '#ffe6b0']], night ? '#2a2440' : '#8a5a40');
    if (night) { a.fillStyle = '#fff6d8'; a.beginPath(); a.arc(1960, 300, 56, 0, 7); a.fill(); }
    shelfRow(a, 200, 180, 520, 5, night ? ['#4a3a6a', '#3a4a6a', '#5a3a5a'] : BOOKC);
    a.fillStyle = night ? '#5a4a6a' : '#d08a5a'; a.beginPath(); a.moveTo(1000, 560); a.lineTo(1180, 560); a.lineTo(1140, 470); a.lineTo(1040, 470); a.fill(); a.fillRect(1080, 560, 20, 200);
    floorPersp(a, 1150, 1200, night ? '#3a2e4a' : '#a46a44', night ? '#2a2038' : '#8a5634', 'rgba(40,20,20,.3)'); }, opt({ blurCopy: 7 })),
  front: gouache(night ? 's-home-n-desk' : 's-home-d-desk', SW, SH, a => { a.fillStyle = night ? '#4a3a5a' : '#a0623e'; a.fillRect(-100, 1080, SW + 200, SH); a.fillStyle = night ? '#5a4a6a' : '#b8784a'; a.fillRect(-100, 1070, SW + 200, 22); }, opt({ size: 9 })),
  light: night ? [1090, 560, '255,200,120'] : [1800, 400, '255,225,160'], night }; }
