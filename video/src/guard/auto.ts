// The auto-framing loop: solve (solve.ts) -> camera guard (core.ts) -> re-solve the shots with CRITICAL failures,
// up to 5 rounds. Also the guard-only path for a committed camtrack.json. Shared by the Rats and Moon adapters.
import * as THREE from "three";
import { Geo } from "./geo";
import { run, Row, Cam, Place, FxCard } from "./core";
import { solve, ShotSpec, Hint } from "./solve";
import { Track, trackCam } from "./track";

export type AutoCfg = {
  video: string; fps: number; total: number; root: THREE.Object3D; specs: ShotSpec[];
  stage: (t: number, c: Cam, cam: THREE.Camera) => { places: Place[]; fx: FxCard[] };
  camAt: (t: number) => Cam; camAtHand: (t: number) => Cam;
  setTrack: (t: Track | null) => void; getTrack: () => Track | null;
  setTime?: (t: number) => void; props?: Record<string, (t: number) => THREE.Box3>;
  vias?: (t: number) => [number, number, number][][];
};
const dummy = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.05, 6000);
const adapter = (C: AutoCfg, tr: Track) => ({
  name: C.video, fps: C.fps, total: C.total, root: C.root, camAt: C.camAt, stage: C.stage, setTime: C.setTime, props: C.props,
  moment: (t: number) => {
    const p = trackCam(tr, t), flying = p.flying >= 0;
    // in a flight the subjects of both shots count, and so does the prop the camera carries across (rule 2)
    const ids = [...new Set([...C.specs[p.shot].subjects, ...(flying ? [...C.specs[p.next].subjects, "?f:carry"] : [])])];
    return { ids, flight: flying, shot: flying ? p.next : p.shot };
  },
});
export const guardOnly = (C: AutoCfg) => {
  const tr = C.getTrack(); if (!tr) throw new Error(`${C.video}: no camtrack.json yet (run scripts/autoframe.mjs)`);
  return { track: tr, rows: run(adapter(C, tr)), history: [] as string[] };
};
export const loop = (C: AutoCfg, maxIter = 5) => {
  const geo = new Geo(C.root);
  const hints: Hint[] = C.specs.map(() => ({ reject: [], scale: 1 }));
  const history: string[] = [];
  const perShot = new Map<number, { n: number; cand: string; hint: Hint }>();
  const solveIn = {
    video: C.video, fps: C.fps, total: C.total, geo, specs: C.specs, props: C.props, setTime: C.setTime, vias: C.vias,
    hand: (t: number) => C.camAtHand(t),
    stage: (t: number, eye: THREE.Vector3) => { const h = C.camAtHand(t); dummy.position.copy(eye); dummy.lookAt(h.look); dummy.updateMatrixWorld(); return C.stage(t, h, dummy); },
  };
  let track: Track | null = null, rows: Row[] = [], best: { track: Track; rows: Row[]; n: number; round: number } | null = null;
  for (let it = 1; it <= maxIter; it++) {
    C.setTrack(null);                                   // solve against the hand camera's world state
    track = solve(solveIn, hints);
    C.setTrack(track);
    rows = run(adapter(C, track), geo);
    const crit = rows.filter((r) => r.fails.some((q) => q.critical));
    const byShot = new Map<number, string[]>();
    for (const r of crit) { const l = byShot.get(r.shot) ?? []; for (const q of r.fails) if (q.critical) l.push(q.detail); byShot.set(r.shot, l); }
    history.push(`round ${it}: ${crit.length} frames with CRITICAL failures in ${byShot.size} shots` + (byShot.size ? ` (${[...byShot.keys()].join(", ")})` : ""));
    if (!best || crit.length < best.n) best = { track, rows, n: crit.length, round: it };
    // per shot: remember the settings of the round where this shot had the fewest CRITICAL frames
    C.specs.forEach((_, i) => {
      const n = crit.filter((r) => r.shot === i).length, cur = perShot.get(i);
      if (!cur || n < cur.n) perShot.set(i, { n, cand: track!.shots[i].cand.replace(/^track /, "").replace(/ \(.*$/, ""), hint: { ...hints[i], reject: [...hints[i].reject] } });
    });
    if (!crit.length) break;
    // re-solve only the failing shots: drop the candidate that failed, and size the framing by the reason
    for (const [i, why] of byShot) {
      const h = hints[i], cand = track.shots[i].cand.replace(/^track /, "").replace(/ \(.*$/, "");
      if (!h.reject.includes(cand)) h.reject.push(cand);
      const w = why.join(" ");
      h.fails = (h.fails ?? 0) + 1;
      // failing twice for blocked views / too-small subjects: frame tighter (wide -> medium -> close)
      if (h.fails >= 2 && /blocked|too small|none of/.test(w)) { const cur = h.size ?? C.specs[i].size; h.size = cur === "wide" ? "medium" : cur === "medium" ? "close" : cur; }
      if (/too small/.test(w)) h.scale *= 0.85;
      else if (/cut off|out of frame|behind the camera|reaches behind|cropped/.test(w)) h.scale *= 1.15;
      h.reason = w.slice(0, 160);
    }
  }
  // assemble: every shot with the settings of the round where IT failed least, then guard that combination too
  if (perShot.size) {
    const H: Hint[] = C.specs.map((_, i) => { const b = perShot.get(i); return b ? { ...b.hint, reject: [], force: b.cand } : { reject: [], scale: 1 }; });
    C.setTrack(null);
    const tr = solve(solveIn, H); C.setTrack(tr);
    const rw = run(adapter(C, tr), geo), n = rw.filter((r) => r.fails.some((q) => q.critical)).length;
    history.push(`assembled the best round of every shot: ${n} frames with CRITICAL failures`);
    if (!best || n < best.n) best = { track: tr, rows: rw, n, round: 0 };
  }
  // flight polish: a flight with CRITICAL frames tries other look timings (swing earlier / later, looking down the
  // path all the way or never) and an earlier start; each variant is guarded on that flight's frames only
  if (best && best.n > 0) {
    const tr: Track = JSON.parse(JSON.stringify(best.track));
    C.setTrack(tr);
    const critIn = (rw: Row[]) => rw.filter((r) => r.fails.some((q) => q.critical)).length;
    let fixedN = 0;
    for (const fl of tr.flights) {
      const f0 = Math.floor(fl.t0 * C.fps) - 2, f1 = Math.ceil(fl.t1 * C.fps) + 2, frames = Array.from({ length: f1 - f0 + 1 }, (_, k) => f0 + k);
      let cur = critIn(run(adapter(C, tr), geo, frames)); if (!cur) continue;
      const base = JSON.parse(JSON.stringify(fl));
      const variants: ((g: typeof fl) => void)[] = [
        (g) => { g.swing = [Math.max(0, (base.swing?.[0] ?? 0.3) - 0.15), Math.max(0.2, (base.swing?.[1] ?? 0.7) - 0.15)]; },
        (g) => { g.swing = [Math.min(0.8, (base.swing?.[0] ?? 0.3) + 0.15), Math.min(1, (base.swing?.[1] ?? 0.7) + 0.15)]; },
        (g) => { g.ahead = Array(31).fill(1); },
        (g) => { delete g.ahead; },
        (g) => { g.swing = [0.05, 0.35]; },
        (g) => { g.swing = [0.6, 0.95]; },
        // bend the middle of the path (endpoints stay): up, down, either side
        ...[[0, 0.6, 0], [0, -0.4, 0], [0.6, 0, 0], [-0.6, 0, 0], [0, 0, 0.6], [0, 0, -0.6], [0, 1.2, 0]].map((o) => (g: typeof fl) => {
          const n = g.path.length - 1;
          g.path = g.path.map((p, k) => { const w = Math.sin((Math.PI * k) / Math.max(1, n)); return [p[0] + o[0] * w, p[1] + o[1] * w, p[2] + o[2] * w] as [number, number, number]; });
        }),
      ];
      let bestV = JSON.parse(JSON.stringify(base));
      for (const v of variants) {
        Object.assign(fl, JSON.parse(JSON.stringify(base))); if (!base.ahead) delete fl.ahead; v(fl);
        const n = critIn(run(adapter(C, tr), geo, frames));
        if (n < cur) { cur = n; bestV = JSON.parse(JSON.stringify(fl)); }
        if (!cur) break;
      }
      for (const k of Object.keys(fl)) delete (fl as Record<string, unknown>)[k];
      Object.assign(fl, bestV);
      if (!cur) fixedN++;
    }
    const rw = run(adapter(C, tr), geo), n = critIn(rw);
    history.push(`flight polish (look timing per failing flight): ${n} frames with CRITICAL failures (${fixedN} flights cleared)`);
    if (n < best.n) best = { track: tr, rows: rw, n, round: -1 };
  }
  if (best && best.track !== track) { history.push(best.round > 0 ? `kept round ${best.round} (fewest CRITICAL frames: ${best.n})` : best.round === 0 ? `kept the assembled track (${best.n} CRITICAL frames)` : `kept the polished track (${best.n} CRITICAL frames)`); track = best.track; rows = best.rows; C.setTrack(track); }
  return { track: track!, rows, history };
};
/** debug: run the guard on a few frames of the committed track (prints occlusion hits when GUARD_DBG_OCC is set) */
export const guardFrames = (C: AutoCfg, frames: number[]) => { const tr = C.getTrack()!; return run(adapter(C, tr), new Geo(C.root), frames); };
