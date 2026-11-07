// Who and what is on screen at time t in the Rat Bounty short: character cards (cast.ts Actors), prop / label / rat
// cards (Fx), and practical lights that keep the subject lit at night and underground (CLAUDE.md 11). Every reaction
// lands 0-2 frames before its word. CLAUDE.md 10: whoever the narration names doing something is on screen doing it.
import * as THREE from "three";
import type { Place, FxPlace } from "../bridge/cast";
import { Pen, fxRing } from "../bridge/toon";
import { V } from "../bridge/build";
import { wt, wtn, lineEnd, clamp01, smooth, Cam, V3, RAT_STOP, runRatX, convoy, carryAt } from "./story";
import { POSTER, MANHOLE, SEWER, NEST, OUTFLOW, QUAY, PALACE, GRATE } from "./layout";
import type { Lamp } from "./hanoi";
import { LAMP } from "./looks";
import {
  person, personKey, Look, Extra, OFFICIAL, CLERK, HUNTER, FARMER, LADY, DOUMER, DOUMER_PRES, LOCAL,
  ratRun, ratHero, babyRat, ratMom,
} from "./people";
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
const P = (name: string, o: Outfit, l: Look, x: Extra, at: V3, opt: { scale?: number; size?: [number, number, number]; noSeat?: boolean } = {}): Place =>
  ({ key: personKey(name, l, x), draw: person(o, l, x), x: at[0], y: at[1] + (l.mode === "sit" && !opt.noSeat ? SEAT : 0), z: at[2], size: opt.size ?? HI, scale: opt.scale });
const card = (key: string, cw: number, ch: number, draw: (p: Pen) => void, at: V3 | THREE.Vector3, w: number, h: number, o: Partial<FxCard> = {}): FxCard => {
  const a = at instanceof THREE.Vector3 ? at : V(...at);
  return { key, cw, ch, draw, x: a.x, y: a.y, z: a.z, w, h, ...o };
};
const q = (x: number, n: number) => Math.round(x * n) / n;
const after = (t: number, ln: number, w: string | number) => t >= wt(ln, w) - LEAD;
const between = (t: number, a: number, b: number) => t >= a && t < b;
const warm = (p: THREE.Vector3, k: number) => ({ p, k, col: LAMP });
/** mirror a card drawing horizontally (cw = canvas width) */
const flip = (cw: number, draw: (p: Pen) => void) => (p: Pen) => { p.g.save(); p.g.translate(cw, 0); p.g.scale(-1, 1); draw(p); p.g.restore(); };
/** a running rat card: faces its direction of travel on screen */
const runner = (s: Stage, key: string, pos: THREE.Vector3, vel: THREE.Vector3, cam: THREE.Camera, t: number, tail: boolean, len = 0.6, coin = false) => {
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), left = vel.dot(right) < 0, ph = q((t * 6 + key.length * 0.13) % 1, 6);
  const d = ratRun(tail, ph, coin);
  s.fx.push(card(`${key}|${tail ? "t" : "n"}${left ? "L" : "R"}${ph}${coin ? "c" : ""}`, 600, 300, left ? flip(600, d) : d, pos.clone().add(V(0, len * 0.25, 0)), len, len / 2));
};

const lanternCard = (p: Pen) => { p.stroke([[100, 10], [100, 60]], 6); p.poly([[50, 60], [150, 60], [140, 250], [60, 250]], "#ffd27a", 8); p.ell(100, 155, 30, 40, "#fff3c8", 0); p.poly([[40, 250], [160, 250], [160, 280], [40, 280]], "#2a2a33", 6); };
// ---------------- beats ----------------
const terrace = (t: number, s: Stage) => {
  if (t > wt(2, "capital")) return;
  const y = 5.25, paid = after(t, 1, "paid"), proud = after(t, 1, "farming");
  const give = smooth((t - wt(1, "paid") + 0.15) / 0.4) * (1 - smooth((t - wt(1, "rats")) / 0.5));
  s.places.push(P("official", OFFICIAL, { expr: paid ? "smug" : "neutral", gest: give > 0.05 ? "palm" : "hang", blink: blinkAt(t, 2) }, { glasses: true, coin: give > 0.05 }, [125.3, y, 19.4]));
  s.places.push(P("farmer", FARMER, { expr: proud ? "grin" : paid ? "smile" : "neutral", gest: "hold", headTilt: proud ? 6 : 0, blink: proud ? 0 : blinkAt(t, 5) }, { ratHeld: true, coin: paid && !proud }, [127.4, y, 19.0]));
  for (let i = 0; i < 3; i++) s.fx.push(card(`yardHen${i}`, 600, 600, LB_HEN(q((t * 2 + i) % 1, 4)), [122 + i * 4.5, 0.4, 9 + i * 1.5], 0.7, 0.7));
};
import { hen as henCard } from "./people";
const LB_HEN = (f: number) => henCard(f);

const boulevard = (t: number, s: Stage) => {
  if (!between(t, wt(1, "farming"), wt(4))) return;
  for (let i = 0; i < 12; i++) {
    const dir = i % 2 ? 1 : -1, z = (i % 4 < 2 ? -8.4 : 8.4) + (i % 3) * 0.3, x = 100 - ((t * 1.2 * dir + i * 13.7) % 160 + 160) % 160;
    s.places.push(P(`walker${i}`, LOCAL(i), { mode: "stroll", phase: q((t * 1.8 + i * 0.3) % 1, 12), seed: 20 + i }, {}, [x, 0.12, z], { size: LO }));
  }
};
const grate = (t: number, s: Stage) => {
  if (!between(t, wt(2, "Indochina") - 0.6, wt(4) + 0.2)) return;
  const cut = clamp01((t - wt(3, "gave") + LEAD) / 0.25);
  s.places.push(P("officialG", OFFICIAL, { expr: cut > 0 ? "grin" : "smug", gest: cut > 0 ? "cheer" : "palm", k: q((t * 2) % 1, 8), blink: blinkAt(t, 2) }, { glasses: true, scissors: cut === 0 }, [GRATE.x + 1.6, 0, GRATE.z + 1.4]));
  s.fx.push(card(`ribbon${q(cut, 8)}`, 800, 120, LB.ribbon(q(cut, 8)), [GRATE.x, 0.85, GRATE.z + 0.2], 2.0, 0.3));
  for (let i = 0; i < 3; i++) s.places.push(P(`onlook${i}`, LOCAL(i + 3), { expr: cut > 0 ? "grin" : "smile_closed", gest: cut > 0 && i !== 1 ? "cheer" : "hang", k: q((t * 2 + i * 0.3) % 1, 8), seed: 40 + i, blink: blinkAt(t, 40 + i) }, {}, [GRATE.x - 2.0 + i * 1.3, 0, GRATE.z - 1.6 - (i % 2) * 0.5], { size: LO }));
};
const tunnel = (t: number, s: Stage, cam: THREE.Camera) => {
  if (!between(t, wt(4, "rats") - 0.9, wt(5))) return;
  for (let i = 0; i < 9; i++) { const p = convoy(t, i), v = convoy(t + 0.05, i).sub(p); if (v.lengthSq() < 1e-6 || p.y > 0.4) continue; runner(s, `convoy${i}`, p, v, cam, t, true, 0.55); }
};
const bath = (t: number, s: Stage) => {
  if (!between(t, wt(4, "straight"), wt(5, "kitchen"))) return;
  const pop = smooth((t - wt(4, "nicest") + 0.35) / 0.3), scream = after(t, 4, "nicest");
  if (pop > 0) s.fx.push(card(`toiletRat${scream ? 1 : 0}`, 600, 600, ratHero(scream ? "wave" : "look", q((t * 2) % 1, 8)), [5.95, 0.42 + 0.3 * pop, -16.35], 0.55, 0.55));
  s.places.push(P("lady", LADY, { expr: scream ? "shock" : "smile_closed", gest: scream ? "cheer" : "hang", k: q((t * 3) % 1, 8), blink: scream ? 0 : blinkAt(t, 9) }, {}, [8.5, 0, -14.6]));
};
const kitchen = (t: number, s: Stage) => {
  if (!between(t, wt(5) - 0.8, wt(6, "hunters"))) return;
  const k = smooth((t - wt(5, "plague") + 0.2) / (wt(5, "kitchen") - wt(5, "plague")));
  s.fx.push(card(`plague${q(k, 20)}`, 720, 520, LB.plagueMap(q(k, 20)), [19.93, 1.9, -13.9], 1.75, 1.26, { yaw: -Math.PI / 2 }));
  const danger = after(t, 5, "dangerous"), grow = smooth((t - wt(5, "dangerous") + 0.2) / 0.5);
  s.fx.push(card(`kitRat${danger ? 1 : 0}${blinkAt(t, 3) > 0.5 ? "b" : ""}`, 600, 600, ratHero(danger ? "smug" : "look", 0, blinkAt(t, 3)), [15.6, 0.76 + 0.28, -13.5], 0.56, 0.56));
  if (after(t, 5, "kitchen")) s.fx.push(card("skull", 400, 400, LB.skullShadow, [15.7, 1.6 + 0.25 * grow, -16.94], 1.0 + 0.8 * grow, 1.0 + 0.8 * grow, { yaw: 0, soft: true }));
};
/** hunters: start positions at the manhole, descend one by one, then stand in the tunnel with lanterns */
const HUNT_DOWN = [0, 0.28, 0.56];
const hunterAt = (t: number, i: number) => {
  const t0 = wt(6, "hunters") - 0.35 + HUNT_DOWN[i], u = smooth((t - t0) / 0.7);
  const top = V(39.2 - i * 1.1, 0, 5.2 + (i % 2) * 0.4), hole = V(MANHOLE.x, 0, MANHOLE.z + 0.35), bottom = [V(42.9, SEWER.y, 4.4), V(47.6, SEWER.y, 1.6), V(46.3, SEWER.y, 4.4)][i];
  if (t < t0) return { p: top.lerp(hole, smooth((t - (t0 - 0.6)) / 0.6)), climbing: false };
  if (u < 1) return { p: hole.clone().setY(-7 * u), climbing: true };
  return { p: hole.clone().setY(SEWER.y).lerp(bottom, smooth((t - t0 - 0.7) / 0.5)), climbing: false };
};
const hunters = (t: number, s: Stage, cam: THREE.Camera) => {
  if (!between(t, wt(5, "dangerous"), wt(8, "anyone"))) return;
  if (t < wt(7)) s.places.push(P("officialM", OFFICIAL, { expr: "stern", gest: "point", blink: blinkAt(t, 2) }, { glasses: true }, [41.7, 0, 5.4]));
  for (let i = 0; i < 3; i++) {
    const { p, climbing } = hunterAt(t, i);
    s.places.push(P(`hunter${i}`, HUNTER(i), { expr: climbing ? "nervous" : t > wt(7, "not") ? "shock" : "stern", gest: climbing ? "climb" : "hold", k: q((t * 2) % 1, 8), blink: blinkAt(t, 30 + i) }, { lantern: true, net: !climbing }, [p.x, p.y, p.z]));
    if (p.y < -1) s.lights.push(warm(p.clone().add(V(0.2, 1.1, 0)), 1.0));
  }
  if (t > wt(7) - 0.6) {
    const k = smooth((t - wt(7, "day") + 0.3) / 0.8);
    s.fx.push(card(`tally${q(k, 24)}`, 640, 360, LB.counterBoard(q(k, 24)), [44.6, -5.85, SEWER.z + SEWER.w / 2 - 0.04], 1.6, 0.9, { yaw: Math.PI }));
    // rats pouring past on both walkways, more on "not enough"
    const n = t > wt(7, "not") - 0.3 ? 14 : 6;
    for (let i = 0; i < n; i++) {
      const z = i % 2 ? SEWER.z - 1.45 : SEWER.z + 1.45, x = 50 - ((t * 7 + i * 3.1) % 18), p = V(x, SEWER.y + 0.02, z + ((i * 0.37) % 0.5) - 0.25);
      runner(s, `pour${i}`, p, V(-1, 0, 0), cam, t, true, 0.5);
    }
  }
};
const posterWall = (t: number, s: Stage) => {
  const up = wt(8, "rule") - 0.15, down = wt(19, "cancel") - LEAD;
  if (between(t, up - 1.2, wt(9, "city")) || between(t, wt(18, "rats"), wt(20, "man"))) {
    const slap = t < wt(9) ? smooth((t - up) / 0.18) : 1, torn = t > down ? smooth((t - down) / 0.45) : 0;
    if (slap > 0 && torn < 1) s.fx.push(card(`poster${q(torn, 12)}`, 480, 640, LB.poster(q(torn, 12)), [POSTER.x, 1.75, POSTER.z + 0.06], 1.1 * (0.6 + 0.4 * slap), 1.47 * (0.6 + 0.4 * slap), { yaw: 0 }));
  }
  if (between(t, wt(7, "not"), wt(9, "city") + 0.2)) {
    const pasting = t < wt(8, "anyone");
    s.places.push(P("officialP", OFFICIAL, { expr: pasting ? "smug" : "grin", gest: pasting ? "paste" : "point", k: q((t * 2.5) % 1, 8), blink: blinkAt(t, 2) }, { glasses: true, brush: pasting }, [POSTER.x + 0.95, 0.12, POSTER.z + 1.1]));
    // the crowd gathers from "anyone": townsfolk and hunters walk in to a half circle
    const g = smooth((t - wt(8, "anyone") + 0.4) / 1.0), cheer = after(t, 8, "cent");
    for (let i = 0; i < 8; i++) {
      const a = -1.2 + i * 0.34, end = V(POSTER.x + Math.sin(a) * 3.4, 0.12, POSTER.z + 1.9 + Math.cos(a) * 1.0), start = end.clone().add(V((i % 2 ? 1 : -1) * 9, 0, 3));
      const p = start.lerp(end, g), o = i % 3 === 0 ? HUNTER(i) : LOCAL(i + 7);
      s.places.push(P(`crowd${i}`, o, { mode: g < 1 ? "stroll" : "stand", phase: q((t * 1.8 + i * 0.3) % 1, 12), expr: cheer ? "grin" : "smile_closed", gest: cheer && i % 2 ? "cheer" : "hang", k: q((t * 2 + i * 0.2) % 1, 8), seed: 60 + i, blink: blinkAt(t, 60 + i) }, { net: i % 3 === 0 }, [p.x, p.y, p.z], { size: LO }));
    }
  }
  if (between(t, wt(18, "rats"), wt(20, "man") + 0.2)) { // night: the official tears it down under the lamp
    const k = smooth((t - down) / 0.45);
    s.places.push(P("officialT", OFFICIAL, { expr: k > 0 ? "stern" : "nervous", gest: "tear", k: q(k, 10), blink: blinkAt(t, 2) }, { glasses: true }, [POSTER.x - 0.75, 0.12, POSTER.z + 1.1]));
    s.lights.push(warm(V(POSTER.x - 0.4, 3.0, POSTER.z + 2.6), 1.4));
  }
};
const office = (t: number, s: Stage) => {
  if (!between(t, wt(8, "cent"), wt(12, "something"))) return;
  const ox = 76.3, oz = 15.85, faint = between(t, wt(9, "desk") - LEAD, wt(10, "just") - 0.1), nerv = between(t, wt(9, "mountain") - LEAD, wt(9, "desk"));
  const dance = after(t, 11, "thrilled") || between(t, wt(11, "officials") - 0.2, 99);
  const look: Look = dance ? { expr: "laugh", gest: "cheer", k: q((t * 2.2) % 1, 8), phase: q((t * 2.2) % 1, 8) }
    : faint ? { mode: "sit", expr: "dazed", tilt: 18, headTilt: -14 }
    : nerv ? { mode: "sit", expr: "nervous", gest: "clutch", blink: 0 }
    : t > wt(10) - 0.1 ? { expr: t > wt(10, "tail") - LEAD - 0.2 ? "grin" : "smug", gest: "point", blink: blinkAt(t, 2) }
    : { mode: "sit", expr: "neutral", blink: blinkAt(t, 2) };
  s.places.push(P("officialO", OFFICIAL, look, { glasses: true, sweat: nerv }, [ox, 0, oz]));
  if (!look.mode) look.mode = "stand";
  // the looming mountain of dead rats (shadow on the back wall)
  const m = smooth((t - wt(9, "mountain") + 0.3) / 1.0) * (1 - smooth((t - wt(10)) / 0.4));
  if (m > 0.01) s.fx.push(card("ratPile", 800, 600, LB.ratPileShadow, [ox + 0.3, 1.1 + 1.2 * m, 17.93], 3.4 * (0.4 + 0.6 * m), 2.55 * (0.4 + 0.6 * m), { yaw: Math.PI, soft: true }));
  // the sign behind him: WHOLE RATS flips to TAILS ONLY on "tail"
  const f = clamp01((t - wt(10, "tail") + LEAD + 0.12) / 0.3), side = f < 0.5;
  s.fx.push(card(side ? "signRats" : "signTails", 640, 240, side ? LB.ratsSign : LB.tailsSign, [ox, 2.2, 17.93], 1.7 * Math.max(0.06, Math.abs(Math.cos(f * Math.PI))), 0.64, { yaw: Math.PI }));
  // line 11: hunters bring baskets of tails to the counter, coins pile up, clerks join the dance
  if (t > wt(11) - 0.5) {
    const nb = [wt(11, "Tails"), wt(11, "pour"), wt(11, "Tens")].filter((x) => t > x - LEAD).length;
    for (let i = 0; i < nb; i++) s.fx.push(card("basket", 500, 400, LB.tailBasket, [71.9, 1.1 + 0.36, 13.3 + i * 0.9], 0.85, 0.68));
    for (let i = 0; i < 2; i++) s.places.push(P(`hunterO${i}`, HUNTER(i + 1), { expr: "grin", gest: i ? "hold" : "palm", blink: blinkAt(t, 50 + i) }, { tails: !!i, coin: !i }, [73.1, 0, 13.0 + i * 1.5]));
    const coins = Math.min(15, Math.floor((t - wt(11) + 0.3) * 6));
    if (coins > 0) s.fx.push(card(`coins${coins}`, 400, 260, LB.coinPile(coins), [ox + 0.8, 0.84 + 0.12, oz - 1.4], 0.7, 0.45));
    for (let i = 0; i < 2; i++) s.places.push(P(`clerk${i}`, CLERK(i), { expr: dance ? "laugh" : "grin", gest: dance ? "cheer" : "hang", k: q((t * 2.2 + i * 0.4) % 1, 8), phase: q((t * 2.2 + i * 0.4) % 1, 8), blink: blinkAt(t, 70 + i) }, {}, [ox - 1.8 + i * 3.4, 0, oz + 0.6]));
  }
};
const street = (t: number, s: Stage, cam: THREE.Camera) => {
  // line 12: the official steps out of the door and spots it; the tailless rat scurries west and stops (line 13)
  if (between(t, wt(11, "thrilled") + 0.2, wt(13) + 0.5)) {
    const spot = after(t, 12, "notices");
    s.places.push(P("officialS", OFFICIAL, { expr: spot ? "shock" : "neutral", gest: spot ? "point" : "hang", blink: blinkAt(t, 2) }, { glasses: true }, [79.6, 0.12, 9.0]));
  }
  if (between(t, wt(12, "something") - 0.4, wt(13) - 0.05)) runner(s, "scurry", V(runRatX(t), 0.12, RAT_STOP.z), V(-1, 0, 0), cam, t, false, 0.62);
  if (between(t, wt(13) - 0.05, wt(15, "dead"))) {
    const sh = smooth((t - wt(13, "tail") + LEAD + 0.1) / 0.35), mood = sh > 0 ? "shrug" : "look";
    s.fx.push(card(`hero${mood}${q(sh, 10)}${blinkAt(t, 7) > 0.5 ? "b" : ""}`, 600, 600, ratHero(mood, q(sh, 10), blinkAt(t, 7)), RAT_STOP.clone().add(V(0, 0.36, 0)), 0.72, 0.72));
  }
  // line 14: rows of tailless rats march past the shocked official
  if (between(t, wt(13, "tail"), wt(16, "live"))) {
    s.places.push(P("officialR", OFFICIAL, { expr: "shock", gest: "clutch", blink: 0 }, { glasses: true, sweat: true }, [57.3, 0.12, 9.1]));
    const n = t > wt(14, "And") - 0.2 ? 12 : t > wt(14, "another") - 0.2 ? 6 : 2;
    for (let i = 0; i < n; i++) {
      const row = i % 3, col = Math.floor(i / 3), x = 52 + ((t - wt(14)) * 2.2) - col * 1.2, z = 6.7 + row * 0.42;
      runner(s, `march${i}`, V(x, 0.12, z), V(1, 0, 0), cam, t * 0.6, false, 0.5);
    }
  }
};
const table = (t: number, s: Stage) => {
  if (!between(t, wt(14, "And"), wt(16, "babies"))) return;
  const paid = after(t, 15, "pays"), slide = smooth((t - wt(15, "pays") + LEAD) / 0.4);
  s.places.push(P("officialB", OFFICIAL, { mode: "sit", expr: paid ? "smile_closed" : "neutral", gest: paid ? "hang" : "palm", blink: blinkAt(t, 2) }, { glasses: true, coin: !paid }, [82.4, 0.12, 9.6]));
  s.places.push(P("hunterB", HUNTER(2), { expr: paid ? "grin" : "smile_closed", gest: paid ? "palm" : "hang", blink: blinkAt(t, 33) }, { coin: paid }, [83.9, 0.12, 8.0]));
  s.fx.push(card("tailOne", 300, 120, LB.tail, [82.3, 0.12 + 0.8, 8.4], 0.45, 0.18, { flat: true, rot: 0.3 }));
  if (slide < 1) s.fx.push(card("coinOne", 200, 200, LB.coin, [82.4 + 1.1 * slide, 0.93 + 0.2 * Math.sin(slide * Math.PI), 8.9 - 0.6 * slide], 0.16, 0.16));
};
const nest = (t: number, s: Stage, cam: THREE.Camera) => {
  if (!between(t, wt(15, "pays"), wt(17, "egg"))) return;
  const c = V(NEST.x, SEWER.y, 6.9);
  s.fx.push(card(`mom${blinkAt(t, 11) > 0.5 ? "b" : ""}`, 600, 600, ratMom(blinkAt(t, 11)), c.clone().add(V(0, 0.4, 0.3)), 0.8, 0.8));
  const nb = Math.round(7 * smooth((t - wt(16, "keeps") + 0.2) / 1.3)), glint = after(t, 16, "brand-new");
  for (let i = 0; i < nb; i++) {
    const a = (i / 7) * Math.PI - 0.2, p = c.clone().add(V(Math.cos(a) * 0.75, 0.0, -0.35 + Math.sin(a) * 0.3));
    s.fx.push(card(`baby${i}${glint ? "g" : ""}${q((t * 3 + i * 0.4) % 1, 4)}`, 300, 200, babyRat(glint ? 1 : 0, q((t * 3 + i * 0.4) % 1, 4)), p.add(V(0, 0.1, 0)), 0.36, 0.24));
  }
  if (glint) for (let i = 0; i < nb; i++) { const a = (i / 7) * Math.PI - 0.2; s.lights.push({ p: c.clone().add(V(Math.cos(a) * 0.9, 0.2, -0.2)), k: 0.25, col: [3.2, 2.6, 0.8] }); }
  s.lights.push(warm(c.clone().add(V(0.6, 1.2, -1.0)), 1.1));
  void cam;
};
const farmyard = (t: number, s: Stage) => {
  if (!between(t, wt(16, "tail") , wt(18, "breeding"))) return;
  const kill = after(t, 17, "killing"), nobody = after(t, 17, "Nobody"), raise = smooth((t - wt(17, "killing") + LEAD) / 0.3);
  s.places.push(P("farmerH", FARMER, { expr: nobody ? "stern" : kill ? "shock" : "grin", gest: kill ? "protect" : "hold", headTilt: nobody ? 10 * Math.sin(t * 9) : 0, blink: kill ? 0 : blinkAt(t, 5) }, { hen: true }, [130.4, 0, 6.0]));
  if (t > wt(17, "killing") - 0.6) s.places.push(P("officialH", OFFICIAL, { expr: nobody ? "nervous" : "smug", gest: "axe", k: nobody ? 1 : 1 - raise, blink: blinkAt(t, 2) }, { glasses: true, axe: true }, [128.5, 0, 6.5]));
  // eggs = coins: every "egg" pops a coin out of the hen
  const eggs = Math.min(5, Math.floor((t - wt(17, "every") + 0.2) * 5));
  for (let i = 0; i < eggs; i++) s.fx.push(card("eggCoin", 200, 200, LB.coin, [130.0 + i * 0.22, 0.1, 6.6 + (i % 2) * 0.2], 0.2, 0.2));
};
const barn = (t: number, s: Stage, cam: THREE.Camera) => {
  if (!between(t, wt(17, "Nobody"), wt(19, "French") + 0.1)) return;
  // rats peering out of the barn door, cages full of rats inside, the farmer counting coins at his bench
  for (let i = 0; i < 3; i++) s.fx.push(card(`doorRat${i}`, 600, 600, ratHero(i === 1 ? "smug" : "look", 0, blinkAt(t, 80 + i)), [132.6, 0.3, -5.2 + i * 0.9], 0.55, 0.55));
  for (const row of [-3.6, 0.2]) for (let k = 0; k < 6; k++) for (let lvl = 0; lvl < 3; lvl++) {
    const p = V(142 - 4.5 + k * 1.7, 0.2 + lvl * 0.85, -4 + row);
    s.fx.push(card(`cageRat${(k + lvl) % 3}`, 600, 600, ratHero(["look", "smug", "look"][(k + lvl) % 3], 0, 0), p.add(V(0, 0.22, 0)), 0.42, 0.42));
  }
  s.places.push(P("farmerB", FARMER, { expr: "grin", gest: "palm", blink: blinkAt(t, 5) }, { coin: true }, [148.2, 0, 0.6]));
  s.fx.push(card("barnCoins", 400, 260, LB.coinPile(14), [148.2, 0.84 + 0.1, -0.6], 0.7, 0.45));
  s.lights.push(warm(V(147.6, 2.4, 0.9), 1.2));
  void cam;
};
const quay = (t: number, s: Stage) => {
  if (!between(t, wt(19, "cancel"), wt(21, "stayed"))) return;
  const board = smooth((t - wt(20, "goes") + LEAD) / 0.9), a = V(55.4, 0.05, -43.8), b = V(53.4, -0.1, -47.6), p = a.lerp(b, board);
  if (t < wt(20, "President") - 0.4) {
    s.places.push(P("doumerQ", DOUMER, { mode: board > 0 && board < 1 ? "stroll" : "stand", phase: q((t * 2) % 1, 12), expr: "smug", gest: board < 0.05 ? "hold" : "wave", k: q((t * 2) % 1, 8), blink: blinkAt(t, 3) }, { beard: true, blueprint: board < 0.05 }, [p.x, p.y, p.z]));
    s.places.push(P("officialQ", OFFICIAL, { expr: "smile", gest: "wave", k: q((t * 2) % 1, 8), blink: blinkAt(t, 2) }, { glasses: true }, [58.4, 0.05, -42.4]));
  }
  // the balcony in Paris: President Doumer with the sash; the crowd cheers on the square below
  if (t > wt(20, "later")) {
    s.places.push(P("doumerP", DOUMER_PRES, { expr: "grin", gest: "wave", k: q((t * 1.6) % 1, 8), blink: blinkAt(t, 3) }, { beard: true }, [PALACE.x, PALACE.balconyY, PALACE.z + 1.0]));
    for (let i = 0; i < 16; i++) {
      const x = PALACE.x - 9 + (i % 8) * 2.4 + (i > 7 ? 1.2 : 0), z = PALACE.z + 6 + (i > 7 ? 2.2 : 0);
      s.places.push(P(`fans${i}`, LOCAL(3 * i + 2), { expr: "grin", gest: i % 3 ? "cheer" : "wave", k: q((t * 2 + i * 0.27) % 1, 8), seed: 90 + i }, {}, [x, 0, z], { size: LO }));
    }
  }
};
const stayed = (t: number, s: Stage) => {
  if (t < wt(20, "France")) return;
  const wave = after(t, 21, "stayed");
  s.fx.push(card(`lounge${wave ? "w" + q((t * 1.5) % 1, 8) : "l"}${blinkAt(t, 7) > 0.5 ? "b" : ""}`, 600, 600, ratHero(wave ? "wave" : "lounge", q((t * 1.5) % 1, 8), blinkAt(t, 7)), V(OUTFLOW.x + 1.0, OUTFLOW.y + 0.4 + 0.36, OUTFLOW.z), 0.72, 0.72));
  s.lights.push(warm(V(OUTFLOW.x + 0.2, OUTFLOW.y + 1.6, OUTFLOW.z + 1.2), 1.2));
  // three more tailless rats sunning themselves on the quay by the grate
  for (let i = 0; i < 3; i++) s.fx.push(card(`quayRat${i}`, 600, 600, ratHero(i === 1 ? "smug" : "look", 0, blinkAt(t, 90 + i)), [QUAY.grate.x - 1.6 + i * 1.5, 0.05 + 0.25, QUAY.grate.z + 1.5], 0.5, 0.5));
};

/** everything on stage at time t */
export const stage = (t: number, c: Cam, cam: THREE.Camera): Stage => {
  const s: Stage = { places: [], fx: [], lights: [] };
  terrace(t, s); boulevard(t, s); grate(t, s); tunnel(t, s, cam); bath(t, s); kitchen(t, s); hunters(t, s, cam); posterWall(t, s);
  office(t, s); street(t, s, cam); table(t, s); nest(t, s, cam); farmyard(t, s); barn(t, s, cam); quay(t, s); stayed(t, s);
  // the carried prop of the current glide (story.carryAt): the torn poster over the roofs, a coin to the farm / poster
  const cr = carryAt(t, c);
  if (cr && cr.k > 0) {
    if (cr.kind === "poster") s.fx.push(card("carryPoster", 480, 640, LB.poster(0.35), cr.p, 0.7 * cr.k, 0.93 * cr.k, { rot: cr.spin }));
    else if (cr.kind === "lantern") { s.fx.push(card("carryLantern", 200, 300, lanternCard, cr.p, 0.3 * cr.k, 0.45 * cr.k)); s.lights.push(warm(cr.p.clone(), 1.2)); }
    else if (cr.kind === "rat") s.fx.push(card(`carryRat${q((t * 6) % 1, 6)}`, 600, 300, ratRun(true, q((t * 6) % 1, 6)), cr.p, 0.6 * cr.k, 0.3 * cr.k, { rot: cr.spin * 0.5 }));
    else s.fx.push(card("carryCoin", 200, 200, LB.coin, cr.p, 0.32 * cr.k, 0.32 * cr.k, { rot: cr.spin }));
  }
  void fxRing; void lineEnd; void wtn; void DOUMER;
  return s;
};
