// Where everything stands in "The Pope Who Put a Corpse on Trial" (x = east, z = south, metres):
//   the basilica (origin): the nave, Stephen's high seat on the west side facing east, Formosus' throne on the east
//                          side facing west, the bishops' bench at the north between them, the doors to the south
//   the piazza: outside the doors (line 12)
//   the graveyard (x -200): night, the open grave (line 4)
//   the Tiber (x +200): the stone bank and the river (line 11)
import * as THREE from "three";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const NAVE = { x0: -14, x1: 14, z0: -36, z1: 12, h: 15 };
export const SEAT = { x: -6, z: -16, h: 1.4 };            // Stephen's high seat (a dais 1.4 m tall)
export const STEPHEN_AT = V(SEAT.x, SEAT.h, SEAT.z);
export const THRONE = { x: 3.5, z: -16, h: 0.5 };          // Formosus' throne on a low dais
export const FORMOSUS_AT = V(THRONE.x, THRONE.h + 0.41, THRONE.z);   // a seated figure's place (hips on the seat)
export const BENCH_Z = -23;                                 // the bishops' bench
export const DOOR = V(0, 0, NAVE.z1);
export const PIAZZA = V(0, 0, 24);
export const GRAVE = V(-200, 0, 0);
export const RIVER = { x: 203, bankX: 200, y: -1.4 };        // the Tiber: the bank edge at x 200, water beyond
export const BANK = V(198, 0, 0);
export const insideRoom = (p: THREE.Vector3): string | null =>
  p.x > NAVE.x0 && p.x < NAVE.x1 && p.z > NAVE.z0 && p.z < NAVE.z1 && p.y < NAVE.h ? "nave" : null;
