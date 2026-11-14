"""edge-tts: one mp3 per line -> <dir>/edge/line_XXX.mp3 (runs in GitHub Actions)."""
import asyncio, os, sys, json
import edge_tts
D = sys.argv[1]; cfg = json.load(open(f'{D}/edge.json'))
lines = [l.strip() for l in open(f'{D}/lines.txt', encoding='utf-8') if l.strip()]
os.makedirs(f'{D}/edge', exist_ok=True)
async def main():
    for i, s in enumerate(lines):
        fn = f'{D}/edge/line_{i:03d}.mp3'
        if os.path.exists(fn): continue
        for attempt in range(4):
            try:
                await edge_tts.Communicate(s, cfg['voice'], rate=cfg.get('rate', '+0%'), pitch=cfg.get('pitch', '+0Hz')).save(fn); break
            except Exception as e:
                print('retry', i, e); await asyncio.sleep(5)
asyncio.run(main())
