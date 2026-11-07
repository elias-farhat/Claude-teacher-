// In-world labels + props of the Rat Bounty short (explained by props, not graphics): the bounty poster, the TAILS
// ONLY sign, the hunters' counter board, the plague map, the skull shadow, coins, tails, the opening ribbon. Each is a
// Pen drawing on a card canvas, inked in the characters' plum so it sits in the world. ("NEW SEWERS 1902" and
// "RAT FARM" are painted boards on the sets themselves: sewer.ts / rooms.ts.)
import { Pen, INK } from "../bridge/toon";

type P2 = [number, number];
const serif = (p: Pen, text: string, x: number, y: number, size: number, col = INK, weight = "bold", font = "Georgia, 'Times New Roman', serif") => {
  const g = p.g; g.font = `${weight} ${size}px ${font}`; g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, x, y);
};
const sans = (p: Pen, text: string, x: number, y: number, size: number, col = INK) => serif(p, text, x, y, size, col, "900", "'Arial Black', Arial, sans-serif");
const rect = (x0: number, y0: number, x1: number, y1: number): P2[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** the bounty poster (canvas 480 x 640): "1 CENT PER RAT"; torn 0..1 rips it diagonally away */
export const poster = (torn = 0) => (p: Pen) => {
  const g = p.g;
  if (torn > 0) { g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(480, 0); g.lineTo(480, 640 * (1 - torn)); g.lineTo(0, 640 * (1 - torn) + 140 * torn); g.closePath(); g.clip(); }
  p.poly(rect(10, 10, 470, 630), "#f4e8c8", 8);
  p.poly(rect(28, 28, 452, 612), null, 4);
  serif(p, "AVIS", 240, 84, 50, "#7a2e2e", "900");
  p.stroke([[80, 120], [400, 120]], 4);
  sans(p, "1 CENT", 240, 230, 92, "#b8262e");
  sans(p, "PER RAT", 240, 340, 70, INK);
  // a little rat drawing
  p.ell(240, 470, 70, 40, "#8a8394", 6); p.ell(310, 462, 24, 18, "#8a8394", 5); p.line([[172, 470], [120, 450], [96, 480]], "#e8a0a8", 6);
  p.ell(318, 450, 6, 6, INK, 0);
  serif(p, "Hanoi, 1902", 240, 572, 30, "#5a4a40", "italic bold");
  if (torn > 0) g.restore();
};
/** the TAILS ONLY sign (canvas 640 x 240); flip 0..1 = the board flipping over (0.5 = edge-on) */
export const tailsSign = (p: Pen) => {
  p.poly(rect(14, 14, 626, 226), "#1f4a7a", 10);
  p.poly(rect(34, 34, 606, 206), null, 4);
  serif(p, "TAILS ONLY", 320, 122, 96, "#f2d58a", "900");
};
/** the back of the sign before it flips: "RATS" (crossed out) */
export const ratsSign = (p: Pen) => {
  p.poly(rect(14, 14, 626, 226), "#6a2a2a", 10);
  p.poly(rect(34, 34, 606, 206), null, 4);
  serif(p, "WHOLE RATS", 320, 122, 80, "#f2d58a", "900");
};
/** the hunters' tally board (canvas 640 x 360): numbers roll from 7,985 toward 10,000 (k 0..1) */
export const counterBoard = (k: number) => (p: Pen) => {
  p.poly(rect(14, 14, 626, 346), "#2a3a32", 12);
  p.poly(rect(34, 34, 606, 326), null, 4);
  serif(p, "RATS TODAY", 320, 84, 48, "#e8e2cc", "900");
  const n = Math.round(7985 + (10000 - 7985) * k), txt = n.toLocaleString("en-US");
  for (let i = 0; i < txt.length; i++) { // flip-board tiles
    const x = 320 + (i - (txt.length - 1) / 2) * 76, ch = txt[i];
    if (ch !== ",") p.poly(rect(x - 32, 148, x + 32, 272), "#f4efe0", 5);
    sans(p, ch, x, 214, ch === "," ? 70 : 96, ch === "," ? "#e8e2cc" : INK);
  }
};
/** plague map of Asia (canvas 720 x 520): a sickly cloud creeps from the west to Hanoi (k 0..1) */
export const plagueMap = (k: number) => (p: Pen) => {
  const g = p.g;
  p.poly(rect(10, 10, 710, 510), "#cfe0e6", 8);
  // stylised coast of Asia (our own drawing)
  p.poly([[40, 140], [180, 90], [330, 110], [470, 80], [600, 120], [680, 210], [640, 300], [560, 330], [520, 420], [470, 470], [430, 400], [380, 440], [330, 360], [250, 380], [180, 300], [90, 280], [40, 220]], "#e9d9a8", 6);
  p.poly([[520, 470], [560, 450], [600, 480], [560, 500]], "#e9d9a8", 4);
  // Hanoi star
  const hx = 505, hy = 330;
  p.ell(hx, hy, 12, 12, "#b8262e", 4); serif(p, "HANOI", hx + 4, hy + 34, 26, INK, "900");
  // the cloud: blobs travelling from (150, 220) to Hanoi
  const cx = 150 + (hx - 150) * k, cy = 220 + (hy - 220) * k;
  g.globalAlpha = 0.85;
  for (const [dx, dy, r] of [[0, 0, 60], [-50, 14, 44], [48, 18, 46], [-20, -34, 40], [30, -30, 38]] as const) p.ell(cx + dx, cy + dy, r, r * 0.8, "#8fbf4a", 5);
  g.globalAlpha = 1;
  // a skull on the cloud
  p.ell(cx, cy - 4, 22, 20, "#f4f1e6", 3); p.ell(cx - 8, cy - 6, 5, 6, INK, 0); p.ell(cx + 8, cy - 6, 5, 6, INK, 0); p.poly(rect(cx - 10, cy + 12, cx + 10, cy + 22), "#f4f1e6", 3);
  serif(p, "PLAGUE", 200, 470, 34, "#5a6a2a", "900");
};
/** skull-shaped shadow (canvas 400 x 400), soft dark plum */
export const skullShadow = (p: Pen) => {
  const g = p.g; g.globalAlpha = 0.55;
  p.ell(200, 170, 140, 130, "#2a1a30", 0);
  p.poly(rect(130, 260, 270, 340), "#2a1a30", 0);
  g.globalAlpha = 1;
  p.ell(150, 170, 34, 40, "#cfe6b0", 0); p.ell(250, 170, 34, 40, "#cfe6b0", 0);
  for (const x of [160, 200, 240]) p.poly(rect(x - 10, 290, x + 10, 330), "#cfe6b0", 0);
};
/** looming shadow of a mountain of dead rats (canvas 800 x 600) */
export const ratPileShadow = (p: Pen) => {
  const g = p.g; g.globalAlpha = 0.5;
  p.poly([[0, 600], [120, 300], [260, 200], [400, 40], [560, 180], [680, 320], [800, 600]], "#2a1a30", 0);
  for (const [x, y] of [[200, 260], [330, 120], [470, 140], [600, 280], [300, 340], [520, 360]]) { p.ell(x, y, 46, 26, "#2a1a30", 0); p.line([[x - 40, y], [x - 90, y - 30], [x - 120, y + 10]], "#2a1a30", 8, false); }
  g.globalAlpha = 1;
};
/** a coin (canvas 200 x 200) */
export const coin = (p: Pen) => { p.ell(100, 100, 80, 80, "#e8c45a", 8); p.ell(100, 100, 56, 56, null, 4); serif(p, "1", 100, 104, 70, "#8a6a2a", "900"); };
/** one rat tail (canvas 300 x 120) */
export const tail = (p: Pen) => p.line([[20, 60], [100, 30], [180, 80], [280, 50]], "#e8a0a8", 12);
/** a wicker basket heaped with tails (canvas 500 x 400) */
export const tailBasket = (p: Pen) => {
  for (let k = 0; k < 26; k++) { const x = 70 + (k * 37) % 360, y = 150 - (k % 5) * 18; p.line([[x, y + 60], [x + 30, y + 10], [x + 10, y - 40], [x + 40, y - 70]], "#e8a0a8", 9); }
  p.poly([[40, 170], [460, 170], [420, 380], [80, 380]], "#c49a5a", 8);
  for (let y = 200; y < 380; y += 30) p.stroke([[50 + (y - 170) * 0.2, y], [450 - (y - 170) * 0.2, y]], 3, "#8a6a3a");
};
/** a pile of coins (canvas 400 x 260); n coins */
export const coinPile = (n: number) => (p: Pen) => {
  for (let k = 0; k < n; k++) { const x = 200 + ((k * 53) % 220) - 110, y = 220 - Math.floor(k / 5) * 18; p.ell(x, y, 44, 16, "#e8c45a", 5); p.ell(x, y - 2, 30, 9, null, 2); }
};
/** tricolour ribbon across the grate (canvas 800 x 120); cut 0..1 splits it in two */
export const ribbon = (cut: number) => (p: Pen) => {
  const gap = 300 * cut, droop = 60 * cut;
  p.line([[0, 50], [400 - gap / 2, 50 + droop]], "#2a4f9a", 26); p.line([[400 + gap / 2, 50 + droop], [800, 50]], "#c8313b", 26);
  if (cut < 0.05) p.ell(400, 50, 34, 24, "#f4f1ea", 6);
};
