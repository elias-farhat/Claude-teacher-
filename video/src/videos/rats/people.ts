// Our own cast for the Rat Bounty short, drawn with the skill's character system (toon.ts: bean heads, plum ink, stick
// limbs): the French official (round glasses, white suit, sun helmet), Vietnamese rat hunters (conical hats, nets,
// lanterns), the farmer, the lady of the fancy house, clerks, townsfolk, Paul Doumer (beard, top hat; sash at the end),
// and the star: the tailless rat (big eyes, shrugging). Gestures = custom arm poses (toon.ts armFn) + overlays.
import { Pen, bodyFront, Outfit, Expr, FrontGeo, INK, SKIN, SKINS, mix, shade } from "../bridge/toon";

type P2 = [number, number];
type Arm = { pts: [P2, P2, P2]; front: boolean };

export type Gesture = "hang" | "lips" | "palm" | "paper" | "pocket" | "stamp" | "clutch" | "sign" | "tip" | "point" | "lean" | "shrug" | "wave" | "hold" | "cheer" | "protect" | "axe" | "climb" | "paste" | "tear";

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
    case "wave": return [hangL, { pts: [R, [tcx + 1.2 * Ta + 16 * u, R[1] - 0.2 * HH], [tcx + 1.2 * Ta + 22 * u + 14 * u * Math.sin(k * Math.PI * 2), R[1] - 0.85 * HH]], front: false }];
    case "hold": { const y = chin + 0.38 * HH; return [{ pts: [L, [tcx - 1.15 * Ta, L[1] + 0.32 * HH], [tcx - 0.55 * Ta, y]], front: true }, { pts: [R, [tcx + 1.15 * Ta, R[1] + 0.32 * HH], [tcx + 0.55 * Ta, y]], front: true }]; }
    case "cheer": { const b = 10 * u * Math.sin(k * Math.PI * 2); return [{ pts: [L, [tcx - 1.25 * Ta - 10 * u, L[1] - 0.3 * HH], [tcx - 1.1 * Ta - 4 * u, L[1] - 0.9 * HH + b]], front: false }, { pts: [R, [tcx + 1.25 * Ta + 10 * u, R[1] - 0.3 * HH], [tcx + 1.1 * Ta + 4 * u, R[1] - 0.9 * HH - b]], front: false }]; }
    case "protect": { const y = chin + 0.75 * HH; return [{ pts: [L, [tcx - 1.3 * Ta - 12 * u, L[1] + 0.45 * HH], [tcx - 0.2 * Ta, y]], front: true }, { pts: [R, [tcx + 1.3 * Ta + 12 * u, R[1] + 0.45 * HH], [tcx + 0.2 * Ta, y]], front: true }]; }
    case "axe": return [hangL, { pts: [R, [tcx + 1.2 * Ta + 12 * u, R[1] - 0.35 * HH], [tcx + 0.9 * Ta, R[1] - (0.9 - 0.5 * k) * HH]], front: false }];
    case "climb": { const s = Math.sin(k * Math.PI * 2) * 0.12 * HH; return [{ pts: [L, [tcx - 1.1 * Ta, L[1] - 0.25 * HH], [tcx - 0.8 * Ta, L[1] - 0.6 * HH + s]], front: false }, { pts: [R, [tcx + 1.1 * Ta, R[1] - 0.25 * HH], [tcx + 0.8 * Ta, R[1] - 0.6 * HH - s]], front: false }]; }
    case "paste": return [hangL, { pts: [R, [tcx + 1.2 * Ta + 14 * u, R[1] + 0.05 * HH], [tcx + 1.4 * Ta + 30 * u, R[1] - 0.25 * HH - 10 * u * Math.sin(k * Math.PI * 2)]], front: false }];
    case "tear": return [{ pts: [L, [tcx - 1.2 * Ta - 14 * u, L[1] - 0.1 * HH], [tcx - 1.3 * Ta - 30 * u, L[1] - 0.45 * HH + 0.5 * HH * k]], front: false }, { pts: [R, [tcx + 1.2 * Ta + 14 * u, R[1] - 0.1 * HH], [tcx + 1.3 * Ta + 30 * u, R[1] - 0.45 * HH + 0.5 * HH * k]], front: false }];
    default: return [hangL, hangR];
  }
};

export const OFFICIAL: Outfit = { jacket: "#f4f1ea", pants: "#ece6da", boots: "#3a2a20", hat: "helmet", cap: "#f1ece0", moustache: "#5a3b2a", skin: "#ffd9b8", buttons: "#c9a04a", build: "stout" };
export const CLERK = (v: number): Outfit => ({ jacket: "#ece6da", pants: "#d8d0c2", boots: "#3a2a20", hat: "hair", hair: ["#5a3b2a", "#2a1a1a", "#b0a090"][v % 3], skin: ["#ffe2c2", "#f5c9a0", "#ecd0b6"][v % 3], moustache: v % 2 ? "#3a2a20" : undefined, buttons: "#c9a04a" });
export const HUNTER = (v: number): Outfit => ({ jacket: ["#3d4a7a", "#6a4a32", "#2f5a4a", "#5a3a5a"][v % 4], pants: ["#2a2a3a", "#3b3f52", "#4a3a30"][v % 3], boots: "#3a2a20", hat: "conical", cap: ["#e3cf96", "#d8c084", "#ead9a8"][v % 3], skin: ["#e8b88a", "#d9a878", "#f0c49a"][v % 3] });
export const FARMER: Outfit = { jacket: "#8a5a3a", pants: "#3b3f52", boots: "#3a2a20", hat: "conical", cap: "#e3cf96", skin: "#e8b88a" };
export const LADY: Outfit = { jacket: "#c25a7a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", dress: "#e8a0b8", skin: SKIN };
export const DOUMER: Outfit = { jacket: "#2a2a3a", pants: "#24242e", boots: "#141018", hat: "tophat", moustache: "#5a4a40", skin: "#ffe2c2", buttons: "#c9a04a", build: "stout" };
export const DOUMER_PRES: Outfit = { ...DOUMER, sash: "#c8313b" };
/** townsfolk of 1902 Hanoi: Vietnamese (conical hats) and French (top hats / bonnets) */
export const LOCAL = (v: number): Outfit => v % 3 === 2
  ? { jacket: ["#3f6fb5", "#8c3b4a", "#5d7a3a"][v % 3], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4], ...(v % 2 ? { hat: "bonnet", dress: "#d9a441" } : { hat: "tophat" }) }
  : { jacket: ["#3d4a7a", "#7a4a3a", "#2f6a5a", "#6a3a5a", "#8a6a3a"][v % 5], pants: ["#2a2a3a", "#4a3a30"][v % 2], boots: "#3a2a20", hat: "conical", cap: "#e3cf96", skin: ["#e8b88a", "#d9a878", "#f0c49a"][v % 3] };

export type Extra = { glasses?: boolean; beard?: boolean; net?: boolean; lantern?: boolean; ratHeld?: boolean; coin?: boolean; axe?: boolean; scissors?: boolean; brush?: boolean; hen?: boolean; tails?: boolean; sweat?: boolean; blueprint?: boolean };
const overlayFor = (x: Extra, gest: Gesture) => (p: Pen, g: FrontGeo, hands: P2[]) => {
  const { u, hc } = g, hand = hands[hands.length - 1];
  if (x.glasses) { for (const s of [-1, 1]) p.ell(g.eyeX(s), hc, 10 * u, 10 * u, null, 2.4 * u); p.stroke([[g.eyeX(-1) + 10 * u, hc - 2 * u], [g.eyeX(1) - 10 * u, hc - 2 * u]], 2.2 * u); }
  if (x.beard) { const cy = g.chin; p.poly([[g.tcx - 30 * u, cy - 26 * u], [g.tcx + 30 * u, cy - 26 * u], [g.tcx + 22 * u, cy + 10 * u], [g.tcx, cy + 30 * u], [g.tcx - 22 * u, cy + 10 * u]], "#6a5a50", 2.4 * u); }
  if (x.sweat) p.ell(g.eyeX(-1) - 26 * u, hc - 18 * u, 3.5 * u, 6 * u, "#9fd4ff", 1.8 * u);
  if (x.net && hand) { // net on a bamboo pole over the shoulder
    p.stroke([[hand[0], hand[1]], [hand[0] + 70 * u, hand[1] - 190 * u]], 3.2 * u, "#b08a4a");
    p.ell(hand[0] + 82 * u, hand[1] - 222 * u, 34 * u, 26 * u, "rgba(240,235,220,0.35)", 2 * u);
    for (let k = -2; k <= 2; k++) p.stroke([[hand[0] + 82 * u + k * 12 * u, hand[1] - 246 * u], [hand[0] + 82 * u + k * 9 * u, hand[1] - 198 * u]], 1 * u);
  }
  if (x.lantern && hands[0]) { const h = hands[0]; p.stroke([[h[0], h[1]], [h[0], h[1] + 14 * u]], 1.5 * u); p.poly([[h[0] - 12 * u, h[1] + 14 * u], [h[0] + 12 * u, h[1] + 14 * u], [h[0] + 10 * u, h[1] + 44 * u], [h[0] - 10 * u, h[1] + 44 * u]], "#ffd27a", 2 * u); p.dot(h[0], h[1] + 29 * u, 5 * u, "#fff3c8"); }
  if (x.ratHeld && hands.length > 1) { const cx = (hands[0][0] + hands[1][0]) / 2, cy = (hands[0][1] + hands[1][1]) / 2; ratProfile(p, cx - 4 * u, cy - 6 * u, 0.62 * u, true, 0); for (const h of hands) p.dot(h[0], h[1], 5.5 * u); }
  if (x.hen && hands.length > 1) { const cx = (hands[0][0] + hands[1][0]) / 2, cy = (hands[0][1] + hands[1][1]) / 2; henAt(p, cx, cy - 20 * u, 0.55 * u); for (const h of hands) p.dot(h[0], h[1], 5.5 * u); }
  if (x.tails && hands.length > 1) { const cx = (hands[0][0] + hands[1][0]) / 2, cy = (hands[0][1] + hands[1][1]) / 2; for (let k = -3; k <= 3; k++) p.stroke([[cx + k * 5 * u, cy], [cx + k * 9 * u, cy + 40 * u + (k % 2) * 8 * u]], 2.2 * u, "#d99a8a"); for (const h of hands) p.dot(h[0], h[1], 5.5 * u); }
  if (x.coin && hand) p.ell(hand[0] + 4 * u, hand[1] - 6 * u, 7 * u, 7 * u, "#e8c45a", 1.8 * u);
  if (x.axe && hand) { p.stroke([[hand[0], hand[1] + 20 * u], [hand[0], hand[1] - 70 * u]], 4 * u, "#8a5a3a"); p.poly([[hand[0] - 2 * u, hand[1] - 70 * u], [hand[0] + 30 * u, hand[1] - 82 * u], [hand[0] + 34 * u, hand[1] - 46 * u], [hand[0] - 2 * u, hand[1] - 52 * u]], "#c9ccd2", 2 * u); }
  if (x.scissors && hand) { p.ell(hand[0] - 6 * u, hand[1] + 4 * u, 6 * u, 6 * u, null, 2 * u); p.ell(hand[0] + 6 * u, hand[1] + 4 * u, 6 * u, 6 * u, null, 2 * u); p.stroke([[hand[0], hand[1] - 2 * u], [hand[0] + 14 * u, hand[1] - 34 * u]], 2.4 * u, "#c9ccd2"); }
  if (x.brush && hand) { p.stroke([[hand[0], hand[1]], [hand[0] + 6 * u, hand[1] - 36 * u]], 3 * u, "#8a5a3a"); p.poly([[hand[0] - 2 * u, hand[1] - 36 * u], [hand[0] + 16 * u, hand[1] - 36 * u], [hand[0] + 14 * u, hand[1] - 50 * u], [hand[0], hand[1] - 50 * u]], "#efe2c0", 1.8 * u); }
  if (x.blueprint && hands.length > 1) { const cx = (hands[0][0] + hands[1][0]) / 2, cy = (hands[0][1] + hands[1][1]) / 2; p.poly([[cx - 40 * u, cy - 14 * u], [cx + 40 * u, cy - 14 * u], [cx + 40 * u, cy + 6 * u], [cx - 40 * u, cy + 6 * u]], "#3f6fb5", 2 * u); p.stroke([[cx - 30 * u, cy - 4 * u], [cx + 30 * u, cy - 4 * u]], 1 * u, "#e8f0ff"); }
  if (gest === "palm" && hand) p.ell(hand[0] + 2 * u, hand[1] - 3 * u, 9 * u, 4 * u, SKIN, 2 * u);
};

export type Look = { mode?: "stand" | "sit" | "stroll" | "fall"; expr?: Expr; gest?: Gesture; k?: number; blink?: number; look?: number; headTilt?: number; tilt?: number; facing?: -1 | 0 | 1; phase?: number; seed?: number };
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

// ---------------- the rats ----------------
const FUR = "#8a8394", FUR_D = "#6c6578", PINK = "#e8a0a8", BELLY = "#c9c2cf";
/** a rat in profile facing right at (x, y) = centre of the body, scale s (1 = 300 px long); running phase 0..1 */
export const ratProfile = (p: Pen, x: number, y: number, s: number, tail: boolean, phase: number, coinTail = false) => {
  const leg = (dx: number, ph: number) => { const a = Math.sin((phase + ph) * Math.PI * 2) * 22 * s; p.stroke([[x + dx * s, y + 34 * s], [x + dx * s + a, y + 70 * s]], 9 * s, FUR_D); p.ell(x + dx * s + a + 6 * s, y + 72 * s, 10 * s, 5 * s, PINK, 3 * s); };
  if (tail) { p.line([[x - 100 * s, y + 10 * s], [x - 170 * s, y - 10 * s], [x - 230 * s, y + 30 * s], [x - 270 * s, y + 10 * s]], PINK, 9 * s); if (coinTail) p.ell(x - 270 * s, y + 10 * s, 16 * s, 16 * s, "#f2d24a", 4 * s); }
  else p.ell(x - 104 * s, y + 6 * s, 9 * s, 8 * s, PINK, 4 * s); // the stub
  leg(-60, 0.5); leg(50, 0);
  p.ell(x, y, 112 * s, 62 * s, FUR, 8 * s);
  p.ell(x + 10 * s, y + 26 * s, 70 * s, 26 * s, BELLY, 0);
  leg(-40, 0); leg(70, 0.5);
  p.poly([[x + 70 * s, y - 50 * s], [x + 185 * s, y + 4 * s], [x + 150 * s, y + 30 * s], [x + 70 * s, y + 34 * s]], FUR, 8 * s); // head
  p.ell(x + 186 * s, y + 6 * s, 12 * s, 11 * s, PINK, 4 * s);                                                           // nose
  p.ell(x + 84 * s, y - 52 * s, 30 * s, 34 * s, FUR_D, 7 * s); p.ell(x + 86 * s, y - 50 * s, 16 * s, 20 * s, PINK, 0);    // ear
  p.ell(x + 128 * s, y - 8 * s, 15 * s, 17 * s, "#ffffff", 4 * s); p.dot(x + 133 * s, y - 6 * s, 7 * s);               // big eye
  for (const dy of [-6, 6]) p.stroke([[x + 176 * s, y + 10 * s + dy * s], [x + 222 * s, y + 4 * s + dy * 2.4 * s]], 2.4 * s);
};
/** running rat card (600 x 300), facing right */
export const ratRun = (tail: boolean, phase: number, coinTail = false) => (p: Pen) => ratProfile(p, 330, 160, 1, tail, phase, coinTail);
/** the star: tailless rat facing the camera (600 x 600). shrug 0..1, mood: "look" | "shrug" | "smug" | "wave" | "lounge" */
export const ratHero = (mood: string, k: number, blink = 0) => (p: Pen) => {
  const cx = 300, s = 1, bodyY = 410;
  const sh = mood === "shrug" ? k : 0, lounge = mood === "lounge";
  p.ell(cx, bodyY + 120, 120, 26, "rgba(36,23,38,0.25)", 0);                                                  // contact shadow
  for (const sx of [-1, 1]) { p.ell(cx + sx * 52, bodyY + 118, 26, 12, PINK, 4); }                           // feet
  p.ell(cx, bodyY + 30, 112, 108, FUR, 9);                                                                     // body (pear)
  p.ell(cx, bodyY + 52, 72, 72, BELLY, 0);
  p.ell(cx + 104, bodyY + 96, 9, 8, PINK, 4);                                                                  // the tail stump
  // arms: hanging / shrug (palms up, shoulders up) / wave
  const armL: P2[] = mood === "wave" || lounge ? [[cx - 80, bodyY - 10], [cx - 130, bodyY + 40], [cx - 104, bodyY + 70]] : [[cx - 80, bodyY - 10 - 20 * sh], [cx - 140 - 30 * sh, bodyY + 20 - 60 * sh], [cx - 160 - 30 * sh, bodyY - 30 - 70 * sh]];
  const armR: P2[] = mood === "wave" ? [[cx + 80, bodyY - 10], [cx + 140, bodyY - 70], [cx + 150 + 20 * Math.sin(k * Math.PI * 4), bodyY - 140]]
    : lounge ? [[cx + 80, bodyY - 10], [cx + 120, bodyY - 80], [cx + 60, bodyY - 150]]
    : [[cx + 80, bodyY - 10 - 20 * sh], [cx + 140 + 30 * sh, bodyY + 20 - 60 * sh], [cx + 160 + 30 * sh, bodyY - 30 - 70 * sh]];
  for (const a of [armL, armR]) { p.line(a, FUR_D, 16); p.ell(a[2][0], a[2][1], 13, 10, PINK, 4); }
  // head
  const hy = bodyY - 130 - 18 * sh;
  for (const sx of [-1, 1]) { p.ell(cx + sx * 92, hy - 70, 52, 56, FUR_D, 8); p.ell(cx + sx * 92, hy - 66, 30, 34, PINK, 0); }
  p.ell(cx, hy, 118, 100, FUR, 9);
  p.ell(cx, hy + 54, 50, 34, BELLY, 0);
  // big eyes
  for (const sx of [-1, 1]) {
    p.ell(cx + sx * 44, hy - 10, 34, 40 * (1 - 0.85 * blink), "#ffffff", 6);
    if (blink < 0.5) p.ell(cx + sx * 40 + (mood === "smug" ? 6 : 0), hy - 6, 16, 19, INK, 0);
    if (mood === "smug") p.stroke([[cx + sx * 74, hy - 46], [cx + sx * 14, hy - 40]], 6);
  }
  p.ell(cx, hy + 40, 18, 13, PINK, 5);                                                                         // nose
  for (const sx of [-1, 1]) for (const dy of [-6, 8]) p.stroke([[cx + sx * 30, hy + 50 + dy], [cx + sx * 120, hy + 36 + dy * 2.2]], 3.2);
  if (mood === "shrug" && k > 0.4) p.arc(cx, hy + 66, 22, 10, 200, 340, 5); else p.arc(cx, hy + 62, 18, 9, 20, 160, 5); // mouth
  if (lounge) { p.poly([[cx - 60, hy - 110], [cx + 70, hy - 118], [cx + 64, hy - 96], [cx - 56, hy - 92]], "#3a3a44", 5); } // sunglasses... a little cap brim
  void s;
};
/** baby rat (300 x 200), facing right, the tail tip glints like a coin */
export const babyRat = (glint: number, phase: number) => (p: Pen) => ratProfile(p, 160, 100, 0.45, true, phase, glint > 0.5);
/** mother rat (tailless) curled, front-ish (600 x 600): reuse the hero, eyes half shut */
export const ratMom = (blink: number) => ratHero("look", 0, Math.max(0.35, blink));
/** a hen (600 x 600), facing left, flap 0..1 */
export const hen = (flap: number) => (p: Pen) => henAt(p, 300, 330, 1, flap);
const henAt = (p: Pen, x: number, y: number, s: number, flap = 0) => {
  p.ell(x, y + 100 * s, 120 * s, 22 * s, "rgba(36,23,38,0.22)", 0);
  for (const dx of [-30, 30]) { p.stroke([[x + dx * s, y + 60 * s], [x + dx * s, y + 100 * s]], 7 * s, "#e0a030"); }
  p.ell(x, y, 120 * s, 86 * s, "#f6f1e6", 8 * s);
  p.poly([[x + 90 * s, y - 30 * s], [x + 170 * s, y - 90 * s], [x + 150 * s, y + 10 * s]], "#f6f1e6", 8 * s);          // tail feathers
  p.ell(x + 10 * s, y - 6 * s - 30 * flap * s, 60 * s, 36 * s, "#ece4d2", 6 * s, 0, 360, -20 - 30 * flap);           // wing
  p.ell(x - 100 * s, y - 70 * s, 50 * s, 48 * s, "#f6f1e6", 8 * s);                                                    // head
  p.poly([[x - 112 * s, y - 128 * s], [x - 96 * s, y - 150 * s], [x - 84 * s, y - 124 * s], [x - 70 * s, y - 140 * s], [x - 64 * s, y - 112 * s]], "#d9363e", 5 * s); // comb
  p.poly([[x - 150 * s, y - 72 * s], [x - 182 * s, y - 62 * s], [x - 150 * s, y - 54 * s]], "#e0a030", 5 * s);       // beak
  p.ell(x - 136 * s, y - 40 * s, 10 * s, 16 * s, "#d9363e", 4 * s);                                                  // wattle
  p.ell(x - 112 * s, y - 80 * s, 9 * s, 10 * s, "#ffffff", 3 * s); p.dot(x - 114 * s, y - 79 * s, 4.5 * s);
};
void mix; void shade;
