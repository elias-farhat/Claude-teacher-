// Camera guard runner (CLAUDE.md rule 13). Math only, no pixels: bundles src/guard/<video>.ts and runs it in Node with
// a stub 2D canvas (the painted textures are irrelevant to the maths), checks every frame and writes
//   qa/<video>/camera_report.json   every failing frame + the failing ranges with their reasons
// and prints the ranges. Exit code 1 if any frame fails: render.yml refuses to render then.
// usage: node scripts/camera-guard.mjs <eiffel|rats|moon> [--sheet]
//   --sheet  also renders the 16 worst frames (one per failing range, worst first) into qa/<video>/worst_frames.jpg
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const video = process.argv[2];
const sheet = process.argv.includes("--sheet");
const COMP = { eiffel: "EiffelShort", rats: "RatShort", moon: "MoonShort" };
if (!COMP[video]) { console.error("usage: node scripts/camera-guard.mjs <eiffel|rats|moon> [--sheet]"); process.exit(2); }
const qa = path.resolve("..", "qa", video); fs.mkdirSync(qa, { recursive: true });
const work = path.resolve("out", "guard"); fs.mkdirSync(work, { recursive: true });
await build({ entryPoints: [path.resolve(`src/guard/${video}.ts`)], bundle: true, platform: "node", format: "esm", outfile: path.join(work, `${video}.mjs`),
  inject: [path.resolve("src/guard/shim.js")], loader: { ".json": "json", ".css": "empty", ".woff": "empty", ".woff2": "empty" }, define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error" });
const t0 = Date.now();
const { guard } = await import(pathToFileURL(path.join(work, `${video}.mjs`)).href + "?" + Date.now());
if (process.env.GUARD_DEBUG) globalThis.GUARD_DEBUG = +process.env.GUARD_DEBUG;
const rows = guard();

// ---- ranges: consecutive frames failing the same rule on the same subject ----
const ranges = [];
const open = new Map();
for (const r of rows) {
  const seen = new Set();
  for (const q of r.fails) {
    const k = q.rule + "|" + (q.subject ?? "") + "|" + q.detail.replace(/[(\d].*$/, "").trim();   // same reason category
    if (seen.has(k)) continue;
    seen.add(k);
    const o = open.get(k);
    if (o && o.to === r.f - 1) { o.to = r.f; o.dets.push(q.detail); o.worst = r.score > o.worstScore ? r.f : o.worst; o.worstScore = Math.max(o.worstScore, r.score); }
    else { const n = { rule: q.rule, subject: q.subject ?? null, from: r.f, to: r.f, detail: q.detail, dets: [q.detail], worst: r.f, worstScore: r.score }; ranges.push(n); open.set(k, n); }
  }
}
for (const g of ranges) { g.detail = g.dets[Math.floor(g.dets.length / 2)]; delete g.dets; g.t0 = +(g.from / 30).toFixed(2); g.t1 = +((g.to + 1) / 30).toFixed(2); }
const failing = rows.filter((r) => r.fails.length);
const report = { video, frames: rows.length, pass: failing.length === 0, failingFrames: failing.length, seconds: (Date.now() - t0) / 1000,
  rules: ["SUBJECT", "OCCLUSION", "CLIPPING", "EMPTY", "FACES"].map((k) => ({ rule: k, frames: rows.filter((r) => r.fails.some((q) => q.rule === k)).length })),
  ranges: ranges.map(({ worstScore, ...g }) => g), frames_failing: failing };
fs.writeFileSync(path.join(qa, "camera_report.json"), JSON.stringify(report, null, 1));
const fmtT = (s) => s.toFixed(2).padStart(6);
console.log(`camera guard ${video}: ${rows.length} frames, ${failing.length} failing, ${ranges.length} ranges (${report.seconds.toFixed(0)} s)`);
for (const g of ranges) console.log(`  ${fmtT(g.t0)}-${fmtT(g.t1)} s  f${g.from}-${g.to}  ${g.rule.padEnd(9)} ${(g.subject ?? "").padEnd(18)} ${g.detail}`);
fs.writeFileSync(path.join(qa, "camera_report.txt"), ranges.map((g) => `${g.t0.toFixed(2)}-${g.t1.toFixed(2)} s\tf${g.from}-${g.to}\t${g.rule}\t${g.subject ?? ""}\t${g.detail}`).join("\n") + "\n");

// ---- contact sheet of the worst frames ----
if (sheet && ranges.length) {
  const w = { CLIPPING: 5, EMPTY: 4, OCCLUSION: 3, SUBJECT: 2, FACES: 1 };
  const pick = [...ranges].sort((a, b) => (w[b.rule] * Math.sqrt(b.to - b.from + 1)) - (w[a.rule] * Math.sqrt(a.to - a.from + 1)));
  const frames = []; for (const g of pick) { const f = Math.round((g.from + g.to) / 2); if (!frames.some((x) => Math.abs(x - f) < 8)) frames.push(f); if (frames.length === 16) break; }
  frames.sort((a, b) => a - b);
  const sd = path.join(work, `${video}-sheet`); fs.rmSync(sd, { recursive: true, force: true });
  execFileSync("node", ["scripts/render-stills.mjs", COMP[video], frames.join(","), sd, "0.3"], { stdio: "inherit" });
  const notes = frames.map((f) => ({ f, lines: (rows[f]?.fails ?? []).map((q) => `${q.rule} ${q.subject ?? ""}: ${q.detail}`) }));
  fs.writeFileSync(path.join(sd, "notes.json"), JSON.stringify(notes));
  execFileSync("python3", ["scripts/guard-sheet.py", sd, path.join(qa, "worst_frames.jpg")], { stdio: "inherit" });
}
process.exit(report.pass ? 0 : 1);
