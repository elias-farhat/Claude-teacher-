// Characters from DiceBear "toon-head" (Johan Melin, CC BY 4.0): art/toon/<id>_<eyes>_<mouth>.svg
// Drawn in place of the code-drawn bust; same anchor (neck at y, eyes at y-124*s). Blink = 'happy' eyes, talk = 'agape' mouth.
const TOON = {}, TOON_IDS = { mom: '#ec4899', kid: '#0b3286' };
window.TOON_READY = Promise.all(Object.keys(TOON_IDS).flatMap(id => ['wide_smile', 'wide_agape', 'happy_smile', 'happy_agape'].map(v => new Promise(r => {
  const im = new Image(); im.onload = () => r(); im.onerror = () => r(); im.src = `art/toon/${id}_${v}.svg`; (TOON[id] = TOON[id] || {})[v] = im; }))));
const _drawBust = drawBust;
drawBust = function (id, x, y, o, t) {
  const set = TOON[id]; if (!set) return _drawBust(id, x, y, o, t);
  const s = o.s || 1, k = .66 * s, br = Math.sin(t * 2) * 3 * s;
  const blink = (hash(Math.floor(t * 1.1) + id.length) > .8 && (t * 1.1 % 1) < .12) || o.face === 'closed' || o.face === 'happy';
  const talk = o.talk && Math.abs(Math.sin(t * 11)) > .45;
  const im = set[(blink ? 'happy' : 'wide') + '_' + (talk || o.face === 'shock' ? 'agape' : 'smile')];
  const ox = x - 384 * k, oy = (y - 124 * s) - 405 * k + br;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.lean || 0); ctx.translate(-x, -y);
  // extend the body below the art's bottom edge so the torso never ends mid-frame
  ctx.fillStyle = TOON_IDS[id]; ctx.beginPath(); ctx.moveTo(ox + 150 * k, oy + 760 * k); ctx.lineTo(ox + 618 * k, oy + 760 * k); ctx.lineTo(ox + 650 * k, oy + 1500 * k); ctx.lineTo(ox + 118 * k, oy + 1500 * k); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(ox + 150 * k, oy + 760 * k); ctx.lineTo(ox + 118 * k, oy + 1500 * k); ctx.moveTo(ox + 618 * k, oy + 760 * k); ctx.lineTo(ox + 650 * k, oy + 1500 * k); ctx.stroke();
  ctx.drawImage(im, ox, oy, 768 * k, 768 * k);
  ctx.restore();
};
