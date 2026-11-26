// Who is on stage at time t in "His College Banned Dogs, So He Brought a Bear" (3D cast; the bear and Boatswain are
// world.ts's animals). Warm comedy: Byron cool and pleased with himself, the stout porter with the rule book, the tutors
// in gowns aghast, then helpless. No speech bubbles. Everyone cheats toward the camera (south); nothing stands between
// the camera's side and a face. Every scene bright and warm.
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { Pen } from "../bridge/toon";
import { V } from "../bridge/build";
import { wt, wtn, smooth, Cam, V3, byronAt } from "./story";
import { GATE_Z, LODGE, WAGON, DESK, ROOMS, ARMCHAIR } from "./layout";
import type { Lamp } from "../rats/hanoi";
import { LAMP } from "./looks";
import { person as person0, personKey as personKey0, Look, Extra, BYRON, BYRON_CAPE, PORTER, TUTOR, STUDENT, GOWN } from "./people";
import type { Outfit } from "../bridge/toon";

type C3 = [number, number, number];
type ML = Parameters<typeof person0>[1];
const CARD_G: Record<string, string> = { fist: "point", hug: "clutch", lift: "cheer", charge: "point", flee: "cheer", stir: "hold", shrug2: "palm", aim: "point", swing: "cheer", salute: "tip", clap: "clutch", flail: "cheer", slam: "point", whisper: "tip", nose: "tip", recoil: "cheer", shake: "clutch", tear: "hold", pull: "hold", pullLow: "hold", fold: "clutch" };
const person = (o: Outfit, l: Look, x: Extra) => person0(o, { ...l, mode: l.mode === "run" ? "stroll" : l.mode, gest: (CARD_G[l.gest ?? ""] ?? l.gest) } as ML, x as never);
const personKey = (n: string, l: Look, x: Extra) => personKey0(n, l as unknown as ML, x as never);
export type FxCard = FxPlace & { yaw?: number };
export type Stage = { places: Place[]; fx: FxCard[]; lights: (Lamp & { col: C3 })[] };
const LEAD = 2 / 30;
const HI: [number, number, number] = [600, 1000, 1];
const blinkAt = (t: number, seed: number) => {
  const per = 0.5 + ((Math.sin(seed * 91.7) + 1) / 2) * 1.8, ph = ((t + seed * 0.37) % per) / per;
  const b = ph * per * 30; return b < 4 ? [0.6, 1, 1, 0.6][Math.floor(b)] : 0;
};
const q = (x: number, n: number) => Math.round(x * n) / n;
const after = (t: number, ln: number, w: string | number) => t >= wt(ln, w) - LEAD;
const between = (t: number, a: number, b: number) => t >= a && t < b;
const warm = (p: THREE.Vector3, k: number) => ({ p, k, col: LAMP });
let CAM = new THREE.Vector3();
const P = (name: string, o: Outfit, l: Look, x: Extra, at: V3 | THREE.Vector3, opt: { scale?: number; turn?: number; yaw?: number } = {}): Place => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  const yaw = opt.yaw ?? (opt.turn !== undefined ? Math.atan2(CAM.x - a.x, CAM.z - a.z) + opt.turn : undefined);
  return { key: personKey(name, l, x), draw: person(o, l, x), x: a.x, y: a.y, z: a.z, size: HI, scale: opt.scale, tall: o.hat === "tophat" ? 0.3 : o.hat === "mortarboard" ? 0.12 : 0, rig: { o, l, x }, yaw };
};
const card = (key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3 | THREE.Vector3, w: number, h: number, o: Partial<FxCard> = {}): FxCard => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  return { key, cw, ch, draw, x: a.x, y: a.y, z: a.z, w, h, ...o };
};
const puff = (u: number) => (p: Pen) => { const a = (1 - u) * 0.95; for (let k = 0; k < 6; k++) { const r = 30 + 70 * u, ang = k * 1.05 + u; p.ell(150 + Math.cos(ang) * r * 0.6, 220 - 120 * u - Math.sin(ang) * r * 0.4, 34 + 40 * u, 30 + 34 * u, `rgba(250,250,250,${a.toFixed(2)})`, 0); } };
const warmK = (s: Stage, p: THREE.Vector3, k: number) => s.lights.push(warm(p, k));
/** a soft warm fill in front of the faces of a scene (every face clearly lit) */
const fill = (s: Stage, at: THREE.Vector3, k = 0.9) => warmK(s, V(at.x + 0.6, at.y + 2.0, at.z + 2.6), k);
const BX: Extra = { cape: BYRON_CAPE };
const byron = (s: Stage, l: Look, x: Extra = {}, opt: { turn?: number; yaw?: number } = { turn: 0.15 }, at?: THREE.Vector3) => { const b = byronAt(T); s.places.push(P("byron", BYRON, l, { ...BX, ...x }, at ?? b.p, opt)); };
let T = 0;
const walkL = (t: number, expr: Look["expr"], seed = 1): Look => ({ mode: "stroll", phase: q((t * 1.1) % 1, 12), expr, gest: "hang", blink: blinkAt(t, seed) });

// line 1 (hook): Byron strolls in through the gate, the bear on a red ribbon; two students gape at the gate
const hook = (t: number, s: Stage) => {
  if (t >= wt(2) - LEAD) return;
  byron(s, { ...walkL(t, "smug"), gest: "tip", headTilt: -6 }, { leash: true }, { yaw: 0.15 });
  for (let i = 0; i < 2; i++) s.places.push(P(`student${i}`, STUDENT(i), { expr: "shock", gest: i ? "point" : "recoil", k: q((t * 2) % 1, 8), blink: 0, headTilt: i ? 8 : -8 }, { cape: GOWN }, V(i ? 2.6 : -2.9, 0, GATE_Z + 4.6 + i * 0.5), { turn: i ? -0.5 : 0.5 }));
  fill(s, byronAt(t).p, 1.0);
};
// line 2: Cambridge 1805, the court; Byron arrives with Boatswain, pats him on "beloved dog"
const arrive = (t: number, s: Stage) => {
  if (t < wt(2) - LEAD || t >= wt(3) - LEAD) return;
  const b = byronAt(t), pat = after(t, 2, "beloved");
  byron(s, b.walk ? walkL(t, "smile") : { expr: pat ? "smile_closed" : "smile", gest: pat ? "point" : "hang", k: 0, blink: pat ? 1 : blinkAt(t, 1), headTilt: pat ? 10 : -4, look: 1 }, {}, { yaw: pat ? 0.5 : 0.1 });
  fill(s, b.p, 1.0);
};
// line 3: the porter at his lodge with the rule book: "no dogs. Not one." Byron and Boatswain crestfallen
const lodge = (t: number, s: Stage) => {
  if (t < wt(3) - LEAD || t >= wt(4) - LEAD) return;
  const no = after(t, 3, "no"), notOne = after(t, 3, "Not");
  s.places.push(P("porter", PORTER, { expr: "stern", gest: notOne ? "point" : "paper", k: q((t * 3) % 1, 8), blink: blinkAt(t, 5), headTilt: notOne ? 8 * Math.sin(t * 10) : 4, look: 1 }, notOne ? {} : { paper: "rules" }, V(LODGE.x, 0, LODGE.z + 0.4), { turn: 0.3 }));
  byron(s, { expr: no ? "pained" : "neutral", gest: no ? "fold" : "hang", blink: blinkAt(t, 1), headTilt: no ? 10 : 0, look: -1 }, {}, { turn: -0.25 });
  fill(s, V(LODGE.x + 1, 0, LODGE.z + 1), 1.1);
};
// line 4: Byron reads the rules again, very carefully; "Dogs are banned"; "but bears?" the sly grin; "Not a word."
const rules = (t: number, s: Stage) => {
  if (t < wt(4) - LEAD || t >= wt(5) - LEAD) return;
  const care = after(t, 4, "Very"), dogs = after(t, 4, "Dogs"), bears = after(t, 4, "but"), word = after(t, 4, "Not");
  const l: Look = word ? { expr: "laugh", gest: "paper", blink: blinkAt(t, 1), headTilt: -10 }
    : bears ? { expr: "wink", gest: "paper", blink: 0, headTilt: -8 }
    : dogs ? { expr: "stern", gest: "paper", blink: blinkAt(t, 1), headTilt: 4 }
    : care ? { expr: "nervous", gest: "paper", blink: blinkAt(t, 1), headTilt: 14 }
    : { expr: "neutral", gest: "paper", blink: blinkAt(t, 1), headTilt: 6 };
  byron(s, l, { paper: "rules" }, { turn: 0.1 });
  fill(s, V(2.0, 0, -6.0), 1.1);
};
// line 5: the bear arrives in a fair wagon; Byron presents it, delighted
const wagon = (t: number, s: Stage) => {
  if (t < wt(5) - LEAD || t >= wt(6) - LEAD) return;
  const real = t >= wtn(5, "A", 1) - LEAD;
  byron(s, { expr: real ? "laugh" : "grin", gest: real ? "cheer" : "palm", k: q((t * 2) % 1, 8), blink: blinkAt(t, 1), headTilt: -6, look: 1 }, {}, { turn: 0.35 });
  fill(s, V(WAGON.x - 1.2, 0, WAGON.z + 1.6), 1.1);
};
// line 6: the tutors in their gowns, horrified; "What do we do with it?"
const panic = (t: number, s: Stage) => {
  if (t < wt(6) - LEAD || t >= wt(7) - LEAD) return;
  const what = after(t, 6, "What");
  const at = [V(-1.85, 0, -3.7), V(-1.0, 0, -3.3), V(-0.15, 0, -3.8)];
  for (let i = 0; i < 3; i++) s.places.push(P(`tutor${i}`, TUTOR(i), what ? { expr: i === 1 ? "nervous" : "shock", gest: i === 1 ? "shrug2" : "flail", k: q((t * 3 + i * 0.3) % 1, 8), blink: 0, headTilt: (i - 1) * 8 }
    : { expr: "shock", gest: "recoil", k: q((t * 2 + i * 0.2) % 1, 8), blink: 0, headTilt: (i - 1) * 6 }, { cape: GOWN, sweat: what }, at[i], { turn: 0.3 - i * 0.25 }));
  fill(s, V(-1.0, 0, -3.6), 1.2);
};
// line 7: Byron has an answer (finger up, smug): "He should sit for a fellowship." The bear at the desk in gown and cap
// line 8: the tutors flip the rule book helplessly; the bear waves
const desk = (t: number, s: Stage) => {
  if (t < wt(7) - LEAD || t >= wt(9) - LEAD) return;
  const ans = after(t, 7, "He"), l8 = t >= wt(8) - LEAD;
  byron(s, { expr: ans ? "smug" : "wink", gest: ans ? "palm" : "tip", blink: blinkAt(t, 1), headTilt: -8, look: -1 }, {}, { turn: -0.3 });
  if (l8) for (let i = 0; i < 2; i++) s.places.push(P(`tutor${i}`, TUTOR(i), { expr: after(t, 8, "never") ? "dazed" : "nervous", gest: "paper", k: q((t * 2) % 1, 8), blink: blinkAt(t, 60 + i), headTilt: i ? 10 : -10, look: 1 }, { cape: GOWN, paper: "rules", sweat: true }, V(DESK.x - 1.55 - i * 0.85, 0, DESK.z + 0.7 - i * 0.3), { turn: 0.35 }));
  fill(s, V(DESK.x, 0.9, DESK.z + 0.8), 1.2);
};
// line 9: his rooms in warm lamp light: Byron in the armchair, the bear sitting up beside him, both smug
const rooms = (t: number, s: Stage) => {
  if (t < wt(9) - LEAD) return;
  const claws = after(t, 9, "claws");
  // seated for "poet, rebel"; on "and the only student..." he stands up beside the bear, arm round its shoulder
  if (after(t, 9, "and")) byron(s, { expr: claws ? "laugh" : "smug", gest: claws ? "palm" : "hug", blink: blinkAt(t, 1), headTilt: -8, look: -1 }, {}, { turn: -0.2 }, V(ARMCHAIR.x - 0.35, 0, ARMCHAIR.z + 0.55));
  else byron(s, { mode: "sit", expr: "smug", gest: "fold", blink: blinkAt(t, 1), headTilt: -8, look: -1 }, {}, { turn: -0.2 });
  warmK(s, V(ARMCHAIR.x + 1.15, 1.1, ARMCHAIR.z + 0.2), 1.4); fill(s, V(ROOMS.x - 0.3, 0, ROOMS.z - 1), 1.2);
};
/** everything on stage at time t */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  CAM = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld); T = t;
  const s: Stage = { places: [], fx: [], lights: [] };
  hook(t, s); arrive(t, s); lodge(t, s); rules(t, s); wagon(t, s); panic(t, s); desk(t, s); rooms(t, s);
  void c; void card; void puff; void HI;
  return s;
};
