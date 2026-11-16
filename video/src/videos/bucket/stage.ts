// Who and what is on stage at time t in "The War of the Bucket" (3D cast). Reactions land 0-2 frames before their
// word. CLAUDE.md 10: whoever the narration names doing something is on screen doing it (the lords glaring, the
// Modenese stealing the bucket, Bologna's lord shouting, Modena's lord hugging it, the armies, the knight grabbing the
// souvenir, the crowd cheering, the tourist looking). CLAUDE.md 11: at night the thieves stand in torch light.
// The battle is cartoon: swords waved, dust, nobody hurt. No speech bubbles.
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { Pen } from "../bridge/toon";
import { V } from "../bridge/build";
import { wt, clamp01, smooth, Cam, V3, chaseX, lineEnd, armyDX } from "./story";
import { WELL_MID, WELL_B, WELL_OUT, LORDS, RIDGE, CLASH, ARMY, MODENA, PIAZZA_M, TOWER, ROOM_Y } from "./layout";
import type { Lamp } from "../rats/hanoi";
import { LAMP } from "./looks";
import { person as person0, personKey as personKey0, Look, Extra, LORD_M, LORD_B, MOD_SOLDIER, BOL_SOLDIER, SNEAK, KNIGHT, TOURIST, CITIZEN, MOD_FLAG, BOL_FLAG } from "./people";
import type { Outfit } from "../bridge/toon";

type C3 = [number, number, number];
type ML = Parameters<typeof person0>[1];
// the card fallback draws the medieval gestures as their nearest card pose
const CARD_G: Record<string, string> = { fist: "point", hug: "clutch", lift: "cheer", charge: "point", flee: "cheer" };
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
/** turn: radians away from facing the camera (+ = toward the figure's left on screen); absolute yaw if abs */
const P = (name: string, o: Outfit, l: Look, x: Extra, at: V3 | THREE.Vector3, opt: { scale?: number; size?: [number, number, number]; turn?: number; yaw?: number } = {}): Place => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  const yaw = opt.yaw ?? (opt.turn !== undefined ? Math.atan2(CAM.x - a.x, CAM.z - a.z) + opt.turn : undefined);
  return { key: personKey(name, l, x), draw: person(o, l, x), x: a.x, y: a.y, z: a.z, size: opt.size ?? HI, scale: opt.scale, tall: o.hat === "bascinet" ? 0.1 : o.hat === "crown" ? 0.08 : 0, rig: { o, l, x }, yaw };
};
const card = (key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3 | THREE.Vector3, w: number, h: number, o: Partial<FxCard> = {}): FxCard => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  return { key, cw, ch, draw, x: a.x, y: a.y, z: a.z, w, h, ...o };
};
// small FX: dust puffs (the battle), a sparkle glint (the bucket in the tower room)
const puff = (u: number, col = "rgba(222,206,176,") => (p: Pen) => { const a = (1 - u) * 0.8; for (let k = 0; k < 4; k++) p.ell(60 + k * 60, 150 - 30 * u - (k % 2) * 20, 30 + 40 * u, 22 + 26 * u, `${col}${a.toFixed(2)})`, 0); };
const glint = (u: number) => (p: Pen) => { const r = 40 + 70 * u; p.poly([[150, 150 - r], [162, 138], [150 + r, 150], [162, 162], [150, 150 + r], [138, 162], [150 - r, 150], [138, 138]], "#fff7d6", 0); p.ell(150, 150, 18 + 10 * u, 18 + 10 * u, "#ffffff", 0); };
const W = (dx: number, dy: number, dz: number, c: THREE.Vector3) => V(c.x + dx, c.y + dy, c.z + dz);

// ---------------- beats ----------------
// line 2: the two lords glare across the field, each with a bannerman behind
const lords = (t: number, s: Stage) => {
  if (!between(t, wt(1, "story") - 0.3, wt(3, "Legend") + 0.4)) return;
  const glare = after(t, 2, "hated");
  s.places.push(P("lordM", LORD_M, { expr: glare ? "stern" : "smug", gest: glare ? "point" : "hang", blink: blinkAt(t, 3), headTilt: glare ? -4 : 0 }, {}, W(-0.85, 0, 0, LORDS), { turn: -0.6 }));
  s.places.push(P("lordB", LORD_B, { expr: glare ? "stern" : "smug", gest: glare ? "fist" : "hang", k: q((t * 2.5) % 1, 8), blink: blinkAt(t, 4), headTilt: glare ? 4 : 0 }, {}, W(0.85, 0, 0, LORDS), { turn: 0.6 }));
  s.places.push(P("bgBannerM", MOD_SOLDIER(1), { expr: "neutral", gest: "hang", blink: blinkAt(t, 5) }, { banner: MOD_FLAG }, W(-2.4, 0, -5.5, LORDS), { size: LO, turn: -0.3 }));
  s.places.push(P("bgBannerB", BOL_SOLDIER(1), { expr: "neutral", gest: "hang", blink: blinkAt(t, 6) }, { banner: BOL_FLAG }, W(2.4, 0, -5.5, LORDS), { size: LO, turn: 0.3 }));
};
// line 3: night in Bologna; two Modenese tiptoe to the well and one lifts the bucket
const night = (t: number, s: Stage) => {
  if (!between(t, wt(2, "other") + 0.2, wt(4, "Bologna") + 0.3)) return;
  const k = smooth((t - wt(3, "soldiers") + 0.4) / (wt(3, "stole") - wt(3, "soldiers")));
  const stole = after(t, 3, "stole");
  for (let i = 0; i < 2; i++) {
    const end = W(-1.2 + i * 2.2, 0, 0.9 - i * 0.3, WELL_B), start = W(-7 + i * 0.8, 0, 3.0 + i * 0.6, WELL_B), p = start.lerp(end, k);
    const walking = k > 0 && k < 1;
    s.places.push(P(`sneak${i}`, SNEAK(i), { mode: walking ? "stroll" : "stand", phase: q((t * 1.2 + i * 0.5) % 1, 12), expr: stole ? "grin" : "nervous", gest: i === 0 && stole ? "lift" : walking ? "clutch" : "hang", k: q((t * 2) % 1, 8), blink: blinkAt(t, 10 + i), look: i ? -1 : 1 },
      { bucket: i === 0 && stole }, p, { turn: i ? 0.4 : -0.4 }));
  }
  s.lights.push(warm(W(-1.6, 2.6, 2.4, WELL_B), 1.4));
};
// line 4: Bologna's lord shakes his fist at Modena's gate; Modena's lord on the wall hugs the bucket, shaking his head
const gate = (t: number, s: Stage) => {
  if (!between(t, wt(3, "town") , wt(5, "So") + 0.3)) return;
  s.places.push(P("lordBG", LORD_B, { expr: "stern", gest: "fist", k: q((t * 3) % 1, 8), blink: blinkAt(t, 4), headTilt: 5 * Math.sin(t * 7) }, {}, [MODENA.gateX + 5.5, 0, 1.2], { turn: 0.5 }));
  for (let i = 0; i < 2; i++) s.places.push(P(`bgEscort${i}`, BOL_SOLDIER(i + 3), { expr: "stern", gest: "hang", blink: blinkAt(t, 20 + i) }, { spear: true }, [MODENA.gateX + 8 + i * 1.4, 0, 3.0 - i * 2.6], { size: LO, turn: 0.4 }));
  const no = after(t, 4, "Modena");
  s.places.push(P("lordMW", LORD_M, { expr: no ? "smug" : "grin", gest: "hug", blink: blinkAt(t, 3), headTilt: no ? 14 * Math.sin((t - wt(4, "Modena")) * 9) : 0 }, { bucket: true }, [MODENA.gateX - 0.3, MODENA.wallH, 0.2], { turn: -0.3 }));
};
// line 5: the host (instanced, world.ts) marches; Modena's 7,000: a short line on the ridge with spears and banners
const ridge = (t: number, s: Stage) => {
  if (!between(t, wt(5, "thousand") - 0.4, wt(6, "took") + 0.2)) return;
  for (let i = 0; i < 4; i++) s.places.push(P(`modS${i}`, MOD_SOLDIER(i), { expr: i % 2 ? "nervous" : "stern", gest: i === 2 ? "hang" : "hang", blink: blinkAt(t, 30 + i) }, { spear: i !== 2, banner: i === 2 ? MOD_FLAG : undefined, shield: i !== 2 ? MOD_FLAG : undefined },
    [RIDGE.x + 1.5 - (i % 2) * 0.35, RIDGE.h, -1.35 + i * 0.9], { turn: 0.3 }));
  // Bologna's front rank marching in (the instanced host behind them)
  if (t < wt(6, "took")) for (let i = 0; i < 3; i++) {
    const x = ARMY.x0 + armyDX(t) - 2.2 + i * 0.55;
    s.places.push(P(`bolS${i}`, BOL_SOLDIER(i), { mode: "stroll", phase: q((t * 1.4 + i * 0.25) % 1, 12), expr: "smug", gest: "hang", blink: blinkAt(t, 40 + i) }, { spear: true, shield: BOL_FLAG }, [x, 0, 1.4 + i * 0.85], { turn: -0.5 }));
  }
};
// line 6: the clash (cartoon: swords waved, dust, nobody hurt) then Bologna runs
const clash = (t: number, s: Stage) => {
  if (!between(t, wt(6, "took") - 0.4, wt(7) + 0.4)) return;
  const lost = after(t, 6, "Bologna");
  const nm = (side: string, i: number) => (i === 0 ? `fight${side}0` : `bgFight${side}${i}`);
  for (let i = 0; i < 3; i++) {   // Modena (pair 0 in front; pairs 1-2 further back)
    const p = W(-0.55 - (i ? 1.2 : 0) + i * 0.6, 0, i ? -4 - i * 1.5 : 0, CLASH);
    if (lost) p.x += 1.4 * clamp01((t - wt(6, "Bologna") + LEAD) / 1.2);
    s.places.push(P(nm("M", i), MOD_SOLDIER(i + 5), { mode: lost ? "run" : "stand", phase: q((t * 2.2 + i * 0.3) % 1, 12), expr: lost ? "laugh" : "stern", gest: lost ? "cheer" : "fist", k: q((t * 3 + i * 0.3) % 1, 8), blink: blinkAt(t, 50 + i) }, { sword: true, shield: MOD_FLAG }, p, { turn: -0.8, size: i ? LO : HI }));
  }
  for (let i = 0; i < 3; i++) {   // Bologna
    const p = W(0.55 + (i ? 0.4 : 0) + i * 0.6, 0, i ? -4 - i * 1.5 : 0.1, CLASH), run = lost ? clamp01((t - wt(6, "Bologna") + LEAD) / 1.4) : 0;
    p.x += (i ? 6 : 2.2) * run * run + (i ? 1.5 : 0.6) * run;
    s.places.push(P(nm("B", i), BOL_SOLDIER(i + 5), { mode: lost ? "run" : "stand", phase: q((t * 2.4 + i * 0.3) % 1, 12), expr: lost ? "shock" : "stern", gest: lost ? "flee" : "fist", k: q((t * 3 + i * 0.4) % 1, 8), blink: blinkAt(t, 60 + i) }, { sword: !lost, shield: lost ? undefined : BOL_FLAG }, p, lost ? { yaw: Math.PI / 2 - 0.5, size: i ? LO : HI } : { turn: 0.8, size: i ? LO : HI }));
  }
  for (let i = 0; i < 4; i++) { const u = ((t * 1.3 + i * 0.25) % 1); s.fx.push(card(`dust${q(u, 6)}`, 300, 200, puff(q(u, 6)), W(-1.2 + i * 0.8, 0.3 + u * 0.7, -1.6 - (i % 2) * 2.5, CLASH), 1.4 + u, 0.9 + u * 0.6, { soft: true })); }
};
// line 7: the Modenese chase them down the road to Bologna's gate
const chase = (t: number, s: Stage) => {
  if (!between(t, wt(6, "lost") + 0.1, wt(8, "home"))) return;
  const x = chaseX(t);
  for (let i = 0; i < 2; i++) s.places.push(P(`run${i}`, BOL_SOLDIER(i + 8), { mode: "run", phase: q((t * 2.6 + i * 0.33) % 1, 12), expr: "shock", gest: "flee", k: q((t * 3 + i * 0.3) % 1, 8), blink: blinkAt(t, 70 + i) }, {}, [x + 2.4 + i * 0.7, 0, -0.7 + i * 1.5], { yaw: Math.PI / 2 - 0.35 }));
  for (let i = 0; i < 2; i++) s.places.push(P(`chaser${i}`, MOD_SOLDIER(i + 2), { mode: "run", phase: q((t * 2.6 + i * 0.33 + 0.5) % 1, 12), expr: "laugh", gest: i === 1 ? "cheer" : "charge", k: q((t * 3 + i * 0.3) % 1, 8), blink: blinkAt(t, 80 + i) }, { spear: i !== 1, sword: i === 1 }, [x - 0.4 - i * 0.5, 0, -0.5 + i * 1.3], { yaw: Math.PI / 2 - 0.35 }));
};
// line 8-9: the knight walks home past the well outside the walls and grabs its bucket, grinning; holds it up on "bucket"
const souvenir = (t: number, s: Stage) => {
  if (!between(t, wt(7, "gates"), wt(9, "It") + 0.3)) return;
  const k = smooth((t - wt(8) + 0.3) / (wt(8, "grabbed") - wt(8) + 0.2)), grab = after(t, 8, "grabbed");
  const p = W(4.5, 0, -3, WELL_OUT).lerp(W(-1.0, 0, 0.6, WELL_OUT), k);
  s.places.push(P("knight", KNIGHT, { mode: k > 0 && k < 1 ? "stroll" : "stand", phase: q((t * 1.4) % 1, 12), expr: grab ? "laugh" : "grin", gest: grab ? "lift" : "hang", k: q((t * 2) % 1, 8), blink: blinkAt(t, 90) }, { bucket: grab, sword: !grab }, p, { turn: -0.25 }));
  for (let i = 0; i < 2; i++) s.places.push(P(`bgMarch${i}`, MOD_SOLDIER(i + 6), { mode: "stroll", phase: q((t * 1.4 + i * 0.5) % 1, 12), expr: "laugh", gest: "cheer", k: q((t * 2 + i * 0.4) % 1, 8), blink: blinkAt(t, 95 + i) }, { spear: true },
    W(-6 - i * 1.6 - 1.0 * Math.max(0, t - wt(8)), 0, -2.4 - i * 0.8, WELL_OUT), { size: LO, yaw: -Math.PI / 2 + 0.4 }));
};
// line 10: the bucket carried into Modena's piazza, the crowd cheering; on "Modena" the lord takes it and hugs it
const piazza = (t: number, s: Stage) => {
  if (!between(t, wt(9, "castle") + 0.2, wt(11) + 0.3)) return;
  const kept = after(t, 10, "Modena");
  s.places.push(P("carrier", KNIGHT, { mode: kept ? "stand" : "stroll", phase: q((t * 1.3) % 1, 12), expr: "laugh", gest: kept ? "cheer" : "lift", k: q((t * 2) % 1, 8), blink: blinkAt(t, 90) }, { bucket: !kept }, W(kept ? 1.0 : 1.6 - 0.25 * (t - wt(10)), 0, 0.2, PIAZZA_M), { turn: -0.3 }));
  s.places.push(P("lordK", LORD_M, { expr: kept ? "smug" : "laugh", gest: kept ? "hug" : "cheer", k: q((t * 2) % 1, 8), blink: blinkAt(t, 3) }, { bucket: kept }, W(-0.6, 0, -0.4, PIAZZA_M), { turn: 0.25 }));
  for (let i = 0; i < 7; i++) {
    const a = -1.0 + i * 0.33, r = 5.6 + (i % 2) * 0.9;
    s.places.push(P(`cheer${i}`, CITIZEN(i), { expr: i % 2 ? "laugh" : "grin", gest: i % 3 === 2 ? "wave" : "cheer", k: q((t * 2.2 + i * 0.3) % 1, 8), blink: blinkAt(t, 100 + i) }, { banner: i === 3 ? MOD_FLAG : undefined },
      W(Math.sin(a) * r * 0.8, 0, -Math.cos(a) * r * 0.8 - 0.6, PIAZZA_M), { size: LO }));
  }
};
// line 11: the tower room, today: a tourist with a phone looking at the bucket on its plinth; it glints
const room = (t: number, s: Stage) => {
  if (t < wt(10, "kept")) return;
  s.places.push(P("tourist", TOURIST, { expr: after(t, 11, "still") ? "laugh" : "grin", gest: after(t, 11, "still") ? "tip" : "hang", k: 1, blink: blinkAt(t, 110), look: -1 }, { phone: true }, [TOWER.x + 1.1, ROOM_Y, TOWER.z + 0.9], { turn: -0.5 }));
  const u = q((Math.sin(t * 2.4) + 1) / 2, 6);
  if (after(t, 11, "still")) s.fx.push(card(`glint${u}`, 300, 300, glint(u), [TOWER.x + 0.12, ROOM_Y + 1.32, TOWER.z + 0.15], 0.3, 0.3));
  s.lights.push(warm(V(TOWER.x + 0.6, ROOM_Y + 2.4, TOWER.z + 1.2), 1.0));
};

/** everything on stage at time t */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  CAM = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  const s: Stage = { places: [], fx: [], lights: [] };
  lords(t, s); night(t, s); gate(t, s); ridge(t, s); clash(t, s); chase(t, s); souvenir(t, s); piazza(t, s); room(t, s);
  void c; void WELL_MID; void lineEnd;
  return s;
};
