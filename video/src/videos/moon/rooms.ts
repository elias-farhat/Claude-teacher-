// Interiors of the Moon Hoax short (layout.ts): The Sun's tiny print shop (north row) and The Herald (south row), each
// with its street window + door. Dressed per CLAUDE.md: windows, lamps, props, rugs, warm practical lights.
// Generic room pieces copied from the Rat Bounty / Eiffel shorts.
import * as THREE from "three";
import { Batch, lam, quad, V } from "../bridge/build";
import { ctex, rep, rng, planksHD, stoneHD } from "../bridge/paint";
import { lampMesh, holedGround, wallX, wallZ, gableRoof, signTex } from "../rats/hanoi";
import type { Lamp } from "../rats/hanoi";
import { ROOMS, ROOM_AT, RoomName, Opening } from "./layout";

export { ROOM_AT };
export type { RoomName };
export type Room = { o: THREE.Vector3; w: number; d: number; h: number; lamps: Lamp[] };

// ---------------- painted textures ----------------
const wallpaper = (key: string, base: string, motif: string) => ctex("wp" + key, 256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.fillStyle = motif;
  for (let y = 0; y < 256; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 256; x += 64) {
    g.beginPath(); g.ellipse(x + 16, y + 20, 7, 11, 0, 0, 7); g.fill(); g.fillRect(x + 15, y + 30, 2, 12);
  }
  for (let x = 0; x < 256; x += 32) { g.fillStyle = "rgba(0,0,0,0.05)"; g.fillRect(x, 0, 3, 256); }
});
const tiles = (key: string, a: string, b: string) => ctex("tiles" + key, 256, 256, (g) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * 32, y * 32, 32, 32); }
  g.fillStyle = "rgba(0,0,0,0.12)"; for (let k = 0; k < 256; k += 32) { g.fillRect(k, 0, 1, 256); g.fillRect(0, k, 256, 1); }
});
const carpet = (key: string, base: string, border: string) => ctex("carpet" + key, 256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(14, 14, 228, 228);
  g.fillStyle = border; g.beginPath(); g.ellipse(128, 128, 54, 34, 0, 0, 7); g.fill();
  g.fillStyle = base; g.beginPath(); g.ellipse(128, 128, 38, 22, 0, 0, 7); g.fill();
});
const fabric = (key: string, col: string) => ctex("fabric" + key, 128, 256, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 128, 256);
  for (let x = 0; x < 128; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, "rgba(0,0,0,0.28)"); gr.addColorStop(0.5, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0.28)"); g.fillStyle = gr; g.fillRect(x, 0, 16, 256); }
});
/** small painted landscape for picture frames */
const painting = (seed: number) => ctex("painting" + seed, 256, 192, (g) => {
  const r = rng(seed * 7 + 1), skies = [["#f7c27a", "#7fa6d9"], ["#9fc7ea", "#e9d8b0"], ["#e98a6a", "#5d5f9a"]][seed % 3];
  const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, skies[1]); gr.addColorStop(1, skies[0]); g.fillStyle = gr; g.fillRect(0, 0, 256, 192);
  g.fillStyle = "#f6e6a8"; g.beginPath(); g.arc(60 + r() * 140, 50 + r() * 30, 16, 0, 7); g.fill();
  for (const [col, y] of [["#6f8f5a", 120], ["#4f6f45", 150]] as const) { g.fillStyle = col; g.beginPath(); g.moveTo(0, 192); for (let x = 0; x <= 256; x += 32) g.lineTo(x, y + Math.sin(x * 0.03 + r() * 3) * 18); g.lineTo(256, 192); g.fill(); }
  if (seed % 2) { g.strokeStyle = "#3a2a30"; g.lineWidth = 4; g.beginPath(); g.moveTo(170, 150); g.lineTo(186, 70); g.lineTo(202, 150); g.moveTo(178, 120); g.lineTo(194, 120); g.stroke(); } // a tiny tower
});

const boxAt = (b: Batch, m: THREE.Material, c: THREE.Vector3, s: [number, number, number]) =>
  b.add(new THREE.BoxGeometry(...s), m, new THREE.Matrix4().makeTranslation(c.x, c.y, c.z));

// ---------------- walls with openings ----------------
type Rect = [number, number, number, number]; // u0 u1 v0 v1
const wallRects = (L: number, H: number, ops: { u: number; y: number; w: number; h: number }[]): Rect[] => {
  const cuts = [0, L, ...ops.flatMap((o) => [o.u - o.w / 2, o.u + o.w / 2])].sort((a, b) => a - b);
  const out: Rect[] = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i], b = cuts[i + 1];
    if (b - a < 1e-3) continue;
    const op = ops.find((o) => o.u - o.w / 2 <= a + 1e-3 && o.u + o.w / 2 >= b - 1e-3);
    if (!op) { out.push([a, b, 0, H]); continue; }
    if (op.y > 0) out.push([a, b, 0, op.y]);
    if (op.y + op.h < H) out.push([a, b, op.y + op.h, H]);
  }
  return out;
};
type WallFrame = { p: (u: number, v: number) => THREE.Vector3; out: THREE.Vector3; L: number; uOf: (at: number) => number };
const walls = (o: THREE.Vector3, w: number, d: number): Record<Opening["wall"], WallFrame> => {
  const hw = w / 2, hd = d / 2;
  return {
    n: { p: (u, v) => V(o.x - hw + u, o.y + v, o.z - hd), out: V(0, 0, -1), L: w, uOf: (at) => at + hw },
    w: { p: (u, v) => V(o.x - hw, o.y + v, o.z - hd + u), out: V(-1, 0, 0), L: d, uOf: (at) => at + hd },
    e: { p: (u, v) => V(o.x + hw, o.y + v, o.z + hd - u), out: V(1, 0, 0), L: d, uOf: (at) => hd - at },
    s: { p: (u, v) => V(o.x + hw - u, o.y + v, o.z + hd), out: V(0, 0, 1), L: w, uOf: (at) => hw - at },
  };
};
type RoomOpts = { wall: THREE.Material; floor: THREE.Material; ceil: THREE.Material; trim: THREE.Material; tile?: number; floorHole?: { x0: number; x1: number; z0: number; z1: number } };
/** box room on spec (layout.ts): inward quads around the openings, reveals 0.3 m deep, floor + ceiling */
const room = (b: Batch, name: RoomName, R: RoomOpts) => {
  const { o, w, d, h, open } = ROOMS[name], t = 0.3, tile = R.tile ?? 2;
  const hw = w / 2, hd = d / 2;
  if (R.floorHole) holedGround(b, R.floor, o.x - hw, o.x + hw, o.z - hd, o.z + hd, [R.floorHole], o.y, 2);
  else b.add(quad(V(o.x - hw, o.y, o.z + hd), V(o.x + hw, o.y, o.z + hd), V(o.x + hw, o.y, o.z - hd), V(o.x - hw, o.y, o.z - hd), w / 2, d / 2), R.floor);
  b.add(quad(V(o.x - hw, o.y + h, o.z - hd), V(o.x + hw, o.y + h, o.z - hd), V(o.x + hw, o.y + h, o.z + hd), V(o.x - hw, o.y + h, o.z + hd), w / 3, d / 3), R.ceil);
  const W = walls(o, w, d);
  for (const k of ["n", "e", "s", "w"] as const) {
    const f = W[k], ops = open.filter((x) => x.wall === k).map((x) => ({ u: f.uOf(x.at), y: x.y, w: x.w, h: x.h }));
    for (const [u0, u1, v0, v1] of wallRects(f.L, h, ops))
      b.add(quad(f.p(u0, v0), f.p(u1, v0), f.p(u1, v1), f.p(u0, v1), u1 / tile, v1 / tile, u0 / tile, v0 / tile), R.wall);
    for (const op of ops) { // reveals (wall thickness)
      const u0 = op.u - op.w / 2, u1 = op.u + op.w / 2, v0 = op.y, v1 = op.y + op.h, O = f.out.clone().multiplyScalar(t);
      const P = (u: number, v: number, outward: boolean) => f.p(u, v).add(outward ? O : V(0, 0, 0));
      b.add(quad(P(u0, v0, true), P(u0, v0, false), P(u0, v1, false), P(u0, v1, true)), R.trim);
      b.add(quad(P(u1, v0, false), P(u1, v0, true), P(u1, v1, true), P(u1, v1, false)), R.trim);
      b.add(quad(P(u0, v1, true), P(u0, v1, false), P(u1, v1, false), P(u1, v1, true)), R.trim);
      if (v0 > 0) b.add(quad(P(u0, v0, false), P(u0, v0, true), P(u1, v0, true), P(u1, v0, false)), R.trim);
    }
  }
};
/** window dressing on an n or s opening: curtains each side, a valance, a mullion cross, a sill */
const dressWindow = (b: Batch, name: RoomName, wall: "n" | "s", k: number, col: string) => {
  const { o, d, open } = ROOMS[name], op = open.filter((x) => x.wall === wall)[k], hd = d / 2, s = wall === "n" ? -1 : 1;
  if (!op || op.door) return;
  const cur = lam("curtain" + col, () => ({ map: fabric(col, col) })), frame = lam("winFrame", () => ({ color: "#f1e8d6" }));
  const cx = o.x + op.at, z = o.z + s * (hd - 0.12), top = o.y + op.y + op.h;
  for (const q of [-1, 1]) boxAt(b, cur, V(cx + q * (op.w / 2 + 0.28), o.y + (top - o.y + 0.35) / 2, z - s * 0.05), [0.5, top - o.y + 0.35, 0.1]);
  boxAt(b, cur, V(cx, top + 0.25, z - s * 0.06), [op.w + 1.2, 0.4, 0.14]);
  boxAt(b, frame, V(cx, o.y + op.y + op.h / 2, o.z + s * (hd + 0.15)), [0.08, op.h, 0.1]);
  boxAt(b, frame, V(cx, o.y + op.y + op.h * 0.62, o.z + s * (hd + 0.15)), [op.w, 0.08, 0.1]);
  boxAt(b, frame, V(cx, o.y + op.y - 0.04, z - s * 0.1), [op.w + 0.3, 0.08, 0.35]);
};
/** gilt frame + painting on a wall: side w (x = -w/2), e (x = +w/2) or s (z = +d/2); at = position along the wall */
const frameOn = (b: Batch, name: RoomName, side: "w" | "e" | "s", at: number, y: number, fw: number, fh: number, seed: number) => {
  const { o, w, d } = ROOMS[name], gold = lam("gilt", () => ({ color: "#c9a04a" })), pm = lam("painting" + seed, () => ({ map: painting(seed) }));
  const hw = w / 2, hd = d / 2, e = 0.03, yy = o.y + y;
  if (side === "s") {
    const z = o.z + hd - e, x = o.x + at;
    b.add(quad(V(x + fw / 2, yy - fh / 2, z), V(x - fw / 2, yy - fh / 2, z), V(x - fw / 2, yy + fh / 2, z), V(x + fw / 2, yy + fh / 2, z)), pm);
    for (const s of [-1, 1]) { boxAt(b, gold, V(x, yy + s * fh / 2, z - 0.03), [fw + 0.12, 0.08, 0.06]); boxAt(b, gold, V(x + s * fw / 2, yy, z - 0.03), [0.08, fh + 0.12, 0.06]); }
  } else {
    const sx = side === "w" ? -1 : 1, x = o.x + sx * (hw - e), z = o.z + at;
    const a = V(x, yy - fh / 2, z + (sx < 0 ? -fw / 2 : fw / 2)), bb = V(x, yy - fh / 2, z + (sx < 0 ? fw / 2 : -fw / 2));
    b.add(quad(a, bb, V(bb.x, yy + fh / 2, bb.z), V(a.x, yy + fh / 2, a.z)), pm);
    for (const s of [-1, 1]) { boxAt(b, gold, V(x - sx * 0.03, yy + s * fh / 2, z), [0.06, 0.08, fw + 0.12]); boxAt(b, gold, V(x - sx * 0.03, yy, z + s * fw / 2), [0.06, fh + 0.12, 0.08]); }
  }
};
/** brass wall sconce with a glowing bulb; returns its practical light */
const sconce = (b: Batch, root: THREE.Object3D, p: THREE.Vector3, k = 0.7): Lamp => {
  boxAt(b, lam("brass", () => ({ color: "#c9a04a" })), p.clone().add(V(0, -0.12, 0)), [0.12, 0.25, 0.12]);
  lampMesh(root, p.clone().add(V(0, 0.08, 0)), 0.08);
  return { p: p.clone().add(V(0, 0.1, 0)), k };
};
const tableLamp = (b: Batch, root: THREE.Object3D, base: THREE.Vector3, shade: string, k = 0.9): Lamp => {
  boxAt(b, lam("brass", () => ({ color: "#c9a04a" })), base.clone().add(V(0, 0.18, 0)), [0.06, 0.36, 0.06]);
  b.add(new THREE.CylinderGeometry(0.12, 0.2, 0.2, 16, 1, true), lam("lampShade" + shade, () => ({ color: shade, side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(base.x, base.y + 0.42, base.z));
  lampMesh(root, base.clone().add(V(0, 0.38, 0)), 0.06);
  return { p: base.clone().add(V(0, 0.4, 0)), k };
};
const chandelier = (b: Batch, root: THREE.Object3D, c: THREE.Vector3, R = 1.2) => {
  const brass = lam("brass", () => ({ color: "#c9a04a" }));
  b.add(new THREE.TorusGeometry(R, 0.06, 8, 32).rotateX(Math.PI / 2), brass, new THREE.Matrix4().makeTranslation(c.x, c.y, c.z));
  b.add(new THREE.TorusGeometry(R * 0.55, 0.05, 8, 24).rotateX(Math.PI / 2), brass, new THREE.Matrix4().makeTranslation(c.x, c.y + 0.45, c.z));
  b.add(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6), brass, new THREE.Matrix4().makeTranslation(c.x, c.y + 1.6, c.z));
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; lampMesh(root, V(c.x + R * Math.cos(a), c.y + 0.16, c.z + R * Math.sin(a)), 0.07); }
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3; lampMesh(root, V(c.x + R * 0.55 * Math.cos(a), c.y + 0.6, c.z + R * 0.55 * Math.sin(a)), 0.06); }
};
const table = (b: Batch, top: THREE.Material, leg: THREE.Material, c: THREE.Vector3, w: number, d: number, h = 0.76) => {
  boxAt(b, top, V(c.x, c.y + h, c.z), [w, 0.07, d]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxAt(b, leg, V(c.x + sx * (w / 2 - 0.1), c.y + h / 2, c.z + sz * (d / 2 - 0.1)), [0.08, h, 0.08]);
};
const chair = (b: Batch, m: THREE.Material, c: THREE.Vector3, facing: 1 | -1) => {
  boxAt(b, m, V(c.x, c.y + 0.46, c.z), [0.46, 0.06, 0.46]);
  boxAt(b, m, V(c.x, c.y + 0.85, c.z - facing * 0.21), [0.46, 0.8, 0.05]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxAt(b, m, V(c.x + sx * 0.19, c.y + 0.23, c.z + sz * 0.19), [0.05, 0.46, 0.05]);
};
const rug = (b: Batch, c: THREE.Vector3, w: number, d: number, key: string, base: string, border: string) =>
  boxAt(b, lam("rug" + key, () => ({ map: carpet(key, base, border) })), c.clone().add(V(0, 0.015, 0)), [w, 0.02, d]);

export const PORTRAIT = { x: ROOMS.sun.o.x - 4.97, y: 2.1, z: ROOMS.sun.o.z - 0.4 };   // Herschel's portrait (card), west wall
export const CHART = { x: ROOMS.sun.o.x + 1.6, y: 2.0, z: ROOMS.sun.o.z - 3.47 };     // the sales chart (card), north wall

export const buildRooms = (root: THREE.Object3D): Record<RoomName, Room> => {
  const b = new Batch(), out = {} as Record<RoomName, Room>;
  const plank = lam("planksE", () => ({ map: rep(planksHD(), 0.5, 0.5) }));
  const ceilM = lam("ceilE", () => ({ color: "#e8dcc4" })), darkWood = lam("darkWood", () => ({ color: "#5a3a2a" })), wood = lam("woodE", () => ({ color: "#8a5a3c" }));
  const iron = lam("castIron", () => ({ color: "#2e2c34" })), paper = lam("paperStack", () => ({ color: "#efe8d6" }));
  const at = (n: RoomName, x: number, y: number, z: number) => ROOM_AT[n].clone().add(V(x, y, z));
  // ---- The Sun: printing press, type cases, paper stacks, the editor's desk, Locke's desk by the window ----
  {
    const n: RoomName = "sun";
    room(b, n, { wall: lam("sunWall", () => ({ map: rep(wallpaper("sun", "#d9c7a0", "#c4ad80"), 1, 1) })), floor: plank, ceil: ceilM, trim: darkWood });
    dressWindow(b, n, "s", 0, "#7a2e2e");
    boxAt(b, iron, at(n, -2.6, 0.75, -2.2), [1.8, 1.5, 1.3]);                                   // the press
    b.add(new THREE.TorusGeometry(0.6, 0.06, 8, 24), iron, new THREE.Matrix4().makeTranslation(ROOM_AT.sun.x - 1.6, 1.3, ROOM_AT.sun.z - 2.2));
    boxAt(b, iron, at(n, -2.6, 1.9, -2.2), [0.25, 0.8, 0.25]);
    for (let k = 0; k < 4; k++) boxAt(b, paper, at(n, -4.2 + k * 0.05, 0.12 + k * 0.12, 0.4), [0.7, 0.12, 0.5]); // paper stacks
    for (let k = 0; k < 3; k++) boxAt(b, wood, at(n, 1.6, 0.5 + k * 0.45, -3.25), [2.4, 0.06, 0.4]);  // type cases
    for (let k = 0; k < 12; k++) boxAt(b, lam("typeTray" + (k % 2), () => ({ color: ["#a8703a", "#8a5a3c"][k % 2] })), at(n, 0.6 + (k % 6) * 0.4, 0.62 + Math.floor(k / 6) * 0.45, -3.25), [0.34, 0.1, 0.34]);
    table(b, wood, darkWood, at(n, 2.6, 0, -0.6), 1.6, 0.9);                                       // the editor's desk
    chair(b, darkWood, at(n, 2.6, 0, 0.3), -1);
    table(b, wood, darkWood, at(n, -1.6, 0, 1.9), 1.5, 0.8);                                       // Locke's desk by the window
    chair(b, darkWood, at(n, -1.6, 0, 1.15), 1);
    boxAt(b, paper, at(n, -0.95, 0.8, 1.75), [0.3, 0.02, 0.4]);
    rug(b, at(n, 0.4, 0, 0.6), 3.4, 2.2, "sunRug", "#7a2e2e", "#d9b45a");
    boxAt(b, lam("frameGilt", () => ({ color: "#c9a04a" })), V(PORTRAIT.x + 0.02, PORTRAIT.y, PORTRAIT.z), [0.06, 1.1, 0.9]); // portrait frame (card inside)
    boxAt(b, lam("chartBoard", () => ({ color: "#6a4a32" })), V(CHART.x, CHART.y, CHART.z - 0.02), [1.3, 1.0, 0.04]);
    out.sun = { ...ROOMS[n], lamps: [tableLamp(b, root, at(n, -2.1, 0.8, 2.1), "#2f6a4a", 1.3), tableLamp(b, root, at(n, 3.1, 0.8, -0.8), "#8a1f2c", 1.0), sconce(b, root, at(n, 4.95, 2.4, 1.2), 0.6)] };
  }
  // ---- The Herald: a counter, racks of papers, a hanging lamp ----
  {
    const n: RoomName = "herald";
    room(b, n, { wall: lam("heraldWall", () => ({ map: rep(wallpaper("herald", "#cfd8c4", "#a9b89a"), 1, 1) })), floor: plank, ceil: ceilM, trim: darkWood });
    dressWindow(b, n, "n", 0, "#2f4f6e");
    boxAt(b, darkWood, at(n, 0, 0.55, 0.6), [4.2, 1.1, 0.7]); boxAt(b, wood, at(n, 0, 1.12, 0.6), [4.3, 0.05, 0.8]);    // counter
    for (let k = 0; k < 3; k++) boxAt(b, wood, at(n, 0, 0.9 + k * 0.6, 3.3), [5.0, 0.05, 0.35]);
    for (let k = 0; k < 15; k++) boxAt(b, paper, at(n, -2.2 + (k % 5) * 1.1, 1.0 + Math.floor(k / 5) * 0.6, 3.3), [0.7, 0.1, 0.3]);
    rug(b, at(n, 0, 0, -1.6), 3.0, 1.6, "heraldRug", "#2f4f6e", "#d9b45a");
    const lp = at(n, 0, 2.7, 0.6); lampMesh(root, lp, 0.09);
    b.add(new THREE.CylinderGeometry(0.3, 0.08, 0.22, 16, 1, true), lam("shadeGreen", () => ({ color: "#3f6a4a", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(lp.x, lp.y + 0.1, lp.z));
    out.herald = { ...ROOMS[n], lamps: [{ p: lp, k: 1.3 }, sconce(b, root, at(n, -4.45, 2.4, 1.6), 0.6)] };
  }
  void chandelier; void frameOn; void stoneHD; void rng; void painting; void tiles; void carpet; void ctex;
  b.build(root);
  return out;
};
