// Shot spec of "The Pope Who Put a Corpse on Trial" for the auto-framer (guard/solve.ts): one line per shot, landing on
// its word (land = word - 2 frames; voice.wav is final). Every shot's required subject is a character doing the narrated
// thing (the last one, the empty throne, by the script). Changes of place and the reaction beats cut on the beat.
import { land, wtn } from "./story";
import type { ShotSpec } from "../../guard/solve";

export const SHOT_SPECS: ShotSpec[] = [
  { t0: 0, subjects: ["c:/^bishop[12]$/"], size: "medium", move: "drift", note: "1 Rome, 897: the bishops file up the nave" },
  { t0: land(1, "trial"), subjects: ["c:/^bishop[12]$/"], size: "medium", move: "drift", note: "1 the strangest trial in history: the bishops reach their bench, the empty throne" },
  { t0: land(2), subjects: ["c:stephen"], size: "medium", angle: "low", move: "push", enter: "cut", note: "2 the judge? Pope Stephen VI slams his crozier" },
  { t0: land(3), subjects: ["c:stephen"], size: "wide", move: "sway", note: "3 the defendant?" },
  { t0: wtn(3, "The", 1) - 2 / 30, subjects: ["c:formosus"], size: "wide", move: "push", enter: "cut", note: "3 the pope before him... Formosus (the reveal)" },
  { t0: land(3, "dead"), subjects: ["c:/^bishop[12]$/"], size: "medium", move: "push", enter: "cut", note: "3 dead for months: the bishops recoil" },
  { t0: land(4), subjects: ["c:stephen"], size: "medium", move: "drift", enter: "cut", note: "4 but Stephen didn't care" },
  { t0: land(4, "He"), subjects: ["c:/^monk[01]$/"], size: "wide", move: "push", enter: "cut", note: "4 he had the body dug up: the monks at the grave" },
  { t0: land(5), subjects: ["c:formosus", "c:/^monkD[01]$/"], size: "medium", move: "push", enter: "cut", note: "5 they dressed the corpse and sat him on a throne" },
  { t0: land(6), subjects: ["c:stephen"], size: "medium", move: "push", enter: "cut", note: "6 the charge? (Stephen points with the scroll)" },
  { t0: land(6, "Becoming"), subjects: ["c:/^bishop[12]$/"], size: "medium", move: "push", enter: "cut", note: "6 becoming pope illegally: the bishops whisper" },
  { t0: land(7), subjects: ["c:formosus"], size: "medium", move: "push", enter: "cut", note: "7 since the accused couldn't talk" },
  { t0: land(7, "nervous"), subjects: ["c:deacon", "?c:formosus"], size: "medium", move: "push", note: "7 a nervous young deacon behind him answered for him" },
  { t0: land(8), subjects: ["c:stephen"], size: "medium", angle: "low", move: "push", enter: "cut", note: "8 Stephen screamed!" },
  { t0: land(8, "pointed"), subjects: ["c:stephen"], size: "medium", angle: "right", move: "push", enter: "cut", note: "8 he pointed!" },
  { t0: land(8, "accused"), subjects: ["c:stephen"], size: "medium", angle: "left", move: "push", enter: "cut", note: "8 he accused!" },
  { t0: land(9), subjects: ["c:formosus", "?w:mitre"], size: "medium", move: "push", enter: "cut", note: "9 the defendant... said nothing (the mitre tips off)" },
  { t0: land(10), subjects: ["c:stephen"], size: "medium", angle: "low", move: "push", enter: "cut", note: "10 verdict: guilty!" },
  { t0: land(10, "cancelled"), subjects: ["c:stephen"], size: "medium", move: "drift", note: "10 everything he did was cancelled: the verdict torn" },
  { t0: land(10, "including"), subjects: ["c:stephen"], size: "medium", move: "push", enter: "cut", note: "10 including making Stephen a bishop: he freezes" },
  { t0: land(11), subjects: ["c:/^monkR[01]$/", "?w:bundle"], size: "medium", move: "drift", enter: "cut", note: "11 they threw the body in the river" },
  { t0: land(12), subjects: ["c:/^roman[01]$/", "?c:roman2"], size: "medium", move: "push", enter: "cut", note: "12 Rome was disgusted: the crowd boos" },
  { t0: land(12, "And"), subjects: ["c:stephenX", "c:/^guard\\d$/"], size: "medium", move: "drift", enter: "cut", note: "12 Stephen lost his job: marched out, mitre knocked off" },
  { t0: land(13), subjects: ["w:throne"], size: "medium", move: "push", enter: "cut", note: "13 the empty throne, one candle" },
];
