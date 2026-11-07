# Status — 2026-11-07 09:45 (Baghdad)

| Video | Script | Voice | Render | Next step |
|---|---|---|---|---|
| 1. Eiffel | ✅ | ✅ Goofball (CapCut) | ✅ run 15 approved | **Post it** (title: "The Man Who Sold the Eiffel Tower") |
| 2. Rat Bounty | ✅ | ⚠️ voice.wav = Goofball with old cut-offs | ⏳ stills + 10 s preview (started 08:43) | Review preview; optionally redo voice with the Okay method |
| 3. Moon Hoax | ✅ | ✅ Goofball, Okays removed (64.8 s) | not started | Re-align words.json, then build after Rats |

## Voice recipe (CapCut Goofball, no cut-offs)
1. Script split into blocks; every sentence followed by "Okay."; no "..." (use commas).
2. Export each block as audio → scripts/<name>/capcut/blockN.wav
3. Actions → "Find okays" (pattern block*.wav) → `python tools/strip_okays.py <name> 0.30`
4. Verify: "Find okays" with pattern clean_block*.wav must show 0 okays.
5. atempo 1.2, join blocks with 0.3 s, light room tail, -14 LUFS → voice.wav

## Open ideas
- Long video #1: Victor Lustig full story (animated-stills style, 5–6 min).
- Simulation channel: 13-idea doc (Claude Docs "Satisfying Simulation Shorts: 13 Low-Effort Ideas"); crusher prototype done.
- Duplicate voice workflows: keep voice.yml (Claude Code's) or kokoro-voice.yml — pick one.
