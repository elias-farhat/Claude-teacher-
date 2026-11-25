// The sets of "This Chicken Lived 18 Months Without a Head": the Olsen farm (white farmhouse with a porch, red barn,
// dirt yard, chopping block, fence, hay, trees), the open-roofed kitchen (cream walls, honey floor, the table, the neck
// diagram on an easel), the sideshow (striped tent, MIRACLE MIKE banner, ticket booth, the truck), the spotlight stage.
// Bright, warm materials everywhere (Baboon render #46: purple floors and dark sets read badly). Kenney props mid/bg.
import * as THREE from "three";
import { Batch, lam, V, Kit, boxGeo } from "../bridge/build";
import { rep, grassHD, planksHD, roofHD, ctex } from "../bridge/paint";
import { ground, gableRoof, Lamp } from "../rats/hanoi";
import { twoTone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { HOUSE, PORCH, BARN, CHOP, GRAIN, KITCHEN, TABLE, EASEL, TENT, BOOTH, TRUCK, RING } from "./layout";

export type Sets = { lamps: Lamp[]; axe: THREE.Object3D; money: THREE.Object3D; truck: THREE.Group; beam: THREE.Mesh; glow: THREE.Mesh };
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const M = (c: string) => twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color(c) }));
const dirtTex = () => ctex("ckDirt", 512, 512, (g, r) => { g.fillStyle = "#c9a578"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 2600; i++) { g.fillStyle = ["#bf9a6c", "#d4b088", "#b8946a"][i % 3]; g.fillRect(r() * 512, r() * 512, 3, 3); } });
const clapTex = (key: string, base: string, line: string) => ctex(key, 256, 256, (g) => { g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.fillStyle = line; for (let y = 0; y < 256; y += 21) g.fillRect(0, y, 256, 3); });
const stripeTex = () => ctex("ckStripes", 512, 256, (g) => { for (let x = 0; x < 512; x += 64) { g.fillStyle = (x / 64) % 2 ? "#f4ecd8" : "#c8302a"; g.fillRect(x, 0, 64, 256); } });
const sign = (key: string, text: string, bg: string, fg: string, w = 1024, h = 256) => ctex(key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = fg; g.font = `900 ${Math.round(h * 0.5)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 6, w - 60); });
/** the neck diagram: a big friendly chicken neck in section, the spine down the middle and the brain stem glowing yellow */
const diagramTex = () => ctex("ckDiagram", 640, 800, (g) => {
  g.fillStyle = "#f8f2e2"; g.fillRect(0, 0, 640, 800); g.strokeStyle = "#2a2430"; g.lineWidth = 12; g.strokeRect(10, 10, 620, 780);
  g.fillStyle = "#2a2430"; g.font = "900 54px Georgia, serif"; g.textAlign = "center"; g.fillText("THE NECK", 320, 80);
  g.fillStyle = "#ffffff"; g.strokeStyle = "#2a2430"; g.lineWidth = 8;
  g.beginPath(); g.moveTo(230, 760); g.bezierCurveTo(200, 520, 230, 300, 300, 200); g.lineTo(380, 200); g.bezierCurveTo(430, 320, 440, 520, 420, 760); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#f0b8b0"; g.beginPath(); g.ellipse(340, 200, 44, 14, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.strokeStyle = "#9a8aa0"; g.lineWidth = 22; g.beginPath(); g.moveTo(330, 230); g.bezierCurveTo(310, 420, 320, 600, 320, 760); g.stroke();
  g.fillStyle = "#ffd23a"; g.strokeStyle = "#c88a10"; g.lineWidth = 6; g.beginPath(); g.ellipse(332, 262, 30, 40, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#2a2430"; g.font = "900 38px Georgia, serif"; g.textAlign = "left"; g.fillText("brain stem", 390, 272);
  g.lineWidth = 5; g.strokeStyle = "#2a2430"; g.beginPath(); g.moveTo(385, 262); g.lineTo(366, 262); g.stroke();
});

export function buildSets(R: THREE.Group, kit: Kit): Sets {
  const b = new Batch(), r = rng(1945), lamps: Lamp[] = [];
  const bx = (mat: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 2.5) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile), mat);
  const add = (name: string, x: number, y: number, z: number, s: number, rot = 0) => {
    const o = kit[name]; if (!o) return;
    b.addObject(o, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), V(s, s, s)));
  };
  const grass = lam("ckGrass", () => ({ map: grassHD(), color: "#a6c070" }));
  const dirt = lam("ckDirtM", () => ({ map: rep(dirtTex(), 1, 1) }));
  const planks = lam("ckPlanks", () => ({ map: rep(planksHD(), 1, 1), color: "#d8b07a" }));
  const white = lam("ckClap", () => ({ map: rep(clapTex("ckClapT", "#f6efe0", "#ddd2bc"), 1, 1) }));
  const red = lam("ckBarn", () => ({ map: rep(clapTex("ckBarnT", "#b8402e", "#9a3424"), 1, 1) }));
  const roofR = lam("ckRoof", () => ({ map: rep(roofHD("#8a4a3a"), 2, 2) }));
  const trim = lam("ckTrim", () => ({ color: "#ffffff" }));
  const glass = lam("ckGlass", () => ({ color: "#8ab4d8" }));
  const woodD = lam("ckWoodD", () => ({ color: "#8a5a34" }));
  const gold = lam("ckGold", () => ({ color: "#f0c24a" }));

  // ---- the farm ----
  ground(b, grass, -400, 400, -400, 400, 0, 10);
  ground(b, dirt, -14, 18, -5, 11, 0.02, 6);
  { const { x0, x1, z0, z1, h } = HOUSE;
    bx(white, x0, 0, z0, x1, h, z1); gableRoof(b, roofR, white, x0, x1, z0, z1, h, 2.6, 0.5);
    for (const x of [-4, 3.5]) { bx(trim, x - 0.75, 1.3, z1, x + 0.75, 2.9, z1 + 0.06, 1); bx(glass, x - 0.6, 1.42, z1 + 0.06, x + 0.6, 2.78, z1 + 0.08, 1); }
    bx(woodD, -0.7, 0, z1, 0.7, 2.4, z1 + 0.05, 1);
    const p = PORCH; bx(planks, p.x0, 0, p.z0, p.x1, p.h, p.z1, 1.5); for (let i = 0; i < 3; i++) bx(planks, -1.2, 0, p.z1 + i * 0.32, 1.2, p.h - (i + 1) * 0.14, p.z1 + (i + 1) * 0.32, 1);
    for (const x of [p.x0 + 0.2, -1.6, 1.6, p.x1 - 0.2]) bx(trim, x - 0.08, p.h, p.z1 - 0.25, x + 0.08, 3.0, p.z1 - 0.09, 1);
    bx(roofR, p.x0 - 0.2, 3.0, p.z0, p.x1 + 0.2, 3.12, p.z1 + 0.1, 2);
    lamps.push({ p: V(-1.2, 2.6, p.z0 + 0.3), k: 0.6 }); }
  { const { x0, x1, z0, z1 } = BARN; bx(red, x0, 0, z0, x1, 5, z1); gableRoof(b, roofR, red, x0, x1, z0, z1, 5, 3, 0.5);
    bx(trim, 15.5, 0, z1, 18.5, 3.6, z1 + 0.06, 1); }
  // the chopping block, fences, hay, trees, a few props
  b.add(new THREE.CylinderGeometry(0.36, 0.42, 0.55, 16).translate(CHOP.x, 0.275, CHOP.z), woodD);
  for (let x = -14; x <= 18; x += 2.4) add("fence_simple", x, 0, 11.5, 2.4, 0);
  for (const [n, x, z, s, ro] of [["hay-bale", -9, -2, 1.6, 0.3], ["hay-bale", -10.5, -0.6, 1.6, 1.0], ["barrel", 9, -4, 0.7, 0], ["cart", -11, 6, 2.4, 0.5], ["crate", 10.5, -2.5, 1.0, 0.4]] as [string, number, number, number, number][]) add(n, x, 0.02, z, s, ro);
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat"];
  for (let i = 0; i < 60; i++) { const a = r() * Math.PI * 2, d = 26 + r() * 50, x = Math.cos(a) * d, z = Math.sin(a) * d - 4; add(trees[i % 4], x, 0, z, 4 + r() * 2.5, r() * 6); }
  for (let i = 0; i < 40; i++) b.add(new THREE.CircleGeometry(0.03, 6).rotateX(-Math.PI / 2).translate(GRAIN.x + (r() - 0.5) * 1.6, 0.03, GRAIN.z + (r() - 0.5) * 1.2), lam("ckGrain", () => ({ color: "#f2d060" })));
  // the porch table for line 9 (the money is a separate group)
  bx(woodD, 2.7, PORCH.h, -6.9, 4.3, PORCH.h + 0.78, -6.1, 1); bx(planks, 2.6, PORCH.h + 0.78, -7.0, 4.4, PORCH.h + 0.84, -6.0, 1);

  // ---- the kitchen (open roof: the sun lights it) ----
  { const k = KITCHEN, x0 = k.x - 5, x1 = k.x + 5, z0 = k.z - 4.5, z1 = k.z + 3, h = 3.2, wp = lam("ckPaper", () => ({ map: rep(clapTex("ckPaperT", "#f8ecc8", "#ecd9a8"), 1, 1) }));
    ground(b, lam("ckFloor", () => ({ map: rep(planksHD(), 1, 1), color: "#e8c48e" })), x0, x1, z0, z1, 0.02, 2.5);
    // the back wall with two windows onto the fields; side walls
    const wy0 = 1.0, wy1 = 2.4;
    bx(wp, x0, 0, z0 - 0.2, x0 + 1.4, h, z0); bx(wp, x0 + 3.0, 0, z0 - 0.2, x1 - 3.0, h, z0); bx(wp, x1 - 1.4, 0, z0 - 0.2, x1, h, z0);
    for (const [a, c] of [[x0 + 1.4, x0 + 3.0], [x1 - 3.0, x1 - 1.4]]) { bx(wp, a, 0, z0 - 0.2, c, wy0, z0); bx(wp, a, wy1, z0 - 0.2, c, h, z0); bx(trim, a, wy0 - 0.06, z0, c, wy0, z0 + 0.12, 1); }
    bx(wp, x0 - 0.2, 0, z0 - 0.2, x0, h, z1); bx(wp, x1, 0, z0 - 0.2, x1 + 0.2, h, z1);
    for (let i = 0; i < 8; i++) add(trees[i % 4], x0 - 4 + i * 2.2, 0, z0 - 6 - (i % 3) * 3, 3.6 + (i % 3), i);   // the view out of the windows
    // the table, two chairs, the stove, a dresser with plates
    const t = TABLE; bx(woodD, t.x - 0.9, 0, t.z - 0.45, t.x + 0.9, 0.76, t.z + 0.45, 1); bx(lam("ckCloth", () => ({ map: ctex("ckGingham", 256, 256, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#f6f0e6" : "#d8545a"; g.fillRect(x * 32, y * 32, 32, 32); } }) })), t.x - 0.98, 0.76, t.z - 0.52, t.x + 0.98, 0.8, t.z + 0.52, 1);
    bx(lam("ckStove", () => ({ color: "#3a3a40" })), x0 + 0.3, 0, z0 + 0.3, x0 + 1.4, 1.0, z0 + 1.1, 1);
    bx(woodD, x1 - 2.6, 0, z0 + 0.05, x1 - 0.4, 1.9, z0 + 0.55, 1);
    for (let i = 0; i < 5; i++) b.add(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 14).rotateX(Math.PI / 2).translate(x1 - 2.35 + i * 0.42, 1.55, z0 + 0.6), lam("ckPlate", () => ({ color: "#f4f8ff" })));
    // the easel with the neck diagram
    const e = EASEL; for (const s of [-1, 1]) bx(woodD, e.x + s * 0.5 - 0.04, 0, e.z - 0.04, e.x + s * 0.5 + 0.04, 2.3, e.z + 0.04, 1);
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), twoTone(new THREE.MeshLambertMaterial({ map: diagramTex() }))); dm.position.set(e.x, 1.45, e.z + 0.06); R.add(dm);
    lamps.push({ p: V(t.x, 2.6, t.z), k: 1.0 }, { p: V(x0 + 1, 2.2, z0 + 0.4), k: 0.7 }); }
  // the brain-stem glow on the diagram (pulses on "keeps you breathing")
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.075, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.4, 0.6), transparent: true, opacity: 0.0, depthWrite: false }));
  glow.position.set(EASEL.x + 0.02, 1.45 + 0.75 - (262 / 800) * 1.5, EASEL.z + 0.075); glow.layers.set(NOINK); R.add(glow);

  // ---- the sideshow: the striped tent, the banner, the ticket booth, Mike's crate ----
  { const c = TENT, stripes = lam("ckTent", () => ({ map: rep(stripeTex(), 4, 1) }));
    ground(b, dirt, c.x - 16, c.x + 16, c.z - 10, c.z + 18, 0.02, 6);
    b.add(new THREE.CylinderGeometry(6, 6, 3.4, 32, 1, true).translate(c.x, 1.7, c.z), stripes);
    b.add(new THREE.ConeGeometry(6.6, 3.2, 32, 1, true).translate(c.x, 5.0, c.z), stripes);
    bx(lam("ckTentDoor", () => ({ color: "#5a2a2a" })), c.x - 1.2, 0, c.z + 5.8, c.x + 1.2, 2.6, c.z + 6.1, 1);
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.35), twoTone(new THREE.MeshLambertMaterial({ map: sign("ckBanner", "MIRACLE MIKE", "#f2d060", "#a8261e") }))); ban.position.set(c.x, 3.9, c.z + 6.35); R.add(ban);
    for (const s of [-1, 1]) bx(woodD, c.x + s * 2.8 - 0.06, 0, c.z + 6.3, c.x + s * 2.8 + 0.06, 4.6, c.z + 6.42, 1);
    const bo = BOOTH; bx(lam("ckBooth", () => ({ color: "#d8545a" })), bo.x - 0.9, 0, bo.z - 0.6, bo.x + 0.9, 1.05, bo.z + 0.4, 1); bx(planks, bo.x - 1.0, 1.05, bo.z - 0.7, bo.x + 1.0, 1.12, bo.z + 0.5, 1);
    for (const s of [-1, 1]) bx(trim, bo.x + s * 0.85 - 0.05, 1.12, bo.z - 0.6, bo.x + s * 0.85 + 0.05, 2.5, bo.z - 0.5, 1);
    const pr = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), twoTone(new THREE.MeshLambertMaterial({ map: sign("ckPrice", "25¢ A LOOK", "#f8f2e2", "#2a2430", 768, 192) }))); pr.position.set(bo.x, 2.65, bo.z - 0.5); R.add(pr);
    bx(planks, bo.x + 1.5, 0, bo.z - 0.4, bo.x + 2.3, 0.7, bo.z + 0.4, 1);   // Mike's crate
    for (const [x, z] of [[-6, 10], [6, 10]]) { lamps.push({ p: V(c.x + x, 3.2, c.z + z), k: 0.8 }); bx(woodD, c.x + x - 0.07, 0, c.z + z - 0.07, c.x + x + 0.07, 3.0, c.z + z + 0.07, 1); }
    for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = 24 + r() * 30; add(trees[i % 4], c.x + Math.cos(a) * d, 0, c.z + Math.sin(a) * d, 4 + r() * 2, r()); } }

  // ---- the spotlight stage ----
  { const c = RING;
    ground(b, lam("ckRingGround", () => ({ color: "#b89a70" })), c.x - 14, c.x + 14, c.z - 10, c.z + 14, 0.02, 6);
    b.add(new THREE.CylinderGeometry(2.2, 2.3, 0.4, 36).translate(c.x, 0.2, c.z), lam("ckStage", () => ({ color: "#c8302a" })));
    b.add(new THREE.TorusGeometry(2.25, 0.06, 6, 48).rotateX(Math.PI / 2).translate(c.x, 0.4, c.z), gold);
    b.add(new THREE.CylinderGeometry(0.42, 0.5, 1.0, 20).translate(c.x, 0.9, c.z), gold);
    // a red curtain behind, string lights on posts round the back
    const cur = lam("ckCurtain", () => ({ color: "#a8202a", side: THREE.DoubleSide })), cg = new THREE.PlaneGeometry(14, 6, 40, 1); { const p = cg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.18 * Math.sin(p.getX(i) * 4)); }
    b.add(cg.translate(c.x, 3, c.z - 3.6), cur);
    for (let i = 0; i < 7; i++) { const x = c.x - 6 + i * 2; lamps.push({ p: V(x, 4.6 + 0.2 * Math.sin(i), c.z - 3.0), k: 0.6 }); } }
  b.build(R);

  // ---- moving / switchable parts ----
  const axe = new THREE.Group(); { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.8, 8), M("#9a6a3a")); h.position.y = 0.4; axe.add(h); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.035), M("#8a8e96")); hd.position.set(0.1, 0.0, 0); axe.add(hd);
    axe.position.set(CHOP.x, 0.58, CHOP.z); axe.rotation.z = 0.35; R.add(axe); }
  const money = new THREE.Group(); { const gm = M("#f0c24a"), bill = M("#6a9a5a");
    for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05 + (i % 3) * 0.06, 14), gm); st.position.set(3.0 + (i % 3) * 0.2, PORCH.h + 0.86 + (0.025 + (i % 3) * 0.03), -6.75 + Math.floor(i / 3) * 0.2); money.add(st); }
    for (let i = 0; i < 4; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04 + i * 0.03, 0.12), bill); bl.position.set(3.7 + (i % 2) * 0.3, PORCH.h + 0.86 + 0.02 + i * 0.015, -6.7 + Math.floor(i / 2) * 0.18); money.add(bl); }
    money.traverse((o) => { const me = o as THREE.Mesh; if (me.isMesh) me.castShadow = true; }); R.add(money); }
  const truck = new THREE.Group(); { const body = M("#2a6a9a"), blk = M("#22222a");
    const addT = (geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number]) => { const me = new THREE.Mesh(geo, m); me.position.set(...p); me.castShadow = me.receiveShadow = true; truck.add(me); return me; };
    addT(new THREE.BoxGeometry(1.8, 1.2, 1.9), body, [1.9, 1.3, 0]); addT(new THREE.BoxGeometry(1.2, 0.8, 1.8), body, [3.3, 1.1, 0]);
    addT(new THREE.BoxGeometry(0.05, 0.55, 1.5), lam("ckTruckGlass", () => ({ color: "#9ac4e0" })), [2.82, 1.55, 0]);
    addT(new THREE.BoxGeometry(3.6, 0.3, 2.0), body, [-0.8, 0.85, 0]);
    for (const s of [-1, 1]) { const sg = addT(new THREE.BoxGeometry(3.4, 0.9, 0.06), body, [-0.8, 1.45, s * 0.98]); void sg;
      const ban = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), twoTone(new THREE.MeshLambertMaterial({ map: sign("ckBanner", "MIRACLE MIKE", "#f2d060", "#a8261e") }))); ban.position.set(-0.8, 1.45, s * 1.02); ban.rotation.y = s > 0 ? 0 : Math.PI; truck.add(ban); }
    addT(new THREE.BoxGeometry(3.4, 0.08, 2.0), lam("ckLid", () => ({ color: "#f2d060" })), [-0.8, 1.92, 0]);   // the lid Mike stands on
    for (const x of [-1.8, 0.4, 3.2]) for (const s of [-1, 1]) addT(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 16).rotateX(Math.PI / 2), blk, [x, 0.42, s * 0.95]);
    truck.position.copy(TRUCK); truck.traverse((o) => { o.userData.noGuard = true; }); R.add(truck); }
  // the spotlight beam on the pedestal (soft, additive, no ink)
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 8, 24, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.9, 0.6), transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  beam.position.set(RING.x, 4.4, RING.z); beam.layers.set(NOINK); R.add(beam);
  return { lamps, axe, money, truck, beam, glow };
}
export const SET_KIT = ["fence_simple", "hay-bale", "barrel", "cart", "crate", "tree_oak", "tree_default", "tree_detailed", "tree_fat"];
