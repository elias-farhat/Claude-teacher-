// Per-frame signature of the Eiffel timeline (camera pose + look + interior flag + every card on stage), to find
// which frames / render chunks a code change touches. usage: node scripts/frame-sig.mjs <out.json>
import { build } from "esbuild";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const out = process.argv[2] ?? "out/frame-sig.json";
mkdirSync("out", { recursive: true });
const entry = path.resolve("out/frame-sig-entry.ts");
writeFileSync(entry, `
import * as THREE from "three";
import { camAt, FPS, TOTAL, SHOTS } from "../src/videos/eiffel/story";
import { stage } from "../src/videos/eiffel/stage";
const r = (x: number) => Math.round(x * 1000) / 1000;
export const run = () => {
  const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.05, 6000), sig: string[] = [];
  for (let f = 0; f < TOTAL; f++) {
    const t = f / FPS, c = camAt(t);
    cam.position.copy(c.pos); cam.up.set(0, 1, 0); cam.lookAt(c.look); cam.rotateZ(c.roll); cam.fov = c.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const st = stage(t, c, cam);
    sig.push(JSON.stringify([c.pos.toArray().map(r), c.look.toArray().map(r), r(c.fov), r(c.roll), r(c.dof), c.interior, SHOTS[c.shot].look, SHOTS[c.next].look, r(c.mix),
      st.places.map((p) => [p.key, r(p.x), r(p.y), r(p.z), p.scale ?? 1]), st.fx.map((p) => [p.key, r(p.x), r(p.y), r(p.z), r(p.w), r(p.h), r(p.rot ?? 0), p.flat ? 1 : 0]),
      st.lights.map((l) => [r(l.p.x), r(l.p.y), r(l.p.z), r(l.k)])]));
  }
  return sig;
};`);
const bundle = path.resolve("out/frame-sig.bundle.mjs");
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: bundle, loader: { ".json": "json" }, logLevel: "error" });
const { run } = await import(pathToFileURL(bundle).href + "?" + Date.now());
writeFileSync(out, JSON.stringify(run()));
console.log("signatures:", out);
