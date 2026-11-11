// Video 2 "What If You Could See How Long Everyone Has Left?": new cast, props, life-countdown tags, POV sets.
Object.assign(CAST2, {
  mom:    { skin: '#e0a985', skin2: '#c48b68', hair: '#4a2a1a', top: '#c86a7a', style: 'long' },
  kid:    { skin: '#e9b38f', skin2: '#d0906c', hair: '#3a2418', top: '#5aa0d8', style: 'curly' },
  driver: { skin: '#a86e4c', skin2: '#8a5638', hair: '#222222', top: '#3a5a8a', style: 'neat' },
  baker:  { skin: '#f0c4a0', skin2: '#d8a07e', hair: '#b0a090', top: '#f4efe6', style: 'short', apron: '#c8a070' },
  walter: { skin: '#e8b898', skin2: '#c89070', hair: '#e8e8ee', top: '#7a6a5a', coat: '#5a4a3e', style: 'bald', glasses: true, old: true },
  leo:    { skin: '#c99068', skin2: '#a87050', hair: '#2a1a12', top: '#4a6ab8', style: 'neat' },
  you:    { skin: '#e9b38f', skin2: '#d0906c', hair: '#2a1a14', top: '#3e8590', style: 'neat' },
  p1:     { skin: '#d7a07c', skin2: '#bb8461', hair: '#6a3a1a', top: '#a05a8a', style: 'long' },
  p2:     { skin: '#8a5a3e', skin2: '#6e4530', hair: '#1a1210', top: '#e0a040', style: 'short' },
  p3:     { skin: '#f0c4a0', skin2: '#d8a07e', hair: '#d0b070', top: '#5a8a5a', style: 'pony' },
});
// a person whose EYES sit at world height eyeY (eye level framing): neck = eyeY + 124*s
const person = (id, x, eyeY, s, o, t) => drawBust(id, x, eyeY + 124 * s, Object.assign({ s }, o), t);
// seen from behind (back of the head + shoulders), for "Leo steps forward"
function personBack(id, x, eyeY, s) { const d = CAST2[id], ny = eyeY + 124 * s; ctx.save(); ctx.translate(x, ny); ctx.scale(s, s);
  ctx.fillStyle = shade2(d.top, .9); ctx.beginPath(); ctx.moveTo(-60, 0); ctx.quadraticCurveTo(-200, 20, -222, 120); ctx.lineTo(-236, 520); ctx.lineTo(236, 520); ctx.lineTo(222, 120); ctx.quadraticCurveTo(200, 20, 60, 0); ctx.fill();
  ctx.fillStyle = shade2(d.top, .75); ctx.beginPath(); ctx.ellipse(0, 40, 120, 60, 0, 0, Math.PI); ctx.fill();   // hood
  ctx.fillStyle = d.skin; ctx.fillRect(-36, -40, 72, 60); ctx.beginPath(); ctx.ellipse(-92, -116, 18, 26, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(92, -116, 18, 26, 0, 0, 7); ctx.fill();
  ctx.fillStyle = d.hair; ctx.beginPath(); ctx.ellipse(0, -126, 94, 112, 0, 0, 7); ctx.fill(); ctx.restore(); }

// ---------- the life countdown tag that floats above a head ----------
// spec: {y, m, d, sec} remaining (sec = seconds within the day); mode: 'long' | 'short' | 'spin' | 'frozen'
function lifeTag(x, y, spec, t, o = {}) { const a = o.a ?? 1; if (a <= 0) return; const s = o.s || 1;
  let { y: Y = 0, m: M = 0, d: D = 0, sec = 0 } = spec; if (!o.frozen) sec = Math.max(0, sec - (o.tick ?? t));
  const hh = Math.floor(sec / 3600), mm = Math.floor(sec % 3600 / 60), ss = Math.floor(sec % 60), clock = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  let big, small, col;
  if (o.spin) { big = `${(hash(Math.floor(t * 20)) * 99) | 0} YEARS`; small = `${(hash(Math.floor(t * 23) + 3) * 11) | 0} MONTHS · ${(hash(Math.floor(t * 17) + 5) * 30) | 0} DAYS`; col = '#ffe08a'; }
  else if (Y > 0 || M > 0 || D > 0) { big = Y > 0 ? `${Y} YEAR${Y > 1 ? 'S' : ''}` : `${D} DAY${D > 1 ? 'S' : ''}`; small = Y > 0 ? `${M} MONTHS · ${D} DAYS` : ''; col = '#ffe08a'; }
  else { big = clock; small = '0 YEARS · 0 DAYS'; col = sec < 600 ? '#ff6a5a' : '#ffb04a'; }
  const blink = sec < 600 && !(Y || M || D) && !o.spin ? (Math.sin(t * 8) > -.2 ? 1 : .55) : 1;
  ctx.save(); ctx.translate(x, y + Math.sin(t * 2) * 6); ctx.scale(s, s); ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * .55 * blink; ctx.drawImage(S.glow, -230, -150, 460, 300); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = '700 64px Fredoka'; ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(30,10,30,.65)'; ctx.strokeText(big, 0, -18); ctx.shadowColor = col; ctx.shadowBlur = 26; ctx.fillStyle = col; ctx.globalAlpha = a * blink; ctx.fillText(big, 0, -18); ctx.shadowBlur = 0; ctx.globalAlpha = a;
  if (small) { ctx.font = '600 30px Fredoka'; ctx.lineWidth = 8; ctx.strokeText(small, 0, 30); ctx.fillStyle = '#fff3d8'; ctx.fillText(small, 0, 30); }
  if (Y || M || D || o.spin) { ctx.font = '600 26px Fredoka'; const c2 = o.spin ? `${(hash(t * 9) * 23) | 0}:${(hash(t * 7) * 59) | 0}:${(hash(t * 5) * 59) | 0}` : clock; ctx.lineWidth = 7; ctx.strokeText(c2, 0, 66); ctx.fillStyle = 'rgba(255,243,216,.85)'; ctx.fillText(c2, 0, 66); }
  ctx.restore(); }

// ---------- props ----------
function cat(x, y, s, t, look = 0) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const tw = Math.sin(t * 2.5) * .3;
  ctx.strokeStyle = '#d0843a'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(90, 60); ctx.quadraticCurveTo(190, 40 + tw * 60, 170, -60 + tw * 40); ctx.stroke();
  ctx.fillStyle = '#e09a4a'; ctx.beginPath(); ctx.ellipse(0, 40, 120, 90, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -80, 80, 70, 0, 0, 7); ctx.fill();
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 70, -110); ctx.lineTo(sd * 60, -175); ctx.lineTo(sd * 20, -135); ctx.fill(); }
  ctx.fillStyle = '#f2d0a0'; ctx.beginPath(); ctx.ellipse(0, -55, 40, 26, 0, 0, 7); ctx.fill();
  const bl = (t % 3.1) < .12; ctx.fillStyle = '#2a1d24'; for (const sd of [-1, 1]) { if (bl) ctx.fillRect(sd * 30 - 12 + look * 6, -90, 24, 4); else { ctx.beginPath(); ctx.ellipse(sd * 30 + look * 6, -88, 9, 14, 0, 0, 7); ctx.fill(); } }
  ctx.fillStyle = '#c8607a'; ctx.beginPath(); ctx.moveTo(-8, -66); ctx.lineTo(8, -66); ctx.lineTo(0, -58); ctx.fill(); ctx.restore(); }
function pigeon(x, y, s, t, k, fly = 0) { ctx.save(); const up = fly > 0 ? ease(clamp(fly - hash(k) * .3, 0, 1)) : 0; ctx.translate(x + up * (hash(k + 2) - .5) * 900, y - up * (500 + hash(k + 4) * 400)); ctx.scale(s * (k % 2 ? -1 : 1), s);
  const peck = fly ? 0 : Math.max(0, Math.sin(t * 5 + k * 2)) * .5; ctx.fillStyle = '#8a8fa0'; ctx.beginPath(); ctx.ellipse(0, 0, 46, 28, 0, 0, 7); ctx.fill();
  if (up > 0) { const fl = Math.sin(t * 30 + k) * .8; ctx.fillStyle = '#9aa0b0'; ctx.beginPath(); ctx.ellipse(-6, -20, 40, 14, -.8 + fl, 0, 7); ctx.fill(); }
  ctx.save(); ctx.translate(34, -18 + peck * 30); ctx.fillStyle = '#7a7f90'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.fill(); ctx.fillStyle = '#6aa08a'; ctx.beginPath(); ctx.arc(-6, 12, 10, 0, 7); ctx.fill();
  ctx.fillStyle = '#e0a060'; ctx.beginPath(); ctx.moveTo(14, -2); ctx.lineTo(28, 2); ctx.lineTo(14, 6); ctx.fill(); ctx.fillStyle = '#1a1414'; ctx.beginPath(); ctx.arc(6, -4, 3.5, 0, 7); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#d07050'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-6, 26); ctx.lineTo(-6, 40); ctx.moveTo(8, 26); ctx.lineTo(8, 40); ctx.stroke(); ctx.restore(); }
function stroller(x, y, s, t) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#3a5a7a'; ctx.beginPath(); ctx.moveTo(-180, -40); ctx.quadraticCurveTo(-180, -220, 0, -230); ctx.lineTo(0, -40); ctx.fill(); ctx.fillStyle = '#5a7a9a'; ctx.beginPath(); ctx.roundRect(-200, -60, 400, 160, 60); ctx.fill();
  ctx.fillStyle = '#f0c4a0'; ctx.beginPath(); ctx.arc(60, -60, 62, 0, 7); ctx.fill(); ctx.fillStyle = '#f8e8d8'; ctx.beginPath(); ctx.ellipse(60, -112, 66, 30, 0, Math.PI, 0); ctx.fill();
  const bl = (t % 2.7) < .14; ctx.fillStyle = '#2a1d24'; for (const sd of [-1, 1]) { if (bl) ctx.fillRect(60 + sd * 22 - 8, -66, 16, 3); else { ctx.beginPath(); ctx.arc(60 + sd * 22, -66, 7, 0, 7); ctx.fill(); } }
  ctx.strokeStyle = '#2a1d24'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(60, -44, 12, .2, Math.PI - .2); ctx.stroke(); ctx.fillStyle = 'rgba(230,110,100,.4)'; ctx.beginPath(); ctx.arc(28, -46, 12, 0, 7); ctx.arc(92, -46, 12, 0, 7); ctx.fill();
  ctx.fillStyle = '#2a2a30'; for (const wx of [-140, 140]) { ctx.beginPath(); ctx.arc(wx, 130, 46, 0, 7); ctx.fill(); } ctx.strokeStyle = '#5a5a60'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(180, -40); ctx.lineTo(260, -200); ctx.stroke(); ctx.restore(); }
function bus(x, y, t, door) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#e8b03a'; ctx.beginPath(); ctx.roundRect(-900, -560, 1800, 760, 50); ctx.fill(); ctx.fillStyle = '#c88a20'; ctx.fillRect(-900, 120, 1800, 40);
  ctx.fillStyle = '#9ac8e0'; for (let i = 0; i < 4; i++) ctx.fillRect(-860 + i * 300, -500, 260, 240); ctx.fillStyle = '#2a2a30'; for (const wx of [-600, 600]) { ctx.beginPath(); ctx.arc(wx, 200, 110, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#3a3a44'; ctx.fillRect(360, -500, 440, 680); ctx.fillStyle = '#b8d8e8'; const o = door * 210; ctx.fillRect(370, -490, 210 - o, 660); ctx.fillRect(590 + o, -490, 210 - o, 660); ctx.restore(); }
function truck(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.roundRect(-700, -520, 1100, 600, 30); ctx.fill(); ctx.fillStyle = '#8a2a20'; ctx.beginPath(); ctx.roundRect(400, -420, 360, 500, 40); ctx.fill();
  ctx.fillStyle = '#bfe0f0'; ctx.fillRect(470, -380, 220, 170); ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(740, 20, 34, 0, 7); ctx.fill(); ctx.fillStyle = '#1e1e24'; for (const wx of [-500, 0, 560]) { ctx.beginPath(); ctx.arc(wx, 100, 100, 0, 7); ctx.fill(); } ctx.restore(); }

// ---------- sets for this video ----------
Object.assign(SETDEF2, {
  wake: () => ({ img: gouache('s3-wake', SW, SH, a => { a.fillStyle = lin(a, 0, 0, 0, SH, [[0, '#e6c49c'], [1, '#d0a07a']]); a.fillRect(0, 0, SW, SH);
      windowAt(a, 220, 260, 520, 600, [[0, '#a8d4f0'], [1, '#ffe8b8']], '#8a5a40'); a.fillStyle = 'rgba(255,240,220,.85)'; a.beginPath(); a.moveTo(180, 220); a.quadraticCurveTo(260, 600, 200, 900); a.lineTo(140, 900); a.lineTo(140, 220); a.fill(); a.beginPath(); a.moveTo(780, 220); a.quadraticCurveTo(700, 600, 760, 900); a.lineTo(820, 900); a.lineTo(820, 220); a.fill();
      a.fillStyle = rad(a, 480, 560, 30, 900, [[0, 'rgba(255,230,170,.55)'], [1, 'rgba(255,230,170,0)']]); a.fillRect(0, 0, SW, SH);
      a.fillStyle = '#7a4a34'; a.fillRect(1430, 160, 460, 1000); a.fillStyle = lin(a, 0, 180, 0, 1150, [[0, '#f2d8b0'], [1, '#d8b088']]); a.fillRect(1460, 190, 400, 960);
      a.fillStyle = '#a07050'; a.fillRect(1460, 190, 30, 960); shelfRow(a, 1000, 300, 300, 3, BOOKC); a.fillStyle = '#e8b04a'; a.beginPath(); a.arc(2150, 500, 60, 0, 7); a.fill();
      floorPersp(a, 1160, 1200, '#a46a44', '#8a5634', 'rgba(40,20,20,.3)'); }, opt({ blurCopy: 8 })),
    front: gouache('s3-wake-bed', SW, SH, a => { a.fillStyle = '#e8eef4'; a.beginPath(); a.moveTo(-100, 1250); a.quadraticCurveTo(1200, 1150, 2500, 1260); a.lineTo(2500, SH); a.lineTo(-100, SH); a.fill(); a.fillStyle = '#7a9ac8'; a.beginPath(); a.moveTo(-100, 1330); a.quadraticCurveTo(1200, 1240, 2500, 1340); a.lineTo(2500, SH); a.lineTo(-100, SH); a.fill(); }, opt({ size: 10 })), light: [480, 560, '255,230,170'] }),
  kitchen: () => ({ img: gouache('s3-kitchen', SW, SH, a => { a.fillStyle = '#e8d8b8'; a.fillRect(0, 0, SW, SH); a.strokeStyle = 'rgba(160,140,110,.35)'; a.lineWidth = 3; for (let y = 640; y < 1000; y += 60) { a.beginPath(); a.moveTo(0, y); a.lineTo(SW, y); a.stroke(); } for (let x = 0; x < SW; x += 60) { a.beginPath(); a.moveTo(x, 640); a.lineTo(x, 1000); a.stroke(); }
      windowAt(a, 900, 200, 600, 420, [[0, '#a8d4f0'], [1, '#fff0c8']], '#7a5a40'); a.fillStyle = '#c8d8e0'; a.fillRect(1950, 200, 380, 900); a.fillStyle = '#b0c0c8'; a.fillRect(1950, 560, 380, 10); a.fillStyle = '#8a9aa0'; a.fillRect(2000, 380, 16, 120); a.fillRect(2000, 640, 16, 120);
      a.fillStyle = '#9a6a48'; a.fillRect(100, 220, 600, 26); a.fillRect(100, 420, 600, 26); for (let i = 0; i < 6; i++) { a.fillStyle = ['#c84a3a', '#e8b04a', '#5a9a6a', '#3a6a9a', '#e8e0d0', '#c86a8a'][i]; a.beginPath(); a.roundRect(130 + i * 95, 130, 70, 90, 12); a.fill(); }
      a.fillStyle = '#b07a50'; a.fillRect(0, 1000, SW, 30); floorPersp(a, 1030, 1200, '#c8a880', '#a88860', 'rgba(80,50,30,.25)'); }, opt({ blurCopy: 7 })),
    front: gouache('s3-kitchen-table', SW, SH, a => { a.fillStyle = '#b8784a'; a.beginPath(); a.moveTo(250, 1060); a.lineTo(1950, 1060); a.lineTo(2150, SH); a.lineTo(50, SH); a.fill(); a.fillStyle = '#d09060'; a.fillRect(250, 1050, 1700, 20);
      for (const [x, y] of [[700, 1180], [1500, 1180]]) { a.fillStyle = '#f4f0e8'; a.beginPath(); a.ellipse(x, y, 190, 60, 0, 0, 7); a.fill(); a.fillStyle = '#e8b04a'; a.beginPath(); a.ellipse(x - 30, y - 10, 70, 26, 0, 0, 7); a.fill(); a.fillStyle = '#fff8e0'; a.beginPath(); a.ellipse(x + 50, y - 6, 46, 30, 0, 0, 7); a.fill(); a.fillStyle = '#f0a020'; a.beginPath(); a.arc(x + 50, y - 6, 14, 0, 7); a.fill(); }
      a.fillStyle = 'rgba(255,170,60,.85)'; a.fillRect(1080, 1020, 80, 140); a.fillStyle = 'rgba(255,255,255,.4)'; a.fillRect(1090, 1030, 14, 110); }, opt({ size: 9 })), light: [1200, 400, '255,235,180'] }),
  park: () => ({ w: 3600, img: gouache('s3-park', 3600, SH, a => { a.fillStyle = lin(a, 0, 0, 0, 900, [[0, '#9ad0f0'], [1, '#e8f0d0']]); a.fillRect(0, 0, 3600, SH);
      for (let i = 0; i < 16; i++) { const x = i * 240 + hash(i) * 120, r = 140 + hash(i + 3) * 100; a.fillStyle = '#6a4a30'; a.fillRect(x - 18, 700 - r * .3, 36, 360); a.fillStyle = ['#5a9a4a', '#4a8a40', '#6aaa5a'][i % 3]; a.beginPath(); a.arc(x, 560 - r * .3, r, 0, 7); a.fill(); a.beginPath(); a.arc(x + r * .6, 620 - r * .3, r * .7, 0, 7); a.fill(); }
      a.fillStyle = '#7ab05a'; a.fillRect(0, 900, 3600, 600); a.fillStyle = '#d8c8a0'; a.beginPath(); a.moveTo(1500, 900); a.lineTo(2100, 900); a.lineTo(2900, SH); a.lineTo(700, SH); a.fill();
      a.fillStyle = '#6a4a30'; a.fillRect(2380, 820, 520, 26); a.fillRect(2380, 760, 520, 20); a.fillRect(2400, 846, 16, 90); a.fillRect(2860, 846, 16, 90);
      a.fillStyle = '#3a3a40'; a.fillRect(1200, 500, 14, 440); a.fillStyle = '#fff0c0'; a.beginPath(); a.arc(1207, 490, 26, 0, 7); a.fill(); }, opt({ blurCopy: 7 })), light: [2600, 300, '255,240,190'] }),
  bench: () => ({ img: gouache('s3-bench', SW, SH, a => { a.fillStyle = lin(a, 0, 0, 0, 700, [[0, '#9ad0f0'], [1, '#e8f0d0']]); a.fillRect(0, 0, SW, SH);
      for (let i = 0; i < 9; i++) { const x = i * 300 + hash(i + 9) * 100, r = 200 + hash(i + 2) * 80; a.fillStyle = ['#5a9a4a', '#4a8a40', '#6aaa5a'][i % 3]; a.beginPath(); a.arc(x, 380, r, 0, 7); a.fill(); }
      a.fillStyle = '#7ab05a'; a.fillRect(0, 700, SW, 800); a.fillStyle = '#d8c8a0'; a.fillRect(0, 900, SW, 600); a.fillStyle = 'rgba(150,130,100,.25)'; for (let i = 0; i < 40; i++) a.fillRect(hash(i) * SW, 950 + hash(i + 3) * 500, 20, 8); }, opt({ blurCopy: 9 })),
    front: gouache('s3-bench-seat', SW, SH, a => { a.fillStyle = '#7a5434'; a.fillRect(-100, 1310, SW + 200, 60); a.fillStyle = '#6a4428'; a.fillRect(-100, 1370, SW + 200, 30); }, opt({ size: 8 })), light: [1800, 200, '255,240,190'] }),
  crossing: () => ({ img: gouache('s3-cross', SW, SH, a => { a.fillStyle = lin(a, 0, 0, 0, 600, [[0, '#f0a070'], [1, '#ffd8a0']]); a.fillRect(0, 0, SW, SH);
      let x = 0; for (let i = 0; x < SW; i++) { const w = 380 + hash(i + 20) * 200; a.fillStyle = ['#a0604a', '#8a5a6a', '#b07a50', '#7a6a8a'][i % 4]; a.fillRect(x, 140 + hash(i) * 120, w - 10, 700); a.fillStyle = '#ffd68a'; for (let wy = 220; wy < 760; wy += 110) for (let wx = x + 30; wx < x + w - 70; wx += 90) a.fillRect(wx, wy, 46, 64); x += w; }
      a.fillStyle = '#6a6470'; a.fillRect(0, 840, SW, 60); a.fillStyle = '#4a4650'; a.fillRect(0, 900, SW, 360); a.fillStyle = '#f2ecdc'; for (let i = 0; i < 9; i++) { const xx = 760 + i * 110; a.beginPath(); a.moveTo(xx, 910); a.lineTo(xx + 60, 910); a.lineTo(xx + 40 + (i - 4) * 30 + 60, 1250); a.lineTo(xx - 20 + (i - 4) * 30, 1250); a.fill(); }
      a.fillStyle = '#8a8490'; a.fillRect(0, 1250, SW, 250); a.fillStyle = '#2a2430'; a.fillRect(1880, 300, 22, 960); a.fillStyle = '#1e1a22'; a.beginPath(); a.roundRect(1830, 280, 120, 280, 20); a.fill(); }, opt({ blurCopy: 7 })), light: [1200, 300, '255,200,140'] }),
  mirror: () => ({ img: gouache('s3-mirror', SW, SH, a => { a.fillStyle = '#26243a'; a.fillRect(0, 0, SW, SH); a.strokeStyle = 'rgba(80,80,110,.5)'; a.lineWidth = 4; for (let y = 0; y < SH; y += 90) { a.beginPath(); a.moveTo(0, y); a.lineTo(SW, y); a.stroke(); } for (let x = 0; x < SW; x += 90) { a.beginPath(); a.moveTo(x, 0); a.lineTo(x, SH); a.stroke(); }
      a.fillStyle = '#4a3a30'; a.fillRect(640, 120, 1120, 1080); a.fillStyle = '#141420'; a.fillRect(670, 150, 1060, 1020); a.fillStyle = 'rgba(160,180,230,.08)'; a.beginPath(); a.moveTo(700, 160); a.lineTo(900, 160); a.lineTo(700, 500); a.fill();
      a.fillStyle = '#ffe8b0'; a.beginPath(); a.ellipse(1200, 90, 160, 30, 0, 0, 7); a.fill(); }, opt({ size: 10 })),
    front: gouache('s3-mirror-sink', SW, SH, a => { a.fillStyle = '#d8dce4'; a.fillRect(500, 1220, 1400, 60); a.fillStyle = '#c0c4cc'; a.fillRect(540, 1280, 1320, 220); a.fillStyle = '#9aa0a8'; a.fillRect(1180, 1150, 40, 80); a.fillRect(1150, 1140, 100, 20); }, opt({ size: 8 })), night: true }),
});
