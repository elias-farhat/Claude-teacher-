// Fixes from Elias's scene review: full-body standing people, seated bus driver in profile, baby lying in the stroller (top view), phone held in hand.
const LEGC = { p1: '#3a4a6a', p2: '#4a3a30', p3: '#2e3a52', f1: '#3a3a48', f2: '#5a4a3a', f3: '#2a3a4a', f4: '#4a4458', leo: '#2e3446', baker: '#4a4a52', driver: '#2a3048' };
// front-facing standing person; feet at footY. Body = bust (neck at footY - 1220 s) + hips + legs + shoes.
function personFull(id, x, footY, s, o, t) { const ny = footY - 1220 * s, lc = LEGC[id] || '#3a3a48';
  ctx.save(); ctx.translate(x, footY); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(20,10,20,.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 220, 34, 0, 0, 7); ctx.fill();
  const sw = o.walk ? Math.sin(t * 7 + (o.ph || 0)) * 18 : 0;
  for (const sd of [-1, 1]) { const g = ctx.createLinearGradient(sd * 120, 0, sd * 20, 0); g.addColorStop(0, shade2(lc, .8)); g.addColorStop(1, lc); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(sd * 10, -720); ctx.lineTo(sd * 180, -720); ctx.lineTo(sd * 150 + sw * sd, -40); ctx.lineTo(sd * 40 + sw * sd, -40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a2026'; ctx.beginPath(); ctx.ellipse(sd * 98 + sw * sd, -22, 76, 30, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(sd * 98 + sw * sd - 50, -44, 100, 6); }
  ctx.fillStyle = shade2(lc, .9); ctx.beginPath(); ctx.roundRect(-196, -760, 392, 110, 30); ctx.fill();
  ctx.restore();
  drawBust(id, x, ny, Object.assign({ s, armL: .06, armR: .06 }, o), t); return ny - 124 * s; }

// bus driver, seen from the open door: profile facing left, seated, hands on the wheel
function driverSide(x, y, s, t) { const d = CAST2.driver; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.roundRect(40, -560, 120, 600, 30); ctx.fill(); ctx.fillStyle = '#34343f'; ctx.beginPath(); ctx.roundRect(-140, -40, 320, 90, 26); ctx.fill();   // seat back + cushion
  ctx.fillStyle = '#1e1e26'; ctx.fillRect(10, 50, 40, 260); ctx.fillRect(-120, 290, 300, 30);
  ctx.fillStyle = '#2a3048'; ctx.beginPath(); ctx.roundRect(-230, -60, 300, 110, 50); ctx.fill(); ctx.beginPath(); ctx.roundRect(-250, -40, 90, 330, 40); ctx.fill();   // thigh + shin
  ctx.fillStyle = '#1e1a1e'; ctx.beginPath(); ctx.ellipse(-250, 300, 90, 34, 0, 0, 7); ctx.fill();
  const bt = Math.sin(t * 2) * 3; ctx.fillStyle = d.top; ctx.beginPath(); ctx.moveTo(-60, -40); ctx.lineTo(110, -40); ctx.bezierCurveTo(130, -200, 110, -360, 60, -400); ctx.lineTo(-40, -400 + bt); ctx.bezierCurveTo(-90, -360, -90, -200, -60, -40); ctx.fill();   // torso
  ctx.fillStyle = shade2(d.top, .8); ctx.beginPath(); ctx.moveTo(-40, -400); ctx.lineTo(10, -400); ctx.lineTo(-20, -330); ctx.fill();
  ctx.fillStyle = '#3a3a44'; ctx.fillRect(-330, -360, 26, 330); ctx.save(); ctx.translate(-300, -330); ctx.rotate(-.35); ctx.strokeStyle = '#1e1e26'; ctx.lineWidth = 26; ctx.beginPath(); ctx.ellipse(0, 0, 40, 150, 0, 0, 7); ctx.stroke(); ctx.restore();   // steering column + wheel
  ctx.fillStyle = shade2(d.top, .9); ctx.save(); ctx.translate(-10, -360); ctx.rotate(1.2); ctx.beginPath(); ctx.roundRect(-30, 0, 60, 200, 28); ctx.fill(); ctx.restore();   // upper arm
  ctx.save(); ctx.translate(-190, -290); ctx.rotate(1.9); ctx.beginPath(); ctx.roundRect(-26, 0, 52, 130, 24); ctx.fill(); ctx.restore();
  ctx.fillStyle = d.skin; ctx.beginPath(); ctx.arc(-300, -380, 30, 0, 7); ctx.fill();   // hand on the wheel
  // head in profile
  ctx.save(); ctx.translate(-10, -440 + bt);
  ctx.fillStyle = d.skin; ctx.fillRect(-30, -10, 60, 60); ctx.beginPath(); ctx.ellipse(0, -110, 100, 112, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-96, -120); ctx.quadraticCurveTo(-130, -90, -100, -80); ctx.fill();   // nose
  ctx.fillStyle = d.skin2; ctx.beginPath(); ctx.ellipse(36, -110, 18, 26, 0, 0, 7); ctx.fill();   // ear
  ctx.fillStyle = d.hair; ctx.beginPath(); ctx.moveTo(-90, -150); ctx.bezierCurveTo(-90, -240, 80, -250, 100, -130); ctx.lineTo(100, -60); ctx.lineTo(60, -70); ctx.bezierCurveTo(60, -130, 20, -150, -90, -150); ctx.fill();
  ctx.fillStyle = '#2a3a6a'; ctx.beginPath(); ctx.moveTo(-104, -170); ctx.lineTo(100, -170); ctx.bezierCurveTo(100, -250, -80, -260, -96, -180); ctx.fill(); ctx.fillRect(-170, -176, 90, 14);   // cap + visor
  const bl = (t % 3.3) < .12; ctx.fillStyle = '#24161c'; if (bl) ctx.fillRect(-82, -122, 22, 4); else { ctx.beginPath(); ctx.ellipse(-70, -120, 7, 11, 0, 0, 7); ctx.fill(); }
  ctx.strokeStyle = '#24161c'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-90, -146); ctx.lineTo(-52, -150); ctx.stroke();
  ctx.strokeStyle = '#9a4a4a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-96, -54); ctx.quadraticCurveTo(-80, -44, -66, -56); ctx.stroke();
  ctx.restore(); ctx.restore(); }

// POV looking down into the stroller: the baby lying under a blanket
function babyTop(cx, cy, s, t) { ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = '#3a5a7a'; ctx.beginPath(); ctx.ellipse(0, 0, 460, 300, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8eef6'; ctx.beginPath(); ctx.ellipse(0, 10, 400, 250, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#d0dceb'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse(-360 + k * 90, -220 + Math.abs(k - 4) * 10, 50, 26, 0, 0, 7); ctx.fill(); }   // padded rim
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-210, 10, 120, 100, 0, 0, 7); ctx.fill();   // pillow
  const br = Math.sin(t * 2.4) * 6;
  ctx.fillStyle = '#f0c4a0'; ctx.beginPath(); ctx.arc(-200, 10, 84, 0, 7); ctx.fill();   // head
  ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.arc(-286, 10, 16, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(-114, 10, 16, 0, 7); ctx.fill();
  ctx.fillStyle = '#6a4a30'; ctx.beginPath(); ctx.arc(-276, 10, 40, Math.PI * .6, Math.PI * 1.4); ctx.fill();   // wisp of hair
  ctx.save(); ctx.translate(-200, 10); ctx.rotate(-Math.PI / 2);   // face pointing up the frame (toward the viewer's top)
  const bl = (t % 2.7) < .14; ctx.fillStyle = '#2a1d24'; for (const sd of [-1, 1]) { if (bl) ctx.fillRect(sd * 28 - 9, -14, 18, 3); else { ctx.beginPath(); ctx.arc(sd * 28, -12, 8, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sd * 28 - 3, -15, 2.5, 0, 7); ctx.fill(); ctx.fillStyle = '#2a1d24'; } }
  ctx.fillStyle = 'rgba(230,110,100,.4)'; ctx.beginPath(); ctx.arc(-46, 12, 14, 0, 7); ctx.arc(46, 12, 14, 0, 7); ctx.fill();
  ctx.strokeStyle = '#9a4a4a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 18, 14, .3, Math.PI - .3); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#f2c6d6'; ctx.beginPath(); ctx.moveTo(-120, -170 - br); ctx.quadraticCurveTo(160, -210, 330, -150); ctx.quadraticCurveTo(380, 0, 330, 160); ctx.quadraticCurveTo(160, 220, -120, 180 + br); ctx.quadraticCurveTo(-150, 0, -120, -170 - br); ctx.fill();   // blanket
  ctx.fillStyle = '#ffffff'; for (let k = 0; k < 12; k++) { ctx.beginPath(); ctx.arc(-40 + (k % 4) * 100, -100 + Math.floor(k / 4) * 100, 10, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#e8a8c0'; ctx.fillRect(-130, -170, 40, 350);   // blanket fold
  const wv = Math.sin(t * 3) * 10; ctx.fillStyle = '#f0c4a0'; ctx.beginPath(); ctx.arc(-100, -150 + wv, 26, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(-100, 150 - wv, 26, 0, 7); ctx.fill();   // little hands
  ctx.restore(); }
