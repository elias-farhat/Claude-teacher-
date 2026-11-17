// Who is on stage at time t in "The Pope Who Put a Corpse on Trial" (3D cast). Comedy with big reactions: Stephen
// red-faced, slamming, pointing, screaming, tearing the verdict, then freezing; the bishops recoiling and whispering;
// the deacon shaking behind the throne; the monks holding their noses. Formosus is a cartoon: pale green, X eyes,
// slumped, his mitre slipping and finally tipping off. No gore; no speech bubbles. Candles stand to the SIDES of the
// seats, never between the camera's side and a face (Napoleon run 40).
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { Pen } from "../bridge/toon";
import { V } from "../bridge/build";
import { wt, smooth, Cam, V3, fileIn, formMitreTilt, T_MITRE, T_SPLASH, stephenOut, T_KNOCK } from "./story";
import { STEPHEN_AT, FORMOSUS_AT, THRONE, BENCH_Z, GRAVE, BANK, RIVER, NAVE } from "./layout";
import type { Lamp } from "../rats/hanoi";
import { LAMP } from "./looks";
import { person as person0, personKey as personKey0, Look, Extra, STEPHEN, STEPHEN_BARE, FORMOSUS, FORMOSUS_BARE, DEACON, BISHOP, MONK, GUARD, ROMAN } from "./people";
import type { Outfit } from "../bridge/toon";

type C3 = [number, number, number];
type ML = Parameters<typeof person0>[1];
const CARD_G: Record<string, string> = { fist: "point", hug: "clutch", lift: "cheer", charge: "point", flee: "cheer", stir: "hold", shrug2: "palm", aim: "point", swing: "cheer", salute: "tip", clap: "clutch", flail: "cheer", slam: "point", whisper: "tip", nose: "tip", recoil: "cheer", shake: "clutch", tear: "hold" };
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
  return { key: personKey(name, l, x), draw: person(o, l, x), x: a.x, y: a.y, z: a.z, size: opt.size ?? HI, scale: opt.scale, tall: o.hat === "mitre" ? 0.36 : o.hat === "kettle" ? 0.04 : 0, rig: { o, l, x }, yaw };
};
const card = (key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3 | THREE.Vector3, w: number, h: number, o: Partial<FxCard> = {}): FxCard => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  return { key, cw, ch, draw, x: a.x, y: a.y, z: a.z, w, h, ...o };
};
const W = (c: THREE.Vector3, dx: number, dy: number, dz: number) => V(c.x + dx, c.y + dy, c.z + dz);
const splash = (u: number) => (p: Pen) => { const a = (1 - u) * 0.9; for (let k = 0; k < 7; k++) { const ang = Math.PI * (0.1 + 0.8 * k / 6), r = 40 + 110 * u; p.ell(150 + Math.cos(ang) * r, 200 - Math.sin(ang) * r * 1.3, 18 * (1 - u) + 6, 26 * (1 - u) + 8, `rgba(235,245,250,${a.toFixed(2)})`, 0); } p.ell(150, 205, 120 * u + 30, 18, `rgba(235,245,250,${(a * 0.8).toFixed(2)})`, 0); };
const S = STEPHEN_AT, F = FORMOSUS_AT;
const EAST = Math.PI / 2, WEST = -Math.PI / 2;
// bishops 1 and 2 sit side by side in the middle (the reaction shots frame them); 0 and 3 sit well out at the ends
const benchSeat = (i: number) => V([-2.6, -0.42, 0.42, 2.6][i], 0.4, BENCH_Z + 0.3);

// the bishops: file in on line 1, then sit on their bench (they recoil on "dead", whisper on "Becoming pope illegally")
const bishops = (t: number, s: Stage) => {
  if (t >= wt(11) - 0.3) return;
  const recoil = between(t, wt(3, "dead") - LEAD, wt(4) + 0.3), whisper = between(t, wt(6, "Becoming") - LEAD, wt(7) + 0.3);
  for (let i = 0; i < 4; i++) {
    const k = fileIn(t, i), seat = benchSeat(i), start = i === 1 || i === 2 ? V(i === 1 ? -0.45 : 0.45, 0, -7) : V(i ? 1.2 : -1.2, 0, -4.2);   // 1 and 2 lead, 0 and 3 follow wider
    const toward = Math.atan2(F.x - seat.x, F.z - seat.z);
    if (k < 1) { const p = start.clone().lerp(V(seat.x, 0, seat.z + 0.9), k); s.places.push(P(`bishop${i}`, BISHOP(i), { mode: "stroll", phase: q((t * 1.3 + i * 0.25) % 1, 12), expr: "neutral", gest: "hang", blink: blinkAt(t, 10 + i) }, {}, p, { yaw: Math.PI + 0.1 * (i % 2 ? -1 : 1) })); continue; }
    s.places.push(P(`bishop${i}`, BISHOP(i), recoil ? { mode: "sit", expr: "shock", gest: "recoil", k: q((t * 3 + i * 0.3) % 1, 8), blink: 0, headTilt: 8 * Math.sin(t * 9 + i) }
      : whisper ? { mode: "sit", expr: i % 2 ? "smug" : "nervous", gest: i % 2 ? "whisper" : "hang", blink: blinkAt(t, 10 + i), headTilt: (i % 2 ? -1 : 1) * 12, look: i % 2 ? -1 : 1 }
      : { mode: "sit", expr: "neutral", gest: "hang", blink: blinkAt(t, 10 + i) }, {}, seat, { yaw: recoil ? toward * 0.6 : 0.15 * (1.5 - i) }));
  }
};
// Stephen on his high seat (lines 2-10): slams the crozier, shrugs, points with the scroll, screams, tears the verdict,
// then freezes as he works out he has just cancelled himself
const stephen = (t: number, s: Stage) => {
  if (!between(t, wt(1, "begin") + 0.2, wt(11) + 0.15)) return;
  let l: Look = { expr: "stern", gest: "slam", k: q((t * 1.6) % 1, 10), blink: blinkAt(t, 1) }, x: Extra = { staff: true };
  if (between(t, wt(4) - LEAD, wt(5))) { l = { expr: "smug", gest: "shrug2", blink: blinkAt(t, 1), headTilt: -8 }; x = {}; }
  if (between(t, wt(6) - LEAD, wt(8))) { l = { expr: "stern", gest: "point", blink: blinkAt(t, 1) }; x = { scroll: "rolled" }; }
  if (between(t, wt(8) - LEAD, wt(9))) {   // screamed! pointed! accused!
    const ph = after(t, 8, "accused") ? 2 : after(t, 8, "pointed") ? 1 : 0;
    l = [{ expr: "shock", gest: "slam", k: q((t * 3) % 1, 10), blink: 0, headTilt: 9 * Math.sin(t * 13) } as Look, { expr: "stern", gest: "point", blink: 0, headTilt: -6 } as Look, { expr: "shock", gest: "fist", k: q((t * 4) % 1, 8), blink: 0, headTilt: 7 * Math.sin(t * 11) } as Look][ph];
    x = { scroll: ph === 2 ? "rolled" : undefined, sweat: true };
  }
  if (between(t, wt(9) - LEAD, wt(10))) { l = { expr: "stern", gest: "hang", blink: blinkAt(t, 1) }; x = { staff: true }; }
  if (t >= wt(10) - LEAD) {
    const tear = after(t, 10, "cancelled"), oops = after(t, 10, "including");
    l = oops ? { expr: "shock", gest: "tear", blink: 0, headTilt: -4 } : tear ? { expr: "laugh", gest: "tear", k: 0, blink: blinkAt(t, 1) } : { expr: "stern", gest: "slam", k: q((t * 2) % 1, 10), blink: blinkAt(t, 1) };
    x = oops ? { scroll: "torn", sweat: true } : tear ? { scroll: "torn" } : { staff: true };
  }
  s.places.push(P("stephen", STEPHEN, l, x, S, { yaw: EAST - 0.25 }));
  s.lights.push(warm(W(S, 0.9, 1.0, 2.2), 0.7));
};
// Formosus on his throne (lines 3, 5, 7, 9, 10): slumped, X eyes; his mitre slides, then tips off on "said nothing"
const formosus = (t: number, s: Stage) => {
  if (!between(t, wt(2, "Sixth") + 0.3, wt(11) - 0.2)) return;
  const bare = t >= T_MITRE();
  s.places.push(P("formosus", bare ? FORMOSUS_BARE : FORMOSUS, { mode: "sit", expr: "dazed", gest: "hang", blink: 0, headTilt: 24, tilt: 8 }, { xeyes: true, hatTilt: bare ? 0 : formMitreTilt(t) }, F, { yaw: WEST + 0.2 }));
  // line 5: the monks fuss over him, robes and mitre (on "sat him on a throne" the mitre slides)
  if (between(t, wt(4, "up") + 0.3, wt(6) + 0.2)) for (let i = 0; i < 2; i++)
    s.places.push(P(`monkD${i}`, MONK(i), { expr: i ? "nervous" : "grin", gest: i ? "palm" : "hold", k: q((t * 2 + i * 0.5) % 1, 8), blink: blinkAt(t, 40 + i) }, {}, W(F, -0.3, THRONE.h - F.y, i ? 0.78 : -0.78), { turn: i ? -0.55 : 0.55 }));
  // line 7: the deacon peeks out from behind the throne, shaking, and answers for him
  if (between(t, wt(7, "nervous") - LEAD, wt(8) + 0.2)) {
    const ans = after(t, 7, "answered");
    s.places.push(P("deacon", DEACON, { expr: "nervous", gest: ans ? "palm" : "shake", k: q((t * 6) % 1, 8), blink: blinkAt(t, 30), headTilt: 5 * Math.sin(t * 23) }, { sweat: true }, W(F, 0.95, THRONE.h - F.y, -0.85), { yaw: WEST + 0.35 }));
  }
};
// line 4: the night graveyard: two hooded monks dig, a lantern; on "dug" the lid comes up and they hold their noses
const grave = (t: number, s: Stage) => {
  if (!between(t, wt(4, "care") + 0.4, wt(5) + 0.2)) return;
  const dug = after(t, 4, "dug");
  s.places.push(P("monk0", MONK(0), dug ? { expr: "pained", gest: "nose", blink: 1 } : { expr: "grin", gest: "hold", blink: blinkAt(t, 40) }, { shovel: !dug }, W(GRAVE, -0.95, 0, 0.65), { turn: 0.35 }));
  s.places.push(P("monk1", MONK(1), { expr: dug ? "pained" : "nervous", gest: dug ? "nose" : "hang", blink: dug ? 1 : blinkAt(t, 41) }, { lantern: true }, W(GRAVE, 1.0, 0, 0.75), { turn: -0.35 }));
  s.lights.push(warm(W(GRAVE, 1.25, 0.7, 1.0), 1.4));
};
// line 11: the Tiber: the two monks swing the wrapped body and throw it; a big splash
const tiber = (t: number, s: Stage) => {
  if (!between(t, wt(10, "bishop") + 0.3, wt(12) + 0.2)) return;
  const thrown = after(t, 11, "threw");
  for (let i = 0; i < 2; i++) s.places.push(P(`monkR${i}`, MONK(i), { expr: thrown ? "laugh" : "grin", gest: thrown ? "cheer" : "hold", k: q((t * 2 + i * 0.4) % 1, 8), blink: blinkAt(t, 40 + i) }, {}, W(BANK, -0.1, 0, i ? 0.75 : -0.75), { yaw: EAST + (i ? 0.45 : -0.45) }));
  const u = (t - T_SPLASH()) / 0.9; if (u > 0 && u < 1) s.fx.push(card(`splash${q(u, 8)}`, 300, 300, splash(q(u, 8)), [RIVER.x + 4, RIVER.y + 0.8, BANK.z + 1], 3.0, 3.0, { soft: true }));
};
// line 12: the piazza at dusk: the crowd boos; the guards march Stephen out; his mitre is knocked off on "lost"
const piazza = (t: number, s: Stage) => {
  if (!between(t, wt(11, "river") + 0.3, wt(13) + 0.2)) return;
  const boo = (i: number) => ({ expr: i % 3 ? "stern" : "shock", gest: i % 2 ? "fist" : "point", k: q((t * 3 + i * 0.4) % 1, 8), blink: blinkAt(t, 60 + i), headTilt: 6 * Math.sin(t * 7 + i) } as Look);
  // before Stephen comes out: three Romans boo at the doors (turned to the camera); once he is marched out (a cut) they
  // follow right behind him, still booing, inside the same frame
  const marched = t >= wt(12, "And") - LEAD, p = stephenOut(t);
  const spots: [number, number][] = marched ? [[-0.75, -1.7], [0.25, -2.2], [1.05, -1.8]] : [[-0.9, 4.3], [0.15, 3.8], [1.2, 4.4]];
  spots.forEach(([dx, dz], i) => s.places.push(P(`roman${i}`, ROMAN(i), marched ? { ...boo(i), mode: t < wt(12, "And") + 2.7 ? "stroll" : "stand", phase: q((t * 1.3 + i * 0.3) % 1, 12) } : boo(i), {}, marched ? V(p.x + dx, 0, p.z + dz) : V(dx, 0, NAVE.z1 + dz), { turn: dx < 0 ? 0.35 : -0.35, size: marched ? LO : HI })));
  if (marched) {
    const out = t >= T_KNOCK(), walking = t < wt(12, "And") + 2.7;
    s.places.push(P("stephenX", out ? STEPHEN_BARE : STEPHEN, { mode: walking ? "stroll" : "stand", phase: q((t * 1.3) % 1, 12), expr: out ? "shock" : "nervous", gest: out ? "recoil" : "clutch", k: q((t * 3) % 1, 8), blink: 0, headTilt: out ? 10 * Math.sin(t * 9) : 0 }, { sweat: true }, p, { turn: 0 }));
    for (let i = 0; i < 2; i++) s.places.push(P(`guard${i}`, GUARD(i), { mode: walking ? "stroll" : "stand", phase: q((t * 1.3 + 0.5) % 1, 12), expr: "stern", gest: "hang", blink: blinkAt(t, 70 + i) }, { spear: true }, V(p.x + (i ? 0.7 : -0.7), 0, p.z - 0.25), { turn: i ? -0.2 : 0.2 }));
  }
};

/** everything on stage at time t */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  CAM = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  const s: Stage = { places: [], fx: [], lights: [] };
  bishops(t, s); stephen(t, s); formosus(t, s); grave(t, s); tiber(t, s); piazza(t, s);
  void c;
  return s;
};
