// Camera of "This Chicken Lived 18 Months Without a Head", timed to scripts/chicken/words.json (voice.wav is final, never retimed).
// SHOTS is the hand shot list: one entry per beat with its own light, giving the auto-framer its direction prior and
// the look of each beat. The real camera is the solved track (camtrack.json); changes of place cut on the beat.
import * as THREE from "three";
import WORDS from "./words.json";
import TRACK0 from "./camtrack.json";
import { trackCam, Track } from "../../guard/track";
import { LookName } from "./looks";
import { insideRoom, CHOP, GRAIN, KITCHEN, TABLE, EASEL, BOOTH, TRUCK, RING, PORCH } from "./layout";

export const FPS = 30;
type Word = { i: number; w: string; s: number; e: number; line: number };
export const WORDLIST = WORDS as Word[];
export const VOICE_LEN = 46.19;   // scripts/chicken/voice.wav (AI Studio, final)
/** the last frame holds Mike on his pedestal >= 1.4 s after the last word */
export const TOTAL = Math.ceil(Math.max(VOICE_LEN + 0.6, (WORDS as Word[])[(WORDS as Word[]).length - 1].e + 1.4) * FPS);
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
/** start time of word `w` (first match, or the n-th word if a number) in narration line `ln` */
export const wt = (ln: number, w: string | number = 0) => {
  const ws = WORDLIST.filter((x) => x.line === ln);
  if (typeof w === "number") return ws[w].s;
  const hit = ws.find((x) => norm(x.w) === norm(w));
  if (!hit) throw new Error(`word ${w} not in line ${ln}`);
  return hit.s;
};
/** same, but the n-th occurrence (0-based) */
export const wtn = (ln: number, w: string, n: number) => WORDLIST.filter((x) => x.line === ln && norm(x.w) === norm(w))[n].s;
export const lineEnd = (ln: number) => { const ws = WORDLIST.filter((x) => x.line === ln); return ws[ws.length - 1].e; };
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
export const smoother = (x: number) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10); };
const LAND = 2 / FPS;
/** land 2 frames before word w of line ln */
export const land = (ln: number, w: string | number = 0) => wt(ln, w) - LAND;

export type V3 = [number, number, number];
const V = (a: V3 | THREE.Vector3) => (a instanceof THREE.Vector3 ? a.clone() : new THREE.Vector3(...a));
const at = (c: THREE.Vector3, dx: number, dy: number, dz: number): V3 => [c.x + dx, c.y + dy, c.z + dz];

// ---------------- moving subjects ----------------
const V3v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const LD = 2 / FPS;
/** Mike's pose at time t: where he is, whether he has his head, walking / pecking. The hook is the future (headless). */
export type MikePose = { p: THREE.Vector3; yaw: number; phase: number; walk: number; peck: number; headless: boolean; flap: number };
export const T_CHOP = () => wt(3, "swing") + 0.3;            // the axe falls off screen; from here on: the stump
export const truckX = (t: number) => TRUCK.x + 2.2 * smooth((t - wtn(7, "A", 1) + 0.1) / 1.6);
export const TABLE_TOP = 0.8;
export const PED_TOP = 1.4;
export const mikeAt = (t: number): MikePose => {
  const peckOf = (s: number) => { const u = (t * 1.3 + s) % 1; return u < 0.25 ? Math.sin((u / 0.25) * Math.PI) : 0; };
  // line 1 (hook): strutting proudly left to right across the yard, chest out
  if (t < wt(2) - LD) { const x = -1.9 + 0.85 * t; return { p: V3v(x, 0, 1.0), yaw: Math.PI / 2 - 0.75, phase: t * 1.9, walk: 1, peck: -0.25, headless: true, flap: 0 }; }
  // line 2: with his head, pecking about the yard near the chopping block at golden hour
  if (t < wt(3) - LD) return { p: V3v(CHOP.x - 1.4, 0, CHOP.z + 0.6), yaw: -0.4 + 0.3 * Math.sin(t * 0.7), phase: 0, walk: 0, peck: peckOf(0), headless: false, flap: 0 };
  // line 3: by the block; after the (unseen) chop he walks off toward the camera-left, wings out
  if (t < wt(4) - LD) {
    if (t < T_CHOP()) return { p: V3v(CHOP.x - 0.6, 0, CHOP.z + 0.5), yaw: 0.2, phase: 0, walk: 0, peck: 0, headless: false, flap: 0 };
    const u = clamp01((t - wt(3, "and") + 0.2) / 3.0), p = V3v(CHOP.x - 0.6 - 0.75 * u, 0, CHOP.z + 0.5 + 0.6 * u);
    return { p, yaw: -Math.PI / 2 + 0.7, phase: t * 1.7, walk: u > 0 && u < 1 ? 1 : 0.4, peck: -0.15, headless: true, flap: 0.25 + 0.15 * Math.sin(t * 6) };
  }
  // line 4: the next morning, pecking at the grain in front of the porch
  if (t < wt(5) - LD) { const still = t > wt(4, "Still") - LD; return { p: V3v(GRAIN.x, 0, GRAIN.z), yaw: 0.35, phase: t * 1.5, walk: 0, peck: still ? peckOf(0.3) : 0, headless: true, flap: 0 }; }
  // lines 5-6: on the kitchen table (the eyedropper)
  if (t < wt(7) - LD) return { p: V3v(TABLE.x + 0.15, TABLE_TOP, TABLE.z + 0.05), yaw: -0.2, phase: 0, walk: 0, peck: 0, headless: true, flap: t > wt(6, "neck") ? 0.4 * Math.abs(Math.sin(t * 5)) : 0 };
  // line 7: the star, riding on the truck's cab roof
  if (t < wt(8) - LD) return { p: V3v(truckX(t) - 0.8, 1.96, TRUCK.z + 0.5), yaw: 0.25, phase: 0, walk: 0, peck: -0.2, headless: true, flap: t > wt(7, "star") - LD ? 0.5 + 0.4 * Math.sin(t * 7) : 0 };
  // line 8: on his crate by the ticket booth
  if (t < wt(9) - LD) return { p: V3v(BOOTH.x + 1.9, 0.7, BOOTH.z), yaw: -0.25, phase: t * 1.4, walk: 0, peck: peckOf(0.6) * 0.5, headless: true, flap: 0 };
  // line 9: strutting on the porch beside Lloyd's money
  if (t < wt(10) - LD) { const x = 4.9 + 0.3 * Math.sin(t * 1.3); return { p: V3v(x, PORCH.h, -6.3), yaw: -0.4, phase: t * 1.6, walk: 0.6, peck: -0.25, headless: true, flap: 0 }; }
  // line 10: on the pedestal under the spotlight, chest out, wings flapping on the cheer
  const cheer = t > wt(10, "and") - LD;
  return { p: V3v(RING.x, PED_TOP, RING.z), yaw: 0, phase: 0, walk: 0, peck: -0.3, headless: true, flap: cheer ? 0.55 + 0.4 * Math.sin(t * 8) : 0.1 };
};
/** the three hens (with heads) about the yard, lines 1-4 */
export const henAt = (i: number, t: number) => {
  const base = [V3v(-3.2, 0, -0.8), V3v(2.6, 0, -1.4), V3v(-1.0, 0, -3.4)][i], u = (t * (1.1 + i * 0.2) + i * 0.37) % 1;
  return { p: base.clone().add(V3v(0.4 * Math.sin(t * 0.3 + i), 0, 0.3 * Math.cos(t * 0.25 + i * 2))), yaw: 0.6 * Math.sin(t * 0.4 + i * 1.7) + (i - 1) * 0.5, phase: t * 1.2, walk: 0, peck: u < 0.3 ? Math.sin((u / 0.3) * Math.PI) : 0, headless: false, flap: 0 };
};

export type Key = { at?: number; pos: V3; look: V3; fov?: number; roll?: number; dof?: number; track?: (t: number) => THREE.Vector3 };
export type Shot = { name: string; at: number; look: LookName; keys: Key[]; via?: V3[]; lk?: [number, number] | "ahead"; carry?: "paper" | "letter" | "bird" };
const K = (pos: V3, look: V3, fov = 46): Key[] => [{ pos, look, fov }];
void KITCHEN;

export const SHOTS: Shot[] = [
  // 1 (hook) headless Mike struts across the yard
  { name: "hook", at: 0, look: "afternoon", keys: K([0.6, 1.0, 5.4], [0, 0.55, 1.0]) },
  // 2 Colorado, 1945: the farm at golden hour; Farmer Lloyd eyes the chickens
  { name: "farm", at: land(2), look: "golden", keys: K([2.5, 2.0, 8.5], [1.5, 1.3, -1.5]) },
  // 3 one swing of the axe (cut on the swing) ... and the chicken just kept walking
  { name: "chop", at: land(3), look: "golden", keys: K(at(CHOP, 0.6, 1.5, 4.5), at(CHOP, -0.6, 1.1, 0)) },
  // 4 the next morning: Lloyd on the porch, Mike pecking
  { name: "porch", at: land(4), look: "morning", keys: K([1.6, 1.6, 2.6], [0, 1.0, -4.5]) },
  // 5 the neck diagram, Clara pointing
  { name: "diagram", at: land(5), look: "morning", keys: K(at(EASEL, -0.5, 1.6, 4.2), at(EASEL, -0.3, 1.35, 0)) },
  // 6 the kitchen table: the eyedropper
  { name: "kitchen", at: land(6), look: "morning", keys: K(at(TABLE, 0.2, 1.7, 4.0), at(TABLE, 0, 1.1, -0.6)) },
  // 7 a star: the truck with the banner, magazines
  { name: "truck", at: land(7), look: "afternoon", keys: K(at(TRUCK, 2.5, 2.0, 8.5), at(TRUCK, 0.6, 1.6, 0)) },
  // 8 the sideshow: the queue paying, Hope with the contract
  { name: "booth", at: land(8), look: "afternoon", keys: K(at(BOOTH, 0.4, 1.7, 5.2), at(BOOTH, -0.4, 1.3, 0)) },
  // 9 worth more than the farm: Lloyd counting money on the porch
  { name: "money", at: land(9), look: "golden", keys: K([4.4, 2.0, -1.4], [3.5, 1.5, -7]) },
  // 10 the spotlight pedestal
  { name: "ring", at: land(10), look: "golden", keys: K(at(RING, 0, 2.2, 7.5), at(RING, 0, 1.6, 0)) },
];

// ---------------- camera evaluation ----------------
export type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number; dof: number; shot: number; mix: number; next: number; interior: boolean; blur?: number; blurDir?: number };
type Pose = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number; dof: number };
const AVG = 6 / 1.875;                 // m/frame average for a 6 m/frame peak under smootherstep
const MOVEF = (d: number) => Math.max(18, Math.min(30, Math.ceil(d / AVG) + 12)); // in-shot move length (frames)
const PUSH = 0.0025;                   // hold creep per frame (fraction of the camera-subject distance)

const keyPose = (k: Key, t: number): Pose => {
  const pos = V(k.pos), look = V(k.look);
  if (k.track) { const d = k.track(t); pos.add(d); look.add(d); }
  return { pos, look, fov: k.fov ?? 45, roll: k.roll ?? 0, dof: k.dof ?? 0 };
};
const lerpPose = (a: Pose, b: Pose, e: number): Pose => ({ pos: a.pos.clone().lerp(b.pos, e), look: a.look.clone().lerp(b.look, e), fov: a.fov + (b.fov - a.fov) * e, roll: a.roll + (b.roll - a.roll) * e, dof: a.dof + (b.dof - a.dof) * e });
const pushed = (p: Pose, frames: number): Pose => { const f = Math.min(0.12, Math.max(0, frames) * PUSH); return { ...p, pos: p.pos.clone().lerp(p.look, f) }; };

/** key timeline of a shot: start / arrival of every key */
const timelines = new Map<number, { s: number; a: number }[]>();
const timeline = (si: number) => {
  let tl = timelines.get(si);
  if (!tl) {
    const sh = SHOTS[si]; tl = [{ s: sh.at, a: sh.at }];
    for (let k = 1; k < sh.keys.length; k++) {
      const d = V(sh.keys[k - 1].pos).distanceTo(V(sh.keys[k].pos)), D = MOVEF(d) / FPS, T = (sh.keys[k].at ?? sh.at) - LAND;
      const s = Math.max(tl[k - 1].a + 0.2, T - D); tl.push({ s, a: s + D });
    }
    timelines.set(si, tl);
  }
  return tl;
};
/** the shot's own framing at time t (t >= its landing) */
const frame = (si: number, t: number): Pose => {
  const sh = SHOTS[si], tl = timeline(si);
  let k = 0; while (k + 1 < tl.length && tl[k + 1].s <= t) k++;
  const hold = (j: number, tt: number) => pushed(keyPose(sh.keys[j], tt), (tt - tl[j].a) * FPS);
  if (k > 0 && t < tl[k].a) return lerpPose(hold(k - 1, tl[k].s), keyPose(sh.keys[k], t), smoother((t - tl[k].s) / (tl[k].a - tl[k].s)));
  return hold(k, t);
};

// ---------------- glides between shots ----------------
type Glide = { a: number; b: number; t0: number; t1: number; pts: THREE.Vector3[]; len: number[]; total: number };
const glides = new Map<number, Glide>();
/** centripetal Catmull-Rom (alpha 0.5, Barry-Goldman): never overshoots where a short segment meets a long one */
const cr = (p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, u: number) => {
  const k = (a: THREE.Vector3, b: THREE.Vector3) => Math.max(1e-4, Math.sqrt(a.distanceTo(b)));
  const t0 = 0, t1 = t0 + k(p0, p1), t2 = t1 + k(p1, p2), t3 = t2 + k(p2, p3), t = t1 + (t2 - t1) * u;
  const L = (a: THREE.Vector3, b: THREE.Vector3, ta: number, tb: number) => a.clone().multiplyScalar((tb - t) / (tb - ta)).addScaledVector(b, (t - ta) / (tb - ta));
  const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
  const B1 = A1.clone().multiplyScalar((t2 - t) / (t2 - t0)).addScaledVector(A2, (t - t0) / (t2 - t0));
  const B2 = A2.clone().multiplyScalar((t3 - t) / (t3 - t1)).addScaledVector(A3, (t - t1) / (t3 - t1));
  return B1.multiplyScalar((t2 - t) / (t2 - t1)).addScaledVector(B2, (t - t1) / (t2 - t1));
};
const SAMPLES = 24;
const plan = (A: THREE.Vector3, via: V3[], B: THREE.Vector3) => {
  const P = [A, ...via.map((q) => V(q)), B], pts: THREE.Vector3[] = [];
  const ext = (a: THREE.Vector3, b: THREE.Vector3) => a.clone().multiplyScalar(2).sub(b); // phantom end points
  const Q = (i: number) => (i < 0 ? ext(P[0], P[1]) : i >= P.length ? ext(P[P.length - 1], P[P.length - 2]) : P[i]);
  for (let i = 0; i + 1 < P.length; i++) for (let s = 0; s < SAMPLES; s++) pts.push(cr(Q(i - 1), P[i], P[i + 1], Q(i + 2), s / SAMPLES));
  pts.push(B.clone());
  const len = [0]; for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + pts[k].distanceTo(pts[k - 1]));
  return { pts, len, total: len[len.length - 1] };
};
export const glideTo = (b: number): Glide | null => {
  if (b <= 0) return null;
  let g = glides.get(b);
  if (!g) {
    const sh = SHOTS[b], prev = b > 1 ? glideTo(b - 1) : null, t1 = sh.at;
    const B = keyPose(sh.keys[0], t1).pos;
    let F = 27, t0 = t1 - F / FPS, p = plan(frame(b - 1, t0).pos, sh.via ?? [], B);
    for (let it = 0; it < 3; it++) {
      F = Math.max(25, Math.min(45, Math.ceil(p.total / AVG)));            // 25-30 normally; longer only to respect 6 m/f
      t0 = Math.max(t1 - F / FPS, (prev ? prev.t1 : 0) + 0.1, SHOTS[b - 1].at + 0.1);
      p = plan(frame(b - 1, t0).pos, sh.via ?? [], B);
    }
    g = { a: b - 1, b, t0, t1, ...p };
    glides.set(b, g);
  }
  return g;
};
const along = (g: Glide, e: number) => {
  const d = e * g.total; let k = 1; while (k < g.len.length - 1 && g.len[k] < d) k++;
  const f = (d - g.len[k - 1]) / Math.max(1e-6, g.len[k] - g.len[k - 1]);
  return g.pts[k - 1].clone().lerp(g.pts[k], clamp01(f));
};
/** rotate unit direction a toward b by fraction k (great circle) */
const slerpDir = (a: THREE.Vector3, b: THREE.Vector3, k: number) => {
  const d = THREE.MathUtils.clamp(a.dot(b), -1, 1), w = Math.acos(d);
  if (w < 1e-4) return a.clone();
  if (Math.PI - w < 1e-3) { const ax = new THREE.Vector3(0, 1, 0); return a.clone().applyAxisAngle(ax, Math.PI * k); }
  return a.clone().multiplyScalar(Math.sin((1 - k) * w) / Math.sin(w)).addScaledVector(b, Math.sin(k * w) / Math.sin(w)).normalize();
};
const glide = (g: Glide, t: number): Cam => {
  const u = clamp01((t - g.t0) / (g.t1 - g.t0)), e = smoother(u);
  const A = frame(g.a, g.t0), B = keyPose(SHOTS[g.b].keys[0], g.t1);
  const pos = along(g, e), lk = SHOTS[g.b].lk ?? [0.1, 0.9];
  // blend VIEW DIRECTIONS (never look-at points: a target passing the lens flips the view)
  const dA = A.look.clone().sub(A.pos).normalize(), dB = B.look.clone().sub(B.pos).normalize();
  const dist = A.look.distanceTo(A.pos) + (B.look.distanceTo(B.pos) - A.look.distanceTo(A.pos)) * e;
  let dir: THREE.Vector3;
  if (lk === "ahead") { // look down the path, then settle on the subject over the last 30 %
    const ah = along(g, Math.min(1, e + 0.06)).sub(along(g, Math.max(0, e - 0.02)));
    const dT = ah.lengthSq() > 1e-8 ? ah.normalize() : dB;
    dir = u < 0.7 ? slerpDir(dA, dT, smoother(u / 0.2)) : slerpDir(dT, dB, smoother((u - 0.7) / 0.3));
  } else dir = slerpDir(dA, dB, smoother((u - lk[0]) / (lk[1] - lk[0])));
  const look = pos.clone().addScaledVector(dir, dist);
  return { pos, look, fov: A.fov + (B.fov - A.fov) * e, roll: A.roll + (B.roll - A.roll) * e, dof: Math.min(A.dof, B.dof) * Math.abs(1 - 2 * e) ** 2,
    shot: g.a, mix: u, next: g.b, interior: !!insideRoom(pos) };
};
/** the carried prop of the glide in progress (null when none): starts at the previous subject, rides ~4 m ahead of
 *  the camera, lands on the new subject, then shrinks away */
export const carryAtHand = (t: number, c: Cam) => {
  const sb = SHOTS[c.mix > 0 ? c.next : c.shot]; if (!sb?.carry) return null;
  const b = SHOTS.indexOf(sb), g = glideTo(b); if (!g || t < g.t0 || t > g.t1 + 0.3) return null;
  const B = keyPose(sb.keys[0], g.t1).look;
  if (t >= g.t1) return { kind: sb.carry, p: B, k: 1 - (t - g.t1) / 0.3, spin: 0 };
  const u = (t - g.t0) / (g.t1 - g.t0), A = frame(g.a, g.t0).look;
  const fwd = c.look.clone().sub(c.pos).normalize(), ahead = c.pos.clone().addScaledVector(fwd, 4).add(new THREE.Vector3(0, -0.3, 0));
  const p = A.lerp(ahead, smoother(u / 0.25)).lerp(B, smoother((u - 0.75) / 0.25));
  return { kind: sb.carry, p, k: 1, spin: Math.sin(u * Math.PI * 3) * 0.5 };
};
export const shotAt = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && (glideTo(i + 1)!.t0 <= t)) i++; return i; };
/** the hand-placed camera at time t (the auto-framer's direction prior and flight routes) */
export const camAtHand = (t: number): Cam => {
  const i = shotAt(t), g = i > 0 ? glideTo(i) : null;
  if (g && t < g.t1) return glide(g, t);
  const f = frame(i, t);
  return { ...f, shot: i, mix: 0, next: i, interior: !!insideRoom(f.pos) };
};

/** caption word on screen at time t (one word at a time) */
export const captionAt = (t: number) => {
  const lead = 0.05;
  let k = -1;
  for (let i = 0; i < WORDLIST.length; i++) if (WORDLIST[i].s - lead <= t) k = i; else break;
  if (k < 0) return null;
  const w = WORDLIST[k], next = WORDLIST[k + 1];
  if (t > w.e + 0.35 && (!next || t < next.s - lead)) return null;
  return w;
};


// ---------------- auto-framed camera (CLAUDE.md rule 13: shots.ts -> guard/solve.ts -> camtrack.json) ----------------
let TRACK: Track | null = (TRACK0 as unknown as Track).shots?.length ? (TRACK0 as unknown as Track) : null;
/** the auto-framer swaps in each new solution while it iterates */
export const setTrack = (tr: Track | null) => { TRACK = tr; };
export const getTrack = () => TRACK;
/** camera at time t: the solved track when there is one; lighting / looks still follow SHOTS (the old timeline),
 *  blending into the next SHOTS look over the 0.5 s before its landing */
const lookCache = new WeakMap<object, number[]>();
/** the old SHOTS index whose time span covers most of track shot k (the look / sun of that hold) */
const lookShot = (T: NonNullable<typeof TRACK>, k: number) => {
  let a = lookCache.get(T);
  if (!a) {
    a = T.shots.map((sh) => {
      const cover = SHOTS.map((S, j) => { const s0 = Math.max(S.at, sh.t0), s1 = Math.min(j + 1 < SHOTS.length ? SHOTS[j + 1].at : 1e9, sh.t1); return Math.max(0, s1 - s0); });
      return cover.indexOf(Math.max(...cover));
    });
    lookCache.set(T, a);
  }
  return a[Math.max(0, Math.min(a.length - 1, k))];
};
export const camAt = (t: number): Cam => {
  if (!TRACK) return camAtHand(t);
  const p = trackCam(TRACK, t);
  // the light (look, sun, shadow frame) follows the TRACK's own shots: every held shot keeps the look of the old SHOTS
  // entry that covers most of it, and changes only across a transition (run 35, 1309-1318: the look switched on the old
  // timeline in the middle of a hold -> a light pop on screen)
  const b = lookShot(TRACK, p.shot), nb = p.flying >= 0 ? lookShot(TRACK, p.next) : b, mix = nb !== b ? Math.max(0, Math.min(1, p.flying)) : 0;
  return { pos: p.pos, look: p.look, fov: p.fov, roll: 0, dof: p.dof, shot: b, mix, next: nb, interior: !!insideRoom(p.pos), blur: p.blur, blurDir: p.blurDir };
};
/** carried props are gone (the review of Rats run 24): a flight only exists if a real subject stays in view, otherwise
 *  the auto-framer uses a whip or a cut. Kept as a function so stage.ts needs no change. */
export const carryAt = (t: number, c: Cam): { kind: NonNullable<Shot["carry"]>; p: THREE.Vector3; k: number; spin: number } | null => { void t; void c; return null; };
