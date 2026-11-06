// Renders a list of stills with one bundle and collects the composition's "[qa] {...}" probe lines.
// usage: node scripts/render-stills.mjs <compositionId> <frame,frame,...> <outDir> [scale=0.5] [propsJSON]
// writes <outDir>/still-<frame>.jpg and <outDir>/qa-<frame>.json (Remotion's own Chrome, software GL)
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [id, framesArg, outDir, scaleArg = "0.5", propsArg = "{}"] = process.argv.slice(2);
const scale = Number(scaleArg);
const inputProps = { qa: true, dpr: scale < 1 ? scale : undefined, ...JSON.parse(propsArg) };
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const chromiumOptions = { gl: "swangle" };
const composition = await selectComposition({ serveUrl, id, inputProps, chromiumOptions });
for (const f of framesArg.split(",").filter(Boolean).map(Number)) {
  const t0 = Date.now(), tag = String(f).padStart(5, "0");
  let qa = null;
  await renderStill({
    composition, serveUrl, frame: f, output: path.join(outDir, `still-${tag}.jpg`), imageFormat: "jpeg", jpegQuality: 85, scale,
    inputProps, chromiumOptions, timeoutInMilliseconds: 400000,
    onBrowserLog: (l) => { const i = l.text.indexOf("[qa] "); if (i >= 0) qa = JSON.parse(l.text.slice(i + 5)); },
  });
  fs.writeFileSync(path.join(outDir, `qa-${tag}.json`), JSON.stringify({ ...(qa ?? { f, missing: true }), seconds: (Date.now() - t0) / 1000 }));
  console.log(`still ${f}: ${((Date.now() - t0) / 1000).toFixed(1)} s, visible: ${qa ? qa.vis.join(", ") || "NOTHING" : "no probe line"}`);
}
