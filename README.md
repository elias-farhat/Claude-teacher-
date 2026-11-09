# Painted storybook: long-form "What If" (landscape)

Channel: 4-minute landscape "What If" stories, Google AI Studio voice.
Style: painted storybook. Golden or moody light and colour carry the emotion; characters are medium-sized with simple faces.
Signature motif: memories and ideas as glowing pages that swirl around the hero.

## Status
- `engine/paint.js`: test scene "Grandma Rose's balcony" (10 s). Approved as the look. See `samples/10_memory_balcony_painted.mp4`.
- `scripts/memory/SCRIPT.txt`: first video, "What If Your Memory Held a Million Books?" (604 words, ~4 min, fact ledger included).

## How it works
- Layers (sky, city, set) and characters (body, head, arm parts) are **painted once at load** from brush dabs sampled from flat drawings (`painted()`), clipped to the silhouette, with a shadow side, a golden rim light and a soft inner outline.
- Each frame only moves the layers (parallax camera: eased flights of 25–30 frames, slow drift), sways props, and draws particles (notes turning into glowing pages, dust motes, water), light rays, canvas texture and subtitles.
- Speed: **~115 ms/frame on CPU**, so a 4-minute video is about 14 minutes of rendering.

## Render
Needs Node 18+, Google Chrome, ffmpeg, and `npm i playwright-core`.
`CHROME=/path/to/chrome node engine/render.mjs engine out.mp4 30`
(`story.json` sets the size and duration; the page must expose `window.render(t)`, `window.DUR` and `window.READY`.)

## Next steps
1. Refactor the scene into data: `scenes.json` (backdrop, cast, poses, camera keys, captions, start/end times) plus reusable `sets/` (balcony, lecture hall, bedroom at night, lab, stage, hospital, city street) and `cast/` (Maya, Ben, Grandma Rose, Doctor Hale).
2. Add poses built once: walk cycle (4 frames), run, sit, hold hand, phone to ear, cry.
3. Get the voice from Google AI Studio, then take word timestamps (faster-whisper) so scene cuts land on sentence boundaries.
4. Fact beats become painted paper notes in the same palette (80,000,000,000 words; 600 years; 20% energy; 1885).
5. QA as in CLAUDE.md of the main repo: stills every 0.5 s, faces in the upper 55 %, no empty frames, and a 10 s preview before the full render.

## Credits / licences
- Fonts: Fredoka (SIL OFL, see engine/fonts/OFL.md).
- No third-party art. The style rules were inspired by public descriptions only; all code and drawings are original.
