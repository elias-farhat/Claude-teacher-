// Shot spec of the Moon Hoax short for the auto-framer (guard/solve.ts): one line per shot, landing on its word
// (land = word - 2 frames; voice.wav is final, never retimed). Subjects: "c:" characters, "f:" cards, "w:" world props.
import { land } from "./story";
import type { ShotSpec } from "../../guard/solve";

export const SHOT_SPECS: ShotSpec[] = [
  { t0: 0, subjects: ["c:newsboy"], size: "medium", angle: "low", move: "push", note: "1 the newsboy waves The Sun and shouts" },
  { t0: land(1, "told"), subjects: ["c:newsboy"], size: "wide", move: "drift", note: "1 told New York (the street)" },
  { t0: land(1, "believed"), subjects: ["c:/^reader\\d$/"], size: "wide", move: "push", note: "1 New York believed it" },
  { t0: land(2, "called"), subjects: ["c:editor"], size: "medium", move: "drift", note: "2 The Sun ... needs readers" },
  { t0: land(2, "costs"), subjects: ["c:editor", "f:chart0"], size: "medium", angle: "right", move: "push", note: "2 the empty sales chart (from the right, so Locke at his desk in front stays out of the frame)" },
  { t0: land(3), subjects: ["c:locke"], size: "medium", move: "drift", note: "3 Richard Locke writes a story" },
  { t0: land(4), subjects: ["c:herschelT"], size: "medium", move: "push", note: "4 the astronomer Sir John Herschel" },
  { t0: land(4, "built"), subjects: ["w:telescope"], size: "wide", move: "drift", note: "4 a giant telescope in South Africa" },
  { t0: land(5), subjects: ["w:moon"], size: "wide", move: "push", note: "5 through it he can see the Moon" },
  { t0: land(6), subjects: ["f:day1"], size: "insert", move: "drift", note: "6 day one: forests" },
  // "oceans" and the goat in one shot (a 0.7 s overhead shot of the waves was 90 % flat blue in run 29)
  { t0: land(6, "oceans"), subjects: ["f:goat", "?f:wave"], size: "insert", move: "drift", note: "6 and oceans / 7 blue goats with a single horn, on the shore" },
  // two shots (the pair, 1.25 m apart, is too wide for a portrait frame at full-figure size): one bat each, the other optional
  { t0: land(8), subjects: ["c:bat0", "?c:bat1"], size: "medium", move: "push", note: "8 winged people, like humans with bat wings" },
  { t0: land(8, "flying"), subjects: ["c:bat1", "?c:bat0"], size: "medium", move: "drift", note: "8 flying around and chatting (bat1 waves)" },
  { t0: land(9), subjects: ["c:/^town\\d$/", "?c:fainter"], size: "wide", move: "drift", note: "9 the whole city is talking" },
  { t0: land(10), subjects: ["c:/^pierBoy\\d$/", "?f:bird"], size: "wide", move: "push", note: "10 other papers copy it, across Europe" },
  { t0: land(11), subjects: ["f:portrait"], size: "insert", move: "push", note: "11 didn't anyone just ask Herschel?" },
  { t0: land(12), subjects: ["c:herschelG"], size: "medium", move: "drift", note: "12 Herschel really is in South Africa" },
  { t0: land(13), subjects: ["w:ship"], size: "wide", move: "drift", note: "13 a letter takes months" },
  { t0: land(14), subjects: ["c:herschelB"], size: "medium", move: "push", note: "14 nobody can check" },
  { t0: land(14, "rumor"), subjects: ["c:herschelB", "?f:rumor", "?f:nosignal"], size: "medium", move: "drift", note: "14 a rumour about a friend on vacation" },
  { t0: land(15), subjects: ["c:rival"], size: "medium", move: "push", note: "15 a rival paper exposes the whole thing" },
  { t0: land(16), subjects: ["c:cust0", "?c:/^cust\\d$/"], size: "medium", move: "drift", note: "16 the paper everyone has heard of" },
  { t0: land(17), subjects: ["c:herschelL"], size: "medium", move: "push", note: "17 letters in four languages" },
  { t0: land(18), subjects: ["c:lockeS"], size: "medium", move: "drift", note: "18 and Locke?" },
  { t0: land(18, "signing"), subjects: ["f:sig", "?c:lockeS"], size: "close", angle: "high", move: "drift", note: "18 author of the Moon hoax (the page from above, Locke's signing hand in it)" },
];
