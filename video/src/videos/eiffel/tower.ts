// The hero: the Eiffel Tower from simple geometry (box beams), ~1:1 scale (324 m). The world ink pass outlines every
// beam, so the lattice reads as an etched iron drawing. Profile (half-widths, m): outer corners 62.5 at the ground,
// 38 at the 1st floor (57 m), 21 at the 2nd (115 m), 8.5 at the top floor (276 m); legs stay separate below 115 m.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { lam } from "../bridge/build";
import { ctex } from "../bridge/paint";

type V3 = [number, number, number];
const knots = (ys: number[], vs: number[]) => (y: number) => {
  // monotone interpolation in log space (concave Eiffel curve)
  const lv = vs.map(Math.log);
  let i = 0;
  while (i < ys.length - 2 && y > ys[i + 1]) i++;
  const t = Math.min(1, Math.max(0, (y - ys[i]) / (ys[i + 1] - ys[i])));
  const s = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
  return Math.exp(lv[i] + (lv[i + 1] - lv[i]) * s);
};
/** outer half-width of the tower at height y */
export const OUTER = knots([0, 57, 115, 200, 276], [62.5, 38, 21, 13.5, 8.5]);
/** inner half-width of the legs (y < 115) */
export const INNER = knots([0, 57, 115], [37, 24, 10]);
export const FLOOR1 = 57, FLOOR2 = 115, TOP = 276;

const up = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sc = new THREE.Vector3();
const unit = new THREE.BoxGeometry(1, 1, 1);
/** box beam from a to b with a square section of side w */
const beam = (out: THREE.BufferGeometry[], a: V3, b: V3, w: number) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = tmp.subVectors(B, A), len = d.length();
  if (len < 1e-3) return;
  q.setFromUnitVectors(up, d.clone().normalize());
  m4.compose(A.clone().add(B).multiplyScalar(0.5), q, sc.set(w, len + w * 0.6, w));
  out.push(unit.clone().applyMatrix4(m4));
};
const box = (out: THREE.BufferGeometry[], c: V3, s: V3) => {
  m4.compose(new THREE.Vector3(...c), q.identity(), sc.set(...s));
  out.push(unit.clone().applyMatrix4(m4));
};

/** lattice column between 4 corner rails; rails(y) gives the 4 corners at height y, from y0 to y1 in n bays */
const lattice = (out: THREE.BufferGeometry[], rails: (y: number) => V3[], y0: number, y1: number, n: number, chord: number, brace: number) => {
  const lv = Array.from({ length: n + 1 }, (_, k) => y0 + ((y1 - y0) * k) / n);
  for (let k = 0; k < n; k++) {
    const A = rails(lv[k]), B = rails(lv[k + 1]);
    for (let c = 0; c < 4; c++) {
      beam(out, A[c], B[c], chord);                                   // corner chord
      const c2 = (c + 1) % 4;
      beam(out, A[c], B[c2], brace); beam(out, A[c2], B[c], brace);   // X brace on the face
      beam(out, B[c], B[c2], brace * 1.1);                             // horizontal tie
    }
  }
};

/** painted riveted-iron texture: warm bronze-brown with darker seams, tiles along the beams */
const ironTex = () => ctex("eiffelIron", 256, 256, (g, r) => {
  g.fillStyle = "#8a5d43"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? "rgba(60,30,20,0.10)" : "rgba(255,210,170,0.08)"; g.fillRect(r() * 256, r() * 256, 2 + r() * 10, 1 + r() * 3); }
  g.fillStyle = "rgba(40,20,14,0.45)"; for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 256, 2);
  g.fillStyle = "rgba(255,226,190,0.35)"; for (let y = 8; y < 256; y += 32) for (let x = 6; x < 256; x += 16) g.fillRect(x, y, 2, 2);
});
/** frieze of the 1st floor gallery: arches painted along a band */
const friezeTex = () => ctex("eiffelFrieze", 1024, 128, (g) => {
  g.fillStyle = "#93644a"; g.fillRect(0, 0, 1024, 128);
  g.fillStyle = "#5e3c2c";
  for (let x = 0; x < 1024; x += 64) { g.beginPath(); g.moveTo(x + 6, 120); g.lineTo(x + 6, 52); g.arc(x + 32, 52, 26, Math.PI, 0); g.lineTo(x + 58, 120); g.fill(); }
  g.fillStyle = "#b07a58"; g.fillRect(0, 0, 1024, 12); g.fillRect(0, 116, 1024, 12);
});

export type Tower = { group: THREE.Group; tagAnchor: THREE.Vector3; legFoot: (i: number) => THREE.Vector3; railY: number };

export const buildTower = (): Tower => {
  const iron: THREE.BufferGeometry[] = [], deck: THREE.BufferGeometry[] = [], frieze: THREE.BufferGeometry[] = [];
  // ---- four legs (0..115 m): each leg a square lattice column on a diagonal ----
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as const) {
    const rails = (y: number): V3[] => {
      const I = INNER(y), O = OUTER(y);
      return [[sx * I, y, sz * I], [sx * O, y, sz * I], [sx * O, y, sz * O], [sx * I, y, sz * O]];
    };
    lattice(iron, rails, 0, FLOOR1, 8, 1.5, 0.55);
    lattice(iron, rails, FLOOR1, FLOOR2, 7, 1.2, 0.45);
    // stone pier under each leg
    const I0 = INNER(0), O0 = OUTER(0);
    box(deck, [sx * (I0 + O0) / 2, 0.6, sz * (I0 + O0) / 2], [O0 - I0 + 3, 1.2, O0 - I0 + 3]);
  }
  // ---- decorative arches between the legs (the 1889 arches), one per side ----
  for (let side = 0; side < 4; side++) {
    const yaw = (side * Math.PI) / 2, cs = Math.cos(yaw), sn = Math.sin(yaw);
    const P = (x: number, y: number, d: number): V3 => [cs * x + sn * d, y, -sn * x + cs * d];
    const N = 18, span = 33, rise = 39, base = 8;
    for (const [d, w] of [[INNER(20) + 2, 1.3], [INNER(20) + 6, 0.9]] as const) {
      const pts: V3[] = [];
      for (let i = 0; i <= N; i++) { const a = Math.PI * (i / N); pts.push(P(-span * Math.cos(a), base + rise * Math.sin(a) ** 0.8, d)); }
      for (let i = 0; i < N; i++) beam(iron, pts[i], pts[i + 1], w);
      if (d < INNER(20) + 4) for (let i = 1; i < N; i += 2) { const p0 = pts[i]; beam(iron, p0, [p0[0], FLOOR1 - 3, p0[2]], 0.35); }
    }
  }
  // ---- 1st floor: square ring deck with the arched frieze ----
  const F1o = OUTER(FLOOR1) + 3, F1i = 16;
  for (const s of [-1, 1]) {
    box(deck, [0, FLOOR1, s * (F1o + F1i) / 2], [2 * F1o, 2.2, F1o - F1i]);
    box(deck, [s * (F1o + F1i) / 2, FLOOR1, 0], [F1o - F1i, 2.2, 2 * F1i]);
    box(frieze, [0, FLOOR1 - 3.5, s * F1o], [2 * F1o, 5, 0.6]);
    box(frieze, [s * F1o, FLOOR1 - 3.5, 0], [0.6, 5, 2 * F1o]);
  }
  // railing posts + top rail on the 1st floor edge
  for (let k = -12; k <= 12; k++) for (const s of [-1, 1]) {
    const x = (k / 12) * F1o;
    beam(iron, [x, FLOOR1 + 1.1, s * F1o], [x, FLOOR1 + 2.4, s * F1o], 0.18); beam(iron, [s * F1o, FLOOR1 + 1.1, x], [s * F1o, FLOOR1 + 2.4, x], 0.18);
  }
  for (const s of [-1, 1]) {
    beam(iron, [-F1o, FLOOR1 + 2.4, s * F1o], [F1o, FLOOR1 + 2.4, s * F1o], 0.25); beam(iron, [s * F1o, FLOOR1 + 2.4, -F1o], [s * F1o, FLOOR1 + 2.4, F1o], 0.25);
  }
  // ---- shaft: 115 m -> 276 m, then the top ----
  const shaft = (y: number): V3[] => { const O = OUTER(y); return [[O, y, O], [-O, y, O], [-O, y, -O], [O, y, -O]]; };
  lattice(iron, shaft, FLOOR2, 200, 9, 1.1, 0.4);
  lattice(iron, shaft, 200, TOP, 8, 0.9, 0.35);
  const F2 = OUTER(FLOOR2) + 2;
  box(deck, [0, FLOOR2, 0], [2 * F2, 2, 2 * F2]);
  for (const s of [-1, 1]) { box(frieze, [0, FLOOR2 - 2.4, s * F2], [2 * F2, 3, 0.5]); box(frieze, [s * F2, FLOOR2 - 2.4, 0], [0.5, 3, 2 * F2]); }
  const T = OUTER(TOP) + 1.5;
  box(deck, [0, TOP, 0], [2 * T, 1.6, 2 * T]);
  box(deck, [0, TOP + 4, 0], [2 * T - 4, 6, 2 * T - 4]);           // cabin
  box(frieze, [0, TOP + 4, 0], [2 * T - 3.6, 2.4, 2 * T - 3.6]);
  box(deck, [0, TOP + 8.5, 0], [8, 3, 8]);                          // lantern base
  for (let k = 0; k < 6; k++) box(deck, [0, TOP + 11 + k * 1.6, 0], [6 - k * 0.8, 1.6, 6 - k * 0.8]); // stepped cupola
  beam(iron, [0, TOP + 20, 0], [0, 324, 0], 0.7);                   // flagpole / antenna

  const g = new THREE.Group();
  const add = (list: THREE.BufferGeometry[], mat: THREE.Material) => {
    const m = new THREE.Mesh(mergeGeometries(list, false), mat);
    m.castShadow = true; m.receiveShadow = true; m.matrixAutoUpdate = false;
    g.add(m);
  };
  add(iron, lam("eiffelIron", () => ({ map: ironTex() })));
  add(deck, lam("eiffelDeck", () => ({ color: "#7a5240" })));
  add(frieze, lam("eiffelFrieze", () => ({ map: friezeTex() })));
  // the SOLD tag hangs under the south-east corner of the 1st floor gallery
  const tagAnchor = new THREE.Vector3(F1o * 0.55, FLOOR1 - 6.2, F1o + 0.4);
  const legFoot = (i: number) => { const s = [[1, 1], [-1, 1], [-1, -1], [1, -1]][i], c = (INNER(0) + OUTER(0)) / 2; return new THREE.Vector3(s[0] * c, 0, s[1] * c); };
  return { group: g, tagAnchor, legFoot, railY: FLOOR1 + 1.1 };
};
