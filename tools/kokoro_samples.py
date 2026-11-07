import sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
lines = [
    "In 1835, a newspaper told New York that bat-people live on the Moon... and New York believed it.",
    "The paper is called The Sun. It's two years old, it costs one penny, and it needs readers.",
    "So a reporter named Richard Locke writes a story.",
]
voices = ["am_michael", "am_fenrir", "bm_george", "bm_lewis", "am_onyx", "bm_daniel"]
for v in voices:
    parts = []
    sr = 24000
    for ln in lines:
        audio, sr = k.create(ln, voice=v, speed=1.12, lang="en-us" if v.startswith("a") else "en-gb")
        parts += [audio, np.zeros(int(0.3 * sr), dtype=audio.dtype)]
    out = np.concatenate(parts)
    sf.write(f"out/{v}.wav", out, sr)
    words = sum(len(l.split()) for l in lines)
    print(v, f"{len(out)/sr:.1f}s", f"{words/(len(out)/sr):.2f} words/s")
