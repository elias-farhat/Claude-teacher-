// CLAUDE.md 12 for the Moon Hoax short's two weakest places (preview 20 review):
//  - the Moon world keeps going past the little plateau: a lavender ground to the horizon, rolling moon hills, craters,
//    glowing moon plants and more silver trees (only shown while the camera is up there, so the Moon still reads as a
//    small sphere from Earth); the silvery look's fog hazes it all toward the horizon
//  - Herschel's beach (line 14) is a real beach: a striped umbrella, a deckchair, a towel, a sandcastle with a bucket
import * as THREE from "three";
import { Batch, lam } from "../bridge/build";
import { ctex, rng } from "../bridge/paint";
import { box } from "../rats/hanoi";
import { MOON, MOON_TOP, BEACH } from "./layout";

const stripes = (key: string, a: string, c: string) => lam(key, () => ({ map: ctex(key + "T", 128, 128, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c : a; g.fillRect(i * 16, 0, 16, 128); } }), side: THREE.DoubleSide }));

export const buildMoonExtras = (root: THREE.Object3D) => {
  const b = new Batch(), g = new THREE.Group(), r = rng(1969), cx = MOON.c.x, cz = MOON.c.z, y = MOON_TOP;
  root.add(g);
  const ground = lam("mxGround", () => ({ color: "#8e98cc" })), hillA = lam("mxHillA", () => ({ color: "#a7a3d8" })), hillB = lam("mxHillB", () => ({ color: "#9aa6d6" }));
  const rim = lam("mxCraterRim", () => ({ color: "#bfc2e0" })), pit = lam("mxCraterPit", () => ({ color: "#6f74a6" }));
  const stalk = lam("mxStalk", () => ({ color: "#5fa79e" })), trunk = lam("mxTrunk", () => ({ color: "#5a5a78" }));
  const leaves = ["#7fb7c9", "#a7c9e6", "#94b0e0", "#b9a7e6"].map((c) => lam(`mxLeaf${c}`, () => ({ color: c })));
  const glow = [new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.85, 1.6) }), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 1.5, 1.6) }), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.4, 0.7) })];
  // ground to the horizon around the plateau
  b.add(new THREE.RingGeometry(12.3, 420, 64, 1).rotateX(-Math.PI / 2), ground, new THREE.Matrix4().makeTranslation(cx, y - 0.04, cz));
  // rolling moon hills (two rings)
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * Math.PI * 2 + r() * 0.2, R = (k % 2 ? 34 : 60) + r() * 18, sx = 9 + r() * 10, h = 4 + r() * 8;
    b.add(new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(sx, h, sx * 0.8), k % 3 ? hillA : hillB, new THREE.Matrix4().makeTranslation(cx + Math.cos(a) * R, y - 0.5, cz + Math.sin(a) * R));
  }
  // craters: a few at the plateau's back edge (clear of the scenes), many beyond
  const crater = (x: number, z: number, s: number) => {
    b.add(new THREE.TorusGeometry(s, 0.18 * s, 6, 24).rotateX(Math.PI / 2).scale(1, 0.55, 1), rim, new THREE.Matrix4().makeTranslation(x, y + 0.02, z));
    b.add(new THREE.CircleGeometry(s * 0.95, 24).rotateX(-Math.PI / 2), pit, new THREE.Matrix4().makeTranslation(x, y + 0.03, z));
  };
  for (const [a, R, s] of [[4.3, 9.6, 0.9], [4.9, 10.4, 1.3], [5.5, 9.2, 0.7]] as const) crater(cx + Math.cos(a) * R, cz + Math.sin(a) * R, s);
  for (let k = 0; k < 30; k++) { const a = r() * Math.PI * 2, R = 15 + r() * 60; crater(cx + Math.cos(a) * R, cz + Math.sin(a) * R, 1 + r() * 3); }
  // glowing moon plants: stalks with bulbs, round the plateau rim and beyond
  for (let k = 0; k < 60; k++) {
    const a = r() * Math.PI * 2, R = k < 20 ? 10.6 + r() * 1.5 : 13 + r() * 30, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, h = 0.5 + r() * 1.0;
    b.add(new THREE.CylinderGeometry(0.035, 0.05, h, 5), stalk, new THREE.Matrix4().makeTranslation(x, y + h / 2, z));
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.11 + r() * 0.08, 10, 8), glow[k % 3]); m.position.set(x, y + h + 0.06, z); g.add(m);
    if (k % 2) b.add(new THREE.ConeGeometry(0.22, 0.5, 5).rotateZ(0.6), stalk, new THREE.Matrix4().makeTranslation(x + 0.12, y + h * 0.4, z));
  }
  // more silver trees out to the hills
  for (let k = 0; k < 40; k++) {
    const a = r() * Math.PI * 2, R = 14 + r() * 40, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, s = 0.8 + r() * 0.6;
    b.add(new THREE.CylinderGeometry(0.15 * s, 0.24 * s, 3 * s, 7), trunk, new THREE.Matrix4().makeTranslation(x, y + 1.5 * s, z));
    for (let j = 0; j < 3; j++) b.add(new THREE.IcosahedronGeometry((1.1 + r() * 0.6) * s, 1), leaves[(k + j) % 4], new THREE.Matrix4().makeTranslation(x + (r() - 0.5) * 1.6 * s, y + (3.3 + r()) * s, z + (r() - 0.5) * 1.6 * s));
  }
  b.build(g);
  return g;
};

export const buildBeach = (root: THREE.Object3D) => {
  const b = new Batch(), g = new THREE.Group(); root.add(g);
  const pole = lam("bchPole", () => ({ color: "#f4efe4" })), wood = lam("bchWood", () => ({ color: "#9a6a42" })), sandC = lam("bchCastle", () => ({ color: "#e6c98a" }));
  const red = stripes("bchRed", "#c8313b", "#f4efe4"), blue = stripes("bchBlue", "#2f7ab5", "#f4efe4"), yel = stripes("bchYel", "#e8b23a", "#f4efe4");
  const X = BEACH.x, Z = BEACH.z;
  // the umbrella over a deckchair, behind Herschel on screen right (seen from the east, looking out to sea)
  const ux = X - 1.9, uz = Z - 0.3;
  b.add(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6), pole, new THREE.Matrix4().makeTranslation(ux, 1.2, uz));
  b.add(new THREE.ConeGeometry(1.25, 0.5, 16, 1, true), red, new THREE.Matrix4().makeTranslation(ux, 2.35, uz));
  { const seat = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.7).rotateX(-Math.PI / 2 + 0.25), blue); seat.position.set(ux + 0.4, 0.32, uz + 0.3); g.add(seat);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), blue); back.position.set(ux - 0.05, 0.62, uz + 0.3); back.rotation.set(0, Math.PI / 2, 0); back.rotateX(-0.55); g.add(back);
    for (const dz of [0.0, 0.6]) { box(b, wood, ux + 0.7, 0, uz + dz - 0.03, ux + 0.76, 0.36, uz + dz + 0.03); box(b, wood, ux - 0.2, 0, uz + dz - 0.03, ux - 0.14, 0.95, uz + dz + 0.03); } }
  // a second umbrella further down the beach (screen left), a towel, a sandcastle with a bucket and spade
  b.add(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6), pole, new THREE.Matrix4().makeTranslation(X - 2.2, 1.2, Z + 4.2));
  b.add(new THREE.ConeGeometry(1.2, 0.5, 16, 1, true), yel, new THREE.Matrix4().makeTranslation(X - 2.2, 2.35, Z + 4.2));
  { const towel = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6).rotateX(-Math.PI / 2), blue); towel.position.set(X - 1.5, 0.025, Z + 2.2); g.add(towel); }
  { const sx = X - 1.6, sz = Z - 3.6;
    box(b, sandC, sx - 0.35, 0, sz - 0.35, sx + 0.35, 0.3, sz + 0.35);
    for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { box(b, sandC, sx + dx - 0.1, 0.3, sz + dz - 0.1, sx + dx + 0.1, 0.48, sz + dz + 0.1); b.add(new THREE.ConeGeometry(0.12, 0.18, 6), sandC, new THREE.Matrix4().makeTranslation(sx + dx, 0.57, sz + dz)); }
    b.add(new THREE.CylinderGeometry(0.14, 0.11, 0.24, 12), lam("bchBucket", () => ({ color: "#d8443a" })), new THREE.Matrix4().makeTranslation(sx + 0.65, 0.12, sz + 0.3)); }
  b.build(g);
};
