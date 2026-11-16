// Where everything stands in "Napoleon vs. the Rabbits" (x = east, z = south, metres):
//   the château park (origin): lawn, the château to the north, the rows of cages, Napoleon's shooting spot, the
//                              carriage to the south-east (lines 3, 5-11)
//   the hill (x -200): Napoleon on his white horse at the plateau's east edge, the army and flags behind (line 1)
//   the treaty room (x +200): Tilsit, a table, the treaty (line 2)
//   the farm (z +200): farmers hand over crates of tame rabbits (line 4)
//   the study (x +200, z +40): Thiébault writes his memoirs under Berthier's portrait (line 12)
import * as THREE from "three";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const LAWN = { x0: -80, x1: 80, z0: -80, z1: 70 };
export const CHATEAU = { x0: -36, x1: 36, z0: -64, z1: -50, h: 13 };
/** the cages: two rows facing south */
export const CAGES = Array.from({ length: 16 }, (_, i) => V(-8.4 + (i % 8) * 2.4, 0, -6 - Math.floor(i / 8) * 2.6));
export const NAP = V(0, 0, 7);                 // where Napoleon stands to shoot (facing the cages, north)
export const CARRIAGE = V(13, 0, 16);          // the carriage (body along x, horses to the east)
export const CARR_DOOR = V(14.4, 0, 14.6);     // where Napoleon scrambles up onto the driver's box
export const BERTH3 = V(5, 0, -34);            // line 3: Berthier on the gravel in front of the château
export const HILL = { x: -200, z: 0, r: 34, h: 8, top: 26 };
export const RIDER = V(HILL.x + HILL.top - 3, HILL.h, HILL.z);   // Napoleon on horseback, the plateau's east edge
export const FARM = V(0, 0, 200);
export type Room = { name: string; x0: number; x1: number; z0: number; z1: number; h: number };
export const ROOMS: Record<string, Room> = {
  treaty: { name: "treaty", x0: 193, x1: 207, z0: -7, z1: 6, h: 3.8 },
  study: { name: "study", x0: 195, x1: 205, z0: 33, z1: 43, h: 3.4 },
};
export const RC = (r: Room) => V((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
export const insideRoom = (p: THREE.Vector3): string | null => {
  for (const r of Object.values(ROOMS)) if (p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1 && p.y < r.h) return r.name;
  return null;
};
