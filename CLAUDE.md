# CLAUDE.md

## Lessons learned (apply to every future video)

1. **Camera:** no hard cuts except on punchlines. Flights are 20–30 frames, eased (ease-in-out), never faster than the reference — no whip-fast moves. Land on the subject BEFORE the narrated word. Slow drift during holds; a new move every ~1.2 s.
2. **Subject always on screen:** every frame shows the character or key prop the narration is about. No empty walls, ceilings, skylines or streets — not even during flights.
3. **Framing:** no extreme close-ups. Faces in the upper 55 % of the frame so captions at 70 % never cover them. Show full characters and the room.
4. **Dress every interior/location:** windows, lamps, props, rugs, warm practical lights. Never bare walls.
5. **Foreground:** foreground objects must never cover the key prop or text (e.g. a lamp over the certificate).
6. **QA before any full render:** QA still every 0.5 s flagging empty frames, faces below 55 %, close-ups; fix all flags first; then send 8 stills + a 10 s preview for approval.
7. **Voice is final:** never change voice timing (voice.wav is final). Re-render only the chunks that changed.
8. **Shared repo:** two sessions share this repo — Shorts on the current branch (`ccr-86a7053e-6lwds5`), long videos on `longform`. Never push to the other session's branch. Never run two renders at the same time (20-runner limit).
9. **Flight speed:** camera flights max ~6 m/frame; prefer 25–30 frame glides over shorter, faster ones.
10. **Named character doing an action is on screen doing it:** when the narration names a character performing an action, that character must be in frame doing it (e.g. André paying, not just the money bag).
11. **Night scenes:** the main character must be lit (practical/key light on them) and framed at least at medium-shot size.
12. **One continuous world:** every shot has foreground/mid/background depth and haze; no visible set edges, bare ground planes or empty skies; interiors show the outside through windows.
13. **Camera guard:** No render starts unless the camera guard passes on every frame. (`node video/scripts/camera-guard.mjs <eiffel|rats|moon>`: math only, before any pixels. It checks the declared subjects for safe margin and size, occlusion, clipping, empty frames and faces below 55 %, and render.yml stops the render if any frame fails. Each video declares its subjects in `src/videos/<video>/subjects.ts`.)
