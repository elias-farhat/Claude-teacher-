# Claude-teacher-

- `.claude/skills/claude-animated-shorts/`: Claude skill for vertical 3D cartoon shorts (three.js + Remotion).
  Its `references/` folder (another creator's frames) is intentionally not in this repo.
- `video/`: the Remotion project. See [video/README.md](video/README.md).
- `.github/workflows/render.yml`: renders a composition in parallel chunks on GitHub Actions and publishes
  the MP4 as a GitHub Release asset (Actions → Render video → Run workflow).
