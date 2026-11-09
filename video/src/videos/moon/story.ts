// Camera of the Moon Hoax short, timed to scripts/moon/words.json (voice.wav is final, never retimed).
// Same engine as the Rat Bounty short, with CLAUDE.md "Lessons learned" built in: no cuts; every change of place is a
// 25-30 frame eased glide through real openings (peak <= ~6 m/frame) landing 2 frames before the subject's word;
// in-shot moves are eased and land on their words; holds creep in; key props ride through the glides.
import * as THREE from "three";
import WORDS from "./words.json";
import TRACK0 from "./camtrack.json";
import { trackCam, holdPose, Track } from "../../guard/track";
import { LookName } from "./looks";
import { insideRoom, EYEPIECE, TUBE_DIR, TUBE_END, MOON, MOON_TOP, EUROPE, SHIP_LINE } from "./layout";

export const FPS = 30;
type Word = { i: number; w: string; s: number; e: number; line: number };
export const WORDLIST = WORDS as Word[];
export const VOICE_LEN = 64.84;   // scripts/moon/voice.wav (CapCut Goofball, final)
/** the last frame holds the signed page >= 1.2 s after the writing finishes (line 18) */
export const TOTAL = Math.ceil(Math.max(VOICE_LEN + 0.5, (WORDS as Word[])[(WORDS as Word[]).length - 1].e + 1.5) * FPS);
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
const A3 = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
const E = (dx: number, dy: number, dz: number): V3 => [EYEPIECE.x + dx, EYEPIECE.y + dy, EYEPIECE.z + dz];
const M = (dx: number, dy: number, dz: number): V3 => [MOON.c.x + dx, MOON_TOP + dy, MOON.c.z + dz];

// ---------------- moving subjects ----------------
/** the slow letter ship (line 13) crawling across the strait */
export const shipX = (t: number) => SHIP_LINE.x0 + 6 + 1.0 * Math.max(0, t - wt(13) + 1.5);
const shipTrack = (t: number) => new THREE.Vector3(shipX(t) - shipX(wt(13)), 0, 0);

export type Key = { at?: number; pos: V3; look: V3; fov?: number; roll?: number; dof?: number; track?: (t: number) => THREE.Vector3 };
export type Shot = { name: string; at: number; look: LookName; keys: Key[]; via?: V3[]; lk?: [number, number] | "ahead"; carry?: "paper" | "letter" | "bird" };
const HERSCHEL_AT: V3 = [EYEPIECE.x + 1.2, 7.75, EYEPIECE.z + 0.9];
const SHIP0 = () => shipX(wt(13));

export const SHOTS: Shot[] = [
  // 1 "In 1835, a newspaper told New York that bat-people were living on the Moon... and New York believed it."
  //   the newsboy shouting with the paper held high (a winged figure on it), then the street; the crowd grabs papers
  { name: "open", at: 0, look: "moonlit", keys: [
    // frame 0: medium shot of the newsboy waving The Sun over his head and shouting; the camera is already moving
    { pos: [25.0, 1.8, 4.7], look: [22.0, 1.1, 1.2], fov: 46, dof: 3 },
    { at: wt(1, "1835"), pos: [24.4, 1.75, 4.4], look: [22.0, 1.15, 1.2], fov: 46, dof: 3 },
    // ...then back and up: the moonlit street, the crowd coming, papers fluttering down
    { at: wt(1, "told"), pos: [29.0, 3.6, 9.4], look: [21.0, 1.6, -1.0], fov: 50, dof: 1 },
    { at: wt(1, "bat-people"), pos: [25.8, 1.9, 6.6], look: [22.1, 1.45, 1.2], fov: 46, dof: 4 },
    { at: wt(1, "believed"), pos: [27.2, 2.2, 8.0], look: [22.2, 1.3, 1.0], fov: 50, dof: 3 },
  ] },
  // 2 "The paper is called The Sun. It's two years old, it costs one penny, and it needs readers."
  //   the shop front with its sign "THE SUN 1c", then in through the window: the editor stares at the empty sales chart
  { name: "shop", at: land(2, "called"), look: "lamp", lk: [0.5, 0.95], via: [[23.3, 2.2, -4.2], [23.2, 1.9, -6.8], [23.2, 1.8, -8.9]], keys: [
    { pos: [24.0, 1.55, -10.0], look: [25.8, 1.42, -14.3], fov: 50, dof: 3 },
    { at: wt(2, "readers"), pos: [24.3, 1.55, -10.6], look: [25.8, 1.45, -14.3], fov: 48, dof: 4 },
  ] },
  // 3 "So a reporter named Richard Locke writes a story." Locke cracks his knuckles at his desk by the window
  { name: "locke", at: land(3, "reporter"), look: "lamp", keys: [
    { pos: [21.0, 1.55, -13.4], look: [23.6, 1.25, -10.4], fov: 50, dof: 4 },
    { at: wt(3, "writes"), pos: [21.3, 1.5, -13.0], look: [23.6, 1.25, -10.4], fov: 48, roll: 0.04, dof: 5 },
  ] },
  // 4 "The famous astronomer Sir John Herschel, he writes, has built a giant telescope in South Africa,"
  //   out of the window, across the strait to the Cape: Herschel at the eyepiece; then down the length of the tube
  { name: "scope", at: land(4, "Herschel"), look: "starry", via: [[23.2, 1.9, -8.9], [23.2, 2.3, -6.4], [96, 13, -6]], carry: "paper", keys: [
    { pos: E(-2.4, 0.3, 5.6), look: E(1.0, -0.5, 0.8), fov: 46, dof: 3 },
    { at: wt(4, "built"), pos: A3(TUBE_END.clone().add(new THREE.Vector3(4, -9, 12))), look: A3(EYEPIECE.clone().add(new THREE.Vector3(0, 1, 0))), fov: 54 },
    { at: wt(4, "Africa"), pos: E(-2.6, 1.6, 7.6), look: E(0.9, 0.5, 0.8), fov: 52, dof: 2 },
  ] },
  // 5 "and through it, he can see the Moon up close." in through the eyepiece, up the tube, out onto the Moon
  { name: "moon", at: land(5, "Moon"), look: "silvery", lk: [0.15, 0.55], via: [A3(EYEPIECE.clone().addScaledVector(TUBE_DIR, -1.6)), A3(EYEPIECE.clone().addScaledVector(TUBE_DIR, 4)), A3(EYEPIECE.clone().addScaledVector(TUBE_DIR, 24)), A3(TUBE_END.clone().addScaledVector(TUBE_DIR, 2)), M(7, 3, 7)], keys: [
    { pos: M(7.5, 3.2, 8.5), look: M(0, 1.0, 0), fov: 50 },
    // 6 "Day one: forests and oceans."
    { at: wt(6, "Day"), pos: M(-4.4, 1.9, 6.6), look: M(-1.8, 1.4, 2.4), fov: 48, dof: 3 },
    { at: wt(6, "oceans"), pos: M(2.6, 1.8, 7.4), look: M(6.2, 0.4, 2.0), fov: 50, dof: 2 },
    // 7 "Day two: blue goats with a single horn."
    { at: wt(7, "blue"), pos: M(2.6, 1.3, 7.8), look: M(3.0, 0.8, 4.4), fov: 46, dof: 5 },
    // 8 "Day four: winged people. Like humans with bat wings, flying around... and chatting."
    { at: wt(8, "winged"), pos: M(-0.2, 1.6, 7.4), look: M(-0.4, 2.7, 2.6), fov: 50, dof: 3 },
    { at: wt(8, "chatting"), pos: M(0.0, 2.1, 6.8), look: M(-0.2, 2.8, 2.6), fov: 48, dof: 4 },
  ] },
  // 9 "The whole city is talking about it." back down to New York in the morning: everyone reading, a man faints,
  //   kids flap their arms like bat wings
  { name: "crowd", at: land(9, "city"), look: "morning", carry: "paper", via: [[34, 18, 8]], keys: [
    { pos: [16.4, 2.0, 6.4], look: [21.4, 1.3, 1.0], fov: 52, dof: 3 },
    { at: wt(9, "talking"), pos: [17.2, 1.9, 5.8], look: [21.2, 1.2, 1.0], fov: 50 },
  ] },
  // 10 "Other papers copy the story, and soon it's spreading across Europe." the pier: newsboys toss papers that fly
  //    off like birds across the ocean to Europe's coast
  { name: "pier", at: land(10, "copy"), look: "morning", keys: [
    { pos: [44.4, 1.5, 5.0], look: [51.6, 1.7, -1.4], fov: 52 },
    { at: wt(10, "Europe"), pos: [47.6, 4.4, 3.0], look: [EUROPE.x - 20, 11, EUROPE.z + 20], fov: 46 },
  ] },
  // 11 "But wait... didn't anyone just ask Herschel?" back in The Sun, dim: slow push on Herschel's portrait; one eyebrow up
  { name: "portrait", at: land(11, "anyone"), look: "dim", via: [[32, 2.6, 2], [23.2, 1.95, -6.6], [23.2, 1.95, -8.9]], carry: "bird", keys: [
    { pos: [22.9, 2.0, -11.0], look: [20.03, 2.1, -11.9], fov: 46, dof: 4 },
    { at: wt(11, "Herschel"), pos: [22.4, 2.05, -11.6], look: [20.03, 2.1, -11.9], fov: 44, dof: 6 },
  ] },
  // 12 "You see, Herschel really is in South Africa, really studying the sky." the real Herschel: a normal telescope,
  //    a cup of tea, no idea
  { name: "garden", at: land(12, "Herschel"), look: "starry", carry: "bird", via: [[23.2, 1.95, -8.9], [23.2, 2.3, -6.4], [91, 8, 2]], keys: [
    { pos: [95.0, 1.7, 1.6], look: [98.6, 1.45, 6.4], fov: 48, dof: 3 },
    { at: wt(12, "studying"), pos: [95.6, 1.75, 2.2], look: [99.0, 1.5, 5.8], fov: 46, dof: 3 },
  ] },
  // 13 "But in 1835, a letter to South Africa takes months." the letter on a slow sailing ship; calendar pages fly off
  { name: "ship", at: land(13, "1835"), look: "seaday", carry: "letter", keys: [
    { pos: [62.6, 2.6, 19.8], look: [67.0, 1.0, 8.2], fov: 48, dof: 2, track: shipTrack },
    { at: wt(13, "months"), pos: [62.4, 3.0, 20.4], look: [66.6, 1.8, 8.2], fov: 50, track: shipTrack },
  ] },
  // 14 "Nobody can check. It's like a rumor about a friend who's on vacation with no phone." Herschel on the beach, no
  //    signal, while a rumour cloud of gossip from back home grows over his head
  { name: "beach", at: land(14, "Nobody"), look: "seaday", carry: "letter", keys: [
    { pos: [93.8, 1.6, 22.4], look: [89.6, 1.3, 24.5], fov: 46, dof: 3 },
    { at: wt(14, "rumor"), pos: [94.2, 1.75, 22.1], look: [89.8, 1.4, 24.6], fov: 52, dof: 2 },
  ] },
  // 15 "Weeks later, a rival paper exposes the whole thing." in through The Herald's window: HOAX! slapped on the counter
  { name: "herald", at: land(15, "rival"), look: "neutral", via: [[46, 8, 9], [7.5, 2.0, 6.4], [7.5, 1.9, 8.9]], carry: "paper", keys: [
    { pos: [8.2, 1.6, 9.6], look: [9.2, 1.3, 12.6], fov: 52, dof: 3 },
    { at: wt(15, "exposes"), pos: [8.5, 1.55, 10.1], look: [9.1, 1.25, 12.4], fov: 50, dof: 4 },
  ] },
  // 16 "And The Sun? It's now the paper everyone has heard of." out again: The Sun's sign lights up, a queue out the door
  { name: "queue", at: land(16, "Sun"), look: "golden", via: [[7.5, 1.9, 8.9], [7.5, 2.0, 6.4]], keys: [
    { pos: [20.6, 1.75, 3.8], look: [25.8, 2.0, -7.6], fov: 54 },
    { at: wt(16, "everyone"), pos: [19.8, 1.75, 4.6], look: [26.0, 1.9, -6.8], fov: 54, dof: 2 },
  ] },
  // 17 "Herschel spends years getting letters about bat-people he never saw, in four languages." buried under letters
  { name: "letters", at: land(17, "Herschel"), look: "afternoon", via: [[88, 8, 2]], carry: "letter", keys: [
    { pos: [95.0, 1.75, 1.6], look: [98.6, 1.4, 6.4], fov: 50, dof: 3 },
    { at: wt(17, "languages"), pos: [95.6, 1.9, 2.2], look: [98.4, 1.4, 6.4], fov: 52 },
  ] },
  // 18 "And Locke? He starts signing his work: "author of the Moon hoax."" Locke at his desk, sunrise through the window
  { name: "sign2", at: land(18, "Locke"), look: "sunrise", carry: "paper", via: [[88, 8, 2], [23.2, 2.3, -6.4], [23.2, 1.95, -8.9]], keys: [
    { pos: [21.0, 1.55, -13.4], look: [23.6, 1.2, -10.4], fov: 50, dof: 4 },
    // close on the page: his pen writes "R. A. Locke, author of the Moon hoax", readable, held >= 1 s at the end
    { at: wt(18, "signing"), pos: [23.335, 1.78, -8.82], look: [23.335, 0.84, -9.6], fov: 48, dof: 6 },
  ] },
];
void SHIP0;

// ---------------- camera evaluation ----------------
export type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number; dof: number; shot: number; mix: number; next: number; interior: boolean };
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
export const camAt = (t: number): Cam => {
  if (!TRACK) return camAtHand(t);
  const p = trackCam(TRACK, t);
  let b = 0; while (b + 1 < SHOTS.length && SHOTS[b + 1].at <= t) b++;
  const nb = b + 1 < SHOTS.length && t > SHOTS[b + 1].at - 0.5 ? b + 1 : b, mix = nb !== b ? (t - (SHOTS[nb].at - 0.5)) / 0.5 : 0;
  return { pos: p.pos, look: p.look, fov: p.fov, roll: 0, dof: p.dof, shot: b, mix, next: nb, interior: !!insideRoom(p.pos) };
};
/** the carried prop (CLAUDE.md 2: no empty flights): with the auto-framed track it rides ahead of the camera through
 *  the flights that would otherwise show no subject (the auto-framer decides), from the outgoing subject to the incoming one (the old shot's prop, else a "paper") */
export const carryAt = (t: number, c: Cam) => {
  if (!TRACK) return carryAtHand(t, c);
  const fl = TRACK.flights.find((g) => g.carry && t >= g.t0 && t <= g.t1 + 0.3); if (!fl) return null;   // only flights that need it
  let b = 0; while (b + 1 < SHOTS.length && SHOTS[b + 1].at <= fl.t1 + 0.05) b++;
  const kind = SHOTS[b].carry ?? "paper";
  const S = TRACK.shots[fl.to - 1], N = TRACK.shots[fl.to], B = new THREE.Vector3(...N.keys[0].look);
  if (t >= fl.t1) return { kind, p: B, k: 1 - (t - fl.t1) / 0.3, spin: 0 };
  const u = (t - fl.t0) / (fl.t1 - fl.t0), A = holdPose(S, fl.t0, fl.t0).look;
  const fwd = c.look.clone().sub(c.pos).normalize(), ahead = c.pos.clone().addScaledVector(fwd, 1.8).add(new THREE.Vector3(0, -0.15, 0));
  const p = A.lerp(ahead, smoother(u / 0.25)).lerp(B, smoother((u - 0.85) / 0.15));
  return { kind, p, k: 1, spin: Math.sin(u * Math.PI * 3) * 0.5 };
};
