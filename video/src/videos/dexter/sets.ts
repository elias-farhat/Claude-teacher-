// The sets of "The Luckiest Fool in History": one sea with four shores (layout.ts). Newburyport's harbour street,
// dock and square with four interiors behind the street (study, counting house, mansion, parlour: each with windows
// onto the town, warm lamps, dressed); the West Indies (sand, palms, molasses vats, cane, Dexter's ship at the dock);
// the snowy Siberia-bound port; sooty Newcastle (coal heaps, chimneys, colliers). Kenney props mid/background only.
import * as THREE from "three";
import { Batch, lam, V, Kit, boxGeo } from "../bridge/build";
import { rep, stoneHD, cobbleHD, grassHD, planksHD, roofHD, ctex } from "../bridge/paint";
import { ground, gableRoof, Lamp } from "../rats/hanoi";
import { WATER_Y, Land, NB, TROPIC, SNOW, NEWC, Dock, DOCK_NB, DOCK_TR, DOCK_SN, DOCK_NC, STREET_Z, SQUARE, VATS, STRIKE, SHIP_DECK, SHIP_TR, ROOMS, Room } from "./layout";

export type Sets = { lamps: Lamp[]; coalShip: THREE.Group; coins: THREE.Group[]; chimneys: THREE.Vector3[] };
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const sandTex = () => ctex("dxSand", 512, 512, (g, r) => { g.fillStyle = "#ead39a"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 3000; i++) { g.fillStyle = ["#e0c78a", "#f2dfae", "#d8bd80"][i % 3]; g.fillRect(r() * 512, r() * 512, 3, 3); } });
const snowTex = () => ctex("dxSnow", 512, 512, (g, r) => { g.fillStyle = "#eef3fa"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 1600; i++) { g.fillStyle = ["#dde6f2", "#ffffff", "#d3deec"][i % 3]; g.fillRect(r() * 512, r() * 512, 4, 4); } });
const waterTex = () => ctex("dxWater", 512, 512, (g, r) => { g.fillStyle = "#3d7aa0"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(220,240,255,0.35)"; g.lineWidth = 3;
  for (let i = 0; i < 90; i++) { const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 6, x + 28, y); g.stroke(); } });
const wallTex = (key: string, base: string, stripe: string) => ctex(key, 256, 256, (g) => { g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.fillStyle = stripe; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 10, 256); });

/** Dexter's ship: hull with a pointed bow (toward -z), deck at SHIP_DECK above the water, rails, mast, sail; its
 *  origin is at water level under the middle of the deck */
export const buildShip = (cargo: "crates" | "coal") => {
  const g = new THREE.Group(), b = new Batch();
  const hull = lam("dxHull", () => ({ color: "#6a4630" })), deck = lam("dxDeck", () => ({ map: rep(planksHD(), 1, 3), color: "#c09a72" })), trim = lam("dxTrim", () => ({ color: "#2a3a5a" }));
  const L = 14, Bm = 4.6, top = SHIP_DECK - WATER_Y, bottom = -1.4;
  const sh = new THREE.Shape(); sh.moveTo(-Bm / 2, L / 2); sh.lineTo(Bm / 2, L / 2); sh.lineTo(Bm / 2, -L / 2 + 3); sh.quadraticCurveTo(Bm / 2, -L / 2 + 0.6, 0, -L / 2 - 0.8); sh.quadraticCurveTo(-Bm / 2, -L / 2 + 0.6, -Bm / 2, -L / 2 + 3); sh.closePath();
  const hg = new THREE.ExtrudeGeometry(sh, { depth: top - bottom, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, top, 0);
  b.add(hg, hull);
  b.add(new THREE.ShapeGeometry(sh).rotateX(Math.PI / 2).translate(0, top + 0.01, 0), deck);
  b.add(new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, top - 0.25, 0).scale(1.02, 1, 1.01), trim);
  for (const s of [-1, 1]) b.add(boxGeo(V(s * Bm / 2 - 0.08, top, -L / 2 + 2.5), V(s * Bm / 2 + 0.08, top + 0.7, L / 2), 0), hull);   // rails
  b.add(boxGeo(V(-Bm / 2, top, L / 2 - 0.16), V(Bm / 2, top + 0.7, L / 2), 0), hull);
  b.add(new THREE.CylinderGeometry(0.16, 0.2, 11, 10).translate(0, top + 5.5, -0.5), hull);
  b.add(boxGeo(V(-2.6, top + 9.2, -0.62), V(2.6, top + 9.4, -0.42), 0), hull);   // yard
  b.add(boxGeo(V(-2.2, top + 2.6, -0.62), V(2.2, top + 2.8, -0.42), 0), hull);
  b.add(new THREE.CylinderGeometry(0.08, 0.1, 5, 8).rotateX(-1.1).translate(0, top + 1.6, -L / 2 - 1.2), hull);   // bowsprit
  const sail = new THREE.PlaneGeometry(4.8, 6.4, 6, 6); { const p = sail.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, -0.6 * Math.cos((p.getX(i) / 4.8) * Math.PI)); }
  b.add(sail.translate(0, top + 6.0, -0.6), lam("dxSail", () => ({ color: "#f2ead8", side: THREE.DoubleSide })));
  if (cargo === "crates") for (const [x, z] of [[-1.2, 3.6], [1.0, 4.2], [-1.0, 5.4], [1.2, 5.6]]) b.add(boxGeo(V(x - 0.5, top, z - 0.45), V(x + 0.5, top + 0.75, z + 0.45), 0), lam("dxCrate", () => ({ map: rep(planksHD(), 0.5, 0.5), color: "#b78a5a" })));
  else for (const [x, z, r] of [[0, 3.8, 1.6], [-0.6, 5.4, 1.2], [0.8, 5.6, 1.1]]) b.add(new THREE.ConeGeometry(r, r * 0.9, 12).translate(x, top + r * 0.45, z), lam("dxCoal", () => ({ color: "#26262c" })));
  b.build(g);
  g.position.y = WATER_Y;
  return g;
};

export function buildSets(R: THREE.Group, kit: Kit): Sets {
  const b = new Batch(), r = rng(1747), lamps: Lamp[] = [], chimneys: THREE.Vector3[] = [];
  const bx = (mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 2.5) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile), mat);
  const add = (name: string, x: number, y: number, z: number, s: number, rot = 0) => {
    const o = kit[name]; if (!o) return;
    b.addObject(o, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), V(s, s, s)));
  };
  const quay = lam("dxQuay", () => ({ map: rep(stoneHD("dxQuay", ["#a9a299", "#9d968c", "#b3ada3", "#938c83"], "#77716a"), 1, 1) }));
  const cobble = lam("dxCobble", () => ({ map: cobbleHD(), color: "#b0a596" }));
  const sootC = lam("dxSoot", () => ({ map: cobbleHD(), color: "#6c6862" }));
  const sand = lam("dxSandM", () => ({ map: rep(sandTex(), 1, 1) }));
  const snow = lam("dxSnowM", () => ({ map: rep(snowTex(), 1, 1) }));
  const grass = lam("dxGrass", () => ({ map: grassHD(), color: "#9aa676" }));
  const wood = lam("dxWood", () => ({ map: rep(planksHD(), 1, 1), color: "#b0906a" }));
  const dark = lam("dxDarkWood", () => ({ color: "#4a3426" }));
  const roofR = lam("dxRoofR", () => ({ map: rep(roofHD("#7a5a4a", true), 2, 2) }));

  // ---- the sea and the four shores ----
  b.add(new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2).translate(0, WATER_Y, 0), lam("dxSea", () => ({ map: rep(waterTex(), 160, 160), color: "#9fc4dc" })));
  const shore = (L: Land, top: THREE.Material) => { bx(quay, L.x0, -3, L.z0, L.x1, -0.02, L.z1); ground(b, top, L.x0, L.x1, L.z0, L.z1, 0, 6); };
  shore(NB, cobble); shore(TROPIC, sand); shore(SNOW, snow); shore(NEWC, sootC);
  ground(b, grass, NB.x0, NB.x1, NB.z0, -50, 0.02, 8);   // the hill behind Newburyport
  const dock = (D: Dock) => {
    bx(wood, D.x - D.w / 2, -0.3, D.z0, D.x + D.w / 2, 0.02, D.z1, 3);
    for (let z = D.z0 + 1; z <= D.z1; z += 3) for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 8).translate(D.x + s * (D.w / 2 - 0.2), -1.5, z), dark);
    for (let z = D.z0 + 3; z <= D.z1 - 1; z += 6) for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8).translate(D.x + s * (D.w / 2 - 0.3), 0.35, z), dark);   // bollards
  };
  for (const D of [DOCK_NB, DOCK_TR, DOCK_SN, DOCK_NC]) dock(D);
  bx(snow, DOCK_SN.x - DOCK_SN.w / 2 + 0.1, 0.02, DOCK_SN.z0, DOCK_SN.x + DOCK_SN.w / 2 - 0.1, 0.06, DOCK_SN.z1 - 0.4, 3);   // snow lies on the pier

  // ---- Newburyport: two rows of houses along the harbour street, the square kept clear, lamp posts ----
  const houses = ["building-sample-house-a", "building-sample-house-b", "building-sample-house-c"];
  const row = (L: Land, zRow: number, skip: (x: number) => boolean, rr: () => number, s0 = 3.1) => {
    for (let x = L.x0 + 4; x < L.x1 - 4; x += 6.8 + rr() * 1.2) { if (skip(x)) continue; add(houses[Math.floor(rr() * 3)], x, 0.02, zRow + (rr() - 0.5), s0 + rr() * 0.4, (rr() - 0.5) * 0.08); }
  };
  row(NB, STREET_Z - 9, (x) => Math.abs(x - SQUARE.x) < 11 || Math.abs(x) < 5, r);
  row(NB, STREET_Z - 21, (x) => Math.abs(x - SQUARE.x) < 6, r);
  for (let x = NB.x0 + 6; x < NB.x1; x += 14) { const lp = V(x, 3.0, STREET_Z + 3.2); lamps.push({ p: lp, k: 0.8 }); b.add(new THREE.CylinderGeometry(0.07, 0.09, 3.0, 8).translate(x, 1.5, lp.z), dark); }
  for (const [n, x, z, s, ro] of [["ship-large", -14, 22, 1.5, 0], ["ship-medium", 16, 24, 1.5, 0.05], ["ship-small", 34, 30, 1.4, -0.3], ["boat-row-large", -6, 12, 1.6, 0.4],
    ["barrel", 2.9, 24.5, 0.6, 0], ["crate", -2.8, 25, 1.1, 0.3], ["crate", -2.6, 26.4, 0.9, 1.0], ["cart", 9, 4, 2.2, 0.4], ["stall-red", -40, 2, 2.0, Math.PI], ["barrel", -21, 1, 0.6, 0], ["cart", -18, -4, 2.2, -0.6], ["crate", 22, 3, 1.0, 0.2]] as [string, number, number, number, number][])
    add(n, x, n.startsWith("ship") || n.startsWith("boat") ? WATER_Y - 0.4 : 0.02, z, s, ro);
  // the square: a crate to stand on, a well-head pump, benches
  bx(wood, SQUARE.x - 0.6, 0, SQUARE.z - 0.5, SQUARE.x + 0.6, 0.75, SQUARE.z + 0.5, 1);
  for (const [x, z, ro] of [[-5.5, 3.5, 0.5], [5.5, 3.2, -0.5]]) add("bench", SQUARE.x + x, 0.02, SQUARE.z + z, 2.0, ro);
  // the town hill behind: trees and a white church spire
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat"];
  for (let i = 0; i < 70; i++) { const x = NB.x0 + r() * (NB.x1 - NB.x0), z = -52 - r() * 16; add(trees[i % 4], x, 0, z, 3.6 + r() * 2.2, r() * 6.3); }
  { const cx = 4, cz = -58; bx(lam("dxWhite", () => ({ color: "#f2efe8" })), cx - 3, 0, cz - 5, cx + 3, 7, cz + 5); gableRoof(b, roofR, lam("dxWhite", () => ({ color: "#f2efe8" })), cx - 3, cx + 3, cz - 5, cz + 5, 7, 2.6);
    bx(lam("dxWhite", () => ({ color: "#f2efe8" })), cx - 1.2, 0, cz + 5, cx + 1.2, 14, cz + 7.4); b.add(new THREE.ConeGeometry(1.4, 7, 8).translate(cx, 17.5, cz + 6.2), roofR); }

  // ---- the interiors: floor, wallpaper, two windows + a door in the street wall (+z), ceiling, a gable roof outside ----
  const room = (R0: Room, paper: string, stripe: string) => {
    const t = 0.3, { x0, x1, z0, z1, h } = R0, wp = lam("dxPaper" + R0.name, () => ({ map: rep(wallTex("dxPaperT" + R0.name, paper, stripe), (x1 - x0) / 1.2, 1) })), out = lam("dxClap", () => ({ color: "#d8cdb8" }));
    ground(b, wood, x0, x1, z0, z1, 0.03, 2.5);
    bx(wp, x0, 0, z0, x1, h, z0 + t); bx(wp, x0, 0, z0, x0 + t, h, z1); bx(wp, x1 - t, 0, z0, x1, h, z1);
    // the street wall: two windows (1.6 wide, 1.0-2.5 m) and a door
    const W = x1 - x0, wa = x0 + W * 0.25, wb = x0 + W * 0.72, dz = x0 + W * 0.5;
    const solid = (a: number, c: number) => bx(wp, a, 0, z1 - t, c, h, z1);
    solid(x0, wa - 0.8); solid(wa + 0.8, dz - 0.55); solid(dz + 0.55, wb - 0.8); solid(wb + 0.8, x1);
    for (const c of [wa, wb]) { bx(wp, c - 0.8, 0, z1 - t, c + 0.8, 1.0, z1); bx(wp, c - 0.8, 2.5, z1 - t, c + 0.8, h, z1); bx(dark, c - 0.85, 0.95, z1 - t - 0.06, c + 0.85, 1.02, z1 + 0.02); }
    bx(wp, dz - 0.55, 2.3, z1 - t, dz + 0.55, h, z1);
    bx(lam("dxCeil", () => ({ color: "#efe6d4" })), x0, h, z0, x1, h + 0.2, z1);
    gableRoof(b, roofR, out, x0, x1, z0, z1, h + 0.2, 2.2, 0.4);
    for (const [lx, lz] of [[x0 + 1.0, z0 + 1.0], [x1 - 1.0, z0 + 1.0]]) { lamps.push({ p: V(lx, 2.1, lz), k: 1.0 }); bx(dark, lx - 0.05, 1.5, lz - 0.05, lx + 0.05, 2.0, lz + 0.05); }
  };
  room(ROOMS.study, "#4f6a5a", "#466052"); room(ROOMS.count, "#7a5a3a", "#6e5034"); room(ROOMS.mansion, "#8a2e3a", "#7a2833"); room(ROOMS.parlour, "#3a3a52", "#333349");
  // study: desk, chair, shelf; counting house: long table, ledgers, chests, barrels; mansion: rug, portrait frames;
  // parlour: the coffin on its trestle, benches, a red curtain at the side (Dexter hides behind it)
  { const R0 = ROOMS.study, cx = (R0.x0 + R0.x1) / 2, cz = (R0.z0 + R0.z1) / 2;
    bx(dark, cx - 0.9, 0, cz - 0.45, cx + 0.9, 0.78, cz + 0.45, 1); bx(wood, cx - 0.95, 0.78, cz - 0.5, cx + 0.95, 0.84, cz + 0.5, 1);
    bx(lam("dxPage", () => ({ color: "#f4ecd8" })), cx - 0.3, 0.84, cz - 0.05, cx + 0.15, 0.85, cz + 0.28, 1);
    bx(dark, R0.x0 + 0.4, 0, R0.z0 + 0.4, R0.x0 + 2.6, 2.4, R0.z0 + 0.9, 1);
    for (let i = 0; i < 12; i++) bx(lam("dxBook" + (i % 3), () => ({ color: ["#8a2e2e", "#2e4a8a", "#3a6a3a"][i % 3] })), R0.x0 + 0.5 + i * 0.17, 1.2 + Math.floor(i / 6) * 0.6 - (i >= 6 ? 0 : 0), R0.z0 + 0.5, R0.x0 + 0.64 + i * 0.17, 1.6 + Math.floor(i / 6) * 0.6, R0.z0 + 0.85, 1);
    lamps.push({ p: V(cx + 0.7, 1.05, cz - 0.2), k: 1.1 }); }
  { const R0 = ROOMS.count, cx = (R0.x0 + R0.x1) / 2, cz = (R0.z0 + R0.z1) / 2 - 2.5;
    bx(dark, cx - 2.2, 0, cz - 0.6, cx + 2.2, 0.8, cz + 0.6, 1); bx(wood, cx - 2.3, 0.8, cz - 0.65, cx + 2.3, 0.86, cz + 0.65, 1);
    for (const [x, ro] of [[-1.3, 0.2], [0.4, -0.3], [1.5, 0.1]]) bx(lam("dxLedger", () => ({ color: "#6a2a2a" })), cx + x - 0.2, 0.86, cz - 0.15 + ro * 0.2, cx + x + 0.2, 0.92, cz + 0.15 + ro * 0.2, 1);
    for (const [n, x, z, s] of [["chest", R0.x0 + 1.0, R0.z0 + 1.0, 0.7], ["barrel", R0.x1 - 1.0, R0.z0 + 1.0, 0.55], ["barrel", R0.x1 - 1.8, R0.z0 + 0.9, 0.5], ["crate", R0.x0 + 2.2, R0.z0 + 0.9, 0.7]] as [string, number, number, number][]) add(n, x, 0.03, z, s);
    lamps.push({ p: V(cx, 2.6, cz), k: 1.0 }); }
  { const R0 = ROOMS.mansion, cx = (R0.x0 + R0.x1) / 2, cz = (R0.z0 + R0.z1) / 2;
    ground(b, lam("dxRug", () => ({ color: "#5a2a6a" })), cx - 3, cx + 3, cz - 2.2, cz + 2.2, 0.05, 6);
    for (const x of [-3, 0, 3]) bx(lam("dxGold", () => ({ color: "#d9a43a" })), cx + x - 0.6, 1.4, R0.z0 + 0.3, cx + x + 0.6, 2.4, R0.z0 + 0.36, 1);
    add("chest", cx - 3.6, 0.05, cz - 1.8, 0.8, 0.4); lamps.push({ p: V(cx, 3.1, cz), k: 1.2 }); }
  { const R0 = ROOMS.parlour, cx = (R0.x0 + R0.x1) / 2, cz = (R0.z0 + R0.z1) / 2;
    bx(dark, cx - 1.1, 0, cz - 0.45, cx + 1.1, 0.48, cz + 0.45, 1);
    add("coffin", cx, 0.48, cz, 2.0, Math.PI / 2);
    for (const z of [cz + 0.6, cz + 2.0]) for (const s of [-1, 1]) add("bench", cx + s * 4.0, 0.03, z, 2.0, Math.PI / 2 * s);
    for (const s of [-1, 1]) add("candle-multiple", cx + s * 1.5, 0.03, cz + 0.2, 1.6);
    // the curtain (deep red, folded) across the left back corner: Dexter peeks round its edge
    const cur = lam("dxCurtain", () => ({ color: "#8a1f2a", side: THREE.DoubleSide }));
    const cg = new THREE.PlaneGeometry(2.4, 3.2, 24, 1); { const p = cg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.09 * Math.sin(p.getX(i) * 9)); }
    b.add(cg.translate(R0.x0 + 2.1, 1.6, R0.z0 + 1.9), cur);
    for (const s of [-1, 1]) lamps.push({ p: V(cx + s * 1.5, 0.9, cz - 0.9), k: 0.9 }); }

  // ---- the West Indies: palms, cane, the molasses vats under a shed, crates and barrels on the dock ----
  const palms = ["palm-straight", "palm-bend", "palm-detailed-straight", "palm-detailed-bend"];
  for (let i = 0; i < 46; i++) { const x = TROPIC.x0 + 2 + r() * (TROPIC.x1 - TROPIC.x0 - 4), z = TROPIC.z0 + 2 + r() * (TROPIC.z1 - TROPIC.z0 - 4);
    if (Math.abs(x - DOCK_TR.x) < 7 && z > -8) continue; if (Math.hypot(x - VATS.x, z - VATS.z) < 9) continue; add(palms[i % 4], x, 0, z, 1.8 + r() * 0.8, r() * 6.3); }
  for (let i = 0; i < 60; i++) { const x = 210 + (i % 10) * 2.2, z = -40 + Math.floor(i / 10) * 2.4; add("crops_cornStageD", x, 0, z, 2.6, r()); }
  // three low copper vats in a row (0.55 m: the planters behind them stay visible from the knees up)
  for (let i = 0; i < 3; i++) { const c = V(VATS.x - 0.9 + i * 0.9, 0, VATS.z);
    b.add(new THREE.CylinderGeometry(0.42, 0.38, 0.55, 20, 1, true), lam("dxVat", () => ({ color: "#b8733a", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(c.x, 0.275, c.z));
    b.add(new THREE.TorusGeometry(0.42, 0.04, 6, 24).rotateX(Math.PI / 2), dark, new THREE.Matrix4().makeTranslation(c.x, 0.55, c.z));
    b.add(new THREE.CircleGeometry(0.4, 20).rotateX(-Math.PI / 2), lam("dxMolasses", () => ({ color: "#3a1e0e" })), new THREE.Matrix4().makeTranslation(c.x, 0.45, c.z)); }
  for (const [x, z] of [[-5, -4.4], [5, -4.4], [-5, -1.4], [5, -1.4]]) bx(dark, VATS.x + x - 0.1, 0, VATS.z + z - 0.1, VATS.x + x + 0.1, 3.4, VATS.z + z + 0.1);   // the boiling shed behind them
  gableRoof(b, lam("dxThatch", () => ({ color: "#c9a85a" })), lam("dxThatch", () => ({ color: "#c9a85a" })), VATS.x - 5.2, VATS.x + 5.2, VATS.z - 4.6, VATS.z - 1.2, 3.4, 1.4, 0.4);
  for (const [n, x, z, s, ro] of [["crate", 197.6, 13, 1.0, 0.2], ["crate", 197.8, 14.6, 0.9, 0.7], ["barrel", 202.4, 11, 0.6, 0], ["barrel", 203, 12.4, 0.55, 0], ["crate", 189, -4, 1.0, 0.4], ["barrel", 197, -14, 0.6, 0], ["ship-pirate-medium", 230, 34, 1.5, 0.6], ["boat-row-small", 214, 10, 1.6, 1.2]] as [string, number, number, number, number][])
    add(n, x, n.startsWith("ship") || n.startsWith("boat") ? WATER_Y - 0.4 : 0.02, z, s, ro);
  { const ship = buildShip("crates"); ship.position.set(SHIP_TR.x, WATER_Y, SHIP_TR.z); R.add(ship); }

  // ---- the snowy port: a moored ship, snowy rocks, pines, crates, tents ----
  for (const [n, x, z, s, ro] of [["ship-large", -191.5, 20, 1.5, 0], ["crate", -201.6, 13, 1.0, 0.3], ["crate", -201.8, 14.6, 0.9, 1.0], ["barrel", -198, 11, 0.6, 0], ["tent_detailedClosed", -212, -6, 3.0, 0.4], ["tent_detailedClosed", -186, -10, 3.0, 1.4]] as [string, number, number, number, number][])
    add(n, x, n.startsWith("ship") ? WATER_Y - 0.4 : 0.02, z, s, ro);
  for (let i = 0; i < 40; i++) { const x = SNOW.x0 + 2 + r() * 76, z = SNOW.z0 + 2 + r() * 36; if (Math.abs(x - DOCK_SN.x) < 9 && z > -16) continue; add(i % 3 ? "tree_pineTallB_detailed" : "rock_largeA", x, 0, z, i % 3 ? 3.4 + r() * 2 : 1.6, r() * 6); }
  for (let i = 0; i < 26; i++) { const x = SNOW.x0 + 3 + r() * 74, z = SNOW.z0 + 3 + r() * 30; if (Math.abs(x - DOCK_SN.x) < 9 && z > -16) continue; b.add(new THREE.SphereGeometry(1.4 + r() * 1.8, 12, 8, 0, Math.PI * 2, 0, 1.2).translate(x, -0.6, z), snow); }

  // ---- Newcastle: sooty houses, coal heaps, chimneys, a pit-head wheel, colliers in the harbour ----
  row(NEWC, NEWC.z1 - 22, (x) => Math.abs(x - STRIKE.x) < 7, rng(91), 3.0);
  row(NEWC, NEWC.z1 - 37, () => false, rng(92), 3.0);
  const coalM = lam("dxCoalHeap", () => ({ color: "#2a2a30" })), brick = lam("dxBrickDark", () => ({ color: "#6a3a30" }));
  for (const [x, z, rr] of [[-26, -197, 3.2], [-18, -199, 2.4], [22, -198, 3.4], [30, -201, 2.6], [-40, -205, 4.0], [42, -206, 3.6]]) b.add(new THREE.ConeGeometry(rr, rr * 1.1, 14).translate(x, rr * 0.55, z), coalM);
  for (const [x, z, h] of [[-34, -235, 18], [-12, -240, 22], [16, -238, 20], [38, -232, 16]]) { b.add(new THREE.CylinderGeometry(1.0, 1.3, h, 12).translate(x, h / 2, z), brick); chimneys.push(V(x, h, z)); }
  { const x = 0, z = -250; for (const s of [-1, 1]) bx(dark, x + s * 3 - 0.3, 0, z - 0.3, x + s * 3 + 0.3, 14, z + 0.3); bx(dark, x - 3.3, 13, z - 0.3, x + 3.3, 13.6, z + 0.3);
    b.add(new THREE.TorusGeometry(2.4, 0.18, 8, 28), dark, new THREE.Matrix4().makeTranslation(x, 15.5, z)); }
  for (const [n, x, z, s, ro] of [["ship-medium", -18, -176, 1.5, 0.1], ["ship-small", 28, -168, 1.4, -0.4], ["cart", -8, -194, 2.2, 0.5], ["cart", 9, -196, 2.2, -0.3], ["barrel", 4.5, -192, 0.6, 0]] as [string, number, number, number, number][])
    add(n, x, n.startsWith("ship") ? WATER_Y - 0.4 : 0.02, z, s, ro);
  for (let x = NEWC.x0 + 8; x < NEWC.x1; x += 16) { const lp = V(x, 3.0, NEWC.z1 - 6); lamps.push({ p: lp, k: 0.8 }); b.add(new THREE.CylinderGeometry(0.07, 0.09, 3.0, 8).translate(x, 1.5, lp.z), dark); }
  b.build(R);

  // ---- Dexter's coal ship (moved by world.ts on line 7-8) ----
  const coalShip = buildShip("coal"); R.add(coalShip);
  // ---- the mansion's coin piles (grown by world.ts on line 9) ----
  const coins: THREE.Group[] = [];
  { const R0 = ROOMS.mansion, cx = (R0.x0 + R0.x1) / 2, cz = (R0.z0 + R0.z1) / 2, gold = lam("dxCoin", () => ({ color: "#f0c24a" }));
    for (const [x, z, rr] of [[-1.6, -1.2, 0.9], [1.7, -1.0, 0.8], [-0.2, -2.6, 1.1], [2.6, 0.8, 0.6], [-2.4, 0.6, 0.6]]) {
      const g = new THREE.Group(), m = new THREE.Mesh(new THREE.ConeGeometry(rr, rr * 0.8, 18), gold); m.position.y = rr * 0.4; m.castShadow = m.receiveShadow = true; g.add(m);
      for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14), gold); c.position.set((r() - 0.5) * rr * 1.6, 0.02, (r() - 0.5) * rr * 1.6); g.add(c); }
      g.position.set(cx + x, 0.05, cz + z); R.add(g); coins.push(g); } }
  return { lamps, coalShip, coins, chimneys };
}
export const SET_KIT = ["building-sample-house-a", "building-sample-house-b", "building-sample-house-c", "ship-large", "ship-medium", "ship-small", "ship-pirate-medium", "boat-row-large", "boat-row-small",
  "barrel", "crate", "cart", "stall-red", "bench", "tree_oak", "tree_default", "tree_detailed", "tree_fat", "chest", "coffin", "candle-multiple", "palm-straight", "palm-bend", "palm-detailed-straight", "palm-detailed-bend",
  "crops_cornStageD", "tent_detailedClosed", "tree_pineTallB_detailed", "rock_largeA"];
