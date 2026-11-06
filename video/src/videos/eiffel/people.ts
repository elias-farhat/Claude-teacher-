// Our own cast for the Eiffel short, drawn with the skill's character system (toon.ts): bean heads, plum ink,
// stick limbs. Lustig: purple suit, top hat, thin moustache, gold monocle. André: brown coat, flat cap, round
// glasses. Gestures are custom arm poses (toon.ts armFn) + overlays (monocle, glasses, held props).
import { Pen, bodyFront, Outfit, Expr, FrontGeo, INK, SKIN, mix } from "../bridge/toon";

type P2 = [number, number];
type Arm = { pts: [P2, P2, P2]; front: boolean };

export const LUSTIG: Outfit = { jacket: "#6a3c8c", pants: "#4b2b66", boots: "#241726", hat: "tophat", moustache: "#2a1a22", skin: SKIN, buttons: "#d9b45a" };
export const ANDRE: Outfit = { jacket: "#7a5236", pants: "#4a3a30", boots: "#3a2a20", hat: "cap", cap: "#6c6258", skin: "#f5c9a0", buttons: "#3a2a20", build: "stout" };
export const ANDRE_BARE: Outfit = { ...ANDRE, hat: "hair", hair: "#5a3b2a" };
export const FORGER: Outfit = { jacket: "#3f6f5a", pants: "#3b3f52", boots: "#3a2a20", hat: "hair", hair: "#8a8a92", skin: "#ecd0b6", moustache: "#8a8a92" };
export const BELLBOY: Outfit = { jacket: "#b8262e", pants: "#2a2a3a", boots: "#241726", hat: "cap", cap: "#b8262e", buttons: "#e8c45a", build: "kid" };
export const LADY: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#c25a7a", skin: "#ffe2c2" };
export const PAINTER: Outfit = { jacket: "#ece6da", pants: "#d8d0c2", boots: "#5a3b2a", hat: "cap", cap: "#f4f1ea", skin: "#f5c9a0" };
export const POLICE: Outfit = { jacket: "#1f2a55", pants: "#1a2244", boots: "#141018", hat: "cap", cap: "#1f2a55", buttons: "#e8c45a", moustache: "#2a1a1a" };
export const WAITER: Outfit = { jacket: "#1d1b22", pants: "#1d1b22", boots: "#141018", hat: "hair", hair: "#2a1a1a", moustache: "#2a1a1a", buttons: "#f4f1ea" };
export const DEALERS: Outfit[] = [
  { jacket: "#3a4a6a", pants: "#2e3446", boots: "#241726", hat: "tophat", moustache: "#4a3020", skin: "#ecd0b6" },
  { jacket: "#5d4a3a", pants: "#3b3f52", boots: "#241726", hat: "tophat", skin: "#f5c9a0", build: "stout" },
  { jacket: "#2f5f4a", pants: "#2e3446", boots: "#241726", hat: "hair", hair: "#3a2a20", moustache: "#3a2a20" },
  { jacket: "#6a3a3a", pants: "#3b3f52", boots: "#241726", hat: "tophat", skin: "#c99067", moustache: "#1a1414" },
  { jacket: "#4a4a52", pants: "#2e3446", boots: "#241726", hat: "hair", hair: "#b0aaa0", build: "stout" },
];

export type Gesture = "hang" | "lips" | "palm" | "paper" | "pocket" | "stamp" | "clutch" | "sign" | "tip" | "point" | "lean" | "shrug";

/** custom arms per gesture (k = 0..1 animates stamp / sign / tip strokes) */
const armsFor = (gest: Gesture, k: number) => (g: FrontGeo): Arm[] => {
  const { u, HH, tcx, Ta, chin, hc } = g, L = g.sh(-1), R = g.sh(1);
  const hangL: Arm = { pts: [L, [tcx - (1.12 * Ta + 4 * u), L[1] + 0.48 * HH], [tcx - (1.12 * Ta + 1 * u), chin + 1.04 * HH]], front: false };
  const hangR: Arm = { pts: [R, [tcx + 1.12 * Ta + 4 * u, R[1] + 0.48 * HH], [tcx + 1.12 * Ta + 1 * u, chin + 1.04 * HH]], front: false };
  switch (gest) {
    case "lips": return [hangL, { pts: [R, [tcx + 1.05 * Ta + 8 * u, R[1] + 0.42 * HH], [g.eyeX(0) + 4 * u, hc + 24 * u]], front: true }];
    case "palm": return [hangL, { pts: [R, [tcx + 1.15 * Ta + 10 * u, R[1] + 0.36 * HH], [tcx + 1.25 * Ta + 34 * u, R[1] + 0.42 * HH]], front: true }];
    case "paper": case "clutch": {
      const y = chin + (gest === "paper" ? 0.42 : 0.5) * HH, dx = gest === "paper" ? 0.95 * Ta : 0.45 * Ta;
      return [{ pts: [L, [tcx - 1.1 * Ta, L[1] + 0.4 * HH], [tcx - dx, y]], front: true }, { pts: [R, [tcx + 1.1 * Ta, R[1] + 0.4 * HH], [tcx + dx, y]], front: true }];
    }
    case "pocket": return [hangL, { pts: [R, [tcx + 1.08 * Ta + 6 * u, R[1] + 0.45 * HH], [tcx + 0.35 * Ta, chin + 0.3 * HH]], front: true }];
    case "stamp": {
      const y = chin + (0.05 + 0.5 * k) * HH;
      return [hangL, { pts: [R, [tcx + 1.15 * Ta + 8 * u, R[1] + 0.15 * HH], [tcx + 0.9 * Ta, y]], front: true }];
    }
    case "sign": return [hangL, { pts: [R, [tcx + 1.1 * Ta + 6 * u, R[1] + 0.42 * HH], [tcx + 0.2 * Ta + 10 * u * Math.sin(k * 12), chin + 0.62 * HH]], front: true }];
    case "tip": return [hangL, { pts: [R, [tcx + 1.1 * Ta + 10 * u, R[1] - 0.15 * HH], [tcx + 0.55 * Ta, hc - 0.55 * HH - 8 * u * k]], front: true }];
    case "point": return [hangL, { pts: [R, [tcx + 1.1 * Ta + 10 * u, R[1] - 0.3 * HH], [tcx + 1.25 * Ta + 22 * u, R[1] - 0.75 * HH]], front: false }];
    case "lean": return [{ pts: [L, [tcx - 1.1 * Ta - 12 * u, L[1] + 0.3 * HH], [tcx - 1.3 * Ta - 30 * u, L[1] + 0.32 * HH]], front: false }, { pts: [R, [tcx + 1.1 * Ta + 12 * u, R[1] + 0.3 * HH], [tcx + 1.3 * Ta + 30 * u, R[1] + 0.32 * HH]], front: false }];
    case "shrug": return [{ pts: [L, [tcx - 1.2 * Ta - 14 * u, L[1] + 0.2 * HH], [tcx - 1.3 * Ta - 24 * u, L[1] - 0.12 * HH]], front: false }, { pts: [R, [tcx + 1.2 * Ta + 14 * u, R[1] + 0.2 * HH], [tcx + 1.3 * Ta + 24 * u, R[1] - 0.12 * HH]], front: false }];
    default: return [hangL, hangR];
  }
};

export type Extra = { monocle?: boolean; glasses?: boolean; inkNose?: boolean; sweat?: boolean; capInHands?: string; stampTool?: boolean; pen?: boolean; coin?: boolean; whistle?: boolean };
const overlayFor = (x: Extra, gest: Gesture) => (p: Pen, g: FrontGeo, hands: P2[]) => {
  const { u, hc } = g;
  if (x.monocle) {
    const ex = g.eyeX(1);
    p.ell(ex, hc, 11 * u, 11 * u, null, 2.6 * u);
    p.arc(ex, hc, 11 * u, 11 * u, 0, 360, 1.6 * u, "#d9b45a");
    p.stroke([[ex + 8 * u, hc + 8 * u], [ex + 14 * u, hc + 40 * u], [ex + 4 * u, hc + 70 * u]], 1.2 * u, "#d9b45a");
  }
  if (x.glasses) {
    for (const s of [-1, 1]) { p.ell(g.eyeX(s), hc, 10 * u, 10 * u, null, 2.4 * u); }
    p.stroke([[g.eyeX(-1) + 10 * u, hc - 2 * u], [g.eyeX(1) - 10 * u, hc - 2 * u]], 2.2 * u);
  }
  if (x.inkNose) p.ell(g.eyeX(0) + 2 * u, hc + 10 * u, 5 * u, 3.5 * u, "#1d2a55", 0);
  if (x.sweat) p.ell(g.eyeX(-1) - 26 * u, hc - 18 * u, 3.5 * u, 6 * u, "#9fd4ff", 1.8 * u);
  const hand = hands[hands.length - 1];
  if (x.capInHands && hands.length > 1) {
    const cx = (hands[0][0] + hands[1][0]) / 2, cy = (hands[0][1] + hands[1][1]) / 2;
    p.ell(cx, cy + 4 * u, 30 * u, 13 * u, x.capInHands, 2.6 * u, 180, 360);
    p.ell(cx, cy + 4 * u, 34 * u, 5 * u, mix(x.capInHands, INK, 0.25), 2.4 * u);
    for (const h of hands) p.dot(h[0], h[1], 5.5 * u);
  }
  if (x.stampTool && hand) {
    p.poly([[hand[0] - 6 * u, hand[1] - 2 * u], [hand[0] + 6 * u, hand[1] - 2 * u], [hand[0] + 6 * u, hand[1] + 18 * u], [hand[0] - 6 * u, hand[1] + 18 * u]], "#7a4b2a", 2 * u);
    p.poly([[hand[0] - 14 * u, hand[1] + 18 * u], [hand[0] + 14 * u, hand[1] + 18 * u], [hand[0] + 14 * u, hand[1] + 26 * u], [hand[0] - 14 * u, hand[1] + 26 * u]], "#b8262e", 2 * u);
    p.dot(hand[0], hand[1], 5.5 * u);
  }
  if (x.pen && hand) { p.stroke([[hand[0], hand[1]], [hand[0] + 10 * u, hand[1] - 22 * u]], 2.5 * u, "#2a2a55"); p.dot(hand[0], hand[1], 5.5 * u); }
  if (x.coin && hand) p.ell(hand[0] + 4 * u, hand[1] - 6 * u, 6 * u, 6 * u, "#e8c45a", 1.8 * u);
  if (x.whistle) { const mx = g.eyeX(0) + 6 * u, my = hc + 22 * u; p.poly([[mx, my - 3 * u], [mx + 16 * u, my - 3 * u], [mx + 16 * u, my + 4 * u], [mx, my + 4 * u]], "#c9ccd2", 1.6 * u); }
  if (gest === "palm" && hand) p.ell(hand[0] + 2 * u, hand[1] - 3 * u, 9 * u, 4 * u, SKIN, 2 * u);
  void hc;
};

export type Look = { mode?: "stand" | "sit" | "stroll"; expr?: Expr; gest?: Gesture; k?: number; blink?: number; look?: number; headTilt?: number; tilt?: number; facing?: -1 | 0 | 1; phase?: number; seed?: number };
/** draw one of our people (600 x 1000 design canvas, soles at y = 975) */
export const person = (o: Outfit, l: Look, x: Extra = {}) => (p: Pen) =>
  bodyFront(p, o, {
    mode: l.mode ?? "stand", expr: l.expr ?? "neutral", blink: l.blink ?? 0, look: l.look ?? 0, headTilt: l.headTilt ?? 0, tilt: l.tilt ?? 0,
    facing: l.facing ?? 0, phase: l.phase ?? 0, seed: l.seed ?? 3, lift: 0,
    armFn: l.gest && l.gest !== "hang" ? armsFor(l.gest, l.k ?? 0) : undefined,
    overlay: overlayFor(x, l.gest ?? "hang"),
  });
/** stable cache key of a person drawing */
export const personKey = (name: string, l: Look, x: Extra = {}) =>
  `${name}|${l.mode ?? "stand"}|${l.expr ?? "neutral"}|${l.gest ?? "hang"}|${(l.k ?? 0).toFixed(2)}|${(l.blink ?? 0).toFixed(2)}|${l.look ?? 0}|${(l.headTilt ?? 0).toFixed(1)}|${(l.tilt ?? 0).toFixed(1)}|${l.facing ?? 0}|${(l.phase ?? 0).toFixed(2)}|${l.seed ?? 3}|${Object.keys(x).filter((k) => (x as Record<string, unknown>)[k]).join(",")}`;

/** cat sitting, staring (600 x 600 canvas) */
export const cat = (p: Pen, stare: number) => {
  const body: P2[] = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; body.push([300 + 120 * Math.cos(a), 430 + 140 * Math.sin(a)]); }
  p.poly(body, "#3a3440", 12);
  p.line([[400, 520], [480, 470], [470, 380]], "#3a3440", 26);
  p.ell(300, 250, 105, 92, "#3a3440", 12);
  p.poly([[215, 200], [235, 110], [280, 175]], "#3a3440", 10); p.poly([[385, 200], [365, 110], [320, 175]], "#3a3440", 10);
  for (const s of [-1, 1]) { p.ell(300 + s * 40, 245, 22, 22 + 4 * stare, "#e8d25a", 6); p.ell(300 + s * 40, 245, 5, 18, INK, 0); }
  p.poly([[290, 285], [310, 285], [300, 296]], "#e08aa0", 4);
  for (const s of [-1, 1]) for (const dy of [-6, 8]) p.stroke([[300 + s * 30, 292 + dy], [300 + s * 100, 280 + dy * 2]], 3, "#cfc8d8");
};
/** a falling flake of rust (120 x 120) */
export const flake = (p: Pen) => p.poly([[30, 50], [70, 30], [95, 60], [60, 90], [35, 80]], "#b5552c", 6);
/** painter's board hanging on two ropes, with a bucket (1000 x 500 canvas; ropes to the top edge) */
export const painterBoard = (p: Pen) => {
  p.stroke([[120, 0], [120, 330]], 8); p.stroke([[880, 0], [880, 330]], 8);
  p.poly([[60, 330], [940, 330], [940, 370], [60, 370]], "#b07a4a", 10);
  p.poly([[700, 260], [790, 260], [780, 330], [710, 330]], "#c9ccd2", 8);
  p.ell(745, 262, 45, 10, "#b5552c", 6);
};
