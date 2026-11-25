// Shot spec of "This Chicken Lived 18 Months Without a Head" for the auto-framer (guard/solve.ts): one line per shot,
// landing on its word (land = word - 2 frames; voice.wav is final). Every shot's required subject is the character doing
// the narrated thing (CLAUDE.md 10); Mike is the "w:mike" prop. No tiny wide shots: "wide" only where a group is needed.
import { land, wtn } from "./story";
import type { ShotSpec } from "../../guard/solve";

export const SHOT_SPECS: ShotSpec[] = [
  { t0: 0, subjects: ["w:mike"], size: "wide", move: "drift", note: "1 (hook) this chicken lived eighteen months: headless Mike struts, frame 1" },
  { t0: land(1, "without"), subjects: ["w:mike"], size: "medium", angle: "low", move: "push", enter: "cut", note: "1 without a head (the bandaged stump)" },
  { t0: land(2), subjects: ["c:lloyd", "w:mike", "?w:house"], size: "wide", move: "push", enter: "cut", note: "2 Colorado, 1945: the farm at golden hour" },
  { t0: land(2, "Farmer"), subjects: ["c:lloyd"], size: "medium", move: "push", enter: "cut", note: "2 Farmer Lloyd Olsen" },
  { t0: land(2, "wanted"), subjects: ["c:lloyd", "w:mike"], size: "medium", move: "drift", enter: "cut", note: "2 wanted chicken for dinner (licks his lips at Mike)" },
  { t0: land(3), subjects: ["c:lloyd"], size: "medium", angle: "low", move: "push", enter: "cut", note: "3 one swing of the axe (Lloyd only; cut before it lands)" },
  { t0: land(3, "and"), subjects: ["w:mike", "?c:lloyd"], size: "wide", move: "drift", enter: "cut", note: "3 and the chicken just kept walking (headless, wings out)" },
  { t0: land(3, "kept"), subjects: ["c:lloyd", "?w:mike"], size: "medium", move: "push", enter: "cut", note: "3 kept walking: Lloyd's jaw drops" },
  { t0: land(4), subjects: ["c:lloyd"], size: "medium", move: "push", enter: "cut", note: "4 the next morning? Lloyd on the porch" },
  { t0: land(4, "Still"), subjects: ["w:mike", "?c:lloyd"], size: "wide", move: "push", enter: "cut", note: "4 still alive, still pecking, still no head" },
  { t0: land(5), subjects: ["w:diagram", "c:clara"], size: "medium", move: "push", enter: "cut", note: "5 the axe had missed the brain stem: the neck diagram" },
  { t0: wtn(5, "the", 2) - 2 / 30, subjects: ["w:diagram", "c:clara"], size: "medium", move: "push", enter: "cut", note: "5 the part that keeps you breathing (the glow)" },
  { t0: land(6), subjects: ["c:lloyd", "w:mike", "?c:clara"], size: "medium", move: "push", enter: "cut", note: "6 so Lloyd named him Mike" },
  { t0: land(6, "fed"), subjects: ["c:lloyd", "w:mike"], size: "medium", move: "push", enter: "cut", note: "6 fed him with an eyedropper, right down the neck" },
  { t0: land(7), subjects: ["w:mike", "?w:truck"], size: "wide", move: "push", enter: "cut", note: "7 soon Mike was a star (on the truck)" },
  { t0: land(7, "Magazines"), subjects: ["c:fan0", "c:fan1"], size: "medium", move: "push", enter: "cut", note: "7 magazines (fans wave them)" },
  { t0: wtn(7, "A", 1) - 2 / 30, subjects: ["w:mike", "?w:truck"], size: "wide", move: "drift", enter: "cut", note: "7 a national tour (the truck drives off)" },
  { t0: land(8), subjects: ["c:folk0", "c:hope"], size: "medium", move: "push", enter: "cut", note: "8 twenty-five cents a look: the queue paying" },
  { t0: land(8, "Insured"), subjects: ["c:hope"], size: "medium", move: "push", enter: "cut", note: "8 insured for ten thousand dollars (the contract)" },
  { t0: land(9), subjects: ["c:lloyd", "?w:money", "?c:clara"], size: "medium", move: "push", enter: "cut", note: "9 the chicken was worth more" },
  { t0: land(9, "than"), subjects: ["c:lloyd", "?c:clara", "?w:mike"], size: "medium", angle: "low", move: "push", enter: "cut", note: "9 than the farm (the farmhouse behind)" },
  { t0: land(10), subjects: ["w:mike", "?c:lloyd", "?c:clara"], size: "wide", angle: "low", move: "push", enter: "cut", note: "10 Mike the Headless Chicken, in the spotlight" },
  { t0: land(10, "He"), subjects: ["w:mike"], size: "medium", move: "push", enter: "cut", note: "10 he had no brain" },
  { t0: land(10, "and"), subjects: ["w:mike", "c:crowd0", "?c:crowd1"], size: "medium", move: "orbit", enter: "cut", note: "10 and still did better than most of us (crowd cheers)" },
];
