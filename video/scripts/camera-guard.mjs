// Camera guard runner (CLAUDE.md rule 13) and auto-framer loop. Math only, no pixels: bundles src/guard/<video>.ts and
// runs it in Node with a stub 2D canvas.
// usage: node scripts/camera-guard.mjs <eiffel|rats|moon> [--solve] [--sheet]
//   (default)  guard the current camera (eiffel: hand-placed; rats / moon: the committed camtrack.json)
//   --solve    rats / moon: auto-frame from shots.ts: solve -> guard -> re-solve failing shots, up to 5 rounds;
//              writes src/videos/<video>/camtrack.json
//   --sheet    render the 16 worst frames into qa/<video>/worst_frames.jpg (4 x 4)
// writes qa/<video>/camera_report.json, camera_report.txt, summary.txt ("CRITICAL: 0" or the remaining list).
// Exit code 1 if any frame has a CRITICAL failure: render.yml refuses to render then.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const video = process.argv[2];
const doSolve = process.argv.includes("--solve"), sheet = process.argv.includes("--sheet");
const COMP = { eiffel: "EiffelShort", rats: "RatShort", moon: "MoonShort" };
if (!COMP[video]) { console.error("usage: node scripts/camera-guard.mjs <eiffel|rats|moon> [--solve] [--sheet]"); process.exit(2); }
const qa = path.resolve("..", "qa", video); fs.mkdirSync(qa, { recursive: true });
const work = path.resolve("out", "guard"); fs.mkdirSync(work, { recursive: true });
await build({ entryPoints: [path.resolve(`src/guard/${video}.ts`)], bundle: true, platform: "node", format: "esm", outfile: path.join(work, `${video}.mjs`),
  inject: [path.resolve("src/guard/shim.js")], loader: { ".json": "json", ".css": "empty", ".woff": "empty", ".woff2": "empty" }, define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error" });
const t0 = Date.now();
const mod = await import(pathToFileURL(path.join(work, `${video}.mjs`)).href + "?" + Date.now());
if (process.env.GUARD_DEBUG) globalThis.GUARD_DEBUG = +process.env.GUARD_DEBUG;
let rows, history = [], track = null;
if (doSolve) {
  if (!mod.autoframe) { console.error(`${video} has no shot spec (only rats / moon are auto-framed)`); process.exit(2); }
  ({ rows, history, track } = mod.autoframe(5));
  fs.writeFileSync(path.resolve(`src/videos/${video}/camtrack.json`), JSON.stringify(track) + "\n");
} else {
  const out = mod.guard(); rows = Array.isArray(out) ? out : out.rows;
}

// ---- ranges: consecutive frames failing the same rule on the same subject for the same kind of reason ----
const ranges = [], open = new Map();
for (const r of rows) {
  const seen = new Set();
  for (const q of r.fails) {
    const k = q.rule + "|" + (q.subject ?? "") + "|" + q.detail.replace(/[(\d].*$/, "").trim() + "|" + q.critical;
    if (seen.has(k)) continue; seen.add(k);
    const o = open.get(k);
    if (o && o.to === r.f - 1) { o.to = r.f; o.dets.push(q.detail); if (r.score > o.worstScore) { o.worst = r.f; o.worstScore = r.score; } }
    else { const n = { rule: q.rule, critical: q.critical, subject: q.subject ?? null, shot: r.shot, from: r.f, to: r.f, dets: [q.detail], worst: r.f, worstScore: r.score }; ranges.push(n); open.set(k, n); }
  }
}
for (const g of ranges) { g.detail = g.dets[Math.floor(g.dets.length / 2)]; delete g.dets; g.t0 = +(g.from / 30).toFixed(2); g.t1 = +((g.to + 1) / 30).toFixed(2); }
const critRows = rows.filter((r) => r.fails.some((q) => q.critical)), crit = ranges.filter((g) => g.critical), warn = ranges.filter((g) => !g.critical);
const report = { video, frames: rows.length, pass: critRows.length === 0, criticalFrames: critRows.length, warningFrames: rows.filter((r) => r.fails.length).length - critRows.length,
  seconds: (Date.now() - t0) / 1000, history, rules: ["SUBJECT", "OCCLUSION", "CLIPPING", "EMPTY", "FACES", "XCU", "STALE", "WHIPS"].map((k) => ({ rule: k, critical: rows.filter((r) => r.fails.some((q) => q.rule === k && q.critical)).length, warning: rows.filter((r) => r.fails.some((q) => q.rule === k && !q.critical)).length })),
  ranges: ranges.map(({ worstScore, ...g }) => g), frames_failing: rows.filter((r) => r.fails.length) };
fs.writeFileSync(path.join(qa, "camera_report.json"), JSON.stringify(report, null, 1));
// per frame: the current subject's head box (prop: its box) on screen + held flag, for the proxy SHARPNESS check
fs.writeFileSync(path.join(qa, "headboxes.json"), JSON.stringify(rows.map((r) => (r.box ? [...r.box, r.flight ? 0 : 1] : null))) + "\n");
const line = (g) => `${g.t0.toFixed(2).padStart(6)}-${g.t1.toFixed(2).padStart(6)} s  f${g.from}-${g.to}  ${g.rule.padEnd(9)} ${(g.subject ?? "").padEnd(20)} ${g.detail}`;
fs.writeFileSync(path.join(qa, "camera_report.txt"), ranges.map((g) => (g.critical ? "CRITICAL " : "warning  ") + line(g)).join("\n") + "\n");

// ---- summary.txt: decisions first, then the verdict ----
const DECISIONS = `Decisions (auto-framer + camera guard, made without asking; revised after the review of Rats run 24):
- No carried props any more. A transition is a FLIGHT only if it never touches geometry (free route, nothing within
  0.45 m, view never walled in, camera never inside a solid) and a real subject of either shot is in view on every
  frame; otherwise it is a 6-frame WHIP: 3 frames panning fast off the outgoing framing, 3 frames panning fast onto the
  incoming one from its own position, smeared by a directional motion blur (strongest in the middle). A whip is used
  rather than a hard cut (CLAUDE.md 1 keeps hard cuts for punchlines).
- CRITICAL = any guard failure on a held frame; in a flight CLIPPING, EMPTY and XCU; in a whip only CLIPPING (its
  frames are a motion-blurred pan between two subjects). Warnings are listed in camera_report.txt.
- Focus: every frame focuses on the current subject's head (a prop's centre), and the blur radius is capped so that no
  subject's head or prop centre gets a circle of confusion above 1.2 px; the guard checks the same lens (> 1.5 px =
  "blurred"). In a flight / whip the outgoing subject is in focus for the first half, the incoming one for the second.
- FACES now uses each character's HEAD box (chin to hat top, 0.52 m wide): head centre in the upper 55 %, the head
  never inside the caption band (62-80 %), never cut by any frame edge, and never more than 20 % covered by geometry
  or by another card in front of it (other characters / label cards, their transparent margins trimmed by 20 %).
- XCU: a head taller than 30 % of the frame is an extreme close-up (CLAUDE.md 3), CRITICAL; bursts under 8 frames
  are reported as flashes.
- STALE: on held frames the subject must not sit still on screen for more than 2 s (within every 60 frames of a shot
  its box moves >= 3.5 % of the frame or changes size >= 6 %). The solver gives every hold a new move every ~1.2 s:
  push in / drift aside / pull back / drift back (or an orbit).
- Bystanders: a named character who is not a declared subject but whose head is big in the picture (>= 6 % of the
  frame height, at least half of it in frame, not hidden) must keep its head centre in the upper 55 % and out of the
  caption band too (run 25, 32.0-32.5 s: the official under the captions while the sign was the subject).
- WHIPS: two whips with less than 0.9 s of hold between them fail (run 25, 10.0-10.5 s); such shots are merged in shots.ts.
- STALE is now a visibly new framing every 2 s: the subject's box moves >= 6 % of the frame or changes size >= 12 %
  (run 25 passed 47.5-52.0 s with 3.5 % / 6 % wobbles), unless the subject itself travels >= 1 m. The solver's beats
  are that large for standing subjects (push to x0.76, drift 5-7 % aside, turn up to 13 deg), gentle under a followed one.
- Before the full render the whole video is rendered at 270x480 (preview quality) and scripts/pixel-check.py fails
  it if one flat colour fills > 55 % of a frame, if the picture (caption band masked) barely changes for > 2 s, or if
  the subject is blurred on a held frame (SHARP: edge sharpness inside the subject's head box, from headboxes.json,
  under 70 % of the video median for 3+ frames; see pixel-check.py for why it is contrast-normalised).
- Subject boxes: characters are their full card figure (feet to hat, 0.62 m wide; seated: legs to head), so "close" =
  the full figure at 75 % of the frame height, never a face close-up. Groups ("c:/re/") are one union box. Subjects
  marked "?" are optional: they count for EMPTY but are not framed or size-checked.
- The base camera direction is the old hand-placed camera's direction to the subject (it knows the rooms, windows and
  streets), turned by the spec's angle; candidates when blocked: +-30 / +-60 / +-90 / 180 deg, higher, lower, overhead,
  closer (x0.82 / 0.6 / 0.45), two higher diagonals, and the hand-placed pose itself.
- Lighting looks, the sun direction and every on-screen action keep the old SHOTS timeline (story.ts), so the light
  arc and all actions keep their exact voice timing; only the camera comes from shots.ts. voice.wav is untouched.
- Shots shorter than ~1.2 s were merged into a neighbour (see shots.ts notes).
- Loop: a failing shot drops the candidate that failed; "too small" moves 15 % closer, "cut off" 15 % farther; twice
  blocked / too small frames it one size tighter; after 5 rounds every shot takes the settings of the round where it
  failed least; failing flights try other look timings / bends / start shifts, and a flight that still fails becomes
  a whip.
`;
const shotsTxt = track ? track.shots.map((s, i) => `  shot ${String(i).padStart(2)}  ${s.t0.toFixed(2).padStart(6)}-${s.t1.toFixed(2).padStart(6)} s  ${s.size.padEnd(6)} ${s.cand}`).join("\n") : "";
const flTxt = track ? track.flights.map((g) => `  -> shot ${g.to}: ${(g.kind ?? "fly").toUpperCase()} ${g.t0.toFixed(2)}-${g.t1.toFixed(2)} s, ${Math.round((g.t1 - g.t0) * 30)} f, ${g.kind === "whip" ? g.reason ?? "" : `${g.route}, peak ${g.peak} m/f`}`).join("\n") : "";
fs.writeFileSync(path.join(qa, "summary.txt"), (video === "eiffel" ? "" : DECISIONS + "\n") +
  `CRITICAL: ${critRows.length}${critRows.length ? ` frames in ${crit.length} ranges` : ""}\n` +
  (crit.length ? crit.map((g) => "  " + line(g)).join("\n") + "\n" : "") +
  `warnings: ${report.warningFrames} frames in ${warn.length} ranges (list in camera_report.txt)\n` +
  (history.length ? `\nLoop:\n${history.map((h) => "  " + h).join("\n")}\n` : "") +
  (shotsTxt ? `\nShots (candidate chosen, score):\n${shotsTxt}\n\nFlights:\n${flTxt}\n` : ""));
console.log(`camera guard ${video}: ${rows.length} frames, CRITICAL ${critRows.length} frames (${crit.length} ranges), warnings ${report.warningFrames} frames (${report.seconds.toFixed(0)} s)`);
for (const h of history) console.log("  " + h);
for (const g of crit) console.log("  " + line(g));

// ---- contact sheet of the worst frames ----
if (sheet) {
  const w = { CLIPPING: 5, EMPTY: 4, OCCLUSION: 3, SUBJECT: 2, FACES: 1, XCU: 3, STALE: 2, WHIPS: 2 };
  const pool = crit.length ? crit : warn.length ? warn : [];
  const pick = [...pool].sort((a, b) => (w[b.rule] * Math.sqrt(b.to - b.from + 1)) - (w[a.rule] * Math.sqrt(a.to - a.from + 1)));
  const frames = []; for (const g of pick) { const f = Math.round((g.from + g.to) / 2); if (!frames.some((x) => Math.abs(x - f) < 8)) frames.push(f); if (frames.length === 16) break; }
  for (let f = 15; frames.length < 16 && f < rows.length; f += Math.floor(rows.length / 16)) if (!frames.some((x) => Math.abs(x - f) < 8)) frames.push(f);   // fill with an even spread
  frames.sort((a, b) => a - b);
  const sd = path.join(work, `${video}-sheet`); fs.rmSync(sd, { recursive: true, force: true });
  execFileSync("node", ["scripts/render-stills.mjs", COMP[video], frames.join(","), sd, "0.3"], { stdio: "inherit" });
  const byF = new Map(rows.map((r) => [r.f, r]));
  fs.writeFileSync(path.join(sd, "notes.json"), JSON.stringify(frames.map((f) => ({ f, lines: (byF.get(f)?.fails ?? []).map((q) => `${q.critical ? "CRIT" : "warn"} ${q.rule} ${q.subject ?? ""}: ${q.detail}`) }))));
  execFileSync("python3", ["scripts/guard-sheet.py", sd, path.join(qa, "worst_frames.jpg")], { stdio: "inherit" });
}
process.exit(report.pass ? 0 : 1);
