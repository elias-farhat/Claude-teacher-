// Our Hanoi, 1902 (layout.ts): a grand boulevard of ochre colonial houses (white trim, green shutters, arcaded
// ground floors, terracotta roofs), tamarind trees, a tram line, street lamps and tricolour flags; the street holes
// the camera dives through (grate, manhole, drain, quay grate); the quay, the river, Doumer's Paris balcony on the far
// bank; and the rat farm east of the city. Everything is our own geometry + painted canvas textures.
import * as THREE from "three";
import { Batch, lam, quad, V } from "../bridge/build";
import { ctex, rep, rng, stoneHD, roofHD, grassHD, planksHD } from "../bridge/paint";
import { BLVD, GRATE, MANHOLE, DRAIN, QUAY, RIVER, PALACE, FARM, POSTER, TRAM_Z, ROOMS, RoomName } from "./layout";

export type Lamp = { p: THREE.Vector3; k: number };
type Hole = { x0: number; x1: number; y0: number; y1: number };
type ZHole = { x0: number; x1: number; z0: number; z1: number };

// ---------------- painted textures ----------------
/** colonial facade: ochre render, white pilasters + cornice, green louvred shutters, arcaded ground floor */
export const colonialFacade = (seed: number, wm: number, hm: number, plain = false) => {
  const PX = 24, W = Math.round(wm * PX), H = Math.round(hm * PX), m = (v: number) => v * PX;
  return ctex(`colo${seed}_${wm}_${hm}_${plain}`, W, H, (g) => {
    const r = rng(seed * 13 + 5);
    const walls = ["#e9c46e", "#efd08a", "#e6b862", "#f0d89c", "#e8bf7a"];
    g.fillStyle = walls[seed % walls.length]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() > 0.5 ? "255,250,230" : "150,100,40"},0.07)`; g.beginPath(); g.ellipse(r() * W, r() * H, 14 + r() * 40, 8 + r() * 20, 0, 0, 7); g.fill(); }
    g.fillStyle = "rgba(120,80,30,0.18)"; g.fillRect(0, H - m(0.5), W, m(0.5)); // damp plinth
    if (plain) return;
    const floors = Math.max(2, Math.round(hm / 3.6)), fh = H / floors, bays = Math.max(2, Math.round(wm / 3.6)), bw = W / bays;
    const shutter = ["#3f7a5a", "#4c8a6a", "#2f6f6a"][seed % 3];
    for (let b = 0; b <= bays; b++) { g.fillStyle = "#f6efdc"; g.fillRect(b * bw - 4, 0, 8, H); } // pilasters
    for (let f = 0; f < floors; f++) {
      const y0 = H - (f + 1) * fh;
      g.fillStyle = "#f6efdc"; g.fillRect(0, y0 + fh - 7, W, 7); // string course
      for (let b = 0; b < bays; b++) {
        const cx = b * bw + bw / 2;
        if (f === 0) { // arcade: round-headed openings, dark shop interiors
          const ww = bw * 0.62, top = y0 + fh * 0.22, bot = y0 + fh;
          g.fillStyle = "#f6efdc"; g.beginPath(); g.moveTo(cx - ww / 2 - 6, bot); g.lineTo(cx - ww / 2 - 6, top + ww / 2); g.arc(cx, top + ww / 2, ww / 2 + 6, Math.PI, 0); g.lineTo(cx + ww / 2 + 6, bot); g.fill();
          g.fillStyle = "#3a2a28"; g.beginPath(); g.moveTo(cx - ww / 2, bot); g.lineTo(cx - ww / 2, top + ww / 2); g.arc(cx, top + ww / 2, ww / 2, Math.PI, 0); g.lineTo(cx + ww / 2, bot); g.fill();
          g.fillStyle = "rgba(255,210,140,0.25)"; g.fillRect(cx - ww / 2 + 4, top + ww / 2, ww - 8, fh * 0.2);
          continue;
        }
        const ww = bw * 0.42, wy = y0 + fh * 0.2, wh = fh * 0.62;
        g.fillStyle = "#f6efdc"; g.fillRect(cx - ww / 2 - 5, wy - 5, ww + 10, wh + 10);
        g.fillStyle = "#33303c"; g.fillRect(cx - ww / 2, wy, ww, wh);
        for (const s of [-1, 1]) { // open shutters either side, louvres
          const sx = cx + s * (ww / 2 + 5) + (s < 0 ? -ww / 2 : 0);
          g.fillStyle = shutter; g.fillRect(sx, wy, ww / 2, wh);
          g.fillStyle = "rgba(0,0,0,0.22)"; for (let y = wy + 4; y < wy + wh; y += 7) g.fillRect(sx + 2, y, ww / 2 - 4, 2);
        }
        g.fillStyle = "#f6efdc"; g.beginPath(); g.moveTo(cx - ww / 2 - 10, wy - 6); g.lineTo(cx, wy - 20); g.lineTo(cx + ww / 2 + 10, wy - 6); g.fill(); // pediment
        if (f === 1 && (seed + b) % 2 === 0) { // iron balconette
          g.fillStyle = "#2a2a30"; const by = wy + wh * 0.62; g.fillRect(cx - ww / 2 - 8, by, ww + 16, 3); g.fillRect(cx - ww / 2 - 8, by + wh * 0.36, ww + 16, 3);
          for (let x = cx - ww / 2 - 8; x < cx + ww / 2 + 8; x += 6) g.fillRect(x, by, 1.5, wh * 0.36);
        }
      }
    }
    g.fillStyle = "#f6efdc"; g.fillRect(0, 0, W, 10); g.fillStyle = "rgba(120,80,30,0.25)"; g.fillRect(0, 10, W, 3); // cornice
  });
};
const roadTex = () => ctex("hanoiRoad", 1024, 1024, (g, r) => {
  g.fillStyle = "#c9b48e"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 5000; i++) { g.fillStyle = ["#bba47c", "#d6c39e", "#b39a72", "#dccaa8"][i % 4]; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 4, 2 + r() * 4); }
  for (let i = 0; i < 30; i++) { g.strokeStyle = "rgba(120,96,60,0.25)"; g.lineWidth = 3; g.beginPath(); const y = r() * 1024; g.moveTo(0, y); g.bezierCurveTo(300, y + 20 * (r() - 0.5), 700, y - 20 * (r() - 0.5), 1024, y); g.stroke(); } // cart ruts
});
const waterTex = () => ctex("redRiver", 512, 512, (g, r) => {
  g.fillStyle = "#b07a52"; g.fillRect(0, 0, 512, 512); // the Red River is red-brown with silt
  for (let i = 0; i < 160; i++) { g.strokeStyle = r() > 0.4 ? "rgba(240,200,160,0.5)" : "rgba(90,50,30,0.35)"; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 5, x + 30 + r() * 20, y); g.stroke(); }
});
const tileRoof = () => roofHD("#c0623a");
/** painted sign board (unlit, so it stays readable whatever the light) */
export const signTex = (key: string, text: string, bg: string, fg: string, w = 512, h = 160) => ctex("sign" + key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(12, 12, w - 24, h - 24);
  g.fillStyle = fg; g.font = `900 ${Math.round(h * 0.42)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 4);
});
const flagTex = () => ctex("tricolore", 192, 128, (g) => { ["#2a4f9a", "#f4f1ea", "#c8313b"].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 64, 0, 64, 128); }); });

// ---------------- pieces ----------------
export const box = (b: Batch, mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
  b.add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat, new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
/** upward ground rectangle (UV tiled every `tile` m) */
export const ground = (b: Batch, mat: THREE.Material, x0: number, x1: number, z0: number, z1: number, y = 0, tile = 8) =>
  b.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile), mat);
/** upward ground with rectangular holes (the camera dives through them) */
export const holedGround = (b: Batch, mat: THREE.Material, x0: number, x1: number, z0: number, z1: number, holes: ZHole[], y = 0, tile = 8) => {
  const xs = [x0, x1, ...holes.flatMap((h) => [h.x0, h.x1])].filter((x) => x >= x0 && x <= x1).sort((a, c) => a - c);
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i], c = xs[i + 1]; if (c - a < 1e-3) continue;
    const cut = holes.filter((h) => h.x0 <= a + 1e-3 && h.x1 >= c - 1e-3).sort((p, q) => p.z0 - q.z0);
    let lo = z0;
    for (const h of cut) { if (h.z0 - lo > 1e-3) b.add(quad(V(a, y, h.z0), V(c, y, h.z0), V(c, y, lo), V(a, y, lo), (c - a) / tile, (h.z0 - lo) / tile), mat); lo = h.z1; }
    if (z1 - lo > 1e-3) b.add(quad(V(a, y, z1), V(c, y, z1), V(c, y, lo), V(a, y, lo), (c - a) / tile, (z1 - lo) / tile), mat);
  }
};
/** vertical wall along x at plane z, facing +z (s = 1) or -z (s = -1), with holes; texture spans the whole wall */
export const wallX = (b: Batch, mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z: number, s: 1 | -1, holes: Hole[] = []) => {
  const W = x1 - x0, H = y1 - y0, xs = [x0, x1, ...holes.flatMap((h) => [h.x0, h.x1])].sort((a, c) => a - c);
  const U = (x: number) => (s > 0 ? (x - x0) / W : (x1 - x) / W), Vv = (y: number) => (y - y0) / H;
  const rect = (a: number, c: number, lo: number, hi: number) => {
    if (c - a < 1e-3 || hi - lo < 1e-3) return;
    if (s > 0) b.add(quad(V(a, lo, z), V(c, lo, z), V(c, hi, z), V(a, hi, z), U(c), Vv(hi), U(a), Vv(lo)), mat);
    else b.add(quad(V(c, lo, z), V(a, lo, z), V(a, hi, z), V(c, hi, z), U(a), Vv(hi), U(c), Vv(lo)), mat);
  };
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i], c = xs[i + 1], cut = holes.filter((h) => h.x0 <= a + 1e-3 && h.x1 >= c - 1e-3).sort((p, q) => p.y0 - q.y0);
    let lo = y0;
    for (const h of cut) { rect(a, c, lo, h.y0); lo = h.y1; }
    rect(a, c, lo, y1);
  }
};
/** vertical wall along z at plane x, facing +x (s = 1) or -x (s = -1), with holes (x0/x1 of a hole = z range) */
export const wallZ = (b: Batch, mat: THREE.Material, z0: number, z1: number, y0: number, y1: number, x: number, s: 1 | -1, holes: Hole[] = []) => {
  const W = z1 - z0, H = y1 - y0, zs = [z0, z1, ...holes.flatMap((h) => [h.x0, h.x1])].sort((a, c) => a - c);
  const U = (z: number) => (s > 0 ? (z1 - z) / W : (z - z0) / W), Vv = (y: number) => (y - y0) / H;
  const rect = (a: number, c: number, lo: number, hi: number) => {
    if (c - a < 1e-3 || hi - lo < 1e-3) return;
    if (s > 0) b.add(quad(V(x, lo, c), V(x, lo, a), V(x, hi, a), V(x, hi, c), U(a), Vv(hi), U(c), Vv(lo)), mat);
    else b.add(quad(V(x, lo, a), V(x, lo, c), V(x, hi, c), V(x, hi, a), U(c), Vv(hi), U(a), Vv(lo)), mat);
  };
  for (let i = 0; i + 1 < zs.length; i++) {
    const a = zs[i], c = zs[i + 1], cut = holes.filter((h) => h.x0 <= a + 1e-3 && h.x1 >= c - 1e-3).sort((p, q) => p.y0 - q.y0);
    let lo = y0;
    for (const h of cut) { rect(a, c, lo, h.y0); lo = h.y1; }
    rect(a, c, lo, y1);
  }
};
/** gable roof along x over x0..x1 / z0..z1 from eaves height h, ridge rise r */
export const gableRoof = (b: Batch, mat: THREE.Material, end: THREE.Material, x0: number, x1: number, z0: number, z1: number, h: number, r: number, o = 0.6) => {
  const zm = (z0 + z1) / 2, X0 = x0 - o, X1 = x1 + o, Z0 = z0 - o, Z1 = z1 + o, u = (X1 - X0) / 4, v = Math.hypot(r, (Z1 - Z0) / 2) / 4;
  b.add(quad(V(X0, h, Z1), V(X1, h, Z1), V(X1, h + r, zm), V(X0, h + r, zm), u, v), mat);
  b.add(quad(V(X1, h, Z0), V(X0, h, Z0), V(X0, h + r, zm), V(X1, h + r, zm), u, v), mat);
  const tri = (x: number, s: number) => { const g = new THREE.BufferGeometry(); const pts = s > 0 ? [x, h, z1, x, h, z0, x, h + r, zm] : [x, h, z0, x, h, z1, x, h + r, zm]; g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); g.computeVertexNormals(); b.add(g, end); };
  tri(x1, 1); tri(x0, -1);
};
export const lampMesh = (root: THREE.Object3D, p: THREE.Vector3, r = 0.16, col = new THREE.Color(5.0, 3.1, 1.3)) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: col })); m.position.copy(p); root.add(m); return m;
};

/** a colonial row block: front plane at zf facing s (+1 = +z), depth d, from x0 to x1, holes on the front */
const rowBlock = (b: Batch, x0: number, x1: number, zf: number, s: 1 | -1, d: number, h: number, seed: number, holes: Hole[] = []) => {
  const fr = lam(`coloF${seed}_${x1 - x0}_${h}`, () => ({ map: colonialFacade(seed, x1 - x0, h) }));
  const sd = lam(`coloS${seed}_${d}_${h}`, () => ({ map: colonialFacade(seed + 7, d, h, true) }));
  const zb = zf - s * d;
  wallX(b, fr, x0, x1, 0, h, zf, s, holes);
  wallX(b, sd, x0, x1, 0, h, zb, (-s) as 1 | -1);
  wallZ(b, sd, Math.min(zf, zb), Math.max(zf, zb), 0, h, x1, 1); wallZ(b, sd, Math.min(zf, zb), Math.max(zf, zb), 0, h, x0, -1);
  const tm = lam("tiles", () => ({ map: rep(tileRoof(), 1, 1) })), white = lam("coloTrim", () => ({ color: "#f6efdc" }));
  box(b, white, x0 - 0.3, h - 0.2, Math.min(zf, zb) - 0.3, x1 + 0.3, h + 0.35, Math.max(zf, zb) + 0.3); // cornice
  gableRoof(b, tm, sd, x0, x1, Math.min(zf, zb), Math.max(zf, zb), h + 0.35, 3.2);
  for (const hh of holes) { // white frames round real openings (street side)
    const t = 0.2, z = zf + s * 0.09;
    box(b, white, hh.x0 - t, hh.y1, z - 0.09, hh.x1 + t, hh.y1 + t, z + 0.09);
    for (const x of [hh.x0 - t, hh.x1]) box(b, white, x, hh.y0, z - 0.09, x + t, hh.y1, z + 0.09);
    if (hh.y0 > 0.1) box(b, white, hh.x0 - t - 0.1, hh.y0 - 0.12, z - 0.2, hh.x1 + t + 0.1, hh.y0, z + 0.2);
  }
};
const flag = (b: Batch, root: THREE.Object3D, base: THREE.Vector3, yaw: number, len = 2.4) => {
  const pole = lam("flagpole", () => ({ color: "#f4f1ea" }));
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(base);
  b.add(new THREE.CylinderGeometry(0.05, 0.05, len, 6).rotateZ(Math.PI / 2 - 0.5).translate(len * 0.44, len * 0.24, 0), pole, M);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), new THREE.MeshLambertMaterial({ map: flagTex(), side: THREE.DoubleSide }));
  m.position.set(len * 0.86, len * 0.46 - 0.55, 0); const g = new THREE.Group(); g.add(m); g.applyMatrix4(M); root.add(g);
};
const tree = (b: Batch, x: number, z: number, s: number, seed: number) => {
  const trunk = lam("trunk", () => ({ color: "#6b4a34" })), leaf = lam(`leaf${seed % 3}`, () => ({ color: ["#4f8a3e", "#5c9645", "#467d3a"][seed % 3] }));
  const r = rng(seed * 31 + 7);
  b.add(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 3.4 * s, 8), trunk, new THREE.Matrix4().makeTranslation(x, 1.7 * s, z));
  for (let k = 0; k < 4; k++) b.add(new THREE.IcosahedronGeometry((1.4 + r() * 0.7) * s, 1), leaf, new THREE.Matrix4().makeTranslation(x + (r() - 0.5) * 2.2 * s, (3.9 + r() * 1.2) * s, z + (r() - 0.5) * 2.2 * s));
};
const streetLamp = (b: Batch, root: THREE.Object3D, x: number, z: number, lamps: Lamp[]) => {
  const iron = lam("lampIron", () => ({ color: "#2a2a33" }));
  b.add(new THREE.CylinderGeometry(0.07, 0.11, 4.2, 8), iron, new THREE.Matrix4().makeTranslation(x, 2.1, z));
  box(b, iron, x - 0.22, 4.15, z - 0.22, x + 0.22, 4.25, z + 0.22);
  b.add(new THREE.CylinderGeometry(0.06, 0.24, 0.3, 4).rotateY(Math.PI / 4), iron, new THREE.Matrix4().makeTranslation(x, 4.85, z));
  lamps.push({ p: V(x, 4.55, z), k: 0.8 });
};

/** the tram: a cream + green open-sided car with a trolley pole (moves along x on TRAM_Z) */
const buildTram = () => {
  const b = new Batch(), g = new THREE.Group();
  const cream = lam("tramCream", () => ({ color: "#efe2bf" })), green = lam("tramGreen", () => ({ color: "#2f6b52" })), dark = lam("tramDark", () => ({ color: "#2a2a33" })), red = lam("tramRed", () => ({ color: "#a33a2e" }));
  box(b, green, -4.2, 0.45, -1.15, 4.2, 1.35, 1.15);                 // lower body
  for (const x of [-4.1, -2.0, 0, 2.0, 4.1]) for (const z of [-1.1, 1.1]) box(b, cream, x - 0.07, 1.35, z - 0.05, x + 0.07, 2.75, z + 0.05); // posts
  box(b, cream, -4.4, 2.75, -1.3, 4.4, 3.0, 1.3); box(b, red, -4.4, 3.0, -1.0, 4.4, 3.15, 1.0); // roof
  box(b, dark, -3.6, 0.95, -0.6, 3.6, 1.0, 0.6);                     // bench tops
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 6).rotateZ(-0.9), dark, new THREE.Matrix4().makeTranslation(-1.2, 4.2, 0)); // trolley pole
  for (const x of [-2.8, 2.8]) for (const z of [-0.75, 0.75]) b.add(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 14).rotateX(Math.PI / 2), dark, new THREE.Matrix4().makeTranslation(x, 0.4, z));
  b.build(g);
  return g;
};

export type Hanoi = { group: THREE.Group; lamps: Lamp[]; tram: THREE.Group; sewerHoles: ZHole[] };

export const buildHanoi = (root: THREE.Object3D): Hanoi => {
  const b = new Batch(), g = new THREE.Group(), lamps: Lamp[] = [];
  root.add(g);
  const road = lam("hanoiRoad", () => ({ map: roadTex() })), walk = lam("hanoiWalk", () => ({ map: stoneHD("hanoiWalk", ["#ddd2bf", "#d2c5b0", "#e4dac9", "#cdbfa7"], "#a8987f") }));
  const grass = lam("grass", () => ({ map: grassHD() })), kerb = lam("kerb", () => ({ color: "#bdb3a2" })), iron = lam("iron", () => ({ color: "#2a2a33" }));
  // ---- the street holes the camera passes through (sewer shafts open below; sewer.ts builds the shafts) ----
  const sq = (x: number, z: number, r: number): ZHole => ({ x0: x - r, x1: x + r, z0: z - r, z1: z + r });
  const holes = [sq(GRATE.x, GRATE.z, 0.75), sq(MANHOLE.x, MANHOLE.z, 0.6), sq(DRAIN.x, DRAIN.z, 0.5)];
  const quayHole = sq(QUAY.grate.x, QUAY.grate.z, 0.7);
  // ---- boulevard: carriageway, kerbs, sidewalks; the rest of the town floor is packed earth / grass ----
  holedGround(b, road, BLVD.x0, BLVD.x1, -BLVD.road, BLVD.road, holes.filter((h) => h.z1 <= BLVD.road), 0, 10);
  holedGround(b, walk, BLVD.x0, BLVD.x1, BLVD.road, BLVD.z1, holes.filter((h) => h.z0 >= BLVD.road), 0.12, 3);
  ground(b, walk, BLVD.x0, BLVD.x1, BLVD.z0, -BLVD.road, 0.12, 3);
  for (const z of [-BLVD.road, BLVD.road]) box(b, kerb, BLVD.x0, 0, z - 0.12, BLVD.x1, 0.14, z + 0.12);
  ground(b, road, BLVD.x1, 175, -10, 10, 0, 10);                                   // dirt road on to the farm
  ground(b, grass, 112, 190, 10, 60, -0.02, 12); ground(b, grass, 112, 190, -60, -10, -0.02, 12);
  ground(b, grass, -140, BLVD.x0, -30, 40, -0.02, 12);
  holedGround(b, walk, -70, 112, QUAY.z1, -24, [quayHole], 0.05, 3);              // quay promenade
  ground(b, road, -70, 112, 10, 30, -0.01, 10);                                    // behind the south row
  // tram rails
  for (const dz of [-0.72, 0.72]) box(b, iron, -80, 0.0, TRAM_Z + dz - 0.04, 180, 0.04, TRAM_Z + dz + 0.04);
  // grate / manhole / drain rims and covers (open: lid lifted aside), quay grate rim
  const rim = (h: ZHole, y: number) => { box(b, iron, h.x0 - 0.1, y, h.z0 - 0.1, h.x1 + 0.1, y + 0.05, h.z0); box(b, iron, h.x0 - 0.1, y, h.z1, h.x1 + 0.1, y + 0.05, h.z1 + 0.1); box(b, iron, h.x0 - 0.1, y, h.z0, h.x0, y + 0.05, h.z1); box(b, iron, h.x1, y, h.z0, h.x1 + 0.1, y + 0.05, h.z1); };
  holes.forEach((h, i) => rim(h, i === 2 ? 0.12 : 0)); rim(quayHole, 0.05);
  box(b, iron, GRATE.x + 0.9, 0, GRATE.z - 0.75, GRATE.x + 2.3, 0.08, GRATE.z + 0.75);      // grate lifted aside
  b.add(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 20), iron, new THREE.Matrix4().makeTranslation(MANHOLE.x + 1.5, 0.04, MANHOLE.z + 0.4)); // manhole lid slid aside
  // ---- north row (front at z = -10, facing +z): the fancy house holds the bath + kitchen windows ----
  const winHole = (name: RoomName, k: number): Hole => { const r = ROOMS[name], op = r.open.filter((o) => o.wall === "s" || o.wall === "n")[k]; return { x0: r.o.x + op.at - op.w / 2, x1: r.o.x + op.at + op.w / 2, y0: r.o.y + op.y, y1: r.o.y + op.y + op.h }; };
  const north: [number, number, number, number, Hole[]][] = [[-70, -48, 11, 1, []], [-48, -24, 10, 2, []], [-24, 2, 12, 3, []], [2, 24, 10.5, 4, [winHole("bath", 0), winHole("kitchen", 0)]],
    [24, 46, 11.5, 5, []], [46, 52, 9.5, 6, []], [52, 72, 9.5, 7, []], [72, 92, 12, 8, []], [92, 112, 10, 9, []]];
  for (const [x0, x1, h, seed, hs] of north) rowBlock(b, x0, x1, BLVD.z0, 1, 14, h, seed, hs);
  // the poster wall: a blank rendered stretch at street level (the posters are cards in stage.ts)
  const plain = lam("posterWall", () => ({ map: colonialFacade(21, 8, 4, true) }));
  wallX(b, plain, POSTER.x - 4, POSTER.x + 4, 0, 4, BLVD.z0 + 0.05, 1);
  // ---- south row (front at z = +10, facing -z): city hall with the bounty office ----
  const offHoles = ROOMS.office.open.filter((o) => o.wall === "n").map((op) => ({ x0: ROOMS.office.o.x + op.at - op.w / 2, x1: ROOMS.office.o.x + op.at + op.w / 2, y0: op.y, y1: op.y + op.h }));
  const south: [number, number, number, number, Hole[]][] = [[-70, -46, 10, 11, []], [-46, -20, 11.5, 12, []], [-20, 6, 10, 13, []], [6, 30, 12, 14, []], [30, 50, 10.5, 15, []], [50, 64, 11, 16, []], [64, 90, 13, 17, offHoles], [90, 112, 10, 18, []]];
  for (const [x0, x1, h, seed, hs] of south) rowBlock(b, x0, x1, BLVD.z1, -1, 14, h, seed, hs);
  // city hall: pediment, clock, sign, flags, steps
  const white = lam("coloTrim", () => ({ color: "#f6efdc" })), sign = new THREE.MeshBasicMaterial({ map: signTex("mairie", "HÔTEL DE VILLE", "#f6efdc", "#3a2a28", 768, 128) });
  { const cx = 77, z = BLVD.z1 - 0.15;
    const tri = new THREE.BufferGeometry(); tri.setAttribute("position", new THREE.Float32BufferAttribute([cx + 8, 13.3, z, cx - 8, 13.3, z, cx, 16.2, z], 3)); tri.computeVertexNormals();
    b.add(tri, lam("pediment", () => ({ color: "#f6efdc", side: THREE.DoubleSide })));
    const cl = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({ map: ctex("clock", 128, 128, (gg) => { gg.fillStyle = "#f8f4ea"; gg.beginPath(); gg.arc(64, 64, 60, 0, 7); gg.fill(); gg.strokeStyle = "#2a2a30"; gg.lineWidth = 6; gg.stroke(); gg.beginPath(); gg.moveTo(64, 64); gg.lineTo(64, 22); gg.moveTo(64, 64); gg.lineTo(92, 70); gg.stroke(); }) }));
    cl.position.set(cx, 14.4, z - 0.05); cl.rotation.y = Math.PI; g.add(cl);
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.15), sign); sm.position.set(cx, 11.2, z - 0.06); sm.rotation.y = Math.PI; g.add(sm);
    flag(b, g, V(cx - 6, 9.5, z - 0.1), -Math.PI / 2 - 0.3); flag(b, g, V(cx + 6, 9.5, z - 0.1), -Math.PI / 2 + 0.3);
    box(b, white, 79.6 - 1.4, 0, BLVD.z1 - 1.2, 79.6 + 1.4, 0.18, BLVD.z1); }
  flag(b, g, V(12, 7.5, BLVD.z0 + 0.1), Math.PI / 2 + 0.3);
  // the bounty table outside the city hall door (line 15)
  { const wd = lam("tableWood", () => ({ color: "#7a4a32" })), cloth = lam("greenCloth", () => ({ color: "#2f6a4a" }));
    box(b, cloth, 81.5, 0.12 + 0.74, 8.3, 83.3, 0.12 + 0.8, 9.1); box(b, cloth, 81.5, 0.5, 8.28, 83.3, 0.86, 8.3);
    for (const [x, z] of [[81.6, 8.4], [83.2, 8.4], [81.6, 9.0], [83.2, 9.0]]) box(b, wd, x - 0.04, 0.12, z - 0.04, x + 0.04, 0.86, z + 0.04);
    box(b, wd, 82.1, 0.12, 9.35, 82.7, 0.58, 9.85); }
  // ---- trees + lamps along both sidewalks ----
  for (let x = -64; x < 110; x += 12) {
    for (const z of [-8, 8]) { if (Math.abs(x - POSTER.x) < 6 && z < 0) continue; if (Math.abs(x - DRAIN.x) < 3 && z > 0) continue; tree(b, x, z, 1.15, Math.round(x + z)); }
    if ((x + 64) % 24 === 0) for (const z of [-7, 7]) streetLamp(b, g, x + 6, z, lamps);
  }
  // ---- quay: embankment wall, river, far bank + the Paris palace with Doumer's balcony ----
  const quayStone = lam("quayStone", () => ({ map: stoneHD("quayStone", ["#c9bca6", "#bfb19a", "#d3c7b2", "#b5a68e"], "#8f8270") }));
  wallX(b, quayStone, -70, 112, RIVER.y - 1, 0.05, QUAY.z1, 1);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(200, RIVER.z0 - RIVER.z1 + 4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: rep(waterTex(), 10, 2) }));
  water.position.set(20, RIVER.y, (RIVER.z0 + RIVER.z1) / 2); water.receiveShadow = true; g.add(water);
  wallX(b, quayStone, -70, 112, RIVER.y - 1, 0, RIVER.z1, -1);
  ground(b, walk, -70, 112, PALACE.z, RIVER.z1, 0, 3);
  const pal = lam("palace", () => ({ map: ctex("palaceF", 1104, 384, (gg) => {
    gg.fillStyle = "#efe6d2"; gg.fillRect(0, 0, 1104, 384);
    for (let x = 24; x < 1104; x += 72) { gg.fillStyle = "#f8f3e6"; gg.fillRect(x, 40, 22, 344); gg.fillStyle = "rgba(120,100,70,0.2)"; gg.fillRect(x + 20, 40, 3, 344); }
    for (let x = 52; x < 1104; x += 72) for (const y of [90, 230]) { gg.fillStyle = "#3d4a63"; gg.fillRect(x, y, 26, 70); gg.fillStyle = "#f8f3e6"; gg.fillRect(x - 4, y - 8, 34, 6); }
    gg.fillStyle = "#d8ccb2"; gg.fillRect(0, 0, 1104, 36); gg.fillRect(0, 200, 1104, 8);
  }) }));
  wallX(b, pal, PALACE.x - PALACE.w / 2, PALACE.x + PALACE.w / 2, 0, PALACE.h, PALACE.z, 1);
  box(b, lam("palaceRoof", () => ({ color: "#5d6a86" })), PALACE.x - PALACE.w / 2 - 0.5, PALACE.h, PALACE.z - 14, PALACE.x + PALACE.w / 2 + 0.5, PALACE.h + 0.6, PALACE.z + 0.5);
  { const y = PALACE.balconyY, x0 = PALACE.x - 4, x1 = PALACE.x + 4, z = PALACE.z;
    box(b, white, x0, y - 0.3, z, x1, y, z + 1.8);                                                          // balcony slab
    for (let x = x0 + 0.1; x <= x1 - 0.05; x += 0.35) box(b, white, x - 0.05, y, z + 1.68, x + 0.05, y + 0.9, z + 1.78); // balusters
    box(b, white, x0, y + 0.9, z + 1.62, x1, y + 1.02, z + 1.82);
    box(b, lam("balconyDoor", () => ({ color: "#3d3550" })), PALACE.x - 1.1, y, z + 0.01, PALACE.x + 1.1, y + 3, z + 0.05);
    const red = lam("drape", () => ({ color: "#b8262e" }));
    box(b, red, x0 + 0.2, y - 1.6, z + 1.84, x1 - 0.2, y - 0.3, z + 1.86);                                     // red drape under the rail
    flag(b, g, V(PALACE.x - 6, y + 2.5, z + 0.1), Math.PI / 2 + 0.4); flag(b, g, V(PALACE.x + 6, y + 2.5, z + 0.1), Math.PI / 2 - 0.4); }
  for (let x = PALACE.x - 22; x <= PALACE.x + 22; x += 11) streetLamp(b, g, x, RIVER.z1 - 2, lamps);
  // ---- the rat farm (east of the city): farmhouse with a roof terrace, fence, coop, hay; the barn is in rooms.ts ----
  { const H = FARM.house, wood = lam("farmWood", () => ({ map: rep(planksHD(), 2, 1) })), mud = lam("farmMud", () => ({ map: colonialFacade(31, 10, 5, true) }));
    wallX(b, mud, H.x - 5, H.x + 5, 0, 5, H.z - 4, -1); wallX(b, mud, H.x - 5, H.x + 5, 0, 5, H.z + 4, 1);
    wallZ(b, mud, H.z - 4, H.z + 4, 0, 5, H.x - 5, -1); wallZ(b, mud, H.z - 4, H.z + 4, 0, 5, H.x + 5, 1);
    box(b, wood, H.x - 5.2, 5, H.z - 4.2, H.x + 5.2, 5.25, H.z + 4.2);                                      // flat roof terrace
    for (const [x0, z0, x1, z1] of [[H.x - 5.2, H.z - 4.2, H.x + 5.2, H.z - 4.0], [H.x - 5.2, H.z + 4.0, H.x + 5.2, H.z + 4.2], [H.x - 5.2, H.z - 4.2, H.x - 5.0, H.z + 4.2], [H.x + 5.0, H.z - 4.2, H.x + 5.2, H.z + 4.2]])
      box(b, mud, x0, 5.25, z0, x1, 5.9, z1);                                                              // parapet
    box(b, lam("farmDoor", () => ({ color: "#5a3b2a" })), H.x - 0.7, 0, H.z - 4.05, H.x + 0.7, 2.2, H.z - 4.0);
    for (let x = 112; x <= 162; x += 2.5) { box(b, wood, x - 0.06, 0, -14.06, x + 0.06, 1.1, -13.94); box(b, wood, x - 0.06, 0, 26.94, x + 0.06, 1.1, 27.06); }
    box(b, wood, 112, 0.75, -14.04, 162, 0.85, -13.96); box(b, wood, 112, 0.75, 26.96, 162, 0.85, 27.04);
    const hay = lam("hay", () => ({ color: "#e0c068" }));
    for (const [x, z] of [[134, 12], [136, 13.5], [152, 12], [117, -6]]) box(b, hay, x - 0.8, 0, z - 0.5, x + 0.8, 0.9, z + 0.5);
    box(b, wood, 120, 0, 8, 122.5, 1.4, 10); gableRoof(b, lam("coopRoof", () => ({ color: "#8a5a3a" })), wood, 120, 122.5, 8, 10, 1.4, 0.7, 0.2); // chicken coop
    tree(b, 118, 14, 1.3, 77); tree(b, 160, 18, 1.4, 78); tree(b, 158, -12, 1.2, 79); }
  b.build(g);
  const tram = buildTram(); root.add(tram);
  return { group: g, lamps, tram, sewerHoles: [...holes, quayHole] };
};
