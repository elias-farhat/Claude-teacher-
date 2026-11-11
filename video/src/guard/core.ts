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
import { subjectsAt, bystanderHeads, nameOf, Head, Place, FxCard, Subj, cocAt, lensFor } from "./subjects";

export type { Place, FxCard };
export type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number; shot: number; mix: number; dof?: number };
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
  /** auto-framed videos: the subjects of this moment, whether the camera is in a flight / a whip (and which shot) */
  moment?: (t: number) => { ids: string[]; flight: boolean; shot: number; whip?: boolean };
  /** the lens the renderer uses at this moment (focus on the subject's head, blur capped): the guard checks it */
  lens?: (t: number, cam: THREE.PerspectiveCamera, st: { places: Place[]; fx: FxCard[] }) => { focus: number; cInf: number } | null;
};
export type Fail = { rule: "SUBJECT" | "OCCLUSION" | "CLIPPING" | "EMPTY" | "FACES" | "XCU" | "STALE" | "WHIPS"; subject?: string; detail: string; critical: boolean };
export type Row = { f: number; t: number; shot: number; flight: boolean; subjects: string[]; fails: Fail[]; score: number; box?: [number, number, number, number] | null };
const W8 = { CLIPPING: 5, EMPTY: 4, OCCLUSION: 3, SUBJECT: 2, FACES: 1, XCU: 2, STALE: 1, WHIPS: 2 } as const;

/** a card (another character or a label / effect card) that can cover a face: a quad facing the camera unless it
 *  has a fixed yaw or lies flat; its extents are shrunk to 80 % for the transparent margin of the drawing */
export type CardQ = { key: string; c: THREE.Vector3; w: number; h: number; yaw?: number; flat?: boolean };
export const cardsOf = (st: { places: Place[]; fx: FxCard[] }) => {
  const out: CardQ[] = [];
  for (const p of st.places) { if (p.key.startsWith("bg")) continue; const sc = p.scale ?? 1, sit = p.key.split("|")[1] === "sit";
    out.push({ key: p.key, c: new THREE.Vector3(p.x, p.y + (sit ? 0.45 : 0.85) * sc, p.z), w: 0.5 * sc, h: (sit ? 1.3 : 1.7) * sc * 0.9 }); }
  for (const p of st.fx) { if (p.key.startsWith("bg") || p.soft) continue; out.push({ key: p.key, c: new THREE.Vector3(p.x, p.y, p.z), w: p.w * 0.8, h: p.h * 0.8, yaw: (p as FxCard & { yaw?: number }).yaw, flat: p.flat }); }
  return out;
};
const hitsCard = (P: THREE.Vector3, d: THREE.Vector3, L: number, q: CardQ) => {
  let n: THREE.Vector3, r: THREE.Vector3, u = new THREE.Vector3(0, 1, 0);
  if (q.flat) { n = new THREE.Vector3(0, 1, 0); r = new THREE.Vector3(1, 0, 0); u = new THREE.Vector3(0, 0, 1); }
  else if (q.yaw !== undefined) { n = new THREE.Vector3(Math.sin(q.yaw), 0, Math.cos(q.yaw)); r = new THREE.Vector3(Math.cos(q.yaw), 0, -Math.sin(q.yaw)); }
  else { n = new THREE.Vector3(P.x - q.c.x, 0, P.z - q.c.z); if (n.lengthSq() < 1e-8) return false; n.normalize(); r = new THREE.Vector3(-n.z, 0, n.x); }
  const den = n.dot(d); if (Math.abs(den) < 1e-6) return false;
  const t = n.dot(q.c.clone().sub(P)) / den; if (t <= 0.05 || t >= L - 0.08) return false;
  const X = P.clone().addScaledVector(d, t).sub(q.c);
  return Math.abs(X.dot(r)) <= (q.flat ? Math.max(q.w, q.h) : q.w) / 2 && Math.abs(X.dot(u)) <= (q.flat ? Math.max(q.w, q.h) : q.h) / 2;
};

/** the subject rules for one camera: 1 SUBJECT (margins, size, blur), 2 OCCLUSION, 5 FACES on the HEAD box (centre in
 *  the upper 55 %, never in the caption band at 62-80 %, never cut at an edge, never more than 20 % covered by
 *  geometry or another card). occRun carries occlusion run lengths between consecutive frames (fresh Map for a single
 *  pose). Optional subjects only count as "in view". Returns the frame's largest head height (XCU) and the first
 *  required subject's screen box (STALE). */
export const checkSubjects = (cam: THREE.PerspectiveCamera, subj: Subj[], geo: Geo, occRun = new Map<string, number>(), extra: { cards?: CardQ[]; lens?: { focus: number; cInf: number } | null; by?: Head[] } = {}) => {
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0); right.y = 0; if (right.lengthSq() < 1e-8) right.set(1, 0, 0); right.normalize();
  const toScreen = (p: THREE.Vector3) => { const v = p.clone().project(cam); const behind = p.clone().sub(cam.position).dot(fwd) <= 0.05; return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, behind }; };
  const fails: Omit<Fail, "critical">[] = [];
  const addS = (s: Subj, q: Omit<Fail, "critical">) => { if (!s.opt) fails.push(q); };
  let anyInView = false, headMax = 0; const blk: Record<string, number> = {};
  let primary: { cx: number; cy: number; h: number; w: [number, number, number] } | null = null;
  // the box the SHARPNESS pixel check measures: the first required subject's (nearest) head, or the prop's own box
  let focusBox: [number, number, number, number] | null = null; let focusSet = false;
  const clampBox = (x0: number, y0: number, x1: number, y1: number): [number, number, number, number] | null => {
    const a = Math.max(0, x0), b = Math.max(0, y0), c = Math.min(1, x1), d = Math.min(1, y1); return c - a > 0.02 && d - b > 0.02 ? [+a.toFixed(4), +b.toFixed(4), +c.toFixed(4), +d.toFixed(4)] : null; };
  for (const s of subj) {
    const sp = s.pts.map(toScreen);
    if (sp.every((q) => q.behind)) { addS(s, { rule: "SUBJECT", subject: s.id, detail: "behind the camera" }); occRun.set(s.id, 0); continue; }
    const front = sp.filter((q) => !q.behind), straddle = front.length < sp.length;
    const x0 = Math.min(...front.map((q) => q.x)), x1 = Math.max(...front.map((q) => q.x)), y0 = Math.min(...front.map((q) => q.y)), y1 = Math.max(...front.map((q) => q.y));
    if (!(x1 > 0 && x0 < 1 && y1 > 0 && y0 < 1)) { addS(s, { rule: "SUBJECT", subject: s.id, detail: `out of frame (x ${x0.toFixed(2)}..${x1.toFixed(2)}, y ${y0.toFixed(2)}..${y1.toFixed(2)})` }); occRun.set(s.id, 0); continue; }
    if (!s.opt && !primary) primary = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, h: y1 - y0, w: [s.centre.x, s.centre.y, s.centre.z] };
    if (!s.opt && !focusSet && s.kind === "prop") { focusSet = true; focusBox = clampBox(x0, y0, x1, y1); }
    const visH = Math.min(1, y1) - Math.max(0, y0);
    // a prop bigger than the frame (a wall map, a page) is not "cut off"; an animal card never gets this pass (Moon run 30:
    // the goat filled the frame with its head cut off at the top for 3 s and nothing failed)
    const fills = s.kind === "prop" && !s.heads?.length && y1 - y0 > 0.9 && x1 - x0 > 0.9;
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
    if (extra.lens && s.kind === "prop") { const cc = cocAt(s.centre, cam, extra.lens.focus, extra.lens.cInf); if (cc > 1.5) addS(s, { rule: "SUBJECT", subject: s.id, detail: `blurred (circle of confusion ${cc.toFixed(1)} px)` }); }
    // occlusion: centre + 4 corners of the screen box (inset 15 %), at the subject's depth
    const depth = s.pts.reduce((a, p) => a + p.clone().sub(cam.position).dot(fwd), 0) / s.pts.length;
    let blocked = 0;
    for (const [u, v] of [[0.5, 0.5], [0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]]) {
      const sx = Math.min(0.98, Math.max(0.02, x0 + (x1 - x0) * u)), sy = Math.min(0.98, Math.max(0.02, y0 + (y1 - y0) * v));
      const nd = new THREE.Vector3(sx * 2 - 1, 1 - sy * 2, 0.5).unproject(cam).sub(cam.position).normalize();
      const dist = Math.max(0.1, depth / Math.max(0.05, nd.dot(fwd)));
      const h = geo.cast(cam.position, nd, Math.max(0.05, dist - 0.35));
      if (h && !(s.own && s.own.containsPoint(h.point))) blocked++;
    }
    blk[s.id] = blocked;
    const runN = blocked > 2 ? (occRun.get(s.id) ?? 0) + 1 : 0; occRun.set(s.id, runN);
    if (runN > 3) addS(s, { rule: "OCCLUSION", subject: s.id, detail: `${blocked}/5 rays blocked for ${runN} frames` });
    if (blocked < 5) anyInView = true;
    // FACES on every head of a character subject
    // optional characters and animals: a head cut by a frame edge fails (CLAUDE.md rule 3: never cut the head)
    if ((s.opt || s.kind === "prop") && s.heads?.length) for (const hd of s.heads) {
      const cs = [hd.y0, hd.y1].flatMap((y) => [-1, 1].map((k) => toScreen(hd.c.clone().setY(y).addScaledVector(right, k * hd.hw))));
      if (cs.every((q) => q.behind)) continue;
      const hx0 = Math.min(...cs.map((q) => q.x)), hx1 = Math.max(...cs.map((q) => q.x)), hy0 = Math.min(...cs.map((q) => q.y)), hy1 = Math.max(...cs.map((q) => q.y));
      if (hx1 < 0 || hx0 > 1 || hy1 < 0 || hy0 > 1) continue;                       // entirely out of the picture: fine
      if (s.opt && hy1 - hy0 < 0.06) continue;                                        // a small optional figure at the edge
      if (cs.some((q) => q.behind) || hx0 < 0 || hx1 > 1 || hy0 < 0 || hy1 > 1)
        fails.push({ rule: "FACES", subject: s.id + (hd.animal ? "" : `(${nameOf(hd.key)})`), detail: `head cut at the ${hx0 < 0 ? "left" : hx1 > 1 ? "right" : hy0 < 0 ? "top" : "bottom"} edge${hd.animal ? " (animal)" : ""}` });
      if (!s.opt && hd.animal) { headMax = Math.max(headMax, 0); if (!focusSet) { focusSet = true; focusBox = clampBox(hx0, hy0, hx1, hy1); } }
    }
    if (s.kind === "char" && !s.opt) for (const hd of s.heads ?? []) {
      const corners = [hd.y0, hd.y1].flatMap((y) => [-1, 1].map((k) => hd.c.clone().setY(y).addScaledVector(right, k * hd.hw)));
      const cs = corners.map(toScreen); if (cs.every((q) => q.behind)) continue;
      const hx0 = Math.min(...cs.map((q) => q.x)), hx1 = Math.max(...cs.map((q) => q.x)), hy0 = Math.min(...cs.map((q) => q.y)), hy1 = Math.max(...cs.map((q) => q.y));
      if (hx1 < 0 || hx0 > 1 || hy1 < 0 || hy0 > 1) continue;                       // this head is out of the picture
      const who = s.id + (s.heads!.length > 1 ? `(${hd.key.split("|")[0]})` : "");
      headMax = Math.max(headMax, hy1 - hy0);
      const hc = toScreen(hd.c);
      if (!focusSet) { focusSet = true; focusBox = clampBox(hx0, hy0, hx1, hy1); }
      if (cs.some((q) => q.behind) || hx0 < 0 || hx1 > 1 || hy0 < 0 || hy1 > 1) fails.push({ rule: "FACES", subject: who, detail: `head cut at the ${hx0 < 0 ? "left" : hx1 > 1 ? "right" : hy0 < 0 ? "top" : "bottom"} edge` });
      if (hc.y > 0.55) fails.push({ rule: "FACES", subject: who, detail: `head centre at ${Math.round(hc.y * 100)} % of the frame height` });
      else if (hy1 > 0.62 && hy0 < 0.8) fails.push({ rule: "FACES", subject: who, detail: `head in the caption band (${Math.round(hy0 * 100)}-${Math.round(hy1 * 100)} %)` });
      // how much of the face is covered by geometry or another card in front of it (5 x 5 samples)
      let cov = 0, n = 0;
      for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
        const pt = hd.c.clone().setY(hd.y0 + ((b + 0.5) / 5) * (hd.c.y + 0.22 - hd.y0)).addScaledVector(right, ((a + 0.5) / 5 - 0.5) * 2 * hd.hw * 0.85);
        const dv = pt.clone().sub(cam.position), L = dv.length(); dv.normalize(); n++;
        if (geo.cast(cam.position, dv, Math.max(0.05, L - 0.1))) { cov++; continue; }
        if ((extra.cards ?? []).some((q) => q.key !== hd.key && hitsCard(cam.position, dv, L, q))) cov++;
      }
      if (cov / n > 0.2) fails.push({ rule: "FACES", subject: who, detail: `face ${Math.round((cov / n) * 100)} % covered by something in front` });
      if (extra.lens) { const cc = cocAt(hd.c, cam, extra.lens.focus, extra.lens.cInf); if (cc > 1.5) fails.push({ rule: "SUBJECT", subject: who, detail: `blurred (circle of confusion ${cc.toFixed(1)} px)` }); }
    }
  }
  // bystanders: a named character who is not a declared subject but whose head is big in the picture (>= 6 % of
  // the frame height) and not hidden must keep its face above the captions as well
  for (const hd of extra.by ?? []) {
    const corners = [hd.y0, hd.y1].flatMap((y) => [-1, 1].map((k) => hd.c.clone().setY(y).addScaledVector(right, k * hd.hw)));
    const cs = corners.map(toScreen); if (cs.some((q) => q.behind)) continue;
    const hx0 = Math.min(...cs.map((q) => q.x)), hx1 = Math.max(...cs.map((q) => q.x)), hy0 = Math.min(...cs.map((q) => q.y)), hy1 = Math.max(...cs.map((q) => q.y));
    // at least half of the head box is in the picture
    const vis = Math.max(0, Math.min(1, hx1) - Math.max(0, hx0)) * Math.max(0, Math.min(1, hy1) - Math.max(0, hy0)) / Math.max(1e-6, (hx1 - hx0) * (hy1 - hy0));
    if (hy1 - hy0 < 0.06 || vis <= 0) continue;
    if (vis < 1 && geo.cast(cam.position, hd.c.clone().sub(cam.position).normalize(), Math.max(0.05, hd.c.distanceTo(cam.position) - 0.1)) === null) {
      fails.push({ rule: "FACES", subject: "bystander " + hd.key.split("|").filter((x) => x !== "up")[0], detail: `bystander's head cut at the ${hx0 < 0 ? "left" : hx1 > 1 ? "right" : hy0 < 0 ? "top" : "bottom"} edge` }); continue;
    }
    if (vis < 0.5) continue;
    const hc = toScreen(hd.c);
    if (!(hc.y > 0.55 || (hy1 > 0.62 && hy0 < 0.8))) continue;
    const dv = hd.c.clone().sub(cam.position), L = dv.length(); dv.normalize();
    if (geo.cast(cam.position, dv, Math.max(0.05, L - 0.1))) continue;
    fails.push({ rule: "FACES", subject: "bystander " + hd.key.split("|").filter((x) => x !== "up")[0], detail: hc.y > 0.55 ? `bystander's head centre at ${Math.round(hc.y * 100)} % of the frame height` : `bystander's head in the caption band (${Math.round(hy0 * 100)}-${Math.round(hy1 * 100)} %)` });
  }
  return { fails, anyInView, blocked: blk, headMax, primary, focusBox };
};

export const run = (A: Adapter, geo = new Geo(A.root), frames?: number[]): Row[] => {
  const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.05, 6000);
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const toScreen = (p: THREE.Vector3) => { const v = p.clone().project(cam); const behind = p.clone().sub(cam.position).dot(fwd) <= 0.05; return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, behind }; };
  const rows: Row[] = [];
  const occRun = new Map<string, number>();
  const metrics: { f: number; flight: boolean; whip: boolean; shot: number; headMax: number; primary: { cx: number; cy: number; h: number; w: [number, number, number] } | null }[] = [];
  const list = frames ?? Array.from({ length: A.total }, (_, f) => f);
  for (const f of list) {
    const t = f / A.fps, c = A.camAt(t);
    if (A.setTime) { A.setTime(t); geo.refresh(); }
    cam.position.copy(c.pos); cam.up.set(0, 1, 0); cam.lookAt(c.look); cam.rotateZ(c.roll); cam.fov = c.fov;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    cam.getWorldDirection(fwd); right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
    const st = A.stage(t, c, cam);
    const mo = A.moment ? A.moment(t) : { ids: [...new Set((A.windows ?? []).filter((w) => t >= w.from && t < w.to).flatMap((w) => w.ids))], flight: c.mix > 0, shot: c.shot };
    const flight = mo.flight, ids = mo.ids, whip = !!(mo as { whip?: boolean }).whip;
    const fails: Fail[] = [];
    // CRITICAL: everything on held frames; in a flight CLIPPING, EMPTY and XCU; in a 6-frame motion-blurred whip only
    // CLIPPING (the picture is a blur between two subjects)
    const add = (q: Omit<Fail, "critical">) => fails.push({ ...q, critical: whip ? q.rule === "CLIPPING" : !flight || q.rule === "CLIPPING" || q.rule === "EMPTY" || q.rule === "XCU" });
    const { subj, missing } = subjectsAt(ids, st, cam.position, right, up, A.props, t);
    if ((globalThis as unknown as { GUARD_DBG_OCC?: boolean }).GUARD_DBG_OCC) console.log("[subj]", f, ids.join(","), "found", subj.map((q) => q.id + "@" + q.centre.toArray().map((x) => +x.toFixed(1))).join(" "), "fx", st.fx.map((q) => q.key.split("|")[0]).filter((k) => !k.startsWith("bg")).join(","));
    for (const id of missing) add({ rule: "SUBJECT", subject: id, detail: "not on stage" });
    const lens = A.lens ? A.lens(t, cam, st) : null;
    const chk = checkSubjects(cam, subj, geo, occRun, { cards: cardsOf(st), lens, by: flight ? undefined : bystanderHeads(ids, st) });
    metrics.push({ f, flight: flight || whip, whip, shot: mo.shot, headMax: chk.headMax, primary: chk.primary });
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
    rows.push({ f, t: +t.toFixed(3), shot: mo.shot, flight: flight || whip, subjects: ids, fails, score, box: chk.focusBox });
  }
  // occlusion needs > 3 consecutive frames: the first 3 frames of every qualifying run fail too
  for (let i = 0; i < rows.length; i++) for (const q of rows[i].fails) if (q.rule === "OCCLUSION" && q.detail.endsWith(" 4 frames")) {
    for (let k = 1; k <= 3 && i - k >= 0; k++) if (!rows[i - k].fails.some((x) => x.rule === "OCCLUSION" && x.subject === q.subject)) { rows[i - k].fails.push({ ...q, detail: q.detail.replace(/for 4 frames/, "(start of the run)"), critical: q.critical }); rows[i - k].score += 3; }
  }
  // XCU: a head taller than 30 % of the frame is an extreme close-up (CLAUDE.md 3); bursts shorter than 8 frames
  // (a whip into a face) are called out as such
  const XCU_H = 0.3;
  for (let i = 0; i < metrics.length; ) {
    if (metrics[i].headMax <= XCU_H) { i++; continue; }
    let j = i; while (j + 1 < metrics.length && metrics[j + 1].headMax > XCU_H && metrics[j + 1].f === metrics[j].f + 1) j++;
    const n = j - i + 1;
    for (let k = i; k <= j; k++) { rows[k].fails.push({ rule: "XCU", detail: n < 8 ? `extreme close-up flash (${n} frames, head ${Math.round(metrics[k].headMax * 100)} % of the frame)` : `extreme close-up (head ${Math.round(metrics[k].headMax * 100)} % of the frame)`, critical: true }); rows[k].score += W8.XCU; }
    i = j + 1;
  }
  // STALE: on held frames, the subject must not sit still on screen for more than 2 s (60 frames): within every
  // 60-frame window of one shot its box has to move >= 6 % of the frame or change size >= 12 % (a visibly new framing), unless the subject itself travels >= 3 m (a fast subject the camera follows: the world streams past; a slow, distant ship does not count)
  const N = 60;
  for (let i = 0; i + N < metrics.length; i++) {
    const a = metrics[i]; if (a.flight || !a.primary) continue;
    let ok = false, same = true;
    for (let k = i + 1; k <= i + N; k++) {
      const b = metrics[k]; if (b.flight || b.shot !== a.shot || !b.primary || b.f !== a.f + (k - i)) { same = false; break; }
      if (Math.hypot(b.primary.cx - a.primary.cx, b.primary.cy - a.primary.cy) >= 0.06 || Math.abs(b.primary.h / a.primary.h - 1) >= 0.12 || Math.hypot(b.primary.w[0] - a.primary.w[0], b.primary.w[1] - a.primary.w[1], b.primary.w[2] - a.primary.w[2]) >= 3) { ok = true; break; }
    }
    if (same && !ok) for (let k = i; k <= i + N; k++) if (!rows[k].fails.some((q) => q.rule === "STALE")) { rows[k].fails.push({ rule: "STALE", detail: "the subject barely moves on screen for more than 2 s", critical: true }); rows[k].score += W8.STALE; }
  }
  // WHIPS: two whips less than 0.9 s apart read as one confused double whip: the hold between them fails
  { let lastEnd = -1e9, i = 0;
    while (i < metrics.length) {
      if (!metrics[i].whip) { i++; continue; }
      let j = i; while (j + 1 < metrics.length && metrics[j + 1].whip && metrics[j + 1].f === metrics[j].f + 1) j++;
      if (lastEnd >= 0 && metrics[i].f - metrics[lastEnd].f < 27 && metrics[i].f - metrics[lastEnd].f > 1)
        for (let k = lastEnd + 1; k < i; k++) { rows[k].fails.push({ rule: "WHIPS", detail: `two whips ${((metrics[i].f - metrics[lastEnd].f) / 30).toFixed(1)} s apart`, critical: true }); rows[k].score += W8.WHIPS; }
      lastEnd = j; i = j + 1;
    } }
  return rows;
};
