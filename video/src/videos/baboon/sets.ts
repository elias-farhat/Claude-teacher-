// The sets of "The Baboon Who Ran the Railway": Uitenhage station (the line, the platform, the station house with its
// veranda and name board, the signal box with its lever frame and the semaphore signal, the town and the hills
// behind), the open line through the veldt (a freight train rolling east), the market square with the stalls and the
// ox cart. Moving parts (levers, semaphore arm, freight train, passenger train, trolley) are returned for world.ts.
// Kenney props mid/background only; nothing tall between the camera's usual (south) side and a face.
import * as THREE from "three";
import { Batch, lam, V, Kit, boxGeo } from "../bridge/build";
import { rep, cobbleHD, grassHD, planksHD, roofHD, ctex } from "../bridge/paint";
import { ground, gableRoof, Lamp, colonialFacade } from "../rats/hanoi";
import { twoTone } from "../bridge/shade";
import { PLAT, BOX, LEVER, HOUSE, LINE, MARKET, RAIL_Z, CHAIR } from "./layout";

export type Train = { group: THREE.Group; length: number };
export type Sets = { lamps: Lamp[]; levers: THREE.Group[]; arm: THREE.Object3D; freight: Train; passenger: Train; trolley: THREE.Group };
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const M = (c: string) => twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(c) }));

/** steam locomotive + tender (black boiler, red buffer beam, brass dome, big cab), front at x = 0, built toward -x */
const loco = (b: Batch) => {
  const black = lam("bbLoco", () => ({ color: "#2a2a33" })), red = lam("bbRed", () => ({ color: "#b8382e" })), brass = lam("bbBrass", () => ({ color: "#d9a43a" })), wheel = lam("bbWheel", () => ({ color: "#8a2a24" }));
  const bx = (m: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), m);
  bx(black, -9, 1.0, -1.3, 0, 1.6, 1.3);                                                                   // frame
  b.add(new THREE.CylinderGeometry(1.05, 1.05, 6, 20).rotateZ(Math.PI / 2), black, new THREE.Matrix4().makeTranslation(-3.2, 2.65, 0));   // boiler
  b.add(new THREE.CylinderGeometry(0.32, 0.5, 1.6, 14), black, new THREE.Matrix4().makeTranslation(-0.8, 4.3, 0));      // chimney (wide top)
  b.add(new THREE.CylinderGeometry(0.62, 0.38, 0.3, 14), black, new THREE.Matrix4().makeTranslation(-0.8, 5.15, 0));
  b.add(new THREE.SphereGeometry(0.5, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), brass, new THREE.Matrix4().makeTranslation(-3.4, 3.6, 0));   // dome
  bx(black, -9, 1.6, -1.5, -6.2, 4.6, 1.5); bx(red, -9.2, 4.6, -1.7, -6.0, 4.85, 1.7);                     // cab + roof
  bx(red, -0.1, 0.7, -1.45, 0.35, 1.5, 1.45);                                                              // buffer beam
  b.add(new THREE.ConeGeometry(1.2, 1.0, 4, 1).rotateZ(-Math.PI / 2).rotateX(Math.PI / 4).scale(0.6, 1, 1), red, new THREE.Matrix4().makeTranslation(0.55, 0.55, 0));   // cowcatcher
  for (const wx of [-2, -4.4, -6.8]) for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.85, 0.85, 0.25, 18).rotateX(Math.PI / 2), wheel, new THREE.Matrix4().makeTranslation(wx, 0.9, s * 1.3));
  bx(black, -14.6, 0.9, -1.4, -9.4, 3.0, 1.4); bx(lam("bbCoal", () => ({ color: "#1a1a1e" })), -14.4, 3.0, -1.2, -9.6, 3.35, 1.2);   // tender with coal
  for (const wx of [-10.8, -13.2]) for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.5, 0.5, 0.22, 14).rotateX(Math.PI / 2), wheel, new THREE.Matrix4().makeTranslation(wx, 0.55, s * 1.3));
  return -15.2;
};
/** a car from x0 to x1 (x1 > x0): "box" = a red-brown goods van with a flat roof at 3.1 m; "coach" = a green passenger
 *  coach with windows and an open end balcony at its east end (floor 1.2 m) */
const car = (b: Batch, kind: "box" | "coach", x0: number, x1: number) => {
  const wheel = lam("bbWheel", () => ({ color: "#8a2a24" })), dark = lam("bbUnder", () => ({ color: "#2a2422" }));
  const bx = (m: THREE.Material, a0: number, y0: number, z0: number, a1: number, y1: number, z1: number) => b.add(boxGeo(V(a0, y0, z0), V(a1, y1, z1)), m);
  bx(dark, x0, 0.8, -1.2, x1, 1.15, 1.2);
  for (const wx of [x0 + 1.3, x1 - 1.3]) for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.5, 0.5, 0.22, 14).rotateX(Math.PI / 2), wheel, new THREE.Matrix4().makeTranslation(wx, 0.55, s * 1.25));
  if (kind === "box") {
    const van = lam("bbVan", () => ({ map: ctex("bbVanTex", 512, 256, (g) => { g.fillStyle = "#8a3a2a"; g.fillRect(0, 0, 512, 256); g.strokeStyle = "#5a2418"; g.lineWidth = 5; for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } g.fillStyle = "#f2e6c8"; g.font = "bold 40px serif"; g.textAlign = "center"; g.fillText("C.G.R.", 256, 140); }) }));
    bx(van, x0, 1.15, -1.3, x1, 3.0, 1.3); bx(lam("bbVanRoof", () => ({ color: "#5a4a42" })), x0 - 0.1, 3.0, -1.4, x1 + 0.1, 3.12, 1.4);
  } else {
    const coach = lam("bbCoach", () => ({ map: ctex("bbCoachTex", 512, 256, (g) => { g.fillStyle = "#2f5a3a"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#d9b45a"; g.fillRect(0, 40, 512, 6); g.fillRect(0, 210, 512, 6);
      for (let x = 30; x < 500; x += 70) { g.fillStyle = "#f6e2b0"; g.fillRect(x, 70, 44, 60); g.fillStyle = "#5a3a2a"; g.fillRect(x + 21, 70, 3, 60); } }) }));
    const bal = 1.5;
    bx(coach, x0, 1.15, -1.3, x1 - bal, 3.2, 1.3);
    b.add(new THREE.CylinderGeometry(1.6, 1.6, x1 - x0, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.32, 0.9), lam("bbCoachRoof", () => ({ color: "#4a4652" })), new THREE.Matrix4().makeTranslation((x0 + x1) / 2, 3.2, 0));
    bx(lam("bbBalc", () => ({ color: "#6a4a32" })), x1 - bal, 1.15, -1.3, x1, 1.22, 1.3);                                  // balcony floor
    for (const z of [-1.25, 1.25]) bx(lam("bbRail", () => ({ color: "#2a2a30" })), x1 - bal, 1.22, z - 0.03, x1, 1.95, z + 0.03);   // side railings (low)
    for (const z of [-1.25, 1.25]) bx(lam("bbRail", () => ({ color: "#2a2a30" })), x1 - 0.06, 1.22, z - 0.03, x1, 3.2, z + 0.03);   // corner posts
  }
};

export function buildSets(R: THREE.Group, kit: Kit): Sets {
  const b = new Batch(), r = rng(1881), lamps: Lamp[] = [];
  const bx = (mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 2.5) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile), mat);
  const add = (name: string, x: number, y: number, z: number, s: number, rot = 0) => {
    const o = kit[name]; if (!o) return;
    b.addObject(o, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), V(s, s, s)));
  };
  const wood = lam("bbWood", () => ({ map: rep(planksHD(), 1, 1), color: "#a8805a" }));
  const woodD = lam("bbWoodD", () => ({ color: "#6a4a32" }));
  const white = lam("bbWhite", () => ({ color: "#f2ead8" }));
  const iron = lam("bbIron", () => ({ color: "#3a3a42" }));
  const tin = lam("bbTin", () => ({ map: rep(roofHD("#8a9aa0", true), 3, 3) }));
  const grass = lam("bbGrass", () => ({ map: grassHD(), color: "#c2b070" }));          // dry Cape veldt
  const dirt = lam("bbDirt", () => ({ map: cobbleHD(), color: "#c9a878" }));
  const ballast = lam("bbBallast", () => ({ map: rep(ctex("bbBallastTex", 256, 256, (g, rr) => { g.fillStyle = "#8a7a6a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rr() > 0.5 ? "60,50,44" : "190,176,160"},0.5)`; g.fillRect(rr() * 256, rr() * 256, 3 + rr() * 4, 3 + rr() * 4); } }), 1, 1) }));
  const lampPost = (x: number, z: number, y = 0) => { b.add(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8).translate(x, y + 1.6, z), iron); bx(iron, x - 0.22, y + 3.2, z - 0.22, x + 0.22, y + 3.25, z + 0.22, 1); bx(lam("bbLampGlass", () => ({ color: "#f6e2a8" })), x - 0.16, y + 2.85, z - 0.16, x + 0.16, y + 3.2, z + 0.16, 1); lamps.push({ p: V(x, y + 3.0, z), k: 0.7 }); };
  const hills = (cx: number, cz: number, n: number, spread: number, dist: number) => {   // low painted hills on the horizon (behind everything)
    const hm = lam("bbHill", () => ({ map: grassHD(), color: "#9aa070" }));
    for (let i = 0; i < n; i++) { const x = cx + (i / (n - 1) - 0.5) * spread, z = cz - dist - r() * 60, s = 40 + r() * 50; b.add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(s * 1.6, s * 0.45, s), hm, new THREE.Matrix4().makeTranslation(x, -2, z)); }
  };
  const trees = (cx: number, cz: number, n: number, rx: number, rz0: number, rz1: number) => {
    const names = ["tree_fat", "tree_default", "tree-crooked", "tree_detailed"];
    for (let i = 0; i < n; i++) add(names[i % 4], cx + (r() - 0.5) * 2 * rx, 0, cz + rz0 + r() * (rz1 - rz0), 3 + r() * 2.5, r() * 6);
  };

  // ---- the ground: veldt everywhere, the line with its ballast, rails and sleepers from the market road to the open line ----
  ground(b, grass, -900, 900, -500, 500, -0.02, 12);
  bx(ballast, -260, -0.02, RAIL_Z - 1.8, 760, 0.12, RAIL_Z + 1.8, 2);
  for (let x = -260; x < 760; x += 0.9) bx(woodD, x, 0.12, RAIL_Z - 1.25, x + 0.28, 0.2, RAIL_Z + 1.25, 1);
  for (const s of [-1, 1]) bx(iron, -260, 0.2, RAIL_Z + s * 0.75 - 0.05, 760, 0.34, RAIL_Z + s * 0.75 + 0.05, 1);

  // ---- Uitenhage station: the platform, the station house with a veranda, the name board, lamps, benches ----
  { const { x0, x1, z0, z1, h } = PLAT;
    bx(lam("bbPlatEdge", () => ({ color: "#b8aa94" })), x0, 0, z0, x1, h, z0 + 0.4, 1);
    bx(wood, x0, 0, z0 + 0.4, x1, h, z1, 2);
    const H = HOUSE;
    const facade = lam("bbFacade", () => ({ map: colonialFacade(3, H.x1 - H.x0, 4.4) }));
    bx(white, H.x0, h, H.z0, H.x1, h + 4.4, H.z1); b.add(new THREE.PlaneGeometry(H.x1 - H.x0, 4.4).translate((H.x0 + H.x1) / 2, h + 2.2, H.z0 - 0.01).rotateY(0), facade);
    gableRoof(b, tin, white, H.x0 - 0.4, H.x1 + 0.4, H.z0 - 0.4, H.z1 + 0.4, h + 4.4, 2.2, 0.4);
    // veranda: posts along the platform and a tin roof sloping toward the track (high, behind the faces)
    for (let x = H.x0; x <= H.x1; x += 3) b.add(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 8).translate(x, h + 1.8, H.z0 - 2.6), white);
    b.add(new THREE.BoxGeometry(H.x1 - H.x0 + 1, 0.08, 3.0).rotateX(-0.12).translate((H.x0 + H.x1) / 2, h + 3.75, H.z0 - 1.3), tin);
    const board = lam("bbBoard", () => ({ map: ctex("bbBoardTex", 512, 96, (g) => { g.fillStyle = "#f2ead8"; g.fillRect(0, 0, 512, 96); g.strokeStyle = "#1e2a44"; g.lineWidth = 10; g.strokeRect(5, 5, 502, 86); g.fillStyle = "#1e2a44"; g.font = "900 58px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("UITENHAGE", 256, 52); }) }));
    for (const bxp of [-6, 18]) { for (const dx of [-1.6, 1.6]) bx(iron, bxp + dx - 0.05, h, z0 + 0.5, bxp + dx + 0.05, h + 2.6, z0 + 0.6, 1); b.add(new THREE.PlaneGeometry(3.6, 0.7).rotateY(Math.PI).translate(bxp, h + 2.6, z0 + 0.45), board); b.add(new THREE.PlaneGeometry(3.6, 0.7).translate(bxp, h + 2.6, z0 + 0.65), board); }
    for (const x of [-12, -4, 4, 12, 20]) lampPost(x, z0 + 0.8, h);   // on the track edge: behind the cast from the camera (south) side
    for (const [n, x, z, s, ro] of [["bench", 2, H.z0 - 0.8, 1.6, Math.PI], ["bench", 9, H.z0 - 0.8, 1.6, Math.PI], ["barrel", 16, H.z0 - 0.7, 0.7, 0], ["crate", 17.2, H.z0 - 0.9, 1.0, 0.3], ["box-large", -2, H.z0 - 0.9, 0.9, 0]] as [string, number, number, number, number][]) add(n, x, h, z, s, ro);
    // a water tower and a goods shed further along (mid / background)
    b.add(new THREE.CylinderGeometry(2.2, 2.2, 3, 16).translate(36, 7.5, 6), wood); for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) b.add(new THREE.CylinderGeometry(0.12, 0.12, 6, 6).translate(36 + dx, 3, 6 + dz), woodD);
    bx(wood, -48, 0, 6, -32, 5, 16); gableRoof(b, tin, wood, -48.4, -31.6, 5.6, 16.4, 5, 2, 0.4); }

  // ---- the signal box: a wooden hut on the platform's west end, open to the south, its big back window over the line ----
  { const { x, z, w, d, floor } = BOX, x0 = x - w / 2, x1 = x + w / 2, zN = z - d / 2, zS = z + d / 2, H = 2.9;
    bx(wood, x0, floor, zN, x1, floor + 0.05, zS, 1);                                         // floor
    bx(wood, x0, floor, zN, x1, floor + 0.9, zN + 0.12, 1); bx(wood, x0, floor + 2.3, zN, x1, floor + H, zN + 0.12, 1);   // back wall round the window
    for (const xx of [x0, x - 0.05, x1 - 0.12]) bx(woodD, xx, floor + 0.9, zN, xx + 0.12, floor + 2.3, zN + 0.12, 1);   // window mullions
    bx(lam("bbSill", () => ({ color: "#f2ead8" })), x0, floor + 0.88, zN - 0.05, x1, floor + 0.95, zN + 0.25, 1);
    for (const xx of [x0, x1 - 0.12]) bx(wood, xx, floor, zN, xx + 0.12, floor + H, zS - 0.9, 1);   // side walls (stop short of the open front)
    for (const xx of [x0, x1 - 0.12]) bx(white, xx - 0.02, floor, zS - 0.9, xx + 0.14, floor + H, zS - 0.75, 1);   // corner posts
    gableRoof(b, lam("bbBoxRoof", () => ({ map: rep(roofHD("#a83a2e"), 2, 2) })), wood, x0 - 0.4, x1 + 0.4, zN - 0.4, zS - 0.5, floor + H, 1.0, 0.3);
    // the lever frame: an iron bed across the box, slots for 4 levers (the levers themselves move: below)
    bx(iron, x - 1.45, floor, LEVER(0).z - 0.22, x + 1.45, floor + 0.28, LEVER(0).z + 0.22, 1);
    // Jumper's chair, a crate for his feet, a wall clock, a lamp
    bx(woodD, CHAIR.x - 0.3, floor, CHAIR.z - 0.3, CHAIR.x + 0.3, floor + 0.42, CHAIR.z + 0.3, 1); bx(woodD, CHAIR.x - 0.3, floor + 0.42, CHAIR.z - 0.32, CHAIR.x + 0.3, floor + 1.05, CHAIR.z - 0.26, 1);
    add("crate", CHAIR.x + 0.05, floor, CHAIR.z + 0.8, 0.8, 0.2);
    b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 20).rotateX(Math.PI / 2).translate(x1 - 0.7, floor + 2.55, zN + 0.16), white);
    lamps.push({ p: V(x0 + 0.5, floor + 2.4, zN + 0.5), k: 0.8 }); bx(iron, x0 + 0.42, floor + 2.3, zN + 0.42, x0 + 0.58, floor + 2.6, zN + 0.58, 1);
    // the semaphore signal post beside the box (its arm moves with lever 0)
    bx(white, x - 3.6, 0, RAIL_Z + 2.0, x - 3.4, 6.5, RAIL_Z + 2.2, 1); }
  const arm = new THREE.Group(); { const blade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.05).translate(0.75, 0, 0), M("#c8302a")); blade.castShadow = true; arm.add(blade);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.29, 0.055).translate(1.2, 0, 0), M("#f2ead8")); arm.add(band); arm.position.set(BOX.x - 3.4, 6.1, RAIL_Z + 2.25); R.add(arm); }
  // the town behind the station (background)
  const houses = ["building-sample-house-a", "building-sample-house-b", "building-sample-house-c"];
  for (let x = -70; x <= 80; x += 9) add(houses[Math.floor(r() * 3)], x + r() * 3, 0, 30 + r() * 10, 3.0, Math.PI + (r() - 0.5) * 0.3);
  for (let x = -90; x <= 90; x += 11) add(houses[Math.floor(r() * 3)], x, 0, -34 - r() * 8, 3.0, (r() - 0.5) * 0.3);
  trees(0, 0, 26, 90, -30, -12); trees(0, 0, 18, 90, 20, 45);
  hills(0, 0, 9, 600, 160); hills(0, 250, 7, 600, -60);

  // ---- the open line: the veldt, thorn trees, rocks, hills ----
  { trees(LINE.x, 0, 40, 160, -60, -8); trees(LINE.x, 0, 30, 160, 10, 60);
    for (let i = 0; i < 24; i++) add(["rock_largeA", "rock_largeC", "rock_tallB", "rocks"][i % 4], LINE.x + (r() - 0.5) * 300, 0, (r() > 0.5 ? 1 : -1) * (8 + r() * 40), 1.5 + r() * 2, r() * 6);
    hills(LINE.x, 0, 9, 700, 140); hills(LINE.x, 250, 7, 700, -40); }

  // ---- the market square: dirt ground, stalls in a ring, barrels and crates, houses round it, the ox cart ----
  { const m0 = MARKET;
    ground(b, dirt, m0.x - 40, m0.x + 40, m0.z - 40, m0.z + 40, 0.0, 6);
    const stalls = ["stall-red", "stall-green", "stall", "stall-red", "stall-green"];
    for (let i = 0; i < 10; i++) { const a = -Math.PI * 0.95 + (i / 9) * Math.PI * 0.9, d = 11; add(stalls[i % 5], m0.x + Math.cos(a) * d * 1.3, 0, m0.z + Math.sin(a) * d, 2.4, -a - Math.PI / 2); }
    for (let i = 0; i < 12; i++) add(["barrel", "crate", "crate-bottles", "box-small"][i % 4], m0.x + (r() - 0.5) * 30, 0, m0.z - 6 - r() * 10, 0.8 + r() * 0.3, r() * 6);
    for (let x = -36; x <= 36; x += 8) add(houses[Math.floor(r() * 3)], m0.x + x, 0, m0.z - 22 - r() * 4, 3.2, (r() - 0.5) * 0.2);
    for (let x = -36; x <= 36; x += 8) add(houses[Math.floor(r() * 3)], m0.x + x, 0, m0.z + 30, 3.2, Math.PI);
    trees(m0.x, 0, 14, 60, -40, -28);
    // the ox cart (facing east): the Kenney cart behind a big brown ox with horns
    add("cart", m0.x - 1.6, 0, m0.z, 2.6, Math.PI / 2);
    const ox = lam("bbOx", () => ({ color: "#7a4a2a" })), horn = lam("bbHorn", () => ({ color: "#f2e6c8" })), ink = lam("bbInk", () => ({ color: "#1e1a1a" }));
    const o = V(m0.x + 1.6, 0, m0.z);
    b.add(new THREE.CapsuleGeometry(0.55, 1.3, 8, 16).rotateZ(Math.PI / 2), ox, new THREE.Matrix4().makeTranslation(o.x, 1.25, o.z));
    b.add(new THREE.SphereGeometry(0.38, 16, 12).scale(1.2, 0.95, 0.9), ox, new THREE.Matrix4().makeTranslation(o.x + 1.35, 1.45, o.z));
    b.add(new THREE.SphereGeometry(0.24, 12, 10).scale(1, 0.8, 1.1), lam("bbOxNose", () => ({ color: "#c98a6a" })), new THREE.Matrix4().makeTranslation(o.x + 1.72, 1.32, o.z));
    for (const s of [-1, 1]) { b.add(new THREE.ConeGeometry(0.07, 0.6, 8).rotateX(s * 1.2), horn, new THREE.Matrix4().makeTranslation(o.x + 1.25, 1.85, o.z + s * 0.38));
      b.add(new THREE.SphereGeometry(0.05, 8, 6), ink, new THREE.Matrix4().makeTranslation(o.x + 1.62, 1.55, o.z + s * 0.22)); }
    for (const [dx, dz] of [[-0.55, -0.3], [-0.55, 0.3], [0.55, -0.3], [0.55, 0.3]]) b.add(new THREE.CylinderGeometry(0.11, 0.09, 0.95, 8), ox, new THREE.Matrix4().makeTranslation(o.x + dx, 0.48, o.z + dz));
    b.add(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6).rotateX(Math.PI / 2), woodD, new THREE.Matrix4().makeTranslation(o.x + 0.9, 1.75, o.z));   // yoke
    lamps.push({ p: V(m0.x, 3.5, m0.z + 4), k: 0.4 }); }
  b.build(R);

  // ---- moving parts ----
  const levers: THREE.Group[] = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group(), col = ["#c8302a", "#c8302a", "#2a5aa8", "#2a2a30"][i];
    // shorter levers: the grip sits at Jack's chest, below his muzzle, even when pulled (it covered his face at 39 s / 50 s)
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.46, 8).translate(0, 0.23, 0), M(col)); rod.castShadow = true; g.add(rod);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 10).translate(0, 0.44, 0), M("#d9d9d9")); g.add(grip);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.02).translate(0, 0.26, 0.04), M("#f2ead8")); g.add(tag);
    g.position.copy(LEVER(i)).add(V(0, 0.28, 0)); R.add(g); levers.push(g);
  }
  const mkTrain = (cars: ("box" | "coach")[], gap: number): Train => {
    const tb = new Batch(), g = new THREE.Group();
    let x = loco(tb);
    for (const c of cars) { const x1 = x - gap, x0 = x1 - 7.5; car(tb, c, x0, x1); x = x0; }
    tb.build(g); R.add(g); return { group: g, length: -x };
  };
  const freight = mkTrain(["box", "box", "box", "box", "box"], 1.4);
  const passenger = mkTrain(["coach", "coach"], 0.9);
  const trolley = new THREE.Group(); { const tb = new Batch();
    tb.add(boxGeo(V(-0.9, 0.42, -0.85), V(0.9, 0.52, 0.85), 1), wood);
    for (const wx of [-0.6, 0.6]) for (const s of [-1, 1]) tb.add(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 14).rotateX(Math.PI / 2), iron, new THREE.Matrix4().makeTranslation(wx, 0.4, s * 0.75));
    tb.add(boxGeo(V(-1.0, 0.52, -0.6), V(-0.92, 1.1, 0.6), 1), woodD);          // the push bar at the back (west end)
    tb.build(trolley); R.add(trolley); }
  return { lamps, levers, arm, freight, passenger, trolley };
}
export const SET_KIT = ["building-sample-house-a", "building-sample-house-b", "building-sample-house-c", "cart", "barrel", "crate", "crate-bottles", "box-large", "box-small", "bench",
  "stall-red", "stall-green", "stall", "tree_fat", "tree_default", "tree-crooked", "tree_detailed", "rock_largeA", "rock_largeC", "rock_tallB", "rocks"];
