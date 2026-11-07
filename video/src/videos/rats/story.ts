// Camera of the Rat Bounty short, timed to words.json (scripts/rats/voice.wav, final, never retimed).
// CLAUDE.md "Lessons learned", built in from the start:
//  - no cuts: every change of place is a GLIDE of 25-30 frames (longer only if the 6 m/frame peak needs it), eased in
//    and out (smootherstep on arc length), through real openings (via waypoints: grates, doors, windows, shafts), and it
//    LANDS 2 frames before the word that names the shot's subject (Shot.at = that word's time - 2 f)
//  - inside a shot, moves to later keys are eased too (18-30 f) and also land 2 f before their word
//  - holds creep in (0.25 %/frame), so nothing freezes
//  - subjects lit + medium-sized at night / underground (stage.ts lights, looks.ts)
import * as THREE from "three";
import WORDS from "./words.json";
import { LookName } from "./looks";
import { insideRoom, OUTFLOW } from "./layout";

export const FPS = 30;
type Word = { i: number; w: string; s: number; e: number; line: number };
export const WORDLIST = WORDS as Word[];
export const VOICE_LEN = 70.29;
export const TOTAL = Math.ceil((VOICE_LEN + 0.5) * FPS);
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

// ---------------- moving subjects the camera tracks ----------------
/** the scurrying tailless rat of lines 12-13 (runs west along the south sidewalk, stops at x 58.5) */
export const RAT_STOP = new THREE.Vector3(58.5, 0.12, 8.0);
export const runRatX = (t: number) => { const t0 = wt(12, "something") - 0.4, t1 = wt(13) - 0.05; const u = clamp01((t - t0) / (t1 - t0)); return 80 - (80 - RAT_STOP.x) * (1 - (1 - u) * (1 - u)); };
/** line 2: the rickshaw (puller + French lady) coming east up the boulevard towards the camera */
export const rickX = (t: number) => 76 - 2.5 * (wt(2, "Indochina") - t);
/** the tram on line 2 (west along the boulevard) */
/** the tram runs up and down the boulevard all film long (x -45..105), heading west past the camera on line 2 */
export const tramX = (t: number) => 30 + 75 * Math.cos(0.13 * (t - wt(2) + 0.6));
/** the rats racing through the tunnel on line 4: a convoy along the north walkway, then up the branch */
export const convoy = (t: number, i: number) => {
  const t0 = wt(4, "rats") - 0.5 + i * 0.09, v = 9.0, d = Math.max(0, (t - t0) * v) - i * 0.6;
  const x0 = -11, xb = 7.5, toBranch = xb - x0;
  if (d < toBranch) return new THREE.Vector3(x0 + d, -6.86, 1.55 + (i % 3) * 0.32);
  const dz = d - toBranch;
  if (dz < 16.3) return new THREE.Vector3(7.1 + (i % 3) * 0.3, -6.86, 1.0 - dz);
  return new THREE.Vector3(7.5, -6.86 + (dz - 16.3), -15.2);
};

// ---------------- shots ----------------
export type Key = { at?: number; pos: V3; look: V3; fov?: number; roll?: number; dof?: number; track?: (t: number) => THREE.Vector3 };
/** at = landing time (subject word - 2 f); keys[0] = the landed framing; via = waypoints of the glide INTO this shot */
export type Shot = { name: string; at: number; look: LookName; keys: Key[]; via?: V3[];
  /** glide look: from the previous subject to this one between u = lk[0] and lk[1] (default 0.1..0.9); "ahead" looks
   *  down the path (following something that travels the same way, e.g. the rat convoy) */
  lk?: [number, number] | "ahead";
  /** a key prop that rides just ahead of the camera through the glide into this shot (CLAUDE.md 2: no empty flights) */
  carry?: "poster" | "coin" | "lantern" | "rat" | "ribbon" };

const ratTrack = (t: number) => new THREE.Vector3(runRatX(t) - RAT_STOP.x, 0, 0);
const MG = 0.6; // manhole radius margin used by the dives

export const SHOTS: Shot[] = [
  // 1 "In 1902, the French paid people in Hanoi to kill rats... so people started farming them."
  //   over the farmhouse roof: the official pays the farmer a cent on "paid", the farmer holds up his rat like a prize hen
  { name: "terrace", at: 0, look: "morning", keys: [
    { pos: [131.4, 7.4, 23.4], look: [127.1, 6.6, 19.0], fov: 46, dof: 3 },
    { at: wt(1, "1902"), pos: [130.7, 7.25, 22.6], look: [127.2, 6.6, 19.0], fov: 46, dof: 4 },
    { at: wt(1, "paid"), pos: [131.6, 7.4, 23.0], look: [126.3, 6.5, 19.1], fov: 48, dof: 3 },
    { at: wt(1, "farming"), pos: [130.0, 7.1, 21.9], look: [127.3, 6.6, 19.0], fov: 46, roll: 0.05, dof: 5 },
  ] },
  // 2 "Hanoi is the shiny new capital of French Indochina," down to street level on the boulevard: a rickshaw with a
//   French lady comes towards us past the tram, flags and people
  { name: "boulevard", at: land(2, "shiny"), look: "morning", via: [[124, 13, 12], [116, 15, 4]], keys: [
    { pos: [80, 2.1, 4.6], look: [60, 0.3, 0.8], fov: 48, dof: 2 },
    { at: wt(2, "Indochina"), pos: [82.5, 2.0, 4.8], look: [58, 0.1, 0.0], fov: 48, roll: -0.03, dof: 3 },
  ] },
  // 3 "and the French just gave it a brand-new sewer system." the official cuts a tricolour ribbon at the open grate
  { name: "grate", at: land(3, "French"), look: "morning", keys: [
    { pos: [-4.4, 2.0, 7.6], look: [-9.6, 1.0, 3.2], fov: 44, dof: 4 },
    { at: wt(3, "gave"), pos: [-5.0, 1.9, 6.8], look: [-9.8, 0.9, 3.0], fov: 42, dof: 6 },
  ] },
  //   ...and dives through the grate into the clean new tunnel: the NEW SEWERS 1902 plaque on "sewer"
  { name: "plaque", at: land(3, "sewer"), look: "sewer", carry: "rat", lk: [0.2, 0.6], via: [[-9.8, 1.6, 3.3], [-10, -1.2, 3.1], [-10, -4.6, 3.1]], keys: [
    { pos: [-10.6, -5.3, 4.3], look: [-6.3, -5.75, 1.1], fov: 54, dof: 4 },
  ] },
  // 4 "The rats love it. It's a highway under every street, straight into the nicest houses."
  //   a convoy of rats races east along the walkway (the camera rides behind them)...
  { name: "convoy", at: land(4, "rats"), look: "sewer", keys: [
    { pos: [-11.6, -6.3, 2.9], look: [-6.5, -6.6, 1.7], fov: 50, dof: 3 },
    { at: wt(4, "highway"), pos: [-5.0, -6.35, 2.6], look: [1.5, -6.65, 1.6], fov: 50, dof: 3 },
    { at: wt(4, "street"), pos: [1.0, -6.4, 2.5], look: [7.2, -6.7, 1.3], fov: 50, dof: 3 },
  ] },
  //   ...follows them into the branch, up the riser, out of the floor drain beside the toilet: a rat pops out, the lady screams
  { name: "bath", at: land(4, "into"), look: "bath", carry: "rat", lk: "ahead", via: [[6.9, -6.2, 2.3], [7.4, -6.1, -2], [7.5, -5.8, -14.4], [7.5, -3, -15.2], [7.5, -0.4, -15.2], [8.2, 1.0, -14.2]], keys: [
    { pos: [9.55, 1.7, -10.7], look: [6.5, 0.95, -14.8], fov: 52, dof: 3 },
    { at: wt(4, "houses"), pos: [9.45, 1.75, -10.9], look: [6.5, 1.05, -14.6], fov: 52, dof: 4 },
  ] },
  // 5 "And with plague spreading, a rat in your kitchen isn't just gross. It's dangerous." through the door into the
  //   kitchen: the plague map, then the rat on the table with a skull-shaped shadow (sickly green)
  { name: "kitchen", at: land(5, "plague"), look: "sickly", carry: "rat", via: [[9.4, 1.7, -12.9], [10.6, 1.7, -12.9]], keys: [
    { pos: [16.4, 1.75, -13.6], look: [19.9, 1.8, -13.9], fov: 46, dof: 4 },
    { at: wt(5, "kitchen"), pos: [14.9, 1.85, -10.9], look: [15.5, 1.1, -14.4], fov: 46, dof: 5 },
    { at: wt(5, "dangerous"), pos: [15.0, 1.7, -11.5], look: [15.5, 1.2, -14.8], fov: 46, roll: 0.05, dof: 6 },
  ] },
  // 6 "So the French send hunters down into the sewers." out of the kitchen window to the manhole: the official points,
  //   hunters with lanterns and nets climb down
  { name: "manhole", at: land(6, "French"), look: "morning", carry: "rat", via: [[16.5, 1.9, -10.7], [16.5, 2.0, -9.0], [25, 3.5, 2]], keys: [
    { pos: [34.6, 1.75, 8.6], look: [40.4, 1.25, 3.8], fov: 48, dof: 3 },
    { at: wt(6, "down"), pos: [35.4, 1.9, 7.8], look: [40.2, 0.9, 3.4], fov: 48, dof: 3 },
  ] },
  //   ...down the manhole after them, landing on the hunters and their tally board (7,985 -> 10,000), rats pouring past
  // 7 "Thousands of rats a day. It's not enough."
  { name: "tally", at: land(7, "Thousands"), look: "lantern", carry: "lantern", lk: [0.25, 0.7], via: [[39.6, 2.0, 2.6], [39.6, -1.0, 2.55], [39.6, -4.4, 2.6], [40.4, -5.4, 2.4]], keys: [
    { pos: [40.6, -5.45, 1.5], look: [43.6, -5.85, 4.6], fov: 50, dof: 3 },
    { at: wt(7, "not"), pos: [38.4, -5.4, 1.7], look: [44.6, -6.1, 3.6], fov: 52, dof: 2 },
  ] },
  // 8 "So they make a new rule: anyone can hunt, and they'll pay one cent per rat." up the manhole to the poster wall:
  //   the official pastes the poster, a crowd gathers
  { name: "poster", at: land(8, "rule"), look: "morning", carry: "coin", lk: [0.3, 0.9], via: [[39.6, -4.4, 2.6], [39.6, -1.0, 2.55], [39.8, 2.2, 2.4], [52, 2.4, -1]], keys: [
    { pos: [60.6, 1.65, -3.8], look: [62.2, 1.62, -9.8], fov: 46, dof: 3 },
    { at: wt(8, "anyone"), pos: [59.0, 1.8, 0.8], look: [62.0, 1.5, -9.0], fov: 48 },
    { at: wt(8, "cent"), pos: [60.9, 1.65, -1.4], look: [62.2, 1.62, -9.9], fov: 44, dof: 4 },
  ] },
  // 9 "But nobody at city hall wants a mountain of dead rats on their desk." across the boulevard, in through the office
  //   window: the official at his desk, a mountain-of-rats shadow looms behind him, he faints on "desk"
  { name: "office", at: land(9, "city"), look: "office", carry: "rat", via: [[66, 2.6, 2], [74.5, 2.2, 8.7], [74.5, 2.1, 10.8]], keys: [
    { pos: [74.7, 1.5, 11.6], look: [76.3, 1.3, 15.6], fov: 50, dof: 3 },
    { at: wt(9, "mountain"), pos: [74.3, 1.45, 11.0], look: [76.3, 1.5, 16.6], fov: 54, dof: 2 },
    { at: wt(9, "desk"), pos: [74.9, 1.45, 11.8], look: [76.3, 1.25, 15.6], fov: 50, roll: 0.05, dof: 4 },
  ] },
  // 10 "So: just bring the tail." the sign behind him flips from WHOLE RATS to TAILS ONLY
  { name: "sign", at: land(10, "just"), look: "office", keys: [
    { pos: [75.4, 1.5, 11.4], look: [76.3, 1.6, 17.6], fov: 52, dof: 3 },
    { at: wt(10, "tail"), pos: [75.6, 1.5, 11.8], look: [76.3, 1.64, 17.6], fov: 50, dof: 4 },
  ] },
  // 11 "Tails pour in. Tens of thousands. The officials are thrilled." baskets of tails on the counter, coins, a happy dance
  { name: "tails", at: land(11, "Tails"), look: "warm", keys: [
    { pos: [76.2, 1.6, 11.4], look: [72.2, 1.25, 14.2], fov: 50, dof: 3 },
    { at: wt(11, "thousands"), pos: [78.6, 1.8, 11.0], look: [73.6, 1.35, 15.0], fov: 54 },
    { at: wt(11, "thrilled"), pos: [78.4, 1.6, 11.2], look: [75.4, 1.45, 15.6], fov: 52, dof: 3 },
  ] },
  // 12 "Then someone notices something strange running down the street." out of the door: the official spots something,
  //   the camera drops to ankle height and races after a scurrying rat
  { name: "notice", at: land(12, "notices"), look: "lateaft", via: [[79.6, 1.7, 11.2], [79.6, 1.6, 9.2]], keys: [
    { pos: [77.4, 1.7, 4.6], look: [79.6, 1.15, 9.2], fov: 46, dof: 3 },
    { at: wt(12, "something"), pos: [RAT_STOP.x + 2.4, 0.42, 6.0], look: [RAT_STOP.x - 0.8, 0.28, 8.0], fov: 50, dof: 5, track: ratTrack },
  ] },
  // 13 "A rat. With no tail." it stops, turns to us, shrugs
  { name: "hero", at: land(13, "rat"), look: "lateaft", keys: [
    { pos: [RAT_STOP.x + 0.15, 0.5, 6.35], look: [RAT_STOP.x, 0.42, 8.0], fov: 46, dof: 7 },
    { at: wt(13, "tail"), pos: [RAT_STOP.x + 0.25, 0.48, 6.55], look: [RAT_STOP.x, 0.42, 8.0], fov: 46, dof: 8 },
  ] },
  // 14 "Then another. And another." up to the shocked official while rows of tailless rats march past (sunset)
  { name: "march", at: land(14, "And"), look: "sunset", keys: [
    { pos: [55.0, 1.45, 3.4], look: [57.6, 0.7, 8.0], fov: 48, dof: 2 },
  ] },
  // 15 "You see, a dead rat pays you once." the bounty table at the city hall door: one tail, one coin
  { name: "table", at: land(15, "dead"), look: "neutral", carry: "coin", via: [[68, 2.6, 3.6]], keys: [
    { pos: [80.4, 1.7, 5.5], look: [82.5, 0.95, 8.6], fov: 46, dof: 4 },
  ] },
  // 16 "But a live rat without a tail keeps having babies, and every baby comes with a brand-new tail." down the drain
  //   into the warm nest: mother rat, more and more babies, their tails glint like coins
  { name: "nest", at: land(16, "live"), look: "nest", carry: "rat", lk: "ahead", via: [[64, 2.4, 5.6], [57, 1.5, 7.6], [57, -2.5, 7.6], [57, -5.7, 7.4], [57, -6.0, 5.0]], keys: [
    { pos: [57.0, -6.1, 4.2], look: [57.0, -6.5, 6.9], fov: 50, dof: 4 },
    { at: wt(16, "babies"), pos: [56.6, -6.05, 4.0], look: [57.0, -6.55, 6.8], fov: 52, dof: 4 },
    { at: wtn(16, "tail", 1), pos: [57.3, -6.15, 4.5], look: [57.0, -6.55, 6.9], fov: 48, dof: 5 },
  ] },
  // 17 "It's like getting paid for every egg... and then killing the chicken. Nobody does that." up and out east to the
  //   farmyard: the farmer cashes eggs, the official raises an axe, the farmer shields the hen
  { name: "hen", at: land(17, "paid"), look: "golden", carry: "coin", lk: "ahead", via: [[57, -6.0, 5.0], [57, -5.7, 7.4], [57, -2.5, 7.6], [57.6, 2.0, 7.4], [94, 9, 4]], keys: [
    { pos: [127.9, 1.85, -0.4], look: [129.45, 1.2, 6.2], fov: 48, dof: 3 },
    { at: wt(17, "killing"), pos: [127.6, 1.9, 0.0], look: [129.45, 1.3, 6.2], fov: 50, dof: 3 },
    { at: wt(17, "Nobody"), pos: [128.4, 1.8, 0.6], look: [129.9, 1.25, 6.0], fov: 48, roll: -0.04, dof: 4 },
  ] },
  // 18 "Soon, farms outside the city are breeding rats just for the reward." the RAT FARM sign, then inside: cages, the
  //   farmer counting coins
  { name: "barnSign", at: land(18, "farms"), look: "dusk", keys: [
    { pos: [125.4, 2.6, -2.4], look: [132.9, 3.6, -4.0], fov: 48 },
  ] },
  { name: "barn", at: land(18, "breeding"), look: "warm", via: [[131.0, 2.2, -3.8], [134.4, 2.1, -3.6]], keys: [
    { pos: [137.2, 2.3, 0.0], look: [143.6, 1.0, -3.2], fov: 52, dof: 2 },
    { at: wt(18, "rats"), pos: [144.4, 1.85, -0.9], look: [148.2, 1.1, -0.5], fov: 48, dof: 4 },
  ] },
  // 19 "The French finally cancel the reward." night, under the street lamp: the official tears the poster down
  { name: "tear", at: land(19, "French"), look: "night", carry: "coin", via: [[134.4, 2.1, -3.6], [131.0, 2.4, -3.8], [100, 8, -1]], keys: [
    { pos: [60.0, 1.75, -4.4], look: [61.4, 1.55, -9.8], fov: 48, dof: 3 },
    { at: wt(19, "cancel"), pos: [60.3, 1.7, -4.9], look: [61.5, 1.5, -9.8], fov: 48, dof: 4 },
  ] },
  // 20 "And the man who built those sewers, Paul Doumer, goes home... and later becomes President of France."
  //    over the roofs to the quay at dawn: Doumer with his sewer plans boards the steamer...
  { name: "quay", at: land(20, "man"), look: "dawngold", carry: "poster", via: [[60.6, 6, -8], [59, 17, -20], [58.5, 6, -33]], keys: [
    { pos: [59.6, 1.5, -39.6], look: [53.0, 1.75, -45.4], fov: 58, dof: 2 },
    { at: wt(20, "Paul"), pos: [59.2, 1.45, -40.0], look: [53.2, 1.7, -45.6], fov: 56, dof: 2 },
    { at: wt(20, "goes"), pos: [58.8, 1.6, -40.6], look: [53.6, 1.4, -47.6], fov: 56, dof: 2 },
  ] },
  //    ...and across the water: on the balcony in Paris, sash, crowd cheering
  { name: "balcony", at: land(20, "President"), look: "dawngold", via: [[61.5, 7.8, -48], [62.6, 7.0, -60]], lk: [0.0, 0.4], keys: [
    { pos: [62.8, 3.6, -69.5], look: [60.4, 6.8, -84.0], fov: 56, dof: 1 },
    { at: wt(20, "France"), pos: [61.2, 6.2, -75.5], look: [60.2, 8.0, -84.0], fov: 52, dof: 1 },
  ] },
  // 21 "The rats? They stayed." over the rats sunning by the plaza grate and down it: our tailless rat lounging in a
//    deckchair in the sewer, waving
  { name: "stayed", at: land(21, "stayed"), look: "sewer", carry: "rat", lk: [0.05, 0.55], via: [[70.4, 3.2, -74.6], [OUTFLOW.x, 2.2, OUTFLOW.z - 0.3], [OUTFLOW.x, -1.8, OUTFLOW.z - 0.2], [OUTFLOW.x - 0.4, -3.6, OUTFLOW.z + 0.2]], keys: [
    { pos: [OUTFLOW.x - 1.8, -4.9, OUTFLOW.z + 2.0], look: [OUTFLOW.x + 1.0, -5.4, OUTFLOW.z], fov: 48, dof: 5 },
  ] },
];

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
export const carryAt = (t: number, c: Cam) => {
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
/** camera at time t */
export const camAt = (t: number): Cam => {
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
void MG;
