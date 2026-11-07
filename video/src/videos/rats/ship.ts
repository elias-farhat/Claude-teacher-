// Doumer's steamer at the Hanoi quay (line 20): a readable ship, not a wall. Dark hull, white saloon decks with rows of
// brass portholes and windows, deck rails, lifeboats, two red funnels with black tops, fore + aft masts with signal
// flags, a tricolour at the stern and a railed gangway to the quay. Long axis along x, the quay side is +z.
import * as THREE from "three";
import { Batch, lam } from "../bridge/build";
import { ctex } from "../bridge/paint";
import { box } from "./hanoi";

const deckTex = (key: string, w: number, h: number, rows: { y: number; kind: "port" | "win" }[]) => ctex(key, w, h, (g) => {
  g.fillStyle = "#f4efe4"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#c9b48a"; g.fillRect(0, 0, w, h * 0.06);                                    // varnished rail band on top
  g.fillStyle = "rgba(90,80,70,0.25)"; g.fillRect(0, h * 0.94, w, h * 0.06);
  for (const r of rows) for (let x = 40; x < w - 20; x += r.kind === "port" ? 56 : 90) {
    if (r.kind === "port") { g.fillStyle = "#c9a04a"; g.beginPath(); g.arc(x, r.y * h, 17, 0, 7); g.fill(); g.fillStyle = "#2f4a6e"; g.beginPath(); g.arc(x, r.y * h, 11, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.6)"; g.fillRect(x - 6, r.y * h - 7, 5, 5); }
    else { g.fillStyle = "#3a4f72"; g.fillRect(x - 26, r.y * h - 22, 52, 44); g.fillStyle = "#f4efe4"; g.fillRect(x - 2, r.y * h - 22, 4, 44); g.fillStyle = "#ffd88a"; g.fillRect(x - 22, r.y * h - 18, 18, 14); }
  }
});

export const buildSteamer = () => {
  const b = new Batch(), g = new THREE.Group();
  const hull = lam("stHull", () => ({ color: "#26232c" })), red = lam("stRed", () => ({ color: "#b8262e" })), black = lam("stBlack", () => ({ color: "#1c1a20" }));
  const white = lam("stWhite", () => ({ color: "#f4efe4" })), wood = lam("stWood", () => ({ color: "#a8784a" })), mastM = lam("stMast", () => ({ color: "#8a6a4a" }));
  const lower = lam("stLower", () => ({ map: deckTex("stLowerT", 1152, 180, [{ y: 0.5, kind: "port" }]) }));
  const upper = lam("stUpper", () => ({ map: deckTex("stUpperT", 640, 134, [{ y: 0.52, kind: "win" }]) }));
  // hull + bow, a white sheer line and the red boot-top at the waterline
  box(b, hull, -16, -4.6, -3.6, 16, 0.5, 3.6);
  b.add(new THREE.CylinderGeometry(3.6, 3.6, 5.1, 16, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI / 2).scale(1.4, 1, 1), hull, new THREE.Matrix4().makeTranslation(16, -2.05, 0));
  box(b, white, -16, 0.3, -3.62, 16, 0.5, 3.62);
  box(b, red, -16, -2.6, -3.63, 16, -2.1, 3.63);
  box(b, wood, -15.6, 0.5, -3.4, 15.6, 0.56, 3.4);                                             // deck planks
  // deck rails along both sides
  for (const z of [-3.5, 3.5]) { box(b, white, -15.6, 1.45, z - 0.04, 15.6, 1.53, z + 0.04); for (let x = -15.4; x <= 15.4; x += 1.4) box(b, white, x - 0.035, 0.5, z - 0.035, x + 0.035, 1.5, z + 0.035); }
  // saloon decks with portholes / windows, and their own rails
  box(b, lower, -10, 0.5, -2.6, 8, 3.3, 2.6); box(b, white, -10.3, 3.3, -2.9, 8.3, 3.42, 2.9);
  box(b, upper, -6, 3.42, -2.0, 4, 5.4, 2.0); box(b, white, -6.3, 5.4, -2.2, 4.3, 5.52, 2.2);
  for (const z of [-2.85, 2.85]) { box(b, white, -10.2, 4.2, z - 0.03, 8.2, 4.26, z + 0.03); for (let x = -10; x <= 8; x += 1.2) box(b, white, x - 0.03, 3.42, z - 0.03, x + 0.03, 4.24, z + 0.03); }
  // lifeboats hanging beside the upper deck
  for (const x of [-4.6, 1.8]) for (const z of [-2.55, 2.55]) {
    b.add(new THREE.CylinderGeometry(0.42, 0.42, 3.0, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI), white, new THREE.Matrix4().makeTranslation(x, 4.7, z));
    box(b, wood, x - 1.5, 4.68, z - 0.38, x + 1.5, 4.74, z + 0.38);
    for (const dx of [-1.3, 1.3]) box(b, black, x + dx - 0.04, 4.7, z - 0.04, x + dx + 0.04, 5.9, z + 0.04);
  }
  // funnels: red with black tops
  for (const x of [-3, 2]) {
    b.add(new THREE.CylinderGeometry(0.8, 0.9, 3.4, 16), red, new THREE.Matrix4().makeTranslation(x, 7.1, 0));
    b.add(new THREE.CylinderGeometry(0.82, 0.82, 0.9, 16), black, new THREE.Matrix4().makeTranslation(x, 9.2, 0));
  }
  // masts with yards, stays, and a line of signal flags from the fore mast to the bow
  for (const x of [-12.5, 12.5]) {
    b.add(new THREE.CylinderGeometry(0.1, 0.15, 12, 8), mastM, new THREE.Matrix4().makeTranslation(x, 6.5, 0));
    box(b, mastM, x - 0.06, 9.6, -1.8, x + 0.06, 9.7, 1.8);
  }
  const stay = (a: THREE.Vector3, c: THREE.Vector3, m: THREE.Material, r = 0.025) => {
    const d = c.clone().sub(a), L = d.length();
    b.add(new THREE.CylinderGeometry(r, r, L, 4).translate(0, L / 2, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())), m, new THREE.Matrix4().makeTranslation(a.x, a.y, a.z));
  };
  const top0 = new THREE.Vector3(12.5, 12.4, 0), top1 = new THREE.Vector3(-12.5, 12.4, 0);
  stay(top0, new THREE.Vector3(19.5, 0.6, 0), black); stay(top1, new THREE.Vector3(-15.8, 0.6, 0), black); stay(top0, top1, black);
  const flags = [red, lam("stBlue", () => ({ color: "#2a4f9a" })), lam("stYel", () => ({ color: "#e8c45a" })), white];
  for (let k = 1; k < 9; k++) {
    const u = k / 9, p = top0.clone().lerp(new THREE.Vector3(19.5, 0.6, 0), u);
    const tri = new THREE.BufferGeometry(); tri.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.5, -0.55, 0, -0.1, -0.6, 0], 3)); tri.computeVertexNormals();
    b.add(tri, flags[k % 4], new THREE.Matrix4().makeTranslation(p.x, p.y, p.z));
  }
  // tricolour at the stern
  b.add(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), black, new THREE.Matrix4().makeTranslation(-15.4, 2.0, 0));
  ["#2a4f9a", "#f4efe4", "#c8313b"].forEach((c, i) => box(b, lam(`stTri${i}`, () => ({ color: c, side: THREE.DoubleSide })), -15.4 - 0.5 * (i + 1), 2.6, -0.02, -15.4 - 0.5 * i, 3.4, 0.02));
  b.build(g);
  return g;
};

/** the gangway from the quay edge (z0) onto the deck (z1), x = centre, in world space */
export const buildGangway = (root: THREE.Object3D, x: number, z0: number, z1: number, y0: number, y1: number) => {
  const b = new Batch(), g = new THREE.Group(), wood = lam("stWood", () => ({ color: "#a8784a" })), white = lam("stWhite", () => ({ color: "#f4efe4" }));
  const L = Math.hypot(z1 - z0, y1 - y0), a = Math.atan2(y1 - y0, z0 - z1);
  const M = new THREE.Matrix4().makeTranslation(x, (y0 + y1) / 2, (z0 + z1) / 2).multiply(new THREE.Matrix4().makeRotationX(a));
  b.add(new THREE.BoxGeometry(1.1, 0.08, L), wood, M);
  for (const s of [-0.55, 0.55]) { b.add(new THREE.BoxGeometry(0.05, 0.05, L).translate(s, 0.95, 0), white, M); for (const t of [-0.45, 0, 0.45]) b.add(new THREE.BoxGeometry(0.04, 0.95, 0.04).translate(s, 0.48, t * L), white, M); }
  b.build(g); root.add(g);
};
