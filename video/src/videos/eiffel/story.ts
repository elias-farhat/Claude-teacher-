// Timeline of "The Man Who Sold the Eiffel Tower": everything is timed to words.json (forced alignment of the
// approved narration). Shots start on words; inside a shot the camera makes a new move every ~1.2 s on word
// onsets (17 f, quick start / soft settle, speed peak ~1/3 in) and creeps 0.25 %/f in between. Place changes are
// camera flights (exterior -> exterior: lifted bezier glide) or fast whip pans (into / out of interiors).
import * as THREE from "three";
import WORDS from "./words.json";
import { LookName } from "./looks";
import { ROOM_AT, RoomName } from "./rooms";
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
export const TRAIN_X0 = 160, TRAIN_V = 9; // locomotive nose x at the start of line 18, m/s
export const trainX = (t: number) => {
  const t0 = wt(18), t21 = wt(21), tN = wt(21, "New");
  if (t < t21) return TRAIN_X0 + TRAIN_V * Math.max(-1, t - t0);
  // line 21 gag: the train stops and runs backwards
  const x21 = TRAIN_X0 + TRAIN_V * (t21 - t0), u = Math.min(t, tN) - t21;
  return x21 + TRAIN_V * 0.6 * u - 26 * smooth(u / (tN - t21)) * u;
};

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
    { at: wt(2, "tried"), dur: 8, pos: [LUSTIG_PLATFORM[0] + 2.2, LUSTIG_PLATFORM[1] + 1.55, LUSTIG_PLATFORM[2] - 4.6], look: [LUSTIG_PLATFORM[0], LUSTIG_PLATFORM[1] + 1.5, LUSTIG_PLATFORM[2]], fov: 34, roll: -0.07, dof: 12 },
  ] },
  // 3 "It's Paris, and the tower is rusty, expensive, and half the city thinks it's ugly."
  { at: wt(3), set: "tower", look: "morning", keys: [
    { pos: [165, 48, 250], look: [0, 92, 0], fov: 46 },
    { at: wt(3, "rusty"), pos: [PAINTERS[0] + 9, 33.5, PAINTERS[2] + 5.5], look: [PAINTERS[0], 30.6, PAINTERS[2]], fov: 36, dof: 10 },
    { at: wt(3, "half"), pos: [LADY[0] + 3.2, 1.2, LADY[2] + 7.5], look: [LADY[0] - 1.5, 4.5, LADY[2] - 4], fov: 44, roll: 0.07, dof: 7 },
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
    { at: wt(5, "forger"), pos: v(R.forger, 0.5, 1.45, 0.2), look: v(R.forger, 0, 1.25, -1.6), fov: 36, roll: 0.06, dof: 11 },
    { at: wt(5, "letterhead"), pos: v(R.forger, 0.45, 1.85, 0.25), look: v(R.forger, 0, 1.12, -1.1), fov: 42, dof: 10 },
  ] },
  // 6 "books a suite at the fanciest hotel in Paris," hotel facade, then through the doors to the chandelier
  { at: wt(6), set: "hotelExt", look: "golden", keys: [
    { pos: [HOTEL.x - 20, 10, HOTEL.z - 75], look: [HOTEL.x, 13, HOTEL.z - 15], fov: 44 },
    { at: wt(6, "suite"), pos: [HOTEL.x, 2.6, HOTEL.z - 30], look: [HOTEL.x, 2.6, HOTEL.z - 16], fov: 42 },
  ] },
  { at: wt(6, "fanciest"), set: "lobby", look: "golden", interior: true, keys: [
    { pos: v(R.lobby, 0, 1.7, 7.2), look: v(R.lobby, 0, 4.6, -2), fov: 46 },
    { at: wt(6, "Paris"), pos: v(R.lobby, 2.0, 1.45, -1.6), look: v(R.lobby, 3.0, 1.25, -4.3), fov: 36, roll: -0.05, dof: 10 },
  ] },
  // 7 "and invites the city's biggest scrap dealers to a secret meeting." envelopes into mailboxes, door sign
  { at: wt(7), set: "lobby", look: "golden", interior: true, keys: [
    { pos: v(R.lobby, 4.6, 2.5, -3.6), look: v(R.lobby, 5.85, 2.7, -7.7), fov: 40, dof: 9 },
    { at: wt(7, "scrap"), pos: v(R.lobby, 5.6, 2.8, -5.6), look: v(R.lobby, 6.2, 2.7, -7.8), fov: 36, roll: 0.05, dof: 11 },
  ] },
  { at: wt(7, "secret"), set: "meeting", look: "warm", interior: true, keys: [
    { pos: v(R.meeting, -2.6, 1.7, 1.6), look: v(R.meeting, -3.2, 1.65, 3.9), fov: 38, dof: 10 },
  ] },
  // 8 "The government is quietly selling the tower, he tells them." dealers round the table, blueprint
  { at: wt(8), set: "meeting", look: "warm", interior: true, keys: [
    { pos: v(R.meeting, 3.6, 2.4, 3.0), look: v(R.meeting, 0, 0.9, 0), fov: 44, dof: 6 },
    { at: wt(8, "selling"), pos: v(R.meeting, -0.2, 2.1, 0.9), look: v(R.meeting, -0.6, 0.8, 0), fov: 38, roll: 0.06, dof: 10 },
    { at: wt(8, "tells"), pos: v(R.meeting, -0.6, 1.55, 0.4), look: v(R.meeting, -2.6, 1.45, 0), fov: 34, dof: 12 },
  ] },
  // 9 "Seven thousand tons of iron. Highest bid wins. Not a word to anyone." 7,000 TONS, finger to lips
  { at: wt(9), set: "meeting", look: "warm", interior: true, keys: [
    { pos: v(R.meeting, 0.75, 1.3, 0.95), look: v(R.meeting, 0, 1.25, 0), fov: 34, dof: 12 },
    { at: wt(9, "Highest"), pos: v(R.meeting, 2.6, 1.7, -1.6), look: v(R.meeting, 0.4, 1.3, 1.25), fov: 40, roll: -0.05, dof: 9 },
    { at: wt(9, "Not"), pos: v(R.meeting, -1.2, 1.55, 0.3), look: v(R.meeting, -2.6, 1.5, 0), fov: 32, dof: 13 },
    { at: wt(9, "anyone"), pos: v(R.meeting, 3.4, 2.0, 2.6), look: v(R.meeting, 0, 1.2, 0), fov: 44, dof: 6 },
  ] },
  // 10 "One dealer, André, wants it more than anyone," two-shot across the table, then a medium shot of André
  { at: wt(10), set: "meeting", look: "warm", interior: true, keys: [
    { pos: v(R.meeting, 3.0, 2.1, 2.9), look: v(R.meeting, -0.8, 1.4, 0.3), fov: 46, dof: 4 },
    { at: wt(10, "André"), pos: v(R.meeting, 3.0, 1.65, 2.7), look: v(R.meeting, 1.4, 1.35, 1.25), fov: 38, dof: 8 },
  ] },
  // 11 "but something about this feels off." two-shot: x-ray DOUBT gear over André, Lustig across the table; light cools
  { at: wt(11), set: "meeting", look: "cool", interior: true, keys: [
    { pos: v(R.meeting, 3.3, 2.05, 2.4), look: v(R.meeting, -1.0, 1.45, 0.2), fov: 44, dof: 4 },
  ] },
  // 12 "So how do you calm down a suspicious buyer?" stay wide, then a medium push on Lustig's monocle
  { at: wt(12), set: "meeting", look: "dim", interior: true, keys: [
    { pos: v(R.meeting, 3.8, 2.4, 2.6), look: v(R.meeting, -1.4, 1.35, 0.2), fov: 46, dof: 3 },
    { at: wt(12, "suspicious"), pos: v(R.meeting, 2.6, 2.2, 0.6), look: v(R.meeting, -2.4, 1.3, 0), fov: 40, dof: 5 },
  ] },
  // 13 "You ask him for a bribe." two-shot: palm up across the table to André, a dealer spits his drink
  { at: wt(13), set: "meeting", look: "dim", interior: true, keys: [
    { pos: v(R.meeting, 3.3, 2.05, 2.4), look: v(R.meeting, -1.0, 1.35, 0.3), fov: 42, roll: -0.04, dof: 4 },
  ] },
  // 14 "You see, a fake official would never ask for money under the table." FAKE vs REAL split gag
  { at: wt(14), set: "studio", look: "neutral", interior: true, keys: [
    { pos: v(R.studio, 0, 1.45, 6.4), look: v(R.studio, 0, 1.25, 0), fov: 46 },
    { at: wt(14, "never"), pos: v(R.studio, -0.55, 1.35, 4.4), look: v(R.studio, -0.6, 1.2, 0), fov: 46, dof: 5 },
    { at: wt(14, "money"), pos: v(R.studio, 0.35, 1.4, 5.6), look: v(R.studio, 0.2, 1.25, 0), fov: 46 },
  ] },
  // 15 "But a real, crooked one would." Lustig pockets imaginary money, wiggles eyebrows
  { at: wt(15), set: "meeting", look: "warm", interior: true, keys: [
    { pos: v(R.meeting, 3.3, 2.0, 1.4), look: v(R.meeting, -2.2, 1.25, 0), fov: 40, roll: 0.04, dof: 4 },
    { at: wt(15, "crooked"), pos: v(R.meeting, 1.8, 1.95, 1.0), look: v(R.meeting, -2.4, 1.15, 0), fov: 44, dof: 5 },
  ] },
  // 16 "It's like a waiter whispering that the fish is bad tonight. Suddenly you trust everything else he says."
  { at: wt(16), set: "cafe", look: "cafe", keys: [
    { pos: [CAFE.x - 2.4, 1.5, CAFE.z - 5.2], look: [CAFE.x + 3, 1.2, CAFE.z - 7], fov: 38, dof: 9 },
    { at: wt(16, "fish"), pos: [CAFE.x + 1.0, 1.45, CAFE.z - 6.2], look: [CAFE.x + 3, 1.35, CAFE.z - 7], fov: 32, roll: -0.05, dof: 12 },
    { at: wt(16, "Suddenly"), pos: [CAFE.x - 1.5, 1.4, CAFE.z - 7.6], look: [CAFE.x + 3, 1.15, CAFE.z - 7], fov: 36, dof: 10 },
    { at: wt(16, "everything"), pos: [CAFE.x + 0.4, 1.3, CAFE.z - 7.2], look: [CAFE.x + 3, 1.15, CAFE.z - 7], fov: 32, dof: 12 },
  ] },
  // 17 "André pays the bribe, pays for the tower," francs slide, he signs the bill of sale
  { at: wt(17), set: "meeting", look: "golden", interior: true, keys: [
    { pos: v(R.meeting, 0.6, 1.9, -0.6), look: v(R.meeting, 0.2, 0.8, 0.4), fov: 38, dof: 9 },
    { at: wt(17, "pays", ), pos: v(R.meeting, 1.5, 1.6, -0.5), look: v(R.meeting, 1.4, 1.1, 1.0), fov: 34, roll: 0.05, dof: 12 },
  ] },
  // 18 "and Lustig is on a train to Austria with seventy thousand francs." sunset, money bag onto the train
  { at: wt(18), set: "train", look: "sunset", keys: [
    { pos: [HOTEL.x - 60, 26, RAIL.z - 40], look: [HOTEL.x - 30, 4, RAIL.z], fov: 44 },
    { at: wt(18, "train"), follow: true, pos: [-2, 3.4, RAIL.z - 9], look: [-6, 2.9, RAIL.z], fov: 40, dof: 8 },
    { at: wt(18, "seventy"), follow: true, pos: [-4.6, 3.3, RAIL.z - 4.4], look: [-6, 3.0, RAIL.z - 1.5], fov: 36, roll: -0.06, dof: 12 },
  ] },
  // 19 "Every day he checks the newspapers. Nothing." dusk, papers flipping faster
  { at: wt(19), set: "train", look: "dusk", keys: [
    { follow: true, pos: [-4.8, 3.3, RAIL.z - 4.2], look: [-6, 3.0, RAIL.z - 1.5], fov: 36, dof: 12 },
    { at: wt(19, "Nothing"), follow: true, pos: [-5.4, 3.25, RAIL.z - 3.4], look: [-6, 3.1, RAIL.z - 1.5], fov: 32, dof: 14 },
  ] },
  // 20 "André is too embarrassed to tell anyone he bought the Eiffel Tower." bill under the rug, the cat stares
  { at: wt(20), set: "andre", look: "cool", interior: true, keys: [
    { pos: v(R.andre, 0.4, 1.7, 2.0), look: v(R.andre, -0.2, 0.7, 0.2), fov: 42, dof: 7 },
    { at: wt(20, "anyone"), pos: v(R.andre, -0.4, 0.65, 1.6), look: v(R.andre, -1.3, 0.4, 0.4), fov: 34, roll: 0.06, dof: 12 },
    { at: wt(20, "Eiffel"), pos: v(R.andre, 1.0, 1.35, 2.7), look: v(R.andre, 0.2, 0.85, 0.3), fov: 40, dof: 8 },
  ] },
  // 21 "So Lustig comes back and does it all again. New dealers. Same speech." train reverses, new faces
  { at: wt(21), set: "train", look: "night", keys: [
    { follow: true, pos: [10, 12, RAIL.z - 34], look: [-10, 3, RAIL.z], fov: 42 },
  ] },
  { at: wt(21, "New"), set: "meeting", look: "nightwarm", interior: true, keys: [
    { pos: v(R.meeting, 3.4, 2.3, 2.8), look: v(R.meeting, 0, 1.0, 0), fov: 44, dof: 6 },
    { at: wt(21, "Same"), pos: v(R.meeting, -1.2, 1.55, 0.3), look: v(R.meeting, -2.6, 1.5, 0), fov: 32, dof: 13 },
  ] },
  // 22 "This time, the buyer goes to the police." blue police lamps flood the hotel, whistle
  { at: wt(22), set: "hotelExt", look: "police", keys: [
    { pos: [HOTEL.x - 10, 3.2, HOTEL.z - 42], look: [HOTEL.x, 4.0, HOTEL.z - 20], fov: 42, roll: -0.07, dof: 5 },
    { at: wt(22, "buyer"), pos: [HOTEL.x - 1.2, 1.65, HOTEL.z - 28.6], look: [HOTEL.x - 1, 1.35, HOTEL.z - 24], fov: 38, dof: 10 },
  ] },
  // 23 "Lustig escapes to America and keeps conning people for years." ship past a skyline, pre-dawn
  { at: wt(23), set: "river", look: "predawn", keys: [
    { pos: [-120, 12, -270], look: [-40, 6, -262], fov: 44 },
    { at: wt(23, "keeps"), pos: [-60, 7, -280], look: [-30, 6.5, -265], fov: 36, dof: 7 },
  ] },
  // 24 "When he finally dies in a prison hospital," quiet ward, rain on the window
  { at: wt(24), set: "hospital", look: "greydawn", interior: true, keys: [
    { pos: v(R.hospital, -3.5, 1.9, 2.6), look: v(R.hospital, 1.2, 1.2, -1.6), fov: 44, dof: 5 },
    { at: wt(24, "prison"), pos: v(R.hospital, 0.2, 1.6, 0.8), look: v(R.hospital, 0.6, 1.8, -3.4), fov: 38, dof: 8 },
  ] },
  // 25 "his death certificate lists his job as… apprentice salesman." certificate, sunrise through the window
  { at: wt(25), set: "hospital", look: "sunrise", interior: true, keys: [
    { pos: v(R.hospital, 2.6, 1.55, 0.1), look: v(R.hospital, 2.6, 0.78, -0.5), fov: 34, dof: 9 },
    { at: wt(25, "apprentice"), pos: v(R.hospital, 2.62, 1.42, -0.2), look: v(R.hospital, 2.6, 0.76, -0.5), fov: 34, dof: 11 },
  ] },
];

// ---------------- camera evaluation ----------------
export type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number; dof: number; shot: number; mix: number; next: number };
const MOVE = 17;                                    // frames per in-shot move
const FLY = 0.75, WHIP = 0.3;                       // transition lengths (s): flight / whip pan
const LEADF = 0.3;                                  // share of a transition before the next line's first word
const ease = (x: number) => smooth(Math.pow(clamp01(x), 0.72)); // speed peak ~1/3 into the move
const V = (a: V3) => new THREE.Vector3(...a);
const lerp3 = (a: THREE.Vector3, b: THREE.Vector3, t: number) => a.clone().lerp(b, t);
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
/** framing of shot s at time t (no transitions) */
const frame = (si: number, t: number) => {
  const s = SHOTS[si], end = si + 1 < SHOTS.length ? SHOTS[si + 1].at : VOICE_LEN + 0.3;
  const kt = keyTimes(s, end);
  let j = 0;
  while (j + 1 < kt.length && kt[j + 1].t <= t) j++;
  const at = (q: (typeof kt)[number]) => {
    const k = s.keys[q.k];
    const pos = V(k.pos), look = V(k.look);
    if (q.drift) { // small reframing: slide sideways + push 6 %
      const d = look.clone().sub(pos), side = new THREE.Vector3(-d.z, 0, d.x).normalize().multiplyScalar(d.length() * 0.07 * (q.drift % 2 ? 1 : -1));
      pos.add(side).addScaledVector(d, 0.06 * q.drift);
    }
    if (k.follow) { const dx = trainX(t); pos.x += dx; look.x += dx; }
    return { pos, look, fov: k.fov ?? 40, roll: (k.roll ?? 0) * (q.drift % 2 ? -1 : 1), dof: k.dof ?? 0 };
  };
  const cur = at(kt[j]);
  let pos = cur.pos, look = cur.look, fov = cur.fov, roll = cur.roll, dof = cur.dof;
  if (j > 0 || (s.glide && kt.length > 1)) {
    const prev = j > 0 ? at(kt[j - 1]) : cur;
    if (s.glide) { // continuous flight through the keys (shot 1)
      const n = s.keys.length - 1, T0 = s.at, T1 = (s.keys[n].at ?? end) + 0.25;
      const u = ease((t - T0) / (T1 - T0)) * n, a = Math.min(n - 1, Math.floor(u)), f = u - a;
      const P = (i: number) => V(s.keys[Math.max(0, Math.min(n, i))].pos), Lk = (i: number) => V(s.keys[Math.max(0, Math.min(n, i))].look);
      const cr = (p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, x: number) =>
        p1.clone().multiplyScalar(2).add(p2.clone().sub(p0).multiplyScalar(x)).add(p0.clone().multiplyScalar(2).sub(p1.clone().multiplyScalar(5)).add(p2.clone().multiplyScalar(4)).sub(p3).multiplyScalar(x * x))
          .add(p1.clone().multiplyScalar(3).sub(p0).sub(p2.clone().multiplyScalar(3)).add(p3).multiplyScalar(x * x * x)).multiplyScalar(0.5);
      pos = cr(P(a - 1), P(a), P(a + 1), P(a + 2), f); look = cr(Lk(a - 1), Lk(a), Lk(a + 1), Lk(a + 2), f);
      const k0 = s.keys[a], k1 = s.keys[a + 1];
      fov = (k0.fov ?? 40) + ((k1.fov ?? 40) - (k0.fov ?? 40)) * f; roll = (k0.roll ?? 0) + ((k1.roll ?? 0) - (k0.roll ?? 0)) * f; dof = (k0.dof ?? 0) + ((k1.dof ?? 0) - (k0.dof ?? 0)) * f;
    } else {
      const dur = (s.keys[kt[j].k].dur ?? MOVE) / FPS, u = ease((t - kt[j].t) / dur);
      pos = lerp3(prev.pos, cur.pos, u); look = lerp3(prev.look, cur.look, u);
      fov = prev.fov + (cur.fov - prev.fov) * u; roll = prev.roll + (cur.roll - prev.roll) * u; dof = prev.dof + (cur.dof - prev.dof) * u;
    }
  }
  if (!s.glide) { // creep: push in 0.25 %/frame since the last move landed
    const since = Math.max(0, t - kt[j].t - MOVE / FPS) * FPS;
    pos = lerp3(pos, look, Math.min(0.08, 0.0025 * since));  // capped: long holds must not creep into close-ups
  }
  return { pos, look, fov, roll, dof };
};
const isInterior = (s: Shot) => !!s.interior;
export const shotAt = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= t) i++; return i; };

/** camera at time t, with flights / whips between shots. mix = how far into the transition to `next` (0 = none) */
export const camAt = (t: number): Cam => {
  const i = shotAt(t), n = i + 1;
  // look ahead: are we inside the transition window that lands on the next shot?
  if (n < SHOTS.length) {
    const s1 = SHOTS[n], sameSet = SHOTS[i].set === s1.set;
    const whip = isInterior(SHOTS[i]) || isInterior(s1);
    const L = sameSet ? 0 : whip ? WHIP : FLY;
    if (L && t > s1.at - L * LEADF) {
      const u = clamp01((t - (s1.at - L * LEADF)) / L);
      return transition(i, n, t, u, whip);
    }
  }
  if (i > 0) { // finishing a transition that started in the previous shot
    const s0 = SHOTS[i - 1], s1 = SHOTS[i];
    const whip = isInterior(s0) || isInterior(s1), L = s0.set === s1.set ? 0 : whip ? WHIP : FLY;
    if (L && t < s1.at + L * (1 - LEADF)) return transition(i - 1, i, t, clamp01((t - (s1.at - L * LEADF)) / L), whip);
  }
  const f = frame(i, t);
  return { ...f, shot: i, mix: 0, next: i };
};
const transition = (a: number, b: number, t: number, u: number, whip: boolean): Cam => {
  const T0 = SHOTS[b].at - (whip ? WHIP : FLY) * LEADF;
  const A = frame(a, Math.min(t, T0)), B = frame(b, Math.max(t, SHOTS[b].at));
  if (whip) { // fast pan away from A, cut at the blur peak, pan into B
    const side = (b % 2 ? 1 : -1) * 1.15;
    const pick = u < 0.5 ? A : B, k = u < 0.5 ? smooth(u * 2) : 1 - smooth((u - 0.5) * 2);
    const d = pick.look.clone().sub(pick.pos), yaw = side * k;
    const rot = new THREE.Vector3(d.x * Math.cos(yaw) - d.z * Math.sin(yaw), d.y, d.x * Math.sin(yaw) + d.z * Math.cos(yaw));
    return { pos: pick.pos, look: pick.pos.clone().add(rot), fov: pick.fov, roll: pick.roll, dof: pick.dof * (1 - k), shot: u < 0.5 ? a : b, mix: u, next: b };
  }
  // flight: ~10 f accelerate, fast glide, ~10 f settle, along a lifted bezier
  const e = smooth(u), lift = Math.min(80, A.pos.distanceTo(B.pos) * 0.22);
  const c1 = A.pos.clone().lerp(B.pos, 0.3).add(new THREE.Vector3(0, lift, 0)), c2 = A.pos.clone().lerp(B.pos, 0.7).add(new THREE.Vector3(0, lift, 0));
  const pos = A.pos.clone().multiplyScalar((1 - e) ** 3).add(c1.multiplyScalar(3 * (1 - e) ** 2 * e)).add(c2.multiplyScalar(3 * (1 - e) * e * e)).add(B.pos.clone().multiplyScalar(e ** 3));
  const look = lerp3(A.look, B.look, smooth(clamp01((u - 0.15) / 0.7)));
  return { pos, look, fov: A.fov + (B.fov - A.fov) * e, roll: A.roll + (B.roll - A.roll) * e, dof: Math.min(A.dof, B.dof) * Math.abs(1 - 2 * e), shot: e < 0.5 ? a : b, mix: u, next: b };
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
