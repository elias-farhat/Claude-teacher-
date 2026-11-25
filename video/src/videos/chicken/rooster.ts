// Mike: a cartoon Wyandotte rooster in 3D (white feathers, orange legs and feet, a fanned tail, folded wings). Before the
// axe he has a head (comb, beak, eyes); after it, a neat round stump with a small white bandage. No gore, ever. Also the
// farm's other hens (smaller, buff and brown, with heads). Origin at the feet, facing +z; ~0.85 m tall with the head.
import * as THREE from "three";
import { twoTone } from "../bridge/shade";

const M = (c: string) => twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(c) }));
export type Rooster = { g: THREE.Group; body: THREE.Group; legs: THREE.Group[]; head: THREE.Group; stump: THREE.Group; wings: THREE.Mesh[] };
export const buildRooster = (feather = "#f6f2ea", tailTip = "#2a2a30", scale = 1): Rooster => {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const fm = M(feather), leg = M("#f2a030"), red = M("#d8342a"), dark = M("#1e1a1e"), beak = M("#f2c040"), pink = M("#f0b8b0"), band = M("#ffffff");
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], r: [number, number, number] = [0, 0, 0]) => {
    const me = new THREE.Mesh(geo, m); me.position.set(...p); me.rotation.set(...r); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me; };
  body.position.y = 0.42;
  add(body, new THREE.SphereGeometry(0.2, 20, 14).scale(1.0, 0.95, 1.35), fm, [0, 0, 0]);                 // the body (long axis z)
  add(body, new THREE.SphereGeometry(0.15, 16, 12).scale(1, 1.05, 0.9), fm, [0, 0.08, 0.17]);              // the breast
  const wings = [-1, 1].map((s) => add(body, new THREE.SphereGeometry(0.15, 14, 10).scale(0.35, 0.75, 1.25), fm, [s * 0.18, 0.04, -0.02], [0.15, 0, s * 0.1]) as THREE.Mesh);
  for (let i = 0; i < 6; i++) {                                                                               // the tail fan
    const a = -0.65 + i * 0.26, tf = add(body, new THREE.CapsuleGeometry(0.035, 0.32, 4, 8), fm, [Math.sin(a) * 0.06, 0.2 + Math.cos(a) * 0.06, -0.27], [-0.55, 0, a]);
    add(tf, new THREE.SphereGeometry(0.038, 8, 6).scale(1, 1.6, 1), dark, [0, 0.2, 0]);
  }
  // the neck rises from the front of the body
  const neck = add(body, new THREE.CylinderGeometry(0.07, 0.1, 0.22, 14), fm, [0, 0.2, 0.2], [0.2, 0, 0]);
  // the head (before the axe)
  const head = new THREE.Group(); head.position.set(0, 0.15, 0.02); neck.add(head);
  add(head, new THREE.SphereGeometry(0.085, 16, 12), fm, [0, 0.03, 0]);
  for (let i = 0; i < 3; i++) add(head, new THREE.SphereGeometry(0.03, 8, 6), red, [0, 0.11 + (i === 1 ? 0.015 : 0), -0.04 + i * 0.035]);   // the comb
  add(head, new THREE.ConeGeometry(0.025, 0.07, 8).rotateX(Math.PI / 2), beak, [0, 0.02, 0.1]);
  add(head, new THREE.SphereGeometry(0.022, 8, 6).scale(0.8, 1.2, 0.8), red, [0, -0.03, 0.07]);          // the wattle
  for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.014, 8, 6), dark, [s * 0.065, 0.04, 0.045]);
  // the stump (after the axe): a neat round top, pink disc, and a little white bandage cross
  const stump = new THREE.Group(); stump.position.set(0, 0.11, 0); neck.add(stump);
  add(stump, new THREE.CylinderGeometry(0.072, 0.072, 0.02, 16), pink, [0, 0, 0]);
  add(stump, new THREE.BoxGeometry(0.17, 0.025, 0.045), band, [0, 0.015, 0]);
  add(stump, new THREE.BoxGeometry(0.045, 0.028, 0.17), band, [0, 0.016, 0]);
  // legs: orange shanks and three forward toes + one back toe
  const legs = [-1, 1].map((s) => {
    const lg = new THREE.Group(); lg.position.set(s * 0.08, 0.3, 0.02); g.add(lg);
    add(lg, new THREE.CylinderGeometry(0.02, 0.022, 0.3, 8), leg, [0, -0.15, 0]);
    for (const a of [-0.45, 0, 0.45]) add(lg, new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6).rotateX(Math.PI / 2), leg, [Math.sin(a) * 0.04, -0.29, 0.045 * Math.cos(a)], [0, a, 0]);
    add(lg, new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6).rotateX(Math.PI / 2), leg, [0, -0.29, -0.03]);
    return lg;
  });
  g.scale.setScalar(scale);
  g.traverse((o) => { o.userData.noGuard = true; });   // moving: the guard frames it as a "w:" prop, never as a wall
  return { g, body, legs, head, stump, wings };
};
export type RPose = { p: THREE.Vector3; yaw: number; phase: number; walk: number; peck: number; headless: boolean; flap?: number; visible?: boolean };
/** pose a rooster: walk (0..1) swings the legs and bobs the body; peck (0..1) tips it forward; flap lifts the wings */
export const poseRooster = (r: Rooster, s: RPose) => {
  r.g.visible = s.visible !== false; if (!r.g.visible) return;
  r.g.position.copy(s.p); r.g.rotation.y = s.yaw;
  const w = Math.sin(s.phase * Math.PI * 2) * s.walk;
  r.legs[0].rotation.x = 0.55 * w; r.legs[1].rotation.x = -0.55 * w;
  r.body.position.y = 0.42 + 0.03 * Math.abs(w);
  r.body.rotation.x = 0.55 * s.peck + 0.06 * Math.sin(s.phase * Math.PI * 4) * s.walk;
  r.head.visible = !s.headless; r.stump.visible = s.headless;
  const f = s.flap ?? 0; r.wings.forEach((m, i) => { m.rotation.z = (i ? 1 : -1) * (0.1 + 0.9 * f); });
};
