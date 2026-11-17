// The sets of "The Pope Who Put a Corpse on Trial": the basilica (a tall nave with columns, clerestory windows and
// slanting light shafts, Stephen's high seat with steps, Formosus' throne on its dais, the bishops' bench, candle stands
// set to the SIDES of the seats, never between the camera's usual side and a face), the piazza outside its doors, the
// night graveyard with the open grave, the Tiber bank. Kenney props mid/background only.
import * as THREE from "three";
import { Batch, lam, V, Kit, boxGeo } from "../bridge/build";
import { rep, stoneHD, cobbleHD, grassHD, planksHD, roofHD, ctex } from "../bridge/paint";
import { ground, gableRoof, Lamp } from "../rats/hanoi";
import { twoTone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { bicorne } from "../bridge/char3d";
import { NAVE, SEAT, THRONE, BENCH_Z, PIAZZA, GRAVE, RIVER, BANK } from "./layout";

export type Sets = { lamps: Lamp[]; lid: THREE.Object3D; bundle: THREE.Object3D; shafts: THREE.Mesh[] };
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const M = (c: string) => twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(c) }));
const marbleTex = () => ctex("cdMarble", 512, 512, (g) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? "#cfc4b0" : "#8a3a3a"; g.fillRect(x * 256, y * 256, 256, 256); } g.strokeStyle = "rgba(60,40,40,0.4)"; g.lineWidth = 6; g.strokeRect(0, 0, 512, 512); });
const waterTex = () => ctex("cdWater", 512, 512, (g, r) => { g.fillStyle = "#5a7a7a"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(220,240,240,0.3)"; g.lineWidth = 3; for (let i = 0; i < 80; i++) { const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 5, x + 28, y); g.stroke(); } });

export function buildSets(R: THREE.Group, kit: Kit): Sets {
  const b = new Batch(), r = rng(897), lamps: Lamp[] = [];
  const bx = (mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 2.5) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile), mat);
  const add = (name: string, x: number, y: number, z: number, s: number, rot = 0) => {
    const o = kit[name]; if (!o) return;
    b.addObject(o, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), V(s, s, s)));
  };
  const stone = lam("cdStone", () => ({ map: rep(stoneHD("cdStone", ["#d8ccb4", "#cfc2a8", "#e0d5be", "#c6b89e"], "#a89a80"), 1, 1) }));
  const stoneD = lam("cdStoneD", () => ({ map: rep(stoneHD("cdStoneD", ["#a89a84", "#9e907a", "#b0a28c", "#968872"], "#7a6e5c"), 1, 1) }));
  const marble = lam("cdMarbleM", () => ({ map: rep(marbleTex(), 1, 1) }));
  const wood = lam("cdWood", () => ({ map: rep(planksHD(), 1, 1), color: "#8a6a4a" }));
  const dark = lam("cdDark", () => ({ color: "#3a2a20" }));
  const gold = lam("cdGold", () => ({ color: "#d9a43a" }));
  const red = lam("cdRed", () => ({ color: "#8a1f2a" }));
  const cobble = lam("cdCobble", () => ({ map: cobbleHD(), color: "#a89c8c" }));
  const roofT = lam("cdRoof", () => ({ map: rep(roofHD("#a8583a"), 3, 3) }));
  const candleStand = (x: number, z: number, h = 1.7) => {   // an iron stand with a fat candle; its flame is a lamp
    b.add(new THREE.CylinderGeometry(0.03, 0.05, h, 8).translate(x, h / 2, z), dark);
    b.add(new THREE.CylinderGeometry(0.16, 0.12, 0.06, 12).translate(x, h, z), gold);
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 10).translate(x, h + 0.18, z), lam("cdWax", () => ({ color: "#f4ecd8" })));
    lamps.push({ p: V(x, h + 0.4, z), k: 0.9 });
  };

  // ---- the basilica: floor, walls with clerestory windows, columns, an apse wall with an altar and a painted cross ----
  { const { x0, x1, z0, z1, h } = NAVE;
    ground(b, marble, x0, x1, z0, z1, 0, 2.4);
    const winY0 = 9, winY1 = 12.5;
    for (const [xa, xb] of [[x0 - 0.8, x0], [x1, x1 + 0.8]]) {
      bx(stone, xa, 0, z0, xb, winY0, z1); bx(stone, xa, winY1, z0, xb, h, z1);
      for (let z = z0; z < z1; z += 6) { bx(stone, xa, winY0, z, xb, winY1, z + 3.6); }   // piers between the windows
    }
    bx(stone, x0 - 0.8, 0, z0 - 0.8, x1 + 0.8, h, z0);                       // the apse wall
    for (const [a, c] of [[x0 - 0.8, -2.4], [2.4, x1 + 0.8]]) bx(stone, a, 0, z1, c, h, z1 + 0.8);   // the front wall, a door gap
    bx(stone, -2.4, 5.2, z1, 2.4, h, z1 + 0.8);
    bx(lam("cdCeil", () => ({ color: "#6a4a3a" })), x0 - 0.8, h, z0 - 0.8, x1 + 0.8, h + 0.4, z1 + 0.8);
    gableRoof(b, roofT, stone, x0 - 0.8, x1 + 0.8, z0 - 0.8, z1 + 0.8, h + 0.4, 5, 0.6);
    for (let z = z0 + 3; z < z1 - 1; z += 6) for (const x of [-10.5, 10.5]) { b.add(new THREE.CylinderGeometry(0.55, 0.62, h - 0.6, 18).translate(x, (h - 0.6) / 2, z), stoneD); bx(stoneD, x - 0.8, h - 0.8, z - 0.8, x + 0.8, h - 0.4, z + 0.8, 1); }
    bx(stoneD, -2, 0, z0 + 0.8, 2, 1.0, z0 + 2.2, 1); bx(lam("cdAltarCloth", () => ({ color: "#f4f0e6" })), -2.1, 1.0, z0 + 0.7, 2.1, 1.06, z0 + 2.3, 1);
    bx(gold, -0.15, 4, z0 + 0.02, 0.15, 8, z0 + 0.1, 1); bx(gold, -1.2, 6.4, z0 + 0.02, 1.2, 6.7, z0 + 0.1, 1);
    for (const x of [-1.6, 1.6]) candleStand(x, z0 + 1.5, 1.2);
    // a long red carpet up the nave
    ground(b, red, -1.4, 1.4, z0 + 3, z1, 0.02, 3);
    // wall sconces high on the side walls (behind everyone, never between a seat and the nave)
    for (let z = z0 + 6; z < z1; z += 12) for (const x of [x0 + 0.2, x1 - 0.2]) { lamps.push({ p: V(x, 5.5, z), k: 0.8 }); bx(dark, x - 0.1, 5.0, z - 0.1, x + 0.1, 5.3, z + 0.1, 1); }
    // the doors stand open: two leaves swung inward at the sides
    for (const s of [-1, 1]) bx(wood, s * 2.4 - (s > 0 ? 0.12 : 0), 0, z1 - 2.2, s * 2.4 + (s < 0 ? 0.12 : 0), 5.0, z1, 1); }
  // ---- Stephen's high seat: a stone dais with steps on its east side, a tall red-and-gold chair ----
  { const { x, z, h } = SEAT;
    bx(stoneD, x - 2.2, 0, z - 2, x + 1.6, h, z + 2, 1);
    for (let i = 0; i < 4; i++) bx(stoneD, x + 1.6 + i * 0.4, 0, z - 1.0, x + 2.0 + i * 0.4, h - (i + 1) * 0.33, z + 1.0, 1);
    bx(red, x - 1.0, h, z - 0.6, x - 0.5, h + 2.6, z + 0.6, 1); bx(gold, x - 1.05, h + 2.5, z - 0.7, x - 0.45, h + 2.7, z + 0.7, 1);
    bx(red, x - 0.95, h + 0.45, z - 0.6, x - 0.2, h + 0.55, z + 0.6, 1);
    candleStand(x - 1.4, z - 3.4); candleStand(x - 1.4, z + 3.4); }
  // ---- Formosus' throne: a low dais, a gilded chair with a tall back on the east, facing west ----
  { const { x, z, h } = THRONE;
    bx(marble, x - 1.4, 0, z - 1.6, x + 1.6, h, z + 1.6, 1);
    bx(gold, x + 0.4, h, z - 0.55, x + 0.6, h + 2.2, z + 0.55, 1);
    bx(red, x + 0.36, h + 0.5, z - 0.5, x + 0.4, h + 1.9, z + 0.5, 1);
    bx(gold, x - 0.3, h, z - 0.55, x + 0.4, h + 0.45, z + 0.55, 1); bx(red, x - 0.3, h + 0.45, z - 0.5, x + 0.4, h + 0.5, z + 0.5, 1);
    for (const s of [-1, 1]) bx(gold, x - 0.3, h + 0.45, z + s * 0.55 - 0.05, x + 0.4, h + 0.85, z + s * 0.55 + 0.05, 1);
    candleStand(x + 1.3, z - 3.2); candleStand(x + 1.3, z + 3.2); }
  // ---- the bishops' bench ----
  bx(wood, -3.2, 0, BENCH_Z - 0.3, 3.2, 0.45, BENCH_Z + 0.3, 1); bx(wood, -3.2, 0.45, BENCH_Z - 0.35, 3.2, 1.3, BENCH_Z - 0.25, 1);
  // ---- light shafts from the clerestory windows (soft, additive, no ink, the guard ignores them) ----
  const shafts: THREE.Mesh[] = [];
  { const sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.62, 0.75), transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    for (let z = NAVE.z0 + 4.5; z < NAVE.z1 - 2; z += 12) for (const s of [-1, 1]) {
      const g = new THREE.PlaneGeometry(3.2, 15), m = new THREE.Mesh(g, sm); m.position.set(s * 8.5, 6.5, z); m.rotation.set(0, Math.PI / 2, s * 0.55); m.layers.set(NOINK); m.renderOrder = 5; R.add(m); shafts.push(m);
    } }

  // ---- the piazza outside: cobbles, houses round it, the basilica front ----
  ground(b, cobble, -60, 60, NAVE.z1 + 0.8, 70, 0, 6);
  ground(b, lam("cdGrass", () => ({ map: grassHD(), color: "#8a9a6a" })), -400, 400, -400, 400, -0.02, 10);
  const houses = ["building-sample-house-a", "building-sample-house-b", "building-sample-house-c"];
  for (let x = -50; x <= 50; x += 7.5) { if (Math.abs(x) < 9) continue; add(houses[Math.floor(r() * 3)], x, 0, 46, 3.2, Math.PI); }
  for (const s of [-1, 1]) for (let z = 20; z < 44; z += 7.5) add(houses[Math.floor(r() * 3)], s * 24, 0, z, 3.2, s > 0 ? -Math.PI / 2 : Math.PI / 2);
  for (const [n, x, z, s, ro] of [["cart", -12, 30, 2.2, 0.6], ["barrel", 11, 28, 0.6, 0], ["stall-red", 15, 36, 2.0, -0.4], ["barrel", -9, 38, 0.6, 0]] as [string, number, number, number, number][]) add(n, x, 0.02, z, s, ro);
  // ---- the graveyard at night: an iron fence, gravestones, crypts, pines, the open grave with its mound ----
  { const g0 = GRAVE;
    ground(b, lam("cdGraveGrass", () => ({ map: grassHD(), color: "#5a6a4a" })), g0.x - 40, g0.x + 40, g0.z - 40, g0.z + 40, 0.01, 8);
    const stones = ["gravestone-cross", "gravestone-round", "gravestone-bevel", "gravestone-decorative", "gravestone-roof"];
    for (let i = 0; i < 40; i++) { const x = g0.x - 16 + (i % 8) * 4 + (r() - 0.5), z = g0.z - 14 + Math.floor(i / 8) * 5; if (Math.abs(x - g0.x) < 4 && Math.abs(z - g0.z) < 4) continue; add(stones[i % 5], x, 0, z, 1.6, (r() - 0.5) * 0.4); }
    for (const [x, z] of [[-14, -18], [14, -16]]) add("crypt-small", g0.x + x, 0, g0.z + z, 3.5, 0.2);
    for (let x = -20; x <= 20; x += 1.8) add("iron-fence", g0.x + x, 0, g0.z + 9, 1.8, 0);
    for (let i = 0; i < 30; i++) { const a = r() * Math.PI * 2, d = 24 + r() * 14; add("tree_pineTallA_detailed", g0.x + Math.cos(a) * d, 0, g0.z + Math.sin(a) * d, 4 + r() * 2, r()); }
    bx(lam("cdHole", () => ({ color: "#1e1814" })), g0.x - 0.75, 0.0, g0.z - 1.2, g0.x + 0.75, 0.03, g0.z + 1.2, 1);
    b.add(new THREE.SphereGeometry(1.0, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1.4).translate(g0.x - 2.2, 0, g0.z), lam("cdDirt", () => ({ color: "#5a4030" })));
    add("coffin-old", g0.x, 0.03, g0.z, 2.2); }
  // ---- the Tiber: the stone bank, the river, the far bank with houses ----
  { bx(stoneD, RIVER.bankX - 30, -3, -40, RIVER.bankX, -0.01, 40, 2.5);
    ground(b, cobble, RIVER.bankX - 30, RIVER.bankX, -40, 40, 0.0, 6);
    // the far bank sits 14 m across (run 42 / first fix: 60 m away it faded into an empty grey sky behind the monks)
    b.add(new THREE.PlaneGeometry(14, 80).rotateX(-Math.PI / 2).translate(RIVER.bankX + 7, RIVER.y, 0), lam("cdRiver", () => ({ map: rep(waterTex(), 3, 14), color: "#9ab4b0" })));
    bx(stoneD, RIVER.bankX + 14, -3, -40, RIVER.bankX + 44, 0.5, 40, 2.5);
    for (let z = -36; z < 40; z += 5.5) add(houses[Math.floor(r() * 3)], RIVER.bankX + 18.5, 0.5, z, 3.2, -Math.PI / 2);
    for (let z = -33; z < 40; z += 6.5) add(houses[Math.floor(r() * 3)], RIVER.bankX + 25, 0.5, z, 3.8, -Math.PI / 2);
    for (let z = -30; z < 40; z += 9) add("tree_pineTallA_detailed", RIVER.bankX + 15.5, 0.5, z + 2, 2.4, 0);
    // (no railing on the bank edge: in run 42 it stood between the camera and the monks)
    for (const [n, x, z, s, ro] of [["barrel", BANK.x - 3, -4, 0.6, 0], ["cart", BANK.x - 6, 5, 2.2, 1.2], ["crate", BANK.x - 4, 3.2, 1.0, 0.4]] as [string, number, number, number, number][]) add(n, x, 0.02, z, s, ro); }
  b.build(R);

  // ---- moving props: the coffin lid (line 4), the wrapped body (line 11) ----
  const lid = new THREE.Group(); { const m = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.06, 1.9), M("#6a4a32")); m.position.set(0.64, 0, 0); m.castShadow = true; lid.add(m); lid.position.set(GRAVE.x - 0.64, 0.47, GRAVE.z); R.add(lid); }
  const bundle = new THREE.Group(); { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.2, 6, 14).rotateZ(Math.PI / 2), M("#e8e0cc")); m.castShadow = true; bundle.add(m);
    for (const x of [-0.45, 0, 0.45]) { const rope = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 6, 16).rotateY(Math.PI / 2), M("#8a6a4a")); rope.position.x = x; bundle.add(rope); } R.add(bundle); }
  void bicorne; void PIAZZA;
  return { lamps, lid, bundle, shafts };
}
export const SET_KIT = ["building-sample-house-a", "building-sample-house-b", "building-sample-house-c", "cart", "barrel", "stall-red", "crate", "gravestone-cross", "gravestone-round", "gravestone-bevel", "gravestone-decorative", "gravestone-roof",
  "crypt-small", "iron-fence", "tree_pineTallA_detailed", "coffin-old"];
