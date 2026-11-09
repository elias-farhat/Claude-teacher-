// Camera guard subjects for "The Moon Hoax" (CLAUDE.md rule 13): who or what the narration is about at each moment,
// written from SCRIPT.md. "c:" characters by stage name ("c:/re/" = a group), "f:" cards by key prefix, "w:" world props.
import * as THREE from "three";
import { wt, VOICE_LEN, shipX } from "./story";
import { EYEPIECE, TUBE_END, MOON, MOON_TOP, SHIP_LINE, WATER } from "./layout";
import type { Window } from "../../guard/core";

const W = (from: number, to: number, why: string, ...ids: string[]): Window => ({ from, to, ids, why });
export const WINDOWS: Window[] = [
  W(0, wt(2), "1: a newspaper told New York (the newsboy)", "c:newsboy"),
  W(wt(1, "believed"), wt(2), "1: New York believed it", "c:/^reader\\d$/"),
  W(wt(2), wt(3), "2: The Sun ... needs readers (the editor, the empty chart)", "c:editor"),
  W(wt(2, "costs"), wt(3), "2: the empty sales chart", "f:chart0"),
  W(wt(3), wt(4), "3: Richard Locke writes a story", "c:locke"),
  W(wt(4), wt(4, "built"), "4: the astronomer Sir John Herschel", "c:herschelT"),
  W(wt(4, "built"), wt(5), "4: a giant telescope in South Africa", "w:telescope"),
  W(wt(5), wt(6), "5: through it he can see the Moon", "w:moon"),
  W(wt(6), wt(6, "oceans"), "6: day one, forests", "f:day1"),
  W(wt(6, "oceans"), wt(7), "6: and oceans", "f:wave"),
  W(wt(7), wt(8), "7: blue goats with a single horn", "f:goat"),
  W(wt(8), wt(9), "8: winged people chatting", "c:/^bat\\d$/"),
  W(wt(9), wt(10), "9: the whole city is talking", "c:/^town\\d$/", "c:fainter"),
  W(wt(10), wt(11), "10: other papers copy it, across Europe", "f:bird"),
  W(wt(11), wt(12), "11: didn't anyone ask Herschel (the portrait)", "f:portrait"),
  W(wt(12), wt(13), "12: Herschel really is in South Africa", "c:herschelG"),
  W(wt(13), wt(14), "13: a letter takes months (the ship)", "w:ship"),
  W(wt(14), wt(15), "14: nobody can check; on vacation, no phone", "c:herschelB"),
  W(wt(14, "rumor"), wt(15), "14: a rumour about a friend", "f:rumor"),
  W(wt(15), wt(16), "15: a rival paper exposes the whole thing", "c:rival"),
  W(wt(16), wt(17), "16: The Sun is the paper everyone has heard of", "c:/^cust\\d$/"),
  W(wt(17), wt(18), "17: Herschel gets letters in four languages", "c:herschelL"),
  W(wt(18), wt(18, "signing"), "18: and Locke?", "c:lockeS"),
  W(wt(18, "signing"), VOICE_LEN + 2, "18: signing 'author of the Moon hoax'", "f:sig"),
];
const box = (a: THREE.Vector3, b: THREE.Vector3, pad: number) => new THREE.Box3().setFromPoints([a, b]).expandByScalar(pad);
export const PROPS: Record<string, (t: number) => THREE.Box3> = {
  telescope: () => box(EYEPIECE, TUBE_END, 1.7),
  moon: () => new THREE.Box3(new THREE.Vector3(MOON.c.x - MOON.r, MOON.c.y - MOON.r, MOON.c.z - MOON.r), new THREE.Vector3(MOON.c.x + MOON.r, MOON_TOP + 3, MOON.c.z + MOON.r)),
  ship: (t) => new THREE.Box3(new THREE.Vector3(shipX(t) - 4, WATER.y, SHIP_LINE.z - 1.2), new THREE.Vector3(shipX(t) + 5.2, WATER.y + 9.5, SHIP_LINE.z + 1.2)),
};
