// Interior sets, each a real room far from the city (x >= 3000) with an open window: the look's "sun" falls through
// it as a lit patch; everything else sits in the purple shade colour plus warm practical pools (shade.ts glows).
import * as THREE from "three";
import { Batch, lam, quad, V } from "../bridge/build";
import { ctex, rep, rng, planksHD, stoneHD } from "../bridge/paint";
import type { Lamp } from "./paris";

export type RoomName = "forger" | "lobby" | "meeting" | "andre" | "hospital" | "compartment" | "restaurant" | "studio";
export type Room = { o: THREE.Vector3; w: number; d: number; h: number; lamps: Lamp[]; spots: Record<string, THREE.Vector3> };
export const ROOM_AT: Record<RoomName, THREE.Vector3> = {
  forger: V(3000, 0, 0), lobby: V(3100, 0, 0), meeting: V(3200, 0, 0), andre: V(3300, 0, 0),
  hospital: V(3400, 0, 0), compartment: V(3500, 0, 0), restaurant: V(3600, 0, 0), studio: V(3700, 0, 0),
};

const wallpaper = (key: string, base: string, motif: string) => ctex("wp" + key, 256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.fillStyle = motif;
  for (let y = 0; y < 256; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 256; x += 64) {
    g.beginPath(); g.ellipse(x + 16, y + 20, 7, 11, 0, 0, 7); g.fill();
    g.fillRect(x + 15, y + 30, 2, 12);
  }
  for (let x = 0; x < 256; x += 32) { g.fillStyle = "rgba(0,0,0,0.05)"; g.fillRect(x, 0, 3, 256); }
  void r;
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

const boxAt = (b: Batch, m: THREE.Material, c: THREE.Vector3, s: [number, number, number]) =>
  b.add(new THREE.BoxGeometry(...s), m, new THREE.Matrix4().makeTranslation(c.x, c.y, c.z));

type RoomOpts = { wall: THREE.Material; floor: THREE.Material; ceil: THREE.Material; trim?: THREE.Material;
  win: { x: number; y: number; w: number; h: number }; wainscot?: THREE.Material };
/** box room centred on o (floor at y = o.y), window cut in the back wall (z = -d/2), open to the sky */
const room = (b: Batch, o: THREE.Vector3, w: number, d: number, h: number, R: RoomOpts) => {
  const M = new THREE.Matrix4().setPosition(o.x, o.y, o.z), hw = w / 2, hd = d / 2, t = 0.3;
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, 0, -hd), V(-hw, 0, -hd), w / 2, d / 2), R.floor, M);
  b.add(quad(V(-hw, h, -hd), V(hw, h, -hd), V(hw, h, hd), V(-hw, h, hd), w / 3, d / 3), R.ceil, M);
  // side + front walls (inward faces)
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd), d / 2, h / 2), R.wall, M);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd), d / 2, h / 2), R.wall, M);
  b.add(quad(V(hw, 0, hd), V(-hw, 0, hd), V(-hw, h, hd), V(hw, h, hd), w / 2, h / 2), R.wall, M);
  // back wall around the window opening (solid boxes so the sun casts a real window patch)
  const { x, y, w: ww, h: wh } = R.win, z = o.z - hd - t / 2;
  boxAt(b, R.wall, V(o.x + (-hw + (x - ww / 2)) / 2 - hw / 2 + hw / 2, o.y + h / 2, z), [x - ww / 2 + hw, h, t]);
  boxAt(b, R.wall, V(o.x + (x + ww / 2 + hw) / 2, o.y + h / 2, z), [hw - (x + ww / 2), h, t]);
  boxAt(b, R.wall, V(o.x + x, o.y + y / 2, z), [ww, y, t]);
  boxAt(b, R.wall, V(o.x + x, o.y + (y + wh + h) / 2, z), [ww, h - y - wh, t]);
  // window frame + mullions
  const frame = R.trim ?? lam("winFrame", () => ({ color: "#f1e8d6" }));
  boxAt(b, frame, V(o.x + x, o.y + y + wh / 2, z + 0.05), [0.12, wh, 0.2]);
  boxAt(b, frame, V(o.x + x, o.y + y + wh * 0.62, z + 0.05), [ww, 0.1, 0.2]);
  boxAt(b, frame, V(o.x + x, o.y + y - 0.05, z + 0.2), [ww + 0.4, 0.1, 0.5]);
  if (R.wainscot) for (const s of [-1, 1]) boxAt(b, R.wainscot, V(o.x + s * (hw - 0.03), o.y + 0.5, o.z), [0.06, 1.0, d]);
  if (R.wainscot) boxAt(b, R.wainscot, V(o.x, o.y + 0.5, o.z + hd - 0.03), [w, 1.0, 0.06]);
  // outside the window: a far backdrop wall (city / courtyard) so the opening is not a void
};
const lampMesh = (root: THREE.Object3D, p: THREE.Vector3, r = 0.16, col = new THREE.Color(5.0, 3.1, 1.3)) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: col }));
  m.position.copy(p); root.add(m);
};
/** chandelier: brass ring + glowing candles (bloom) + crystal drops */
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

export const buildRooms = (root: THREE.Object3D): Record<RoomName, Room> => {
  const b = new Batch(), out = {} as Record<RoomName, Room>;
  const plank = lam("planksE", () => ({ map: rep(planksHD(), 0.5, 0.5) }));
  const ceilM = lam("ceilE", () => ({ color: "#efe4d0" }));
  const darkWood = lam("darkWood", () => ({ color: "#5a3a2a" })), wood = lam("woodE", () => ({ color: "#8a5a3c" }));
  const green = lam("baize", () => ({ color: "#2f6a4a" })), brass = lam("brass", () => ({ color: "#c9a04a" }));
  const rr = rng(11);
  // ---- forger's back-room workshop (lamp-lit) ----
  {
    const o = ROOM_AT.forger, w = 6, d = 5, h = 3.2;
    room(b, o, w, d, h, { wall: lam("forgerWall", () => ({ map: rep(stoneHD("forgerStone", ["#b8a08a", "#ac937c", "#c2ab94", "#a38a74"], "#7a6a5a"), 2, 1) })), floor: plank, ceil: darkWood,
      win: { x: 1.8, y: 1.6, w: 1.0, h: 0.9 } });
    table(b, wood, darkWood, V(o.x, 0, o.z - 0.9), 2.0, 0.9);
    for (let k = 0; k < 4; k++) boxAt(b, darkWood, V(o.x - 2.2, 0.6 + k * 0.6, o.z - 2.3), [1.4, 0.05, 0.35]);  // shelves
    for (let k = 0; k < 10; k++) boxAt(b, lam("ledger" + (k % 3), () => ({ color: ["#8c3b4a", "#3f6fb5", "#5d7a3a"][k % 3] })), V(o.x - 2.7 + k * 0.12, 0.83 + Math.floor(k / 5) * 0.6, o.z - 2.3), [0.08, 0.3, 0.26]);
    const lp = V(o.x + 0.2, 1.9, o.z - 0.8);
    b.add(new THREE.CylinderGeometry(0.35, 0.05, 0.25, 16, 1, true), lam("shade", () => ({ color: "#2f5a4a", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(lp.x, lp.y + 0.12, lp.z));
    b.add(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), darkWood, new THREE.Matrix4().makeTranslation(lp.x, lp.y + 0.8, lp.z));
    lampMesh(root, lp, 0.09);
    out.forger = { o, w, d, h, lamps: [{ p: lp, k: 1.6 }], spots: { forger: V(o.x, 0, o.z - 1.7), desk: V(o.x, 0.8, o.z - 0.9), lamp: lp } };
  }
  // ---- hotel lobby: chequered marble, columns, chandelier, reception, wall of brass mailboxes ----
  {
    const o = ROOM_AT.lobby, w = 22, d = 16, h = 8;
    room(b, o, w, d, h, { wall: lam("lobbyWall", () => ({ map: rep(wallpaper("lobby", "#d9c7a0", "#c4ad80"), 6, 3) })), floor: lam("lobbyFloor", () => ({ map: rep(tiles("lobby", "#f2ede2", "#3b3a44"), 4, 3) })),
      ceil: lam("lobbyCeil", () => ({ color: "#f3e8d2" })), win: { x: -5, y: 1.0, w: 3.2, h: 5.2 }, wainscot: darkWood });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(new THREE.CylinderGeometry(0.45, 0.5, h, 16), lam("marbleCol", () => ({ color: "#efe3cf" })), new THREE.Matrix4().makeTranslation(o.x + sx * 6, h / 2, o.z + sz * 4));
    boxAt(b, darkWood, V(o.x + 6, 0.55, o.z - 6), [6, 1.1, 1.0]);                         // reception desk
    boxAt(b, brass, V(o.x + 6, 1.13, o.z - 6), [6.1, 0.06, 1.1]);
    for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 8; xx++)                          // mailbox wall
      boxAt(b, xx % 2 === yy % 2 ? brass : lam("brass2", () => ({ color: "#b38c3e" })), V(o.x + 3.4 + xx * 0.7, 1.8 + yy * 0.62, o.z - d / 2 + 0.15), [0.62, 0.54, 0.25]);
    boxAt(b, lam("redCarpet", () => ({ map: carpet("lobbyRun", "#8a1f2c", "#d9b45a") })), V(o.x, 0.01, o.z + 1), [3, 0.02, d - 2]);
    chandelier(b, root, V(o.x, h - 2.2, o.z));
    out.lobby = { o, w, d, h, lamps: [{ p: V(o.x, h - 2.2, o.z), k: 2.2 }, { p: V(o.x + 6, 2.2, o.z - 5.5), k: 0.8 }],
      spots: { door: V(o.x, 0, o.z + d / 2 - 1), lustig: V(o.x + 3.5, 0, o.z - 4.6), bellboy: V(o.x + 2.3, 0, o.z - 4.0), mailboxes: V(o.x + 5.85, 2.75, o.z - d / 2 + 0.3) } };
  }
  // ---- meeting room: long table under a chandelier, CONFIDENTIAL door ----
  {
    const o = ROOM_AT.meeting, w = 10, d = 8, h = 4.6;
    room(b, o, w, d, h, { wall: lam("meetWall", () => ({ map: rep(wallpaper("meet", "#6e2f3e", "#8a4352"), 4, 2) })), floor: plank, ceil: lam("meetCeil", () => ({ color: "#e8dcc4" })),
      win: { x: 2.4, y: 1.0, w: 1.6, h: 2.6 }, wainscot: darkWood });
    table(b, green, darkWood, V(o.x, 0, o.z), 4.2, 1.6);
    for (let k = 0; k < 3; k++) for (const s of [-1, 1]) chair(b, darkWood, V(o.x - 1.4 + k * 1.4, 0, o.z + s * 1.25), s > 0 ? -1 : 1);
    chandelier(b, root, V(o.x, h - 1.4, o.z), 0.8);
    boxAt(b, darkWood, V(o.x - 3.2, 1.1, o.z + d / 2 - 0.05), [1.1, 2.2, 0.08]);           // door
    out.meeting = { o, w, d, h, lamps: [{ p: V(o.x, h - 1.4, o.z), k: 1.8 }],
      spots: { lustig: V(o.x - 2.6, 0, o.z), table: V(o.x, 0.8, o.z), andre: V(o.x + 1.4, 0, o.z + 1.25), door: V(o.x - 3.2, 1.6, o.z + d / 2 - 0.1) } };
  }
  // ---- André's home (night): wallpaper, rug, armchair, moonlit window ----
  {
    const o = ROOM_AT.andre, w = 6, d = 5, h = 3;
    room(b, o, w, d, h, { wall: lam("andreWall", () => ({ map: rep(wallpaper("andre", "#5d7a6a", "#4c6658"), 3, 2) })), floor: plank, ceil: ceilM,
      win: { x: -1.2, y: 1.0, w: 1.2, h: 1.5 }, wainscot: darkWood });
    boxAt(b, lam("rug", () => ({ map: carpet("andreRug", "#8a3a2e", "#e0b04a") })), V(o.x + 0.3, 0.02, o.z + 0.2), [2.6, 0.03, 1.8]);
    boxAt(b, lam("armchair", () => ({ color: "#7a3040" })), V(o.x + 2.0, 0.4, o.z - 1.5), [1.0, 0.8, 0.9]);
    boxAt(b, lam("armchair", () => ({ color: "#7a3040" })), V(o.x + 2.0, 0.95, o.z - 1.9), [1.0, 1.0, 0.2]);
    const lp = V(o.x + 1.2, 1.0, o.z - 2.0);
    boxAt(b, wood, V(lp.x, 0.4, lp.z), [0.5, 0.8, 0.5]); lampMesh(root, V(lp.x, 1.05, lp.z), 0.1);
    out.andre = { o, w, d, h, lamps: [{ p: V(lp.x, 1.1, lp.z), k: 1.1 }], spots: { andre: V(o.x + 0.2, 0, o.z + 0.3), cat: V(o.x - 1.3, 0, o.z + 0.4), rug: V(o.x + 0.3, 0.05, o.z + 0.2) } };
  }
  // ---- prison hospital ward: white tiles, iron beds, tall window (rain, then sunrise) ----
  {
    const o = ROOM_AT.hospital, w = 12, d = 7, h = 4.2;
    room(b, o, w, d, h, { wall: lam("wardWall", () => ({ map: rep(tiles("ward", "#e8eef0", "#dfe7ea"), 6, 2) })), floor: lam("wardFloor", () => ({ map: rep(tiles("wardF", "#c9d2d6", "#b7c2c8"), 4, 2) })),
      ceil: ceilM, win: { x: 0.5, y: 1.0, w: 2.2, h: 2.6 } });
    const iron = lam("bedIron", () => ({ color: "#5d6b78" })), sheet = lam("sheet", () => ({ color: "#f4f2ec" }));
    for (let k = 0; k < 4; k++) {
      const c = V(o.x - 4.5 + k * 3, 0, o.z - 1.8);
      boxAt(b, sheet, V(c.x, 0.62, c.z + 0.2), [0.95, 0.22, 2.0]); boxAt(b, iron, V(c.x, 0.9, c.z - 0.85), [1.0, 1.0, 0.06]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxAt(b, iron, V(c.x + sx * 0.45, 0.3, c.z + 0.2 + sz * 0.95), [0.05, 0.6, 0.05]);
    }
    out.hospital = { o, w, d, h, lamps: [{ p: V(o.x - 3, h - 0.4, o.z), k: 0.5 }], spots: { bed: V(o.x + 1.5, 0.75, o.z - 1.6), window: V(o.x + 0.5, 2.3, o.z - d / 2), table: V(o.x + 2.6, 0.75, o.z - 0.5) } };
    boxAt(b, wood, V(o.x + 2.6, 0.37, o.z - 0.5), [0.6, 0.74, 0.6]);
  }
  // ---- studio for the FAKE vs REAL gag: cyclorama + two spot pools ----
  {
    const o = ROOM_AT.studio, cyc = lam("cyc", () => ({ color: "#efe2c8" }));
    b.add(quad(V(-8, 0, 6), V(8, 0, 6), V(8, 0, -3), V(-8, 0, -3)), cyc, new THREE.Matrix4().setPosition(o.x, 0, o.z));
    b.add(quad(V(-8, 0, -3), V(8, 0, -3), V(8, 6, -3.5), V(-8, 6, -3.5)), lam("cycBack", () => ({ color: "#e8d7b8" })), new THREE.Matrix4().setPosition(o.x, 0, o.z));
    for (const s2 of [-1, 1]) boxAt(b, lam("curtain", () => ({ color: "#8a1f2c" })), V(o.x + s2 * 3.6, 2.5, o.z - 1), [0.6, 5, 4]);
    out.studio = { o, w: 16, d: 9, h: 6, lamps: [{ p: V(o.x - 1.1, 3.2, o.z + 1), k: 1.2 }, { p: V(o.x + 1.1, 3.2, o.z + 1), k: 1.2 }], spots: {} };
  }
  void rr; void brass;
  // backdrop outside the windows: a ring of distant facades so openings show a city, not the void
  b.build(root);
  return out;
};
