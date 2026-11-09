// Film player: reads scenes.json + timing.json and renders any time t.
// Scene starts, beats and fx are keyed to LINE indices of the voice timing, so re-timing to a new voice is automatic.
let FILM, TIM, SC = [];
const lineT = (i, end) => { const l = TIM[clamp(i | 0, 0, TIM.length - 1)]; return end ? l.t1 : l.t0; };
const at = v => typeof v === 'number' ? lineT(v) - .12 : (v.end !== undefined ? lineT(v.end, 1) : lineT(v.line) - .12 + (v.off || 0));

function prepare() {
  SC = FILM.scenes.map((s, i) => ({ ...s, start: i === 0 ? 0 : at(s.from) }));
  SC.forEach((s, i) => s.end = i < SC.length - 1 ? SC[i + 1].start : FILM.dur);
}
function sceneAt(t) { let i = 0; while (i < SC.length - 1 && t >= SC[i + 1].start) i++; return SC[i]; }
function lineAt(t) { let i = -1; for (let k = 0; k < TIM.length; k++) if (TIM[k].t0 - .12 <= t) i = k; return i; }

// cast state at time t: base entry + every beat whose line has started
function castState(s, e, t, L) {
  const o = { ...e };
  for (const b of s.beats || []) if (b.who === e.who && L >= b.line) Object.assign(o, b.set);
  if (o.path) { const u = seg(t, s.start, s.end); let i = 0; while (i < o.path.length - 2 && u > o.path[i + 1][0]) i++;
    const a = o.path[i], b = o.path[i + 1] || a; o.x = lerp(a[1], b[1], b === a ? 0 : clamp((u - a[0]) / (b[0] - a[0]), 0, 1)); }
  if (o.talk) o.talk = o.talk.includes(L) && t < TIM[L].t1 + .05;
  return o;
}

function render(t) {
  const s = sceneAt(t), set = setGet(s.set), u = seg(t, s.start, s.end), L = lineAt(t), lt = t - s.start;
  const c = camAt(s.cam, u); const FACES = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  for (const ly of set.layers) {
    if (ly.scroll && s.scroll) { const off = (lt * s.scroll * ly.scroll) % W; layerX(ly.img, c, ly.p, -off); layerX(ly.img, c, ly.p, W - off); }
    else layer(ly.img, c, ly.p);
  }
  worldT(c);
  if (set.pots) [[760, 905, 0], [905, 912, 1], [1050, 905, 2]].forEach(([x, y, i]) => spr(set.pots[i], x, y, Math.sin(t * 1.6 + i * 1.3) * .025, .9));
  runFx(s, t, L, c, 'back');
  const states = (s.cast || []).map(e => castState(s, e, t, L));
  for (const o of states) if (!o.over && !o.hide) FACES.push(drawChar(castGet(o.who), o.x, o.y, o, t));
  if (set.front) { worldT(c); ctx.drawImage(set.front.c, 0, 0, W, H); }
  worldT(c);
  for (const o of states) if (o.over && !o.hide) FACES.push(drawChar(castGet(o.who), o.x, o.y, o, t));
  runFx(s, t, L, c, 'front');
  // dust motes
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 36; k++) { const x = (hash(k) * W + t * 12 * (1 + hash(k + 3))) % W, y = 200 + hash(k * 2) * 700 + Math.sin(t + k) * 12; glowAt(x, y, 6, .3, set.night); }
  ctx.globalCompositeOperation = 'source-over';
  // light (screen space)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const lg = set.light, pp = lg.sunPar || .85, sp = toScreenP(c, lg.x, lg.y, pp);
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 1100); g.addColorStop(0, `rgba(${lg.col},${lg.a})`); g.addColorStop(1, `rgba(${lg.col},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (lg.rays) { ctx.globalAlpha = .05; ctx.fillStyle = `rgb(${lg.col})`;
    for (let k = 0; k < 6; k++) { const a = Math.PI + .25 + k * .14 + Math.sin(t * .3 + k) * .02; ctx.beginPath(); ctx.moveTo(sp[0], sp[1]); ctx.lineTo(sp[0] + Math.cos(a) * 2600, sp[1] + Math.sin(a) * 2600); ctx.lineTo(sp[0] + Math.cos(a + .05) * 2600, sp[1] + Math.sin(a + .05) * 2600); ctx.fill(); } }
  if (lg.spot) { const [bx, by] = toScreen(c, lg.spot[0], lg.spot[1]), [tx] = toScreen(c, lg.spot[0], 0); ctx.globalAlpha = .13; ctx.fillStyle = '#fff2d0';
    ctx.beginPath(); ctx.moveTo(tx - 60, -20); ctx.lineTo(tx + 60, -20); ctx.lineTo(bx + 330 * c[2], by); ctx.lineTo(bx - 330 * c[2], by); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (set.grade) { ctx.fillStyle = set.grade; ctx.fillRect(0, 0, W, H); }
  for (const d of s.dim || []) { const a = d.a * seg(t, at(d.from), at(d.from) + (d.ramp || 1.5)); if (a > 0) { ctx.fillStyle = `rgba(${d.col || '20,10,40'},${a})`; ctx.fillRect(0, 0, W, H); } }
  ctx.drawImage(S.tex, 0, 0);
  runFx(s, t, L, c, 'screen');
  captions(t);
  const k = Math.min(seg(t, s.start, s.start + .18), 1 - seg(t, s.end - .14, s.end), seg(t, 0, .3), 1 - seg(t, FILM.dur - .8, FILM.dur));
  if (k < 1) { ctx.fillStyle = `rgba(20,8,20,${1 - k})`; ctx.fillRect(0, 0, W, H); }
  window.FACES = FACES; window.SCENE = s.id;
}
function layerX(img, c, p, dx) { const z = 1 + (c[2] - 1) * p, cx = W / 2 + (c[0] - W / 2) * p, cy = H / 2 + (c[1] - H / 2) * p;
  ctx.setTransform(z, 0, 0, z, W / 2 - cx * z + dx * z, H / 2 - cy * z); ctx.drawImage(img.c, 0, 0, img.w, img.h); }
function toScreenP(c, x, y, p) { const z = 1 + (c[2] - 1) * p, cx = W / 2 + (c[0] - W / 2) * p, cy = H / 2 + (c[1] - H / 2) * p; return [W / 2 + (x - cx) * z, H / 2 + (y - cy) * z]; }

function captions(t) {
  const L = lineAt(t); if (L < 0) return; const l = TIM[L], nx = TIM[L + 1];
  const end = Math.min(nx ? nx.t0 - .12 : FILM.dur, l.t1 + .7); if (t > end) return;
  const al = Math.min(seg(t, l.t0 - .12, l.t0 + .08), 1 - seg(t, end - .15, end));
  ctx.font = '600 46px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = wrap(l.text, 1500); ctx.globalAlpha = al; ctx.lineJoin = 'round';
  lines.forEach((s, i) => { const y = H - 70 - (lines.length - 1 - i) * 58; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(30,12,24,.75)'; ctx.strokeText(s, W / 2, y); ctx.fillStyle = '#fff6e6'; ctx.fillText(s, W / 2, y); });
  ctx.globalAlpha = 1;
}

// ---------- fx ----------
let CARD;
function runFx(s, t, L, c, layerName) {
  for (const f of s.fx || []) {
    const lay = f.layer || ({ title: 'screen', endcard: 'screen', fact: 'front', bubble: 'front' }[f.type] || 'front'); if (lay !== layerName) continue;
    const t0 = f.from !== undefined ? at(f.from) : s.start, t1 = f.to !== undefined ? at(f.to) : s.end; if (t < t0 || t > t1 + (f.tail || 0)) continue;
    const q = t - t0, out = 1 - seg(t, t1 - .4, t1 + (f.tail || 0)), inn = seg(t, t0, t0 + (f.fadeIn ?? .6)), A = Math.min(out, inn);
    if (layerName !== 'screen') worldT(c); else ctx.setTransform(1, 0, 0, 1, 0, 0);
    FX[f.type](f, t, q, A, c);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
const FX = {
  pages(f, t, q, A) { // glowing pages orbiting a point (the memory motif)
    const n = f.n || 14, R0 = f.r || 170;
    for (let k = 0; k < n; k++) { const sp = (f.speed || .5) * (1 + hash(k) * .6) * (f.chaos ? 2.2 : 1), an = k / n * 6.283 + t * sp + (f.chaos ? Math.sin(t * 3 + k) * .8 : 0);
      const rr = R0 * (.7 + hash(k + 7) * .5) * (f.grow ? clamp(q / 2, .2, 1) : 1), x = f.x + Math.cos(an) * rr * 1.25, y = f.y + Math.sin(an) * rr * .7 + Math.sin(t * 1.4 + k) * 14;
      const a = A * (f.chaos ? .7 + .3 * Math.sin(t * 7 + k) : 1);
      ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 46, .45 * a, f.blue); ctx.globalCompositeOperation = 'source-over';
      page(x, y, Math.sin(t * 2 + k) * .5, f.s || .9, a, f.tint); }
  },
  stream(f, t, q, A) { // notes or books that fly from (x0,y0) and turn into glowing pages at (x1,y1)
    const n = f.n || 18, gap = f.gap || .35, life = f.life || 2.6;
    for (let k = 0; k < n * 4; k++) { const st = k * gap; if (q < st) break; const p0 = (q - st) / life; if (p0 > 1.4) continue;
      const p = ease(Math.min(p0, 1)), x1 = f.x1 + Math.cos(k * 2.1 + t) * (f.spread ?? 90), y1 = f.y1 + Math.sin(k * 1.7 + t * .8) * (f.spread ?? 90) * .6;
      const x = lerp(f.x0, x1, p) + Math.sin(p0 * 6 + k) * 24, y = lerp(f.y0, y1, p) - Math.sin(p * Math.PI) * (f.arc ?? 200);
      const a = A * (p0 > 1 ? 1 - (p0 - 1) / .4 : 1);
      ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 46, .5 * a, f.blue); ctx.globalCompositeOperation = 'source-over';
      if (f.kind === 'note') { if (p < .5) note(x, y, 1, a * (1 - p * 2)); page(x, y, Math.sin(t * 2 + k) * .5, .9, a * clamp(p * 2 - .6, 0, 1)); }
      else if (f.kind === 'book') { book(x, y, Math.sin(t * 3 + k) * .4, 1 - p * .6, a, k); }
      else if (f.kind === 'letter') { letter(x, y, Math.sin(t * 2 + k) * .5, a); }
      else page(x, y, Math.sin(t * 2 + k) * .5, .9, a, f.tint); }
  },
  orbs(f, t, q, A, c) { // items held in mind
    const L = lineAt(t), n = f.steps ? f.steps.reduce((m, [l, v]) => L >= l ? v : m, f.n) : f.n, shrink = f.shrinkAt !== undefined && L >= f.shrinkAt ? .55 : 1;
    for (let k = 0; k < n; k++) { const an = k / n * 6.283 + t * .5, x = f.x + Math.cos(an) * 150 * shrink, y = f.y + Math.sin(an) * 70 * shrink - 20;
      ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 60 * shrink, .8 * A, k % 2); ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = A; ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.arc(x, y, 12 * shrink, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  },
  fact(f, t, q, A) { // painted paper note (fact beat)
    if (!CARD) CARD = painted('card', 520, 260, a => { a.fillStyle = '#f6e6c4'; a.beginPath(); a.moveTo(14, 10); a.lineTo(510, 4); a.lineTo(504, 250); a.lineTo(6, 254); a.fill(); }, { clip: true, size: 8, jitter: 18, angle: () => 0, spread: .3 });
    const drop = 1 - ease(Math.min(q / .7, 1)), w = f.w || 520, h = f.h || 260;
    ctx.save(); ctx.globalAlpha = A; ctx.translate(f.x, f.y - drop * 60); ctx.rotate((f.rot ?? -.03) + drop * .2); ctx.scale(f.s || 1, f.s || 1);
    ctx.shadowColor = 'rgba(20,8,20,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.drawImage(CARD.c, -w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#c94a4a'; ctx.beginPath(); ctx.arc(0, -h / 2 + 18, 10, 0, 7); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#3a2430';
    const lines = f.text.split('\n'), big = f.big || 58, top = f.curve ? -78 : (lines.length > 1 ? -30 - (lines.length - 2) * 20 : 6);
    lines.forEach((s, i) => { ctx.font = `${i === 0 ? 700 : 500} ${i === 0 ? big : 34}px Fredoka`; ctx.fillText(s, 0, i === 0 ? top : top + 22 + i * 40); });
    if (f.curve) { ctx.strokeStyle = '#c94a4a'; ctx.lineWidth = 5; ctx.beginPath(); for (let x = 0; x <= 1.0001; x += .05) { const px = -200 + x * 400, py = 100 - 70 * Math.exp(-x * 5) - 10; x ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
    if (f.cross) { ctx.strokeStyle = 'rgba(200,50,50,.85)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; const k2 = seg(q, .5, 1); ctx.beginPath(); ctx.moveTo(-180, -90); ctx.lineTo(-180 + 360 * k2, -90 + 180 * k2); ctx.stroke(); }
    ctx.restore();
  },
  bubble(f, t, q, A) { ctx.save(); ctx.globalAlpha = A; ctx.translate(f.x, f.y - (1 - ease(Math.min(q / .4, 1))) * 20); ctx.font = '600 40px Fredoka'; const w = ctx.measureText(f.text).width + 60;
    ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.roundRect(-w / 2, -40, w, 80, 34); ctx.fill(); ctx.beginPath(); ctx.moveTo(f.tail === 'right' ? 10 : -30, 36); ctx.lineTo(f.tail === 'right' ? 50 : -50, 80); ctx.lineTo(f.tail === 'right' ? 34 : -6, 36); ctx.fill();
    ctx.fillStyle = '#3a2430'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f.text, 0, 2); ctx.restore(); },
  title(f, t, q, A) { ctx.save(); ctx.globalAlpha = A; ctx.font = `700 ${f.size || 76}px Fredoka`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = f.text.split('\n'); lines.forEach((s, i) => { const y = (f.y || 170) + i * (f.size || 76) * 1.15 + (1 - ease(Math.min(q, 1))) * 20;
      ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,16,40,.7)'; ctx.strokeText(s, W / 2, y); ctx.shadowColor = 'rgba(255,200,120,.9)'; ctx.shadowBlur = 30; ctx.fillStyle = '#ffeec8'; ctx.fillText(s, W / 2, y); ctx.shadowBlur = 0; }); ctx.restore(); },
  timer(f, t) { const L = lineAt(t); let sec = 180; if (L >= 80) sec = Math.max(0, 30 - (t - at(80)) * 1.2); else if (L >= 79) sec = 180 - (t - at(79)) * 2;
    const m = Math.floor(sec / 60), ss = Math.floor(sec % 60); ctx.save(); ctx.translate(f.x, f.y); ctx.fillStyle = '#140c1c'; ctx.beginPath(); ctx.roundRect(-110, -46, 220, 92, 14); ctx.fill();
    ctx.font = '700 64px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = sec <= 30 ? '#ff6a5a' : '#7aff9a'; ctx.fillText(`${m}:${String(ss).padStart(2, '0')}`, 0, 4); ctx.restore(); },
  buzz(f, t, q, A) { ctx.save(); ctx.strokeStyle = `rgba(150,210,255,${A * .9})`; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const r = 30 + k * 22 + (t * 60 % 22); ctx.beginPath(); ctx.arc(f.x, f.y, r, -.7, .7); ctx.stroke(); ctx.beginPath(); ctx.arc(f.x, f.y, r, Math.PI - .7, Math.PI + .7); ctx.stroke(); } ctx.restore(); },
  ghost(f, t, q, A) { const ch = castGet(f.who); ctx.save(); ctx.globalAlpha = A * (.35 + .15 * Math.sin(t * 5)); ctx.translate(f.x + Math.sin(t * 3) * 10, f.y);
    ctx.scale(f.facing === 'left' ? -f.s : f.s, f.s); ctx.filter = 'hue-rotate(180deg) saturate(.6) brightness(1.1)'; spr(ch.P.head, 0, 0, Math.sin(t * 2) * .1); ctx.filter = 'none'; ctx.restore(); },
  glowHead(f, t, q, A) { ctx.globalCompositeOperation = 'lighter'; glowAt(f.x, f.y, (f.r || 160) * (1 + .12 * Math.sin(t * (f.pulse || 3))), A * (f.a || .6), f.blue); ctx.globalCompositeOperation = 'source-over'; },
  blanket(f, t, q, A, c) { worldT(c); ctx.drawImage(setGet('hospital').blanket.c, 0, 0, W, H); },
  hand(f, t, q, A) { ctx.globalAlpha = A; ctx.fillStyle = CAST_DEF[f.who].skin; ctx.beginPath(); ctx.ellipse(f.x, f.y, 20, 15, .3, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(60,30,40,.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; },
  endcard(f, t, q, A) { ctx.save(); ctx.globalAlpha = A; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const pill = (x, label, col) => { const s = 1 + .05 * Math.sin(t * 4 + x); ctx.save(); ctx.translate(x, 250); ctx.scale(s, s); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-190, -50, 380, 100, 50); ctx.fill(); ctx.font = '700 50px Fredoka'; ctx.fillStyle = '#fff8ec'; ctx.fillText(label, 0, 4); ctx.restore(); };
    pill(W / 2 - 230, '♥  LIKE', '#d9534f'); pill(W / 2 + 230, 'SUBSCRIBE', '#c0392b'); ctx.restore(); },
};
function book(x, y, r, s, a, k) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s); ctx.fillStyle = ['#8a3a3a', '#3a5a8a', '#8a6a2a', '#3a7a5a', '#6a3a7a'][k % 5];
  ctx.fillRect(-26, -18, 52, 36); ctx.fillStyle = '#fff4d6'; ctx.fillRect(-22, -14, 48, 6); ctx.fillStyle = '#e8c060'; ctx.fillRect(-26, -2, 52, 4); ctx.restore(); }
function letter(x, y, r, a) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = '#fff4e0'; ctx.fillRect(-30, -20, 60, 40);
  ctx.strokeStyle = '#b08a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30, -20); ctx.lineTo(0, 4); ctx.lineTo(30, -20); ctx.stroke(); ctx.fillStyle = '#c94a4a'; ctx.beginPath(); ctx.arc(0, 4, 6, 0, 7); ctx.fill(); ctx.restore(); }

window.render = render;
Promise.all([fetch('scenes.json').then(r => r.json()), fetch('timing.json').then(r => r.json()), document.fonts.load('600 46px Fredoka'), document.fonts.load('700 46px Fredoka')])
  .then(([f, tm]) => { FILM = f; TIM = tm; window.DUR = f.dur; prepare(); buildStatic();
    const q = new URLSearchParams(location.search); const from = +(q.get('from') || 0), to = +(q.get('to') || f.dur);
    for (const s of SC) if (s.end > from && s.start < to) { setGet(s.set); for (const e of s.cast || []) castGet(e.who); for (const fx of s.fx || []) if (fx.type === 'ghost') castGet(fx.who); }
    render(from); window.READY = true; });
