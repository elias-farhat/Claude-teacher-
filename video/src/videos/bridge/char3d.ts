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
  const key = `${o.skin}|${o.hat}|${o.hair}|${o.moustache}|${expr}|${lid.toFixed(2)}|${look}|${x.sideburns ? 1 : 0}|${x.curls ? 1 : 0}`;
  let t = faceTex.get(key);
  if (t) return t;
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512;
  const g = cv.getContext("2d")!, skin = o.skin ?? SKIN;
  g.fillStyle = skin; g.fillRect(0, 0, 1024, 512);
  const hair = o.hat === "hair" && o.hair ? o.hair : null;
  if (hair) {
    // a hair "helmet" like the card's: the crown, the sides and the whole back, the face left open in front (a window
    // x 150..362, below y 150); sideburns down beside the face; an ink line along the hairline so pale hair still reads
    const win = (gg: CanvasRenderingContext2D) => { gg.beginPath(); gg.moveTo(150, 512); gg.lineTo(150, 205); gg.quadraticCurveTo(160, 150, 256, 146); gg.quadraticCurveTo(352, 150, 362, 205); gg.lineTo(362, 512); gg.closePath(); };
    g.save(); g.fillStyle = hair; g.beginPath(); g.rect(0, 0, 1024, 330); win(g); g.fill("evenodd"); g.restore();
    if (x.sideburns) { g.fillStyle = hair; g.fillRect(120, 200, 34, 160); g.fillRect(358, 200, 34, 160); }
    g.strokeStyle = INK; g.lineWidth = 7; win(g); g.stroke();
    g.beginPath(); g.moveTo(0, 330); g.lineTo(150, 330); g.moveTo(362, 330); g.lineTo(1024, 330); g.stroke();
  }
  const p = new Pen(g);
  faceFront(p, 256, 262, 320, expr, 0, look, lid, false, skin, o.moustache, o.build === "stout");
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  faceTex.set(key, t);
  return t;
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
  private cup: THREE.Mesh; private phone: THREE.Mesh;
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
