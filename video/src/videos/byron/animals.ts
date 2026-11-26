// The animals of "His College Banned Dogs, So He Brought a Bear": the tame brown bear (big, friendly, on all fours or
// sitting up at a desk; a little black academic gown and a mortarboard for the "fellowship" gag) and Boatswain, Byron's
// black Newfoundland (big, fluffy, a white-free coat). Origin at the feet, facing +z. Built from simple rounded shapes
// with painted eyes; every part is noGuard (the guard frames them as "w:" props).
import * as THREE from "three";
import { twoTone } from "../bridge/shade";

const M = (c: string, side: THREE.Side = THREE.FrontSide) => twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(c), side }));
type P3 = [number, number, number];
export type Beast = { g: THREE.Group; body: THREE.Group; head: THREE.Group; legs: THREE.Group[]; arms?: THREE.Group[]; gown?: THREE.Group; tail?: THREE.Mesh; jaw?: THREE.Mesh };
const mk = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, p: P3, r: P3 = [0, 0, 0]) => {
  const me = new THREE.Mesh(geo, m); me.position.set(...p); me.rotation.set(...r); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me; };
const eyes = (head: THREE.Object3D, r: number, z: number, y: number, sp: number) => {
  const w = M("#ffffff"), k = M("#16121a");
  for (const s of [-1, 1]) { mk(head, new THREE.SphereGeometry(r, 12, 10), w, [s * sp, y, z]); mk(head, new THREE.SphereGeometry(r * 0.55, 10, 8), k, [s * sp, y, z + r * 0.6]); }
};

/** the bear: ~1.25 m at the shoulder on all fours; body pivots up to sit (upright 0..1) */
export const buildBear = (fur = "#8a5a32"): Beast => {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const fm = M(fur), dk = M("#5a3a1e"), muzzle = M("#d8b08a"), nose = M("#1a1216");
  body.position.set(0, 0.78, 0);
  mk(body, new THREE.SphereGeometry(0.55, 22, 16).scale(1, 0.9, 1.35), fm, [0, 0, 0]);          // the barrel body
  mk(body, new THREE.SphereGeometry(0.42, 18, 14), fm, [0, 0.12, 0.42]);                        // shoulders / chest
  const head = new THREE.Group(); head.position.set(0, 0.32, 0.85); body.add(head);
  mk(head, new THREE.SphereGeometry(0.33, 22, 16), fm, [0, 0, 0]);
  mk(head, new THREE.SphereGeometry(0.17, 16, 12).scale(1, 0.8, 1.1), muzzle, [0, -0.08, 0.27]);
  mk(head, new THREE.SphereGeometry(0.06, 10, 8).scale(1.3, 1, 1), nose, [0, -0.02, 0.44]);
  for (const s of [-1, 1]) { mk(head, new THREE.SphereGeometry(0.1, 12, 10), fm, [s * 0.24, 0.26, -0.02]); mk(head, new THREE.SphereGeometry(0.06, 10, 8), dk, [s * 0.24, 0.26, 0.04]); }
  eyes(head, 0.05, 0.27, 0.08, 0.13);
  // legs (front pair are the "arms" when sitting up)
  const leg = (x: number, z: number) => { const lg = new THREE.Group(); lg.position.set(x, -0.1, z); body.add(lg);
    mk(lg, new THREE.CapsuleGeometry(0.14, 0.42, 6, 12), fm, [0, -0.3, 0]); mk(lg, new THREE.SphereGeometry(0.16, 12, 10).scale(1, 0.6, 1.25), dk, [0, -0.6, 0.06]); return lg; };
  const legs = [leg(-0.3, 0.45), leg(0.3, 0.45), leg(-0.3, -0.5), leg(0.3, -0.5)];
  mk(body, new THREE.SphereGeometry(0.11, 10, 8), fm, [0, 0.1, -0.72]);                          // stub tail
  // the gown (a little black academic gown over the shoulders) and the mortarboard
  const gown = new THREE.Group(); body.add(gown);
  { const gm = M("#1c1c26", THREE.DoubleSide);
    mk(gown, new THREE.CylinderGeometry(0.46, 0.62, 0.7, 20, 1, true, Math.PI * 0.62, Math.PI * 1.76), gm, [0, 0.02, 0.28], [Math.PI / 2, 0, 0]);
    const mb = new THREE.Group(); mb.position.set(0, 0.3, 0); head.add(mb);
    mk(mb, new THREE.SphereGeometry(0.3, 18, 8, 0, Math.PI * 2, 0, 0.9), gm, [0, -0.02, 0]);
    mk(mb, new THREE.BoxGeometry(0.62, 0.035, 0.62), gm, [0, 0.12, 0], [0, Math.PI / 4, 0]);
    mk(mb, new THREE.CylinderGeometry(0.012, 0.02, 0.22, 6), M("#e0b040"), [0.22, 0.02, 0.12]); }
  g.traverse((o) => { o.userData.noGuard = true; });
  return { g, body, head, legs, gown };
};
/** Boatswain: a black Newfoundland, ~0.75 m at the shoulder, fluffy, a plumed tail */
export const buildDog = (): Beast => {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const fm = M("#26222a"), tongue = M("#e06a7a"), nose = M("#0e0c10");
  body.position.set(0, 0.5, 0);
  mk(body, new THREE.SphereGeometry(0.3, 18, 14).scale(1, 0.85, 1.5), fm, [0, 0, 0]);
  mk(body, new THREE.SphereGeometry(0.25, 16, 12), fm, [0, 0.08, 0.3]);                          // the fluffy chest
  const head = new THREE.Group(); head.position.set(0, 0.3, 0.52); body.add(head);
  mk(head, new THREE.SphereGeometry(0.2, 18, 14), fm, [0, 0, 0]);
  mk(head, new THREE.SphereGeometry(0.11, 14, 10).scale(1, 0.8, 1.2), fm, [0, -0.06, 0.16]);
  mk(head, new THREE.SphereGeometry(0.045, 10, 8), nose, [0, -0.02, 0.3]);
  const jaw = mk(head, new THREE.SphereGeometry(0.05, 10, 8).scale(1, 0.5, 1.4), tongue, [0, -0.13, 0.18]);
  for (const s of [-1, 1]) mk(head, new THREE.SphereGeometry(0.1, 12, 10).scale(0.5, 1.2, 0.8), fm, [s * 0.18, -0.02, -0.02], [0, 0, s * 0.3]);   // floppy ears
  eyes(head, 0.035, 0.16, 0.06, 0.08);
  const leg = (x: number, z: number) => { const lg = new THREE.Group(); lg.position.set(x, -0.08, z); body.add(lg);
    mk(lg, new THREE.CapsuleGeometry(0.075, 0.28, 6, 10), fm, [0, -0.2, 0]); return lg; };
  const legs = [leg(-0.15, 0.28), leg(0.15, 0.28), leg(-0.15, -0.3), leg(0.15, -0.3)];
  const tail = mk(body, new THREE.CapsuleGeometry(0.06, 0.32, 4, 8), fm, [0, 0.12, -0.48], [-0.9, 0, 0]);
  g.traverse((o) => { o.userData.noGuard = true; });
  return { g, body, head, legs, tail, jaw };
};
export type BPose = { p: THREE.Vector3; yaw: number; phase: number; walk: number; up?: number; wave?: number; gown?: boolean; wag?: number; visible?: boolean; scale?: number };
/** walk swings the legs diagonally; up (0..1) sits the bear up on its haunches; wave lifts a front paw */
export const poseBeast = (b: Beast, s: BPose) => {
  b.g.visible = s.visible !== false; if (!b.g.visible) return;
  b.g.position.copy(s.p); b.g.rotation.y = s.yaw; if (s.scale) b.g.scale.setScalar(s.scale);
  const w = Math.sin(s.phase * Math.PI * 2) * s.walk, up = s.up ?? 0;
  b.legs.forEach((lg, i) => { lg.rotation.x = (i === 0 || i === 3 ? 1 : -1) * 0.45 * w; });
  const by = b.body.userData.y0 ?? (b.body.userData.y0 = b.body.position.y);
  b.body.rotation.x = -1.2 * up; b.body.position.y = by + 0.03 * Math.abs(w) + up * by * 0.55;
  if (up > 0) { b.legs[0].rotation.x = 1.1 * up; b.legs[1].rotation.x = 1.1 * up - (s.wave ?? 0) * 1.4; b.legs[2].rotation.x = b.legs[3].rotation.x = 1.2 * up; }
  b.head.rotation.x = 1.0 * up;   // the head stays level when the body sits up
  if (b.gown) b.gown.visible = !!s.gown;
  if (b.gown) { const mb = b.head.children[b.head.children.length - 1]; if (mb) mb.visible = !!s.gown; }
  if (b.tail) b.tail.rotation.z = 0.5 * Math.sin((s.wag ?? 0) * Math.PI * 2);
};
