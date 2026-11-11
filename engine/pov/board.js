// Whiteboard explainer cut: marker strokes drawn on in sync with the narrator, a marker tip following the line.
// Everything is data: strokes are point lists with a start time and duration (seconds into the board cut).
let BOARD;
const INK = '#23262e', RED = '#d6463c', BLUE = '#2f6fb8';
function buildBoard() {
  BOARD = gouache('board', W, H, a => {
    a.fillStyle = lin(a, 0, 0, W, H, [[0, '#f6f2ea'], [1, '#ebe5da']]); a.fillRect(0, 0, W, H);
    a.strokeStyle = 'rgba(150,158,175,.05)'; a.lineWidth = 40; a.lineCap = 'round';   // ghosts of old, erased writing
    for (let i = 0; i < 9; i++) { a.beginPath(); a.moveTo(200 + hash(i) * 1400, 150 + hash(i + 4) * 700); a.quadraticCurveTo(500 + hash(i + 1) * 900, 200 + hash(i + 2) * 600, 300 + hash(i + 3) * 1400, 200 + hash(i + 5) * 700); a.stroke(); }
    a.fillStyle = '#b8bcc4'; a.fillRect(0, 0, W, 22); a.fillRect(0, H - 22, W, 22); a.fillStyle = '#9aa0aa'; a.fillRect(0, 18, W, 4); a.fillRect(0, H - 22, W, 4);
  }, { size: 14, crisp: .6, soft: 4, angle: () => .05 });
  BOARD.strokes = buildStrokes();
}
// hand-made wobble so lines look drawn, not vector-perfect (deterministic)
function wob(pts, amp = 2.2, sd = 1) { return pts.map(([x, y], i) => [x + (hash(i * 1.7 + sd) - .5) * amp, y + (hash(i * 2.3 + sd * 3) - .5) * amp]); }
function spline(ctrl, per = 10) { const out = []; for (let i = 0; i < ctrl.length - 1; i++) { const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
  for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } }
  out.push(ctrl[ctrl.length - 1]); return out; }
const circ = (cx, cy, r, n = 28, a0 = -1.6, turns = 1.05) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + i / n * 6.283 * turns; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y - 2]];
const S_ = (pts, t0, dur, col = INK, w = 7) => ({ pts: wob(pts, 2.4, t0 * 7), t0, dur, col, w });

const HEAD = [880, 520];  // centre of the drawn head (board space)
function icon(kind, x, y, t0) { const d = .22, IS = 1.55; const S_ = (pts, t0, dur, col, w) => ({ pts: wob(pts.map(([px, py]) => [x + (px - x) * IS, y + (py - y) * IS]), 2.4, t0 * 7), t0, dur, col: col || INK, w: (w || 7) * 1.2 });
  switch (kind) {
    case 'key': return [S_(circ(x - 16, y, 12, 16), t0, d * .5, BLUE, 6), S_([[x - 4, y], [x + 26, y], [x + 26, y + 10], [x + 18, y], [x + 18, y + 8]], t0 + d * .5, d * .5, BLUE, 6)];
    case 'phone': return [S_(box(x - 14, y - 22, 28, 44), t0, d, INK, 6), S_([[x - 4, y + 16], [x + 4, y + 16]], t0 + d, .05, INK, 5)];
    case 'cup': return [S_([[x - 18, y - 16], [x - 14, y + 18], [x + 14, y + 18], [x + 18, y - 16]], t0, d * .6, RED, 6), S_(circ(x + 22, y, 9, 12, -1.6, .55), t0 + d * .6, d * .4, RED, 6)];
    case 'book': return [S_(box(x - 24, y - 16, 48, 32), t0, d * .7, BLUE, 6), S_([[x, y - 16], [x, y + 16]], t0 + d * .7, d * .3, BLUE, 6)];
    case 'star': { const p = []; for (let i = 0; i <= 10; i++) { const r = i % 2 ? 9 : 22, a = -Math.PI / 2 + i * Math.PI / 5; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return [S_(p, t0, d, RED, 5)]; }
    case 'note': return [S_(circ(x - 8, y + 14, 8, 12), t0, d * .4, INK, 6), S_([[x, y + 14], [x, y - 20], [x + 16, y - 12]], t0 + d * .4, d * .6, INK, 6)];
    case 'apple': return [S_(circ(x, y + 4, 18, 20), t0, d * .7, RED, 6), S_([[x, y - 14], [x + 4, y - 26]], t0 + d * .7, d * .3, INK, 5)];
  } }
function buildStrokes() {
  const [hx, hy] = HEAD, st = [];
  // the head in profile (facing right)
  const head = [[-120, 260], [-150, 150], [-172, 30], [-150, -90], [-90, -175], [20, -210], [120, -170], [168, -95], [178, -40], [214, 6], [176, 34], [186, 66], [168, 92], [160, 126], [96, 160], [84, 262]].map(([x, y]) => [hx + x, hy + y]);
  st.push(S_(spline(head, 8), .25, 1.05, INK, 8));
  // four things: drawn while he says "four things in mind at once" (board time 0.05 .. 2.2)
  const slots = [[-80, -100], [40, -130], [110, -40], [-100, 10], [10, -25], [75, 60], [-30, 85]].map(([x, y]) => [hx + x, hy + y]);
  ['key', 'phone', 'cup', 'book'].forEach((k, i) => st.push(...icon(k, ...slots[i], 1.1 + i * .26)));
  // "Maybe seven" (2.61 .. 3.19): three more squeezed in
  ['star', 'note', 'apple'].forEach((k, i) => st.push(...icon(k, ...slots[4 + i], 2.6 + i * .2)));
  // scientists arguing (3.53 .. 5.09)
  for (const [sx, c] of [[1380, BLUE], [1640, RED]]) { const y = 700;
    st.push(S_(circ(sx, y - 90, 26, 18), 3.5 + (sx > 1500 ? .25 : 0), .2, INK, 6));
    st.push(S_([[sx, y - 64], [sx, y + 20]], 3.7 + (sx > 1500 ? .25 : 0), .12, INK, 6));
    st.push(S_([[sx - 34, y + 90], [sx, y + 20], [sx + 34, y + 90]], 3.82 + (sx > 1500 ? .25 : 0), .14, INK, 6));
    st.push(S_([[sx - 40, y - 20], [sx, y - 44], [sx + 40, y - 20]], 3.96 + (sx > 1500 ? .25 : 0), .12, c, 6)); }
  // "That's tiny" (5.49 .. 6.05): a red circle around the whole head, then the zoom-out happens
  st.push(S_(circ(hx + 10, hy + 10, 300, 40, -2.2, 1.08), 5.2, .35, RED, 9));
  return st;
}
function drawStroke(s, b) { const f = clamp((b - s.t0) / s.dur, 0, 1); if (f <= 0) return null;
  const P = s.pts, n = Math.max(2, Math.ceil(f * (P.length - 1)) + 1); ctx.strokeStyle = s.col; ctx.lineWidth = s.w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.stroke();
  ctx.globalAlpha = .25; ctx.lineWidth = s.w * .45; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(P[0][0] + 1.5, P[0][1] - 1.5); for (let i = 1; i < n; i++) ctx.lineTo(P[i][0] + 1.5, P[i][1] - 1.5); ctx.stroke(); ctx.globalAlpha = 1;
  return f < 1 ? { p: P[n - 1], col: s.col } : null; }
function writeText(str, x, y, size, col, b, t0, dur, align = 'center') { const f = clamp((b - t0) / dur, 0, 1); if (f <= 0) return null;
  ctx.font = `700 ${size}px Fredoka`; ctx.textAlign = align; ctx.textBaseline = 'middle'; const w = ctx.measureText(str).width, x0 = align === 'center' ? x - w / 2 : x;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10, y - size, (w + 20) * f, size * 2); ctx.clip(); ctx.fillStyle = col; ctx.fillText(str, x, y); ctx.restore();
  return f < 1 ? { p: [x0 + w * f, y + size * .2], col } : null; }
function marker(tip, b) { if (!tip) return; const [x, y] = tip.p; ctx.save(); ctx.translate(x, y); ctx.rotate(-.55 + Math.sin(b * 20) * .03);
  ctx.fillStyle = 'rgba(40,30,30,.18)'; ctx.beginPath(); ctx.ellipse(40, 120, 30, 120, 0, 0, 7); ctx.fill();
  ctx.fillStyle = tip.col; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, -6); ctx.lineTo(12, 30); ctx.lineTo(-12, 30); ctx.fill();
  ctx.fillStyle = '#f2f2f0'; ctx.beginPath(); ctx.roundRect(-20, 28, 40, 200, 10); ctx.fill(); ctx.fillStyle = tip.col; ctx.fillRect(-20, 70, 40, 34);
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 3; ctx.strokeRect(-20, 28, 40, 200); ctx.restore(); }

// b = seconds since the cut to the board
function board(b) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(BOARD.c, 0, 0, W, H);
  // board camera: gentle drift, a punch-in on "Maybe seven", then the zoom-out on "That's tiny"
  const zIn = ease(seg(b, 2.5, 2.9)) * .12 - ease(seg(b, 3.3, 3.7)) * .12, tiny = ease(seg(b, 5.5, 5.8));
  const z = (1.12 + b * .01 + zIn) * lerp(1, .42, tiny), [fx, fy] = HEAD;
  const ccx = lerp(1180, fx, tiny), ccy = lerp(540, fy, tiny); ctx.setTransform(z, 0, 0, z, W / 2 - ccx * z, H / 2 - ccy * z);
  let tip = null;
  for (const s of BOARD.strokes) { const r = drawStroke(s, b); if (r) tip = r; }
  // big numbers + labels, written in time with the voice
  const t1 = writeText('4', 1430, 300, 190, INK, b, .9, .35); if (t1) tip = t1;
  const t2 = writeText('...or 7?', 1530, 330, 90, RED, b, 2.65, .45, 'left'); if (t2) tip = t2;
  if (b > 4.1) { const bob = i => Math.abs(Math.sin((b - 4.1) * 7 + i * Math.PI / 2)) * 10, al = clamp((b - 4.1) / .2, 0, 1);
    ctx.globalAlpha = al; for (const [x, txt, c, i] of [[1340, '4!', BLUE, 0], [1690, '7!', RED, 1]]) { ctx.save(); ctx.translate(x, 520 - bob(i));
      ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.fillStyle = '#fbf8f2'; ctx.beginPath(); ctx.roundRect(-56, -40, 112, 80, 30); ctx.fill(); ctx.stroke();
      ctx.font = '700 54px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c; ctx.fillText(txt, 0, 2); ctx.restore(); } ctx.globalAlpha = 1; }
  const t3 = writeText('tiny.', HEAD[0] + 360, HEAD[1] + 230, 120, RED, b, 5.62, .2, 'left'); if (t3) tip = t3;
  marker(tip, b);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = .5; ctx.drawImage(S.tex, 0, 0); ctx.globalAlpha = 1;
}
