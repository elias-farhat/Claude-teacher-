// 1920s Paris around the tower (x = east, z = south, metres; the tower stands at the origin):
//   Champ de Mars lawns + gravel to the south, the Seine (z -200..-330) with quays and a bridge to the north,
//   Haussmann blocks (cream limestone, iron balconies, zinc mansards) on a street grid, tree rows, street lamps,
//   the café on the east avenue, the grand hotel by the river, and the railway on the south quay.
import * as THREE from "three";
import { Batch, lam, quad, V, kitClone, Kit } from "../bridge/build";
import { ctex, rep, grassHD, cobbleHD, stoneHD, roofHD, rng } from "../bridge/paint";

export const RIVER = { z0: -200, z1: -330, y: -4 };
export const CAFE = { x: 152, z: 196, face: -1 };          // café front on the east avenue, facing west (-x)
export const HOTEL = { x: 430, z: -150, w: 110, h: 24 };   // grand hotel on the south quay, facade facing north (-z)
export const RAIL = { z: -186, y: 0.15 };                  // railway along the south quay
export type Lamp = { p: THREE.Vector3; k: number };

// ---------------- painted textures ----------------
/** Haussmann facade: limestone courses, shop band, tall French windows, iron balconies on floors 2 and 5 */
const hausFacade = (seed: number, wm: number, hm: number) => {
  const PX = 24, W = Math.round(wm * PX), H = Math.round(hm * PX), m = (v: number) => v * PX;
  return ctex(`haus${seed}_${wm}_${hm}`, W, H, (g) => {
    const r = rng(seed * 17 + 3);
    const stones = ["#ecdfc6", "#e6d6b8", "#efe4cf", "#e2d1b2"];
    g.fillStyle = stones[seed % 4]; g.fillRect(0, 0, W, H);
    for (let y = H; y > 0; y -= m(0.55)) { g.fillStyle = "rgba(120,96,70,0.18)"; g.fillRect(0, y, W, 1.5); }
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "90,70,50"},0.05)`; g.beginPath(); g.ellipse(r() * W, r() * H, 10 + r() * 30, 6 + r() * 12, 0, 0, 7); g.fill(); }
    const floors = Math.max(3, Math.round(hm / 3.2)), fh = H / floors;
    const bays = Math.max(2, Math.round(wm / 3.4)), bw = W / bays;
    const shop = ["#7a2e2e", "#2f4f6e", "#355e3b", "#5a3b2a", "#6a3e6e"][seed % 5];
    for (let f = 0; f < floors; f++) {
      const y0 = H - (f + 1) * fh;
      if (f === 0) { // ground floor: shop fronts with dark glazing and a fascia
        g.fillStyle = shop; g.fillRect(0, y0 + fh * 0.05, W, fh * 0.2);
        for (let b = 0; b < bays; b++) {
          const x0 = b * bw + bw * 0.12;
          g.fillStyle = "#2b2733"; g.fillRect(x0, y0 + fh * 0.3, bw * 0.76, fh * 0.7);
          g.fillStyle = "rgba(255,220,160,0.35)"; g.fillRect(x0 + 3, y0 + fh * 0.34, bw * 0.76 - 6, fh * 0.18);
        }
        g.fillStyle = "rgba(60,40,30,0.35)"; g.fillRect(0, y0, W, 3);
        continue;
      }
      g.fillStyle = "rgba(110,90,66,0.35)"; g.fillRect(0, y0 + fh - 4, W, 4); // string course
      for (let b = 0; b < bays; b++) {
        const x0 = b * bw + bw * 0.28, ww = bw * 0.44, wy = y0 + fh * 0.18, wh = fh * 0.66;
        g.fillStyle = "#f5eee0"; g.fillRect(x0 - 3, wy - 3, ww + 6, wh + 6);           // frame
        g.fillStyle = "#3d4a63"; g.fillRect(x0, wy, ww, wh);                           // glass
        g.fillStyle = "rgba(190,215,240,0.35)"; g.fillRect(x0 + 2, wy + 2, ww * 0.4, wh - 4);
        g.fillStyle = "#f5eee0"; g.fillRect(x0 + ww / 2 - 1, wy, 2, wh); g.fillRect(x0, wy + wh * 0.4, ww, 2);
        g.fillStyle = "rgba(110,90,66,0.5)"; g.fillRect(x0 - 5, wy - 7, ww + 10, 3);   // hood
        if (f === 1 || f === floors - 1 || (f === 2 && seed % 2)) {                   // iron balcony rail
          g.fillStyle = "#26222b"; const by = wy + wh * 0.72;
          if (f === 1 || f === floors - 1) g.fillRect(0, by, W, 2), g.fillRect(0, by + wh * 0.26, W, 2);
          else g.fillRect(x0 - 4, by, ww + 8, 2), g.fillRect(x0 - 4, by + wh * 0.26, ww + 8, 2);
          const xa = f === 1 || f === floors - 1 ? 0 : x0 - 4, xb = f === 1 || f === floors - 1 ? W : x0 + ww + 4;
          for (let x = xa; x < xb; x += 5) g.fillRect(x, by, 1.2, wh * 0.26);
        }
      }
    }
    g.fillStyle = "rgba(110,90,66,0.6)"; g.fillRect(0, 0, W, 6); // cornice
  });
};
const zinc = () => ctex("zinc", 256, 256, (g, r) => {
  g.fillStyle = "#7d8ba0"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) { g.fillStyle = "rgba(40,48,66,0.45)"; g.fillRect(x, 0, 2, 256); g.fillStyle = "rgba(220,230,245,0.18)"; g.fillRect(x + 3, 0, 2, 256); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "30,30,50"},0.05)`; g.fillRect(r() * 256, r() * 256, 20, 6); }
});
const gravel = () => ctex("gravel", 512, 512, (g, r) => {
  g.fillStyle = "#d9c49a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { g.fillStyle = ["#c9b186", "#e6d4ad", "#bfa57a", "#efe0bf"][i % 4]; g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2 + r() * 3); }
});
const waterTex = () => ctex("seine", 512, 512, (g, r) => {
  g.fillStyle = "#3f86a8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) { g.strokeStyle = r() > 0.4 ? "rgba(190,235,245,0.55)" : "rgba(20,60,100,0.4)"; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 5, x + 28 + r() * 20, y); g.stroke(); }
});
export const awningTex = (a: string, b: string) => ctex("awning" + a + b, 256, 128, (g) => {
  for (let x = 0; x < 256; x += 32) { g.fillStyle = (x / 32) % 2 ? b : a; g.fillRect(x, 0, 32, 128); }
  g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 100, 256, 28);
});

// ---------------- pieces ----------------
const box = (b: Batch, mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  b.add(g, mat, new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
};
/** Haussmann block: 4 facades + zinc mansard (inset 1.4 m, 4.5 m tall) + chimney stacks */
export const building = (b: Batch, x: number, z: number, yaw: number, w: number, d: number, h: number, seed: number) => {
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
  const fr = lam(`hausF${seed % 6}_${w}_${h}`, () => ({ map: hausFacade(seed % 6, w, h) }));
  const sd = lam(`hausS${seed % 6}_${d}_${h}`, () => ({ map: hausFacade(seed % 6 + 10, d, h) }));
  const hw = w / 2, hd = d / 2;
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), fr, M);
  b.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd)), fr, M);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), sd, M);
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), sd, M);
  const z1 = lam("zinc", () => ({ map: zinc() })), i = 1.4, mh = 4.5;
  const zm = lam("zincRoof", () => ({ map: rep(zinc(), 2, 1) }));
  b.add(quad(V(-hw, h, hd), V(hw, h, hd), V(hw - i, h + mh, hd - i), V(-hw + i, h + mh, hd - i), w / 8, 1), zm, M);
  b.add(quad(V(hw, h, -hd), V(-hw, h, -hd), V(-hw + i, h + mh, -hd + i), V(hw - i, h + mh, -hd + i), w / 8, 1), zm, M);
  b.add(quad(V(hw, h, hd), V(hw, h, -hd), V(hw - i, h + mh, -hd + i), V(hw - i, h + mh, hd - i), d / 8, 1), zm, M);
  b.add(quad(V(-hw, h, -hd), V(-hw, h, hd), V(-hw + i, h + mh, hd - i), V(-hw + i, h + mh, -hd + i), d / 8, 1), zm, M);
  b.add(quad(V(-hw + i, h + mh, hd - i), V(hw - i, h + mh, hd - i), V(hw - i, h + mh, -hd + i), V(-hw + i, h + mh, -hd + i)), z1, M);
  const cornice = lam("cornice", () => ({ color: "#efe3c9" }));
  b.add(new THREE.BoxGeometry(w + 0.8, 0.5, d + 0.8), cornice, new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(0, h, 0)));
  const brick = lam("chimney", () => ({ color: "#c98a6a" })), r = rng(seed + 5);
  for (let k = 0; k < 3; k++) {
    const cx = (r() - 0.5) * (w - 6), cz = (r() - 0.5) * (d - 6);
    b.add(new THREE.BoxGeometry(1.4, 3, 0.8), brick, new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(cx, h + mh + 1, cz)));
  }
  // dormers on the street side
  const dorm = lam("dormer", () => ({ color: "#ece2cc" }));
  for (let k = -hw + 3; k < hw - 2; k += 4.2)
    b.add(new THREE.BoxGeometry(1.4, 1.8, 1.0), dorm, new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeTranslation(k, h + 2.2, hd - 0.9)));
};

/** grand hotel facade: colonnade over an arcade, 4 floors, balustrade, pavilions at the ends (faces -z) */
const grandHotel = (b: Batch, kitRoot: THREE.Object3D, lamps: Lamp[]) => {
  const { x, z, w, h } = HOTEL, d = 30;
  const stoneM = lam("hotelStone", () => ({ map: rep(stoneHD("hotelStoneHD", ["#efe6d2", "#e8dcc4", "#f3ebda", "#e3d6bb"], "#c5b79c"), 6, 3) }));
  const fac = lam("hotelFac", () => ({ map: hausFacade(7, w, h) }));
  const M = new THREE.Matrix4().setPosition(x, 0, z);
  b.add(quad(V(w / 2, 0, -d / 2), V(-w / 2, 0, -d / 2), V(-w / 2, h, -d / 2), V(w / 2, h, -d / 2)), fac, M);
  box(b, stoneM, x - w / 2, 0, z - d / 2 + 0.2, x + w / 2, h, z + d / 2);
  // colonnade: 12 columns standing on the arcade, entablature + balustrade
  const col = lam("column", () => ({ color: "#f4ecdb" }));
  for (let k = 0; k < 12; k++) {
    const cx = x - 30 + k * (60 / 11);
    const g = new THREE.CylinderGeometry(0.9, 1.0, 13, 12);
    b.add(g, col, new THREE.Matrix4().makeTranslation(cx, 7 + 6.5, z - d / 2 - 2.6));
  }
  box(b, col, x - 33, 20, z - d / 2 - 4.2, x + 33, 22.2, z - d / 2);
  box(b, stoneM, x - 33, 0, z - d / 2 - 4.2, x + 33, 7, z - d / 2);
  // arcade openings (dark) + the main door (warm light at night)
  const dark = lam("arcadeDark", () => ({ color: "#2a2230" }));
  for (let k = 0; k < 9; k++) box(b, dark, x - 28 + k * 7 - 2, 0, z - d / 2 - 4.3, x - 28 + k * 7 + 2, 5.2, z - d / 2 - 4.25);
  for (const s of [-1, 1]) box(b, stoneM, x + s * (w / 2 - 8) - 8, 0, z - d / 2 - 2, x + s * (w / 2 - 8) + 8, h + 3, z - d / 2 + 2); // pavilions
  const roofM = lam("hotelRoof", () => ({ map: rep(zinc(), 10, 1) }));
  b.add(quad(V(-w / 2, h, -d / 2), V(w / 2, h, -d / 2), V(w / 2 - 2, h + 6, -d / 2 + 3), V(-w / 2 + 2, h + 6, -d / 2 + 3), 14, 1), roofM, M);
  box(b, roofM, x - w / 2 + 2, h, z - d / 2 + 3, x + w / 2 - 2, h + 6, z + d / 2 - 2);
  for (let k = -4; k <= 4; k++) lamps.push({ p: V(x + k * 6.5, 4.6, z - d / 2 - 5.5), k: 0.8 });
  void kitRoot;
};

export type Train = { group: THREE.Group; length: number };
/** steam locomotive + 3 carriages (Wagons-Lits blue with gold lining), built along +x, wheels at y = 0 */
export const buildTrain = (): Train => {
  const b = new Batch(), g = new THREE.Group();
  const blue = lam("wagonBlue", () => ({ map: ctex("wagon", 512, 128, (c) => {
    c.fillStyle = "#24386e"; c.fillRect(0, 0, 512, 128);
    c.fillStyle = "#d9b45a"; c.fillRect(0, 18, 512, 3); c.fillRect(0, 106, 512, 3);
    for (let x = 24; x < 500; x += 54) { c.fillStyle = "#f6d79a"; c.fillRect(x, 34, 34, 40); c.fillStyle = "#3a2a20"; c.fillRect(x + 16, 34, 2, 40); }
    c.font = "bold 16px serif"; c.fillStyle = "#d9b45a"; c.textAlign = "center"; c.fillText("PARIS — VIENNE", 256, 100);
  }) }));
  const roofM = lam("wagonRoof", () => ({ color: "#4a4652" })), black = lam("loco", () => ({ color: "#2a2a33" })), red = lam("locoRed", () => ({ color: "#a33a2e" }));
  const wheel = lam("wheel", () => ({ color: "#3a2a26" }));
  let x = 0;
  // locomotive
  box(b, black, x, 1.2, -1.4, x + 9, 2.2, 1.4);
  b.add(new THREE.CylinderGeometry(1.25, 1.25, 7, 18).rotateZ(Math.PI / 2), black, new THREE.Matrix4().makeTranslation(x + 4.5, 3.3, 0));
  box(b, black, x, 2.2, -1.5, x + 2.8, 5.0, 1.5); box(b, roofM, x - 0.2, 5.0, -1.7, x + 3.0, 5.3, 1.7);
  b.add(new THREE.CylinderGeometry(0.42, 0.55, 2.2, 12), black, new THREE.Matrix4().makeTranslation(x + 7.6, 5.4, 0));
  box(b, red, x + 8.8, 0.7, -1.5, x + 9.4, 1.6, 1.5);
  for (const wx of [1.5, 4, 6.5]) for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.85, 0.85, 0.3, 16).rotateX(Math.PI / 2), wheel, new THREE.Matrix4().makeTranslation(x + wx, 0.85, s * 1.35));
  x = -1;
  for (let c = 0; c < 3; c++) {
    const x1 = x - 0.8, x0 = x1 - 16;
    box(b, blue, x0, 1.0, -1.45, x1, 4.0, 1.45);
    b.add(new THREE.CylinderGeometry(1.6, 1.6, 16, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.35, 1), roofM, new THREE.Matrix4().makeTranslation((x0 + x1) / 2, 4.0, 0));
    for (const wx of [x0 + 2, x0 + 3.6, x1 - 3.6, x1 - 2]) for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.5, 0.5, 0.25, 12).rotateX(Math.PI / 2), wheel, new THREE.Matrix4().makeTranslation(wx, 0.5, s * 1.35));
    x = x0;
  }
  b.build(g);
  return { group: g, length: -x + 9.4 };
};

/** steamer for line 23: black hull, white superstructure, two red funnels; deck at y = 0.5 (river at -4) */
export const buildShip = () => {
  const b = new Batch(), g = new THREE.Group();
  const hull = lam("hull", () => ({ color: "#26232c" })), white = lam("shipWhite", () => ({ color: "#f1ece2" })), red = lam("funnel", () => ({ color: "#b8262e" }));
  box(b, hull, -16, -4.6, -3.6, 16, 0.5, 3.6);
  b.add(new THREE.CylinderGeometry(3.6, 3.6, 5.1, 16, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI / 2).scale(1.4, 1, 1), hull, new THREE.Matrix4().makeTranslation(16, -2.05, 0));
  box(b, white, -10, 0.5, -2.6, 8, 3.3, 2.6); box(b, white, -6, 3.3, -2.0, 4, 5.4, 2.0);
  for (const x of [-3, 2]) b.add(new THREE.CylinderGeometry(0.8, 0.9, 4.2, 14), red, new THREE.Matrix4().makeTranslation(x, 7.4, 0));
  b.build(g);
  return g;
};
export type Paris = { lamps: Lamp[]; train: Train };

export const buildParis = (root: THREE.Object3D, kit: Kit): Paris => {
  const b = new Batch(), lamps: Lamp[] = [];
  const cob = lam("cobbleE", () => ({ map: rep(cobbleHD(), 220, 220) }));
  const grassM = lam("grassE", () => ({ map: rep(grassHD(), 40, 160) }));
  const grav = lam("gravelE", () => ({ map: rep(gravel(), 30, 120) }));
  const gravSq = lam("gravelSq", () => ({ map: rep(gravel(), 24, 24) }));
  const quayM = lam("quayE", () => ({ map: rep(stoneHD("quayHD", ["#d8cbb2", "#cfc1a6", "#e0d4bd", "#c8b99c"], "#a3947a"), 120, 2) }));
  // city floor (north and south of the river), tower square, Champ de Mars lawns + paths
  b.add(quad(V(-3000, 0, 3000), V(3000, 0, 3000), V(3000, 0, RIVER.z0), V(-3000, 0, RIVER.z0)), cob);
  b.add(quad(V(-3000, 0, RIVER.z1), V(3000, 0, RIVER.z1), V(3000, 0, -3000), V(-3000, 0, -3000)), cob);
  b.add(quad(V(-90, 0.03, 75), V(90, 0.03, 75), V(90, 0.03, -75), V(-90, 0.03, -75)), gravSq);
  b.add(quad(V(-110, 0.03, 900), V(110, 0.03, 900), V(110, 0.03, 75), V(-110, 0.03, 75)), grav);
  for (const s of [-1, 1]) b.add(quad(V(s < 0 ? -92 : 22, 0.05, 880), V(s < 0 ? -22 : 92, 0.05, 880), V(s < 0 ? -22 : 92, 0.05, 95), V(s < 0 ? -92 : 22, 0.05, 95)), grassM);
  // river: water below the quay walls
  const water = new THREE.Mesh(new THREE.PlaneGeometry(6000, RIVER.z0 - RIVER.z1).rotateX(-Math.PI / 2),
    lam("seineW", () => ({ map: rep(waterTex(), 160, 4) })));
  water.position.set(0, RIVER.y, (RIVER.z0 + RIVER.z1) / 2); water.receiveShadow = true; root.add(water);
  box(b, quayM, -3000, RIVER.y - 1, RIVER.z0 - 1.2, 3000, 0.6, RIVER.z0);
  box(b, quayM, -3000, RIVER.y - 1, RIVER.z1, 3000, 0.6, RIVER.z1 + 1.2);
  // bridge to the Trocadéro side: deck + 3 arched piers
  const bridgeM = lam("bridgeE", () => ({ map: rep(stoneHD("bridgeHD"), 6, 30) }));
  box(b, bridgeM, -17, -0.8, RIVER.z1, 17, 0.4, RIVER.z0);
  for (const zz of [-245, -285]) box(b, bridgeM, -17, RIVER.y - 1, zz - 3, 17, -0.8, zz + 3);
  // ---- Haussmann street grid (skips the Champ de Mars, the tower square, the river and the hotel plot) ----
  const r = rng(7);
  let seed = 0;
  const blockAt = (cx: number, cz: number, bw: number, bd: number) => {
    // a block = 2-4 buildings along its long side, both faces on streets
    const n = Math.max(1, Math.round(bw / 26)), w = bw / n;
    for (let k = 0; k < n; k++) {
      const h = 18 + Math.round(r() * 3) * 1.6;
      building(b, cx - bw / 2 + w * (k + 0.5), cz, 0, w - 0.4, bd, h, seed++);
    }
  };
  for (let gx = -1500; gx <= 1500; gx += 80) for (let gz = -1300; gz <= 1700; gz += 60) {
    const cx = gx + 40, cz = gz + 30;
    if (Math.abs(cx) < 150 && cz > -190 && cz < 940) continue;              // tower + Champ de Mars
    if (cz > RIVER.z1 - 40 && cz < RIVER.z0 + 30) continue;                 // river + quays + railway
    if (Math.abs(cx - HOTEL.x) < 90 && Math.abs(cz - HOTEL.z) < 50) continue;
    if (Math.abs(cx - CAFE.x - 20) < 45 && Math.abs(cz - CAFE.z) < 40) continue;
    if (Math.hypot(cx, cz - 300) > 2100) continue;
    blockAt(cx, cz, 60, 30);
  }
  // the avenues lining the Champ de Mars: facades facing the lawns
  for (let zz = 110; zz < 900; zz += 34) for (const s of [-1, 1]) {
    if (s > 0 && Math.abs(zz - CAFE.z) < 30) continue;
    building(b, s * 172, zz, s > 0 ? -Math.PI / 2 : Math.PI / 2, 32, 22, 19 + (zz % 3) * 1.6, seed++);
  }
  // ---- the café: corner building with a striped awning, tables on the pavement ----
  building(b, CAFE.x + 20, CAFE.z, -Math.PI / 2, 30, 22, 19, 3);
  const aw = lam("awningRW", () => ({ map: awningTex("#c8323a", "#f4ece0"), side: THREE.DoubleSide }));
  const fx = CAFE.x + 9; // facade plane x
  b.add(quad(V(fx, 3.4, CAFE.z - 12), V(fx, 3.4, CAFE.z + 12), V(fx - 3.6, 2.6, CAFE.z + 12), V(fx - 3.6, 2.6, CAFE.z - 12), 6, 1), aw);
  b.add(quad(V(fx - 3.6, 2.6, CAFE.z - 12), V(fx - 3.6, 2.6, CAFE.z + 12), V(fx - 3.6, 2.2, CAFE.z + 12), V(fx - 3.6, 2.2, CAFE.z - 12), 6, 0.2), aw);
  const tableM = lam("cafeTable", () => ({ color: "#3a3540" })), topM = lam("cafeTop", () => ({ color: "#efe7d6" })), chairM = lam("cafeChair", () => ({ color: "#8a4a2e" }));
  for (const [tx, tz] of [[CAFE.x + 3, CAFE.z - 7], [CAFE.x + 3, CAFE.z], [CAFE.x + 3, CAFE.z + 7], [CAFE.x - 1.5, CAFE.z - 3.5], [CAFE.x - 1.5, CAFE.z + 3.5]]) {
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 8), tableM, new THREE.Matrix4().makeTranslation(tx, 0.36, tz));
    b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 20), topM, new THREE.Matrix4().makeTranslation(tx, 0.74, tz));
    for (const s of [-1, 1]) {
      b.add(new THREE.BoxGeometry(0.42, 0.05, 0.42), chairM, new THREE.Matrix4().makeTranslation(tx, 0.45, tz + s * 0.75));
      b.add(new THREE.BoxGeometry(0.42, 0.5, 0.05), chairM, new THREE.Matrix4().makeTranslation(tx, 0.72, tz + s * 0.96));
    }
  }
  // ---- grand hotel, railway on the south quay ----
  const hotelRoot = new THREE.Group(); root.add(hotelRoot);
  grandHotel(b, hotelRoot, lamps);
  const railM = lam("rail", () => ({ color: "#55505a" })), sleeperM = lam("sleeper", () => ({ color: "#6a4a36" }));
  for (const s of [-1, 1]) box(b, railM, -3000, RAIL.y, RAIL.z + s * 0.75 - 0.06, 3000, RAIL.y + 0.14, RAIL.z + s * 0.75 + 0.06);
  box(b, sleeperM, -3000, 0.02, RAIL.z - 1.3, 3000, RAIL.y, RAIL.z + 1.3);
  // ---- trees: double rows along the Champ de Mars, a few around the tower square; lamps on the paths ----
  const treeAt = (name: string, x: number, z: number, h: number) => {
    const o = kitClone(kit, name, h);
    if (o) { o.position.set(x, 0, z); o.updateMatrixWorld(true); b.addObject(o, new THREE.Matrix4()); }
  };
  for (let zz = 100; zz < 880; zz += 14) for (const xx of [-102, -120, 102, 120]) treeAt(zz % 28 ? "tree_oak" : "tree_default", xx + (r() - 0.5), zz, 9 + r() * 2);
  for (const [xx, zz] of [[-85, -60], [85, -60], [-85, 60], [85, 60], [-60, -85], [60, -85]]) treeAt("tree_detailed", xx, zz, 10);
  for (let zz = 90; zz < 880; zz += 30) for (const xx of [-110, 110]) {
    const o = kitClone(kit, "lantern", 3.8);
    if (o) { o.position.set(xx, 0, zz); o.updateMatrixWorld(true); b.addObject(o, new THREE.Matrix4()); }
    lamps.push({ p: V(xx, 3.6, zz), k: 1 });
  }
  for (let k = -3; k <= 3; k++) lamps.push({ p: V(CAFE.x - 3.2, 3.2, CAFE.z + k * 4), k: 0.6 });
  b.build(root);
  const train = buildTrain();
  root.add(train.group);
  return { lamps, train };
};
