// Shared POV helpers (copied from film2/shots.js so film2 stays untouched): camera view, line timing, captions, grades.
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

function cap2(t) { let i = -1; for (let k = 0; k < TIM2.length; k++) if (TIM2[k].t0 - .12 <= t) i = k; if (i < 0) return; const l = TIM2[i], nx = TIM2[i + 1];
  const end = Math.min(nx ? nx.t0 - .12 : 1e9, l.t1 + .7); if (t > end) return; ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = Math.min(seg(t, l.t0 - .12, l.t0 + .08), 1 - seg(t, end - .15, end)); ctx.font = '600 50px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const lines = wrap(l.text, 1500); lines.forEach((s, k) => { const y = H - 80 - (lines.length - 1 - k) * 60; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(30,12,24,.75)'; ctx.strokeText(s, W / 2, y); ctx.fillStyle = '#fff6e6'; ctx.fillText(s, W / 2, y); }); ctx.globalAlpha = 1; }
