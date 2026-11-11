// Vertical Short (1080x1920) cut from the POV film: picks segments, crops a 9:16 window that follows the subject,
// and redraws captions + hook text natively for the vertical frame. Audio is cut from the final film with the same segments.
// SEGS: [filmStart, filmEnd, [[filmTime, cropCentreX], ...]]
const SEGS = [
  [27.35, 35.2, [[0, 960]]],
  [47.75, 53.4, [[0, 920], [51.6, 920], [52.2, 1480]]],
  [130.2, 137.2, [[0, 960]]],
  [157.7, 164.0, [[0, 960], [160.3, 960], [160.6, 1440]]],
  [174.8, 180.0, [[0, 480], [176.15, 480], [176.45, 1440], [177.35, 1440], [177.55, 960]]],
];
const SHORT_DUR = SEGS.reduce((a, s) => a + s[1] - s[0], 0);
const V = document.createElement('canvas'); V.width = 1080; V.height = 1920; V.id = 'v'; document.body.appendChild(V); const vx = V.getContext('2d');
window.OUT = 'v'; window.cap2 = () => {};
function cropAt(ft, keys) { if (keys.length === 1) return keys[0][1]; let i = 0; while (i < keys.length - 2 && ft > keys[i + 1][0]) i++; const a = keys[i], b = keys[i + 1]; return ft <= a[0] || a[0] === 0 && ft < b[0] ? (a[0] === 0 ? (ft < b[0] ? a[1] : b[1]) : a[1]) : lerp(a[1], b[1], ease(seg(ft, a[0], b[0]))); }
function shortRender(ts) {
  let acc = 0, k = 0; while (k < SEGS.length - 1 && ts >= acc + SEGS[k][1] - SEGS[k][0]) { acc += SEGS[k][1] - SEGS[k][0]; k++; }
  const [f0, f1, keys] = SEGS[k], ft = Math.min(f0 + (ts - acc), f1 - 1 / 30), cx = clamp(cropAt(ft, keys), 304, W - 304);
  window.SHORTCX = cx; render2(ft);
  vx.setTransform(1, 0, 0, 1, 0, 0); vx.drawImage(cv, cx - 304, 0, 608, 1080, 0, 0, 1080, 1920);
  // hook banner (top) and captions (lower third, clear of the Shorts UI)
  vx.textAlign = 'center'; vx.textBaseline = 'middle'; vx.lineJoin = 'round';
  if (k < SEGS.length - 1) { vx.globalAlpha = k === SEGS.length - 2 ? 1 - seg(ts, acc + (SEGS[k][1] - SEGS[k][0]) - .4, acc + (SEGS[k][1] - SEGS[k][0])) : 1; vx.fillStyle = 'rgba(20,10,24,.55)'; vx.beginPath(); vx.roundRect(70, 120, 940, 190, 40); vx.fill();
  vx.font = '700 64px Fredoka'; vx.fillStyle = '#ffe9b8'; vx.fillText('What if you could', 540, 180); vx.fillText('NEVER forget?', 540, 254); vx.globalAlpha = 1; }
  let li = -1; for (let i = 0; i < TIM2.length; i++) if (TIM2[i].t0 - .12 <= ft) li = i;
  if (li >= 0) { const l = TIM2[li], nx = TIM2[li + 1], end = Math.min(nx ? nx.t0 - .12 : 1e9, l.t1 + .7);
    if (ft <= end && l.t0 - .12 >= f0 - .3) { vx.font = '700 70px Fredoka'; const words = l.text.split(' '), lines = []; let cur = '';
      for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (vx.measureText(tr).width > 900 && cur) { lines.push(cur); cur = w; } else cur = tr; } lines.push(cur);
      vx.globalAlpha = Math.min(seg(ft, l.t0 - .12, l.t0 + .05), 1 - seg(ft, end - .12, end)) ;
      lines.forEach((s, i) => { const y = 1390 + i * 86; vx.lineWidth = 14; vx.strokeStyle = 'rgba(30,12,24,.85)'; vx.strokeText(s, 540, y); vx.fillStyle = '#fff6e6'; vx.fillText(s, 540, y); }); vx.globalAlpha = 1; } }
  // end card over the run: send them to the full video
  const endA = seg(ts, SHORT_DUR - 2.4, SHORT_DUR - 1.9);
  if (endA > 0) { vx.globalAlpha = endA; vx.fillStyle = 'rgba(20,10,24,.6)'; vx.fillRect(0, 0, 1080, 1920);
    vx.font = '700 84px Fredoka'; vx.fillStyle = '#fff6e6'; vx.fillText('What would you choose?', 540, 820);
    vx.fillStyle = '#c0392b'; vx.beginPath(); vx.roundRect(140, 930, 800, 150, 75); vx.fill(); vx.fillStyle = '#fff8ec'; vx.font = '700 64px Fredoka'; vx.fillText('▶  Watch the full story', 540, 1008); vx.globalAlpha = 1; }
  // cut dips between segments
  const into = ts - acc, left = (SEGS[k][1] - SEGS[k][0]) - into, d = Math.min(seg(into, 0, .12), seg(left, 0, .12));
  if (k > 0 || into > .12) if (d < 1) { vx.fillStyle = `rgba(14,6,14,${1 - d})`; vx.fillRect(0, 0, 1080, 1920); }
}
window.render = shortRender; window.SHORT_DUR = SHORT_DUR;
