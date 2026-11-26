// The sets of "His College Banned Dogs, So He Brought a Bear": Trinity's Great Court in bright warm sun (honey stone
// ranges with Gothic windows and battlements, the Great Gate with its arch and turrets, a striped lawn, gravel paths, the
// fountain, flower beds, lamp posts), the porter's lodge, the bear's fair wagon, the NO DOGS sign, the exam desk; and
// Byron's rooms (wood panelling, bookshelves, a fireplace, windows onto the court, a desk, an armchair, warm lamps).
import * as THREE from "three";
import { Batch, lam, V, Kit, boxGeo } from "../bridge/build";
import { rep, grassHD, planksHD, roofHD, ctex } from "../bridge/paint";
import { ground, gableRoof, Lamp } from "../rats/hanoi";
import { twoTone } from "../bridge/shade";
import { GATE_Z, LODGE, WAGON, FOUNTAIN, DESK, ROOMS, ARMCHAIR } from "./layout";

export type Sets = { lamps: Lamp[]; sign: THREE.Group; wagon: THREE.Group; desk: THREE.Group };
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const stoneTex = () => ctex("byStone", 512, 512, (g, r) => { g.fillStyle = "#e6cc98"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 512; x += 64) { g.fillStyle = ["#e9d2a0", "#dfc28c", "#ecd6a8"][Math.floor(r() * 3)]; g.fillRect(x + 2, y + 2, 60, 28); }
  g.fillStyle = "rgba(150,120,80,0.35)"; for (let y = 0; y < 512; y += 32) g.fillRect(0, y, 512, 2); });
const gravelTex = () => ctex("byGravel", 512, 512, (g, r) => { g.fillStyle = "#d8c8a8"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 3000; i++) { g.fillStyle = ["#cbb894", "#e4d6b8", "#bfae8c"][i % 3]; g.fillRect(r() * 512, r() * 512, 3, 3); } });
const lawnTex = () => ctex("byLawn", 512, 512, (g) => { for (let x = 0; x < 512; x += 64) { g.fillStyle = (x / 64) % 2 ? "#7fb04a" : "#8cbc52"; g.fillRect(x, 0, 64, 512); } });
const winTex = () => ctex("byWin", 128, 256, (g) => { g.fillStyle = "#e6cc98"; g.fillRect(0, 0, 128, 256); g.fillStyle = "#6a8ab0"; g.beginPath(); g.moveTo(14, 250); g.lineTo(14, 70); g.quadraticCurveTo(64, -10, 114, 70); g.lineTo(114, 250); g.fill();
  g.strokeStyle = "#e9dcc0"; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 30); g.lineTo(64, 250); g.moveTo(14, 150); g.lineTo(114, 150); g.stroke(); g.fillStyle = "rgba(255,240,200,0.35)"; g.fillRect(20, 160, 40, 80); });
const panelTex = () => ctex("byPanel", 256, 256, (g) => { g.fillStyle = "#b07a48"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#8a5a32"; g.lineWidth = 8; for (let x = 0; x < 256; x += 128) for (let y = 0; y < 256; y += 128) g.strokeRect(x + 14, y + 14, 100, 100); });
const sign = (key: string, text: string, bg: string, fg: string, w = 1024, h = 384) => ctex(key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 22; g.strokeRect(14, 14, w - 28, h - 28);
  g.fillStyle = fg; g.font = `900 ${Math.round(h * 0.42)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 8, w - 80); });

export function buildSets(R: THREE.Group, kit: Kit): Sets {
  const b = new Batch(), r = rng(1805), lamps: Lamp[] = [];
  const bx = (mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 2.5) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile), mat);
  const add = (name: string, x: number, y: number, z: number, s: number, rot = 0) => {
    const o = kit[name]; if (!o) return;
    b.addObject(o, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), V(s, s, s)));
  };
  const stone = lam("byStoneM", () => ({ map: rep(stoneTex(), 1, 1) }));
  const stoneD = lam("byStoneD", () => ({ color: "#cfb07a" }));
  const roof = lam("byRoof", () => ({ map: rep(roofHD("#7a6a6a"), 2, 2) }));
  const win = lam("byWinM", () => ({ map: winTex() }));
  const gravel = lam("byGravelM", () => ({ map: rep(gravelTex(), 1, 1) }));
  const lawn = lam("byLawnM", () => ({ map: rep(lawnTex(), 1, 1) }));
  const woodD = lam("byWoodD", () => ({ color: "#7a4a2a" }));
  const iron = lam("byIron", () => ({ color: "#3a3a44" }));
  const red = lam("byRed", () => ({ color: "#b8402e" }));
  const gold = lam("byGold", () => ({ color: "#e8b84a" }));

  // ---- the Great Court ----
  ground(b, lam("byField", () => ({ map: grassHD(), color: "#9ab868" })), -400, 400, -400, 400, 0, 10);
  ground(b, gravel, -15, 15, -15, 15, 0.02, 6);
  for (const [x0, x1, z0, z1] of [[-13, -1.2, -12.5, 0.8], [1.2, 13, -12.5, 0.8], [-13, -1.2, 3.2, 13], [1.2, 13, 3.2, 13]] as [number, number, number, number][]) ground(b, lawn, x0, x1, z0, z1, 0.04, 6);
  // stone ranges on all four sides, two storeys, Gothic windows, battlements, slate roofs
  const range = (x0: number, x1: number, z0: number, z1: number, face: "n" | "s" | "e" | "w") => {
    bx(stone, x0, 0, z0, x1, 7.5, z1, 3); gableRoof(b, roof, stone, x0, x1, z0, z1, 7.5, 2.2, 0.3);
    const along = face === "n" || face === "s", len = along ? x1 - x0 : z1 - z0;
    for (let k = 0; k < Math.floor(len / 3); k++) for (const y of [1.2, 4.4]) {
      const c = (along ? x0 : z0) + 1.5 + k * 3, w = 1.1, h = 2.2;
      if (face === "s") bx(win, c - w / 2, y, z1, c + w / 2, y + h, z1 + 0.05, 1);
      if (face === "n") bx(win, c - w / 2, y, z0 - 0.05, c + w / 2, y + h, z0, 1);
      if (face === "e") bx(win, x1, y, c - w / 2, x1 + 0.05, y + h, c + w / 2, 1);
      if (face === "w") bx(win, x0 - 0.05, y, c - w / 2, x0, y + h, c + w / 2, 1);
    }
    for (let k = 0; k < Math.floor(len / 1.2); k++) { const c = (along ? x0 : z0) + 0.3 + k * 1.2;   // battlements
      if (along) bx(stoneD, c, 7.5, face === "s" ? z1 - 0.4 : z0, c + 0.6, 8.1, face === "s" ? z1 : z0 + 0.4, 1);
      else bx(stoneD, face === "e" ? x1 - 0.4 : x0, 7.5, c, face === "e" ? x1 : x0 + 0.4, 8.1, c + 0.6, 1); }
  };
  range(-16, -2.2, GATE_Z - 6, GATE_Z, "s"); range(2.2, 16, GATE_Z - 6, GATE_Z, "s");     // the gate range, either side of the gate
  range(-22, -15, -14, 15, "e"); range(15, 22, -14, 15, "w");                             // west and east ranges
  range(-16, 16, 15, 21, "n");                                                            // the south range (behind the camera)
  // the Great Gate: a tower with an arch, four turrets, a statue niche, the gates open
  { const z0 = GATE_Z - 6.5, z1 = GATE_Z + 0.4;
    bx(stone, -2.2, 3.4, z0, 2.2, 10.5, z1, 3); for (const s of [-1, 1]) { bx(stone, s * 1.85 - 0.35, 0, z0, s * 1.85 + 0.35, 3.4, z1, 2); bx(stoneD, s * 1.55 - 0.05, 2.6, z1, s * 1.55 + 0.05, 3.4, z1 + 0.1, 1); }   // piers, a 3 m arch
    for (const sx of [-1, 1]) for (const sz of [0, 1]) { const x = sx * 2.4, z = sz ? z1 - 0.3 : z0 + 0.3; b.add(new THREE.CylinderGeometry(0.55, 0.6, 12.6, 8).translate(x, 6.3, z), stoneD); b.add(new THREE.ConeGeometry(0.7, 1.3, 8).translate(x, 13.2, z), roof); }
    bx(win, -0.6, 6.5, z1, 0.6, 8.6, z1 + 0.05, 1);
    for (const s of [-1, 1]) bx(woodD, s * 1.45 - 0.06, 0, z1 - 1.6, s * 1.45 + 0.06, 3.0, z1 - 0.2, 1);   // the open gate leaves, folded back
    ground(b, gravel, -1.4, 1.4, z0 - 6, z1, 0.03, 4); }
  // the fountain (an octagonal stone basin with a canopy), flower beds, lamp posts
  { const f = FOUNTAIN; b.add(new THREE.CylinderGeometry(2.0, 2.1, 0.6, 8).translate(f.x, 0.3, f.z), stone); b.add(new THREE.CylinderGeometry(1.8, 1.8, 0.05, 8).translate(f.x, 0.58, f.z), lam("byWater", () => ({ color: "#7ab4d8" })));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.add(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 6).translate(f.x + Math.cos(a) * 1.3, 1.6, f.z + Math.sin(a) * 1.3), stoneD); }
    b.add(new THREE.ConeGeometry(1.8, 1.4, 8).translate(f.x, 3.6, f.z), roof); }
  for (const [x, z] of [[-8, 1.8], [8, 1.8], [-8, -6], [8, -6]]) { bx(iron, x - 0.05, 0, z - 0.05, x + 0.05, 2.9, z + 0.05, 1); lamps.push({ p: V(x, 3.0, z), k: 0.6 }); }
  const flowers = lam("byFlowers", () => ({ color: "#e06a8a" })), flowers2 = lam("byFlowers2", () => ({ color: "#f2c44a" }));
  for (let i = 0; i < 70; i++) { const side = i % 2 ? 1 : -1, x = side * (13.2 + r() * 1.2), z = -12 + r() * 25; b.add(new THREE.SphereGeometry(0.16, 6, 5).translate(x, 0.18, z), i % 3 ? flowers : flowers2); }
  for (let i = 0; i < 24; i++) add(["tree_oak", "tree_default", "tree_fat"][i % 3], -40 + (i % 8) * 11, 0, -32 - Math.floor(i / 8) * 9, 5 + r() * 2, r() * 6);   // trees beyond the gate
  // the porter's lodge door, a bench, the NO DOGS sign (pops up on "no"), the bear's wagon, the exam desk
  { const l = LODGE; bx(woodD, l.x - 0.6, 0, GATE_Z, l.x + 0.6, 2.4, GATE_Z + 0.08, 1); bx(red, l.x - 0.7, 2.5, GATE_Z, l.x + 0.7, 2.9, GATE_Z + 0.12, 1);
    lamps.push({ p: V(l.x + 1.0, 2.5, GATE_Z + 0.5), k: 0.7 });
    bx(woodD, l.x + 1.4, 0.45, GATE_Z + 0.6, l.x + 3.0, 0.52, GATE_Z + 1.0, 1); }
  b.build(R);

  const sg = new THREE.Group(); { const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.1), twoTone(new THREE.MeshLambertMaterial({ color: "#7a4a2a" }))); post.position.y = 0.8; sg.add(post);
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.55), twoTone(new THREE.MeshLambertMaterial({ map: sign("byNoDogs", "NO DOGS", "#f6efe0", "#c8302a"), side: THREE.DoubleSide }))); bd.position.y = 1.65; sg.add(bd);
    sg.position.set(LODGE.x + 1.35, 0, GATE_Z + 1.9); sg.traverse((o) => { o.userData.noGuard = true; const me = o as THREE.Mesh; if (me.isMesh) me.castShadow = true; }); R.add(sg); }
  const wagon = new THREE.Group(); { const wm = twoTone(new THREE.MeshLambertMaterial({ color: "#d8544a" })), ym = twoTone(new THREE.MeshLambertMaterial({ color: "#f2c44a" })), bk = twoTone(new THREE.MeshLambertMaterial({ color: "#2a2a30" }));
    const A = (geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number]) => { const me = new THREE.Mesh(geo, m); me.position.set(...p); me.castShadow = me.receiveShadow = true; wagon.add(me); };
    A(new THREE.BoxGeometry(3.0, 0.2, 1.8), ym, [0, 0.7, 0]);
    for (let i = 0; i < 7; i++) A(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), bk, [-1.4 + i * 0.47, 1.5, 0.88]);                 // the cage bars (front)
    A(new THREE.BoxGeometry(3.0, 0.15, 1.8), wm, [0, 2.25, 0]); A(new THREE.BoxGeometry(3.0, 1.4, 0.06), wm, [0, 1.5, -0.9]);
    for (const s of [-1, 1]) A(new THREE.BoxGeometry(0.06, 1.4, 1.8), wm, [s * 1.5, 1.5, 0]);
    for (const x of [-1.0, 1.0]) for (const s of [-1, 1]) A(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 16).rotateX(Math.PI / 2), ym, [x, 0.45, s * 0.95]);
    const bn = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), twoTone(new THREE.MeshLambertMaterial({ map: sign("byFair", "TAME BEAR", "#f2c44a", "#a8261e", 1024, 200) }))); bn.position.set(0, 2.6, 0.9); wagon.add(bn);
    wagon.position.copy(WAGON); wagon.traverse((o) => { o.userData.noGuard = true; }); R.add(wagon); }
  const desk = new THREE.Group(); { const dm = twoTone(new THREE.MeshLambertMaterial({ color: "#8a5a32" })), pm = twoTone(new THREE.MeshLambertMaterial({ color: "#f6efe0" }));
    const A = (geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number]) => { const me = new THREE.Mesh(geo, m); me.position.set(...p); me.castShadow = me.receiveShadow = true; desk.add(me); };
    A(new THREE.BoxGeometry(1.4, 0.08, 0.8), dm, [0, 0.95, 0.75]); for (const sx of [-1, 1]) for (const sz of [0.45, 1.05]) A(new THREE.BoxGeometry(0.07, 0.95, 0.07), dm, [sx * 0.62, 0.475, sz]);
    A(new THREE.BoxGeometry(0.42, 0.02, 0.3), pm, [0.15, 1.0, 0.75]); A(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10), lam("byInk", () => ({ color: "#2a2a40" })), [-0.4, 1.03, 0.7]);
    desk.position.copy(DESK); desk.traverse((o) => { o.userData.noGuard = true; }); R.add(desk); }

  // ---- Byron's rooms: panelled walls, bookshelves, fireplace, windows onto the court, armchair; open to the sky ----
  { const rb = new Batch(), k = ROOMS, x0 = k.x - 5, x1 = k.x + 5, z0 = k.z - 4.2, z1 = k.z + 9, h = 3.4;   // the floor runs on past the camera (run 49: grass showed below the room)
    const RB = (mat: THREE.Material, a: number, y0: number, c: number, d: number, y1: number, e: number, t = 2) => rb.add(boxGeo(V(a, y0, c), V(d, y1, e), t), mat);
    const panel = lam("byPanelM", () => ({ map: rep(panelTex(), 1, 1) })), plaster = lam("byPlaster", () => ({ color: "#f2e2c0" }));
    ground(rb, lam("byRug", () => ({ map: ctex("byRugT", 256, 256, (g) => { g.fillStyle = "#b83a3a"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#f2c44a"; g.lineWidth = 10; g.strokeRect(20, 20, 216, 216); g.strokeRect(50, 50, 156, 156); }) })), k.x - 2.4, k.x + 2.4, k.z - 2.6, k.z + 1.4, 0.03, 4.8);
    ground(rb, lam("byFloor", () => ({ map: rep(planksHD(), 1, 1), color: "#d8a868" })), x0, x1, z0, z1, 0.02, 2.5);
    // back wall: panelling to 1.2 m, plaster above, two tall windows onto the sunny court
    RB(panel, x0, 0, z0 - 0.2, x1, 1.2, z0); RB(plaster, x0, 1.2, z0 - 0.2, x0 + 1.2, h, z0); RB(plaster, x0 + 2.8, 1.2, z0 - 0.2, x1 - 2.8, h, z0); RB(plaster, x1 - 1.2, 1.2, z0 - 0.2, x1, h, z0);
    for (const [a, c] of [[x0 + 1.2, x0 + 2.8], [x1 - 2.8, x1 - 1.2]]) { RB(plaster, a, 3.0, z0 - 0.2, c, h, z0); RB(woodD, a, 1.15, z0, c, 1.25, z0 + 0.15, 1); RB(woodD, (a + c) / 2 - 0.04, 1.2, z0 - 0.1, (a + c) / 2 + 0.04, 3.0, z0 - 0.05, 1); }
    RB(stone, x0 - 2, 0, z0 - 7, x1 + 2, 6, z0 - 5.5, 3);   // the court's far range, seen through the windows
    for (let q = 0; q < 5; q++) RB(win, x0 - 1 + q * 2.6, 1.4, z0 - 5.55, x0 + 0.1 + q * 2.6, 3.6, z0 - 5.5, 1);
    ground(rb, lawn, x0 - 2, x1 + 2, z0 - 5.5, z0 - 0.2, 0.01, 4);
    // side walls panelled, bookshelves left, fireplace right
    RB(panel, x0 - 0.2, 0, z0 - 0.2, x0, h, z1); RB(panel, x1, 0, z0 - 0.2, x1 + 0.2, h, z1);
    RB(woodD, x0, 0, z0 + 0.6, x0 + 0.45, 2.6, z0 + 3.2, 1);
    const bookCols = ["#c8302a", "#2a6a9a", "#e8b84a", "#3a8a4a", "#8a3a8a", "#e07a3a"];
    for (let sh = 0; sh < 4; sh++) for (let i = 0; i < 12; i++) { const bm = lam("byBook" + (i % 6), () => ({ color: bookCols[i % 6] })); RB(bm, x0 + 0.45, 0.25 + sh * 0.6, z0 + 0.7 + i * 0.2, x0 + 0.5, 0.25 + sh * 0.6 + 0.4 + (i % 3) * 0.05, z0 + 0.86 + i * 0.2, 1); }
    RB(stone, x1 - 0.5, 0, z0 + 1.0, x1, 1.6, z0 + 2.8, 1); RB(lam("byHearth", () => ({ color: "#3a2a24" })), x1 - 0.52, 0.1, z0 + 1.5, x1 - 0.45, 1.0, z0 + 2.3, 1); RB(woodD, x1 - 0.65, 1.6, z0 + 0.9, x1, 1.72, z0 + 2.9, 1);
    lamps.push({ p: V(x1 - 0.8, 0.6, z0 + 1.9), k: 1.0 });   // the fire
    // the armchair (red), a side table with a lamp, Byron's writing desk under the window
    const a = ARMCHAIR, chair = lam("byChair", () => ({ color: "#c84a3a" }));
    RB(chair, a.x - 0.55, 0, a.z - 0.45, a.x + 0.55, 0.45, a.z + 0.45, 1); RB(chair, a.x - 0.55, 0.45, a.z - 0.45, a.x + 0.55, 1.2, a.z - 0.25, 1);
    for (const s of [-1, 1]) RB(chair, a.x + s * 0.55 - 0.12, 0.45, a.z - 0.45, a.x + s * 0.55 + 0.12, 0.75, a.z + 0.45, 1);
    RB(woodD, a.x + 0.9, 0, a.z - 0.25, a.x + 1.4, 0.7, a.z + 0.25, 1); rb.add(new THREE.CylinderGeometry(0.12, 0.18, 0.5, 12).translate(a.x + 1.15, 0.95, a.z), lam("byShade", () => ({ color: "#f6d890" })));
    lamps.push({ p: V(a.x + 1.15, 1.05, a.z), k: 1.0 }, { p: V(k.x - 1.6, 2.2, k.z - 1.0), k: 0.8 });
    RB(woodD, x0 + 1.4, 0.75, z0 + 0.3, x0 + 2.8, 0.82, z0 + 1.0, 1); for (const sx of [x0 + 1.45, x0 + 2.7]) RB(woodD, sx, 0, z0 + 0.35, sx + 0.06, 0.75, z0 + 0.95, 1);
    rb.add(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 10).translate(x0 + 1.7, 0.97, z0 + 0.6), gold);
    rb.build(R); }
  return { lamps, sign: sg, wagon, desk };
}
export const SET_KIT = ["tree_oak", "tree_default", "tree_fat"];
