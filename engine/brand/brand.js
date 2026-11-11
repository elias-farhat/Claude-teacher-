// Channel branding for "POV Stories", painted with the same gouache engine as the videos.
function viewfinder(g, x, y, w, h, len, lw, col) { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { g.beginPath(); g.moveTo(cx, cy + sy * len); g.lineTo(cx, cy); g.lineTo(cx + sx * len, cy); g.stroke(); } }
function title(g, str, x, y, size, col = '#fff3dc') { g.save(); g.font = `700 ${size}px Fredoka`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * .2; g.strokeStyle = 'rgba(40,16,40,.9)'; g.strokeText(str, x, y); g.shadowColor = 'rgba(255,190,110,.9)'; g.shadowBlur = size * .35; g.fillStyle = col; g.fillText(str, x, y); g.restore(); }
function pages(g, cx, cy, n, R, s, sd, hole) { for (let k = 0; k < n; k++) { const a = hash(k + sd) * 6.283, r = R * (.55 + hash(k + sd + 9) * .5), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .8; if (hole && Math.abs(x - cx) < hole[0] && Math.abs(y - cy) < hole[1]) continue;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55; g.drawImage(S.glow, x - 50 * s, y - 50 * s, 100 * s, 100 * s); g.restore();
  g.save(); g.translate(x, y); g.rotate((hash(k + sd + 3) - .5) * 1.2); g.scale(s, s); g.fillStyle = '#fff4d6'; g.fillRect(-14, -18, 28, 36); g.fillStyle = 'rgba(150,110,70,.6)'; for (let i = 0; i < 5; i++) g.fillRect(-9, -11 + i * 6, i === 4 ? 10 : 18, 2); g.restore(); } }
function bg(name, w, h) { return gouache(name, w, h, a => {
  a.fillStyle = lin(a, 0, 0, 0, h, [[0, '#2e3270'], [.5, '#b0688c'], [1, '#f2a070']]); a.fillRect(0, 0, w, h);
  a.fillStyle = rad(a, w / 2, h * .62, 20, Math.max(w, h) * .55, [[0, 'rgba(255,225,160,.85)'], [1, 'rgba(255,200,140,0)']]); a.fillRect(0, 0, w, h);
  a.fillStyle = '#3a2e5a'; for (let i = 0; i < 40; i++) { const bw = w / 22, x = i * bw * .9 - 20, hh = h * (.12 + hash(i + 3) * .22); a.fillRect(x, h - hh, bw * .85, hh); }
  a.fillStyle = '#ffd890'; for (let i = 0; i < 120; i++) a.fillRect(hash(i) * w, h - hash(i + 5) * h * .28, w / 260, w / 200);
}, { size: Math.max(10, w / 120), angle: () => .05 }); }
const OUTS = {};
function makePfp() { const C = document.createElement('canvas'); C.width = C.height = 800; const g = C.getContext('2d'); OUTS.pfp = C;
  const B = bg('brand-pfp-bg', 800, 800); g.drawImage(B.c, 0, 0, 800, 800);
  pages(g, 400, 380, 14, 330, 2.2, 3, [250, 170]);
  viewfinder(g, 150, 170, 500, 380, 90, 22, 'rgba(255,243,220,.95)');
  title(g, 'POV', 400, 350, 230); title(g, 'stories', 400, 500, 96, '#ffe0a8');
  g.fillStyle = '#d6463c'; g.beginPath(); g.arc(205, 212, 16, 0, 7); g.fill(); g.font = '700 30px Fredoka'; g.fillStyle = '#fff3dc'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('REC', 230, 213);
  g.globalAlpha = .45; g.drawImage(S.tex, 0, 0, 800, 800); g.globalAlpha = 1; }
function makeBanner() { const w = 2560, h = 1440, C = document.createElement('canvas'); C.width = w; C.height = h; const g = C.getContext('2d'); OUTS.banner = C;
  const B = bg('brand-banner-bg', w, h); g.drawImage(B.c, 0, 0, w, h);
  pages(g, w / 2, h / 2, 40, 1000, 2.4, 11, [820, 260]);
  // POV hands at the sides (decoration: visible on TV/desktop, outside the always-visible area)
  // always-visible safe area: 1546 x 423 centred
  viewfinder(g, w / 2 - 760, h / 2 - 205, 1520, 410, 70, 14, 'rgba(255,243,220,.9)');
  title(g, 'POV STORIES', w / 2, h / 2 - 40, 190); title(g, 'You don’t watch the story. You live it.', w / 2, h / 2 + 120, 62, '#ffe0a8');
  g.fillStyle = '#d6463c'; g.beginPath(); g.arc(w / 2 - 700, h / 2 - 150, 14, 0, 7); g.fill(); g.font = '700 30px Fredoka'; g.fillStyle = '#fff3dc'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('REC', w / 2 - 676, h / 2 - 149);
  g.globalAlpha = .45; g.drawImage(S.tex, 0, 0, w, h); g.globalAlpha = 1; }
document.fonts.load('700 40px Fredoka').then(() => { buildStatic(); buildRoom(); buildHands(); makePfp(); makeBanner(); window.PNG = { pfp: OUTS.pfp.toDataURL('image/png'), banner: OUTS.banner.toDataURL('image/png') }; window.READY = true; });
