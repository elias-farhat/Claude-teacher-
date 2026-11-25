// Who is on stage at time t in "This Chicken Lived 18 Months Without a Head" (3D cast; Mike is world.ts's rooster).
// Warm comedy: Lloyd hungry, then the swing (cut on it, never the hit), his jaw dropping; Clara the explainer; Hope the
// promoter; the queue paying; the cheering crowd. No gore, no speech bubbles. Everyone cheats toward the camera (south);
// nothing stands between the camera's side and a face. Every scene brightly lit (Baboon #46: dark interiors).
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { Pen } from "../bridge/toon";
import { V } from "../bridge/build";
import { wt, wtn, smooth, Cam, V3, T_CHOP, truckX, TABLE_TOP } from "./story";
import { CHOP, GRAIN, TABLE, EASEL, BOOTH, TRUCK, RING, PORCH, TENT } from "./layout";
import type { Lamp } from "../rats/hanoi";
import { LAMP } from "./looks";
import { person as person0, personKey as personKey0, Look, Extra, LLOYD, CLARA, HOPE, FOLK } from "./people";
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
  return { key: personKey(name, l, x), draw: person(o, l, x), x: a.x, y: a.y, z: a.z, size: HI, scale: opt.scale, tall: o.hat === "tophat" ? 0.3 : o.hat === "fedora" || o.hat === "straw" ? 0.15 : 0, rig: { o, l, x }, yaw };
};
const card = (key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3 | THREE.Vector3, w: number, h: number, o: Partial<FxCard> = {}): FxCard => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  return { key, cw, ch, draw, x: a.x, y: a.y, z: a.z, w, h, ...o };
};
const puff = (u: number) => (p: Pen) => { const a = (1 - u) * 0.95; for (let k = 0; k < 6; k++) { const r = 30 + 70 * u, ang = k * 1.05 + u; p.ell(150 + Math.cos(ang) * r * 0.6, 220 - 120 * u - Math.sin(ang) * r * 0.4, 34 + 40 * u, 30 + 34 * u, `rgba(250,250,250,${a.toFixed(2)})`, 0); } };
const warmK = (s: Stage, p: THREE.Vector3, k: number) => s.lights.push(warm(p, k));
/** a soft warm fill in front of the faces of a scene (every face clearly lit: Baboon #46) */
const fill = (s: Stage, at: THREE.Vector3, k = 0.9) => warmK(s, V(at.x + 0.6, at.y + 2.0, at.z + 2.6), k);

// line 2: Farmer Lloyd in the yard at golden hour, eyeing the chickens; "wanted chicken for dinner": licking his lips
const farm = (t: number, s: Stage) => {
  if (!between(t, wt(2) - LEAD, wt(3) - LEAD)) return;
  const named = after(t, 2, "Farmer"), hungry = after(t, 2, "wanted");
  const at = V(CHOP.x - 2.6, 0, CHOP.z - 0.6);
  s.places.push(P("lloyd", LLOYD, { expr: hungry ? "lick" : named ? "grin" : "smile", gest: hungry ? "clutch" : named ? "tip" : "hang", blink: blinkAt(t, 1), headTilt: hungry ? 8 : -4, look: 1 }, {}, at, { turn: 0.35 }));
  fill(s, at);
};
// line 3: the swing (we only ever see Lloyd raise the axe: cut before it lands), then his jaw drops as Mike walks off
const chop = (t: number, s: Stage) => {
  if (!between(t, wt(3) - LEAD, wt(4) - LEAD)) return;
  const at = V(CHOP.x + 0.75, 0, CHOP.z - 0.35), swung = t >= T_CHOP(), saw = after(t, 3, "kept");
  const k = swung ? 0.25 : smooth((t - wt(3) + 0.1) / 0.5) * 0.25;   // raised, never brought down on screen
  const l: Look = !swung ? { expr: "stern", gest: "swing", k, blink: blinkAt(t, 1), headTilt: 6, look: -1 }
    : saw ? { expr: "shock", gest: "recoil", k: q((t * 2) % 1, 8), blink: 0, headTilt: -6, look: -1 }
    : { expr: "dazed", gest: "hang", blink: blinkAt(t, 1), look: -1 };
  s.places.push(P("lloyd", LLOYD, l, { axe: !swung || !saw, sweat: saw }, at, { turn: -0.25 }));
  fill(s, at);
};
// line 4: the next morning, Lloyd peeks out from the porch, coffee forgotten
const porch = (t: number, s: Stage) => {
  if (!between(t, wt(4) - LEAD, wt(5) - LEAD)) return;
  const at = V(-0.9, PORCH.h, -5.6), seen = after(t, 4, "Still");
  s.places.push(P("lloyd", LLOYD, { expr: seen ? (after(t, 4, "pecking") ? "dazed" : "shock") : "neutral", gest: seen ? "recoil" : "hold", k: q((t * 1.5) % 1, 8), blink: seen ? 0 : blinkAt(t, 1), headTilt: seen ? 10 : 0, look: 1 }, { tea: !seen }, at, { turn: 0.3 }));
  if (after(t, 4, "no")) s.places.push(P("clara", CLARA, { expr: "shock", gest: "clutch", blink: 0, look: 1 }, {}, V(-2.1, PORCH.h, -6.0), { turn: 0.45 }));
  fill(s, at, 1.0); void GRAIN;
};
// line 5: the neck diagram: Clara points at it; the brain stem glows (world.ts)
const diagram = (t: number, s: Stage) => {
  if (!between(t, wt(5) - LEAD, wt(6) - LEAD)) return;
  const at = V(EASEL.x - 1.2, 0, EASEL.z + 0.5), point = after(t, 5, "brain");
  s.places.push(P("clara", CLARA, { expr: point ? "grin" : "smile", gest: point ? "point" : "palm", blink: blinkAt(t, 2), headTilt: -6, look: 1 }, {}, at, { turn: 0.25 }));
  fill(s, V(EASEL.x - 0.4, 0, EASEL.z), 1.1);
};
// line 6: the kitchen table: Lloyd names him and feeds him with the eyedropper; Clara watches, delighted
const kitchen = (t: number, s: Stage) => {
  if (!between(t, wt(6) - LEAD, wt(7) - LEAD)) return;
  const feed = after(t, 6, "fed"), named = after(t, 6, "named");
  s.places.push(P("lloyd", LLOYD, { expr: feed ? "smile" : named ? "grin" : "smile", gest: feed ? "point" : named ? "palm" : "hang", blink: blinkAt(t, 1), headTilt: feed ? 10 : 0, look: 1 }, { dropper: feed }, V(TABLE.x - 0.7, 0, TABLE.z - 0.55), { turn: 0.35 }));
  s.places.push(P("clara", CLARA, { expr: feed ? "laugh" : "smile", gest: feed ? "clutch" : "hang", blink: blinkAt(t, 2), headTilt: -8, look: 1 }, {}, V(TABLE.x + 1.0, 0, TABLE.z - 0.8), { yaw: -0.45 }));
  fill(s, V(TABLE.x, TABLE_TOP, TABLE.z), 1.1);
};
// line 7: the star: fans waving magazines by the truck; it drives off on "a national tour"
const truck = (t: number, s: Stage) => {
  if (!between(t, wt(7) - LEAD, wt(8) - LEAD)) return;
  const mags = after(t, 7, "Magazines"), x = truckX(t);
  for (let i = 0; i < 2; i++) s.places.push(P(`fan${i}`, FOLK(i), { expr: mags ? "laugh" : "grin", gest: mags ? "paper" : "cheer", k: q((t * 2 + i * 0.3) % 1, 8), blink: blinkAt(t, 10 + i) }, mags ? { paper: "mag" } : {}, V(TRUCK.x + 0.3 + i * 0.85, 0, TRUCK.z + 2.3 + (i % 2) * 0.35), { turn: (i - 1) * 0.3 }));
  fill(s, V(x, 1.4, TRUCK.z), 1.0);
};
// line 8: the queue pays Hope Wade at the booth, 25 cents a look; "Insured...": he flourishes the contract
const booth = (t: number, s: Stage) => {
  if (!between(t, wt(8) - LEAD, wt(9) - LEAD)) return;
  const ins = after(t, 8, "Insured"), b = BOOTH;
  s.places.push(P("hope", HOPE, { expr: ins ? "smug" : "grin", gest: ins ? "paper" : "palm", blink: blinkAt(t, 5), headTilt: ins ? -6 : 4, look: -1 }, ins ? { paper: "contract" } : { coins: true }, V(b.x + 0.75, 0, b.z + 0.75), { turn: -0.35 }));
  for (let i = ins ? 1 : 0; i < 4; i++) { const pay = i === 0;   // run 47: the payer stood in front of Hope on "Insured"; he has gone in
    s.places.push(P(`folk${i}`, FOLK(i + 2), { expr: pay ? "grin" : i % 2 ? "shock" : "smile", gest: pay ? "palm" : i % 2 ? "point" : "hang", blink: blinkAt(t, 20 + i) }, { coins: pay }, V(b.x + 0.05 - i * 0.45 - (i ? 0.35 : 0), 0, b.z + 1.0 - i * 0.75), { turn: 0.35 + i * 0.05 })); }
  fill(s, V(b.x - 0.6, 0, b.z), 1.1); void TENT;
};
// line 9: Lloyd counting the money on the porch table, Clara amazed; the farmhouse behind
const money = (t: number, s: Stage) => {
  if (!between(t, wt(9) - LEAD, wt(10) - LEAD)) return;
  s.places.push(P("lloyd", LLOYD, { expr: after(t, 9, "worth") ? "laugh" : "grin", gest: "palm", k: q((t * 2) % 1, 8), blink: blinkAt(t, 1), headTilt: 8, look: -1 }, { coins: true }, V(2.2, PORCH.h, -6.45), { yaw: 0.35 }));
  s.places.push(P("clara", CLARA, { expr: after(t, 9, "farm") ? "shock" : "smile", gest: "clutch", blink: blinkAt(t, 2), look: 1 }, {}, V(1.35, PORCH.h, -6.9), { yaw: 0.5 }));
  fill(s, V(3.4, PORCH.h, -6.6), 1.1);
};
// line 10: the spotlight: Lloyd and Clara beside the pedestal, the crowd cheering below the stage
const ring = (t: number, s: Stage) => {
  if (t < wt(10) - LEAD) return;
  const r = RING, cheer = after(t, 10, "and"), clap = after(t, 10, "Chicken");
  if (!cheer) s.places.push(P("lloyd", LLOYD, { expr: cheer ? "laugh" : "grin", gest: cheer ? "cheer" : "palm", k: q((t * 2) % 1, 8), blink: blinkAt(t, 1), look: 1 }, {}, V(r.x - 1.5, 0.4, r.z - 0.3), { turn: 0.15 }));
  if (!cheer) s.places.push(P("clara", CLARA, { expr: cheer ? "laugh" : "smile", gest: cheer ? "cheer" : "clutch", k: q((t * 2 + 0.4) % 1, 8), blink: blinkAt(t, 2), look: -1 }, {}, V(r.x + 1.5, 0.4, r.z - 0.3), { turn: -0.15 }));
  if (cheer) for (let i = 0; i < 2; i++) { const sd = i % 2 ? 1 : -1;
    s.places.push(P(`crowd${i}`, FOLK(i), { expr: cheer ? "laugh" : clap ? "grin" : "shock", gest: cheer ? "cheer" : clap ? "clap" : "hang", k: q((t * 2.6 + i * 0.27) % 1, 8), blink: blinkAt(t, 30 + i), look: 0 }, {}, V(r.x + sd * 1.25, 0.4, r.z - 0.3), { turn: -sd * 0.35 })); }
  warmK(s, V(r.x, 4.2, r.z + 1.2), 1.6); fill(s, V(r.x, 0.4, r.z), 1.0);
};
/** everything on stage at time t */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  CAM = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  const s: Stage = { places: [], fx: [], lights: [] };
  farm(t, s); chop(t, s); porch(t, s); diagram(t, s); kitchen(t, s); truck(t, s); booth(t, s); money(t, s); ring(t, s);
  void c; void wtn; void card; void puff; void HI;
  return s;
};
