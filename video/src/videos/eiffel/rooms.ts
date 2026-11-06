// Interior sets, now inside real buildings (layout.ts): the hotel lobby behind the main door, the meeting room and
// the FAKE/REAL stage on the hotel's first floor, the forger, André and the prison ward in their own buildings.
// Every room has a street window (the look's "sun" falls through it as a lit patch, and the city shows outside),
// and is dressed: curtains, picture frames, brass wall lamps (warm practical-light pools), rugs, table lamps.
import * as THREE from "three";
import { Batch, lam, quad, V } from "../bridge/build";
import { ctex, rep, rng, planksHD, stoneHD } from "../bridge/paint";
import type { Lamp } from "./paris";
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
type RoomOpts = { wall: THREE.Material; floor: THREE.Material; ceil: THREE.Material; trim: THREE.Material; tile?: number };
/** box room on spec (layout.ts): inward quads around the openings, reveals 0.3 m deep, floor + ceiling */
const room = (b: Batch, name: RoomName, R: RoomOpts) => {
  const { o, w, d, h, open } = ROOMS[name], t = 0.3, tile = R.tile ?? 2;
  const hw = w / 2, hd = d / 2;
  b.add(quad(V(o.x - hw, o.y, o.z + hd), V(o.x + hw, o.y, o.z + hd), V(o.x + hw, o.y, o.z - hd), V(o.x - hw, o.y, o.z - hd), w / 2, d / 2), R.floor);
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
/** window dressing on a north opening: curtains each side, a valance, a mullion cross, a sill */
const dressWindow = (b: Batch, name: RoomName, k: number, col: string) => {
  const { o, d, open } = ROOMS[name], op = open.filter((x) => x.wall === "n")[k], hd = d / 2;
  if (op.door) return;
  const cur = lam("curtain" + col, () => ({ map: fabric(col, col) })), frame = lam("winFrame", () => ({ color: "#f1e8d6" }));
  const cx = o.x + op.at, z = o.z - hd + 0.12, top = o.y + op.y + op.h;
  for (const s of [-1, 1]) boxAt(b, cur, V(cx + s * (op.w / 2 + 0.28), o.y + (top - o.y + 0.35) / 2, z + 0.05), [0.5, top - o.y + 0.35, 0.1]);
  boxAt(b, cur, V(cx, top + 0.25, z + 0.06), [op.w + 1.2, 0.4, 0.14]);
  boxAt(b, frame, V(cx, o.y + op.y + op.h / 2, o.z - hd - 0.15), [0.08, op.h, 0.1]);
  boxAt(b, frame, V(cx, o.y + op.y + op.h * 0.62, o.z - hd - 0.15), [op.w, 0.08, 0.1]);
  boxAt(b, frame, V(cx, o.y + op.y - 0.04, z + 0.1), [op.w + 0.3, 0.08, 0.35]);
};
const lampMesh = (root: THREE.Object3D, p: THREE.Vector3, r = 0.16, col = new THREE.Color(5.0, 3.1, 1.3)) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: col }));
  m.position.copy(p); root.add(m);
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

export const buildRooms = (root: THREE.Object3D): Record<RoomName, Room> => {
  const b = new Batch(), out = {} as Record<RoomName, Room>;
  const plank = lam("planksE", () => ({ map: rep(planksHD(), 0.5, 0.5) }));
  const ceilM = lam("ceilE", () => ({ color: "#efe4d0" })), trim = lam("trimE", () => ({ color: "#efe2c8" }));
  const darkWood = lam("darkWood", () => ({ color: "#5a3a2a" })), wood = lam("woodE", () => ({ color: "#8a5a3c" }));
  const green = lam("baize", () => ({ color: "#2f6a4a" })), brass = lam("brass", () => ({ color: "#c9a04a" }));
  const at = (n: RoomName, x: number, y: number, z: number) => ROOM_AT[n].clone().add(V(x, y, z));

  // ---- forger's back-room workshop (lamp-lit) ----
  {
    const n: RoomName = "forger";
    room(b, n, { wall: lam("forgerWall", () => ({ map: rep(stoneHD("forgerStone", ["#b8a08a", "#ac937c", "#c2ab94", "#a38a74"], "#7a6a5a"), 1, 1) })), floor: plank, ceil: darkWood, trim: darkWood });
    dressWindow(b, n, 0, "#5d6a3a");
    table(b, wood, darkWood, at(n, 0, 0, -0.9), 2.0, 0.9);
    for (let k = 0; k < 4; k++) boxAt(b, darkWood, at(n, -2.2, 0.6 + k * 0.6, 2.25), [1.4, 0.05, 0.35]);
    for (let k = 0; k < 10; k++) boxAt(b, lam("ledger" + (k % 3), () => ({ color: ["#8c3b4a", "#3f6fb5", "#5d7a3a"][k % 3] })), at(n, -2.7 + k * 0.12, 0.83 + Math.floor(k / 5) * 0.6, 2.25), [0.08, 0.3, 0.26]);
    rug(b, at(n, 0, 0, 0.3), 2.6, 1.6, "forger", "#6a3a2e", "#c9a04a");
    const lp = at(n, 0.2, 1.9, -0.8);
    b.add(new THREE.CylinderGeometry(0.35, 0.05, 0.25, 16, 1, true), lam("shade", () => ({ color: "#2f5a4a", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(lp.x, lp.y + 0.12, lp.z));
    b.add(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), darkWood, new THREE.Matrix4().makeTranslation(lp.x, lp.y + 0.8, lp.z));
    lampMesh(root, lp, 0.09);
    frameOn(b, n, "w", 0.4, 1.8, 0.7, 0.5, 1); frameOn(b, n, "e", -0.6, 1.8, 0.6, 0.45, 2);
    out.forger = { ...ROOMS[n], lamps: [{ p: lp, k: 1.6 }, sconce(b, root, at(n, 2.95, 2.0, 1.2), 0.6)] };
  }
  // ---- hotel lobby: chequered marble, columns, chandelier, reception + mailboxes on the south wall ----
  {
    const n: RoomName = "lobby";
    room(b, n, { wall: lam("lobbyWall", () => ({ map: rep(wallpaper("lobby", "#d9c7a0", "#c4ad80"), 1, 1) })), floor: lam("lobbyFloor", () => ({ map: rep(tiles("lobby", "#f2ede2", "#3b3a44"), 1, 1) })), ceil: lam("lobbyCeil", () => ({ color: "#f3e8d2" })), trim, tile: 3 });
    dressWindow(b, n, 1, "#8a1f2c");
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(new THREE.CylinderGeometry(0.45, 0.5, 8, 16), lam("marbleCol", () => ({ color: "#efe3cf" })), new THREE.Matrix4().makeTranslation(ROOM_AT.lobby.x + sx * 6, 4, ROOM_AT.lobby.z + sz * 3.5));
    boxAt(b, darkWood, at(n, 5.5, 0.55, 6.4), [6, 1.1, 1.0]);                              // reception desk
    boxAt(b, brass, at(n, 5.5, 1.13, 6.4), [6.1, 0.06, 1.1]);
    for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 8; xx++)                           // wall of brass mailboxes
      boxAt(b, xx % 2 === yy % 2 ? brass : lam("brass2", () => ({ color: "#b38c3e" })), at(n, 3.05 + xx * 0.7, 1.8 + yy * 0.62, 7.85), [0.62, 0.54, 0.25]);
    boxAt(b, lam("redCarpet", () => ({ map: carpet("lobbyRun", "#8a1f2c", "#d9b45a") })), at(n, 0, 0.01, -1), [3, 0.02, 13]);
    rug(b, at(n, -5.5, 0, 2), 4, 3, "lobbyRug", "#2f4f6e", "#d9b45a");
    boxAt(b, lam("sofa", () => ({ color: "#7a3040" })), at(n, -5.5, 0.4, 3.6), [2.4, 0.8, 0.8]);
    boxAt(b, lam("plantPot", () => ({ color: "#b5653f" })), at(n, -9.6, 0.35, 7.2), [0.6, 0.7, 0.6]);
    b.add(new THREE.SphereGeometry(0.75, 12, 10), lam("palm", () => ({ color: "#4f8f3c" })), new THREE.Matrix4().makeTranslation(ROOM_AT.lobby.x - 9.6, 1.3, ROOM_AT.lobby.z + 7.2));
    chandelier(b, root, at(n, 0, 5.8, 1));
    frameOn(b, n, "w", 0, 3.2, 2.2, 1.5, 3); frameOn(b, n, "e", 1, 3.2, 2.2, 1.5, 4);
    const lamps: Lamp[] = [{ p: at(n, 0, 5.8, 1), k: 2.2 }, tableLamp(b, root, at(n, 3.2, 1.16, 6.4), "#2f5a4a"), tableLamp(b, root, at(n, 7.8, 1.16, 6.4), "#2f5a4a"),
      sconce(b, root, at(n, -10.95, 3.2, -3), 0.7), sconce(b, root, at(n, 10.95, 3.2, -3), 0.7)];
    out.lobby = { ...ROOMS[n], lamps };
  }
  // ---- meeting room (first floor): long baize table, chandelier, corridor door with the CONFIDENTIAL sign ----
  {
    const n: RoomName = "meeting";
    room(b, n, { wall: lam("meetWall", () => ({ map: rep(wallpaper("meet", "#6e2f3e", "#8a4352"), 1, 1) })), floor: plank, ceil: lam("meetCeil", () => ({ color: "#e8dcc4" })), trim: darkWood });
    dressWindow(b, n, 0, "#d9b45a");
    rug(b, at(n, 0, 0, 0), 6, 3.6, "meetRug", "#3a2a5a", "#d9b45a");
    table(b, green, darkWood, at(n, 0, 0, 0), 4.2, 1.6);
    for (let k = 0; k < 6; k++) chair(b, darkWood, at(n, -2.0 + k * 0.8, 0, 1.25), -1);          // one row on the far side (5 dealers + André)
    chandelier(b, root, at(n, 0, 3.2, 0), 0.8);
    boxAt(b, darkWood, at(n, 2.2, 0.45, 3.65), [2.2, 0.9, 0.6]);                            // sideboard
    // dark corridor beyond the south door (dealers arrive through it)
    const cor = lam("corridor", () => ({ color: "#2a1e26" })), c0 = at(n, -3.2, 0, 4.0);
    boxAt(b, cor, c0.clone().add(V(0, 1.3, 1.6)), [1.6, 2.6, 0.1]); boxAt(b, cor, c0.clone().add(V(-0.8, 1.3, 0.8)), [0.1, 2.6, 1.6]); boxAt(b, cor, c0.clone().add(V(0.8, 1.3, 0.8)), [0.1, 2.6, 1.6]);
    boxAt(b, cor, c0.clone().add(V(0, 2.6, 0.8)), [1.6, 0.1, 1.6]); boxAt(b, cor, c0.clone().add(V(0, 0.01, 0.8)), [1.6, 0.02, 1.6]);
    frameOn(b, n, "w", -1.2, 2.3, 1.2, 0.8, 5); frameOn(b, n, "s", 1.5, 2.3, 1.2, 0.8, 6);
    const lamps: Lamp[] = [{ p: at(n, 0, 3.2, 0), k: 1.8 }, tableLamp(b, root, at(n, 1.5, 0.9, 3.65), "#8a1f2c"), tableLamp(b, root, at(n, 2.9, 0.9, 3.65), "#8a1f2c"),
      sconce(b, root, at(n, -4.95, 2.4, 1.6), 0.6), sconce(b, root, at(n, 4.95, 2.4, -2.0), 0.6)];
    out.meeting = { ...ROOMS[n], lamps };
  }
  // ---- the FAKE vs REAL stage (next door): boards, cyclorama, red curtain wings, two footlight pools ----
  {
    const n: RoomName = "studio";
    room(b, n, { wall: lam("studioWall", () => ({ color: "#3a2a3a" })), floor: plank, ceil: lam("studioCeil", () => ({ color: "#2a2230" })), trim: darkWood });
    dressWindow(b, n, 0, "#8a1f2c");
    const o = ROOM_AT.studio;
    b.add(quad(V(o.x - 3.6, o.y, o.z + 3.4), V(o.x + 3.6, o.y, o.z + 3.4), V(o.x + 3.6, o.y + 4.4, o.z + 3.9), V(o.x - 3.6, o.y + 4.4, o.z + 3.9)), lam("cycBack", () => ({ color: "#e8d7b8" })));
    boxAt(b, lam("stageBoards", () => ({ color: "#9a6a44" })), at(n, 0, 0.2, 2.0), [7.4, 0.4, 3.2]);
    for (const s of [-1, 1]) boxAt(b, lam("curtainRed", () => ({ map: fabric("red", "#8a1f2c") })), at(n, s * 3.3, 2.2, 2.2), [0.8, 4.4, 3.0]);
    boxAt(b, lam("curtainRed", () => ({ map: fabric("red", "#8a1f2c") })), at(n, 0, 4.1, 0.65), [7.4, 0.9, 0.15]);
    const lamps: Lamp[] = [{ p: at(n, -0.75, 1.0, 0.2), k: 1.3 }, { p: at(n, 0.75, 1.0, 0.2), k: 1.3 }, sconce(b, root, at(n, -4.95, 2.4, -1.5), 0.6)];
    out.studio = { ...ROOMS[n], lamps };
  }
  // ---- André's home (first floor): wallpaper, rug, armchair, lamp, frames, curtains ----
  {
    const n: RoomName = "andre";
    room(b, n, { wall: lam("andreWall", () => ({ map: rep(wallpaper("andre", "#5d7a6a", "#4c6658"), 1, 1) })), floor: plank, ceil: ceilM, trim: darkWood });
    dressWindow(b, n, 0, "#8a3a2e");
    rug(b, at(n, 0.3, 0, 0.2), 2.6, 1.8, "andreRug", "#8a3a2e", "#e0b04a");
    boxAt(b, lam("armchair", () => ({ color: "#7a3040" })), at(n, 2.0, 0.4, 1.5), [1.0, 0.8, 0.9]);
    boxAt(b, lam("armchair", () => ({ color: "#7a3040" })), at(n, 2.0, 0.95, 1.9), [1.0, 1.0, 0.2]);
    boxAt(b, wood, at(n, 1.0, 0.4, -1.9), [0.5, 0.8, 0.5]);
    frameOn(b, n, "w", 0.6, 1.8, 0.9, 0.65, 7); frameOn(b, n, "s", -1.4, 1.8, 0.7, 0.9, 8);
    const lamps: Lamp[] = [tableLamp(b, root, at(n, 1.0, 0.8, -1.9), "#e0b04a", 1.1), sconce(b, root, at(n, 2.95, 1.9, 0.2), 0.5)];
    out.andre = { ...ROOMS[n], lamps };
  }
  // ---- prison hospital ward: white tiles, iron beds, tall window (rain, then sunrise) ----
  {
    const n: RoomName = "hospital";
    room(b, n, { wall: lam("wardWall", () => ({ map: rep(tiles("ward", "#e8eef0", "#dfe7ea"), 1, 1) })), floor: lam("wardFloor", () => ({ map: rep(tiles("wardF", "#c9d2d6", "#b7c2c8"), 1, 1) })), ceil: ceilM, trim, tile: 1.5 });
    dressWindow(b, n, 0, "#c9d6c8");
    const iron = lam("bedIron", () => ({ color: "#5d6b78" })), sheet = lam("sheet", () => ({ color: "#f4f2ec" }));
    for (let k = 0; k < 4; k++) {
      const c = at(n, -4.5 + k * 3, 0, 1.8);
      boxAt(b, sheet, c.clone().add(V(0, 0.62, -0.2)), [0.95, 0.22, 2.0]); boxAt(b, iron, c.clone().add(V(0, 0.9, 0.85)), [1.0, 1.0, 0.06]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxAt(b, iron, c.clone().add(V(sx * 0.45, 0.3, -0.2 + sz * 0.95)), [0.05, 0.6, 0.05]);
    }
    boxAt(b, wood, at(n, 2.6, 0.37, 0.5), [0.6, 0.74, 0.6]);
    frameOn(b, n, "w", 0, 2.2, 0.8, 0.6, 9);
    const lamps: Lamp[] = [tableLamp(b, root, at(n, 3.05, 0.74, 0.15), "#e8eef0", 0.6), { p: at(n, -3, 3.8, 0), k: 0.5 }];
    out.hospital = { ...ROOMS[n], lamps };
  }
  void brass;
  b.build(root);
  return out;
};
