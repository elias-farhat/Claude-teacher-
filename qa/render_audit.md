# Render audit: `video/` against the Remotion and three.js skills

Audit only. No code was changed. Date: 2026-11-10.

## Verdict

Three changes have a measured cost behind them and together account for about 70 % of a frame's render time:
anti-aliasing plus the shadow map, the lens blur, and the ink outline pass. Two more are structural and not yet
measured. Nothing in `video/` breaks the Remotion skill's 3D rules.

## What was checked

Skills installed with `npx skills add` (three were added, because the second repository ships two):

| Skill | Source | Used for |
|---|---|---|
| `remotion-best-practices` | remotion-dev/skills | `remotion-markup/3d.md`, `remotion-render/REFERENCE.md` |
| `three-best-practices` | emalorenzo/three-agent-skills | draw calls, lighting and shadows, post-processing, pooling |
| `r3f-best-practices` | emalorenzo/three-agent-skills | re-render and `useFrame` rules |

Each `SKILL.md` was read before use, plus the rule files named above.

## How the costs were measured

Rats, frames 600-605 (outdoor boulevard), rendered locally at the CI settings (`--gl=swangle`, `--scale 0.666667`,
`dpr 0.666667`, full quality, concurrency 1). One effect was switched off per run through the existing `post` and
`preview` input props, so no code changed. Start-up (bundle and world build, about 17 s) is subtracted.

| Run | Seconds per frame | Saving vs base |
|---|---|---|
| Base (full quality) | 10.6 | |
| Preview quality: MSAA 0, shadow map 1024, lens "pre" pass off | 6.9 | 3.7 (35 %) |
| Lens blur off | 8.0 | 2.6 (25 %) |
| Ink pass off | 9.0 | 1.6 (15 %) |
| Lens "pre" pass off | 10.5 | 0.1 |
| Bloom off | 11.7 | none (inside noise) |
| Lens, ink, bloom and grade all off | 7.5 | 3.1 |

Limits of these numbers:

- Each variant was run once. The bloom run came out 1.1 s per frame slower than base, so noise is about
  ±1 s per frame. The ink figure is close to that; the first two rows are clearly above it.
- One location only. Frames 1860-1865 (the quay) cost about 14 s per frame at base.
- MSAA and shadow-map size share one switch (`quality()`), so their split is not measured.
- GitHub runners are slower: run 25 took about 27 s per frame at the median, including job set-up.

Static counts for the Rats world (kit models not loaded): 701 meshes, 250 materials, about 131,000 triangles,
155 shadow-casting meshes, no instanced meshes, 2 lights.

## Top 5 changes

### 1. Drop MSAA 4 and shrink the 4096 shadow map (measured: up to 35 %)

- **Now:** `EffectComposer multisampling={4}` and `sun.shadow.mapSize = 4096` in full quality
  (`src/quality.ts`, `rats/Rats.tsx`, `rats/world.ts`; the same in Moon and Bridge).
- **Skill rules:** "Disable multisampling when not needed" and "Add antialiasing at the end" (SMAA as the final
  pass); shadow map size 1024-2048 for desktop, 4096 only when quality-critical.
- **Change:** MSAA 0 with an SMAA effect last in the chain, and a 2048 shadow map. The shadow frustum is already
  fitted and frozen per shot, so 2048 loses less than it would on a loose frustum.
- **Risk:** ink lines and card edges are the visible test for SMAA; shadow edges soften slightly. The output is
  720p upscaled to 1080, which hides part of both.
- **First step:** split the 35 % by measuring MSAA and shadow size separately.

### 2. Make the lens blur cheaper (measured: 25 %)

- **Now:** `bridge/lensblur.ts` main pass gathers 64 disc taps plus 32 near-field taps for every pixel at full
  buffer resolution, every frame. The 16-tap "pre" pass costs almost nothing.
- **Skill rule:** post-processing resolution scaling (half resolution).
- **Change, in order of safety:**
  1. Skip the lens passes on frames where the blur radius is below the shader's own 0.25 px cut-off.
  2. Scale the tap counts with output height (32 + 16 at 720p).
  3. Run the gather at half resolution and composite at full.
- **Risk:** options 2 and 3 can show banding in strong background blur; the SHARP check guards the subject, not
  the background.

### 3. Stop rendering the world a second time for the ink outlines (measured: about 15 %)

- **Now:** `bridge/ink.ts` re-renders the whole world with a normal override material into its own target, then
  runs an edge mask and a composite. With the shadow pass, the static world is drawn three times per frame.
- **Skill rules:** merge compatible passes; fewer draw calls per frame.
- **Change:** write normals in the main pass through a second colour attachment (one geometry pass instead of two),
  or render the ink normals at a lower resolution and keep the edge mask at full resolution.
- **Risk:** the multi-target route touches every material's shader; the low-resolution route can thin distant
  lines. The saving is close to the measurement noise, so re-measure before committing to the larger change.

### 4. Merge the static world into far fewer draw calls (not measured)

- **Now:** 701 meshes and 250 materials, none instanced. Each is drawn in the main pass and the ink pass, and 155
  of them again in the shadow pass.
- **Skill rules:** target under 100 draw calls; merge static geometry; reuse materials; `InstancedMesh` for
  identical objects (lamps, windows, trees).
- **Change:** extend the existing `Batch` / `TiledBatch` merging in `bridge/build.ts` to the town, sewer and rooms,
  and share materials by colour. Tiles keep frustum culling working.
- **Expected:** unknown until measured. Under a software renderer pixel work usually dominates, so this is likely
  smaller than items 1-3, but it reduces all three geometry passes at once.

### 5. Cut per-chunk overhead in the workflow (not measured)

- **Now:** each of the 20 render jobs installs dependencies, bundles, builds the world and compiles shaders before
  its first frame. Locally that is about 17 s; on the runners it is unknown but is paid 20 times, plus 20 more for
  the proxy.
- **Measured locally:** concurrency 1 and 2 take the same time for 12 frames (153 s and 154 s); concurrency 4 is
  12 % slower (172 s). Raising concurrency will not help, because the software renderer already uses every core.
- **Change:** read the set-up time from one chunk's job log first. If it is a large share, bundle once in the plan
  job and pass the bundle as an artifact, and cache `node_modules` and the browser.
- **Not from the skills:** the Remotion skill has no rule on this; it comes from the run timings.

## Already compliant

- `<ThreeCanvas>` has explicit `width` and `height`; every animation is driven by `useCurrentFrame()`; there is
  no `useFrame` anywhere in `video/src`.
- Renderer is created with `antialias: false`, `stencil: false`, `powerPreference: "high-performance"`.
- Tone mapping is the last effect before the grade.
- Two lights only (hemisphere and one shadow-casting directional); practical lamps are shader uniforms, not lights.
- Card textures are cached by key; actors and effect cards are pooled, not recreated per frame.
- The far backdrop is tiled, frustum-culled and casts no shadows.
- Bloom costs nothing measurable, so it is not worth touching.
