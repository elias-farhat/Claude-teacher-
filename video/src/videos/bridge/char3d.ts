// 3D cast (style test, 2026-11-13): the card characters rebuilt as real geometry so they take the key light (lit side,
// dark side, rim), cast shadows and read from any camera angle. Same proportions and the same face drawings as the
// cards: a sphere head with the toon face painted on its front (faceFront from toon.ts, mapped through the sphere's
// UVs), a bean (capsule) body in the jacket colour with buttons, thin ink-dark "stringy" limbs (tubes along a
// Catmull-Rom curve) with sphere hands and egg feet. Same height (feet 0, head centre 1.44 m, top ~1.75 m), so the
// camera guard's subject and head boxes (guard/subjects.ts) still describe it. On the default layer, so the InkPass
// draws its outline like the sets.
import * as THREE from "three";
import { twoTone } from "./shade";
import { bunnyGeo } from "./bunny";
import { Pen, Outfit, Expr, INK, SKIN, faceFront, mix } from "./toon";

export type Rig3 = {
  o: Outfit;
  l: { mode?: string; expr?: Expr; gest?: string; k?: number; blink?: number; look?: number; headTilt?: number; tilt?: number; phase?: number };
  x: { sideburns?: boolean; tea?: boolean; phone?: boolean; pen?: boolean; paper?: string; wings?: number; curls?: boolean; letter?: boolean; sweat?: boolean; bucket?: boolean; spear?: boolean; sword?: boolean; banner?: string; shield?: string; pan?: boolean; mittens?: string; sack?: boolean; coins?: boolean; ink?: boolean; gun?: boolean; stick?: boolean; crate?: boolean; bunny?: boolean; xeyes?: boolean; hatTilt?: number; scroll?: string; staff?: boolean; shovel?: boolean; lantern?: boolean; baboon?: string; pegs?: boolean; bottle?: boolean; hammer?: boolean; clipboard?: boolean; axe?: boolean; dropper?: boolean };
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
  const key = `${o.skin}|${o.moustache}|${expr}|${lid.toFixed(2)}|${look}|${o.build}|${x.xeyes ? 1 : 0}`;
  let t = faceTex.get(key);
  if (t) return t;
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512;
  const g = cv.getContext("2d")!, skin = o.skin ?? SKIN;
  g.fillStyle = skin; g.fillRect(0, 0, 1024, 512);
  // features only (eyes, brows, mouth, moustache) on plain skin; hair and hats are real geometry (buildTop below).
  // The painted hair "window" with its ink ring read as a mask over a ball (Elias, 2026-11-13).
  const p = new Pen(g);
  faceFront(p, 256, 262, 320, expr, 0, look, lid, false, skin, o.moustache, o.build === "stout");
  if (x.xeyes) {   // cartoon "X" eyes (the late pope): skin over the drawn eyes, then two crosses
    const u = 3.2;
    for (const sd of [-1, 1]) { const ex = 256 + sd * 13 * u, ey = 262; g.fillStyle = skin; g.beginPath(); g.arc(ex, ey, 9.5 * u, 0, Math.PI * 2); g.fill();
      g.strokeStyle = INK; g.lineWidth = 3.4 * u; g.lineCap = "round"; g.beginPath(); g.moveTo(ex - 6 * u, ey - 6 * u); g.lineTo(ex + 6 * u, ey + 6 * u); g.moveTo(ex + 6 * u, ey - 6 * u); g.lineTo(ex - 6 * u, ey + 6 * u); g.stroke(); }
  }
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
/** a mitre alone (the one that tips off the late pope, the one knocked off Stephen), for a head of radius HEAD_R at the origin */
export const mitre = (col = "#f4f0e6") => {
  const g = new THREE.Group(), R = HEAD_R, m = (c: string) => twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(c), side: THREE.DoubleSide }));
  const w = R * 0.92, h = R * 2.3, sh = new THREE.Shape();
  for (const [px, py] of [[-w, 0], [w, 0], [w * 0.97, h * 0.42], [w * 0.8, h * 0.68], [w * 0.5, h * 0.88], [0, h], [-w * 0.5, h * 0.88], [-w * 0.8, h * 0.68], [-w * 0.97, h * 0.42]] as [number, number][]) { if (px === -w && py === 0) sh.moveTo(px, py); else sh.lineTo(px, py); } sh.closePath();   // a plain polygon (the curved outline lost its caps when triangulated: hollow mitres)
  const body = new THREE.Mesh(new THREE.BoxGeometry(w * 2, h * 0.5, R * 0.9), m(col)); body.position.y = h * 0.25; g.add(body);
  const top = new THREE.Mesh(new THREE.ConeGeometry(w * Math.SQRT2, h * 0.5, 4, 1).rotateY(Math.PI / 4).scale(1, 1, (R * 0.9) / (w * 2)), m(col)); top.position.y = h * 0.75; g.add(top); void sh;
  const band = new THREE.Mesh(new THREE.BoxGeometry(w * 2.06, R * 0.18, R * 0.96), m("#d9a43a")); band.position.y = R * 0.09; g.add(band);
  const cr = new THREE.Mesh(new THREE.BoxGeometry(R * 0.14, h * 0.5, R * 0.04), m("#d9a43a")); cr.position.set(0, h * 0.45, R * 0.47); g.add(cr);
  g.traverse((o) => { const me = o as THREE.Mesh; if (me.isMesh) { me.castShadow = true; me.receiveShadow = true; } });
  return g;
};
/** the bicorne alone (also the hat that flies off Napoleon's head in the Napoleon short), positioned for a head of
 *  radius HEAD_R at the origin */
export const bicorne = (col = "#18161c") => {
  const g = new THREE.Group(), R = HEAD_R, m = (c: string) => twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(c), side: THREE.DoubleSide }));
  const half = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.6, R * 1.6, R * 0.2, 30, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2).scale(1, 0.72, 1), m(col));
  half.position.set(0, R * 0.42, 0); g.add(half);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R * 1.6, R * 0.05, 6, 30, Math.PI).scale(1, 0.72, 1), m("#c9a04a")); rim.position.set(0, R * 0.42, R * 0.1); g.add(rim);
  ["#2a4f9a", "#f4f1ea", "#c8313b"].forEach((c, i) => { const d = new THREE.Mesh(new THREE.CircleGeometry(R * (0.26 - i * 0.08), 18), m(c)); d.position.set(R * 0.75, R * 0.95, R * 0.11 + i * 0.002); g.add(d); });
  g.traverse((o) => { const me = o as THREE.Mesh; if (me.isMesh) { me.castShadow = true; me.receiveShadow = true; } });
  return g;
};
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
    // pale hair (Herschel's white) goes a darker silver grey with more volume, so it reads as hair against the skin under
    // any key light (run 35: it washed out to a bald head); darker hair a shade deeper than the card colour
    const pale = new THREE.Color(hairCol).getHSL({ h: 0, s: 0, l: 0 }).l > 0.72;
    const hm = m(pale ? "#8f8d98" : "#" + new THREE.Color(hairCol).multiplyScalar(0.82).getHexString(), THREE.DoubleSide);
    const vol = pale ? 1.25 : 1;
    add(cap(R * (pale ? 1.13 : 1.09), 1.0), hm, [0, R * 0.05, -R * 0.02]);   // crown, down to the forehead
    add(shell(R * 1.07, 0.95, 2.05), hm);                                       // sides and back, the face left open
    for (const sx of [-1, 1]) add(new THREE.SphereGeometry(R * 0.36 * vol, 16, 12), hm, [sx * R * 0.88, R * 0.14, -R * 0.12]);
    if (pale) for (const sx of [-1, 1]) add(new THREE.SphereGeometry(R * 0.3, 14, 10), hm, [sx * R * 0.55, R * 0.72, -R * 0.2]);   // tufts on the crown
    add(new THREE.SphereGeometry(R * 0.5 * vol, 16, 12).scale(1.4, 0.8, 1), hm, [0, R * 0.05, -R * 0.62]);   // the back of the head
    // a soft fringe lip along the hairline so it reads as hair, not a swim cap
    add(new THREE.TorusGeometry(R * 0.86, R * 0.07, 8, 28, Math.PI * 0.9), hm, [0, R * 0.5, R * 0.05], [-1.1, 0, Math.PI * 0.05]);
    if (o.hair === "#6a3a22") for (let c = -3; c <= 3; c++) add(new THREE.SphereGeometry(R * 0.2, 10, 8), hm, [c * R * 0.26, R * 0.95 - Math.abs(c) * R * 0.08, R * 0.25]);   // Locke's curls
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
    add(shell(R * 1.12, 1.15, 2.2), bm);   // (no brim ring round the face: it read as a mask / face ring, run 35)
  } else if (o.hat === "bascinet" || o.hat === "kettle") {
    // medieval iron: a bascinet (pointed skull cap, nasal bar) for Modena's knights, a wide-brimmed kettle hat for Bologna
    const im = m(o.cap ?? "#9aa0ab");
    if (o.hat === "bascinet") {
      add(cap(R * 1.12, 1.35).scale(1, 1.18, 1), im, [0, R * 0.04, 0]);
      add(new THREE.BoxGeometry(R * 0.09, R * 0.5, R * 0.06), im, [0, R * 0.2, R * 1.08]);
      add(new THREE.ConeGeometry(R * 0.2, R * 0.4, 10), im, [0, R * 1.32, -R * 0.05]);
    } else {
      add(cap(R * 1.1, 1.3), im, [0, R * 0.06, 0]);
      add(new THREE.CylinderGeometry(R * 1.55, R * 1.6, R * 0.05, 32), im, [0, R * 0.36, 0], [0.08, 0, 0]);
    }
    add(shell(R * 1.03, 1.0, 2.0), m(hairCol, THREE.DoubleSide));
  } else if (o.hat === "fedora") {
    // a 1940s felt fedora: a pinched crown, a dark band, a snap brim
    const hm = m("#" + new THREE.Color(hairCol).multiplyScalar(0.82).getHexString(), THREE.DoubleSide);
    add(shell(R * 1.05, 0.95, 2.0), hm);
    const fm = m(o.cap ?? "#5a4a3a");
    add(new THREE.CylinderGeometry(R * 0.78, R * 0.95, R * 0.78, 24).scale(1, 1, 0.92), fm, [0, R * 0.9, 0]);
    add(new THREE.CylinderGeometry(R * 1.55, R * 1.6, R * 0.05, 32), fm, [0, R * 0.52, 0], [0.06, 0, 0]);
    add(new THREE.CylinderGeometry(R * 0.96, R * 0.97, R * 0.14, 24).scale(1, 1, 0.92), m("#1e1a1a"), [0, R * 0.6, 0]);
  } else if (o.hat === "mitre" || o.hat === "hood") {
    if (o.hat === "mitre") {
      // a bishop's mitre: a tall pointed arch, front and back panels with a gold band and a gold cross on the front
      const hm = m("#" + new THREE.Color(hairCol).multiplyScalar(0.82).getHexString(), THREE.DoubleSide);
      add(shell(R * 1.05, 0.95, 2.0), hm);
      const w = R * 0.92, h = R * 2.3, sh = new THREE.Shape();
      for (const [px, py] of [[-w, 0], [w, 0], [w * 0.97, h * 0.42], [w * 0.8, h * 0.68], [w * 0.5, h * 0.88], [0, h], [-w * 0.5, h * 0.88], [-w * 0.8, h * 0.68], [-w * 0.97, h * 0.42]] as [number, number][]) { if (px === -w && py === 0) sh.moveTo(px, py); else sh.lineTo(px, py); } sh.closePath();   // a plain polygon (the curved outline lost its caps when triangulated: hollow mitres)
      const mm = m(o.cap ?? "#f4f0e6", THREE.DoubleSide), gold = m("#d9a43a");
      // solid geometry (an extruded outline rendered hollow): a body box and a four-sided pointed top
      add(new THREE.BoxGeometry(w * 2, h * 0.5, R * 0.9), mm, [0, R * 0.55 + h * 0.25, 0]);
      add(new THREE.ConeGeometry(w * Math.SQRT2, h * 0.5, 4, 1).rotateY(Math.PI / 4).scale(1, 1, (R * 0.9) / (w * 2)), mm, [0, R * 0.55 + h * 0.75, 0]);
      add(new THREE.BoxGeometry(w * 2.06, R * 0.18, R * 0.96), gold, [0, R * 0.64, 0]);
      add(new THREE.BoxGeometry(R * 0.14, h * 0.5, R * 0.04), gold, [0, R * 0.55 + h * 0.45, R * 0.47]);
      add(new THREE.BoxGeometry(R * 0.5, R * 0.12, R * 0.04), gold, [0, R * 0.55 + h * 0.55, R * 0.47]);
    } else {
      // a monk's hood: a cowl round the head, the face open
      const cm = m(o.cap ?? "#6a4a32", THREE.DoubleSide);
      add(shell(R * 1.14, 0.9, 2.35), cm);
      add(cap(R * 1.16, 1.0), cm, [0, R * 0.04, -R * 0.06]);
      add(new THREE.SphereGeometry(R * 0.6, 16, 12).scale(1.2, 1, 1.1), cm, [0, -R * 0.2, -R * 0.7]);
    }
  } else if (o.hat === "bicorne") {
    // Napoleon's bicorne, worn sideways ("en bataille"): a black half-disc across the head with a tricolour cockade
    const hm = m("#" + new THREE.Color(hairCol).multiplyScalar(0.82).getHexString(), THREE.DoubleSide);
    add(shell(R * 1.06, 0.95, 2.0), hm);
    add(new THREE.SphereGeometry(R * 0.45, 16, 12).scale(1.3, 0.8, 1), hm, [0, -R * 0.1, -R * 0.66]);
    add(cap(R * 1.07, 1.1), m(o.cap ?? "#18161c"), [0, R * 0.12, 0]);
    g.add(bicorne(o.cap ?? "#18161c"));
  } else if (o.hat === "tricorn" || o.hat === "fur" || o.hat === "straw") {
    // 18th-century hats: a tricorne (upturned three-cornered brim: an open triangular prism), a fur hat, a straw hat;
    // hair shows at the back (a pale colour = a powdered wig with side rolls)
    const pale = new THREE.Color(hairCol).getHSL({ h: 0, s: 0, l: 0 }).l > 0.72;
    const hm = m(pale ? "#d8d4cc" : "#" + new THREE.Color(hairCol).multiplyScalar(0.82).getHexString(), THREE.DoubleSide);
    add(shell(R * 1.06, 0.95, 2.05), hm);
    add(new THREE.SphereGeometry(R * 0.45, 16, 12).scale(1.3, 0.8, 1), hm, [0, -R * 0.1, -R * 0.66]);
    if (pale) for (const sx of [-1, 1]) add(new THREE.CapsuleGeometry(R * 0.13, R * 0.3, 4, 10).rotateZ(Math.PI / 2), hm, [sx * R * 0.9, -R * 0.05, -R * 0.15], [0, sx * 0.4, 0]);
    if (o.hat === "tricorn") {
      const tm = m(o.cap ?? "#1d1b22", THREE.DoubleSide);
      add(cap(R * 1.07, 1.15), tm, [0, R * 0.12, 0]);
      add(new THREE.CylinderGeometry(R * 1.75, R * 1.6, R * 0.42, 3, 1, true), tm, [0, R * 0.62, 0], [0, Math.PI, 0]);
      add(new THREE.CylinderGeometry(R * 1.6, R * 1.6, R * 0.04, 3), tm, [0, R * 0.42, 0], [0, Math.PI, 0]);
      add(new THREE.SphereGeometry(R * 0.12, 10, 8), m("#d9b45a"), [R * 0.9, R * 0.75, R * 0.55]);
    } else if (o.hat === "fur") {
      const fm = m(o.cap ?? "#6a4a32");
      add(new THREE.CylinderGeometry(R * 1.12, R * 1.08, R * 0.9, 24), fm, [0, R * 0.78, 0]);
      add(new THREE.TorusGeometry(R * 1.08, R * 0.18, 10, 28).rotateX(Math.PI / 2), fm, [0, R * 0.35, 0]);
      for (const sx of [-1, 1]) add(new THREE.SphereGeometry(R * 0.32, 12, 10).scale(0.6, 1.2, 1), fm, [sx * R * 0.98, -R * 0.15, 0]);
    } else {
      const sm = m(o.cap ?? "#e3cf96", THREE.DoubleSide);
      add(cap(R * 1.08, 1.25), sm, [0, R * 0.1, 0]);
      add(new THREE.CylinderGeometry(R * 1.95, R * 2.05, R * 0.05, 32), sm, [0, R * 0.42, 0]);
      add(new THREE.CylinderGeometry(R * 1.1, R * 1.1, R * 0.14, 28), m("#a8432c"), [0, R * 0.55, 0]);
    }
  } else if (o.hat === "beret" || o.hat === "crown") {
    // a lord: a soft velvet cap with a feather (Modena's podestà) or a gold circlet over hair (Bologna's)
    const hm = m("#" + new THREE.Color(hairCol).multiplyScalar(0.82).getHexString(), THREE.DoubleSide);
    add(shell(R * 1.06, 0.95, 2.05), hm);
    add(new THREE.SphereGeometry(R * 0.5, 16, 12).scale(1.4, 0.8, 1), hm, [0, R * 0.05, -R * 0.62]);
    if (o.hat === "beret") {
      const bm = m(o.cap ?? "#2f5f3a");
      add(new THREE.SphereGeometry(R * 1.2, 28, 12, 0, Math.PI * 2, 0, 1.2).scale(1.08, 0.62, 1.08), bm, [0.04 * R, R * 0.62, -R * 0.04], [0, 0, -0.18]);
      add(new THREE.CapsuleGeometry(R * 0.06, R * 0.9, 4, 8), m("#f4f1ea"), [R * 0.7, R * 1.05, -R * 0.2], [0, 0, -0.7]);
    } else {
      add(cap(R * 1.08, 1.0), hm, [0, R * 0.05, -R * 0.02]);
      const gm = m(o.cap ?? "#e0b04a");
      add(new THREE.CylinderGeometry(R * 0.9, R * 0.94, R * 0.3, 28, 1, true), m(o.cap ?? "#e0b04a", THREE.DoubleSide), [0, R * 0.78, 0]);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(new THREE.ConeGeometry(R * 0.1, R * 0.28, 6), gm, [Math.sin(a) * R * 0.92, R * 1.04, Math.cos(a) * R * 0.92]); }
    }
  } else if (o.hat === "shako" || o.hat === "shako_tall") {
    const sm = m("#2e2a36"), tall = o.hat === "shako_tall";
    add(new THREE.CylinderGeometry(R * 0.95, R * 0.85, R * (tall ? 1.4 : 1.15), 28), sm, [0, R * (tall ? 1.15 : 1.02), 0]);
    add(new THREE.CylinderGeometry(R * 0.7, R * 0.7, R * 0.05, 24, 1, false, -Math.PI / 2 - 0.8, 1.6), sm, [0, R * 0.45, R * 0.28]);
  }
  tops.set(key, g);
  return g.clone();
};

// ---- props in hand (CLAUDE.md 10: the card versions drew them; the 3D cast must hold them too) ----
const paperTex = new Map<string, THREE.CanvasTexture>();
const newspaper = (kind: string) => {
  let t = paperTex.get(kind); if (t) return t;
  const cv = document.createElement("canvas"); cv.width = 300; cv.height = 220; const g = cv.getContext("2d")!;
  g.fillStyle = "#f1e8d6"; g.fillRect(0, 0, 300, 220); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, 292, 212);
  g.fillStyle = INK; g.font = "900 40px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(kind === "hoax" ? "HOAX!" : kind === "day1" ? "DAY 1" : kind === "list" ? "RABBITS" : kind === "contract" ? "CONTRACT" : kind === "mag" ? "WEEKLY" : "THE SUN", 150, 40);
  g.fillRect(20, 66, 260, 5);
  if (kind === "bat") {   // the famous winged figure
    g.fillStyle = "#7a5a4a"; g.beginPath(); g.ellipse(150, 140, 16, 26, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#5a4034"; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(150 + sd * 10, 128); g.lineTo(150 + sd * 90, 98); g.lineTo(150 + sd * 72, 134); g.lineTo(150 + sd * 90, 168); g.lineTo(150 + sd * 16, 158); g.closePath(); g.fill(); }
  } else if (kind === "mag") {   // a magazine cover: a white headless rooster on red
    g.fillStyle = "#c8302a"; g.fillRect(20, 76, 260, 132); g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(150, 150, 46, 34, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(170, 104, 18, 30); g.fillStyle = "#f2a030"; g.fillRect(138, 182, 6, 22); g.fillRect(158, 182, 6, 22);
  } else if (kind === "contract") { g.fillStyle = "#8a8070"; for (let k = 0; k < 5; k++) g.fillRect(24, 92 + k * 18, 252 - (k % 2) * 40, 5); g.fillStyle = "#2a4a8a"; g.font = "italic 900 26px Georgia, serif"; g.fillText("$10,000", 150, 196);
  } else if (kind === "list") { g.lineWidth = 5; for (let k = 0; k < 5; k++) { g.strokeRect(26, 84 + k * 25, 16, 16); g.fillStyle = "#8a8070"; g.fillRect(54, 90 + k * 25, 180 - k * 18, 5); } g.strokeStyle = "#2a8a3a"; g.beginPath(); g.moveTo(28, 92); g.lineTo(34, 98); g.lineTo(44, 84); g.stroke(); }
  else { g.fillStyle = "#8a8070"; for (let k = 0; k < 6; k++) g.fillRect(24, 92 + k * 20, 252, 6); }
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; paperTex.set(kind, t); return t;
};
const paperMats = new Map<string, THREE.Material>();
const paperMat = (kind: string) => { let m = paperMats.get(kind); if (!m) { m = twoTone(new THREE.MeshLambertMaterial({ map: newspaper(kind), side: THREE.DoubleSide })); paperMats.set(kind, m); } return m; };
// a bat wing: a membrane fan (local +x = outward), flap = 0..1
const wingGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0.1); sh.lineTo(0.62, 0.42); sh.lineTo(0.52, 0.12); sh.lineTo(0.66, -0.06); sh.lineTo(0.42, -0.1); sh.lineTo(0.46, -0.3); sh.lineTo(0.06, -0.18); sh.closePath(); return new THREE.ShapeGeometry(sh); })();

// ---- poses: shoulder -> elbow -> hand per arm, character space (+z = toward the camera, +x = its left... screen right) ----
type Arm = [V3, V3, V3];
const hang = (s: number, k = 0): Arm => [[s * SHOULDER[0], SHOULDER[1], 0], [s * 0.25, 0.84, 0.0], [s * 0.26, 0.63 + 0.01 * Math.sin(k * 6.283), 0.05]];
const pose = (gest: string, k: number): [Arm, Arm] => {
  const L = hang(-1, k), w = Math.sin(k * Math.PI * 2);
  switch (gest) {
    // the signal lever: both hands on a grip in front of the chest, pulled from up-and-forward (k 0) down toward the body (k 1)
    case "pull": { const e = Math.min(1, Math.max(0, k)), y = 1.14 - 0.2 * e, z = 0.44 - 0.16 * e; return [[[-0.19, 1.07, 0], [-0.25, 0.92, 0.2], [-0.05, y, z]], [[0.19, 1.07, 0], [0.25, 0.92, 0.2], [0.05, y, z]]]; }
    // the same lever pulled by a full-size man (the levers are cut to Jack's height): hands low, at the belt
    case "pullLow": { const e = Math.min(1, Math.max(0, k)), y = 0.86 - 0.14 * e, z = 0.46 - 0.16 * e; return [[[-0.19, 1.07, 0], [-0.3, 0.86, 0.2], [-0.05, y, z]], [[0.19, 1.07, 0], [0.3, 0.86, 0.2], [0.05, y, z]]]; }
    case "fold": return [[[-0.19, 1.07, 0], [-0.28, 0.9, 0.12], [0.12, 0.95, 0.2]], [[0.19, 1.07, 0], [0.28, 0.9, 0.12], [-0.12, 0.99, 0.21]]];
    case "point": return [L, [[0.19, 1.07, 0], [0.37, 1.07, 0.14], [0.57, 1.14, 0.26]]];
    case "palm": return [L, [[0.19, 1.07, 0], [0.3, 0.88, 0.12], [0.36, 0.97, 0.3]]];
    case "wave": return [L, [[0.19, 1.07, 0], [0.37, 1.22, 0.05], [0.42 + 0.06 * w, 1.5, 0.06]]];
    case "cheer": return [[[-0.19, 1.07, 0], [-0.37, 1.25, 0.04], [-0.42 - 0.05 * w, 1.52, 0.05]], [[0.19, 1.07, 0], [0.37, 1.25, 0.04], [0.42 + 0.05 * w, 1.52, 0.05]]];
    case "hold": case "paper": return [[[-0.19, 1.07, 0], [-0.25, 0.88, 0.13], [-0.12, 0.96, 0.28]], [[0.19, 1.07, 0], [0.25, 0.88, 0.13], [0.12, 0.96, 0.28]]];
    case "clutch": return [[[-0.19, 1.07, 0], [-0.26, 0.9, 0.12], [-0.07, 1.02, 0.22]], [[0.19, 1.07, 0], [0.26, 0.9, 0.12], [0.07, 1.02, 0.22]]];
    case "tip": return [L, [[0.19, 1.07, 0], [0.38, 1.24, 0.1], [0.21, 1.5 + 0.02 * w, 0.17]]];
    case "sign": return [L, [[0.19, 1.07, 0], [0.29, 0.86, 0.16], [0.14 + 0.03 * w, 0.8, 0.34]]];
    case "slam": { const up = Math.abs(Math.cos(Math.PI * k)); return [L, [[0.19, 1.07, 0], [0.38, 1.15 + 0.25 * up, 0.12], [0.3, 1.05 + 0.6 * up, 0.24]]]; }
    case "whisper": return [L, [[0.19, 1.07, 0], [0.32, 1.12, 0.14], [0.13, 1.36, 0.25]]];
    case "nose": return [[[-0.19, 1.07, 0], [-0.28, 0.88, 0.12], [-0.18, 0.9, 0.3]], [[0.19, 1.07, 0], [0.3, 1.14, 0.16], [0.03, 1.42, 0.27]]];
    case "recoil": return [[[-0.19, 1.07, 0], [-0.36, 1.18, 0.1], [-0.3 - 0.03 * w, 1.42, 0.22]], [[0.19, 1.07, 0], [0.36, 1.18, 0.1], [0.3 + 0.03 * w, 1.42, 0.22]]];
    case "shake": return [[[-0.19, 1.07, 0], [-0.26, 0.9, 0.12], [-0.08 + 0.035 * w, 1.02, 0.22]], [[0.19, 1.07, 0], [0.26, 0.9, 0.12], [0.08 + 0.035 * w, 1.02, 0.22]]];
    case "tear": return [[[-0.19, 1.07, 0], [-0.34, 1.0, 0.14], [-0.36, 1.16, 0.26]], [[0.19, 1.07, 0], [0.34, 1.0, 0.14], [0.36, 1.16, 0.26]]];
    case "aim": return [[[-0.19, 1.07, 0], [-0.22, 1.1, 0.24], [-0.05, 1.24, 0.46]], [[0.19, 1.07, 0], [0.24, 1.0, 0.12], [0.06, 1.18, 0.16]]];
    case "swing": { const a = k * Math.PI * 2; return [L, [[0.19, 1.07, 0], [0.34, 1.3, 0.08], [0.3 + 0.28 * Math.cos(a), 1.5 + 0.22 * Math.sin(a), 0.16]]]; }
    case "salute": return [L, [[0.19, 1.07, 0], [0.38, 1.3, 0.12], [0.15, 1.58, 0.2]]];
    case "clap": { const c = 0.03 + 0.1 * Math.abs(Math.sin(k * Math.PI * 2)); return [[[-0.19, 1.07, 0], [-0.3, 0.98, 0.16], [-c, 1.15, 0.34]], [[0.19, 1.07, 0], [0.3, 0.98, 0.16], [c, 1.15, 0.34]]]; }
    case "flail": return [[[-0.19, 1.07, 0], [-0.4, 1.2 + 0.15 * w, 0.06], [-0.5 - 0.1 * w, 1.42 + 0.3 * w, 0.1]], [[0.19, 1.07, 0], [0.4, 1.2 - 0.15 * w, 0.06], [0.5 + 0.1 * w, 1.42 - 0.3 * w, 0.1]]];
    case "stir": return [[[-0.19, 1.07, 0], [-0.25, 0.9, 0.18], [-0.05, 0.95, 0.4]], [[0.19, 1.07, 0], [0.25, 0.9, 0.18], [0.05, 0.98, 0.4]]];
    case "shrug2": return [[[-0.19, 1.07, 0], [-0.4, 0.95, 0.06], [-0.5, 1.12, 0.12]], [[0.19, 1.07, 0], [0.4, 0.95, 0.06], [0.5, 1.12, 0.12]]];
    case "fist": return [L, [[0.19, 1.07, 0], [0.42, 1.3, 0.08], [0.46 + 0.04 * w, 1.6 + 0.03 * w, 0.12]]];
    case "hug": return [[[-0.19, 1.07, 0], [-0.3, 0.86, 0.12], [-0.13, 0.84, 0.3]], [[0.19, 1.07, 0], [0.3, 0.86, 0.12], [0.13, 0.84, 0.3]]];
    case "lift": return [[[-0.19, 1.07, 0], [-0.36, 1.45, 0.04], [-0.2, 2.06 + 0.02 * w, 0.06]], [[0.19, 1.07, 0], [0.36, 1.45, 0.04], [0.2, 2.06 + 0.02 * w, 0.06]]];
    case "charge": return [[[-0.19, 1.07, 0], [-0.3, 0.9, 0.16], [-0.12, 0.98, 0.36]], [[0.19, 1.07, 0], [0.3, 0.9, 0.12], [0.22, 0.98, 0.3]]];
    case "run": return [[[-0.19, 1.07, 0], [-0.27, 0.86, -0.12 * w], [-0.24, 0.98, 0.2 * w]], [[0.19, 1.07, 0], [0.27, 0.86, 0.12 * w], [0.24, 0.98, -0.2 * w]]];
    case "flee": return [[[-0.19, 1.07, 0], [-0.36, 1.28, 0.02], [-0.4 - 0.05 * w, 1.55, 0.0]], [[0.19, 1.07, 0], [0.36, 1.28, 0.02], [0.4 + 0.05 * w, 1.55, 0.0]]];
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

/** a town colour field for banners and shields: "#col1/#col2" = two halves, one colour = plain with a cross */
const banTex = new Map<string, THREE.CanvasTexture>();
const bannerTex = (spec: string) => {
  let t = banTex.get(spec); if (t) return t;
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 160; const g = cv.getContext("2d")!;
  const [a, b] = spec.split("/");
  g.fillStyle = a; g.fillRect(0, 0, 128, 160);
  if (a.startsWith("T:")) {   // a painted placard: "T:STRIKE" = black letters on a cream cloth
    g.fillStyle = "#efe6d2"; g.fillRect(0, 0, 128, 160); g.fillStyle = "#a8261e"; g.font = "900 30px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
    const w = a.slice(2); g.save(); g.translate(64, 80); g.rotate(-Math.PI / 2); g.fillText(w, 0, 0, 150); g.restore();
  } else if (b) { g.fillStyle = b; g.fillRect(0, 80, 128, 80); } else { g.fillStyle = "#f4f1ea"; g.fillRect(52, 0, 24, 160); g.fillRect(0, 56, 128, 24); }
  g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, 120, 152);
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; banTex.set(spec, t); return t;
};

export class Char3D {
  g = new THREE.Group(); private head: THREE.Mesh; private headMat: THREE.MeshLambertMaterial; private body: THREE.Mesh;
  private arms: THREE.Mesh[]; private legs: THREE.Mesh[]; private hands: THREE.Mesh[]; private feet: THREE.Mesh[]; private buttons: THREE.Mesh[] = [];
  private cup: THREE.Mesh; private phone: THREE.Mesh; private top: THREE.Group | null = null; private topKey = "";
  private bucket: THREE.Group; private spear: THREE.Group; private sword: THREE.Group; private banner: THREE.Group; private bannerMat: THREE.MeshLambertMaterial; private shield: THREE.Mesh; private shieldMat: THREE.MeshLambertMaterial;
  private pan: THREE.Group; private sack: THREE.Mesh; private coins: THREE.Group; private ink: THREE.Mesh;
  private gun: THREE.Group; private stick: THREE.Mesh; private crate: THREE.Group; private bunny: THREE.Mesh;
  private scroll: THREE.Group; private scroll2: THREE.Group; private staff: THREE.Group; private shovel: THREE.Group; private lantern: THREE.Group;
  private paper: THREE.Mesh; private letter: THREE.Mesh; private quill: THREE.Mesh; private sweat: THREE.Mesh; private wings: THREE.Mesh[];
  private bab: THREE.Group; private babFur: THREE.MeshLambertMaterial; private babTail: THREE.Mesh; private bottle: THREE.Group; private hammer: THREE.Group; private clip: THREE.Group; private axe: THREE.Group; private dropper: THREE.Group;
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
    this.paper = add(new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.25), paperMat("plain")));
    this.letter = add(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.006), mat("#f2e6c8")));
    this.quill = add(new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.26, 6).translate(0, 0.13, 0), mat("#f4f1ea")));
    this.sweat = add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8).scale(0.8, 1.3, 0.8), mat("#9fd4ff")));
    this.wings = [0, 1].map(() => add(new THREE.Mesh(wingGeo, twoTone(new THREE.MeshLambertMaterial({ color: "#5a4034", side: THREE.DoubleSide })))));
    // medieval props: the wooden bucket, a spear, a sword, a town banner on a pole, a round shield (town colour)
    this.bucket = add(new THREE.Group());
    { const wm = mat("#9a6a3e"), im = mat("#3a3a42");
      const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.27, 16), wm); bd.position.y = 0.135; this.bucket.add(bd);
      for (const y of [0.05, 0.22]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.128 + y * 0.11, 0.01, 6, 20).rotateX(Math.PI / 2), im); h.position.y = y; this.bucket.add(h); }
      const hd = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.01, 6, 16, Math.PI), im); hd.position.y = 0.27; this.bucket.add(hd); }
    this.spear = add(new THREE.Group());
    { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 2.3, 6), mat("#6a4a2a")); sh.position.y = 0.6; this.spear.add(sh);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 6), mat("#c9ccd4")); tip.position.y = 1.85; this.spear.add(tip); }
    this.sword = add(new THREE.Group());
    { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.012), mat("#d6d9e0")); bl.position.y = 0.42; this.sword.add(bl);
      const gd = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), mat("#8a6a3a")); gd.position.y = 0.07; this.sword.add(gd); }
    this.bannerMat = twoTone(new THREE.MeshLambertMaterial({ color: "#ffffff", side: THREE.DoubleSide })) as THREE.MeshLambertMaterial;
    this.banner = add(new THREE.Group());
    { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.4, 6), mat("#5a3a24")); pl.position.y = 0.7; this.banner.add(pl);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.8), this.bannerMat); fl.position.set(0.32, 1.5, 0); this.banner.add(fl); }
    this.shieldMat = twoTone(new THREE.MeshLambertMaterial({ color: "#ffffff" })) as THREE.MeshLambertMaterial;
    this.shield = add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 20).rotateX(Math.PI / 2), this.shieldMat));
    // Dexter's cargo: a long-handled brass warming pan, a coal sack, a purse of gold coins; an ink blot on the nose
    this.pan = add(new THREE.Group());
    { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 1.0, 6), mat("#6a4a2a")); h.position.y = 0.4; this.pan.add(h);
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.07, 22), mat("#d99a3a")); d.position.y = 0.95; d.rotation.x = Math.PI / 2; this.pan.add(d);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 8, 0, Math.PI * 2, 0, 1.0), mat("#e8b04a")); lid.position.set(0, 0.95, 0.03); lid.rotation.x = Math.PI / 2; this.pan.add(lid); }
    this.sack = add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12).scale(1, 1.25, 0.85), mat("#5a4a3a")));
    this.coins = add(new THREE.Group());
    { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10).scale(1, 0.9, 1), mat("#8a5a2a")); this.coins.add(b);
      for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 14), mat("#f0c24a")); c.position.set(-0.03 + i * 0.03, 0.09 + i * 0.008, 0.02); c.rotation.x = 0.4; this.coins.add(c); } }
    // the synod: a scroll (rolled, or torn in two halves), a crozier, a shovel, a lantern with a glowing pane
    const mkScroll = () => { const gs = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 12).rotateZ(Math.PI / 2), mat("#efe2c0")); gs.add(c);
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.26), twoTone(new THREE.MeshLambertMaterial({ color: "#f4ecd8", side: THREE.DoubleSide }))); sheet.position.set(0, -0.14, 0.03); gs.add(sheet); return gs; };
    this.scroll = add(mkScroll()); this.scroll2 = add(mkScroll());
    this.staff = add(new THREE.Group());
    { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.9, 8), mat("#d9a43a")); pole.position.y = -0.1; this.staff.add(pole);
      const curl = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 20, Math.PI * 1.5), mat("#d9a43a")); curl.position.set(0.09, 0.93, 0); this.staff.add(curl); }
    this.shovel = add(new THREE.Group());
    { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), mat("#7a5a3a")); this.shovel.add(pole);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.02), mat("#8a8e96")); blade.position.y = -0.7; this.shovel.add(blade); }
    this.lantern = add(new THREE.Group());
    { const frame = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.17, 0.13), mat("#3a3028")); this.lantern.add(frame);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.135), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 0.9) })); this.lantern.add(glow);
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI), mat("#3a3028")); hook.position.y = 0.1; this.lantern.add(hook); }
    // Napoleon's hunt: a musket, a stick, a crate of rabbits, a single rabbit in the hands
    this.gun = add(new THREE.Group());
    { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 1.0, 8), mat("#3a3a42")); br.position.y = 0.55; this.gun.add(br);
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.09), mat("#7a4a2a")); st.position.y = 0.0; this.gun.add(st); }
    this.stick = add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 1.0, 6).translate(0, 0.45, 0), mat("#7a5a3a")));
    this.crate = add(new THREE.Group());
    { const w = mat("#b78a5a"); for (const y of [0.02, 0.2]) for (const z of [-0.16, 0.16]) { const sl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.03), w); sl.position.set(0, y, z); this.crate.add(sl); }
      for (const x of [-0.24, 0.24]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.35), w); e.position.set(x, 0.12, 0); this.crate.add(e); }
      const bot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.35), w); this.crate.add(bot);
      for (const x of [-0.11, 0.11]) { const b = new THREE.Mesh(bunnyGeo(false), twoTone(new THREE.MeshLambertMaterial({ vertexColors: true }))); b.scale.setScalar(0.62); b.position.set(x, 0.01, 0); this.crate.add(b); } }
    this.bunny = add(new THREE.Mesh(bunnyGeo(false), twoTone(new THREE.MeshLambertMaterial({ vertexColors: true }))));
    // Jack the baboon (x.baboon = fur colour): a long pink-tan muzzle with nostrils, round furry ears, a curved tail.
    // The muzzle and ears ride on the head (they turn and tilt with it); the tail hangs from the back of the body.
    this.babFur = twoTone(new THREE.MeshLambertMaterial({ color: "#8a7a5a" })) as THREE.MeshLambertMaterial;
    this.bab = new THREE.Group(); this.bab.visible = false;
    { const sk = mat("#b8957a"), R = HEAD_R;
      // a long dog-like baboon muzzle pointing forward and a little down (a short round snout read as a pig, run 0 stills)
      const mz = new THREE.Mesh(new THREE.SphereGeometry(R * 0.5, 20, 14).scale(0.62, 0.52, 1.55), sk); mz.position.set(0, -R * 0.42, R * 0.92); mz.rotation.x = 0.28; this.bab.add(mz);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(R * 0.17, 12, 10).scale(1.25, 0.8, 0.9), mat("#3a2e2a")); tip.position.set(0, -R * 0.5, R * 1.66); this.bab.add(tip);
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(R * 0.36, R * 0.03, R * 0.6), mat(INK)); mouth.position.set(0, -R * 0.74, R * 1.3); mouth.rotation.x = 0.28; this.bab.add(mouth);
      const brow = new THREE.Mesh(new THREE.SphereGeometry(R * 0.5, 16, 10).scale(1.5, 0.35, 0.6), this.babFur); brow.position.set(0, R * 0.42, R * 0.72); this.bab.add(brow);
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(R * 0.26, 14, 10).scale(0.6, 1, 1), this.babFur); e.position.set(sx * R * 1.02, R * 0.12, -R * 0.05); this.bab.add(e); }
      this.bab.traverse((m) => { const me = m as THREE.Mesh; if (me.isMesh) { me.castShadow = true; me.receiveShadow = true; } }); }
    this.babTail = add(new THREE.Mesh(limb([[0, 0.7, -0.14], [0, 0.55, -0.42], [0, 0.85, -0.6], [0, 1.0, -0.5]], 0.035), this.babFur));
    // the beer bottle, the hammer (for the wooden legs), the bosses' clipboard
    // Lloyd's axe (the swing is never shown landing) and the eyedropper he feeds Mike with
    this.axe = add(new THREE.Group());
    { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.8, 8), mat("#9a6a3a")); h.position.y = 0.25; this.axe.add(h);
      const hd = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.03), mat("#8a8e96")); hd.position.set(0.08, 0.6, 0); this.axe.add(hd); }
    this.dropper = add(new THREE.Group());
    { const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.006, 0.14, 10), twoTone(new THREE.MeshLambertMaterial({ color: "#cfe6f0", transparent: true, opacity: 0.85 }))); tube.position.y = -0.05; this.dropper.add(tube);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8).scale(1, 1.3, 1), mat("#c8302a")); bulb.position.y = 0.04; this.dropper.add(bulb); }
    this.bottle = add(new THREE.Group());
    { const gm = mat("#3a7a3a"); const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.17, 12), gm); bd.position.y = 0.085; this.bottle.add(bd);
      const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.04, 0.09, 10), gm); nk.position.y = 0.21; this.bottle.add(nk);
      const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.06, 12), mat("#f2e2b0")); lb.position.y = 0.08; this.bottle.add(lb); }
    this.hammer = add(new THREE.Group());
    { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.34, 6), mat("#8a6a3a")); h.position.y = 0.12; this.hammer.add(h);
      const hd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.06), mat("#5a5e66")); hd.position.y = 0.3; this.hammer.add(hd); }
    this.clip = add(new THREE.Group());
    { const bd = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.012), mat("#8a5a32")); this.clip.add(bd);
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.22), mat("#f4f0e2")); pg.position.set(0, -0.02, 0.008); this.clip.add(pg);
      const cl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.02), mat("#9a9ea6")); cl.position.set(0, 0.14, 0.01); this.clip.add(cl); }
    this.ink = add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8).scale(1.3, 1, 0.5), mat("#1d2a55")));
    this.g.visible = false; parent.add(this.g);
  }
  /** pose at (x, y, z), turned toward the camera (yaw), scale s */
  set(r: Rig3, at: THREE.Vector3, yaw: number, s: number) {
    const { o, l, x } = r, sit = l.mode === "sit", fall = l.mode === "fall", k = l.k ?? 0, kid = o.build === "kid";
    // kids: the same rig at 0.82 of the height (head a little smaller relative to the body)
    this.g.visible = true; this.g.position.copy(at);
    // sitting: the stage raises a sitter by the seat height (0.4 m), so the hips sit at the group origin and the shins
    // reach down to the floor; fainting: the whole figure tips over sideways from the feet
    if (sit) this.g.position.y -= 0.4 * s;
    const run = l.mode === "run";
    this.g.rotation.order = "YXZ";
    this.g.rotation.set(run ? 0.16 : 0, yaw, fall ? -((l.tilt ?? 0) * Math.PI) / 180 : ((l.tilt ?? 0) * Math.PI) / 180 * -0.5); this.g.scale.setScalar(s * (kid ? 0.82 : 1));
    const dy = sit ? -0.18 : 0, ph = (l.phase ?? 0) * Math.PI * 2, bob = (l.mode === "stroll" ? 0.015 * Math.cos(ph * 2) : run ? 0.035 * Math.abs(Math.cos(ph)) : 0);
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
      const sa = l.mode === "stroll" ? 0.16 : run ? 0.3 : 0, la = l.mode === "stroll" ? 0.06 : run ? 0.14 : 0;
      const step = sa * Math.sin(ph + (i ? Math.PI : 0)), lift = la * Math.max(0, Math.sin(ph + (i ? Math.PI : 0)));
      const pts: V3[] = sit ? [[side * 0.09, HIP_Y + dy, 0], [side * 0.11, HIP_Y + dy - 0.02, 0.36], [side * 0.12, 0.08, 0.4]]
        : [[side * 0.09, HIP_Y + bob, 0], [side * 0.1, 0.33 + lift, 0.02 + step * 0.6], [side * 0.11, 0.06 + lift, step]];
      this.legs[i].geometry = limb(pts, LIMB_R * 1.1);
      this.feet[i].position.set(side * 0.12, 0.035 + (sit ? 0.02 : lift), (sit ? 0.4 : step) + 0.05); this.feet[i].material = mat(o.boots);
    });
    // props: a newspaper between both hands (or held up in one), a letter / quill in the right hand, sweat, bat wings
    const hR = AR[2], hL = AL[2], two = Math.abs(hR[0] - hL[0]) < 0.4;
    this.paper.visible = !!x.paper;
    if (x.paper) {
      this.paper.material = paperMat(x.paper);
      if (two) this.paper.position.set((hR[0] + hL[0]) / 2, (hR[1] + hL[1]) / 2 + 0.08 + dy + bob, Math.max(hR[2], hL[2]) + 0.03);
      else this.paper.position.set(hR[0], hR[1] + 0.16 + dy + bob, hR[2] + 0.03);
      this.paper.rotation.set(-0.12, 0, two ? 0 : 0.18 * Math.sin(k * Math.PI * 2));
    }
    this.letter.visible = !!x.letter && !x.paper; if (this.letter.visible) this.letter.position.set(hR[0], hR[1] + 0.05 + dy, hR[2] + 0.03);
    this.quill.visible = !!x.pen; if (x.pen) { this.quill.position.set(hR[0], hR[1] + dy, hR[2] + 0.02); this.quill.rotation.set(0.3, 0, -0.5); }
    this.sweat.visible = !!x.sweat; if (x.sweat) this.sweat.position.set(-0.2, HEAD_Y + 0.12 + dy, 0.18);
    const wf = x.wings; this.wings.forEach((w, i) => { w.visible = wf !== undefined; if (wf === undefined) return;
      const side = i ? 1 : -1, a = 0.35 * Math.sin(wf * Math.PI * 2);
      w.position.set(side * 0.12, 1.02 + dy + bob, -0.12); w.scale.set(side, 1, 1); w.rotation.set(0, side * 0.35, side * (0.15 + a)); });
    // props in the right hand
    this.cup.visible = !!x.tea; if (x.tea) this.cup.position.set(AR[2][0], AR[2][1] + 0.05 + dy, AR[2][2] + 0.02);
    this.phone.visible = !!x.phone; if (x.phone) { this.phone.position.set(AR[2][0], AR[2][1] + 0.07 + dy, AR[2][2] + 0.02); this.phone.rotation.set(-0.2, 0, 0); }
    // medieval props
    const two2 = Math.abs(hR[0] - hL[0]) < 0.4;
    this.bucket.visible = !!x.bucket;
    if (x.bucket) {
      if (two2) this.bucket.position.set((hR[0] + hL[0]) / 2, (hR[1] + hL[1]) / 2 - (l.gest === "lift" ? 0.02 : 0.12) + dy + bob, Math.max(hR[2], hL[2]) - 0.02);
      else this.bucket.position.set(hR[0], hR[1] - 0.29 + dy + bob, hR[2]);
      this.bucket.scale.setScalar(two2 ? 1.15 : 1);
    }
    this.spear.visible = !!x.spear;
    if (x.spear) { this.spear.position.set(hR[0], hR[1] + dy + bob, hR[2]); this.spear.rotation.set(l.gest === "charge" ? 1.25 : 0.05, 0, l.gest === "charge" ? 0 : -0.06); }
    this.sword.visible = !!x.sword;
    if (x.sword) { this.sword.position.set(hR[0], hR[1] + dy + bob, hR[2]); this.sword.rotation.set(0.2, 0, l.gest === "fist" || l.gest === "cheer" ? -0.75 : -0.5); }
    this.banner.visible = !!x.banner;
    if (x.banner) { this.banner.position.set(hL[0], hL[1] + dy + bob, hL[2]); this.bannerMat.map = bannerTex(x.banner); this.banner.children[1].rotation.y = 0.25 * Math.sin(ph + k * 6.283); }
    this.shield.visible = !!x.shield;
    if (x.shield) { this.shield.position.set(-0.3, 0.92 + dy + bob, 0.12); this.shield.rotation.set(0, -0.5, 0); this.shieldMat.map = bannerTex(x.shield); }
    // Dexter's cargo
    this.pan.visible = !!x.pan;
    if (x.pan) { const st = l.gest === "stir"; this.pan.position.set(hR[0], hR[1] - (st ? 0.25 : 0.5) + dy + bob, hR[2]); this.pan.rotation.set(st ? 2.4 : 0.25, 0, st ? 0 : -0.75); }
    this.sack.visible = !!x.sack;
    if (x.sack) { if (two2 && l.gest !== "hang") this.sack.position.set((hR[0] + hL[0]) / 2, (hR[1] + hL[1]) / 2 - 0.05 + dy + bob, Math.max(hR[2], hL[2]) + 0.06); else this.sack.position.set(-0.24, 1.2 + dy + bob, -0.08); }
    this.coins.visible = !!x.coins;
    if (x.coins) this.coins.position.set(hR[0], hR[1] + 0.06 + dy + bob, hR[2] + 0.02);
    this.ink.visible = !!x.ink; if (x.ink) this.ink.position.set(0.05, HEAD_Y - 0.02 + dy + bob, HEAD_R * 0.99);
    // the synod
    const torn = x.scroll === "torn";
    this.scroll.visible = !!x.scroll; this.scroll2.visible = torn;
    if (x.scroll) { this.scroll.position.set(hR[0], hR[1] + 0.03 + dy + bob, hR[2] + 0.03); this.scroll.rotation.set(0, 0, torn ? -0.6 : 0.1); this.scroll.scale.set(torn ? 0.5 : 1, 1, 1);
      if (torn) { this.scroll2.position.set(hL[0], hL[1] + 0.03 + dy + bob, hL[2] + 0.03); this.scroll2.rotation.set(0, 0, 0.6); this.scroll2.scale.set(0.5, 1, 1); } }
    this.staff.visible = !!x.staff;
    if (x.staff) { this.staff.position.set(hR[0], hR[1] + dy + bob, hR[2]); this.staff.rotation.set(0.05, 0, -0.08); }
    this.shovel.visible = !!x.shovel;
    if (x.shovel) { this.shovel.position.set((hR[0] + hL[0]) / 2, (hR[1] + hL[1]) / 2 + dy + bob, Math.max(hR[2], hL[2]) + 0.04); this.shovel.rotation.set(0.15, 0, 0.5); }
    this.lantern.visible = !!x.lantern;
    if (x.lantern) this.lantern.position.set(hL[0], hL[1] - 0.12 + dy + bob, hL[2]);
    if (this.top) { const ht = x.hatTilt ?? 0; this.top.rotation.z = ht; this.top.position.x = -Math.sin(ht) * 0.12; this.top.position.y = -Math.abs(Math.sin(ht)) * 0.05; }
    // Napoleon's hunt
    this.gun.visible = !!x.gun;
    if (x.gun) { const aim = l.gest === "aim"; this.gun.position.set(aim ? 0.04 : hR[0], (aim ? 1.2 : hR[1]) + dy + bob, aim ? 0.2 : hR[2]); this.gun.rotation.set(aim ? 1.5 : 0.15, 0, aim ? 0 : -0.15); }
    this.stick.visible = !!x.stick;
    if (x.stick) { this.stick.position.set(hR[0], hR[1] + dy + bob, hR[2]); this.stick.rotation.set(0.3, 0, l.gest === "swing" ? -0.6 - 1.4 * Math.sin(k * Math.PI * 2) : -0.4); }
    this.crate.visible = !!x.crate;
    if (x.crate) this.crate.position.set((hR[0] + hL[0]) / 2, Math.min(hR[1], hL[1]) - 0.06 + dy + bob, Math.max(hR[2], hL[2]) + 0.04);
    this.bunny.visible = !!x.bunny;
    if (x.bunny) { this.bunny.position.set((hR[0] + hL[0]) / 2, (hR[1] + hL[1]) / 2 - 0.12 + dy + bob, Math.max(hR[2], hL[2]) + 0.02); this.bunny.scale.setScalar(0.85); }
    // Jack the baboon: muzzle + ears on the head, the tail behind; fur hands
    const bb = x.baboon;
    if (bb) { this.babFur.color.set(bb); if (this.bab.parent !== this.head) this.head.add(this.bab); }
    this.bab.visible = !!bb; this.babTail.visible = !!bb;
    if (bb) { this.babTail.position.set(0, dy * 0.5 + bob, 0); }
    // Jumper's wooden peg legs (after line 3): the legs turn wood, the feet become small round pegs
    if (x.pegs) { this.legs.forEach((lg) => { lg.material = mat("#9a6a3a"); }); this.feet.forEach((f) => { f.material = mat("#6a4a2a"); f.scale.set(0.5, 1.1, 0.5); }); }
    else { this.feet.forEach((f) => f.scale.set(1, 1, 1)); this.legs.forEach((lg) => { lg.material = mat(INK); }); }
    this.axe.visible = !!x.axe; if (x.axe) { this.axe.position.set(hR[0], hR[1] + dy + bob, hR[2]); this.axe.rotation.set(0.2, 0, l.gest === "swing" ? -0.4 - 1.2 * Math.sin(k * Math.PI * 2) : -0.25); }
    this.dropper.visible = !!x.dropper; if (x.dropper) { this.dropper.position.set(hR[0], hR[1] + 0.02 + dy + bob, hR[2] + 0.02); this.dropper.rotation.set(0.6, 0, 0); this.dropper.scale.setScalar(2.4); }
    this.bottle.visible = !!x.bottle; if (x.bottle) this.bottle.position.set(hL[0], hL[1] - 0.05 + dy + bob, hL[2] + 0.02);
    this.hammer.visible = !!x.hammer; if (x.hammer) { this.hammer.position.set(hR[0], hR[1] + dy + bob, hR[2]); this.hammer.rotation.set(0.3, 0, l.gest === "swing" ? -0.6 - 1.4 * Math.sin(k * Math.PI * 2) : -0.4); }
    this.clip.visible = !!x.clipboard; if (x.clipboard) { this.clip.position.set(hL[0] + 0.04, hL[1] + 0.12 + dy + bob, hL[2] + 0.05); this.clip.rotation.set(-0.3, 0.2, 0.1); }
    // mittens: big knitted hands in the given colour
    this.hands.forEach((h) => { h.scale.setScalar(x.mittens ? 2.1 : 1); h.material = mat(x.mittens ?? SKIN); });
    if (bb) this.hands.forEach((h) => { h.material = mat("#4a3a2e"); h.scale.setScalar(1.3); });
    void mix;
  }
  hide() { this.g.visible = false; }
}
