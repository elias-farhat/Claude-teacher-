// Shot spec of "The Luckiest Fool in History" for the auto-framer (guard/solve.ts): one line per shot, landing on its
// word (land = word - 2 frames; voice.wav is final). Every shot's required subject is a CHARACTER doing the narrated
// thing (Bucket run 38 frame check). Changes of place cut on the beat (enter "cut").
import { land } from "./story";
import type { ShotSpec } from "../../guard/solve";

export const SHOT_SPECS: ShotSpec[] = [
  { t0: 0, subjects: ["c:dexter", "?c:/^laugher\\d$/"], size: "medium", move: "drift", note: "1 1790s Massachusetts: Dexter strolls up the dock" },
  { t0: land(1, "everyone"), subjects: ["c:dexter", "?c:/^laugher\\d$/"], size: "medium", move: "push", note: "1 a man everyone laughed at: the town points and laughs" },
  { t0: land(2), subjects: ["c:dexterD"], size: "medium", move: "push", enter: "cut", note: "2 he couldn't spell: scribbling, ink on his nose" },
  { t0: land(3), subjects: ["c:/^merch\\d$/"], size: "medium", move: "drift", enter: "cut", note: "3 the town's merchants gave him advice (huddled, smug)" },
  { t0: land(3, "to"), subjects: ["c:dexterC", "c:/^merch[12]$/"], size: "medium", move: "drift", note: "3 to ruin him: they smile sweetly at Dexter" },
  { t0: land(4), subjects: ["c:dexterC", "c:merch2"], size: "medium", move: "drift", note: "4 sell warming pans, they said: a merchant hands Dexter the pan" },
  { t0: land(4, "In"), subjects: ["c:dexterT"], size: "medium", angle: "low", move: "push", enter: "cut", note: "4 in the tropics: Dexter on deck with a bed warmer, sweating" },
  { t0: land(5), subjects: ["c:dexterU", "?c:/^sailor\\d$/"], size: "medium", move: "drift", note: "5 he did it: the crew carries the pans ashore" },
  { t0: land(5, "sugar"), subjects: ["c:/^planter\\d$/"], size: "medium", move: "drift", place: "centre", enter: "cut", note: "5 the sugar farms bought every one, as ladles for molasses" },
  { t0: land(6), subjects: ["c:merch1"], size: "medium", move: "push", enter: "cut", note: "6 okay, send mittens: a merchant holds them up" },
  { t0: land(6, "He"), subjects: ["c:dexterM"], size: "medium", move: "push", enter: "cut", note: "6 he did: Dexter in mittens on the hot dock" },
  { t0: land(6, "A"), subjects: ["c:captain", "?c:/^fur\\d$/"], size: "medium", move: "drift", enter: "cut", note: "6 a ship heading to Siberia bought them all" },
  { t0: land(7), subjects: ["c:/^merch\\d$/"], size: "medium", move: "push", enter: "cut", note: "7 fine, take coal to Newcastle: the merchants laugh" },
  { t0: land(7, "The"), subjects: ["c:dexterS"], size: "medium", move: "drift", enter: "cut", note: "7 the coal capital of England: Dexter sails in waving" },
  { t0: land(8), subjects: ["c:/^miner\\d$/"], size: "medium", move: "push", enter: "cut", note: "8 in the middle of a miners' strike" },
  { t0: land(8, "Sold"), subjects: ["c:dexterN", "?c:/^buyer\\d$/"], size: "medium", move: "drift", enter: "cut", note: "8 sold out: the town runs to buy his coal" },
  { t0: land(9), subjects: ["c:dexterR"], size: "medium", move: "push", enter: "cut", note: "9 every terrible idea made him richer: the gold piles up" },
  { t0: land(10), subjects: ["c:dexterQ", "?c:/^crowd\\d$/"], size: "medium", angle: "low", move: "drift", enter: "cut", note: "10 that's the story: on his crate in the square" },
  { t0: land(10, "Dexter"), subjects: ["c:dexterQ"], size: "medium", angle: "low", move: "push", note: "10 he told it louder than anyone" },
  { t0: land(11), subjects: ["c:/^mourner\\d$/"], size: "wide", move: "drift", enter: "cut", note: "11 he staged his own fake funeral" },
  { t0: land(11, "just"), subjects: ["c:dexterP"], size: "medium", move: "push", note: "11 just to see who would cry: Dexter peeks round the curtain" },
];
