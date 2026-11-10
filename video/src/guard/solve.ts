// Auto-framer: from a shot spec (src/videos/<video>/shots.ts) to a camera track (track.ts). For every shot the
// camera is computed from the subjects' boxes:
//   subject height = 35 / 55 / 75 / 60 % of the frame (wide / medium / close / insert), head centre in the upper
//   45 %, 5 % safe margin, nothing within 0.6 m of the lens, a clear line of sight. The base direction is the
//   hand-placed camera's (it knows the rooms and the streets) turned by the spec's angle; if the subject is blocked
//   or the lens is too close to geometry, 12 more candidates are scored (+-30, +-60, +-90 deg, 180, higher, lower,
//   closer, and two higher diagonals) and the best wins. Moving subjects get keys every ~0.4 s (the camera follows);
//   long holds get a middle key (a new move every ~1.2 s). Flights land on the next shot at its t0 after 25-30 eased
//   frames (longer only to keep <= 6 m/frame) along the first of: straight line, the hand camera's own route
//   (through doors, windows, grates), an arc over the top; each smoothed and checked against the geometry.
import * as THREE from "three";
import { bystanderHeads } from "./subjects";
import { Geo } from "./geo";
import { subjectsAt, Place, FxCard } from "./subjects";
import { checkSubjects } from "./core";
import { Track, TShot, TFlight, Key, V3, pathLen, holdPose, along, smoother, trackCam, whipFlight } from "./track";

export type Size = "wide" | "medium" | "close" | "insert";
export type ShotSpec = { t0: number; t1?: number; subjects: string[]; size: Size; angle?: "front" | "left" | "right" | "low" | "high"; move?: "push" | "drift" | "orbit"; note?: string };
export type SolveIn = {
  video: string; fps: number; total: number; geo: Geo; specs: ShotSpec[];
  stage: (t: number, eye: THREE.Vector3) => { places: Place[]; fx: FxCard[] };
  props?: Record<string, (t: number) => THREE.Box3>;
  hand: (t: number) => { pos: THREE.Vector3; look: THREE.Vector3 };     // the hand-placed camera (direction prior, routes)
  setTime?: (t: number) => void;
  /** the hand shot list's explicit waypoints near a landing time (doors, windows, grates, shafts) */
  vias?: (t: number) => V3[][];
};
/** per-shot nudges from the guard loop: rejected candidates, distance scale */
export type Hint = { reject: string[]; scale: number; reason?: string; size?: Size; fails?: number; force?: string };

const FRAC: Record<Size, number> = { wide: 0.35, medium: 0.55, close: 0.75, insert: 0.6 };
const FOV: Record<Size, number> = { wide: 48, medium: 42, close: 38, insert: 38 };
const DOF: Record<Size, number> = { wide: 2, medium: 4, close: 6, insert: 7 };
const ASPECT = 1080 / 1920;
const A3 = (v: THREE.Vector3): V3 => [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
const CANDS: [string, number, number, number][] = [
  ["base", 0, 0, 1], ["az+30", 30, 0, 1], ["az-30", -30, 0, 1], ["az+60", 60, 0, 1], ["az-60", -60, 0, 1], ["higher", 0, 16, 1],
  ["lower", 0, -9, 1], ["closer", 0, 0, 0.82], ["closer 0.6", 0, 0, 0.6], ["closer 0.45", 0, 0, 0.45], ["az+30 high", 30, 14, 1], ["az-30 high", -30, 14, 1], ["az+90", 90, 0, 1], ["az-90", -90, 0, 1], ["az180", 180, 0, 1], ["overhead", 0, 62, 1],
];

export const solve = (I: SolveIn, hints: Hint[] = []): Track => {
  const { geo, specs } = I, END = I.total / I.fps;
  const cam = new THREE.PerspectiveCamera(40, ASPECT, 0.05, 6000);
  const shots: TShot[] = [];
  // fdir = horizontal direction from the look point to the camera (billboards face the camera that is being tried,
  // not the hand camera, whose look point can be elsewhere at this moment)
  const subjAt = (sp: ShotSpec, t: number, eye: THREE.Vector3, fdir?: THREE.Vector3) => {
    I.setTime?.(t); if (I.setTime) geo.refresh();
    const st = I.stage(t, eye), f = (fdir ? fdir.clone() : eye.clone().sub(I.hand(t).look)).setY(0).normalize();
    const right = new THREE.Vector3(-f.z, 0, f.x), up = new THREE.Vector3(0, 1, 0);
    return subjectsAt(sp.subjects, st, eye, right, up, I.props, t).subj;
  };
  /** frame the union box from direction (az, el) at distance scale k: camera pose fitted on screen (subject height =
   *  the size's fraction, width <= 86 %, top edge lifted toward the upper part of the frame so the head sits high) */
  const compose = (sp: ShotSpec, t: number, az: number, el: number, k: number, wMax = 0.74, sx = 0) => {
    const eye0 = I.hand(t).pos, subs = subjAt(sp, t, eye0, new THREE.Vector3(Math.cos(az), 0, Math.sin(az)));
    if (!subs.length) return null;
    const req = subs.filter((s) => !s.opt).length ? subs.filter((s) => !s.opt) : subs;
    const box = new THREE.Box3(); for (const s of req) for (const p of s.pts) box.expandByPoint(p);
    const C = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    const fov = FOV[sp.size], th = Math.tan((fov * Math.PI) / 360), tw = th * ASPECT, want = FRAC[sp.size];
    const dir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
    let d = Math.max(size.y / (2 * want * th), Math.hypot(size.x, size.z) * 0.85 / (2 * wMax * tw), 0.9);
    const pts = req.flatMap((s) => s.pts);
    let look = C.clone(), pos = C.clone().addScaledVector(dir, d);
    const topWant = Math.max(0.1, 0.5 - want / 2 - 0.1);
    for (let it = 0; it < 4; it++) {
      pos = C.clone().addScaledVector(dir, d);
      cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(look); cam.fov = fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      const sp2 = pts.map((p) => p.clone().project(cam));
      const x0 = Math.min(...sp2.map((q) => q.x)), x1 = Math.max(...sp2.map((q) => q.x)), y0 = Math.min(...sp2.map((q) => q.y)), y1 = Math.max(...sp2.map((q) => q.y));
      const hFrac = (y1 - y0) / 2, wFrac = (x1 - x0) / 2;
      d *= Math.max(hFrac / want, wFrac / wMax);                                       // fit size (and width)
      // re-aim: centre horizontally, put the top edge at topWant (NDC y = 1 - 2 * topWant)
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), upv = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      const dist = look.distanceTo(pos), halfH = dist * th, halfW = dist * tw;
      look.addScaledVector(right, ((x0 + x1) / 2 - 2 * sx) * halfW).addScaledVector(upv, (y1 - (1 - 2 * topWant)) * halfH);
    }
    d *= k; pos = C.clone().addScaledVector(dir, d);
    return { pos, look, fov, subs, C, d };
  };
  const score = (pose: { pos: THREE.Vector3; look: THREE.Vector3; fov: number; t: number; sp: ShotSpec }) => {
    const { pos, look, fov } = pose;
    cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(look); cam.fov = fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    let sc = 0; const why: string[] = [];
    if (geo.inside(pos)) { sc += 1000; why.push("inside"); }
    let near = Infinity, walled = 0;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 9; j++) {
      const nd = new THREE.Vector3(((i + 0.5) / 5) * 2 - 1, 1 - ((j + 0.5) / 9) * 2, 0.5).unproject(cam).sub(pos).normalize();
      const h = geo.cast(pos, nd, 1.6 / Math.max(0.2, nd.dot(fwd))); if (h) { const d = h.distance * nd.dot(fwd); near = Math.min(near, d); if (d < 1.5) walled++; }
    }
    if (near < 0.6) { sc += 300; why.push(`near ${near.toFixed(2)}`); } else if (near < 1.5) sc += 10 * (1.5 - near);
    // keep clear of the guard's "view filled within 1.5 m" (85 %) with a margin: the flight in and the hold's own
    // drift must not tip over it
    if (walled / 45 >= 0.65) { sc += 60 * (walled / 45 - 0.6) + 20; why.push(`walled ${Math.round((walled / 45) * 100)} %`); }
    // the guard's own subject rules on this pose (billboards turned to this camera), so the solver and the guard agree
    const t = pose.t, subs2 = subjAt(pose.sp, t, pos, pos.clone().sub(look));
    const chk = checkSubjects(cam, subs2, geo, undefined, { by: bystanderHeads(pose.sp.subjects, I.stage(t, pos)) });
    for (const q of chk.fails) { sc += q.rule === "FACES" ? 25 : q.rule === "OCCLUSION" ? 0 : 40; why.push(q.detail.replace(/ \(.*$/, "")); }
    for (const s2 of subs2) if (!s2.opt) { const b = chk.blocked[s2.id] ?? 0; if (b) { sc += 22 * b; why.push(`${b}/5 blocked`); } }
    if (!chk.anyInView) { sc += 200; why.push("nothing in view"); }
    return { sc, why };
  };
  for (let i = 0; i < specs.length; i++) {
    const sp0 = specs[i], sp: ShotSpec = { ...sp0, size: hints[i]?.size ?? sp0.size }, t0 = sp.t0, t1 = sp.t1 ?? (i + 1 < specs.length ? specs[i + 1].t0 : END), hint = hints[i] ?? { reject: [], scale: 1 };
    let tA = Math.min(t1 - 0.05, t0 + 0.04); let tB = Math.max(tA + 0.2, t1 - 1.0);
    // base direction from the hand camera at the middle of the shot, turned by the spec's angle
    const tm = (tA + tB) / 2, hc = I.hand(tm);
    const subs0 = subjAt(sp, tm, hc.pos);
    const C0 = subs0.length ? subs0[0].centre : hc.look;
    const rel = hc.pos.clone().sub(C0);
    let az0 = Math.atan2(rel.z, rel.x), el0 = THREE.MathUtils.clamp(Math.atan2(rel.y, Math.hypot(rel.x, rel.z)), (2 * Math.PI) / 180, (22 * Math.PI) / 180);
    if (sp.angle === "left") az0 -= (40 * Math.PI) / 180; if (sp.angle === "right") az0 += (40 * Math.PI) / 180;
    if (sp.angle === "low") el0 = (-4 * Math.PI) / 180; if (sp.angle === "high") el0 = (30 * Math.PI) / 180;
    // moving subjects: how far does the union centre travel during the hold?
    let subsB = subjAt(sp, tB, hc.pos);
    const travel = subs0.length && subsB.length ? subsB[0].centre.distanceTo(subjAt(sp, tA, hc.pos)[0]?.centre ?? subsB[0].centre) : 0;
    if (travel > 1) { tA = t0 + 0.001; tB = Math.max(tA + 0.2, t1 - 0.2); subsB = subjAt(sp, tB, hc.pos); }   // tracking: keys reach the whip start (a moving subject is followed until the transition)
    const nK = Math.max(3, Math.ceil((tB - tA) / (travel > 3 ? 0.05 : 0.2)) + 1);
    // a new camera move every ~1.2 s (CLAUDE.md 1): static subjects get one eased move per beat (keys at the beats);
    // moving subjects are followed with keys every 0.1-0.2 s while the beat moves blend underneath
    const nBeat = Math.max(1, Math.round((tB - tA) / 1.2)), beatT = Array.from({ length: nBeat + 1 }, (_, k) => tA + ((tB - tA) * k) / nBeat);
    const times: number[] = travel > 1.0 ? Array.from({ length: nK }, (_, k) => tA + ((tB - tA) * k) / (nK - 1)) : beatT;
    // beat b: distance scale and the subject's horizontal place on screen (push in / drift aside / pull back / drift back)
    const mvS = sp.move ?? (i % 2 ? "drift" : "push");
    const BEAT: [number, number, number][] = mvS === "push" ? [[1.1, 0, 0], [0.9, 0.05, 0.1], [0.76, 0, 0], [0.92, -0.05, -0.14]]
      : mvS === "orbit" ? [[1, 0, -0.22], [0.82, 0.04, 0], [1, 0, 0.22], [0.8, -0.04, 0]] : [[1, -0.07, -0.14], [0.84, 0, 0], [1, 0.07, 0.14], [1.12, 0, 0]];
    // a fast followed subject already changes the picture: only gentle beats underneath (a slow one gets the full beats)
    if (travel > 4) for (const B of BEAT) { B[0] = 1 + (B[0] - 1) * 0.35; B[1] *= 0.5; B[2] *= 0.3; }
    const beatAt = (t: number) => { const x = Math.min(nBeat, Math.max(0, ((t - tA) / Math.max(1e-3, tB - tA)) * nBeat)), b = Math.min(nBeat - 1, Math.floor(x)), e = smoother(x - b);
      const P = BEAT[b % 4], Q = BEAT[(b + 1) % 4]; return [P[0] + (Q[0] - P[0]) * e, P[1] + (Q[1] - P[1]) * e, P[2] + (Q[2] - P[2]) * e]; };
    let best: { name: string; sc: number; keys: Key[]; why: string[] } | null = null;
    for (const [name, daz, del, kk] of CANDS) {
      if (hint.force ? name !== hint.force : hint.reject.includes(name)) continue;
      const az = az0 + (daz * Math.PI) / 180, el = THREE.MathUtils.clamp(el0 + (del * Math.PI) / 180, (-12 * Math.PI) / 180, (80 * Math.PI) / 180);
      const keys: Key[] = []; const pen = (Math.abs(daz) / 30 + Math.abs(del) / 15 + (kk < 1 ? 1 : 0)) * 3; let sc = 0; const why: string[] = [];
      let ok = true;
      times.forEach((t, k) => {
        // the move: push in over the hold, or drift sideways / orbit a little (alternating), so the camera never freezes
        const u = times.length > 1 ? k / (times.length - 1) : 0, mv = sp.move ?? (i % 2 ? "drift" : "push");
        const [bk, bsx, baz] = beatAt(t); void u; void mv;
        const p = compose(sp, t, az + baz, el, kk * hint.scale * bk, travel > 1 ? 0.6 : 0.74, bsx);
        if (!p) { ok = false; return; }
        const s = score({ ...p, t, sp }); sc = Math.max(sc, s.sc); why.push(...s.why);
        keys.push({ t: +t.toFixed(3), pos: A3(p.pos), look: A3(p.look), fov: p.fov });
      });
      if (!ok) continue;
      void 0;
      const total = sc + pen;
      if (!best || total < best.sc) best = { name: (travel > 1 ? "track " : "") + name, sc: total, keys, why: [...new Set(why)] };
      if (best && best.sc < 8 && name === "base") break;
    }
    if (hint.force ? hint.force === "hand" : !hint.reject.includes("hand") && (!best || best.sc >= 20)) {
      const keys: Key[] = []; let sc = 6; const why: string[] = [];
      for (const t of times) { const h = I.hand(t), subs = subjAt(sp, t, h.pos); if (!subs.length) { sc = 1e9; break; }
        const s2 = score({ pos: h.pos, look: h.look, fov: 44, t, sp }); sc = Math.max(sc, s2.sc + 6); why.push(...s2.why);
        keys.push({ t: +t.toFixed(3), pos: A3(h.pos), look: A3(h.look), fov: 44 }); }
      if (sc < 1e9 && (!best || sc < best.sc)) best = { name: (travel > 1 ? "track " : "") + "hand", sc, keys, why: [...new Set(why)] };
    }
    if (!best) { const h = I.hand(tA); best = { name: "hand (no subject on stage)", sc: 999, keys: [{ t: tA, pos: A3(h.pos), look: A3(h.look), fov: 44 }, { t: tB, pos: A3(I.hand(tB).pos), look: A3(I.hand(tB).look), fov: 44 }], why: ["no subject"] }; }
    best.keys[0].t = t0;
    shots.push({ t0, t1, keys: best.keys, dof: DOF[sp.size], size: sp.size, cand: `${best.name} (score ${best.sc.toFixed(0)}${best.why.length ? ": " + best.why.join(", ") : ""})` });
  }
  // ---- flights ----
  /** first problem of a fly transition (null = fine): any frame with no real subject in view, or geometry within
   *  0.4 m / filling the view / around the camera */
  const flightProblem = (fl: TFlight, i: number): string | null => {
    const tmp: Track = { video: I.video, shots, flights: [fl] };
    const n = Math.max(2, Math.round((fl.t1 - fl.t0) * I.fps));
    for (let k = 0; k <= n; k++) {
      const t = Math.min(fl.t1 - 1e-3, fl.t0 + k / I.fps), c = trackCam(tmp, t);
      cam.position.copy(c.pos); cam.up.set(0, 1, 0); cam.lookAt(c.look); cam.fov = c.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      const subs = [...subjAt(specs[i], t, c.pos), ...subjAt(specs[i + 1], t, c.pos)].filter((q) => !q.opt);
      if (!checkSubjects(cam, subs, geo).anyInView) return `no subject in view at ${t.toFixed(2)} s`;
      const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); let near = Infinity, walled = 0;
      for (let a = 0; a < 5; a++) for (let b2 = 0; b2 < 9; b2++) { const nd = new THREE.Vector3(((a + 0.5) / 5) * 2 - 1, 1 - ((b2 + 0.5) / 9) * 2, 0.5).unproject(cam).sub(c.pos).normalize(); const h = geo.cast(c.pos, nd, 1.6 / Math.max(0.2, nd.dot(fwd))); if (h) { const d = h.distance * nd.dot(fwd); near = Math.min(near, d); if (d < 1.5) walled++; } }
      if (near < 0.45 || walled >= 0.8 * 45) return `geometry against the lens at ${t.toFixed(2)} s`;
      if (geo.inside(c.pos)) return `camera inside geometry at ${t.toFixed(2)} s`;
    }
    return null;
  };
  const whipInto = (i: number, why: string): TFlight => whipFlight({ video: I.video, shots, flights: [] }, i, I.fps, why);
  const flights: TFlight[] = [];
  for (let i = 0; i + 1 < shots.length; i++) {
    const S = shots[i], N = shots[i + 1];
    const B = new THREE.Vector3(...N.keys[0].pos), last = S.keys[S.keys.length - 1];
    const Apos = new THREE.Vector3(...last.pos);
    const L0 = Apos.distanceTo(B);
    if (L0 < 0.05) continue;
    const routes: { name: string; pts: THREE.Vector3[] }[] = [{ name: "straight", pts: [Apos, B] }];
    // the hand camera's own route around this landing (it passes through doors, windows, grates)
    {
      // the hand camera flew between these places too: take its path from where it came closest to A to where it
      // came closest to B (it threads the doors, windows, grates and shafts)
      const ts: number[] = []; for (let t = Math.max(0, S.t0 - 1); t <= Math.min(END, N.t0 + 2.5); t += 1 / 30) ts.push(t);
      const P = ts.map((t) => I.hand(t).pos);
      // join the hand path where it can be reached in a clear straight line (nearest such point)
      const reach = (Q: THREE.Vector3) => { let best = -1; P.forEach((p, k) => { if ((best < 0 || p.distanceTo(Q) < P[best].distanceTo(Q)) && p.distanceTo(Q) < 40 && geo.segmentFree(Q, p, 0.1)) best = k; }); if (best < 0) P.forEach((p, k) => { if (best < 0 || p.distanceTo(Q) < P[best].distanceTo(Q)) best = k; }); return best; };
      const ia = reach(Apos), ib = reach(B);
      if (ib > ia + 2) { const seg = P.slice(ia, ib + 1).filter((p, k, a) => k === 0 || p.distanceTo(a[k - 1]) > 0.08); routes.push({ name: "hand route", pts: [Apos, ...seg, B] }); }
      else if (ia > ib + 2) { const seg = P.slice(ib, ia + 1).reverse().filter((p, k, a) => k === 0 || p.distanceTo(a[k - 1]) > 0.08); routes.push({ name: "hand route (reversed)", pts: [Apos, ...seg, B] }); }
    }
    for (const v of I.vias?.(N.t0) ?? []) {
      const pts = v.map((q) => new THREE.Vector3(...q));
      // fly the waypoints in the order that starts nearer to A
      const fwdOrder = pts[0].distanceTo(Apos) + pts[pts.length - 1].distanceTo(B) <= pts[pts.length - 1].distanceTo(Apos) + pts[0].distanceTo(B);
      routes.splice(1, 0, { name: "hand waypoints", pts: [Apos, ...(fwdOrder ? pts : pts.reverse()), B] });
    }
    const lift = Math.min(25, Math.max(2.5, L0 * 0.3));
    routes.push({ name: "arc over", pts: [Apos, Apos.clone().setY(Math.max(Apos.y, B.y) + lift), B.clone().setY(Math.max(Apos.y, B.y) + lift), B] });
    const chaikin = (p: THREE.Vector3[]) => { let q = p; for (let r = 0; r < 2; r++) { const o = [q[0]]; for (let k = 0; k + 1 < q.length; k++) { o.push(q[k].clone().lerp(q[k + 1], 0.25), q[k].clone().lerp(q[k + 1], 0.75)); } o.push(q[q.length - 1]); q = o; } return q; };
    const repair = (pts0: THREE.Vector3[]) => {
      let pts = pts0.slice();
      for (let pass = 0; pass < 3; pass++) {
        const out: THREE.Vector3[] = [pts[0]]; let fixedAll = true;
        for (let k = 0; k + 1 < pts.length; k++) {
          const a = pts[k], c = pts[k + 1];
          if (geo.segmentFree(a, c, 0.1)) { out.push(c); continue; }
          const m = a.clone().lerp(c, 0.5), d = c.clone().sub(a).normalize();
          const side = new THREE.Vector3(-d.z, 0, d.x); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
          const up2 = new THREE.Vector3().crossVectors(side, d).normalize();
          let done = false;
          for (const r of [0.3, 0.6, 1.2, 2.5]) for (const o of [side, side.clone().negate(), up2, up2.clone().negate(), new THREE.Vector3(0, 1, 0)]) {
            if (done) break;
            const q = m.clone().addScaledVector(o, r);
            if (geo.segmentFree(a, q, 0.1) && geo.segmentFree(q, c, 0.1)) { out.push(q, c); done = true; }
          }
          if (!done) { out.push(m, c); fixedAll = false; }
        }
        pts = out; if (fixedAll) break;
      }
      return pts;
    };
    let pick = routes[0], pickPts = routes[0].pts, bestBad = Infinity; const tried: string[] = [];
    for (const r of routes) {
      // waypoint routes are not corner-cut (a smoothed corner at a shaft mouth runs into the wall); the others are
      const hand = r.name.startsWith("hand");
      let pts = r.pts.length > 2 && r.name !== "hand waypoints" ? chaikin(r.pts) : r.pts;
      const cnt = (q: THREE.Vector3[]) => { let n = 0; for (let k = 0; k + 1 < q.length; k++) if (!geo.segmentFree(q[k], q[k + 1], hand ? 0.1 : 0.25)) n++; return n; };
      let bad = cnt(pts);
      if (bad > 0) { const fixed = repair(pts), nb = cnt(fixed); if (nb < bad) { pts = fixed; bad = nb; } }
      tried.push(`${r.name}:${bad}`);
      if (bad < bestBad || (bad === bestBad && hand)) { bestBad = bad; pick = r; pickPts = pts; }
      if (bad === 0 && !hand && routes.some((q) => q.name.startsWith("hand"))) continue;
      if (bad === 0) break;
    }
    let path = pickPts.map(A3), len = pathLen(path);
    let frames = Math.max(28, Math.ceil((len * 1.875) / 6));                           // smootherstep peak = 1.875 x mean
    const room = (N.t0 - S.t0) * I.fps - 9;                                             // keep >= 0.3 s of the shot
    frames = Math.max(18, Math.min(frames, Math.floor(room)));
    // the flight starts from the pose the hold has reached at that moment (moving-subject holds are mid-move)
    const tS = +(N.t0 - frames / I.fps).toFixed(3), A0 = holdPose(S, tS, tS).pos;
    path = [A3(A0), ...path.slice(1)];
    // swing the view from the outgoing to the incoming subject where one stops / the other starts being visible
    const vis = (from: THREE.Vector3, target: THREE.Vector3) => { const d = target.clone().sub(from), L = d.length(); return L < 0.3 || !geo.cast(from, d.normalize(), L - 0.3); };
    const TA = new THREE.Vector3(...holdPose(S, tS, tS).look), TB = new THREE.Vector3(...N.keys[0].look);
    const us = Array.from({ length: 31 }, (_, k) => k / 30), P = us.map((u) => along(path, smoother(u)));
    let uA = 0; while (uA < 30 && vis(P[uA + 1], TA)) uA++;
    let uB = 30; while (uB > 0 && vis(P[uB - 1], TB)) uB--;
    let s0: number, s1: number;
    if (uB <= uA) { const m = Math.min(Math.max((uA + uB) / 60, 0.3), 0.7); s0 = m - 0.2; s1 = m + 0.2; }
    else { s0 = Math.max(0, uA / 30 - 0.05); s1 = Math.min(1, Math.max(s0 + 0.3, uB / 30 + 0.05)); }
    const swing: [number, number] = [+s0.toFixed(3), +s1.toFixed(3)];
    // enclosed stretches (a grate, shaft, window, door): if the planned view is walled in, look down the path there
    const ahead: number[] = [];
    {
      const tmp: Track = { video: I.video, shots, flights: [{ t0: tS, t1: N.t0, to: i + 1, path, swing }] };
      const walled = (pos: THREE.Vector3, look: THREE.Vector3) => {
        cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(look); cam.fov = 44; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
        const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); let n = 0;
        for (let a = 0; a < 5; a++) for (let b2 = 0; b2 < 9; b2++) { const nd = new THREE.Vector3(((a + 0.5) / 5) * 2 - 1, 1 - ((b2 + 0.5) / 9) * 2, 0.5).unproject(cam).sub(pos).normalize(); const h = geo.cast(pos, nd, 1.6 / Math.max(0.2, nd.dot(fwd))); if (h && h.distance * nd.dot(fwd) < 1.6) n++; }
        return n / 45;
      };
      const raw: number[] = [];
      for (let k = 0; k <= 30; k++) {
        const t = tS + ((N.t0 - tS) * k) / 30, c = trackCam(tmp, Math.min(t, N.t0 - 1e-3));
        const e = smoother(k / 30), tg = along(path, Math.min(1, e + 0.04)).sub(along(path, Math.max(0, e - 0.04)));
        const w0 = walled(c.pos, c.look), w1 = tg.lengthSq() > 1e-8 ? walled(c.pos, c.pos.clone().add(tg.normalize())) : 1;
        raw.push(w0 >= 0.4 && w1 < w0 - 0.1 ? 1 : 0);
      }
      for (let k = 0; k <= 30; k++) { let m = 0; for (let j = -4; j <= 4; j++) m = Math.max(m, raw[k + j] ?? 0); ahead.push(m); }   // widen
    }
    const fly: TFlight = { kind: "fly", t0: tS, t1: N.t0, to: i + 1, path, swing, ...(ahead.some((x) => x > 0) ? { ahead } : {}) };
    // a flight only exists if it never touches geometry and a real subject (of either shot) stays in view on every frame
    const why = bestBad > 0 ? `route blocked (${bestBad} segments)` : flightProblem(fly, i);
    if (!why) flights.push({ ...fly, ...({ route: pick.name, tried: tried.join(" "), peak: +((len * 1.875) / frames).toFixed(2) } as object) });
    else flights.push(whipInto(i, why));
  }
  return { video: I.video, shots, flights };
};
