// Shot spec of "Napoleon vs. the Rabbits" for the auto-framer (guard/solve.ts): one line per shot, landing on its word
// (land = word - 2 frames; voice.wav is final). Every shot's required subject is a character doing the narrated
// thing; the rabbits (instanced) come in as "w:" props. Changes of place cut on the beat.
import { land } from "./story";
import type { ShotSpec } from "../../guard/solve";

export const SHOT_SPECS: ShotSpec[] = [
  { t0: 0, subjects: ["c:napoleonH"], size: "medium", angle: "low", move: "push", note: "1 Napoleon Bonaparte on his white horse, heroic low angle" },
  { t0: land(1, "Feared"), subjects: ["c:napoleonH", "?w:army"], size: "wide", angle: "low", move: "drift", note: "1 feared by every army on Earth: the army and flags behind him" },
  { t0: land(2), subjects: ["c:napoleonT", "?c:tsar"], size: "medium", move: "push", enter: "cut", note: "2 in 1807 he'd just made peace with Russia: signing" },
  { t0: land(2, "Time"), subjects: ["c:napoleonT", "c:/^cheerO\\d$/"], size: "medium", move: "drift", note: "2 time to celebrate with a rabbit hunt: he jumps up and claps" },
  { t0: land(3), subjects: ["c:berthier"], size: "medium", move: "push", enter: "cut", note: "3 his chief of staff Berthier had one job: salute" },
  { t0: land(3, "Get"), subjects: ["c:berthier"], size: "medium", angle: "low", move: "push", note: "3 Get. Rabbits.: the checklist, sweating" },
  { t0: land(4), subjects: ["c:berthierF", "c:farmer0"], size: "medium", move: "drift", enter: "cut", note: "4 he bought hundreds from local farmers" },
  { t0: land(4, "Tame"), subjects: ["c:farmer1"], size: "medium", move: "push", note: "4 tame rabbits. pets: a farmer kisses a bunny goodbye" },
  { t0: land(5), subjects: ["c:/^opener\\d$/", "?w:cages"], size: "medium", move: "drift", enter: "cut", note: "5 the cages open: the men jump back as the doors fly up" },
  { t0: land(5, "Napoleon"), subjects: ["c:napoleon"], size: "medium", move: "push", enter: "cut", note: "5 Napoleon raises his gun, squinting" },
  { t0: land(6), subjects: ["c:napoleon", "?w:swarm"], size: "wide", move: "drift", note: "6 and the rabbits run straight AT him" },
  { t0: land(6, "AT"), subjects: ["c:napoleon"], size: "medium", move: "push", note: "6 AT him: his eyes go wide" },
  { t0: land(7), subjects: ["c:napoleon", "?w:swarm"], size: "medium", angle: "high", move: "drift", note: "7 they weren't scared, they were hungry: begging at his boots" },
  { t0: land(8), subjects: ["c:napoleon"], size: "medium", move: "push", note: "8 they swarmed his boots, climbed up his legs" },
  { t0: land(8, "men") - 0.2, subjects: ["c:/^officer\\d$/", "c:napoleon"], size: "wide", move: "drift", place: "centre", note: "8 his men swung whips and sticks... didn't work" },
  { t0: land(9), subjects: ["c:napoleon", "?w:swarm"], size: "wide", angle: "high", move: "orbit", place: "centre", note: "9 the rabbits split up and attacked from the flanks (battle-map angle)" },
  { t0: land(10), subjects: ["c:napoleon"], size: "medium", move: "drift", enter: "cut", note: "10 the Emperor of France ran for his carriage (hat flying)" },
  { t0: land(10, "And"), subjects: ["c:napoleonC", "?w:carriage"], size: "medium", move: "drift", enter: "cut", note: "10 some rabbits jumped in after him: on the carriage, driving off" },
  { t0: land(11), subjects: ["w:king", "?w:swarm"], size: "medium", move: "push", enter: "cut", note: "11 the rabbits won: one wears the bicorne" },
  { t0: land(12), subjects: ["c:thiebault"], size: "medium", move: "push", enter: "cut", note: "12 that's what one of his generals wrote" },
  { t0: land(12, "And"), subjects: ["c:thiebault"], size: "medium", angle: "left", move: "drift", note: "12 and he really didn't like Berthier (the portrait behind)" },
];
