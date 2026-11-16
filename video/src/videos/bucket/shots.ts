// Shot spec of "The War of the Bucket" for the auto-framer (guard/solve.ts): one line per shot, landing on its word
// (land = word - 2 frames; voice.wav is final, never retimed). Subjects: "c:" characters, "w:" world props.
// Changes of place cut on the beat (enter "cut"); glides only inside one place.
import { land } from "./story";
import type { ShotSpec } from "../../guard/solve";

export const SHOT_SPECS: ShotSpec[] = [
  { t0: 0, subjects: ["w:wellMid"], size: "wide", angle: "high", move: "push", note: "1 in 1325 two Italian cities went to war: the lone well on the plain, a walled town behind" },
  { t0: land(1, "over"), subjects: ["w:bucketMid"], size: "insert", move: "push", note: "1 over a bucket: the plain wooden bucket on the well" },
  { t0: land(2), subjects: ["c:/^lord[MB]$/"], size: "medium", move: "drift", place: "centre", enter: "cut", note: "2 Modena and Bologna hated each other: the lords glare" },
  { t0: land(3), subjects: ["c:/^sneak[01]$/", "?w:wellB"], size: "medium", move: "drift", enter: "cut", note: "3 night in Bologna: two Modenese tiptoe to the town well" },
  { t0: land(3, "stole"), subjects: ["c:sneak0"], size: "medium", move: "push", note: "3 and stole a wooden bucket" },
  { t0: land(4), subjects: ["c:lordBG"], size: "medium", angle: "low", move: "push", enter: "cut", note: "4 Bologna was furious, give it back: the lord shakes his fist at Modena's gate" },
  { t0: land(4, "Modena"), subjects: ["c:lordMW"], size: "medium", angle: "low", move: "drift", enter: "cut", note: "4 Modena said no: the lord on his wall hugs the bucket" },
  { t0: land(5), subjects: ["w:army"], size: "wide", angle: "high", move: "drift", enter: "cut", note: "5 Bologna marched out with 32,000 men" },
  { t0: land(5, "Modena"), subjects: ["c:/^modS\\d$/"], size: "wide", move: "drift", enter: "cut", note: "5 Modena had 7,000: a short line on the ridge" },
  { t0: land(6), subjects: ["c:/^bolS\\d$/"], size: "medium", move: "drift", place: "centre", enter: "cut", note: "6 it should have been easy: Bologna's front rank marching, smug" },
  { t0: land(6, "took"), subjects: ["c:/^fight[MB]0$/"], size: "medium", move: "sway", enter: "cut", note: "6 it took two hours: the clash in the dust" },
  { t0: land(6, "Bologna"), subjects: ["c:/^fight[MB]0$/"], size: "medium", move: "sway", place: "centre", note: "6 and Bologna lost: they run" },
  { t0: land(7), subjects: ["c:/^chaser\\d$/", "?c:/^run\\d$/"], size: "medium", move: "drift", enter: "cut", note: "7 the Modenese chased them to the city gates" },
  { t0: land(8), subjects: ["c:knight", "?w:wellOut"], size: "medium", move: "drift", enter: "cut", note: "8 on the way home: the knight walks to the well outside the walls" },
  { t0: land(8, "grabbed"), subjects: ["c:knight"], size: "medium", angle: "low", move: "push", note: "8 they grabbed a souvenir: the bucket held up" },
  { t0: land(9), subjects: ["c:knight"], size: "medium", move: "drift", note: "9 the war wasn't really about a bucket" },
  { t0: land(9, "It"), subjects: ["w:castle"], size: "wide", move: "push", enter: "cut", note: "9 it was about a castle: Monteveglio on its hill" },
  { t0: land(10), subjects: ["c:carrier", "?c:/^cheer\\d$/"], size: "medium", move: "drift", enter: "cut", note: "10 the bucket is the part everyone remembers: carried into Modena, the crowd cheering" },
  { t0: land(10, "Modena"), subjects: ["c:lordK", "?c:carrier"], size: "medium", move: "push", note: "10 and Modena? they kept it: the lord hugs the bucket" },
  { t0: land(11), subjects: ["c:tourist", "w:bucketRoom"], size: "medium", move: "drift", enter: "cut", note: "11 seven hundred years later, it's still there" },
];
