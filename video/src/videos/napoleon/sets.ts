// The sets of "Napoleon vs. the Rabbits": the château park (lawn, gravel, hedges, trees, the château to the north, two
// rows of wooden cages with doors that spring open, the carriage with its horses), the hill with the white horse and
// the army behind, the treaty room, the farm, Thiébault's study. Kenney props mid/background only.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, lam, V, Kit, boxGeo } from "../bridge/build";
import { rep, stoneHD, grassHD, planksHD, roofHD, ctex } from "../bridge/paint";
import { ground, gableRoof, Lamp } from "../rats/hanoi";
import { twoTone } from "../bridge/shade";
import { bunnyGeo } from "../bridge/bunny";
import { Pen, faceFront } from "../bridge/toon";
import { LAWN, CHATEAU, CAGES, CARRIAGE, HILL, RIDER, FARM, ROOMS, Room, RC, NAP, BERTH3 } from "./layout";

export type Sets = { lamps: Lamp[]; doors: THREE.Object3D[]; carriage: THREE.Group };
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gravelTex = () => ctex("npGravel", 512, 512, (g, r) => { g.fillStyle = "#d9cdb4"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 3000; i++) { g.fillStyle = ["#cbbd9f", "#e6dcc6", "#bfb197"][i % 3]; g.fillRect(r() * 512, r() * 512, 3, 3); } });
const wallTex = (key: string, base: string, stripe: string) => ctex(key, 256, 256, (g) => { g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.fillStyle = stripe; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 10, 256); });
const M = (c: string) => twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(c) }));

/** a cartoon horse (origin at its hooves, facing +x), ~1.6 m at the back */
export const buildHorse = (coat: string, mane: string, saddle?: string) => {
  const g = new THREE.Group(), c = M(coat), mn = M(mane), dark = M("#2a2228");
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], r: [number, number, number] = [0, 0, 0]) => { const me = new THREE.Mesh(geo, m); me.position.set(...p); me.rotation.set(...r); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  add(new THREE.CapsuleGeometry(0.4, 1.1, 6, 16).rotateZ(Math.PI / 2), c, [0, 1.3, 0]);
  for (const [x, z] of [[0.62, 0.2], [0.62, -0.2], [-0.62, 0.2], [-0.62, -0.2]]) { add(new THREE.CylinderGeometry(0.075, 0.06, 1.05, 8), c, [x, 0.55, z]); add(new THREE.CylinderGeometry(0.085, 0.09, 0.12, 8), dark, [x, 0.06, z]); }
  add(new THREE.CapsuleGeometry(0.2, 0.55, 4, 12), c, [0.95, 1.75, 0], [0, 0, -0.6]);
  add(new THREE.CapsuleGeometry(0.17, 0.42, 4, 12).rotateZ(Math.PI / 2), c, [1.32, 2.0, 0], [0, 0, -0.5]);
  for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.06, 0.18, 6), c, [1.18, 2.32, s * 0.08]); add(new THREE.SphereGeometry(0.04, 8, 6), dark, [1.42, 2.08, s * 0.13]); }
  add(new THREE.BoxGeometry(0.5, 0.14, 0.08), mn, [0.92, 2.0, 0], [0, 0, -0.6]);
  add(new THREE.CapsuleGeometry(0.07, 0.6, 4, 8), mn, [-0.95, 1.05, 0], [0, 0, 0.5]);
  if (saddle) { add(new THREE.BoxGeometry(0.62, 0.08, 0.86), M(saddle), [0.0, 1.71, 0]); add(new THREE.BoxGeometry(0.5, 0.12, 0.5), M("#5a3a24"), [0.0, 1.78, 0]); }
  return g;
};

export function buildSets(R: THREE.Group, kit: Kit): Sets {
  const b = new Batch(), r = rng(1807), lamps: Lamp[] = [];
  const bx = (mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 2.5) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile), mat);
  const add = (name: string, x: number, y: number, z: number, s: number, rot = 0) => {
    const o = kit[name]; if (!o) return;
    b.addObject(o, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), V(s, s, s)));
  };
  const grass = lam("npGrass", () => ({ map: grassHD(), color: "#8fb070" }));
  const gravel = lam("npGravelM", () => ({ map: rep(gravelTex(), 1, 1) }));
  const wood = lam("npWood", () => ({ map: rep(planksHD(), 1, 1), color: "#b0906a" }));
  const dark = lam("npDark", () => ({ color: "#4a3426" }));
  const stoneW = lam("npStone", () => ({ map: rep(stoneHD("npStone", ["#efe4cf", "#e6dac4", "#f3ead8", "#ded1bb"], "#c4b69c"), 1, 1) }));
  const slate = lam("npSlate", () => ({ map: rep(roofHD("#5a6478", true), 3, 3) }));
  const win = lam("npWin", () => ({ color: "#3a4a6a" }));
  const white = lam("npWhite", () => ({ color: "#f4f0e6" }));

  // ---- the ground: one big lawn; gravel in front of the château and round the hunting ground ----
  ground(b, grass, -700, 700, -700, 700, 0, 10);
  ground(b, gravel, CHATEAU.x0 - 6, CHATEAU.x1 + 6, CHATEAU.z1, CHATEAU.z1 + 14, 0.02, 6);
  ground(b, gravel, -2, 2, CHATEAU.z1 + 14, -12, 0.02, 6);
  // ---- the château: a long cream block, rows of tall windows, a central pavilion with a dome, slate mansard ----
  { const { x0, x1, z0, z1, h } = CHATEAU;
    bx(stoneW, x0, 0, z0, x1, h, z1);
    for (let x = x0 + 2.2; x < x1 - 1; x += 3.6) for (const y of [1.6, 6.2, 10.0]) if (!(Math.abs(x) < 3 && y < 3)) bx(win, x - 0.7, y, z1, x + 0.7, y + 2.4, z1 + 0.06, 1);
    bx(stoneW, -7, 0, z1, 7, h + 3, z1 + 3);
    b.add(new THREE.SphereGeometry(5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, h + 3, z1 - 1), slate);
    bx(dark, -1.6, 0, z1 + 3, 1.6, 4, z1 + 3.06, 1);
    gableRoof(b, slate, stoneW, x0, x1, z0, z1, h, 4.5, 0.4);
    for (const s of [-1, 1]) { bx(stoneW, s * 36 - 5, 0, z1 - 2, s * 36 + 5, h + 2, z1 + 2); gableRoof(b, slate, stoneW, s * 36 - 5, s * 36 + 5, z1 - 2, z1 + 2, h + 2, 3.2, 0.3); } }
  // hedges along the gravel, trees round the park, statues on plinths
  for (let x = -30; x <= 30; x += 3) if (Math.abs(x) > 4) for (const z of [CHATEAU.z1 + 15]) add("plant_bushLarge", x, 0, z, 2.2, r());
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat"];
  for (let i = 0; i < 140; i++) { const a = r() * Math.PI * 2, d = 46 + r() * 70, x = Math.cos(a) * d, z = 5 + Math.sin(a) * d; if (z < CHATEAU.z1 + 2 && Math.abs(x) < 50) continue; add(trees[i % 4], x, 0, z, 4 + r() * 2.4, r() * 6.3); }
  for (const x of [-12, 12]) { bx(stoneW, x - 0.6, 0, -26.6, x + 0.6, 1.8, -25.4, 1); b.add(new THREE.SphereGeometry(0.6, 14, 10).translate(x, 2.4, -26), stoneW); }
  for (const [n, x, z, s, ro] of [["tent_detailedOpen", -24, -14, 3.2, 0.4], ["tent_detailedClosed", 26, -16, 3.2, -0.4], ["cart", -18, 6, 2.2, 0.8], ["barrel", 20, -4, 0.6, 0], ["crate", -15, -2, 1.0, 0.3]] as [string, number, number, number, number][]) add(n, x, 0.02, z, s, ro);
  // ---- the cages: wooden frames with bars and a front door each (the doors swing open on "open") ----
  const doors: THREE.Object3D[] = [];
  for (const c of CAGES) {
    const w = 2.0, d = 1.1, h = 0.9;
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) bx(dark, c.x + x - 0.05, 0, c.z + z - 0.05, c.x + x + 0.05, h, c.z + z + 0.05, 1);
    bx(wood, c.x - w / 2, 0, c.z - d / 2, c.x + w / 2, 0.08, c.z + d / 2, 1); bx(wood, c.x - w / 2, h, c.z - d / 2, c.x + w / 2, h + 0.06, c.z + d / 2, 1);
    for (let x = -w / 2 + 0.2; x < w / 2; x += 0.2) bx(dark, c.x + x - 0.015, 0.08, c.z - d / 2 - 0.015, c.x + x + 0.015, h, c.z - d / 2 + 0.015, 1);   // back bars
    for (const s of [-1, 1]) for (let z = -d / 2 + 0.2; z < d / 2; z += 0.2) bx(dark, c.x + s * w / 2 - 0.015, 0.08, c.z + z - 0.015, c.x + s * w / 2 + 0.015, h, c.z + z + 0.015, 1);
    // the door: a barred panel hinged at its top edge, flips up and back
    const door = new THREE.Group(), dm = M("#6a4a32");
    for (let x = -w / 2 + 0.1; x < w / 2; x += 0.2) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, h - 0.08, 0.03), dm); bar.position.set(x, -(h - 0.08) / 2, 0); bar.castShadow = true; door.add(bar); }
    for (const y of [-0.02, -(h - 0.1)]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.05), dm); rail.position.set(0, y, 0); door.add(rail); }
    door.position.set(c.x, h, c.z + d / 2); R.add(door); doors.push(door);
  }
  // ---- the carriage: a dark-green coach on four red wheels, gold trim, two brown horses (moved by world.ts) ----
  const carriage = new THREE.Group();
  { const body = M("#2a4a3a"), gold = M("#d9a43a"), wheel = M("#a8261e");
    const add2 = (geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], ro: [number, number, number] = [0, 0, 0]) => { const me = new THREE.Mesh(geo, m); me.position.set(...p); me.rotation.set(...ro); me.castShadow = me.receiveShadow = true; carriage.add(me); return me; };
    add2(new THREE.BoxGeometry(2.4, 1.5, 1.5), body, [0, 1.45, 0]);
    add2(new THREE.BoxGeometry(2.6, 0.12, 1.66), gold, [0, 2.25, 0]);
    add2(new THREE.BoxGeometry(2.0, 0.3, 1.3), body, [0, 2.4, 0]);
    add2(new THREE.BoxGeometry(0.75, 0.75, 0.04), M("#c9dbe8"), [-0.5, 1.75, -0.76]);   // the window on the near (north) side
    add2(new THREE.BoxGeometry(0.75, 1.1, 0.04), M("#1e3a2c"), [0.5, 1.45, -0.77]);      // the door
    for (const [x, rr] of [[-0.9, 0.62], [0.9, 0.48]]) for (const z of [-0.85, 0.85]) { add2(new THREE.TorusGeometry(rr, 0.06, 8, 24), wheel, [x, rr, z]); add2(new THREE.CylinderGeometry(0.03, 0.03, rr * 2, 6), wheel, [x, rr, z], [0, 0, 0]); add2(new THREE.CylinderGeometry(0.03, 0.03, rr * 2, 6), wheel, [x, rr, z], [0, 0, Math.PI / 2]); }
    add2(new THREE.BoxGeometry(0.8, 0.12, 1.3), body, [1.6, 1.45, 0]);   // driver's box
    for (const z of [-0.45, 0.45]) { const h = buildHorse("#7a4a2a", "#2a1a12"); h.position.set(3.2, 0, z); carriage.add(h); }
    carriage.position.copy(CARRIAGE); R.add(carriage); }

  // ---- the hill: a broad plateau, Napoleon's white horse at its east edge, the army and flags behind ----
  b.add(new THREE.CylinderGeometry(HILL.top, HILL.r, HILL.h, 36, 1), lam("npHill", () => ({ map: rep(grassHD(), 16, 3), color: "#9ab070" })), new THREE.Matrix4().makeTranslation(HILL.x, HILL.h / 2, HILL.z));
  ground(b, lam("npHillTop", () => ({ map: grassHD(), color: "#9ab070" })), HILL.x - HILL.top * 0.7, HILL.x + HILL.top * 0.7, HILL.z - HILL.top * 0.7, HILL.z + HILL.top * 0.7, HILL.h + 0.01, 10);
  { const horse = buildHorse("#f2efe8", "#d8d2c8", "#a8261e"); horse.position.set(RIDER.x - 0.1, RIDER.y, RIDER.z); horse.rotation.y = 0.35; R.add(horse); }
  { // the army: an instanced block of blue-coated soldiers in shakos behind him, tricolour flags above
    const parts = [new THREE.CapsuleGeometry(0.2, 0.5, 4, 10).translate(0, 0.85, 0), new THREE.SphereGeometry(0.2, 12, 8).translate(0, 1.42, 0), new THREE.CylinderGeometry(0.17, 0.15, 0.32, 10).translate(0, 1.72, 0), new THREE.CylinderGeometry(0.02, 0.02, 1.9, 5).translate(0.28, 1.4, 0)].map((p) => { const q = p.index ? p.toNonIndexed() : p; q.deleteAttribute("uv"); return q; });
    const nX = 22, nZ = 26, army = new THREE.InstancedMesh(mergeGeometries(parts, false)!, lam("npArmy", () => ({ color: "#2a3f8a" })), nX * nZ), m = new THREE.Matrix4();
    let k = 0; for (let i = 0; i < nX; i++) for (let j = 0; j < nZ; j++) { m.compose(V(HILL.x - 16 + i * 0.95 + (r() - 0.5) * 0.2, HILL.h, HILL.z - 12 + j * 0.95 + (r() - 0.5) * 0.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2 + (r() - 0.5) * 0.2, 0)), V(1, 0.95 + r() * 0.1, 1)); army.setMatrixAt(k++, m); }
    army.castShadow = army.receiveShadow = true; army.frustumCulled = false; R.add(army);
    const flagTex = ctex("npTricolore", 192, 128, (g) => { ["#2a4f9a", "#f4f1ea", "#c8313b"].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 64, 0, 64, 128); }); });
    for (let i = 0; i < 7; i++) { const x = HILL.x - 14 + (i % 4) * 5.5, z = HILL.z - 10 + Math.floor(i / 4) * 12 + (i % 2) * 4;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 6), M("#5a3a24")); pole.position.set(x, HILL.h + 3, z); R.add(pole);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5, 8, 1), twoTone(new THREE.MeshLambertMaterial({ map: flagTex, side: THREE.DoubleSide }))); { const p = fl.geometry.attributes.position; for (let j = 0; j < p.count; j++) p.setZ(j, 0.15 * Math.sin(p.getX(j) * 3 + i)); }
      fl.position.set(x + 1.1, HILL.h + 5.1, z); fl.rotation.y = 0.3; R.add(fl); } }

  // ---- interiors (the treaty room, Thiébault's study): floor, wallpaper, windows onto the park, ceiling, lamps ----
  const room = (R0: Room, paper: string, stripe: string) => {
    const t = 0.3, { x0, x1, z0, z1, h } = R0, wp = lam("npPaper" + R0.name, () => ({ map: rep(wallTex("npPaperT" + R0.name, paper, stripe), (x1 - x0) / 1.2, 1) }));
    ground(b, wood, x0, x1, z0, z1, 0.03, 2.5);
    bx(wp, x0, 0, z0, x1, h, z0 + t); bx(wp, x0, 0, z0, x0 + t, h, z1); bx(wp, x1 - t, 0, z0, x1, h, z1);
    const W = x1 - x0, wa = x0 + W * 0.25, wb = x0 + W * 0.75;
    const solid = (a: number, c: number) => bx(wp, a, 0, z1 - t, c, h, z1);
    solid(x0, wa - 0.8); solid(wa + 0.8, wb - 0.8); solid(wb + 0.8, x1);
    for (const c of [wa, wb]) { bx(wp, c - 0.8, 0, z1 - t, c + 0.8, 1.0, z1); bx(wp, c - 0.8, 2.6, z1 - t, c + 0.8, h, z1); }
    bx(lam("npCeil", () => ({ color: "#efe6d4" })), x0, h, z0, x1, h + 0.2, z1);
    gableRoof(b, slate, white, x0, x1, z0, z1, h + 0.2, 2.2, 0.4);
    for (const [lx, lz] of [[x0 + 0.9, z0 + 0.9], [x1 - 0.9, z0 + 0.9]]) { lamps.push({ p: V(lx, 2.2, lz), k: 1.0 }); bx(dark, lx - 0.05, 1.6, lz - 0.05, lx + 0.05, 2.1, lz + 0.05); }
    for (let i = 0; i < 14; i++) add(trees[i % 4], x0 - 10 + r() * (W + 20), 0, z1 + 8 + r() * 20, 4 + r() * 2, r() * 6);   // the view out of the windows
  };
  room(ROOMS.treaty, "#3a4f7a", "#34476e"); room(ROOMS.study, "#6a4a3a", "#5e4234");
  { const c = RC(ROOMS.treaty);   // the treaty table, the treaty, two flags (French and Russian)
    bx(dark, c.x - 1.6, 0, c.z - 1.6, c.x + 1.6, 0.78, c.z - 0.6, 1); bx(lam("npCloth", () => ({ color: "#2e5a3a" })), c.x - 1.7, 0.78, c.z - 1.7, c.x + 1.7, 0.84, c.z - 0.5, 1);
    bx(lam("npPage", () => ({ color: "#f4ecd8" })), c.x - 0.3, 0.84, c.z - 1.2, c.x + 0.3, 0.85, c.z - 0.8, 1);
    const fr = ctex("npFlagFR", 192, 128, (g) => { ["#2a4f9a", "#f4f1ea", "#c8313b"].forEach((col, i) => { g.fillStyle = col; g.fillRect(i * 64, 0, 64, 128); }); });
    const ru = ctex("npFlagRU", 192, 128, (g) => { ["#f4f1ea", "#2a4f9a", "#c8313b"].forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 43, 192, 43); }); });
    [fr, ru].forEach((tx, i) => { const x = c.x + (i ? 2.6 : -2.6), z = ROOMS.treaty.z0 + 0.8; bx(dark, x - 0.04, 0, z - 0.04, x + 0.04, 2.6, z + 0.04, 1);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), twoTone(new THREE.MeshLambertMaterial({ map: tx, side: THREE.DoubleSide }))); fl.position.set(x + 0.62, 2.2, z); R.add(fl); });
    lamps.push({ p: V(c.x, 1.3, c.z - 0.7), k: 1.0 }); }
  { const R0 = ROOMS.study, c = RC(R0);   // Thiébault's desk; Berthier's portrait on the back wall
    bx(dark, c.x - 0.9, 0, c.z - 1.35, c.x + 0.9, 0.78, c.z - 0.45, 1); bx(wood, c.x - 0.95, 0.78, c.z - 1.4, c.x + 0.95, 0.84, c.z - 0.4, 1);
    bx(lam("npPage", () => ({ color: "#f4ecd8" })), c.x - 0.25, 0.84, c.z - 0.95, c.x + 0.2, 0.85, c.z - 0.62, 1);
    const pt = ctex("npBerthierPortrait", 360, 440, (g) => {
      g.fillStyle = "#c9a04a"; g.fillRect(0, 0, 360, 440); g.fillStyle = "#3a3048"; g.fillRect(24, 24, 312, 392);
      g.fillStyle = "#2a3f8a"; g.beginPath(); g.ellipse(180, 420, 120, 150, 0, 0, Math.PI * 2); g.fill();
      const p = new Pen(g); faceFront(p, 180, 200, 230, "smug", 0, 0, 0, false, "#f5c9a0", "#4a3020", false);
      g.fillStyle = "#18161c"; g.beginPath(); g.ellipse(180, 104, 130, 34, 0, Math.PI, 0); g.fill();
    });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.35), twoTone(new THREE.MeshLambertMaterial({ map: pt }))); pm.position.set(c.x + 0.2, 2.0, R0.z0 + 0.31); R.add(pm);
    bx(dark, R0.x1 - 0.8, 0, R0.z0 + 0.6, R0.x1 - 0.35, 2.3, R0.z0 + 2.8, 1);
    lamps.push({ p: V(c.x + 0.6, 1.05, c.z - 1.1), k: 1.2 }); }

  // ---- the farm: farmhouse, a red barn, fences, hay, a cart, crates of rabbits stacked by the barn ----
  add("building-sample-house-c", FARM.x - 9, 0.02, FARM.z - 10, 3.4, 0.3);
  { const x0 = FARM.x + 4, z0 = FARM.z - 16; const red = lam("npBarn", () => ({ color: "#a8402e" })); bx(red, x0, 0, z0, x0 + 9, 5, z0 + 7); gableRoof(b, slate, red, x0, x0 + 9, z0, z0 + 7, 5, 3, 0.4); bx(white, x0 + 3, 0, z0 + 7, x0 + 6, 3.6, z0 + 7.05, 1); }
  for (let i = 0; i < 12; i++) add("fence_simple", FARM.x - 14 + i * 2.4, 0, FARM.z + 6, 2.4, 0);
  for (const [n, x, z, s, ro] of [["hay-bale", -5, -4, 1.4, 0.3], ["hay-bale", -6.5, -3, 1.4, 1.2], ["cart", 7, 2, 2.4, -0.4], ["barrel", 3.5, -6, 0.6, 0]] as [string, number, number, number, number][]) add(n, FARM.x + x, 0.02, FARM.z + z, s, ro);
  for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, d = 26 + r() * 40; add(trees[i % 4], FARM.x + Math.cos(a) * d, 0, FARM.z + Math.sin(a) * d, 4 + r() * 2, r() * 6); }
  b.build(R);
  // stacked crates of rabbits by the barn (each a crate with two rabbits peeking out)
  { const bm = twoTone(new THREE.MeshLambertMaterial({ vertexColors: true })), cm = M("#b78a5a");
    for (let i = 0; i < 6; i++) { const x = FARM.x + 3.2 + (i % 3) * 0.75, y = Math.floor(i / 3) * 0.5, z = FARM.z - 6.5;
      for (const [w, h, d, ox, oy, oz] of [[0.7, 0.05, 0.45, 0, 0, 0], [0.7, 0.05, 0.03, 0, 0.2, 0.22], [0.7, 0.05, 0.03, 0, 0.2, -0.22], [0.03, 0.4, 0.45, 0.34, 0.2, 0], [0.03, 0.4, 0.45, -0.34, 0.2, 0]]) { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cm); me.position.set(x + ox, y + oy, z + oz); me.castShadow = me.receiveShadow = true; R.add(me); }
      for (const ox of [-0.15, 0.15]) { const bb = new THREE.Mesh(bunnyGeo(false), bm); bb.scale.setScalar(0.75); bb.position.set(x + ox, y + 0.03, z); bb.castShadow = true; R.add(bb); } } }
  void NAP; void BERTH3;
  return { lamps, doors, carriage };
}
export const SET_KIT = ["plant_bushLarge", "tree_oak", "tree_default", "tree_detailed", "tree_fat", "tent_detailedOpen", "tent_detailedClosed", "cart", "barrel", "crate", "building-sample-house-c", "fence_simple", "hay-bale"];
