// A cartoon rabbit as one merged geometry with vertex colours (body, head, long ears, painted-on face made of real
// little shapes: big black eyes with a white glint, pink nose, cotton tail, front paws). Origin at its feet, facing +z,
// ~0.5 m tall to the ear tips. Shared by the Napoleon short's instanced swarm and the 3D cast's "bunny" / "crate" props.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const col = (g: THREE.BufferGeometry, c: string) => {
  const n = g.attributes.position.count, cc = new THREE.Color(c), a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g;
};
const ni = (g: THREE.BufferGeometry) => { const q = g.index ? g.toNonIndexed() : g; q.deleteAttribute("uv"); return q; };
let cache: { sit: THREE.BufferGeometry; beg: THREE.BufferGeometry } | null = null;
const build = (beg: boolean) => {
  const P: THREE.BufferGeometry[] = [], W = "#ffffff", PINK = "#f29aae", BLACK = "#16141c";
  const by = beg ? 0.2 : 0.15, hy = beg ? 0.42 : 0.31, hz = beg ? 0.07 : 0.15;
  P.push(col(new THREE.SphereGeometry(0.16, 16, 12).scale(1, beg ? 1.35 : 0.92, beg ? 0.95 : 1.25).translate(0, by, 0), W));
  P.push(col(new THREE.SphereGeometry(0.115, 16, 12).scale(1.05, 1, 1).translate(0, hy, hz), W));
  for (const s of [-1, 1]) {
    P.push(col(new THREE.CapsuleGeometry(0.032, 0.17, 4, 8).rotateZ(-s * 0.18).rotateX(-0.12).translate(s * 0.05, hy + 0.17, hz - 0.02), W));
    P.push(col(new THREE.CapsuleGeometry(0.016, 0.13, 3, 6).rotateZ(-s * 0.18).rotateX(-0.12).translate(s * 0.05, hy + 0.17, hz + 0.01), PINK));
    P.push(col(new THREE.SphereGeometry(0.03, 10, 8).scale(0.9, 1.15, 0.6).translate(s * 0.048, hy + 0.025, hz + 0.095), BLACK));
    P.push(col(new THREE.SphereGeometry(0.009, 6, 5).translate(s * 0.042, hy + 0.04, hz + 0.115), W));
    P.push(col(new THREE.SphereGeometry(0.04, 8, 6).scale(1, 0.6, 1.5).translate(s * 0.07, 0.03, 0.14), W));   // hind feet
    P.push(col(new THREE.SphereGeometry(0.03, 8, 6).translate(s * 0.05, beg ? 0.3 : 0.06, beg ? 0.12 : 0.16), W));   // front paws (held up when begging)
  }
  P.push(col(new THREE.SphereGeometry(0.018, 8, 6).translate(0, hy - 0.02, hz + 0.115), PINK));
  P.push(col(new THREE.SphereGeometry(0.055, 10, 8).translate(0, by + 0.02, beg ? -0.14 : -0.19), W));
  return mergeGeometries(P.map(ni), false)!;
};
export const bunnyGeo = (beg = false) => { if (!cache) cache = { sit: build(false), beg: build(true) }; return beg ? cache.beg : cache.sit; };
