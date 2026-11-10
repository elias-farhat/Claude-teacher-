# Render report: RatShort (full), run #24: SUCCESS

## Summary
- **Download:** https://github.com/elias-farhat/Claude-teacher-/releases/download/render-RatShort-full-24/RatShort-full-run24.mp4
- **Total wall time** (run start → report): 161 min 36 s
- **Frames:** 2124 @ 30 fps = 70.80 s of video · scale 0.666667 · mode `full`
- **Chunks:** 20/20 reported, 0 failed · GPU: none (SwiftShader `--gl=swangle`)
- **Render time per chunk:** min 3578 s · median 6045 s · max 6996 s (slowest chunk ≈ critical path)
- **Speed:** 53.75 s/frame per runner (median chunk), ~1902 runner-minutes of rendering in total
- **Runner:** 4 vCPU each
- **Steady render speed** (after startup + bundling): median 56.86 s/frame per runner (min 33.29, max 65.65); startup + bundling median 94 s per chunk
- **Resolution:** rendered at 1080x1920
- **Kenney models loaded in the browser:** all 7/7 in 40 render tabs ✅
- **Commit:** `b6de24a` · audio: ../scripts/rats/mix.flac · run log: https://github.com/elias-farhat/Claude-teacher-/actions/runs/42628063990

## Output file
- 720x1280 h264 @ 30/1 · 2124 frames ✅ · 70.800 s · 59.1 MB
- Audio: aac 48000 Hz 2 ch
- Loudness: integrated -14.0 LUFS (bible target −14), LRA 2.0 LU (bible 1.8-3.5), true peak -2.9 dBFS
- Silences > 0.25 s at −45 dB: 0 ✅

## Chunks
| chunk | frames | seconds | s/frame (all-in) | steady s/frame | exit |
|---|---|---|---|---|---|
| 000 | 0-105 | 6929 | 65.37 | 64.8 | 0 |
| 001 | 106-211 | 6964 | 65.70 | 65.37 | 0 |
| 002 | 212-317 | 6448 | 60.83 | 60.42 | 0 |
| 003 | 318-423 | 5674 | 53.53 | 52.91 | 0 |
| 004 | 424-530 | 6376 | 59.59 | 59.0 | 0 |
| 005 | 531-636 | 6669 | 62.92 | 62.42 | 0 |
| 006 | 637-742 | 5809 | 54.80 | 54.52 | 0 |
| 007 | 743-848 | 4950 | 46.70 | 46.37 | 0 |
| 008 | 849-954 | 6045 | 57.03 | 56.86 | 0 |
| 009 | 955-1061 | 4825 | 45.09 | 44.87 | 0 |
| 010 | 1062-1167 | 6539 | 61.69 | 61.45 | 0 |
| 011 | 1168-1273 | 3592 | 33.89 | 33.69 | 0 |
| 012 | 1274-1379 | 6996 | 66.00 | 65.65 | 0 |
| 013 | 1380-1485 | 6745 | 63.63 | 63.26 | 0 |
| 014 | 1486-1592 | 3578 | 33.44 | 33.29 | 0 |
| 015 | 1593-1698 | 5059 | 47.73 | 47.29 | 0 |
| 016 | 1699-1804 | 3926 | 37.04 | 36.91 | 0 |
| 017 | 1805-1910 | 5208 | 49.13 | 48.65 | 0 |
| 018 | 1911-2016 | 5620 | 53.02 | 52.8 | 0 |
| 019 | 2017-2123 | 6196 | 57.91 | 57.64 | 0 |

## Errors and warnings
- None ✅

## Frame QA (skill's short_qa.py: black / white / frozen / pop frames, per-shot colour)
```
SPECS 720x1280 30/1 fps, 2124 frames, 70.800 s; audio: aac 48000 Hz 2ch
LOUDNESS I:         -14.0 LUFS | LRA:         2.0 LU | Peak:       -2.9 dBFS
SILENCES none
FRAMES 2124; black []; unplanned white []; frozen spans >=12f []
POPS (unplanned frame-diff spikes > 3x local median): [176, 257, 306, 314, 315, 355, 360, 370, 642, 671, 716, 764, 810, 811, 812, 813, 814, 879, 1104, 1145, 1167, 1214, 1215, 1246, 1366, 1430, 1494, 1548, 1597, 1722, 1860, 1867, 1892, 1899]
MOTION mean diff 12.48; frames with diff<0.3 (held): 66 (3%)

PER SHOT  (luma mean / std / p2 / p98 / saturation mean, medians over the shot)
  shot  0 f0-2123: 0.479 / 0.193 / 0.053 / 0.843 / 0.501
```
Contact sheets (2 s each, frame numbers burned in) are attached to the release as `qa-sheets.zip`.

## Setup (for context)
- Remotion 4.0.290 + three 0.175 + @react-three/fiber 9.1.2 + postprocessing 6.37.2, Remotion's own Chrome Headless Shell, `--gl=swangle`.
- GitHub Actions: plan → N parallel `--frames=start-end` chunk renders (`--muted`, h264 crf 16) → ffmpeg concat `-c copy` → audio mux → Release.
- Kenney CC0 kits (fantasy town, nature, castle) in `video/public/bridge/kenney/`: kenney: cached, 569 models;.

# QA stills

- 142 stills (one every 15 frames), each probed in the page: characters / key props that are in frame and not hidden by geometry, face positions and sizes
- **Flagged (not in a flight): 10**
  - 19.5 s (f585): XCU
  - 20.0 s (f600): XCU
  - 21.5 s (f645): LOW
  - 24.5 s (f735): LOW
  - 32.0 s (f960): LOW
  - 32.5 s (f975): LOW
  - 33.0 s (f990): LOW
  - 38.0 s (f1140): LOW, XCU
  - 41.0 s (f1230): NOTHING
  - 67.5 s (f2025): XCU
- Flight frames showing only the city (travel between places, expected): 0

## Every frame, analytic (camera + cast replayed, no rendering)
- Camera cuts (one-frame discontinuities): **7** · 303 (10.1 s), 406 (13.5 s), 1145 (38.2 s), 1337 (44.6 s), 1345 (44.8 s), 1860 (62.0 s), 1867 (62.2 s)
- Faces below 55 %: 644-646 (21.5 s), 735-739 (24.5 s), 956-1003 (31.9 s), 1140 (38.0 s), 1167-1169 (38.9 s)
- Extreme close-ups: 288 (9.6 s), 446-448 (14.9 s), 585-600 (19.5 s), 616 (20.5 s), 649 (21.6 s), 653 (21.8 s), 733 (24.4 s), 1138-1140 (37.9 s), 1145-1147 (38.2 s), 1164-1169 (38.8 s), 1176 (39.2 s), 1342 (44.7 s), 1400-1403 (46.7 s), 2023-2038 (67.4 s)
- Nothing in frame (incl. flights): 1011 (33.7 s), 1218-1221 (40.6 s), 1225-1231 (40.8 s), 1281 (42.7 s), 1556 (51.9 s)
- Largest camera step: 5.86 m/frame
