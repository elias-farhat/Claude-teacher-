// Places of "His College Banned Dogs, So He Brought a Bear": Trinity's Great Court (lawn, paths, the fountain, the Great
// Gate on the north side at z -14 with its arch, the porter's lodge beside it, stone ranges all round), the bear's
// wagon at the gate, the "fellowship" exam desk on the lawn; Byron's rooms (an open-roofed panelled set far east).
import * as THREE from "three";
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const GATE_Z = -14;                 // the gate range's inner face (the court side)
export const GATE = V(0, 0, GATE_Z);
export const LODGE = V(-4.2, 0, GATE_Z + 1.6);   // the porter stands here, at the lodge door
export const WAGON = V(4.6, 0, GATE_Z + 3.2);
export const FOUNTAIN = V(0, 0, 2);
export const DESK = V(-3.2, 0, 4.5);
export const ROOMS = V(200, 0, 0);
export const ARMCHAIR = V(200.9, 0, -1.4);
export const insideRoom = (_p: THREE.Vector3) => null;   // all sets open to the sun
