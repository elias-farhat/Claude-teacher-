// Who is on stage at time t in "The Baboon Who Ran the Railway" (3D cast). Warm comedy: Jumper cocky on the roofs,
// hanging in the air on "missed", then on wooden pegs; Jack small, quick and pleased with himself; the lady's shriek; the
// stern bosses melting into applause. No gore (the fall is never shown); no speech bubbles. Everyone cheats toward the
// camera (south); nothing stands between the camera's side and a face.
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { Pen } from "../bridge/toon";
import { V } from "../bridge/build";
import { wt, wtn, smooth, Cam, V3, jumperOnTrain, T_HANG, trolleyX, passFront, whistles, leverE, pullNow, PULLS } from "./story";
import { BOX, LEVER, JACK_AT, CHAIR, PLAT, MARKET, RAIL_Z } from "./layout";
import type { Lamp } from "../rats/hanoi";
import { LAMP } from "./looks";
import { person as person0, personKey as personKey0, Look, Extra, JUMPER, JACK, JACK_CAP, LADY, BOSS, FOLK, FUR } from "./people";
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
  return { key: personKey(name, l, x), draw: person(o, l, x), x: a.x, y: a.y, z: a.z, size: HI, scale: opt.scale, tall: o.hat === "tophat" ? 0.3 : 0, rig: { o, l, x }, yaw };
};
const card = (key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3 | THREE.Vector3, w: number, h: number, o: Partial<FxCard> = {}): FxCard => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  return { key, cw, ch, draw, x: a.x, y: a.y, z: a.z, w, h, ...o };
};
const puff = (u: number) => (p: Pen) => { const a = (1 - u) * 0.95; for (let k = 0; k < 6; k++) { const r = 30 + 70 * u, ang = k * 1.05 + u; p.ell(150 + Math.cos(ang) * r * 0.6, 220 - 120 * u - Math.sin(ang) * r * 0.4, 34 + 40 * u, 30 + 34 * u, `rgba(250,250,250,${a.toFixed(2)})`, 0); } };
const JACK_S = 0.72;
const EAST = Math.PI / 2;
const PL = V(-2, PLAT.h, 5);
const jack = (t: number) => (t >= wt(12) + 0.25 ? JACK_CAP : JACK);
const JX: Extra = { baboon: FUR };
/** Jack at lever i, facing the camera (south), pulling it if it is being pulled */
const atLever = (i: number) => V(LEVER(i).x, BOX.floor, JACK_AT.z);
const boxLight = (s: Stage) => s.lights.push(warm(V(BOX.x + 0.4, BOX.floor + 1.9, BOX.z + 2.4), 1.0));

// line 1: the station, Jumper (with legs) cocky on the platform; two passengers further along
const station = (t: number, s: Stage) => {
  if (t >= wt(2) - LEAD) return;
  s.places.push(P("jumper", JUMPER, { expr: after(t, 1, "problem") ? "grin" : "smug", gest: after(t, 1, "James") ? "tip" : "hang", blink: blinkAt(t, 1), headTilt: -6, look: 1 }, {}, PL, { turn: 0.25 }));
  for (let i = 0; i < 2; i++) s.places.push(P(`folk${i}`, FOLK(i), { expr: "neutral", gest: "hang", blink: blinkAt(t, 20 + i) }, {}, V(9 + i * 1.6, PLAT.h, 7.2 - i * 0.6), { turn: i ? -0.6 : 0.5 }));
};
// lines 2-3: on the freight train's roofs; on "missed" he hangs in the air and looks down
const roofs = (t: number, s: Stage) => {
  if (!between(t, wt(2) - LEAD, wt(3, "And") - LEAD)) return;
  const j = jumperOnTrain(t), hang = t >= T_HANG();
  const l: Look = hang ? { mode: "stand", expr: "shock", gest: "flail", k: q((t * 4) % 1, 8), blink: 0, headTilt: 14, look: 0 }
    : { mode: j.air ? "stand" : "run", phase: q((t * 2.2) % 1, 12), expr: j.air ? "laugh" : "grin", gest: j.air ? "cheer" : "run", k: q((t * 2.2) % 1, 12), blink: blinkAt(t, 1) };
  s.places.push(P("jumper", JUMPER, l, hang ? { sweat: true } : {}, j.p, { yaw: -EAST + 0.9 }));   // running west, turned toward the camera
};
// line 3 (end) - line 4: on his wooden pegs; "didn't quit": fist up; "built himself wooden legs": hammering a peg
const pegs = (t: number, s: Stage) => {
  if (!between(t, wt(3, "And") - LEAD, wt(4, "became") - LEAD)) return;
  const quit = after(t, 4, 0), build = after(t, 4, "He");
  const l: Look = build ? { expr: "stern", gest: "swing", k: q((t * 2.5) % 1, 10), blink: blinkAt(t, 1), headTilt: 10, look: -1 }
    : quit ? { expr: "stern", gest: "fist", k: q((t * 1.5) % 1, 8), blink: blinkAt(t, 1) }
    : { expr: "pained", gest: "fold", blink: blinkAt(t, 1), headTilt: 12 };
  s.places.push(P("jumper", JUMPER, l, { pegs: true, hammer: build }, PL, { turn: 0.2 }));
};
// the signal box, lines 4 (Jumper pulls), 7-13 (Jack)
const box = (t: number, s: Stage) => {
  const inBox = between(t, wt(4, "became") - LEAD, wt(5) - LEAD) || t >= wt(7, "and") - LEAD;
  if (!inBox) return;
  boxLight(s);
  const p = pullNow(t), jumperPulls = t < wt(5);
  if (jumperPulls) {
    const e = leverE(2, t);
    s.places.push(P("jumper", JUMPER, { expr: e > 0.1 ? "pained" : "stern", gest: "pullLow", k: e, blink: blinkAt(t, 1) }, { pegs: true }, V(LEVER(2).x, BOX.floor, JACK_AT.z), { yaw: 0 }));
    return;
  }
  // Jack: at the lever being pulled (or the last one), waving on "A MONKEY", saluting on "Officially", coins, the bottle
  const i = p && p.who === "jack" ? p.i : 1, e = leverE(i, t);
  const jp = PULLS().filter((q2) => q2.who === "jack"), k2 = jp.findIndex((q2) => q2.t > t + 0.3), nx = k2 >= 0 ? jp[k2] : null, prev = p && p.who === "jack" ? p.i : 1;
  const jx = nx ? LEVER(prev).x + (LEVER(nx.i).x - LEVER(prev).x) * smooth((t - (nx.t - 0.75)) / 0.4) : LEVER(prev).x;
  let l: Look = { expr: e > 0.1 ? "grin" : "smile", gest: e > 0.02 ? "pull" : "hang", k: e, blink: blinkAt(t, 3), headTilt: 4 * Math.sin(t * 2) };
  const x: Extra = { ...JX };
  if (between(t, wtn(9, "A", 1) - LEAD, wt(10) - LEAD)) l = { expr: "grin", gest: "wave", k: q((t * 2.5) % 1, 10), blink: blinkAt(t, 3), headTilt: -8 };
  if (between(t, wt(10, "fire") - LEAD, wt(10, "tested") - LEAD)) l = { ...l, expr: "nervous" };
  if (between(t, wt(12, "Officially") - LEAD, wt(12, "Twenty") - LEAD)) l = { expr: "grin", gest: "salute", blink: blinkAt(t, 3) };
  if (between(t, wt(12, "Twenty") - LEAD + 0.5, wt(12, "and") - LEAD)) { l = { expr: "laugh", gest: "palm", blink: blinkAt(t, 3) }; x.coins = true; }
  if (between(t, wt(12, "and") - LEAD, wt(13) - LEAD)) { l = { expr: "laugh", gest: "hold", blink: blinkAt(t, 3), headTilt: 8 }; x.bottle = true; }
  if (t >= wt(13) - LEAD && e < 0.02) l = { expr: "smug", gest: "fold", blink: blinkAt(t, 3), headTilt: -6 };
  s.places.push(P("jack", jack(t), l, x, V(jx, BOX.floor, JACK_AT.z), { yaw: 0, scale: JACK_S }));
  // Jumper: watching (line 7), in his chair (lines 8-9), on his pegs by the chair (10-13)
  if (t < wt(8) - LEAD) s.places.push(P("jumper", JUMPER, { expr: after(t, 7, "levers") ? "grin" : "shock", gest: "hang", blink: blinkAt(t, 1), look: -1 }, { pegs: true }, V(CHAIR.x, BOX.floor, CHAIR.z), { turn: -0.35 }));
  else if (t < wt(10) - LEAD) { const relax = after(t, 8, "Jumper"); s.places.push(P("jumper", JUMPER, { mode: "sit", expr: relax ? "smile_closed" : "smile", gest: relax ? "fold" : "hang", blink: relax ? 1 : blinkAt(t, 1), headTilt: relax ? -10 : 0 }, { pegs: true }, V(CHAIR.x, BOX.floor + 0.42, CHAIR.z), { yaw: -0.25 })); }
  else { const shrug = after(t, 13, "Which"); s.places.push(P("jumper", JUMPER, { expr: shrug ? "nervous" : after(t, 11, "Perfect") ? "grin" : "nervous", gest: shrug ? "shrug2" : "hang", blink: blinkAt(t, 1), headTilt: shrug ? 10 : 0 }, { pegs: true, sweat: between(t, wt(10), wt(11, "Perfect")) }, V(CHAIR.x + 0.35, BOX.floor, CHAIR.z + 0.3), { turn: -0.3 })); }
};
// line 5-6: the market: Jack on the ox cart holding the reins; Jumper's jaw drops; he pays; Jack hops down beside him
const market = (t: number, s: Stage) => {
  if (!between(t, wt(5) - LEAD, wt(7) - LEAD)) return;
  const m = MARKET, paid = after(t, 6, "named"), hop = smooth((t - wt(6, "named") + LEAD) / 0.4);
  const seat = V(m.x - 0.6, 1.05, m.z), down = V(m.x + 0.6, 0, m.z + 3.1), jp = seat.clone().lerp(down, hop); jp.y += 0.6 * Math.sin(Math.PI * hop);
  s.places.push(P("jack", JACK, paid ? { mode: hop < 1 ? "stand" : "stand", expr: "laugh", gest: hop < 1 ? "cheer" : "wave", k: q((t * 2.5) % 1, 10), blink: blinkAt(t, 3) } : { mode: "sit", expr: "smug", gest: "hold", blink: blinkAt(t, 3), headTilt: 5 * Math.sin(t * 2) }, JX, jp, { yaw: paid ? 0.2 : 0.9, scale: JACK_S }));
  const saw = after(t, 5, "saw"), pay = after(t, 6, 0);
  s.places.push(P("jumper", JUMPER, pay ? { expr: paid ? "laugh" : "grin", gest: paid ? "hug" : "palm", blink: blinkAt(t, 1) } : { expr: saw ? "shock" : "neutral", gest: saw ? "recoil" : "hang", k: q((t * 3) % 1, 8), blink: saw ? 0 : blinkAt(t, 1) }, { pegs: true, coins: pay && !paid }, V(m.x + 1.35, 0, m.z + 3.3), { turn: -0.55 }));
  if (!after(t, 6, "named") || t < wt(6, "named") + 0.2) s.places.push(P("cartman", FOLK(4), { expr: pay ? "grin" : "neutral", gest: pay ? "palm" : "hang", blink: blinkAt(t, 30) }, { coins: paid }, V(m.x + 0.1, 0, m.z + 2.9), { turn: 0.5 }));
  for (let i = 0; i < 4; i++) s.places.push(P(`folk${i}`, FOLK(i), { expr: saw ? "shock" : "neutral", gest: saw && i % 2 ? "point" : "hang", blink: blinkAt(t, 20 + i) }, {}, V(m.x - 6 + i * 4.2, 0, m.z - 4.5 - (i % 2) * 1.5), { turn: (i - 1.5) * 0.3 }));
  s.lights.push(warm(V(m.x + 0.5, 2.2, m.z + 5), 0.6));
};
// line 7: Jack pushes Jumper's trolley along the line in the morning
const trolley = (t: number, s: Stage) => {
  if (!between(t, wt(7) - LEAD, wt(7, "and") - LEAD)) return;
  const x = trolleyX(t), moving = t < wt(7) + 2.0;
  s.places.push(P("jumper", JUMPER, { mode: "sit", expr: "smile_closed", gest: "fold", blink: 1, headTilt: -8 }, { pegs: true }, V(x + 0.15, 0.52 + 0.4, RAIL_Z), { yaw: 0.35 }));
  s.places.push(P("jack", JACK, { mode: moving ? "run" : "stand", phase: q((t * 2.6) % 1, 12), expr: "grin", gest: "charge", blink: blinkAt(t, 3) }, JX, V(x - 1.45, 0.2, RAIL_Z), { yaw: EAST - 0.45, scale: JACK_S }));
};
// lines 8 and 11: the loco's whistle puffs (white steam from the chimney)
const steam = (t: number, s: Stage) => {
  const pf = passFront(t); if (pf > 1500) return;
  whistles().forEach((w, k) => { const u = (t - w + 0.05) / 0.9; if (u > 0 && u < 1) s.fx.push(card(`puff${k}_${q(u, 10)}`, 300, 300, puff(q(u, 10)), [pf - 0.8, 6.0 + 1.2 * u, RAIL_Z], 2.4 + 1.6 * u, 2.4 + 1.6 * u, { soft: true })); });
};
// line 9: the lady on the coach balcony screams and points at the box
const lady = (t: number, s: Stage) => {
  if (!between(t, wt(9) - LEAD, wt(10) - LEAD)) return;
  const pf = passFront(t), scream = after(t, 9, "screamed");
  s.places.push(P("lady", LADY, { expr: scream ? "shock" : "neutral", gest: scream ? "point" : "hang", blink: scream ? 0 : blinkAt(t, 40), headTilt: scream ? 8 * Math.sin(t * 12) : 0, look: -1 }, {}, V(pf - 25.2, 1.22, RAIL_Z + 0.55), { turn: 0.3 }));   // she faces the camera (run check: her back was to it)
  s.lights.push(warm(V(pf - 24, 3.0, RAIL_Z + 3.5), 0.8));
};
// lines 10-12: the bosses march down the platform to the box, test Jack, are won over, hire him
const bosses = (t: number, s: Stage) => {
  if (!between(t, wt(10) - LEAD, wt(13) - LEAD)) return;
  const k = smooth((t - wt(10) + 0.2) / 2.0), walking = k < 1;
  const perfect = after(t, 11, "Perfect"), clap = after(t, 11, "Every"), hire = t >= wt(12) - LEAD;
  for (let i = 0; i < 2; i++) {
    const end = V(BOX.x + (i ? -2.45 : -1.75), BOX.floor, BOX.z + (i ? 0.3 : -0.2))   /* boss1 beside boss0, not between Jack and the camera */, start = V(BOX.x + 6 + i * 1.4, PLAT.h, 6.2);
    const p = V(start.x + (end.x - start.x) * k, PLAT.h, start.z + (end.z - start.z) * smooth((k - 0.8) / 0.2));   // side by side down the platform, then in
    const l: Look = walking ? { mode: "stroll", phase: q((t * 1.4 + i * 0.5) % 1, 12), expr: "stern", gest: "hang", blink: blinkAt(t, 50 + i) }
      : hire ? { expr: "grin", gest: i ? (after(t, 12, "Twenty") && !after(t, 12, "and") ? "palm" : "hang") : "tip", blink: blinkAt(t, 50 + i) }
      : clap ? { expr: "laugh", gest: "clap", k: q((t * 3 + i * 0.3) % 1, 8), blink: blinkAt(t, 50 + i) }
      : perfect ? { expr: "shock", gest: "recoil", k: q((t * 2) % 1, 8), blink: 0 }
      : { expr: "stern", gest: i ? "fold" : "hold", blink: blinkAt(t, 50 + i), headTilt: 6 };
    s.places.push(P(`boss${i}`, BOSS(i), l, { clipboard: i === 0 && !hire, coins: i === 1 && hire && after(t, 12, "Twenty") && !after(t, 12, "Twenty") }, p, { turn: i ? -0.55 : 0.55 }));
  }
};
/** everything on stage at time t */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  CAM = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  const s: Stage = { places: [], fx: [], lights: [] };
  station(t, s); roofs(t, s); pegs(t, s); box(t, s); market(t, s); trolley(t, s); steam(t, s); lady(t, s); bosses(t, s);
  void c; void wtn;
  return s;
};
