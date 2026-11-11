// Video 2 shot list (Elias's direction, scripts/countdown/SHOTLIST.md), keyed to voice lines in timing_countdown.json.
// Framing rules: eyes on the upper third (eyeCam), people at eye level, a foreground layer for depth, motivated head moves.
const eyeCam = (cx, eyeY, z, t, bob = 0, roll = 0) => camC(cx, eyeY - H * .02 / z, z, t, bob, roll);
const tagAbove = (eyeY, s) => eyeY - 120 * s - 105;
const mix = (a, b, k) => ({ cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), z: lerp(a.z, b.z, k), roll: lerp(a.roll || 0, b.roll || 0, k) });
const shake = (c, amt, t) => ({ ...c, cx: c.cx + Math.sin(t * 47) * amt, cy: c.cy + Math.cos(t * 39) * amt * .7, roll: (c.roll || 0) + Math.sin(t * 31) * amt * .0006 });
function lids(open) { if (open >= 1) return; ctx.setTransform(1, 0, 0, 1, 0, 0); const h = (1 - open) * H * .56; ctx.fillStyle = '#0a0608';
  ctx.beginPath(); ctx.ellipse(W / 2, -H * .25 + h, W * .85, H * .5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(W / 2, H * 1.25 - h, W * .85, H * .5, 0, 0, 7); ctx.fill(); }
function blinkAt(t, at) { const b = Math.max(0, 1 - Math.abs(t - at) / .13); if (b > 0) lids(1 - b); }
function bigCenter(str, y, size, a, col) { bigText(str, W / 2, y, size, a, col); }
const MOM = { y: 31, m: 4, d: 6, sec: 43473 };

// ---------- whiteboards ----------
let WB3 = {};
function buildBoards3() {
  const r = (i, s0) => LT(i) - s0;
  { const s0 = LT(18) - .1; WB3.life = { s0, items: [
      tx('average human life', 960, 170, 64, INK, r(18, s0), .7), tx('≈ 73 years', 960, 300, 140, RED, r(18, s0) + 1.4, .6),
      st([[300, 520], [1620, 520]], r(19, s0), .5, INK, 8), st([[300, 490], [300, 550]], r(19, s0), .05), st([[1620, 490], [1620, 550]], r(19, s0) + .5, .05),
      tx('birth', 300, 600, 40, INK, r(19, s0) + .2, .2), tx('73', 1620, 600, 40, INK, r(19, s0) + .5, .2),
      fn(r(19, s0) + .6, q => { const n = Math.min(400, Math.floor(q * 260)); for (let k = 0; k < n; k++) { ctx.fillStyle = k % 37 === 0 ? RED : INK; ctx.beginPath(); ctx.arc(330 + (k % 50) * 26, 690 + Math.floor(k / 50) * 26, 7, 0, 7); ctx.fill(); } }),
      tx('≈ 26,800 days', 960, 960, 90, BLUE, r(19, s0) + 1.6, .6), tx('...we never count', 1500, 1040, 46, RED, r(21, s0), .5) ] }; }
  { const s0 = LT(43) - .1; WB3.harvard = { s0, items: [
      tx('1938', 420, 220, 130, BLUE, r(43, s0), .4), tx('Harvard study', 420, 340, 60, INK, r(43, s0) + .6, .6),
      fn(r(43, s0) + 1.2, q => { for (let k = 0; k < 12; k++) { if (k > q * 8) break; const x = 200 + (k % 6) * 90, y = 470 + Math.floor(k / 6) * 150; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.moveTo(x, y + 22); ctx.lineTo(x, y + 80); ctx.moveTo(x - 30, y + 45); ctx.lineTo(x + 30, y + 45); ctx.stroke(); } }),
      tx('one of the longest studies of adult life', 420, 820, 38, INK, r(44, s0), .9),
      tx('money?', 1300, 260, 70, INK, r(45, s0) + 1, .4), st([[1170, 260], [1430, 260]], r(45, s0) + 1.6, .2, RED, 9),
      tx('fame?', 1300, 400, 70, INK, r(46, s0), .3), st([[1190, 400], [1410, 400]], r(46, s0) + .4, .2, RED, 9),
      fn(r(47, s0), q => { const a = clamp(q / .4, 0, 1); ctx.globalAlpha = a; for (const [x, y] of [[1220, 640], [1380, 640]]) { ctx.strokeStyle = BLUE; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.moveTo(x, y + 34); ctx.lineTo(x, y + 130); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(1220, 700); ctx.lineTo(1380, 700); ctx.stroke(); ctx.fillStyle = RED; ctx.beginPath(); const hx = 1300, hy = 560 - Math.abs(Math.sin(q * 3)) * 10; ctx.moveTo(hx, hy + 22); ctx.bezierCurveTo(hx - 40, hy - 8, hx - 20, hy - 34, hx, hy - 14); ctx.bezierCurveTo(hx + 20, hy - 34, hx + 40, hy - 8, hx, hy + 22); ctx.fill(); ctx.globalAlpha = 1; }),
      tx('close relationships', 1300, 860, 64, RED, r(47, s0) + .3, .6) ] }; }
  { const s0 = LT(77) - .1; WB3.roads = { s0, items: [
      tx('≈ 1,200,000', 960, 200, 130, RED, r(77, s0), .7), tx('road deaths every year', 960, 320, 54, INK, r(77, s0) + 1.4, .7),
      st(circ(600, 640, 150, 40), r(78, s0), .5, INK, 8), fn(r(78, s0) + .3, q => { ctx.strokeStyle = RED; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(600, 640); ctx.lineTo(600 + Math.sin(q * 6.283) * 120, 640 - Math.cos(q * 6.283) * 120); ctx.stroke(); }),
      tx('2+ every minute', 1150, 640, 80, INK, r(78, s0) + .4, .6, 'left'),
      tx('#1 cause of death', 960, 880, 80, RED, r(79, s0) + .6, .6), tx('ages 5 – 29', 960, 980, 64, BLUE, r(79, s0) + 1.6, .5) ] }; }
  { const s0 = LT(98) - .1; WB3.real = { s0, items: [
      tx('So what’s real?', 960, 150, 90, INK, r(98, s0), .5),
      tx('no countdown exists', 960, 290, 60, INK, r(99, s0), .6), tx('average  ≠  promise', 960, 410, 66, RED, r(100, s0) + .5, .7),
      tx('shortens:', 420, 560, 56, INK, r(101, s0), .3),
      fn(r(101, s0) + .3, q => { const items = [['smoking', 0], ['sitting still', .9], ['loneliness', 1.8]]; items.forEach(([w, d], i) => { if (q < d) return; ctx.font = '600 46px Fredoka'; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText(w, 300, 650 + i * 80); ctx.strokeStyle = RED; ctx.lineWidth = 6; const f = clamp((q - d - .3) / .3, 0, 1); ctx.beginPath(); ctx.moveTo(290, 652 + i * 80); ctx.lineTo(290 + 300 * f, 652 + i * 80); ctx.stroke(); }); }),
      tx('lengthens:', 1300, 560, 56, INK, r(102, s0), .3),
      fn(r(103, s0), q => { const items = [['sleep', 0], ['movement', .8], ['people you love', 1.6]]; items.forEach(([w, d], i) => { if (q < d) return; ctx.font = '600 46px Fredoka'; ctx.fillStyle = BLUE; ctx.textAlign = 'left'; ctx.fillText('✓ ' + w, 1150, 650 + i * 80); }); }) ] }; }
}

// ---------- shots ----------
const SHOTS3 = [
  [0, (t, q) => { // wake up; the head turns from the window to the door: Mom, with her number
    const sit = ease(seg(t, LT(1), LT(1) + 2.2)), turn = ease(seg(t, LT(2), LT(2) + 1.4)), push = ease(seg(t, LT(3), LT(7) + 1));
    const a = eyeCam(560, 640, 1.15, t), b = eyeCam(1660, 640, 1.2 + push * .35, t); let c = mix(a, b, turn); c.roll += (1 - sit) * -.32; c.cy += (1 - sit) * 120;
    view('wake', c, t, () => { person('mom', 1660, 640, 1.05, { face: 'smile', look: [-.4 + turn * .4, 0] }, t);
      lifeTag(1660, tagAbove(640, 1.05), MOM, t, { a: on(t, 2, .8) * seg(t, LT(2) + 1.2, LT(2) + 2.2), s: 1.15 }); });
    lids(ease(seg(t, .2, 1.6)) * (.4 + .6 * seg(t, LT(1), LT(1) + .8))); eyesBlur((1 - seg(t, .2, 2.8)) * .9); }],
  [8, (t, q) => { // breakfast: your little brother across the table; then a look down to the cat
    const toCat = on(t, 9, .9); const c = mix(eyeCam(1200, 600, 1.15, t), eyeCam(1980, 1050, 1.45, t), toCat);
    view('kitchen', c, t, () => { person('kid', 1200, 640, .82, { face: t > LT(9) ? 'happy' : 'smile', talk: false, look: [0, .2] }, t);
      lifeTag(1200, tagAbove(640, .82) + 20, { y: 72, m: 1, d: 19, sec: 51213 }, t, { a: on(t, 8, .8) }); cat(2100, 1250, .9, t, -1);
      lifeTag(2100, 1020, { y: 9, m: 0, d: 0, sec: 22000 }, t, { a: on(t, 10, .3), s: .9 }); }, { blur: toCat * .4 }); }],
  [11, (t, q) => { // you step outside: walking, everyone has a number
    const x0 = 900 + q * 260, c = eyeCam(x0, 640, 1.1, t, 12);
    view('street', c, t, () => { [['p1', 1500, 1, { y: 44, m: 2, d: 11, sec: 9000 }], ['p2', 2050, .9, { y: 12, m: 7, d: 3, sec: 30000 }], ['p3', 2600, 1, { y: 58, m: 0, d: 21, sec: 4000 }], ['f2', 3150, .95, { y: 27, m: 9, d: 2, sec: 60000 }]].forEach(([id, x, s, spec], i) => {
      person(id, x, 660, s, { face: 'neutral', look: [x < c.cx ? .5 : -.5, 0] }, t + i); lifeTag(x, tagAbove(660, s), spec, t, { a: on(t, 12, .6), s: .85 }); }); }); }],
  [13, (t, q) => { // the bus driver, the baker, a baby in a stroller
    const k1 = on(t, 14, .6), k2 = on(t, 15, .7), door = ease(seg(t, LT(13) - .4, LT(13) + .3));
    let c = eyeCam(1700, 560, 1.25, t); c = mix(c, eyeCam(3050, 620, 1.25, t), k1); c = mix(c, eyeCam(3700, 1000, 1.35, t), k2);
    view('street', c, t, () => { person('driver', 1890, 560, .7, { face: 'smile', look: [.3, 0] }, t); bus(1400, 1240, t, door);
      lifeTag(1890, tagAbove(560, .7) - 20, { y: 38, m: 5, d: 14, sec: 20000 }, t, { a: on(t, 13, .5), s: .9 });
      ctx.fillStyle = '#f4e8d0'; ctx.fillRect(2800, 700, 520, 120); ctx.fillStyle = '#7a3a2a'; ctx.font = '700 72px Fredoka'; ctx.textAlign = 'center'; ctx.fillText('BAKERY', 3060, 785);
      person('baker', 3050, 620, .95, { face: 'smile' }, t); lifeTag(3050, tagAbove(620, .95), { y: 19, m: 3, d: 8, sec: 7000 }, t, { a: on(t, 14, .4), s: .9 });
      stroller(3700, 1160, 1.05, t); lifeTag(3760, 880, { y: 84, m: 6, d: 2, sec: 80000 }, t, { a: on(t, 16, .5), s: 1 }); }); }],
  [17, (t, q) => { // wide: the whole street, numbers everywhere
    const c = eyeCam(2400, 700, .85 + q * .02, t); view('street', c, t, () => { for (let k = 0; k < 14; k++) { const x = 300 + k * 320, s = .55 + hash(k) * .2; person(['p1', 'p2', 'p3', 'f1', 'f2', 'f3', 'f4'][k % 7], x, 720, s, { face: 'neutral' }, t + k); lifeTag(x, tagAbove(720, s), { y: (hash(k + 2) * 80) | 0, m: (hash(k) * 11) | 0, d: (hash(k + 5) * 29) | 0, sec: 40000 }, t, { s: .6, a: seg(t, LT(17) + k * .1, LT(17) + k * .1 + .4) }); } });
    bigCenter('How long does everyone have left?', 150, 80, on(t, 17, .6) * (1 - seg(t, ET(17) + .1, ET(17) + .5))); }],
  [18, (t, q) => wbDraw(WB3.life.items, t - WB3.life.s0, [960, 590, 1])],
  [22, (t, q) => { // day one strange, day two worse
    const two = on(t, 23, .4); const c = shake(eyeCam(2000 + q * 120, 660, 1 + two * .12, t, 10, two * .04), two * 6, t);
    view('street', c, t, () => { for (let k = 0; k < 8; k++) { const x = 1100 + k * 330, s = .7; person(['p3', 'f1', 'p1', 'f3', 'p2', 'f4', 'f2', 'p3'][k], x, 680, s, { face: two ? 'worry' : 'neutral' }, t + k); lifeTag(x, tagAbove(680, s), { y: (hash(k + 9) * 70) | 0, m: 3, d: 4, sec: 5000 }, t, { s: .7, spin: two > .5 && k % 2 === 0 }); } });
    grade('80,20,40', two * .25); bigCenter(two > .5 ? 'DAY 2' : 'DAY 1', 170, 120, 1); }],
  [24, (t, q) => { // the park: an old man feeding pigeons; look up at his number; the zoom into it; you could walk away
    const look = on(t, 25, .7), zoom = ease(seg(t, LT(27), LT(28))), away = on(t, 28, .9) - on(t, 30, .6);
    let c = eyeCam(1700 + q * 90, 700, 1.05, t, 10); c = mix(c, eyeCam(2640, 660, 1.4, t), look); c = mix(c, { cx: 2640, cy: 470, z: 2.4, roll: 0 }, zoom); c = mix(c, eyeCam(1400, 760, 1.15, t), Math.max(0, away) * .8);
    view('park', c, t, () => { person('walter', 2640, 700, .62, { face: 'smile', look: [.4, .3], front: [[1, 1.0 + Math.sin(t * 2) * .2]] }, t);
      for (let k = 0; k < 6; k++) pigeon(2500 + k * 70 + Math.sin(t * .5 + k) * 10, 905 + (k % 2) * 14, .55, t, k);
      lifeTag(2640, tagAbove(700, .62) + 10, { sec: 360 - Math.max(0, t - LT(26)) }, 0, { a: on(t, 25, .5), s: .7, tick: 0 }); }); }],
  [30, (t, q) => { // you sit down next to Walter; pigeons at your feet; his number reaches zero
    const sitk = ease(seg(t, LT(30) - .1, LT(30) + 1.2)), up = on(t, 40, 1.8), fly = clamp((t - LT(40)) / 2.5, 0, 1);
    let c = eyeCam(1400, 560 - (1 - sitk) * 160, 1.1, t, 6 * (1 - sitk)); c = mix(c, { cx: 1300, cy: 300, z: 1.05, roll: 0 }, up * .7);
    const left = Math.max(0, (LT(38) + .9 - t) / (LT(38) + .9 - LT(30)) * 280);
    view('bench', c, t, () => {
      const closed = t > LT(38) + .9; person('walter', 1780, 600, 1.15, { face: closed ? 'happy' : (talking(t, 36) ? 'happy' : (t > LT(37) ? 'neutral' : 'smile')), talk: talking(t, 32, 33, 34, 35) && !closed, look: [-.7, .1], front: [[-1, .9 + Math.sin(t * 2) * .12]] }, t);
      const tg = 1 - seg(t, LT(39), LT(39) + 1.5); if (tg > 0) { lifeTag(1780, tagAbove(600, 1.15), { sec: left }, 0, { s: 1, tick: 0, a: tg }); if (closed) for (let k = 0; k < 14; k++) { const ph = clamp((t - LT(38) - .9) / 2, 0, 1); glowAt(1780 + Math.cos(k) * ph * 300, tagAbove(600, 1.15) - ph * 260 * hash(k), 18, (1 - ph) * .8); } }
      for (let k = 0; k < 7; k++) pigeon(800 + k * 190 + Math.sin(t * .4 + k) * 20, 1150 + (k % 3) * 40, 1, t, k, fly);
      ctx.fillStyle = '#e8d8a8'; for (let k = 0; k < 20; k++) { ctx.beginPath(); ctx.arc(900 + hash(k) * 1100, 1200 + hash(k + 3) * 120, 6, 0, 7); ctx.fill(); } });
    if (t > LT(31) - .1 && t < LT(38)) { const ph = clamp((t - LT(32)) / (LT(37) - LT(32)), 0, 1); ctx.globalAlpha = .9 * on(t, 33, .6) * (1 - seg(t, LT(36), LT(37))); ctx.font = '600 44px Fredoka'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff6e6'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(30,12,24,.6)'; ctx.strokeText('Ruth ♥', 520 + ph * 40, 260); ctx.fillText('Ruth ♥', 520 + ph * 40, 260); ctx.globalAlpha = 1; }
    if (t > LT(39) - .2) grade('255,190,120', on(t, 39, 1.2) * .12); }],
  [43, (t, q) => wbDraw(WB3.harvard.items, t - WB3.harvard.s0, [900, 560, 1])],
  [48, (t, q) => { // Friday: Leo jogs up, laughing at his phone; you look up: two hours
    const arrive = ease(seg(t, LT(49) - .2, LT(49) + 2.2)), up = on(t, 50, .6), drop = on(t, 55, .2);
    const s = lerp(.45, 1.15, arrive), lx = lerp(3700, 2650, arrive), bob = Math.abs(Math.sin(t * 9)) * 18 * (1 - arrive);
    let c = eyeCam(2650, 620, 1.12, t); c = mix(c, { cx: 2650, cy: tagAbove(620, 1.15) + 120, z: 1.5, roll: 0 }, up); c = shake(c, drop * 7, t);
    view('street', c, t, () => { person('leo', lx, 620 - bob + (1 - arrive) * 60, s, { face: during(t, 49) || t < LT(50) ? 'happy' : 'smile', talk: talking(t, 49), front: [[1, 2.2]] }, t);
      ctx.save(); ctx.translate(lx + 150 * s, 620 + 40 * s); ctx.rotate(-.2); ctx.fillStyle = '#1c1a22'; ctx.beginPath(); ctx.roundRect(-30 * s, -55 * s, 60 * s, 110 * s, 10 * s); ctx.fill(); ctx.fillStyle = '#7ac0ff'; ctx.fillRect(-24 * s, -48 * s, 48 * s, 92 * s); ctx.restore();
      lifeTag(lx, tagAbove(620, s), { sec: 7200 - Math.max(0, t - LT(51)) }, 0, { a: on(t, 51, .4), s: 1.05, tick: 0 }); });
    grade('40,10,30', drop * .22); }],
  [56, (t, q) => { // walking him home the long way
    const c = eyeCam(2200 + q * 200, 640, 1.15, t, 10, -.01); view('street', c, t, () => { const lx = c.cx + 330, s = 1.05;
      person('leo', lx, 650 + Math.abs(Math.sin(t * 4.5)) * -8, s, { face: t > LT(60) ? 'worry' : (t > LT(58) ? 'shock' : 'smile'), talk: talking(t, 58, 60), look: [-.8, 0], front: t > LT(58) && t < LT(60) ? [[1, 1.5]] : null }, t);
      lifeTag(lx, tagAbove(650, s), { sec: 6900 - (t - LT(56)) * 40 }, 0, { s: .95, tick: 0 }); });
    grade('60,20,50', .1); }],
  [61, (t, q) => { // the crosswalk: green light, Leo steps forward, you grab his hoodie; the truck
    const step = ease(seg(t, LT(64) - .1, LT(64) + .8)), grab = ease(seg(t, LT(65) - .1, LT(65) + .5)), tr = seg(t, LT(66) - .3, LT(66) + .5);
    let c = eyeCam(1200, 640, 1.1, t); c = shake(c, Math.max(0, 1 - Math.abs(t - LT(66) - .1) / .5) * 26 + on(t, 61, .3) * 2, t);
    view('crossing', c, t, () => { const green = t > LT(63) - .1; ctx.fillStyle = green ? '#3ae070' : '#ff4a3a'; ctx.beginPath(); ctx.arc(1890, green ? 500 : 340, 38, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; glowAt(1890, green ? 500 : 340, 90, .6); ctx.globalCompositeOperation = 'source-over';
      const s = lerp(1.25, .95, step) + grab * .3, ly = 640 + step * 60 - grab * 50;
      if (tr > 0 && tr < 1) { const tx2 = lerp(-1600, 4200, tr); ctx.globalAlpha = .35; truck(tx2 - 260, 1060, 1.25); ctx.globalAlpha = 1; truck(tx2, 1060, 1.25);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 8; for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.moveTo(tx2 - 900 - k * 60, 500 + k * 60); ctx.lineTo(tx2 - 1600 - k * 60, 500 + k * 60); ctx.stroke(); } }
      personBack('leo', 1200, ly, s);
      lifeTag(1200, tagAbove(ly, s) + 30, { sec: 360 - Math.max(0, t - LT(61)) }, 0, { s: .9, tick: 0 }); });
    if (grab > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); const hy = lerp(1350, 900, grab); ctx.save(); ctx.translate(1050, hy); ctx.rotate(-.25); spr(HANDB, 0, 0, 0, 1.15); ctx.restore(); }
    flash(t, LT(66) + .1, .12); }],
  [68, (t, q) => { // silence; he turns; the number spins, stops at 61 years; how did you know? the hug
    const hug = ease(seg(t, LT(76) - .1, LT(76) + 1.4)), shakeL = t > LT(73) - .1 && t < LT(76) ? 4 : 0;
    let c = eyeCam(1200, 620, 1.2 + hug * .8, t); c.cy -= on(t, 69, .6) * 60 - hug * 40; c.roll += hug * .08;
    view('crossing', c, t, () => { const spin = t > LT(70) - .1 && t < LT(71) + .3, s = 1.2;
      person('leo', 1200, 620, s, { face: t > LT(74) ? 'worry' : 'shock', shake: shakeL, talk: talking(t, 74), look: [0, 0] }, t);
      lifeTag(1200, tagAbove(620, s), spin ? {} : (t > LT(71) + .3 ? { y: 61, m: 2, d: 17, sec: 50000 } : { sec: 1 }), t - LT(71), { spin, s: 1.1, a: on(t, 69, .4) * (1 - hug) });
      if (t > LT(71) + .3 && t < LT(72) + 1) { ctx.globalCompositeOperation = 'lighter'; glowAt(1200, tagAbove(620, s), 260 * (1 - seg(t, LT(71) + .3, LT(72) + 1)), .8); ctx.globalCompositeOperation = 'source-over'; } }, { blur: .35 });
    grade('20,20,40', .3 * (1 - on(t, 70, 1.5))); if (during(t, 74)) bubble2(1560, 220, 'How did you know?', on(t, 74, .3)); eyesBlur(hug * .8); if (hug > 0) grade('255,200,150', hug * .2); }],
  [77, (t, q) => wbDraw(WB3.roads.items, t - WB3.roads.s0, [960, 580, 1])],
  [80, (t, q) => { // so the numbers can change: Leo's tag, alive again (quick insert)
    view('crossing', eyeCam(1200, 640, 1.3 + q * .05, t), t, () => { person('leo', 1200, 640, 1.1, { face: 'smile' }, t); lifeTag(1200, tagAbove(640, 1.1), { y: 61, m: 2, d: 17, sec: 50000 }, t, { s: 1.2 }); }, { blur: .3 }); }],
  [81, (t, q) => { // the mirror: a silhouette, no number; then it becomes you
    const look = ease(seg(t, LT(83) - .2, LT(84) + .5)), detail = ease(seg(t, LT(87), LT(90))), back = on(t, 89, 1.5);
    let c = eyeCam(1200, 680, 1.05 + q * .01, t); c = mix(c, { cx: 1200, cy: 470, z: 1.45, roll: 0 }, look * (1 - back)); c = mix(c, eyeCam(1200, 680, 1.2, t), back * .9);
    view('mirror', c, t, () => { ctx.save(); ctx.beginPath(); ctx.rect(670, 150, 1060, 1020); ctx.clip(); ctx.filter = `brightness(${.04 + detail * .96}) saturate(${detail})`; person('you', 1200, 640, 1.05, { face: detail > .6 ? 'neutral' : 'closed', look: [0, 0] }, t); ctx.filter = 'none';
      if (look > .5 && t < LT(87)) { const p = (t * 1.5) % 1; ctx.globalCompositeOperation = 'lighter'; glowAt(1200, 400, 30 + p * 60, (1 - p) * .25, true); ctx.globalCompositeOperation = 'source-over'; } ctx.restore(); });
    grade('10,10,30', .25 * (1 - detail)); }],
  [93, (t, q) => { // you text your mom: Love you; three hearts
    view('homeNight', eyeCam(1200, 700, 1.05, t), t, null, { blur: 1 });
    const typed = 'Love you'.slice(0, Math.floor(clamp((t - LT(94) + .3) / .8, 0, 1) * 8)), sent = t > LT(94) + .7, reply = t > LT(95) - .1;
    phoneInHand(W / 2, 560, 1.25, t, { c0: '#1a1a24', c1: '#24243a', draw: () => { ctx.fillStyle = '#2a2a3a'; ctx.fillRect(-134, -282, 268, 70); ctx.fillStyle = '#fff'; ctx.font = '700 34px Fredoka'; ctx.textAlign = 'center'; ctx.fillText('Mom ❤', 0, -236);
      if (sent) { ctx.fillStyle = '#3a8aff'; ctx.beginPath(); ctx.roundRect(-10, -170, 136, 56, 24); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '600 28px Fredoka'; ctx.fillText('Love you', 58, -134); }
      if (reply) { const p = ease(seg(t, LT(95) - .1, LT(95) + .3)); ctx.save(); ctx.translate(-60, -60); ctx.scale(p, p); ctx.fillStyle = '#3a3a4e'; ctx.beginPath(); ctx.roundRect(-64, -30, 128, 60, 24); ctx.fill(); ctx.font = '30px sans-serif'; ctx.fillText('❤️❤️❤️', 0, 12); ctx.restore(); }
      ctx.fillStyle = '#e8e8f0'; ctx.fillRect(-134, 120, 268, 122); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-120, 70, 200, 40, 18); ctx.fill(); ctx.fillStyle = '#222'; ctx.font = '500 24px Fredoka'; ctx.textAlign = 'left'; ctx.fillText(sent ? '' : typed + ((t * 2 % 1) < .5 ? '|' : ''), -108, 98);
      ctx.fillStyle = '#c8c8d4'; for (let r = 0; r < 3; r++) for (let k = 0; k < 9 - r; k++) { ctx.beginPath(); ctx.roundRect(-126 + r * 14 + k * 28.5, 132 + r * 34, 24, 28, 5); ctx.fill(); }
      const fk = Math.floor(t * 7) % 18; if (!sent && t > LT(94) - .4) { ctx.fillStyle = '#9a9ab0'; ctx.beginPath(); ctx.roundRect(-126 + (fk % 9) * 28.5, 132 + Math.floor(fk / 9) * 34, 24, 28, 5); ctx.fill(); } } });
    if (!sent && t > LT(94) - .4) { const fk = Math.floor(t * 7) % 9; ctx.save(); ctx.translate(W / 2 - 150 + fk * 36, 760 + Math.sin(t * 14) * 8); ctx.rotate(-.3); ctx.fillStyle = '#ebb08a'; ctx.beginPath(); ctx.roundRect(-30, -20, 60, 180, 30); ctx.fill(); ctx.restore(); }
    if (t > LT(96) - .1) { lifeTag(W / 2, 140, MOM, t, { a: on(t, 96, .6) * .9, s: .9 }); } }],
  [98, (t, q) => wbDraw(WB3.real.items, t - WB3.real.s0, [960, 560, 1])],
  [104, (t, q) => { // the mirror again: this time YOUR number. Then: what if you could pause time? It stops.
    const frozen = t > LT(105) + .6, c = eyeCam(1200, 640, 1.25 + (frozen ? 0 : q * .03), t);
    view('mirror', c, t, () => { ctx.save(); ctx.beginPath(); ctx.rect(670, 150, 1060, 1020); ctx.clip(); person('you', 1200, 640, 1.05, { face: frozen ? 'shock' : 'neutral' }, frozen ? LT(105) + .6 : t); ctx.restore();
      lifeTag(1200, tagAbove(640, 1.05), { y: 58, m: 7, d: 23, sec: 30000 }, frozen ? LT(105) + .6 : t, { a: on(t, 104, .8), s: 1.1, frozen }); });
    if (frozen) { grade('80,140,255', .12); ctx.strokeStyle = 'rgba(200,225,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, 600 + (t * 120 % 200), 0, 7); ctx.stroke(); }
    if (t > LT(106) - .1) { ctx.save(); ctx.globalAlpha = on(t, 106, .5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const [x, l, col] of [[W / 2 - 240, '♥  LIKE', '#d9534f'], [W / 2 + 240, 'SUBSCRIBE', '#c0392b']]) { const s = 1 + .05 * Math.sin(t * 4 + x); ctx.save(); ctx.translate(x, 860); ctx.scale(s, s); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-200, -55, 400, 110, 55); ctx.fill(); ctx.font = '700 54px Fredoka'; ctx.fillStyle = '#fff8ec'; ctx.fillText(l, 0, 4); ctx.restore(); } ctx.restore(); } }],
];
let DUR3 = 243.12;
function render3(t) {
  let i = 0; while (i < SHOTS3.length - 1 && t >= LT(SHOTS3[i + 1][0]) - .1) i++;
  const s0 = i === 0 ? 0 : LT(SHOTS3[i][0]) - .1, s1 = i < SHOTS3.length - 1 ? LT(SHOTS3[i + 1][0]) - .1 : DUR3;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  SHOTS3[i][1](t, t - s0);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = .55; ctx.drawImage(S.tex, 0, 0); ctx.globalAlpha = 1;
  cap2(t);
  const k = Math.min(seg(t, s0, s0 + .12), 1 - seg(t, s1 - .1, s1), seg(t, 0, .3), 1 - seg(t, DUR3 - .8, DUR3));
  if (k < 1) { ctx.fillStyle = `rgba(14,6,14,${1 - k})`; ctx.fillRect(0, 0, W, H); }
  window.FACES = []; window.SCENE = 'shot' + SHOTS3[i][0]; }
window.render = render3;
fetch('timing_countdown.json').then(r => r.json()).then(async tm => { TIM2 = tm; await document.fonts.load('700 40px Fredoka'); await document.fonts.load('600 40px Fredoka');
  buildStatic(); buildRoom(); buildBoard(); buildHands(); buildBoards3(); window.DUR = DUR3;
  const q = new URLSearchParams(location.search), from = +(q.get('from') || 0), to = +(q.get('to') || DUR3);
  for (let tt = from; tt < Math.min(to, from + 30); tt += 2) render3(tt);
  render3(from); window.READY = true; });
