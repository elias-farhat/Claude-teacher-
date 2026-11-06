// Analytic framing QA for the Eiffel short (no rendering): replays story.ts (camera) + stage.ts (cast) for every
// frame and checks the rules from the review: no cuts (camera jumps), faces in the upper 55 % of the frame (so the
// 70 % captions never cover them), no extreme close-ups, and something to look at (a character or key prop).
// usage: node scripts/frame-qa.mjs [out.json]      (bundles the TS with esbuild, runs in Node)
import { build } from "esbuild";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const out = process.argv[2] ?? "out/frame-qa.json";
mkdirSync(path.dirname(out), { recursive: true });
mkdirSync("out", { recursive: true });
const entry = path.resolve("out/frame-qa-entry.ts");
writeFileSync(entry, `
import * as THREE from "three";
import { camAt, FPS, TOTAL, SHOTS } from "../src/videos/eiffel/story";
import { stage } from "../src/videos/eiffel/stage";
import { trainX, wt } from "../src/videos/eiffel/story";
import { RAIL } from "../src/videos/eiffel/layout";
const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.05, 6000);
const v = new THREE.Vector3();
export const run = () => {
  const rows = [];
  let prev = null;
  for (let f = 0; f < TOTAL; f++) {
    const t = f / FPS, c = camAt(t);
    cam.position.copy(c.pos); cam.up.set(0, 1, 0); cam.lookAt(c.look); cam.rotateZ(c.roll); cam.fov = c.fov;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    const jump = prev ? { d: prev.pos.distanceTo(c.pos), a: prev.fwd.angleTo(fwd) * 180 / Math.PI } : { d: 0, a: 0 };
    prev = { pos: c.pos.clone(), fwd: fwd.clone() };
    const st = stage(t, c, cam), faces = [], props = [];
    const half = Math.tan((cam.fov * Math.PI) / 360);
    for (const p of st.places) {
      const parts = p.key.split("|"), up = parts[0] === "up", mode = up ? parts[2] : parts[1];
      const sc = p.scale ?? 1, hy = (mode === "sit" ? 0.86 : 1.44) * sc;
      v.set(p.x, p.y + hy, p.z);
      const dist = v.clone().sub(cam.position).dot(fwd);
      if (dist <= 0.1) continue;
      v.project(cam);
      const size = (0.48 * sc) / (2 * dist * half);           // head height as a share of the frame height
      if (Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05) faces.push({ who: (up ? parts[1] : parts[0]), y: +((1 - v.y) / 2).toFixed(3), x: +((v.x + 1) / 2).toFixed(3), size: +size.toFixed(3) });
    }
    for (const p of st.fx) {
      v.set(p.x, p.y, p.z);
      const dist = v.clone().sub(cam.position).dot(fwd);
      if (dist <= 0.1) continue;
      v.project(cam);
      if (Math.abs(v.x) < 1 && Math.abs(v.y) < 1) props.push(p.key.split("|").pop());
    }
    // hero landmarks count as key props: the tower, the train, the ship
    const marks = { tower: [[0, 40, 0], [0, 120, 0], [0, 220, 0], [0, 300, 0], [45, 15, 45], [-45, 15, -45]], train: t > wt(18) - 1 && t < wt(22) ? [[trainX(t) - 6, 2.5, RAIL.z], [trainX(t) - 20, 2.5, RAIL.z]] : [], ship: t > wt(23) - 1 && t < wt(24) ? [[-56 + 4 * (t - wt(23)), 3, -263]] : [] };
    for (const [name, pts] of Object.entries(marks)) for (const q of pts) {
      v.set(q[0], q[1], q[2]);
      if (v.clone().sub(cam.position).dot(fwd) <= 0.5) continue;
      v.project(cam);
      if (Math.abs(v.x) < 1 && Math.abs(v.y) < 1) { props.push(name); break; }
    }
    rows.push({ f, shot: c.shot, line: 0, interior: c.interior, fly: c.mix > 0, jump: { d: +jump.d.toFixed(3), a: +jump.a.toFixed(2) }, faces, props });
  }
  return rows;
};
`);
const bundle = path.resolve("out/frame-qa.bundle.mjs");
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: bundle, loader: { ".json": "json" }, logLevel: "error" });
const { run } = await import(pathToFileURL(bundle).href + "?" + Date.now());
const rows = run();
// ---- rules ----
// a cut = a discontinuity: a one-frame step (position or angle) far above the neighbouring frames' motion
const nb = (i, k) => [i - 2, i - 1, i + 1, i + 2].filter((j) => j >= 0 && j < rows.length).map((j) => rows[j].jump[k]);
const cuts = rows.filter((r, i) => i > 1 && (r.jump.d > 3 * Math.max(...nb(i, "d")) + 0.5 || r.jump.a > 3 * Math.max(...nb(i, "a")) + 4));
const low = rows.filter((r) => r.faces.some((q) => q.size > 0.04 && q.y > 0.55));        // a visible face below the caption line
const xcu = rows.filter((r) => r.faces.some((q) => q.size > 0.26));                      // face taller than ~1/4 frame
const empty = rows.filter((r) => !r.faces.some((q) => q.size > 0.02) && r.props.length === 0);
const spans = (list) => { const s = []; for (const r of list) { const l = s[s.length - 1]; if (l && r.f === l[1] + 1) l[1] = r.f; else s.push([r.f, r.f]); } return s; };
const fmt = (sp) => sp.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`) + ` (${(a / 30).toFixed(1)} s)`).join(", ") || "none";
const report = {
  frames: rows.length,
  cuts: spans(cuts).length, cutFrames: fmt(spans(cuts)),
  facesBelow55: fmt(spans(low)), extremeCloseUps: fmt(spans(xcu)), nothingInFrame: fmt(spans(empty)),
  maxStep: rows.reduce((m, r) => Math.max(m, r.jump.d), 0).toFixed(2) + " m/frame",
};
writeFileSync(out, JSON.stringify({ report, rows }, null, 0));
console.log(JSON.stringify(report, null, 1));
