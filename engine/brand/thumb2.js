// Thumbnail v2, built on the viral "What if" formula: saturated night purple, one huge emotional face,
// 2 words in thick outline (white + yellow), a glowing red counter, a speech bubble.
function thumb2() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1c0f52'); g.addColorStop(.6, '#4a24a8'); g.addColorStop(1, '#7a3ad0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const bw = 70 + hash(i) * 70, x = i * 78 - 30, hh = 260 + hash(i + 3) * 420; ctx.fillStyle = i % 2 ? '#24135e' : '#2c1870'; ctx.fillRect(x, H - hh, bw, hh);
    for (let wy = H - hh + 20; wy < H; wy += 34) for (let wx = x + 10; wx < x + bw - 14; wx += 24) if (hash(wx * 3 + wy) > .45) { ctx.fillStyle = hash(wx + wy) > .5 ? '#ffd27a' : '#ffb35a'; ctx.fillRect(wx, wy, 10, 14); } }
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .9; ctx.drawImage(S.glow, 620 - 650, 640 - 650, 1300, 1300); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  for (let k = 0; k < 40; k++) { const a = hash(k + 2) * 6.283, r = 260 + hash(k + 7) * 600, x = 600 + Math.cos(a) * r, y = 640 + Math.sin(a) * r * .7; if (x > 1150 || y < 300 || Math.hypot(x - 600, y - 640) < 330) continue;
    ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 50, .55); ctx.globalCompositeOperation = 'source-over'; page(x, y, (hash(k) - .5) * 1.4, 2.2 + hash(k + 4) * 1.6, 1); }
  drawBust('rose', 600, 1010, { s: 2.75, face: 'shock', tears: true }, .4);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.lineCap = 'round'; for (const [x0, y0, x1, y1] of [[290, 420, 220, 360], [260, 540, 170, 540], [910, 420, 980, 360], [940, 540, 1030, 540]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  // big words
  const T = (str, x, y, size, col, rot = -.03) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = `700 ${size}px Fredoka`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = size * .28; ctx.strokeStyle = '#0d0618'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 12; ctx.strokeText(str, 0, 0); ctx.shadowColor = 'transparent'; ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore(); };
  T("CAN'T", 60, 150, 210, '#ffffff'); T('FORGET', 760, 150, 210, '#ffd21f');
  // speech bubble
  ctx.save(); ctx.translate(1060, 470); ctx.rotate(.04); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0d0618'; ctx.lineWidth = 12; ctx.beginPath(); ctx.roundRect(-20, -90, 560, 180, 90); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(30, 60); ctx.lineTo(-60, 150); ctx.lineTo(110, 80); ctx.fill(); ctx.font = '700 84px Fredoka'; ctx.fillStyle = '#2a1640'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Who are you?', 260, 6); ctx.restore();
  // counter
  ctx.save(); ctx.translate(1460, 790); ctx.rotate(-.04); ctx.shadowColor = '#ff3a3a'; ctx.shadowBlur = 50; ctx.fillStyle = '#d61f2c'; ctx.beginPath(); ctx.roundRect(-380, -95, 760, 190, 36); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffd0d0'; ctx.lineWidth = 8; ctx.stroke(); ctx.font = '700 140px Fredoka'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1,000,000', 0, 8);
  ctx.font = '700 64px Fredoka'; ctx.lineWidth = 16; ctx.strokeStyle = '#0d0618'; ctx.lineJoin = 'round'; ctx.strokeText('BOOKS IN MY HEAD', 0, 160); ctx.fillStyle = '#ffd21f'; ctx.fillText('BOOKS IN MY HEAD', 0, 160); ctx.restore();
  ctx.globalAlpha = .25; ctx.drawImage(S.tex, 0, 0); ctx.globalAlpha = 1;
  const O = document.createElement('canvas'); O.width = 1280; O.height = 720; const o = O.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(cv, 0, 0, 1280, 720); return O.toDataURL('image/png'); }
document.fonts.load('700 40px Fredoka').then(() => { buildStatic(); window.PNG = { thumbnail2: thumb2() }; window.READY = true; });
