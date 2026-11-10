// One continuous world for the Moon Hoax short (CLAUDE.md 12): New York keeps going behind and beside the street
// (brick blocks, slate roofs, chimneys for smoke), the harbour opens onto the sea to the horizon with ships at anchor,
// the Cape rises into green hills and a flat-topped Table Mountain ridge, and a hill ring closes the horizon (the fog
// hazes it). Chimney tops are exported for the smoke puffs (stage.ts).
import * as THREE from "three";
import { Batch, TiledBatch, lam, V } from "../bridge/build";
import { rep, rng, grassHD, facadeHD, roofHD, cobbleHD } from "../bridge/paint";
import { box, gableRoof, holedGround } from "../rats/hanoi";
import { WATER, CAPE, PIER } from "./layout";

export const CHIMNEYS: THREE.Vector3[] = [];

const ship = (b: Batch, x: number, z: number, s: number, yaw: number) => {
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, WATER.y, z);
  const hull = lam("bdHull", () => ({ color: "#5a3b2a" })), sail = lam("bdSail", () => ({ color: "#f4eedd", side: THREE.DoubleSide })), mast = lam("bdMast", () => ({ color: "#6b4a34" }));
  b.add(new THREE.BoxGeometry(8 * s, 1.6 * s, 2.4 * s).translate(0, 0.3 * s, 0), hull, M);
  for (const mx of [-1.8, 1.8]) {
    b.add(new THREE.CylinderGeometry(0.1 * s, 0.12 * s, 7 * s, 6).translate(mx * s, 4.4 * s, 0), mast, M);
    b.add(new THREE.PlaneGeometry(2.6 * s, 2.6 * s).rotateY(Math.PI / 2).translate(mx * s, 4.6 * s, 0), sail, M);
  }
};

export const buildBackdrop = (root: THREE.Object3D) => {
  const b = new TiledBatch(), g = new THREE.Group(), r = rng(1835);
  root.add(g);
  const cob = lam("bdCob", () => ({ map: rep(cobbleHD(), 1, 1) })), grass = lam("bdGrassM", () => ({ map: grassHD() }));
  // ---- floors: New York west of the harbour, the Cape east of the strait (holes where the sets have their own) ----
  holedGround(b, cob, -700, PIER.x0, -700, 700, [{ x0: -54, x1: PIER.x0, z0: -40, z1: 40 }], -0.05, 12);
  holedGround(b, grass, CAPE.x0, 900, -700, 700, [{ x0: CAPE.x0, x1: CAPE.x1 + 30, z0: -40, z1: 40 }], -0.04, 14);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: "#3f86a8" }));
  sea.position.set(60, WATER.y - 0.03, 0); g.add(sea);
  // ---- New York blocks ----
  const facs = [0, 1, 2, 3].map((k) => lam(`bdNyc${k}`, () => ({ map: facadeHD(`bdNyc${k}`, 12, 10, { wall: ["#c96a4a", "#b85a3e", "#d07a58", "#a9563f"][k], shutter: "#2f4f6e", brick: true }) })));
  const slate = lam("bdSlate", () => ({ map: rep(roofHD("#5d6478", true), 1, 1) })), chim = lam("bdChimB", () => ({ color: "#9a4a36" }));
  for (let bx = -420; bx <= 20; bx += 30) for (let bz = -420; bz <= 420; bz += 28) {
    const cx = bx + (r() - 0.5) * 4, cz = bz + (r() - 0.5) * 4;
    if (cx > -70 && Math.abs(cz) < 50) continue;                           // the story street + its blocks
    for (let k = 0; k < 2; k++) {
      const x0 = cx - 11 + k * 11.5, x1 = x0 + 10.5, d = 9 + r() * 5, z0 = cz - d / 2, z1 = cz + d / 2, h = 8 + r() * 6, m = facs[Math.floor(r() * 4)];
      b.add(new THREE.BoxGeometry(x1 - x0, h, d).translate((x0 + x1) / 2, h / 2, cz), m);
      gableRoof(b, slate, m, x0, x1, z0, z1, h, 2.6 + r(), 0.3);
      const ch = V(x0 + 1.5 + r() * 7, h + 3.4, cz); box(b, chim, ch.x - 0.4, h, ch.z - 0.4, ch.x + 0.4, ch.y, ch.z + 0.4);
      if (Math.hypot(cx - 10, cz) < 160) CHIMNEYS.push(ch);
    }
  }
  // ---- ships at anchor in the harbour and on the sea ----
  for (const [x, z, s, yaw] of [[62, -60, 1.2, 0.3], [78, 55, 1.0, -0.4], [140, -150, 1.6, 0.8], [30, 120, 1.4, 1.2], [180, 120, 1.8, -0.2], [-10, -140, 1.3, 0.1]] as const) ship(b, x, z, s, yaw);
  // ---- the Cape: trees, hills and a flat-topped Table Mountain ridge ----
  const leaf = lam("bdLeafC", () => ({ color: "#4f8a3e" })), trunk = lam("bdTrunkC", () => ({ color: "#6b4a34" }));
  for (let k = 0; k < 70; k++) { const x = CAPE.x0 + 10 + r() * 360, z = -300 + r() * 600; if (x < CAPE.x1 + 34 && Math.abs(z) < 44) continue;
    b.add(new THREE.CylinderGeometry(0.25, 0.35, 4, 6), trunk, new THREE.Matrix4().makeTranslation(x, 2, z));
    b.add(new THREE.IcosahedronGeometry(2.4 + r(), 0), leaf, new THREE.Matrix4().makeTranslation(x, 5, z)); }
  const rock = lam("bdTable", () => ({ color: "#8a8f9a" })), green = lam("bdHillC", () => ({ color: "#6f9a5a" }));
  b.add(new THREE.CylinderGeometry(70, 110, 80, 8, 1).scale(2.2, 1, 0.8), rock, new THREE.Matrix4().makeTranslation(420, 38, -160)); // Table Mountain
  b.add(new THREE.CylinderGeometry(150, 150, 2, 8).scale(2.1, 1, 0.75), lam("bdCloudCap", () => ({ color: "#f4f6fa" })), new THREE.Matrix4().makeTranslation(420, 79, -160)); // its tablecloth of cloud
  for (const [x, z, sx, h] of [[300, 60, 90, 40], [520, 140, 130, 60], [260, -260, 110, 45], [600, -40, 140, 70]] as const)
    b.add(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(sx, h, sx * 0.7), green, new THREE.Matrix4().makeTranslation(x, -1, z));
  // ---- the horizon hill ring (hazed by the fog) ----
  const far = lam("bdFarHill", () => ({ color: "#7a9a86" }));
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2, R = 1250 + (k % 3) * 150;
    b.add(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(200, 70 + ((k * 31) % 60), 140), far, new THREE.Matrix4().makeTranslation(60 + Math.cos(a) * R, -2, Math.sin(a) * R)); }
  b.build(g);
};
