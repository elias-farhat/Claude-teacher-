// Shot spec of "The Baboon Who Ran the Railway" for the auto-framer (guard/solve.ts): one line per shot, landing on
// its word (land = word - 2 frames; voice.wav is final). Every shot's required subject is the character doing the
// narrated thing (CLAUDE.md 10). Changes of place cut on the beat; reaction beats cut.
import { land, wtn } from "./story";
import type { ShotSpec } from "../../guard/solve";

export const SHOT_SPECS: ShotSpec[] = [
  { t0: 0, subjects: ["c:jack", "?w:levers"], size: "medium", move: "push", note: "1 (hook) a baboon ran a railway: Jack at the levers, cap on" },
  { t0: land(1, "and"), subjects: ["c:jack"], size: "medium", angle: "low", move: "push", enter: "cut", note: "1 and never made a single mistake" },
  { t0: land(2), subjects: ["c:jumper", "?c:folk0"], size: "wide", move: "push", enter: "cut", note: "2 South Africa, 1881: Uitenhage station, Jumper on the platform" },
  { t0: land(2, "Railway"), subjects: ["c:jumper"], size: "medium", move: "orbit", enter: "cut", note: "2 railway worker James 'Jumper' Wide" },
  { t0: land(2, "loved"), subjects: ["c:jumper"], size: "wide", move: "drift", enter: "cut", note: "2 loved jumping between moving trains: on the freight roofs" },
  { t0: land(3), subjects: ["c:jumper"], size: "medium", angle: "low", move: "push", enter: "cut", note: "3 until... (the leap)" },
  { t0: land(3, "missed") - 0.15, subjects: ["c:jumper"], size: "medium", angle: "high", move: "push", enter: "cut", note: "3 he missed: hanging in the air, looking down" },
  { t0: land(3, "and"), subjects: ["c:jumper"], size: "medium", move: "push", enter: "cut", note: "3 and lost both legs: on the platform, on wooden pegs" },
  { t0: land(4), subjects: ["c:jumper", "?c:folk0", "?c:folk2"], size: "wide", move: "push", enter: "cut", note: "4 so he bought a helper at the market" },
  { t0: land(4, "baboon"), subjects: ["c:jack", "?w:ox"], size: "medium", angle: "high", move: "push", enter: "cut", note: "4 a baboon (on the ox cart)" },
  { t0: land(4, "named"), subjects: ["c:jumper", "?c:jack"], size: "wide", move: "drift", enter: "cut", note: "4 named Jack (Jumper pays, Jack hops down)" },
  { t0: land(5), subjects: ["c:jack", "c:jumper", "?w:trolley"], size: "medium", move: "drift", enter: "cut", note: "5 Jack pushed him to work every morning" },
  { t0: land(5, "then"), subjects: ["c:jack", "?c:jumper"], size: "medium", move: "push", enter: "cut", note: "5 then started pulling the signal levers himself" },
  { t0: land(6), subjects: ["w:loco"], size: "medium", angle: "low", move: "push", enter: "cut", note: "6 whistle once? (the puff)" },
  { t0: land(6, "Lever"), subjects: ["c:jack"], size: "medium", move: "push", enter: "cut", note: "6 lever one" },
  { t0: land(6, "Twice"), subjects: ["w:loco"], size: "medium", angle: "low", move: "push", enter: "cut", note: "6 twice? (two puffs)" },
  { t0: wtn(6, "Lever", 1) - 2 / 30, subjects: ["c:jack"], size: "medium", move: "push", enter: "cut", note: "6 lever two" },
  { t0: land(7), subjects: ["c:lady"], size: "medium", move: "push", enter: "cut", note: "7 one day a passenger screamed" },
  { t0: wtn(7, "A", 1) - 2 / 30, subjects: ["c:jack"], size: "medium", move: "push", enter: "cut", note: "7 A MONKEY is running the railway! (Jack waves)" },
  { t0: land(8), subjects: ["c:boss0", "c:boss1"], size: "wide", move: "push", enter: "cut", note: "8 the bosses came to fire them" },
  { t0: land(8, "But"), subjects: ["c:jack", "?c:boss0"], size: "medium", move: "push", enter: "cut", note: "8 but first... they tested Jack" },
  { t0: land(9), subjects: ["w:loco"], size: "medium", angle: "low", move: "push", enter: "cut", note: "9 whistle" },
  { t0: land(9, "Lever"), subjects: ["c:jack"], size: "medium", move: "push", enter: "cut", note: "9 lever" },
  { t0: land(9, "Perfect"), subjects: ["c:boss0", "?c:boss1"], size: "medium", move: "push", enter: "cut", note: "9 perfect. every. single. time. (the bosses gape, then clap)" },
  { t0: land(10), subjects: ["c:jack", "?c:boss0"], size: "medium", move: "push", enter: "cut", note: "10 so they hired him (cap, salute)" },
  { t0: land(10, "Twenty"), subjects: ["c:jack", "?c:boss1"], size: "medium", move: "drift", enter: "cut", note: "10 twenty cents a day... and half a bottle of beer a week" },
  { t0: land(11), subjects: ["c:jack", "?c:jumper"], size: "medium", move: "push", enter: "cut", note: "11 nine years, zero mistakes (golden)" },
  { t0: land(11, "Better"), subjects: ["c:jumper", "?c:jack"], size: "medium", move: "push", enter: "cut", note: "11 better than Jumper (punchline)" },
];
