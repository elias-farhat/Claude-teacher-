// Camera guard subjects for "The Rat Bounty That Backfired" (CLAUDE.md rule 13): who or what the narration is about
// at each moment, written from SCRIPT.md. "c:" characters by stage name ("c:/re/" = a group), "f:" cards by key prefix.
import { wt, VOICE_LEN } from "./story";
import type { Window } from "../../guard/core";

const W = (from: number, to: number, why: string, ...ids: string[]): Window => ({ from, to, ids, why });
export const WINDOWS: Window[] = [
  W(0, wt(2), "1: paid to kill rats ... started farming them", "c:farmer"),
  W(wt(2), wt(3), "2: Hanoi, the shiny new capital (the rickshaw)", "c:rickLady"),
  W(wt(3), wt(3, "sewer"), "3: the French gave it a sewer (the official cuts the ribbon)", "c:officialG"),
  W(wt(3, "sewer"), wt(4), "3: a brand-new sewer system (plaque + first rats)", "f:plaqueRat"),
  W(wt(4), wt(4, "straight"), "4: the rats love it, a highway", "f:convoy"),
  W(wt(4, "straight"), wt(5), "4: straight into the nicest houses", "f:toiletRat", "c:lady"),
  W(wt(5), wt(5, "kitchen"), "5: plague spreading", "f:plague"),
  W(wt(5, "kitchen"), wt(6), "5: a rat in your kitchen, dangerous", "f:kitRat"),
  W(wt(6), wt(7), "6: the French send hunters down", "c:/^hunter\\d$/"),
  W(wt(7), wt(8), "7: thousands of rats a day", "f:tally"),
  W(wt(8), wt(9), "8: a new rule, one cent per rat", "f:poster", "c:officialP"),
  W(wt(9), wt(11), "9-10: the official at his desk; just bring the tail", "c:officialO"),
  W(wt(11), wt(12), "11: tails pour in, officials thrilled", "c:/^clerk\\d$/"),
  W(wt(12), wt(12, "something"), "12: someone notices", "c:officialS"),
  W(wt(12, "something"), wt(13), "12: something strange running", "f:scurry"),
  W(wt(13), wt(14), "13: a rat with no tail", "f:hero"),
  W(wt(14), wt(15), "14: another and another", "c:officialR", "f:march"),
  W(wt(15), wt(16), "15: a dead rat pays you once", "f:tailOne", "c:officialB"),
  W(wt(16), wt(17), "16: a live rat keeps having babies", "f:mom"),
  W(wt(17), wt(18), "17: paid for every egg, killing the chicken", "c:farmerH"),
  W(wt(18), wt(18, "breeding"), "18: farms outside the city", "c:farmerWalk"),
  W(wt(18, "breeding"), wt(19), "18: breeding rats for the reward", "c:farmerB", "f:cageRat"),
  W(wt(19), wt(20), "19: the French cancel the reward", "c:officialT"),
  W(wt(20), wt(20, "President"), "20: Paul Doumer goes home", "c:doumerQ"),
  W(wt(20, "President"), wt(21), "20: becomes President of France", "c:doumerP"),
  W(wt(21), VOICE_LEN + 1, "21: the rats stayed", "f:lounge"),
];
