// The rabbits of "Napoleon vs. the Rabbits": 240 instanced 3D rabbits (bridge/bunny.ts), choreographed per frame from
// the word timings: in the cages -> out on "open" -> mill about -> charge AT him -> sit up and beg -> swarm his boots,
// six climb his legs -> split to the flanks -> attack -> chase him to the carriage, six jump in -> sit on the empty lawn,
// one wearing the bicorne. A rabbit within 2.4 m of the lens is hidden (CLAUDE.md: no rabbit at the lens).
import * as THREE from "three";
import { bunnyGeo } from "../bridge/bunny";
import { twoTone } from "../bridge/shade";
import { CAGES, NAP, CARR_DOOR } from "./layout";
import { wt, smooth, napAt, carriageAt, HAT_REST } from "./story";

export const N = 240;
const rnd = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export type Pose = { p: THREE.Vector3; yaw: number; beg: boolean; s: number };
const CLIMB = 6, JUMP = 6, KING = 12;

// fixed spots per rabbit
const home = (i: number) => { const c = CAGES[i % CAGES.length], k = Math.floor(i / CAGES.length); return V(c.x - 0.55 + (k % 4) * 0.37, 0.08, c.z - 0.3 + Math.floor(k / 4) * 0.3); };
// they gather west of him (behind him as the camera sees it from the east), then charge straight at him and the lens
const mill = (i: number) => V(-14 + rnd(i, 1) * 7, 0, 1 + rnd(i, 2) * 11);
// the ring leaves out the east side (where the camera stands to see his face): no rabbits between him and the lens
const ringAt = (i: number, r0: number, r1: number) => { const a = Math.PI / 3 + rnd(i, 3) * Math.PI * 4 / 3, r = r0 + (r1 - r0) * Math.sqrt(rnd(i, 4)); return V(NAP.x + Math.cos(a) * r, 0, NAP.z + Math.sin(a) * r); };
// the two flanks: north and south of him (left and right as the camera sees it from the east)
const flank = (i: number) => { const north = rnd(i, 3) < 0.5; return V(NAP.x - 1.0 + (rnd(i, 5) - 0.5) * 5, 0, NAP.z + (north ? -4.6 : 4.6) + (rnd(i, 6) - 0.5) * 2.4); };
const victory = (i: number) => { const a = rnd(i, 7) * Math.PI * 2, r = 1.2 + 6 * Math.sqrt(rnd(i, 8)); return V(HAT_REST.x + Math.cos(a) * r, 0, HAT_REST.z + Math.sin(a) * r * 0.7 - 1.5); };
/** where a climber clings to Napoleon (front of the legs and coat, never above the chest) */
const climbSpot = (k: number, at: THREE.Vector3) => V(at.x + (k % 2 ? 0.16 : -0.16), 0.25 + Math.floor(k / 2) * 0.28, at.z - 0.16);

const lerp = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);
/** the pose of rabbit i at time t (cam: hide near the lens) */
export const rabbitAt = (i: number, t: number): Pose => {
  const T_OPEN = wt(5, "open"), T_RUN = wt(6, "run"), T_BEG = wt(7), T_SW = wt(8), T_CL = wt(8, "Climbed"), T_SPLIT = wt(9, "split"), T_ATT = wt(9, "attacked"), T_FLEE = wt(10, "ran"), T_JUMP = wt(10, "jumped"), T_WON = wt(11);
  const d = rnd(i, 9), nap = napAt(t);
  let p: THREE.Vector3, beg = false, moving = 0, face: THREE.Vector3 | null = nap;
  if (t < T_OPEN + d * 1.2) { p = home(i); face = V(p.x, 0, p.z + 5); }
  else if (t < T_RUN - 0.7 + d * 0.4) { const u = smooth((t - T_OPEN - d * 1.2) / 1.4); p = lerp(home(i), mill(i), u); moving = u < 1 ? 1 : 0.3; face = u < 1 ? null : V(p.x + Math.sin(t + i), 0, p.z + 3); }
  else if (t < T_BEG - 0.2) { const t0 = T_RUN - 0.7 + d * 0.4, u = smooth((t - t0) / (1.6 + rnd(i, 10) * 0.9)); p = lerp(mill(i), ringAt(i, 0.8, 5.5), u); moving = u < 1 ? 1 : 0; face = u < 1 ? null : nap; }
  else if (t < T_SW - 0.1) { p = ringAt(i, 0.8, 5.5); beg = true; }
  else if (t < T_SPLIT - 0.1) {
    const u = smooth((t - T_SW + 0.1) / 0.8), a = ringAt(i, 0.8, 5.5), b = ringAt(i, 0.45, 2.8);
    p = lerp(a, b, u).add(V(Math.sin(t * 3.1 + i) * 0.25, 0, Math.cos(t * 2.7 + i * 1.3) * 0.25)); moving = 1;   // dodging the sticks
    if (i < CLIMB && t > T_CL + i * 0.12) { const c = smooth((t - T_CL - i * 0.12) / 0.5); p = lerp(b, climbSpot(i, nap), c); beg = true; moving = c < 1 ? 1 : 0; }
  }
  else if (t < T_ATT) { const u = smooth((t - T_SPLIT + 0.1) / 0.9); p = lerp(ringAt(i, 0.45, 2.8), flank(i), u); moving = u < 1 ? 1 : 0.2; face = u < 1 ? null : nap; }
  else if (t < T_FLEE) { const u = smooth((t - T_ATT) / 0.8); p = lerp(flank(i), ringAt(i, 0.7, 3.2), u); moving = 1; face = u < 1 ? null : nap; }
  else if (t < T_WON - 0.9) {
    const lag = 0.35 + d * 0.9, tgt = napAt(Math.max(T_FLEE, t - lag)), off = ringAt(i, 0.6, 3.5).sub(NAP);
    p = tgt.clone().add(off.multiplyScalar(0.8)); p.y = 0; moving = 1; face = null;
    if (i >= CLIMB && i < CLIMB + JUMP && t > T_JUMP + (i - CLIMB) * 0.1) {   // hop up onto the carriage roof and ride away on it
      const c = carriageAt(t), k = smooth((t - T_JUMP - (i - CLIMB) * 0.1) / 0.35), inside = V(c.x - 0.9 + (i - CLIMB) * 0.36, 2.56, c.z + ((i - CLIMB) % 2 ? 0.3 : -0.3));
      p = lerp(V(CARR_DOOR.x, 0, CARR_DOOR.z), inside, k); p.y = 2.56 * k + 0.8 * Math.sin(Math.PI * k); moving = 0; face = V(p.x, 0, p.z - 3);
    }
    // the carriage has gone: the lawn rabbits slow down where they are
    const stop = smooth((t - T_JUMP - 1.0) / 0.8); if (stop > 0 && !(i >= CLIMB && i < CLIMB + JUMP)) { moving *= 1 - stop; }
  }
  else {
    if (i >= CLIMB && i < CLIMB + JUMP) { const c = carriageAt(t); p = V(c.x - 0.9 + (i - CLIMB) * 0.36, 2.56, c.z + ((i - CLIMB) % 2 ? 0.3 : -0.3)); face = V(p.x, 0, p.z - 3); }
    else { const u = smooth((t - T_WON + 0.9) / 0.9), a = napAt(T_WON - 1.6).add(ringAt(i, 0.6, 3.5).sub(NAP).multiplyScalar(0.8)); a.y = 0; p = lerp(a, victory(i), u); moving = u < 1 ? 1 : 0; beg = u >= 1 && i % 3 === 0; face = V(p.x + 0.4, 0, p.z + 6); }
    if (i === KING) { p = HAT_REST.clone().setY(0); beg = true; moving = 0; face = V(p.x, 0, p.z + 6); }
  }
  if (moving > 0) p.y += 0.16 * moving * Math.abs(Math.sin((t * 3.2 + d * 7) * Math.PI));
  const dir = face ? face.clone().sub(p) : null;
  let yaw = dir && dir.lengthSq() > 1e-4 ? Math.atan2(dir.x, dir.z) : 0;
  if (!face) { const q = rabbitPrev(i, t); const mv = p.clone().sub(q); mv.y = 0; yaw = mv.lengthSq() > 1e-6 ? Math.atan2(mv.x, mv.z) : Math.atan2(nap.x - p.x, nap.z - p.z); }
  return { p, yaw, beg, s: 0.9 + rnd(i, 11) * 0.25 };
};
/** position a moment earlier (for the hopping direction), without recursion into the yaw */
const rabbitPrev = (i: number, t: number) => { const r = rabbitAtNoYaw(i, t - 0.05); return r; };
const rabbitAtNoYaw = (i: number, t: number) => { const save = rabbitPrevGuard.on; rabbitPrevGuard.on = true; const p = save ? V(0, 0, 0) : rabbitAt(i, t).p; rabbitPrevGuard.on = save; return p; };
const rabbitPrevGuard = { on: false };

export class Swarm {
  sit: THREE.InstancedMesh; beg: THREE.InstancedMesh;
  private m = new THREE.Matrix4(); private q = new THREE.Quaternion(); private e = new THREE.Euler(); private zero = new THREE.Matrix4().makeScale(0, 0, 0);
  constructor(root: THREE.Object3D) {
    const mat = twoTone(new THREE.MeshLambertMaterial({ vertexColors: true }));
    this.sit = new THREE.InstancedMesh(bunnyGeo(false), mat, N); this.beg = new THREE.InstancedMesh(bunnyGeo(true), mat, N);
    const cols = ["#ffffff", "#f4ecdc", "#d8cfc4", "#b9a088", "#8a6a52", "#efe2d0", "#c9c2bc"].map((c) => new THREE.Color(c));
    for (const im of [this.sit, this.beg]) { for (let i = 0; i < N; i++) im.setColorAt(i, cols[Math.floor(rnd(i, 12) * cols.length)]); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; root.add(im); }
  }
  update(t: number, cam?: THREE.Vector3) {
    for (let i = 0; i < N; i++) {
      const r = rabbitAt(i, t), near = cam ? cam.distanceTo(r.p) < 3.2 : false;
      this.m.compose(r.p, this.q.setFromEuler(this.e.set(0, r.yaw, 0)), new THREE.Vector3(r.s, r.s, r.s));
      this.sit.setMatrixAt(i, near || r.beg ? this.zero : this.m); this.beg.setMatrixAt(i, near || !r.beg ? this.zero : this.m);
    }
    this.sit.instanceMatrix.needsUpdate = true; this.beg.instanceMatrix.needsUpdate = true;
  }
}
/** the swarm's bounding box at time t (the camera guard's "w:swarm" prop) */
export const swarmBox = (t: number) => { const b = new THREE.Box3(); for (let i = 0; i < N; i += 3) b.expandByPoint(rabbitAt(i, t).p); return b.expandByVector(V(0.25, 0.5, 0.25)); };
