// The Moon Hoax world (layout.ts): New York 1835 (cobbled street, brick row houses, oil lamps, The Sun + The Herald),
// the pier and the strait, Europe's distant coast, the Cape (beach, Herschel's whitewashed cottage + garden + his
// normal telescope, the hill with the absurdly huge telescope), a small cartoon Moon whose flat top holds the moon
// world (silver forest, ocean, beach, rocks), stars, and the slow sailing ship. All our own geometry + painted textures.
import * as THREE from "three";
import { Batch, lam, quad, V } from "../bridge/build";
import { ctex, rep, rng, stoneHD, cobbleHD, roofHD, grassHD, planksHD, facadeHD } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { box, wallX, wallZ, ground, gableRoof, lampMesh, signTex, Lamp } from "../rats/hanoi";
import { STREET, WATER, PIER, CAPE, COTTAGE, GARDEN, BEACH, HILL, MOON, MOON_TOP, EYEPIECE, TUBE_DIR, TUBE_LEN, EUROPE, ROOMS, RoomName } from "./layout";

type Hole = { x0: number; x1: number; y0: number; y1: number };

const moonTex = () => ctex("moonSurf", 1024, 512, (g, r) => {
  g.fillStyle = "#d9dbe6"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 90; i++) { const x = r() * 1024, y = r() * 512, rr = 6 + r() ** 2 * 60;
    g.fillStyle = "rgba(150,155,185,0.45)"; g.beginPath(); g.ellipse(x, y, rr, rr * 0.9, 0, 0, 7); g.fill();
    g.strokeStyle = "rgba(245,246,255,0.6)"; g.lineWidth = 3; g.beginPath(); g.ellipse(x - 2, y - 2, rr, rr * 0.9, 0, 3.4, 5.6); g.stroke(); }
});
const moonGrass = () => ctex("moonGrass", 512, 512, (g, r) => {
  g.fillStyle = "#9fc3c0"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { g.fillStyle = ["#8ab4b2", "#b2d3cf", "#93bab8", "#c4e0da"][i % 4]; g.fillRect(r() * 512, r() * 512, 2, 5 + r() * 6); }
});
const sandTex = () => ctex("sand", 512, 512, (g, r) => { g.fillStyle = "#ecd9a8"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 3000; i++) { g.fillStyle = ["#e0c994", "#f4e5bf", "#d8be86"][i % 3]; g.fillRect(r() * 512, r() * 512, 2, 2); } });
const seaTex = () => ctex("sea1835", 512, 512, (g, r) => {
  g.fillStyle = "#3f86a8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.strokeStyle = r() > 0.4 ? "rgba(200,240,250,0.55)" : "rgba(20,60,100,0.4)"; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 5, x + 30 + r() * 20, y); g.stroke(); }
});
const whitewash = () => ctex("whitewash", 256, 256, (g, r) => { g.fillStyle = "#f2ede0"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "160,140,110"},0.08)`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 20, 10, 0, 0, 7); g.fill(); } });

const streetLamp = (b: Batch, root: THREE.Object3D, x: number, z: number, lamps: Lamp[]) => {
  const iron = lam("lampIron", () => ({ color: "#2a2a33" }));
  b.add(new THREE.CylinderGeometry(0.07, 0.1, 3.4, 8), iron, new THREE.Matrix4().makeTranslation(x, 1.7, z));
  b.add(new THREE.CylinderGeometry(0.16, 0.24, 0.5, 4).rotateY(Math.PI / 4), lam("lampGlass", () => ({ color: "#f3e6b0" })), new THREE.Matrix4().makeTranslation(x, 3.65, z));
  b.add(new THREE.ConeGeometry(0.3, 0.25, 4).rotateY(Math.PI / 4), iron, new THREE.Matrix4().makeTranslation(x, 4.0, z));
  lampMesh(root, V(x, 3.65, z), 0.1); lamps.push({ p: V(x, 3.65, z), k: 0.9 });
};
const tree = (b: Batch, x: number, y: number, z: number, s: number, seed: number, leafCol: string[], trunkCol = "#6b4a34") => {
  const r = rng(seed * 31 + 7), trunk = lam("trunk" + trunkCol, () => ({ color: trunkCol })), leaf = lam(`leaf${leafCol[seed % leafCol.length]}`, () => ({ color: leafCol[seed % leafCol.length] }));
  b.add(new THREE.CylinderGeometry(0.15 * s, 0.24 * s, 3 * s, 8), trunk, new THREE.Matrix4().makeTranslation(x, y + 1.5 * s, z));
  for (let k = 0; k < 4; k++) b.add(new THREE.IcosahedronGeometry((1.2 + r() * 0.6) * s, 1), leaf, new THREE.Matrix4().makeTranslation(x + (r() - 0.5) * 1.8 * s, y + (3.4 + r()) * s, z + (r() - 0.5) * 1.8 * s));
};
/** a brick row house block: front plane zf facing s, depth d, x0..x1, holes on the front */
const rowBlock = (b: Batch, x0: number, x1: number, zf: number, s: 1 | -1, d: number, h: number, seed: number, holes: Hole[] = []) => {
  const pal = [{ wall: "#c96a4a", shutter: "#2f4f6e" }, { wall: "#b85a3e", shutter: "#355e3b" }, { wall: "#d07a58", shutter: "#5a3b2a" }, { wall: "#a9563f", shutter: "#2f5f6a" }][seed % 4];
  const fr = lam(`nycF${seed}_${x1 - x0}_${h}`, () => ({ map: facadeHD(`nyc${seed}_${x1 - x0}_${h}`, x1 - x0, h, { ...pal, brick: true, door: holes.length === 0 }) }));
  const sd = lam(`nycS${d}_${h}`, () => ({ map: rep(facadeHD(`nycS${d}_${h}`, d, h, { wall: "#b8664a", shutter: "#2f4f6e", brick: true }), 1, 1) }));
  const zb = zf - s * d;
  wallX(b, fr, x0, x1, 0, h, zf, s, holes);
  wallX(b, sd, x0, x1, 0, h, zb, (-s) as 1 | -1);
  wallZ(b, sd, Math.min(zf, zb), Math.max(zf, zb), 0, h, x1, 1); wallZ(b, sd, Math.min(zf, zb), Math.max(zf, zb), 0, h, x0, -1);
  const slate = lam("slate", () => ({ map: rep(roofHD("#5d6478", true), 1, 1) })), trim = lam("nycTrim", () => ({ color: "#efe6d2" }));
  box(b, trim, x0 - 0.2, h - 0.25, Math.min(zf, zb) - 0.25, x1 + 0.2, h + 0.15, Math.max(zf, zb) + 0.25);
  gableRoof(b, slate, sd, x0, x1, Math.min(zf, zb), Math.max(zf, zb), h + 0.15, 3.0, 0.3);
  const chim = lam("chimneyB", () => ({ color: "#9a4a36" }));
  box(b, chim, x0 + 1.5, h + 1, (zf + zb) / 2 - 0.4, x0 + 2.3, h + 4.2, (zf + zb) / 2 + 0.4);
  for (const hh of holes) {
    const t = 0.18, z = zf + s * 0.08;
    box(b, trim, hh.x0 - t, hh.y1, z - 0.08, hh.x1 + t, hh.y1 + t, z + 0.08);
    for (const x of [hh.x0 - t, hh.x1]) box(b, trim, x, hh.y0, z - 0.08, x + t, hh.y1, z + 0.08);
  }
};

export type Diorama = { group: THREE.Group; lamps: Lamp[]; ship: THREE.Group; sunSign: { lit: THREE.Mesh; dark: THREE.Mesh }; stars: THREE.Points; moon: THREE.Mesh };

export const buildDiorama = (root: THREE.Object3D): Diorama => {
  const b = new Batch(), g = new THREE.Group(), lamps: Lamp[] = [];
  root.add(g);
  const cob = lam("cobble", () => ({ map: cobbleHD() })), walk = lam("nycWalk", () => ({ map: stoneHD("nycWalk", ["#c9c0b0", "#bfb5a3", "#d3cbbd", "#b5aa97"], "#8f8574") }));
  const grass = lam("grassM", () => ({ map: grassHD() })), sand = lam("sandM", () => ({ map: rep(sandTex(), 4, 4) })), wood = lam("pierWood", () => ({ map: rep(planksHD(), 2, 1) }));
  // ---- New York street ----
  ground(b, cob, STREET.x0, STREET.x1, -STREET.road, STREET.road, 0, 6);
  ground(b, walk, STREET.x0, STREET.x1, -STREET.facade, -STREET.road, 0.12, 3); ground(b, walk, STREET.x0, STREET.x1, STREET.road, STREET.facade, 0.12, 3);
  for (const z of [-STREET.road, STREET.road]) box(b, lam("kerb", () => ({ color: "#a89f8f" })), STREET.x0, 0, z - 0.1, STREET.x1, 0.14, z + 0.1);
  ground(b, cob, STREET.x0 - 30, STREET.x0, -40, 40, -0.01, 6); ground(b, walk, STREET.x0, PIER.x0, -40, -22, 0.01, 4); ground(b, walk, STREET.x0, PIER.x0, 22, 40, 0.01, 4);
  const hole = (n: RoomName, k: number): Hole => { const r = ROOMS[n], op = r.open.filter((o) => o.wall === "s" || o.wall === "n")[k]; return { x0: r.o.x + op.at - op.w / 2, x1: r.o.x + op.at + op.w / 2, y0: op.y, y1: op.y + op.h }; };
  const north: [number, number, number, number, Hole[]][] = [[-24, -10, 10, 0, []], [-10, 4, 11, 1, []], [4, 19, 10, 2, []], [19, 31, 9.5, 3, [hole("sun", 0), hole("sun", 1)]], [31, 46, 11, 0, []]];
  const south: [number, number, number, number, Hole[]][] = [[-24, -8, 11, 2, []], [-8, 3.5, 10, 3, []], [3.5, 15, 10.5, 1, [hole("herald", 0), hole("herald", 1)]], [15, 30, 11, 0, []], [30, 46, 10, 2, []]];
  for (const [x0, x1, h, s, hs] of north) rowBlock(b, x0, x1, -STREET.facade, 1, 14, h, s, hs);
  for (const [x0, x1, h, s, hs] of south) rowBlock(b, x0, x1, STREET.facade, -1, 14, h, s, hs);
  for (let x = -20; x < 44; x += 12) for (const z of [-6.2, 6.2]) streetLamp(b, g, x + (z > 0 ? 6 : 0), z, lamps);
  // shop signs: THE SUN (with a lit twin for line 16) and THE HERALD
  const sunAt = V(ROOMS.sun.o.x + 0.6, 3.2, -STREET.facade + 0.12);
  const mkSign = (key: string, txt: string, bg: string, fg: string, lit: boolean) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.9), new THREE.MeshBasicMaterial({ map: signTex(key, txt, bg, fg, 768, 150), color: lit ? new THREE.Color(1.8, 1.6, 1.2) : new THREE.Color(1, 1, 1) }));
    m.position.copy(sunAt); g.add(m); return m;
  };
  const sunSign = { dark: mkSign("sunDark", "THE SUN — 1¢", "#1f2a55", "#f2d58a", false), lit: mkSign("sunLit", "THE SUN — 1¢", "#1f2a55", "#ffe7a0", true) };
  sunSign.lit.visible = false;
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.85), new THREE.MeshBasicMaterial({ map: signTex("herald", "THE HERALD", "#6a2a2a", "#f2e6c8", 768, 150) }));
    m.position.set(ROOMS.herald.o.x + 0.6, 3.2, STREET.facade - 0.12); m.rotation.y = Math.PI; g.add(m); }
  for (const [x, z] of [[14, -7.2], [16, -7.0], [-6, 7.2]]) b.add(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 12), lam("barrel", () => ({ color: "#8a5a3a" })), new THREE.Matrix4().makeTranslation(x, 0.52, z));
  // ---- harbour: pier, bollards, the EUROPE signpost ----
  box(b, wood, PIER.x0, 0.0, PIER.z - PIER.w / 2, PIER.x1, 0.3, PIER.z + PIER.w / 2);
  for (let x = PIER.x0 + 1; x <= PIER.x1; x += 2.5) for (const z of [PIER.z - PIER.w / 2, PIER.z + PIER.w / 2]) b.add(new THREE.CylinderGeometry(0.16, 0.16, 2.6, 8), lam("pile", () => ({ color: "#5a3b2a" })), new THREE.Matrix4().makeTranslation(x, -0.9, z));
  for (const z of [-1.6, 1.6]) b.add(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 10), lam("bollard", () => ({ color: "#2a2a33" })), new THREE.Matrix4().makeTranslation(PIER.x1 - 0.6, 0.6, z));
  { const post = lam("signPost", () => ({ color: "#6b4a34" })), x = PIER.x1 - 1.6, z = -1.2;
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), post, new THREE.Matrix4().makeTranslation(x, 1.6, z));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.42), new THREE.MeshBasicMaterial({ map: signTex("europe", "EUROPE →", "#f1e3c0", "#3a2a28", 512, 140), side: THREE.DoubleSide }));
    m.position.set(x + 0.5, 2.5, z); m.rotation.y = -0.6; g.add(m); }
  // ---- the strait ----
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(WATER.x1 - WATER.x0 + 40, 260).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: rep(seaTex(), 12, 24) }));
  sea.position.set((WATER.x0 + WATER.x1) / 2, WATER.y, 0); sea.receiveShadow = true; g.add(sea);
  wallZ(b, lam("quayStoneM", () => ({ map: rep(stoneHD("quayStoneM"), 1, 1) })), -40, 40, WATER.y - 1, 0.01, PIER.x0, 1, [{ x0: PIER.z - PIER.w / 2, x1: PIER.z + PIER.w / 2, y0: -0.6, y1: 0.05 }], 3);
  // Europe's distant coast (line 10): a low green shore with a windmill and a spire
  { const ex = EUROPE.x, ez = EUROPE.z;
    b.add(new THREE.CylinderGeometry(28, 32, 3, 24, 1).scale(1.6, 1, 0.5), grass, new THREE.Matrix4().makeTranslation(ex, WATER.y + 0.5, ez));
    box(b, lam("millWhite", () => ({ color: "#f2ede0" })), ex - 9, 2, ez - 1, ex - 7, 8, ez + 1);
    for (let k = 0; k < 4; k++) b.add(new THREE.BoxGeometry(0.3, 5, 0.1).rotateZ(k * Math.PI / 2 + 0.4), lam("millSail", () => ({ color: "#8a5a3a" })), new THREE.Matrix4().makeTranslation(ex - 8, 7.5, ez + 1.1));
    b.add(new THREE.ConeGeometry(1.2, 6, 4), lam("spire", () => ({ color: "#5d6478" })), new THREE.Matrix4().makeTranslation(ex + 10, 9, ez));
    box(b, lam("church", () => ({ color: "#e6dcc6" })), ex + 8.5, 2, ez - 1.5, ex + 11.5, 6, ez + 1.5); }
  // ---- the Cape: land, beach, cottage, garden, the hill and the giant telescope ----
  ground(b, sand, CAPE.x0, CAPE.x0 + 6, -40, 40, 0.0, 4);
  ground(b, grass, CAPE.x0 + 6, CAPE.x1 + 30, -40, 40, 0.02, 10);
  wallZ(b, sand, -40, 40, WATER.y - 1, 0.0, CAPE.x0, -1, [], 4);
  { const ww = lam("whitewash", () => ({ map: rep(whitewash(), 1, 1) })), thatch = lam("thatch", () => ({ color: "#c9a25a" })), C = COTTAGE;
    wallX(b, ww, C.x - 4, C.x + 4, 0, 3, C.z - 3, -1, [{ x0: C.x - 0.6, x1: C.x + 0.6, y0: 0, y1: 2.2 }], 3); wallX(b, ww, C.x - 4, C.x + 4, 0, 3, C.z + 3, 1, [], 3);
    wallZ(b, ww, C.z - 3, C.z + 3, 0, 3, C.x - 4, -1, [], 3); wallZ(b, ww, C.z - 3, C.z + 3, 0, 3, C.x + 4, 1, [], 3);
    gableRoof(b, thatch, ww, C.x - 4, C.x + 4, C.z - 3, C.z + 3, 3, 2.4, 0.5);
    box(b, lam("cottageDoor", () => ({ color: "#3f6a4a" })), C.x - 0.6, 0, C.z - 3.02, C.x + 0.6, 2.2, C.z - 2.98);
    for (const dx of [-2.4, 2.4]) { box(b, lam("cotWin", () => ({ color: "#3d4a63" })), C.x + dx - 0.5, 1.1, C.z - 3.03, C.x + dx + 0.5, 2.1, C.z - 2.99); box(b, lam("shutterG", () => ({ color: "#3f6a4a" })), C.x + dx - 1.0, 1.1, C.z - 3.04, C.x + dx - 0.55, 2.1, C.z - 3.0); }
    lamps.push({ p: V(C.x + 0.9, 2.3, C.z - 3.3), k: 0.8 }); lampMesh(g, V(C.x + 0.9, 2.3, C.z - 3.3), 0.08);
    // garden: tea table, chair, Herschel's normal-size telescope on a tripod
    const G = GARDEN, darkWood = lam("darkWoodM", () => ({ color: "#5a3a2a" }));
    box(b, lam("cloth", () => ({ color: "#f4f1ea" })), G.x - 0.6, 0.72, G.z - 0.45, G.x + 0.6, 0.76, G.z + 0.45);
    for (const [dx, dz] of [[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.35], [0.5, 0.35]]) box(b, darkWood, G.x + dx - 0.03, 0, G.z + dz - 0.03, G.x + dx + 0.03, 0.72, G.z + dz + 0.03);
    const brass = lam("brassM", () => ({ color: "#c9a04a" })), tx = G.x + 1.8, tz = G.z - 0.4;
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; b.add(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6).rotateX(0.25).rotateY(a), darkWood, new THREE.Matrix4().makeTranslation(tx + Math.cos(a) * 0.25, 0.72, tz + Math.sin(a) * 0.25)); }
    b.add(new THREE.CylinderGeometry(0.07, 0.09, 1.3, 12).rotateZ(-1.0), brass, new THREE.Matrix4().makeTranslation(tx, 1.55, tz));
    for (const [x, z] of [[G.x - 3, G.z + 2], [G.x + 4, G.z + 3]]) tree(b, x, 0, z, 1.0, Math.round(x + z), ["#5c9645", "#4f8a3e"]);
    // the hill + the absurdly huge telescope
    const hill = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(HILL.r, HILL.h, HILL.r);
    b.add(hill, grass, new THREE.Matrix4().makeTranslation(HILL.x, 0, HILL.z));
    const tubeM = lam("tubeBrass", () => ({ color: "#b8873e" })), tubeIn = lam("tubeIn", () => ({ color: "#1a1620", side: THREE.BackSide }));
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), TUBE_DIR), mid = EYEPIECE.clone().addScaledVector(TUBE_DIR, TUBE_LEN / 2);
    const tm = new THREE.Matrix4().compose(mid, q, V(1, 1, 1));
    b.add(new THREE.CylinderGeometry(1.7, 1.25, TUBE_LEN, 32, 1, true), tubeM, tm);
    b.add(new THREE.CylinderGeometry(1.62, 1.18, TUBE_LEN, 32, 1, true), tubeIn, tm);
    for (const f of [0.02, 0.35, 0.7, 0.98]) b.add(new THREE.TorusGeometry(1.25 + 0.47 * f, 0.09, 8, 32).rotateX(Math.PI / 2), lam("tubeRing", () => ({ color: "#7a5a2a" })), new THREE.Matrix4().compose(EYEPIECE.clone().addScaledVector(TUBE_DIR, TUBE_LEN * f), q, V(1, 1, 1)));
    b.add(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 16, 1, true).translate(0, -0.5, 0), brass, new THREE.Matrix4().compose(EYEPIECE, q, V(1, 1, 1))); // eyepiece
    // wooden scaffold under the tube
    const beam = lam("scaffold", () => ({ color: "#7a5236" }));
    for (const f of [0.3, 0.6, 0.85]) { const p = EYEPIECE.clone().addScaledVector(TUBE_DIR, TUBE_LEN * f), h = p.y - 1.4;
      for (const dz of [-1.6, 1.6]) b.add(new THREE.CylinderGeometry(0.12, 0.15, h, 6), beam, new THREE.Matrix4().makeTranslation(p.x, h / 2, p.z + dz)); }
    // a little observatory ladder to the eyepiece
    for (const dx of [-0.3, 0.3]) box(b, beam, EYEPIECE.x + 1.2 + dx - 0.04, HILL.h - 1, EYEPIECE.z - 0.04, EYEPIECE.x + 1.2 + dx + 0.04, EYEPIECE.y + 0.4, EYEPIECE.z + 0.04);
  }
  // ---- the Moon: cratered sphere + the flat-topped plateau world (forest, ocean, beach, rocks) ----
  const moonMat = new THREE.MeshLambertMaterial({ map: moonTex(), emissive: new THREE.Color(0.32, 0.33, 0.4) });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(MOON.r, 48, 32), moonMat); moon.position.copy(MOON.c); g.add(moon);
  { const c = MOON.c, top = MOON_TOP;
    b.add(new THREE.CylinderGeometry(12.5, 11, 3.2, 40), lam("moonRock", () => ({ map: rep(moonTex(), 2, 1) })), new THREE.Matrix4().makeTranslation(c.x, top - 1.6, c.z));
    const mg = lam("moonGrassM", () => ({ map: rep(moonGrass(), 3, 3) }));
    b.add(new THREE.CircleGeometry(12.5, 40).rotateX(-Math.PI / 2), mg, new THREE.Matrix4().makeTranslation(c.x, top, c.z));
    // the moon ocean (east half) + its beach
    b.add(new THREE.CircleGeometry(5.2, 32).rotateX(-Math.PI / 2), lam("moonSand", () => ({ map: rep(sandTex(), 2, 2), color: "#e8e6f2" })), new THREE.Matrix4().makeTranslation(c.x + 5.2, top + 0.02, c.z + 1.5));
    const ocean = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: rep(seaTex(), 2, 2), color: new THREE.Color(0.75, 0.85, 1.1), emissive: new THREE.Color(0.05, 0.08, 0.14) }));
    ocean.position.set(c.x + 6.2, top + 0.05, c.z + 1.9); g.add(ocean);
    // the silver forest (west half)
    for (let k = 0; k < 14; k++) { const a = 1.9 + (k / 14) * 2.6, rr = 6 + (k % 3) * 2; tree(b, c.x + Math.cos(a) * rr, top, c.z + Math.sin(a) * rr, 0.8 + (k % 3) * 0.15, 200 + k, ["#7fb7c9", "#a7c9e6", "#94b0e0", "#b9a7e6"], "#5a5a78"); }
    for (let k = 0; k < 6; k++) { const a = k * 1.1 + 0.4; b.add(new THREE.DodecahedronGeometry(0.5 + (k % 3) * 0.3), lam("moonBoulder", () => ({ color: "#c9cbdc" })), new THREE.Matrix4().makeTranslation(c.x + Math.cos(a) * 10.5, top + 0.3, c.z + Math.sin(a) * 10.5)); }
  }
  // ---- stars (night skies) ----
  const sp: number[] = [], r = rng(1835);
  for (let i = 0; i < 900; i++) { const th = r() * Math.PI * 2, ph = 0.08 + r() * 1.3, R = 1800; sp.push(Math.cos(th) * Math.cos(ph) * R, Math.sin(ph) * R, Math.sin(th) * Math.cos(ph) * R); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(2.2, 2.2, 2.4), size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false }));
  stars.layers.set(NOINK); stars.frustumCulled = false; g.add(stars);
  b.build(g);
  // ---- the slow sailing ship (line 13) ----
  const ship = new THREE.Group();
  { const sb = new Batch(), hull = lam("shipHull", () => ({ color: "#5a3b2a" })), sail = lam("sail", () => ({ color: "#f4eedd", side: THREE.DoubleSide })), mast = lam("mast", () => ({ color: "#6b4a34" }));
    box(sb, hull, -4, -0.6, -1.2, 4, 0.8, 1.2); box(sb, hull, 3.2, 0.2, -0.9, 5.2, 0.8, 0.9); box(sb, lam("shipDeck", () => ({ color: "#b08a5a" })), -4, 0.8, -1.1, 4, 0.9, 1.1);
    for (const [x, h] of [[-1.6, 6.5], [1.6, 7.5]]) { sb.add(new THREE.CylinderGeometry(0.1, 0.12, h, 8), mast, new THREE.Matrix4().makeTranslation(x, 0.9 + h / 2, 0));
      sb.add(new THREE.PlaneGeometry(2.6, 2.6).rotateY(Math.PI / 2), sail, new THREE.Matrix4().makeTranslation(x, 0.9 + h * 0.62, 0));
      sb.add(new THREE.PlaneGeometry(2.0, 1.6).rotateY(Math.PI / 2), sail, new THREE.Matrix4().makeTranslation(x, 0.9 + h * 0.92, 0)); }
    sb.build(ship); }
  root.add(ship);
  return { group: g, lamps, ship, sunSign, stars, moon };
};
