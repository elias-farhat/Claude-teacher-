# Word alignment report

- Voice: `scripts/chicken/voice.wav` (46.19 s) · script: `scripts/chicken/SCRIPT.md` (10 lines, 108 words)
- Method: torchaudio MMS_FA forced alignment of the script text; check transcript by faster-whisper medium.en
- First word 'This' at 0.5 s · last word 'us' ends at 45.71 s
- Heard 102 words; aligned vs Whisper start time: median 0.065 s, 90th pct 0.325 s

## Script vs heard
- 5 difference(s) between the script and the transcript:
  - line 1: script `eighteen` · heard `∅` (delete)
  - line 2: script `nineteen forty five` · heard `∅` (delete)
  - line 2: script `olsen` · heard `olson` (replace)
  - line 8: script `twenty five` · heard `∅` (delete)
  - line 8: script `ten thousand dollars` · heard `∅` (delete)

## Pauses longer than 0.4 s between words
- 3.92 → 4.72 s (0.80 s)
- 9.40 → 10.22 s (0.82 s)
- 11.24 → 11.84 s (0.60 s)
- 12.50 → 13.10 s (0.60 s)
- 13.90 → 14.60 s (0.70 s)
- 15.28 → 15.92 s (0.64 s)
- 17.62 → 18.20 s (0.58 s)
- 18.94 → 20.04 s (1.10 s)
- 22.25 → 22.66 s (0.42 s)
- 23.91 → 25.43 s (1.52 s)
- 26.47 → 27.11 s (0.64 s)
- 29.17 → 30.05 s (0.88 s)
- 31.09 → 31.69 s (0.60 s)
- 33.41 → 33.97 s (0.56 s)
- 37.55 → 38.35 s (0.80 s)
- 39.89 → 40.93 s (1.04 s)
- 42.07 → 42.81 s (0.74 s)
- 43.71 → 44.27 s (0.56 s)

## Lines
| line | start | end | words |
|---|---|---|---|
| 1 | 0.50 | 3.92 | This chicken lived eighteen months without a head |
| 2 | 4.72 | 9.40 | Colorado 1945 Farmer Lloyd Olsen wanted chicken for dinner |
| 3 | 10.22 | 13.90 | One swing of the axe and the chicken just kept walking |
| 4 | 14.60 | 18.94 | The next morning Still alive Still pecking Still no head |
| 5 | 20.04 | 23.91 | The axe had missed the brain stem the part that keeps you breathing |
| 6 | 25.43 | 29.17 | So Lloyd named him Mike and fed him with an eyedropper right down the neck |
| 7 | 30.05 | 33.41 | Soon Mike was a star Magazines A national tour |
| 8 | 33.97 | 37.55 | Twenty-five cents a look Insured for ten thousand dollars |
| 9 | 38.35 | 39.89 | The chicken was worth more than the farm |
| 10 | 40.93 | 45.71 | Mike the Headless Chicken He had no brain and still did better than most of us |
