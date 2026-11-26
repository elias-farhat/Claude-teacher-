// Shot spec of "His College Banned Dogs, So He Brought a Bear" for the auto-framer (guard/solve.ts): one line per shot,
// landing on its word (land = word - 2 frames; voice / mix final). Every shot's required subject is the character doing
// the narrated thing (CLAUDE.md 10). No tiny wide shots; groups kept narrow for the portrait frame.
import { land, wtn } from "./story";
import type { ShotSpec } from "../../guard/solve";

export const SHOT_SPECS: ShotSpec[] = [
  { t0: 0, subjects: ["c:byron", "w:bear"], size: "medium", move: "drift", note: "1 (hook) his college banned dogs: Byron strolls through the gate with the bear, frame 1" },
  { t0: land(1, "so"), subjects: ["w:bear", "?c:byron"], size: "medium", angle: "low", move: "push", enter: "cut", note: "1 so he brought a bear" },
  { t0: land(2), subjects: ["c:byron", "w:dog", "?w:gate"], size: "wide", move: "push", enter: "cut", note: "2 Cambridge, 1805: the Great Court" },
  { t0: land(2, "Young"), subjects: ["c:byron"], size: "medium", move: "push", enter: "cut", note: "2 young Lord Byron arrives at Trinity College" },
  { t0: land(2, "with"), subjects: ["c:byron", "w:dog"], size: "medium", move: "drift", enter: "cut", note: "2 with his beloved dog, Boatswain" },
  { t0: land(3), subjects: ["c:porter", "?w:sign"], size: "medium", move: "push", enter: "cut", note: "3 the rules say: (the porter and the rule book)" },
  { t0: land(3, "no") - 0.1, subjects: ["w:sign", "c:porter"], size: "medium", move: "push", enter: "cut", note: "3 no dogs (the NO DOGS sign pops up). Not one." },
  { t0: land(4), subjects: ["c:byron"], size: "medium", move: "push", enter: "cut", note: "4 so Byron reads the rules again. very carefully" },
  { t0: land(4, "Dogs"), subjects: ["c:byron"], size: "close", move: "push", enter: "cut", note: "4 dogs are banned... but bears? not a word (the sly grin)" },
  { t0: land(5), subjects: ["w:wagon", "?c:byron"], size: "medium", move: "push", enter: "cut", note: "5 so he gets a bear (the wagon)" },
  { t0: wtn(5, "A", 1) - 2 / 30, subjects: ["w:bear", "c:byron"], size: "medium", move: "drift", enter: "cut", note: "5 a real, live, tame bear" },
  { t0: land(6), subjects: ["c:tutor0", "c:tutor1", "?c:tutor2"], size: "medium", move: "push", enter: "cut", note: "6 the college is horrified" },
  { t0: land(6, "What"), subjects: ["c:tutor1", "?w:bear"], size: "medium", move: "push", enter: "cut", note: "6 what do we do with it?" },
  { t0: land(7), subjects: ["c:byron"], size: "medium", angle: "low", move: "push", enter: "cut", note: "7 Byron has an answer" },
  { t0: land(7, "He"), subjects: ["w:bear", "?c:byron"], size: "medium", move: "push", enter: "cut", note: "7 he should sit for a fellowship (the bear at the desk in gown and cap)" },
  { t0: land(8), subjects: ["c:tutor0", "c:tutor1"], size: "medium", move: "push", enter: "cut", note: "8 they couldn't throw it out (flipping the rule book)" },
  { t0: land(8, "rules"), subjects: ["w:bear", "?c:tutor0"], size: "medium", move: "drift", enter: "cut", note: "8 the rules never said bears (the bear waves)" },
  { t0: land(9), subjects: ["c:byron", "w:bear"], size: "medium", move: "push", enter: "cut", note: "9 Lord Byron: poet, rebel (his rooms, lamp light)" },
  { t0: land(9, "and"), subjects: ["w:bear", "c:byron"], size: "medium", move: "drift", enter: "cut", note: "9 and the only student whose roommate had claws" },
];
