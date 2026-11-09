// The auto-framer's camera track (written by solve.ts into src/videos/<video>/camtrack.json, read by story.ts):
// every shot holds from its landing to the start of the next flight, easing from pose a to pose b (the push / drift /
// orbit move); flights take 25-30 frames (longer only to keep the peak <= 6 m/frame), eased (smootherstep on arc
// length) along a path checked against the world geometry, and land on the next shot exactly at its t0.
import * as THREE from "three";

export type V3 = [number, number, number];
export type Pose = { pos: V3; look: V3; fov: number };
export type Key = Pose & { t: number };
export type TShot = { t0: number; t1: number; keys: Key[]; dof: number; size: string; cand: string };
export type TFlight = { t0: number; t1: number; to: number; path: V3[]; swing?: [number, number]; ahead?: number[]; carry?: boolean; fade?: number };
export type Track = { video: string; shots: TShot[]; flights: TFlight[] };

const V = (a: V3) => new THREE.Vector3(...a);
export const smoother = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const slerpDir = (a: THREE.Vector3, b: THREE.Vector3, k: number) => {
  const d = THREE.MathUtils.clamp(a.dot(b), -1, 1), w = Math.acos(d);
  if (w < 1e-4) return a.clone();
  if (Math.PI - w < 1e-3) return a.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * k);
  return a.clone().multiplyScalar(Math.sin((1 - k) * w) / Math.sin(w)).addScaledVector(b, Math.sin(k * w) / Math.sin(w)).normalize();
};
/** pose of shot s at time t: two keys = one eased move over the whole hold (push / drift / orbit); more keys = a
 *  subject that moves (or a long hold with a mid move): eased per segment between the keys' times */
export const holdPose = (s: TShot, t: number, holdEnd: number) => {
  const K = s.keys;
  if (K.length === 2) {
    const e = smoother((t - s.t0) / Math.max(0.2, holdEnd - s.t0));
    return { pos: V(K[0].pos).lerp(V(K[1].pos), e), look: V(K[0].look).lerp(V(K[1].look), e), fov: K[0].fov + (K[1].fov - K[0].fov) * e };
  }
  let k = 0; while (k + 2 < K.length && K[k + 1].t <= t) k++;
  const a = K[k], b = K[k + 1], e = Math.min(1, Math.max(0, (t - a.t) / Math.max(1e-3, b.t - a.t)));
  const ee = K.length > 2 && s.cand.startsWith("track") ? e : smoother(e);
  return { pos: V(a.pos).lerp(V(b.pos), ee), look: V(a.look).lerp(V(b.look), ee), fov: a.fov + (b.fov - a.fov) * ee };
};
/** position along a polyline by arc-length fraction u */
export const along = (path: V3[], u: number) => {
  const P = path.map(V), L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + P[i].distanceTo(P[i - 1]));
  const d = u * L[L.length - 1]; let k = 1; while (k < P.length - 1 && L[k] < d) k++;
  return P[k - 1].clone().lerp(P[k], (d - L[k - 1]) / Math.max(1e-6, L[k] - L[k - 1]));
};
export const pathLen = (path: V3[]) => path.slice(1).reduce((a, p, i) => a + V(p).distanceTo(V(path[i])), 0);
/** the camera at time t: { pos, look, fov, dof, shot (index into track.shots), flying (0..1 or -1), next } */
export const trackCam = (T: Track, t: number) => {
  const S = T.shots; let i = 0; while (i + 1 < S.length && S[i + 1].t0 <= t) i++;
  const fl = T.flights.find((g) => g.to === i + 1 && t >= g.t0);
  const holdEnd = (k: number) => T.flights.find((g) => g.to === k + 1)?.t0 ?? S[k].t1;
  if (fl) {
    const u = (t - fl.t0) / (fl.t1 - fl.t0), e = smoother(u);
    const A = holdPose(S[i], fl.t0, fl.t0), B = holdPose(S[i + 1], S[i + 1].t0, holdEnd(i + 1));
    const pos = along(fl.path, e);
    // keep looking at where the outgoing shot looked, then swing (over ~40 % of the flight) to where the next shot
    // will look: one subject is always held in frame while the camera travels
    const toA = A.look.clone().sub(pos), toB = B.look.clone().sub(pos);
    const dA = toA.lengthSq() > 0.04 ? toA.normalize() : A.look.clone().sub(A.pos).normalize(), dB = toB.lengthSq() > 0.04 ? toB.normalize() : B.look.clone().sub(B.pos).normalize();
    const dist = A.look.distanceTo(A.pos) + (B.look.distanceTo(B.pos) - A.look.distanceTo(A.pos)) * e;
    const [s0, s1] = fl.swing ?? [0.3, 0.7];
    let dir = slerpDir(dA, dB, smoother((u - s0) / Math.max(0.2, s1 - s0)));
    // through a grate, shaft, window or door the view runs down the path (the solver marks those stretches)
    if (fl.ahead) {
      const n = fl.ahead.length - 1, x = Math.min(n, Math.max(0, u * n)), k = Math.min(n - 1, Math.floor(x));
      // never at the very start or the landing: the flight leaves and lands exactly on the shots' own framings
      const w = (fl.ahead[k] + (fl.ahead[k + 1] - fl.ahead[k]) * (x - k)) * smoother(u / 0.1) * smoother((1 - u) / (fl.fade ?? 0.15));
      if (w > 0) { const tg = along(fl.path, Math.min(1, e + 0.04)).sub(along(fl.path, Math.max(0, e - 0.04))); if (tg.lengthSq() > 1e-8) dir = slerpDir(dir, tg.normalize(), smoother(w)); }
    }
    return { pos, look: pos.clone().addScaledVector(dir, dist), fov: A.fov + (B.fov - A.fov) * e, dof: Math.min(S[i].dof, S[i + 1].dof) * Math.abs(1 - 2 * e) ** 2, shot: i, next: i + 1, flying: u };
  }
  const p = holdPose(S[i], Math.max(t, S[i].t0), holdEnd(i));
  return { ...p, dof: S[i].dof, shot: i, next: i, flying: -1 };
};
