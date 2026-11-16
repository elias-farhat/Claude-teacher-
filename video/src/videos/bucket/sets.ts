// The sets of "The War of the Bucket": the Zappolino plain with its road, Modena and Bologna (stone walls with
// crenellations, corner towers, a Kenney gate in each, Kenney houses inside), the town wells, the Ghirlandina with
// the tower room (line 11), Monteveglio's hill and castle, Modena's ridge, Bologna's 32,000 (one instanced crowd),
// trees / tents / siege engines / carts / flags as mid- and background dressing, stars for the night.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, lam, V, Kit, boxGeo } from "../bridge/build";
import { rep, stoneHD, cobbleHD, grassHD, planksHD, roofHD, ctex } from "../bridge/paint";
import { ground, Lamp } from "../rats/hanoi";
import { MODENA, BOLOGNA, Town, GATE_W, ROAD, WELL_MID, WELL_B, WELL_OUT, LORDS, RIDGE, ARMY, HILL, CASTLE, TOWER, ROOM_Y, ROOM_H, PIAZZA_M, CLASH } from "./layout";

export type Sets = { lamps: Lamp[]; stars: THREE.Points; buckets: THREE.Group[]; army: THREE.InstancedMesh };
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

const dirtTex = () => ctex("bkDirt", 512, 512, (g, r) => { g.fillStyle = "#b39a76"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 2500; i++) { g.fillStyle = ["#a68c68", "#c2a984", "#9c8462"][i % 3]; g.fillRect(r() * 512, r() * 512, 3, 3); } });

/** a wooden bucket (the star of the film): staves, two iron hoops, a rope handle; ~0.36 m tall */
export const bucketMesh = () => {
  const g = new THREE.Group(), wood = lam("bkBucketWood", () => ({ color: "#9a6a3e" })), iron = lam("bkBucketIron", () => ({ color: "#3a3a42" }));
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.36, 18, 1, true), wood); body.position.y = 0.18; g.add(body);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.16, 18).rotateX(-Math.PI / 2), wood); bottom.position.y = 0.01; g.add(bottom);
  for (const y of [0.07, 0.29]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.17 + y * 0.11, 0.012, 6, 24).rotateX(Math.PI / 2), iron); h.position.y = y; g.add(h); }
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 20, Math.PI), iron); handle.position.y = 0.36; g.add(handle);
  g.traverse((m) => { const me = m as THREE.Mesh; if (me.isMesh) { me.castShadow = true; me.receiveShadow = true; } });
  return g;
};

export function buildSets(R: THREE.Group, kit: Kit): Sets {
  const b = new Batch(), r = rng(1325), lamps: Lamp[] = [];
  const stone = lam("bkStone", () => ({ map: rep(stoneHD("bkStone", ["#c9b89e", "#bfae94", "#d2c2a8", "#b5a48a"], "#8f806c"), 1, 1) }));
  const stoneDark = lam("bkStoneD", () => ({ map: rep(stoneHD("bkStoneD", ["#a8987f", "#9f8f77", "#b0a088", "#968670"], "#776a58"), 1, 1) }));
  const towerM = lam("bkTowerM", () => ({ map: rep(stoneHD("bkStoneD", ["#a8987f", "#9f8f77", "#b0a088", "#968670"], "#776a58"), 5, 4) }));
  const grass = lam("bkGrass", () => ({ map: grassHD(), color: "#a9b48c" }));
  const dirt = lam("bkDirtM", () => ({ map: rep(dirtTex(), 6, 6), color: "#b9a888" }));
  const cobble = lam("bkCobble", () => ({ map: cobbleHD(), color: "#a39588" }));
  const wood = lam("bkWood", () => ({ map: rep(planksHD(), 1, 1), color: "#a88f72" }));
  const roofT = lam("bkRoofT", () => ({ map: rep(roofHD("#b5583a"), 2, 2) }));
  const bx = (mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), 2.5), mat);
  const hillG = lam("bkHill", () => ({ map: rep(grassHD(), 14, 3), color: "#a9b48c" }));
  const add = (name: string, x: number, y: number, z: number, s: number, rot = 0) => {
    const o = kit[name]; if (!o) return;
    b.addObject(o, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), V(s, s, s)));
  };

  // ---- the plain, the road ----
  ground(b, grass, -320, 320, -320, 320, 0, 10);
  ground(b, dirt, ROAD.x0 - 2, ROAD.x1 + 2, -ROAD.w / 2, ROAD.w / 2, 0.02, 6);
  // ---- the two towns ----
  const town = (T: Town, side: 1 | -1, seed: number) => {
    const rr = rng(seed);
    ground(b, cobble, T.x0, T.x1, T.z0, T.z1, 0.03, 6);
    const H = T.wallH, t = 1.4;
    // walls (the gate wall leaves a gap of GATE_W at the gate), merlons every 1.6 m along the top
    // merlons stand on the outer half of the wall top, so a figure can stand on the walk behind them
    const cx = (T.x0 + T.x1) / 2;
    const wallZ = (z: number, x0: number, x1: number) => { const o = Math.sign(z); bx(stone, x0, 0, z - t / 2, x1, H, z + t / 2); for (let x = x0 + 0.4; x < x1 - 0.4; x += 1.6) bx(stone, x, H, o > 0 ? z : z - t / 2, x + 0.8, H + 0.9, o > 0 ? z + t / 2 : z); };
    const wallX = (x: number, z0: number, z1: number) => { const o = Math.sign(x - cx); bx(stone, x - t / 2, 0, z0, x + t / 2, H, z1); for (let z = z0 + 0.4; z < z1 - 0.4; z += 1.6) bx(stone, o > 0 ? x : x - t / 2, H, z, o > 0 ? x + t / 2 : x, H + 0.9, z + 0.8); };
    wallZ(T.z0, T.x0, T.x1); wallZ(T.z1, T.x0, T.x1);
    const gx = T.gateX, far = gx === T.x0 ? T.x1 : T.x0;
    wallX(far, T.z0, T.z1);
    wallX(gx, T.z0, T.gateZ - GATE_W / 2); wallX(gx, T.gateZ + GATE_W / 2, T.z1);
    bx(stone, gx - t / 2, H - 1.2, T.gateZ - GATE_W / 2, gx + t / 2, H, T.gateZ + GATE_W / 2);           // lintel over the gate
    { const o = Math.sign(gx - cx); for (let z = T.gateZ - GATE_W / 2 + 0.4; z < T.gateZ + GATE_W / 2 - 0.4; z += 1.6) bx(stone, o > 0 ? gx : gx - t / 2, H, z, o > 0 ? gx + t / 2 : gx, H + 0.9, z + 0.8); }
    add("castle-gate", gx, 0, T.gateZ, 1.5, Math.PI / 2);
    // corner towers + the two gate towers: round, stone, red cone roofs
    const tower = (x: number, z: number, h: number, rad: number) => {
      b.add(new THREE.CylinderGeometry(rad, rad * 1.08, h, 18), towerM, new THREE.Matrix4().makeTranslation(x, h / 2, z));
      b.add(new THREE.ConeGeometry(rad * 1.3, rad * 1.9, 18), roofT, new THREE.Matrix4().makeTranslation(x, h + rad * 0.95, z));
    };
    for (const [x, z] of [[T.x0, T.z0], [T.x1, T.z0], [T.x0, T.z1], [T.x1, T.z1]]) tower(x, z, H + 4, 2.2);
    for (const s of [-1, 1]) tower(gx, T.gateZ + s * (GATE_W / 2 + 1.6), H + 3, 1.9);
    // torches either side of the gate (warm practicals at night)
    for (const s of [-1, 1]) { const lp = V(gx - side * 1.0, 3.2, T.gateZ + s * (GATE_W / 2 + 0.4)); lamps.push({ p: lp, k: 1.0 });
      bx(wood, lp.x - 0.05, lp.y - 0.7, lp.z - 0.05, lp.x + 0.05, lp.y - 0.08, lp.z + 0.05); }
    // houses: two rows along the main street (z = 0) and one behind each, the piazzas kept clear
    const houses = ["building-sample-house-a", "building-sample-house-b", "building-sample-house-c", "building-sample-tower-a"];
    for (let x = Math.min(T.x0, T.x1) + 4; x < Math.max(T.x0, T.x1) - 4; x += 6.5 + rr() * 1.5)
      for (const z of [-7.5, 7.5, -15, 15]) {
        const px = x, pz = z + (rr() - 0.5) * 1.2;
        if (Math.abs(px - (T === BOLOGNA ? WELL_B.x : PIAZZA_M.x)) < 9 && Math.abs(pz) < 11) continue;   // the piazza
        if (T === MODENA && Math.abs(px - TOWER.x) < 9 && Math.abs(pz - TOWER.z) < 9) continue;          // the tower
        if (Math.abs(px - gx) < 6) continue;
        add(houses[Math.floor(rr() * houses.length)], px, 0.03, pz, 3.1 + rr() * 0.4, (pz > 0 ? Math.PI : 0) + (rr() - 0.5) * 0.1);
      }
    // flags on the gate towers (town colours come from the kit)
    for (const s of [-1, 1]) add("flag-banner-long", gx, H + 3, T.gateZ + s * (GATE_W / 2 + 1.6), 1.4, Math.PI / 2);
  };
  town(MODENA, 1, 41); town(BOLOGNA, -1, 77);

  // ---- wells ----
  const well = (c: THREE.Vector3) => {
    b.add(new THREE.CylinderGeometry(0.85, 0.9, 0.8, 20, 1, true), stone, new THREE.Matrix4().makeTranslation(c.x, 0.4, c.z));
    b.add(new THREE.RingGeometry(0.6, 0.9, 20).rotateX(-Math.PI / 2), stone, new THREE.Matrix4().makeTranslation(c.x, 0.81, c.z));
    b.add(new THREE.CircleGeometry(0.62, 20).rotateX(-Math.PI / 2), lam("bkWater", () => ({ color: "#2a3a4a" })), new THREE.Matrix4().makeTranslation(c.x, 0.45, c.z));
    for (const s of [-1, 1]) bx(wood, c.x + s * 0.8 - 0.06, 0, c.z - 0.06, c.x + s * 0.8 + 0.06, 2.1, c.z + 0.06);
    bx(wood, c.x - 0.9, 1.75, c.z - 0.04, c.x + 0.9, 1.83, c.z + 0.04);                                 // the windlass bar
    b.add(new THREE.ConeGeometry(1.35, 0.8, 4, 1).rotateY(Math.PI / 4), roofT, new THREE.Matrix4().makeTranslation(c.x, 2.45, c.z));
  };
  for (const c of [WELL_MID, WELL_B, WELL_OUT]) well(c);
  for (const [o, k] of [[V(-2.2, 2.4, 1.2), 1.2], [V(2.4, 2.4, -1.6), 0.9]] as [THREE.Vector3, number][]) {   // Bologna's piazza at night: two lamp posts
    const lp = WELL_B.clone().add(o); lamps.push({ p: lp, k }); bx(wood, lp.x - 0.07, 0, lp.z - 0.07, lp.x + 0.07, lp.y - 0.12, lp.z + 0.07); }

  // ---- the Ghirlandina with the tower room (line 11): walls with a window on every side at the room storey ----
  { const { x, z, w, h } = TOWER, hw = w / 2, t = 0.5, y0 = ROOM_Y, y1 = ROOM_Y + ROOM_H, win = 1.6, wy0 = y0 + 0.9, wy1 = y0 + 2.6;
    bx(stoneDark, x - hw, 0, z - hw, x + hw, y0, z + hw);                           // the shaft up to the room floor
    const side = (ax: "x" | "z", s: 1 | -1) => {
      const at = (u0: number, u1: number, v0: number, v1: number) => ax === "z"
        ? bx(stoneDark, x + u0, v0, z + s * hw - (s > 0 ? t : 0), x + u1, v1, z + s * hw + (s < 0 ? t : 0))
        : bx(stoneDark, x + s * hw - (s > 0 ? t : 0), v0, z + u0, x + s * hw + (s < 0 ? t : 0), v1, z + u1);
      at(-hw, -win / 2, y0, y1); at(win / 2, hw, y0, y1); at(-win / 2, win / 2, y0, wy0); at(-win / 2, win / 2, wy1, y1);
    };
    side("z", 1); side("z", -1); side("x", 1); side("x", -1);
    ground(b, wood, x - hw + t, x + hw - t, z - hw + t, z + hw - t, y0 + 0.01, 2);       // the room floor
    bx(stoneDark, x - hw, y1, z - hw, x + hw, h, z + hw);                             // above the room
    b.add(new THREE.ConeGeometry(hw * 0.9, 9, 8).rotateY(Math.PI / 8), stone, new THREE.Matrix4().makeTranslation(x, h + 4.5, z));
    bx(stone, x - 0.45, y0, z - 0.45, x + 0.45, y0 + 1.0, z + 0.45);                  // the plinth the bucket stands on
    for (const [lx, lz, k] of [[4.2, -4.2, 1.0], [-4.2, 4.2, 0.8], [4.2, 4.2, 0.7]]) { lamps.push({ p: V(x + lx, y0 + 2.3, z + lz), k }); bx(wood, x + lx - 0.05, y0 + 1.6, z + lz - 0.05, x + lx + 0.05, y0 + 2.2, z + lz + 0.05); } }

  // ---- Monteveglio: the hill and the castle (line 9) ----
  b.add(new THREE.CylinderGeometry(HILL.r * 0.45, HILL.r, HILL.h, 28, 1), hillG, new THREE.Matrix4().makeTranslation(HILL.x, HILL.h / 2, HILL.z));
  { const c = CASTLE;
    for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
      b.add(new THREE.CylinderGeometry(1.6, 1.8, 9, 16), towerM, new THREE.Matrix4().makeTranslation(c.x + dx, c.y + 4.5, c.z + dz));
      b.add(new THREE.ConeGeometry(2.2, 3.2, 16), roofT, new THREE.Matrix4().makeTranslation(c.x + dx, c.y + 10.6, c.z + dz));
    }
    for (const [x0, z0, x1, z1] of [[-6, -6.6, 6, -5.4], [-6, 5.4, 6, 6.6], [-6.6, -6, -5.4, 6], [5.4, -6, 6.6, 6]]) bx(stone, c.x + x0, c.y, c.z + z0, c.x + x1, c.y + 6, c.z + z1);
    add("tower-complete-large", c.x, c.y, c.z, 1.3);
    add("flag-banner-long", c.x, c.y + 13, c.z, 1.6); }
  // ---- Modena's ridge (line 5) ----
  b.add(new THREE.CylinderGeometry(RIDGE.r * 0.6, RIDGE.r, RIDGE.h, 24, 1), hillG, new THREE.Matrix4().makeTranslation(RIDGE.x, RIDGE.h / 2, RIDGE.z));

  // ---- dressing: trees on the plain (clear of the road, the sets and the armies), hills on the horizon ----
  const clearOf = (x: number, z: number) => Math.abs(z) > 9 && !(x > MODENA.x0 - 6 && x < MODENA.x1 + 6 && Math.abs(z) < 26) && !(x > BOLOGNA.x0 - 8 && x < BOLOGNA.x1 + 6 && Math.abs(z) < 26)
    && !(x > ARMY.x0 - 6 && x < ARMY.x1 + 6 && z > ARMY.z0 - 6 && z < ARMY.z1 + 6) && Math.hypot(x - HILL.x, z - HILL.z) > HILL.r + 3 && Math.hypot(x - RIDGE.x, z - RIDGE.z) > RIDGE.r + 3
    && Math.hypot(x - WELL_MID.x, z - WELL_MID.z) > 9 && Math.hypot(x - LORDS.x, z - LORDS.z) > 10 && Math.hypot(x - WELL_OUT.x, z - WELL_OUT.z) > 8 && Math.hypot(x - CLASH.x, z - CLASH.z) > 10;
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_pineRoundE", "tree_pineTallB_detailed", "tree_fat"];
  for (let i = 0; i < 220; i++) { const x = -150 + r() * 300, z = -140 + r() * 280; if (!clearOf(x, z)) continue; add(trees[i % trees.length], x, 0, z, 3.6 + r() * 2.4, r() * 6.3); }
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, d = 260 + (i % 3) * 30; b.add(new THREE.ConeGeometry(55 + (i % 4) * 12, 26 + (i % 3) * 10, 12, 1), hillG, new THREE.Matrix4().makeTranslation(Math.cos(a) * d, 10, Math.sin(a) * d)); }
  // camps on the plain (tents, siege engines) and market clutter in the towns
  for (const [n, x, z, s, ro] of [["tent_detailedOpen", 46, -22, 3.2, 0.4], ["tent_detailedClosed", 52, 26, 3.2, 1.1], ["siege-catapult", 30, -22, 2.0, 0.2], ["siege-trebuchet", 36, 24, 2.2, -0.4], ["tent_detailedClosed", -34, -14, 3.0, 2.0], ["siege-ram", -36, 14, 2.0, 1.4],
    ["cart", 66, -4, 2.2, 0.6], ["barrel", 75, -2.5, 0.6, 0], ["stall-red", 63, 10, 2.0, Math.PI], ["stall-green", -63, -10, 2.0, 0], ["cart", -75, 4, 2.2, -0.5], ["barrel", -60, 3.5, 0.6, 0]] as [string, number, number, number, number][]) add(n, x, 0.03, z, s, ro);
  b.build(R);

  // ---- Bologna's 32,000: one instanced soldier (red tunic, iron cap, spear) on a jittered grid ----
  const soldier = (() => {
    const parts: THREE.BufferGeometry[] = [];
    parts.push(new THREE.CapsuleGeometry(0.2, 0.5, 4, 10).translate(0, 0.85, 0));
    parts.push(new THREE.SphereGeometry(0.2, 12, 8).translate(0, 1.42, 0));
    parts.push(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 5).translate(0.3, 1.3, 0));
    const n = parts.map((p) => { const q = p.index ? p.toNonIndexed() : p; q.deleteAttribute("uv"); return q; });
    return mergeGeometries(n, false)!;
  })();
  const nX = 44, nZ = 36, army = new THREE.InstancedMesh(soldier, lam("bkArmy", () => ({ color: "#b8403a" })), nX * nZ);
  { const m = new THREE.Matrix4(); let k = 0;
    for (let i = 0; i < nX; i++) for (let j = 0; j < nZ; j++) { const x = ARMY.x0 + (i + 0.5) * ((ARMY.x1 - ARMY.x0) / nX) + (r() - 0.5) * 0.3, z = ARMY.z0 + (j + 0.5) * ((ARMY.z1 - ARMY.z0) / nZ) + (r() - 0.5) * 0.3;
      m.compose(V(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2 + (r() - 0.5) * 0.3, 0)), V(1, 0.95 + r() * 0.1, 1)); army.setMatrixAt(k++, m); } }
  army.castShadow = true; army.receiveShadow = true; army.frustumCulled = false; R.add(army);
  // banners above the host (Bologna red and white)
  const bannerTex = ctex("bkBannerB", 128, 192, (g) => { g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, 128, 192); g.fillStyle = "#b8302c"; g.fillRect(0, 0, 128, 96); g.fillRect(48, 96, 32, 96); });
  for (let i = 0; i < 9; i++) { const x = ARMY.x0 + 3 + (i % 3) * 13, z = ARMY.z0 + 4 + Math.floor(i / 3) * 12;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 5), lam("bkPole", () => ({ color: "#5a3a24" }))); pole.position.set(x, 2.25, z); R.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), lam("bkBannerBm", () => ({ map: bannerTex, side: THREE.DoubleSide }))); fl.position.set(x - 0.6, 3.6, z); fl.rotation.y = Math.PI / 2; R.add(fl); }

  // ---- the buckets on the wells and on the plinth (world.ts shows / hides them as the story moves them) ----
  const buckets = [WELL_MID.clone().add(V(0.55, 0.81, 0.2)), WELL_B.clone().add(V(0.55, 0.81, 0.2)), WELL_OUT.clone().add(V(0.55, 0.81, 0.2)), V(TOWER.x, ROOM_Y + 1.0, TOWER.z)].map((p) => { const g = bucketMesh(); g.position.copy(p); R.add(g); return g; });

  // ---- stars ----
  const sg = new THREE.BufferGeometry(), sp: number[] = [];
  for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, e = 0.12 + r() * 1.3, d = 2400; sp.push(Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d); }
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.2, 2.4), size: 3.0, sizeAttenuation: false, fog: false, depthWrite: false }));
  R.add(stars);
  void ROOM_H;
  return { lamps, stars, buckets, army };
}
export const SET_KIT = ["castle-gate", "building-sample-house-a", "building-sample-house-b", "building-sample-house-c", "building-sample-tower-a", "flag-banner-long", "tower-complete-large",
  "tree_oak", "tree_default", "tree_detailed", "tree_pineRoundE", "tree_pineTallB_detailed", "tree_fat", "tent_detailedOpen", "tent_detailedClosed", "siege-catapult", "siege-trebuchet", "siege-ram", "cart", "barrel", "stall-red", "stall-green"];
