// Who is on stage at time t in "Napoleon vs. the Rabbits" (3D cast; the rabbits are the instanced swarm in world.ts).
// Comedy first: big reactions (wide eyes, flailing, the hat flying off). Every beat shows a character doing the
// narrated thing (the Bucket / Moon frame checks): Napoleon on his horse, signing and clapping, Berthier saluting with
// his list, the farmers handing over the crates (one kisses a bunny goodbye), the men at the cages, Napoleon aiming,
// gaping, flailing, his officers swinging sticks, Napoleon sprinting for the carriage, Thiébault smirking. No bubbles.
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { V } from "../bridge/build";
import { wt, smooth, Cam, V3, napAt, carriageAt, T_RUN0 } from "./story";
import { ROOMS, RC, NAP, CAGES, BERTH3, RIDER, FARM } from "./layout";
import type { Lamp } from "../rats/hanoi";
import { LAMP } from "./looks";
import { person as person0, personKey as personKey0, Look, Extra, NAPOLEON, NAPOLEON_BARE, BERTHIER, OFFICER, RUSSIAN, FARMER, THIEBAULT } from "./people";
import type { Outfit } from "../bridge/toon";

type C3 = [number, number, number];
type ML = Parameters<typeof person0>[1];
const CARD_G: Record<string, string> = { fist: "point", hug: "clutch", lift: "cheer", charge: "point", flee: "cheer", stir: "hold", shrug2: "palm", aim: "point", swing: "cheer", salute: "tip", clap: "clutch", flail: "cheer" };
const person = (o: Outfit, l: Look, x: Extra) => person0(o, { ...l, mode: l.mode === "run" ? "stroll" : l.mode, gest: (CARD_G[l.gest ?? ""] ?? l.gest) } as ML, x as never);
const personKey = (n: string, l: Look, x: Extra) => personKey0(n, l as unknown as ML, x as never);
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
const P = (name: string, o: Outfit, l: Look, x: Extra, at: V3 | THREE.Vector3, opt: { scale?: number; size?: [number, number, number]; turn?: number; yaw?: number } = {}): Place => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  const yaw = opt.yaw ?? (opt.turn !== undefined ? Math.atan2(CAM.x - a.x, CAM.z - a.z) + opt.turn : undefined);
  return { key: personKey(name, l, x), draw: person(o, l, x), x: a.x, y: a.y, z: a.z, size: opt.size ?? HI, scale: opt.scale, tall: o.hat === "bicorne" ? 0.1 : o.hat === "straw" ? 0.05 : 0, rig: { o, l, x }, yaw };
};
const W = (c: THREE.Vector3, dx: number, dy: number, dz: number) => V(c.x + dx, c.y + dy, c.z + dz);
const T = RC(ROOMS.treaty), S = RC(ROOMS.study);

// line 1: on the white horse at the edge of the hill, pointing ahead; the army behind
const hill = (t: number, s: Stage) => {
  if (t >= wt(2) + 0.3) return;
  s.places.push(P("napoleonH", NAPOLEON, { mode: "sit", expr: after(t, 1, "Feared") ? "smug" : "stern", gest: after(t, 1, "Conqueror") ? "point" : "hang", blink: blinkAt(t, 1), headTilt: after(t, 1, "Feared") ? -6 : 0 }, {}, W(RIDER, 0.0, 1.47, 0), { yaw: Math.PI / 2 - 0.6 }));
};
// line 2: Tilsit: he signs; on "Time to celebrate" he jumps up and claps; on "rabbit hunt" both arms up; officers cheer
const treaty = (t: number, s: Stage) => {
  if (!between(t, wt(1, "Earth") + 0.3, wt(3) + 0.3)) return;
  const party = after(t, 2, "Time"), hunt = after(t, 2, "rabbit");
  s.places.push(P("napoleonT", NAPOLEON, party ? { expr: "laugh", gest: hunt ? "cheer" : "clap", k: q((t * 3) % 1, 8), blink: blinkAt(t, 1), headTilt: 6 * Math.sin(t * 7) } : { mode: "sit", expr: "smug", gest: "sign", k: q((t * 4) % 1, 8), blink: blinkAt(t, 1) },
    { pen: !party }, W(T, -0.3, party ? 0 : 0.4, -2.1), { turn: party ? 0 : 0.1 }));
  s.places.push(P("tsar", RUSSIAN, { expr: party ? "nervous" : "smile_closed", gest: party ? "palm" : "hang", blink: blinkAt(t, 2) }, {}, W(T, party ? 2.6 : 1.6, 0, party ? -2.9 : -1.9), { turn: -0.3, size: party ? LO : HI }));
  for (let i = 0; i < 2; i++) if (party) s.places.push(P(`cheerO${i}`, OFFICER(i), { expr: "laugh", gest: "cheer", k: q((t * 2.6 + i * 0.4) % 1, 8), blink: blinkAt(t, 3 + i) }, {}, W(T, i ? 0.75 : -1.25, 0, -2.25), { turn: 0.3, size: LO }));
  s.lights.push(warm(W(T, 0, 1.3, -0.6), 1.0));
};
// line 3: Berthier salutes, sweating, then holds up his checklist: Get. Rabbits.
const berthier3 = (t: number, s: Stage) => {
  if (!between(t, wt(2, "hunt") + 0.3, wt(4) + 0.3)) return;
  const list = after(t, 3, "had");
  s.places.push(P("berthier", BERTHIER, { expr: after(t, 3, "Get") ? "shock" : "nervous", gest: list ? "hold" : "salute", k: 0, blink: blinkAt(t, 4), headTilt: after(t, 3, "Get") ? 8 * Math.sin(t * 9) : 0 }, { paper: list ? "list" : undefined, sweat: true }, BERTH3, { turn: 0 }));
};
// line 4: the farm: two farmers hand Berthier crates; on "Tame rabbits. Pets." a farmer kisses a bunny goodbye
const farm = (t: number, s: Stage) => {
  if (!between(t, wt(3, "Rabbits") + 0.3, wt(5) + 0.3)) return;
  const got = after(t, 4, "hundreds");
  s.places.push(P("berthierF", BERTHIER, { expr: got ? "grin" : "nervous", gest: got ? "hold" : "palm", blink: blinkAt(t, 4) }, { crate: got }, W(FARM, 0.0, 0, 0), { turn: 0.25 }));
  s.places.push(P("farmer0", FARMER(0), { expr: "smile_closed", gest: "hold", blink: blinkAt(t, 10) }, { crate: true }, W(FARM, -1.25, 0, -0.3), { turn: 0.5 }));
  const sad = after(t, 4, "Tame"), sob = after(t, 4, "Pets");
  s.places.push(P("farmer1", FARMER(1), { expr: sob ? "pained" : sad ? "smile_closed" : "grin", gest: "hold", blink: sad ? 1 : blinkAt(t, 11), headTilt: sad ? -14 + 4 * Math.sin(t * 5) : 0 }, { bunny: sad, crate: !sad, sweat: sob }, W(FARM, 1.3, 0, -0.4), { turn: -0.4 }));
};
// lines 5-10: the hunt in the château park
const hunt = (t: number, s: Stage) => {
  if (!between(t, wt(4, "Pets") + 0.4, wt(11) + 0.3)) return;
  const open = after(t, 5, "open"), aim = after(t, 5, "raises"), at = after(t, 6, "AT"), beg = after(t, 7, 0), swarm = after(t, 8, 0), sticks = after(t, 8, "His"), nope = after(t, 8, "didn't"), split = after(t, 9, "split"), flee = t >= T_RUN0();
  // the men at the cages: they pull the doors and jump back
  if (t < wt(6, "run")) for (let i = 0; i < 2; i++) { const c = CAGES[i ? 4 : 3];
    s.places.push(P(`opener${i}`, OFFICER(i + 4), { expr: open ? "shock" : "grin", gest: open ? "flail" : "point", k: q((t * 3 + i * 0.5) % 1, 8), blink: blinkAt(t, 20 + i), headTilt: open ? 8 * Math.sin(t * 8 + i) : 0 }, {}, V(c.x + (i ? 0.3 : -0.3), 0, c.z + 1.6 + (open ? 0.6 * smooth((t - wt(5, "open")) / 0.4) : 0)), { turn: i ? -0.3 : 0.3 })); }
  // Napoleon: aims (squinting), gapes on "AT him", puzzled while they beg, flails while they climb, sprints for the carriage
  const np = napAt(t), onBox = t >= wt(10, "And") - LEAD;
  if (!onBox) {
    const look: Look = flee ? { mode: "run", phase: q((t * 2.8) % 1, 12), expr: "shock", gest: "flail", k: q((t * 4) % 1, 8), blink: 0 }
      : swarm ? { expr: nope ? "dazed" : "shock", gest: "flail", k: q((t * 3.2) % 1, 8), blink: 0, headTilt: 10 * Math.sin(t * 9) }
      : beg ? { expr: "nervous", gest: "palm", k: 0, blink: blinkAt(t, 1), headTilt: -12, look: 0 }
      : at ? { expr: "shock", gest: "flail", k: q((t * 3) % 1, 8), blink: 0, headTilt: 6 * Math.sin(t * 11) }
      : aim ? { expr: "wink", gest: "aim", blink: 0 } : { expr: "smug", gest: "hang", blink: blinkAt(t, 1) };
    s.places.push(P("napoleon", flee ? NAPOLEON_BARE : NAPOLEON, look, { gun: !swarm && !at && open }, np, flee ? { yaw: Math.atan2(15 - np.x, 13 - np.z) } : { yaw: Math.PI - 0.9 }));
  } else {
    const c = carriageAt(t);
    s.places.push(P("napoleonC", NAPOLEON_BARE, { mode: "sit", expr: "shock", gest: "flail", k: q((t * 4) % 1, 8), blink: 0, headTilt: 8 * Math.sin(t * 10) }, {}, V(c.x + 1.6, 1.47, c.z), { yaw: Math.PI / 2 - 0.6 }));
  }
  // his officers and Berthier: swing sticks and whips at the swarm (the rabbits dodge), then give up; back to back on
  // the flanks; Berthier sweats throughout
  if (t >= wt(8, "men") - 0.35 && t < wt(9) - LEAD) {   // they come running with sticks, then flee before the flanking
    for (let i = 0; i < 2; i++) s.places.push(P(`officer${i}`, OFFICER(i), sticks && !nope ? { expr: "stern", gest: "swing", k: q((t * 2.4 + i * 0.5) % 1, 10), blink: blinkAt(t, 30 + i) } : nope ? { expr: "dazed", gest: "shrug2", blink: blinkAt(t, 30 + i) } : { expr: at ? "shock" : "grin", gest: at ? "flail" : "hang", k: q((t * 3 + i) % 1, 8), blink: blinkAt(t, 30 + i) },
      { stick: sticks }, W(NAP, 0.2, 0, i ? 0.95 : -0.95), { turn: i ? -0.4 : 0.4 }));
    if (false) s.places.push(P("berthierH", BERTHIER, { expr: at || swarm ? "shock" : "nervous", gest: swarm ? "flail" : "clutch", k: q((t * 3.5) % 1, 8), blink: blinkAt(t, 4) }, { paper: swarm ? undefined : "list", sweat: true }, W(NAP, -0.6, 0, 2.4), { turn: 0.2, size: LO }));
  }
};
// line 12: Thiébault at his desk, writing, smirking; looks up at Berthier's portrait on "didn't like Berthier"
const study = (t: number, s: Stage) => {
  if (t < wt(11, "won") + 0.3) return;
  const look = after(t, 12, "really");
  s.places.push(P("thiebault", THIEBAULT, { mode: "sit", expr: look ? "smug" : "grin", gest: look ? "hang" : "sign", k: q((t * 5) % 1, 8), blink: blinkAt(t, 50), headTilt: look ? -10 : 4 * Math.sin(t * 2), look: look ? -1 : 0 }, { pen: !look }, W(S, 0, 0.4, -1.75), { yaw: 0 }));
  s.lights.push(warm(W(S, 0.6, 1.1, -1.0), 1.2));
};

/** everything on stage at time t */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  CAM = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  const s: Stage = { places: [], fx: [], lights: [] };
  hill(t, s); treaty(t, s); berthier3(t, s); farm(t, s); hunt(t, s); study(t, s);
  void c;
  return s;
};
