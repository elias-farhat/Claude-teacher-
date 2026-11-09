// World geometry for the camera guard and the auto-framer: every visible world mesh (not the NOINK layer: character /
// effect cards, sky, clouds, smoke, lamp dots; not see-through soft cards) behind a three-mesh-bvh tree, with a
// double-sided first-hit ray cast (a camera inside a beam must see the beam's inner faces).
import * as THREE from "three";
import { computeBoundsTree } from "three-mesh-bvh";

(THREE.BufferGeometry.prototype as unknown as { computeBoundsTree: unknown }).computeBoundsTree = computeBoundsTree;
export const NOINK = 3;
export type Hit = { distance: number; point: THREE.Vector3; face: { normal: THREE.Vector3 } | null; object: THREE.Mesh };
type BT = { raycastFirst: (r: THREE.Ray, side: THREE.Side) => { point: THREE.Vector3; face: { normal: THREE.Vector3 } } | null };

export class Geo {
  occ: THREE.Mesh[] = [];
  private list: THREE.Mesh[] = [];
  private ray = new THREE.Ray(); private inv = new THREE.Matrix4(); private lray = new THREE.Ray(); private sph = new THREE.Sphere();
  constructor(public root: THREE.Object3D) {
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || (m as unknown as THREE.Points).isPoints || m.layers.mask === 1 << NOINK) return;
      const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material;
      if (mat && mat.transparent && !mat.depthWrite) return;
      if (!m.geometry.attributes.position) return;
      const g = m.geometry as unknown as { boundsTree?: unknown; computeBoundsTree: () => void };
      if (!g.boundsTree) g.computeBoundsTree();
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      this.occ.push(m);
    });
    this.refresh();
  }
  /** call after moving / showing / hiding world objects */
  refresh() { this.root.updateMatrixWorld(true); this.list = this.occ.filter((m) => { let o: THREE.Object3D | null = m; while (o) { if (!o.visible) return false; o = o.parent; } return true; }); }
  cast(from: THREE.Vector3, dir: THREE.Vector3, far: number): Hit | null {
    this.ray.set(from, dir); let best: Hit | null = null;
    for (const m of this.list) {
      this.sph.copy(m.geometry.boundingSphere!).applyMatrix4(m.matrixWorld);
      if (!this.ray.intersectsSphere(this.sph)) continue;
      if (this.sph.center.distanceTo(from) - this.sph.radius > (best ? best.distance : far)) continue;
      this.inv.copy(m.matrixWorld).invert(); this.lray.copy(this.ray).applyMatrix4(this.inv);
      const h = (m.geometry as unknown as { boundsTree: BT }).boundsTree.raycastFirst(this.lray, THREE.DoubleSide);
      if (!h) continue;
      const p = h.point.clone().applyMatrix4(m.matrixWorld), d = p.distanceTo(from);
      if (d <= far && (!best || d < best.distance)) best = { distance: d, point: p, face: h.face, object: m };
    }
    return best;
  }
  /** is the straight segment a -> b free of geometry (with a clearance radius, tested by 5 parallel rays)? */
  segmentFree(a: THREE.Vector3, b: THREE.Vector3, clear = 0.35) {
    const d = b.clone().sub(a), L = d.length(); if (L < 1e-3) return true; d.normalize();
    const s = new THREE.Vector3(-d.z, 0, d.x); if (s.lengthSq() < 1e-6) s.set(1, 0, 0); s.normalize();
    const u = new THREE.Vector3().crossVectors(s, d).normalize();
    for (const o of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (this.cast(a.clone().addScaledVector(s, o[0] * clear).addScaledVector(u, o[1] * clear), d, L)) return false;
    return true;
  }
  /** camera inside a solid: >= 5 of 6 axis rays first hit a back face */
  inside(p: THREE.Vector3) {
    let back = 0;
    for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const dir = new THREE.Vector3(...(d as [number, number, number])), h = this.cast(p, dir, 60);
      // a back face of a single-sided (FrontSide) surface = inside a closed solid; BackSide / DoubleSide surfaces are
      // linings meant to be seen from inside (the telescope tube, room shells)
      const side = (h?.object.material as THREE.Material | undefined)?.side;
      if (h && h.face && side === THREE.FrontSide && h.face.normal.clone().transformDirection(h.object.matrixWorld).dot(dir) > 0) back++;
    }
    return back >= 5;
  }
}
