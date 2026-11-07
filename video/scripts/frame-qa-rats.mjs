// Analytic framing QA for the Rat Bounty short (no rendering): replays story.ts (camera) + stage.ts (cast) for every
// frame and checks the rules from the review: no cuts (camera jumps), faces in the upper 55 % of the frame (so the
// 70 % captions never cover them), no extreme close-ups, and something to look at (a character or key prop).
// usage: node scripts/frame-qa.mjs [out.json]      (bundles the TS with esbuild, runs in Node)
import { build } from "esbuild";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const out = process.argv[2] ?? "out/frame-qa-rats.json";
mkdirSync(path.dirname(out), { recursive: true });
mkdirSync("out", { recursive: true });
const entry = path.resolve("out/frame-qa-rats-entry.ts");
writeFileSync(entry, `
import * as THREE from "three";
import { camAt, FPS, TOTAL, SHOTS, glideTo } from "../src/videos/rats/story";
import { stage } from "../src/videos/rats/stage";
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
    rows.push({ f, shot: c.shot, next: c.next, line: 0, interior: c.interior, fly: c.mix > 0, jump: { d: +jump.d.toFixed(3), a: +jump.a.toFixed(2) }, faces, props });
  }
  const gl = SHOTS.map((sh, b) => { const g = b ? glideTo(b) : null; return g ? { b, name: sh.name, t0: +g.t0.toFixed(2), t1: +g.t1.toFixed(2), frames: Math.round((g.t1 - g.t0) * FPS), len: +g.total.toFixed(1) } : null; }).filter(Boolean);
  return { rows, gl };
};
`);
const bundle = path.resolve("out/frame-qa-rats.bundle.mjs");
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: bundle, loader: { ".json": "json" }, logLevel: "error" });
const { run } = await import(pathToFileURL(bundle).href + "?" + Date.now());
const { rows, gl } = run();
// ---- rules ----
// a cut = a discontinuity: a one-frame step (position or angle) far above the neighbouring frames' motion
const nb = (i, k) => [i - 2, i - 1, i + 1, i + 2].filter((j) => j >= 0 && j < rows.length).map((j) => rows[j].jump[k]);
const cuts = rows.filter((r, i) => i > 1 && (r.jump.d > 3 * Math.max(...nb(i, "d")) + 0.5 || r.jump.a > 3 * Math.max(...nb(i, "a")) + 4));
const low = rows.filter((r) => r.faces.some((q) => q.size > 0.04 && q.y > 0.55));        // a visible face below the caption line
const xcu = rows.filter((r) => r.faces.some((q) => q.size > 0.26));                      // face taller than ~1/4 frame
const SET_SUBJECT = new Set(gl.filter((g) => ["boulevard", "plaque"].includes(g.name)).map((g) => g.b));
const empty = rows.filter((r) => !r.faces.some((q) => q.size > 0.02) && r.props.length === 0 && !SET_SUBJECT.has(r.shot) && !SET_SUBJECT.has(r.next));
const spans = (list) => { const s = []; for (const r of list) { const l = s[s.length - 1]; if (l && r.f === l[1] + 1) l[1] = r.f; else s.push([r.f, r.f]); } return s; };
const fmt = (sp) => sp.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`) + ` (${(a / 30).toFixed(1)} s)`).join(", ") || "none";
const report = {
  frames: rows.length,
  cuts: spans(cuts).length, cutFrames: fmt(spans(cuts)),
  facesBelow55: fmt(spans(low)), extremeCloseUps: fmt(spans(xcu)), nothingInFrame: fmt(spans(empty)),
  maxStep: rows.reduce((m, r) => Math.max(m, r.jump.d), 0).toFixed(2) + " m/frame",
};
// glides: frames + peak speed (CLAUDE.md: 25-30 frames, peak <= ~6 m/frame)
const FPS = 30;
const glides = gl.map((g) => { const fr = rows.filter((r) => r.f >= Math.round(g.t0 * FPS) && r.f <= Math.round(g.t1 * FPS)); return { ...g, peak: +Math.max(...fr.map((r) => r.jump.d)).toFixed(2) }; });
report.glides = glides.map((g) => `${g.name}: ${g.frames} f, ${g.len} m, peak ${g.peak} m/f`).join(" | ");
report.badGlides = glides.filter((g) => g.frames < 25 || g.frames > 30 || g.peak > 6.2).map((g) => g.name).join(", ") || "none";
writeFileSync(out, JSON.stringify({ report, rows, glides }, null, 0));
console.log(JSON.stringify(report, null, 1));
