// Camera guard (CLAUDE.md rule 13): math-only checks of every frame BEFORE any render. Builds the video's world once
// (Node + a stub canvas, no WebGL, no pixels), replays the camera and the cast for every frame and tests the subjects:
//   1 SUBJECT   every subject inside the 5 % safe margin and big enough (characters >= 30 % of the frame height,
//               props >= 15 %). Characters may be cropped at the bottom (medium / chest-up shots) as long as the crop
//               is below the chest; never at the top or the sides. A prop bigger than the frame fills it.
//   2 OCCLUSION rays from the camera to 5 points of each subject (centre + 4 inset corners): more than 2 blocked
//               for more than 3 consecutive frames. A landmark's own geometry does not occlude it.
//   3 CLIPPING  geometry closer than 0.4 m in view (9 x 16 view rays), the view filled by geometry within 1.5 m
//               (>= 85 % of the rays: flying through a wall / floor / beam), or the camera inside a solid.
//   4 EMPTY     no subject in view.
//   5 FACES     a subject character's head centre below 55 % of the frame height.
// CRITICAL vs warning: on held frames every failure is CRITICAL. During a flight between two shots (auto-framed
// videos: the track says so; hand cameras: the glide mix) CLIPPING and EMPTY stay CRITICAL (EMPTY includes "every
// subject blocked"), while SUBJECT, OCCLUSION of one of them and FACES are warnings (the camera is travelling).
import * as THREE from "three";
import { Geo } from "./geo";
import { subjectsAt, Place, FxCard, Subj } from "./subjects";

export type { Place, FxCard };
export type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number; shot: number; mix: number };
/** a subject window (hand-camera videos): from..to (s) and the subject ids of that moment */
export type Window = { from: number; to: number; ids: string[]; why: string };
export type Adapter = {
  name: string; fps: number; total: number;
  root: THREE.Object3D;
  camAt: (t: number) => Cam;
  stage: (t: number, c: Cam, cam: THREE.Camera) => { places: Place[]; fx: FxCard[] };
  setTime?: (t: number) => void;
  props?: Record<string, (t: number) => THREE.Box3>;
  windows?: Window[];
  /** auto-framed videos: the subjects of this moment and whether the camera is in a flight (and which shot) */
  moment?: (t: number) => { ids: string[]; flight: boolean; shot: number };
};
export type Fail = { rule: "SUBJECT" | "OCCLUSION" | "CLIPPING" | "EMPTY" | "FACES"; subject?: string; detail: string; critical: boolean };
export type Row = { f: number; t: number; shot: number; flight: boolean; subjects: string[]; fails: Fail[]; score: number };
const W8 = { CLIPPING: 5, EMPTY: 4, OCCLUSION: 3, SUBJECT: 2, FACES: 1 } as const;

/** the subject rules (1 SUBJECT, 2 OCCLUSION, 5 FACES) for one camera; occRun carries the occlusion run lengths
 *  between consecutive frames (pass a fresh Map for a single pose). Optional subjects only count as "in view". */
export const checkSubjects = (cam: THREE.PerspectiveCamera, subj: Subj[], geo: Geo, occRun = new Map<string, number>()) => {
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  const toScreen = (p: THREE.Vector3) => { const v = p.clone().project(cam); const behind = p.clone().sub(cam.position).dot(fwd) <= 0.05; return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, behind }; };
  const fails: Omit<Fail, "critical">[] = [];
  const addS = (s: Subj, q: Omit<Fail, "critical">) => { if (!s.opt) fails.push(q); };
  let anyInView = false; const blk: Record<string, number> = {};
    for (const s of subj) {
      const sp = s.pts.map(toScreen);
      if (sp.every((q) => q.behind)) { addS(s, { rule: "SUBJECT", subject: s.id, detail: "behind the camera" }); occRun.set(s.id, 0); continue; }
      const front = sp.filter((q) => !q.behind), straddle = front.length < sp.length;
      const x0 = Math.min(...front.map((q) => q.x)), x1 = Math.max(...front.map((q) => q.x)), y0 = Math.min(...front.map((q) => q.y)), y1 = Math.max(...front.map((q) => q.y));
      if (!(x1 > 0 && x0 < 1 && y1 > 0 && y0 < 1)) { addS(s, { rule: "SUBJECT", subject: s.id, detail: `out of frame (x ${x0.toFixed(2)}..${x1.toFixed(2)}, y ${y0.toFixed(2)}..${y1.toFixed(2)})` }); occRun.set(s.id, 0); continue; }
      const visH = Math.min(1, y1) - Math.max(0, y0);
      const fills = s.kind === "prop" && y1 - y0 > 0.9 && x1 - x0 > 0.9;
      let cut = "";
      if (!fills) {
        if (straddle) cut = "reaches behind the camera";
        else if (x0 < 0.05) cut = `cut off left (${x0.toFixed(2)})`;
        else if (x1 > 0.95) cut = `cut off right (${x1.toFixed(2)})`;
        else if (y0 < 0.05) cut = `cut off top (${y0.toFixed(2)})`;
        else if (y1 > 0.95) {
          if (s.kind === "char") { const chestY = toScreen(new THREE.Vector3(s.pts[0].x, s.chest ?? 0, s.pts[0].z)).y; if (chestY > 0.95) cut = `cropped above the chest (${chestY.toFixed(2)})`; }
          else cut = `cut off bottom (${y1.toFixed(2)})`;
        }
      }
      if (cut) addS(s, { rule: "SUBJECT", subject: s.id, detail: cut });
      const minH = s.kind === "char" ? 0.3 : 0.15;
      if (visH < minH && !fills) addS(s, { rule: "SUBJECT", subject: s.id, detail: `too small (${Math.round(visH * 100)} % of frame height, needs ${minH * 100} %)` });
      // occlusion: centre + 4 corners of the screen box (inset 15 %), at the subject's depth
      const depth = s.pts.reduce((a, p) => a + p.clone().sub(cam.position).dot(fwd), 0) / s.pts.length;
      let blocked = 0;
      for (const [u, v] of [[0.5, 0.5], [0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]]) {
        const sx = Math.min(0.98, Math.max(0.02, x0 + (x1 - x0) * u)), sy = Math.min(0.98, Math.max(0.02, y0 + (y1 - y0) * v));
        const nd = new THREE.Vector3(sx * 2 - 1, 1 - sy * 2, 0.5).unproject(cam).sub(cam.position).normalize();
        const dist = Math.max(0.1, depth / Math.max(0.05, nd.dot(fwd)));
        const h = geo.cast(cam.position, nd, Math.max(0.05, dist - 0.35));
        if (h && !(s.own && s.own.containsPoint(h.point))) blocked++;
        if (h && (globalThis as unknown as { GUARD_DBG_OCC?: boolean }).GUARD_DBG_OCC) console.log("[occ]", s.id, (h.object.material as THREE.Material & { name?: string }).name || (h.object.material as THREE.MeshLambertMaterial).color?.getHexString?.(), h.distance.toFixed(2), "of", dist.toFixed(2), h.point.toArray().map((x) => +x.toFixed(2)));
      }
      blk[s.id] = blocked;
      const runN = blocked > 2 ? (occRun.get(s.id) ?? 0) + 1 : 0; occRun.set(s.id, runN);
      if (runN > 3) addS(s, { rule: "OCCLUSION", subject: s.id, detail: `${blocked}/5 rays blocked for ${runN} frames` });
      if (blocked < 5) anyInView = true;
      if (s.head) { const h = toScreen(s.head); if (!h.behind && h.x > 0 && h.x < 1 && h.y > 0.55 && h.y < 1) addS(s, { rule: "FACES", subject: s.id, detail: `head centre at ${Math.round(h.y * 100)} % of the frame height` }); }
    }
  return { fails, anyInView, blocked: blk };
};

export const run = (A: Adapter, geo = new Geo(A.root), frames?: number[]): Row[] => {
  const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.05, 6000);
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const toScreen = (p: THREE.Vector3) => { const v = p.clone().project(cam); const behind = p.clone().sub(cam.position).dot(fwd) <= 0.05; return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, behind }; };
  const rows: Row[] = [];
  const occRun = new Map<string, number>();
  const list = frames ?? Array.from({ length: A.total }, (_, f) => f);
  for (const f of list) {
    const t = f / A.fps, c = A.camAt(t);
    if (A.setTime) { A.setTime(t); geo.refresh(); }
    cam.position.copy(c.pos); cam.up.set(0, 1, 0); cam.lookAt(c.look); cam.rotateZ(c.roll); cam.fov = c.fov;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    cam.getWorldDirection(fwd); right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
    const st = A.stage(t, c, cam);
    const mo = A.moment ? A.moment(t) : { ids: [...new Set((A.windows ?? []).filter((w) => t >= w.from && t < w.to).flatMap((w) => w.ids))], flight: c.mix > 0, shot: c.shot };
    const flight = mo.flight, ids = mo.ids;
    const fails: Fail[] = [];
    const add = (q: Omit<Fail, "critical">) => fails.push({ ...q, critical: !flight || q.rule === "CLIPPING" || q.rule === "EMPTY" });
    const { subj, missing } = subjectsAt(ids, st, cam.position, right, up, A.props, t);
    if ((globalThis as unknown as { GUARD_DBG_OCC?: boolean }).GUARD_DBG_OCC) console.log("[subj]", f, ids.join(","), "found", subj.map((q) => q.id + "@" + q.centre.toArray().map((x) => +x.toFixed(1))).join(" "), "fx", st.fx.map((q) => q.key.split("|")[0]).filter((k) => !k.startsWith("bg")).join(","));
    for (const id of missing) add({ rule: "SUBJECT", subject: id, detail: "not on stage" });
    const chk = checkSubjects(cam, subj, geo, occRun);
    for (const q of chk.fails) add(q);
    const anyInView = chk.anyInView;
    if (!ids.length) add({ rule: "EMPTY", detail: "no subject declared for this moment" });
    else if (!anyInView) add({ rule: "EMPTY", detail: `none of ${ids.join(", ")} in view` });
    // CLIPPING
    let near = Infinity, walled = 0;
    for (let i = 0; i < 9; i++) for (let j = 0; j < 16; j++) {
      const nd = new THREE.Vector3(((i + 0.5) / 9) * 2 - 1, 1 - ((j + 0.5) / 16) * 2, 0.5).unproject(cam).sub(cam.position).normalize();
      const h = geo.cast(cam.position, nd, 1.5 / Math.max(0.2, nd.dot(fwd)));
      if (h) { const d = h.distance * nd.dot(fwd); near = Math.min(near, d); if (d < 1.5) walled++; }
    }
    if (walled >= 0.85 * 144) add({ rule: "CLIPPING", detail: `view filled by geometry within 1.5 m (${Math.round(walled / 1.44)} % of the frame)` });
    if (near < 0.4) add({ rule: "CLIPPING", detail: `geometry ${near.toFixed(2)} m from the lens` });
    if (geo.inside(cam.position)) add({ rule: "CLIPPING", detail: "camera inside a solid" });
    const score = fails.reduce((a, q) => a + W8[q.rule] * (q.critical ? 1 : 0.2), 0);
    rows.push({ f, t: +t.toFixed(3), shot: mo.shot, flight, subjects: ids, fails, score });
  }
  // occlusion needs > 3 consecutive frames: the first 3 frames of every qualifying run fail too
  for (let i = 0; i < rows.length; i++) for (const q of rows[i].fails) if (q.rule === "OCCLUSION" && q.detail.endsWith(" 4 frames")) {
    for (let k = 1; k <= 3 && i - k >= 0; k++) if (!rows[i - k].fails.some((x) => x.rule === "OCCLUSION" && x.subject === q.subject)) { rows[i - k].fails.push({ ...q, detail: q.detail.replace(/for 4 frames/, "(start of the run)"), critical: q.critical }); rows[i - k].score += 3; }
  }
  return rows;
};
