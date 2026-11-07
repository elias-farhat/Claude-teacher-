// In-world props + labels of the Moon Hoax short (Pen drawings on card canvases, plum ink): the sales chart, the
// DAY 1 page, HOAX!, the four-language letters, Locke's signature, calendar pages, the rumour cloud, paper birds,
// Herschel's portrait (eyebrow up on cue).
import { Pen, INK } from "../bridge/toon";

type P2 = [number, number];
const serif = (p: Pen, text: string, x: number, y: number, size: number, col = INK, weight = "bold", font = "Georgia, 'Times New Roman', serif") => {
  const g = p.g; g.font = `${weight} ${size}px ${font}`; g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, x, y);
};
const rect = (x0: number, y0: number, x1: number, y1: number): P2[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** sales chart (canvas 520 x 400): k = 0 flat on the floor, 1 shooting up */
export const salesChart = (k: number) => (p: Pen) => {
  p.poly(rect(10, 10, 510, 390), "#f4ecd8", 8);
  serif(p, "SALES", 260, 48, 40, "#7a2e2e", "900");
  p.stroke([[60, 340], [480, 340]], 5); p.stroke([[60, 340], [60, 80]], 5);
  const pts: P2[] = [[60, 330], [150, 332], [240, 331], [330, 333 - 40 * k], [400, 332 - 172 * k], [470, 330 - 240 * k]];
  p.line(pts, k > 0.2 ? "#2f8a4a" : "#b8262e", 9);
};
/** the DAY 1 front page on a board (canvas 480 x 600) */
export const dayPage = (day: string, pic: "forest" | "goat" | "bats") => (p: Pen) => {
  p.poly(rect(10, 10, 470, 590), "#f1e8d6", 8);
  serif(p, "THE SUN", 240, 60, 52, INK, "900"); p.stroke([[40, 96], [440, 96]], 4);
  serif(p, day, 240, 150, 64, "#7a2e2e", "900");
  p.poly(rect(60, 200, 420, 470), "#cfe0e6", 5);
  if (pic === "forest") { for (let k = 0; k < 5; k++) { p.ell(100 + k * 70, 330, 34, 46, "#7fb7c9", 4); p.stroke([[100 + k * 70, 376], [100 + k * 70, 420]], 6); } p.line([[60, 440], [140, 430], [220, 445], [300, 432], [420, 440]], "#3f86a8", 10); }
  else if (pic === "goat") { p.ell(240, 360, 80, 50, "#6f8fd0", 5); p.ell(310, 300, 40, 36, "#6f8fd0", 5); p.poly([[304, 266], [316, 200], [326, 268]], "#f2e6c8", 4); }
  else { for (const [x, y] of [[170, 320], [300, 290]]) { p.ell(x, y, 12, 20, "#7a5a4a", 3); for (const s of [-1, 1]) p.poly([[x + s * 8, y - 6], [x + s * 60, y - 30], [x + s * 50, y], [x + s * 60, y + 24], [x + s * 10, y + 14]], "#5a4034", 3); } }
  for (let k = 0; k < 3; k++) p.stroke([[60, 500 + k * 26], [420, 500 + k * 26]], 3, "#8a8070");
};
/** the rival's front page (canvas 480 x 600) */
export const hoaxPage = (p: Pen) => {
  p.poly(rect(10, 10, 470, 590), "#f1e8d6", 8);
  serif(p, "THE HERALD", 240, 60, 46, INK, "900"); p.stroke([[40, 96], [440, 96]], 4);
  serif(p, "HOAX!", 240, 230, 150, "#b8262e", "900");
  for (let k = 0; k < 8; k++) p.stroke([[60, 360 + k * 26], [420, 360 + k * 26]], 3, "#8a8070");
};
/** a letter labelled with a language (canvas 360 x 240) */
export const letter = (lang: string) => (p: Pen) => {
  p.poly(rect(10, 10, 350, 230), "#f4ecd8", 6);
  p.stroke([[10, 10], [180, 120], [350, 10]], 4);
  p.ell(180, 122, 20, 20, "#b8262e", 4);
  serif(p, lang, 180, 196, 40, "#2a3a6a", "900");
};
/** Locke's line, written as k goes 0 -> 1 (canvas 900 x 300) */
const SIG_LINES: [string, number, number, number][] = [["R. A. Locke,", 120, 84, 460], ["author of the", 255, 66, 430], ["Moon hoax", 380, 74, 360]]; // text, y, size, width
const SIG_TOTAL = SIG_LINES.reduce((a, l) => a + l[3], 0);
const SIG_FONT = "'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive, Georgia";
/** Locke's signature on a sheet (canvas 700 x 500), written line by line up to k (0..1) */
export const signature = (k: number) => (p: Pen) => {
  p.poly(rect(10, 10, 690, 490), "#f6efdc", 6);
  for (let i = 0; i < 3; i++) p.stroke([[50, 150 + i * 130], [650, 150 + i * 130]], 2, "#d8ccb0");
  let left = k * SIG_TOTAL;
  for (const [text, y, size, w] of SIG_LINES) {
    if (left <= 0) break;
    const x0 = 350 - w / 2, g = p.g; g.save(); g.beginPath(); g.rect(x0 - 20, y - size, Math.min(w, left) + 20, size * 2); g.clip();
    serif(p, text, 350, y, size, "#1d2a55", "italic bold", SIG_FONT); g.restore(); left -= w;
  }
};
/** where the pen tip is on the sheet at progress k, as [u, v] (0..1 across / down the canvas) */
export const signatureTip = (k: number): [number, number] => {
  let left = Math.min(k, 0.999) * SIG_TOTAL;
  for (const [, y, , w] of SIG_LINES) { if (left <= w) return [(350 - w / 2 + left) / 700, (y + 18) / 500]; left -= w; }
  return [0.75, 0.8];
};
/** a quill pen, nib at the bottom (canvas 120 x 400) */
export const quill = (p: Pen) => {
  p.poly([[60, 395], [52, 330], [68, 330]], "#2a2a33", 3);
  p.poly([[60, 340], [20, 200], [30, 60], [60, 6], [92, 70], [98, 200]], "#f4f1ea", 5);
  p.stroke([[60, 345], [62, 20]], 3, "#b8a888");
};
/** "EXTRA! EXTRA!" shout bubble (canvas 520 x 300), f = 0 / 0.5 jiggle */
export const shout = (f: number) => (p: Pen) => {
  const j = f > 0.25 ? 6 : 0;
  p.poly([[40 + j, 40], [480, 30 + j], [500 - j, 210], [190, 220], [90, 290], [120, 220], [30, 215 - j]], "#fff6c8", 8);
  serif(p, "EXTRA!", 265, 95, 92, "#b8262e", "900");
  serif(p, "BAT-PEOPLE!", 265, 175, 62, INK, "900");
};
/** a calendar page (canvas 240 x 300) */
export const calendarPage = (month: string) => (p: Pen) => {
  p.poly(rect(10, 10, 230, 290), "#f6f0e2", 6); p.poly(rect(10, 10, 230, 80), "#b8262e", 6);
  serif(p, month, 120, 46, 40, "#f6f0e2", "900"); serif(p, "1835", 120, 190, 64);
};
/** the rumour cloud over a gossiping crowd back home (canvas 640 x 420) */
export const rumorCloud = (p: Pen) => {
  for (const [x, y, r] of [[170, 190, 140], [330, 150, 150], [480, 200, 130], [320, 280, 140]] as const) p.ell(x, y, r, r * 0.78, "#f6f4ee", 6);
  p.ell(140, 370, 24, 18, "#f6f4ee", 4); p.ell(100, 404, 14, 11, "#f6f4ee", 3);
  serif(p, "HERSCHEL?", 320, 120, 74, INK, "900");
  serif(p, "ON THE MOON?!", 320, 195, 58, "#b8262e", "900");
  for (let k = 0; k < 5; k++) { const x = 190 + k * 66, y = 280; p.ell(x, y, 24, 26, "#ffe2c2", 4); p.ell(x - 8, y - 5, 3.5, 3.5, INK, 0); p.ell(x + 8, y - 5, 3.5, 3.5, INK, 0); p.ell(x, y + 11, 7, k % 2 ? 7 : 3, "#3a1a1a", 0); }
};
/** "no signal" bubble (canvas 300 x 220) */
export const noSignal = (p: Pen) => {
  p.ell(150, 100, 130, 86, "#f6f4ee", 6);
  for (let k = 0; k < 4; k++) p.poly(rect(80 + k * 40, 130 - k * 22, 106 + k * 40, 140), "#c9ccd2", 3);
  p.stroke([[70, 40], [230, 160]], 10, "#b8262e");
};
/** a newspaper flapping like a bird (canvas 300 x 200), flap 0..1 */
export const paperBird = (flap: number) => (p: Pen) => {
  const a = Math.sin(flap * Math.PI * 2) * 50;
  p.poly([[150, 110], [20, 60 - a], [40, 130 - a * 0.3]], "#f1e8d6", 5); p.poly([[150, 110], [280, 60 - a], [260, 130 - a * 0.3]], "#f1e8d6", 5);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.stroke([[150 + s * 30, 104 + k * 6 - a * 0.1], [150 + s * 100, 84 + k * 8 - a * 0.6]], 2, "#8a8070");
};
/** Herschel's portrait (canvas 360 x 440): brow 0..1 raises his right eyebrow */
export const portrait = (brow: number) => (p: Pen) => {
  p.poly(rect(0, 0, 360, 440), "#4a3a5a", 0);
  p.poly([[60, 440], [80, 330], [280, 330], [300, 440]], "#2a2a3a", 5);
  p.ell(180, 200, 100, 120, "#ffe2c2", 7);
  for (const s of [-1, 1]) p.poly([[180 + s * 80, 150], [180 + s * 108, 170], [180 + s * 100, 270], [180 + s * 74, 250]], "#e8e4dc", 4); // sideburns
  p.ell(180, 100, 92, 40, "#e8e4dc", 5);
  p.ell(140, 200, 10, 12, INK, 0); p.ell(220, 196, 10, 12, INK, 0);
  p.stroke([[118, 168], [160, 170]], 6); p.stroke([[200, 168 - 26 * brow], [244, 160 - 34 * brow]], 6);
  p.arc(180, 262, 30, 12, 20, 160, 5);
};
