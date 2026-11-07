// Our own cast for the Moon Hoax short (toon.ts bean-head system): the newsboy, The Sun's editor, Richard Locke
// (curly hair, ink-stained cuffs, sly grin), Sir John Herschel (white sideburns), the bat-people (humans with bat wings),
// the one-horned blue goat, the Herald's rival editor, kids flapping like bats, 1835 New Yorkers. Arm poses come from
// the Rat Bounty short's gesture set (armsFor).
import { Pen, bodyFront, Outfit, Expr, FrontGeo, INK, SKIN, SKINS, townsfolk } from "../bridge/toon";
import { armsFor, Gesture } from "../rats/people";

type P2 = [number, number];
export type { Gesture };
export const NEWSBOY: Outfit = { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#3a2a20", hat: "cap", cap: "#5d6478", build: "kid", skin: "#ffe2c2" };
export const EDITOR: Outfit = { jacket: "#efe6d2", pants: "#3b3f52", boots: "#2a2020", hat: "hair", hair: "#3a2a20", moustache: "#3a2a20", buttons: "#5a3b2a", build: "stout" };
export const LOCKE: Outfit = { jacket: "#3f5f8a", pants: "#2e3446", boots: "#241726", hat: "hair", hair: "#6a3a22", skin: "#ffe2c2", buttons: "#d9b45a" };
export const HERSCHEL: Outfit = { jacket: "#2a2a3a", pants: "#3b3f52", boots: "#241726", hat: "hair", hair: "#e8e4dc", skin: "#ffe2c2", buttons: "#c9a04a" };
export const HERSCHEL_BEACH: Outfit = { ...HERSCHEL, jacket: "#e8a04a", pants: "#f4f1ea" };
export const RIVAL: Outfit = { jacket: "#1f2a55", pants: "#24242e", boots: "#141018", hat: "tophat", moustache: "#5a3020", skin: "#f5c9a0", buttons: "#c9a04a" };
export const BATFOLK: Outfit[] = [
  { jacket: "#8a6a5a", pants: "#6a5a50", boots: "#4a3a30", hat: "hair", hair: "#5a4034", skin: "#d9b49a" },
  { jacket: "#7a5a6a", pants: "#5a4a58", boots: "#4a3a40", hat: "hair", hair: "#3a2a30", skin: "#e0bca0" },
];
export const KID = (v: number): Outfit => ({ jacket: ["#f08a2c", "#3f6fb5", "#5d7a3a"][v % 3], pants: "#3b5b9a", boots: "#4a3426", hat: v % 2 ? "cap" : "hair", cap: "#e2453c", hair: "#5a3b2a", build: "kid", skin: SKINS[v % 4] });
export const CITIZEN = (v: number): Outfit => townsfolk(v);

export type Extra = { paper?: "bat" | "day1" | "hoax" | "plain"; curls?: boolean; inkCuffs?: boolean; sideburns?: boolean; tea?: boolean; phone?: boolean; pen?: boolean; letter?: boolean; sweat?: boolean; brow?: boolean; wings?: number };
/** a tiny newspaper held in front (drawn on the person card) */
const heldPaper = (p: Pen, x: number, y: number, u: number, kind: string) => {
  p.poly([[x - 46 * u, y - 34 * u], [x + 46 * u, y - 34 * u], [x + 46 * u, y + 30 * u], [x - 46 * u, y + 30 * u]], "#f1e8d6", 2.4 * u);
  p.g.font = `900 ${Math.round(13 * u)}px Georgia, serif`; p.g.fillStyle = INK; p.g.textAlign = "center"; p.g.textBaseline = "middle";
  p.g.fillText(kind === "hoax" ? "HOAX!" : kind === "day1" ? "DAY 1" : "THE SUN", x, y - 22 * u);
  if (kind === "bat") { // the famous winged figure
    p.ell(x, y + 4 * u, 6 * u, 9 * u, "#7a5a4a", 1.4 * u);
    for (const s of [-1, 1]) p.poly([[x + s * 4 * u, y], [x + s * 30 * u, y - 10 * u], [x + s * 24 * u, y + 2 * u], [x + s * 30 * u, y + 12 * u], [x + s * 6 * u, y + 8 * u]], "#5a4034", 1.2 * u);
  } else for (let k = 0; k < 4; k++) p.stroke([[x - 36 * u, y - 6 * u + k * 8 * u], [x + 36 * u, y - 6 * u + k * 8 * u]], 1.2 * u, "#8a8070");
};
const overlayFor = (x: Extra) => (p: Pen, g: FrontGeo, hands: P2[]) => {
  const { u, hc } = g, hand = hands[hands.length - 1];
  if (x.curls) for (let k = -3; k <= 3; k++) p.ell(g.tcx + k * 14 * u, g.crown + 10 * u + Math.abs(k) * 4 * u, 11 * u, 10 * u, "#6a3a22", 2 * u);
  if (x.sideburns) for (const s of [-1, 1]) p.poly([[g.tcx + s * 40 * u, hc - 10 * u], [g.tcx + s * 50 * u, hc - 4 * u], [g.tcx + s * 46 * u, hc + 34 * u], [g.tcx + s * 34 * u, hc + 26 * u]], "#e8e4dc", 2 * u);
  if (x.brow) p.stroke([[g.eyeX(1) - 14 * u, hc - 30 * u], [g.eyeX(1) + 10 * u, hc - 40 * u]], 4 * u);
  if (x.sweat) p.ell(g.eyeX(-1) - 26 * u, hc - 18 * u, 3.5 * u, 6 * u, "#9fd4ff", 1.8 * u);
  if (x.inkCuffs) for (const h of hands) p.ell(h[0], h[1] - 10 * u, 8 * u, 6 * u, "#1d2a55", 0);
  if (x.paper && hands.length > 1) { const cx = (hands[0][0] + hands[1][0]) / 2, cy = (hands[0][1] + hands[1][1]) / 2; heldPaper(p, cx, cy - 24 * u, u, x.paper); for (const h of hands) p.dot(h[0], h[1], 5.5 * u); }
  if (x.tea && hand) { p.poly([[hand[0] - 9 * u, hand[1] - 16 * u], [hand[0] + 9 * u, hand[1] - 16 * u], [hand[0] + 7 * u, hand[1]], [hand[0] - 7 * u, hand[1]]], "#f4f1ea", 2 * u); p.arc(hand[0] + 11 * u, hand[1] - 9 * u, 5 * u, 5 * u, -90, 90, 1.8 * u); }
  if (x.phone && hand) { p.poly([[hand[0] - 9 * u, hand[1] - 30 * u], [hand[0] + 9 * u, hand[1] - 30 * u], [hand[0] + 9 * u, hand[1] + 2 * u], [hand[0] - 9 * u, hand[1] + 2 * u]], "#2a2a33", 2 * u); p.poly([[hand[0] - 6 * u, hand[1] - 26 * u], [hand[0] + 6 * u, hand[1] - 26 * u], [hand[0] + 6 * u, hand[1] - 4 * u], [hand[0] - 6 * u, hand[1] - 4 * u]], "#9fd4ff", 0); }
  if (x.pen && hand) { p.stroke([[hand[0], hand[1]], [hand[0] + 10 * u, hand[1] - 26 * u]], 2.5 * u, "#2a2a55"); p.dot(hand[0], hand[1], 5.5 * u); }
  if (x.letter && hand) p.poly([[hand[0] - 14 * u, hand[1] - 10 * u], [hand[0] + 14 * u, hand[1] - 10 * u], [hand[0] + 14 * u, hand[1] + 8 * u], [hand[0] - 14 * u, hand[1] + 8 * u]], "#f2e6c8", 2 * u);
};
/** bat wings behind a body (flap 0..1), on the 600 x 1000 person canvas */
const batWings = (p: Pen, flap: number) => {
  const cy = 520, a = Math.sin(flap * Math.PI * 2) * 60;
  for (const s of [-1, 1]) {
    const pts: P2[] = [[300 + s * 40, cy - 40], [300 + s * 250, cy - 170 - a], [300 + s * 230, cy - 60 - a * 0.4], [300 + s * 280, cy + 10 - a * 0.2], [300 + s * 190, cy + 20], [300 + s * 210, cy + 110 - a * 0.1], [300 + s * 60, cy + 70]];
    p.poly(pts, "#5a4034", 9);
    for (const k of [1, 3, 5]) p.stroke([[300 + s * 40, cy - 20], pts[k]], 3, "#3a2a24");
  }
};
export type Look = { mode?: "stand" | "sit" | "stroll" | "fall"; expr?: Expr; gest?: Gesture; k?: number; blink?: number; look?: number; headTilt?: number; tilt?: number; facing?: -1 | 0 | 1; phase?: number; seed?: number };
export const person = (o: Outfit, l: Look, x: Extra = {}) => (p: Pen) => {
  if (x.wings !== undefined) batWings(p, x.wings);
  bodyFront(p, o, {
    mode: l.mode ?? "stand", expr: l.expr ?? "neutral", blink: l.blink ?? 0, look: l.look ?? 0, headTilt: l.headTilt ?? 0, tilt: l.tilt ?? 0,
    facing: l.facing ?? 0, phase: l.phase ?? 0, seed: l.seed ?? 3, lift: 0,
    armFn: l.gest && l.gest !== "hang" ? armsFor(l.gest, l.k ?? 0) : undefined,
    overlay: overlayFor(x),
  });
};
export const personKey = (name: string, l: Look, x: Extra = {}) =>
  `${name}|${l.mode ?? "stand"}|${l.expr ?? "neutral"}|${l.gest ?? "hang"}|${(l.k ?? 0).toFixed(2)}|${(l.blink ?? 0).toFixed(2)}|${l.look ?? 0}|${(l.headTilt ?? 0).toFixed(1)}|${(l.tilt ?? 0).toFixed(1)}|${l.facing ?? 0}|${(l.phase ?? 0).toFixed(2)}|${l.seed ?? 3}|${Object.entries(x).filter(([, v]) => v !== undefined && v !== false).map(([k, v]) => k + (typeof v === "number" ? v.toFixed(2) : v === true ? "" : v)).join(",")}`;

/** the one-horned blue goat (600 x 600), facing the camera; blink 0..1 */
export const goat = (blink: number, chew: number) => (p: Pen) => {
  const cx = 300;
  p.ell(cx, 560, 150, 24, "rgba(36,23,38,0.22)", 0);
  for (const dx of [-90, -40, 40, 90]) { p.stroke([[cx + dx, 430], [cx + dx, 555]], 16, "#4a6aa8"); p.ell(cx + dx, 558, 14, 8, "#2a2a33", 4); }
  p.ell(cx, 400, 150, 90, "#6f8fd0", 9);
  p.ell(cx, 250, 92, 110, "#6f8fd0", 9);
  for (const s of [-1, 1]) p.poly([[cx + s * 70, 190], [cx + s * 150, 170], [cx + s * 90, 220]], "#5a7ac0", 6);
  p.poly([[cx - 16, 150], [cx, 30], [cx + 16, 150]], "#f2e6c8", 6);                                    // the single horn
  for (let k = 0; k < 4; k++) p.stroke([[cx - 12 + k * 2, 140 - k * 28], [cx + 12 - k * 2, 132 - k * 28]], 2.5, "#c9b890");
  for (const s of [-1, 1]) { p.ell(cx + s * 40, 245, 24, 28 * (1 - 0.85 * blink), "#ffffff", 5); if (blink < 0.5) p.ell(cx + s * 38, 248, 6, 14, INK, 0); }
  p.ell(cx, 320 + 3 * Math.sin(chew * Math.PI * 2), 40, 24, "#9fb6e6", 5);
  p.poly([[cx - 18, 345], [cx + 18, 345], [cx, 400]], "#e8e4dc", 4);                                    // little beard
  void SKIN;
};
