// Camera guard + auto-framer adapter: the Rat short (shots.ts -> camtrack.json).
import * as THREE from "three";
import { Geo } from "./geo";
import { loop, guardOnly, guardFrames, AutoCfg } from "./auto";
import { RatWorld } from "../videos/rats/world";
import { camAt, camAtHand, setTrack, getTrack, FPS, TOTAL, SHOTS } from "../videos/rats/story";
import { stage } from "../videos/rats/stage";
import { SHOT_SPECS } from "../videos/rats/shots";
import { tramX } from "../videos/rats/story";
import { TRAM_Z } from "../videos/rats/layout";

const cfg = (): AutoCfg => {
  const w = new RatWorld({} as never) as unknown as { hanoi: { tram: THREE.Object3D }; root: THREE.Object3D };
  return { video: "rats", fps: FPS, total: TOTAL, root: w.root, specs: SHOT_SPECS, camAt, camAtHand, setTrack, getTrack,
    vias: (t) => SHOTS.filter((s) => s.via && Math.abs(s.at - t) < 1.6).map((s) => s.via!),
    stage: (t, c, cam) => stage(t, c as never, cam), setTime: (t) => { w.hanoi.tram.position.set(tramX(t), 0, TRAM_Z); } };
};
export const autoframe = (n = 5) => loop(cfg(), n);
export const guard = () => guardOnly(cfg()).rows;
export const debugFrame = (f: number) => { const r = guardFrames(cfg(), [f]); console.log(JSON.stringify(r[0].fails)); };
export const debugPath = (to: number) => {
  const c = cfg(), geo = new Geo(c.root), tr = getTrack()!, fl = tr.flights.find((g) => g.to === to)!;
  const P = fl.path.map((p) => new THREE.Vector3(...p));
  for (let k = 0; k + 1 < P.length; k++) {
    const a = P[k], b = P[k + 1], d = b.clone().sub(a), L = d.length();
    const h = geo.cast(a, d.clone().normalize(), L);
    if (!geo.segmentFree(a, b, 0.1)) console.log("seg", k, "/", P.length - 1, a.toArray().map((x) => +x.toFixed(2)), "->", b.toArray().map((x) => +x.toFixed(2)), "centre hit", h ? h.point.toArray().map((x) => +x.toFixed(2)) : "none", h ? JSON.stringify({ name: h.object.name, mat: (h.object.material as THREE.Material).name, col: (h.object.material as THREE.MeshLambertMaterial).color?.getHexString(), map: !!(h.object.material as THREE.MeshLambertMaterial).map, tris: h.object.geometry.attributes.position.count / 3, bb: new THREE.Box3().setFromObject(h.object).min.toArray().concat(new THREE.Box3().setFromObject(h.object).max.toArray()).map((x) => +x.toFixed(2)) }) : "", "inside(a)", geo.inside(a), "inside(b)", geo.inside(b));
  }
};
export const debugCam = (f: number) => {
  const c = cfg(), geo = new Geo(c.root), cm = camAt(f / FPS);
  const d = cm.look.clone().sub(cm.pos).normalize(), h = geo.cast(cm.pos, d, 50);
  console.log(f, "pos", cm.pos.toArray().map((x) => +x.toFixed(2)), "look", cm.look.toArray().map((x) => +x.toFixed(2)), "centre ray hits", h ? h.distance.toFixed(2) + " at " + h.point.toArray().map((x) => +x.toFixed(2)) + " " + JSON.stringify(new THREE.Box3().setFromObject(h.object).min.toArray().concat(new THREE.Box3().setFromObject(h.object).max.toArray()).map((x) => +x.toFixed(1))) : "none", "inside", geo.inside(cm.pos));
};
