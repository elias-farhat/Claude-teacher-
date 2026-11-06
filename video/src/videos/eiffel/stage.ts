// Who and what is on screen at time t: character cards (cast.ts Actors) and label / effect cards (Fx), plus
// scene-driven practical lights (police lamps). Every reaction lands 0-3 frames before its word (wt()).
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { Pen, townsfolk, fxSplash, fxRing } from "../bridge/toon";
import { V } from "../bridge/build";
import { wt, lineEnd, clamp01, smooth, Cam, SHOTS, LUSTIG_PLATFORM, PAINTERS, LADY, trainX, V3 } from "./story";
export { trainX };
import { CAFE, HOTEL, RAIL, Lamp } from "./paris";
import { ROOM_AT } from "./rooms";
import { POLICE as POLICE_COL } from "./looks";
import {
  person, personKey, Look, Extra, LUSTIG, ANDRE, ANDRE_BARE, FORGER, BELLBOY, LADY as LADY_O, PAINTER, POLICE, WAITER, DEALERS,
  cat, flake, painterBoard,
} from "./people";
import * as LB from "./labels";
import type { Outfit } from "../bridge/toon";

type C3 = [number, number, number];
export type FxCard = FxPlace & { yaw?: number };
export type Stage = { places: Place[]; fx: FxCard[]; lights: (Lamp & { col: C3 })[] };
const LEAD = 2 / 30; // reactions land ~2 frames before the word
const HI: [number, number, number] = [600, 1000, 1];

/** 4-frame blinks every 0.5-2.3 s, deterministic per character */
const blinkAt = (t: number, seed: number) => {
  const per = 0.5 + ((Math.sin(seed * 91.7) + 1) / 2) * 1.8, ph = ((t + seed * 0.37) % per) / per;
  const b = ph * per * 30; return b < 4 ? [0.6, 1, 1, 0.6][Math.floor(b)] : 0;
};
const SEAT = 0.4; // sit-mode cards have their hips at the soles: lift them onto a chair seat
const P = (name: string, o: Outfit, l: Look, x: Extra, at: V3, opt: { scale?: number; size?: [number, number, number]; yaw?: number; mirror?: boolean; noSeat?: boolean } = {}): Place =>
  ({ key: personKey(name, l, x), draw: person(o, l, x), x: at[0], y: at[1] + (l.mode === "sit" && !opt.noSeat ? SEAT : 0), z: at[2], size: opt.size ?? HI, scale: opt.scale, yaw: opt.yaw, mirror: opt.mirror });
/** upper body only (cut below the waist, for train windows) */
const upper = (draw: (p: Pen) => void, cut = 640) => (p: Pen) => {
  p.g.save(); p.g.beginPath(); p.g.rect(0, 0, 600, cut); p.g.clip(); draw(p); p.g.restore();
};
const card = (key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3, w: number, h: number, o: Partial<FxCard> = {}): FxCard =>
  ({ key, cw, ch, draw, x: at[0], y: at[1], z: at[2], w, h, ...o });
const q = (x: number, n: number) => Math.round(x * n) / n;
/** 0 -> 1 -> 0 bump lasting `len` s that starts at each time (slow, eased gestures on words instead of fast wobbles) */
const bumps = (t: number, times: number[], len = 0.45) => times.reduce((a, t0) => Math.max(a, t >= t0 && t < t0 + len ? Math.sin((Math.PI * (t - t0)) / len) ** 2 : 0), 0);
const after = (t: number, ln: number, w: number | string) => t >= wt(ln, w) - LEAD;

// ---------------- per-set casts ----------------
const tower = (t: number, s: Stage) => {
  // SOLD tag: swings on its string; flips to SOLD AGAIN? on "came"
  const flipT = wt(2, "came") - LEAD, u = clamp01((t - flipT) * 30 / 8), again = u >= 0.5;
  const sw = 0.18 * Math.sin(t * 3.1) + 0.05 * Math.sin(t * 7.3);
  s.fx.push(card(`tag${again ? 1 : 0}`, 400, 560, (p) => LB.tag(p, again), [22.55 + Math.sin(sw) * 0.38, 50.8 - 0.38, 41.4], 0.55 * Math.max(0.08, Math.abs(Math.cos(u * Math.PI))), 0.77, { rot: sw }));
  // Lustig on the 1st floor: smug, then winks + tips his hat on "tried"
  const wink = after(t, 2, "tried");
  s.places.push(P("lustig", LUSTIG, { expr: wink ? "wink" : "smug", gest: wink ? "tip" : "lean", k: wink ? clamp01((t - wt(2, "tried")) * 4) : 0, blink: wink ? 0 : blinkAt(t, 1) }, { monocle: true }, LUSTIG_PLATFORM));
  // painters on a board on the south-east leg
  if (t > wt(2, "again") - 0.5) {
    s.fx.push(card("board", 1000, 500, painterBoard, [PAINTERS[0] + 0.3, PAINTERS[1] + 0.9, PAINTERS[2]], 3.4, 1.7));
    s.places.push(P("painter1", PAINTER, { expr: "whistle", gest: "point", seed: 5 }, {}, [PAINTERS[0] + 0.5, PAINTERS[1] - 0.05, PAINTERS[2] - 0.7], { size: [300, 500, 0.5] }));
    s.places.push(P("painter2", PAINTER, { expr: "nervous", gest: "stamp", k: q(0.5 + 0.5 * Math.sin(t * 2.2), 20), seed: 9 }, { sweat: true }, [PAINTERS[0] + 0.5, PAINTERS[1] - 0.05, PAINTERS[2] + 0.8], { size: [300, 500, 0.5] }));
  }
  // rust flake: falls from the painters' leg onto the lady's hat by "ugly"
  const f0 = wt(3, "expensive"), f1 = wt(3, "ugly") - 0.1;
  if (t > f0 && t < lineEnd(3) + 2) {
    const k = clamp01((t - f0) / (f1 - f0)), y = 30 + (LADY[1] + 2.25 - 30) * k;
    s.fx.push(card("flake", 120, 120, flake, [PAINTERS[0] + (LADY[0] - PAINTERS[0]) * k + 0.3 * Math.sin(t * 5), y, PAINTERS[2] + (LADY[2] - PAINTERS[2]) * k], 0.35, 0.35, { rot: t * 4 }));
  }
  if (t > wt(2) + 0.5) {
    const scowl = after(t, 3, "thinks");
    s.places.push(P("lady", LADY_O, { expr: scowl ? "stern" : "smile_closed", headTilt: scowl ? -8 : 0, blink: blinkAt(t, 4) }, {}, LADY));
    // strollers on the tower square
    for (let i = 0; i < 6; i++) {
      const x = -40 + ((t * 1.3 + i * 17) % 80), z = 20 + i * 9;
      s.places.push(P(`walker${i}`, townsfolk(i), { mode: "stroll", phase: q((t * 2 + i * 0.3) % 1, 12), seed: i + 11 }, {}, [x, 0, z], { size: [300, 500, 0.5] }));
    }
  }
};

const cafe = (t: number, s: Stage) => {
  const o = CAFE;
  if (t < wt(16) - 1) {
    // line 4: Lustig behind the paper; it lowers on "morning", he smiles on "smiles"
    const low = smooth((t - (wt(4, "morning") - LEAD)) / 0.5), smiles = after(t, 4, "smiles");
    s.places.push(P("lustigCafe", LUSTIG, { mode: "sit", expr: smiles ? "smug" : "neutral", gest: "paper", blink: smiles ? 0 : blinkAt(t, 1) }, { monocle: true }, [o.x + 3, 0, o.z]));
    s.fx.push(card("paper", 640, 480, LB.newspaper, [o.x + 2.55, 1.2 - 0.42 * low, o.z], 0.64, 0.48, { rot: -0.25 * low }));
    s.places.push(P("waiter", WAITER, { expr: "neutral", blink: blinkAt(t, 7) }, {}, [o.x + 6, 0, o.z - 6.5], { size: [300, 500, 0.5] }));
    for (let i = 0; i < 2; i++) s.places.push(P(`diner${i}`, townsfolk(i + 2), { mode: "sit", expr: "smile_closed", seed: 20 + i }, {}, [o.x - 1.5, 0, o.z + (i ? 3.5 : -3.5)], { size: [300, 500, 0.5] }));
  } else {
    // line 16: the waiter whispers behind a menu; the diner nods
    const nod = after(t, 16, "Suddenly");
    s.places.push(P("waiterW", WAITER, { expr: "nervous", gest: "paper", facing: -1 }, {}, [o.x + 3.6, 0, o.z - 6.2]));
    s.fx.push(card("menu", 300, 400, (p) => { p.poly([[20, 20], [280, 20], [280, 380], [20, 380]], "#7a2e2e", 8); LB.sign(p, "MENU", "#7a2e2e"); }, [o.x + 3.3, 1.3, o.z - 6.4], 0.3, 0.4));
    s.places.push(P("diner", DEALERS[1], { mode: "sit", expr: nod ? "smile" : "shock", headTilt: 5 * bumps(t, [wt(16, "trust") - LEAD, wt(16, "everything") - LEAD], 0.5) }, {}, [o.x + 3, 0, o.z - 7.6]));
  }
};

const forger = (t: number, s: Stage) => {
  const o = ROOM_AT.forger, stampK = bumps(t, [wt(5, "forger"), wt(5, "government"), wt(5, "letterhead")].map((x) => x - 0.2), 0.35); // stamps land on the thud SFX
  s.places.push(P("forger", FORGER, { expr: "smile_closed", gest: "stamp", k: stampK, blink: blinkAt(t, 3) }, { stampTool: true, inkNose: true }, [o.x, 0, o.z - 1.7]));
  s.places.push(P("lustigF", LUSTIG, { expr: "smug", gest: "palm", blink: blinkAt(t, 1) }, { monocle: true, coin: true }, [o.x + 1.15, 0, o.z - 1.25]));
  s.fx.push(card("letterhead", 480, 640, LB.letterhead, [o.x, 0.845, o.z - 0.88], 0.36, 0.48, { flat: true, rot: 0.08 }));
};

const lobby = (t: number, s: Stage) => {
  const o = ROOM_AT.lobby;
  const tip = after(t, 6, "Paris");
  s.places.push(P("lustigL", LUSTIG, { expr: tip ? "grin" : "smug", gest: tip ? "palm" : "hang", blink: blinkAt(t, 1) }, { monocle: true, coin: tip }, [o.x + 3.6, 0, o.z + 5.0]));
  s.places.push(P("bellboy", BELLBOY, { expr: tip ? "grin" : "neutral", blink: blinkAt(t, 6) }, {}, [o.x + 2.3, 0, o.z + 4.6]));
  // line 7: five envelopes fly into the mailboxes
  const t0 = wt(7), t1 = wt(7, "secret");
  if (t > t0 - 0.2 && t < t1 + 0.3) for (let i = 0; i < 5; i++) {
    const k = clamp01((t - t0 - i * 0.38) / 0.75), to = V(o.x + 3.05 + (i * 3 % 8) * 0.7, 1.8 + (i % 4) * 0.62, o.z + 7.6);
    const from = V(o.x + 3.4, 1.5, o.z + 4.6), p = from.lerp(to, smooth(k));
    if (k > 0 && k < 1) s.fx.push(card("envelope", 300, 200, LB.envelope, [p.x, p.y + 0.6 * Math.sin(k * Math.PI), p.z], 0.45, 0.3, { rot: (1 - k) * 2.5 }));
  }
};

const MEET_SEATS: V3[] = [-2.0, -1.2, -0.4, 0.4, 1.2].map((x) => [x, 0, 1.25] as V3); // one row on the far side (André at 2.0); the near side stays open to the camera
const meeting = (t: number, s: Stage, si: number, cam: THREE.Camera) => {
  const o = ROOM_AT.meeting, at = (d: V3): V3 => [o.x + d[0], o.y + d[1], o.z + d[2]];
  const ln = lineOf(t), newFaces = t >= wt(21, "New") - 0.3;
  const lips = (ln === 9 && after(t, 9, "Not")) || (ln === 21 && after(t, 21, "Same"));
  const palm = ln === 13 || (t > wt(13) - 0.1 && t < wt(14) + 0.6), pocket = ln === 15, cool = ln === 11 || ln === 12;
  const lustigExpr = ln === 12 ? "smug" : palm ? "smug" : pocket ? (after(t, 15, "crooked") && !after(t, 15, "would") ? "wink" : "smug") : lips ? "smug" : "grin";
  s.places.push(P("lustigM", LUSTIG, { expr: lustigExpr, gest: lips ? "lips" : palm ? "palm" : pocket ? "pocket" : ln === 8 ? "palm" : "hang", blink: lips || ln === 12 ? 0 : blinkAt(t, 1) }, { monocle: true }, at([-3.0, 0, 0])));
  // dealers (new faces on line 21): copy the finger-to-lips on "anyone"
  const copy = (ln === 9 && after(t, 9, "anyone")) || (ln === 21 && after(t, 21, "Same") && t > wt(21, "Same") + 0.4);
  // line 7 "secret meeting" -> line 8: the dealers walk in through the CONFIDENTIAL doorway, one by one, and sit
  const arrive0 = wt(7, "secret") - 0.2;
  MEET_SEATS.forEach((d, i) => {
    const out = newFaces ? townsfolk(i + 6) : DEALERS[i];
    const spit = i === 2 && t > wt(13) && t < wt(14) + 0.6;   // the dealer facing the camera across the table
    const ta = arrive0 + i * 0.32, walking = t >= arrive0 - 1 && t < ta + 1.5 && ln <= 8;
    if (walking) {
      if (t < ta) return;                  // still in the corridor
      const u = clamp01((t - ta) / 1.5), door = [-3.2, 0, 4.2], mid = [-3.0, 0, 2.3], seat = [d[0], 0, d[2] + 0.55];
      const pth = u < 0.45 ? [door, mid, u / 0.45] : [mid, seat, (u - 0.45) / 0.55];
      const a = pth[0] as number[], b = pth[1] as number[], k = smooth(pth[2] as number);
      s.places.push(P(`dealerW${i}`, out, { mode: "stroll", expr: i % 2 ? "grin" : "smile_closed", phase: q((t * 2 + i * 0.3) % 1, 12), seed: 30 + i }, {}, at([a[0] + (b[0] - a[0]) * k, 0, a[2] + (b[2] - a[2]) * k]), { size: [300, 500, 0.5] }));
      return;
    }
    s.places.push(P(`dealer${newFaces ? "N" : ""}${i}`, out, { mode: "sit", expr: spit ? "shock" : copy ? "smug" : cool ? "neutral" : i % 2 ? "grin" : "smile_closed", gest: copy ? "lips" : "hang", seed: 30 + i, blink: copy ? 0 : blinkAt(t, 10 + i) }, {}, at(d), { size: [300, 500, 0.5] }));
    if (spit) { const u = clamp01((t - wt(13, "bribe") + 0.1) / 0.55); if (u > 0 && u < 1) s.fx.push(card(`splash${q(u, 12)}`, 600, 600, (p) => fxSplash(p, q(u, 12)), at([d[0], 1.3, d[2] - 0.35]), 0.75, 0.75)); }
  });
  // line 13: Lustig's arm slides across the table, palm up, toward André (a stretchy cartoon arm)
  if (t > wt(13) - 0.1 && t < wt(14) + 0.6) {
    // upright card from Lustig's shoulder toward André, rotated to the on-screen direction, stretching with `reach`
    const reach = q(smooth(clamp01((t - wt(13) + 0.05) / 0.7)), 12);
    const sh = new THREE.Vector3(...at([-2.85, 1.2, 0.15])), tgt = new THREE.Vector3(...at([1.2, 0.88, 0.75]));  // palm lands on the baize in front of André
    const hand = sh.clone().lerp(tgt, 0.1 + 0.9 * reach), mid = sh.clone().lerp(hand, 0.5);
    const a2 = sh.clone().project(cam), b2 = hand.clone().project(cam);
    const rot = -Math.atan2((b2.y - a2.y) * 16, (b2.x - a2.x) * 9);  // screen angle (portrait aspect; card rotation runs the other way)
    const len = sh.distanceTo(hand);
    if (reach > 0) s.fx.push(card(`arm${reach}`, Math.round(200 + 900 * reach), 160, (p) => {
      const W = 200 + 900 * reach; p.line([[10, 80], [W - 70, 80]], "#6a3c8c", 26);           // purple sleeve
      p.ell(W - 45, 86, 38, 22, "#ffe2c2", 9); p.stroke([[W - 80, 70], [W - 10, 70]], 7);       // palm up + thumb line
    }, [mid.x, mid.y, mid.z], len, len * (160 / (200 + 900 * reach)), { rot }));
  }
  // the door sign while the dealers arrive
  if (ln === 7 || ln === 8) s.fx.push(card("confidential", 640, 200, (p) => LB.sign(p, "CONFIDENTIAL", "#6a2a2a"), at([-3.2, 2.55, 3.95]), 0.8, 0.25, { yaw: Math.PI }));
  // André: clutches his cap (line 10), doubt (11), signs + pays (17)
  const andreLook: Look = ln === 10 ? { mode: "sit", expr: "smile", gest: "clutch", blink: blinkAt(t, 2) } : ln === 11 ? { mode: "sit", expr: "nervous", gest: "clutch" }
    : ln === 17 ? { mode: "sit", expr: "smile_closed", gest: "sign", k: t } : { mode: "sit", expr: "neutral", blink: blinkAt(t, 2) };
  if (!newFaces) s.places.push(P("andreM", ln === 10 || ln === 11 ? ANDRE_BARE : ANDRE, andreLook, { glasses: true, sweat: ln === 11, capInHands: ln === 10 || ln === 11 ? ANDRE.cap : undefined, pen: ln === 17 }, at([2.0, 0, 1.25])));
  // the blueprint, the scale model's 7,000 TONS tag, x-ray doubt, francs, bill of sale
  s.fx.push(card("blueprint", 640, 900, LB.blueprint, at([-0.55, 0.805, 0]), 0.62, 0.86, { flat: true, rot: 1.5 }));
  if (ln >= 9) s.fx.push(card("tons", 640, 320, LB.tonsStamp, at([0.2, 1.3, 0.2]), 0.5, 0.25, { rot: 0.05 * Math.sin(t * 2) }));
  if (ln === 11) s.fx.push(card(`xray${q((t * 2) % (Math.PI * 2), 10)}`, 500, 500, (p) => LB.xrayDoubt(p, q((t * 2) % (Math.PI * 2), 10)), at([2.0, 1.72, 1.05]), 0.42, 0.42));
  if (ln === 17) {
    const u = smooth(clamp01((t - wt(17) - 0.1) / 0.8));
    s.fx.push(card("francs", 300, 200, LB.francs, at([1.8 - 3.9 * u, 0.82, 0.55 - 0.55 * u]), 0.36, 0.24, { flat: true, rot: 0.4 }));
    s.fx.push(card("bill", 520, 680, LB.billOfSale, at([1.85, 0.81, 0.5]), 0.34, 0.44, { flat: true, rot: Math.PI }));
  }
  void si;
};

const studio = (t: number, s: Stage) => {
  const o = ROOM_AT.studio, at = (d: V3): V3 => [o.x + d[0], o.y + d[1], o.z + d[2]];
  const fake: Outfit = { ...DEALERS[0], jacket: "#4a6a9a" }, real: Outfit = { ...DEALERS[3], jacket: "#3a3a3a" };
  s.places.push(P("fake", fake, { expr: "smile_closed", gest: "hang", blink: blinkAt(t, 5) }, {}, at([-0.75, 0.4, 1.6])));
  s.places.push(P("real", real, { expr: "smug", gest: "palm", blink: blinkAt(t, 8) }, { coin: true }, at([0.75, 0.4, 1.6])));
  s.fx.push(card("halo", 600, 600, (p) => fxRing(p, 0.5), at([-0.75, 2.95, 1.6]), 0.6, 0.2));
  s.fx.push(card("plFake", 640, 160, (p) => LB.plaque(p, "FAKE", "#3f6fb5"), at([-0.75, 0.62, 1.05]), 0.7, 0.18));
  s.fx.push(card("plReal", 640, 160, (p) => LB.plaque(p, "REAL", "#b8262e"), at([0.75, 0.62, 1.05]), 0.7, 0.18));
};

const train = (t: number, s: Stage) => {
  const x = trainX(t), z = RAIL.z - 1.55, ln = lineOf(t);
  if (ln === 18 && t < wt(18, "train")) { // the money bag flies from the hotel window onto the train
    const u = smooth(clamp01((t - wt(18)) / (wt(18, "train") - wt(18)))), from = V(HOTEL.x - 30, 18, HOTEL.z - 15), to = V(x - 6, 3.4, RAIL.z);
    const p = from.lerp(to, u); s.fx.push(card("bag", 300, 360, LB.moneyBag, [p.x, p.y + 8 * Math.sin(u * Math.PI), p.z], 0.9, 1.08, { rot: u * 6 }));
  }
  const reading = ln === 19, flip = q((t * (2 + (t - wt(19)) * 3)) % 1, 4);
  const l: Look = { expr: reading ? (after(t, 19, "Nothing") ? "dazed" : "neutral") : "grin", gest: reading ? "paper" : "tip", k: 0.6, blink: blinkAt(t, 1) };
  s.places.push({ key: "up|" + personKey("lustigT", l, { monocle: true }), draw: upper(person(LUSTIG, l, { monocle: true }), 600), x: x - 6, y: 1.1, z, size: HI });
  if (ln === 18 && t >= wt(18, "train")) s.fx.push(card("ticket", 640, 300, LB.ticket, [x - 5.55, 3.3, z - 0.1], 0.46, 0.22, { rot: -0.1 }));
  if (ln === 18 && t >= wt(18, "seventy")) s.fx.push(card("bagT", 300, 360, LB.moneyBag, [x - 6.45, 2.95, z - 0.1], 0.36, 0.43));
  if (reading) s.fx.push(card(`paperT${flip}`, 640, 480, (p) => { LB.newspaper(p); if (flip > 0.4) { p.g.fillStyle = "rgba(241,234,217,0.9)"; p.g.fillRect(40, 120, 560, 120); } }, [x - 5.7, 3.0, z - 0.15], 0.5, 0.38, { rot: 0.04 }));
};

const andre = (t: number, s: Stage) => {
  const o = ROOM_AT.andre, at = (d: V3): V3 => [o.x + d[0], o.y + d[1], o.z + d[2]];
  s.places.push(P("andreH", ANDRE_BARE, { expr: "nervous", gest: "clutch", tilt: 10 }, { glasses: true, sweat: true }, at([0.2, 0, 0.3])));
  s.fx.push(card("billRug", 520, 680, LB.billOfSale, at([0.75, 0.045, 0.55]), 0.34, 0.44, { flat: true, rot: 0.7 }));
  const stare = clamp01((t - wt(20, "anyone")) * 2);
  s.fx.push(card(`cat${q(stare, 4)}`, 600, 600, (p) => cat(p, q(stare, 4)), at([-1.3, 0.24, 0.4]), 0.48, 0.48));
};

const hotelNight = (t: number, s: Stage) => {
  const x0 = HOTEL.x, z0 = HOTEL.z - 24;
  for (let i = 0; i < 3; i++) s.places.push(P(`police${i}`, POLICE, { expr: i === 1 ? "whistle" : "stern", gest: i === 0 ? "point" : "hang", blink: blinkAt(t, 40 + i), seed: 50 + i }, { whistle: i === 1 }, [x0 - 4 + i * 2.6, 0, z0 - (i % 2) * 1.2]));
  s.places.push(P("andreP", ANDRE, { expr: "stern", gest: "point" }, { glasses: true }, [x0 + 4.2, 0, z0 + 0.6]));
  const pulse = (k: number) => 0.55 + 0.45 * Math.max(0, Math.sin(t * 7 + k * 2.1));
  s.lights.push({ p: V(x0 - 9, 2.4, z0 + 1), k: 2.2 * pulse(0), col: POLICE_COL }, { p: V(x0 + 8, 2.4, z0 + 1.5), k: 2.2 * pulse(1), col: POLICE_COL }, { p: V(x0 - 1, 3.4, z0 + 4), k: 1.6 * pulse(2), col: POLICE_COL });
};

const river = (t: number, s: Stage) => {
  const x = -60 + 4 * (t - wt(23));
  s.places.push(P("lustigShip", LUSTIG, { expr: "grin", gest: "tip", k: q(0.5 + 0.5 * Math.sin(t * 3), 20) }, { monocle: true }, [x + 4, 0.5, -263]));
};

const hospital = (t: number, s: Stage) => {
  const o = ROOM_AT.hospital, at = (d: V3): V3 => [o.x + d[0], o.y + d[1], o.z + d[2]];
  const old: Outfit = { ...LUSTIG, hat: "hair", hair: "#d8d4cc", moustache: "#d8d4cc", jacket: "#e8eef0", pants: "#e8eef0" };
  s.places.push(P("lustigOld", old, { mode: "sit", expr: "smile_closed" }, { monocle: true }, at([1.5, 0.55, 1.5]), { noSeat: true }));
  s.fx.push(card("cert", 560, 760, LB.certificate, at([2.6, 0.755, 0.5]), 0.42, 0.57, { flat: true, rot: 0.06 }));
  if (lineOf(t) === 24) for (let i = 0; i < 10; i++) { // rain streaks on the window
    const y = 3.4 - ((t * 2.2 + i * 0.37) % 2.6);
    s.fx.push(card("rain", 64, 256, (p) => p.stroke([[32, 10], [28, 246]], 6, "rgba(220,235,255,0.55)"), at([-0.5 + i * 0.22, y, -3.45]), 0.04, 0.3, { soft: true, yaw: 0 }));
  }
};

const lineOf = (t: number) => { let ln = 1; for (let k = 1; k <= 25; k++) if (t >= wt(k) - 0.35) ln = k; return ln; };

/** everything on stage at time t (both ends of a flight are dressed while it flies) */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  const s: Stage = { places: [], fx: [], lights: [] };
  const sets = new Set([SHOTS[c.shot].set, SHOTS[c.next].set]);
  for (const set of sets) {
    if (set === "tower") tower(t, s);
    else if (set === "cafe") cafe(t, s);
    else if (set === "forger") forger(t, s);
    else if (set === "lobby") lobby(t, s);
    else if (set === "meeting") meeting(t, s, c.shot, cam);
    else if (set === "studio") studio(t, s);
    else if (set === "train") train(t, s);
    else if (set === "andre") andre(t, s);
    else if (set === "hotelExt") { if (lineOf(t) >= 22) hotelNight(t, s); }
    else if (set === "river") river(t, s);
    else if (set === "hospital") hospital(t, s);
  }
  void cam;
  return s;
};
