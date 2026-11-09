// Camera guard subjects for "The Man Who Sold the Eiffel Tower" (CLAUDE.md rule 13): who or what the narration is
// about at each moment. Characters by their stage name ("c:"), label / effect cards by key prefix ("f:"), world props
// ("w:", boxes below). Written from the script, not from the camera, so the guard judges the camera against the story.
import * as THREE from "three";
import { wt, VOICE_LEN, trainX } from "./story";
import { OUTER } from "./tower";
import { RAIL } from "./paris";
import type { Window } from "../../guard/core";

const W = (from: number, to: number, why: string, ...ids: string[]): Window => ({ from, to, ids, why });
export const WINDOWS: Window[] = [
  W(0, wt(1, "scrap") - 0.3, "1: a man sold the Eiffel Tower", "w:tower"),
  W(wt(1, "scrap") - 0.3, wt(2, "tried"), "1-2: the SOLD tag (sold ... came back)", "f:tag"),
  W(wt(2, "tried"), wt(3), "2: he tried to sell it again", "c:lustig"),
  W(wt(3), wt(3, "half"), "3: Paris, the tower is rusty, expensive (the painters)", "c:painter1", "c:painter2"),
  W(wt(3, "half"), wt(4), "3: half the city thinks it's ugly (the lady)", "c:lady"),
  W(wt(4), wt(5), "4: Victor Lustig reads this in the morning paper and smiles", "c:lustigCafe", "f:paper"),
  W(wt(5), wt(6), "5: he pays a forger", "c:lustigF", "c:forger"),
  W(wt(5, "letterhead"), wt(6), "5: government letterhead", "f:letterhead"),
  W(wt(6), wt(6, "fanciest"), "6: books a suite", "c:lustigH"),
  W(wt(6, "fanciest"), wt(7, "secret"), "6-7: the fanciest hotel; he invites the dealers", "c:lustigL"),
  W(wt(7, "secret"), wt(8), "7: a secret meeting (the dealers come in)", "c:/^dealerW?\\d$/"),
  W(wt(8), wt(9), "8: selling the tower, he tells them", "c:lustigM", "c:/^dealer\\d$/"),
  W(wt(9), wt(10), "9: seven thousand tons ... not a word", "c:lustigM"),
  W(wt(10), wt(12), "10-11: André wants it ... feels off", "c:andreM"),
  W(wt(12), wt(14), "12-13: calm a suspicious buyer; ask him for a bribe", "c:lustigM"),
  W(wt(14), wt(15), "14: fake vs real official", "c:fake", "c:real"),
  W(wt(15), wt(16), "15: a real crooked one would", "c:lustigM"),
  W(wt(16), wt(17), "16: a waiter whispering", "c:waiterW"),
  W(wt(17), wt(18), "17: André pays", "c:andreC", "f:francs"),
  W(wt(18), wt(18, "train"), "18: and Lustig ... (the money flies)", "f:bag"),
  W(wt(18, "train"), wt(19), "18: Lustig on a train with the francs", "c:lustigT"),
  W(wt(19), wt(20), "19: he checks the newspapers", "c:lustigSeat"),
  W(wt(20), wt(21), "20: André is too embarrassed", "c:andreH"),
  W(wt(21), wt(21, "New"), "21: Lustig comes back", "c:lustigT"),
  W(wt(21, "New"), wt(22), "21: new dealers, same speech", "c:lustigM"),
  W(wt(22), wt(23), "22: the buyer goes to the police", "c:andreP", "c:/^police\\d$/"),
  W(wt(23), wt(24), "23: Lustig escapes to America", "c:lustigShip"),
  W(wt(24), wt(25), "24: he dies in a prison hospital", "c:lustigOld"),
  W(wt(25), VOICE_LEN + 1, "25: his death certificate", "f:cert"),
];
export const PROPS: Record<string, (t: number) => THREE.Box3> = {
  tower: () => new THREE.Box3(new THREE.Vector3(-OUTER(0), 0, -OUTER(0)), new THREE.Vector3(OUTER(0), 324, OUTER(0))),
  train: (t) => new THREE.Box3(new THREE.Vector3(trainX(t) - 40, 0, RAIL.z - 2), new THREE.Vector3(trainX(t), 4, RAIL.z + 2)),
};
