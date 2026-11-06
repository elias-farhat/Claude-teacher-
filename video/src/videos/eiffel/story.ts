// Timeline of "The Man Who Sold the Eiffel Tower": everything is timed to words.json (forced alignment of the
// approved narration). Shots start on words; inside a shot the camera makes a new move every ~1.2 s on word
// onsets (eased, speed peak ~1/3 in, 17 f or longer for long moves) and drifts slowly in between. No cuts: every
// change of place is one continuous camera flight, through the door or window of the building (layout.ts).
import * as THREE from "three";
import WORDS from "./words.json";
import { LookName } from "./looks";
import { ROOM_AT, RoomName } from "./rooms";
import { ROOMS, PORTAL, LINKS, HOTEL_FACADE_Z, CAFE4 } from "./layout";
import LEGACY from "./legacy-flights.json";
import { COMP } from "./paris";
import { CAFE, HOTEL, RAIL } from "./paris";
import { OUTER, INNER, FLOOR1 } from "./tower";

export const FPS = 30;
export type Word = { i: number; w: string; s: number; e: number; line: number };
export const WORDLIST = WORDS as Word[];
export const VOICE_LEN = 63.02;
export const TOTAL = Math.ceil(VOICE_LEN * FPS) + 6;
export type V3 = [number, number, number];
const v = (a: THREE.Vector3, dx = 0, dy = 0, dz = 0): V3 => [a.x + dx, a.y + dy, a.z + dz];
export const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (6 * t - 15) + 10); };
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** start time (s) of word w of script line ln (w = 0 = first word of the line); w may be a word string */
export const wt = (ln: number, w: number | string = 0) => {
  const ws = WORDLIST.filter((x) => x.line === ln);
  const k = typeof w === "number" ? w : ws.findIndex((x) => x.w.toLowerCase().startsWith(w.toLowerCase()));
  return ws[Math.max(0, Math.min(ws.length - 1, k))].s;
};
export const lineEnd = (ln: number) => { const ws = WORDLIST.filter((x) => x.line === ln); return ws[ws.length - 1].e; };

// ---------------- set anchors ----------------
export type SetId = "tower" | "cafe" | "cafe4" | "hotelExt" | "train" | "river" | RoomName;
const TAG: V3 = [22.55, 50.8, 41.4];
export const LUSTIG_PLATFORM: V3 = [16.5, FLOOR1 + 1.1, 40.1];  // at the railing, the city behind him
const legMid = (y: number) => (INNER(y) + OUTER(y)) / 2;
export const PAINTERS: V3 = [OUTER(30) + 0.8, 30, legMid(30)];
export const LADY: V3 = [60, 0, 76];
const R = ROOM_AT;
export const TRAIN_X0 = 175, TRAIN_V = 9; // locomotive nose x at the start of line 18, m/s
/** train position: east along the quay from line 18 (past André's street); for line 21 (seen again only from
 *  50 s) it runs fast toward the hotel, stops and reverses ("comes back") */
export const trainX = (t: number) => {
  const t21 = wt(21);
  if (t < t21 - 1.2) return TRAIN_X0 + TRAIN_V * Math.max(-1, t - wt(18));
  const u = t - t21;
  return 330 + 10 * u - 5 * u * u;
};
/** the steamer (line 23) sails east past the hotel; Lustig waves from the bow */
export const shipX = (t: number) => 380 + 4 * (t - wt(23));
/** line 3: a rust flake falls from the painters' board onto the lady's hat, from "rusty" to "ugly" */
export const flakeAt = (t: number) => {
  const K = SHOTS[2].keys, D = moveDur(V(K[0].pos).distanceTo(V(K[1].pos))), m0 = wt(3, "half") - D, f0 = wt(3, "rusty") - 0.3, f1 = wt(3, "ugly") - 2 / 30;
  const P0 = new THREE.Vector3(PAINTERS[0], 30.4, PAINTERS[2]), P1 = new THREE.Vector3(PAINTERS[0], 29.2, PAINTERS[2]);
  const L1 = new THREE.Vector3(LADY[0] + 0.25, 3.0, LADY[2]), L2 = new THREE.Vector3(LADY[0], LADY[1] + 1.95, LADY[2]);
  const p = t < m0 ? P0.lerp(P1, clamp01((t - f0) / (m0 - f0))) : t < m0 + D ? P1.lerp(L1, ease((t - m0) / D)) : L1.lerp(L2, smooth(clamp01((t - m0 - D) / (f1 - m0 - D))));
  return p.add(new THREE.Vector3(0.3 * Math.sin(t * 5), 0, 0));
};
/** line 18: the money bag flies from the café table onto the train window; the camera follows it */
export const BAG = { t0: 0, dur: 1.5 };
export const bagAt = (t: number) => {
  const u = smooth(clamp01((t - BAG.t0) / BAG.dur));
  // up over the quay, round the north side of the train and in through its window (the window faces north)
  const a = new THREE.Vector3(CAFE4.x + 3.25, 1.0, CAFE4.z - 6.65), b = new THREE.Vector3(trainX(t) - 5.75, 2.25, RAIL.z - 1.2);
  const c = new THREE.Vector3((a.x + b.x) / 2, 32, RAIL.z - 34);
  return a.multiplyScalar((1 - u) ** 2).addScaledVector(c, 2 * u * (1 - u)).addScaledVector(b, u * u);
};

/** framing helper: camera for one face (`far` = null) or a depth-staged two-shot (near face in front, far face behind).
 *  Faces land at ~faceY from the top (upper part of the frame, clear of the 70 % captions) and the near face is at
 *  most maxFace of the frame height. `away` = direction from the near face toward the camera (single shots);
 *  `side` = degrees to swing a two-shot off the line between the faces. */
const HEAD = 0.48; // head height in metres (cards)
export const compose = (near: V3, far: V3 | null, o: { away?: V3; side?: number; fov?: number; faceY?: number; maxFace?: number; dy?: number; at?: number; roll?: number; dof?: number; dist?: number } = {}): Key => {
  const fov = o.fov ?? 44, th = Math.tan((fov * Math.PI) / 360), N = new THREE.Vector3(...near);
  const D = o.dist ?? HEAD / (2 * (o.maxFace ?? 0.2) * th);
  let dir = far ? N.clone().sub(new THREE.Vector3(...far)).setY(0).normalize() : new THREE.Vector3(...(o.away ?? [0, 0, -1])).setY(0).normalize();
  const sa = ((o.side ?? (far ? 14 : 0)) * Math.PI) / 180;
  dir = new THREE.Vector3(dir.x * Math.cos(sa) - dir.z * Math.sin(sa), 0, dir.x * Math.sin(sa) + dir.z * Math.cos(sa));
  const pos = N.clone().addScaledVector(dir, D).setY(N.y + (o.dy ?? 0.12));
  const target = far ? new THREE.Vector3(...far).lerp(N, 0.35) : N.clone();
  const fwd = target.clone().sub(pos), pitch = Math.atan((1 - 2 * (o.faceY ?? 0.4)) * th);   // aim below the faces
  const h = Math.hypot(fwd.x, fwd.z), el = Math.atan2(fwd.y, h) - pitch;
  const look = pos.clone().add(new THREE.Vector3((fwd.x / h) * Math.cos(el), Math.sin(el), (fwd.z / h) * Math.cos(el)).multiplyScalar(fwd.length()));
  return { at: o.at, pos: [pos.x, pos.y, pos.z], look: [look.x, look.y, look.z], fov, roll: o.roll, dof: o.dof };
};
const R0 = ROOM_AT;
/** head points (standing / seated cards) in the meeting room and the lobby */
const mh = (x: number, z: number, seated = true): V3 => [R0.meeting.x + x, R0.meeting.y + (seated ? 1.26 : 1.44), R0.meeting.z + z];
const LUS: V3 = mh(-3.0, 0, false), AND: V3 = mh(2.0, 1.25), DL = [-2.0, -1.2, -0.4, 0.4, 1.2].map((x) => mh(x, 1.25));

export type Key = { at?: number; pos: V3; look: V3; fov?: number; roll?: number; dof?: number; dur?: number; follow?: boolean | "ship" };
/** land: the camera flight into this shot lands 2 frames before this time (the word that names the subject) */
/** carry: the key prop the narration is about rides just ahead of the camera through the flight into this shot,
 *  starting at the previous subject and landing on this one (no flight frame shows only the city) */
export type CarryProp = "paper" | "francs" | "key" | "ticket" | "envelope" | "bill" | "newyork" | "calendar";
export type Shot = { at: number; set: SetId; look: LookName; keys: Key[]; glide?: boolean; interior?: boolean; land?: number; bag?: boolean;
  carry?: { prop: CarryProp; to: (t: number) => THREE.Vector3 } };

/** the shot list (times in seconds, from wt()) */
export const SHOTS: Shot[] = [
  // 1 "In 1925, a man sold the Eiffel Tower for scrap metal." fly down the tower to the swinging SOLD tag
  { at: 0, set: "tower", look: "morning", glide: true, keys: [
    { pos: [110, 300, 270], look: [0, 255, 0], fov: 42 },
    { at: wt(1, "man"), pos: [92, 185, 205], look: [0, 150, 0], fov: 40 },
    { at: wt(1, "Eiffel"), pos: [52, 82, 112], look: [18, 58, 40], fov: 38 },
    { at: wt(1, "scrap"), pos: [25.8, 51.4, 46.2], look: [TAG[0], TAG[1] - 0.6, TAG[2]], fov: 34, roll: 0.06, dof: 12 },
  ] },
  // 2 "Then he came back and tried to sell it again." the tag flips to SOLD AGAIN?, whip to Lustig winking
  { at: wt(2), set: "tower", look: "morning", keys: [
    { pos: [25.3, 51.2, 45.4], look: [TAG[0], TAG[1] - 0.7, TAG[2]], fov: 31, roll: 0.06, dof: 13 },
    { at: wt(2, "tried"), pos: [LUSTIG_PLATFORM[0] + 2.2, LUSTIG_PLATFORM[1] + 1.55, LUSTIG_PLATFORM[2] - 4.6], look: [LUSTIG_PLATFORM[0], LUSTIG_PLATFORM[1] + 1.5, LUSTIG_PLATFORM[2]], fov: 34, roll: -0.07, dof: 12 },
  ] },
  // 3 "It's Paris, and the tower is rusty, expensive, and half the city thinks it's ugly."
  { at: wt(3), set: "tower", look: "morning", keys: [
    { pos: [PAINTERS[0] + 14, 32.5, PAINTERS[2] + 2.5], look: [PAINTERS[0] + 0.3, 30.8, PAINTERS[2] - 0.2], fov: 34, dof: 8 },
    compose([LADY[0], 1.44, LADY[2]], null, { at: wt(3, "half"), away: [0.35, 0, 1], maxFace: 0.11, faceY: 0.5, fov: 48, roll: 0.06, dof: 4 }),
    compose([LADY[0], 1.44, LADY[2]], null, { at: wt(3, "ugly"), away: [0.25, 0, 1], maxFace: 0.17, faceY: 0.42, fov: 46, dof: 6 }),
  ] },
  // 4 "Victor Lustig reads this in the morning paper and smiles." café: headline, paper lowers, smile
  { at: wt(4), set: "cafe4", look: "cafe", land: wt(4, "reads"), carry: { prop: "paper", to: () => new THREE.Vector3(CAFE4.x + 2.55, 1.2, CAFE4.z) }, keys: [
    { pos: [CAFE4.x - 0.75, 1.24, CAFE4.z + 0.25], look: [CAFE4.x + 2.45, 1.12, CAFE4.z], fov: 30, dof: 13 },
    compose([CAFE4.x + 3, 1.26, CAFE4.z], null, { at: wt(4, "morning"), away: [-1, 0, -0.45], maxFace: 0.15, roll: -0.05, dof: 6 }),
    compose([CAFE4.x + 3, 1.26, CAFE4.z], null, { at: wt(4, "smiles"), away: [-1, 0, -0.2], maxFace: 0.19, dof: 8 }),
  ] },
  // 5 "He pays a forger for government letterhead," back-room workshop, lamp-lit
  { at: wt(5), set: "forger", look: "lamp", interior: true, land: wt(5, "forger"), carry: { prop: "francs", to: () => new THREE.Vector3(ROOMS.forger.o.x + 0.45, 1.1, ROOMS.forger.o.z - 1.45) }, keys: [
    { pos: v(R.forger, 0.9, 1.55, 1.3), look: v(R.forger, -0.1, 1.15, -1.3), fov: 42, dof: 8 },
    { at: wt(5, "forger"), pos: v(R.forger, 0.6, 1.65, 0.9), look: v(R.forger, 0, 1.15, -1.6), fov: 42, roll: 0.05, dof: 8 },
    { at: wt(5, "letterhead"), pos: v(R.forger, 0.6, 2.05, 1.4), look: v(R.forger, 0.1, 0.95, -1.1), fov: 44, dof: 10 },
  ] },
  // 6 "books a suite at the fanciest hotel in Paris," hotel facade, then through the doors to the chandelier
  { at: wt(6), set: "hotelExt", look: "golden", land: wt(6, "suite"), carry: { prop: "key", to: () => new THREE.Vector3(HOTEL.x, 2.3, HOTEL_FACADE_Z - 1.6) }, keys: [
    { pos: [HOTEL.x + 0.4, 1.6, HOTEL_FACADE_Z - 14], look: [HOTEL.x, 1.7, HOTEL_FACADE_Z], fov: 44 },
  ] },
  { at: wt(6, "fanciest"), set: "lobby", look: "golden", interior: true, keys: [
    compose([R.lobby.x + 2.95, 1.25, R.lobby.z + 4.8], null, { away: [-0.4, 0, -1], maxFace: 0.12, fov: 46, dof: 3 }),
    compose([R.lobby.x + 2.95, 1.25, R.lobby.z + 4.8], null, { at: wt(6, "Paris"), away: [-0.2, 0, -1], maxFace: 0.16, fov: 44, roll: -0.04, dof: 5 }),
  ] },
  // 7 "and invites the city's biggest scrap dealers to a secret meeting." envelopes into mailboxes, door sign
  { at: wt(7), set: "lobby", look: "golden", interior: true, keys: [
    { pos: v(R.lobby, 0.6, 1.6, 0.8), look: v(R.lobby, 4.6, 1.55, 7.6), fov: 48, dof: 3 },
    { at: wt(7, "scrap"), pos: v(R.lobby, 1.6, 1.65, 2.0), look: v(R.lobby, 5.0, 1.55, 7.7), fov: 46, roll: 0.04, dof: 4 },
  ] },
  { at: wt(7, "secret"), set: "meeting", look: "warm", interior: true, keys: [
    { pos: v(R.meeting, 1.6, 1.75, -2.6), look: v(R.meeting, -2.6, 1.3, 3.2), fov: 46, dof: 3 },
  ] },
  // 8 "The government is quietly selling the tower, he tells them." dealers round the table, blueprint
  { at: wt(8), set: "meeting", look: "warm", interior: true, keys: [
    { pos: v(R.meeting, 4.2, 2.3, -2.9), look: v(R.meeting, -0.6, 1.05, 0.7), fov: 50, dof: 3 },
    { at: wt(8, "selling"), pos: v(R.meeting, -0.3, 2.7, -1.6), look: v(R.meeting, -0.55, 0.85, 0.2), fov: 46, roll: 0.04, dof: 5 },
    compose(LUS, null, { at: wt(8, "tells"), away: [1, 0, -0.55], maxFace: 0.17, dof: 6 }),
  ] },
  // 9 "Seven thousand tons of iron. Highest bid wins. Not a word to anyone." 7,000 TONS, finger to lips
  { at: wt(9), set: "meeting", look: "warm", interior: true, keys: [
    { pos: v(R.meeting, 1.0, 1.6, -1.6), look: v(R.meeting, 0.2, 1.15, 0.2), fov: 42, dof: 7 },
    { at: wt(9, "Highest"), pos: v(R.meeting, -0.6, 2.1, -2.5), look: v(R.meeting, -0.8, 1.05, 1.1), fov: 48, roll: -0.04, dof: 4 },
    compose(LUS, null, { at: wt(9, "Not"), away: [1, 0, -0.4], maxFace: 0.19, dof: 7 }),
    compose(AND, LUS, { at: wt(9, "anyone"), side: 28, maxFace: 0.13, fov: 48, dof: 3 }),
  ] },
  // 10 "One dealer, André, wants it more than anyone," two-shot down the table, then André
  { at: wt(10), set: "meeting", look: "warm", interior: true, keys: [
    compose(AND, LUS, { side: 28, maxFace: 0.15, fov: 46, dof: 3 }),
    compose(AND, null, { at: wt(10, "André"), away: [0.25, 0, -1], maxFace: 0.19, dof: 6 }),
  ] },
  // 11 "but something about this feels off." two-shot: x-ray DOUBT gear over André, Lustig behind; light cools
  { at: wt(11), set: "meeting", look: "cool", interior: true, keys: [
    compose(AND, LUS, { side: 26, maxFace: 0.17, fov: 46, dof: 3 }),
  ] },
  // 12 "So how do you calm down a suspicious buyer?" stay on the pair, then Lustig full-length-ish
  { at: wt(12), set: "meeting", look: "dim", interior: true, keys: [
    compose(AND, LUS, { side: 32, maxFace: 0.14, fov: 46, dof: 3 }),
    compose(LUS, null, { at: wt(12, "suspicious"), away: [1, 0, -0.3], maxFace: 0.15, fov: 46, dof: 5 }),
  ] },
  // 13 "You ask him for a bribe." side view of the table: Lustig's arm slides across, palm up; a dealer spits
  { at: wt(13), set: "meeting", look: "dim", interior: true, keys: [
    { pos: v(R.meeting, -4.6, 1.75, -0.9), look: v(R.meeting, -0.5, 1.0, 0.6), fov: 56, roll: -0.03, dof: 3 },
  ] },
  // 14 "You see, a fake official would never ask for money under the table." FAKE vs REAL split gag
  { at: wt(14), set: "studio", look: "neutral", interior: true, keys: [
    { pos: v(R.studio, 0, 1.75, -3.0), look: v(R.studio, 0, 1.45, 1.6), fov: 46 },
    { at: wt(14, "never"), pos: v(R.studio, -0.45, 1.7, -1.9), look: v(R.studio, -0.55, 1.4, 1.6), fov: 46, dof: 4 },
    { at: wt(14, "money"), pos: v(R.studio, 0.3, 1.75, -2.5), look: v(R.studio, 0.2, 1.45, 1.6), fov: 46 },
  ] },
  // 15 "But a real, crooked one would." Lustig at the head of the table, pockets the imaginary money, winks
  { at: wt(15), set: "meeting", look: "warm", interior: true, keys: [
    compose(LUS, null, { away: [1, 0, -0.75], maxFace: 0.13, fov: 46, roll: 0.04, dof: 4 }),
    compose(LUS, null, { at: wt(15, "crooked"), away: [1, 0, -0.45], maxFace: 0.17, fov: 46, dof: 5 }),
  ] },
  // 16 "It's like a waiter whispering that the fish is bad tonight. Suddenly you trust everything else he says."
  { at: wt(16), set: "cafe4", look: "cafe", land: wt(16, "waiter"), carry: { prop: "francs", to: () => new THREE.Vector3(CAFE4.x + 3.3, 1.5, CAFE4.z - 6.3) }, keys: [
    { pos: [CAFE4.x - 1.0, 1.6, CAFE4.z - 5.3], look: [CAFE4.x + 3.3, 1.15, CAFE4.z - 6.9], fov: 42, dof: 4 },
    { at: wt(16, "fish"), pos: [CAFE4.x - 0.5, 1.55, CAFE4.z - 8.0], look: [CAFE4.x + 3.3, 1.15, CAFE4.z - 6.9], fov: 42, roll: -0.04, dof: 5 },
    { at: wt(16, "Suddenly"), pos: [CAFE4.x - 0.3, 1.5, CAFE4.z - 6.3], look: [CAFE4.x + 3.3, 1.1, CAFE4.z - 6.9], fov: 42, dof: 5 },
    { at: wt(16, "everything"), pos: [CAFE4.x - 0.7, 1.55, CAFE4.z - 7.4], look: [CAFE4.x + 3.3, 1.1, CAFE4.z - 6.9], fov: 42, dof: 5 },
  ] },
  // 17 "André pays the bribe, pays for the tower," at the café table: francs slide to Lustig, André signs
  { at: wt(17), set: "cafe4", look: "golden", keys: [
    { pos: [CAFE4.x - 0.9, 1.6, CAFE4.z - 5.9], look: [CAFE4.x + 3, 1.15, CAFE4.z - 7.0], fov: 44, dof: 3 },
    compose([CAFE4.x + 3, 1.26, CAFE4.z - 7.6], null, { at: wt(17, "pays"), away: [-1, 0, 0.3], maxFace: 0.15, roll: 0.04, dof: 5 }),
  ] },
  // 18 "and Lustig is on a train to Austria with seventy thousand francs." the camera follows the money bag from the
  // café table over Paris onto the train window; then a medium shot of Lustig with the bag (and ticket)
  { at: wt(18), set: "train", look: "sunset", bag: true, land: wt(18, "seventy") - 0.1, keys: [
    { follow: true, pos: [-3.6, 2.85, RAIL.z - 6.0], look: [-6, 2.35, RAIL.z - 1.5], fov: 44, dof: 5 },
    { at: wt(18, "seventy"), follow: true, pos: [-6.3, 2.6, RAIL.z - 5.0], look: [-6.1, 2.3, RAIL.z - 1.5], fov: 44, roll: -0.04, dof: 7 },
  ] },
  // 19 "Every day he checks the newspapers. Nothing." in through the window: Lustig in his seat, flipping faster
  { at: wt(19), set: "train", look: "dusk", keys: [
    { follow: true, pos: [-5.0, 2.55, RAIL.z + 0.9], look: [-7.0, 2.0, RAIL.z - 0.6], fov: 54, dof: 3 },
    { at: wt(19, "Nothing"), follow: true, pos: [-5.4, 2.45, RAIL.z + 0.7], look: [-7.1, 2.0, RAIL.z - 0.6], fov: 52, dof: 4 },
  ] },
  // 20 "André is too embarrassed to tell anyone he bought the Eiffel Tower." bill under the rug, the cat stares
  { at: wt(20), set: "andre", look: "cool", interior: true, land: wt(20, "embarrassed"), carry: { prop: "paper", to: () => new THREE.Vector3(ROOMS.andre.o.x + 0.65, ROOMS.andre.o.y + 1.0, ROOMS.andre.o.z + 0.65) }, keys: [
    { pos: v(R.andre, 2.6, 1.6, 2.3), look: v(R.andre, 0.0, 0.9, 0.2), fov: 48, dof: 3 },
    { at: wt(20, "anyone"), pos: v(R.andre, -0.75, 0.95, 2.1), look: v(R.andre, -1.3, 0.4, 0.4), fov: 44, roll: 0.05, dof: 6 },
    { at: wt(20, "Eiffel"), pos: v(R.andre, 1.2, 1.5, 2.4), look: v(R.andre, 0.1, 0.8, 0.2), fov: 50, dof: 8 },
  ] },
  // 21 "So Lustig comes back and does it all again. New dealers. Same speech." the train shoots past toward the
  // hotel, stops and reverses (Lustig waving), then in through the meeting window to the same table, new dealers
  { at: wt(21), set: "train", look: "night", land: wt(21, "comes"), carry: { prop: "ticket", to: (t) => new THREE.Vector3(trainX(t) - 6.3, 2.45, RAIL.z - 1.3) }, keys: [
    { pos: [326.8, 2.7, RAIL.z - 13], look: [326.4, 2.35, RAIL.z - 1], fov: 50, dof: 3 },
    { at: wt(21, "does"), pos: [325.9, 2.6, RAIL.z - 12.2], look: [325.9, 2.35, RAIL.z - 1], fov: 50, dof: 3 },
  ] },
  { at: wt(21, "New"), set: "meeting", look: "nightwarm", interior: true, land: wt(21, "New"), carry: { prop: "envelope", to: () => new THREE.Vector3(ROOMS.meeting.o.x, ROOMS.meeting.o.y + 0.9, ROOMS.meeting.o.z + 0.3) }, keys: [
    { pos: v(R.meeting, 4.2, 2.3, -2.9), look: v(R.meeting, -0.6, 1.05, 0.7), fov: 50, dof: 3 },
    compose(LUS, null, { at: wt(21, "Same"), away: [1, 0, -0.4], maxFace: 0.18, dof: 6 }),
  ] },
  // 22 "This time, the buyer goes to the police." out of the meeting window: blue police lamps flood it from below,
  // the policemen whistle at the door, André points
  { at: wt(22), set: "hotelExt", look: "police", land: wt(22, "buyer"), carry: { prop: "bill", to: () => new THREE.Vector3(HOTEL.x - 1.0, 1.25, HOTEL_FACADE_Z - 10.0) }, keys: [
    { pos: [HOTEL.x + 0.6, 1.25, HOTEL_FACADE_Z - 16.5], look: [HOTEL.x - 0.2, 1.9, HOTEL_FACADE_Z], fov: 50, roll: -0.04, dof: 3 },
    { at: wt(22, "police"), pos: [HOTEL.x - 0.1, 1.2, HOTEL_FACADE_Z - 15.6], look: [HOTEL.x - 0.1, 1.9, HOTEL_FACADE_Z], fov: 50, dof: 3 },
  ] },
  // 23 "Lustig escapes to America and keeps conning people for years." the steamer, Lustig waving from the bow
  { at: wt(23), set: "river", look: "predawn", land: wt(23, "escapes"), carry: { prop: "newyork", to: (t) => new THREE.Vector3(shipX(t) + 11, 2.9, -261.6) }, keys: [
    { follow: "ship", pos: [13.4, 2.5, -255.8], look: [11, 1.95, -261.6], fov: 44, dof: 4 },
    { at: wt(23, "keeps"), follow: "ship", pos: [9.2, 2.6, -255.6], look: [11.1, 2.0, -261.6], fov: 44, roll: 0.04, dof: 4 },
  ] },
  // 24 "When he finally dies in a prison hospital," quiet ward, rain on the window
  { at: wt(24), set: "hospital", look: "greydawn", interior: true, land: wt(24, "dies"), carry: { prop: "calendar", to: () => new THREE.Vector3(ROOMS.hospital.o.x + 1.5, 1.45, ROOMS.hospital.o.z + 1.2) }, keys: [
    { pos: v(R.hospital, -4.0, 2.0, -2.6), look: v(R.hospital, 1.2, 1.0, 1.4), fov: 46, dof: 3 },
    { at: wt(24, "prison"), pos: v(R.hospital, 0.2, 1.8, -1.6), look: v(R.hospital, 1.5, 1.0, 1.4), fov: 44, dof: 5 },
  ] },
  // 25 "his death certificate lists his job as… apprentice salesman." certificate, sunrise through the window
  { at: wt(25), set: "hospital", look: "sunrise", interior: true, keys: [
    { pos: v(R.hospital, 2.75, 1.75, 1.45), look: v(R.hospital, 2.6, 0.78, 0.5), fov: 44, dof: 5 },
    { at: wt(25, "apprentice"), pos: v(R.hospital, 2.62, 1.45, 1.15), look: v(R.hospital, 2.6, 0.76, 0.5), fov: 38, dof: 8 },
  ] },
];

// ---------------- camera evaluation ----------------
export type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number; dof: number; shot: number; mix: number; next: number; interior: boolean };
const MOVE = 17;                                    // frames for a short in-shot move
const ease = (x: number) => smooth(Math.pow(clamp01(x), 0.72)); // eased, speed peak ~1/3 into the move
const V = (a: V3) => new THREE.Vector3(...a);
const lerp3 = (a: THREE.Vector3, b: THREE.Vector3, t: number) => a.clone().lerp(b, t);
/** seconds for an in-shot move: 17 f for small reframings, longer (up to 1.4 s) when the camera travels far */
const moveDur = (d: number) => Math.min(1.4, Math.max(MOVE / FPS, MOVE / FPS + (d - 3) / 45));
/** key times inside a shot: given keys keep their word; extra drift moves fill holds longer than ~1.4 s */
const keyTimes = (s: Shot, end: number) => {
  const out: { t: number; k: number; drift: number }[] = [];
  s.keys.forEach((k, i) => out.push({ t: i === 0 ? s.at : k.at ?? s.at, k: i, drift: 0 }));
  // land on the word: a move toward a word-timed key starts early enough to arrive on it (outside the approved
  // 15-36 s, which keeps its run-11 timing)
  if (!(s.at >= 15 && s.at <= 36.2)) {
    let land = s.at;
    for (let i = 1; i < out.length; i++) {
      const dur = moveDur(V(s.keys[i - 1].pos).distanceTo(V(s.keys[i].pos)));
      out[i].t = Math.max(land, out[i].t - dur); land = out[i].t + dur;
    }
  }
  const words = WORDLIST.filter((w) => w.s > s.at + 0.6 && w.s < end - 0.5);
  const filled: typeof out = [];
  for (let i = 0; i < out.length; i++) {
    filled.push(out[i]);
    const t1 = i + 1 < out.length ? out[i + 1].t : end;
    let last = out[i].t, n = 1;
    for (const w of words) if (w.s > last + 1.15 && w.s < t1 - 0.9) { filled.push({ t: w.s, k: out[i].k, drift: n++ }); last = w.s; }
  }
  return filled;
};
type Pose = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number; dof: number };
const poseCache = new Map<string, Pose>();
/** framing of shot si at time t. Every move starts from the exact pose the camera holds at that moment (including
 *  the slow drift), and a shot that continues in the same place moves in from the previous shot: no jumps. */
const frame = (si: number, t: number): Pose => {
  const ck = si + ":" + t.toFixed(5);
  const hit = poseCache.get(ck);
  if (hit) return { pos: hit.pos.clone(), look: hit.look.clone(), fov: hit.fov, roll: hit.roll, dof: hit.dof };
  const s = SHOTS[si], end = si + 1 < SHOTS.length ? SHOTS[si + 1].at : VOICE_LEN + 0.3;
  const kt = keyTimes(s, end);
  let j = 0;
  while (j + 1 < kt.length && kt[j + 1].t <= t) j++;
  const at = (q: (typeof kt)[number]): Pose => {
    const k = s.keys[q.k];
    const pos = V(k.pos), look = V(k.look);
    if (q.drift) { // small reframing: slide sideways + push 4 %
      const d = look.clone().sub(pos), side = new THREE.Vector3(-d.z, 0, d.x).normalize().multiplyScalar(Math.min(0.6, d.length() * 0.05) * (q.drift % 2 ? 1 : -1));
      pos.add(side).addScaledVector(d, 0.04);
    }
    if (k.follow) { const dx = k.follow === "ship" ? shipX(t) : trainX(t); pos.x += dx; look.x += dx; }
    return { pos, look, fov: k.fov ?? 40, roll: (k.roll ?? 0) * (q.drift % 2 ? -1 : 1), dof: k.dof ?? 0 };
  };
  const cur = at(kt[j]);
  let r: Pose = cur, landed = kt[j].t;
  if (s.glide && kt.length > 1) { // continuous flight through the keys (shot 1)
    const n = s.keys.length - 1, T0 = s.at, T1 = (s.keys[n].at ?? end) + 0.25;
    const u = ease((t - T0) / (T1 - T0)) * n, a = Math.min(n - 1, Math.floor(u)), f = u - a;
    const P = (i: number) => V(s.keys[Math.max(0, Math.min(n, i))].pos), Lk = (i: number) => V(s.keys[Math.max(0, Math.min(n, i))].look);
    const k0 = s.keys[a], k1 = s.keys[a + 1];
    r = { pos: cr(P(a - 1), P(a), P(a + 1), P(a + 2), f), look: cr(Lk(a - 1), Lk(a), Lk(a + 1), Lk(a + 2), f),
      fov: (k0.fov ?? 40) + ((k1.fov ?? 40) - (k0.fov ?? 40)) * f, roll: (k0.roll ?? 0) + ((k1.roll ?? 0) - (k0.roll ?? 0)) * f, dof: (k0.dof ?? 0) + ((k1.dof ?? 0) - (k0.dof ?? 0)) * f };
    landed = Infinity;
  } else {
    // where the camera was the moment this key started: the previous key's held pose, or the previous shot's
    // last pose when this shot continues in the same place (no flight)
    const t0 = kt[j].t;
    const prev: Pose | null = j > 0 ? frame(si, t0 - 1e-4)
      : si > 0 && SHOTS[si - 1].set === s.set ? frame(si - 1, s.at - 1e-4) : null;
    if (prev) {
      const d = prev.pos.distanceTo(cur.pos), dur = moveDur(d), u = ease((t - t0) / dur);
      landed = t0 + dur;
      // big moves arc up over the scene; indoor moves rise over people's heads instead of passing through them
      const lift = (d > 12 ? Math.min(40, d * 0.18) : s.interior ? Math.min(1.1, d * 0.3) : 0) * Math.sin(Math.PI * u);
      r = { pos: lerp3(prev.pos, cur.pos, u).add(new THREE.Vector3(0, lift, 0)), look: lerp3(prev.look, cur.look, u),
        fov: prev.fov + (cur.fov - prev.fov) * u, roll: prev.roll + (cur.roll - prev.roll) * u, dof: prev.dof + (cur.dof - prev.dof) * u };
    }
  }
  if (landed !== Infinity) { // slow drift during holds: push in 0.2 %/frame since the move landed, capped at 6 %
    const since = Math.max(0, t - landed) * FPS;
    r.pos = lerp3(r.pos, r.look, Math.min(0.06, 0.002 * since));
  }
  poseCache.set(ck, r);
  return { pos: r.pos.clone(), look: r.look.clone(), fov: r.fov, roll: r.roll, dof: r.dof };
};
/** centripetal-free Catmull-Rom point between p1 and p2 */
const cr = (p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, x: number) =>
  p1.clone().multiplyScalar(2).add(p2.clone().sub(p0).multiplyScalar(x)).add(p0.clone().multiplyScalar(2).sub(p1.clone().multiplyScalar(5)).add(p2.clone().multiplyScalar(4)).sub(p3).multiplyScalar(x * x))
    .add(p1.clone().multiplyScalar(3).sub(p0).sub(p2.clone().multiplyScalar(3)).add(p3).multiplyScalar(x * x * x)).multiplyScalar(0.5);
export const shotAt = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= t) i++; return i; };
const roomOf = (set: SetId): RoomName | null => (set in ROOMS ? (set as RoomName) : null);
/** is a point inside one of the interiors? (fog off, near plane in) */
export const insideRoom = (p: THREE.Vector3, t?: number): string | null => (Object.keys(ROOMS) as RoomName[]).find((k) => {
  const r = ROOMS[k]; return Math.abs(p.x - r.o.x) < r.w / 2 && Math.abs(p.z - r.o.z) < r.d / 2 && p.y > r.o.y - 0.2 && p.y < r.o.y + r.h;
}) ?? (t !== undefined && Math.abs(p.z - RAIL.z) < 1.33 && p.y > 1.05 && p.y < 3.6 && p.x > trainX(t) + COMP.x0 && p.x < trainX(t) + COMP.x1 ? "compartment" : null);

// ---------------- carried props ----------------
/** where the carried prop of the flight landing on shot c.next is (null when none): it starts at the previous
 *  subject (the camera's look point), rides ~4.5 m ahead of the camera, lands on the new subject, then shrinks away */
export const carryAt = (t: number, c: { pos: THREE.Vector3; look: THREE.Vector3; mix: number; next: number; shot: number }) => {
  const b = c.mix > 0 ? c.next : c.shot, sb = SHOTS[b];
  if (!sb?.carry) return null;
  const f = flightTo(b);
  if (!f || f.legacy || f.bag || t < f.t0 || t > f.t0 + f.dur + 0.35) return null;
  const to = sb.carry.to(t);
  if (t >= f.t0 + f.dur) return { prop: sb.carry.prop, p: to, k: 1 - (t - f.t0 - f.dur) / 0.35, spin: 0 };
  const u = (t - f.t0) / f.dur, A = frame(f.a, f.t0);
  const fwd = c.look.clone().sub(c.pos).normalize(), ahead = c.pos.clone().addScaledVector(fwd, 4.5).add(new THREE.Vector3(0, -0.35, 0));
  const from = A.look.clone().add(new THREE.Vector3(0, -1.0, 0)).lerp(A.pos, 0.25);   // from the subject's hands, not over the face
  const p = from.lerp(ahead, smooth(u / 0.3)).lerp(to, smooth((u - 0.7) / 0.3));
  return { prop: sb.carry.prop, p, k: 1, spin: Math.sin(u * Math.PI * 3) * 0.5 };
};

// ---------------- flights between shots ----------------
// Flights that land inside 15-36 s are replayed exactly as in run 11 (approved). All others: 20-30 frames, ease-in-out,
// sized so the peak speed stays <= 12 m/frame, landing 2 frames before the shot's subject word (Shot.land).
type Flight = { pts: THREE.Vector3[]; len: number[]; total: number; dur: number; t0: number; a: number; b: number; legacy: boolean; bag?: boolean };
const flights = new Map<number, Flight | null>();
const PEAK = 11, AVG = PEAK / 1.875;          // m/frame; smootherstep peaks at 1.875 x its average speed
const legacyOf = (b: number) => (LEGACY as { b: number; t0: number; dur: number; pts: number[][] }[]).find((x) => x.b === b);
/** the flight that lands on shot b (null when b continues in the same place) */
export const flightTo = (b: number): Flight | null => {
  if (flights.has(b)) return flights.get(b)!;
  const a = b - 1, sa = SHOTS[a], sb = SHOTS[b];
  if (!sa || sa.set === sb.set) { flights.set(b, null); return null; }
  const lg = legacyOf(b);
  if (lg) { // replay run 11 exactly
    const pts = lg.pts.map((q) => new THREE.Vector3(...(q as [number, number, number]))), len = [0];
    pts[0] = frame(a, lg.t0).pos; pts[pts.length - 1] = frame(b, lg.t0 + lg.dur).pos;
    for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + pts[k].distanceTo(pts[k - 1]));
    const f: Flight = { pts, len, total: len[len.length - 1], dur: lg.dur, t0: lg.t0, a, b, legacy: true };
    flights.set(b, f); return f;
  }
  const before = b > 1 ? flightTo(b - 1) : null, prevEnd = before ? before.t0 + before.dur + 0.05 : -1;
  const tEnd = (sb.land ?? sb.at) - 2 / FPS;
  if (sb.bag) { // line 18: follow the money bag (the subject stays in frame the whole way)
    BAG.t0 = Math.max(prevEnd, wt(17, "tower") - 0.1); BAG.dur = tEnd - 0.1 - BAG.t0;
    const f: Flight = { pts: [], len: [0], total: 0, dur: BAG.dur, t0: BAG.t0, a, b, legacy: false, bag: true };
    flights.set(b, f); return f;
  }
  const ra = roomOf(sa.set), rb = roomOf(sb.set);
  const plan = (t0: number, dur: number) => {
    const A = frame(a, t0).pos, B = frame(b, t0 + dur).pos, mid: THREE.Vector3[] = [];
    const link = ra && rb ? LINKS[`${ra}>${rb}`] : undefined;
    if (link) mid.push(...link);
    else {
      if (insideRoom(A, t0) === "compartment") { const x = trainX(t0) - 6.3; mid.push(new THREE.Vector3(x, 2.6, RAIL.z - 0.4), new THREE.Vector3(x + 2, 3.2, RAIL.z - 7)); }
      if (ra) mid.push(PORTAL[ra].in.clone(), PORTAL[ra].out.clone());
      const last = mid.length ? mid[mid.length - 1] : A;
      const next = rb ? PORTAL[rb].out : B;
      if (last.distanceTo(next) > 30) { const m = last.clone().lerp(next, 0.5); m.y += Math.min(30, last.distanceTo(next) * 0.15); mid.push(m); }
      if (rb) mid.push(PORTAL[rb].out.clone(), PORTAL[rb].in.clone());
    }
    const pts = [A, ...mid, B], len = [0];
    for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + pts[k].distanceTo(pts[k - 1]));
    return { pts, len, total: len[len.length - 1] };
  };
  let dur = 25 / FPS, t0 = tEnd - dur, p = plan(t0, dur);
  for (let it = 0; it < 3; it++) { // size the flight from its path length: 20-30 frames, more only if the speed cap needs it
    const F = Math.max(20, Math.min(30, Math.ceil(p.total / AVG)), Math.ceil(p.total / AVG > 30 ? p.total / AVG : 0));
    dur = F / FPS; t0 = Math.max(prevEnd, tEnd - dur); p = plan(t0, dur);
  }
  const f: Flight = { ...p, dur, t0, a, b, legacy: false };
  flights.set(b, f);
  return f;
};
/** rotate unit direction a toward b by fraction t (great-circle; turns about +y when they are opposite) */
const slerpDir = (a: THREE.Vector3, b: THREE.Vector3, t: number) => {
  if (a.dot(b) < -0.999) b = b.clone().add(new THREE.Vector3(-a.z, 0, a.x).multiplyScalar(0.02)).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(a, b);
  return a.clone().applyQuaternion(new THREE.Quaternion().slerp(q, clamp01(t)));
};
/** position on the flight path at arclength fraction e (Catmull-Rom through the waypoints) */
const along = (f: Flight, e: number) => {
  const s = e * f.total, n = f.pts.length;
  let k = 0;
  while (k + 2 < n && f.len[k + 1] < s) k++;
  const x = (s - f.len[k]) / Math.max(1e-6, f.len[k + 1] - f.len[k]);
  const P = (i: number) => f.pts[Math.max(0, Math.min(n - 1, i))];
  return cr(P(k - 1), P(k), P(k + 1), P(k + 2), clamp01(x));
};
const fly = (f: Flight, t: number): Cam => {
  const u = clamp01((t - f.t0) / f.dur), e = f.legacy ? ease(u) : smooth(u);
  const A = frame(f.a, f.t0), B = frame(f.b, f.t0 + f.dur);
  if (f.bag) { // follow the bag: behind and above it, looking at it; blend in from A and out into B
    const bag = bagAt(t), ahead = bagAt(Math.min(f.t0 + f.dur, t + 0.05)).sub(bagAt(Math.max(f.t0, t - 0.05))).setY(0);
    const dir = ahead.lengthSq() > 1e-6 ? ahead.normalize() : new THREE.Vector3(0, 0, -1);
    const fp = bag.clone().addScaledVector(dir, -6).add(new THREE.Vector3(0, 0.5 + 1.7 * (1 - u), 0)), fl = bag.clone().addScaledVector(dir, 1.5).add(new THREE.Vector3(0, 0.25 * u, 0));
    const wi = smooth(u / 0.25), wo = smooth((u - 0.78) / 0.22);
    const pos = A.pos.clone().lerp(fp, wi).lerp(B.pos, wo), look = A.look.clone().lerp(fl, wi).lerp(B.look, wo);
    return { pos, look, fov: A.fov + (B.fov - A.fov) * u, roll: B.roll * wo, dof: 0, shot: u < 0.5 ? f.a : f.b, mix: u, next: f.b, interior: !!insideRoom(pos, t) };
  }
  const pos = along(f, e), ahead = along(f, Math.min(1, e + 0.03)).sub(along(f, Math.max(0, e - 0.03)));
  const dirA = A.look.clone().sub(A.pos).normalize(), dirB = B.look.clone().sub(B.pos).normalize();
  const tan = ahead.lengthSq() > 1e-8 ? ahead.normalize() : dirB.clone();
  // look: from A's view into the direction of travel (through doors / windows), then settle on B's framing
  const d = f.legacy ? (e < 0.5 ? slerpDir(dirA, tan, smooth(e / 0.3)) : slerpDir(tan, dirB, smooth((e - 0.6) / 0.4)))
    : (e < 0.5 ? slerpDir(dirA, tan, smooth(e / 0.4)) : slerpDir(tan, dirB, smooth((e - 0.55) / 0.4)));
  const dist = A.look.distanceTo(A.pos) + (B.look.distanceTo(B.pos) - A.look.distanceTo(A.pos)) * e;
  const look = pos.clone().add(d.normalize().multiplyScalar(dist));
  const inside = f.legacy ? insideRoom(pos) : insideRoom(pos, t);
  const shot = inside ? (inside === roomOf(SHOTS[f.b].set) ? f.b : f.a) : e < 0.5 ? f.a : f.b;
  return { pos, look, fov: A.fov + (B.fov - A.fov) * e, roll: A.roll + (B.roll - A.roll) * smooth(e), dof: Math.min(A.dof, B.dof) * Math.abs(1 - 2 * e) ** 2, shot, mix: u, next: f.b, interior: !!inside };
};

/** camera at time t: framing of the current shot, or the flight between two shots. mix = progress of the flight */
export const camAt = (t: number): Cam => {
  const i = shotAt(t);
  for (const b of [i + 1, i]) { // a flight that lands on the next shot may start before it; one into this shot may still run
    if (b <= 0 || b >= SHOTS.length) continue;
    const f = flightTo(b);
    if (f && t >= f.t0 && t < f.t0 + f.dur) return fly(f, t);
    if (f && b === i + 1 && t >= f.t0 + f.dur) { const g = frame(b, t); return { ...g, shot: b, mix: 0, next: b, interior: !!SHOTS[b].interior || insideRoom(g.pos, t) === "compartment" }; } // landed before its time
  }
  // a flight into this shot that starts after the shot's own time: hold the previous shot until it leaves
  const into = i > 0 ? flightTo(i) : null;
  if (into && t < into.t0) { const g = frame(i - 1, t); return { ...g, shot: i - 1, mix: 0, next: i - 1, interior: !!SHOTS[i - 1].interior || insideRoom(g.pos, t) === "compartment" }; }
  const f = frame(i, t);
  return { ...f, shot: i, mix: 0, next: i, interior: !!SHOTS[i].interior || insideRoom(f.pos, t) === "compartment" };
};

/** caption word on screen at time t (one word at a time, from slightly before its onset until the next word) */
export const captionAt = (t: number) => {
  const lead = 0.05;
  let k = -1;
  for (let i = 0; i < WORDLIST.length; i++) if (WORDLIST[i].s - lead <= t) k = i; else break;
  if (k < 0) return null;
  const w = WORDLIST[k], next = WORDLIST[k + 1];
  if (t > w.e + 0.35 && (!next || t < next.s - lead)) return null; // pause: no caption
  return w;
};
