// Shot spec of the Rat Bounty short for the auto-framer (guard/solve.ts): one line per shot, landing on its word
// (land = word - 2 frames; voice.wav is final, never retimed). Subjects: "c:" characters, "f:" cards (see guard/subjects.ts).
import { land, lineEnd, wt } from "./story";
import type { ShotSpec } from "../../guard/solve";

export const SHOT_SPECS: ShotSpec[] = [
  { t0: 0, subjects: ["c:farmer"], size: "medium", angle: "low", move: "push", note: "1 the farmer proudly holds up his rat" },
  { t0: land(1, "paid"), subjects: ["c:farmer", "c:official"], size: "medium", move: "drift", note: "1 the French paid people ... so people started farming them" },
  { t0: land(2), subjects: ["c:rickLady", "c:rickPuller"], size: "wide", move: "drift", note: "2 Hanoi, the shiny new capital" },
  { t0: land(3), subjects: ["c:officialG"], size: "medium", move: "push", note: "3 the French gave it a sewer" },
  { t0: land(3, "sewer"), subjects: ["f:plaqueRat"], size: "insert", move: "drift", note: "3 brand-new sewer system" },
  // the plaque rats leave at "rats" - 0.4 s, so the convoy shot starts there; convoy0 turns the far corner at ~12.9 s,
  // so the second half follows convoy9, which runs straight until line 4 "into"
  { t0: wt(4, "rats") - 0.45, subjects: ["f:convoy0", "?f:convoy1"], size: "insert", note: "4 the rats love it" },
  { t0: wt(4, "rats") + 1.15, subjects: ["f:convoy9", "?f:convoy10"], size: "wide", move: "push", angle: "left", note: "4 a highway (still running)" },
  { t0: land(4, "into"), subjects: ["c:lady", "?f:toiletRat"], size: "medium", move: "push", note: "4 straight into the nicest houses (the rat pops out, she screams)" },
  { t0: land(5), subjects: ["f:plague"], size: "insert", move: "push", note: "5 with plague spreading" },
  { t0: land(5, "kitchen"), subjects: ["f:kitRat"], size: "insert", move: "drift", note: "5 a rat in your kitchen, dangerous" },
  { t0: land(6), subjects: ["c:officialM"], size: "medium", move: "push", note: "6 the French send" },
  { t0: land(6, "hunters"), subjects: ["c:officialM", "?c:/^hunter\\d$/"], size: "medium", move: "drift", note: "6 hunters down into the sewers" },
  { t0: land(7), subjects: ["f:tally"], size: "insert", move: "push", note: "7 thousands of rats a day ... it's not enough" },
  { t0: land(8), subjects: ["c:officialP"], size: "medium", move: "push", note: "8 so they make a new rule" },
  { t0: land(8, "anyone"), subjects: ["c:officialP", "?f:poster"], size: "medium", move: "drift", note: "8 anyone can hunt, one cent per rat" },
  { t0: land(9), subjects: ["c:officialO"], size: "medium", move: "push", note: "9 nobody at city hall wants a mountain of rats" },
  { t0: land(10), subjects: ["f:sign"], size: "insert", move: "drift", note: "10 just bring the tail" },
  { t0: land(11), subjects: ["c:clerk0", "?c:clerk1"], size: "medium", move: "push", note: "11 tails pour in, officials thrilled" },
  { t0: land(12), subjects: ["c:officialS"], size: "medium", move: "drift", note: "12 someone notices" },
  { t0: land(12, "strange"), subjects: ["f:scurry"], size: "insert", note: "12 something strange running down the street" },
  { t0: land(13), subjects: ["f:hero"], size: "insert", move: "push", note: "13 a rat with no tail" },
  { t0: land(14), subjects: ["c:officialR", "?f:march"], size: "wide", move: "drift", note: "14 then another, and another" },
  { t0: land(15), subjects: ["c:officialB", "?f:tailOne"], size: "medium", move: "push", note: "15 a dead rat pays you once" },
  { t0: land(16), subjects: ["f:mom"], size: "insert", move: "drift", note: "16 a live rat keeps having babies" },
  { t0: land(17), subjects: ["c:farmerH"], size: "medium", move: "push", note: "17 paid for every egg" },
  { t0: land(17, "killing"), subjects: ["c:farmerH", "c:officialH"], size: "medium", move: "drift", note: "17 and then killing the chicken" },
  { t0: lineEnd(17), subjects: ["c:farmerWalk"], size: "medium", move: "push", note: "18 farms outside the city" },
  { t0: land(18, "breeding"), subjects: ["c:farmerB", "?f:cageRat"], size: "medium", move: "drift", note: "18 breeding rats for the reward" },
  { t0: land(19), subjects: ["c:officialT"], size: "medium", move: "push", note: "19 the French cancel the reward" },
  { t0: land(20), subjects: ["c:doumerQ"], size: "medium", move: "drift", note: "20 Paul Doumer goes home" },
  { t0: wt(20, "President") - 1.1, subjects: ["c:doumerP"], size: "medium", move: "push", note: "20 becomes President of France" },
  { t0: land(21), subjects: ["f:lounge"], size: "insert", move: "drift", note: "21 the rats stayed" },
];
