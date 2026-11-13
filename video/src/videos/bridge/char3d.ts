// 3D cast (style test, 2026-11-13): the card characters rebuilt as real geometry so they take the key light (lit side,
// dark side, rim), cast shadows and read from any camera angle. Same proportions and the same face drawings as the
// cards: a sphere head with the toon face painted on its front (faceFront from toon.ts, mapped through the sphere's
// UVs), a bean (capsule) body in the jacket colour with buttons, thin ink-dark "stringy" limbs (tubes along a
// Catmull-Rom curve) with sphere hands and egg feet. Same height (feet 0, head centre 1.44 m, top ~1.75 m), so the
// camera guard's subject and head boxes (guard/subjects.ts) still describe it. On the default layer, so the InkPass
// draws its outline like the sets.
import * as THREE from "three";
import { twoTone } from "./shade";
import { Pen, Outfit, Expr, INK, SKIN, faceFront, mix } from "./toon";

export type Rig3 = {
  o: Outfit;
  l: { mode?: string; expr?: Expr; gest?: string; k?: number; blink?: number; look?: number; headTilt?: number; tilt?: number; phase?: number };
  x: { sideburns?: boolean; tea?: boolean; phone?: boolean; pen?: boolean; paper?: string; wings?: number; curls?: boolean };
};
type V3 = [number, number, number];
const v = (a: V3) => new THREE.Vector3(...a);

const HEAD_R = 0.255, HEAD_Y = 1.44, SHOULDER: V3 = [0.19, 1.07, 0], HIP_Y = 0.62, LIMB_R = 0.022;
const mats = new Map<string, THREE.Material>();
const mat = (col: string) => { let m = mats.get(col); if (!m) { m = twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(col) })); mats.set(col, m); } return m; };

// ---- the face: an equirectangular canvas (1024 x 512) for a SphereGeometry: the front (+z) is u = 0.25 (x = 256),
// the equator y = 256; 1 design unit of the card face = 1.355 px here (head width 236 units = 2 r) ----
const faceTex = new Map<string, THREE.CanvasTexture>();
const face = (r: Rig3) => {
  const { o, l, x } = r, expr = (l.expr ?? "neutral") as Expr, lid = l.blink ?? 0, look = l.look ?? 0;
  const key = `${o.skin}|${o.moustache}|${expr}|${lid.toFixed(2)}|${look}|${o.build}`;  void x;
  let t = faceTex.get(key);
  if (t) return t;
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512;
  const g = cv.getContext("2d")!, skin = o.skin ?? SKIN;
  g.fillStyle = skin; g.fillRect(0, 0, 1024, 512);
  // features only (eyes, brows, mouth, moustache) on plain skin; hair and hats are real geometry (buildTop below).
  // The painted hair "window" with its ink ring read as a mask over a ball (Elias, 2026-11-13).
  const p = new Pen(g);
  faceFront(p, 256, 262, 320, expr, 0, look, lid, false, skin, o.moustache, o.build === "stout");
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  faceTex.set(key, t);
  return t;
};


// ---- hair and hats as geometry, built once per outfit and parented to the head (so they turn and tilt with it).
// SphereGeometry: front (+z) is phi = pi/2, so a shell with phi from pi/2 + w to pi/2 - w (going round the back)
// leaves the face open by +-w; theta runs from the crown (0) down. ----
const shell = (r: number, w: number, thetaEnd: number) => new THREE.SphereGeometry(r, 36, 20, Math.PI / 2 + w, Math.PI * 2 - 2 * w, 0, thetaEnd);
const cap = (r: number, thetaEnd: number) => new THREE.SphereGeometry(r, 36, 14, 0, Math.PI * 2, 0, thetaEnd);
const tops = new Map<string, THREE.Group>();
const buildTop = (o: Outfit, sideburns: boolean): THREE.Group => {
  const key = `${o.hat}|${o.hair}|${o.cap}|${sideburns ? 1 : 0}`;
  const cached = tops.get(key); if (cached) return cached.clone();
  const g = new THREE.Group(), R = HEAD_R;
  const m = (col: string, side: THREE.Side = THREE.FrontSide) => { const mm = twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(col), side })); return mm; };
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]) => {
    const me = new THREE.Mesh(geo, mat); me.position.set(...pos); me.rotation.set(...rot); me.castShadow = true; me.receiveShadow = true; g.add(me); return me;
  };
  const hairCol = o.hair ?? "#4a3020";
  if (o.hat === "hair") {
    // a shade deeper than the card colour (pale hair washed out to bald under the key light) and with volume:
    // a thicker crown, the back, and a puff over each ear so the silhouette says "hair"
    const hm = m("#" + new THREE.Color(hairCol).multiplyScalar(0.82).getHexString(), THREE.DoubleSide);
    add(cap(R * 1.09, 1.0), hm, [0, R * 0.03, -R * 0.02]);           // crown, down to the forehead
    add(shell(R * 1.07, 0.95, 2.05), hm);                            // sides and back, the face left open
    for (const sx of [-1, 1]) add(new THREE.SphereGeometry(R * 0.36, 16, 12), hm, [sx * R * 0.86, R * 0.12, -R * 0.12]);
    add(new THREE.SphereGeometry(R * 0.5, 16, 12).scale(1.4, 0.8, 1), hm, [0, R * 0.05, -R * 0.62]);   // the back of the head
    // a soft fringe lip along the hairline so it reads as hair, not a swim cap
    add(new THREE.TorusGeometry(R * 0.86, R * 0.07, 8, 28, Math.PI * 0.9), hm, [0, R * 0.5, R * 0.05], [-1.1, 0, Math.PI * 0.05]);
    if (sideburns) for (const sx of [-1, 1]) add(new THREE.CapsuleGeometry(R * 0.07, R * 0.45, 4, 8), hm, [sx * R * 0.86, -R * 0.12, R * 0.42], [0.15, 0, sx * 0.12]);
  } else if (o.hat === "cap") {
    const cm = m(o.cap ?? "#5a4a3a");
    add(cap(R * 1.06, 1.25), cm);
    add(new THREE.CylinderGeometry(R * 0.75, R * 0.75, R * 0.06, 24, 1, false, -Math.PI / 2 - 0.9, 1.8), cm, [0, R * 0.32, R * 0.32]);
  } else if (o.hat === "tophat") {
    const tm = m("#1d1b22");
    add(new THREE.CylinderGeometry(R * 0.72, R * 0.66, R * 1.25, 28), tm, [0, R * 1.35, 0]);
    add(new THREE.CylinderGeometry(R * 1.15, R * 1.15, R * 0.06, 32), tm, [0, R * 0.74, 0]);
    add(new THREE.CylinderGeometry(R * 0.68, R * 0.68, R * 0.2, 28), m("#8a6a3a"), [0, R * 0.88, 0]);
    add(shell(R * 1.03, 1.0, 1.7), m(hairCol, THREE.DoubleSide));  // hair under the hat at the back
  } else if (o.hat === "helmet") {
    const hm = m("#f1ece0");
    add(cap(R * 1.14, 1.25), hm, [0, R * 0.08, 0]);
    add(new THREE.CylinderGeometry(R * 1.45, R * 1.45, R * 0.05, 36), hm, [0, R * 0.3, 0]);
    add(new THREE.CylinderGeometry(R * 1.1, R * 1.1, R * 0.16, 32), m("#8a6a3a"), [0, R * 0.42, 0]);
  } else if (o.hat === "conical") {
    add(new THREE.ConeGeometry(R * 1.75, R * 0.95, 32, 1, true), m("#e3cf96", THREE.DoubleSide), [0, R * 1.0, 0]);
  } else if (o.hat === "bonnet") {
    const bm = m("#e9cf8f", THREE.DoubleSide);
    add(shell(R * 1.12, 1.15, 2.2), bm);
    add(new THREE.TorusGeometry(R * 1.02, R * 0.09, 8, 32, Math.PI * 1.25), m("#d6b46a"), [0, R * 0.02, R * 0.25], [0, 0, -Math.PI * 0.125 + Math.PI / 2 - Math.PI * 0.625 + Math.PI * 0.5]);
  } else if (o.hat === "shako" || o.hat === "shako_tall") {
    const sm = m("#2e2a36"), tall = o.hat === "shako_tall";
    add(new THREE.CylinderGeometry(R * 0.95, R * 0.85, R * (tall ? 1.4 : 1.15), 28), sm, [0, R * (tall ? 1.15 : 1.02), 0]);
    add(new THREE.CylinderGeometry(R * 0.7, R * 0.7, R * 0.05, 24, 1, false, -Math.PI / 2 - 0.8, 1.6), sm, [0, R * 0.45, R * 0.28]);
  }
  tops.set(key, g);
  return g.clone();
};

// ---- poses: shoulder -> elbow -> hand per arm, character space (+z = toward the camera, +x = its left... screen right) ----
type Arm = [V3, V3, V3];
const hang = (s: number, k = 0): Arm => [[s * SHOULDER[0], SHOULDER[1], 0], [s * 0.25, 0.84, 0.0], [s * 0.26, 0.63 + 0.01 * Math.sin(k * 6.283), 0.05]];
const pose = (gest: string, k: number): [Arm, Arm] => {
  const L = hang(-1, k), w = Math.sin(k * Math.PI * 2);
  switch (gest) {
    case "point": return [L, [[0.19, 1.07, 0], [0.37, 1.07, 0.14], [0.57, 1.14, 0.26]]];
    case "palm": return [L, [[0.19, 1.07, 0], [0.3, 0.88, 0.12], [0.36, 0.97, 0.3]]];
    case "wave": return [L, [[0.19, 1.07, 0], [0.37, 1.22, 0.05], [0.42 + 0.06 * w, 1.5, 0.06]]];
    case "cheer": return [[[-0.19, 1.07, 0], [-0.37, 1.25, 0.04], [-0.42 - 0.05 * w, 1.52, 0.05]], [[0.19, 1.07, 0], [0.37, 1.25, 0.04], [0.42 + 0.05 * w, 1.52, 0.05]]];
    case "hold": case "paper": return [[[-0.19, 1.07, 0], [-0.25, 0.88, 0.13], [-0.12, 0.96, 0.28]], [[0.19, 1.07, 0], [0.25, 0.88, 0.13], [0.12, 0.96, 0.28]]];
    case "clutch": return [[[-0.19, 1.07, 0], [-0.26, 0.9, 0.12], [-0.07, 1.02, 0.22]], [[0.19, 1.07, 0], [0.26, 0.9, 0.12], [0.07, 1.02, 0.22]]];
    case "tip": return [L, [[0.19, 1.07, 0], [0.38, 1.24, 0.1], [0.21, 1.5 + 0.02 * w, 0.17]]];
    case "sign": return [L, [[0.19, 1.07, 0], [0.29, 0.86, 0.16], [0.14 + 0.03 * w, 0.8, 0.34]]];
    default: return [L, hang(1, k)];
  }
};
const tubes = new Map<string, THREE.TubeGeometry>();
const limb = (pts: V3[], r = LIMB_R) => {
  const key = pts.flat().map((q) => q.toFixed(3)).join(",") + r;
  let g = tubes.get(key);
  if (!g) { g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v)), 16, r, 6, false); tubes.set(key, g); if (tubes.size > 4000) tubes.clear(); }
  return g;
};

export class Char3D {
  g = new THREE.Group(); private head: THREE.Mesh; private headMat: THREE.MeshLambertMaterial; private body: THREE.Mesh;
  private arms: THREE.Mesh[]; private legs: THREE.Mesh[]; private hands: THREE.Mesh[]; private feet: THREE.Mesh[]; private buttons: THREE.Mesh[] = [];
  private cup: THREE.Mesh; private phone: THREE.Mesh; private top: THREE.Group | null = null; private topKey = "";
  constructor(parent: THREE.Object3D) {
    const add = <T extends THREE.Object3D>(o: T) => { o.traverse((m) => { const me = m as THREE.Mesh; if (me.isMesh) { me.castShadow = true; me.receiveShadow = true; } }); this.g.add(o); return o; };
    this.headMat = twoTone(new THREE.MeshLambertMaterial({ color: "#ffffff" })) as THREE.MeshLambertMaterial;
    this.head = add(new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 40, 28), this.headMat));
    this.body = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.2, 8, 20), mat("#888888")));
    this.arms = [0, 1].map(() => add(new THREE.Mesh(limb([[0, 1, 0], [0, 0.8, 0], [0, 0.6, 0]]), mat(INK))));
    this.legs = [0, 1].map(() => add(new THREE.Mesh(limb([[0, 0.6, 0], [0, 0.3, 0], [0, 0.05, 0]]), mat(INK))));
    this.hands = [0, 1].map(() => add(new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), mat(SKIN))));
    this.feet = [0, 1].map(() => add(new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 10).scale(1, 0.55, 1.6), mat(INK))));
    for (let i = 0; i < 3; i++) this.buttons.push(add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), mat("#c9a04a"))));
    this.cup = add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.07, 14), mat("#f4f1ea")));
    this.phone = add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.015), mat("#2a2a33")));
    this.g.visible = false; parent.add(this.g);
  }
  /** pose at (x, y, z), turned toward the camera (yaw), scale s */
  set(r: Rig3, at: THREE.Vector3, yaw: number, s: number) {
    const { o, l, x } = r, sit = l.mode === "sit", k = l.k ?? 0;
    this.g.visible = true; this.g.position.copy(at); this.g.rotation.set(0, yaw, ((l.tilt ?? 0) * Math.PI) / 180 * -0.5); this.g.scale.setScalar(s);
    const dy = sit ? -0.2 : 0, bob = (l.mode === "stroll" ? 0.015 * Math.cos((l.phase ?? 0) * Math.PI * 4) : 0);
    // head: the face texture on the front, tilted with headTilt, turned a little toward where it looks
    this.headMat.map = face(r); this.headMat.needsUpdate = false;
    this.head.position.set(0, HEAD_Y + dy + bob, 0.01); this.head.rotation.set(0, (l.look ?? 0) * 0.25, ((l.headTilt ?? 0) * Math.PI) / 180);
    this.head.scale.set(1, 1.06, 0.98);
    this.headMat.color.setScalar(0.9);   // skin a touch darker: under a warm key the bare sphere glowed like a lamp
    const tk = `${o.hat}|${o.hair}|${o.cap}|${x.sideburns ? 1 : 0}`;
    if (tk !== this.topKey) { if (this.top) this.head.remove(this.top); this.top = buildTop(o, !!x.sideburns); this.head.add(this.top); this.topKey = tk; }
    // body: the bean, jacket colour; stout builds are rounder
    const stout = o.build === "stout";
    this.body.material = mat(o.jacket); this.body.position.set(0, 0.89 + dy + bob, 0); this.body.scale.set(stout ? 1.12 : 1, 1, 0.82);
    this.buttons.forEach((b, i) => { b.material = mat(o.buttons ?? "#c9a04a"); b.position.set(0, 1.02 - i * 0.13 + dy + bob, 0.165 * (stout ? 1.0 : 0.95)); });
    // arms + hands
    const [AL, AR] = pose(l.gest ?? "hang", k);
    [AL, AR].forEach((a, i) => {
      const pts = a.map((q) => [q[0], q[1] + dy + bob, q[2]] as V3);
      this.arms[i].geometry = limb(pts); this.arms[i].material = mat(INK);
      this.hands[i].position.set(...pts[2]);
    });
    // legs + feet (sitting: thighs forward, shins down)
    [-1, 1].forEach((side, i) => {
      const pts: V3[] = sit ? [[side * 0.09, HIP_Y + dy, 0], [side * 0.11, 0.45, 0.32], [side * 0.12, 0.06, 0.36]] : [[side * 0.09, HIP_Y + bob, 0], [side * 0.1, 0.33, 0.02], [side * 0.11, 0.06, 0]];
      this.legs[i].geometry = limb(pts, LIMB_R * 1.1);
      this.feet[i].position.set(side * 0.12, 0.035, (sit ? 0.36 : 0) + 0.05); this.feet[i].material = mat(o.boots);
    });
    // props in the right hand
    this.cup.visible = !!x.tea; if (x.tea) this.cup.position.set(AR[2][0], AR[2][1] + 0.05 + dy, AR[2][2] + 0.02);
    this.phone.visible = !!x.phone; if (x.phone) { this.phone.position.set(AR[2][0], AR[2][1] + 0.07 + dy, AR[2][2] + 0.02); this.phone.rotation.set(-0.2, 0, 0); }
    void mix;
  }
  hide() { this.g.visible = false; }
}
