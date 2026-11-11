// HQ character busts: shaded faces, real hair, lit clothing; live eyes/brows/mouth with lids, lashes, irises, lips.
// Same API and proportions as film2/core2.js (eyes at neck-124), so existing shot placement keeps working.
const BUSTHQ = {};
const hx2 = (hex, k) => shade2(hex, k);
function faceShape(a) { a.beginPath(); a.moveTo(0, -252); a.bezierCurveTo(62, -252, 98, -210, 98, -150); a.bezierCurveTo(98, -110, 88, -76, 62, -46);
  a.bezierCurveTo(42, -24, 20, -14, 0, -14); a.bezierCurveTo(-20, -14, -42, -24, -62, -46); a.bezierCurveTo(-88, -76, -98, -110, -98, -150); a.bezierCurveTo(-98, -210, -62, -252, 0, -252); a.closePath(); }
function hairBack(a, d) { a.fillStyle = d.hair;
  if (d.style === 'long') { a.beginPath(); a.moveTo(-104, -170); a.bezierCurveTo(-130, -60, -150, 40, -120, 120); a.lineTo(120, 120); a.bezierCurveTo(150, 40, 130, -60, 104, -170); a.bezierCurveTo(100, -290, -100, -290, -104, -170); a.fill(); }
  if (d.style === 'pony') { a.beginPath(); a.ellipse(0, -170, 108, 100, 0, 0, 7); a.fill(); }
  if (d.style === 'bun') { a.beginPath(); a.arc(0, -282, 46, 0, 7); a.fill(); a.beginPath(); a.ellipse(0, -170, 106, 96, 0, Math.PI, 0); a.fill(); }
  if (d.style === 'curly') for (let k = 0; k < 22; k++) { const an = Math.PI * (.85 + k / 21 * 1.3); a.beginPath(); a.arc(Math.cos(an) * 96, -150 + Math.sin(an) * 104, 34, 0, 7); a.fill(); }
  if (d.style === 'neat' || d.style === 'short') { a.beginPath(); a.ellipse(0, -168, 104, 96, 0, Math.PI * .92, Math.PI * 2.08); a.fill(); }
  if (d.style === 'bald') for (const s of [-1, 1]) { a.beginPath(); a.ellipse(s * 92, -150, 20, 46, s * .15, 0, 7); a.fill(); } }
function hairFront(a, d) { const g = a.createLinearGradient(-60, -270, 60, -150); g.addColorStop(0, hx2(d.hair, 1.35)); g.addColorStop(.5, d.hair); g.addColorStop(1, hx2(d.hair, .8)); a.fillStyle = g;
  a.strokeStyle = hx2(d.hair, .6); a.lineWidth = 3; const strands = (pts) => { for (const p of pts) { a.beginPath(); a.moveTo(...p[0]); a.quadraticCurveTo(...p[1], ...p[2]); a.stroke(); } };
  if (d.style === 'long' || d.style === 'pony') { for (const sd of [-1, 1]) { a.beginPath(); a.moveTo(sd * 4, -268); a.bezierCurveTo(sd * 70, -272, sd * 112, -230, sd * 106, -150); a.bezierCurveTo(sd * 100, -120, sd * 96, -100, sd * 94, -80);
        a.bezierCurveTo(sd * 84, -140, sd * 70, -196, sd * 4, -226); a.closePath(); a.fill(); }
      strands([[[-6, -262], [-60, -250], [-96, -170]], [[-6, -240], [-50, -226], [-84, -150]], [[6, -262], [60, -250], [96, -170]], [[6, -240], [50, -226], [84, -150]]]);
      if (d.style === 'long') { a.fillStyle = d.hair; for (const s of [-1, 1]) { a.beginPath(); a.moveTo(s * 98, -160); a.bezierCurveTo(s * 110, -110, s * 112, -70, s * 104, -40); a.lineTo(s * 90, -44); a.bezierCurveTo(s * 96, -80, s * 92, -120, s * 86, -150); a.fill(); } } }
  if (d.style === 'neat') { a.beginPath(); a.moveTo(-102, -132); a.bezierCurveTo(-112, -250, -50, -286, 10, -284); a.bezierCurveTo(80, -282, 114, -240, 102, -132);
      a.bezierCurveTo(96, -170, 80, -196, 50, -200); a.bezierCurveTo(10, -212, -30, -186, -60, -204); a.bezierCurveTo(-84, -190, -96, -166, -102, -132); a.fill();
      strands([[[-80, -220], [-30, -262], [40, -258]], [[-40, -206], [10, -244], [80, -226]], [[20, -204], [60, -230], [96, -176]]]); }
  if (d.style === 'bun' || d.style === 'short') { a.beginPath(); a.moveTo(-100, -150); a.bezierCurveTo(-104, -262, 100, -270, 100, -150); a.bezierCurveTo(70, -206, 20, -222, -20, -214); a.bezierCurveTo(-60, -206, -88, -180, -100, -150); a.fill();
      strands([[[-70, -200], [-20, -240], [40, -236]], [[-20, -216], [30, -240], [80, -200]]]); }
  if (d.style === 'curly') { for (let k = 0; k < 11; k++) { a.beginPath(); a.arc(-92 + k * 18.5, -236 + Math.sin(k * 1.4) * 10, 26, 0, 7); a.fill(); } a.strokeStyle = hx2(d.hair, 1.6); a.lineWidth = 3; for (let k = 0; k < 11; k++) { a.beginPath(); a.arc(-92 + k * 18.5, -238 + Math.sin(k * 1.4) * 10, 14, 3.6, 5); a.stroke(); } }
  // shine
  a.globalAlpha = .35; a.strokeStyle = '#ffffff'; a.lineWidth = 7; a.lineCap = 'round'; a.beginPath(); a.arc(-10, -170, 82, -2.4, -1.75); a.stroke(); a.globalAlpha = 1; }
function bustHQ(id) { if (BUSTHQ[id]) return BUSTHQ[id]; const d = CAST2[id];
  const torso = gouache('hq-torso-' + id, 560, 630, a => {
    const g = a.createLinearGradient(-240, 0, 240, 0); g.addColorStop(0, hx2(d.top, 1.12)); g.addColorStop(.55, d.top); g.addColorStop(1, hx2(d.top, .7));
    a.fillStyle = g; a.beginPath(); a.moveTo(-50, 4);
    a.bezierCurveTo(-100, 14, -150, 26, -184, 44); a.bezierCurveTo(-206, 56, -214, 82, -214, 118);
    a.lineTo(-210, 520); a.lineTo(210, 520); a.lineTo(214, 118);
    a.bezierCurveTo(214, 82, 206, 56, 184, 44); a.bezierCurveTo(150, 26, 100, 14, 50, 4); a.closePath(); a.fill();
    const top = a.createLinearGradient(0, -10, 0, 90); top.addColorStop(0, 'rgba(255,240,220,.18)'); top.addColorStop(1, 'rgba(255,240,220,0)'); a.fillStyle = top; a.fill();
    a.fillStyle = 'rgba(40,20,30,.18)'; a.beginPath(); a.moveTo(-150, 200); a.bezierCurveTo(-120, 260, -110, 380, -130, 520); a.lineTo(-206, 520); a.lineTo(-214, 210); a.fill();   // under-arm shadow
    a.beginPath(); a.moveTo(150, 200); a.bezierCurveTo(120, 260, 110, 380, 130, 520); a.lineTo(206, 520); a.lineTo(214, 210); a.fill();
    a.strokeStyle = hx2(d.top, .7); a.lineWidth = 4; a.lineCap = 'round';                                 // folds
    for (const [x0, y0, x1, y1, x2, y2] of [[-150, 180, -120, 300, -140, 460], [130, 200, 110, 320, 140, 470], [-40, 280, -20, 380, -50, 500]]) { a.beginPath(); a.moveTo(x0, y0); a.quadraticCurveTo(x1, y1, x2, y2); a.stroke(); }
    a.strokeStyle = hx2(d.top, .62); a.lineWidth = 4; a.beginPath(); a.moveTo(-170, 70); a.bezierCurveTo(-150, 180, -146, 360, -152, 520); a.moveTo(170, 70); a.bezierCurveTo(150, 180, 146, 360, 152, 520); a.stroke();   // arm/body line
    if (d.coat) { a.fillStyle = d.coat; a.beginPath(); a.moveTo(-58, -2); a.lineTo(-18, 230); a.lineTo(-8, 520); a.lineTo(-246, 520); a.lineTo(-232, 130); a.bezierCurveTo(-214, 40, -150, 6, -58, -2); a.fill(); a.beginPath(); a.moveTo(58, -2); a.lineTo(18, 230); a.lineTo(8, 520); a.lineTo(246, 520); a.lineTo(232, 130); a.bezierCurveTo(214, 40, 150, 6, 58, -2); a.fill(); }
    if (d.apron) { a.fillStyle = d.apron; a.fillRect(-150, 210, 300, 310); a.fillRect(-120, 30, 20, 190); a.fillRect(100, 30, 20, 190); }
        { const sk = a.createLinearGradient(0, -70, 0, 10); sk.addColorStop(0, hx2(d.skin, .78)); sk.addColorStop(.5, hx2(d.skin, .9)); sk.addColorStop(1, hx2(d.skin, .95)); a.fillStyle = sk;
      a.beginPath(); a.moveTo(-36, -80); a.bezierCurveTo(-37, -40, -40, -10, -50, 10); a.lineTo(50, 10); a.bezierCurveTo(40, -10, 37, -40, 36, -80); a.fill();
      a.strokeStyle = 'rgba(110,50,40,.16)'; a.lineWidth = 4; a.beginPath(); a.moveTo(-24, -50); a.quadraticCurveTo(-16, -20, -6, 4); a.moveTo(24, -50); a.quadraticCurveTo(16, -20, 6, 4); a.stroke(); }
    a.fillStyle = hx2(d.top, .78); a.beginPath(); a.moveTo(-60, 2); a.bezierCurveTo(-40, 30, 40, 30, 60, 2); a.lineTo(56, 16); a.bezierCurveTo(36, 44, -36, 44, -56, 16); a.closePath(); a.fill();   // crew collar over the neck
    if (d.old) { a.fillStyle = '#e8dcc0'; for (let y = 70; y < 500; y += 72) { a.beginPath(); a.arc(0, y, 9, 0, 7); a.fill(); } }
  }, { origin: [280, 90], size: 6, clip: true, crisp: .55, soft: 2 });
  const back = gouache('hq-hairback-' + id, 360, 460, a => hairBack(a, d), { origin: [180, 320], size: 5, clip: true, crisp: .7, soft: 1.5 });
  const head = gouache('hq-head-' + id, 360, 420, a => {
    
    for (const s of [-1, 1]) { a.fillStyle = d.skin; a.beginPath(); a.ellipse(s * 96, -140, 18, 28, s * .1, 0, 7); a.fill(); a.fillStyle = hx2(d.skin, .8); a.beginPath(); a.ellipse(s * 98, -140, 8, 15, 0, 0, 7); a.fill(); }
    const fg = a.createRadialGradient(-36, -170, 20, 0, -130, 150); fg.addColorStop(0, hx2(d.skin, 1.08)); fg.addColorStop(.7, d.skin); fg.addColorStop(1, hx2(d.skin, .82)); a.fillStyle = fg; faceShape(a); a.fill();
    a.save(); faceShape(a); a.clip(); const sg = a.createLinearGradient(10, 0, 100, 0); sg.addColorStop(0, 'rgba(90,40,30,0)'); sg.addColorStop(1, 'rgba(90,40,30,.1)'); a.fillStyle = sg; a.fillRect(0, -260, 110, 260); a.restore();   // shadow side
    for (const s of [-1, 1]) { const b = a.createRadialGradient(s * 52, -92, 2, s * 52, -92, 30); b.addColorStop(0, 'rgba(225,105,100,.24)'); b.addColorStop(1, 'rgba(235,110,110,0)'); a.fillStyle = b; a.beginPath(); a.arc(s * 56, -88, 34, 0, 7); a.fill(); }
    a.strokeStyle = 'rgba(120,60,50,.22)'; a.lineWidth = 3; a.lineCap = 'round'; a.beginPath(); a.moveTo(6, -136); a.quadraticCurveTo(13, -114, 13, -102); a.stroke();
    a.fillStyle = 'rgba(120,60,50,.16)'; a.beginPath(); a.moveTo(-14, -100); a.quadraticCurveTo(0, -88, 16, -100); a.quadraticCurveTo(0, -92, -14, -100); a.fill();   // under-nose shadow
    a.save(); faceShape(a); a.clip(); a.fillStyle = 'rgba(110,50,40,.10)'; for (const sd of [-1, 1]) { a.beginPath(); a.ellipse(sd * 74, -96, 18, 40, sd * -.3, 0, 7); a.fill(); } a.restore();   // cheek hollows
    a.fillStyle = 'rgba(255,240,225,.35)'; a.globalAlpha = .5; for (const sd of [-1, 1]) { a.beginPath(); a.ellipse(sd * 66, -104, 10, 6, sd * .4, 0, 7); a.fill(); } a.globalAlpha = 1;   // cheekbone light   // nose bridge shadow
    a.fillStyle = 'rgba(110,50,45,.35)'; for (const s of [-1, 1]) { a.beginPath(); a.ellipse(s * 9, -98, 4.5, 2.8, s * .3, 0, 7); a.fill(); } a.fillStyle = 'rgba(120,60,50,.14)'; for (const s of [-1, 1]) { a.beginPath(); a.ellipse(s * 15, -104, 6, 8, 0, 0, 7); a.fill(); } a.fillStyle = 'rgba(255,255,255,.4)'; a.beginPath(); a.ellipse(-2, -108, 6, 5, 0, 0, 7); a.fill();
    if (d.old) { a.strokeStyle = 'rgba(140,80,60,.4)'; a.lineWidth = 3; for (const s of [-1, 1]) { a.beginPath(); a.moveTo(s * 70, -140); a.lineTo(s * 82, -128); a.moveTo(s * 70, -132); a.lineTo(s * 84, -118); a.stroke(); a.beginPath(); a.moveTo(s * 24, -78); a.quadraticCurveTo(s * 36, -60, s * 30, -46); a.stroke(); } a.beginPath(); a.moveTo(-34, -214); a.lineTo(34, -214); a.moveTo(-26, -200); a.lineTo(26, -200); a.stroke(); }
    if (d.beard) { a.fillStyle = d.beard; a.beginPath(); a.moveTo(-90, -120); a.bezierCurveTo(-86, -30, -40, -6, 0, -6); a.bezierCurveTo(40, -6, 86, -30, 90, -120); a.bezierCurveTo(60, -70, 30, -80, 0, -78); a.bezierCurveTo(-30, -80, -60, -70, -90, -120); a.fill(); }
    hairFront(a, d);
  }, { origin: [180, 320], size: 4, clip: true, crisp: .7, soft: 1.5 });
  const arm = gouache('hq-arm-' + id, 140, 380, a => { const g = a.createLinearGradient(-36, 0, 36, 0); g.addColorStop(0, hx2(d.coat || d.top, 1.1)); g.addColorStop(1, hx2(d.coat || d.top, .75)); a.fillStyle = g; a.beginPath(); a.moveTo(-30, -10); a.lineTo(30, -10); a.lineTo(25, 262); a.lineTo(-25, 262); a.closePath(); a.fill();
    a.fillStyle = hx2(d.coat || d.top, .8); a.fillRect(-26, 244, 52, 20); a.fillStyle = d.skin; a.beginPath(); a.ellipse(0, 292, 22, 32, 0, 0, 7); a.fill(); a.fillStyle = hx2(d.skin, .85); a.beginPath(); a.ellipse(6, 300, 12, 18, 0, 0, 7); a.fill(); },
    { origin: [70, 40], size: 5, clip: true, crisp: .6, soft: 2 });
  return BUSTHQ[id] = { d, torso, head, arm, back }; }

function drawBust(id, x, y, o, t) { const B = bustHQ(id), s = o.s || 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.lean || 0);
  const br = Math.sin(t * 2) * 3, sh = o.shake ? Math.sin(t * 40) * o.shake : 0;
  const arm = (side, a) => { ctx.save(); ctx.translate(side * 165, 80 + br); ctx.rotate(-side * a); spr(B.arm, 0, 0, 0, 1); ctx.restore(); };
  if (o.armL) arm(-1, o.armL); if (o.armR) arm(1, o.armR); if (o.front) for (const [side, a] of o.front) arm(side, a);
  ctx.fillStyle = 'rgba(30,10,20,.18)'; ctx.beginPath(); ctx.ellipse(0, 26 + br, 90, 26, 0, 0, 7); ctx.fill();
  spr(B.back, sh, br, 0, 1);
  spr(B.torso, 0, br, 0, 1);
  ctx.save(); ctx.translate(sh, br + (o.cough ? -Math.abs(Math.sin(t * 18)) * 8 * o.cough : 0)); ctx.rotate((o.tilt || 0) + sh * .004);
  spr(B.head, 0, 0, 0, 1); face2(B.d, o, t); ctx.restore();
  ctx.restore(); }

function face2(d, o, t) { const k = ctx, ex = o.face || 'neutral', [lx, ly] = o.look || [0, 0], iris = d.eye || '#5a3a22', lash = '#24161c';
  const blink = (hash(Math.floor(t * 1.1) + d.skin.length) > .82 && (t * 1.1 % 1) < .12) || ex === 'closed';
  const open = ex === 'shock' ? 1.15 : ex === 'happy' ? .35 : (ex === 'sad' || ex === 'worry' || ex === 'scared') ? .85 : 1;
  for (const s of [-1, 1]) { const cx = s * 38, cy = -124;
    k.save(); k.translate(cx, cy);
    if (blink || ex === 'happy') { k.strokeStyle = lash; k.lineWidth = 4.5; k.lineCap = 'round'; k.beginPath(); if (ex === 'happy') k.arc(0, 8, 17, Math.PI * 1.15, Math.PI * 1.85); else k.arc(0, -6, 18, Math.PI * .18, Math.PI * .82); k.stroke();
      k.restore(); continue; }
    const W2 = 21, H2 = 12.5 * open;
    k.beginPath(); k.moveTo(-W2, 0); k.bezierCurveTo(-W2 * .5, -H2 * 1.5, W2 * .5, -H2 * 1.5, W2, -2); k.bezierCurveTo(W2 * .5, H2 * 1.1, -W2 * .5, H2 * 1.1, -W2, 0); k.closePath();
    k.fillStyle = '#fbf7f0'; k.fill(); k.save(); k.clip();
    const ix = lx * 7, iy = ly * 4 + 1, ig = k.createRadialGradient(ix - 3, iy - 4, 2, ix, iy, 13); ig.addColorStop(0, hx2(iris, 1.6)); ig.addColorStop(1, iris);
    k.fillStyle = ig; k.beginPath(); k.arc(ix, iy, 11.5, 0, 7); k.fill(); k.strokeStyle = hx2(iris, .6); k.lineWidth = 1.5; k.stroke(); k.fillStyle = '#120a0e'; k.beginPath(); k.arc(ix, iy, 5, 0, 7); k.fill();
    k.fillStyle = 'rgba(60,30,30,.12)'; k.fillRect(-W2, -H2 * 2, W2 * 2, H2 * .8);          // upper lid shadow
    k.fillStyle = '#fff'; k.beginPath(); k.arc(ix - 3.5, iy - 4, 3, 0, 7); k.fill(); k.beginPath(); k.arc(ix + 4, iy + 4, 1.8, 0, 7); k.fill(); k.restore();
    k.strokeStyle = lash; k.lineWidth = 3.6; k.lineCap = 'round'; k.beginPath(); k.moveTo(-W2 - 2, 1); k.bezierCurveTo(-W2 * .5, -H2 * 1.55, W2 * .5, -H2 * 1.55, W2 + 3, -3); k.stroke();
    k.strokeStyle = 'rgba(90,50,40,.18)'; k.lineWidth = 2; k.beginPath(); k.moveTo(-W2 * .7, H2 * .9); k.quadraticCurveTo(0, H2 * 1.25, W2 * .7, H2 * .7); k.stroke();
    k.strokeStyle = 'rgba(90,50,40,.3)'; k.lineWidth = 2; k.beginPath(); k.moveTo(-W2 * .7, -H2 * 1.6 - 5); k.quadraticCurveTo(0, -H2 * 2.1 - 6, W2 * .8, -H2 * 1.4 - 6); k.stroke();
    k.restore(); }
  const br = { sad: [-.3, 4], worry: [-.35, 2], scared: [-.45, 0], shock: [0, -12], happy: [.1, -4], smile: [.05, -2], neutral: [0, 0], angry: [.35, 6], closed: [0, 0] }[ex] || [0, 0];
  k.fillStyle = hx2(d.hair === '#dcd7e0' || d.hair === '#cfcfd6' ? '#8a8490' : d.hair, .9);
  for (const s of [-1, 1]) { k.save(); k.translate(s * 38, -158 + br[1]); k.rotate(br[0] * s); k.beginPath(); k.moveTo(-s * 22, 4); k.quadraticCurveTo(-s * 4, -8, s * 22, -2); k.quadraticCurveTo(-s * 2, -2, -s * 22, 8); k.closePath(); k.fill(); k.restore(); }
  const talk = o.talk ? Math.abs(Math.sin(t * 11)) * (hash(Math.floor(t * 5)) > .25 ? 1 : .2) : 0, lip = '#c86a6a', inside = '#5a2228';
  k.save(); k.translate(0, -62);
  const mouthOpen = (w, h) => { k.fillStyle = inside; k.beginPath(); k.ellipse(0, 0, w, h, 0, 0, 7); k.fill(); k.fillStyle = '#fff6ee'; k.save(); k.beginPath(); k.ellipse(0, 0, w, h, 0, 0, 7); k.clip(); k.fillRect(-w, -h, w * 2, Math.min(7, h * .6)); k.fillStyle = '#d0606a'; k.beginPath(); k.ellipse(0, h * .8, w * .7, h * .5, 0, 0, 7); k.fill(); k.restore(); k.strokeStyle = lip; k.lineWidth = 3; k.beginPath(); k.ellipse(0, 0, w, h, 0, 0, 7); k.stroke(); };
  if (o.cough) mouthOpen(16, 10 + Math.abs(Math.sin(t * 18)) * 8);
  else if (talk > .15) mouthOpen(17, 4 + talk * 12);
  else if (ex === 'shock') mouthOpen(13, 16);
  else { k.strokeStyle = '#9a4a4a'; k.lineWidth = 3.5; k.lineCap = 'round'; k.beginPath();
    const lips = (curve) => { k.fillStyle = '#b8645e'; k.beginPath(); k.moveTo(-22, curve); k.quadraticCurveTo(-10, -9 + curve * .3, 0, -5); k.quadraticCurveTo(10, -9 + curve * .3, 22, curve); k.quadraticCurveTo(0, 3 + curve * .6, -22, curve); k.fill();
      k.fillStyle = '#cc7a72'; k.beginPath(); k.moveTo(-20, curve + 1); k.quadraticCurveTo(0, 16 + curve * .4, 20, curve + 1); k.quadraticCurveTo(0, 4 + curve * .6, -20, curve + 1); k.fill();
      k.fillStyle = 'rgba(255,235,225,.5)'; k.beginPath(); k.ellipse(0, 9 + curve * .3, 6, 2.2, 0, 0, 7); k.fill(); k.strokeStyle = '#7a3a3a'; k.lineWidth = 2.4; k.beginPath(); k.moveTo(-22, curve); k.quadraticCurveTo(0, 4 + curve * .6, 22, curve); k.stroke(); };
    if (ex === 'smile' || ex === 'happy') { lips(-6); }
    else if (ex === 'sad' || ex === 'worry' || ex === 'scared') { k.moveTo(-18, 6); k.quadraticCurveTo(0, -6, 18, 6); k.stroke(); }
    else if (ex !== 'sad' && ex !== 'worry' && ex !== 'scared') lips(0); }
  k.restore();
  if (d.glasses) { k.lineWidth = 4; k.strokeStyle = '#3a2a30'; k.beginPath(); k.roundRect(-70, -146, 60, 46, 18); k.roundRect(10, -146, 60, 46, 18); k.moveTo(-10, -128); k.quadraticCurveTo(0, -134, 10, -128); k.stroke();
    k.fillStyle = 'rgba(255,255,255,.12)'; k.fillRect(-66, -142, 18, 38); k.fillRect(14, -142, 18, 38); }
  if (o.tears) { k.fillStyle = 'rgba(190,225,255,.9)'; for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const q = (t * .8 + i / 2 + (s > 0 ? .3 : 0)) % 1; k.beginPath(); k.ellipse(s * 44, -108 + q * 60, 5, 8, 0, 0, 7); k.fill(); } } }
