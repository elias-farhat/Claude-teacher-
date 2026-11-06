// Plans a chunked render: bundles once, reads the composition's length, splits it into N frame ranges.
// usage: node scripts/plan-chunks.mjs <compositionId> <chunks> <full|preview>
// Prints JSON {fps, frames, matrix:[{index,start,end}]} on the last stdout line.
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
for (let i = 0; i < n; i++) {
  const start = Math.floor((i * frames) / n), end = Math.floor(((i + 1) * frames) / n) - 1;
  matrix.push({ index: String(i).padStart(3, "0"), start, end });
}
console.log(JSON.stringify({ fps: comp.fps, frames, width: comp.width, height: comp.height, matrix }));
