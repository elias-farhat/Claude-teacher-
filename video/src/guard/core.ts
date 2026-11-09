// Camera guard (CLAUDE.md rule 13): math-only checks of every frame BEFORE any render. Runs in a headless browser
// page (real canvas for the world's painted textures, no WebGL, no pixels): builds the video's world once, replays
// the camera (story.camAt) and the cast (stage.stage) for every frame, and tests the declared subjects:
//   1 SUBJECT   every declared subject is inside the 5 % safe margin and big enough (characters >= 30 % of the frame
//               height, props >= 15 %). Characters may be cropped at the bottom (medium / chest-up shots) as long as
//               the crop is below the chest; never at the top or the sides. A prop bigger than the frame fills it.
//   2 OCCLUSION rays from the camera to 5 points of each subject (centre + 4 inset corners): more than 2 blocked
//               for more than 3 consecutive frames.
//   3 CLIPPING  any geometry closer than 0.4 m in view (a 9 x 16 grid of view rays), the view filled by geometry
//               within 1.5 m (>= 85 % of those rays: flying through a wall / floor / beam), or the camera inside a
//               solid (>= 5 of 6 axis rays first hit a back face).
//   4 EMPTY     no declared subject in view.
//   5 FACES     a character's head centre below 55 % of the frame height (the 70 % captions would cover it).
// World geometry is ray-cast through three-mesh-bvh. Character / effect cards, sky, clouds, smoke, lamp dots (layer
// NOINK) are never occluders.
import * as THREE from "three";
import { computeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

(THREE.BufferGeometry.prototype as unknown as { computeBoundsTree: unknown }).computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export const NOINK = 3;
export type Place = { key: string; x: number; y: number; z: number; scale?: number };
export type FxCard = { key: string; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number; shot: number; mix: number };
/** a subject window: from..to (s), subject ids: "c:name" (a character by exact name), "c:/regex/" (a group of
 *  characters, judged as their union box), "f:prefix" (an effect / label card by key prefix), "w:name" (a world prop
 *  from the adapter's props) */
export type Window = { from: number; to: number; ids: string[]; why: string };
export type Adapter = {
  name: string; fps: number; total: number;
  root: THREE.Object3D;
  camAt: (t: number) => Cam;
  stage: (t: number, c: Cam, cam: THREE.Camera) => { places: Place[]; fx: FxCard[] };
  setTime?: (t: number) => void;                        // moving world props (train, ship, tram)
  props?: Record<string, (t: number) => THREE.Box3>;   // world-prop subjects
  windows: Window[];
};
type Subj = { id: string; kind: "char" | "prop"; pts: THREE.Vector3[]; head?: THREE.Vector3; chest?: number; bottom: number; top: number };
export type Fail = { rule: "SUBJECT" | "OCCLUSION" | "CLIPPING" | "EMPTY" | "FACES"; subject?: string; detail: string };
export type Row = { f: number; t: number; shot: number; flight: boolean; subjects: string[]; fails: Fail[]; score: number };

const nameOf = (key: string) => { const p = key.split("|"); return p[0] === "up" ? p[1] : p[0]; };
const isUp = (key: string) => key.startsWith("up|");
const modeOf = (key: string) => { const p = key.split("|"); return p[0] === "up" ? p[2] : p[1]; };

export const run = (A: Adapter, onProgress?: (f: number) => void): Row[] => {
  // ---- occluders: every visible world mesh except the NOINK layer, points, lines and see-through soft cards ----
  A.root.updateMatrixWorld(true);
  const occ: THREE.Mesh[] = [];
  A.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as unknown as THREE.Points).isPoints || m.layers.mask === 1 << NOINK) return;
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material;
    if (mat && mat.transparent && !mat.depthWrite) return;
    if (!m.geometry.attributes.position) return;
    (m.geometry as unknown as { computeBoundsTree: () => void; boundsTree?: unknown }).boundsTree ?? (m.geometry as unknown as { computeBoundsTree: () => void }).computeBoundsTree();
    occ.push(m);
  });
  const visibleOcc = () => occ.filter((m) => { let o: THREE.Object3D | null = m; while (o) { if (!o.visible) return false; o = o.parent; } return true; });
  const ray = new THREE.Raycaster(); (ray as unknown as { firstHitOnly: boolean }).firstHitOnly = true;
  const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.05, 6000);
  // double-sided first hit through each mesh's BVH: a camera inside a beam must see the beam's inner faces
  // (three's own raycast culls back faces of single-sided materials)
  const inv = new THREE.Matrix4(), lray = new THREE.Ray(), sph = new THREE.Sphere();
  type Hit = { distance: number; point: THREE.Vector3; face: { normal: THREE.Vector3 } | null; object: THREE.Mesh };
  const cast = (from: THREE.Vector3, dir: THREE.Vector3, far: number, list: THREE.Mesh[]): Hit | null => {
    ray.set(from, dir); let best: Hit | null = null;
    for (const m of list) {
      const g = m.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
      sph.copy(g.boundingSphere!).applyMatrix4(m.matrixWorld); if (!ray.ray.intersectsSphere(sph)) continue;
      if (sph.center.distanceTo(from) - sph.radius > (best ? best.distance : far)) continue;
      inv.copy(m.matrixWorld).invert(); lray.copy(ray.ray).applyMatrix4(inv);
      const bt = (g as unknown as { boundsTree: { raycastFirst: (r: THREE.Ray, side: THREE.Side, near?: number, far?: number) => { point: THREE.Vector3; face: { normal: THREE.Vector3 } } | null } }).boundsTree;
      const h = bt.raycastFirst(lray, THREE.DoubleSide);
      if (!h) continue;
      const p = h.point.clone().applyMatrix4(m.matrixWorld), d = p.distanceTo(from);
      if (d <= far && (!best || d < best.distance)) best = { distance: d, point: p, face: h.face, object: m };
    }
    return best;
  };
  const rows: Row[] = [];
  const occRun = new Map<string, number>();
  const toScreen = (p: THREE.Vector3) => { const v = p.clone().project(cam); const behind = p.clone().sub(cam.position).dot(fwd) <= 0.05; return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, behind }; };
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  for (let f = 0; f < A.total; f++) {
    const t = f / A.fps, c = A.camAt(t);
    A.setTime?.(t); A.root.updateMatrixWorld(true);
    cam.position.copy(c.pos); cam.up.set(0, 1, 0); cam.lookAt(c.look); cam.rotateZ(c.roll); cam.fov = c.fov;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    cam.getWorldDirection(fwd); right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
    const st = A.stage(t, c, cam), list = visibleOcc();
    const fails: Fail[] = [];
    // ---- subjects of this moment ----
    const win = A.windows.filter((w) => t >= w.from && t < w.to), ids = [...new Set(win.flatMap((w) => w.ids))];
    const subj: Subj[] = [];
    const missing: string[] = [];
    for (const id of ids) {
      const [k, s] = [id.slice(0, 1), id.slice(2)];
      if (k === "c") {
        const re = s.startsWith("/") ? new RegExp(s.slice(1, -1)) : null;
        const ps = st.places.filter((p) => (re ? re.test(nameOf(p.key)) : nameOf(p.key) === s));
        if (!ps.length) { missing.push(id); continue; }
        // billboard rectangle facing the camera: width 0.62 m, feet .. hat top 1.78 m (seated: legs .. head top)
        const pts: THREE.Vector3[] = []; let head: THREE.Vector3 | undefined; let bottom = Infinity, top = -Infinity, chest = 0;
        for (const p of ps) {
          const sc = p.scale ?? 1, sit = modeOf(p.key) === "sit", up0 = isUp(p.key);
          const y0 = p.y + (up0 ? 0.81 : sit ? -0.45 : 0) * sc, y1 = p.y + (sit ? 1.2 : 1.78) * sc, hc = p.y + (sit ? 0.86 : 1.44) * sc;
          const side = new THREE.Vector3(cam.position.z - p.z, 0, -(cam.position.x - p.x)).normalize().multiplyScalar(0.31 * sc);
          const b = new THREE.Vector3(p.x, 0, p.z);
          for (const y of [y0, y1]) for (const s2 of [-1, 1]) pts.push(b.clone().addScaledVector(side, s2).setY(y));
          if (!head || hc > head.y) head = new THREE.Vector3(p.x, hc, p.z);
          bottom = Math.min(bottom, y0); top = Math.max(top, y1); chest = Math.max(chest, p.y + (sit ? 0.55 : 1.0) * sc);
        }
        subj.push({ id, kind: "char", pts, head: ps.length === 1 ? head : undefined, chest, bottom, top });
      } else if (k === "f") {
        const fs = st.fx.filter((p) => { const parts = p.key.split("|"); return parts[0].startsWith(s) || parts[parts.length - 1].startsWith(s); });
        if (!fs.length) { missing.push(id); continue; }
        const pts: THREE.Vector3[] = [];
        for (const p of fs) {
          const c0 = new THREE.Vector3(p.x, p.y, p.z);
          if (p.flat) for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pts.push(c0.clone().add(new THREE.Vector3(a * p.w / 2, 0, b * p.h / 2)));
          else for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pts.push(c0.clone().addScaledVector(right, a * p.w / 2).addScaledVector(up, b * p.h / 2));
        }
        subj.push({ id, kind: "prop", pts, bottom: 0, top: 0 });
      } else if (k === "w") {
        const bx = A.props?.[s]?.(t); if (!bx) { missing.push(id); continue; }
        const pts: THREE.Vector3[] = [];
        for (const x of [bx.min.x, bx.max.x]) for (const y of [bx.min.y, bx.max.y]) for (const z of [bx.min.z, bx.max.z]) pts.push(new THREE.Vector3(x, y, z));
        subj.push({ id, kind: "prop", pts, bottom: bx.min.y, top: bx.max.y });
      }
    }
    for (const id of missing) fails.push({ rule: "SUBJECT", subject: id, detail: "not on stage" });
    // ---- 1 SUBJECT + 2 OCCLUSION + 4 EMPTY + 5 FACES ----
    let anyInView = false;
    for (const s of subj) {
      const sp = s.pts.map(toScreen);
      if ((globalThis as unknown as { GUARD_DEBUG?: number }).GUARD_DEBUG === f) console.log("[dbg]", f, s.id, JSON.stringify(sp.map((q) => [+q.x.toFixed(2), +q.y.toFixed(2), q.behind])), cam.position.toArray(), fwd.toArray());
      if (sp.every((q) => q.behind)) { fails.push({ rule: "SUBJECT", subject: s.id, detail: "behind the camera" }); occRun.set(s.id, 0); continue; }
      // a box straddling the camera plane: clip it by projecting only the points in front (conservatively "cut off")
      const front = sp.filter((q) => !q.behind), straddle = front.length < sp.length;
      const x0 = Math.min(...front.map((q) => q.x)), x1 = Math.max(...front.map((q) => q.x)), y0 = Math.min(...front.map((q) => q.y)), y1 = Math.max(...front.map((q) => q.y));
      const inView = x1 > 0 && x0 < 1 && y1 > 0 && y0 < 1;
      if (!inView) { fails.push({ rule: "SUBJECT", subject: s.id, detail: `out of frame (x ${x0.toFixed(2)}..${x1.toFixed(2)}, y ${y0.toFixed(2)}..${y1.toFixed(2)})` }); occRun.set(s.id, 0); continue; }
      const visH = Math.min(1, y1) - Math.max(0, y0);
      const fills = s.kind === "prop" && y1 - y0 > 0.9 && x1 - x0 > 0.9;                    // a landmark filling the frame
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
      if (cut) fails.push({ rule: "SUBJECT", subject: s.id, detail: cut });
      const minH = s.kind === "char" ? 0.3 : 0.15;
      if (visH < minH && !fills) fails.push({ rule: "SUBJECT", subject: s.id, detail: `too small (${Math.round(visH * 100)} % of frame height, needs ${minH * 100} %)` });
      // occlusion: centre + 4 corners of the screen box, inset 15 %, unprojected at the subject's depth
      const depth = s.pts.reduce((a, p) => a + p.clone().sub(cam.position).dot(fwd), 0) / s.pts.length;
      const probe = [[0.5, 0.5], [0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]].map(([u, v]) => {
        const sx = Math.min(0.98, Math.max(0.02, x0 + (x1 - x0) * u)), sy = Math.min(0.98, Math.max(0.02, y0 + (y1 - y0) * v));
        const nd = new THREE.Vector3(sx * 2 - 1, 1 - sy * 2, 0.5).unproject(cam).sub(cam.position).normalize();
        return { dir: nd, dist: Math.max(0.1, depth / Math.max(0.05, nd.dot(fwd))) };
      });
      let blocked = 0;
      for (const p of probe) if (cast(cam.position, p.dir, Math.max(0.05, p.dist - 0.35), list)) blocked++;
      if ((globalThis as unknown as { GUARD_DEBUG?: number }).GUARD_DEBUG === f) console.log("[dbg] blocked", s.id, blocked);
      const runN = blocked > 2 ? (occRun.get(s.id) ?? 0) + 1 : 0; occRun.set(s.id, runN);
      if (runN > 3) fails.push({ rule: "OCCLUSION", subject: s.id, detail: `${blocked}/5 rays blocked for ${runN} frames` });
      if (blocked < 5) anyInView = true;
      if (s.head) { const h = toScreen(s.head); if (!h.behind && h.x > 0 && h.x < 1 && h.y > 0.55 && h.y < 1) fails.push({ rule: "FACES", subject: s.id, detail: `head centre at ${Math.round(h.y * 100)} % of the frame height` }); }
    }
    if (subj.length && !anyInView) fails.push({ rule: "EMPTY", detail: `none of ${ids.join(", ") || "(no subject declared)"} in view` });
    if (!ids.length) fails.push({ rule: "EMPTY", detail: "no subject declared for this moment" });
    // ---- 3 CLIPPING ----
    let near = Infinity, walled = 0;
    for (let i = 0; i < 9; i++) for (let j = 0; j < 16; j++) {
      const nd = new THREE.Vector3(((i + 0.5) / 9) * 2 - 1, 1 - ((j + 0.5) / 16) * 2, 0.5).unproject(cam).sub(cam.position).normalize();
      const h = cast(cam.position, nd, 1.5 / Math.max(0.2, nd.dot(fwd)), list);
      if (h) { const d = h.distance * nd.dot(fwd); near = Math.min(near, d); if (d < 1.5) walled++; }
    }
    // a wall / beam / floor filling the view (>= 85 % of the view rays stop within 1.5 m): flying through geometry
    if (walled >= 0.85 * 144) fails.push({ rule: "CLIPPING", detail: `view filled by geometry within 1.5 m (${Math.round(walled / 1.44)} % of the frame)` });
    if ((globalThis as unknown as { GUARD_DEBUG?: number }).GUARD_DEBUG === f) {
      const hist: number[] = [];
      for (let i = 0; i < 9; i++) for (let j = 0; j < 16; j++) { const nd = new THREE.Vector3(((i + 0.5) / 9) * 2 - 1, 1 - ((j + 0.5) / 16) * 2, 0.5).unproject(cam).sub(cam.position).normalize(); const h = cast(cam.position, nd, 50, list); hist.push(h ? +(h.distance * nd.dot(fwd)).toFixed(2) : 99); }
      const inside = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((d) => { const dir = new THREE.Vector3(...(d as [number, number, number])), h = cast(cam.position, dir, 60, list); if (!h || !h.face) return "none"; const n = h.face.normal.clone().transformDirection(h.object.matrixWorld); return `${h.distance.toFixed(2)}:${n.dot(dir).toFixed(2)}:${((h.object as THREE.Mesh).material as THREE.Material).side}`; });
      console.log("[dbg] near grid (rows top->bottom):"); for (let j = 0; j < 16; j++) console.log("[dbg]", Array.from({ length: 9 }, (_, i) => String(hist[i * 16 + j]).padStart(5)).join(" "));
      console.log("[dbg] axis rays", inside.join(" | "));
    }
    if (near < 0.4) fails.push({ rule: "CLIPPING", detail: `geometry ${near.toFixed(2)} m from the lens` });
    let back = 0;
    for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const dir = new THREE.Vector3(...(d as [number, number, number])), h = cast(cam.position, dir, 60, list);
      if (h && h.face) { const n = h.face.normal.clone().transformDirection(h.object.matrixWorld); const mat = (h.object as THREE.Mesh).material as THREE.Material; if (n.dot(dir) > 0 && mat.side !== THREE.DoubleSide) back++; void mat; }
    }
    if (back >= 5) fails.push({ rule: "CLIPPING", detail: `camera inside a solid (${back}/6 rays hit back faces)` });
    const score = fails.reduce((a, q) => a + ({ CLIPPING: 5, EMPTY: 4, OCCLUSION: 3, SUBJECT: 2, FACES: 1 })[q.rule], 0);
    rows.push({ f, t: +t.toFixed(3), shot: c.shot, flight: c.mix > 0, subjects: ids, fails, score });
    if (onProgress && f % 100 === 0) onProgress(f);
  }
  // occlusion needs > 3 consecutive frames: mark the first 3 frames of every qualifying run as well
  for (let i = 0; i < rows.length; i++) for (const q of rows[i].fails) if (q.rule === "OCCLUSION" && q.detail.endsWith(" 4 frames")) {
    for (let k = 1; k <= 3 && i - k >= 0; k++) if (!rows[i - k].fails.some((x) => x.rule === "OCCLUSION" && x.subject === q.subject)) { rows[i - k].fails.push({ ...q, detail: q.detail.replace(/for 4 frames/, "(start of the run)") }); rows[i - k].score += 3; }
  }
  return rows;
};
