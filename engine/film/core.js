// Core of the painted storybook engine: the brush painter, camera, light, text.
// Everything heavy is painted ONCE (lazily, the first time a set or character is needed); frames only move it.
const W = 1920, H = 1080, R = 1.5;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const seedFrom = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); seed = (Math.abs(h) % 2147483646) + 1; };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const ease = x => { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

// flat drawing -> oriented brush dabs sampled from it (same painter as the approved balcony test)
// o.rim: [r,g,b] rim colour, o.shade: shadow tint; both default to golden hour
function painted(name, w, h, draw, o = {}) {
  seedFrom(name);
  const A = document.createElement('canvas'); A.width = Math.ceil(w * R); A.height = Math.ceil(h * R);
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
    const rim = o.rim || [255, 214, 140], sh = o.shade || [70, 25, 70];
    b.globalCompositeOperation = 'destination-in'; b.drawImage(A, 0, 0); b.globalCompositeOperation = 'source-atop';
    const g = b.createLinearGradient(0, 0, B.width, 0); g.addColorStop(0, `rgba(${sh},.38)`); g.addColorStop(.55, `rgba(${sh},0)`); g.addColorStop(1, `rgba(${rim},.18)`);
    b.fillStyle = g; b.fillRect(0, 0, B.width, B.height);
    const M = document.createElement('canvas'); M.width = B.width; M.height = B.height; const m = M.getContext('2d');
    m.drawImage(A, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = `rgba(${rim},.9)`; m.fillRect(0, 0, M.width, M.height);
    m.globalCompositeOperation = 'destination-out'; m.drawImage(A, -6 * R, 2 * R);
    b.globalCompositeOperation = 'source-atop'; b.drawImage(M, 0, 0);
    const E = document.createElement('canvas'); E.width = B.width; E.height = B.height; const e = E.getContext('2d');
    e.drawImage(A, 0, 0); e.globalCompositeOperation = 'source-in'; e.fillStyle = 'rgba(50,20,40,.55)'; e.fillRect(0, 0, E.width, E.height);
    e.globalCompositeOperation = 'destination-out'; for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) { e.save(); e.globalAlpha = .5; e.drawImage(A, dx * R, dy * R); e.restore(); }
    b.drawImage(E, 0, 0); b.globalCompositeOperation = 'source-over';
  }
  if (o.post) { b.save(); b.scale(R, R); if (o.origin) b.translate(o.origin[0], o.origin[1]); o.post(b); b.restore(); }
  return { c: B, w, h, origin: o.origin || [0, 0] };
}
function spr(s, x, y, r = 0, sc = 1, g = ctx) { g.save(); g.translate(x, y); g.rotate(r); g.scale(sc, sc); g.drawImage(s.c, -s.origin[0], -s.origin[1], s.w, s.h); g.restore(); }

// ---------- shared static textures ----------
const S = {};
function buildStatic() {
  S.glow = document.createElement('canvas'); S.glow.width = S.glow.height = 128;
  { const g = S.glow.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,236,170,1)'); r.addColorStop(.25, 'rgba(255,200,110,.6)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }
  S.glowB = document.createElement('canvas'); S.glowB.width = S.glowB.height = 128;
  { const g = S.glowB.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(200,220,255,1)'); r.addColorStop(.3, 'rgba(120,150,255,.5)'); r.addColorStop(1, 'rgba(80,90,200,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }
  S.tex = document.createElement('canvas'); S.tex.width = W; S.tex.height = H;
  { const g = S.tex.getContext('2d'), d = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, v = 128 + ((x % 4 < 2) ^ (y % 4 < 2) ? 10 : -10) + (hash(x * 7.1 + y * 3.3) - .5) * 40; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; }
    g.putImageData(d, 0, 0);
    const v = g.createRadialGradient(W / 2, H * .45, 420, W / 2, H / 2, 1150); v.addColorStop(0, 'rgba(40,15,30,0)'); v.addColorStop(1, 'rgba(40,15,30,.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
}

// ---------- camera: keys [dt, cx, cy, zoom] relative to scene start, eased ----------
function camAt(keys, t) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)], k = b === a ? 0 : ease(seg(t, a[0], b[0]));
  const z = lerp(a[3], b[3], k), hw = W / 2 / z, hh = H / 2 / z;
  return [clamp(lerp(a[1], b[1], k), hw, W - hw), clamp(lerp(a[2], b[2], k), hh, H - hh), z];
}
function layer(img, c, p) { const z = 1 + (c[2] - 1) * p, cx = W / 2 + (c[0] - W / 2) * p, cy = H / 2 + (c[1] - H / 2) * p;
  ctx.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z); ctx.drawImage(img.c, 0, 0, img.w, img.h); }
function worldT(c) { ctx.setTransform(c[2], 0, 0, c[2], W / 2 - c[0] * c[2], H / 2 - c[1] * c[2]); }
function toScreen(c, x, y) { return [W / 2 + (x - c[0]) * c[2], H / 2 + (y - c[1]) * c[2]]; }

// ---------- motif pieces ----------
function note(x, y, s, a) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#fff2c8';
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, -.4, 0, 7); ctx.fill(); ctx.fillRect(6, -34, 3.5, 34); ctx.beginPath(); ctx.moveTo(9, -34); ctx.quadraticCurveTo(22, -26, 16, -12); ctx.lineTo(9, -24); ctx.fill(); ctx.restore(); }
function page(x, y, r, s, a, tint) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s);
  ctx.fillStyle = tint || '#fff4d6'; ctx.fillRect(-14, -18, 28, 36); ctx.fillStyle = 'rgba(150,110,70,.6)'; for (let k = 0; k < 5; k++) ctx.fillRect(-9, -11 + k * 6, 18 - (k === 4 ? 8 : 0), 2); ctx.restore(); }
function glowAt(x, y, r, a, blue) { ctx.globalAlpha = a; ctx.drawImage(blue ? S.glowB : S.glow, x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; }

// wrap text to lines of at most maxW px with the current font
function wrap(s, maxW) { const words = s.split(' '), out = []; let cur = '';
  for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (ctx.measureText(tr).width > maxW && cur) { out.push(cur); cur = w; } else cur = tr; }
  if (cur) out.push(cur); return out; }
