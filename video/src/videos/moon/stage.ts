// Who and what is on screen at time t in the Moon Hoax short: character cards, prop / label cards, and practical lights
// that keep night subjects lit (CLAUDE.md 11). Reactions land 0-2 frames before their word. CLAUDE.md 10: whoever the
// narration names doing something is on screen doing it (the newsboy selling, Locke writing, Herschel at his scope, the
// rival exposing, Herschel getting letters, Locke signing).
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { Pen } from "../bridge/toon";
import { V } from "../bridge/build";
import { wt, clamp01, smooth, Cam, V3, shipX, carryAt, lineEnd as lineEndW } from "./story";
import { EYEPIECE, MOON, MOON_TOP, EUROPE, GARDEN, BEACH, SHIP_LINE, TUBE_END } from "./layout";
import { PORTRAIT, CHART } from "./rooms";
import { CHIMNEYS } from "./backdrop";
import type { Lamp } from "../rats/hanoi";
import { LAMP } from "./looks";
import { person, personKey, Look, Extra, NEWSBOY, EDITOR, LOCKE, HERSCHEL, HERSCHEL_BEACH, RIVAL, BATFOLK, KID, CITIZEN, goat } from "./people";
import * as LB from "./labels";
import type { Outfit } from "../bridge/toon";

type C3 = [number, number, number];
export type FxCard = FxPlace & { yaw?: number };
export type Stage = { places: Place[]; fx: FxCard[]; lights: (Lamp & { col: C3 })[] };
const LEAD = 2 / 30;
const HI: [number, number, number] = [600, 1000, 1], LO: [number, number, number] = [300, 500, 0.5];
const blinkAt = (t: number, seed: number) => {
  const per = 0.5 + ((Math.sin(seed * 91.7) + 1) / 2) * 1.8, ph = ((t + seed * 0.37) % per) / per;
  const b = ph * per * 30; return b < 4 ? [0.6, 1, 1, 0.6][Math.floor(b)] : 0;
};
const SEAT = 0.4;
const P = (name: string, o: Outfit, l: Look, x: Extra, at: V3 | THREE.Vector3, opt: { scale?: number; size?: [number, number, number] } = {}): Place => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  return { key: personKey(name, l, x), draw: person(o, l, x), x: a.x, y: a.y + (l.mode === "sit" ? SEAT : 0), z: a.z, size: opt.size ?? HI, scale: opt.scale, tall: o.hat === "tophat" ? 0.3 : 0, rig: { o, l, x } };
};
const card = (key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3 | THREE.Vector3, w: number, h: number, o: Partial<FxCard> = {}): FxCard => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  return { key, cw, ch, draw, x: a.x, y: a.y, z: a.z, w, h, ...o };
};
const q = (x: number, n: number) => Math.round(x * n) / n;
const after = (t: number, ln: number, w: string | number) => t >= wt(ln, w) - LEAD;
const between = (t: number, a: number, b: number) => t >= a && t < b;
const warm = (p: THREE.Vector3, k: number) => ({ p, k, col: LAMP });
// small FX (look pass: the cast acts, the world reacts): dust puffs, steam wisps, sparkle glints, paper sheets, an
// impact burst. Each drawer is keyed by its quantised phase, so the card cache stays small.
const puff = (u: number, col = "rgba(214,206,236,") => (p: Pen) => { const a = (1 - u) * 0.8; for (let k = 0; k < 4; k++) p.ell(60 + k * 60, 150 - 30 * u - (k % 2) * 20, 30 + 40 * u, 22 + 26 * u, `${col}${a.toFixed(2)})`, 0); };
const wisp = (u: number) => (p: Pen) => { const a = Math.sin(u * Math.PI) * 0.7; p.stroke([[60, 300], [90 + 25 * Math.sin(u * 6), 220], [55 + 20 * Math.sin(u * 6 + 2), 130], [85, 40]], 14, `rgba(255,255,255,${a.toFixed(2)})`); };
const glint = (u: number) => (p: Pen) => { const r = 40 + 70 * u; p.poly([[150, 150 - r], [162, 138], [150 + r, 150], [162, 162], [150, 150 + r], [138, 162], [150 - r, 150], [138, 138]], "#fff7d6", 0); p.ell(150, 150, 18 + 10 * u, 18 + 10 * u, "#ffffff", 0); };
const sheet = (k: number) => (p: Pen) => { p.poly([[10, 10], [190, 18], [182, 250], [16, 242]], "#f6f0e2", 6); for (let j = 0; j < 7; j++) p.stroke([[34, 50 + j * 26], [160 - (j * 13 + k * 7) % 40, 52 + j * 26]], 5, "#5a5266"); };
const burst = (u: number) => (p: Pen) => { for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, r0 = 60 + 40 * u, r1 = r0 + 70 * (1 - u); p.stroke([[200 + Math.cos(a) * r0, 200 + Math.sin(a) * r0], [200 + Math.cos(a) * r1, 200 + Math.sin(a) * r1]], 12 * (1 - u) + 2, "#ffe27a"); } };
const M = (dx: number, dy: number, dz: number) => V(MOON.c.x + dx, MOON_TOP + dy, MOON.c.z + dz);
const HERSCHEL_AT = V(EYEPIECE.x + 1.2, 7.75, EYEPIECE.z + 0.9);

// ---------------- constant background life (CLAUDE.md 12), named bg* so the QA never counts it ----------------
const smokeCard = (p: Pen) => { for (const [x, y, r] of [[150, 160, 90], [90, 110, 60], [210, 100, 70], [150, 70, 55]] as const) p.ell(x, y, r, r * 0.85, "#e8e6ec", 0); };
const birdCard = (flap: number) => (p: Pen) => { const a = Math.sin(flap * Math.PI * 2) * 22; p.line([[10, 60 - a], [60, 60], [110, 60 - a]], "#2a2a33", 9); };
const life = (t: number, s: Stage, cam: THREE.Camera) => {
  const cp = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  if (cp.y > 40) return;                                                                          // up on the Moon: none
  for (let i = 0; i < 14; i++) {                                                                  // walkers along the street + the pier road
    const dir = i % 2 ? 1 : -1, z = [-6.6, 6.6, -6.9, 6.9][i % 4], x = 46 - (((t * 1.1 * dir + i * 7.3) % 70) + 70) % 70;
    if (Math.hypot(x - cp.x, z - cp.z) > 60) continue;
    s.places.push(P(`bgWalker${i}`, CITIZEN(i + 20), { mode: "stroll", phase: q((t * 1.8 + i * 0.3) % 1, 12), seed: 120 + i }, {}, [x, 0.12, z], { size: LO }));
  }
  for (let i = 0; i < CHIMNEYS.length; i++) {
    const c = CHIMNEYS[i]; if (c.distanceTo(cp) > 220) continue;
    for (let k = 0; k < 3; k++) { const u = ((t * 0.35 + i * 0.37 + k / 3) % 1); s.fx.push(card("bgSmoke", 300, 260, smokeCard, [c.x + u * 2.5, c.y + 0.5 + u * 6, c.z], 1.2 + u * 3.2, 1.0 + u * 2.7, { soft: true })); }
  }
  for (let i = 0; i < 6; i++) { const a = t * 0.4 + i * 1.05, cx = cp.x + 30 * Math.cos(i * 1.7), cz = cp.z - 40 + 20 * Math.sin(i);
    s.fx.push(card(`bgBird${q((t * 3 + i * 0.2) % 1, 4)}`, 120, 80, birdCard(q((t * 3 + i * 0.2) % 1, 4)), [cx + 12 * Math.cos(a), 24 + 4 * Math.sin(a * 1.3), cz + 12 * Math.sin(a)], 0.8, 0.53)); }
};

// ---------------- beats ----------------
const street = (t: number, s: Stage) => {
  if (t < wt(2, "Sun") - 0.5) { // line 1: the newsboy shouts the news; on "believed" New York grabs the papers
    const grab = after(t, 1, "believed");
    const high = t < wt(1, "bat-people") - 0.3;   // paper waved over his head while he shouts, then held out to show the bat-people
    s.places.push(P("newsboy", NEWSBOY, { expr: "laugh", gest: high ? "cheer" : "hold", k: q((t * 2.5) % 1, 8), blink: blinkAt(t, 3), headTilt: 6 * Math.sin(t * 5) }, { paper: "bat" }, [22.0, 0, 1.2]));
    // (no "EXTRA!" shout bubble: speech bubbles read as cheap; Elias 2026-11-13)
    for (let i = 0; i < 5; i++) {
      const a = -1.6 + i * 0.75, end = V(22 + Math.sin(a) * 1.9, 0, 1.2 + Math.cos(a) * 1.3 - 0.4), start = end.clone().add(V((i % 2 ? 1 : -1) * 5, 0, -2));
      const k = smooth((t - wt(1, "believed") + 0.9 + i * 0.08) / 0.8), p = start.lerp(end, k);
      if (t > wt(1, "York") - 0.3) s.places.push(P(`reader${i}`, CITIZEN(i + 2), { mode: k < 1 ? "stroll" : "stand", phase: q((t * 1.8 + i * 0.3) % 1, 12), expr: grab ? "shock" : "neutral", gest: grab ? "hold" : "hang", seed: 10 + i, blink: blinkAt(t, 10 + i) }, { paper: grab ? "bat" : undefined }, p, { size: LO }));
    }
    s.lights.push(warm(V(22.6, 2.8, 3.2), 1.3));
    // the news itself: front pages flutter down from the Moon over the city (the camera follows them down)
    for (let i = 0; i < 7; i++) { const u = clamp01((t + 0.4 - i * 0.18) / 3.2), a = V(52 + (i % 3) * 1.6, 50 - (i % 2) * 1.5, -9 - (i % 4) * 1.2), b = V(22.5 + (i % 3) * 0.8, 2.2 + (i % 2) * 0.6, 0.6 + (i % 4) * 0.4);
      if (u < 1) s.fx.push(card(`fall${q((t * 3 + i * 0.3) % 1, 6)}`, 300, 200, LB.paperBird(q((t * 3 + i * 0.3) % 1, 6)), a.lerp(b, smooth(u)).add(V(Math.sin(t * 2 + i) * 1.2, 0, 0)), 0.9, 0.6)); }
  }
  // line 9 (morning): the whole city is reading; a man faints, kids flap like bat-people
  if (between(t, wt(8, "chatting") - 0.4, wt(10, "copy") + 0.4)) {
    const faint = after(t, 9, "talking");
    for (let i = 0; i < 6; i++) s.places.push(P(`town${i}`, CITIZEN(i + 7), { expr: i % 2 ? "shock" : "grin", gest: "hold", seed: 30 + i, blink: blinkAt(t, 30 + i) }, { paper: "bat" }, [18.6 + (i % 3) * 2.2, 0, -1.2 + Math.floor(i / 3) * 1.9], { size: LO }));
    s.places.push(P("fainter", CITIZEN(4), faint ? { mode: "fall", expr: "dazed", tilt: 70 * smooth((t - wt(9, "talking") + LEAD) / 0.4) } : { expr: "shock", gest: "hold" }, { paper: "bat" }, [20.4, 0, 2.6]));
    for (let i = 0; i < 2; i++) s.places.push(P(`kid${i}`, KID(i), { expr: "laugh", gest: "cheer", k: q((t * 3 + i * 0.5) % 1, 8), phase: q((t * 3 + i * 0.5) % 1, 8), seed: 40 + i }, {}, [23.4 + i * 1.1, 0, 3.0 - i * 0.4]));
  }
};
const shop = (t: number, s: Stage) => {
  if (between(t, wt(1, "believed"), wt(4, "Herschel"))) {
    s.places.push(P("editor", EDITOR, { expr: after(t, 2, "readers") ? "dazed" : "nervous", gest: "clutch", look: 1, blink: blinkAt(t, 5) }, { sweat: true }, [24.9, 0, -13.4]));
    s.fx.push(card("chart0", 520, 400, LB.salesChart(0), [CHART.x, CHART.y, CHART.z + 0.05], 1.15, 0.88, { yaw: 0 }));
    const crack = after(t, 3, "writes");
    if (crack) for (let i = 0; i < 3; i++) {   // line 3 "writes a story": finished pages flutter off his desk
      const u = ((t - wt(3, "writes") + LEAD) * 0.55 + i / 3) % 1;
      s.fx.push(card(`page${i}`, 200, 260, sheet(i), [23.0 + 0.35 * i - 0.4 * u, 0.95 + 1.1 * u, -10.1 + 0.25 * Math.sin(u * 6 + i)], 0.2, 0.26, { rot: (u * 3 + i) % (Math.PI * 2) }));
    }
    if (t > wt(2, "It's")) s.places.push(P("locke", LOCKE, { mode: "sit", expr: crack ? "smug" : "grin", gest: crack ? "sign" : "clutch", k: q((t * 4) % 1, 8), blink: blinkAt(t, 7) }, { curls: true, inkCuffs: true, pen: crack }, [23.4, 0, -10.8]));
  }
  if (between(t, wt(10, "Europe"), wt(12, "Herschel"))) { // line 11: the portrait, eyebrow up on "ask"
    const brow = smooth((t - wt(11, "ask") + LEAD) / 0.3);
    s.fx.push(card(`portrait${q(brow, 8)}`, 360, 440, LB.portrait(q(brow, 8)), [PORTRAIT.x + 0.06, PORTRAIT.y, PORTRAIT.z], 0.78, 0.95, { yaw: Math.PI / 2 }));
  }
  if (t > wt(17, "languages")) { // line 18: Locke signs; then close on the page: "R. A. Locke, author of the Moon hoax"
    const k = smooth((t - wt(18, "signing") + LEAD) / (lineEndW(18) - wt(18, "signing") + 0.15));
    s.places.push(P("lockeS", LOCKE, { mode: "sit", expr: "smug", gest: "sign", k: q((t * 4) % 1, 8), blink: blinkAt(t, 7) }, { curls: true, inkCuffs: true, pen: true }, [23.4, 0, -10.8]));
    const pg = V(23.35, 0.818, -9.58);
    s.fx.push(card(`sig${q(k, 30)}`, 700, 500, LB.signature(q(k, 30)), pg, 0.42, 0.3, { flat: true, rot: 0 }));
    if (t > wt(18, "signing") - 0.6) { const tip = LB.signatureTip(q(k, 30)), done = smooth((t - lineEndW(18) - 0.2) / 0.4), wob = Math.sin(t * 22) * 0.004 * (1 - done);
      s.fx.push(card("quill", 120, 400, LB.quill, [pg.x + (tip[0] - 0.5) * 0.42 + 0.06 * done, pg.y + 0.13 + 0.1 * done, pg.z + (tip[1] - 0.5) * 0.3 + wob], 0.07, 0.24, { rot: -0.35 })); }
    s.fx.push(card("chart1", 520, 400, LB.salesChart(1), [CHART.x, CHART.y, CHART.z + 0.05], 1.15, 0.88, { yaw: 0 }));
    s.lights.push(warm(V(23.0, 1.5, -9.2), 0.9));
  }
};
const cape = (t: number, s: Stage) => {
  if (between(t, wt(3, "story"), wt(5, "Moon"))) { // line 4: Herschel (as Locke tells it) proudly at the giant eyepiece
    s.places.push(P("herschelT", HERSCHEL, { expr: "grin", gest: "point", blink: blinkAt(t, 9) }, { sideburns: true }, HERSCHEL_AT));
    s.lights.push(warm(HERSCHEL_AT.clone().add(V(-0.8, 1.6, 1.2)), 1.3));
    // "a giant telescope": a glint pulses on the big lens at the tube's end
    { const u = q((Math.sin(t * 2.6) + 1) / 2, 6); s.fx.push(card(`glint${u}`, 300, 300, glint(u), TUBE_END.clone().add(V(0, 0, 0)), 2.2, 2.2)); }
  }
  if (between(t, wt(11, "ask"), wt(13, "1835"))) { // line 12: the real Herschel, normal telescope, a cup of tea
    s.places.push(P("herschelG", HERSCHEL, { expr: "smile_closed", gest: "palm", blink: blinkAt(t, 9) }, { sideburns: true, tea: true }, [GARDEN.x + 0.6, 0, GARDEN.z + 0.6]));
    s.lights.push(warm(V(GARDEN.x - 0.3, 1.3, GARDEN.z - 0.4), 1.3));
    for (let i = 0; i < 2; i++) { const u = q(((t * 0.5 + i * 0.5) % 1), 8); s.fx.push(card(`steam${u}`, 160, 320, wisp(u), V(GARDEN.x + 0.95, 1.35 + 0.35 * u, GARDEN.z + 0.75), 0.14, 0.28, { soft: true })); }   // steam from his tea
  }
  if (between(t, wt(13, "months") - 0.2, wt(15, "rival"))) { // line 14: on vacation, no signal; the rumour cloud grows
    const cloud = smooth((t - wt(14, "rumor") + LEAD + 0.5) / 0.5), phone = after(t, 14, "phone");
    s.places.push(P("herschelB", HERSCHEL_BEACH, { expr: phone ? "nervous" : "smile_closed", gest: phone ? "tip" : "palm", k: 1, blink: blinkAt(t, 9) }, { sideburns: true, phone: true }, [BEACH.x, 0, BEACH.z]));
    void cloud;   // (no rumour cloud / "no signal" bubbles: they read as cheap; Herschel holding his dead phone carries the line)
    // beach life around him (background: never the subject)
    s.places.push(P("bgBeach0", CITIZEN(5), { expr: "smile_closed", gest: "hold", seed: 140 }, {}, [BEACH.x - 4.4, 0, BEACH.z + 3.4], { size: LO }));   // well clear of Herschel's frame (run 31: half cut at the left edge)
    s.places.push(P("bgBeach1", KID(1), { mode: "stroll", phase: q((t * 1.6) % 1, 12), expr: "laugh", seed: 141 }, {}, [BEACH.x - 2.0 + Math.sin(t * 0.8) * 0.8, 0, BEACH.z - 2.8], { size: LO }));
    s.places.push(P("bgBeach2", CITIZEN(9), { mode: "sit", expr: "smile_closed", gest: "hang", seed: 142 }, {}, [BEACH.x - 2.9, 0, BEACH.z - 1.4], { size: LO }));
  }
  if (between(t, wt(16, "everyone"), wt(18, "Locke"))) { // line 17: buried under letters in four languages
    const pile = smooth((t - wt(17, "letters") + 0.5) / 1.6);
    s.places.push(P("herschelL", HERSCHEL, { expr: after(t, 17, "never") ? "dazed" : "nervous", gest: "clutch", blink: blinkAt(t, 9) }, { sideburns: true, sweat: true }, [GARDEN.x + 0.6, 0, GARDEN.z + 0.6]));
    const langs = ["English", "Français", "Italiano", "Deutsch"];
    for (let i = 0; i < Math.round(18 * pile); i++) {
      const a = i * 2.4, r = 0.3 + (i % 5) * 0.16, y = 0.12 + Math.floor(i / 6) * 0.22;
      s.fx.push(card(`letterP${i % 4}`, 360, 240, LB.letter(langs[i % 4]), [GARDEN.x + 0.6 + Math.cos(a) * r, y, GARDEN.z + 0.9 + Math.sin(a) * r * 0.6], 0.42, 0.28, { rot: Math.sin(i) * 0.5 }));
    }
    if (after(t, 17, "four")) langs.forEach((L, i) => { const u = clamp01((t - wt(17, "four") + LEAD - i * 0.12) / 0.6);
      s.fx.push(card(`letterF${i}`, 360, 240, LB.letter(L), [GARDEN.x - 0.6 + i * 0.75, 2.6 - 1.2 * smooth(u), GARDEN.z + 1.2], 0.5, 0.33, { rot: (1 - u) * (i % 2 ? 1 : -1) })); });
  }
};
const moonWorld = (t: number, s: Stage) => {
  if (!between(t, wt(5, "through"), wt(9, "city"))) return;
  if (t < wt(7, "blue")) s.fx.push(card("day1", 480, 600, LB.dayPage("DAY 1", "forest"), M(0.6, 0.85, 3.6), 1.2, 1.5));   // beside the goats: the glide to them is a short dolly (was 4.5 m away, behind the path: whip)
  for (let i = 0; i < 4; i++) { const ph = (t * 0.6 + i * 0.25) % 1; s.fx.push(card("wave", 300, 120, (p) => p.line([[20, 80], [80, 40], [150, 70], [220, 40], [280, 70]], "#e8f2ff", 10), M(4.8 + ph * 2.2, 0.12, 0.4 + i * 0.9), 0.6, 0.24)); }
  // the goats hop and nod (on "blue goats" they bounce in turn), with a dust puff each time they land
  const hop = (ph: number) => { const u = ((t * 1.25 + ph) % 1); return { y: 0.16 * Math.sin(Math.PI * Math.min(1, u / 0.45)) * (u < 0.45 ? 1 : 0), land: u >= 0.45 && u < 0.85 ? (u - 0.45) / 0.4 : -1, tilt: 0.07 * Math.sin((t * 1.25 + ph) * Math.PI * 2) }; };
  const hA = hop(0), hB = hop(0.5);
  s.fx.push(card(`goat${blinkAt(t, 4) > 0.5 ? "b" : ""}${q((t * 2) % 1, 4)}`, 600, 600, goat(after(t, 7, "horn") ? blinkAt(t, 4) : 0, q((t * 2) % 1, 4)), M(3.0, 0.5 + hA.y, 4.4), 1.0, 1.0, { rot: hA.tilt }));
  for (const [h, x, z] of [[hA, 3.0, 4.45], [hB, 2.4, 3.65]] as [typeof hA, number, number][]) if (h.land >= 0) s.fx.push(card(`dust${q(h.land, 6)}`, 300, 200, puff(q(h.land, 6)), M(x, 0.12, z), 0.9, 0.6, { soft: true }));
  // "blue goats": a second, smaller goat just behind and beside the first (its own blink and chew); tucked in so the
  // pair frames narrower and both read bigger (run 31: 1.1 m apart made them tiny in a portrait frame)
  s.fx.push(card(`goatB${blinkAt(t, 9) > 0.5 ? "b" : ""}${q((t * 2 + 0.5) % 1, 4)}`, 600, 600, goat(after(t, 7, "horn") ? blinkAt(t, 9) : 0, q((t * 2 + 0.5) % 1, 4)), M(2.4, 0.43 + hB.y, 3.6), 0.86, 0.86, { rot: hB.tilt }));
  // the bat-people fly in from above the frame on "blue goats" and land in the air by "horn" (they exist before the
  // camera glides over from the goats, so it is a glide, not a whip onto an empty spot); on "flying around" they loop
  // on a diagonal, one above the other (a portrait frame holds two winged figures stacked, not side by side; same
  // phase, so they never cross), wings beating faster, the second one waving
  if (t > wt(7, "blue")) for (let i = 0; i < 2; i++) {
    const land = smooth((t - wt(7, "blue")) / Math.max(0.3, wt(7, "horn") - wt(7, "blue"))), fly = smooth((t - wt(8, "flying") + 0.3) / 0.6);
    const flap = q((t * (2.4 + 1.6 * fly) + i * 0.4) % 1, 8), wave = i === 1 && after(t, 8, "flying");
    const loopX = fly * 0.55 * Math.sin((t - wt(8, "flying")) * 2.2), loopY = fly * 0.12 * Math.sin((t - wt(8, "flying")) * 4.4);
    s.places.push(P(`bat${i}`, BATFOLK[i], { expr: after(t, 8, "chatting") ? "laugh" : "grin", gest: wave ? "wave" : i ? "palm" : "point", k: flap, blink: blinkAt(t, 50 + i), tilt: Math.round(8 * fly * Math.cos((t - wt(8, "flying")) * 2.2)) }, { wings: flap },
      M(-0.45 + i * 0.95 + loopX, 1.35 + i * 1.25 + 0.12 * Math.sin(t * 3 + i) + 5.5 * (1 - land) + loopY, 2.6), { scale: 0.9 }));
  }
  s.lights.push(warm(M(-0.2, 3.5, 4.5), 0.6));
};
const pier = (t: number, s: Stage) => {
  if (!between(t, wt(9, "talking"), wt(11, "anyone"))) return;
  for (let i = 0; i < 2; i++) s.places.push(P(`pierBoy${i}`, i ? KID(2) : NEWSBOY, { expr: "laugh", gest: "cheer", k: q((t * 2 + i * 0.5) % 1, 8), blink: blinkAt(t, 60 + i) }, {}, [50.2 - i * 1.4, 0.3, -0.6 + i * 1.3]));
  const t0 = wt(10, "copy") - 0.3;
  for (let i = 0; i < 12; i++) {
    const u = (t - t0 - i * 0.14) / 2.4; if (u <= 0) continue;
    const a = V(50.5, 2.4, 0), b = V(EUROPE.x - 12 + (i % 4) * 4, 10 + (i % 3) * 2, EUROPE.z + 18 + (i % 5) * 3), p = a.lerp(b, Math.min(1, u ** 0.8)).add(V(0, 3 * Math.sin(Math.min(1, u) * Math.PI) + Math.sin(t * 4 + i) * 0.4, (i % 3 - 1) * 1.5 * Math.min(1, u)));
    s.fx.push(card(`bird${q((t * 3 + i * 0.3) % 1, 6)}`, 300, 200, LB.paperBird(q((t * 3 + i * 0.3) % 1, 6)), p, 0.75, 0.5));
  }
};
const ship = (t: number, s: Stage) => {
  if (!between(t, wt(12, "sky"), wt(14, "rumor"))) return;
  const x = shipX(t);
  s.places.push(P("sailor", CITIZEN(5), { expr: "smile_closed", gest: "hold", blink: blinkAt(t, 70) }, { letter: true }, [x + 1.2, -0.2, SHIP_LINE.z + 0.4]));
  if (t > wt(13, "takes") - 0.2) { // calendar pages flying off behind the ship
    const months = ["SEPT", "OCT", "NOV", "DEC", "JAN"];
    months.forEach((mn, i) => { const u = (t - wt(13, "takes") + 0.2 - i * 0.22) / 1.2; if (u <= 0 || u > 1.4) return;
      s.fx.push(card(`cal${i}`, 240, 300, LB.calendarPage(mn), [x - 1.0 - 3 * u, 1.6 + 2.4 * u, SHIP_LINE.z - 0.5 + (i % 2 ? 1 : -1) * u], 0.4, 0.5, { rot: u * 4 })); });
  }
};
const herald = (t: number, s: Stage) => {
  if (!between(t, wt(14, "phone"), wt(16, "everyone"))) return;
  const slap = smooth((t - wt(15, "exposes") + LEAD) / 0.2);
  s.places.push(P("rival", RIVAL, { expr: slap > 0 ? "grin" : "smug", gest: "palm", blink: blinkAt(t, 80) }, {}, [9.1, 0, 13.1]));
  { const u = (t - wt(15, "exposes") + LEAD - 0.2) / 0.35; if (u > 0 && u < 1) s.fx.push(card(`burst${q(u, 6)}`, 400, 400, burst(q(u, 6)), [9.2, 1.2, 12.15], 0.9, 0.9)); }   // the slap lands
  s.fx.push(slap < 1 ? card("hoaxUp", 480, 600, LB.hoaxPage, [9.5, 1.55 - 0.6 * slap, 12.3], 0.6, 0.75) : card("hoaxDown", 480, 600, LB.hoaxPage, [9.2, 1.14, 12.2], 0.6, 0.75, { flat: true, rot: Math.PI }));
};
const queue = (t: number, s: Stage) => {
  if (!between(t, wt(15, "thing"), wt(17, "getting"))) return;
  s.places.push(P("editorQ", EDITOR, { expr: "laugh", gest: "cheer", k: q((t * 2) % 1, 8), blink: blinkAt(t, 5) }, {}, [28.2, 0.12, -7.3]));
  for (let i = 0; i < 8; i++) s.places.push(P(`cust${i}`, CITIZEN(i + 13), { expr: i % 3 ? "grin" : "smile_closed", gest: i % 2 ? "palm" : "hang", seed: 90 + i, blink: blinkAt(t, 90 + i) }, {}, [26.6 - i * 1.05, 0.12, -6.7 + (i % 2) * 0.25], { size: LO }));
};

/** everything on stage at time t */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  const s: Stage = { places: [], fx: [], lights: [] };
  life(t, s, cam); street(t, s); shop(t, s); cape(t, s); moonWorld(t, s); pier(t, s); ship(t, s); herald(t, s); queue(t, s);
  const cr = carryAt(t, c);
  if (cr && cr.k > 0) {
    if (cr.kind === "paper") s.fx.push(card("carryPaper", 480, 600, LB.dayPage("DAY 1", "bats"), cr.p, 0.55 * cr.k, 0.69 * cr.k, { rot: cr.spin }));
    else if (cr.kind === "letter") s.fx.push(card("carryLetter", 360, 240, LB.letter("Herschel"), cr.p, 0.5 * cr.k, 0.33 * cr.k, { rot: cr.spin }));
    else s.fx.push(card(`carryBird${q((t * 3) % 1, 6)}`, 300, 200, LB.paperBird(q((t * 3) % 1, 6)), cr.p, 0.7 * cr.k, 0.47 * cr.k));
  }
  void cam;
  return s;
};
