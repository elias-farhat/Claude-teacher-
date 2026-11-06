// Timeline of "The Man Who Sold the Eiffel Tower": everything is timed to words.json (forced alignment of the
// approved narration). Shots start on words; inside a shot the camera makes a new move every ~1.2 s on word
// onsets (eased, speed peak ~1/3 in, 17 f or longer for long moves) and drifts slowly in between. No cuts: every
// change of place is one continuous camera flight, through the door or window of the building (layout.ts).
import * as THREE from "three";
import WORDS from "./words.json";
import { LookName } from "./looks";
import { ROOM_AT, RoomName } from "./rooms";
import { ROOMS, PORTAL, LINKS, HOTEL_FACADE_Z } from "./layout";
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
export type SetId = "tower" | "cafe" | "hotelExt" | "train" | "river" | RoomName;
const TAG: V3 = [22.55, 50.8, 41.4];
export const LUSTIG_PLATFORM: V3 = [16.5, FLOOR1 + 1.1, 40.1];  // at the railing, the city behind him
const legMid = (y: number) => (INNER(y) + OUTER(y)) / 2;
export const PAINTERS: V3 = [OUTER(30) + 0.8, 30, legMid(30)];
export const LADY: V3 = [60, 0, 76];
const R = ROOM_AT;
export const TRAIN_X0 = 350, TRAIN_V = 9; // locomotive nose x at the start of line 18, m/s
export const trainX = (t: number) => {
  const t0 = wt(18), t21 = wt(21), tN = wt(21, "New");
  if (t < t21) return TRAIN_X0 + TRAIN_V * Math.max(-1, t - t0);
  // line 21 gag: the train stops and runs backwards
  const x21 = TRAIN_X0 + TRAIN_V * (t21 - t0), u = Math.min(t, tN) - t21;
  return x21 + TRAIN_V * 0.6 * u - 26 * smooth(u / (tN - t21)) * u;
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

export type Key = { at?: number; pos: V3; look: V3; fov?: number; roll?: number; dof?: number; dur?: number; follow?: boolean };
export type Shot = { at: number; set: SetId; look: LookName; keys: Key[]; glide?: boolean; interior?: boolean };

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
    { pos: [165, 48, 250], look: [0, 92, 0], fov: 46 },
    { at: wt(3, "rusty"), pos: [PAINTERS[0] + 9, 33.5, PAINTERS[2] + 5.5], look: [PAINTERS[0], 30.6, PAINTERS[2]], fov: 36, dof: 10 },
    { at: wt(3, "half"), pos: [LADY[0] + 3.2, 1.2, LADY[2] + 7.5], look: [LADY[0] - 1.5, 3.0, LADY[2] - 4], fov: 46, roll: 0.07, dof: 5 },
    { at: wt(3, "ugly"), pos: [LADY[0] + 1.0, 1.35, LADY[2] + 2.7], look: [LADY[0], 1.95, LADY[2]], fov: 34, dof: 13 },
  ] },
  // 4 "Victor Lustig reads this in the morning paper and smiles." café: headline, paper lowers, smile
  { at: wt(4), set: "cafe", look: "cafe", keys: [
    { pos: [CAFE.x - 0.75, 1.24, CAFE.z + 0.25], look: [CAFE.x + 2.45, 1.12, CAFE.z], fov: 30, dof: 13 },
    { at: wt(4, "morning"), pos: [CAFE.x + 0.3, 1.45, CAFE.z - 1.2], look: [CAFE.x + 3, 1.15, CAFE.z], fov: 36, roll: -0.05, dof: 11 },
    { at: wt(4, "smiles"), pos: [CAFE.x + 1.1, 1.4, CAFE.z - 0.6], look: [CAFE.x + 3, 1.25, CAFE.z], fov: 34, dof: 13 },
  ] },
  // 5 "He pays a forger for government letterhead," back-room workshop, lamp-lit
  { at: wt(5), set: "forger", look: "lamp", interior: true, keys: [
    { pos: v(R.forger, 0.9, 1.55, 1.3), look: v(R.forger, -0.1, 1.15, -1.3), fov: 42, dof: 8 },
    { at: wt(5, "forger"), pos: v(R.forger, 0.6, 1.65, 0.9), look: v(R.forger, 0, 1.15, -1.6), fov: 42, roll: 0.05, dof: 8 },
    { at: wt(5, "letterhead"), pos: v(R.forger, 0.45, 1.85, 0.25), look: v(R.forger, 0, 1.12, -1.1), fov: 42, dof: 10 },
  ] },
  // 6 "books a suite at the fanciest hotel in Paris," hotel facade, then through the doors to the chandelier
  { at: wt(6), set: "hotelExt", look: "golden", keys: [
    { pos: [HOTEL.x - 20, 10, HOTEL.z - 75], look: [HOTEL.x, 13, HOTEL.z - 15], fov: 44 },
    { at: wt(6, "suite"), pos: [HOTEL.x, 2.6, HOTEL_FACADE_Z - 16], look: [HOTEL.x, 2.5, HOTEL_FACADE_Z], fov: 42 },
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
  { at: wt(16), set: "cafe", look: "cafe", keys: [
    { pos: [CAFE.x - 1.0, 1.6, CAFE.z - 5.3], look: [CAFE.x + 3.3, 1.15, CAFE.z - 6.9], fov: 42, dof: 4 },
    { at: wt(16, "fish"), pos: [CAFE.x - 0.5, 1.55, CAFE.z - 8.0], look: [CAFE.x + 3.3, 1.15, CAFE.z - 6.9], fov: 42, roll: -0.04, dof: 5 },
    { at: wt(16, "Suddenly"), pos: [CAFE.x - 0.3, 1.5, CAFE.z - 6.3], look: [CAFE.x + 3.3, 1.1, CAFE.z - 6.9], fov: 42, dof: 5 },
    { at: wt(16, "everything"), pos: [CAFE.x - 0.7, 1.55, CAFE.z - 7.4], look: [CAFE.x + 3.3, 1.1, CAFE.z - 6.9], fov: 42, dof: 5 },
  ] },
  // 17 "André pays the bribe, pays for the tower," francs slide to Lustig, André signs the bill of sale
  { at: wt(17), set: "meeting", look: "golden", interior: true, keys: [
    compose(AND, LUS, { side: 28, maxFace: 0.15, fov: 46, dof: 3 }),
    compose(AND, null, { at: wt(17, "pays"), away: [0.3, 0, -1], maxFace: 0.18, roll: 0.04, dof: 5 }),
  ] },
  // 18 "and Lustig is on a train to Austria with seventy thousand francs." sunset, money bag onto the train
  { at: wt(18), set: "train", look: "sunset", keys: [
    { pos: [HOTEL.x - 75, 30, RAIL.z - 70], look: [HOTEL.x - 68, 5, RAIL.z], fov: 46 },
    { at: wt(18, "train"), follow: true, pos: [-2, 2.9, RAIL.z - 9], look: [-6, 2.0, RAIL.z], fov: 42, dof: 6 },
    { at: wt(18, "seventy"), follow: true, pos: [-4.7, 2.85, RAIL.z - 5.2], look: [-6, 2.1, RAIL.z - 1.5], fov: 42, roll: -0.05, dof: 8 },
  ] },
  // 19 "Every day he checks the newspapers. Nothing." dusk, papers flipping faster
  { at: wt(19), set: "train", look: "dusk", keys: [
    { follow: true, pos: [-4.8, 2.85, RAIL.z - 5.0], look: [-6, 2.1, RAIL.z - 1.5], fov: 42, dof: 8 },
    { at: wt(19, "Nothing"), follow: true, pos: [-5.3, 2.8, RAIL.z - 4.4], look: [-6, 2.15, RAIL.z - 1.5], fov: 42, dof: 9 },
  ] },
  // 20 "André is too embarrassed to tell anyone he bought the Eiffel Tower." bill under the rug, the cat stares
  { at: wt(20), set: "andre", look: "cool", interior: true, keys: [
    { pos: v(R.andre, 2.6, 1.6, 2.3), look: v(R.andre, 0.0, 0.9, 0.2), fov: 48, dof: 3 },
    { at: wt(20, "anyone"), pos: v(R.andre, -0.75, 0.95, 2.1), look: v(R.andre, -1.3, 0.4, 0.4), fov: 44, roll: 0.05, dof: 6 },
    { at: wt(20, "Eiffel"), pos: v(R.andre, 1.0, 1.35, 2.7), look: v(R.andre, 0.2, 0.85, 0.3), fov: 40, dof: 8 },
  ] },
  // 21 "So Lustig comes back and does it all again. New dealers. Same speech." train reverses, new faces
  { at: wt(21), set: "train", look: "night", keys: [
    { follow: true, pos: [10, 12, RAIL.z - 34], look: [-10, 3, RAIL.z], fov: 42 },
  ] },
  { at: wt(21, "New"), set: "meeting", look: "nightwarm", interior: true, keys: [
    { pos: v(R.meeting, 4.2, 2.3, -2.9), look: v(R.meeting, -0.6, 1.05, 0.7), fov: 50, dof: 3 },
    compose(LUS, null, { at: wt(21, "Same"), away: [1, 0, -0.4], maxFace: 0.18, dof: 6 }),
  ] },
  // 22 "This time, the buyer goes to the police." blue police lamps flood the hotel, whistle
  { at: wt(22), set: "hotelExt", look: "police", keys: [
    { pos: [HOTEL.x - 10, 2.6, HOTEL.z - 42], look: [HOTEL.x, 1.9, HOTEL.z - 20], fov: 44, roll: -0.06, dof: 4 },
    { at: wt(22, "buyer"), pos: [HOTEL.x - 1.2, 1.9, HOTEL.z - 29.5], look: [HOTEL.x - 1, 1.0, HOTEL.z - 24], fov: 42, dof: 6 },
  ] },
  // 23 "Lustig escapes to America and keeps conning people for years." ship past a skyline, pre-dawn
  { at: wt(23), set: "river", look: "predawn", keys: [
    { pos: [-120, 12, -270], look: [-40, 6, -262], fov: 44 },
    { at: wt(23, "keeps"), pos: [-60, 7, -280], look: [-30, 6.5, -265], fov: 36, dof: 7 },
  ] },
  // 24 "When he finally dies in a prison hospital," quiet ward, rain on the window
  { at: wt(24), set: "hospital", look: "greydawn", interior: true, keys: [
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
    if (k.follow) { const dx = trainX(t); pos.x += dx; look.x += dx; }
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
export const insideRoom = (p: THREE.Vector3) => (Object.keys(ROOMS) as RoomName[]).find((k) => {
  const r = ROOMS[k]; return Math.abs(p.x - r.o.x) < r.w / 2 && Math.abs(p.z - r.o.z) < r.d / 2 && p.y > r.o.y - 0.2 && p.y < r.o.y + r.h;
}) ?? null;

// ---------------- flights between shots ----------------
type Flight = { pts: THREE.Vector3[]; len: number[]; total: number; dur: number; t0: number; a: number; b: number };
const flights = new Map<number, Flight | null>();
/** the flight that lands on shot b (null when b continues in the same place) */
const flightTo = (b: number): Flight | null => {
  if (flights.has(b)) return flights.get(b)!;
  const a = b - 1, sa = SHOTS[a], sb = SHOTS[b];
  if (!sa || sa.set === sb.set) { flights.set(b, null); return null; }
  const ra = roomOf(sa.set), rb = roomOf(sb.set);
  const A0 = frame(a, sb.at), B0 = frame(b, sb.at);
  const mid: THREE.Vector3[] = [];
  const link = ra && rb ? LINKS[`${ra}>${rb}`] : undefined;
  if (link) mid.push(...link);
  else {
    if (ra) mid.push(PORTAL[ra].in.clone(), PORTAL[ra].out.clone());
    if (rb) mid.push(PORTAL[rb].out.clone(), PORTAL[rb].in.clone());
    if (!ra && !rb) { const m = A0.pos.clone().lerp(B0.pos, 0.5); m.y += Math.min(60, A0.pos.distanceTo(B0.pos) * 0.2); mid.push(m); }
    else if (mid.length >= 2) { // outdoors between two openings: arc up a little if they are far apart
      const i = ra ? 1 : -1, j = rb ? (ra ? 2 : 0) : -1;
      if (i >= 0 && j >= 0 && mid[i].distanceTo(mid[j]) > 20) { const m = mid[i].clone().lerp(mid[j], 0.5); m.y += Math.min(40, mid[i].distanceTo(mid[j]) * 0.18); mid.splice(j, 0, m); }
    }
  }
  let pts = [A0.pos, ...mid, B0.pos], len = [0];
  for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + pts[k].distanceTo(pts[k - 1]));
  const total0 = len[len.length - 1], dur = Math.min(1.5, Math.max(0.7, 0.55 + total0 / 140));
  const before = b > 1 ? flightTo(b - 1) : null, t0 = Math.max(sb.at - dur * 0.5, before ? before.t0 + before.dur + 0.1 : -1); // never overlap
  // exact end points: where shot a is when the flight leaves, where shot b is when it lands
  pts = [frame(a, t0).pos, ...mid, frame(b, t0 + dur).pos]; len = [0];
  for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + pts[k].distanceTo(pts[k - 1]));
  const f: Flight = { pts, len, total: len[len.length - 1], dur, t0, a, b };
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
  const u = clamp01((t - f.t0) / f.dur), e = ease(u);
  const A = frame(f.a, f.t0), B = frame(f.b, f.t0 + f.dur);
  const pos = along(f, e), ahead = along(f, Math.min(1, e + 0.03)).sub(along(f, Math.max(0, e - 0.03)));
  const dirA = A.look.clone().sub(A.pos).normalize(), dirB = B.look.clone().sub(B.pos).normalize();
  const tan = ahead.lengthSq() > 1e-8 ? ahead.normalize() : dirB.clone();
  // look: from A's view into the direction of travel (through doors / windows), then settle on B's framing
  const d = e < 0.5 ? slerpDir(dirA, tan, smooth(e / 0.3)) : slerpDir(tan, dirB, smooth((e - 0.6) / 0.4));
  const dist = A.look.distanceTo(A.pos) + (B.look.distanceTo(B.pos) - A.look.distanceTo(A.pos)) * e;
  const look = pos.clone().add(d.normalize().multiplyScalar(dist));
  const inside = insideRoom(pos);
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
  }
  const f = frame(i, t);
  return { ...f, shot: i, mix: 0, next: i, interior: !!SHOTS[i].interior };
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
