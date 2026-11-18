// Where everything stands in "The Baboon Who Ran the Railway" (x = east, z = south, metres):
//   Uitenhage station (origin): the line runs east-west at z 0; the platform south of it (top 0.6 m), the station
//                               house behind the platform, the signal box at the platform's west end (open to the south,
//                               its back window over the track); the trolley comes in from the west along the line
//   the open line (x +400): the veldt, a freight train rolling east; Jumper jumps from roof to roof (lines 2-3)
//   the market (x -400): stalls round a square, the ox cart Jack drives (lines 5-6)
import * as THREE from "three";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const RAIL_Z = 0;                                       // the line's centre (rails at +-0.75)
export const PLAT = { x0: -22, x1: 26, z0: 2.0, z1: 9, h: 0.6 };   // the platform
export const BOX = { x: -18, z: 4.4, w: 4.4, d: 3.2, floor: 0.6 };   // the signal box: centre, width (x), depth (z)
/** lever i (0..3) of the frame inside the box: the pivot at the floor slot, the handle leans north (toward the track) */
export const LEVER = (i: number) => V(BOX.x - 1.05 + i * 0.7, BOX.floor, BOX.z - 0.35);
export const JACK_AT = V(BOX.x, BOX.floor, BOX.z - 0.95);       // Jack behind the levers, facing south (the camera)
export const CHAIR = V(BOX.x + 1.65, BOX.floor, BOX.z + 0.3);     // Jumper's chair (line 8), feet up on a crate
export const HOUSE = { x0: -4, x1: 14, z0: 10, z1: 17 };        // the station house
export const LINE = V(400, 0, 0);                               // the open line
export const MARKET = V(-400, 0, 0);                            // the market square
export const insideRoom = (_p: THREE.Vector3): string | null => null;   // every set is open to the camera
