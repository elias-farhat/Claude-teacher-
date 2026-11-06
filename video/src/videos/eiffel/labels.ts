// In-world labels (STYLE_BIBLE.md 6.2): explained by props, not graphics. Each is a Pen drawing on a card canvas,
// drawn in the same plum ink as the characters so they sit in the world.
import { Pen, INK } from "../bridge/toon";

type P2 = [number, number];
const serif = (p: Pen, text: string, x: number, y: number, size: number, col = INK, weight = "bold", font = "Georgia, 'Times New Roman', serif") => {
  const g = p.g; g.font = `${weight} ${size}px ${font}`; g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, x, y);
};
const sans = (p: Pen, text: string, x: number, y: number, size: number, col = INK) => serif(p, text, x, y, size, col, "900", "'Arial Black', Arial, sans-serif");
const rect = (x0: number, y0: number, x1: number, y1: number): P2[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** luggage tag on a string: "SOLD", or flipped "SOLD AGAIN?" (canvas 400 x 560) */
export const tag = (p: Pen, again: boolean) => {
  p.stroke([[200, 0], [200, 120]], 6);
  const pts: P2[] = [[110, 150], [200, 110], [290, 150], [290, 520], [110, 520]];
  p.poly(pts, again ? "#ffe9a8" : "#fff4d6", 10);
  p.ell(200, 160, 16, 16, "#c8a46a", 6);
  if (again) { sans(p, "SOLD", 200, 280, 50, "#b8262e"); sans(p, "AGAIN?", 200, 370, 40, "#b8262e"); p.stroke([[130, 440], [270, 440]], 6, "#b8262e"); }
  else { sans(p, "SOLD", 200, 330, 58, "#b8262e"); p.stroke([[130, 400], [270, 400]], 6, "#b8262e"); }
};
/** newspaper held up, front page (canvas 640 x 480) */
export const newspaper = (p: Pen) => {
  p.poly(rect(20, 20, 620, 460), "#f1ead9", 8);
  serif(p, "LE MATIN", 320, 68, 48);
  p.stroke([[50, 100], [590, 100]], 4);
  serif(p, "TOWER COSTS", 320, 150, 54, "#2a2030", "900");
  serif(p, "A FORTUNE", 320, 210, 54, "#2a2030", "900");
  for (let k = 0; k < 6; k++) { p.stroke([[60, 268 + k * 30], [300, 268 + k * 30]], 6, "#9a90a0"); p.stroke([[340, 268 + k * 30], [580, 268 + k * 30]], 6, "#9a90a0"); }
  // tiny tower sketch in the corner column
  p.stroke([[460, 440], [480, 260], [500, 440]], 5); p.stroke([[468, 380], [492, 380]], 4);
};
/** forged letterhead (canvas 480 x 640) */
export const letterhead = (p: Pen) => {
  p.poly(rect(20, 20, 460, 620), "#fbf6ea", 8);
  p.ell(240, 92, 34, 34, null, 5); serif(p, "RF", 240, 94, 30);
  serif(p, "MINISTRY OF POSTS", 240, 164, 34, "#2a2a55");
  serif(p, "& TELEGRAPHS", 240, 206, 34, "#2a2a55");
  p.stroke([[60, 236], [420, 236]], 4, "#2a2a55");
  for (let k = 0; k < 8; k++) p.stroke([[70, 290 + k * 34], [410 - (k % 3) * 40, 290 + k * 34]], 5, "#a39aa8");
  p.ell(330, 540, 62, 62, null, 7); serif(p, "OFFICIAL", 330, 540, 22, "#b8262e"); // stamp
};
/** "7,000 TONS" price tag stamped on the tower blueprint (canvas 640 x 320) */
export const tonsStamp = (p: Pen) => {
  const g = p.g; g.save(); g.translate(320, 160); g.rotate(-0.12); g.translate(-320, -160);
  p.poly(rect(40, 40, 600, 280), "#fff0c8", 12);
  p.poly(rect(64, 64, 576, 256), null, 6);
  sans(p, "7,000", 320, 128, 104, "#b8262e");
  sans(p, "TONS", 320, 214, 78, "#b8262e");
  g.restore();
};
/** blueprint of the tower unrolled on the table (canvas 640 x 900) */
export const blueprint = (p: Pen) => {
  p.poly(rect(10, 10, 630, 890), "#2f5f9e", 8);
  const W = "#dbe9ff";
  p.stroke([[120, 840], [300, 120], [320, 60], [340, 120], [520, 840]], 6, W);
  for (const y of [560, 340, 180]) { const k = (840 - y) / 720; p.stroke([[120 + 180 * k, y], [520 - 180 * k, y]], 5, W); }
  p.arc(320, 840, 140, 150, 180, 360, 5, W);
  for (let y = 600; y < 840; y += 40) p.stroke([[160 + (840 - y) * 0.18, y], [480 - (840 - y) * 0.18, y - 40]], 2, W);
  serif(p, "TOUR — 7 000 T", 320, 40, 28, W);
};
/** train ticket "PARIS → VIENNA" (canvas 640 x 300) */
export const ticket = (p: Pen) => {
  p.poly([[20, 30], [620, 30], [620, 270], [20, 270]], "#f3d7a0", 8);
  for (let y = 40; y < 270; y += 24) p.dot(110, y, 5, "#9a7a50");
  serif(p, "1re CLASSE", 370, 74, 30, "#7a3a2a");
  sans(p, "PARIS → VIENNA", 370, 150, 52);
  serif(p, "ORIENT-EXPRESS · 1925", 370, 222, 24, "#5a4a5a", "normal");
};
/** "BILL OF SALE: EIFFEL TOWER" (canvas 520 x 680) */
export const billOfSale = (p: Pen) => {
  p.poly(rect(20, 20, 500, 660), "#fbf3df", 8);
  serif(p, "BILL OF SALE", 260, 90, 50);
  p.stroke([[60, 128], [460, 128]], 4);
  serif(p, "EIFFEL TOWER", 260, 186, 48, "#b8262e", "900");
  serif(p, "7 000 tons of iron", 260, 240, 26, "#5a4a5a", "italic");
  for (let k = 0; k < 6; k++) p.stroke([[70, 300 + k * 34], [450 - (k % 2) * 60, 300 + k * 34]], 5, "#b0a6b4");
  p.stroke([[70, 590], [300, 590]], 4); serif(p, "A. Poisson", 190, 565, 30, "#2a2a55", "italic");
};
/** death certificate (canvas 560 x 760): the payoff */
export const certificate = (p: Pen) => {
  p.poly(rect(20, 20, 540, 740), "#f6f0e2", 8);
  p.poly(rect(44, 44, 516, 716), null, 4);
  serif(p, "CERTIFICATE OF DEATH", 280, 100, 34);
  serif(p, "Springfield, Missouri · 1947", 280, 146, 22, "#5a4a5a", "italic");
  p.stroke([[80, 178], [480, 178]], 3);
  for (let k = 0; k < 3; k++) p.stroke([[90, 226 + k * 38], [470 - k * 50, 226 + k * 38]], 5, "#b8aebc");
  serif(p, "OCCUPATION:", 280, 400, 34, "#2a2030");
  sans(p, "APPRENTICE", 280, 480, 60, "#b8262e");
  sans(p, "SALESMAN", 280, 552, 60, "#b8262e");
  for (let k = 0; k < 2; k++) p.stroke([[90, 630 + k * 36], [400, 630 + k * 36]], 5, "#b8aebc");
};
/** sign boards: "CONFIDENTIAL" door sign, "GRAND HÔTEL", "CAFÉ" etc. (canvas 640 x 200) */
export const sign = (p: Pen, text: string, bg = "#2a3a6a", fg = "#f2d58a") => {
  p.poly(rect(14, 14, 626, 186), bg, 10);
  p.poly(rect(34, 34, 606, 166), null, 4);
  serif(p, text, 320, 104, text.length > 10 ? 58 : 76, fg, "900");
};
/** envelope with a wax seal (canvas 300 x 200) */
export const envelope = (p: Pen) => {
  p.poly(rect(14, 14, 286, 186), "#f2e6c8", 8);
  p.stroke([[14, 14], [150, 110], [286, 14]], 6);
  p.ell(150, 112, 22, 22, "#b8262e", 5);
};
/** bundle of francs (canvas 300 x 200) */
export const francs = (p: Pen) => {
  for (let k = 3; k >= 0; k--) p.poly(rect(20 + k * 6, 40 - k * 8, 260 + k * 6, 170 - k * 8), "#c9d7a4", 6);
  p.poly(rect(120, 20, 160, 162), "#e8d28a", 5);
  serif(p, "F", 70, 100, 50, "#4a6a3a");
};
/** money bag with a franc sign (canvas 300 x 360) */
export const moneyBag = (p: Pen) => {
  p.poly([[150, 60], [230, 120], [270, 250], [240, 330], [60, 330], [30, 250], [70, 120]], "#c9a46a", 9);
  p.poly([[110, 40], [190, 40], [170, 72], [130, 72]], "#c9a46a", 8);
  serif(p, "₣", 150, 230, 110, "#5a3a20");
};
/** speech-free gag cards: X-ray head with a DOUBT gear (canvas 500 x 500) */
export const xrayDoubt = (p: Pen, spin: number) => {
  p.ell(250, 250, 220, 230, "#1d3a5a", 10);
  p.ell(250, 230, 150, 130, "#3f6f9e", 6);
  const n = 10, cx = 250, cy = 230, r0 = 62, r1 = 82, pts: P2[] = [];
  for (let k = 0; k < n * 2; k++) { const a = spin + (k * Math.PI) / n, r = k % 2 ? r0 : r1; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  p.poly(pts, "#e0b04a", 8); p.ell(cx, cy, 22, 22, "#1d3a5a", 6);
  serif(p, "DOUBT", 250, 380, 44, "#ffe08a", "900");
};
/** split gag: FAKE official with a halo vs REAL official with a sneaky grin, captions on plaques (canvas 640 x 160) */
export const plaque = (p: Pen, text: string, col: string) => {
  p.poly(rect(20, 20, 620, 140), col, 10);
  sans(p, text, 320, 82, 76, "#fff8e8");
};
