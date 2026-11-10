// One continuous Hanoi (CLAUDE.md 12): everything around the story sets, so no shot ever shows a set edge, a bare
// ground plane or an empty sky. Three depth layers: the story sets (hanoi.ts) are the near/mid layer; around them a
// grid of low-detail colonial blocks with side streets, trees and chimneys (mid/far); beyond that rice paddies, huts and
// bamboo around the farm, the Red River across the whole width with the Doumer bridge, cathedral + pagoda silhouettes,
// and a hill line on the horizon that the fog hazes out. Chimney tops are returned for the smoke puffs (stage.ts).
import * as THREE from "three";
import { Batch, TiledBatch, lam, V } from "../bridge/build";
import { ctex, rep, rng, grassHD, stoneHD } from "../bridge/paint";
import { box, gableRoof, ground, holedGround, wallX } from "./hanoi";
import { colonialFacade } from "./hanoi";
import { RIVER, PALACE } from "./layout";

const roadTex = () => ctex("bdRoad", 512, 512, (g, r) => { g.fillStyle = "#c2ad86"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 2500; i++) { g.fillStyle = ["#b39f78", "#cdb994", "#a99470"][i % 3]; g.fillRect(r() * 512, r() * 512, 3, 3); } });
const paddy = () => ctex("paddy", 512, 512, (g, r) => {
  g.fillStyle = "#7fae5a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 3 === 0 ? "#8fbccb" : (i + j) % 3 === 1 ? "#93c066" : "#6fa04e"; g.fillRect(i * 128 + 6, j * 128 + 6, 116, 116); }
  for (let k = 0; k < 600; k++) { g.fillStyle = "rgba(60,110,40,0.5)"; g.fillRect(r() * 512, r() * 512, 2, 6); }
});

/** inside one of the story areas (keep clear)? */
const busy = (x: number, z: number, m: number) =>
  (x > -78 - m && x < 120 + m && z > -30 - m && z < 30 + m) ||                     // the boulevard rows + back lanes
  (z > RIVER.z1 - 4 - m && z < RIVER.z0 + 16 + m) ||                                // quay + river band
  (x > PALACE.x - 34 - m && x < PALACE.x + 34 + m && z > PALACE.z - 20 - m && z < RIVER.z1 + m) || // the palace + plaza
  (x > 112 - m && x < 175 + m && z > -22 - m && z < 34 + m);                        // the farm

export type Backdrop = { chimneys: THREE.Vector3[] };
/** chimney tops near the story sets (filled when the world is built; stage.ts puffs smoke from them) */
export const CHIMNEYS: THREE.Vector3[] = [];

export const buildBackdrop = (root: THREE.Object3D): Backdrop => {
  const b = new TiledBatch(), g = new THREE.Group(), chimneys: THREE.Vector3[] = [];
  root.add(g);
  const r = rng(1902);
  // ---- the city floor out to the horizon, streets of the grid ----
  const earth = lam("bdEarth", () => ({ map: rep(roadTex(), 1, 1) })), grass = lam("bdGrass", () => ({ map: grassHD() }));
  // (cut out where the story sets have their own ground, and the river band)
  holedGround(b, earth, -900, 900, -900, 900, [{ x0: -70, x1: 112, z0: PALACE.z, z1: 30 }, { x0: 112, x1: 190, z0: -60, z1: 60 }, { x0: -900, x1: 900, z0: RIVER.z1, z1: RIVER.z0 }], -0.06, 14);
  const bank = lam("bdBank", () => ({ map: rep(stoneHD("bdBank", ["#c9bca6", "#bfb19a", "#d3c7b2", "#b5a68e"], "#8f8270"), 1, 1), side: THREE.DoubleSide }));
  for (const [x0, x1] of [[-900, -70], [112, 900]] as const) { wallX(b, bank, x0, x1, RIVER.y - 1, 0, RIVER.z0, -1, [], 3); wallX(b, bank, x0, x1, RIVER.y - 1, 0, RIVER.z1, 1, [], 3); }
  // ---- city blocks on a grid (side streets between them) ----
  const tiles = lam("bdTiles", () => ({ color: "#b85a36" })), slate = lam("bdSlate", () => ({ color: "#6a6f86" })), trim = lam("bdTrim", () => ({ color: "#f3ead6" }));
  const facades = [0, 1, 2, 3, 4, 5].map((s) => lam(`bdFac${s}`, () => ({ map: colonialFacade(40 + s, 12, 9) })));
  const leaf = [lam("bdLeaf0", () => ({ color: "#4f8a3e" })), lam("bdLeaf1", () => ({ color: "#5c9645" }))], trunk = lam("bdTrunk", () => ({ color: "#6b4a34" }));
  for (let bx = -420; bx <= 520; bx += 34) for (let bz = -420; bz <= 380; bz += 30) {
    const cx = bx + (r() - 0.5) * 4, cz = bz + (r() - 0.5) * 4;
    if (busy(cx, cz, 16)) continue;
    const far = Math.hypot(cx - 20, cz) > 260;
    // 2-3 buildings per block along x, with a lane (side street) between blocks
    const n = far ? 2 : 3, w = 24 / n;
    for (let k = 0; k < n; k++) {
      const x0 = cx - 12 + k * w + 0.4, x1 = x0 + w - 0.8, d = 9 + r() * 6, z0 = cz - d / 2, z1 = cz + d / 2, h = 7 + r() * 6;
      const m = facades[Math.floor(r() * 6)];
      b.add(new THREE.BoxGeometry(x1 - x0, h, d).translate((x0 + x1) / 2, h / 2, cz), m);
      box(b, trim, x0 - 0.15, h - 0.2, z0 - 0.15, x1 + 0.15, h + 0.15, z1 + 0.15);
      gableRoof(b, r() > 0.25 ? tiles : slate, m, x0, x1, z0, z1, h + 0.15, 2 + r() * 1.5, 0.4);
      if (r() > 0.55) { const ch = V(x0 + 1.5 + r() * (x1 - x0 - 3), h + 3.6, (z0 + z1) / 2); box(b, lam("bdChim", () => ({ color: "#9a4a36" })), ch.x - 0.4, h, ch.z - 0.4, ch.x + 0.4, ch.y, ch.z + 0.4); if (!far) chimneys.push(ch); }
    }
    if (r() > 0.4) { const tx = cx + (r() - 0.5) * 20, tz = cz + (r() > 0.5 ? 1 : -1) * 13; // street trees in the lanes
      b.add(new THREE.CylinderGeometry(0.2, 0.28, 3.4, 6), trunk, new THREE.Matrix4().makeTranslation(tx, 1.7, tz));
      b.add(new THREE.IcosahedronGeometry(2.0 + r(), 0), leaf[Math.floor(r() * 2)], new THREE.Matrix4().makeTranslation(tx, 4.4, tz)); }
  }
  // ---- landmarks: St Joseph's-style twin-spire cathedral + a pagoda (our own silhouettes) ----
  { const stone = lam("bdCathedral", () => ({ color: "#bdb4a6" })), cx = -150, cz = 90;
    box(b, stone, cx - 9, 0, cz - 14, cx + 9, 16, cz + 14);
    for (const s of [-1, 1]) { box(b, stone, cx + s * 6 - 3, 0, cz - 17, cx + s * 6 + 3, 30, cz - 11); b.add(new THREE.ConeGeometry(2.6, 9, 4).rotateY(Math.PI / 4), slate, new THREE.Matrix4().makeTranslation(cx + s * 6, 34.5, cz - 14)); }
    gableRoof(b, slate, stone, cx - 9, cx + 9, cz - 14, cz + 14, 16, 6, 0.5); }
  { const red = lam("bdPagoda", () => ({ color: "#a8402e" })), cx = 230, cz = 150;
    for (let k = 0; k < 5; k++) { const s = 7 - k * 1.1, y = k * 3.6; box(b, lam("bdPagodaWall", () => ({ color: "#efe0c0" })), cx - s * 0.6, y, cz - s * 0.6, cx + s * 0.6, y + 2.6, cz + s * 0.6); b.add(new THREE.ConeGeometry(s, 1.4, 4).rotateY(Math.PI / 4), red, new THREE.Matrix4().makeTranslation(cx, y + 3.2, cz)); } }
  // ---- the Red River across the whole width + the Doumer bridge silhouette downstream ----
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1800, RIVER.z0 - RIVER.z1 + 4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: "#a8744e" }));
  water.position.set(0, RIVER.y - 0.02, (RIVER.z0 + RIVER.z1) / 2); g.add(water);
  { const iron = lam("bdBridge", () => ({ color: "#3e3a44" })), z0 = RIVER.z0 + 1, z1 = RIVER.z1 - 1, x = 330;
    box(b, iron, x - 4, 1.6, z1, x + 4, 2.2, z0);
    for (let k = 0; k <= 6; k++) { const z = z1 + ((z0 - z1) * k) / 6; box(b, iron, x - 4, -3, z - 0.4, x - 3.4, 2, z + 0.4); box(b, iron, x + 3.4, -3, z - 0.4, x + 4, 2, z + 0.4); }
    for (let k = 0; k < 6; k++) { const za = z1 + ((z0 - z1) * k) / 6, zb = z1 + ((z0 - z1) * (k + 1)) / 6;
      for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.15, 0.15, Math.hypot(zb - za, 6), 4).rotateX(Math.atan2(zb - za, 6)), iron, new THREE.Matrix4().makeTranslation(x + s * 3.7, 5, (za + zb) / 2));
      for (const s of [-1, 1]) box(b, iron, x + s * 3.7 - 0.15, 7.8, za, x + s * 3.7 + 0.15, 8.2, zb); } }
  // ---- countryside east + south: paddies, huts, bamboo ----
  const pad = lam("bdPaddy", () => ({ map: rep(paddy(), 1, 1) }));
  for (const [x0, x1, z0, z1] of [[176, 520, -40, 220], [112, 176, 34, 220]] as const) ground(b, pad, x0, x1, z0, z1, -0.03, 40);
  ground(b, grass, 112, 176, -40, -22, -0.03, 12);
  const thatch = lam("bdThatch", () => ({ color: "#c9a25a" })), mud = lam("bdMud", () => ({ color: "#d9c39a" })), bamboo = lam("bdBamboo", () => ({ color: "#6f9a3e" }));
  for (let k = 0; k < 26; k++) { const x = 190 + r() * 300, z = -30 + r() * 240; if (busy(x, z, 4)) continue;
    box(b, mud, x - 2.5, 0, z - 2, x + 2.5, 2.4, z + 2); gableRoof(b, thatch, mud, x - 2.5, x + 2.5, z - 2, z + 2, 2.4, 1.8, 0.5);
    for (let j = 0; j < 4; j++) b.add(new THREE.ConeGeometry(1.4, 7, 6), bamboo, new THREE.Matrix4().makeTranslation(x + 4 + j * 1.3, 3.5, z + (j % 2) * 1.5)); }
  // ---- the hill line on the horizon (the fog hazes it) ----
  const hillM = lam("bdHill", () => ({ color: "#6f9a6a" }));
  for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2, R = 1150 + (k % 3) * 140, h = 60 + ((k * 37) % 70);
    b.add(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(180 + (k % 4) * 40, h, 120), hillM, new THREE.Matrix4().makeTranslation(20 + Math.cos(a) * R, -2, Math.sin(a) * R)); }
  b.build(g);
  CHIMNEYS.push(...chimneys.filter((c) => Math.hypot(c.x - 40, c.z) < 200).slice(0, 24));
  return { chimneys };
};
