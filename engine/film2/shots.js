// POV film, part 3: the shot list (Elias's direction, scripts/memory/SHOTLIST.md) keyed to voice lines.
let TIM2;
const LT = i => TIM2[i].t0, ET = i => TIM2[i].t1;
const on = (t, i, d = .4) => ease(seg(t, LT(i) - .1, LT(i) - .1 + d));        // ramps 0->1 as line i starts
const during = (t, i) => t >= LT(i) - .1 && t < ET(i) + .1;
const talking = (t, ...ls) => ls.some(i => during(t, i));
// ---------- POV camera over a frontal set ----------
function view(setId, c, t, actors, o = {}) { const s = set2(setId), w = s.w || SW;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const mx = W / 2 / c.z + 50, my = H / 2 / c.z + 30; c = { ...c, cx: clamp(c.cx, mx, w - mx), cy: clamp(c.cy, my, SH - my) };
  ctx.translate(W / 2, H / 2); ctx.rotate(c.roll || 0); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy);
  ctx.drawImage(s.img.c, 0, 0, w, SH);
  if (o.blur && s.img.blur) { ctx.globalAlpha = o.blur; ctx.drawImage(s.img.blur, 0, 0, w, SH); ctx.globalAlpha = 1; }
  if (actors) actors();
  if (s.front) ctx.drawImage(s.front.c, 0, 0, SW, SH);
  if (o.after) o.after();
  if (s.light) { const [lx, ly, col] = s.light; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .35; ctx.drawImage(S.glow, lx - 300, ly - 300, 600, 600); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 30; k++) { const x = hash(k) * w + Math.sin(t * .4 + k) * 40, y = 200 + ((hash(k + 9) * 1100 + t * 16 * (.5 + hash(k + 2))) % 1100); glowAt(x, y, 5, .3, s.night); } ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0); }
const camC = (cx, cy, z, t, bob = 0, roll = 0) => ({ cx: cx + Math.sin(t * .5) * 8, cy: cy + Math.sin(t * .7) * 5 + Math.sin(t * 9) * bob, z, roll: roll + Math.sin(t * 4.5) * bob * .0008 });
function grade(col, a) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(0, 0, W, H); }
function eyesBlur(a) { if (a <= 0) return; ctx.setTransform(1, 0, 0, 1, 0, 0); const T = S.tmp || (S.tmp = Object.assign(document.createElement('canvas'), { width: W / 2, height: H / 2 }));
  const g = T.getContext('2d'); g.filter = `blur(${4 + a * 6}px)`; g.drawImage(cv, 0, 0, W / 2, H / 2); g.filter = 'none'; ctx.globalAlpha = a; ctx.drawImage(T, 0, 0, W, H); ctx.globalAlpha = 1;
  const v = ctx.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1100); v.addColorStop(0, 'rgba(200,220,255,0)'); v.addColorStop(1, `rgba(200,220,255,${.35 * a})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
function pagesAcross(t, a, n = 10, tint) { for (let k = 0; k < n; k++) { const q = (t * .35 + k / n) % 1, x = -200 + q * (W + 400), y = 200 + hash(k) * 600 + Math.sin(q * 6 + k) * 40, s = 2.2 + hash(k + 4) * 2;
  ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 70, .3 * a); ctx.globalCompositeOperation = 'source-over'; page(x, y, Math.sin(q * 5 + k) * .4, s, a * .85, tint); } }
function flash(t, at, d = .18) { const f = Math.max(0, 1 - Math.abs(t - at) / d); if (f > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,248,230,${f})`; ctx.fillRect(0, 0, W, H); } }

// ---------- whiteboards (fact cuts) ----------
let WB = {};
function buildBoards() {
  const r = (i, s0) => LT(i) - s0;  // line time relative to board start
  { const s0 = LT(35) - .1; WB.words = { s0, items: [
      st(box(260, 300, 160, 230), r(35, s0), .3, BLUE), st(box(300, 260, 160, 230), r(35, s0) + .2, .3, RED), st(box(340, 220, 160, 230), r(35, s0) + .4, .3, INK),
      tx('80,000,000,000', 1130, 330, 120, INK, r(35, s0) + .6, .9), tx('words', 1130, 450, 70, BLUE, r(35, s0) + 1.6, .3),
      st(circ(560, 760, 80, 30), r(36, s0), .4, INK), st([[560, 760], [560, 700]], r(36, s0) + .4, .1), st([[560, 760], [610, 790]], r(36, s0) + .5, .1),
      tx('≈ 600 years', 1050, 760, 110, RED, r(36, s0) + .5, .7),
      tx('no sleep', 900, 900, 60, INK, r(37, s0), .4, 'left'), st([[880, 900], [1180, 900]], r(37, s0) + .5, .2, RED, 8),
      tx('(rough estimate)', 1500, 960, 50, BLUE, r(38, s0), .5),
      st(headPts(1650, 540, .7), r(39, s0), .7, INK, 7), fn(r(39, s0) + .5, q => { for (let k = 0; k < Math.min(40, q * 50); k++) { const a = hash(k) * 6.283, d = hash(k + 3) * 80; page(1640 + Math.cos(a) * d, 520 + Math.sin(a) * d * .8, a, .7, 1); } }) ] }; }
  { const s0 = LT(40) - .1; const curve = [], you = []; for (let x = 0; x <= 1.0001; x += .04) { curve.push([420 + x * 1100, 840 - 520 * Math.exp(-x * 4.5)]); you.push([420 + x * 1100, 320]); }
    WB.curve = { s0, items: [ st([[420, 240], [420, 860], [1560, 860]], r(40, s0), .5, INK, 8), tx('remembered', 300, 300, 40, INK, r(40, s0) + .3, .4), tx('days', 1500, 920, 44, INK, r(40, s0) + .5, .3),
      st(curve, r(40, s0) + .8, 1.4, RED, 9), tx('most people', 1180, 760, 50, RED, r(40, s0) + 2, .4, 'left'),
      tx('1885', 1500, 200, 120, INK, r(41, s0), .4), tx('Ebbinghaus', 1500, 310, 60, BLUE, r(41, s0) + .5, .5),
      st(you, r(42, s0) + .2, .9, BLUE, 10), tx('YOU', 1000, 270, 70, BLUE, r(43, s0), .3) ] }; }
  { const s0 = LT(50) - .1, hx = 900, hy = 560, words = ['ha ha', 'oops!', '*trip*', 'ha!', 'awkward...']; WB.shame = { s0, items: [ st(headPts(hx, hy, 1.15), r(50, s0), .9, INK, 9), tx('NO FILTER', 1520, 230, 80, RED, r(51, s0), .5),
      fn(r(52, s0), q => { words.forEach((w, i) => { const a = clamp((q - i * .35) / .25, 0, 1); if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(hx - 70 + (i % 3) * 70 + Math.sin(q * 6 + i) * 6, hy - 140 + Math.floor(i / 2) * 80); ctx.rotate((hash(i) - .5) * .4);
        ctx.font = '700 46px Fredoka'; ctx.textAlign = 'center'; ctx.fillStyle = i % 2 ? RED : INK; ctx.fillText(w, 0, 0); ctx.restore(); });
        for (let i = 0; i < 3; i++) { const a = clamp((q - 1 - i * .3) / .3, 0, 1); if (a <= 0) continue; const fx = 1450 + i * 150, fy = 600; ctx.globalAlpha = a; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(fx, fy, 50, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.arc(fx, fy + 6, 26, .1, Math.PI - .1); ctx.fillStyle = INK; ctx.fill(); ctx.beginPath(); ctx.arc(fx - 18, fy - 14, 5, 0, 7); ctx.arc(fx + 18, fy - 14, 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }),
      tx('7:00 AM · TODAY', 1500, 880, 60, BLUE, r(53, s0), .6) ] };
    const cruel = ['#@%!', 'ugly', 'weird', 'loser', '#@%!', 'fat', 'stupid'];
    WB.cruel = { s0: LT(54) - .1, items: [ st(headPts(hx, hy, 1.15), 0, .01, INK, 9), fn(0, q => { cruel.forEach((w, i) => { const p = clamp((q - i * .28) / .6, 0, 1); if (p <= 0) return; const sx = i % 2 ? 1900 : -100, sy = 150 + hash(i) * 700, ex = hx - 40 + (hash(i + 3) - .5) * 160, ey = hy - 100 + (hash(i + 5) - .5) * 200;
        ctx.save(); ctx.translate(lerp(sx, ex, ease(p)), lerp(sy, ey, ease(p))); ctx.rotate((hash(i + 1) - .5) * .5); ctx.font = `700 ${70 - p * 20}px Fredoka`; ctx.textAlign = 'center'; ctx.fillStyle = RED; ctx.fillText(w, 0, 0); ctx.restore(); });
        if (q > LT(55) - LT(54)) { const e = (q - (LT(55) - LT(54))) % .5; ctx.strokeStyle = `rgba(214,70,60,${1 - e * 2})`; ctx.lineWidth = 6; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(hx, hy - 60, 260 + e * 300 + k * 40, -.8, .8); ctx.stroke(); } } }) ] }; }
  { const s0 = LT(57) - .1, bx = 700, by = 520; const body = [[bx, by - 260], [bx, by - 100]]; WB.energy = { s0, items: [
      st(circ(bx, by - 330, 70, 30), r(57, s0), .4, INK), st([[bx, by - 260], [bx, by + 120]], r(57, s0) + .4, .2), st([[bx - 160, by - 170], [bx, by - 220], [bx + 160, by - 170]], r(57, s0) + .55, .2), st([[bx - 110, by + 340], [bx, by + 120], [bx + 110, by + 340]], r(57, s0) + .7, .2),
      fn(r(57, s0) + .9, q => { ctx.fillStyle = `rgba(214,70,60,${clamp(q * 3, 0, 1) * .8})`; ctx.beginPath(); ctx.ellipse(bx, by - 345, 40, 30, 0, 0, 7); ctx.fill(); }), tx('2% of your weight', 1400, 300, 70, INK, r(57, s0) + 1, .6),
      st(box(1100, 480, 600, 160), r(58, s0), .5, INK, 8), fn(r(58, s0) + .5, q => { const f = clamp(q / .8, 0, 1) * .2; ctx.fillStyle = RED; ctx.fillRect(1108, 488, 584 * f, 144); }), tx('20% of your energy', 1400, 720, 70, RED, r(58, s0) + .8, .6),
      fn(r(59, s0), q => { for (let k = 0; k < 2; k++) { ctx.save(); ctx.translate(bx + (k ? 60 : -50), by - 470 - k * 20); ctx.rotate(q * (k ? -5 : 5)); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.stroke(); for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillStyle = INK; ctx.fillRect(30, -7, 16, 14); } ctx.restore(); } }),
      tx('never rests', 1400, 900, 60, BLUE, r(59, s0), .5) ] }; }
  { const s0 = LT(60) - .1, hx = 760, hy = 560; WB.luria = { s0, items: [ tx('Alexander Luria', 1400, 220, 80, INK, r(60, s0), .8), tx('studied one man', 1400, 330, 54, BLUE, r(60, s0) + 1.4, .6), tx('~30 years', 1400, 440, 90, RED, r(60, s0) + 2.6, .5),
      st(headPts(hx, hy, 1.1), r(60, s0) + .5, .9, INK, 9),
      fn(r(61, s0), q => { const n = Math.min(70, Math.floor(q * 40)); for (let k = 0; k < n; k++) { const a = hash(k) * 6.283, d = hash(k + 3) * 150; ctx.save(); ctx.translate(hx - 10 + Math.cos(a) * d, hy - 60 + Math.sin(a) * d * .9); ctx.rotate(a); ctx.strokeStyle = [INK, BLUE, RED][k % 3]; ctx.lineWidth = 4; ctx.strokeRect(-18, -12, 36, 24); ctx.restore(); } }),
      tx('?', 1400, 760, 200, RED, r(62, s0), .3), tx('abstract ideas', 1400, 920, 54, INK, r(62, s0) + .3, .6) ] }; }
  { const s0 = LT(114) - .1; WB.real = { s0, items: [ tx('So what’s real?', 960, 160, 90, INK, r(114, s0), .6),
      tx('2006', 450, 340, 110, BLUE, r(115, s0), .4), fn(r(115, s0) + .4, q => { for (let i = 0; i < 35; i++) { if (i > q * 25) break; ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.strokeRect(250 + (i % 7) * 60, 430 + Math.floor(i / 7) * 50, 50, 40); ctx.fillStyle = BLUE; ctx.font = '600 22px Fredoka'; ctx.textAlign = 'center'; ctx.fillText('✓', 275 + (i % 7) * 60, 457 + Math.floor(i / 7) * 50); } }),
      tx('a real woman, rare life memory', 450, 720, 40, INK, r(115, s0) + 1.5, .8),
      tx('1,000,000 books?', 1400, 380, 70, INK, r(116, s0), .5), st([[1100, 300], [1700, 460]], r(117, s0), .25, RED, 12), st([[1700, 300], [1100, 460]], r(117, s0) + .25, .25, RED, 12), tx('impossible', 1400, 540, 60, RED, r(117, s0) + .4, .4) ] };
    const s1 = LT(118) - .1; WB.borges = { s0: s1, items: [ tx('1942', 500, 220, 110, BLUE, LT(118) - s1, .4), tx('Jorge Luis Borges', 500, 330, 56, INK, LT(118) - s1 + .5, .7), st(box(330, 420, 340, 420), LT(118) - s1 + 1, .6, INK, 8), tx('Funes', 500, 560, 64, RED, LT(118) - s1 + 1.6, .4),
      fn(LT(119) - s1, q => { for (let k = 0; k < Math.min(60, q * 50); k++) { ctx.fillStyle = [INK, BLUE, RED][k % 3]; ctx.font = '600 26px Fredoka'; ctx.fillText('detail', 380 + hash(k) * 260 - 130 + 130, 640 + hash(k + 2) * 180); } }),
      st(circ(1450, 400, 150, 40), LT(120) - s1, .5, INK, 8), st(circ(1450, 400, 90, 30), LT(120) - s1 + .3, .4, RED, 8), st(circ(1450, 400, 30, 20), LT(120) - s1 + .5, .3, INK, 8), tx('forgetting → focus', 1450, 620, 54, INK, LT(120) - s1 + .6, .7),
      tx('still debated', 1450, 700, 46, BLUE, LT(121) - s1, .5),
      st(box(1200, 820, 380, 120), LT(122) - s1, .5, INK, 8), tx('sleep 🔒 memory', 1390, 880, 50, BLUE, LT(122) - s1 + .5, .6),
      tx('exam  <  sleep', 960, 1010, 60, RED, LT(123) - s1, .6) ] }; }
}

// ---------- the shots ----------
// each: [startLine, draw(t, q)] — q = seconds since the shot started
const SHOTS = [
  [0, (t, q) => { // classroom: window left, Ben right, professor in front
    const look = on(t, 5, .5) - on(t, 6, .5); const c = camC(1200 + look * 620, 760, 1.15 + look * .08, t, 0, look * .03);
    view('classroom', c, t, () => {
      const cough = during(t, 3) && t > LT(3) + 1.2 ? 1 : 0;
      drawBust('prof', 1290, 830, { s: .78, talk: talking(t, 0, 1, 2, 4) && !cough, cough, face: cough ? 'closed' : 'smile', armR: cough ? 2.3 : .3 + Math.sin(t * 2) * .2, armL: .2 }, t);
      if (cough) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 6; for (let k = 0; k < 3; k++) { const e = (t * 3 + k / 3) % 1; ctx.beginPath(); ctx.arc(1290 + 80 + e * 80, 700, 20 + e * 30, -.8, .8); ctx.stroke(); } }
      const nudge = during(t, 5) ? Math.max(0, Math.sin((t - LT(5)) * 9)) : 0;
      drawBust('ben', 1960, 1180, { s: 1.15, look: [-1 + look, 0], face: during(t, 5) ? 'worry' : (t > LT(6) ? 'shock' : 'neutral'), talk: talking(t, 5), front: [[-1, .6 + look * .7 + nudge * .3]] }, t); }, { after: () => {} });
    if (during(t, 5)) { ctx.setTransform(1, 0, 0, 1, 0, 0); const n = Math.max(0, Math.sin((t - LT(5)) * 9)); ctx.translate(n * -10, 0); }
    if (t > LT(1) && t < LT(5)) { ctx.setTransform(1, 0, 0, 1, 0, 0); const a = clamp((t - LT(1)) / .5, 0, 1) * (1 - seg(t, LT(5) - .5, LT(5))); for (let k = 0; k < 6; k++) { const ph = (t * .3 + k / 6) % 1; const x = lerp(900, 960, ph), y = lerp(420, 1150, ph); ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 30, .4 * a); ctx.globalCompositeOperation = 'source-over'; page(x + Math.sin(ph * 7 + k) * 80, y, Math.sin(ph * 4 + k), 1 + ph * 1.5, a * (1 - ph)); } }
    if (t > LT(6) - .1) pagesAcross(t, on(t, 6, .5), 8); }],
  [8, (t, q) => povDoor(t - 11.55)],
  [13, (t, q) => board(t - 20.55)],
  [17, (t, q) => { povDoor(t - 11.55, true); pageTunnel(t - 26.6); flash(t, LT(17) - .1);
    if (t > LT(19) - .1 && t < LT(22) - .1) { const a = on(t, 19) * (1 - seg(t, LT(22) - .5, LT(22) - .1)); bigText('ONE RULE', W / 2, 330, 120, a); if (t > LT(20) - .1) bigText('You can never forget.', W / 2, 470, 80, on(t, 20) * a); }
    if (t > LT(22) - .1) { bigText('What if your memory', W / 2, 360, 104, on(t, 22, .6)); bigText('held a million books?', W / 2, 490, 104, on(t, 22, .9)); } }],
  [23, (t, q) => { // street walk; phone number sticks to your vision
    const glance = on(t, 24, .5) - .7 * on(t, 25, .6), c = camC(1400 + q * 120 + glance * 900, 820 - glance * 40, 1.1 + glance * .25, t, 10 * (1 - glance), 0);
    c.cx = Math.min(c.cx, 4800 - 900); view('street', c, t);
    if (t > LT(25) - .1) { const a = on(t, 25, .3); ctx.save(); ctx.translate(lerp(W / 2, 330, ease(seg(t, LT(25), LT(25) + .7))), lerp(H / 2, 170, ease(seg(t, LT(25), LT(25) + .7)))); ctx.rotate(-.05 + Math.sin(t * 2) * .02); ctx.globalAlpha = a;
      ctx.shadowColor = 'rgba(255,200,120,.9)'; ctx.shadowBlur = 30; ctx.fillStyle = '#fff3b0'; ctx.fillRect(-200, -70, 400, 140); ctx.shadowBlur = 0; ctx.fillStyle = '#c94a4a'; ctx.font = '700 60px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('555-0147', 0, 4); ctx.restore(); } }],
  [26, (t, q) => { // flip through a textbook in two minutes, then teach it to Ben
    const teach = on(t, 27, .6); view('homeDay', camC(1200, 900 - teach * 160, 1.15, t), t, () => { drawBust('ben', 1200, 1010, { s: 1.15, face: t > LT(27) ? 'shock' : 'neutral', look: [0, .3] }, t); }, { blur: 1 - teach });
    ctx.setTransform(1, 0, 0, 1, 0, 0); const by = lerp(760, 1500, teach), flip = (t * 5) % 1;
    if (by < 1450) { ctx.save(); ctx.translate(W / 2, by); ctx.fillStyle = '#7a2e2e'; ctx.fillRect(-560, -330, 1120, 600); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(-540, -320, 530, 580); ctx.fillRect(10, -320, 530, 580);
      ctx.fillStyle = 'rgba(80,80,120,.35)'; for (let i = 0; i < 14; i++) { ctx.fillRect(-500, -270 + i * 36, 450, 5); ctx.fillRect(50, -270 + i * 36, 450 - (i % 4 === 3 ? 160 : 0), 5); }
      if (teach < .5) { ctx.save(); ctx.scale(Math.cos(flip * Math.PI), 1); ctx.fillStyle = '#f2ecdc'; ctx.fillRect(0, -320, 530, 580); ctx.restore(); }
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 520, 300); ctx.scale(s * -1.1, 1.1); spr(HANDB, 0, 120, s * .3, 1); ctx.restore(); }
      ctx.restore(); }
    if (t < LT(27)) { const a = on(t, 26, .3), sec = clamp((t - LT(26)) / (LT(27) - LT(26)), 0, 1) * 120; ctx.save(); ctx.globalAlpha = a; ctx.translate(1660, 200); ctx.fillStyle = 'rgba(20,12,24,.75)'; ctx.beginPath(); ctx.arc(0, 0, 110, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 92, -Math.PI / 2, -Math.PI / 2 + sec / 120 * 6.283); ctx.stroke();
      ctx.fillStyle = '#fff6e6'; ctx.font = '700 54px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`, 0, 4); ctx.restore(); } }],
  [28, (t, q) => { // pizza: Ben orders for twelve, you repeat it, the waiter applauds
    const toW = on(t, 32, .5) - 0; view('pizza', camC(1200 + toW * 420, 760, 1.12, t), t, () => {
      drawBust('f1', 380, 1060, { s: .8, face: 'smile', look: [1, 0] }, t + 1); drawBust('f2', 680, 940, { s: .7, face: t > LT(30) ? 'shock' : 'smile', look: [.6, 0] }, t + 2);
      drawBust('ben', 1150, 920, { s: .78, talk: talking(t, 28), face: t > LT(31) ? 'happy' : 'smile' }, t);
      drawBust('f3', 1650, 940, { s: .7, face: t > LT(30) ? 'shock' : 'smile', look: [-.6, 0] }, t + 3); drawBust('f4', 2020, 1060, { s: .8, face: 'smile', look: [-1, 0] }, t + 4);
      const clap = t > LT(32) - .1 ? Math.abs(Math.sin((t - LT(32)) * 10)) : 0;
      drawBust('waiter', 2120, 760, { s: .9, face: t > LT(32) ? 'happy' : (t > LT(30) ? 'shock' : 'neutral'), look: [-.8, .2], front: clap ? [[-1, 1.0 + clap * .4], [1, 1.0 + clap * .4]] : [[-1, 1.2]] }, t); });
    if (t > LT(30) - .1 && t < LT(32)) { ctx.setTransform(1, 0, 0, 1, 0, 0); const items = ['3 × pepperoni', '2 × margherita', '2 × veggie, no olives', '1 × four cheese', '2 × hawaiian', '2 × bbq chicken', 'extra garlic bread'];
      items.forEach((s, i) => { const a = clamp((t - LT(30) - i * .25) / .2, 0, 1); ctx.globalAlpha = a; ctx.font = '600 40px Fredoka'; ctx.textAlign = 'left'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(30,12,24,.7)'; ctx.strokeText(s, 90, 160 + i * 56); ctx.fillStyle = '#fff6e6'; ctx.fillText(s, 90, 160 + i * 56); });
      if (t > LT(31)) { ctx.globalAlpha = on(t, 31, .3); ctx.fillStyle = '#7aff9a'; ctx.font = '700 120px Fredoka'; ctx.fillText('✓', 520, 260); } ctx.globalAlpha = 1; } }],
  [33, (t, q) => { // exam: pages you studied pass through your vision; your hand writes it all
    const zoom = on(t, 34, .8); view('exam', camC(1200 + zoom * 120, 1060 + zoom * 120, 1.05 + zoom * 1.1, t), t);
    ctx.setTransform(1, 0, 0, 1, 0, 0); const c = camC(1200 + zoom * 120, 1060 + zoom * 120, 1.05 + zoom * 1.1, t);
    ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy); ctx.translate(1200, 1180); ctx.rotate(-.04);
    const prog = clamp((t - LT(33)) / 5, 0, 1), lines = Math.floor(prog * 11); ctx.fillStyle = '#2a3a6a'; ctx.font = '500 30px Fredoka'; ctx.textAlign = 'left';
    const txt = 'The cell membrane, which controls what enters, is made of lipids, proteins, and sugars.';
    for (let i = 0; i <= lines; i++) { const part = i < lines ? txt : txt.slice(0, Math.floor((prog * 11 % 1) * txt.length)); ctx.fillText(part.slice(0, 52), -420, -120 + i * 40); }
    const tipX = -420 + ((prog * 11 % 1) * 780), tipY = -120 + lines * 40;
    if (zoom > .3) { ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-420 + ctx.measureText(txt.slice(0, 22)).width, -120 + 40 * 2 + 4, 18, 0, 7); ctx.globalAlpha = zoom; ctx.stroke(); ctx.globalAlpha = 1; }
    writingHand(tipX, tipY, .5, t); ctx.setTransform(1, 0, 0, 1, 0, 0);
    pagesAcross(t, (1 - zoom) * on(t, 33, .5), 7); }],
  [35, (t, q) => wbDraw(WB.words.items, t - WB.words.s0, [960, 560, 1])],
  [40, (t, q) => wbDraw(WB.curve.items, t - WB.curve.s0, [990, 560, 1])],
  [44, (t, q) => { // one week, three medical textbooks (night desk) + Ben: "a library on legs"
    const toBen = on(t, 45, .6); view('homeNight', camC(1200, 900 - toBen * 160, 1.15, t), t, () => { if (toBen > 0) drawBust('ben', 1200, 1010, { s: 1.15, talk: talking(t, 45, 46, 47), face: t > LT(47) ? 'happy' : 'smile', front: t > LT(46) ? [[1, 1.6 + Math.sin(t * 4) * .1]] : null }, t); }, { blur: 1 - toBen });
    ctx.setTransform(1, 0, 0, 1, 0, 0); const by = lerp(820, 1600, toBen); if (by < 1500) { ['MEDICAL', 'ANATOMY', 'PHARMACOLOGY'].forEach((s, i) => { const done = clamp((t - LT(44) - i * .9) / .9, 0, 1); ctx.save(); ctx.translate(W / 2 + (i - 1) * 520, by - (done > .99 ? 0 : 0)); ctx.rotate((i - 1) * .05);
        ctx.fillStyle = ['#7a2e2e', '#2e4a7a', '#2e6a4a'][i]; ctx.fillRect(-220, -150, 440, 300); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(-200, -130, 400, 260); ctx.fillStyle = '#3a2430'; ctx.font = '700 40px Fredoka'; ctx.textAlign = 'center'; ctx.fillText(s, 0, -60);
        if (done >= 1) { ctx.fillStyle = '#2e8a4a'; ctx.font = '700 110px Fredoka'; ctx.fillText('✓', 0, 70); } else { ctx.fillStyle = 'rgba(80,80,120,.3)'; for (let k = 0; k < 4; k++) ctx.fillRect(-160, -10 + k * 30, 320 * (k < done * 4 ? 1 : .2), 6); } ctx.restore(); }); }
    if (toBen < 1) { const day = Math.min(6, Math.floor(clamp((t - LT(44)) / (LT(45) - LT(44)), 0, .999) * 7)); ctx.globalAlpha = 1 - toBen; ctx.fillStyle = '#fbf6ea'; ctx.fillRect(1620, 90, 220, 200); ctx.fillStyle = '#c94a4a'; ctx.fillRect(1620, 90, 220, 56); ctx.fillStyle = '#fff'; ctx.font = '700 36px Fredoka'; ctx.textAlign = 'center'; ctx.fillText('WEEK 1', 1730, 132); ctx.fillStyle = '#3a2430'; ctx.font = '700 84px Fredoka'; ctx.fillText(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][day], 1730, 245); ctx.globalAlpha = 1; } }],
  [48, (t, q) => { view('homeDay', camC(1200, 760, 1.05, t), t, null, { blur: 1 }); phoneInHand(W / 2, 600, 1.15, t, { buzz: true, c0: '#2a6a4a', c1: '#1a3a3a', draw: () => { ctx.fillStyle = '#fff'; ctx.font = '600 34px Fredoka'; ctx.textAlign = 'center'; ctx.fillText('incoming call', 0, -180); ctx.font = '700 44px Fredoka'; ctx.fillText('University', 0, -100); ctx.fillText('Admissions', 0, -46);
      ctx.fillStyle = '#3ac46a'; ctx.beginPath(); ctx.arc(0, 140, 50, 0, 7); ctx.fill(); } }); }],
  [49, (t, q) => { view('mailbox', camC(1190, 820, 1.25 + q * .04, t), t, () => { ctx.fillStyle = '#c94a4a'; ctx.beginPath(); ctx.roundRect(1040, 640, 300, 200, [90, 90, 10, 10]); ctx.fill(); ctx.fillStyle = '#2a1a1a'; ctx.fillRect(1060, 700, 260, 120);
      for (let k = 0; k < 30; k++) { const p = clamp((q - k * .06) / .5, 0, 1); if (p <= 0) continue; const x = 1190 + (hash(k) - .5) * 260 + (k > 12 ? (hash(k + 1) - .5) * 600 * p : 0), y = 760 + (k > 12 ? p * (300 + hash(k + 2) * 400) : -p * 10); ctx.save(); ctx.translate(x, y); ctx.rotate((hash(k + 3) - .5) * 1.2 * p); letter(0, 0, 0, 1); ctx.restore(); } });
    const n = Math.min(30, Math.floor(clamp(q / 1.6, 0, 1) * 30)); bigText(`${n} offers`, W / 2, 160, 110, on(t, 49, .3)); }],
  [50, (t, q) => t < LT(54) - .1 ? wbDraw(WB.shame.items, t - WB.shame.s0, [1060, 560, 1]) : wbDraw(WB.cruel.items, t - WB.cruel.s0, [1060, 560, 1])],
  [56, (t, q) => { view('ceiling', camC(1200, 750, 1.05, t), t); ctx.fillStyle = '#ff5a4a'; ctx.font = '700 120px Fredoka'; ctx.textAlign = 'center'; ctx.globalAlpha = .85; ctx.shadowColor = '#ff5a4a'; ctx.shadowBlur = 20; ctx.fillText(`3:${String(12 + Math.floor(q * 4)).padStart(2, '0')} AM`, 1500, 220); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    const b = Math.max(0, 1 - Math.abs((q % 1.6) - 1.3) / .12); if (b > 0) { ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H * .5 * b); ctx.fillRect(0, H - H * .5 * b, W, H * .5 * b); } }],
  [57, (t, q) => wbDraw(WB.energy.items, t - WB.energy.s0, [1060, 540, 1])],
  [60, (t, q) => wbDraw(WB.luria.items, t - WB.luria.s0, [1060, 560, 1])],
  [63, (t, q) => { view('doctor', camC(1200, 800, 1.2 + q * .02, t), t, () => drawBust('hale', 1200, 900, { s: 1.15, talk: talking(t, 63, 64, 65), face: t > LT(64) ? 'smile' : 'neutral', front: t > LT(64) ? [[1, 1.3 + Math.sin(t * 2) * .1]] : null }, t), { blur: .25 }); }],
  [66, (t, q) => { // from the street, looking up at Grandma Rose on her balcony
    const young = t > LT(68) - .1, look = on(t, 66, 1.2); const c = camC(1200, 1100 - look * 600, 1.1 + look * .1, t, 8 * (1 - look));
    view('balconyUp', c, t, () => { drawBust(young ? 'roseY' : 'rose', 1200, 470, { s: .62, face: during(t, 67) ? 'closed' : 'smile', talk: false, front: [[1, 1.5]] }, t);
      ctx.fillStyle = '#b8733f'; ctx.beginPath(); ctx.ellipse(1340, 420, 50, 34, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(200,230,255,.85)'; for (let i = 0; i < 10; i++) { const ph = (t * 1.8 + i / 10) % 1; ctx.beginPath(); ctx.ellipse(1400 + ph * 60, 420 + ph * ph * 120, 4, 8, 0, 0, 7); ctx.fill(); }
      if (t > LT(67) - .1) notes2(1240, 380, t, on(t, 67, .4), 1); });
    if (young) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(170,110,50,.28)'; ctx.fillRect(0, 0, W, H); const v = ctx.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1000); v.addColorStop(0, 'rgba(60,30,10,0)'); v.addColorStop(1, 'rgba(60,30,10,.6)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); bigText('years ago', W / 2, 150, 70, on(t, 68, .4), '#fff2d8'); }
    flash(t, LT(68) - .1, .15); flash(t, LT(69) - .1, .15); }],
  [69, (t, q) => { // Grandma Rose speaking to you, close
    view('roseClose', camC(1200, 760, 1.25 + q * .006, t), t, () => drawBust('rose', 1200, 1000, { s: 1.15, talk: talking(t, 70, 71, 73), face: t > LT(76) ? 'neutral' : (talking(t, 71, 73) ? 'worry' : 'smile'), look: [0, 0] }, t), { blur: .55 });
    if (during(t, 70)) bubble2(1450, 230, 'Is that you, dear…?', on(t, 70, .3)); if (during(t, 71)) bubble2(1450, 230, 'Who are you?', on(t, 71, .3)); if (during(t, 73)) bubble2(1450, 230, 'Who are you?', on(t, 73, .3));
    if (t > LT(75) - .1) { const a = on(t, 75, .5); for (let k = 0; k < 10; k++) { const an = k / 10 * 6.283 + t * .6, x = W / 2 + Math.cos(an) * 820, y = H / 2 + Math.sin(an) * 420; ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 50, .4 * a); ctx.globalCompositeOperation = 'source-over'; page(x, y, an, 1.6, a); } }
    if (t > LT(76) - .1) grade('30,30,60', .25 * on(t, 76, 1)); }],
  [77, (t, q) => { // on stage at the championship
    const c = camC(1200, 640, 1.05 + q * .015, t); view('arena', c, t, () => { const L80 = t > LT(80) - .1, sec = L80 ? Math.max(0, 30 - (t - LT(80))) : (t > LT(79) - .1 ? 180 - (t - LT(79)) : 180);
      ctx.fillStyle = sec <= 30 ? '#ff6a5a' : '#7aff9a'; ctx.font = '700 200px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 30; ctx.fillText(`${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`, 1200, 305); ctx.shadowBlur = 0; });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; const hot = on(t, 81, 1); ctx.globalAlpha = .25 + .25 * hot; ctx.drawImage(S.glow, -300, -500, 1100, 1100); ctx.drawImage(S.glow, W - 800, -500, 1100, 1100); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (t > LT(83) - .1) { const a = on(t, 83, .4); ctx.font = '600 44px Fredoka'; ctx.textAlign = 'center'; for (let i = 0; i < 14; i++) { const y = H - ((t - LT(83)) * 220 + i * 70) % (H + 100); ctx.globalAlpha = a * clamp((y - 480) / 200, 0, 1) * clamp((900 - y) / 120, 0, 1) * .85; ctx.fillStyle = '#fff3c8'; ctx.fillText(['line 117: the river bends twice', 'line 118: forty-two lanterns', 'line 119: page nine, row three', 'line 120: a blue door, then left'][i % 4], W / 2, y); } ctx.globalAlpha = 1; } }],
  [85, (t, q) => { view('arena', camC(1200, 640, 1.2, t), t, null, { blur: 1 }); phoneInHand(W / 2, 640, 1.2, t, { buzz: true, draw: () => { ctx.fillStyle = '#fff'; ctx.font = '600 34px Fredoka'; ctx.textAlign = 'center'; ctx.fillText('incoming call', 0, -180);
      ctx.fillStyle = '#d9973a'; ctx.beginPath(); ctx.arc(0, -60, 70, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 64px Fredoka'; ctx.fillText('B', 0, -38); ctx.font = '700 60px Fredoka'; ctx.fillText('Ben', 0, 70); ctx.fillStyle = '#3ac46a'; ctx.beginPath(); ctx.arc(0, 180, 46, 0, 7); ctx.fill(); } }); }],
  [87, (t, q) => { // split screen: Ben in the hospital hallway | Grandma Rose in her bed
    const sp = ease(seg(t, LT(87) - .1, LT(87) + .5)); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2 - 4, H); ctx.clip();
    view('hallway', camC(1570, 760, 1.3, t), t, () => drawBust('ben', 1200, 1050, { s: 1.1, talk: talking(t, 87), face: 'worry' }, t)); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(W / 2 + 4 + (W / 2) * (1 - sp), 0, W / 2, H); ctx.clip();
    view('hospital', camC(831, 700, 1.3, t), t, () => drawBust('rose', 1200, 830, { s: .95, face: t > LT(89) ? 'scared' : 'worry', shake: t > LT(90) - .1 ? 3 : 0, look: [0, -.3] }, t)); ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#140a14'; ctx.fillRect(W / 2 - 4, 0, 8, H); if (t > LT(88) - .1) grade('20,30,70', .15); }],
  [91, (t, q) => { // her images racing through your head (back on stage, blurred)
    view('arena', camC(1200, 640, 1.2 + q * .02, t), t, null, { blur: 1 }); grade('20,10,50', .35);
    for (let k = 0; k < 5; k++) { const ph = (t * .6 + k / 5) % 1, s = .6 + ph * 1.6; ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI) * .55; ctx.translate(W / 2 + Math.cos(k * 2.3) * 500 * ph, H / 2 + Math.sin(k * 1.7) * 260 * ph); ctx.filter = 'hue-rotate(180deg) saturate(.5)'; drawBust('rose', 0, 260, { s, face: k % 2 ? 'scared' : 'worry' }, t); ctx.filter = 'none'; ctx.restore(); }
    const words = [[93, 'can’t calm'], [94, 'can’t erase'], [95, 'can’t rebuild']]; for (const [i, w] of words) if (t > LT(i) - .1) bigText(w, W / 2, 230 + (i - 93) * 120, 76, on(t, i, .3) * (1 - seg(t, LT(96) - .4, LT(96) - .1)), '#d8e0ff', 'rgba(120,150,255,.9)'); }],
  [96, (t, q) => { // the choice: the trophy | her bed
    const pick = t > LT(97) - .1 ? 1 : 0; ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2 - 4, H); ctx.clip(); view('arena', camC(1600, 700, 1.2, t), t, () => { ctx.save(); ctx.translate(-500, 0); ctx.fillStyle = '#e8c060'; ctx.beginPath(); ctx.moveTo(1560, 560); ctx.lineTo(1840, 560); ctx.quadraticCurveTo(1820, 760, 1700, 790); ctx.quadraticCurveTo(1580, 760, 1560, 560); ctx.fill(); ctx.fillRect(1680, 790, 40, 120); ctx.fillRect(1600, 900, 200, 50);
      ctx.globalCompositeOperation = 'lighter'; glowAt(1700, 660, 260, .5); ctx.restore(); ctx.globalCompositeOperation = 'source-over'; }); if (pick) grade('0,0,0', .55); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(W / 2 + 4, 0, W / 2, H); ctx.clip(); view('hospital', camC(831, 700, 1.3, t), t, () => drawBust('rose', 1200, 830, { s: .95, face: 'closed' }, t)); ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0); if (!pick) grade('0,0,0', 0); ctx.fillStyle = '#140a14'; ctx.fillRect(W / 2 - 4, 0, 8, H);
    bigText('Finish and win?', W / 4, 150, 70, on(t, 96, .3) * (pick ? .4 : 1)); if (pick) bigText('Or go to her?', W * .75, 150, 70, on(t, 97, .3)); }],
  [98, (t, q) => { // run out of the arena
    const z = 1.0 + (q * .5) % 1.2; view('corridor', { cx: 1200 + Math.sin(t * 13) * 18, cy: 700 + Math.abs(Math.sin(t * 13)) * 26, z, roll: Math.sin(t * 6.5) * .03 }, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = 'rgba(255,240,210,.35)'; ctx.lineWidth = 4; for (let k = 0; k < 24; k++) { const an = hash(k) * 6.283, r0 = 300 + ((t * 900 + hash(k + 1) * 800) % 800); ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(an) * r0, H / 2 + Math.sin(an) * r0 * .6); ctx.lineTo(W / 2 + Math.cos(an) * (r0 + 160), H / 2 + Math.sin(an) * (r0 + 160) * .6); ctx.stroke(); } }],
  [100, (t, q) => { // her bed: you hold her hand, hum the tune, she says your name
    const c = camC(1200, 760 + Math.sin(q * .3) * 10, 1.25 + q * .006, t);
    view('hospital', c, t, () => { drawBust('rose', 1200, 830, { s: .95, face: t > LT(104) - .1 ? 'happy' : (t > LT(103) - .1 ? 'smile' : 'closed'), talk: talking(t, 105) }, t); }, { blur: .45,
      after: () => { if (t > LT(101) - .1 && t < LT(103)) notes2(1250, 1150, t, on(t, 101, .4) * (1 - seg(t, LT(103) - .5, LT(103))), -1); } });
    ctx.setTransform(1, 0, 0, 1, 0, 0); const hy = lerp(1400, 900, on(t, 100, .8)); ctx.save(); ctx.translate(1150, hy); ctx.rotate(.5); spr(HANDO, 0, 0, 0, .9); ctx.restore(); ctx.save(); ctx.translate(1300, hy + 70); ctx.rotate(-.7); spr(HANDB, 0, 0, 0, 1); ctx.restore();
    if (during(t, 105)) bubble2(1500, 260, 'Maya.', on(t, 105, .3));
    if (t > LT(108) - .1) { const a = on(t, 108, 1.2); for (let k = 0; k < 14; k++) { const an = k / 14 * 6.283 + t * .4, x = W / 2 + Math.cos(an) * 760, y = H / 2 + Math.sin(an) * 380; ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 50, .5 * a); ctx.globalCompositeOperation = 'source-over'; page(x, y, an, 1.4, a); } }
    eyesBlur(on(t, 106, 1.5) * .9); }],
  [114, (t, q) => t < LT(118) - .1 ? wbDraw(WB.real.items, t - WB.real.s0, [960, 560, 1]) : wbDraw(WB.borges.items, t - WB.borges.s0, [960, 560, 1])],
  [124, (t, q) => { view('ceiling', camC(1200, 750, 1.05 + q * .01, t), t); const b = Math.max(0, 1 - Math.abs((q % 2.2) - 1.9) / .12); if (b > 0 && t < LT(126)) { ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H * .5 * b); ctx.fillRect(0, H - H * .5 * b, W, H * .5 * b); }
    if (t > LT(126) - .1 && t < LT(128) - .1) { bigText('What if one hour of sleep', W / 2, 380, 96, on(t, 126, .6)); bigText('felt like eight?', W / 2, 500, 96, on(t, 126, .9)); }
    if (t > LT(128) - .1) { ctx.save(); ctx.globalAlpha = on(t, 128, .5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const [x, l, col] of [[W / 2 - 240, '♥  LIKE', '#d9534f'], [W / 2 + 240, 'SUBSCRIBE', '#c0392b']]) { const s = 1 + .05 * Math.sin(t * 4 + x); ctx.save(); ctx.translate(x, 420); ctx.scale(s, s); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-200, -55, 400, 110, 55); ctx.fill(); ctx.font = '700 54px Fredoka'; ctx.fillStyle = '#fff8ec'; ctx.fillText(l, 0, 4); ctx.restore(); } ctx.restore(); } }],
];
function cap2(t) { let i = -1; for (let k = 0; k < TIM2.length; k++) if (TIM2[k].t0 - .12 <= t) i = k; if (i < 0) return; const l = TIM2[i], nx = TIM2[i + 1];
  const end = Math.min(nx ? nx.t0 - .12 : 1e9, l.t1 + .7); if (t > end) return; ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = Math.min(seg(t, l.t0 - .12, l.t0 + .08), 1 - seg(t, end - .15, end)); ctx.font = '600 50px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const lines = wrap(l.text, 1500); lines.forEach((s, k) => { const y = H - 80 - (lines.length - 1 - k) * 60; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(30,12,24,.75)'; ctx.strokeText(s, W / 2, y); ctx.fillStyle = '#fff6e6'; ctx.fillText(s, W / 2, y); }); ctx.globalAlpha = 1; }
let DUR2 = 240.17;
function render2(t) {
  let i = 0; while (i < SHOTS.length - 1 && t >= (SHOTS[i + 1][0] === 0 ? 0 : LT(SHOTS[i + 1][0]) - .1)) i++;
  const s0 = SHOTS[i][0] === 0 ? 0 : LT(SHOTS[i][0]) - .1, s1 = i < SHOTS.length - 1 ? LT(SHOTS[i + 1][0]) - .1 : DUR2;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  SHOTS[i][1](t, t - s0);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = .55; ctx.drawImage(S.tex, 0, 0); ctx.globalAlpha = 1;
  cap2(t);
  const k = Math.min(seg(t, s0, s0 + .12), 1 - seg(t, s1 - .1, s1), seg(t, 0, .4), 1 - seg(t, DUR2 - .8, DUR2));
  if (k < 1) { ctx.fillStyle = `rgba(14,6,14,${1 - k})`; ctx.fillRect(0, 0, W, H); }
  window.FACES = []; window.SCENE = 'shot' + SHOTS[i][0];
}
window.render = render2;
fetch('timing.json').then(r => r.json()).then(async tm => { TIM2 = tm; await document.fonts.load('700 40px Fredoka'); await document.fonts.load('600 40px Fredoka');
  buildStatic(); buildRoom(); buildBoard(); buildHands(); buildBoards(); window.DUR = DUR2;
  const q = new URLSearchParams(location.search), from = +(q.get('from') || 0), to = +(q.get('to') || DUR2);
  for (let i = 0; i < SHOTS.length; i++) { const s0 = SHOTS[i][0] === 0 ? 0 : LT(SHOTS[i][0]) - .1, s1 = i < SHOTS.length - 1 ? LT(SHOTS[i + 1][0]) - .1 : DUR2;
    if (s1 > from && s0 < to) for (let tt = Math.max(s0, from); tt < Math.min(s1, to); tt += .5) render2(tt); }   // warm up: paints every set this range needs
  render2(from); window.READY = true; });
