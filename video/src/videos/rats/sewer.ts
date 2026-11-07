// The new sewer (layout.ts): a brick tunnel under the boulevard (walkways either side of a water channel, segmental
// vault), cast-iron pipes with flanges, hanging lanterns (warm practical light pools), light shafts under the street
// openings, the hunters' ladder, the "NEW SEWERS 1902" plaque, a branch + riser up into the fancy bathroom, the rats'
// nest niche under the sidewalk drain, and the outflow chamber under the quay grate.
import * as THREE from "three";
import { Batch, lam, quad, V } from "../bridge/build";
import { ctex, rep, brick, stoneHD } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { SEWER, GRATE, MANHOLE, DRAIN, NEST, OUTFLOW, QUAY, ROOMS } from "./layout";
import { box, wallX, wallZ, holedGround, lampMesh, signTex, Lamp } from "./hanoi";

const Y = SEWER.y, Z0 = SEWER.z - SEWER.w / 2, Z1 = SEWER.z + SEWER.w / 2, WT = Y + SEWER.wallH, TOP = WT + SEWER.w / 2;
/** the riser into the bathroom (branch end) */
export const RISER = { x: 7.5, z: -15.2, r: 0.7 };
export const BRANCH = { x0: 6.5, x1: 8.5, z0: RISER.z - RISER.r, z1: Z0, top: Y + 2.4 };

const brickWall = () => lam("sewerBrick", () => ({ map: rep(brick(), 1, 1) }));
/** inward-facing box room (floor, ceiling, 4 walls) with optional holes in the ceiling */
const innerBox = (b: Batch, wall: THREE.Material, floor: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, ceilHoles: { x0: number; x1: number; z0: number; z1: number }[] = [], skip: ("n" | "s" | "e" | "w")[] = []) => {
  b.add(quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y0, z0), V(x0, y0, z0), (x1 - x0) / 2, (z1 - z0) / 2), floor);
  // ceiling faces down: build an upward holed ground then flip winding by building it from z1 -> z0 per strip
  const xs = [x0, x1, ...ceilHoles.flatMap((h) => [h.x0, h.x1])].sort((a, c) => a - c);
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i], c = xs[i + 1]; if (c - a < 1e-3) continue;
    const cut = ceilHoles.filter((h) => h.x0 <= a + 1e-3 && h.x1 >= c - 1e-3).sort((p, q) => p.z0 - q.z0);
    let lo = z0;
    const strip = (za: number, zb: number) => { if (zb - za > 1e-3) b.add(quad(V(a, y1, za), V(c, y1, za), V(c, y1, zb), V(a, y1, zb), (c - a) / 2, (zb - za) / 2), wall); };
    for (const h of cut) { strip(lo, h.z0); lo = h.z1; }
    strip(lo, z1);
  }
  if (!skip.includes("n")) wallX(b, wall, x0, x1, y0, y1, z0, 1);
  if (!skip.includes("s")) wallX(b, wall, x0, x1, y0, y1, z1, -1);
  if (!skip.includes("w")) wallZ(b, wall, z0, z1, y0, y1, x0, 1);
  if (!skip.includes("e")) wallZ(b, wall, z0, z1, y0, y1, x1, -1);
};
/** square shaft (inward walls) from y0 up to y1 around a street hole */
const shaft = (b: Batch, wall: THREE.Material, x: number, z: number, r: number, y0: number, y1: number) => {
  wallX(b, wall, x - r, x + r, y0, y1, z - r, 1); wallX(b, wall, x - r, x + r, y0, y1, z + r, -1);
  wallZ(b, wall, z - r, z + r, y0, y1, x - r, 1); wallZ(b, wall, z - r, z + r, y0, y1, x + r, -1);
};
const lantern = (b: Batch, root: THREE.Object3D, p: THREE.Vector3, lamps: Lamp[], k = 0.9) => {
  const iron = lam("lampIron", () => ({ color: "#2a2a33" }));
  box(b, iron, p.x - 0.02, p.y + 0.18, p.z - 0.02, p.x + 0.02, p.y + 0.5, p.z + 0.02);
  box(b, iron, p.x - 0.13, p.y + 0.14, p.z - 0.13, p.x + 0.13, p.y + 0.19, p.z + 0.13);
  box(b, iron, p.x - 0.13, p.y - 0.19, p.z - 0.13, p.x + 0.13, p.y - 0.14, p.z + 0.13);
  for (const [dx, dz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) box(b, iron, p.x + dx - 0.015, p.y - 0.15, p.z + dz - 0.015, p.x + dx + 0.015, p.y + 0.15, p.z + dz + 0.015);
  lampMesh(root, p, 0.09);
  lamps.push({ p: p.clone(), k });
};
/** soft additive light shaft (NOINK) from a street opening down to the floor */
const lightShaft = (root: THREE.Object3D, x: number, z: number, r: number, y0: number, y1: number, shafts: THREE.Mesh[]) => {
  const h = y1 - y0, g = new THREE.CylinderGeometry(r * 1.1, r * 2.6, h, 24, 1, true);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.92, 0.75), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.set(x, y0 + h / 2, z); m.layers.set(NOINK); m.renderOrder = 2; root.add(m); shafts.push(m);
};

export type Sewer = { group: THREE.Group; lamps: Lamp[]; shafts: THREE.Mesh[] };

export const buildSewer = (root: THREE.Object3D): Sewer => {
  const b = new Batch(), g = new THREE.Group(), lamps: Lamp[] = [], shafts: THREE.Mesh[] = [];
  root.add(g);
  const wall = brickWall(), walk = lam("sewerWalk", () => ({ map: stoneHD("sewerWalk", ["#9a8f80", "#8f8474", "#a39886", "#877c6c"], "#5f574c") }));
  const capM = lam("sewerCap", () => ({ map: rep(brick(), 1, 1), side: THREE.DoubleSide }));
  const water = new THREE.MeshLambertMaterial({ map: rep(ctex("sewerWater", 256, 256, (gg, r) => {
    gg.fillStyle = "#4a6a5c"; gg.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) { gg.strokeStyle = r() > 0.5 ? "rgba(190,220,200,0.45)" : "rgba(20,40,30,0.35)"; gg.lineWidth = 2; const x = r() * 256, y = r() * 256; gg.beginPath(); gg.moveTo(x, y); gg.quadraticCurveTo(x + 10, y - 4, x + 22, y); gg.stroke(); }
  }), 30, 1), emissive: new THREE.Color(0.05, 0.09, 0.08) });
  // ---- main tunnel: walkways + channel, side walls, segmental vault with gaps under the shafts ----
  const chan0 = SEWER.z - 0.8, chan1 = SEWER.z + 0.8;
  const tunnelHoles = [{ x0: GRATE.x - 0.75, x1: GRATE.x + 0.75 }, { x0: MANHOLE.x - 0.6, x1: MANHOLE.x + 0.6 }];
  holedGround(b, walk, SEWER.x0, SEWER.x1, Z0, chan0, [], Y, 3);
  holedGround(b, walk, SEWER.x0, SEWER.x1, chan1, Z1, [], Y, 3);
  wallX(b, walk, SEWER.x0, SEWER.x1, Y - 0.35, Y, chan0, 1); wallX(b, walk, SEWER.x0, SEWER.x1, Y - 0.35, Y, chan1, -1);
  const wm = new THREE.Mesh(new THREE.PlaneGeometry(SEWER.x1 - SEWER.x0, 1.6).rotateX(-Math.PI / 2), water);
  wm.position.set((SEWER.x0 + SEWER.x1) / 2, Y - 0.25, SEWER.z); wm.receiveShadow = true; g.add(wm);
  // north wall with the branch opening, south wall with the nest niche opening
  wallX(b, wall, SEWER.x0, SEWER.x1, Y, WT, Z0, 1, [{ x0: BRANCH.x0, x1: BRANCH.x1, y0: Y, y1: BRANCH.top }]);
  wallX(b, wall, SEWER.x0, SEWER.x1, Y, WT, Z1, -1, [{ x0: NEST.x - 1.1, x1: NEST.x + 1.1, y0: Y, y1: Y + 1.8 }]);
  wallZ(b, wall, Z0, Z1, Y - 0.4, TOP, SEWER.x0, 1); wallZ(b, wall, Z0, Z1, Y - 0.4, TOP, SEWER.x1, -1);
  // vault in segments between the shafts (half-cylinder, inward)
  const R = SEWER.w / 2, cuts = [SEWER.x0, ...tunnelHoles.flatMap((h) => [h.x0, h.x1]), SEWER.x1].sort((a, c) => a - c);
  for (let i = 0; i + 1 < cuts.length; i += 2) {
    const a = cuts[i], c = cuts[i + 1], len = c - a;
    const vg = new THREE.CylinderGeometry(R, R, len, 24, 1, true, 0, Math.PI).rotateZ(Math.PI / 2);
    b.add(vg, lam("sewerVault", () => ({ map: rep(brick(), 1, 1), side: THREE.BackSide })), new THREE.Matrix4().makeTranslation((a + c) / 2, WT, SEWER.z));
  }
  // gaps under the shafts: flat ceiling with the hole, arch caps, side walls up to the ceiling
  for (const h of tunnelHoles) {
    const cx = (h.x0 + h.x1) / 2, r = (h.x1 - h.x0) / 2, hz = { x0: h.x0, x1: h.x1, z0: SEWER.z - r, z1: SEWER.z + r };
    const ceil = TOP;
    // ceiling (faces down) around the hole
    for (const [za, zb] of [[Z0, hz.z0], [hz.z1, Z1]]) b.add(quad(V(h.x0, ceil, za), V(h.x1, ceil, za), V(h.x1, ceil, zb), V(h.x0, ceil, zb)), wall);
    wallX(b, wall, h.x0, h.x1, WT, ceil, Z0, 1); wallX(b, wall, h.x0, h.x1, WT, ceil, Z1, -1);
    for (const x of [h.x0, h.x1]) {
      const s = new THREE.Shape(); s.moveTo(Z0, WT); s.lineTo(Z0, ceil); s.lineTo(Z1, ceil); s.lineTo(Z1, WT); s.absarc(SEWER.z, WT, R, 0, Math.PI, false);
      const cg = new THREE.ShapeGeometry(s, 16); const pos = cg.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < pos.count; k++) { const zz = pos.getX(k), yy = pos.getY(k); pos.setXYZ(k, x, yy, zz); }
      cg.computeVertexNormals(); b.add(cg, capM);
    }
    shaft(b, wall, cx, SEWER.z, r, ceil, 0);
    lightShaft(g, cx, SEWER.z, r, Y, 0, shafts);
  }
  // ---- the hunters' ladder under the manhole ----
  { const iron = lam("ladderIron", () => ({ color: "#3a3640" })), x = MANHOLE.x, z = SEWER.z + 0.45;
    for (const dx of [-0.25, 0.25]) box(b, iron, x + dx - 0.03, Y, z - 0.03, x + dx + 0.03, 0.4, z + 0.03);
    for (let y = Y + 0.3; y < 0; y += 0.32) box(b, iron, x - 0.25, y - 0.02, z - 0.02, x + 0.25, y + 0.02, z + 0.02); }
  // ---- pipes, flanges, lanterns ----
  const ironP = lam("pipeIron", () => ({ color: "#4a4f5a" })), copper = lam("pipeCopper", () => ({ color: "#a8653a" }));
  const pipe = (m: THREE.Material, y: number, z: number, r: number) => {
    b.add(new THREE.CylinderGeometry(r, r, SEWER.x1 - SEWER.x0, 12).rotateZ(Math.PI / 2), m, new THREE.Matrix4().makeTranslation((SEWER.x0 + SEWER.x1) / 2, y, z));
    for (let x = SEWER.x0 + 1.5; x < SEWER.x1; x += 3) b.add(new THREE.CylinderGeometry(r * 1.35, r * 1.35, 0.1, 12).rotateZ(Math.PI / 2), m, new THREE.Matrix4().makeTranslation(x, y, z));
  };
  pipe(ironP, Y + 1.75, Z0 + 0.22, 0.14); pipe(copper, Y + 2.1, Z0 + 0.2, 0.08); pipe(ironP, Y + 1.9, Z1 - 0.3, 0.24);
  for (let x = SEWER.x0 + 4; x < SEWER.x1; x += 9) lantern(b, g, V(x, Y + 2.0, Z0 + 0.45 + (Math.round(x) % 2 ? 0 : 3.1)), lamps);
  // ---- the plaque by the grate landing (unlit: always readable) ----
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.62), new THREE.MeshBasicMaterial({ map: signTex("newSewers", "NEW SEWERS 1902", "#1f4a7a", "#f2d58a", 768, 240) }));
    m.position.set(GRATE.x + 4.2, Y + 1.55, Z0 + 0.03); g.add(m);
    const brass = lam("brassFrame", () => ({ color: "#c9a04a" }));
    box(b, brass, GRATE.x + 3.1, Y + 1.2, Z0, GRATE.x + 5.3, Y + 1.25, Z0 + 0.06); box(b, brass, GRATE.x + 3.1, Y + 1.85, Z0, GRATE.x + 5.3, Y + 1.9, Z0 + 0.06); }
  // ---- branch north + riser up into the bathroom ----
  innerBox(b, wall, walk, BRANCH.x0, BRANCH.x1, Y, BRANCH.top, BRANCH.z0, BRANCH.z1, [{ x0: RISER.x - RISER.r, x1: RISER.x + RISER.r, z0: RISER.z - RISER.r, z1: RISER.z + RISER.r }], ["s"]);
  shaft(b, wall, RISER.x, RISER.z, RISER.r, BRANCH.top, ROOMS.bath.o.y);
  lantern(b, g, V(BRANCH.x0 + 0.35, Y + 1.8, -6), lamps, 0.8);
  // ---- the rats' nest niche (south side) under the sidewalk drain ----
  { const x0 = NEST.x - 1.1, x1 = NEST.x + 1.1, z0 = Z1, z1 = DRAIN.z + 0.7, y1 = Y + 1.8;
    innerBox(b, wall, walk, x0, x1, Y, y1, z0, z1, [{ x0: DRAIN.x - 0.5, x1: DRAIN.x + 0.5, z0: DRAIN.z - 0.5, z1: DRAIN.z + 0.5 }], ["n"]);
    shaft(b, wall, DRAIN.x, DRAIN.z, 0.5, y1, 0.12);
    lightShaft(g, DRAIN.x, DRAIN.z, 0.5, Y, 0.12, shafts);
    const straw = lam("straw", () => ({ color: "#d8b45a" }));
    box(b, straw, x0 + 0.2, Y, z0 + 0.3, x1 - 0.2, Y + 0.12, z1 - 0.3);                            // straw bed
    lantern(b, g, V(x1 - 0.3, Y + 1.45, z1 - 0.35), lamps, 0.75); }                                 // a stolen candle-lantern, warm
  // ---- outflow chamber under the quay grate ----
  { const o = OUTFLOW, x0 = o.x - 3, x1 = o.x + 3, z0 = o.z - 3, z1 = o.z + 3, y1 = o.y + 3;
    innerBox(b, wall, walk, x0, x1, o.y, y1, z0, z1, [{ x0: QUAY.grate.x - 0.7, x1: QUAY.grate.x + 0.7, z0: QUAY.grate.z - 0.7, z1: QUAY.grate.z + 0.7 }]);
    shaft(b, wall, QUAY.grate.x, QUAY.grate.z, 0.7, y1, 0.05);
    lightShaft(g, QUAY.grate.x, QUAY.grate.z, 0.7, o.y, 0.05, shafts);
    b.add(new THREE.CylinderGeometry(0.7, 0.7, 0.4, 20).rotateX(Math.PI / 2), ironP, new THREE.Matrix4().makeTranslation(o.x - 1.4, o.y + 0.9, z0 + 0.15)); // outlet pipe
    lantern(b, g, V(x1 - 0.4, o.y + 2.2, z1 - 0.4), lamps, 0.8);
    const crate = lam("crate", () => ({ color: "#8a5a3a" }));
    box(b, crate, o.x + 0.6, o.y, o.z - 0.4, o.x + 1.4, o.y + 0.4, o.z + 0.4); }                 // the rat's sun lounger crate
  b.build(g);
  return { group: g, lamps, shafts };
};
