# video/: Remotion + three.js project (rendered on GitHub Actions)

Compositions are registered in `src/Root.tsx`. `Test3D` is a 5 s smoke test of the stack.
Rendering is done in the cloud by `.github/workflows/render.yml`, because CPU rendering is too slow in the session container.

## Render
GitHub → **Actions → Render video → Run workflow**, then fill in:
- **composition**: the composition id, e.g. `Test3D`.
- **chunks**: how many parallel runners (default 20). Each one renders `--frames=start-end`.
- **mode**:
  - `full`: final quality.
  - `preview`: first 10 s only, shadow map 1024, MSAA off. Scenes read this through `quality()` in `src/quality.ts`.
- **audio**: path to a WAV, relative to `video/`. It is muxed in, or a silent track is used if the file is missing.
- **scale**: `1` for 1080x1920, `1.3333` for 2K.

The finished MP4 is attached to a GitHub Release (`render-<comp>-<mode>-<run>`). The link is also in the run summary.

## Notes
- Software GL (`--gl=swangle`) with Remotion's own Chrome Headless Shell, cached together with `node_modules`.
- Kenney CC0 kits (fantasy town, nature, castle) are downloaded by `scripts/fetch-kenney.sh` into
  `public/bridge/kenney/`. They are cached on the runners and never committed.
- Chunks are rendered with `--muted` and joined with ffmpeg's concat demuxer (`-c copy`, no re-encode).
