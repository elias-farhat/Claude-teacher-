// Who and what is on stage at time t in "The Luckiest Fool in History" (3D cast). Reactions land 0-2 frames before
// their word. Every beat shows a character doing the narrated thing (Run 38 / Bucket frame check: no prop-only shots):
// Dexter walking the dock while the town laughs, scribbling, the merchants scheming, Dexter with the pan in the heat,
// the planters stirring molasses, the captain in mittens, the merchants laughing, Dexter sailing in, the strike, the
// town running to buy, Dexter in his gold, on his crate, peeking at his own funeral. No speech bubbles.
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { Pen } from "../bridge/toon";
import { V } from "../bridge/build";
import { wt, smooth, clamp01, Cam, V3, dexterDockZ, coalShipAt } from "./story";
import { ROOMS, RC, DOCK_NB, DOCK_TR, DOCK_SN, DOCK_NC, SHIP_TR, SHIP_DECK, VATS, STRIKE, SQUARE } from "./layout";
import type { Lamp } from "../rats/hanoi";
import { LAMP } from "./looks";
import { person as person0, personKey as personKey0, Look, Extra, DEXTER, MERCHANT, TOWN, PLANTER, SAILOR, CAPTAIN, FURSAILOR, MINER, MOURNER } from "./people";
import type { Outfit } from "../bridge/toon";

type C3 = [number, number, number];
type ML = Parameters<typeof person0>[1];
const CARD_G: Record<string, string> = { fist: "point", hug: "clutch", lift: "cheer", charge: "point", flee: "cheer", stir: "hold", shrug2: "palm" };
const person = (o: Outfit, l: Look, x: Extra) => person0(o, { ...l, mode: l.mode === "run" ? "stroll" : l.mode, gest: (CARD_G[l.gest ?? ""] ?? l.gest) } as ML, x);
const personKey = (n: string, l: Look, x: Extra) => personKey0(n, l as unknown as ML, x);
export type FxCard = FxPlace & { yaw?: number };
export type Stage = { places: Place[]; fx: FxCard[]; lights: (Lamp & { col: C3 })[] };
const LEAD = 2 / 30;
const HI: [number, number, number] = [600, 1000, 1], LO: [number, number, number] = [300, 500, 0.5];
const blinkAt = (t: number, seed: number) => {
  const per = 0.5 + ((Math.sin(seed * 91.7) + 1) / 2) * 1.8, ph = ((t + seed * 0.37) % per) / per;
  const b = ph * per * 30; return b < 4 ? [0.6, 1, 1, 0.6][Math.floor(b)] : 0;
};
const q = (x: number, n: number) => Math.round(x * n) / n;
const after = (t: number, ln: number, w: string | number) => t >= wt(ln, w) - LEAD;
const between = (t: number, a: number, b: number) => t >= a && t < b;
const warm = (p: THREE.Vector3, k: number) => ({ p, k, col: LAMP });
let CAM = new THREE.Vector3();
/** turn: radians away from facing the camera (+ = toward screen right); yaw: absolute */
const P = (name: string, o: Outfit, l: Look, x: Extra, at: V3 | THREE.Vector3, opt: { scale?: number; size?: [number, number, number]; turn?: number; yaw?: number } = {}): Place => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  const yaw = opt.yaw ?? (opt.turn !== undefined ? Math.atan2(CAM.x - a.x, CAM.z - a.z) + opt.turn : undefined);
  return { key: personKey(name, l, x), draw: person(o, l, x), x: a.x, y: a.y, z: a.z, size: opt.size ?? HI, scale: opt.scale, tall: o.hat === "tricorn" ? 0.08 : o.hat === "fur" ? 0.14 : 0, rig: { o, l, x }, yaw };
};
const card = (key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3 | THREE.Vector3, w: number, h: number, o: Partial<FxCard> = {}): FxCard => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  return { key, cw, ch, draw, x: a.x, y: a.y, z: a.z, w, h, ...o };
};
const W = (c: THREE.Vector3, dx: number, dy: number, dz: number) => V(c.x + dx, c.y + dy, c.z + dz);
const flake = (p: Pen) => p.ell(50, 50, 40, 40, "rgba(255,255,255,0.95)", 0);
const smoke = (p: Pen) => { for (const [x, y, r] of [[150, 160, 90], [90, 110, 60], [210, 100, 70], [150, 70, 55]] as const) p.ell(x, y, r, r * 0.85, "#7a7672", 0); };
const glint = (u: number) => (p: Pen) => { const r = 40 + 70 * u; p.poly([[150, 150 - r], [162, 138], [150 + r, 150], [162, 162], [150, 150 + r], [138, 162], [150 - r, 150], [138, 138]], "#fff7d6", 0); };
const S = RC(ROOMS.study), C = RC(ROOMS.count), M = RC(ROOMS.mansion), PR = RC(ROOMS.parlour);
const TABLE = W(C, 0, 0, -2.5);
const DECK = (s: THREE.Vector3, dx: number, dz: number) => V(s.x + dx, SHIP_DECK, s.z + dz);

// ---------------- beats ----------------
// line 1: Dexter strolls up the dock grinning; townsfolk on both sides point and laugh
const dock = (t: number, s: Stage) => {
  if (t >= wt(2) + 0.3) return;
  const z = dexterDockZ(t), walking = t < 5.6;
  s.places.push(P("dexter", DEXTER, { mode: walking ? "stroll" : "stand", phase: q((t * 1.3) % 1, 12), expr: "grin", gest: after(t, 1, "Timothy") ? "wave" : "hang", k: q((t * 2) % 1, 8), blink: blinkAt(t, 1) }, {}, [DOCK_NB.x + 0.3, 0, z], { yaw: 0.15 }));
  const laugh = after(t, 1, "everyone");
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1, pz = DOCK_NB.z0 + 3 + i * 2.4;
    s.places.push(P(`laugher${i}`, TOWN(i), { expr: laugh ? "laugh" : "smile_closed", gest: laugh ? (i % 2 ? "point" : "palm") : "hang", k: q((t * 3 + i * 0.3) % 1, 8), blink: blinkAt(t, 10 + i), headTilt: laugh ? 6 * Math.sin(t * 9 + i) : 0 }, {},
      [DOCK_NB.x + side * 2.6, 0, pz], { turn: -side * 0.6, size: LO }));
  }
};
// line 2: at his desk by the window, scribbling a letter; an ink blot on his nose
const study = (t: number, s: Stage) => {
  if (!between(t, wt(1, "Dexter") + 0.2, wt(3) + 0.3)) return;
  s.places.push(P("dexterD", DEXTER, { mode: "sit", expr: after(t, 2, "knew") ? "dazed" : "grin", gest: "sign", k: q((t * 5) % 1, 8), blink: blinkAt(t, 1), headTilt: 8 * Math.sin(t * 3) }, { pen: true, ink: true }, W(S, 0, 0.4, -0.95), { yaw: 0 }));
  s.lights.push(warm(W(S, 0.7, 1.1, -0.2), 1.2));
};
// lines 3-4, 6-7: the merchants' counting house
const counting = (t: number, s: Stage) => {
  const L3 = between(t, wt(2, "business") + 0.3, wt(4, "In") + 0.25), L6 = between(t, wt(5, "molasses") + 0.3, wt(6, "He") + 0.25), L7 = between(t, wt(6, "all") + 0.3, wt(7, "The") + 0.25);
  if (!L3 && !L6 && !L7) return;
  // where each merchant stands: huddled; spread when Dexter is there; the two others step back behind the table
  // while one hands him the pan; aside while merch1 holds up the mittens
  const mPos = (i: number, huddled: boolean, handing: boolean, mitt: boolean) => {
    if (handing && i !== 2) return W(TABLE, -1.6 + i * 1.2, 0, -1.0);
    if (mitt && i !== 1) return W(TABLE, i ? 1.7 : -1.7, 0, 0.5);
    return W(TABLE, (huddled ? -0.7 : -0.85) + i * (huddled ? 0.7 : 0.85), 0, 1.0);
  };
  const sweet = L3 && after(t, 3, "to"), hand = L3 && after(t, 4, 0), laughing = L7;
  for (let i = 0; i < 3; i++) {
    const huddle = L3 && !sweet ? 0.25 : 0;
    const gest = hand && i === 2 ? (after(t, 4, "they") ? "palm" : "hold") : L6 && i === 1 ? "cheer" : laughing ? (i === 1 ? "point" : "clutch") : sweet ? "palm" : "hang";
    const expr = laughing ? "laugh" : sweet ? "smile" : L6 ? "smug" : "smug";
    s.places.push(P(`merch${i}`, MERCHANT(i), { expr, gest, k: q((t * 3 + i * 0.3) % 1, 8), blink: blinkAt(t, 20 + i), headTilt: huddle ? (i - 1) * -10 : laughing ? 7 * Math.sin(t * 10 + i) : 0 },
      { pan: hand && i === 2 && !after(t, 4, "they"), mittens: L6 && i === 1 ? "#c8313b" : undefined }, mPos(i, huddle > 0, hand, L6), { turn: (1 - i) * 0.25 }));
  }
  if (L3 && after(t, 3, "advice")) {   // Dexter comes in on "advice"; on "Sell warming pans" he is handed one
    const k = smooth((t - wt(3, "advice") + 0.4) / 0.9);
    const has = after(t, 4, "they");
    s.places.push(P("dexterC", DEXTER, { mode: k < 1 ? "stroll" : "stand", phase: q((t * 1.3) % 1, 12), expr: has ? "laugh" : "grin", gest: has ? "lift" : "hang", k: q((t * 2) % 1, 8), blink: blinkAt(t, 1) }, { pan: has }, W(TABLE, 1.5 + 1.6 * (1 - k), 0, 1.05), { turn: -0.35 }));
  }
};
// lines 4-6: the West Indies dock (the heat), the sugar farm's vats
const tropics = (t: number, s: Stage) => {
  if (between(t, wt(4, "In") - 0.3, wt(5, "sugar") + 0.3)) {
    const unload = after(t, 5, 0);
    // on deck, holding the pan in the heat, sweating; on "He did it" he is on the dock, pointing the crew ashore
    if (!unload) s.places.push(P("dexterT", DEXTER, { expr: "nervous", gest: "hold", k: 0, blink: blinkAt(t, 1), headTilt: 5 * Math.sin(t * 2) }, { pan: true, sweat: true }, DECK(SHIP_TR, -1.0, 0.5), { turn: 0.2 }));
    else s.places.push(P("dexterU", DEXTER, { expr: "grin", gest: "point", blink: blinkAt(t, 1) }, { sweat: true }, [DOCK_TR.x - 1.4, 0, 14.5], { turn: 0.4 }));
    for (let i = 0; i < 3; i++) {   // the crew carries the pans ashore (they walk; started before the cut so they are moving)
      const u = ((t - wt(4, "In") + i * 1.1) * 0.22) % 1, z = 24 - 14 * u;
      s.places.push(P(`sailor${i}`, SAILOR(i), { mode: "stroll", phase: q((t * 1.5 + i * 0.3) % 1, 12), expr: "grin", gest: "hold", blink: blinkAt(t, 30 + i) }, { pan: true }, [DOCK_TR.x + 1.4 - (i % 2) * 0.6, 0, z], { yaw: Math.PI - 0.2, size: LO }));
    }
  }
  if (between(t, wt(5, "farms") - 0.6, wt(6) + 0.3)) {   // the planters stir the molasses with the pans, delighted
    for (let i = 0; i < 3; i++) s.places.push(P(`planter${i}`, PLANTER(i), { expr: after(t, 5, "ladles") ? "laugh" : "grin", gest: "stir", k: q((t * 2 + i * 0.3) % 1, 8), blink: blinkAt(t, 40 + i), headTilt: 5 * Math.sin(t * 4 + i) }, { pan: true },
      [VATS.x - 0.75 + i * 0.75 + 0.06 * Math.sin(t * 3 + i), 0, VATS.z - 0.95 - (i === 1 ? 0.2 : 0)], { yaw: 0.25 * (1 - i) }));
  }
  if (between(t, wt(6, "Send") + 0.3, wt(6, "A") + 0.3)) {   // "He did.": Dexter on the hot dock in red mittens, sweating
    s.places.push(P("dexterM", DEXTER, { expr: "nervous", gest: "shrug2", k: q((t * 2) % 1, 8), blink: blinkAt(t, 1), headTilt: 6 * Math.sin(t * 3) }, { mittens: "#c8313b", sweat: true }, [DOCK_TR.x - 0.6, 0, 14], { turn: 0.15 }));
  }
};
// line 6: the snowy port: the fur-hatted captain buys the lot (red mittens on), his crew already wearing theirs
const snowport = (t: number, s: Stage) => {
  if (!between(t, wt(6, "did") + 0.3, wt(7) + 0.3)) return;
  const bought = after(t, 6, "bought");
  s.places.push(P("captain", CAPTAIN, { expr: bought ? "laugh" : "grin", gest: bought ? "cheer" : "palm", k: q((t * 2.4) % 1, 8), blink: blinkAt(t, 50) }, { mittens: "#c8313b", coins: !bought }, [DOCK_SN.x + 0.2, 0, 14.2], { turn: 0.1 }));
  for (let i = 0; i < 2; i++) s.places.push(P(`fur${i}`, FURSAILOR(i), { expr: "laugh", gest: i ? "wave" : "clutch", k: q((t * 2 + i * 0.5) % 1, 8), blink: blinkAt(t, 51 + i) }, { mittens: i ? "#2a6a3a" : "#c8313b" }, [DOCK_SN.x + (i ? 1.6 : -1.7), 0, 12.6 - i * 0.5], { turn: (i ? -0.3 : 0.3), size: LO }));
  for (let i = 0; i < 26; i++) { const u = ((t * 0.35 + i * 0.137) % 1), x = DOCK_SN.x - 5 + ((i * 3.7) % 10), z = 9 + ((i * 2.3) % 9); s.fx.push(card("snowflake", 100, 100, flake, [x + Math.sin(t + i) * 0.4, 5.5 - 5.2 * u, z], 0.07, 0.07, { soft: true })); }
};
// lines 7-8: Newcastle: Dexter waving at the bow as his coal ship sails in; the strike; the town runs to buy the coal
const newcastle = (t: number, s: Stage) => {
  if (between(t, wt(7, "Newcastle") + 0.3, wt(8) + 0.25)) {
    const sp = coalShipAt(t);
    s.places.push(P("dexterS", DEXTER, { expr: "laugh", gest: "cheer", k: q((t * 2.4) % 1, 8), blink: blinkAt(t, 1) }, {}, V(sp.x - 0.6, SHIP_DECK, sp.z - 3.4), { turn: 0.2 }));
  }
  if (between(t, wt(7, "England") + 0.2, wt(9) + 0.3)) {
    const rush = smooth((t - wt(8, "Sold") + 0.9) / 1.6);
    for (let i = 0; i < 3; i++) s.places.push(P(`miner${i}`, MINER(i), { expr: rush > 0.3 ? "shock" : "stern", gest: rush > 0.3 ? "hang" : i === 1 ? "fist" : "hang", k: q((t * 2.5 + i * 0.4) % 1, 8), blink: blinkAt(t, 60 + i) },
      { banner: rush > 0.3 ? undefined : "T:STRIKE" }, W(STRIKE, -0.85 + i * 0.85, 0, 0), { turn: (1 - i) * 0.2 }));
    // "Sold out": the townsfolk run from the street to the dock where Dexter sells the coal by the sackful
    const rush2 = smooth((t - wt(8, "Sold") + LEAD) / 1.15);
    if (t >= wt(8, "Sold") - LEAD) for (let i = 0; i < 4; i++) {
      const a = V(DOCK_NC.x - 6 + i * 3.6, 0, DOCK_NC.z0 - 7 - (i % 2) * 1.2), b = V(DOCK_NC.x - 1.6 + (i % 2) * 1.6 + (i > 1 ? 0.8 : 0), 0, DOCK_NC.z0 + 2.2 + Math.floor(i / 2) * 1.3), p = a.lerp(b, rush2);
      s.places.push(P(`buyer${i}`, TOWN(i + 6), { mode: rush2 < 1 ? "run" : "stand", phase: q((t * 2.4 + i * 0.3) % 1, 12), expr: "laugh", gest: rush2 < 1 ? "flee" : "hold", k: q((t * 3 + i * 0.3) % 1, 8), blink: blinkAt(t, 70 + i) }, { sack: rush2 >= 1 },
        p, rush2 < 1 ? { yaw: Math.atan2(b.x - a.x, b.z - a.z) } : { turn: 0.3 }));
    }
    if (t > wt(8, "Sold") - 0.9) s.places.push(P("dexterN", DEXTER, { expr: "laugh", gest: after(t, 8, "out") ? "cheer" : "hold", k: q((t * 2.4) % 1, 8), blink: blinkAt(t, 1) }, { sack: !after(t, 8, "out"), coins: after(t, 8, "out") }, V(DOCK_NC.x + 0.4, 0, DOCK_NC.z0 + 5.2), { turn: -0.2 }));
  }
};
// line 9: the mansion: Dexter in his gold; the merchants sulk outside the window
const mansion = (t: number, s: Stage) => {
  if (!between(t, wt(8, "out") + 0.3, wt(10) + 0.3)) return;
  s.places.push(P("dexterR", DEXTER, { expr: "laugh", gest: "cheer", k: q((t * 2) % 1, 8), blink: blinkAt(t, 1) }, { coins: true }, W(M, -0.3, 0, -0.6), { turn: 0 }));
  for (let i = 0; i < 2; i++) s.places.push(P(`sulk${i}`, MERCHANT(i), { expr: "pained", gest: "clutch", blink: blinkAt(t, 80 + i) }, {}, [ROOMS.mansion.x0 + ROOMS.mansion.x1 * 0 + (ROOMS.mansion.x1 - ROOMS.mansion.x0) * (i ? 0.72 : 0.25), 0, ROOMS.mansion.z1 + 1.4], { yaw: Math.PI, size: LO }));
  if (after(t, 9, "richer")) { const u = q((Math.sin(t * 3) + 1) / 2, 6); s.fx.push(card(`glint${u}`, 300, 300, glint(u), W(M, -1.6, 1.0, -1.2), 0.5, 0.5)); }
  s.lights.push(warm(W(M, 0.4, 2.2, 0.4), 1.2));
};
// line 10: Dexter on a crate in the square, arms wide, telling it; the crowd around him (medium distance)
const square = (t: number, s: Stage) => {
  if (!between(t, wt(9, "richer") + 0.3, wt(11) + 0.3)) return;
  const loud = after(t, 10, "Dexter");
  s.places.push(P("dexterQ", DEXTER, { expr: loud ? "laugh" : "grin", gest: loud ? "cheer" : "shrug2", k: q((t * (loud ? 3 : 1.5)) % 1, 8), blink: blinkAt(t, 1), headTilt: 6 * Math.sin(t * 4) }, {}, W(SQUARE, 0, 0.75, 0), { turn: 0 }));
  for (let i = 0; i < 7; i++) {
    const a = -1.25 + i * 0.42, r = 3.4 + (i % 2) * 0.8;
    s.places.push(P(`crowd${i}`, TOWN(i + 1), { expr: loud ? (i % 3 ? "laugh" : "shock") : "grin", gest: loud && i % 2 ? "cheer" : "hang", k: q((t * 2 + i * 0.3) % 1, 8), blink: blinkAt(t, 90 + i) }, {},
      W(SQUARE, Math.sin(a) * r, 0, -Math.cos(a) * r * 0.75 - 0.4), { size: LO }));
  }
};
// line 11: the fake funeral: the coffin, a few mourners (one sobbing, the rest bored); Dexter peeks round the curtain
const funeral = (t: number, s: Stage) => {
  if (t < wt(10, "anyone") + 0.3) return;
  const R0 = ROOMS.parlour;
  const pos: [number, number][] = [[-0.85, -1.05], [0.85, -1.05], [0, -1.2]];
  pos.forEach(([dx, dz], i) => s.places.push(P(`mourner${i}`, MOURNER(i), { expr: i === 0 ? "pained" : i === 2 ? "dazed" : "neutral", gest: i === 0 ? "clutch" : "hang", blink: blinkAt(t, 100 + i), headTilt: i === 0 ? 8 * Math.sin(t * 6) : 0 }, { sweat: i === 0 }, W(PR, dx, 0, dz), { turn: dx < 0 ? 0.3 : -0.3, size: LO })));
  const peek = smooth((t - wt(11, "just") + 0.6) / 0.6);
  s.places.push(P("dexterP", DEXTER, { expr: peek > 0.5 ? "smug" : "grin", gest: "palm", blink: blinkAt(t, 1), headTilt: -10 * peek }, {}, [R0.x0 + 3.55 + 0.25 * peek, 0, R0.z0 + 1.75], { turn: -0.35 }));
  s.lights.push(warm(W(PR, 0, 1.4, 0.6), 1.0));
};
// Newcastle's chimneys smoke (background life, never the subject)
const life = (t: number, s: Stage, chimneys: THREE.Vector3[]) => {
  if (CAM.z > -120) return;
  for (let i = 0; i < chimneys.length; i++) { const c = chimneys[i]; for (let k = 0; k < 3; k++) { const u = ((t * 0.3 + i * 0.37 + k / 3) % 1); s.fx.push(card("bgSmoke", 300, 260, smoke, [c.x + u * 3, c.y + 0.5 + u * 8, c.z], 2 + u * 5, 1.6 + u * 4, { soft: true })); } }
};

let CHIMNEYS: THREE.Vector3[] = [];
export const setChimneys = (c: THREE.Vector3[]) => { CHIMNEYS = c; };
/** everything on stage at time t */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  CAM = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  const s: Stage = { places: [], fx: [], lights: [] };
  dock(t, s); study(t, s); counting(t, s); tropics(t, s); snowport(t, s); newcastle(t, s); mansion(t, s); square(t, s); funeral(t, s); life(t, s, CHIMNEYS);
  void c; void clamp01; void SHIP_TR;
  return s;
};
