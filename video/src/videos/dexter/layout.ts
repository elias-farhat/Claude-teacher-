// Where everything stands in "The Luckiest Fool in History" (x = east, z = south, metres). One sea (y = WATER_Y) with
// four shores, so every set is a real place with water, ships and sky around it:
//   Newburyport (origin): the harbour street, the dock, the square (line 10), and four interiors behind the street:
//                         Dexter's study (2), the merchants' counting house (3, 4, 6, 7), the mansion (9), the parlour (11)
//   the West Indies (x +200): sand, palms, the sugar farm's molasses vats, a dock with Dexter's ship (4, 5, 6)
//   the Siberia-bound port (x -200): snow, a pier, the captain who buys the mittens (6)
//   Newcastle (z -225): coal heaps, sooty houses, the strike, the dock where Dexter's coal ship comes in (7, 8)
import * as THREE from "three";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const WATER_Y = -0.6;
export type Land = { x0: number; x1: number; z0: number; z1: number };
export const NB: Land = { x0: -60, x1: 60, z0: -70, z1: 8 };
export const TROPIC: Land = { x0: 160, x1: 240, z0: -50, z1: 8 };
export const SNOW: Land = { x0: -240, x1: -160, z0: -50, z1: 8 };
export const NEWC: Land = { x0: -60, x1: 60, z0: -270, z1: -190 };
/** a dock: deck at y 0 from the shore out over the water */
export type Dock = { x: number; z0: number; z1: number; w: number };
export const DOCK_NB: Dock = { x: 0, z0: 8, z1: 28, w: 7 };
export const DOCK_TR: Dock = { x: 200, z0: 8, z1: 28, w: 7 };
export const DOCK_SN: Dock = { x: -200, z0: 8, z1: 28, w: 7 };
export const DOCK_NC: Dock = { x: 0, z0: -190, z1: -172, w: 7 };
export const STREET_Z = -2;                               // Newburyport's harbour street (houses north of it)
export const SQUARE = V(-30, 0, -4);                       // line 10: Dexter on a crate in the square
export const VATS = V(192, 0, -14);                       // line 5: the sugar farm's molasses vats
export const STRIKE = V(-2, 0, -205);                     // line 8: the miners' strike in Newcastle's street
/** Dexter's ship: deck at SHIP_DECK; moored at the West Indies dock; the coal ship sails into Newcastle (story.ts) */
export const SHIP_DECK = WATER_Y + 1.25;
export const SHIP_TR = V(DOCK_TR.x + 7.5, 0, 18);
export const SHIP_NC = V(DOCK_NC.x + 7.5, 0, -181);       // where the coal ship ends up (alongside Newcastle's dock)

export type Room = { name: string; x0: number; x1: number; z0: number; z1: number; h: number };
export const ROOMS: Record<string, Room> = {
  study: { name: "study", x0: 10, x1: 18, z0: -42, z1: -34, h: 3.4 },
  count: { name: "count", x0: -21, x1: -6, z0: -48, z1: -34, h: 3.6 },
  mansion: { name: "mansion", x0: 26, x1: 37, z0: -46, z1: -36, h: 3.8 },
  parlour: { name: "parlour", x0: -38, x1: -27, z0: -46, z1: -36, h: 3.6 },
};
/** centre of a room's floor */
export const RC = (r: Room) => V((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
export const insideRoom = (p: THREE.Vector3): string | null => {
  for (const r of Object.values(ROOMS)) if (p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1 && p.y < r.h) return r.name;
  return null;
};
