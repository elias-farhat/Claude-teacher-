// Plans a chunked render: bundles once, reads the composition's length, splits it into N frame ranges.
// usage: node scripts/plan-chunks.mjs <compositionId> <chunks> <full|preview>
// Prints JSON {fps, frames, matrix:[{index,start,end}]} on the last stdout line.
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition } from "@remotion/renderer";

const [id, chunksArg = "20", mode = "full"] = process.argv.slice(2);
if (!id) throw new Error("usage: plan-chunks.mjs <compositionId> <chunks> <full|preview>");
const preview = mode === "preview";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const comp = await selectComposition({ serveUrl, id, inputProps: { preview }, chromiumOptions: { gl: "swangle" } });
const frames = preview ? Math.min(comp.durationInFrames, comp.fps * 10) : comp.durationInFrames;
const n = Math.max(1, Math.min(Number(chunksArg) || 20, frames, 256));
const matrix = [];
// Cost-balanced split (2026-11-15): equal frame counts left run 35's chunks between 23 and 59 min, and the run waits
// for the slowest. qa/costs/<id>.json holds measured seconds per frame range from an earlier full run; frames are
// split so each chunk gets an equal share of that cost. The file is only changed on purpose, so the split stays
// identical from run to run and splice_run / only_chunks keep working.
const costFile = path.resolve("..", "qa", "costs", `${id}.json`);
let cost = null;
if (!preview && fs.existsSync(costFile)) {
  const c = JSON.parse(fs.readFileSync(costFile, "utf8")).chunks ?? [];
  const per = new Float64Array(frames).fill(-1);
  for (const r of c) for (let f = r.start; f <= Math.min(r.end, frames - 1); f++) per[f] = r.seconds / (r.end - r.start + 1);
  const known = [...per].filter((v) => v >= 0);
  if (known.length > frames * 0.9) {
    const avg = known.reduce((a, b) => a + b, 0) / known.length;
    cost = per.map((v) => (v >= 0 ? v : avg));
  } else console.error(`plan-chunks: ${costFile} covers too few frames, splitting evenly`);
}
if (cost) {
  const total = cost.reduce((a, b) => a + b, 0);
  let start = 0, acc = 0;
  for (let i = 0; i < n; i++) {
    const target = (total * (i + 1)) / n;
    let end = start;
    if (i === n - 1) end = frames - 1;
    else {
      acc += cost[end];
      while (end + 1 < frames - (n - 1 - i) && acc + cost[end + 1] / 2 < target) { end++; acc += cost[end]; }
    }
    matrix.push({ index: String(i).padStart(3, "0"), start, end });
    start = end + 1;
  }
  console.error(`plan-chunks: cost-balanced from ${path.relative(path.resolve(".."), costFile)} (≈${Math.round(total / n / 60)} min per chunk)`);
} else for (let i = 0; i < n; i++) {
  const start = Math.floor((i * frames) / n), end = Math.floor(((i + 1) * frames) / n) - 1;
  matrix.push({ index: String(i).padStart(3, "0"), start, end });
}
console.log(JSON.stringify({ fps: comp.fps, frames, width: comp.width, height: comp.height, matrix }));
