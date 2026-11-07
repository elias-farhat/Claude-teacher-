"""Find every throwaway 'Okay' in CapCut voice blocks (scripts/<name>/capcut/*.wav) with faster-whisper
word timestamps; write scripts/<name>/capcut/okays.json (word list + okay spans per block)."""
import sys, glob, json, re
from faster_whisper import WhisperModel
name = sys.argv[1]
m = WhisperModel("small.en", device="cpu", compute_type="int8")
out = {}
for f in sorted(glob.glob(f"scripts/{name}/capcut/block*.wav")):
    segs, _ = m.transcribe(f, word_timestamps=True, beam_size=5, vad_filter=False)
    words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
    ok = [w for w in words if re.fullmatch(r"(okay|ok|o\.?k\.?)[.,!?]*", w["w"].lower())]
    out[f.split("/")[-1]] = {"words": words, "okays": ok}
    print(f, len(words), "words,", len(ok), "okays:", " ".join(w["w"] for w in words))
json.dump(out, open(f"scripts/{name}/capcut/okays.json", "w"), indent=1)
