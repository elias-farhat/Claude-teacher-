// Clickable thumbnail (1280x720) for "What If Your Memory Held a Million Books?"
function thumb() {
  const s = set2('roseClose'); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(s.img.blur, -300, -150, SW * 1.0, SH * 1.0);
  const v = ctx.createLinearGradient(0, 0, W, 0); v.addColorStop(0, 'rgba(20,10,30,0)'); v.addColorStop(.5, 'rgba(20,10,30,.15)'); v.addColorStop(1, 'rgba(20,10,30,.75)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // glow + pages bursting out of her head
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .8; ctx.drawImage(S.glow, 560 - 700, 420 - 700, 1400, 1400); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  for (let k = 0; k < 34; k++) { const a = hash(k + 2) * 6.283, r = 300 + hash(k + 7) * 520, x = 560 + Math.cos(a) * r, y = 420 + Math.sin(a) * r * .75; if (x > 1050) continue;
    ctx.globalCompositeOperation = 'lighter'; glowAt(x, y, 60, .5); ctx.globalCompositeOperation = 'source-over'; page(x, y, (hash(k) - .5) * 1.4, 2 + hash(k + 4) * 1.6, 1); }
  drawBust('rose', 560, 790, { s: 2.2, face: 'shock', tears: true, look: [0, 0] }, .4);
  // speech bubble
  ctx.save(); ctx.font = '700 70px Fredoka'; const bw = ctx.measureText('Who are you?').width + 90; ctx.fillStyle = '#fff8ec'; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.roundRect(60, 50, bw, 130, 60); ctx.fill(); ctx.beginPath(); ctx.moveTo(300, 170); ctx.lineTo(380, 250); ctx.lineTo(380, 170); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#3a2430'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('Who are you?', 105, 118); ctx.restore();
  // headline
  const T = (str, x, y, size, col, rot = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = `700 ${size}px Fredoka`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = size * .24; ctx.strokeStyle = '#1a0c1a'; ctx.strokeText(str, 0, 0); ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore(); };
  T("I CAN'T", 1480, 330, 200, '#fff3dc', -.04); T('FORGET', 1480, 540, 230, '#ffd04a', -.04);
  ctx.save(); ctx.translate(1480, 760); ctx.rotate(-.04); ctx.fillStyle = '#d6463c'; ctx.beginPath(); ctx.roundRect(-330, -62, 660, 124, 30); ctx.fill(); ctx.font = '700 76px Fredoka'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1,000,000 BOOKS', 0, 4); ctx.restore();
  ctx.globalAlpha = .4; ctx.drawImage(S.tex, 0, 0); ctx.globalAlpha = 1;
  const O = document.createElement('canvas'); O.width = 1280; O.height = 720; const o = O.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(cv, 0, 0, 1280, 720);
  return O.toDataURL('image/png'); }
document.fonts.load('700 40px Fredoka').then(() => { buildStatic(); window.PNG = { thumbnail: thumb() }; window.READY = true; });
