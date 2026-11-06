#!/usr/bin/env python3
"""Writes REPORT.md for one render run: a self-contained summary meant to be pasted into another Claude chat.

usage: make-report.py <logs_dir> <out.md> [final.mp4] [qa_report.md]
Run context comes from env vars set by .github/workflows/render.yml (COMP, MODE, CHUNKS, SCALE, FRAMES, FPS, ...).
Standard library only; uses ffprobe/ffmpeg from PATH when a final video is given.
"""
import datetime as dt
import glob
import json
import os
import re
import subprocess
import sys

E = lambda k, d="": os.environ.get(k, d) or d
logs_dir, out_md = sys.argv[1], sys.argv[2]
final = sys.argv[3] if len(sys.argv) > 3 and os.path.exists(sys.argv[3]) else None
qa = sys.argv[4] if len(sys.argv) > 4 and os.path.exists(sys.argv[4]) else None

frames, fps = int(E("FRAMES", "0")), float(E("FPS", "30"))
now = dt.datetime.now(dt.timezone.utc)
started = E("STARTED_AT")
total_s = (now - dt.datetime.fromisoformat(started.replace("Z", "+00:00"))).total_seconds() if started else None
fmt = lambda s: "?" if s is None else f"{int(s // 60)} min {int(s % 60):02d} s"
ok = E("RENDER_RESULT") == "success" and final is not None

# ---- per-chunk results (chunk-XXX.json written by each render job) ----
chunks, problems = [], []
for p in sorted(glob.glob(os.path.join(logs_dir, "**", "chunk-*.json"), recursive=True)):
    try:
        chunks.append(json.load(open(p)))
    except Exception as e:  # noqa: BLE001
        problems.append(f"unreadable {os.path.basename(p)}: {e}")
expected = int(E("CHUNKS_PLANNED", "0"))
seen = {c["index"] for c in chunks}
for i in range(expected):
    idx = f"{i:03d}"
    if idx not in seen:
        k = glob.glob(os.path.join(logs_dir, "**", f"kenney-{idx}.txt"), recursive=True)
        tail = open(k[0]).read().strip().splitlines()[-5:] if k else []
        problems.append(f"chunk {idx}: no render result (job failed before rendering)" + ("\n      " + "\n      ".join(tail) if tail else ""))

warn_re = re.compile(r"(error|warn|exception|failed|timeout|webgl|context lost)", re.I)
noise_re = re.compile(r"(Rendered \d+/|Encoded \d+/|Stitched \d+/|Bundling \d+%)")
warnings = {}
for p in sorted(glob.glob(os.path.join(logs_dir, "**", "chunk-*.log"), recursive=True)):
    idx = re.search(r"chunk-(\d+)\.log", p).group(1)
    lines = open(p, errors="replace").read().replace("\r", "\n").splitlines()
    hits = [l.strip()[:220] for l in lines if warn_re.search(l) and not noise_re.search(l)]
    if hits:
        warnings[idx] = list(dict.fromkeys(hits))[:6]

render_secs = [c["seconds"] for c in chunks if c.get("exit") == 0]
spf = [c["seconds"] / max(1, c["end"] - c["start"] + 1) for c in chunks if c.get("exit") == 0]
failed = [c for c in chunks if c.get("exit") != 0]

# ---- final video facts ----
spec, loud, silences = None, None, None
if final:
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-show_entries",
        "stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_packets,sample_rate,channels:format=duration,size",
        "-of", "json", final], capture_output=True, text=True).stdout)
    v = next(s for s in pr["streams"] if s["codec_type"] == "video")
    a = [s for s in pr["streams"] if s["codec_type"] == "audio"]
    spec = dict(w=v["width"], h=v["height"], fps=v["r_frame_rate"], frames=int(v.get("nb_read_packets", 0)), codec=v["codec_name"],
                dur=float(pr["format"]["duration"]), mb=int(pr["format"]["size"]) / 1e6,
                audio=(f"{a[0]['codec_name']} {a[0]['sample_rate']} Hz {a[0]['channels']} ch" if a else "none"))
    if a:
        err = subprocess.run(["ffmpeg", "-nostats", "-i", final, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
        tail = err[err.rfind("Summary:"):]
        g = lambda k: (re.search(k + r":\s+(-?[\d.]+|-inf)", tail) or [None, "?"])[1]
        loud = dict(I=g("I"), LRA=g("LRA"), peak=g("Peak"))
        err = subprocess.run(["ffmpeg", "-nostats", "-i", final, "-map", "0:a:0", "-af", "silencedetect=n=-45dB:d=0.25", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
        silences = re.findall(r"silence_start: ([\d.]+).*?silence_duration: ([\d.]+)", err, re.S)

# ---- write ----
L = []
status = "SUCCESS" if ok else "FAILED"
L += [f"# Render report: {E('COMP')} ({E('MODE')}), run #{E('RUN_NUMBER')}: {status}", ""]
L += ["## Summary"]
if ok:
    L += [f"- **Download:** {E('DL_URL')}"]
L += [f"- **Total wall time** (run start → report): {fmt(total_s)}",
      f"- **Frames:** {frames} @ {fps:g} fps = {frames / fps:.2f} s of video · scale {E('SCALE')} · mode `{E('MODE')}`"
      + (" (first 10 s, shadow map 1024, MSAA off)" if E("MODE") == "preview" else ""),
      f"- **Chunks:** {len(chunks)}/{expected} reported, {len(failed)} failed · GPU: none (SwiftShader `--gl=swangle`)"]
if render_secs:
    L += [f"- **Render time per chunk:** min {min(render_secs)} s · median {sorted(render_secs)[len(render_secs) // 2]} s · max {max(render_secs)} s"
          f" (slowest chunk ≈ critical path)",
          f"- **Speed:** {sum(spf) / len(spf):.2f} s/frame per runner (median chunk), ~{sum(render_secs) / 60:.0f} runner-minutes of rendering in total",
          f"- **Runner:** {chunks[0].get('vcpu', '?')} vCPU each"]
L += [f"- **Commit:** `{E('SHA')[:7]}` · audio: {E('AUDIO_NOTE', 'n/a')} · run log: {E('RUN_URL')}", ""]

if spec:
    fr_ok = "✅" if spec["frames"] == frames else f"❌ expected {frames}"
    L += ["## Output file",
          f"- {spec['w']}x{spec['h']} {spec['codec']} @ {spec['fps']} · {spec['frames']} frames {fr_ok} · {spec['dur']:.3f} s · {spec['mb']:.1f} MB",
          f"- Audio: {spec['audio']}"]
    if loud:
        L += [f"- Loudness: integrated {loud['I']} LUFS (bible target −14), LRA {loud['LRA']} LU (bible 1.8-3.5), true peak {loud['peak']} dBFS"]
    if silences is not None:
        L += [f"- Silences > 0.25 s at −45 dB: {len(silences)}" + (" (bible target: none)" if silences else " ✅")
              + ("".join(f"\n  - {float(s):.2f} s for {float(d):.2f} s" for s, d in silences[:8]))]
    L += [""]

L += ["## Chunks", "| chunk | frames | seconds | s/frame | exit |", "|---|---|---|---|---|"]
for c in sorted(chunks, key=lambda c: c["index"]):
    n = c["end"] - c["start"] + 1
    L += [f"| {c['index']} | {c['start']}-{c['end']} | {c['seconds']} | {c['seconds'] / n:.2f} | {c.get('exit')} |"]
L += [""]

L += ["## Errors and warnings"]
if not (problems or failed or warnings):
    L += ["- None ✅"]
for p in problems:
    L += [f"- {p}"]
for c in failed:
    L += [f"- chunk {c['index']}: render exited with code {c.get('exit')}"]
for idx, hits in warnings.items():
    L += [f"- chunk {idx}:"] + [f"  - `{h}`" for h in hits]
L += [""]

if qa:
    L += ["## Frame QA (skill's short_qa.py: black / white / frozen / pop frames, per-shot colour)", "```", open(qa).read().strip(), "```",
          "Contact sheets (2 s each, frame numbers burned in) are attached to the release as `qa-sheets.zip`.", ""]

L += ["## Setup (for context)",
      "- Remotion 4.0.290 + three 0.175 + @react-three/fiber 9.1.2 + postprocessing 6.37.2, Remotion's own Chrome Headless Shell, `--gl=swangle`.",
      "- GitHub Actions: plan → N parallel `--frames=start-end` chunk renders (`--muted`, h264 crf 16) → ffmpeg concat `-c copy` → audio mux → Release.",
      f"- Kenney CC0 kits (fantasy town, nature, castle) in `video/public/bridge/kenney/`: {E('KENNEY_NOTE', 'see chunk logs')}."]
open(out_md, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("\n".join(L))
