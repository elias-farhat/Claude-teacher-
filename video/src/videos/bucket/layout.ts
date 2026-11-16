// Where everything stands in "The War of the Bucket" (x = east, z = south, metres): one compact diorama world, so
// every camera move between beats stays short. Modena (west) and Bologna (east) face each other across the Zappolino
// plain; the road runs along x at z = 0 from Modena's east gate to Bologna's west gate (Porta San Felice).
//   Modena   : walled town x -90..-50, z -20..20; gate on the east wall (x -50); the Ghirlandina tower in the piazza with
//              the tower room near its top (line 11)
//   Bologna  : walled town x 50..90, z -20..20; gate on the west wall (x 50); the town well in its piazza (line 3);
//              a well outside the gate (line 8)
//   the field: the plain between them; the lone well with the bucket (line 1), the lords' stand-off (2), the armies (5-7)
//   Monteveglio: the castle on its hill north of the field (line 9)
import * as THREE from "three";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export type Town = { x0: number; x1: number; z0: number; z1: number; gateX: number; gateZ: number; wallH: number };
export const MODENA: Town = { x0: -90, x1: -50, z0: -20, z1: 20, gateX: -50, gateZ: 0, wallH: 7 };
export const BOLOGNA: Town = { x0: 50, x1: 90, z0: -20, z1: 20, gateX: 50, gateZ: 0, wallH: 7 };
export const GATE_W = 6;                                   // the gap in each wall (the Kenney gate model fills it)
export const ROAD = { x0: -50, x1: 50, w: 6 };

export const WELL_MID = V(0, 0, 9);                       // line 1: the lone well with the bucket between the towns
export const WELL_B = V(70, 0, 5);                        // line 3: Bologna's town well (night)
export const WELL_OUT = V(43, 0, 9);                      // line 8: the well outside Porta San Felice
export const LORDS = V(0, 0, -24);                        // line 2: the stand-off on the field
export const RIDGE = { x: -24, z: 0, r: 10, h: 2.4 };    // line 5: Modena's 7,000 on a low ridge
export const ARMY = { x0: 6, x1: 40, z0: -16, z1: 16 };   // line 5: Bologna's 32,000 (instanced)
export const CLASH = V(-12, 0, 3);                        // line 6: the clash
export const HILL = { x: 0, z: -95, r: 26, h: 12 };       // line 9: Monteveglio's hill
export const CASTLE = V(HILL.x, HILL.h, HILL.z);
/** the Ghirlandina: a square tower in Modena's piazza; the tower room (line 11) floor at ROOM_Y */
export const TOWER = { x: -72, z: -11, w: 10, h: 30 };
export const ROOM_Y = 18, ROOM_H = 3.4;
export const PIAZZA_M = V(-68, 0, 2);                     // line 10: the crowd at Modena's piazza
export const insideRoom = (p: THREE.Vector3): string | null =>
  Math.abs(p.x - TOWER.x) < TOWER.w / 2 && Math.abs(p.z - TOWER.z) < TOWER.w / 2 && p.y > ROOM_Y - 0.3 && p.y < ROOM_Y + ROOM_H ? "tower" : null;
